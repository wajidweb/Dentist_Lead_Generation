/// <reference lib="dom" />
import puppeteer, { Browser, Page } from "puppeteer";
import { PuppeteerBlocker } from "@ghostery/adblocker-puppeteer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PuppeteerResult {
  desktopScreenshot: Buffer;
  pageText: string;
  loadTimeMs: number;
  isHttps: boolean;
  emails: string[];
  domChecks: {
    hasContactForm: boolean;
    hasPhoneLink: boolean;
    hasEmailLink: boolean;
    hasBookingWidget: boolean;
    hasGoogleMap: boolean;
    hasSocialLinks: boolean;
    hasSchemaMarkup: boolean;
    hasVideo: boolean;
    imageCount: number;
    navigationItemCount: number;
  };
}

// ---------------------------------------------------------------------------
// Browser singleton & lifecycle
// ---------------------------------------------------------------------------

let browser: Browser | null = null;
let jobCount = 0;

const BROWSER_LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-sync",
  "--disable-translate",
  "--metrics-recording-only",
  "--no-first-run",
  "--mute-audio",
];

const RESTART_EVERY_N_JOBS = 50;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: BROWSER_LAUNCH_ARGS,
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    try {
      await browser.close();
    } catch {
      // Browser may already be closed — ignore
    }
    browser = null;
  }
}

async function restartBrowser(): Promise<void> {
  await closeBrowser();
  browser = await puppeteer.launch({
    headless: true,
    args: BROWSER_LAUNCH_ARGS,
  });
}

// ---------------------------------------------------------------------------
// Adblocker singleton (lazy init)
// ---------------------------------------------------------------------------

let blockerPromise: Promise<PuppeteerBlocker> | null = null;

function getBlocker(): Promise<PuppeteerBlocker> {
  if (!blockerPromise) {
    blockerPromise = PuppeteerBlocker.fromPrebuiltFull(fetch).catch((err) => {
      console.error("Failed to load adblocker, continuing without it:", err);
      // Reset so the next call retries
      blockerPromise = null;
      // Return a minimal no-op blocker — PuppeteerBlocker.empty() is the fallback
      return PuppeteerBlocker.empty();
    });
  }
  return blockerPromise;
}

// ---------------------------------------------------------------------------
// Cookie-banner CSS
// ---------------------------------------------------------------------------

