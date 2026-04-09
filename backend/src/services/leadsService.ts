import Lead, { ILead, IWebsiteAnalysis } from "../models/Lead";
import * as XLSX from "xlsx";

export interface LeadFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  city?: string;
  analyzed?: boolean;
  minLeadScore?: number;
  maxLeadScore?: number;
  minWebsiteScore?: number;
  maxWebsiteScore?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export async function getLeads(filters: LeadFilters) {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    city,
    analyzed,
    minLeadScore,
    maxLeadScore,
    minWebsiteScore,
    maxWebsiteScore,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = filters;

  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (category) query.leadCategory = category;
  if (city) query.city = { $regex: city, $options: "i" };
  if (search) query.businessName = { $regex: search, $options: "i" };
  if (analyzed !== undefined) query.analyzed = analyzed;

  if (minLeadScore !== undefined || maxLeadScore !== undefined) {
    query.leadScore = {};
    if (minLeadScore !== undefined)
      (query.leadScore as Record<string, number>).$gte = minLeadScore;
    if (maxLeadScore !== undefined)
      (query.leadScore as Record<string, number>).$lte = maxLeadScore;
  }

  if (minWebsiteScore !== undefined || maxWebsiteScore !== undefined) {
    query["websiteAnalysis.overallScore"] = {};
    if (minWebsiteScore !== undefined)
      (query["websiteAnalysis.overallScore"] as Record<string, number>).$gte =
        minWebsiteScore;
    if (maxWebsiteScore !== undefined)
      (query["websiteAnalysis.overallScore"] as Record<string, number>).$lte =
        maxWebsiteScore;
  }

  const sortFieldMap: Record<string, string> = {
    leadScore: "leadScore",
    websiteQualityScore: "websiteQualityScore",
    googleRating: "googleRating",
    googleReviewCount: "googleReviewCount",
    analyzedAt: "analyzedAt",
    createdAt: "createdAt",
  };
  const sortField = sortFieldMap[sortBy] || "createdAt";

  const skip = (page - 1) * limit;
  const total = await Lead.countDocuments(query);
  const leads = await Lead.find(query)
    .sort({ [sortField]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .select("-emailHistory -reviews");

  return {
    leads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getLeadById(id: string) {
  return Lead.findById(id);
}

export async function updateLeadStatus(id: string, status: ILead["status"]) {
  return Lead.findByIdAndUpdate(id, { status }, { new: true });
}

export async function updateLead(
  id: string,
  data: Partial<
    Pick<
      ILead,
      | "notes"
      | "email"
      | "emailSource"
      | "customWebsiteUrl"
      | "customWebsiteScreenshot"
      | "status"
    >
  >
) {
  return Lead.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteLead(id: string) {
  return Lead.findByIdAndDelete(id);
}

export async function bulkDeleteLeads(ids: string[]) {
  const result = await Lead.deleteMany({ _id: { $in: ids } });
  return result.deletedCount;
}

export async function bulkUpdateLeadStatus(ids: string[], status: string) {
  const result = await Lead.updateMany(
    { _id: { $in: ids } },
    { $set: { status } }
  );
  return result.modifiedCount;
}

export async function bulkAnalyzeLeads(ids: string[]) {
  const result = await Lead.updateMany(
    { _id: { $in: ids } },
    { $set: { analyzed: true } }
  );
  return result.modifiedCount;
}

export async function getOutreachAggregates(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalOutreachSent: number;
  totalOpened: number;
  totalReplied: number;
  totalBounced: number;
}> {
  const dateFilter =
    startDate && endDate
      ? { lastOutreachAt: { $gte: startDate, $lte: endDate } }
      : {};

  const [totalOutreachSent, totalOpened, totalReplied, totalBounced] =
    await Promise.all([
      Lead.countDocuments({
        outreachStatus: { $in: ["sent", "opened", "replied", "bounced"] },
        ...dateFilter,
      }),
      Lead.countDocuments({ outreachStatus: "opened", ...dateFilter }),
      Lead.countDocuments({ outreachStatus: "replied", ...dateFilter }),
      Lead.countDocuments({ outreachStatus: "bounced", ...dateFilter }),
    ]);

  return { totalOutreachSent, totalOpened, totalReplied, totalBounced };
}

// ── Export helpers ──────────────────────────────────────────────────

function flattenLead(lead: ILead) {
  const wa = lead.websiteAnalysis as IWebsiteAnalysis | undefined;
  const contentItems = wa?.contentItems as Record<string, { present: boolean; quality: string; note: string }> | undefined;

  return {
    // Business Info
    "Business Name": lead.businessName || "",
    "Address": lead.address || "",
    "City": lead.city || "",
    "State": lead.state || "",
    "Zip Code": lead.zipCode || "",
    "Phone": lead.phone || "",
    "Email": lead.email || "",
    "Email Source": lead.emailSource || "",
    "Email Verified": lead.emailVerified != null ? String(lead.emailVerified) : "",
    "Email Verification Status": lead.emailVerificationStatus || "",
    "Website": lead.website || "",
    "Google Maps URL": lead.googleMapsUrl || "",
    "Google Rating": lead.googleRating ?? "",
    "Google Review Count": lead.googleReviewCount ?? "",

    // Scoring & Status
    "Lead Score": lead.leadScore ?? "",
    "Lead Category": lead.leadCategory || "",
    "Status": lead.status || "",
    "Website Quality Score": lead.websiteQualityScore ?? "",

    // Performance Scores
    "Performance Score": wa?.performanceScore ?? "",
    "SEO Score": wa?.seoScore ?? "",
    "Accessibility Score": wa?.accessibilityScore ?? "",
    "Best Practices Score": wa?.bestPracticesScore ?? "",
    "Load Time (ms)": wa?.loadTimeMs ?? "",
    "Is HTTPS": wa?.isHttps != null ? String(wa.isHttps) : "",

    // Core Web Vitals
    "LCP": wa?.coreWebVitals?.lcp ?? "",
    "CLS": wa?.coreWebVitals?.cls ?? "",
    "TBT": wa?.coreWebVitals?.tbt ?? "",

    // Visual Analysis
    "Visual Category": wa?.visualCategory || "",
    "Design Modernity": wa?.visualSubScores?.designModernity || "",
    "Color Scheme": wa?.visualSubScores?.colorScheme || "",
    "Layout Quality": wa?.visualSubScores?.layoutQuality || "",
    "Image Quality": wa?.visualSubScores?.imageQuality || "",
    "CTA Visibility": wa?.visualSubScores?.ctaVisibility || "",
    "Trust Signals": wa?.visualSubScores?.trustSignals || "",
    "Mobile Experience": wa?.visualSubScores?.mobileExperience || "",
    "Design Era Estimate": wa?.designEraEstimate || "",
    "Visual Issues": wa?.visualIssues?.join("; ") || "",

    // Content Analysis
    "Content Category": wa?.contentCategory || "",
    "Content Items Present": wa?.contentItemsPresentCount ?? "",
    "Critical Missing": wa?.criticalMissing?.join("; ") || "",
    "Service Descriptions": contentItems?.serviceDescriptions ? `${contentItems.serviceDescriptions.present ? "Yes" : "No"} - ${contentItems.serviceDescriptions.quality} - ${contentItems.serviceDescriptions.note}` : "",
    "Doctor Bios": contentItems?.doctorBios ? `${contentItems.doctorBios.present ? "Yes" : "No"} - ${contentItems.doctorBios.quality} - ${contentItems.doctorBios.note}` : "",
    "Patient Testimonials": contentItems?.patientTestimonials ? `${contentItems.patientTestimonials.present ? "Yes" : "No"} - ${contentItems.patientTestimonials.quality} - ${contentItems.patientTestimonials.note}` : "",
    "Online Booking": contentItems?.onlineBooking ? `${contentItems.onlineBooking.present ? "Yes" : "No"} - ${contentItems.onlineBooking.quality} - ${contentItems.onlineBooking.note}` : "",
    "Contact Info": contentItems?.contactInfo ? `${contentItems.contactInfo.present ? "Yes" : "No"} - ${contentItems.contactInfo.quality} - ${contentItems.contactInfo.note}` : "",
    "Insurance Info": contentItems?.insuranceInfo ? `${contentItems.insuranceInfo.present ? "Yes" : "No"} - ${contentItems.insuranceInfo.quality} - ${contentItems.insuranceInfo.note}` : "",
    "Office Hours": contentItems?.officeHours ? `${contentItems.officeHours.present ? "Yes" : "No"} - ${contentItems.officeHours.quality} - ${contentItems.officeHours.note}` : "",
    "New Patient Info": contentItems?.newPatientInfo ? `${contentItems.newPatientInfo.present ? "Yes" : "No"} - ${contentItems.newPatientInfo.quality} - ${contentItems.newPatientInfo.note}` : "",
    "Before/After": contentItems?.beforeAfter ? `${contentItems.beforeAfter.present ? "Yes" : "No"} - ${contentItems.beforeAfter.quality} - ${contentItems.beforeAfter.note}` : "",
    "Blog Content": contentItems?.blogContent ? `${contentItems.blogContent.present ? "Yes" : "No"} - ${contentItems.blogContent.quality} - ${contentItems.blogContent.note}` : "",
    "Emergency Info": contentItems?.emergencyInfo ? `${contentItems.emergencyInfo.present ? "Yes" : "No"} - ${contentItems.emergencyInfo.quality} - ${contentItems.emergencyInfo.note}` : "",
    "About Practice": contentItems?.aboutPractice ? `${contentItems.aboutPractice.present ? "Yes" : "No"} - ${contentItems.aboutPractice.quality} - ${contentItems.aboutPractice.note}` : "",

    // DOM Checks
    "Has Contact Form": wa?.hasContactForm != null ? String(wa.hasContactForm) : "",
    "Has Phone Link": wa?.hasPhoneLink != null ? String(wa.hasPhoneLink) : "",
    "Has Email Link": wa?.hasEmailLink != null ? String(wa.hasEmailLink) : "",
    "Has Booking Widget": wa?.hasBookingWidget != null ? String(wa.hasBookingWidget) : "",
    "Has Google Map": wa?.hasGoogleMap != null ? String(wa.hasGoogleMap) : "",
    "Has Social Links": wa?.hasSocialLinks != null ? String(wa.hasSocialLinks) : "",
    "Has Schema Markup": wa?.hasSchemaMarkup != null ? String(wa.hasSchemaMarkup) : "",
    "Has Video": wa?.hasVideo != null ? String(wa.hasVideo) : "",
    "Image Count": wa?.imageCount ?? "",
    "Navigation Item Count": wa?.navigationItemCount ?? "",

    // Summary
    "One-Line Summary": wa?.oneLineSummary || "",
    "Issues List": wa?.issuesList?.join("; ") || "",

    // Custom Website
    "Custom Website URL": lead.customWebsiteUrl || "",

    // Metadata
    "Notes": lead.notes || "",
    "Search Query": lead.searchQuery || "",
    "Analyzed": String(lead.analyzed),
    "Analysis Status": lead.analysisStatus || "",
    "Analyzed At": lead.analyzedAt ? new Date(lead.analyzedAt).toISOString() : "",
    "Created At": lead.createdAt ? new Date(lead.createdAt).toISOString() : "",
    "Updated At": lead.updatedAt ? new Date(lead.updatedAt).toISOString() : "",
  };
}

export async function getLeadsForExport(filters: Omit<LeadFilters, "page" | "limit">, ids?: string[]) {
  const {
    status,
    category,
    city,
    analyzed,
    minLeadScore,
    maxLeadScore,
    minWebsiteScore,
    maxWebsiteScore,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = filters;

  const query: Record<string, unknown> = {};

  // If specific IDs provided (export selected), use those
  if (ids && ids.length > 0) {
    query._id = { $in: ids };
  }

  if (status) query.status = status;
  if (category) query.leadCategory = category;
  if (city) query.city = { $regex: city, $options: "i" };
  if (search) query.businessName = { $regex: search, $options: "i" };
  if (analyzed !== undefined) query.analyzed = analyzed;

  if (minLeadScore !== undefined || maxLeadScore !== undefined) {
    query.leadScore = {};
    if (minLeadScore !== undefined) (query.leadScore as Record<string, number>).$gte = minLeadScore;
    if (maxLeadScore !== undefined) (query.leadScore as Record<string, number>).$lte = maxLeadScore;
  }

  if (minWebsiteScore !== undefined || maxWebsiteScore !== undefined) {
    query["websiteAnalysis.overallScore"] = {};
    if (minWebsiteScore !== undefined) (query["websiteAnalysis.overallScore"] as Record<string, number>).$gte = minWebsiteScore;
    if (maxWebsiteScore !== undefined) (query["websiteAnalysis.overallScore"] as Record<string, number>).$lte = maxWebsiteScore;
  }

  const sortFieldMap: Record<string, string> = {
    leadScore: "leadScore",
    websiteQualityScore: "websiteQualityScore",
    googleRating: "googleRating",
    googleReviewCount: "googleReviewCount",
    analyzedAt: "analyzedAt",
    createdAt: "createdAt",
  };
  const sortField = sortFieldMap[sortBy] || "createdAt";

  const leads = await Lead.find(query)
    .sort({ [sortField]: sortOrder === "asc" ? 1 : -1 })
    .lean();

  return leads as ILead[];
}

export function generateExportFile(leads: ILead[], format: "csv" | "xlsx" | "json"): { buffer: Buffer; contentType: string; extension: string } {
  if (format === "json") {
    const data = leads.map(flattenLead);
    const buffer = Buffer.from(JSON.stringify(data, null, 2), "utf-8");
    return { buffer, contentType: "application/json", extension: "json" };
  }

  const rows = leads.map(flattenLead);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns for better readability
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.min(40, Math.max(key.length, 12)),
  }));
  worksheet["!cols"] = colWidths;

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const buffer = Buffer.from(csv, "utf-8");
    return { buffer, contentType: "text/csv", extension: "csv" };
  }

  // xlsx
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  const buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
  return { buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
}

export async function getDashboardStats(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate
    ? { createdAt: { $gte: startDate, $lte: endDate } }
    : {};

  const [totalLeads, discovered, analyzed, qualified, emailSent, replied, converted, lost] =
    await Promise.all([
      Lead.countDocuments({ ...dateFilter }),
      Lead.countDocuments({ status: "discovered", ...dateFilter }),
      Lead.countDocuments({ status: "analyzed", ...dateFilter }),
      Lead.countDocuments({ status: "qualified", ...dateFilter }),
      Lead.countDocuments({ status: "email_sent", ...dateFilter }),
      Lead.countDocuments({ status: "replied", ...dateFilter }),
      Lead.countDocuments({ status: "converted", ...dateFilter }),
      Lead.countDocuments({ status: "lost", ...dateFilter }),
    ]);

  const [hotLeads, warmLeads, coolLeads, skipLeads] = await Promise.all([
    Lead.countDocuments({ leadCategory: "hot", ...dateFilter }),
    Lead.countDocuments({ leadCategory: "warm", ...dateFilter }),
    Lead.countDocuments({ leadCategory: "cool", ...dateFilter }),
    Lead.countDocuments({ leadCategory: "skip", ...dateFilter }),
  ]);

  const topCities = await Lead.aggregate([
    { $match: dateFilter },
    { $group: { _id: "$city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { city: "$_id", count: 1, _id: 0 } },
  ]);

  return {
    totalLeads, discovered, analyzed, qualified, emailSent, replied, converted, lost,
    revenue: converted * 199,
    conversionRate: emailSent > 0 ? ((converted / emailSent) * 100).toFixed(1) : "0",
    topCities,
    categories: { hot: hotLeads, warm: warmLeads, cool: coolLeads, skip: skipLeads },
  };
}
