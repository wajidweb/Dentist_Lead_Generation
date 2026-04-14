import Anthropic from "@anthropic-ai/sdk";
import {
  buildAnalysisPrompt,
  ANALYSIS_RESPONSE_SCHEMA,
} from "../prompts/analysisPrompt";

// Lazy init — dotenv hasn't run yet at import time
let anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!anthropic) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set in environment");
    anthropic = new Anthropic({ apiKey: key });
    console.log("[Claude] Client initialized");
  }
  return anthropic;
}

export interface ClaudeAnalysisResult {
  visualCategory: "poor" | "fair" | "good" | "excellent";
  visualSubScores: {
    designModernity: "poor" | "fair" | "good" | "excellent";
    colorScheme: "poor" | "fair" | "good" | "excellent";
    layoutQuality: "poor" | "fair" | "good" | "excellent";
    imageQuality: "poor" | "fair" | "good" | "excellent";
    ctaVisibility: "poor" | "fair" | "good" | "excellent";
    trustSignals: "poor" | "fair" | "good" | "excellent";
    mobileExperience: "poor" | "fair" | "good" | "excellent";
  };
  designEraEstimate: string;
  visualIssues: string[];
  contentCategory: "poor" | "fair" | "good" | "excellent";
  contentItems: {
    serviceDescriptions: { present: boolean; quality: string; note: string };
    doctorBios: { present: boolean; quality: string; note: string };
    patientTestimonials: { present: boolean; quality: string; note: string };
    onlineBooking: { present: boolean; quality: string; note: string };
    contactInfo: { present: boolean; quality: string; note: string };
    insuranceInfo: { present: boolean; quality: string; note: string };
    officeHours: { present: boolean; quality: string; note: string };
    newPatientInfo: { present: boolean; quality: string; note: string };
    beforeAfter: { present: boolean; quality: string; note: string };
    blogContent: { present: boolean; quality: string; note: string };
    emergencyInfo: { present: boolean; quality: string; note: string };
    aboutPractice: { present: boolean; quality: string; note: string };
  };
  contentItemsPresentCount: number;
  criticalMissing: string[];
  issuesList: string[];
  oneLineSummary: string;
  likelyOwner: { firstName: string; lastName: string; position?: string } | null;
}

interface AnalyzeParams {
  desktopScreenshot: Buffer;
  pageText: string;
  isHttps: boolean;
  loadTimeMs: number;
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

// Map snake_case Claude response to camelCase for our model
function mapResponse(raw: Record<string, unknown>): ClaudeAnalysisResult {
  const r = raw as Record<string, any>;
  const vs = r.visual_sub_scores || {};
  const ci = r.content_items || {};

  function mapContentItem(item: any) {
    return {
      present: item?.present ?? false,
      quality: item?.quality ?? "missing",
      note: item?.note ?? "",
    };
  }

  return {
    visualCategory: r.visual_category,
    visualSubScores: {
      designModernity: vs.design_modernity,
      colorScheme: vs.color_scheme,
      layoutQuality: vs.layout_quality,
      imageQuality: vs.image_quality,
      ctaVisibility: vs.cta_visibility,
      trustSignals: vs.trust_signals,
      mobileExperience: vs.mobile_experience,
    },
    designEraEstimate: r.design_era_estimate,
    visualIssues: r.visual_issues || [],
    contentCategory: r.content_category,
    contentItems: {
      serviceDescriptions: mapContentItem(ci.service_descriptions),
      doctorBios: mapContentItem(ci.doctor_bios),
      patientTestimonials: mapContentItem(ci.patient_testimonials),
      onlineBooking: mapContentItem(ci.online_booking),
      contactInfo: mapContentItem(ci.contact_info),
      insuranceInfo: mapContentItem(ci.insurance_info),
      officeHours: mapContentItem(ci.office_hours),
      newPatientInfo: mapContentItem(ci.new_patient_info),
      beforeAfter: mapContentItem(ci.before_after),
      blogContent: mapContentItem(ci.blog_content),
      emergencyInfo: mapContentItem(ci.emergency_info),
      aboutPractice: mapContentItem(ci.about_practice),
    },
    contentItemsPresentCount: r.content_items_present_count ?? 0,
    criticalMissing: r.critical_missing || [],
    issuesList: r.issues_list || [],
    oneLineSummary: r.one_line_summary || "",
    likelyOwner: r.likely_owner
      ? {
          firstName: r.likely_owner.first_name,
          lastName: r.likely_owner.last_name,
          position: r.likely_owner.position ?? undefined,
        }
      : null,
  };
}

export async function analyzeWebsite(
  params: AnalyzeParams
): Promise<ClaudeAnalysisResult> {
  const prompt = buildAnalysisPrompt({
    pageText: params.pageText,
    isHttps: params.isHttps,
    loadTimeMs: params.loadTimeMs,
    ...params.domChecks,
  });

  console.log("[Claude] Sending analysis request (2 screenshots + text)...");
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    temperature: 0,
    tools: [
      {
        name: "submit_analysis",
        description:
          "Submit the complete website analysis results with visual scores, content evaluation, and issues list.",
        input_schema:
          ANALYSIS_RESPONSE_SCHEMA as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "submit_analysis" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: params.desktopScreenshot.toString("base64"),
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
  });

  // Extract tool use result
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    console.error("[Claude] Unexpected response — no tool_use block. Content types:", response.content.map(b => b.type));
    throw new Error("No tool_use response from Claude");
  }

  const result = mapResponse(toolBlock.input as Record<string, unknown>);
  console.log(`[Claude] Analysis complete — visual=${result.visualCategory}, content=${result.contentCategory}, issues=${result.issuesList.length}`);
  return result;
}
