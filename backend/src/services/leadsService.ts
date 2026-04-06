import Lead, { ILead } from "../models/Lead";

interface LeadFilters {
  page?: number;
  limit?: number;
  status?: string;
  city?: string;
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
    city,
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
  if (city) query.city = { $regex: city, $options: "i" };
  if (search) query.businessName = { $regex: search, $options: "i" };

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

  const sortField =
    sortBy === "leadScore"
      ? "leadScore"
      : sortBy === "googleRating"
        ? "googleRating"
        : sortBy === "googleReviewCount"
          ? "googleReviewCount"
          : sortBy === "websiteScore"
            ? "websiteAnalysis.overallScore"
            : "createdAt";

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
  };
}
