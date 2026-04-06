# DentalLeads - Complete Platform Plan

## Overview

A solo micro-agency tool that finds dentists with **good Google reviews but bad websites**, automatically analyzes their web presence, and enables you to send cold outreach emails with a custom-designed replacement website to close hosting deals.

**Business Model:** Offer free website design, charge $199/year (hosting + tech support), then $29/month after year one.

---

## Platform Pipeline (5 Stages)

```
[1. DISCOVER]  -->  [2. ANALYZE]  -->  [3. SCORE & FILTER]  -->  [4. OUTREACH]  -->  [5. TRACK]
 Find dentists      Audit their        Rank leads by          Send cold email     Manage deal
 in a location      websites           opportunity            with new design     pipeline
```

---

## Stage 1: Discover Dentists

**Goal:** Search a location (e.g., "New York") and pull all dentist clinics with their Google data.

### Data We Need Per Clinic
- Business name, address, phone number
- Google rating (stars) + total review count
- Website URL
- Google Place ID (for future lookups)
- Top reviews (text + rating)

### Recommended API Stack

| Tool | Purpose | Cost | Why |
|------|---------|------|-----|
| **Google Places API (New)** | Search dentists by location, get basic data + website + rating | Free ($200/mo credit = ~5,000 searches) | Official, reliable, structured data, free tier covers your needs |
| **Outscraper** | Get ALL Google reviews (not just 5) for targeted clinics | $2/1K search results + $3/1K reviews | Cheapest way to get full review data beyond Google's 5-review limit |

### How It Works

1. **User enters a city/location** in the dashboard
2. **Backend calls Google Places Text Search API:**
   ```
   POST https://places.googleapis.com/v1/places:searchText
   Body: { textQuery: "dentist in New York", includedType: "dentist" }
   ```
   - Returns 20 results per page, paginate with `pageToken` (up to ~60 per query)
   - Use `FieldMask` to request: `displayName, formattedAddress, rating, userRatingCount, websiteUri, nationalPhoneNumber, googleMapsUri, id`

3. **For each result, call Place Details** to get reviews:
   ```
   GET https://places.googleapis.com/v1/places/{placeId}
   FieldMask: reviews
   ```
   - Returns up to 5 reviews (Google API limit)

4. **Filter candidates:** Only keep clinics with:
   - Rating >= 3.5 stars (good reviews)
   - Has a website URL (so we can analyze it)
   - Review count >= 10 (established business)

5. **Store in MongoDB** - cache results to avoid re-fetching

### API Keys Needed
- Google Cloud Console -> Enable "Places API (New)" -> Create API key
- Outscraper account (optional, for full reviews later)

### Cost Estimate
- ~$0 for moderate usage (stays within $200/mo free credit)
- If analyzing 500 dentists/month: ~$20-40 in Google API costs

---

## Stage 2: Analyze Websites

**Goal:** For each dentist with a website, automatically determine if the website is bad/outdated.

### Analysis Pipeline (runs per website)

```
Puppeteer visits URL
    |
    +--> Screenshot (desktop + mobile)
    +--> Extract page text/HTML
    +--> Run Wappalyzer (tech detection)
    |
    +--> Google PageSpeed Insights API (performance + SEO scores)
    |
    +--> Claude Vision API (analyze screenshots)
    +--> Claude Text API (analyze content)
    |
    +--> Aggregate into Website Quality Score
```

### Tools & APIs

| Tool | Purpose | Cost |
|------|---------|------|
| **Puppeteer** (self-hosted) | Visit websites, take screenshots, extract text, detect tech | Free (server cost only) |
| **Google PageSpeed Insights API** | Performance, SEO, accessibility, best practices scores (0-100 each) | **Free** (25K queries/day) |
| **Wappalyzer** (open-source npm) | Detect CMS, framework, hosting tech | **Free** (self-hosted) |
| **Claude API (Vision)** | Analyze screenshot for visual quality, modernity, professionalism | ~$0.005/site |
| **Claude API (Text)** | Analyze content for dental-specific quality | ~$0.002/site |
| **DataForSEO On-Page API** (optional) | Detailed SEO audit (60+ checks) | ~$0.02/page |

### What We Check

#### A. Technical Health (Automated - Puppeteer + PSI)
- [ ] Page load speed (PSI Performance score)
- [ ] Mobile responsiveness (PSI mobile vs desktop)
- [ ] SSL certificate (HTTPS)
- [ ] SEO basics (meta tags, headings, alt text)
- [ ] Accessibility score
- [ ] Core Web Vitals (LCP, CLS, INP)

