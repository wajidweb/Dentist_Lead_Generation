# Analyze Lead — Complete Process Document

> **Stage:** Website Analysis + Lead Scoring
> **Date:** April 2026
> **Status:** Planning
> **Dependencies:** Puppeteer, Google PSI API, Claude API, BullMQ, Redis, Cloudinary

---

## Table of Contents

1. [Overview & Business Logic](#1-overview--business-logic)
2. [Infrastructure Requirements](#2-infrastructure-requirements)
3. [The Analysis Pipeline](#3-the-analysis-pipeline)
4. [Step 1: Puppeteer — Browser Automation](#4-step-1-puppeteer--browser-automation)
5. [Step 2: Google PageSpeed Insights](#5-step-2-google-pagespeed-insights)
6. [Step 3: Claude — Unified Visual + Content Analysis](#6-step-3-claude--unified-visual--content-analysis)
7. [Step 4: Score Aggregation](#7-step-4-score-aggregation)
8. [Step 5: Lead Scoring](#8-step-5-lead-scoring)
9. [The 100-Website Dental Standard](#9-the-100-website-dental-standard)
10. [Job Queue System](#10-job-queue-system)
11. [Error Handling & Retry Logic](#11-error-handling--retry-logic)
12. [API Endpoints](#12-api-endpoints)
13. [Database Schema Changes](#13-database-schema-changes)
14. [Frontend UI Design](#14-frontend-ui-design)
15. [Cost Analysis](#15-cost-analysis)
16. [Implementation Phases](#16-implementation-phases)

---

# 1. Overview & Business Logic

## What "Analyze" Means

When the user clicks "Analyze" on one or more leads, the system visits each lead's website and generates a comprehensive quality report. The goal is to answer one question: **"Is this dentist's website bad enough that we can pitch them a replacement?"**

## The Core Flow

```
User clicks "Analyze" (single or bulk)
       │
       ▼
Jobs queued in BullMQ (one per lead)
       │
       ▼ (2-3 concurrent workers)
┌──────────────────────────────────┐
│  PUPPETEER                        │
│  Screenshots + Text + DOM Checks  │
│  ~15-20 seconds per site          │
└──────────┬───────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐  ┌──────────────────────────┐
│ PSI API  │  │ CLAUDE (single call)      │
│ Mobile   │  │ Vision + Text combined    │
│ ~15 sec  │  │ ~5-10 sec                 │
└────┬─────┘  └────────────┬─────────────┘
     │                     │
     └──────────┬──────────┘
                ▼
     ┌──────────────────────┐
     │ SCORE AGGREGATION     │
     │ Website Quality Score │
     │ Lead Score            │
     │ Lead Category         │
     │ Cloudinary Upload     │
     │ Status → "Analyzed"   │
     └──────────────────────┘
```

## What We Focus On (Priority Order)

1. **Visual Quality (50%)** — Does the website LOOK professional and modern? This is what dentists and their patients see. Ugly = easy pitch.
2. **Content Quality (30%)** — Is critical dental content present? Missing booking, no testimonials, no services listed = strong pitch points.
3. **Technical Health (20%)** — Is the site fast? Mobile-friendly? These are supporting data points for the pitch.

## What We Do NOT Analyze

- **Tech stack** (WordPress version, jQuery, etc.) — Removed. Dentists don't care. Adds complexity (Wappalyzer is 100MB+) with no pitch value.
- **Full SEO audit** — PSI gives us a basic SEO score. Deep SEO analysis is out of scope.
- **Security audit** — Beyond HTTPS check, not relevant to our pitch.

---

# 2. Infrastructure Requirements

## New Dependencies (Backend)

| Package | Purpose | Size |
|---------|---------|------|
| `puppeteer` | Headless Chrome for screenshots/scraping | ~280MB (downloads Chromium) |
| `@ghostery/adblocker-puppeteer` | Block cookie banners (Layer 1) | ~5MB |
| `@anthropic-ai/sdk` | Claude API for visual + content analysis | ~2MB |
| `bullmq` | Job queue for background processing | ~1MB |
| `ioredis` | Redis client (required by BullMQ) | ~1MB |
| `cloudinary` | Screenshot hosting for later email use | ~1MB |

**NOT needed:** `wappalyzer`, `lighthouse` (using PSI API instead)

## External Services

| Service | Purpose | Cost | Setup |
|---------|---------|------|-------|
| **Redis** | Job queue backend | Free (local) or $0-15/mo (managed) | Install locally or use Upstash/Redis Cloud free tier |
| **Google PSI API** | Performance/SEO/Accessibility scores | Free (25K calls/day) | Same Google Cloud project, enable PageSpeed Insights API |
| **Claude API (Anthropic)** | Visual + content analysis | ~$0.014/site (Sonnet Batch) | API key already in .env |
| **Cloudinary** | Screenshot hosting | Free (25GB) | Create account, add env vars |

## Server Requirements

| Config | Sequential Processing | 2-3 Concurrent |
|--------|----------------------|-----------------|
| RAM | 2GB minimum | 4GB recommended |
| CPU | 1 vCPU | 2 vCPU |
| Disk | +500MB for Chromium | +500MB for Chromium |
| Cost | $5-6/mo (DigitalOcean, Hetzner) | $10-12/mo |

## Environment Variables (New)

```env
# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google PageSpeed Insights (uses same Google API key)
GOOGLE_PSI_API_KEY=your_google_api_key

# Anthropic (already exists in .env)
ANTHROPIC_API_KEY=sk-ant-...

# Analysis Config
ANALYSIS_CONCURRENCY=2
ANALYSIS_TIMEOUT_MS=30000
PUPPETEER_TIMEOUT_MS=20000
```

---

# 3. The Analysis Pipeline

## Per-Lead Timing Breakdown

| Step | Duration | Runs |
|------|----------|------|
| Puppeteer: navigate + cookie dismiss | 3-5 sec | Sequential |
| Puppeteer: scroll page (lazy images) | 2-3 sec | Sequential |
| Puppeteer: desktop screenshot | 1-2 sec | Sequential |
| Puppeteer: mobile screenshot | 2-3 sec | Sequential (requires viewport change + reload) |
| Puppeteer: text extraction + DOM checks | 1-2 sec | Sequential |
| Google PSI API (mobile) | 10-30 sec | **Parallel** with Claude |
| Claude API (vision + text) | 5-10 sec | **Parallel** with PSI |
| Score aggregation | <100ms | After both complete |
| Cloudinary upload (2 images) | 2-3 sec | After scoring |
| **Total per lead** | **~25-45 sec** | |

## Batch Timing (50 leads)

| Processing Mode | Time | Server Requirement |
|-----------------|------|--------------------|
| Sequential (1 at a time) | ~20-35 min | 2GB RAM |
| 2 concurrent workers | ~12-18 min | 4GB RAM |
| 3 concurrent workers | ~8-12 min | 4GB RAM |

## Data Flow Per Lead

```
Input:
  lead._id
  lead.website (URL)
  lead.businessName
  lead.googleRating
  lead.googleReviewCount

Puppeteer Output:
  desktopScreenshot: Buffer (PNG, 1280x800)
  mobileScreenshot: Buffer (PNG, 390x844)
  pageText: string (innerText, max 5000 chars)
  loadTimeMs: number
  isHttps: boolean
  domChecks: {
    hasContactForm: boolean
    hasPhoneLink: boolean
    hasEmailLink: boolean
    hasBookingWidget: boolean
    hasGoogleMap: boolean
    hasSocialLinks: boolean
    hasSchemaMarkup: boolean
    hasVideo: boolean
    imageCount: number
    navigationItemCount: number
  }

PSI Output:
  performanceScore: number (0-100)
  seoScore: number (0-100)
  accessibilityScore: number (0-100)
  bestPracticesScore: number (0-100)
  lcp: number (milliseconds)
  cls: number
  tbt: number (milliseconds)

Claude Output:
  visualCategory: "poor" | "fair" | "good" | "excellent"
  visualSubScores: {
    designModernity: "poor" | "fair" | "good" | "excellent"
    colorScheme: "poor" | "fair" | "good" | "excellent"
    layoutQuality: "poor" | "fair" | "good" | "excellent"
    imageQuality: "poor" | "fair" | "good" | "excellent"
    ctaVisibility: "poor" | "fair" | "good" | "excellent"
    trustSignals: "poor" | "fair" | "good" | "excellent"
    mobileExperience: "poor" | "fair" | "good" | "excellent"
  }
  designEraEstimate: string (e.g., "2012-2015")
  visualIssues: string[] (top 3 visual issues)
  contentCategory: "poor" | "fair" | "good" | "excellent"
  contentItems: {
    serviceDescriptions: { present: boolean, quality: "good" | "basic" | "poor" | "missing", note: string }
    doctorBios: { present: boolean, quality: "good" | "basic" | "poor" | "missing", note: string }
    patientTestimonials: { present: boolean, quality: "good" | "basic" | "poor" | "missing", note: string }
    onlineBooking: { present: boolean, note: string }
    contactInfo: { present: boolean, quality: "good" | "basic" | "poor" | "missing", note: string }
    insuranceInfo: { present: boolean, note: string }
    officeHours: { present: boolean, note: string }
    newPatientInfo: { present: boolean, note: string }
    beforeAfter: { present: boolean, note: string }
    blogContent: { present: boolean, note: string }
    emergencyInfo: { present: boolean, note: string }
    aboutPractice: { present: boolean, quality: "good" | "basic" | "poor" | "missing", note: string }
  }
  contentItemsPresentCount: number (out of 12)
  criticalMissing: string[] (most important missing items)
  issuesList: string[] (human-readable issues for email personalization)
  oneLineSummary: string

Aggregated Output (saved to lead document):
  websiteAnalysis: { ...all PSI + Claude data... }
  websiteQualityScore: number (0-100)
  leadScore: number (0-100)
  leadCategory: "hot" | "warm" | "cool" | "skip"
  status: "analyzed"
  analyzed: true
```

---

# 4. Step 1: Puppeteer — Browser Automation

## Browser Launch Configuration

```javascript
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--no-first-run',
    '--mute-audio',
  ]
});
```

**Browser lifecycle:** Create one browser instance, reuse for up to 50 pages, then close and recreate. This prevents memory leaks from accumulating.

## Cookie Banner Handling (3-Layer Approach)

This is the most critical preprocessing step. Cookie banners block screenshots and pollute text extraction.

**Layer 1: Adblocker filter lists (passive, blocks ~60-70%)**

```javascript
import { PuppeteerBlocker } from '@ghostery/adblocker-puppeteer';

const blocker = await PuppeteerBlocker.fromPrebuiltFull(fetch);
await blocker.enableBlockingInPage(page);
```

Uses Fanboy's Cookie Monster list and EasyList to block consent banners before they render.

**Layer 2: Autoconsent (active, clicks Accept on known platforms)**

```javascript
// After page load, try to dismiss known consent management platforms
// OneTrust, CookieBot, Quantcast, Complianz, etc.
// Use @duckduckgo/autoconsent or manual selectors for common WordPress GDPR plugins
```

**Layer 3: CSS injection fallback (nuclear option for remaining banners)**

```javascript
await page.addStyleTag({
  content: `
    [class*="cookie" i], [class*="consent" i], [class*="gdpr" i],
    [id*="cookie" i], [id*="consent" i], [id*="gdpr" i],
    .cookie-banner, .consent-banner, .cookie-notice,
    [class*="overlay" i][class*="cookie" i] {
      display: none !important;
      visibility: hidden !important;
    }
  `
});
```

**Wait 2 seconds after dismissal** before taking screenshots to allow close animations to complete.

## Page Navigation

```javascript
const startTime = Date.now();
await page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 20000  // 20 second timeout
});
const loadTimeMs = Date.now() - startTime;
```

**Why `networkidle2` instead of `networkidle0`:** `networkidle0` waits for zero network connections, which can hang indefinitely on sites with analytics/chat widgets that maintain persistent connections. `networkidle2` (max 2 connections) is more practical.

**Timeout:** 20 seconds. Most dental sites load in 3-10 seconds. Sites that take 20+ seconds are genuinely broken — we still want to capture them (they'll score poorly) but we can't wait forever.

## Scroll Before Screenshot (Trigger Lazy Images)

Many modern sites lazy-load images. Without scrolling, screenshots show placeholder/blank images:

```javascript
await page.evaluate(async () => {
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const height = document.body.scrollHeight;
  const step = 300;
  for (let y = 0; y < height; y += step) {
    window.scrollTo(0, y);
    await delay(100);
  }
  window.scrollTo(0, 0); // Scroll back to top
  await delay(500); // Wait for images to render
});
```

## Desktop Screenshot (1280x800)

```javascript
await page.setViewport({ width: 1280, height: 800 });
const desktopScreenshot = await page.screenshot({
  type: 'png',
  fullPage: false,  // Viewport only — NOT full page
  encoding: 'binary'
});
```

**Why viewport-only (not full-page):**
- Claude Vision auto-downscales images over 1,568px on any edge, losing detail
- Full-page dental sites can be 5,000-8,000px tall → compressed to ~500px wide (blurry)
- Viewport (1280x800) stays under Claude's optimal threshold
- Above-the-fold content is what patients see first and what matters most for the pitch
- Less memory usage, faster capture

## Mobile Screenshot (390x844)

```javascript
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
const mobileScreenshot = await page.screenshot({
  type: 'png',
  fullPage: false,
  encoding: 'binary'
});
```

**Why reload after viewport change:** Many sites serve different HTML/CSS based on viewport. Just resizing won't trigger responsive breakpoints on all sites. A full reload ensures we get the actual mobile experience.

## Text Extraction

```javascript
const pageText = await page.evaluate(() => {
  // Remove script and style elements to avoid noise
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
  return clone.innerText;
});

// Truncate to ~5000 characters to keep Claude costs reasonable
const truncatedText = pageText.substring(0, 5000);
```

**Why `innerText` not `textContent`:** `innerText` returns only visible text (respects CSS `display:none`), which is what users actually see. `textContent` includes hidden elements, script contents, etc.

**Why truncate at 5000 chars:** Dental homepages typically have 1,000-3,000 characters of visible text. 5,000 covers multi-page extractions. Beyond that, we're paying for Claude tokens on content that's unlikely to change the analysis.

**Known limitations (acceptable):**
- Text baked into images (hero banners, logos) is not captured — Claude Vision sees these in screenshots
- PDF content is not captured — rare on dental homepages
- iframe content (booking widgets, map) is not captured — DOM checks detect their presence

## DOM Checks

```javascript
const domChecks = await page.evaluate(() => ({
  hasContactForm: !!document.querySelector('form'),
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
  hasSchemaMarkup: !!document.querySelector('script[type="application/ld+json"]'),
  hasVideo: !!document.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]'),
  imageCount: document.querySelectorAll('img').length,
  navigationItemCount: document.querySelectorAll('nav a, header a').length,
}));
```

**HTTPS check:**

```javascript
const isHttps = page.url().startsWith('https://');
```

## Puppeteer Output Summary

After this step, we have for each lead:
- 2 screenshots (PNG buffers, viewport-only)
- Extracted visible text (string, max 5000 chars)
- Load time in milliseconds
- HTTPS boolean
- 10 DOM check booleans/numbers

These feed into PSI (URL only) and Claude (screenshots + text + DOM checks).

---

# 5. Step 2: Google PageSpeed Insights

## API Call (Mobile Only)

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url={encoded_website_url}
  &key={GOOGLE_PSI_API_KEY}
  &category=performance
  &category=seo
  &category=accessibility
  &category=best-practices
  &strategy=mobile
```

## Why Mobile Only

- **Mobile scores are dramatically lower** than desktop (avg ~40 vs ~60). Better differentiation.
- **Mobile uses simulated 3G throttling** (1.6 Mbps, 150ms RTT, 4x CPU slowdown). Exposes real problems.
- Desktop scores are too generous — most sites score 70-100, providing poor differentiation.
- Google uses mobile-first indexing — mobile is what actually matters.
- Running mobile-only halves the API call count and processing time.

## What We Extract

```javascript
const result = await response.json();
const lighthouse = result.lighthouseResult;

const psiData = {
  performanceScore: Math.round((lighthouse.categories.performance?.score || 0) * 100),
  seoScore: Math.round((lighthouse.categories.seo?.score || 0) * 100),
  accessibilityScore: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
  bestPracticesScore: Math.round((lighthouse.categories['best-practices']?.score || 0) * 100),

  // Core Web Vitals (lab data — CrUX won't exist for most dental sites)
  lcp: lighthouse.audits['largest-contentful-paint']?.numericValue || 0,   // ms
  cls: lighthouse.audits['cumulative-layout-shift']?.numericValue || 0,
  tbt: lighthouse.audits['total-blocking-time']?.numericValue || 0,        // ms (proxy for INP)
};
```

## Timing and Rate Limits

- **Each call takes 10-30 seconds** (Google runs a full Lighthouse audit remotely)
- **Rate limit:** 400 requests per 100 seconds, 25,000 per day
- **For 50 leads:** Run 3-5 concurrent PSI requests. Total time: ~2-5 minutes.
- **PSI runs in parallel with Claude** — not sequentially

## Handling Failures

PSI fails on ~5-15% of URLs. Common failures:
- Timeout (very slow sites)
- WAF blocking (Cloudflare, Sucuri)
- robots.txt blocking
- Site is down

**On failure:** Set all PSI scores to `null`. The website quality score formula handles missing PSI data by redistributing weight to visual + content (see Score Aggregation section).

## Score Variance

- **Normal variance: +/- 5 points** between runs of the same URL
- **Acceptable for lead scoring** — we bucket into tiers (terrible/poor/mediocre/good), not precise rankings
- A site scoring 25 will never score 75 due to variance

---

# 6. Step 3: Claude — Unified Visual + Content Analysis

## Why One Call, Not Two

The original document specifies separate Claude Vision and Claude Text API calls. We merge them into a single call because:

1. **Claude sees screenshots AND text together** — can cross-reference: "text mentions online booking but no booking button is visible in the screenshots"
2. **Cheaper:** ~$0.014 vs ~$0.024 for two calls (Sonnet Batch)
3. **Faster:** One round-trip instead of two
4. **Better quality:** Combined context produces more accurate analysis

## API Call Structure

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1500,
  temperature: 0,
  messages: [{
    role: 'user',
    content: [
      // Images FIRST (Claude works best with image-then-text)
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: desktopScreenshotBase64 }
      },
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: mobileScreenshotBase64 }
      },
      // Then text prompt with extracted content and DOM checks
      {
        type: 'text',
        text: ANALYSIS_PROMPT  // See below
      }
    ]
  }]
});
```

## Using Structured Outputs (Guaranteed Valid JSON)

Instead of asking Claude to return JSON in free text (which can fail ~2-5% of the time), we use structured outputs — Claude's constrained decoding that **guarantees** valid JSON matching our schema at the token level:

```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1500,
  temperature: 0,
  messages: [{ role: 'user', content: [...] }],
  // Structured output — guarantees JSON matching this schema
  output_config: {
    format: {
      type: 'json_schema',
      schema: ANALYSIS_RESPONSE_SCHEMA  // See below
    }
  }
});
```

## Why Categorical Scores, Not Numerical

Research shows Claude has **+/- 1-2 point variance** on numerical 1-10 scores across identical runs. The difference between 6/10 and 7/10 is meaningless noise.

**Categorical scores are more consistent:**
- Claude rarely misclassifies "Poor" as "Excellent"
- The bucket boundaries (Poor/Fair/Good/Excellent) are stable across runs
- Maps cleanly to our scoring formula

| Category | Meaning | Numeric Mapping (for score formula) |
|----------|---------|-------------------------------------|
| **Poor** | Clearly outdated, major problems, unprofessional | 15/100 |
| **Fair** | Below average, notable issues, needs improvement | 40/100 |
| **Good** | Acceptable, some room for improvement, functional | 65/100 |
| **Excellent** | Modern, professional, well-built | 85/100 |

## The Analysis Prompt

```
You are a dental practice website auditor. You have analyzed 100 dental websites and understand
what makes a good vs bad dental practice website.

{DENTAL_STANDARD_CONTEXT}  ← Injected from the 100-website benchmark (see Section 9)

You are now analyzing a dental practice website. The first image is the desktop view (1280x800),
the second is the mobile view (390x844).

EXTRACTED TEXT FROM THE WEBSITE:
---
{pageText}
---

AUTOMATED CHECKS:
- HTTPS: {isHttps}
- Load time: {loadTimeMs}ms
- Contact form detected: {hasContactForm}
- Phone link detected: {hasPhoneLink}
- Email link detected: {hasEmailLink}
- Booking widget detected: {hasBookingWidget}
- Google Map embedded: {hasGoogleMap}
- Social media links: {hasSocialLinks}
- Schema markup: {hasSchemaMarkup}
- Video content: {hasVideo}
- Image count: {imageCount}
- Navigation items: {navigationItemCount}

EVALUATE THIS WEBSITE:

PART 1 — VISUAL QUALITY
Rate each category as "poor", "fair", "good", or "excellent":

1. DESIGN_MODERNITY: Does it look current (2023-2026 trends) or outdated?
   - Modern: clean typography, whitespace, hero sections, card layouts, sans-serif fonts
   - Outdated: small text, busy layouts, gradient buttons, clip art, Flash-era aesthetics

2. COLOR_SCHEME: Professional and cohesive colors?
   - Good: consistent brand palette, professional tones, good contrast
   - Bad: too many colors, neon/garish, poor contrast, clashing

3. LAYOUT_QUALITY: Organized and easy to scan?
   - Good: clear hierarchy, logical flow, grid-based, proper spacing
   - Bad: cluttered, no hierarchy, cramped, inconsistent

4. IMAGE_QUALITY: Professional imagery?
   - Good: real office/staff photos, high resolution, properly sized
   - Bad: obvious stock photos, low resolution, stretched, clip art

5. CTA_VISIBILITY: Clear calls-to-action?
   - Good: prominent "Book Appointment" button, phone number visible above fold
   - Bad: no clear next step, buried contact info, no booking option

6. TRUST_SIGNALS: Does it build confidence?
   - Good: patient reviews, certifications, awards, real team photos
   - Bad: no social proof, anonymous feel, no credentials

7. MOBILE_EXPERIENCE: How does the mobile version look?
   - Good: responsive layout, touch-friendly, readable text
   - Bad: desktop layout forced on mobile, tiny text, horizontal scrolling

Then give an overall visual category ("poor", "fair", "good", or "excellent") and estimate the design era (e.g., "2010-2013" or "2022-2025").

PART 2 — CONTENT QUALITY
For each of these 12 content areas, determine if it is present and rate its quality:

1. SERVICE_DESCRIPTIONS: Dental services listed with descriptions? (cleanings, implants, cosmetic, etc.)
2. DOCTOR_BIOS: Doctor/team bios with credentials and photos?
3. PATIENT_TESTIMONIALS: Patient reviews or testimonials displayed on the site?
4. ONLINE_BOOKING: Online appointment scheduling available?
5. CONTACT_INFO: Phone, address, email prominently displayed?
6. INSURANCE_INFO: Insurance/payment information provided?
7. OFFICE_HOURS: Hours clearly listed?
8. NEW_PATIENT_INFO: New patient section or special offers?
9. BEFORE_AFTER: Before/after treatment photos?
10. BLOG_CONTENT: Educational blog or articles?
11. EMERGENCY_INFO: Emergency dental care information?
12. ABOUT_PRACTICE: About section describing the practice philosophy?

Then give an overall content category ("poor", "fair", "good", or "excellent").

PART 3 — ISSUES & SUMMARY
List 3-7 specific, concrete issues suitable for use in a sales email. Each issue should be:
- Specific (not generic like "improve your website")
- Understandable by a non-technical dentist
- Something that affects their patients or business

Example good issues:
- "Your website takes over 6 seconds to load on mobile — 53% of visitors leave after 3 seconds"
- "There is no online appointment booking — patients must call during office hours"
- "No patient testimonials are displayed, despite having 4.8 stars on Google"

Example bad issues (too generic):
- "The website could be improved"
- "SEO needs work"

Finally, write a one-line summary of the website's overall quality.
```

## Response Schema (Structured Output)

```json
{
  "type": "object",
  "properties": {
    "visual_category": {
      "type": "string",
      "enum": ["poor", "fair", "good", "excellent"]
    },
    "visual_sub_scores": {
      "type": "object",
      "properties": {
        "design_modernity": { "type": "string", "enum": ["poor", "fair", "good", "excellent"] },
        "color_scheme": { "type": "string", "enum": ["poor", "fair", "good", "excellent"] },
        "layout_quality": { "type": "string", "enum": ["poor", "fair", "good", "excellent"] },
        "image_quality": { "type": "string", "enum": ["poor", "fair", "good", "excellent"] },
        "cta_visibility": { "type": "string", "enum": ["poor", "fair", "good", "excellent"] },
        "trust_signals": { "type": "string", "enum": ["poor", "fair", "good", "excellent"] },
        "mobile_experience": { "type": "string", "enum": ["poor", "fair", "good", "excellent"] }
      },
      "required": ["design_modernity", "color_scheme", "layout_quality", "image_quality", "cta_visibility", "trust_signals", "mobile_experience"],
      "additionalProperties": false
    },
    "design_era_estimate": { "type": "string" },
    "visual_issues": {
      "type": "array",
      "items": { "type": "string" }
    },
    "content_category": {
      "type": "string",
      "enum": ["poor", "fair", "good", "excellent"]
    },
    "content_items": {
      "type": "object",
      "properties": {
        "service_descriptions": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "doctor_bios": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "patient_testimonials": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "online_booking": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "note": { "type": "string" }
          },
          "required": ["present", "note"],
          "additionalProperties": false
        },
        "contact_info": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "insurance_info": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "note": { "type": "string" }
          },
          "required": ["present", "note"],
          "additionalProperties": false
        },
        "office_hours": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "note": { "type": "string" }
          },
          "required": ["present", "note"],
          "additionalProperties": false
        },
        "new_patient_info": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "note": { "type": "string" }
          },
          "required": ["present", "note"],
          "additionalProperties": false
        },
        "before_after": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "note": { "type": "string" }
          },
          "required": ["present", "note"],
          "additionalProperties": false
        },
        "blog_content": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "note": { "type": "string" }
          },
          "required": ["present", "note"],
          "additionalProperties": false
        },
        "emergency_info": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "note": { "type": "string" }
          },
          "required": ["present", "note"],
          "additionalProperties": false
        },
        "about_practice": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        }
      },
      "required": ["service_descriptions", "doctor_bios", "patient_testimonials", "online_booking", "contact_info", "insurance_info", "office_hours", "new_patient_info", "before_after", "blog_content", "emergency_info", "about_practice"],
      "additionalProperties": false
    },
    "content_items_present_count": { "type": "integer" },
    "critical_missing": {
      "type": "array",
      "items": { "type": "string" }
    },
    "issues_list": {
      "type": "array",
      "items": { "type": "string" }
    },
    "one_line_summary": { "type": "string" }
  },
  "required": ["visual_category", "visual_sub_scores", "design_era_estimate", "visual_issues", "content_category", "content_items", "content_items_present_count", "critical_missing", "issues_list", "one_line_summary"],
  "additionalProperties": false
}
```

## Batch API (Recommended for Bulk Analysis)

For analyzing 20+ leads at once, use Claude's Batch API:

- **50% cost discount** ($0.014/site instead of $0.028 with Sonnet)
- **No RPM/ITPM rate limits** (separate from standard API)
- Submit all analyses as one batch, retrieve results when complete
- Most batches complete in **under 1 hour**
- Vision is explicitly supported in batch requests

**Flow:**
1. Puppeteer processes all leads sequentially → collect screenshots + text
2. Submit all Claude analysis requests as a single batch
3. Poll for batch completion
4. Retrieve results and process scores

For single-lead analysis or small batches (<10), use the standard API for instant results.

---

# 7. Step 4: Score Aggregation

## Website Quality Score (0-100)

```
Website Quality Score = (Visual × 0.50) + (Content × 0.30) + (Technical × 0.20)
```

### Visual Score (50% weight)

Map Claude's categorical visual score to 0-100:

| Claude Category | Numeric Value |
|-----------------|---------------|
| Poor | 15 |
| Fair | 40 |
| Good | 65 |
| Excellent | 85 |

### Content Score (30% weight)

Map Claude's categorical content score to 0-100:

| Claude Category | Numeric Value |
|-----------------|---------------|
| Poor | 15 |
| Fair | 40 |
| Good | 65 |
| Excellent | 85 |

### Technical Score (20% weight)

Use PSI mobile performance score directly (already 0-100).

If PSI failed (returned null), redistribute weight:

```
If PSI available:
  Score = (Visual × 0.50) + (Content × 0.30) + (Technical × 0.20)

If PSI failed:
  Score = (Visual × 0.60) + (Content × 0.40)
```

### Score Interpretation

| Score | Label | Color | Meaning | Pitch Strength |
|-------|-------|-------|---------|----------------|
| 0-30 | TERRIBLE | Red | Website is truly awful | Very strong pitch |
| 31-50 | POOR | Orange | Significant problems | Strong pitch |
| 51-70 | AVERAGE | Yellow | Mediocre but functional | Moderate pitch |
| 71-85 | GOOD | Light Green | Decent website | Weak pitch |
| 86-100 | EXCELLENT | Green | Modern, well-built | No pitch — skip |

### Example Calculations

**Terrible dental website:**
- Visual: Poor (15) × 0.50 = 7.5
- Content: Poor (15) × 0.30 = 4.5
- Technical: PSI 22 × 0.20 = 4.4
- **Website Quality Score: 16.4 → 16/100 (TERRIBLE)**

**Below-average dental website:**
- Visual: Fair (40) × 0.50 = 20
- Content: Fair (40) × 0.30 = 12
- Technical: PSI 45 × 0.20 = 9
- **Website Quality Score: 41/100 (POOR)**

**Decent dental website:**
- Visual: Good (65) × 0.50 = 32.5
- Content: Good (65) × 0.30 = 19.5
- Technical: PSI 72 × 0.20 = 14.4
- **Website Quality Score: 66/100 (AVERAGE)**

---

# 8. Step 5: Lead Scoring

## The Principle

**Lead Score answers: "How good is this lead for our business?"**

High score = great reputation + terrible website + lots of pitch ammo

## Formula (0-100 Scale)

### Component 1: Reputation (max 25 points) — Continuous

```
reputation = ((rating - 3.5) / 1.5) × 25
```

| Rating | Points | Logic |
|--------|--------|-------|
| 3.5 | 0 | Minimum threshold — borderline reputation |
| 3.8 | 5 | Below average for dental |
| 4.0 | 8 | Average |
| 4.2 | 12 | Good |
| 4.5 | 17 | Very good |
| 4.8 | 22 | Excellent |
| 5.0 | 25 | Perfect |

No cliff effects. Smooth linear progression. A 4.49 and 4.51 rating differ by <1 point, not 15.

### Component 2: Establishment (max 15 points) — Logarithmic

```
establishment = min(15, log2(reviews / 10) × 5)
```

| Reviews | Points | Logic |
|---------|--------|-------|
| 10 | 0 | Minimum threshold — barely established |
| 15 | 3 | Small practice |
| 20 | 5 | Growing |
| 40 | 10 | Established |
| 80 | 15 (cap) | Very established |
| 200 | 15 | Same — already clearly established |
| 500 | 15 | Same — review count stops mattering |

Why logarithmic: the jump from 10 to 40 reviews tells you a lot (new vs established). The jump from 200 to 500 tells you little (both clearly established and can afford $199).

### Component 3: Visual Opportunity (max 30 points) — INVERTED

```
Based on Claude's visual category (inverted — worse website = more points):
  Poor      → 30 points
  Fair      → 20 points
  Good      → 8 points
  Excellent → 0 points
```

**This is the heaviest component (30%)** because visual quality is the primary pitch lever. An ugly website is immediately obvious to the dentist when you show them the side-by-side comparison.

### Component 4: Content Gaps (max 20 points) — INVERTED

```
Based on number of missing content items (out of 12):
  9-12 missing → 20 points (site is nearly empty)
  6-8 missing  → 15 points (significant gaps)
  3-5 missing  → 8 points  (some gaps)
  0-2 missing  → 0 points  (has everything)
```

This captures **pitchability** — how many concrete things you can cite in your email. "Your site is missing online booking, patient testimonials, and service descriptions" is a much stronger pitch than "your site could be improved."

### Component 5: Technical Weakness (max 10 points) — INVERTED

```
Based on PSI mobile performance score:
  0-30   → 10 points ("loads in 8+ seconds")
  31-50  → 7 points  ("loads in 5-8 seconds")
  51-70  → 3 points  ("slightly slow")
  71-100 → 0 points  (fast enough)
```

Low weight (10%) because dentists don't care about Lighthouse scores. But "your website takes 8 seconds to load and 53% of visitors leave after 3 seconds" is a solid supporting line in the pitch email.

If PSI failed: award 0 points (don't penalize or reward — we don't know).

### Total Lead Score

```
LEAD_SCORE = reputation + establishment + visual_opportunity + content_gaps + technical_weakness
Range: 0-100
```

### Lead Categories

| Score | Category | Badge | Meaning |
|-------|----------|-------|---------|
| 75-100 | **HOT** | Red | Perfect target. Great reputation, terrible website, lots of pitch ammo. Priority outreach. |
| 55-74 | **WARM** | Orange | Good target. Worth pursuing. Some combination of good reviews and website issues. |
| 35-54 | **COOL** | Blue | Possible target. Lower priority. Website is mediocre or reviews are moderate. |
| 0-34 | **SKIP** | Gray | Not worth pursuing. Website is acceptable OR reputation is weak. |

### Simulation: Real Scenarios

| Dentist | Rating | Reviews | Visual | Missing Items | PSI | Score | Category |
|---------|--------|---------|--------|---------------|-----|-------|----------|
| A: Dream lead | 4.8 | 200 | Poor | 9/12 | 22 | 22+15+30+20+10 = **97** | HOT |
| B: Weak reputation | 3.5 | 15 | Poor | 10/12 | 15 | 0+3+30+20+10 = **63** | WARM |
| C: Established, ok site | 4.7 | 300 | Fair | 5/12 | 45 | 20+15+20+8+7 = **70** | WARM |
| D: Good reviews, bad site | 4.2 | 45 | Poor | 7/12 | 30 | 12+11+30+15+10 = **78** | HOT |
| E: Good reviews, ok site | 4.5 | 80 | Good | 2/12 | 60 | 17+15+8+0+3 = **43** | COOL |
| F: Established, below avg | 4.0 | 500 | Fair | 6/12 | 35 | 8+15+20+15+7 = **65** | WARM |

**Key behaviors:**
- Dentist A (dream lead) → HOT. Correct.
- Dentist B (3.5 stars, 15 reviews) → WARM, not HOT. Despite terrible website, weak reputation and small practice keep it below HOT. Correct — this is a risky pitch target.
- Dentist D (4.2 stars, 45 reviews, terrible website) → HOT. Strong pitch candidate despite not being a 4.8-star mega-practice. Correct — bad website is the opportunity.
- Dentist E (4.5 stars, decent website) → COOL. Good reviews but website is functional — weak pitch. Correct.

---

# 9. The 100-Website Dental Standard

## Purpose

Without industry benchmarks, Claude evaluates dental websites in a vacuum. A site that's "average for dental" might get rated as "fair" for all websites but is actually typical and not a strong pitch opportunity.

The 100-website standard gives Claude **calibration context**: what's normal, what's above average, and what's below average for dental specifically.

## Phase 1: Collect 100 URLs

Pull from existing discovered leads across multiple cities. Mix:

| Tier | Count | How to Select |
|------|-------|---------------|
| Clearly terrible sites | ~25 | Low review mentions of "bad website", old-looking thumbnails |
| Below average | ~25 | WordPress template feel, missing features |
| Average/typical | ~30 | Most dental sites fall here |
| Good/modern | ~20 | Clean, modern, has booking — these define the ceiling |

**Diversity requirements:**
- At least 10 different cities
- Mix of WordPress, Wix, Squarespace, custom-built
- Mix of solo practitioners and group practices

## Phase 2: Run Full Analysis on All 100

Run the complete pipeline (Puppeteer + PSI + Claude) on all 100 using the **generic prompt** (without the dental standard context, since we're building it).

Store all results in a separate `DentalStandard` collection or JSON file.

## Phase 3: Compute Benchmarks

From the 100 results, calculate:

**Visual benchmarks:**
```
Average visual category distribution:
  Poor: ??%  Fair: ??%  Good: ??%  Excellent: ??%

Average sub-score distributions:
  Design modernity: ??% poor, ??% fair, ??% good, ??% excellent
  ...for each of the 7 visual sub-scores

Average design era: e.g., "2015-2018"
Most common visual issues: [ranked list]
```

**Content benchmarks:**
```
For each of 12 content items:
  service_descriptions: ??% present (??% good, ??% basic, ??% poor)
  doctor_bios: ??% present
  patient_testimonials: ??% present
  online_booking: ??% present
  ...etc

Average items present: ??/12
Average content category: ??
Most commonly missing items: [ranked list]
```

**Technical benchmarks:**
```
Average PSI mobile performance: ??/100
Average load time: ??ms
HTTPS adoption: ??%
Average PSI accessibility: ??/100
```

## Phase 4: Build the Calibrated Prompt Context

Take the key findings and embed them as context in the analysis prompt. This becomes the `{DENTAL_STANDARD_CONTEXT}` block:

```
DENTAL INDUSTRY BENCHMARKS (based on analysis of 100 dental practice websites):

VISUAL QUALITY:
- {X}% of dental websites have "poor" visual quality
- {X}% have "fair" visual quality
- Only {X}% have "good" or "excellent" visual quality
- The average dental website design dates from approximately {year range}
- Most common visual issues: {top 5 issues}

CONTENT COVERAGE:
- Average dental website has {X} out of 12 critical content items
- Only {X}% have online booking capability
- Only {X}% display patient testimonials on their website
- {X}% have doctor bios with credentials and photos
- {X}% have before/after treatment photos
- Most commonly missing: {top 5 missing items}

TECHNICAL PERFORMANCE:
- Average mobile performance score: {X}/100
- Average page load time: {X} seconds
- {X}% have HTTPS enabled

Use these benchmarks to calibrate your ratings. A website that matches the average
should be rated "fair" — it is typical for the industry but represents an opportunity
for improvement. Only rate "good" or "excellent" for websites that are clearly above
the industry average.
```

## Phase 5: Define the "Ideal Dental Website" Reference

Beyond benchmarks, define what a **10/10 dental website** should have. This gives Claude an explicit ceiling:

```
THE IDEAL DENTAL WEBSITE (for reference):
- Modern 2024-2026 design with clean typography, ample whitespace, hero imagery
- Professional color palette with consistent brand identity
- Real photos of the office, staff, and patients (not stock photos)
- Prominent "Book Appointment" button above the fold
- Online scheduling integration (Zocdoc, Calendly, or custom)
- Patient testimonials prominently displayed
- Detailed service descriptions with educational content
- Doctor and team bios with credentials, photos, and personal touches
- Mobile-responsive with touch-friendly navigation
- Fast loading (<3 seconds on mobile)
- Before/after treatment gallery
- Insurance information clearly listed
- Office hours and location with embedded map
- Blog with dental health educational content
- Emergency contact information
```

## Maintenance

Refresh the 100-website standard every 6-12 months. Web design trends shift. What's "modern" in 2026 will be "dated" by 2028.

---

# 10. Job Queue System

## Architecture

```
┌──────────────────────────────────────────┐
│           EXPRESS BACKEND                  │
│                                          │
│  POST /api/analysis/start                │
│    → Creates BullMQ jobs                 │
│    → Returns jobGroupId                  │
│                                          │
│  GET /api/analysis/status/:groupId       │
│    → Returns progress: 12/45             │
│                                          │
│  GET /api/analysis/result/:leadId        │
│    → Returns analysis data               │
└────────────┬─────────────────────────────┘
             │ Adds jobs to queue
             ▼
┌──────────────────────────────────────────┐
│           REDIS                           │
│                                          │
│  Queue: "website-analysis"               │
│  Jobs: { leadId, websiteUrl, ... }       │
│                                          │
│  Job states:                             │
│  waiting → active → completed/failed     │
└────────────┬─────────────────────────────┘
             │ Workers pull jobs
             ▼
┌──────────────────────────────────────────┐
│         ANALYSIS WORKER(S)                │
│                                          │
│  Concurrency: 2-3                        │
│  Per job:                                │
│    1. Puppeteer → screenshots + text     │
│    2. PSI + Claude (parallel)            │
│    3. Score aggregation                  │
│    4. Cloudinary upload                  │
│    5. Update lead in MongoDB             │
│                                          │
│  Reports progress back to Redis          │
└──────────────────────────────────────────┘
```

## BullMQ Setup

```javascript
// queue.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL);

export const analysisQueue = new Queue('website-analysis', { connection });

// Worker processes jobs
const worker = new Worker('website-analysis', async (job) => {
  const { leadId, websiteUrl } = job.data;

  // Step 1: Puppeteer
  job.updateProgress({ step: 'puppeteer', percent: 10 });
  const puppeteerResult = await runPuppeteer(websiteUrl);

  // Step 2: PSI + Claude (parallel)
  job.updateProgress({ step: 'analysis', percent: 40 });
  const [psiResult, claudeResult] = await Promise.allSettled([
    runPSI(websiteUrl),
    runClaude(puppeteerResult.desktopScreenshot, puppeteerResult.mobileScreenshot, puppeteerResult.pageText, puppeteerResult.domChecks)
  ]);

  // Step 3: Score aggregation
  job.updateProgress({ step: 'scoring', percent: 80 });
  const scores = aggregateScores(psiResult, claudeResult);

  // Step 4: Cloudinary upload
  const screenshots = await uploadToCloudinary(puppeteerResult.desktopScreenshot, puppeteerResult.mobileScreenshot);

  // Step 5: Update lead in MongoDB
  job.updateProgress({ step: 'saving', percent: 95 });
  await updateLeadWithAnalysis(leadId, { ...scores, screenshots });

  return { leadId, success: true };
}, {
  connection,
  concurrency: Number(process.env.ANALYSIS_CONCURRENCY) || 2,
});
```

## Job Grouping

When the user clicks "Analyze All" on 45 leads, we create a job group:

```javascript
// Create a group ID to track the batch
const groupId = new ObjectId().toString();

// Add all jobs to the queue
const jobs = leadIds.map(leadId => ({
  name: 'analyze-website',
  data: { leadId, websiteUrl, groupId },
  opts: {
    attempts: 2,        // Retry once on failure
    backoff: { type: 'exponential', delay: 5000 },
    timeout: 120000,    // 2 minute hard timeout per job
    removeOnComplete: { age: 3600 },  // Clean up after 1 hour
    removeOnFail: { age: 86400 },     // Keep failed jobs for 24 hours
  }
}));

await analysisQueue.addBulk(jobs);
```

## Progress Tracking

The frontend polls for progress:

```
GET /api/analysis/status/:groupId

Response:
{
  "groupId": "abc123",
  "total": 45,
  "completed": 12,
  "failed": 1,
  "inProgress": 2,
  "waiting": 30,
  "failedLeads": [
    { "leadId": "xyz", "error": "Timeout after 20 seconds", "businessName": "..." }
  ]
}
```

**Polling interval:** Every 3 seconds. Use Server-Sent Events (SSE) or WebSocket for real-time updates in a future iteration.

---

# 11. Error Handling & Retry Logic

## Per-Lead Analysis States

Each lead gets an `analysisStatus` field during processing:

```
queued → processing → completed
                   → failed → retrying → completed
                                       → permanently_failed
```

## Failure Categories

### Puppeteer Failures (most common)

| Failure | Action | Retry? |
|---------|--------|--------|
| Navigation timeout (>20s) | Mark load time as 20000ms, take whatever screenshot loaded | No — partial data is better than no data |
| Page returns 404/500 | Mark as failed, skip analysis | No |
| SSL certificate error | Try HTTP fallback, mark isHttps=false | Once |
| Redirect loop | Mark as failed | No |
| Chrome crash / OOM | Restart browser, retry job | Once |
| Cookie banner blocks everything | Proceed anyway — Claude can still analyze partial content | No |

**Critical design decision:** For timeout cases, we **don't skip the lead**. A site that takes 20 seconds to load is actually a GREAT lead — that's a very pitchable problem. We capture whatever rendered and continue with the analysis. The PSI score will reflect the poor performance.

### PSI Failures (~5-15% of URLs)

| Failure | Action |
|---------|--------|
| 500 error (rate limit) | Retry with exponential backoff (5s, 10s, 20s) |
| Timeout | Set all PSI scores to null |
| URL blocked by WAF | Set all PSI scores to null |
| Any other error | Set all PSI scores to null |

**When PSI is null:** The website quality score formula redistributes weight: `(Visual × 0.60) + (Content × 0.40)`. Lead scoring gives 0 points for the technical weakness component (neutral — we don't know, so we don't penalize or reward).

### Claude Failures (rare, <1%)

| Failure | Action |
|---------|--------|
| Rate limit (429) | Retry with backoff |
| Invalid response (despite structured output) | Retry once |
| API down | Queue for later processing |

**If Claude fails permanently:** The lead cannot be scored. Mark as `analysis_failed` with reason. Allow manual retry from the UI.

## Browser Health Management

```javascript
// Restart browser every 50 jobs to prevent memory leaks
let jobsSinceRestart = 0;
let browser = await launchBrowser();

worker.on('completed', () => {
  jobsSinceRestart++;
  if (jobsSinceRestart >= 50) {
    browser.close();
    browser = launchBrowser();
    jobsSinceRestart = 0;
  }
});
```

---

# 12. API Endpoints

## New Routes

All routes require `authMiddleware`.

### Start Analysis

```
POST /api/analysis/start
Body: { leadIds: string[] }

Response: {
  groupId: string,
  totalJobs: number,
  message: "Analysis started for 45 leads"
}
```

Queues BullMQ jobs for each lead. Updates each lead's `analysisStatus` to "queued".

### Start Single Analysis

```
POST /api/analysis/start/:leadId

Response: {
  jobId: string,
  message: "Analysis started"
}
```

### Get Batch Status

```
GET /api/analysis/status/:groupId

Response: {
  groupId: string,
  total: number,
  completed: number,
  failed: number,
  inProgress: number,
  waiting: number,
  estimatedTimeRemaining: number (seconds),
  failedLeads: Array<{ leadId: string, businessName: string, error: string }>
}
```

### Retry Failed

```
POST /api/analysis/retry/:groupId

Response: {
  retriedCount: number,
  message: "Retrying 3 failed analyses"
}
```

Re-queues all failed leads from the batch.

### Cancel Batch

```
POST /api/analysis/cancel/:groupId

Response: {
  cancelledCount: number,
  message: "Cancelled 30 pending analyses"
}
```

Removes waiting jobs. Does NOT cancel in-progress jobs (they'll complete naturally).

---

# 13. Database Schema Changes

## Lead Model Updates

Add to the existing Lead schema:

```typescript
// New fields on ILead interface
interface ILead extends Document {
  // ... existing fields ...

  // Analysis tracking
  analyzed: boolean;              // Already added (from previous work)
  analysisStatus: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  analysisError?: string;         // Error message if failed
  analysisGroupId?: string;       // Batch group ID
  analyzedAt?: Date;              // When analysis completed

  // Website Quality Score (new — composite of visual + content + technical)
  websiteQualityScore?: number;   // 0-100

  // Lead Score (revised formula)
  leadScore?: number;             // 0-100 (was 0-90)
  leadCategory?: 'hot' | 'warm' | 'cool' | 'skip';

  // WebsiteAnalysis (already exists in schema — just needs population)
  websiteAnalysis?: IWebsiteAnalysis;
}
```

Update the Mongoose schema:

```javascript
// Add to leadSchema
analysisStatus: {
  type: String,
  enum: ['pending', 'queued', 'processing', 'completed', 'failed'],
  default: 'pending'
},
analysisError: { type: String },
analysisGroupId: { type: String },
analyzedAt: { type: Date },
websiteQualityScore: { type: Number },
```

New indexes:

```javascript
leadSchema.index({ analysisStatus: 1 });
leadSchema.index({ analysisGroupId: 1 });
leadSchema.index({ websiteQualityScore: -1 });
```

## Update IWebsiteAnalysis Interface

Align the existing `IWebsiteAnalysis` interface with the new categorical scoring:

```typescript
interface IWebsiteAnalysis {
  // PSI data
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  loadTimeMs: number;
  isHttps: boolean;
  coreWebVitals: {
    lcp: number | null;
    cls: number | null;
    tbt: number | null;
  };

  // Claude visual analysis (categorical)
  visualCategory: 'poor' | 'fair' | 'good' | 'excellent';
  visualSubScores: {
    designModernity: 'poor' | 'fair' | 'good' | 'excellent';
    colorScheme: 'poor' | 'fair' | 'good' | 'excellent';
    layoutQuality: 'poor' | 'fair' | 'good' | 'excellent';
    imageQuality: 'poor' | 'fair' | 'good' | 'excellent';
    ctaVisibility: 'poor' | 'fair' | 'good' | 'excellent';
    trustSignals: 'poor' | 'fair' | 'good' | 'excellent';
    mobileExperience: 'poor' | 'fair' | 'good' | 'excellent';
  };
  designEraEstimate: string;
  visualIssues: string[];

  // Claude content analysis
  contentCategory: 'poor' | 'fair' | 'good' | 'excellent';
  contentItems: {
    serviceDescriptions: { present: boolean; quality: string; note: string };
    doctorBios: { present: boolean; quality: string; note: string };
    patientTestimonials: { present: boolean; quality: string; note: string };
    onlineBooking: { present: boolean; note: string };
    contactInfo: { present: boolean; quality: string; note: string };
    insuranceInfo: { present: boolean; note: string };
    officeHours: { present: boolean; note: string };
    newPatientInfo: { present: boolean; note: string };
    beforeAfter: { present: boolean; note: string };
    blogContent: { present: boolean; note: string };
    emergencyInfo: { present: boolean; note: string };
    aboutPractice: { present: boolean; quality: string; note: string };
  };
  contentItemsPresentCount: number;
  criticalMissing: string[];

  // Combined
  issuesList: string[];
  oneLineSummary: string;

  // DOM checks
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

  // Screenshots (Cloudinary URLs)
  screenshots: {
    desktop: string;
    mobile: string;
  };

  analyzedAt: Date;
}
```

## New Collection: AnalysisGroup

Track batch analysis progress:

```typescript
interface IAnalysisGroup extends Document {
  groupId: string;
  leadIds: string[];
  totalLeads: number;
  completedCount: number;
  failedCount: number;
  status: 'running' | 'completed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  createdBy: string; // userEmail
}
```

---

# 14. Frontend UI Design

## Analyze Leads Page Updates

The existing `/dashboard/analyze-leads` page (already built) needs these additions:

### Analysis Progress Banner

When a batch analysis is running, show a progress banner at the top of the page:

```
┌──────────────────────────────────────────────────────────────┐
│  ⏳ Analyzing websites... 12 of 45 completed (2 failed)      │
│  ████████████░░░░░░░░░░░░░░░░░░  27%                        │
│  Estimated time remaining: ~8 minutes                        │
│                                                    [Cancel]  │
└──────────────────────────────────────────────────────────────┘
```

### "Analyze" Actions

Two ways to trigger analysis:

1. **Selected leads:** Select checkboxes → click "Analyze Selected" → queues selected leads
2. **All on page:** Click "Analyze All on Page" → queues all visible unanalyzed leads

### Lead Row Updates During Analysis

Each lead shows its analysis status inline:

```
⏳ Queued          (gray, waiting)
🔄 Analyzing...    (blue, spinner)
✅ Analyzed         (green, shows score badge)
❌ Failed           (red, shows retry button)
```

### Post-Analysis: Score Badges

After analysis, each lead row shows:

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☐ 📍 Dr. Smith's Family Dentistry          ⭐ 4.8   187 reviews    │
│      New York, NY                                                   │
│      Website: 16/100 🔴  Visual: Poor  Content: Poor               │
│      Lead Score: 97 🔥 HOT                           [View Detail] │
└─────────────────────────────────────────────────────────────────────┘
```

## Lead Detail Page — Analysis Tab

When clicking into a lead that's been analyzed, show a comprehensive analysis view:

### Section 1: Screenshots Side-by-Side

```
┌─────────────────────────────┬──────────────┐
│                             │              │
│    Desktop (1280x800)       │ Mobile       │
│    [Cloudinary image]       │ (390x844)    │
│                             │ [Cloudinary] │
│                             │              │
└─────────────────────────────┴──────────────┘
```

### Section 2: Score Overview

```
┌──────────────────────────────────────────────┐
│  Website Quality: 16/100 ████░░░░░░ TERRIBLE │
│                                              │
│  Visual Quality  ██░░░░░░░░░  Poor     (50%) │
│  Content Quality ██░░░░░░░░░  Poor     (30%) │
│  Technical       ███░░░░░░░░  22/100   (20%) │
│                                              │
│  Lead Score: 97/100  🔥 HOT                  │
│  Design Era: ~2012-2014                      │
└──────────────────────────────────────────────┘
```

### Section 3: Visual Breakdown

```
┌────────────────────────────────────────────┐
│  Design Modernity    Poor   ██░░░░░░░░░░  │
│  Color Scheme        Fair   ████░░░░░░░░  │
│  Layout Quality      Poor   ██░░░░░░░░░░  │
│  Image Quality       Poor   ██░░░░░░░░░░  │
│  CTA Visibility      Poor   ██░░░░░░░░░░  │
│  Trust Signals       Poor   ██░░░░░░░░░░  │
│  Mobile Experience   Poor   ██░░░░░░░░░░  │
└────────────────────────────────────────────┘
```

### Section 4: Content Checklist

```
┌────────────────────────────────────────────┐
│  ✅ Service Descriptions    Basic           │
│  ❌ Doctor Bios             Missing         │
│  ❌ Patient Testimonials    Missing         │
│  ❌ Online Booking          Missing         │
│  ✅ Contact Info            Good            │
│  ❌ Insurance Info          Missing         │
│  ✅ Office Hours            Basic           │
│  ❌ New Patient Info        Missing         │
│  ❌ Before/After            Missing         │
│  ❌ Blog Content            Missing         │
│  ❌ Emergency Info          Missing         │
│  ✅ About Practice          Basic           │
│                                            │
│  4 of 12 items present                     │
└────────────────────────────────────────────┘
```

### Section 5: Issues List (For Email)

```
┌────────────────────────────────────────────────────────────────┐
│  Issues Found:                                     [Copy All]  │
│                                                                │
│  1. Website takes 8.2 seconds to load on mobile               │
│  2. No online appointment booking system                       │
│  3. No patient testimonials displayed despite 4.8★ on Google  │
│  4. Doctor bios have no photos or credentials                  │
│  5. Not mobile-responsive — desktop layout on phones           │
│  6. Using severely outdated 2012-era design                    │
│                                                                │
│  Summary: "Severely outdated design with no mobile experience, │
│  missing online booking, and no patient testimonials despite   │
│  excellent Google reviews."                                    │
└────────────────────────────────────────────────────────────────┘
```

---

# 15. Cost Analysis

## Per-Lead Cost

| Component | Cost | Notes |
|-----------|------|-------|
| Puppeteer | $0 | Self-hosted |
| Google PSI API | $0 | Free (25K/day) |
| Claude Sonnet (Batch API) | $0.014 | 50% batch discount |
| Cloudinary (2 images) | ~$0.001 | Free tier covers 25GB |
| **Total per lead** | **~$0.015** | |

## Batch Costs

| Leads | Claude Cost | Total | Per Lead |
|-------|-------------|-------|----------|
| 50 | $0.70 | $0.75 | $0.015 |
| 100 | $1.40 | $1.50 | $0.015 |
| 500 | $7.00 | $7.50 | $0.015 |
| 1,000 | $14.00 | $15.00 | $0.015 |

## Monthly Infrastructure

| Item | Cost |
|------|------|
| VPS (4GB RAM, 2 vCPU) | $10-12/mo |
| Redis (Upstash free tier or local) | $0 |
| Cloudinary (free tier) | $0 |
| Google APIs (free tier) | $0 |
| Claude API (500 leads/mo) | $7.50/mo |
| **Total monthly** | **~$18-20/mo** |

## ROI Context

- Cost to analyze 100 leads: ~$1.50
- Cost to find one HOT lead (assuming 20% are HOT): ~$0.075
- Revenue from one converted HOT lead: $199
- **ROI: ~2,650x on analysis costs**

---

# 16. Implementation Phases

## Phase 1: Infrastructure Setup (Day 1-2)

**Goal:** Get the dependencies installed and basic infrastructure running.

- Install packages: `puppeteer`, `@ghostery/adblocker-puppeteer`, `@anthropic-ai/sdk`, `bullmq`, `ioredis`, `cloudinary`
- Set up Redis (local or Upstash free tier)
- Set up Cloudinary account and add env vars
- Verify Google PSI API works with existing Google API key
- Verify Anthropic API key works with SDK
- Create the BullMQ queue and a basic worker skeleton

**Deliverable:** All services connectable, basic job queued and processed (hello world level).

## Phase 2: Puppeteer Pipeline (Day 3-5)

**Goal:** Reliably screenshot and scrape dental websites.

- Build the Puppeteer service: launch, navigate, cookie handling, scroll, screenshot, text extract, DOM checks
- Test on 20 diverse dental websites manually
- Handle edge cases: timeouts, redirects, SSL errors
- Verify screenshot quality and text extraction

**Deliverable:** Given a URL, produces 2 screenshots + text + DOM checks reliably.

## Phase 3: PSI + Claude Integration (Day 6-8)

**Goal:** Get analysis data from external APIs.

- Build PSI service: API call, response parsing, error handling
- Build Claude service: prompt construction, structured output schema, response parsing
- Test combined: Puppeteer output → PSI + Claude → structured analysis data
- Build score aggregation logic (website quality score)
- Build lead scoring logic (lead score + category assignment)

**Deliverable:** Given a URL, produces a complete analysis with scores.

## Phase 4: Job Queue + API (Day 9-11)

**Goal:** Background processing with progress tracking.

- Wire up BullMQ workers with the analysis pipeline
- Build API endpoints: start, status, retry, cancel
- Build progress tracking (polling endpoint)
- Handle failures, retries, browser recycling
- Test batch processing of 50 leads

**Deliverable:** User can trigger analysis via API, track progress, see results.

## Phase 5: Frontend Integration (Day 12-14)

**Goal:** UI for triggering analysis and viewing results.

- Update Analyze Leads page with "Analyze" actions and progress banner
- Build analysis status indicators per lead row
- Build lead detail page analysis tab (screenshots, scores, issues)
- Wire up to the new API endpoints
- Add score/category badges to the leads list page

**Deliverable:** Complete end-to-end flow from UI.

## Phase 6: The 100-Website Standard (Day 15-18)

**Goal:** Calibrate the system with real dental website data.

- Collect 100 dental website URLs from existing leads
- Run full analysis on all 100
- Compute benchmarks and statistics
- Build the calibrated prompt context
- Re-run analysis on a sample to verify improved accuracy
- Adjust score thresholds if needed based on real data distribution

**Deliverable:** Calibrated prompt, validated scoring, ready for production use.

## Phase 7: Cloudinary + Polish (Day 19-20)

**Goal:** Final integrations and cleanup.

- Cloudinary screenshot upload integration
- Clean up error states in UI
- Add retry functionality for failed analyses
- Performance testing with 100-lead batch
- Documentation and deployment

**Deliverable:** Production-ready analysis system.

---

## Appendix: File Structure (New Files)

```
backend/
  src/
    services/
      puppeteerService.ts        ← Browser automation
      psiService.ts              ← Google PageSpeed Insights
      claudeAnalysisService.ts   ← Claude Vision + Text
      scoreService.ts            ← Score aggregation + lead scoring
      cloudinaryService.ts       ← Screenshot upload
    jobs/
      analysisQueue.ts           ← BullMQ queue definition
      analysisWorker.ts          ← Worker that processes jobs
    controllers/
      analysisController.ts      ← API endpoint handlers
    routes/
      analysisRoutes.ts          ← Route definitions
    prompts/
      analysisPrompt.ts          ← Claude prompt template
      dentalStandard.ts          ← 100-website benchmark data
```
