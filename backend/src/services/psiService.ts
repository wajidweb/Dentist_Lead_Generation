import { GoogleAuth } from "google-auth-library";
import path from "path";

export interface PSIResult {
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
}

const NULL_RESULT: PSIResult = {
  performanceScore: null,
  seoScore: null,
  accessibilityScore: null,
  bestPracticesScore: null,
  lcp: null,
  cls: null,
  tbt: null,
};

// Lazy-init Google Auth (same service account as Places API)
let auth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (!auth) {
    auth = new GoogleAuth({
      keyFile: path.resolve(
        process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json"
      ),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    console.log("[PSI] Google Auth initialized via service account");
  }
  return auth;
}

async function getAccessToken(): Promise<string> {
  const client = await getAuth().getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) {
    throw new Error("Failed to obtain Google access token for PSI");
  }
  return tokenResponse.token;
}

async function callPSI(url: string): Promise<Response> {
  const params = new URLSearchParams({
    url,
    category: "performance",
    strategy: "mobile",
  });
  params.append("category", "seo");
  params.append("category", "accessibility");
  params.append("category", "best-practices");

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    // Use service account Bearer token for authentication (avoids 429 rate limits)
    const token = await getAccessToken();
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runPSI(url: string): Promise<PSIResult> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[PSI] Attempt ${attempt}/${MAX_RETRIES} for ${url}`);
      const response = await callPSI(url);

      if (response.status === 429) {
        const waitTime = attempt * 10000;
        console.warn(`[PSI] Rate limited (429) — waiting ${waitTime / 1000}s before retry...`);
        if (attempt < MAX_RETRIES) {
          await delay(waitTime);
          continue;
        }
        console.error(`[PSI] Still rate limited after ${MAX_RETRIES} attempts for ${url}`);
        return NULL_RESULT;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(`[PSI] API error: ${response.status} for ${url}`, body.substring(0, 200));
        return NULL_RESULT;
      }

      const data = await response.json();
      const lighthouse = data.lighthouseResult;
      if (!lighthouse) {
        console.warn(`[PSI] No lighthouseResult in response for ${url}`);
        return NULL_RESULT;
      }

      const cats = lighthouse.categories || {};
      const audits = lighthouse.audits || {};

      const result: PSIResult = {
        performanceScore: cats.performance?.score != null ? Math.round(cats.performance.score * 100) : null,
        seoScore: cats.seo?.score != null ? Math.round(cats.seo.score * 100) : null,
        accessibilityScore: cats.accessibility?.score != null ? Math.round(cats.accessibility.score * 100) : null,
        bestPracticesScore: cats["best-practices"]?.score != null ? Math.round(cats["best-practices"].score * 100) : null,
        lcp: audits["largest-contentful-paint"]?.numericValue ?? null,
        cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
        tbt: audits["total-blocking-time"]?.numericValue ?? null,
      };

      console.log(`[PSI] Done — perf=${result.performanceScore}, seo=${result.seoScore}, a11y=${result.accessibilityScore}`);
      return result;
    } catch (error) {
      console.error(`[PSI] Error on attempt ${attempt} for ${url}:`, error instanceof Error ? error.message : error);
      if (attempt < MAX_RETRIES) {
        await delay(attempt * 5000);
        continue;
      }
      return NULL_RESULT;
    }
  }

  return NULL_RESULT;
}
