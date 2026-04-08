import { DENTAL_STANDARD_CONTEXT } from "./dentalStandard";

interface PromptParams {
  pageText: string;
  isHttps: boolean;
  loadTimeMs: number;
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
}

export const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    visual_category: {
      type: "string",
      enum: ["poor", "fair", "good", "excellent"],
    },
    visual_sub_scores: {
      type: "object",
      properties: {
        design_modernity: {
          type: "string",
          enum: ["poor", "fair", "good", "excellent"],
        },
        color_scheme: {
          type: "string",
          enum: ["poor", "fair", "good", "excellent"],
        },
        layout_quality: {
          type: "string",
          enum: ["poor", "fair", "good", "excellent"],
        },
        image_quality: {
          type: "string",
          enum: ["poor", "fair", "good", "excellent"],
        },
        cta_visibility: {
          type: "string",
          enum: ["poor", "fair", "good", "excellent"],
        },
        trust_signals: {
          type: "string",
          enum: ["poor", "fair", "good", "excellent"],
        },
        mobile_experience: {
          type: "string",
          enum: ["poor", "fair", "good", "excellent"],
        },
      },
      required: [
        "design_modernity",
        "color_scheme",
        "layout_quality",
        "image_quality",
        "cta_visibility",
        "trust_signals",
        "mobile_experience",
      ],
      additionalProperties: false,
    },
    design_era_estimate: { type: "string" },
    visual_issues: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
    content_category: {
      type: "string",
      enum: ["poor", "fair", "good", "excellent"],
    },
    content_items: {
      type: "object",
      properties: {
        service_descriptions: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        doctor_bios: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        patient_testimonials: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        online_booking: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        contact_info: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        insurance_info: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        office_hours: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        new_patient_info: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        before_after: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        blog_content: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        emergency_info: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
        about_practice: {
          type: "object",
          properties: {
            present: { type: "boolean" },
            quality: {
              type: "string",
              enum: ["good", "basic", "poor", "missing"],
            },
            note: { type: "string" },
          },
          required: ["present", "quality", "note"],
          additionalProperties: false,
        },
      },
      required: [
        "service_descriptions",
        "doctor_bios",
        "patient_testimonials",
        "online_booking",
        "contact_info",
        "insurance_info",
        "office_hours",
        "new_patient_info",
        "before_after",
        "blog_content",
        "emergency_info",
        "about_practice",
      ],
      additionalProperties: false,
    },
    content_items_present_count: {
      type: "integer",
      minimum: 0,
      maximum: 12,
    },
    critical_missing: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 6,
    },
    issues_list: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 7,
    },
    one_line_summary: { type: "string" },
  },
  required: [
    "visual_category",
    "visual_sub_scores",
    "design_era_estimate",
    "visual_issues",
    "content_category",
    "content_items",
    "content_items_present_count",
    "critical_missing",
    "issues_list",
    "one_line_summary",
  ],
  additionalProperties: false,
} as const;

export function buildAnalysisPrompt(params: PromptParams): string {
  return `You are an expert dental practice website auditor. Your analysis will be used to identify
dental practices with weak websites that could benefit from a professional redesign.

${DENTAL_STANDARD_CONTEXT}

You are now analyzing a dental practice website.
- Image: Full-page desktop screenshot (1280px wide, full homepage length)

This is a complete homepage capture showing all sections from top to bottom — hero, services, testimonials, team, footer, etc. Evaluate the ENTIRE page, not just the top.

EXTRACTED TEXT FROM THE WEBSITE:
---
${params.pageText}
---

AUTOMATED DOM CHECKS:
- HTTPS: ${params.isHttps}
- Page load time: ${params.loadTimeMs}ms
- Contact form detected: ${params.hasContactForm}
- Clickable phone link (tel:): ${params.hasPhoneLink}
- Clickable email link (mailto:): ${params.hasEmailLink}
- Booking widget/iframe detected: ${params.hasBookingWidget}
- Google Map embedded: ${params.hasGoogleMap}
- Social media links: ${params.hasSocialLinks}
- Schema markup (JSON-LD): ${params.hasSchemaMarkup}
- Video content: ${params.hasVideo}
- Total images on page: ${params.imageCount}
- Navigation items: ${params.navigationItemCount}

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
patient testimonials despite excellent Google reviews — strong redesign opportunity."`;
}
