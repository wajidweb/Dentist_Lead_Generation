# Dental Website Benchmark & Calibrated Analysis Prompt

> **Based on:** Analysis of 22 dental websites (20 practices + 2 outliers excluded)
> **Date:** April 2026
> **Purpose:** Calibrate the Claude analysis prompt with real industry data

---

## 1. Benchmark Data (From 20 Dental Practice Websites)

### Visual Quality Distribution

| Category | Count | Percentage | What These Look Like |
|----------|-------|------------|----------------------|
| Excellent | 7 | 35% | Custom agency design (Delmain, TNT Dental), premium typography, real professional photography, generous whitespace, modern 2024+ aesthetics |
| Good | 7 | 35% | Clean WordPress/Elementor templates, professional but template-driven, adequate imagery, functional design |
| Fair | 6 | 30% | Basic templates, stock imagery, builder limitations visible, functional but not impressive |
| Poor | 0 | 0% | *Not represented in sample (biased toward above-average sites)* |

**Important calibration note:** This sample is biased toward better sites. In real Google Places discovery data, expect the distribution to shift toward:
- Excellent: ~10-15%
- Good: ~20-25%
- Fair: ~35-40%
- Poor: ~20-30%

### Design Era Distribution

| Era | Count | Percentage |
|-----|-------|------------|
| 2024-2025 (cutting-edge) | 10 | 50% |
| 2022-2023 (modern) | 6 | 30% |
| 2018-2021 (aging) | 4 | 20% |
| Pre-2018 (outdated) | 0 | 0% |

**In real data, expect ~15-25% pre-2018 sites.** These are the strongest leads.

### Content Item Presence (12 Items)

| Content Item | Present | Percentage | Notes |
|-------------|---------|------------|-------|
| Service descriptions | 20/20 | **100%** | Always present but quality varies hugely (60% good, 40% basic) |
| Contact info | 20/20 | **100%** | Universal, but placement/prominence varies |
| About practice | 20/20 | **100%** | Universal |
| Social media links | 20/20 | **100%** | Universal |
| Patient testimonials | 19/20 | **95%** | Nearly universal; sources: Google reviews, custom quotes, video testimonials |
| Doctor/team bios | 14/20 | **70%** | 70% have photos; 20% have names only; 10% missing entirely |
| Blog content | 14/20 | **70%** | Present but rarely active/current |
| Office hours | 14/20 | **70%** | Surprisingly missing on 30% of sites |
| Online booking | 12/20 | **60%** | Real systems: Modento, RecallMax, ZocDoc. Rest use basic CTAs or none |
| New patient info | 12/20 | **60%** | Ranges from dedicated pages to brief mentions |
| Insurance info | 10/20 | **50%** | The biggest content gap on US dental sites |
| Emergency info | 10/20 | **50%** | Often just a phone number, rarely a dedicated section |
| Before/after photos | 9/20 | **45%** | Strong differentiator when present |

**Average items present: 8.5 out of 12 (71%)**

### Critical Missing Items (Most Pitchable)

Ranked by pitch value (how compelling this gap is when selling a new website):

1. **Online booking** — 40% lack any real booking system. Strongest pitch: "Patients must call during business hours to schedule — you're losing after-hours bookings"
2. **Before/after photos** — 55% missing. Strong pitch: "Your best work is invisible to potential patients"
3. **Insurance info** — 50% missing. Pitch: "Patients want to know if their insurance is accepted before they call"
4. **Emergency info** — 50% missing. Pitch: "Dental emergencies don't wait — patients need to know you're available"
5. **New patient info** — 40% missing. Pitch: "New patients don't know what to expect at their first visit"
6. **Office hours** — 30% missing. Pitch: "Patients can't find when you're open"
7. **Doctor bios with photos** — 30% missing/incomplete. Pitch: "Patients want to see who's treating them before they book"

### Technical Features

