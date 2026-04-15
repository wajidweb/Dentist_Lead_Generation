import HarvesterCache from "../models/HarvesterCache";

// ---------------------------------------------------------------------------
// Configuration — read from environment at module load time
// ---------------------------------------------------------------------------

function getConfig() {
  return {
    apiUrl: process.env.HARVESTER_API_URL ?? "http://localhost:5000",
    enabled: (process.env.HARVESTER_ENABLED ?? "false") === "true",
    timeoutMs: Number(process.env.HARVESTER_TIMEOUT_MS ?? "60000"),
    cacheTtlDays: Number(process.env.HARVESTER_CACHE_TTL_DAYS ?? "7"),
  };
}

// In-memory config (can be overridden at runtime via updateConfig)
let runtimeConfig: ReturnType<typeof getConfig> | null = null;

export function getHarvesterConfig() {
  if (!runtimeConfig) {
    runtimeConfig = getConfig();
  }
  return runtimeConfig;
}

export function updateHarvesterConfig(
  patch: Partial<ReturnType<typeof getConfig>>
) {
  runtimeConfig = { ...getHarvesterConfig(), ...patch };
}

// ---------------------------------------------------------------------------
// In-flight deduplication — avoid parallel requests to the same domain
// ---------------------------------------------------------------------------

const inFlight = new Map<string, Promise<string[]>>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface HarvesterHealthResult {
  available: boolean;
  version?: string;
}

/**
 * Check whether theHarvester REST API is reachable.
 * Never throws — returns { available: false } on any error.
 */
export async function checkHealth(): Promise<HarvesterHealthResult> {
  const { apiUrl, timeoutMs } = getHarvesterConfig();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${apiUrl}/health`, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return { available: false };
    const body = (await res.json()) as Record<string, unknown>;
    return {
      available: true,
      version: typeof body.version === "string" ? body.version : undefined,
    };
  } catch {
    return { available: false };
  }
}

/**
 * Run theHarvester against a domain and return any emails discovered.
 *
 * Priority:
 *   1. Return cached result if present and not expired
 *   2. Deduplicate concurrent requests for the same domain
 *   3. Query theHarvester REST API
 *   4. Persist result to cache
 *
 * Never throws — returns [] on any error or when the tool is disabled.
 */
export async function findEmailsByDomain(domain: string): Promise<string[]> {
  const cfg = getHarvesterConfig();

  if (!cfg.enabled) {
    return [];
  }

  // 1. Cache hit
  try {
    const cached = await HarvesterCache.findOne({ domain });
    if (cached) {
      console.log(`[Harvester] Cache hit for ${domain} — ${cached.emails.length} emails`);
      return cached.emails;
    }
  } catch (err) {
    console.warn(`[Harvester] Cache read error for ${domain}:`, err);
  }

  // 2. Deduplicate in-flight requests
  const existing = inFlight.get(domain);
  if (existing) {
    console.log(`[Harvester] Deduplicating in-flight request for ${domain}`);
    return existing;
  }

  const promise = queryHarvester(domain, cfg);
  inFlight.set(domain, promise);

  try {
    const emails = await promise;
    return emails;
  } finally {
    inFlight.delete(domain);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function queryHarvester(
  domain: string,
  cfg: ReturnType<typeof getHarvesterConfig>
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

    // theHarvester REST API uses /query with repeated source= params
    const sources = [
      "crtsh", "rapiddns", "dnsdumpster", "hackertarget",
      "hunter", "tomba", "duckduckgo", "yahoo", "baidu",
      "urlscan", "otx", "certspotter", "robtex",
    ];
    const sourceParams = sources.map((s) => `source=${s}`).join("&");
    const url = `${cfg.apiUrl}/query?domain=${encodeURIComponent(domain)}&${sourceParams}&limit=500`;
    console.log(`[Harvester] Querying ${domain} via ${sources.length} sources`);

    const res = await fetch(url, { signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    );

    if (!res.ok) {
      console.warn(`[Harvester] API returned ${res.status} for ${domain}`);
      return [];
    }

    const body = (await res.json()) as Record<string, unknown>;
    const emails = parseEmails(body);
    const hosts = parseStringArray(body.hosts);
    const bodySources = parseStringArray(body.sources);

    console.log(
      `[Harvester] ${domain} — found ${emails.length} emails, ${hosts.length} hosts`
    );

    // Persist to cache
    await persistCache(domain, emails, hosts, bodySources, cfg.cacheTtlDays);

    return emails;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[Harvester] Request timed out for ${domain}`);
    } else if (isConnectionRefused(err)) {
      console.warn(
        `[Harvester] Service unreachable at ${cfg.apiUrl} (ECONNREFUSED) — skipping ${domain}. ` +
          `Start theHarvester REST API or set HARVESTER_ENABLED=false to suppress this warning.`
      );
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Harvester] Request failed for ${domain}: ${msg}`);
    }
    return [];
  }
}

/** Walk Error.cause chain to detect the node:net ECONNREFUSED inside `fetch failed`. */
function isConnectionRefused(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; i < 5 && cur; i++) {
    if (cur && typeof cur === "object") {
      const obj = cur as { code?: string; errors?: unknown[]; cause?: unknown };
      if (obj.code === "ECONNREFUSED") return true;
      if (Array.isArray(obj.errors) && obj.errors.some((e) => (e as { code?: string })?.code === "ECONNREFUSED")) {
        return true;
      }
      cur = obj.cause;
    } else {
      break;
    }
  }
  return false;
}

function parseEmails(body: Record<string, unknown>): string[] {
  const raw = body.emails ?? body.email_addresses ?? [];
  return parseStringArray(raw).filter((e) => e.includes("@"));
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

async function persistCache(
  domain: string,
  emails: string[],
  hosts: string[],
  sources: string[],
  cacheTtlDays: number
): Promise<void> {
  try {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + cacheTtlDays * 24 * 60 * 60 * 1000
    );
    await HarvesterCache.findOneAndUpdate(
      { domain },
      { domain, emails, hosts, sources, queriedAt: now, expiresAt },
      { upsert: true, returnDocument: "after" }
    );
    console.log(`[Harvester] Cached results for ${domain} (TTL: ${cacheTtlDays} days)`);
  } catch (err) {
    console.warn(`[Harvester] Failed to write cache for ${domain}:`, err);
  }
}