const COOKIE_BANNER_CSS = `
  [class*="cookie" i], [class*="consent" i], [class*="gdpr" i],
  [id*="cookie" i], [id*="consent" i], [id*="gdpr" i],
  .cookie-banner, .consent-banner, .cookie-notice,
  [class*="overlay" i][class*="cookie" i],
  .cc-window, .cc-banner, #cookie-law-info-bar,
  .cli-modal, .cli-bar-container {
    display: none !important;
    visibility: hidden !important;
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIMEOUT_MS = parseInt(process.env.PUPPETEER_TIMEOUT_MS || "20000", 10);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Scroll down the page in steps to trigger lazy-loaded images. */
async function scrollToTriggerLazyImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = 300;
    const delayMs = 100;
    const maxHeight = document.body.scrollHeight;

    for (let y = 0; y < maxHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, delayMs));
    }

    // Scroll back to top
    window.scrollTo(0, 0);
  });

  // Brief pause to let images start loading
  await delay(500);
}

/** Extract visible text from the page. */
async function extractPageText(page: Page): Promise<string> {
  const text = await page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    const removable = clone.querySelectorAll("script, style, noscript");
    removable.forEach((el) => el.remove());
    return (clone.innerText || "").trim();
  });

  // Truncate to 5000 characters
  return text.length > 5000 ? text.slice(0, 5000) : text;
}

/** Run DOM checks to evaluate the dental website's features. */
async function runDomChecks(page: Page): Promise<PuppeteerResult["domChecks"]> {
  return page.evaluate(() => ({
    hasContactForm: !!document.querySelector("form"),
    hasPhoneLink: !!document.querySelector('a[href^="tel:"]'),
    hasEmailLink: !!document.querySelector('a[href^="mailto:"]'),
    hasBookingWidget: !!document.querySelector(
      '[class*="book" i], [class*="appointment" i], [id*="book" i], ' +
        'iframe[src*="booking"], iframe[src*="schedule"], iframe[src*="acuity"], ' +
        'iframe[src*="calendly"], iframe[src*="zocdoc"], [class*="opencare" i]'
    ),
    hasGoogleMap: !!document.querySelector('iframe[src*="google.com/maps"]'),
    hasSocialLinks: !!document.querySelector(
      'a[href*="facebook.com"], a[href*="instagram.com"], a[href*="twitter.com"], a[href*="x.com"]'
    ),
    hasSchemaMarkup: !!document.querySelector(
      'script[type="application/ld+json"]'
    ),
    hasVideo: !!document.querySelector(
      'video, iframe[src*="youtube"], iframe[src*="vimeo"]'
    ),
    imageCount: document.querySelectorAll("img").length,
    navigationItemCount: document.querySelectorAll("nav a, header a").length,
  }));
}

// ---------------------------------------------------------------------------
// Email extraction
// ---------------------------------------------------------------------------

const JUNK_EMAIL_PATTERNS = [
  /^(noreply|no-reply|donotreply|do-not-reply|wordpress|woocommerce|webmaster)@/i,
  /^(example|test|sample|your|name|email|user)@/i,
  /@(example|test|sentry|wixpress|w3\.org)\./i,
  /\.(png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i,
];

function isJunkEmail(email: string): boolean {
  return JUNK_EMAIL_PATTERNS.some((p) => p.test(email));
}

/** Extract emails from a single page: mailto links + regex scan of HTML + JSON-LD */
async function extractEmailsFromPage(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found = new Set<string>();

    // 1. mailto: links
    document.querySelectorAll('a[href^="mailto:"]').forEach((el) => {
      const href = el.getAttribute("href") || "";
      const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
      if (email && email.includes("@")) found.add(email);
    });

    // 2. Regex scan of full HTML (catches obfuscated and text-only emails)
    const html = document.documentElement.innerHTML;
    // Decode common HTML entity for @
    const decoded = html.replace(/&#64;/g, "@").replace(/&commat;/g, "@");
    const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    let match;
    while ((match = regex.exec(decoded)) !== null) {
      found.add(match[0].toLowerCase());
    }

    // 3. JSON-LD structured data
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try {
        const data = JSON.parse(el.textContent || "");
        const check = (obj: any) => {
          if (!obj || typeof obj !== "object") return;
          if (typeof obj.email === "string" && obj.email.includes("@")) {
            found.add(obj.email.toLowerCase());
          }
          if (Array.isArray(obj)) obj.forEach(check);
          else Object.values(obj).forEach(check);
        };
        check(data);
      } catch {
        // invalid JSON-LD — skip
      }
    });

    return Array.from(found);
  });
}

/** Find contact/about page links from the current page */
async function findSubPageUrls(page: Page, baseUrl: string): Promise<string[]> {
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    return anchors.map((a) => a.getAttribute("href") || "");
  });

  const base = new URL(baseUrl);
  const subPages: string[] = [];
  const seen = new Set<string>();
  const patterns = [/\/contact/i, /\/about/i, /\/team/i, /\/staff/i, /\/our-team/i, /\/meet/i];

  for (const href of links) {
    try {
      const resolved = new URL(href, base);
      // Only same-origin links
      if (resolved.hostname !== base.hostname) continue;
      const path = resolved.pathname.toLowerCase();
      if (patterns.some((p) => p.test(path)) && !seen.has(resolved.pathname)) {
        seen.add(resolved.pathname);
        subPages.push(resolved.href);
      }
    } catch {
      // invalid URL — skip
    }
  }

  return subPages.slice(0, 3); // Max 3 sub-pages to avoid spending too long
}

/** Full email extraction: homepage + sub-pages */
async function scrapeEmails(page: Page, url: string): Promise<string[]> {
  const allEmails = new Set<string>();

  // Extract from current page (homepage)
  const homeEmails = await extractEmailsFromPage(page);
  homeEmails.forEach((e) => allEmails.add(e));

  // Find and visit sub-pages (contact, about, team)
  const subPageUrls = await findSubPageUrls(page, url);
  for (const subUrl of subPageUrls) {
    try {
      await page.goto(subUrl, { waitUntil: "networkidle2", timeout: 10000 });
      await delay(500);
      const subEmails = await extractEmailsFromPage(page);
      subEmails.forEach((e) => allEmails.add(e));
    } catch {
      // Sub-page failed — non-critical, continue
    }
  }

  // Filter out junk
  const cleaned = Array.from(allEmails).filter((e) => !isJunkEmail(e));

  // Sort: prefer branded domain emails over gmail/yahoo, then prefer info@/office@/contact@ first
  const domain = new URL(url).hostname.replace(/^www\./, "");
  cleaned.sort((a, b) => {
    const aDomain = a.includes(domain) ? 0 : 1;
    const bDomain = b.includes(domain) ? 0 : 1;
    if (aDomain !== bDomain) return aDomain - bDomain;
    // Prefer common practice prefixes
    const prefixOrder = ["info@", "office@", "contact@", "hello@", "reception@", "appointments@"];
    const aPrefix = prefixOrder.findIndex((p) => a.startsWith(p));
    const bPrefix = prefixOrder.findIndex((p) => b.startsWith(p));
    const aRank = aPrefix >= 0 ? aPrefix : 99;
    const bRank = bPrefix >= 0 ? bPrefix : 99;
    return aRank - bRank;
  });

  return cleaned;
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export async function analyzePage(url: string): Promise<PuppeteerResult> {
  console.log(`[Puppeteer] Opening browser page for ${url}`);
  const instance = await getBrowser();
  let page: Page | null = null;

  try {
    page = await instance.newPage();

    // Layer 1: adblocker
    let adblockerEnabled = false;
    try {
      const blocker = await getBlocker();
      await blocker.enableBlockingInPage(page);
      adblockerEnabled = true;
    } catch (err) {
      console.warn("[Puppeteer] Adblocker setup failed, continuing without it:", err);
    }

    // -----------------------------------------------------------------------
    // Desktop pass
    // -----------------------------------------------------------------------
    console.log(`[Puppeteer] Navigating to ${url} (desktop 1280x800)...`);
    await page.setViewport({ width: 1280, height: 800 });

    let loadTimeMs: number;
    const navStart = Date.now();

    try {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: TIMEOUT_MS,
      });
      loadTimeMs = Date.now() - navStart;
    } catch (navError: unknown) {
      const errMsg = navError instanceof Error ? navError.message : String(navError);
      const isTimeout = navError instanceof Error &&
        (navError.name === "TimeoutError" || errMsg.includes("timeout") || errMsg.includes("Timeout"));
      const isBlocked = errMsg.includes("ERR_BLOCKED_BY_CLIENT");

      if (isBlocked && adblockerEnabled) {
        // Adblocker blocked the main page — retry without it
        console.warn(`[Puppeteer] Adblocker blocked ${url} — retrying without adblocker`);
        await page.close();
        page = await instance.newPage(); // Fresh page, no adblocker
        await page.setViewport({ width: 1280, height: 800 });
        const retryStart = Date.now();
        try {
          await page.goto(url, { waitUntil: "networkidle2", timeout: TIMEOUT_MS });
          loadTimeMs = Date.now() - retryStart;
        } catch (retryError: unknown) {
          const retryMsg = retryError instanceof Error ? retryError.message : "";
          if (retryMsg.includes("timeout") || retryMsg.includes("Timeout")) {
            console.warn(`[Puppeteer] Retry also timed out for ${url}`);
            loadTimeMs = TIMEOUT_MS;
          } else {
            throw retryError;
          }
        }
      } else if (isTimeout) {
        console.warn(`[Puppeteer] Navigation timeout for ${url} — capturing partial render`);
        loadTimeMs = TIMEOUT_MS;
      } else {
        throw navError;
      }
    }

    // Check HTTPS from the final (possibly redirected) URL
    const finalUrl = page.url();
    const isHttps = finalUrl.startsWith("https://");

    // Layer 2: hide cookie banners via CSS
    try {
      await page.addStyleTag({ content: COOKIE_BANNER_CSS });
    } catch {
      // Page might not support addStyleTag in some edge cases — not critical
    }

    // Wait for cookie banners to appear, then they'll be hidden by CSS
    await delay(1000);

    // Scroll to trigger lazy images
    try {
      await scrollToTriggerLazyImages(page);
    } catch {
      // Scroll failure is non-critical
    }

    console.log(`[Puppeteer] Taking full-page desktop screenshot...`);
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const desktopCaptureHeight = Math.min(pageHeight, 7800); // Stay under Claude's 8000px limit
    if (pageHeight > 7800) {
      console.log(`[Puppeteer] Desktop height ${pageHeight}px capped to 7800px`);
    }

    const desktopScreenshot = (await page.screenshot({
      type: "jpeg",
      quality: 80,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: desktopCaptureHeight },
      encoding: "binary",
    })) as Buffer;
    console.log(`[Puppeteer] Screenshot size: ${(desktopScreenshot.length / 1024 / 1024).toFixed(2)}MB`);

    // No mobile screenshot — desktop full-page capture covers all content

    // -----------------------------------------------------------------------
    // Text extraction & DOM checks
    // -----------------------------------------------------------------------
    console.log(`[Puppeteer] Extracting text and running DOM checks...`);
    const pageText = await extractPageText(page);
    const domChecks = await runDomChecks(page);
    console.log(`[Puppeteer] Done — text=${pageText.length} chars, images=${domChecks.imageCount}, form=${domChecks.hasContactForm}, booking=${domChecks.hasBookingWidget}`);

    // Email scraping (homepage + contact/about sub-pages)
    console.log(`[Puppeteer] Scraping emails from homepage + sub-pages...`);
    let emails: string[] = [];
    try {
      emails = await scrapeEmails(page, url);
      console.log(`[Puppeteer] Emails found: ${emails.length > 0 ? emails.join(", ") : "none"}`);
    } catch (err) {
      console.warn("[Puppeteer] Email scraping failed (non-critical):", err);
    }

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    await page.close();
    page = null;

    // Lifecycle: restart browser every N jobs to prevent memory leaks
    jobCount++;
    if (jobCount >= RESTART_EVERY_N_JOBS) {
      jobCount = 0;
      // Fire-and-forget; next call to getBrowser() will create a fresh instance
      restartBrowser().catch((err) =>
        console.error("Browser restart failed:", err)
      );
    }

    return {
      desktopScreenshot,
      pageText,
      loadTimeMs,
      isHttps,
      emails,
      domChecks,
    };
  } catch (error) {
    // Attempt graceful page close
    if (page) {
      try {
        await page.close();
      } catch {
        // Page may already be destroyed
      }
      page = null;
    }

    // If the browser itself crashed, restart it for subsequent calls
    if (
      error instanceof Error &&
      (error.message.includes("Target closed") ||
        error.message.includes("Session closed") ||
        error.message.includes("Protocol error") ||
        error.message.includes("browser has disconnected"))
    ) {
      console.error(`Browser crash detected for ${url}, restarting browser`);
      await restartBrowser().catch(() => {});
    }

    throw error;
  } finally {
    // Belt-and-suspenders: ensure page is always closed
    if (page) {
      try {
        await page.close();
      } catch {
        // Swallow — already closed or browser gone
      }
    }
  }
}
