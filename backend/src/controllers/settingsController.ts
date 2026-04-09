import { Request, Response } from "express";
import * as instantlyService from "../services/instantlyService";

// ---------------------------------------------------------------------------
// GET /api/settings/email-accounts
// Lists all email accounts connected to Instantly.ai
// ---------------------------------------------------------------------------

export const listEmailAccounts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const accounts = await instantlyService.listEmailAccounts();
    res.json({ accounts });
  } catch (error) {
    console.error("List email accounts error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch email accounts";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/settings/email-accounts/:email/status
// Get status of a specific email account
// ---------------------------------------------------------------------------

export const getEmailAccountStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const email = req.params.email as string;
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const account = await instantlyService.getEmailAccountStatus(email);
    res.json({ account });
  } catch (error) {
    console.error("Get email account status error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get account status";
    res.status(500).json({ message });
  }
};

