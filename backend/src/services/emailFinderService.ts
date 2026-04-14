import { findEmailsByDomain } from "./harvesterService";
import { findEmailByDomain, extractDomain } from "./domainEmailService";
import { domainSearch } from "./hunterService";
import type { EmailProvider } from "../jobs/analysisQueue";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailFinderResult {
  email: string | null;
  source: "scrape" | "harvester" | "domain-search" | "hunter" | null;
  verified: boolean;
  allEmailsFound: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  // Must match basic email format and start with a letter or digit
  return /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
}

function filterValidEmails(emails: string[]): string[] {
  return emails.filter(isValidEmail);
}

/** Generic prefixes that indicate a shared inbox, not a person */
const GENERIC_PREFIXES = new Set([
  "info", "contact", "hello", "office", "admin", "support", "help",
  "reception", "appointments", "billing", "team", "sales", "marketing",
  "general", "enquiries", "inquiries", "mail", "noreply", "no-reply",
  "webmaster", "postmaster", "careers", "jobs", "hr", "press", "media",
]);

/**
 * Pick the best email from a list — personal names first, generic as fallback.
 * e.g. "john@dentist.com" wins over "info@dentist.com"
 */
function pickBestEmail(emails: string[]): string {
  const personal = emails.find((e) => {
    const prefix = e.split("@")[0].toLowerCase();
    return !GENERIC_PREFIXES.has(prefix);
  });
  return personal ?? emails[0];
}

// ---------------------------------------------------------------------------
// Hunter email finding
// ---------------------------------------------------------------------------

async function findViaHunter(domain: string): Promise<string[]> {
  try {
    const result = await domainSearch(domain);
    if (result.emails && result.emails.length > 0) {
      return result.emails.map((e) => e.value);
    }
    return [];
  } catch (err) {
    console.warn(
      `[EmailFinder] Hunter lookup failed for ${domain}:`,
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main orchestration function
// ---------------------------------------------------------------------------

/**
 * Find the best email for a lead using a 3-method priority chain.
 *
 * When provider = "harvester":
 *   1. theHarvester OSINT → 2. Scraped emails → 3. Domain MX/SMTP
 *
 * When provider = "hunter":
 *   1. Hunter.io API → 2. Scraped emails → 3. Domain MX/SMTP
 *
 * Never throws — returns null email on all errors so the pipeline continues.
 */
export async function findEmail(
  websiteUrl: string,
  scrapedEmails: string[],
  provider: EmailProvider = "harvester"
): Promise<EmailFinderResult> {
  const domain = extractDomain(websiteUrl);

  // Step 1: Primary provider (harvester or hunter)
  if (domain) {
    if (provider === "harvester") {
      try {
        const harvesterEmails = await findEmailsByDomain(domain);
        const validHarvester = filterValidEmails(harvesterEmails);
        if (validHarvester.length > 0) {
          const best = pickBestEmail(validHarvester);
          console.log(
            `[EmailFinder] Harvester found ${validHarvester.length} emails for ${domain}, picked: ${best}`
          );
          return {
            email: best,
            source: "harvester",
            verified: false,
            allEmailsFound: validHarvester,
          };
        }
      } catch (err) {
        console.warn(
          `[EmailFinder] Harvester lookup failed for ${domain}:`,
          err instanceof Error ? err.message : err
        );
      }
    } else {
      // Hunter.io
      try {
        const hunterEmails = await findViaHunter(domain);
        const validHunter = filterValidEmails(hunterEmails);
        if (validHunter.length > 0) {
          const best = pickBestEmail(validHunter);
          console.log(
            `[EmailFinder] Hunter found ${validHunter.length} emails for ${domain}, picked: ${best}`
          );
          return {
            email: best,
            source: "hunter",
            verified: false,
            allEmailsFound: validHunter,
          };
        }
      } catch (err) {
        console.warn(
          `[EmailFinder] Hunter lookup failed for ${domain}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  // Step 2: Scraped emails fallback
  const validScraped = filterValidEmails(scrapedEmails);
  if (validScraped.length > 0) {
    const best = pickBestEmail(validScraped);
    console.log(`[EmailFinder] Using scraped email (${validScraped.length} found), picked: ${best}`);
    return {
      email: best,
      source: "scrape",
      verified: false,
      allEmailsFound: validScraped,
    };
  }

  // Step 3: MX/SMTP domain-search last resort
  try {
    const domainResult = await findEmailByDomain(websiteUrl);
    if (domainResult.email) {
      console.log(
        `[EmailFinder] Domain-search found email: ${domainResult.email} (${domainResult.method})`
      );
      const verified = domainResult.method === "smtp-verified";
      return {
        email: domainResult.email,
        source: "domain-search",
        verified,
        allEmailsFound: [domainResult.email],
      };
    }
  } catch (err) {
    console.warn(
      `[EmailFinder] Domain-search failed for ${websiteUrl}:`,
      err instanceof Error ? err.message : err
    );
  }

  // Nothing found
  return { email: null, source: null, verified: false, allEmailsFound: [] };
}
