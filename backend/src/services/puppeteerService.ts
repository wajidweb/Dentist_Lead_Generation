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
  cloudflareBlocked: boolean;
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
let fallbackBrowser: Browser | null = null;
// In-flight launch promises — prevents concurrent workers from racing two
// `puppeteer.launch()` calls, which causes "Timed out waiting for WS endpoint
// URL" when two Chromium processes contend for the same pipe.
let browserLaunch: Promise<Browser> | null = null;
let fallbackLaunch: Promise<Browser> | null = null;
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

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: BROWSER_LAUNCH_ARGS,
    // Give Chromium more time to print its WS endpoint when the host is under
    // load (default is 30s; we've seen timeouts there with concurrency > 1).
    timeout: 60_000,
  });
}

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) return browser;
  // Share the in-flight launch so concurrent callers don't double-launch.
  if (!browserLaunch) {
    browserLaunch = launchBrowser()
      .then((b) => {
        browser = b;
        // Any disconnect (crash, oom-kill, manual close) — drop the reference
        // so the next getBrowser() relaunches cleanly.
        b.once("disconnected", () => {
          if (browser === b) browser = null;
        });
        return b;
      })
      .finally(() => {
        browserLaunch = null;
      });
  }
  return browserLaunch;
}

/** Plain browser with NO adblocker plugin — used as fallback when the primary
 *  browser's adblocker blocks the target page itself. */
async function getFallbackBrowser(): Promise<Browser> {
  if (fallbackBrowser && fallbackBrowser.connected) return fallbackBrowser;
  if (!fallbackLaunch) {
    fallbackLaunch = launchBrowser()
      .then((b) => {
        fallbackBrowser = b;
        b.once("disconnected", () => {
          if (fallbackBrowser === b) fallbackBrowser = null;
        });
        return b;
      })
      .finally(() => {
        fallbackLaunch = null;
      });
  }
  return fallbackLaunch;
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
  if (fallbackBrowser) {
    try {
      await fallbackBrowser.close();
    } catch {
      // Browser may already be closed — ignore
    }
    fallbackBrowser = null;
  }
}

async function restartBrowser(): Promise<void> {
  await closeBrowser();
  // Don't pre-launch — the next getBrowser() will memoize a single launch
  // shared by whoever calls first. Pre-launching here would race with any
  // in-flight getBrowser() that raced the close.
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
  // Phase 1: progressive scroll — follows page growth caused by lazy content
  await page.evaluate(async () => {
    const stepDelay = 300;
    const maxIterations = 25;
    let prevHeight = 0;
    let stableCount = 0;
    let y = 0;

    for (let i = 0; i < maxIterations; i++) {
      const currentHeight = document.body.scrollHeight;
      const viewportH = window.innerHeight;
      y = Math.min(y + viewportH, currentHeight);
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, stepDelay));

      // Stop when height has been stable for 2 consecutive iterations AND we've
      // reached the bottom of the page
      if (currentHeight === prevHeight) {
        stableCount++;
        if (stableCount >= 2 && y >= currentHeight) break;
      } else {
        stableCount = 0;
      }
      prevHeight = currentHeight;
    }

    window.scrollTo(0, 0);
  });

  // Phase 2: wait for all <img> elements to finish loading (hard cap 5s)
  try {
    await page.waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll("img"));
        if (imgs.length === 0) return true;
        // Treat complete (loaded or errored) as done so broken sources don't hang
        return imgs.every((img) => img.complete);
      },
      { timeout: 5000, polling: 250 }
    );
  } catch {
    // Some images may never load (broken sources) — proceed anyway
  }

  // Phase 3: small settle delay for any final paint/layout
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

/**
 * Extract emails from the rendered page:
 *   1. `mailto:` href attributes (highest signal — intentionally published)
 *   2. Visible text + full HTML regex match (catches contact-page emails
 *      that aren't wrapped in mailto: links)
 *
 * Filters out obvious junk (sentry, wixpress, example.com, noreply,
 * image-embedded paths, etc.) that turn up in third-party scripts.
 */
async function extractEmails(page: Page): Promise<string[]> {
  const raw = await page.evaluate(() => {
    const out = new Set<string>();

    // 1. mailto: links
    document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      const addr = href.replace(/^mailto:/i, "").split("?")[0].trim();
      if (addr) out.add(addr);
    });

    // 2. Regex over visible body text + full outerHTML (covers data-attributes,
    //    obfuscated "name at domain dot com" rarely, and contact-page copy).
    const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const text = document.body?.innerText || "";
    const html = document.documentElement?.outerHTML || "";
    for (const match of text.match(EMAIL_RE) ?? []) out.add(match);
    for (const match of html.match(EMAIL_RE) ?? []) out.add(match);

    return Array.from(out);
  });

  // Junk filter — domains/prefixes that appear in third-party scripts, CDNs,
  // trackers, or obvious placeholders. Also drop image-path matches.
  const JUNK_DOMAINS = [
    "sentry.io", "wixpress.com", "example.com", "domain.com", "email.com",
    "localhost", "sentry-cdn.com", "googletagmanager.com", "google-analytics.com",
    "doubleclick.net", "facebook.com", "fb.com", "instagram.com",
    "cloudflare.com", "jsdelivr.net", "unpkg.com", "gstatic.com",
  ];
  const JUNK_PREFIXES = ["noreply", "no-reply", "donotreply", "do-not-reply"];

  return raw
    .map((e) => e.trim().toLowerCase())
    .filter((e) => {
      // Drop image-path matches like "you@2x.png"
      if (/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|css|js)$/i.test(e)) return false;
      const [prefix, domain = ""] = e.split("@");
      if (!prefix || !domain) return false;
      if (JUNK_PREFIXES.includes(prefix)) return false;
      if (JUNK_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return false;
      return true;
    })
    .filter((e, i, arr) => arr.indexOf(e) === i); // dedupe
}