| Feature | Present | Percentage |
|---------|---------|------------|
| Mobile viewport meta | 20/20 | 100% |
| Phone link (tel:) | 19/20 | 95% |
| Google Map embed | 16/20 | 80% |
| Video content | 14/20 | 70% |
| Contact form | 8/20 | 40% |
| Booking widget/iframe | 8/20 | 40% |
| Schema markup (JSON-LD) | **0/20** | **0%** |
| Email link (mailto:) | 3/20 | 15% |

**The JSON-LD finding is remarkable:** Zero out of 20 dental practice sites implement structured data. This is a universal SEO weakness in the dental industry.

### Platform Distribution

| Platform | Count | Percentage |
|----------|-------|------------|
| WordPress (Divi/Elementor/Astra) | 14 | 70% |
| Bootstrap/custom HTML | 3 | 15% |
| Webflow | 1 | 5% |
| Dental-specific CMS (Alatus/Octane) | 1 | 5% |
| Hostinger Website Builder | 1 | 5% |

### Key Visual Patterns Observed

**What separates "Excellent" from "Fair" dental websites:**

| Dimension | Excellent Sites | Fair Sites |
|-----------|----------------|------------|
| **Photography** | Real professional photos of office, staff, patients | Obvious stock photos, clip art, or few images |
| **Color scheme** | Warm cream/gold/teal palettes, consistent brand | Generic blue/white, inconsistent, template defaults |
| **Typography** | Custom/premium fonts (2-3 font families, intentional pairing) | System defaults or single generic font |
| **Hero section** | Full-width with video, strong headline, clear CTA | Basic slider or static image with weak messaging |
| **Whitespace** | Generous, breathes, luxury feel | Cramped, dense, information overload |
| **CTAs** | "Book Now" prominent above fold, clear next step | Buried or generic "Contact Us" |
| **Trust signals** | Google review count badge, before/after gallery, video testimonials | Text-only testimonials or none |
| **Mobile** | True responsive with touch-friendly elements | Desktop layout forced onto mobile |

**Identifying markers of a "Poor" website (not in our sample but definable):**
- Design from pre-2015 (gradient buttons, beveled edges, Flash-era aesthetic)
- No hero section — just a logo and text links
- Clip art or no imagery at all
- Horizontal scrolling on mobile
- Multiple font sizes/colors with no hierarchy
- No clear CTA above the fold
- Generic template with zero customization
- Auto-playing music or Flash elements
- Table-based layout visible
- Hit counter or "last updated" date visible

### Market Differences: US vs India

| Dimension | US/Canada Dental Sites | Indian Dental Sites |
|-----------|----------------------|---------------------|
| Booking | RecallMax, Modento, ZocDoc | WhatsApp, Practo, phone calls |
| Email | Branded domain email | Gmail addresses common (unprofessional) |
| Insurance | Expected on site (PPO, in-house plans) | EMI/installment plans instead |
| Communication | Phone + online booking | WhatsApp floating button is standard |
| Design agencies | Delmain, TNT Dental (dental-specific) | Template builders (Hostinger, generic WP) |
| Trust signals | Google reviews badge, awards | Patient count stats ("10,000+ patients") |

---

## 2. The Ideal Dental Website Standard

Based on analysis of the top-performing sites (Canary Dental, Heritage House, Holy City Orthodontics, Smile Lounge BK, Kumra Ortho), here is what a modern dental website SHOULD have:

### Visual Standard

- **Design:** Modern 2024-2026 aesthetic with generous whitespace, card-based layouts
- **Colors:** Warm, sophisticated palette (cream/gold/teal/forest green — not generic blue/white)
- **Typography:** 2-3 intentional font pairings (serif display + sans-serif body)
- **Photography:** Real professional photos of office, staff, and patients. No stock photos.
- **Hero section:** Full-width with video or professional image, clear headline, prominent "Book Now" CTA
- **Mobile:** True responsive design with touch-friendly buttons, no horizontal scrolling

### Content Standard (All 12 Items Present)

