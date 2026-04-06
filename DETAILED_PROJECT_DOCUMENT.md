# DentalLeads - Detailed Project Document

> **Project:** Dentist Lead Generation Platform
> **Type:** Solo Micro-Agency Internal Tool
> **Owner:** Single Admin
> **Date:** April 2026

---

## Table of Contents

1. [Project Vision & Business Model](#1-project-vision--business-model)
2. [How the Entire System Works (End-to-End Flow)](#2-how-the-entire-system-works-end-to-end-flow)
3. [Stage 1: Dentist Discovery — Finding Clinics](#3-stage-1-dentist-discovery--finding-clinics)
4. [Stage 2: Website Analysis — AI-Powered Auditing](#4-stage-2-website-analysis--ai-powered-auditing)
5. [Stage 3: Lead Scoring — Finding the Gold](#5-stage-3-lead-scoring--finding-the-gold)
6. [Stage 4: Website Creation — Building the Bait](#6-stage-4-website-creation--building-the-bait)
7. [Stage 5: Email Outreach — Closing the Deal](#7-stage-5-email-outreach--closing-the-deal)
8. [Stage 6: Pipeline Management — Tracking Everything](#8-stage-6-pipeline-management--tracking-everything)
9. [Complete API & Tool Reference](#9-complete-api--tool-reference)
10. [Technical Architecture Deep Dive](#10-technical-architecture-deep-dive)
11. [Database Schema (Full Detail)](#11-database-schema-full-detail)
12. [Frontend Pages & UI Flows](#12-frontend-pages--ui-flows)
13. [Backend API Endpoints (Full Spec)](#13-backend-api-endpoints-full-spec)
14. [Job Queue System](#14-job-queue-system)
15. [Environment Variables & Configuration](#15-environment-variables--configuration)
16. [Cost Breakdown & ROI Analysis](#16-cost-breakdown--roi-analysis)
17. [Legal & Compliance](#17-legal--compliance)
18. [Implementation Roadmap](#18-implementation-roadmap)
19. [Risk Analysis & Mitigations](#19-risk-analysis--mitigations)
20. [Future Enhancements](#20-future-enhancements)

---

# 1. Project Vision & Business Model

## The Idea

You are a one-person micro-agency. You want to find dentist clinics that have **great Google reviews** (meaning they're good at dentistry) but **terrible websites** (meaning they're losing potential patients). You build them a beautiful, modern website for free and pitch it to them.

## The Pitch to Dentists

> "Hey Dr. Smith, I saw your practice has 4.8 stars on Google — your patients clearly love you. But when I looked at your website, honestly, it's not doing you justice. It's slow, not mobile-friendly, and doesn't have online booking.
>
> So I went ahead and designed a new one for you — here's a preview. You can have it for $0. You just prepay $199 for the first year of hosting and tech support. After that, it's $29/month."

## Revenue Model

| Item | Price | When |
|------|-------|------|
| Website design | $0 (free) | Upfront |
| Year 1 (hosting + tech support) | $199/year | Prepaid upfront |
| Year 2+ (hosting + tech support) | $29/month ($348/year) | Monthly recurring |

**Revenue math example:**
- 10 clients in month 1: $1,990 upfront
- 10 clients after year 1: $290/month recurring ($3,480/year)
- 50 clients after year 1: $1,450/month recurring ($17,400/year)

## Why This Works

1. **Dentists are local businesses** — they rely on their website to convert Google searchers into patients
2. **Most dental websites are outdated** — built 5-10 years ago, never updated
3. **Good reviews + bad website = money left on the table** — patients Google them, see the bad site, and go to a competitor
4. **$199/year is nothing for a dental practice** — they make $500-2,000 per patient visit
5. **You show them the new design before asking for money** — reduces friction massively

---

# 2. How the Entire System Works (End-to-End Flow)

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DENTALLEADS PLATFORM FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

  YOU (Admin)                    THE PLATFORM                     EXTERNAL APIS
  ──────────                     ────────────                     ─────────────

  1. Log in to dashboard ──────> Auth check (JWT)

  2. Enter "New York" ─────────> Search Request
                                      │
                                      ├──> Google Places API ──> "dentist in New York"
                                      │    Returns: 60 clinics with name, rating,
                                      │    reviews, website, phone, address
                                      │
                                      ├──> Filter: rating >= 3.5, has website,
                                      │    review count >= 10
                                      │
                                      └──> Store 45 qualified leads in MongoDB
                                           Status: DISCOVERED

  3. Click "Analyze All" ─────> Analysis Queue (Background Jobs)
                                      │
                                      │  For each lead's website URL:
                                      │
                                      ├──> Puppeteer: Visit site
                                      │    ├── Take desktop screenshot (1280x800)
                                      │    ├── Take mobile screenshot (375x812)
                                      │    ├── Extract all page text
                                      │    ├── Check SSL, load time
                                      │    └── Run Wappalyzer (detect tech stack)
                                      │
                                      ├──> Google PageSpeed Insights API:
                                      │    ├── Performance score (0-100)
                                      │    ├── SEO score (0-100)
                                      │    ├── Accessibility score (0-100)
                                      │    └── Best practices score (0-100)
                                      │
                                      ├──> Claude Vision API:
                                      │    ├── Analyze desktop + mobile screenshots
                                      │    ├── Rate: design, colors, layout, CTAs
                                      │    └── Return visual quality score + issues
                                      │
                                      ├──> Claude Text API:
                                      │    ├── Analyze extracted page content
                                      │    ├── Check: services, bios, testimonials,
                                      │    │   booking, contact info, insurance
                                      │    └── Return content quality score + gaps
                                      │
                                      ├──> Upload screenshots to Cloudinary
                                      │
                                      └──> Calculate Website Quality Score (0-100)
                                           Calculate Lead Score (0-90)
                                           Status: ANALYZED

  4. Review leads in table ───> Leads sorted by Lead Score
                                 HOT leads (70-90) shown first
                                 Red/Yellow/Green color coding
                                 Screenshot thumbnails visible

  5. Pick a HOT lead ─────────> Lead Detail Page shows:
                                 - Clinic info + Google data
                                 - Website screenshots (current)
                                 - All analysis scores
                                 - Specific issues found
                                 - Missing content items

  6. Find their email ────────> Email Discovery (Waterfall)
                                      │
                                      ├──> 1st: Scrape clinic's contact page
                                      ├──> 2nd: Hunter.io API (domain lookup)
                                      ├──> 3rd: Outscraper (Google profile)
                                      └──> 4th: Manual entry fallback
                                           Status: QUALIFIED

  7. Create new website ──────> DONE EXTERNALLY (will use Funnelstudio.ai)
     (outside the platform)      │
     Upload screenshot ────────> Store custom website URL + screenshot
                                  Status: WEBSITE_CREATED
                                  we will share the website url with client (it will be funnel studio link of that site)

  8. Send cold email ─────────> Email System
                                      │
                                      ├──> Load email template
                                      ├──> Replace variables:
                                      │    {practice_name}, {rating}, {city},
                                      │    {issues}, {screenshot_url}
                                      │
                                      ├──> Send via Instantly.ai API
                                      │    (or Smartlead)
                                      │
                                      └──> Log email in lead's history
                                           Status: EMAIL_SENT

  9. Track responses ─────────> Pipeline Board (Kanban)
                                 REPLIED → Schedule call
                                 CONVERTED → $199 collected!
                                 LOST → Move on

  10. View analytics ─────────> Dashboard shows:
                                 - Total leads discovered
                                 - Analysis completion rate
                                 - Emails sent / opened / replied
                                 - Conversion rate
                                 - Revenue tracking
```

## Step-by-Step User Journey (Detailed)

### Step 1: Admin Logs In
- Navigate to the platform URL
- Enter admin email + password
- JWT token issued, stored in localStorage
- Redirected to `/dashboard`

### Step 2: Search for Dentists
- Click "Search" in sidebar → `/dashboard/search`
- Enter a city name: "New York, NY"
- Optionally set: radius (miles), minimum rating, minimum reviews
- Click "Search Dentists"
- Loading spinner shows while Google Places API is queried
- Results appear: table of 40-60 dentist clinics
- Each row shows: name, address, rating (stars), review count, website URL
- Click "Save All as Leads" or cherry-pick specific ones
- Leads saved to database with status `DISCOVERED`

### Step 3: Analyze Websites
- Go to `/dashboard/leads`
- See all saved leads in a table
- Click "Analyze All" button (or analyze individual leads)
- A background job queue processes each lead:
  - Shows progress: "Analyzing 12/45..."
  - Each analysis takes ~30-60 seconds (PSI is the bottleneck)
  - Results populate in real-time as each completes
- After analysis, leads show:
  - Website Quality Score with color badge (red/yellow/green)
  - Lead Score with priority badge (HOT/WARM/COOL)
  - Thumbnail of their website screenshot

### Step 4: Review & Qualify Leads
- Sort leads by Lead Score (highest first)
- HOT leads (good reviews + bad website) are at the top
- Click on a lead to see full detail page:
  - Google data: name, address, phone, rating, review text
  - Website screenshots: side-by-side desktop + mobile
  - Analysis breakdown:
    - Performance: 23/100 (red) - "Site loads in 8.2 seconds"
    - SEO: 41/100 (orange) - "Missing meta descriptions"
    - Visual Quality: 2/10 - "Outdated 2012-era design, poor color scheme"
    - Content: 3/10 - "No online booking, no service descriptions"
    - Tech Stack: WordPress 4.9, jQuery 1.12 (severely outdated)
  - List of specific issues (used in email later):
    - "Website is not mobile-responsive"
    - "No online appointment booking"
    - "Pages load in 8+ seconds"
    - "No patient testimonials on homepage"
    - "Missing SSL certificate (HTTP only)"

### Step 5: Find Email
- On the lead detail page, click "Find Email"
- System tries waterfall:
  1. Scrapes their website's contact/about page for email addresses
  2. Queries Hunter.io with their domain
  3. Falls back to Outscraper Google profile scrape
  4. If all fail: shows manual entry field
- Found email displayed: `drsmith@brightsmilenyc.com`
- Lead status updates to `QUALIFIED`

### Step 6: Create Custom Website
- This is done OUTSIDE the platform using your preferred tool:
  - Framer, Webflow, WordPress + Elementor, or AI tools like v0.dev
  - You have 3-5 dental templates pre-built
  - Customize: clinic name, colors, services from their Google data
  - Takes ~20-30 minutes per clinic
- Back in the platform:
  - Enter the URL of the new website design
  - Upload or capture a screenshot of it
  - Platform stores both in the lead record
  - Status updates to `WEBSITE_CREATED`

### Step 7: Send Outreach Email
- On the lead detail page, click "Send Email"
- Select a template (or customize)
- Preview the email with all variables filled in:
  - Practice name, city, rating, review count
  - 3 specific website issues (auto-filled from analysis)
  - Screenshot of their new website embedded as image
  - Your pricing: $0 for the site, $199/year for hosting
- Click "Send"
- Email sent via Instantly.ai/Smartlead
- Logged in lead's email history
- Status updates to `EMAIL_SENT`

### Step 8: Follow Up
- Automated follow-up sequence (configured in Instantly.ai):
  - Day 4: Follow-up email
  - Day 9: Social proof email
  - Day 14: Break-up email
- Platform syncs email status (opened, replied, bounced)

### Step 9: Close the Deal
- When a dentist replies positively:
  - Update status to `REPLIED`
  - Schedule a call (tracked in notes)
  - Walk them through the design
  - Collect $199 payment
  - Update status to `CONVERTED`
- If no response or decline:
  - Update status to `LOST`
  - Add notes for why

### Step 10: Monitor Analytics
- Dashboard shows real-time stats:
  - "This month: 120 leads discovered, 95 analyzed, 42 qualified, 30 emailed, 8 replied, 3 converted"
  - Conversion funnel visualization
  - Revenue: $597 this month
  - Best performing cities
  - Average lead score of converted clients

---

# 3. Stage 1: Dentist Discovery — Finding Clinics

## What We Need

For every dentist clinic, we need to collect:

| Data Point | Source | Why We Need It |
|------------|--------|----------------|
| Business name | Google Places | To address them personally |
| Full address | Google Places | To know their location |
| City & State | Google Places | For filtering and email personalization |
| Phone number | Google Places | Alternative contact method |
| Website URL | Google Places | To analyze their website |
| Google Place ID | Google Places | Unique identifier for future lookups |
| Google Maps URL | Google Places | Link to their Google listing |
| Star rating (1-5) | Google Places | Core of our scoring system |
| Total review count | Google Places | Indicates business maturity |
| Top 5 reviews | Google Places | Understand patient sentiment |
| All reviews (optional) | Outscraper | Deeper analysis if needed |

## Google Places API (New) — Primary Tool

### What Is It?
Google's official API for searching businesses on Google Maps. The "New" version (released 2023-2024) uses a modern REST API with field masking to control costs.

### How to Set It Up
1. Go to Google Cloud Console (console.cloud.google.com)
2. Create a new project called "DentalLeads"
3. Enable the "Places API (New)" — NOT the old "Places API"
4. Go to Credentials → Create API Key
5. Restrict the key to "Places API (New)" only
6. Enable billing (required, but you get $200/month free credit)

### API Calls We Make

#### Call 1: Text Search — Find Dentists in a City

```
POST https://places.googleapis.com/v1/places:searchText

Headers:
  Content-Type: application/json
  X-Goog-Api-Key: YOUR_API_KEY
  X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,
                     places.rating,places.userRatingCount,places.websiteUri,
                     places.nationalPhoneNumber,places.googleMapsUri,
                     places.businessStatus,nextPageToken

Body:
{
  "textQuery": "dentist in New York, NY",
  "includedType": "dentist",
  "languageCode": "en",
  "maxResultCount": 20
}
```

**Response (example):**
```json
{
  "places": [
    {
      "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "displayName": { "text": "Bright Smile Dental NYC" },
      "formattedAddress": "123 Broadway, New York, NY 10001",
      "rating": 4.7,
      "userRatingCount": 234,
      "websiteUri": "https://brightsmilenyc.com",
      "nationalPhoneNumber": "(212) 555-0123",
      "googleMapsUri": "https://maps.google.com/?cid=...",
      "businessStatus": "OPERATIONAL"
    },
    // ... 19 more results
  ],
  "nextPageToken": "AeJbb3eLvl..."  // use this to get next 20 results
}
```

**Pagination:** To get more than 20 results, make the same call with `"pageToken": "AeJbb3eLvl..."`. You can get up to ~60 results total (3 pages of 20).

**Cost:** $32 per 1,000 requests (Text Search basic fields). With the $200/mo free credit, you get ~6,250 free search requests per month.

#### Call 2: Place Details — Get Reviews for Each Clinic

```
GET https://places.googleapis.com/v1/places/ChIJN1t_tDeuEmsRUsoyG83frY4

Headers:
  X-Goog-Api-Key: YOUR_API_KEY
  X-Goog-FieldMask: reviews
```

**Response (example):**
```json
{
  "reviews": [
    {
      "name": "places/ChIJ.../reviews/ChdDSUh...",
      "rating": 5,
      "text": {
        "text": "Dr. Smith is amazing! Best dental experience ever. The staff is friendly and the office is clean.",
        "languageCode": "en"
      },
      "originalText": { "text": "...", "languageCode": "en" },
      "authorAttribution": {
        "displayName": "Jane Doe",
        "photoUri": "https://lh3.googleusercontent.com/..."
      },
      "publishTime": "2026-02-15T10:30:00Z",
      "relativePublishTimeDescription": "2 months ago"
    },
    // ... up to 4 more reviews (max 5 total)
  ]
}
```

**Cost:** $25 per 1,000 requests (Place Details Advanced, because we request reviews).

**Important Limitation:** Google only returns a **maximum of 5 reviews** per place. This is a hard API limit.

### Our Search Strategy

For a single city search:
1. **1 Text Search call** → 20 results (page 1)
2. **1 Text Search call** → 20 results (page 2, using pageToken)
3. **1 Text Search call** → 20 results (page 3, using pageToken)
4. **60 Place Details calls** → reviews for each clinic

**Total API calls per city: 63 calls**
**Cost per city: ~$1.60** (well within free tier)

### Filtering Rules (Applied After Fetching)

We don't save every dentist as a lead. We filter:

```
KEEP if ALL of these are true:
  ✅ businessStatus = "OPERATIONAL" (still open)
  ✅ rating >= 3.5 stars (good reviews — our core premise)
  ✅ userRatingCount >= 10 (established, not brand new)
  ✅ websiteUri exists (can't analyze what doesn't exist)
  ✅ websiteUri is NOT just a Facebook page or Yelp listing

SKIP if ANY of these are true:
  ❌ rating < 3.5 (bad reviews — not a good pitch target)
  ❌ No website URL (nothing to critique/replace)
  ❌ Less than 10 reviews (too small/new)
  ❌ businessStatus = "CLOSED_TEMPORARILY" or "CLOSED_PERMANENTLY"
```

Typical conversion: 60 fetched → 35-45 saved as leads.

## Outscraper — Optional (For Full Reviews)

### When to Use It
- When you want ALL reviews for a clinic, not just 5
- When you need review sentiment analysis at scale
- Useful for creating more convincing pitches ("I read through your 150 reviews...")

### How It Works
```
POST https://api.app.outscraper.com/maps/reviews-v3

Body:
{
  "query": ["ChIJN1t_tDeuEmsRUsoyG83frY4"],  // Google Place ID
  "reviewsLimit": 100,
  "language": "en",
  "sort": "newest"
}
```

Returns ALL reviews (up to the limit you set) with full text, rating, date, and author info.

### Pricing
- $3 per 1,000 reviews extracted
- 100 free reviews/month on trial
- No monthly subscription — pay per use

### When NOT to Use It
- For initial discovery (Google Places API is sufficient)
- If you only need to know the overall rating (already in Google Places data)
- You really only need it if you want to do deep review analysis

---

# 4. Stage 2: Website Analysis — AI-Powered Auditing

This is the **core differentiator** of the platform. We automatically visit each dentist's website and generate a comprehensive quality report using multiple tools.

## The Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  WEBSITE ANALYSIS PIPELINE                    │
│                   (per website, ~30-60 sec)                   │
└─────────────────────────────────────────────────────────────┘

Input: Website URL (e.g., https://brightsmilenyc.com)
       │
       ▼
┌──────────────────────────────────────────┐
│  STEP 1: PUPPETEER BROWSER VISIT         │
│                                          │
│  1a. Navigate to URL                     │
│  1b. Wait for page to fully load         │
│  1c. Take DESKTOP screenshot (1280x800)  │
│  1d. Take MOBILE screenshot (375x812)    │
│  1e. Extract all visible text content    │
│  1f. Extract HTML meta tags              │
│  1g. Check if HTTPS (SSL)                │
│  1h. Measure page load time              │
│  1i. Run Wappalyzer tech detection       │
│  1j. Check for contact form              │
│  1k. Check for booking widget            │
│  1l. Count images, check for videos      │
│                                          │
│  Output: 2 screenshots (PNG)             │
│          Page text (string)              │
│          Meta data (object)              │
│          Tech stack (array)              │
│          Quick checks (object)           │
└──────────────┬───────────────────────────┘
               │
       ┌───────┼───────────┐
       ▼       ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────────────┐
│ STEP 2:  │ │ STEP 3:  │ │ STEP 4:          │
│ GOOGLE   │ │ CLAUDE   │ │ CLAUDE           │
│ PSI API  │ │ VISION   │ │ TEXT ANALYSIS     │
│          │ │ API      │ │                  │
│ Send URL │ │ Send     │ │ Send extracted   │
│          │ │ desktop  │ │ page text        │
│ Returns: │ │ +mobile  │ │                  │
│ -Perf    │ │ shots    │ │ Returns:         │
│  score   │ │          │ │ -Content score   │
│ -SEO     │ │ Returns: │ │ -Missing items   │
│  score   │ │ -Visual  │ │ -Dental-specific │
│ -A11y    │ │  score   │ │  gaps            │
│  score   │ │ -Design  │ │ -Recommendations │
│ -Best    │ │  issues  │ │                  │
│  pract.  │ │ -Modern- │ │                  │
│ -CWV     │ │  ity     │ │                  │
│  metrics │ │  rating  │ │                  │
└────┬─────┘ └────┬─────┘ └────────┬─────────┘
     │            │                │
     └────────────┼────────────────┘
                  ▼
     ┌────────────────────────────┐
     │  STEP 5: SCORE AGGREGATION │
     │                            │
     │  Combine all scores into:  │
     │  - Website Quality Score   │
     │  - Issue list              │
     │  - Category breakdowns     │
     │  - Improvement suggestions │
     │                            │
     │  Upload screenshots to     │
     │  Cloudinary/S3             │
     │                            │
     │  Save everything to        │
     │  lead's MongoDB document   │
     └────────────────────────────┘
```

## Step 1: Puppeteer — Browser Automation

### What Is Puppeteer?
A Node.js library that controls a headless Chrome browser. It can navigate to any URL, take screenshots, extract text, click buttons, and more — just like a real user visiting the site.

### What We Do With It

**1a-1b. Visit the site and wait for load:**
```javascript
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// Set desktop viewport
await page.setViewport({ width: 1280, height: 800 });

// Navigate and wait for network to be idle (page fully loaded)
const startTime = Date.now();
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
const loadTime = Date.now() - startTime; // e.g., 3200ms
```

**1c. Desktop screenshot:**
```javascript
const desktopScreenshot = await page.screenshot({
  fullPage: true,
  type: 'png'
});
// Returns a Buffer (PNG image data)
```

**1d. Mobile screenshot:**
```javascript
// Switch to mobile viewport (iPhone 14 size)
await page.setViewport({ width: 375, height: 812, isMobile: true });
await page.reload({ waitUntil: 'networkidle2' });
const mobileScreenshot = await page.screenshot({
  fullPage: true,
  type: 'png'
});
```

**1e. Extract all visible text:**
```javascript
const pageText = await page.evaluate(() => document.body.innerText);
// Returns: "Welcome to Bright Smile Dental\nOur Services\nTeeth Cleaning..."
```

**1f. Extract meta tags:**
```javascript
const metaData = await page.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
  viewport: document.querySelector('meta[name="viewport"]')?.content,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
}));
```

**1g. Check SSL:**
```javascript
const isHTTPS = page.url().startsWith('https://');
```

**1h. Load time:** Already measured in step 1b.

**1i. Tech detection with Wappalyzer:**
```javascript
const Wappalyzer = require('wappalyzer');
const wappalyzer = new Wappalyzer();
const site = await wappalyzer.open(url);
const results = await site.analyze();
// Returns: { technologies: [
//   { name: "WordPress", version: "5.2", categories: ["CMS"] },
//   { name: "jQuery", version: "1.12.4", categories: ["JavaScript libraries"] },
//   { name: "PHP", version: "7.2", categories: ["Programming languages"] },
//   { name: "Google Analytics", categories: ["Analytics"] }
// ]}
```

**1j-1l. Quick DOM checks:**
```javascript
const quickChecks = await page.evaluate(() => ({
  hasContactForm: !!document.querySelector('form'),
  hasPhoneLink: !!document.querySelector('a[href^="tel:"]'),
  hasEmailLink: !!document.querySelector('a[href^="mailto:"]'),
  hasBookingWidget: !!document.querySelector(
    '[class*="book"], [class*="appointment"], [id*="book"], iframe[src*="booking"]'
  ),
  imageCount: document.querySelectorAll('img').length,
  hasVideo: !!document.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]'),
  hasGoogleMap: !!document.querySelector('iframe[src*="google.com/maps"]'),
  hasSocialLinks: !!document.querySelector(
    'a[href*="facebook.com"], a[href*="instagram.com"], a[href*="twitter.com"]'
  ),
  navigationItemCount: document.querySelectorAll('nav a, header a').length,
  hasSchemaMarkup: !!document.querySelector('script[type="application/ld+json"]'),
}));
```

### Puppeteer Infrastructure

**Option A: Run on your backend server (recommended for starting)**
- Install: `npm install puppeteer`
- Puppeteer downloads Chromium (~280MB) automatically
- Works on any Linux/Mac server
- Memory: needs ~500MB per browser instance
- Process 2-3 websites concurrently max

**Option B: Run on a dedicated VPS (recommended for scale)**
- DigitalOcean Droplet: $20/month (4GB RAM, 2 vCPU)
- Can process 5-10 websites concurrently
- Better isolation from your main backend

**Cost: $0 (runs on your server) to $20/month (dedicated VPS)**

## Step 2: Google PageSpeed Insights API

### What Is It?
Google's free API that runs Lighthouse audits on any URL. Returns performance, SEO, accessibility, and best practices scores (0-100 each), plus specific audit details.

### How to Set It Up
1. Go to Google Cloud Console
2. Enable "PageSpeed Insights API"
3. Use the same API key from Places API (or create a new one)
4. **No billing required** — this API is completely free

### The API Call

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url=https://brightsmilenyc.com
  &key=YOUR_API_KEY
  &category=performance
  &category=seo
  &category=accessibility
  &category=best-practices
  &strategy=mobile
```

**Response (key fields):**
```json
{
  "lighthouseResult": {
    "categories": {
      "performance": {
        "score": 0.23,
        "title": "Performance"
      },
      "seo": {
        "score": 0.67,
        "title": "SEO"
      },
      "accessibility": {
        "score": 0.45,
        "title": "Accessibility"
      },
      "best-practices": {
        "score": 0.56,
        "title": "Best Practices"
      }
    },
    "audits": {
      "first-contentful-paint": {
        "score": 0.1,
        "displayValue": "5.2 s"
      },
      "largest-contentful-paint": {
        "score": 0.05,
        "displayValue": "12.1 s"
      },
      "cumulative-layout-shift": {
        "score": 0.8,
        "displayValue": "0.05"
      },
      "meta-description": {
        "score": 0,
        "title": "Document does not have a meta description"
      },
      "image-alt": {
        "score": 0,
        "title": "Image elements do not have [alt] attributes"
      }
    }
  }
}
```

**What we extract:**
- `performance.score * 100` → Performance score (e.g., 23/100)
- `seo.score * 100` → SEO score (e.g., 67/100)
- `accessibility.score * 100` → Accessibility score (e.g., 45/100)
- `best-practices.score * 100` → Best Practices score (e.g., 56/100)
- Individual audit failures → specific issues list

**Important notes:**
- Each call takes **10-30 seconds** (it actually loads and audits the page)
- Rate limit: ~25,000 requests/day (very generous)
- Run for both `strategy=mobile` AND `strategy=desktop` to compare
- **Cost: Completely FREE**

## Step 3: Claude Vision API — Visual Quality Analysis

### What Is It?
Anthropic's Claude AI can analyze images. We send it the website screenshots and ask it to evaluate the visual design quality, like a human web designer would.

### Why This Is the Key Differentiator
No other automated tool can judge "does this website LOOK outdated and unprofessional?" Only an AI with vision capabilities can assess:
- Is this a 2010-era design or a modern 2025 design?
- Are the colors professional or garish?
- Is the layout clean or cluttered?
- Are there trust signals visible?
- Does it look like a template or custom-designed?

### How to Set It Up
1. Go to console.anthropic.com
2. Create an account and add billing
3. Generate an API key
4. Install: `npm install @anthropic-ai/sdk`

### The API Call

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: 'YOUR_API_KEY' });

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',  // Good balance of quality and cost
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: desktopScreenshotBase64  // from Puppeteer
        }
      },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: mobileScreenshotBase64  // from Puppeteer
        }
      },
      {
        type: 'text',
        text: `You are a professional web design auditor specializing in dental practice websites.

Analyze these two screenshots (first is desktop view, second is mobile view) of a dentist's website.

Rate each category from 1-10 (1 = terrible, 10 = excellent):

1. DESIGN_MODERNITY: Does it look current (2024-2026 design trends) or outdated (pre-2018)?
   - Modern indicators: clean typography, ample whitespace, hero sections, card layouts
   - Outdated indicators: small text, busy layouts, gradient buttons, Flash-era aesthetics, clip art

2. COLOR_SCHEME: Are the colors professional and cohesive?
   - Good: consistent brand colors, professional palette, good contrast
   - Bad: too many colors, neon/garish tones, poor contrast, clashing colors

3. LAYOUT_QUALITY: Is the layout organized and easy to navigate?
   - Good: clear hierarchy, logical flow, proper spacing, grid-based
   - Bad: cluttered, no visual hierarchy, cramped elements, inconsistent spacing

4. IMAGE_QUALITY: Are images professional?
   - Good: real office/staff photos, high resolution, properly sized
   - Bad: stock photos, low resolution, stretched/pixelated, clip art

5. CTA_VISIBILITY: Are calls-to-action prominent?
   - Good: clear "Book Appointment" button, phone number visible, contact options
   - Bad: no clear next step, buried contact info, no booking option

6. TRUST_SIGNALS: Does the site build confidence?
   - Good: patient reviews, certifications, awards, team photos, before/after
   - Bad: no social proof, anonymous feel, no credentials shown

7. MOBILE_EXPERIENCE: How does the mobile version look?
   - Good: responsive layout, touch-friendly buttons, readable text
   - Bad: desktop layout on mobile, tiny text, horizontal scrolling

Return your response as JSON:
{
  "scores": {
    "design_modernity": <number>,
    "color_scheme": <number>,
    "layout_quality": <number>,
    "image_quality": <number>,
    "cta_visibility": <number>,
    "trust_signals": <number>,
    "mobile_experience": <number>
  },
  "overall_visual_score": <number 1-10>,
  "design_era_estimate": "<e.g., '2012-2015' or '2022-2024'>",
  "top_3_issues": [
    "<specific visual issue 1>",
    "<specific visual issue 2>",
    "<specific visual issue 3>"
  ],
  "one_line_summary": "<e.g., 'Severely outdated design with poor mobile experience and no clear booking CTA'>"
}`
      }
    ]
  }]
});

const analysis = JSON.parse(response.content[0].text);
```

### Cost Calculation
- Claude Sonnet 4.6: ~$3/million input tokens, ~$15/million output tokens
- 2 screenshots ≈ ~2,000 input tokens
- Text prompt ≈ ~500 input tokens
- JSON response ≈ ~300 output tokens
- **Cost per analysis: ~$0.005-0.01**
- **500 websites/month: ~$2.50-5.00**

## Step 4: Claude Text API — Content Quality Analysis

### What We Do
Send the extracted page text (from Puppeteer) to Claude and ask it to evaluate the dental-specific content quality.

### The API Call

```javascript
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `You are a dental practice marketing expert. Analyze this dental website's text content and evaluate its quality.

WEBSITE TEXT CONTENT:
---
${pageText}
---

ADDITIONAL INFO:
- Has contact form: ${quickChecks.hasContactForm}
- Has phone link: ${quickChecks.hasPhoneLink}
- Has booking widget: ${quickChecks.hasBookingWidget}
- Has Google Map: ${quickChecks.hasGoogleMap}
- Image count: ${quickChecks.imageCount}
- Has social links: ${quickChecks.hasSocialLinks}

Evaluate these content areas (present = true, missing = false):

1. SERVICE_DESCRIPTIONS: Are dental services listed with descriptions?
   (cleanings, fillings, crowns, implants, cosmetic, orthodontics, emergency, pediatric)
2. DOCTOR_BIOS: Are there doctor/team bios with credentials and photos?
3. PATIENT_TESTIMONIALS: Are there patient reviews or testimonials on the site?
4. ONLINE_BOOKING: Is there online appointment scheduling?
5. CONTACT_INFO: Is contact information prominently displayed (phone, address, email)?
6. INSURANCE_INFO: Is insurance/payment information provided?
7. OFFICE_HOURS: Are office hours clearly listed?
8. NEW_PATIENT_INFO: Is there a new patient section or special offers?
9. BEFORE_AFTER: Are there before/after treatment photos?
10. BLOG_CONTENT: Is there educational blog content?
11. EMERGENCY_INFO: Is emergency dental care information available?
12. ABOUT_PRACTICE: Is there an about section describing the practice's philosophy?

Return JSON:
{
  "content_items": {
    "service_descriptions": { "present": <bool>, "quality": "<good|basic|poor|missing>", "note": "<detail>" },
    "doctor_bios": { "present": <bool>, "quality": "<good|basic|poor|missing>", "note": "<detail>" },
    "patient_testimonials": { "present": <bool>, "quality": "<good|basic|poor|missing>", "note": "<detail>" },
    "online_booking": { "present": <bool>, "note": "<detail>" },
    "contact_info": { "present": <bool>, "quality": "<good|basic|poor|missing>", "note": "<detail>" },
    "insurance_info": { "present": <bool>, "note": "<detail>" },
    "office_hours": { "present": <bool>, "note": "<detail>" },
    "new_patient_info": { "present": <bool>, "note": "<detail>" },
    "before_after": { "present": <bool>, "note": "<detail>" },
    "blog_content": { "present": <bool>, "note": "<detail>" },
    "emergency_info": { "present": <bool>, "note": "<detail>" },
    "about_practice": { "present": <bool>, "quality": "<good|basic|poor|missing>", "note": "<detail>" }
  },
  "content_score": <number 1-10>,
  "items_present_count": <number out of 12>,
  "critical_missing": ["<list of most important missing items>"],
  "content_quality_summary": "<one line summary>"
}`
  }]
});
```

### Cost: ~$0.002 per analysis (text is cheaper than images)

## Step 5: Score Aggregation

### Website Quality Score Formula

```
Website Quality Score (0-100) = weighted average of:

  Technical Health (25%):
    = (PSI_performance + PSI_seo + PSI_accessibility + PSI_best_practices) / 4
    Already on 0-100 scale from Google PSI

  Visual Quality (35%):
    = Claude Vision overall_visual_score * 10
    Converted from 1-10 to 0-100 scale

  Content Quality (25%):
    = Claude Text content_score * 10
    Converted from 1-10 to 0-100 scale

  Technology Stack (15%):
    Scoring rules:
    - WordPress < v5.0         → 10/100
    - WordPress 5.0-5.9        → 40/100
    - WordPress 6.0+           → 60/100
    - Wix/Squarespace          → 50/100 (template, likely basic)
    - React/Next/Vue based     → 80/100 (modern)
    - No CMS detected + jQuery → 20/100 (likely ancient custom)
    - No CMS + modern JS       → 70/100
    - Has HTTPS                → +10 bonus
    - Has Google Analytics     → +5 bonus
    - No viewport meta tag     → -20 penalty

FINAL SCORE = (Technical * 0.25) + (Visual * 0.35) + (Content * 0.25) + (Tech * 0.15)
```

### Score Interpretation

| Score | Label | Color | What It Means | Action |
|-------|-------|-------|---------------|--------|
| 0-30 | TERRIBLE | Red | Website is truly awful. Major opportunity. | HIGH priority lead |
| 31-50 | POOR | Orange | Website has significant problems. | GOOD lead |
| 51-70 | AVERAGE | Yellow | Website is mediocre but functional. | MODERATE lead |
| 71-85 | GOOD | Light Green | Website is decent. Not much to pitch. | LOW priority |
| 86-100 | EXCELLENT | Green | Website is modern and well-built. | SKIP |

### Issues List (For Email Personalization)

The analysis generates a human-readable issues list. Examples:

```json
{
  "issues": [
    "Website loads in 8.2 seconds (should be under 3 seconds)",
    "Not mobile-responsive — desktop layout shown on phones",
    "No online appointment booking system",
    "Missing SSL certificate (shows 'Not Secure' warning)",
    "No patient testimonials or reviews displayed",
    "Doctor bios have no photos or credentials listed",
    "Using WordPress 4.9 (released 2017, security risk)",
    "No service descriptions — just a list of names",
    "Missing meta description (hurts Google rankings)",
    "Stock photos instead of real office/staff images"
  ]
}
```

These issues are used later in the email: "I noticed your website has [issue_1], [issue_2], and [issue_3]."

---

# 5. Stage 3: Lead Scoring — Finding the Gold

## The Core Insight

The best leads are dentists where:
- **High Google rating** = They're good at what they do → patients love them
- **High review count** = They're established → can afford $199
- **Low website score** = Their website sucks → we can help

## Lead Score Formula

```
LEAD SCORE (0-90 scale)

Component 1: Google Rating (max 30 points)
  rating >= 4.5  → 30 points  (excellent reputation)
  rating >= 4.0  → 25 points  (very good)
  rating >= 3.5  → 15 points  (good)
  rating < 3.5   → 0 points   (filtered out earlier)

Component 2: Review Volume (max 20 points)
  reviews >= 100 → 20 points  (very established)
  reviews >= 50  → 15 points  (established)
  reviews >= 20  → 10 points  (growing)
  reviews >= 10  → 5 points   (minimum threshold)

Component 3: Website Badness (max 40 points) — INVERTED
  website score 0-20   → 40 points  (terrible = great opportunity)
  website score 21-35  → 30 points  (poor = good opportunity)
  website score 36-50  → 20 points  (below average = decent opportunity)
  website score 51-65  → 10 points  (average = small opportunity)
  website score 66-100 → 0 points   (good/excellent = no opportunity)

TOTAL LEAD SCORE = Component 1 + Component 2 + Component 3
```

### Lead Categories

| Lead Score | Category | Badge Color | Meaning |
|------------|----------|-------------|---------|
| 75-90 | HOT | Red badge | Perfect target — great reviews, terrible website. Priority outreach. |
| 55-74 | WARM | Orange badge | Good target — decent reviews, bad website. Worth pursuing. |
| 35-54 | COOL | Blue badge | Possible target — some opportunity. Lower priority. |
| 0-34 | SKIP | Gray badge | Not worth pursuing — website is okay or reviews are weak. |

### Example Leads

**HOT Lead (Score: 85):**
- "Dr. Smith's Family Dentistry" — 4.8 stars, 187 reviews
- Website score: 18/100 (terrible)
- Issues: No SSL, loads in 12 seconds, WordPress 4.2, no mobile responsiveness
- Breakdown: 30 (rating) + 20 (reviews) + 40 (bad website) = **90**

**WARM Lead (Score: 60):**
- "Manhattan Dental Arts" — 4.2 stars, 56 reviews
- Website score: 38/100 (poor)
- Issues: Slow loading, outdated design, no online booking
- Breakdown: 25 (rating) + 15 (reviews) + 20 (bad website) = **60**

**SKIP (Score: 25):**
- "NYC Smiles Clinic" — 4.0 stars, 32 reviews
- Website score: 72/100 (good)
- Modern Wix site, decent design, has booking
- Breakdown: 25 (rating) + 10 (reviews) + 0 (good website) = **35**

---

# 6. Stage 4: Website Creation — Building the Bait

## Overview

This step happens **outside the platform** — you manually create a beautiful replacement website for the dentist using your preferred design tool. The platform stores the result.

## Recommended Design Tools

### Option A: Framer (Recommended)
- Visual website builder with modern templates
- Perfect for creating polished dental websites fast
- Free plan available, Pro at $10/month
- Publish to a Framer subdomain (free) or custom domain
- **Why it's best:** Modern design output, fast workflow, looks premium

### Option B: v0.dev / Bolt / Lovable (AI-Powered)
- AI generates the website from a text prompt
- "Create a modern dental practice website for Dr. Smith in New York with a hero section, services, testimonials, and booking CTA"
- Gets you 80% there in minutes
- Finish with manual tweaks
- **Why it's good:** Extremely fast for generating initial designs

### Option C: WordPress + Elementor
- Most dentists already have WordPress hosting available
- Elementor templates for dental practices
- Full CMS with blog, forms, booking plugins
- **Why it's good:** Easiest to hand off to the client for future updates

### Option D: Webflow
- Professional visual builder
- Modern output, no code needed
- Templates available for dental/medical
- Free plan with Webflow subdomain
- **Why it's good:** Professional output, good for ongoing maintenance

## Workflow

1. Open the lead detail page in your platform
2. Note the practice name, location, services (from content analysis), and brand vibe
3. Open your design tool (Framer/v0/etc.)
4. Use a dental template or generate one with AI
5. Customize:
   - Practice name and logo (if they have one)
   - Location and contact info
   - Services (pulled from their Google listing and website analysis)
   - Color scheme (professional, dental-appropriate)
   - Hero section with a strong CTA ("Book Your Appointment")
   - Testimonials section (you can reference their Google reviews)
6. Publish to a preview URL
7. Take a full-page screenshot (or use the tool's preview feature)
8. Back in your platform:
   - Enter the preview URL
   - Upload the screenshot
   - Lead status changes to `WEBSITE_CREATED`

## Design Tips That Convert

- **Always include:** Hero with CTA, services section, testimonials, doctor bio, contact/map, footer
- **Make it mobile-first** — most people Google dentists on their phone
- **Use their Google reviews** as testimonials on the new site
- **Color palette:** Professional blues, greens, or whites (trustworthy colors for healthcare)
- **Include a "Book Online" button** — this is what most old dental sites lack
- **Show a before/after** in your pitch email — screenshot of their old site vs. your new design

---

# 7. Stage 5: Email Outreach — Closing the Deal

## Email Discovery (Finding Their Email)

### The Waterfall Approach

We try multiple sources in order, stopping at the first success:

```
┌──────────────────────────────────────────────────┐
│          EMAIL DISCOVERY WATERFALL                 │
│                                                    │
│  Source 1: Scrape their website (FREE)             │
│     └── Visit contact page with Puppeteer          │
│     └── Regex: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+  │
│     └── Found? → Done!                             │
│     └── Not found? → Try Source 2                  │
│                                                    │
│  Source 2: Hunter.io API ($34/mo)                  │
│     └── GET /v2/domain-search?domain=example.com   │
│     └── Returns emails associated with domain      │
│     └── Found? → Done!                             │
│     └── Not found? → Try Source 3                  │
│                                                    │
│  Source 3: Outscraper ($2/1K lookups)              │
│     └── Scrape Google Business profile for email   │
│     └── Found? → Done!                             │
│     └── Not found? → Try Source 4                  │
│                                                    │
│  Source 4: Manual Entry                            │
│     └── Show "Email not found" in UI               │
│     └── Admin enters email manually                │
│     └── (From Google Maps listing, calling, etc.)  │
│                                                    │
│  Expected success rate with waterfall: ~70-80%     │
└──────────────────────────────────────────────────┘
```

### Hunter.io API Detail

**Setup:**
1. Register at hunter.io
2. Get API key from dashboard
3. Free plan: 25 searches/month, 50 verifications/month
4. Starter plan: $34/month for 500 searches

**API Call:**
```
GET https://api.hunter.io/v2/domain-search
  ?domain=brightsmilenyc.com
  &api_key=YOUR_KEY
```

**Response:**
```json
{
  "data": {
    "domain": "brightsmilenyc.com",
    "emails": [
      {
        "value": "info@brightsmilenyc.com",
        "type": "generic",
        "confidence": 91
      },
      {
        "value": "drsmith@brightsmilenyc.com",
        "type": "personal",
        "confidence": 76
      }
    ]
  }
}
```

**Strategy:** Prefer personal emails (drsmith@) over generic (info@). Higher confidence = more reliable.

### Email Verification

Before sending, verify the email is real:

**Hunter.io Verification:**
```
GET https://api.hunter.io/v2/email-verifier
  ?email=drsmith@brightsmilenyc.com
  &api_key=YOUR_KEY
```

Returns: `deliverable`, `risky`, or `undeliverable`. Only send to `deliverable`.

## Sending Cold Emails

### Recommended Platform: Instantly.ai

**Why Instantly.ai:**
- Built specifically for cold email
- Unlimited email accounts and warmup on all plans
- Inbox rotation (sends from different accounts automatically)
- Built-in warmup (gets your emails to inbox, not spam)
- Campaign analytics (open rates, reply rates)
- $37/month (Growth plan)

**Alternative: Smartlead** — Similar features at $39/month, good for agencies.

### Email Infrastructure Setup (CRITICAL)

```
DO NOT send cold emails from your main domain!

You need:
├── 3-5 separate domains for outreach
│   ├── getsmiledesigns.com
│   ├── dentalwebpros.com
│   ├── moderndentalsite.com
│   ├── smilemakeover.io
│   └── dentalpracticedesign.com
│
├── 2-3 Google Workspace inboxes per domain
│   ├── hello@getsmiledesigns.com
│   ├── team@getsmiledesigns.com
│   └── support@getsmiledesigns.com
│   (repeat for each domain)
│
├── DNS records for EACH domain
│   ├── SPF record (who can send email from this domain)
│   ├── DKIM record (email signature verification)
│   └── DMARC record (what to do with failed auth)
│
└── Warmup period: 2-4 weeks before first real send
    ├── Week 1: 5 emails/day per inbox (all warmup)
    ├── Week 2: 10 emails/day per inbox
    ├── Week 3: 15 emails/day per inbox
    └── Week 4+: 20-30 emails/day per inbox (start real sends)
```

**Capacity after warmup:**
```
5 domains × 3 inboxes × 25 emails/day = 375 emails/day
375 × 22 working days = 8,250 emails/month
```

### Email Templates

#### Initial Outreach (Day 1)

**Subject:** Quick question about {practice_name}'s website

```
Hi {first_name},

I was looking up top-rated dentists in {city} and came across
{practice_name}. {rating} stars across {review_count} reviews —
your patients clearly love what you do.

I took a look at your website though, and noticed a few things
that might be costing you new patients:

• {issue_1}
• {issue_2}
• {issue_3}

I actually went ahead and mocked up a modern replacement for you
— no obligation, I just enjoy doing these:

[EMBEDDED SCREENSHOT OF NEW WEBSITE DESIGN]

You can see the full preview here: {preview_url}

If you'd like to use it, the site is free — you'd just cover
hosting at $199 for the first year (includes tech support).
After that it's $29/month.

Worth a quick 10-minute chat this week?

{your_name}
{your_business_name}
{physical_address}

[Unsubscribe]
```

#### Follow-Up 1 (Day 4)

**Subject:** Re: Quick question about {practice_name}'s website

```
Hi {first_name},

Just floating this back to the top in case it got buried.

I designed a modern website for {practice_name} — mobile-friendly,
fast-loading, with online booking built in.

Here's the preview again: {preview_url}

Happy to walk you through it on a quick call. When works best?

{your_name}
```

#### Follow-Up 2 (Day 9)

**Subject:** Other dentists in {city} are already switching

```
Hi {first_name},

Quick update — I've been helping dental practices in {city} upgrade
their websites, and the feedback has been great.

I still have the custom design I put together for {practice_name}.
It's sitting ready to go whenever you are.

The offer still stands: $0 for the site itself, just $199/year for
hosting and support.

Should I send over a few time slots for a walkthrough?

{your_name}
```

#### Break-Up Email (Day 14)

**Subject:** Should I close your file?

```
Hi {first_name},

I don't want to be a bother, so this will be my last note.

I put together a custom website redesign for {practice_name} and
I wanted to make sure you had the chance to see it:

{preview_url}

If the timing isn't right, no worries at all. Just reply "not now"
and I'll check back in a few months.

Otherwise, I'll close this out on my end.

All the best,
{your_name}
```

### Embedding the Website Screenshot in Emails

```
1. Screenshot the new website design (from Framer/v0/etc.)
   └── Full page, 1200px wide, PNG format

2. Upload to Cloudinary (or S3)
   └── Gets a public URL:
       https://res.cloudinary.com/yourname/image/upload/v123/lead_456_new_site.png

3. In the HTML email template, embed as:
   <img
     src="https://res.cloudinary.com/yourname/image/upload/v123/lead_456_new_site.png"
     alt="New website design for Bright Smile Dental"
     width="600"
     style="max-width: 100%; border: 1px solid #e0e0e0; border-radius: 8px;"
   />

4. IMPORTANT: Some email clients block images by default.
   Always write compelling text ABOVE the image so the email
   makes sense even without it loading.
```

### Integrating Instantly.ai with Your Platform

**Option A: Use Instantly.ai directly (simpler)**
- Create campaigns in Instantly.ai's dashboard
- Upload leads manually (export CSV from your platform)
- Manage sequences in Instantly's UI
- Your platform just tracks which leads were exported

**Option B: API integration (more automated)**
- Instantly.ai has an API for creating campaigns and adding leads
- Your platform sends leads directly to Instantly via API
- Sync email status (sent/opened/replied) back to your platform
- More work to build but fully automated

**Recommendation:** Start with Option A. Move to Option B once you've validated the business and want full automation.

---

# 8. Stage 6: Pipeline Management — Tracking Everything

## Lead Status Flow

```
DISCOVERED ─────> ANALYZED ─────> QUALIFIED ─────> WEBSITE_CREATED ─────> EMAIL_SENT
     │                │                │                  │                    │
     │                │                │                  │              ┌─────┴─────┐
     │                │                │                  │              ▼           ▼
     │                │                │                  │          REPLIED      (no reply)
     │                │                │                  │              │
     │                │                │                  │         ┌────┴────┐
     │                │                │                  │         ▼         ▼
     │                │                │                  │     CONVERTED    LOST
     └── SKIPPED      └── SKIPPED     └── SKIPPED        └── SKIPPED
    (filtered out)   (good website)  (no email found)  (decided not to)
```

### What Each Status Means

| Status | Trigger | What Happens |
|--------|---------|--------------|
| **DISCOVERED** | Lead saved from Google search | Waiting for website analysis |
| **ANALYZED** | Website analysis completed | Scores and issues available |
| **QUALIFIED** | Email address found | Ready for website creation |
| **WEBSITE_CREATED** | Custom design uploaded | Ready for email outreach |
| **EMAIL_SENT** | Cold email sent | Waiting for response |
| **REPLIED** | Dentist replied to email | Schedule a call |
| **CONVERTED** | Dentist paid $199 | Customer acquired! |
| **LOST** | Dentist declined or unresponsive | Archive |
| **SKIPPED** | Manually removed at any stage | Not pursuing |

## Dashboard Analytics

### Key Metrics to Track

```
DISCOVERY METRICS:
  - Total searches performed
  - Total dentists found
  - Leads saved (after filtering)
  - Cities searched

ANALYSIS METRICS:
  - Leads analyzed
  - Average website quality score
  - Distribution: terrible / poor / average / good / excellent
  - Most common issues found

OUTREACH METRICS:
  - Emails found (and by which source)
  - Websites created
  - Emails sent
  - Open rate (if tracked via Instantly)
  - Reply rate
  - Positive reply rate

CONVERSION METRICS:
  - Leads replied
  - Leads converted
  - Conversion rate (converted / emails_sent)
  - Revenue generated
  - Revenue per lead
  - Revenue per email sent

FUNNEL VISUALIZATION:
  Discovered (120) → Analyzed (115) → Qualified (82) → Created (40) →
  Emailed (40) → Replied (12) → Converted (4)
  Conversion rate: 4/40 = 10%
  Revenue: 4 × $199 = $796
```

---

# 9. Complete API & Tool Reference

## All External Services — Complete Inventory

### TIER 1: Must Have (Required to run the platform)

| # | Service | What It Does | API Type | Pricing | Free Tier | Setup |
|---|---------|-------------|----------|---------|-----------|-------|
| 1 | **Google Cloud — Places API (New)** | Search dentists by location, get business data, ratings, reviews, website URLs | REST API | $32-40 per 1K requests | $200/month credit (~5,000-6,000 searches) | cloud.google.com → New Project → Enable "Places API (New)" → Create API Key |
| 2 | **Google PageSpeed Insights API** | Analyze website performance, SEO, accessibility scores | REST API | Free | 25,000 requests/day | Same Google Cloud project → Enable "PageSpeed Insights API" → Same API key works |
| 3 | **Anthropic Claude API** | AI vision analysis (screenshots) + text analysis (content quality) | REST API | Input: $3/M tokens, Output: $15/M tokens (Sonnet) | None (pay per use, ~$0.007/analysis) | console.anthropic.com → Create account → Add billing → Get API key |
| 4 | **Puppeteer** (npm package) | Headless Chrome browser for screenshots, text extraction, scraping | Node.js library | Free | N/A (open source) | `npm install puppeteer` — downloads Chromium automatically |
| 5 | **Wappalyzer** (npm package) | Detect technologies used on websites (CMS, frameworks, etc.) | Node.js library | Free | N/A (open source) | `npm install wappalyzer` |

### TIER 2: Should Have (Needed for full functionality)

| # | Service | What It Does | API Type | Pricing | Free Tier | Setup |
|---|---------|-------------|----------|---------|-----------|-------|
| 6 | **Hunter.io** | Find email addresses by domain | REST API | $34/mo Starter (500 searches) | 25 searches/month | hunter.io → Sign up → Dashboard → API Key |
| 7 | **Instantly.ai** | Send cold emails with warmup, rotation, sequences | Web app + API | $37/mo Growth | None | instantly.ai → Sign up → Connect email accounts → Create campaign |
| 8 | **Google Workspace** | Email inboxes for sending (deliverability) | Email service | $6/user/month | None | workspace.google.com → Set up per domain |
| 9 | **Cloudinary** | Host screenshots and images (for email embedding) | REST API + SDK | Pay per use | 25 credits/month (≈25K transforms or 25GB storage) | cloudinary.com → Sign up → Get cloud_name, api_key, api_secret |
| 10 | **Cold email domains** (Namecheap/Google Domains) | Separate domains for outreach | N/A | $10-12/domain/year | N/A | Buy 3-5 .com domains related to dental web design |

### TIER 3: Nice to Have (Enhances the platform)

| # | Service | What It Does | API Type | Pricing | Free Tier | Setup |
|---|---------|-------------|----------|---------|-----------|-------|
| 11 | **Outscraper** | Get ALL Google reviews (beyond 5), find emails from Google profiles | REST API | $2-3 per 1K results | 100 requests/month | outscraper.com → Sign up → API Key |
| 12 | **DataForSEO** | Detailed SEO audit (60+ checks per page) | REST API | $0.02/page, $50 min deposit | None | dataforseo.com → Sign up → API credentials |
| 13 | **BullMQ + Redis** | Job queue for background processing (analysis, emails) | Node.js library | Free (self-hosted Redis) | N/A | `npm install bullmq ioredis` + Redis server |

### TIER 4: Future / Optional

| # | Service | What It Does | Pricing |
|---|---------|-------------|---------|
| 14 | **Apollo.io** | Larger email database, find decision-makers by title | $49-119/user/mo |
| 15 | **Smartlead** | Alternative to Instantly.ai for cold email | $39/mo |
| 16 | **Lemlist** | Cold email with image personalization | $69/user/mo |
| 17 | **Moz API** | Domain Authority scores for SEO comparison | $99/mo |
| 18 | **ScreenshotOne** | Cloud-based screenshot API (alternative to Puppeteer) | $9/mo (1K screenshots) |
| 19 | **Stripe** | Accept $199 payments from converted leads | 2.9% + $0.30 per transaction |

---

## API Call Reference (Quick Lookup)

### Google Places — Text Search
```
POST https://places.googleapis.com/v1/places:searchText
Headers: X-Goog-Api-Key, X-Goog-FieldMask
Body: { textQuery, includedType, maxResultCount, pageToken? }
Returns: places[], nextPageToken
```

### Google Places — Place Details
```
GET https://places.googleapis.com/v1/places/{placeId}
Headers: X-Goog-Api-Key, X-Goog-FieldMask
Returns: reviews[], plus any fields in FieldMask
```

### Google PageSpeed Insights
```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
Params: url, key, category[] (performance, seo, accessibility, best-practices), strategy (mobile/desktop)
Returns: lighthouseResult.categories, lighthouseResult.audits
```

### Claude API (Messages)
```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key, anthropic-version
Body: { model, max_tokens, messages: [{ role, content }] }
Returns: content[0].text (JSON string to parse)
```

### Hunter.io — Domain Search
```
GET https://api.hunter.io/v2/domain-search
Params: domain, api_key
Returns: data.emails[{ value, type, confidence }]
```

### Hunter.io — Email Verifier
```
GET https://api.hunter.io/v2/email-verifier
Params: email, api_key
Returns: data.status (deliverable / risky / undeliverable)
```

### Cloudinary — Upload Image
```
POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
Body (form-data): file (base64), upload_preset, folder
Returns: secure_url (public image URL)
```

### Outscraper — Google Maps Reviews
```
POST https://api.app.outscraper.com/maps/reviews-v3
Headers: X-API-KEY
Body: { query: [placeId], reviewsLimit, language }
Returns: reviews with full text, rating, date, author
```

---

# 10. Technical Architecture Deep Dive

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                     Next.js 16 + React 19 + Redux                        │
│                        (localhost:3000)                                   │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Login   │ │  Search  │ │  Leads   │ │ Outreach │ │Analytics │     │
│  │  Page    │ │  Page    │ │  Table   │ │  Page    │ │  Page    │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    REDUX STORE                                   │    │
│  │  authSlice | searchSlice | leadsSlice | emailSlice | dashSlice  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                    HTTP (Axios/Fetch)                                     │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                      │
│                    Express 5 + TypeScript                                  │
│                      (localhost:5001)                                      │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                         ROUTES                                    │    │
│  │  /api/auth  /api/search  /api/leads  /api/analysis  /api/email   │    │
│  └────────────────────────────┬─────────────────────────────────────┘    │
│                               │                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                       CONTROLLERS                                 │    │
│  │  authCtrl  searchCtrl  leadsCtrl  analysisCtrl  emailCtrl        │    │
│  └────────────────────────────┬─────────────────────────────────────┘    │
│                               │                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                        SERVICES                                   │    │
│  │                                                                    │    │
│  │  googlePlacesService ──────────────────> Google Places API        │    │
│  │  websiteAnalysisService ───> Puppeteer + Wappalyzer (local)      │    │
│  │  claudeAnalysisService ────────────────> Claude API (Anthropic)  │    │
│  │  pageSpeedService ─────────────────────> Google PSI API           │    │
│  │  scoringService (local calculation)                               │    │
│  │  emailFinderService ───> Puppeteer scrape + Hunter.io API        │    │
│  │  emailSenderService ──────────────────> Instantly.ai API         │    │
│  │  cloudinaryService ───────────────────> Cloudinary API           │    │
│  │  dashboardService (local aggregation)                             │    │
│  └────────────────────────────┬─────────────────────────────────────┘    │
│                               │                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                        MODELS (Mongoose)                          │    │
│  │  Lead | SearchHistory | EmailTemplate                             │    │
│  └────────────────────────────┬─────────────────────────────────────┘    │
│                               │                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                   JOB QUEUE (BullMQ)                              │    │
│  │  analysisQueue (process website analyses in background)           │    │
│  │  emailQueue (process email discovery in background)               │    │
│  └────────────────────────────┬─────────────────────────────────────┘    │
│                               │                                           │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ MongoDB  │ │  Redis   │ │Cloudinary│
              │ Atlas    │ │ (queues) │ │ (images) │
              └──────────┘ └──────────┘ └──────────┘
```

## Data Flow for Each Major Operation

### Flow 1: Search Dentists

```
Frontend                    Backend                         External
────────                    ───────                         ────────

User enters "New York"
Click "Search"
     │
     ├─ POST /api/search/dentists
     │  { location: "New York, NY",
     │    minRating: 3.5,
     │    minReviews: 10 }
     │        │
     │        ├──> searchController.searchDentists()
     │        │        │
     │        │        ├──> googlePlacesService.searchByLocation()
     │        │        │        │
     │        │        │        ├──> POST places:searchText ────> Google Places API
     │        │        │        │    (page 1: 20 results)           │
     │        │        │        │<─── places[] + nextPageToken <────┘
     │        │        │        │
     │        │        │        ├──> POST places:searchText ────> Google Places API
     │        │        │        │    (page 2: 20 results)           │
     │        │        │        │<─── places[] + nextPageToken <────┘
     │        │        │        │
     │        │        │        ├──> POST places:searchText ────> Google Places API
     │        │        │        │    (page 3: 20 results)           │
     │        │        │        │<─── places[] <────────────────────┘
     │        │        │        │
     │        │        │        ├──> For each place:
     │        │        │        │    GET places/{id} ────────> Google Places API
     │        │        │        │    (get reviews)                   │
     │        │        │        │<─── reviews[] <───────────────────┘
     │        │        │        │
     │        │        │        └──> Return 60 clinics with all data
     │        │        │
     │        │        ├──> Filter: rating >= 3.5, has website, reviews >= 10
     │        │        │    Result: 42 qualified clinics
     │        │        │
     │        │        ├──> Save to MongoDB as Lead documents (status: DISCOVERED)
     │        │        │    Save SearchHistory document
     │        │        │
     │        │        └──> Return { leads: [...], total: 42, searchId: "..." }
     │        │
     │<───────┘ Response: 200 OK
     │
     ├─ Redux: dispatch(searchDentists.fulfilled)
     │  Update searchSlice with results
     │
     └─ UI: Show table of 42 leads
```

### Flow 2: Analyze Websites (Background Job)

```
Frontend                    Backend                         External
────────                    ───────                         ────────

Click "Analyze All"
     │
     ├─ POST /api/analysis/run-batch
     │  { leadIds: ["id1", "id2", ...] }
     │        │
     │        ├──> analysisController.runBatch()
     │        │        │
     │        │        ├──> Add each lead to BullMQ analysis queue
     │        │        │    (42 jobs queued)
     │        │        │
     │        │        └──> Return { queued: 42, jobIds: [...] }
     │        │
     │<───────┘ Response: 202 Accepted
     │
     │  (Meanwhile, BullMQ worker processes jobs...)
     │
     │  ┌───── analysisQueue.process(job) ─────────────────────────────┐
     │  │                                                               │
     │  │  1. websiteAnalysisService.analyze(lead.website)              │
     │  │     │                                                         │
     │  │     ├──> Launch Puppeteer                                     │
     │  │     │    ├── Navigate to URL                                  │
     │  │     │    ├── Desktop screenshot ──> Buffer (PNG)              │
     │  │     │    ├── Mobile screenshot ──> Buffer (PNG)               │
     │  │     │    ├── Extract text ──> String                          │
     │  │     │    ├── Extract meta ──> Object                          │
     │  │     │    ├── Quick checks ──> Object                          │
     │  │     │    └── Wappalyzer ──> tech stack array                  │
     │  │     │                                                         │
     │  │     ├──> Upload screenshots to Cloudinary ──> Cloudinary API  │
     │  │     │    Returns: desktopUrl, mobileUrl                       │
     │  │     │                                                         │
     │  │  2. pageSpeedService.analyze(lead.website)                    │
     │  │     ├──> GET pagespeedonline (mobile) ──────> Google PSI API  │
     │  │     │    Returns: performance, seo, accessibility, bestPract  │
     │  │     ├──> GET pagespeedonline (desktop) ─────> Google PSI API  │
     │  │     │    Returns: same scores for desktop                     │
     │  │     └──> Combine scores                                       │
     │  │                                                               │
     │  │  3. claudeAnalysisService.analyzeVisual(screenshots)          │
     │  │     ├──> POST /v1/messages ─────────────────> Claude API      │
     │  │     │    (send desktop + mobile screenshots)                  │
     │  │     └──> Returns: visual scores, issues, design era           │
     │  │                                                               │
     │  │  4. claudeAnalysisService.analyzeContent(pageText)            │
     │  │     ├──> POST /v1/messages ─────────────────> Claude API      │
     │  │     │    (send extracted text)                                 │
     │  │     └──> Returns: content scores, missing items               │
     │  │                                                               │
     │  │  5. scoringService.calculateScores(allResults)                 │
     │  │     ├──> Website Quality Score (0-100)                        │
     │  │     ├──> Lead Score (0-90)                                    │
     │  │     └──> Issues list (human-readable strings)                 │
     │  │                                                               │
     │  │  6. Update Lead in MongoDB                                    │
     │  │     ├──> websiteAnalysis: { all scores, screenshots, issues } │
     │  │     ├──> leadScore: 85                                        │
     │  │     └──> status: ANALYZED                                     │
     │  │                                                               │
     │  └──────────────────────────────────────────────────────────────┘
     │
     │  (Frontend polls for progress)
     │
     ├─ GET /api/analysis/status?jobIds=[...]
     │  Returns: { completed: 12, total: 42, inProgress: 3 }
     │
     │  (Repeat polling every 5 seconds)
     │
     └─ When done: GET /api/leads → refresh lead table with scores
```

### Flow 3: Send Cold Email

```
Frontend                    Backend                         External
────────                    ───────                         ────────

On lead detail page:
Click "Send Email"
Select template
Preview filled-in email
Click "Confirm Send"
     │
     ├─ POST /api/email/send/LEAD_ID
     │  { templateId: "initial_outreach",
     │    customSubject: "...",       (optional override)
     │    customBody: "..." }         (optional override)
     │        │
     │        ├──> emailController.sendEmail()
     │        │        │
     │        │        ├──> Load lead from MongoDB
     │        │        ├──> Load email template
     │        │        ├──> Replace variables:
     │        │        │    {practice_name} → "Bright Smile Dental"
     │        │        │    {first_name} → "Dr. Smith"
     │        │        │    {city} → "New York"
     │        │        │    {rating} → "4.8"
     │        │        │    {review_count} → "187"
     │        │        │    {issue_1} → "loads in 8+ seconds"
     │        │        │    {issue_2} → "not mobile-friendly"
     │        │        │    {issue_3} → "no online booking"
     │        │        │    {preview_url} → "https://framer.com/..."
     │        │        │    {screenshot_url} → Cloudinary URL
     │        │        │
     │        │        ├──> emailSenderService.send()
     │        │        │    │
     │        │        │    └──> POST to Instantly.ai API ──> Instantly.ai
     │        │        │         (or add to Instantly campaign)
     │        │        │
     │        │        ├──> Update lead in MongoDB:
     │        │        │    status: EMAIL_SENT
     │        │        │    emailHistory.push({ sentAt, template, subject, status })
     │        │        │
     │        │        └──> Return { success: true, emailId: "..." }
     │        │
     │<───────┘ Response: 200 OK
     │
     └─ UI: Show "Email sent!" toast, update lead card
```

---

# 11. Database Schema (Full Detail)

## Lead Model

```typescript
// backend/src/models/Lead.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  author: string;
  rating: number;
  text: string;
  date: Date;
  relativeTime?: string;
}

export interface IWebsiteAnalysis {
  // Technical (from Google PSI)
  performanceScore: number;       // 0-100
  seoScore: number;               // 0-100
  accessibilityScore: number;     // 0-100
  bestPracticesScore: number;     // 0-100
  loadTimeMs: number;             // milliseconds
  isHttps: boolean;
  hasViewportMeta: boolean;
  coreWebVitals: {
    lcp: number;                  // Largest Contentful Paint (seconds)
    cls: number;                  // Cumulative Layout Shift
    inp: number;                  // Interaction to Next Paint (ms)
  };

  // Visual (from Claude Vision)
  visualScore: number;            // 1-10
  designModernity: number;        // 1-10
  colorScheme: number;            // 1-10
  layoutQuality: number;          // 1-10
  imageQuality: number;           // 1-10
  ctaVisibility: number;          // 1-10
  trustSignals: number;           // 1-10
  mobileExperience: number;       // 1-10
  designEraEstimate: string;      // e.g., "2012-2015"
  visualIssues: string[];         // top 3 visual issues

  // Content (from Claude Text)
  contentScore: number;           // 1-10
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
  contentItemsPresentCount: number;  // out of 12
  criticalMissing: string[];         // most important missing items

  // Technology (from Wappalyzer)
  techStack: Array<{
    name: string;                 // e.g., "WordPress"
    version?: string;             // e.g., "5.2"
    category: string;             // e.g., "CMS"
  }>;
  technologyScore: number;        // 0-100 (calculated)

  // Quick Checks (from Puppeteer DOM inspection)
  hasContactForm: boolean;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasBookingWidget: boolean;
  hasGoogleMap: boolean;
  hasSocialLinks: boolean;
  hasSchemaMarkup: boolean;
  imageCount: number;
  hasVideo: boolean;
  navigationItemCount: number;

  // Aggregated
  overallScore: number;           // 0-100 (Website Quality Score)
  issues: string[];               // human-readable list of all issues
  screenshots: {
    desktop: string;              // Cloudinary URL
    mobile: string;               // Cloudinary URL
  };

  analyzedAt: Date;
}

export interface IEmailHistoryEntry {
  sentAt: Date;
  templateName: string;
  subject: string;
  body: string;
  status: 'sent' | 'opened' | 'replied' | 'bounced';
  instantlyEmailId?: string;      // ID from Instantly.ai for tracking
}

export interface ILead extends Document {
  // Google Places Data
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  website: string;
  googlePlaceId: string;
  googleMapsUrl: string;
  googleRating: number;
  googleReviewCount: number;
  reviews: IReview[];

  // Email Discovery
  email?: string;
  emailSource?: 'scrape' | 'hunter' | 'outscraper' | 'manual';
  emailVerified?: boolean;
  emailVerificationStatus?: 'deliverable' | 'risky' | 'undeliverable';

  // Website Analysis
  websiteAnalysis?: IWebsiteAnalysis;

  // Lead Scoring
  leadScore?: number;             // 0-90
  leadCategory?: 'hot' | 'warm' | 'cool' | 'skip';

  // Pipeline
  status: 'discovered' | 'analyzed' | 'qualified' | 'website_created' | 'email_sent' | 'replied' | 'converted' | 'lost' | 'skipped';

  // Custom Website (created externally)
  customWebsiteUrl?: string;
  customWebsiteScreenshot?: string;  // Cloudinary URL

  // Email Outreach
  emailHistory: IEmailHistoryEntry[];

  // Metadata
  notes?: string;
  searchQuery: string;            // which search found this lead
  searchId: string;               // reference to SearchHistory document

  createdAt: Date;
  updatedAt: Date;
}
```

## SearchHistory Model

```typescript
// backend/src/models/SearchHistory.ts

export interface ISearchHistory extends Document {
  query: string;                  // "dentist in New York, NY"
  location: string;               // "New York, NY"
  minRating: number;              // filter used (e.g., 3.5)
  minReviews: number;             // filter used (e.g., 10)
  totalResultsFromGoogle: number; // raw count from API
  leadsCreated: number;           // after filtering
  searchedAt: Date;
}
```

## EmailTemplate Model

```typescript
// backend/src/models/EmailTemplate.ts

export interface IEmailTemplate extends Document {
  name: string;                   // "Initial Outreach"
  subject: string;                // "Quick question about {{practice_name}}'s website"
  body: string;                   // HTML with {{variable}} placeholders
  type: 'initial' | 'followup_1' | 'followup_2' | 'breakup';
  variables: string[];            // ["practice_name", "first_name", "city", ...]
  isDefault: boolean;             // pre-loaded template
  createdAt: Date;
  updatedAt: Date;
}
```

### Available Template Variables

| Variable | Source | Example Value |
|----------|--------|---------------|
| `{{practice_name}}` | Lead.businessName | "Bright Smile Dental" |
| `{{first_name}}` | Extracted from businessName or manual | "Dr. Smith" |
| `{{city}}` | Lead.city | "New York" |
| `{{state}}` | Lead.state | "NY" |
| `{{rating}}` | Lead.googleRating | "4.8" |
| `{{review_count}}` | Lead.googleReviewCount | "187" |
| `{{website}}` | Lead.website | "brightsmilenyc.com" |
| `{{issue_1}}` | Lead.websiteAnalysis.issues[0] | "loads in 8+ seconds" |
| `{{issue_2}}` | Lead.websiteAnalysis.issues[1] | "not mobile-friendly" |
| `{{issue_3}}` | Lead.websiteAnalysis.issues[2] | "no online booking" |
| `{{website_score}}` | Lead.websiteAnalysis.overallScore | "23" |
| `{{preview_url}}` | Lead.customWebsiteUrl | "https://framer.com/..." |
| `{{screenshot_url}}` | Lead.customWebsiteScreenshot | Cloudinary URL |
| `{{your_name}}` | Settings | "Your Name" |
| `{{your_business}}` | Settings | "Your Agency Name" |
| `{{physical_address}}` | Settings | "123 Main St, City, ST 12345" |
| `{{unsubscribe_link}}` | Auto-generated | Unsubscribe URL |

---

# 12. Frontend Pages & UI Flows

## Page Map

```
/                              LOGIN PAGE (existing)
│
├── /dashboard                 MAIN DASHBOARD (existing, needs real data)
│   │
│   ├── /dashboard/search      SEARCH PAGE (new)
│   │   └── Enter city → See results → Save as leads
│   │
│   ├── /dashboard/leads       LEADS TABLE (new)
│   │   ├── Filters: city, score range, status
│   │   ├── Columns: name, location, rating, reviews, website score, lead score, status
│   │   ├── Actions: analyze, find email, view detail
│   │   └── Bulk actions: analyze all, export CSV
│   │
│   ├── /dashboard/leads/[id]  LEAD DETAIL (new)
│   │   ├── Clinic info card
│   │   ├── Google data (rating, reviews)
│   │   ├── Website screenshots (current site)
│   │   ├── Analysis scores breakdown
│   │   ├── Issues list
│   │   ├── Email discovery section
│   │   ├── Custom website section (upload URL + screenshot)
│   │   ├── Email composer + history
│   │   ├── Notes
│   │   └── Status management
│   │
│   ├── /dashboard/outreach    OUTREACH PAGE (new)
│   │   ├── Email templates (list, create, edit)
│   │   ├── Send queue
│   │   └── Email stats (sent, opened, replied)
│   │
│   ├── /dashboard/analytics   ANALYTICS PAGE (new)
│   │   ├── Funnel chart (discovered → converted)
│   │   ├── Key metrics cards
│   │   ├── Leads by city chart
│   │   ├── Score distribution chart
│   │   └── Revenue tracker
│   │
│   └── /dashboard/settings    SETTINGS PAGE (new)
│       ├── API keys (Google, Claude, Hunter, Cloudinary)
│       ├── Email sending config
│       ├── Scoring weights
│       ├── Your name / business / address (for emails)
│       └── Default search filters
│
└── /404                       NOT FOUND (existing)
```

## Key UI Components

### Lead Table Row
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Screenshot]  Bright Smile Dental NYC          ★ 4.8 (187 reviews)    │
│  thumbnail    123 Broadway, New York, NY        Website Score: 18/100  │
│               brightsmilenyc.com                Lead Score: [HOT 85]   │
│                                                                         │
│  Status: [ANALYZED]    [Analyze] [Find Email] [View Detail →]          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Lead Detail — Analysis Section
```
┌──────────────────────────────────────────────────────────────────┐
│  WEBSITE ANALYSIS                     Overall Score: 18/100 🔴   │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐                                │
│  │  DESKTOP    │  │   MOBILE    │   Technical:  23/100 ████░░░  │
│  │ [screenshot]│  │ [screenshot]│   Visual:     15/100 ██░░░░░  │
│  │             │  │             │   Content:    20/100 ███░░░░  │
│  │             │  │             │   Technology: 10/100 █░░░░░░  │
│  └─────────────┘  └─────────────┘                                │
│                                                                   │
│  ISSUES FOUND:                                                    │
│  🔴 Website loads in 8.2 seconds (should be under 3)             │
│  🔴 Not mobile-responsive                                        │
│  🔴 No SSL certificate (HTTP only)                               │
│  🟡 No online appointment booking                                │
│  🟡 Missing patient testimonials                                 │
│  🟡 Doctor bios have no credentials listed                       │
│  🟡 Using WordPress 4.2 (2015 version)                           │
│                                                                   │
│  Tech Stack: WordPress 4.2, jQuery 1.12, PHP 5.6                │
│  Design Era: ~2012-2014                                          │
│  Analyzed: April 6, 2026 at 2:34 PM                             │
│                                                                   │
│  [Re-Analyze]                                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

# 13. Backend API Endpoints (Full Spec)

## Authentication (Existing)

### POST /api/auth/login
- **Body:** `{ email: string, password: string }`
- **Response:** `{ token: string }`
- **Status:** 200 OK / 401 Unauthorized

### GET /api/auth/verify
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ valid: true, admin: { email: string } }`
- **Status:** 200 OK / 401 Unauthorized

## Search

### POST /api/search/dentists
- **Auth:** Required
- **Body:**
  ```json
  {
    "location": "New York, NY",
    "minRating": 3.5,
    "minReviews": 10,
    "maxResults": 60
  }
  ```
- **Response:**
  ```json
  {
    "searchId": "661a...",
    "location": "New York, NY",
    "totalFromGoogle": 58,
    "leadsCreated": 42,
    "leads": [ { ...leadObject }, ... ]
  }
  ```
- **Status:** 200 OK

### GET /api/search/history
- **Auth:** Required
- **Response:** `{ searches: [ { query, location, leadsCreated, searchedAt }, ... ] }`
- **Status:** 200 OK

## Leads

### GET /api/leads
- **Auth:** Required
- **Query Params:**
  - `page` (default 1), `limit` (default 20)
  - `status` (filter by status)
  - `city` (filter by city)
  - `minLeadScore`, `maxLeadScore`
  - `minWebsiteScore`, `maxWebsiteScore`
  - `sortBy` (leadScore, googleRating, googleReviewCount, createdAt)
  - `sortOrder` (asc, desc)
  - `search` (search by business name)
- **Response:**
  ```json
  {
    "leads": [ { ...leadObject }, ... ],
    "total": 42,
    "page": 1,
    "totalPages": 3
  }
  ```

### GET /api/leads/:id
- **Auth:** Required
- **Response:** `{ lead: { ...fullLeadObject } }`

### PATCH /api/leads/:id/status
- **Auth:** Required
- **Body:** `{ status: "qualified" }`
- **Response:** `{ lead: { ...updatedLead } }`

### PATCH /api/leads/:id
- **Auth:** Required
- **Body:** `{ notes?: string, email?: string, customWebsiteUrl?: string, customWebsiteScreenshot?: string }`
- **Response:** `{ lead: { ...updatedLead } }`

### DELETE /api/leads/:id
- **Auth:** Required
- **Response:** `{ message: "Lead deleted" }`

### POST /api/leads/export
- **Auth:** Required
- **Body:** `{ leadIds?: string[], filters?: object }` (export all or filtered)
- **Response:** CSV file download

## Analysis

### POST /api/analysis/run/:leadId
- **Auth:** Required
- **Response:** `{ jobId: "job_123", status: "queued" }`

### POST /api/analysis/run-batch
- **Auth:** Required
- **Body:** `{ leadIds: ["id1", "id2", ...] }`
- **Response:** `{ queued: 42, jobIds: [...] }`

### GET /api/analysis/status
- **Auth:** Required
- **Query:** `jobIds=job1,job2,...`
- **Response:** `{ completed: 12, failed: 1, inProgress: 3, total: 42 }`

### GET /api/analysis/:leadId
- **Auth:** Required
- **Response:** `{ analysis: { ...websiteAnalysisObject } }`

## Email

### POST /api/email/find/:leadId
- **Auth:** Required
- **Response:**
  ```json
  {
    "email": "drsmith@brightsmile.com",
    "source": "hunter",
    "confidence": 91,
    "verified": true
  }
  ```
  or `{ email: null, message: "Email not found via automated sources" }`

### POST /api/email/send/:leadId
- **Auth:** Required
- **Body:**
  ```json
  {
    "templateId": "initial_outreach",
    "customSubject": null,
    "customBody": null
  }
  ```
- **Response:** `{ sent: true, emailId: "instantly_123" }`

### GET /api/email/templates
- **Auth:** Required
- **Response:** `{ templates: [ { ...templateObject }, ... ] }`

### POST /api/email/templates
- **Auth:** Required
- **Body:** `{ name, subject, body, type }`
- **Response:** `{ template: { ...newTemplate } }`

### PUT /api/email/templates/:id
- **Auth:** Required
- **Body:** `{ name?, subject?, body?, type? }`
- **Response:** `{ template: { ...updatedTemplate } }`

### DELETE /api/email/templates/:id
- **Auth:** Required
- **Response:** `{ message: "Template deleted" }`

## Dashboard

### GET /api/dashboard/stats
- **Auth:** Required
- **Response:**
  ```json
  {
    "totalLeads": 245,
    "leadsAnalyzed": 230,
    "leadsQualified": 142,
    "emailsSent": 85,
    "emailsReplied": 18,
    "leadsConverted": 7,
    "revenue": 1393,
    "conversionRate": 8.2,
    "averageLeadScore": 62,
    "averageWebsiteScore": 38,
    "topCities": [
      { "city": "New York", "count": 45 },
      { "city": "Los Angeles", "count": 38 }
    ]
  }
  ```

### GET /api/dashboard/analytics
- **Auth:** Required
- **Query:** `period=30d` (7d, 30d, 90d, all)
- **Response:**
  ```json
  {
    "funnel": {
      "discovered": 245,
      "analyzed": 230,
      "qualified": 142,
      "websiteCreated": 85,
      "emailSent": 85,
      "replied": 18,
      "converted": 7,
      "lost": 11
    },
    "scoreDistribution": {
      "terrible": 45,
      "poor": 82,
      "average": 68,
      "good": 35,
      "excellent": 15
    },
    "emailStats": {
      "sent": 85,
      "opened": 52,
      "replied": 18,
      "bounced": 3,
      "openRate": 61.2,
      "replyRate": 21.2
    },
    "timeline": [
      { "date": "2026-04-01", "discovered": 12, "emailed": 5, "converted": 1 },
      ...
    ]
  }
  ```

---

# 14. Job Queue System

## Why We Need Queues

Website analysis takes 30-60 seconds per site (mostly due to PageSpeed Insights). We can't make the user wait. Instead:

1. User clicks "Analyze" → job added to queue → immediate response
2. Worker picks up jobs from queue → processes in background
3. Frontend polls for status → shows progress bar
4. When done → lead updated in MongoDB → frontend refreshes

## BullMQ Setup

```
Backend Server
     │
     ├── Express API (handles HTTP requests)
     │
     ├── BullMQ Queue Producer (adds jobs)
     │
     ├── BullMQ Queue Worker (processes jobs)  ← can run on same server or separate
     │
     └── Redis (stores queue state)
```

### Analysis Queue

```
Job Data: {
  leadId: string,
  websiteUrl: string,
  priority: 'high' | 'normal'  // HOT leads get processed first
}

Concurrency: 2-3 (limited by Puppeteer memory usage)

Job Processing Steps:
  1. Launch Puppeteer → screenshots + text + tech
  2. Call Google PSI API (10-30 sec)
  3. Call Claude Vision API (2-5 sec)
  4. Call Claude Text API (2-5 sec)
  5. Calculate scores
  6. Upload screenshots to Cloudinary
  7. Update lead in MongoDB

Retry Policy:
  - Max 3 attempts
  - Backoff: exponential (30s, 60s, 120s)
  - Failed jobs moved to "failed" queue for review

Timeout: 120 seconds per job (2 minutes max)
```

### Email Discovery Queue

```
Job Data: {
  leadId: string,
  websiteUrl: string,
  domain: string
}

Concurrency: 5 (mostly API calls, not CPU-heavy)

Job Processing Steps:
  1. Scrape contact page with Puppeteer
  2. If not found: query Hunter.io API
  3. If not found: query Outscraper
  4. If found: verify with Hunter.io
  5. Update lead in MongoDB

Timeout: 60 seconds per job
```

---

# 15. Environment Variables & Configuration

## Backend (.env)

```bash
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dentalleads

# Auth
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your-jwt-secret-key

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000

# Google APIs
GOOGLE_PLACES_API_KEY=AIzaSy...
GOOGLE_PSI_API_KEY=AIzaSy...         # can be same key

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Hunter.io
HUNTER_API_KEY=abc123...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdef...

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                       # empty for local dev

# Outscraper (optional)
OUTSCRAPER_API_KEY=...

# Instantly.ai (optional, for API integration)
INSTANTLY_API_KEY=...

# Settings
DEFAULT_MIN_RATING=3.5
DEFAULT_MIN_REVIEWS=10
MAX_CONCURRENT_ANALYSES=3
```

## Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

---

# 16. Cost Breakdown & ROI Analysis

## Monthly Operating Costs

### Scenario: 500 leads/month (moderate usage)

| Service | Usage | Monthly Cost |
|---------|-------|-------------|
| **Google Places API** | ~65 calls/city × 8 cities = 520 calls | $0 (within $200 free credit) |
| **Google PSI API** | 500 analyses × 2 (mobile+desktop) = 1,000 | $0 (free) |
| **Claude API** | 500 analyses × 2 calls = 1,000 calls | ~$5 |
| **Hunter.io** | ~300 email lookups + verifications | $34 (Starter plan) |
| **Cloudinary** | ~1,000 screenshot uploads | $0 (within free tier) |
| **Instantly.ai** | Unlimited emails + warmup | $37 |
| **Google Workspace** | 6 inboxes × $6 | $36 |
| **Cold email domains** | 5 domains amortized | $5 |
| **Redis** (local or cloud) | Small instance | $0-15 |
| **Server/VPS** (if separate for Puppeteer) | 4GB RAM | $0-20 |
| | | |
| **TOTAL (minimum)** | | **~$117/month** |
| **TOTAL (with VPS + Redis cloud)** | | **~$152/month** |

### Revenue to Break Even

| Clients Needed | Revenue | Break-Even? |
|----------------|---------|-------------|
| 1 client | $199 | Yes (covers all monthly costs) |
| 2 clients | $398 | Comfortable profit |
| 5 clients | $995 | Great month |
| 10 clients | $1,990 | Excellent month |

### Year 2+ Recurring Revenue

After year 1, each client pays $29/month:

| Active Clients | Monthly Recurring | Annual Recurring |
|----------------|-------------------|-----------------|
| 10 | $290 | $3,480 |
| 25 | $725 | $8,700 |
| 50 | $1,450 | $17,400 |
| 100 | $2,900 | $34,800 |

### Conversion Rate Expectations

| Metric | Conservative | Optimistic |
|--------|-------------|-----------|
| Open rate | 40% | 60% |
| Reply rate | 5% | 15% |
| Positive reply rate | 2% | 8% |
| Close rate (from positive reply) | 30% | 60% |
| **Overall conversion (email → client)** | **0.6%** | **4.8%** |
| **Clients per 100 emails** | **0.6** | **4.8** |
| **Emails needed per client** | **~167** | **~21** |

With 375 emails/day capacity (after warmup), even the conservative estimate yields 2-3 clients/month.

---

# 17. Legal & Compliance

## CAN-SPAM Act (USA)

Cold B2B email IS legal in the United States under the CAN-SPAM Act, but you MUST follow these rules:

| Requirement | What You Must Do | How We Handle It |
|-------------|-----------------|-----------------|
| **Accurate headers** | From name and email must be real | Use your real name and business email |
| **Honest subject line** | Must reflect email content | No clickbait subjects |
| **Physical address** | Include a valid postal address | Added to every email template footer |
| **Unsubscribe link** | Must include opt-out mechanism | Every email has unsubscribe link |
| **Honor opt-outs** | Remove within 10 business days | Instantly.ai handles this automatically |
| **Identify as ad** | Email must be identifiable as solicitation | Content makes this clear |
| **No purchased lists** | Don't email purchased/scraped lists without consent | We discover emails ourselves |

**Penalty for violations: Up to $51,744 per email.**

## GDPR (If emailing EU dentists)

If you target dentists in the EU (unlikely for US focus, but good to know):
- You need "legitimate interest" as legal basis for B2B cold email
- Must include company registration info
- Must offer easy opt-out
- Must explain how you got their email
- **Recommendation:** Stick to US dentists initially to avoid GDPR complexity

## Google Places API Terms of Service

- You CAN use Google Places data in your application
- You CANNOT scrape Google Maps (but we use the official API, so this is fine)
- You MUST display Google attribution if showing Google data publicly
- You CANNOT cache data for more than 30 days (refresh periodically)
- You CANNOT sell raw Google data

## Image Usage

- Screenshots of public websites are generally fair use for analysis
- Custom websites you create are your own work
- Don't use the dentist's logo or branding without permission in your mockups (use placeholder)

---

# 18. Implementation Roadmap

## Phase 1: Foundation — Search & Store (Week 1-2)

### Week 1
- [ ] Create Lead Mongoose model with full schema
- [ ] Create SearchHistory model
- [ ] Build googlePlacesService (search + place details)
- [ ] Build searchController + routes
- [ ] Frontend: Search page with city input + results table
- [ ] Frontend: searchSlice for Redux
- [ ] Test: Search "Austin, TX" → see dentists → save as leads

### Week 2
- [ ] Build leadsService (CRUD operations)
- [ ] Build leadsController + routes
- [ ] Frontend: Leads table page with pagination
- [ ] Frontend: leadsSlice for Redux
- [ ] Frontend: Basic filters (city, status)
- [ ] Frontend: Lead detail page (basic — clinic info + Google data)

**Milestone: Can search any city and browse discovered leads.**

## Phase 2: Analysis Engine (Week 3-4)

### Week 3
- [ ] Set up Puppeteer service (launch browser, screenshot, extract text)
- [ ] Set up Wappalyzer integration
- [ ] Build pageSpeedService (call PSI API, parse results)
- [ ] Set up Redis + BullMQ
- [ ] Build analysis queue (producer + worker)
- [ ] Build analysisController + routes
- [ ] Test: Analyze a single website URL → get all raw data

### Week 4
- [ ] Build claudeAnalysisService (vision + text prompts)
- [ ] Build scoringService (aggregate all scores)
- [ ] Set up Cloudinary (upload screenshots)
- [ ] Frontend: analysisSlice for Redux
- [ ] Frontend: Analysis section on lead detail page (scores, screenshots, issues)
- [ ] Frontend: "Analyze" button + progress indicator
- [ ] Frontend: Batch analysis with progress bar
- [ ] Test: Analyze 10 websites → verify scoring accuracy

**Milestone: Can analyze any dentist's website and see detailed quality report.**

## Phase 3: Scoring & Dashboard (Week 5)

- [ ] Implement lead scoring formula
- [ ] Add lead score + category to leads table
- [ ] Add score-based sorting and filtering
- [ ] Color-coded score badges (red/yellow/green)
- [ ] Dashboard: real stats from MongoDB aggregations
- [ ] Dashboard: stat cards (total leads, analyzed, qualified, converted)
- [ ] Frontend: dashboardSlice
- [ ] Test: Verify HOT/WARM/COOL categorization is accurate

**Milestone: Leads are ranked by opportunity. Dashboard shows real numbers.**

## Phase 4: Email Discovery & Outreach (Week 6-7)

### Week 6
- [ ] Build email scraping (Puppeteer visits contact page, regex extraction)
- [ ] Build Hunter.io integration (domain search + verification)
- [ ] Build waterfall email finder service
- [ ] Build EmailTemplate model
- [ ] Seed default email templates
- [ ] Frontend: "Find Email" button on lead detail
- [ ] Frontend: Email template management page (CRUD)

### Week 7
- [ ] Build email sending service (Instantly.ai integration or manual export)
- [ ] Frontend: Email composer with template selection + variable preview
- [ ] Frontend: Send email from lead detail page
- [ ] Frontend: Email history section on lead detail
- [ ] Frontend: Outreach page (queue, templates, stats)
- [ ] Custom website URL + screenshot upload on lead detail
- [ ] Status management (pipeline progression)
- [ ] Test: Full flow — find email, compose, send, track

**Milestone: Full outreach pipeline working end-to-end.**

## Phase 5: Analytics & Polish (Week 8)

- [ ] Build dashboard analytics endpoint (funnel, timeline, distributions)
- [ ] Frontend: Analytics page with charts (Recharts)
- [ ] Frontend: Funnel visualization
- [ ] Frontend: Score distribution chart
- [ ] CSV export for leads
- [ ] Settings page (API keys, email config, scoring weights)
- [ ] Error handling throughout (API failures, timeouts, edge cases)
- [ ] Loading states, empty states, error states
- [ ] Mobile-responsive dashboard
- [ ] Final testing of all flows

**Milestone: Platform is feature-complete and polished.**

---

# 19. Risk Analysis & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google Places API rate limits/costs spike | Low | Medium | Cache all results in MongoDB, set budget alerts in Google Cloud |
| Puppeteer crashes/memory leaks | Medium | Low | Restart browser per job, set timeouts, limit concurrency to 2-3 |
| Claude API returns inconsistent scores | Medium | Medium | Use structured JSON prompts with strict rubrics, average multiple runs for important leads |
| Hunter.io can't find email | High | Medium | Waterfall approach (4 sources), manual entry fallback |
| Emails going to spam | Medium | High | Use Instantly.ai warmup, separate domains, limit 25/inbox/day, follow CAN-SPAM |
| Dentist websites block Puppeteer | Low | Low | Use random user agents, add delays between requests |
| Google changes Places API pricing | Low | High | Monitor Google Cloud billing, have Outscraper as backup data source |
| Low conversion rate on cold emails | Medium | Medium | A/B test subject lines, personalize heavily, follow up 3-4 times |
| Cold email domains blacklisted | Medium | High | Rotate domains, monitor reputation via MXToolBox, replace burned domains |

---

# 20. Future Enhancements

### Phase 2 Features (After MVP)
- **Auto-generate websites** — Use AI (v0.dev API or similar) to auto-create custom dental sites per lead, eliminating the manual design step
- **Stripe integration** — Accept $199 payment directly in the platform
- **Client portal** — Give converted clients a login to manage their website
- **Automated follow-ups** — Trigger email sequences automatically based on lead status
- **Multi-city batch search** — Search 10 cities at once

### Phase 3 Features (Scaling)
- **Expand to other verticals** — Chiropractors, lawyers, plumbers, etc. (same formula, different search terms)
- **White-label** — Let other agencies use your platform
- **Chrome extension** — Analyze any website you visit and check if they're a potential lead
- **Review monitoring** — Track when leads get new Google reviews (re-pitch if reviews improve)
- **Competitor analysis** — Show a dentist how their website compares to competitors in the same city

---

# Summary

This document covers the **complete blueprint** for your Dentist Lead Generation platform:

- **5-stage pipeline:** Discover → Analyze → Score → Outreach → Track
- **13+ external APIs and tools** mapped to each stage with pricing and setup instructions
- **Full technical architecture** with data flows, database schemas, API specs
- **Exact prompts** for Claude Vision and Text analysis
- **Email infrastructure** setup guide with compliance requirements
- **ROI math:** ~$117-152/month to run, $199 per converted client
- **8-week implementation roadmap** broken into weekly tasks
- **Risk analysis** with mitigations

**The platform's unique advantage:** AI-powered website analysis using Claude Vision. No competitor automates the judgment of "does this website look outdated?" — this is your moat.