/**
 * Detect whether the current page is a Cloudflare challenge / block page
 * (e.g. "Just a moment...", "Attention Required!", access denied, Ray ID
 * error pages). These pages don't reflect the real website and should not
 * be fed into downstream analysis.
 */
async function detectCloudflareBlock(page: Page): Promise<boolean> {
  try {
    return await page.evaluate(() => {
      const title = (document.title || "").toLowerCase();
      const bodyText = (document.body?.innerText || "").toLowerCase();
      const html = document.documentElement?.outerHTML?.toLowerCase() || "";

      const titleSignals = [
        "just a moment",
        "attention required",
        "access denied",
        "please wait",
      ];
      if (titleSignals.some((s) => title.includes(s))) {
        // Confirm it's Cloudflare specifically, not a generic "access denied"
        if (
          html.includes("cloudflare") ||
          html.includes("cf-ray") ||
          html.includes("__cf_chl") ||
          html.includes("cf-browser-verification") ||
          html.includes("cf-challenge")
        ) {
          return true;
        }
      }

      const bodySignals = [
        "checking your browser before accessing",
        "enable javascript and cookies to continue",
        "cloudflare ray id",
        "performance & security by cloudflare",
        "sorry, you have been blocked",
      ];
      if (bodySignals.some((s) => bodyText.includes(s))) return true;

      const htmlSignals = [
        "cf-browser-verification",
        "cf-challenge-running",
        "__cf_chl_opt",
        "cf_chl_",
        'id="challenge-form"',
        'id="cf-error-details"',
      ];
      if (htmlSignals.some((s) => html.includes(s))) return true;

      return false;
    });
  } catch {
    return false;
  }
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
        // Adblocker blocked the main page — retry using the plain fallback
        // browser (no adblocker plugin attached at browser level).
        console.warn(`[Puppeteer] Adblocker blocked ${url} — retrying with plain fallback browser`);
        await page.close();
        const plainBrowser = await getFallbackBrowser();
        page = await plainBrowser.newPage();
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

    // Cloudflare challenge / block detection — short-circuit before we spend
    // time on screenshots, Claude analysis, etc. Email-discovery (which runs
    // from the domain in the worker) is unaffected.
    const cloudflareBlocked = await detectCloudflareBlock(page);
    if (cloudflareBlocked) {
      console.warn(`[Puppeteer] Cloudflare block detected for ${url} — skipping analysis`);
      await page.close();
      page = null;
      jobCount++;
      return {
        desktopScreenshot: Buffer.alloc(0),
        pageText: "",
        loadTimeMs,
        isHttps,
        emails: [],
        cloudflareBlocked: true,
        domChecks: {
          hasContactForm: false,
          hasPhoneLink: false,
          hasEmailLink: false,
          hasBookingWidget: false,
          hasGoogleMap: false,
          hasSocialLinks: false,
          hasSchemaMarkup: false,
          hasVideo: false,
          imageCount: 0,
          navigationItemCount: 0,
        },
      };
    }

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

    // Scroll back to top and wait for lazy content to finish rendering
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(5000);

    console.log(`[Puppeteer] Taking full-page desktop screenshot...`);
    // Read height from both body and documentElement — some error pages (403,
    // redirect shells, about:blank fallbacks) have body.scrollHeight === 0
    // which crashes page.screenshot with "'height' in 'clip' must be positive."
    const pageHeight = await page.evaluate(() =>
      Math.max(
        document.body?.scrollHeight ?? 0,
        document.documentElement?.scrollHeight ?? 0,
        window.innerHeight ?? 0
      )
    );
    const MIN_CAPTURE_HEIGHT = 800; // Never go below the viewport
    const MAX_CAPTURE_HEIGHT = 7800; // Claude's 8000px limit
    const desktopCaptureHeight = Math.max(
      MIN_CAPTURE_HEIGHT,
      Math.min(pageHeight || MIN_CAPTURE_HEIGHT, MAX_CAPTURE_HEIGHT)
    );
    if (pageHeight > MAX_CAPTURE_HEIGHT) {
      console.log(`[Puppeteer] Desktop height ${pageHeight}px capped to ${MAX_CAPTURE_HEIGHT}px`);
    } else if (pageHeight <= 0) {
      console.warn(`[Puppeteer] Page reported 0 height — falling back to ${MIN_CAPTURE_HEIGHT}px viewport capture`);
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
    console.log(`[Puppeteer] Extracting text, emails, and running DOM checks...`);
    const pageText = await extractPageText(page);
    const emails = await extractEmails(page).catch(() => [] as string[]);
    const domChecks = await runDomChecks(page);
    console.log(
      `[Puppeteer] Done — text=${pageText.length} chars, emails=${emails.length}, images=${domChecks.imageCount}, form=${domChecks.hasContactForm}, booking=${domChecks.hasBookingWidget}`
    );

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
      cloudflareBlocked: false,
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

    // If the browser itself crashed OR ended up in a bad per-session state
    // (detached frames usually mean the page navigated during our setup and
    // left stale CDP handles that poison the rest of the browser for other
    // tabs), restart it for subsequent calls.
    if (
      error instanceof Error &&
      (error.message.includes("Target closed") ||
        error.message.includes("Session closed") ||
        error.message.includes("Protocol error") ||
        error.message.includes("browser has disconnected") ||
        error.message.includes("detached Frame") ||
        error.message.includes("frame was detached") ||
        error.message.includes("WS endpoint URL"))
    ) {
      console.error(
        `[Puppeteer] Browser in bad state for ${url} (${error.message.split("\n")[0]}) — restarting`
      );
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