1. **Service descriptions** — Categorized (General, Cosmetic, Surgical) with descriptions, not just names
2. **Doctor bios** — Photo, credentials, personal touches, education background
3. **Patient testimonials** — Named reviews from Google, video testimonials, star ratings
4. **Online booking** — Real scheduling system (RecallMax, Modento, ZocDoc), not just a phone number
5. **Contact info** — Phone in header (clickable tel: link), address in footer, map embedded
6. **Insurance info** — List of accepted plans, in-house membership option, payment alternatives
7. **Office hours** — Clearly displayed, highlighting evening/weekend availability
8. **New patient info** — What to expect, special offers ($99 exam, free consult), downloadable forms
9. **Before/after photos** — Gallery of real treatment results (especially Invisalign, veneers, whitening)
10. **Blog content** — Educational articles about dental health, treatment FAQs
11. **Emergency info** — Dedicated section with emergency phone number, same-day availability messaging
12. **About practice** — Philosophy, history, what makes them different, community involvement

### Technical Standard

- Clickable phone link (tel:)
- Email link (mailto:) with branded domain email
- Real booking widget integrated (not just a "call us" button)
- Google Map embedded
- Social media linked (minimum Facebook + Instagram)
- JSON-LD structured data for LocalBusiness/Dentist
- Video content (office tour, doctor introduction, or patient testimonial)
- Mobile-responsive with viewport meta
- SSL/HTTPS enabled
- Page load under 3 seconds on mobile

---

## 3. The Calibrated Claude Analysis Prompt

This is the production prompt used for every website analysis. It includes the benchmark context from our 20-site study.

### System Context Block (Injected Before Every Analysis)

```
DENTAL WEBSITE INDUSTRY BENCHMARKS
Based on analysis of 20+ dental practice websites across North America and India:

VISUAL QUALITY BASELINE:
- About 35% of dental websites have excellent, agency-level design with custom photography
  and premium typography. These represent the TOP TIER and should be rated "excellent."
- About 35% have clean but template-driven design (WordPress/Elementor). These are AVERAGE
  for the industry and should be rated "good."
- About 30% have basic template designs with stock photos and builder limitations visible.
  These are BELOW AVERAGE and should be rated "fair."
- Sites with pre-2018 design aesthetics (gradient buttons, clip art, Flash-era layouts, no
  mobile responsiveness, table-based layouts) should be rated "poor." These represent
  roughly 15-25% of dental sites found via Google Places but were underrepresented in our
  benchmark sample.

CONTENT BASELINE (what the average dental website has):
- 100% have service descriptions (but only 60% describe them well)
- 95% have patient testimonials
- 70% have doctor bios (but only 70% of those include photos)
- 70% have blog content (usually inactive)
- 70% display office hours
- 60% have some form of online booking
- 60% have new patient information
- 50% have insurance information — THIS IS A MAJOR GAP
- 50% have emergency information
- 45% have before/after photos — STRONG DIFFERENTIATOR WHEN PRESENT
- Average dental site has 8-9 out of 12 critical content items

MOST COMMON MISSING CONTENT (in order of pitch value):
1. Real online booking system (40% lack this)
2. Before/after treatment photos (55% missing)
3. Insurance information (50% missing)
4. Emergency dental information (50% missing)
5. New patient info/offers (40% missing)

TECHNICAL BASELINE:
- 0% of dental sites in our sample implement JSON-LD structured data
- 95% have clickable phone links
- 80% have Google Maps embedded
- Only 15% have clickable email links
- 70% of dental sites are built on WordPress
- Only 40% have a real booking widget (rest use basic CTA buttons or phone only)

WHAT SEPARATES EXCELLENT FROM POOR DENTAL WEBSITES:
- EXCELLENT: Custom agency design, real professional photography (not stock), warm
  sophisticated color palette, premium font pairing, video content, before/after gallery,
  named testimonials with stars, real booking system, generous whitespace
- POOR: Pre-2018 design, stock photos or clip art, generic blue/white template colors,
  system default fonts, no hero section, no clear CTA, no booking capability, cramped
  layout, not mobile-responsive, table-based or Flash-era layout

CALIBRATION INSTRUCTION:
Use these benchmarks to calibrate your ratings. A website that matches the industry average
(template WordPress, basic content, some stock photos) should be rated "fair" to "good" —
it is typical but mediocre. Only rate "excellent" for sites that clearly exceed the industry
average with custom design, professional photography, and comprehensive content. Rate "poor"
for sites that are clearly below the industry floor — outdated design, missing fundamental
content, broken mobile experience.
```

