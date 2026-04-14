import { Request, Response } from "express";
import {
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLead,
  deleteLead,
  getDashboardStats,
  bulkDeleteLeads,
  bulkUpdateLeadStatus,
  bulkAnalyzeLeads,
  getLeadsForExport,
  generateExportFile,
} from "../services/leadsService";

export const list = async (req: Request, res: Response) => {
  try {
    const result = await getLeads({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string,
      category: req.query.category as string,
      city: req.query.city as string,
      analyzed: req.query.analyzed !== undefined
        ? req.query.analyzed === "true"
        : undefined,
      minLeadScore: req.query.minLeadScore
        ? Number(req.query.minLeadScore)
        : undefined,
      maxLeadScore: req.query.maxLeadScore
        ? Number(req.query.maxLeadScore)
        : undefined,
      minWebsiteScore: req.query.minWebsiteScore
        ? Number(req.query.minWebsiteScore)
        : undefined,
      maxWebsiteScore: req.query.maxWebsiteScore
        ? Number(req.query.maxWebsiteScore)
        : undefined,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      search: req.query.search as string,
    });

    res.json(result);
  } catch (error) {
    console.error("List leads error:", error);
    res.status(500).json({ message: "Failed to fetch leads" });
  }
};

export const detail = async (req: Request, res: Response) => {
  try {
    const lead = await getLeadById(req.params.id as string);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json({ lead });
  } catch (error) {
    console.error("Lead detail error:", error);
    res.status(500).json({ message: "Failed to fetch lead" });
  }
};

export const changeStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ message: "Status is required" });
      return;
    }
    const lead = await updateLeadStatus(req.params.id as string, status);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json({ lead });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Failed to update lead status" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const allowed = [
      "notes",
      "email",
      "emailSource",
      "customWebsiteUrl",
      "customWebsiteScreenshot",
      "status",
      "decisionMakers",
      "likelyOwner",
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const lead = await updateLead(req.params.id as string, data);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json({ lead });
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(500).json({ message: "Failed to update lead" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const lead = await deleteLead(req.params.id as string);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json({ message: "Lead deleted" });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({ message: "Failed to delete lead" });
  }
};

export const stats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const data = await getDashboardStats(start, end);
    res.json(data);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

export const bulkRemove = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "ids array is required" });
      return;
    }
    const count = await bulkDeleteLeads(ids);
    res.json({ message: `${count} leads deleted`, count });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ message: "Failed to bulk delete leads" });
  }
};

export const bulkChangeStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "ids array is required" });
      return;
    }
    if (!status) {
      res.status(400).json({ message: "status is required" });
      return;
    }
    const count = await bulkUpdateLeadStatus(ids, status);
    res.json({ message: `${count} leads updated`, count });
  } catch (error) {
    console.error("Bulk status update error:", error);
    res.status(500).json({ message: "Failed to bulk update leads" });
  }
};

export const bulkAnalyze = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: "ids array is required" });
      return;
    }
    const count = await bulkAnalyzeLeads(ids);
    res.json({ message: `${count} leads marked as analyzed`, count });
  } catch (error) {
    console.error("Bulk analyze error:", error);
    res.status(500).json({ message: "Failed to analyze leads" });
  }
};

export const exportLeads = async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || "csv";
    if (!["csv", "xlsx", "json"].includes(format)) {
      res.status(400).json({ message: "Invalid format. Use csv, xlsx, or json." });
      return;
    }

    // Parse selected IDs if provided
    const idsParam = req.query.ids as string | undefined;
    const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      city: req.query.city as string,
      analyzed: req.query.analyzed !== undefined
        ? req.query.analyzed === "true"
        : undefined,
      minLeadScore: req.query.minLeadScore
        ? Number(req.query.minLeadScore)
        : undefined,
      maxLeadScore: req.query.maxLeadScore
        ? Number(req.query.maxLeadScore)
        : undefined,
      minWebsiteScore: req.query.minWebsiteScore
        ? Number(req.query.minWebsiteScore)
        : undefined,
      maxWebsiteScore: req.query.maxWebsiteScore
        ? Number(req.query.maxWebsiteScore)
        : undefined,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      search: req.query.search as string,
    };

    const leads = await getLeadsForExport(filters, ids);

    if (leads.length === 0) {
      res.status(404).json({ message: "No leads found matching the filters" });
      return;
    }

    const { buffer, contentType, extension } = generateExportFile(
      leads,
      format as "csv" | "xlsx" | "json"
    );

    // Build filename with filter context
    const parts = ["leads"];
    if (filters.category) parts.push(filters.category);
    if (filters.city) parts.push(filters.city.toLowerCase().replace(/\s+/g, "-"));
    if (filters.status) parts.push(filters.status);
    parts.push(new Date().toISOString().slice(0, 10));
    const filename = `${parts.join("-")}.${extension}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Export leads error:", error);
    res.status(500).json({ message: "Failed to export leads" });
  }
};
