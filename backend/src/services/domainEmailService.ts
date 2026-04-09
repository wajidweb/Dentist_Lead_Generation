import dns from "dns";
import net from "net";

// ---------------------------------------------------------------------------
// Domain Email Finder — Free Hunter.io alternative
//
// Flow: Extract domain → MX lookup → Generate candidate emails →
//       SMTP verification (RCPT TO) → Return first verified email
// ---------------------------------------------------------------------------

/** Common email prefixes for dental/medical practices, ordered by likelihood */
const PRACTICE_PREFIXES = [
  "info",
  "office",
  "contact",
  "hello",
  "reception",
  "appointments",
  "frontdesk",
  "admin",
  "mail",
  "enquiries",
  "inquiries",
  "dental",
  "dentist",
  "smile",
  "team",
  "staff",
  "manager",
  "scheduling",
  "booking",
  "help",
  "support",
];

/** Domains where SMTP verification is unreliable (catch-all or blocked) */
const SKIP_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "live.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
];

// ---------------------------------------------------------------------------
// DNS helpers
// ---------------------------------------------------------------------------

/** Extract root domain from a website URL */
export function extractDomain(websiteUrl: string): string | null {
  try {
    const hostname = new URL(websiteUrl).hostname.replace(/^www\./, "");
    // Skip free email providers — they aren't the business domain
    if (SKIP_DOMAINS.includes(hostname)) return null;
    return hostname;
  } catch {
    return null;
  }
}

/** Resolve MX records for a domain. Returns the highest-priority mail server. */
function resolveMx(domain: string): Promise<string | null> {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, records) => {
      if (err || !records || records.length === 0) {
        resolve(null);
        return;
      }
      // Sort by priority (lower = higher priority)
      records.sort((a, b) => a.priority - b.priority);
      resolve(records[0].exchange);
    });
  });
}

// ---------------------------------------------------------------------------
// SMTP verification
// ---------------------------------------------------------------------------

interface SmtpResult {
  email: string;
  exists: boolean;
  catchAll: boolean;
}

/**
 * Verify if an email address exists via SMTP RCPT TO command.
 *
 * Connects to the MX server, sends HELO + MAIL FROM + RCPT TO.
 * - 250 response to RCPT TO → mailbox exists
 * - 550/553 → doesn't exist
 * - Timeout or other → inconclusive
 *
 * No actual email is sent — the connection is closed after RCPT TO.
 */
function verifyEmailSmtp(
  email: string,
  mxHost: string,
  timeoutMs: number = 7000
): Promise<SmtpResult> {
  return new Promise((resolve) => {
    const result: SmtpResult = { email, exists: false, catchAll: false };
    let step = 0;
    let finished = false;
    let dataBuffer = "";

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve(result);
      }
    }, timeoutMs);

    const socket = net.createConnection(25, mxHost);

    function finish(res: SmtpResult) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        socket.write("QUIT\r\n");
      } catch {
        // ignore
      }
      socket.destroy();
      resolve(res);
    }

    socket.setEncoding("utf-8");

    socket.on("data", (data: string) => {
      dataBuffer += data;

      // Wait for a complete response line (ends with \r\n)
      if (!dataBuffer.includes("\r\n")) return;

      const response = dataBuffer.trim();
      dataBuffer = "";
      const code = parseInt(response.substring(0, 3), 10);

      if (step === 0) {
        // Server greeting
        if (code === 220) {
          step = 1;
          socket.write("HELO verify.local\r\n");
        } else {
          finish(result);
        }
      } else if (step === 1) {
        // HELO response
        if (code === 250) {
          step = 2;
          socket.write("MAIL FROM:<verify@verify.local>\r\n");
        } else {
          finish(result);
        }
      } else if (step === 2) {
        // MAIL FROM response
        if (code === 250) {
          step = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else {
          finish(result);
        }
      } else if (step === 3) {
        // RCPT TO response — this is the answer
        if (code === 250) {
          result.exists = true;
        }
        // 550, 551, 552, 553 = doesn't exist — result.exists stays false
        finish(result);
      }
    });

    socket.on("error", () => finish(result));
    socket.on("timeout", () => finish(result));
  });
}

/**
 * Detect if a domain is catch-all (accepts any address).
 * Sends RCPT TO with a random gibberish address — if accepted, it's catch-all.
 */
async function isCatchAllDomain(domain: string, mxHost: string): Promise<boolean> {
  const randomUser = `xq7z9k${Date.now()}`;
  const result = await verifyEmailSmtp(`${randomUser}@${domain}`, mxHost, 5000);
  return result.exists;
}

// ---------------------------------------------------------------------------
// Main public API
// ---------------------------------------------------------------------------

export interface DomainEmailResult {
  email: string | null;
  method: "smtp-verified" | "catch-all-best-guess" | null;
  candidatesTested: number;
  domain: string;
}

/**
 * Find an email address for a domain by generating common patterns
 * and verifying via SMTP.
 *
 * @param websiteUrl - The lead's website URL
 * @returns The best email found, or null
 */
export async function findEmailByDomain(websiteUrl: string): Promise<DomainEmailResult> {
  const domain = extractDomain(websiteUrl);
  if (!domain) {
    return { email: null, method: null, candidatesTested: 0, domain: websiteUrl };
  }

  const tag = `[DomainEmail ${domain}]`;

  // Step 1: MX lookup — can this domain even receive email?
  const mxHost = await resolveMx(domain);
  if (!mxHost) {
    console.log(`${tag} No MX records found — domain can't receive email`);
    return { email: null, method: null, candidatesTested: 0, domain };
  }
  console.log(`${tag} MX server: ${mxHost}`);

  // Step 2: Check if it's a catch-all domain
  const catchAll = await isCatchAllDomain(domain, mxHost);
  if (catchAll) {
    // Catch-all domains accept everything, so SMTP can't distinguish real from fake.
    // Return the most likely prefix as a best guess.
    const bestGuess = `info@${domain}`;
    console.log(`${tag} Catch-all domain detected — best guess: ${bestGuess}`);
    return { email: bestGuess, method: "catch-all-best-guess", candidatesTested: 1, domain };
  }

  // Step 3: Generate candidates and verify via SMTP
  const candidates = PRACTICE_PREFIXES.map((prefix) => `${prefix}@${domain}`);
  let tested = 0;

  for (const candidate of candidates) {
    tested++;
    try {
      const result = await verifyEmailSmtp(candidate, mxHost);
      if (result.exists) {
        console.log(`${tag} VERIFIED: ${candidate} (tested ${tested} candidates)`);
        return { email: candidate, method: "smtp-verified", candidatesTested: tested, domain };
      }
    } catch {
      // SMTP connection failed for this attempt — continue
    }
  }

  console.log(`${tag} No email found after testing ${tested} candidates`);
  return { email: null, method: null, candidatesTested: tested, domain };
}
