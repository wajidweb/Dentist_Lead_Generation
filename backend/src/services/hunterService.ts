import https from "https";
import { IDecisionMaker } from "../models/Lead";

const HUNTER_BASE_URL = "https://api.hunter.io";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 4;
const QUEUE_DELAY_MS = 6100;
const DOMAIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Typed errors — controller maps these to HTTP status codes
// ---------------------------------------------------------------------------

export class HunterAuthError extends Error {
  constructor() {
    super("Hunter.io API key invalid or missing");
    this.name = "HunterAuthError";
  }
}

export class HunterQuotaError extends Error {
  constructor() {
    super("Monthly quota exhausted");
    this.name = "HunterQuotaError";
  }
}

export class HunterRateLimitError extends Error {
  retryAfterMs?: number;
  constructor(retryAfterMs?: number) {
    super("Rate limit reached. Please try again shortly.");
    this.name = "HunterRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

// ---------------------------------------------------------------------------
// Env key — lazy read so .env is loaded before access
// ---------------------------------------------------------------------------

function getApiKey(): string {
  return process.env.HUNTER_API_KEY ?? "";
}

// ---------------------------------------------------------------------------
// Domain cache — 24h TTL, keyed by domain
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: HunterDomainSearchResult;
  timestamp: number;
}

const domainCache = new Map<string, CacheEntry>();

function getCached(domain: string): HunterDomainSearchResult | null {
  const entry = domainCache.get(domain);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DOMAIN_CACHE_TTL_MS) {
    domainCache.delete(domain);
    return null;
  }
  return entry.data;
}

