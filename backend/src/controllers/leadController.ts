import { Request, Response } from "express";
import {
  findAllLeads,
  findLeadById,
  createNewLead,
  updateLeadById,
  deleteLeadById,
} from "../services/leadService";

export const getLeads = async (_req: Request, res: Response) => {
  try {
    const leads = await findAllLeads();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const lead = await findLeadById(req.params.id as string);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const lead = await createNewLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: "Invalid data", error });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await updateLeadById(req.params.id as string, req.body);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: "Invalid data", error });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const lead = await deleteLeadById(req.params.id as string);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json({ message: "Lead deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