#### B. Technology Detection (Wappalyzer)
- [ ] CMS used (WordPress, Wix, Squarespace, custom)
- [ ] WordPress version (outdated = red flag)
- [ ] JavaScript framework (jQuery = likely old)
- [ ] Analytics installed?
- [ ] Modern vs legacy tech stack

#### C. Visual Quality (Claude Vision on Screenshots)
Prompt Claude with desktop + mobile screenshots:
```
You are a dental website auditor. Rate this website 1-10 on:
1. Visual design modernity (does it look current or 2010-era?)
2. Color scheme professionalism
3. Layout and whitespace usage
4. Image quality (stock vs real, professional vs amateur)
5. Call-to-action visibility
6. Trust signals (reviews, certifications, awards)
7. Mobile experience (from mobile screenshot)

Provide an overall score and 3 specific weaknesses.
Return JSON format.
```

#### D. Content Quality (Claude Text Analysis)
Extract page text and check for:
- [ ] Service descriptions (cleanings, implants, cosmetic, emergency)
- [ ] Doctor/team bios with credentials
- [ ] Patient testimonials
- [ ] Online booking/appointment CTA
- [ ] Contact information prominently displayed
- [ ] Insurance/payment information
- [ ] Office hours
- [ ] New patient offers
- [ ] Blog/educational content

### Scoring System

```
Website Quality Score = weighted average of:
  - Technical Health:    25% (from PSI scores)
  - Visual Quality:      35% (from Claude Vision)
  - Content Quality:     25% (from Claude Text)
  - Technology Stack:    15% (from Wappalyzer)

Score Range:
  0-30:  Terrible  -> HIGH priority lead
  31-50: Poor      -> GOOD lead
  51-70: Average   -> MODERATE lead
  71-100: Good     -> Skip (website is fine)
```

### Cost Per Website Analysis
| Component | Cost |
|-----------|------|
| Puppeteer (screenshots + text) | $0 |
| PageSpeed Insights | $0 |
| Wappalyzer | $0 |
| Claude Vision (2 screenshots) | ~$0.005 |
| Claude Text (content analysis) | ~$0.002 |
| **Total per site** | **~$0.007** |

**500 websites/month = ~$3.50** (extremely affordable)

---

## Stage 3: Score & Filter Leads

**Goal:** Rank dentists by opportunity — good reviews + bad website = hot lead.

### Lead Score Formula

```
Lead Score = (Google Rating Weight) + (Review Count Weight) - (Website Quality Score)

Where:
  Google Rating >= 4.0 stars     -> +30 points
  Google Rating 3.5-3.9          -> +20 points
  Review Count >= 50             -> +20 points
  Review Count 20-49             -> +10 points
  Website Score 0-30 (terrible)  -> +40 points
  Website Score 31-50 (poor)     -> +25 points
  Website Score 51-70 (average)  -> +10 points

Lead Score Range: 0-90
  70-90: HOT lead (prioritize)
  50-69: WARM lead
  30-49: COOL lead
  0-29:  Skip
```

### Dashboard View
The Leads page shows a table with:
- Clinic name, location, phone
- Google rating + review count
- Website quality score (color-coded: red/yellow/green)
- Lead score (HOT/WARM/COOL badge)
- Website screenshot thumbnail
- Actions: View Details, Create Website, Send Email

### Filters
- Filter by location/city
- Filter by lead score range
- Filter by website quality score
- Sort by lead score, rating, review count
- Search by clinic name

---

## Stage 4: Cold Email Outreach

**Goal:** Find the dentist's email, create a custom website mockup, and send a personalized cold email.

### Step 4a: Find Email Addresses

| Tool | Purpose | Cost | Hit Rate |
|------|---------|------|----------|
| **Contact page scraping** (Puppeteer) | Extract email from clinic website | Free | ~40-50% |
| **Hunter.io API** | Domain-based email lookup | Free (50/mo) or $34/mo | ~30-40% |
| **Outscraper Email Scraper** | Scrape from Google Business profile | ~$2/1K | ~20-30% |
| **Google Business Profile** | Some list email publicly | Free (from Places API) | ~15-20% |

**Waterfall approach:** Try each source in order until an email is found.

### Step 4b: Create Custom Website (External Tool)

This is done **outside the platform** using your preferred website builder:
- Build a custom dental website template/mockup
- Take a screenshot of the new design
- Host the screenshot for email embedding
- Store the design URL in the lead record