function setCache(domain: string, data: HunterDomainSearchResult): void {
  domainCache.set(domain, { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Request queue — 6100ms between calls to respect free-tier 10 req/min cap (+100ms margin)
// ---------------------------------------------------------------------------

let lastRequestAt = 0;

async function waitForQueue(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < QUEUE_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, QUEUE_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

// ---------------------------------------------------------------------------
// Low-level HTTP GET helper
// ---------------------------------------------------------------------------

interface HunterErrorBody {
  errors?: Array<{ details: string; code: number }>;
}

function httpsGet(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: "api.hunter.io",
      path,
      method: "GET",
      headers: {
        // Browser-realistic headers. Without these, Cloudflare's bot protection
        // on api.hunter.io flags requests from datacenter IPs (DO/AWS/Hetzner)
        // and returns a 403 "Just a moment..." managed challenge page instead
        // of the JSON API response. Locally this works because your laptop IP
        // isn't in the datacenter reputation buckets.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        // Deliberately NOT requesting gzip/deflate — httpsGet doesn't decode
        // compressed bodies, so identity responses are required for JSON.parse.
        "Accept-Encoding": "identity",
      },
      timeout: REQUEST_TIMEOUT_MS,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on("end", () => {
        const status = res.statusCode ?? 0;

        if (status === 401) {
          reject(new HunterAuthError());
          return;
        }
        if (status === 402) {
          reject(new HunterQuotaError());
          return;
        }
        if (status === 429) {
          // Parse Retry-After header (value is in seconds)
          const retryAfterHeader = res.headers["retry-after"];
          const retryAfterSec = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : NaN;
          const retryAfterMs = !isNaN(retryAfterSec) ? retryAfterSec * 1000 : undefined;

          // Log raw body so we can diagnose quota vs rate-limit
          console.warn(`[Hunter] GET ${path.split("?")[0]} → 429`, data);

          // Check if this 429 actually means monthly quota exhausted
          let parsed429: HunterErrorBody = {};
          try {
            parsed429 = JSON.parse(data) as HunterErrorBody;
          } catch {
            // ignore
          }
          const detail429 = (parsed429.errors?.[0]?.details ?? "").toLowerCase();
          if (
            detail429.includes("usage") ||
            detail429.includes("quota") ||
            detail429.includes("exhausted")
          ) {
            reject(new HunterQuotaError());
            return;
          }

          reject(new HunterRateLimitError(retryAfterMs));
          return;
        }

        if (status >= 400) {
          // Detect Cloudflare-edge block (api.hunter.io is behind CF). The
          // edge returns an HTML challenge page instead of Hunter's JSON
          // error envelope — log a short diagnostic instead of dumping 3KB
          // of HTML into the logs.
          const looksLikeCfChallenge =
            /Just a moment|cf-chl|_cf_chl_opt|Enable JavaScript and cookies/i.test(data);
          if (looksLikeCfChallenge) {
            const ray = /cRay:\s*'([^']+)'/i.exec(data)?.[1];
            console.error(
              `[Hunter] GET ${path.split("?")[0]} → ${status} — Cloudflare edge challenge` +
                (ray ? ` (Ray ID: ${ray})` : "") +
                `. Your server IP is being flagged by CF's bot protection. ` +
                `Contact Hunter.io support (support@hunter.io) with the Ray ID to allowlist the IP.`
            );
            reject(
              new Error(
                `Hunter API blocked by Cloudflare (${status}${ray ? `, Ray ${ray}` : ""})`
              )
            );
            return;
          }

          let parsed: HunterErrorBody = {};
          try {
            parsed = JSON.parse(data) as HunterErrorBody;
          } catch {
            // ignore
          }
          const detail = parsed.errors?.[0]?.details ?? data.slice(0, 300);
          console.error(`[Hunter] GET ${path.split("?")[0]} → ${status}`, detail);
          reject(new Error(`Hunter API error ${status}: ${detail}`));
          return;
        }

        if (data.trim() === "") {
          resolve(null);
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Hunter API request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

async function hunterRequest(endpoint: string, params: Record<string, string>): Promise<unknown> {
  const query = new URLSearchParams({ ...params, api_key: getApiKey() });
  const path = `/v2/${endpoint}?${query.toString()}`;

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await waitForQueue();
      return await httpsGet(path);
    } catch (err) {
      if (err instanceof HunterRateLimitError) {
        lastError = err;
        const backoffMs = Math.pow(2, attempt) * 1000;
        const delayMs = Math.min(err.retryAfterMs ?? backoffMs, 30_000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Hunter API response shapes
// ---------------------------------------------------------------------------

export interface HunterEmailResult {
  value: string;
  type?: "personal" | "generic";
  confidence?: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  linkedin?: string;
  verified?: boolean;
  verification?: {
    date: string | null;
    status: string | null;
    result: string | null;
  };
}

export interface HunterDomainSearchResult {
  emails: HunterEmailResult[];
  domain: string;
  organization?: string;
}

export interface HunterEmailFinderResult {
  email: string | null;
  score?: number;
  first_name?: string;
  last_name?: string;
  position?: string;
}

export interface HunterVerifyResult {
  email: string;
  result: "deliverable" | "risky" | "undeliverable" | "unknown";
  score?: number;
}

export interface HunterAccountInfo {
  plan_name?: string;
  calls?: {
    used: number;
    available: number;
  };
  requests?: {
    searches?: { used: number; available: number };
    verifications?: { used: number; available: number };
  };
}

// ---------------------------------------------------------------------------
// Transform — Hunter result → IDecisionMaker
// ---------------------------------------------------------------------------

export function mapHunterResultToDecisionMaker(
  raw: HunterEmailResult,
  source: IDecisionMaker["source"] = "hunter-domain"
): IDecisionMaker {
  const verStatus = raw.verification?.result;
  let verificationStatus: IDecisionMaker["verificationStatus"] = "unknown";
  if (verStatus === "deliverable" || verStatus === "risky" || verStatus === "undeliverable") {
    verificationStatus = verStatus;
  }

  return {
    firstName: raw.first_name ?? "",
    lastName: raw.last_name ?? "",
    email: raw.value,
    position: raw.position ?? null,
    confidence: raw.confidence ?? 0,
    source,
    verified: raw.verified ?? false,
    verificationStatus,
    verifiedAt: raw.verification?.date ? new Date(raw.verification.date) : null,
    discoveredAt: new Date(),
    isGeneric: raw.type === "generic",
  };
}

// ---------------------------------------------------------------------------
// Public API calls
// ---------------------------------------------------------------------------

export async function domainSearch(domain: string): Promise<HunterDomainSearchResult> {
  const cached = getCached(domain);
  if (cached) {
    console.log(`[Hunter] Cache hit for domain: ${domain}`);
    return cached;
  }

  const response = await hunterRequest("domain-search", { domain, limit: "10" });
  const body = response as { data: HunterDomainSearchResult };
  const result = body.data;

  setCache(domain, result);
  return result;
}

export async function emailFinder(
  domain: string,
  firstName: string,
  lastName: string
): Promise<HunterEmailFinderResult> {
  const response = await hunterRequest("email-finder", {
    domain,
    first_name: firstName,
    last_name: lastName,
  });
  const body = response as { data: HunterEmailFinderResult };
  return body.data;
}

export async function emailVerifier(email: string): Promise<HunterVerifyResult> {
  const response = await hunterRequest("email-verifier", { email });
  const body = response as { data: HunterVerifyResult };
  return body.data;
}

export async function getAccountInfo(): Promise<HunterAccountInfo> {
  const response = await hunterRequest("account", {});
  const body = response as { data: HunterAccountInfo };
  return body.data;
}