### Main Analysis Prompt

```
You are an expert dental practice website auditor. Your analysis will be used to identify
dental practices with weak websites that could benefit from a professional redesign.

{DENTAL_WEBSITE_INDUSTRY_BENCHMARKS}

You are now analyzing a dental practice website.
- Image 1: Desktop viewport screenshot (1280x800)
- Image 2: Mobile viewport screenshot (390x844)

EXTRACTED TEXT FROM THE WEBSITE:
---
{pageText}
---

AUTOMATED DOM CHECKS:
- HTTPS: {isHttps}
- Page load time: {loadTimeMs}ms
- Contact form detected: {hasContactForm}
- Clickable phone link (tel:): {hasPhoneLink}
- Clickable email link (mailto:): {hasEmailLink}
- Booking widget/iframe detected: {hasBookingWidget}
- Google Map embedded: {hasGoogleMap}
- Social media links: {hasSocialLinks}
- Schema markup (JSON-LD): {hasSchemaMarkup}
- Video content: {hasVideo}
- Total images on page: {imageCount}
- Navigation items: {navigationItemCount}

PART 1 — VISUAL QUALITY ASSESSMENT

Evaluate the website's visual design against dental industry standards. For each dimension,
assign a category: "poor", "fair", "good", or "excellent".

1. DESIGN_MODERNITY
   Rate how current the design looks:
   - "excellent": Cutting-edge 2024-2026 design. Clean typography, generous whitespace,
     hero sections with video, card-based layouts, modern CSS effects. Comparable to
     agency-designed sites like Canary Dental or Smile Lounge BK.
   - "good": Modern template-based design (2022-2024). Clean Elementor/Divi layout,
     adequate spacing, professional but clearly template-driven.
   - "fair": Aging design (2018-2021). Outdated elements visible but still functional.
     Bootstrap template feel, generic layout.
   - "poor": Pre-2018 design. Gradient buttons, clip art, Flash-era aesthetics, tiny text,
     table-based layout, no hero section, hit counters, "last updated" dates visible.

2. COLOR_SCHEME
   Rate the color palette professionalism:
   - "excellent": Sophisticated, intentional brand palette. Examples: warm cream + forest
     green, rose gold + dark brown, gold + black. Consistent throughout.
   - "good": Professional and cohesive but not distinctive. Standard blue/white or
     green/white dental palette. No clashing.
   - "fair": Generic or inconsistent. Template default colors, minor clashing,
     too many colors competing.
   - "poor": Unprofessional. Neon/garish colors, no consistency, poor contrast making
     text hard to read, clashing color combinations.

3. LAYOUT_QUALITY
   Rate the visual organization:
   - "excellent": Clear visual hierarchy, logical information flow, grid-based sections,
     consistent spacing, content is scannable at a glance.
   - "good": Organized but somewhat predictable template layout. Content is findable
     but not elegantly presented.
   - "fair": Some organization issues. Dense content blocks, inconsistent spacing,
     unclear where to look first.
   - "poor": Cluttered, chaotic. No visual hierarchy. Text walls. Information overload.
     Hard to find what you need.

4. IMAGE_QUALITY
   Rate the imagery approach:
   - "excellent": Professional real photos of the actual office, staff, and patients.
     High resolution, properly sized, professional lighting/composition.
   - "good": Mix of real and stock photos. Adequate quality. Some custom imagery.
   - "fair": Mostly stock photos. Generic "smiling patient" stock images obvious.
     Some low resolution or poorly sized images.
   - "poor": Clip art, very low resolution images, stretched/pixelated photos,
     no real imagery of the practice at all, or very few images (under 5).

5. CTA_VISIBILITY
   Rate how clear the calls-to-action are:
   - "excellent": "Book Appointment" or "Schedule Now" button is prominent above the fold.
     Phone number visible in header. Multiple clear pathways to convert. Real booking
     widget integrated.
   - "good": CTAs present and visible but not dominant. Phone number in header.
     Basic appointment request option.
   - "fair": CTAs exist but are buried or generic ("Contact Us"). Not immediately obvious
     how to book an appointment.
   - "poor": No clear CTA above the fold. Contact information buried. No booking option.
     Visitor has no clear next step.

6. TRUST_SIGNALS
   Rate the confidence-building elements:
   - "excellent": Google review count badge, named patient testimonials with star ratings,
     before/after gallery, video testimonials, professional association logos (ADA),
     doctor credentials prominently displayed, awards.
   - "good": Text testimonials present, doctor bios with credentials, some social proof.
   - "fair": Minimal trust signals. Maybe a few testimonials but no star ratings, no
     visual social proof, credentials not prominent.
   - "poor": No testimonials, no credentials visible, anonymous feel. No reason to
     trust this practice over any other.

7. MOBILE_EXPERIENCE
   Rate the mobile screenshot specifically:
   - "excellent": True responsive design. Touch-friendly buttons, readable text without
     zooming, optimized navigation (hamburger menu), content reflows properly.
   - "good": Responsive but with minor issues. Mostly works on mobile, occasional
     spacing or sizing problems.
   - "fair": Basic responsiveness. Content shifts but not optimized for mobile.
     Some elements too small to tap. Text may be too small.
   - "poor": Not mobile-responsive at all. Desktop layout on mobile, horizontal scrolling
     required, text is tiny, buttons impossible to tap.

After evaluating all 7 dimensions, determine the OVERALL VISUAL CATEGORY:
- Weight design_modernity and mobile_experience most heavily (patients notice these first)
- A site that is "fair" on most dimensions but "poor" on mobile should trend toward "poor" overall
- A site that is "good" on most but "excellent" on design and CTAs can be "excellent" overall

Also estimate the design era (e.g., "2012-2015", "2018-2021", "2023-2025").

List the top 3 visual issues visible in the screenshots.

PART 2 — CONTENT QUALITY ASSESSMENT

For each of the 12 content areas below, determine:
- present: Is this content on the website? (true/false)
- quality: If present, how good is it? ("good", "basic", "poor", "missing")
- note: A brief specific observation (1 sentence max)

Use BOTH the extracted text AND the screenshots to evaluate. The text tells you what content
exists; the screenshots tell you how it's presented. Cross-reference: if the text mentions
"Book Online" but the screenshot shows no booking button, note the discrepancy.

Content items to evaluate:

1. SERVICE_DESCRIPTIONS — Are dental services listed WITH descriptions?
   "good" = categorized services (General, Cosmetic, Surgical) with paragraphs explaining each
   "basic" = services listed as names/bullet points with minimal description
   "poor" = services mentioned in passing but no dedicated content
   "missing" = no service information at all

2. DOCTOR_BIOS — Are doctor/team biographies present?
   "good" = named doctors with photos, credentials, education, personal touches
   "basic" = names and titles, maybe a brief bio, no/poor photos
   "poor" = team mentioned but no individual information
   "missing" = no doctor or team information

3. PATIENT_TESTIMONIALS — Are patient reviews/testimonials displayed?
   "good" = named patients, star ratings, multiple testimonials, possibly video
   "basic" = a few text quotes, may lack names or ratings
   "poor" = generic positive statements without attribution
   "missing" = no testimonials or reviews

4. ONLINE_BOOKING — Can patients book appointments online?
   "good" = real booking system integrated (Modento, RecallMax, ZocDoc, Calendly, etc.)
   "basic" = appointment request form (patient fills in details, practice calls back)
   "poor" = "Call to schedule" with phone number only
   "missing" = no booking or scheduling information

5. CONTACT_INFO — Is contact information prominently displayed?
   "good" = phone in header (clickable), address in footer, multiple contact methods
   "basic" = contact info exists but not prominent (footer only, or separate page)
   "poor" = contact info hard to find or incomplete

6. INSURANCE_INFO — Is insurance/payment information provided?
   Check for: accepted insurance plans, in-house membership, financing options, payment methods

7. OFFICE_HOURS — Are business hours clearly displayed?
   Check for: days and times listed, holiday hours, extended/weekend hours noted

8. NEW_PATIENT_INFO — Is there information specifically for new patients?
   Check for: first visit info, new patient specials/offers, downloadable forms, what to expect

9. BEFORE_AFTER — Are before/after treatment photos shown?
   Check for: treatment result galleries, transformation photos (especially Invisalign, veneers, whitening)

10. BLOG_CONTENT — Is there educational dental content?
    Check for: articles, FAQs, dental health tips, treatment explanations

11. EMERGENCY_INFO — Is emergency dental care information available?
    Check for: emergency phone number, same-day availability messaging, after-hours instructions

12. ABOUT_PRACTICE — Is there an about section?
    "good" = practice philosophy, history, what makes them different, community involvement
    "basic" = generic welcome message
    "poor" = minimal "about" content

After evaluating all 12 items:
- Count how many are present (true)
- Determine the OVERALL CONTENT CATEGORY based on:
  - "excellent": 10-12 items present, most rated "good"
  - "good": 8-9 items present, mix of "good" and "basic"
  - "fair": 5-7 items present, mostly "basic" quality
  - "poor": 0-4 items present, or many present but all "poor" quality
- List the critical missing items (items with the highest pitch value that are absent)

PART 3 — ISSUES & EMAIL AMMUNITION

Generate a list of 3-7 specific, concrete issues found on this website. These will be used
directly in cold outreach emails to the dentist, so they must be:

REQUIREMENTS FOR EACH ISSUE:
- SPECIFIC: Reference exactly what's wrong ("No online booking system" not "Could be improved")
- PATIENT-IMPACT FOCUSED: Frame it as how it affects their patients/business
- UNDERSTANDABLE BY A NON-TECHNICAL DENTIST: No jargon like "LCP" or "CLS"
- FACTUAL: Based on what you actually see, not assumptions

GOOD ISSUE EXAMPLES:
- "Your website has no online booking — patients who find you after hours can't schedule an appointment"
- "There are no patient testimonials on your website, despite your excellent 4.8-star Google rating"
- "Your website takes over 6 seconds to load on mobile — research shows 53% of visitors leave after 3 seconds"
- "The mobile version of your site shows a desktop layout with tiny text — over 60% of patients search on their phones"
- "There is no before/after gallery showcasing your treatment results to potential patients"
- "Your site uses stock photos instead of real images of your office and team — this reduces patient trust"
- "Insurance information is not listed on your website — patients want to verify coverage before calling"

BAD ISSUE EXAMPLES (too generic, avoid these):
- "The website needs improvement"
- "SEO could be better"
- "Design is outdated"
- "Content should be added"

Finally, write a one_line_summary: A single sentence summarizing the website's overall quality
and the biggest opportunity for improvement. This should be punchy and specific.

Example: "Outdated 2014-era design with no mobile responsiveness, no online booking, and no
patient testimonials despite excellent Google reviews — strong redesign opportunity."
```