**Website builder suggestions:**
- Framer, Webflow, or WordPress + Elementor for rapid templating
- Create 3-5 dental templates, customize per clinic (logo, colors, services)
- Use AI tools (v0.dev, Bolt, Lovable) to generate custom designs quickly

### Step 4c: Send Cold Emails

#### Recommended Cold Email Platform

| Platform | Cost | Why |
|----------|------|-----|
| **Instantly.ai** (recommended) | $37/mo (Growth) | Unlimited email accounts + warmup, inbox rotation, built for cold email |
| **Smartlead** (alternative) | $39/mo (Basic) | Unlimited mailboxes, good value, agency features |

#### Email Infrastructure Setup

1. **Buy 3-5 separate domains** for cold outreach (~$10-12/domain/year)
   - Example: `getsmiledesigns.com`, `dentalwebpros.com`, etc.
   - **Never use your main business domain** for cold email

2. **Set up 2-3 Google Workspace inboxes per domain** ($6/mo each)
   - Example: `hello@getsmiledesigns.com`, `team@getsmiledesigns.com`

3. **Configure DNS records** for each domain:
   - SPF record
   - DKIM record
   - DMARC record

4. **Warm up all inboxes** for 2-4 weeks before sending (Instantly does this automatically)

5. **Sending limits:** 20-30 emails/inbox/day max
   - 5 domains x 3 inboxes x 25 emails = **375 emails/day capacity**

#### Email Template Strategy

**Subject Lines (A/B test these):**
- "Quick question about {practice_name}'s website"
- "I redesigned {practice_name}'s website (for free)"
- "{first_name}, your reviews are great but your site needs help"

**Email Body (Example):**
```
Hi {first_name},

I came across {practice_name} while researching top-rated dentists
in {city}. Your {rating}-star rating across {review_count} reviews
is impressive.

But I noticed your website might be holding you back. Here's what
I found:
- {specific_issue_1} (e.g., "not mobile-friendly")
- {specific_issue_2} (e.g., "no online booking option")
- {specific_issue_3} (e.g., "loads in 8+ seconds")

So I went ahead and designed a modern replacement — here's a preview:

[SCREENSHOT OF NEW WEBSITE DESIGN]

You can have this site for $0. You'd just prepay for one year of
hosting at $199 (includes hosting + tech support), and after that
it's $29/month.

Would it be worth a quick 10-minute call this week to walk through it?

Best,
{your_name}

---
{your_business_name}
{physical_address}
Unsubscribe: {unsubscribe_link}
```

**Follow-up Sequence (3-4 emails over 2-3 weeks):**
- Day 1: Initial email (above)
- Day 4: Follow-up referencing the design
- Day 9: Social proof ("other dentists in {city} switched")
- Day 14: Break-up email ("should I close your file?")

#### Embedding Screenshots in Emails
1. Capture screenshot of new design using ScreenshotOne or Puppeteer
2. Upload to cloud storage (S3/Cloudinary) -> get public URL
3. Embed as `<img src="hosted-url" alt="New website design for {practice_name}" width="600">`
4. Keep image under 600px wide for email compatibility

### CAN-SPAM Compliance (Required)
- [ ] Accurate "From" name and email
- [ ] Honest subject line
- [ ] Include physical mailing address in every email
- [ ] Include unsubscribe link (honor within 10 days)
- [ ] Identify as solicitation
- [ ] Penalty: up to $51,744 per violation

---

## Stage 5: Track & Manage Pipeline

**Goal:** Track leads through the sales funnel.

### Lead Statuses
```
DISCOVERED -> ANALYZED -> QUALIFIED -> WEBSITE_CREATED -> EMAIL_SENT -> REPLIED -> CONVERTED -> LOST
```

### Dashboard Features
- **Pipeline view:** Kanban board showing leads by status
- **Lead detail page:** All clinic data, scores, screenshots, email history
- **Analytics:** Conversion rates, emails sent, replies received
- **Settings:** API key management, email templates, scoring weights

---

## Technical Architecture

### Backend API Endpoints

