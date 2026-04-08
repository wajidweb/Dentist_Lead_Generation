import Lead, { ILead } from "../models/Lead";

interface LeadFilters {
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

export async function getDashboardStats() {
  const [
    totalLeads,
    discovered,
    analyzed,
    qualified,
    emailSent,
    replied,
    converted,
    lost,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ status: "discovered" }),
    Lead.countDocuments({ status: "analyzed" }),
    Lead.countDocuments({ status: "qualified" }),
    Lead.countDocuments({ status: "email_sent" }),
    Lead.countDocuments({ status: "replied" }),
    Lead.countDocuments({ status: "converted" }),
    Lead.countDocuments({ status: "lost" }),
  ]);

  const [hotLeads, warmLeads, coolLeads, skipLeads] = await Promise.all([
    Lead.countDocuments({ leadCategory: "hot" }),
    Lead.countDocuments({ leadCategory: "warm" }),
    Lead.countDocuments({ leadCategory: "cool" }),
    Lead.countDocuments({ leadCategory: "skip" }),
  ]);

  const topCities = await Lead.aggregate([
    { $group: { _id: "$city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { city: "$_id", count: 1, _id: 0 } },
  ]);

  return {
    totalLeads,
    discovered,
    analyzed,
    qualified,
    emailSent,
    replied,
    converted,
    lost,
    revenue: converted * 199,
    conversionRate: emailSent > 0 ? ((converted / emailSent) * 100).toFixed(1) : "0",
    topCities,
    categories: { hot: hotLeads, warm: warmLeads, cool: coolLeads, skip: skipLeads },
  };
}