### Response Schema (Structured Output)

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
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 5
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
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
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
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "office_hours": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "new_patient_info": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "before_after": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "blog_content": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
          "additionalProperties": false
        },
        "emergency_info": {
          "type": "object",
          "properties": {
            "present": { "type": "boolean" },
            "quality": { "type": "string", "enum": ["good", "basic", "poor", "missing"] },
            "note": { "type": "string" }
          },
          "required": ["present", "quality", "note"],
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
    "content_items_present_count": {
      "type": "integer",
      "minimum": 0,
      "maximum": 12
    },
    "critical_missing": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 0,
      "maxItems": 6
    },
    "issues_list": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 3,
      "maxItems": 7
    },
    "one_line_summary": { "type": "string" }
  },
  "required": [
    "visual_category",
    "visual_sub_scores",
    "design_era_estimate",
    "visual_issues",
    "content_category",
    "content_items",
    "content_items_present_count",
    "critical_missing",
    "issues_list",
    "one_line_summary"
  ],
  "additionalProperties": false
}
```

---

## 4. Suggestions & Missing Elements

### Things Discovered During Analysis Not Covered in Original Plan

1. **Gmail vs branded email detection** — Multiple Indian dental sites use Gmail addresses (nagpurdentist@gmail.com, omdentalnagpur@gmail.com). This is a strong unprofessionalism signal and should be flagged as an issue. Add to DOM checks: detect if the visible email is a free provider (gmail, yahoo, hotmail, outlook) vs branded domain.

2. **WhatsApp vs booking widget distinction** — Indian market dental sites use WhatsApp as their primary booking channel. The DOM check for booking widgets should also detect WhatsApp buttons (`a[href*="wa.me"], a[href*="whatsapp.com"]`) and note this as "WhatsApp only" rather than "no booking" — it's a regional pattern, not necessarily a failure.

3. **Multiple phone numbers problem** — Several sites have 3-4 phone numbers with no clear primary. This confuses patients. The analysis should note when there are too many phone numbers without clear labeling.

4. **Stock photo detection signal** — Stock photos are identifiable by: image filenames with commas and descriptive words (e.g., "Smile,,Family,And,Portrait"), CDN URLs from known stock providers (shutterstock, istock, gettyimages, unsplash in src), and generic alt text. While Claude Vision can visually detect stock photos, adding filename-based detection as a DOM check would provide an additional signal.

5. **Cookie consent/GDPR banner detection** — Several sites had GDPR/cookie plugins. Add to the Puppeteer preprocessing a check for common cookie consent class names to verify the banner was successfully dismissed.

6. **Instagram feed integration** — The best sites (Delmain agency) embed live Instagram feeds on their homepage. This serves as both social proof and fresh content. Worth noting in the analysis when present — it's a sign of an active, modern practice.

7. **New patient offers/specials** — "$99 New Patient Exam" type offers were present on the highest-converting sites. The content analysis should specifically look for promotional pricing or new patient specials, as these indicate marketing sophistication.

8. **Page builder bloat detection** — Sites running dual page builders (Divi + Elementor) had dramatically larger file sizes (1-2MB+). While we're not analyzing tech stack, detecting excessive HTML size (>500KB for a single page) could be an additional quality signal.

9. **Referral programs** — Torrance Dentist had "Give $50, Get $50". This is a sign of marketing maturity. Worth noting when present but not a scoring factor.

10. **Multilingual support** — Navesink had English/Spanish toggle. Relevant for practices in diverse areas. Could be a future enhancement to note.

### Recommended DOM Check Additions

```javascript
// Add these to the existing DOM checks:

