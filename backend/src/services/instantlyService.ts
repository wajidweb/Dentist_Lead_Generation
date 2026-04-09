import https from "https";

const INSTANTLY_BASE_URL = "https://api.instantly.ai/api/v2";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

// Lazy getter — ensures .env is loaded before reading the key
function getApiKey(): string {
  return process.env.INSTANTLY_API_KEY ?? "";
}

interface InstantlyErrorBody {
  error?: string;
  message?: string;
  detail?: string;
}

export interface EmailSequenceStep {
  subject: string;
  body: string;
  delay_days: number;
}

interface CreateCampaignResponse {
  id: string;
  [key: string]: unknown;
}

interface AddLeadResponse {
  id: string;
  [key: string]: unknown;
}

interface AddLeadsBulkResponse {
  added: number;
  [key: string]: unknown;
}

interface RegisterWebhookResponse {
  id: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Low-level HTTP helper — V2 API with Bearer token auth
// ---------------------------------------------------------------------------

function httpsRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    const payload = body !== undefined ? JSON.stringify(body) : undefined;

    // Bearer auth header handles authentication for all methods
    const fullPath = `/api/v2${path}`;

    const options: https.RequestOptions = {
      hostname: "api.instantly.ai",
      path: fullPath,
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
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

        if (status === 429) {
          reject(new RateLimitError(status));
          return;
        }

        if (status >= 400) {
          let parsed: InstantlyErrorBody = {};
          try {
            parsed = JSON.parse(data) as InstantlyErrorBody;
          } catch {
            // ignore parse error
          }
          console.error(`[Instantly] ${method} ${fullPath} → ${status}`, data);
          reject(
            new Error(
              `Instantly API error ${status}: ${parsed.error ?? parsed.message ?? parsed.detail ?? data}`
            )
          );
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
      reject(new Error(`Instantly API request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });

    req.on("error", (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

class RateLimitError extends Error {
  constructor(public readonly status: number) {
    super(`Rate limited (${status})`);
    this.name = "RateLimitError";
  }
}

async function requestWithRetry(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await httpsRequest(method, path, body);
    } catch (err) {
      if (err instanceof RateLimitError) {
        lastError = err;
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Campaign Management — V2 endpoints
// ---------------------------------------------------------------------------

export async function createCampaign(
  name: string,
  sendingEmail: string,
  sequences: EmailSequenceStep[]
): Promise<CreateCampaignResponse> {
  const result = await requestWithRetry("POST", "/campaigns", {
    name,
    email_list: [sendingEmail],
    campaign_schedule: {
      schedules: [
        {
          name: "Always Active",
          days: {
            "0": true,
            "1": true,
            "2": true,
            "3": true,
            "4": true,
            "5": true,
            "6": true,
          },
          timezone: "America/Chicago",
          timing: {
            from: "00:00",
            to: "23:59",
          },
        },
      ],
    },
    sequences: [
      {
        steps: sequences.map((step, idx) => ({
          step: idx + 1,
          type: "email",
          delay: step.delay_days,
          variants: [
            {
              subject: step.subject,
              body: step.body,
            },
          ],
        })),
      },
    ],
  });
  return result as CreateCampaignResponse;
}

export async function activateCampaign(campaignId: string): Promise<void> {
  await requestWithRetry("POST", `/campaigns/${campaignId}/activate`, {});
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  console.log("[Instantly] Deleting campaign:", campaignId);
  // V2: DELETE /campaigns/:id — body must be null
  const result = await requestWithRetry("DELETE", `/campaigns/${campaignId}`);
  console.log("[Instantly] Delete response:", JSON.stringify(result));
}

// ---------------------------------------------------------------------------
// Lead Management — V2 endpoints
// ---------------------------------------------------------------------------

export async function addLeadToCampaign(
  campaignId: string,
  email: string,
  variables: Record<string, string>
): Promise<AddLeadResponse> {
  // V2: custom variables go as top-level fields with lt_ prefix or in custom_variables
  const payload = {
    campaign: campaignId,
    email,
    first_name: variables.sender_name ?? "",
    company_name: variables.business_name ?? "",
    website: variables.website_url ?? "",
    personalization: variables.one_line_summary ?? "",
    custom_variables: variables,
  };
  console.log("[Instantly] Adding lead to campaign:", JSON.stringify(payload));
  const result = await requestWithRetry("POST", "/leads", payload);
  console.log("[Instantly] Add lead response:", JSON.stringify(result));
  return (result ?? { id: email }) as AddLeadResponse;
}

export async function addLeadsBulk(
  campaignId: string,
  leads: Array<{ email: string; variables: Record<string, string> }>
): Promise<AddLeadsBulkResponse> {
  const result = await requestWithRetry("POST", "/leads/batch", {
    campaign_id: campaignId,
    leads: leads.map((l) => ({
      email: l.email,
      personalization_fields: l.variables,
    })),
  });
  return (result ?? { added: leads.length }) as AddLeadsBulkResponse;
}

// ---------------------------------------------------------------------------
// Analytics — V2 endpoints
// ---------------------------------------------------------------------------

export async function getCampaignAnalytics(
  campaignId: string
): Promise<unknown> {
  return await requestWithRetry("GET", `/campaigns/${campaignId}/analytics`);
}

// ---------------------------------------------------------------------------
// Webhooks — V2 endpoints
// ---------------------------------------------------------------------------

export async function registerWebhook(
  url: string,
  eventTypes: string[]
): Promise<RegisterWebhookResponse> {
  const result = await requestWithRetry("POST", "/webhooks", {
    url,
    event_types: eventTypes,
  });
  return (result ?? { id: "webhook" }) as RegisterWebhookResponse;
}

// ---------------------------------------------------------------------------
// Email Account Management — V2 endpoints
// ---------------------------------------------------------------------------

export interface InstantlyEmailAccount {
  email: string;
  first_name?: string;
  last_name?: string;
  status?: number;
  warmup_status?: number;
  [key: string]: unknown;
}

export async function listEmailAccounts(): Promise<InstantlyEmailAccount[]> {
  const result = await requestWithRetry("GET", "/accounts");
  if (Array.isArray(result)) return result as InstantlyEmailAccount[];
  // V2 may return { items: [...] } or { data: [...] }
  const obj = result as Record<string, unknown> | null;
  if (obj && Array.isArray(obj.items)) return obj.items as InstantlyEmailAccount[];
  if (obj && Array.isArray(obj.data)) return obj.data as InstantlyEmailAccount[];
  return [];
}

export async function getEmailAccountStatus(
  email: string
): Promise<InstantlyEmailAccount | null> {
  const result = await requestWithRetry(
    "GET",
    `/accounts/${encodeURIComponent(email)}`
  );
  return (result as InstantlyEmailAccount) ?? null;
}

// ---------------------------------------------------------------------------
// Campaign Management (extended) — V2 endpoints
// ---------------------------------------------------------------------------

// Update campaign schedule (days, timing, timezone)
export async function updateCampaignSchedule(
  campaignId: string,
  schedule: object
): Promise<unknown> {
  console.log("[Instantly] Updating schedule for campaign:", campaignId);
  return await requestWithRetry("PATCH", `/campaigns/${campaignId}`, {
    campaign_schedule: schedule,
  });
}

// Update campaign options (open tracking, link tracking, etc.)
export async function updateCampaignOptions(
  campaignId: string,
  options: Record<string, unknown>
): Promise<unknown> {
  console.log("[Instantly] Updating campaign options:", campaignId, options);
  return await requestWithRetry("PATCH", `/campaigns/${campaignId}`, options);
}

// Pause campaign
export async function pauseCampaign(campaignId: string): Promise<void> {
  console.log("[Instantly] Pausing campaign:", campaignId);
  await requestWithRetry("POST", `/campaigns/${campaignId}/pause`, {});
}

// activateCampaign already exported above — reuse it for resume

// Get full campaign details from Instantly (includes schedule, sequences, status)
export async function getCampaignDetails(
  campaignId: string
): Promise<unknown> {
  console.log("[Instantly] Fetching campaign details:", campaignId);
  return await requestWithRetry("GET", `/campaigns/${campaignId}`);
}

// Get all leads for a campaign with their Instantly statuses
export async function getCampaignLeads(
  campaignId: string,
  limit = 100,
  skip = 0
): Promise<unknown> {
  console.log("[Instantly] Fetching campaign leads:", campaignId, { limit, skip });
  return await requestWithRetry(
    "GET",
    `/campaigns/${campaignId}/leads?limit=${limit}&skip=${skip}`
  );
}

// Get single lead status from Instantly
export async function getLeadStatus(
  leadEmail: string,
  campaignId: string
): Promise<unknown> {
  console.log("[Instantly] Fetching lead status:", leadEmail, campaignId);
  return await requestWithRetry(
    "GET",
    `/leads?campaign_id=${campaignId}&email=${encodeURIComponent(leadEmail)}`
  );
}

// Update campaign email sequences
export async function updateCampaignSequences(
  campaignId: string,
  sequences: object
): Promise<unknown> {
  console.log("[Instantly] Updating sequences for campaign:", campaignId);
  return await requestWithRetry("PATCH", `/campaigns/${campaignId}`, {
    sequences,
  });
}

// Get campaign analytics summary
export async function getCampaignSummary(
  campaignId: string
): Promise<unknown> {
  console.log("[Instantly] Fetching campaign analytics:", campaignId);
  // V2: GET /campaigns/analytics?id=<campaignId>
  const result = await requestWithRetry(
    "GET",
    `/campaigns/analytics?id=${campaignId}`
  );
  console.log("[Instantly] Analytics response:", JSON.stringify(result));
  return result;
}

// ---------------------------------------------------------------------------
// Unibox / Email Management — V2 endpoints
// ---------------------------------------------------------------------------

export interface InstantlyEmail {
  id: string;
  timestamp_created?: string;
  timestamp_email?: string;
  from_address?: string;
  to_address?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  is_read?: boolean;
  is_reply?: boolean;
  reply_to_uuid?: string;
  campaign_id?: string;
  lead_email?: string;
  email_type?: string;
  [key: string]: unknown;
}

// List emails (Unibox) with optional filters
export async function listEmails(params: {
  campaign_id?: string;
  is_read?: boolean;
  email_type?: string; // "received" | "sent" | "others"
  folder?: string;     // "primary" | "others" — passed through to Instantly
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<unknown> {
  const query = new URLSearchParams();
  if (params.campaign_id) query.set("campaign_id", params.campaign_id);
  // Instantly uses is_unread (inverted from is_read)
  if (typeof params.is_read === "boolean") query.set("is_unread", String(!params.is_read));
  if (params.email_type) query.set("email_type", params.email_type);
  if (params.folder) query.set("folder", params.folder);
  if (params.search) query.set("search", params.search);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.skip !== undefined) query.set("skip", String(params.skip));
  const qs = query.toString();
  return await requestWithRetry("GET", `/emails${qs ? `?${qs}` : ""}`);
}

// Get single email by ID
export async function getEmail(emailId: string): Promise<unknown> {
  return await requestWithRetry("GET", `/emails/${emailId}`);
}

// Get unread email count
export async function getUnreadCount(): Promise<number> {
  const result = await requestWithRetry("GET", "/emails?is_unread=true&limit=1");
  if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;
    return Number(obj.total ?? obj.count ?? obj.unread_count ?? 0);
  }
  if (Array.isArray(result)) return result.length;
  return 0;
}

// Reply to an email
export async function replyToEmail(params: {
  reply_to_uuid: string;
  from_email: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<unknown> {
  const payload = {
    reply_to_uuid: params.reply_to_uuid,
    eaccount: params.from_email,
    subject: params.subject,
    body: { text: params.body, html: params.body },
    ...(params.cc ? { cc_address_email_list: params.cc } : {}),
    ...(params.bcc ? { bcc_address_email_list: params.bcc } : {}),
  };
  console.log("[Instantly] Sending reply:", JSON.stringify(payload).slice(0, 500));
  return await requestWithRetry("POST", "/emails/reply", payload);
}

// Mark email as read — Instantly V2 PATCH /emails/:id returns 500,
// so we skip the API call and track read status locally only
export async function markEmailRead(_emailId: string): Promise<unknown> {
  return { success: true };
}

// Re-export base URL for reference
export { INSTANTLY_BASE_URL };
