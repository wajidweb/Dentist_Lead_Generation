import { Request, Response } from "express";
import {
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLead,
  deleteLead,
  getDashboardStats,
} from "../services/leadsService";

export const list = async (req: Request, res: Response) => {
  try {
    const result = await getLeads({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status as string,
      city: req.query.city as string,
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

export const stats = async (_req: Request, res: Response) => {
  try {
    const data = await getDashboardStats();
    res.json(data);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