// Email provider check
const emailOnPage = await page.evaluate(() => {
  const text = document.body.innerText;
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return emailMatch ? emailMatch[0] : null;
});
const usesGmailOrFree = emailOnPage &&
  /gmail\.com|yahoo\.com|hotmail\.com|outlook\.com/i.test(emailOnPage);

// WhatsApp as booking method
const hasWhatsApp = await page.evaluate(() =>
  !!document.querySelector('a[href*="wa.me"], a[href*="whatsapp.com"], [class*="whatsapp" i]')
);

// New patient special/offer
const hasNewPatientOffer = await page.evaluate(() => {
  const text = document.body.innerText.toLowerCase();
  return /new patient special|free consult|free exam|\$\d+ (new patient|exam|cleaning)/i.test(text);
});

// Instagram feed embedded
const hasInstagramFeed = await page.evaluate(() =>
  !!document.querySelector('iframe[src*="instagram"], [class*="instagram-feed"], [id*="instagram"]')
);

// Excessive page size flag
const htmlSize = (await page.content()).length;
const isExcessivelyLarge = htmlSize > 500000; // >500KB
```

---

## 5. Prompt Versioning

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | April 2026 | Initial calibrated prompt based on 20-site benchmark |

When the 100-website benchmark (Phase 6 in ANALYZE_LEAD_PLAN.md) is complete, update:
- The percentage distributions in the benchmark context
- The content item presence percentages
- The "excellent" vs "poor" reference examples
- Version to v2.0