```
# Auth (already built)
POST   /api/auth/login
GET    /api/auth/verify

# Location Search
POST   /api/search/dentists          # Search dentists in a location
GET    /api/search/history            # Previous searches

# Leads
GET    /api/leads                     # List all leads (with filters/pagination)
GET    /api/leads/:id                 # Lead detail
PATCH  /api/leads/:id/status          # Update lead status
DELETE /api/leads/:id                 # Remove lead

# Website Analysis
POST   /api/analysis/run/:leadId      # Trigger analysis for a lead
GET    /api/analysis/:leadId          # Get analysis results

# Email
POST   /api/email/find/:leadId        # Find email for a lead
POST   /api/email/send/:leadId        # Send outreach email
GET    /api/email/templates           # List email templates
POST   /api/email/templates           # Create/update template

# Dashboard
GET    /api/dashboard/stats           # Overview statistics
GET    /api/dashboard/analytics       # Detailed analytics
```

### MongoDB Models

```
# Lead
{
  businessName: String,
  address: String,
  city: String,
  state: String,
  phone: String,
  website: String,
  googlePlaceId: String,
  googleMapsUrl: String,
  googleRating: Number,
  googleReviewCount: Number,
  reviews: [{ author, rating, text, date }],
  email: String,
  emailSource: String,          # "hunter" | "scrape" | "outscraper" | "manual"
  websiteAnalysis: {
    performanceScore: Number,
    seoScore: Number,
    accessibilityScore: Number,
    visualScore: Number,
    contentScore: Number,
    overallScore: Number,
    techStack: [String],
    issues: [String],
    screenshots: { desktop: String, mobile: String },
    analyzedAt: Date
  },
  leadScore: Number,
  status: String,               # discovered | analyzed | qualified | website_created | email_sent | replied | converted | lost
  customWebsiteUrl: String,
  customWebsiteScreenshot: String,
  emailHistory: [{
    sentAt: Date,
    template: String,
    subject: String,
    status: String              # sent | opened | replied | bounced
  }],
  notes: String,
  searchQuery: String,          # which search found this lead
  createdAt: Date,
  updatedAt: Date
}

# SearchHistory
{
  query: String,                # "dentist in New York"
  location: String,
  resultsCount: Number,
  leadsGenerated: Number,
  searchedAt: Date
}

# EmailTemplate
{
  name: String,
  subject: String,
  body: String,                 # with {{variable}} placeholders
  type: String,                 # initial | followup_1 | followup_2 | breakup
  createdAt: Date
}
```

### Frontend Pages

```
/                          # Login (already built)
/dashboard                 # Overview stats (already built - needs real data)
/dashboard/search          # NEW - Search dentists by location
/dashboard/leads           # Lead table with filters and scores
/dashboard/leads/:id       # Lead detail - analysis, screenshots, email
/dashboard/outreach        # Email templates and send queue
/dashboard/analytics       # Conversion funnel, charts
/dashboard/settings        # API keys, preferences
```

### New Redux Slices Needed
```
store/slices/
  authSlice.ts          # (already exists)
  searchSlice.ts        # Search state, results
  leadsSlice.ts         # Lead list, filters, CRUD
  analysisSlice.ts      # Website analysis state
  emailSlice.ts         # Email templates, send queue
  dashboardSlice.ts     # Dashboard stats
```

---

## All API Keys / Accounts Needed

| Service | Purpose | Cost | Priority |
|---------|---------|------|----------|
| **Google Cloud (Places API)** | Find dentists | Free ($200/mo credit) | Must have |
| **Anthropic (Claude API)** | Website analysis (vision + text) | ~$5/mo at 500 sites | Must have |
| **Google PageSpeed Insights** | Performance scoring | Free | Must have |
| **Hunter.io** | Email discovery | Free (50/mo) or $34/mo | Should have |
| **Instantly.ai** or **Smartlead** | Cold email sending | $37-39/mo | Must have (for outreach) |
| **Google Workspace** | Email inboxes for sending | $6/inbox/mo | Must have (for outreach) |
| **Outscraper** | Full Google reviews + emails | Pay-per-use (~$5-10/mo) | Nice to have |
| **3-5 Cold email domains** | Separate sending domains | $10-12/domain/year | Must have (for outreach) |
| **Cloudinary** or **AWS S3** | Host screenshots/images | Free tier sufficient | Should have |
| **DataForSEO** | Detailed SEO audits | ~$0.02/page (optional) | Nice to have |

### Total Monthly Cost Estimate

| Item | Cost |
|------|------|
| Google Places API | $0 (free tier) |
| Claude API (500 analyses) | ~$3.50 |
| PageSpeed Insights | $0 |
| Hunter.io (starter) | $34 |
| Instantly.ai | $37 |
| Google Workspace (6 inboxes) | $36 |
| Cold email domains (5) | ~$5/mo amortized |
| VPS for Puppeteer (optional) | $20 |
| **Total** | **~$135/mo** |

**Break-even: 1 converted client at $199 pays for the entire month of tooling.**

---

## Implementation Phases

### Phase 1: Core Search & Storage (Week 1-2)
- [ ] Lead model in MongoDB
- [ ] Google Places API integration (search + details)
- [ ] Search page in dashboard (enter city, see results)
- [ ] Store discovered leads in database
- [ ] Lead list page with basic table

### Phase 2: Website Analysis Engine (Week 3-4)
- [ ] Puppeteer service (screenshots + text extraction + Wappalyzer)
- [ ] PageSpeed Insights API integration
- [ ] Claude API integration (vision + text analysis)
- [ ] Scoring algorithm
- [ ] Analysis results displayed on lead detail page
- [ ] Batch analysis (analyze all leads from a search)

### Phase 3: Lead Scoring & Dashboard (Week 5)
- [ ] Lead scoring formula implementation
- [ ] Dashboard stats with real data
- [ ] Filters and sorting on leads page
- [ ] Lead detail page (full clinic data + analysis + screenshots)
- [ ] Pipeline/status management

### Phase 4: Email Discovery & Outreach (Week 6-7)
- [ ] Email finder (contact page scraping + Hunter.io)
- [ ] Email template system (CRUD + variable placeholders)
- [ ] Instantly.ai or Smartlead API integration
- [ ] Send email from platform
- [ ] Email history tracking per lead
- [ ] Outreach page (queue, templates, stats)

### Phase 5: Analytics & Polish (Week 8)
- [ ] Analytics page (funnel visualization, conversion rates)
- [ ] Export leads to CSV
- [ ] Bulk actions (analyze all, send to all qualified)
- [ ] Settings page (API keys, scoring weights)
- [ ] Error handling, loading states, edge cases

---

## Key Technical Decisions

1. **Puppeteer runs on the backend** - Website analysis is a background job, not real-time. Queue leads for analysis and process them asynchronously.

2. **Use Bull/BullMQ for job queues** - Analysis and email sending are async tasks. Use Redis-backed queues to manage them reliably.

3. **Cache everything** - Store Google API results and analysis in MongoDB. Never re-fetch unless explicitly refreshed.

4. **Rate limiting** - Google PSI takes 10-30 seconds per URL. Process 2-3 concurrently max. Claude API calls are fast but respect rate limits.

5. **Screenshots stored in cloud** - Upload to Cloudinary (free tier: 25 credits/mo) or S3. Store URLs in the lead document.

---

## Folder Structure (New Files)

```
backend/src/
  models/
    Lead.ts
    SearchHistory.ts
    EmailTemplate.ts
  services/
    googlePlacesService.ts
    websiteAnalysisService.ts
    claudeAnalysisService.ts
    emailFinderService.ts
    emailSenderService.ts
    scoringService.ts
    dashboardService.ts
  controllers/
    searchController.ts
    leadsController.ts
    analysisController.ts
    emailController.ts
    dashboardController.ts
  routes/
    searchRoutes.ts
    leadsRoutes.ts
    analysisRoutes.ts
    emailRoutes.ts
    dashboardRoutes.ts
  jobs/
    analysisQueue.ts        # BullMQ job processor
    emailQueue.ts

frontend/app/
  store/slices/
    searchSlice.ts
    leadsSlice.ts
    analysisSlice.ts
    emailSlice.ts
    dashboardSlice.ts
  dashboard/
    search/page.tsx
    leads/page.tsx
    leads/[id]/page.tsx
    outreach/page.tsx
    analytics/page.tsx
    settings/page.tsx
  components/
    SearchForm.tsx
    LeadTable.tsx
    LeadCard.tsx
    LeadDetail.tsx
    AnalysisReport.tsx
    ScoreBadge.tsx
    EmailComposer.tsx
    PipelineBoard.tsx
    StatsCard.tsx
```

---

## NPM Packages to Add

### Backend
```
npm install @googlemaps/google-maps-services-js  # Google Places
npm install @anthropic-ai/sdk                     # Claude API
npm install puppeteer                             # Website screenshots & scraping
npm install wappalyzer                            # Tech detection
npm install bullmq ioredis                        # Job queues
npm install cloudinary                            # Image hosting
npm install node-cron                             # Scheduled jobs (optional)
```

### Frontend
```
npm install recharts                              # Charts for analytics
npm install @tanstack/react-table                 # Advanced table for leads
npm install date-fns                              # Date formatting
```
