import { Request, Response } from "express";
import * as instantlyService from "../services/instantlyService";
import Campaign from "../models/Campaign";

// Helper: normalize a raw Instantly email object to consistent field names
function normalizeEmail(e: Record<string, unknown>): Record<string, unknown> {
  // Handle `to` field — can be string, array, or to_address_email_list
  let toAddr = e.to_address_email_list ?? e.to_address ?? e.to ?? e.to_email ?? e.recipient ?? "";
  if (Array.isArray(toAddr)) toAddr = toAddr[0] ?? "";

  // Handle `from` field — also check eaccount for sent emails
  const fromAddr = e.from_address_email ?? e.eaccount ?? e.from_address ?? e.from ?? e.from_email ?? e.sender ?? "";

  // Handle body — can be a string OR an object { text, html }
  let body = "";
  const rawBody = e.body;
  if (typeof rawBody === "string") {
    body = rawBody;
  } else if (rawBody && typeof rawBody === "object") {
    const bodyObj = rawBody as Record<string, unknown>;
    body = (bodyObj.html ?? bodyObj.text ?? "") as string;
  }
  if (!body) {
    body = (e.html_body ?? e.body_html ?? e.text_body ?? e.text ?? e.content ?? "") as string;
  }

  return {
    id: e.id ?? e.uuid ?? "",
    uuid: e.uuid ?? e.id ?? "",
    from_address: fromAddr,
    to_address: toAddr,
    subject: e.subject ?? "",
    body,
    is_read: e.is_unread === true ? false : e.is_unread === false ? true : (e.is_read ?? true),
    is_unread: e.is_unread ?? (e.is_read === true ? false : e.is_read === false ? true : false),
    email_type: e.email_type || (e.ue_type === 3 ? "sent" : e.ue_type === 1 ? "received" : "") || e.type || e.direction || "",
    sent_at: e.sent_at ?? e.timestamp_email ?? e.timestamp_created ?? e.created_at ?? "",
    timestamp_email: e.sent_at ?? e.timestamp_email ?? e.timestamp_created ?? e.created_at ?? "",
    campaign_id: e.campaign_id ?? e.campaign ?? "",
    lead_email: e.lead_email ?? e.lead ?? "",
    thread_id: e.thread_id ?? "",
    reply_to_uuid: e.reply_to_uuid ?? "",
    campaign_name: e.campaign_name ?? "",
    tags: e.tags ?? [],
  };
}

// GET /api/unibox/emails
export const listEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { campaign_id, is_read, email_type, folder, search, limit, skip } = req.query;

    // Resolve email_type: only "sent" and "received" are valid for Instantly V2
    let resolvedEmailType = email_type as string | undefined;
    if (!resolvedEmailType && folder) {
      if (folder === "primary") resolvedEmailType = "received";
    }
    if (resolvedEmailType && resolvedEmailType !== "sent" && resolvedEmailType !== "received") {
      resolvedEmailType = undefined;
    }

    // Determine which campaign IDs to fetch emails for
    let campaignIds: string[] = [];
    if (campaign_id) {
      // Specific campaign selected
      campaignIds = [campaign_id as string];
    } else {
      // No campaign selected — only fetch from user's own campaigns
      const userCampaigns = await Campaign.find({ userEmail }).select("instantlyCampaignId").lean();
      campaignIds = userCampaigns
        .map((c) => c.instantlyCampaignId)
        .filter((id): id is string => !!id);
    }

    // If user has no campaigns, return empty
    if (campaignIds.length === 0) {
      res.json({ emails: [], total: 0 });
      return;
    }

    const baseParams = {
      is_read: is_read === "true" ? true : is_read === "false" ? false : undefined,
      email_type: resolvedEmailType,
      folder: folder as string | undefined,
      search: search as string | undefined,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    };

    // Fetch emails from each campaign in parallel, then merge
    const parseResult = (result: unknown): { emails: unknown[]; total: number } => {
      let emails: unknown[] = [];
      let total = 0;
      if (Array.isArray(result)) {
        emails = result;
        total = result.length;
      } else if (result && typeof result === "object") {
        const obj = result as Record<string, unknown>;
        emails = (obj.data ?? obj.items ?? obj.emails ?? []) as unknown[];
        total = (obj.total ?? obj.count ?? emails.length) as number;
      }
      return { emails, total };
    };

    let allEmails: unknown[] = [];
    let allTotal = 0;

    if (campaignIds.length === 1) {
      // Single campaign — simple fetch
      const result = await instantlyService.listEmails({
        ...baseParams,
        campaign_id: campaignIds[0],
      });
      const parsed = parseResult(result);
      allEmails = parsed.emails;
      allTotal = parsed.total;
    } else {
      // Multiple campaigns — fetch in parallel and merge
      const results = await Promise.all(
        campaignIds.map((cid) =>
          instantlyService.listEmails({ ...baseParams, campaign_id: cid }).catch(() => [])
        )
      );
      for (const result of results) {
        const parsed = parseResult(result);
        allEmails.push(...parsed.emails);
        allTotal += parsed.total;
      }
      // Sort merged emails by date (newest first)
      allEmails.sort((a, b) => {
        const ae = a as Record<string, unknown>;
        const be = b as Record<string, unknown>;
        const aTime = new Date((ae.sent_at ?? ae.timestamp_email ?? ae.timestamp_created ?? 0) as string).getTime();
        const bTime = new Date((be.sent_at ?? be.timestamp_email ?? be.timestamp_created ?? 0) as string).getTime();
        return bTime - aTime;
      });
    }

    const normalized = (allEmails as Record<string, unknown>[]).map(normalizeEmail);
    res.json({ emails: normalized, total: allTotal });
  } catch (error) {
    console.error("List emails error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch emails";
    res.status(500).json({ message });
  }
};

// GET /api/unibox/emails/unread-count
export const unreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) { res.status(401).json({ message: "Unauthorized" }); return; }

    const count = await instantlyService.getUnreadCount();
    res.json({ count });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

// GET /api/unibox/emails/:emailId
export const getEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) { res.status(401).json({ message: "Unauthorized" }); return; }

    const emailId = req.params["emailId"] as string;
    if (!emailId) { res.status(400).json({ message: "Email ID is required" }); return; }

    const result = await instantlyService.getEmail(emailId);
    const raw = (result ?? {}) as Record<string, unknown>;
    res.json({ email: normalizeEmail(raw) });
  } catch (error) {
    console.error("Get email error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch email";
    res.status(500).json({ message });
  }
};

// POST /api/unibox/emails/reply
export const replyToEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) { res.status(401).json({ message: "Unauthorized" }); return; }

    const { reply_to_uuid, from_email, subject, body, cc, bcc } = req.body as {
      reply_to_uuid?: string;
      from_email?: string;
      subject?: string;
      body?: string;
      cc?: string;
      bcc?: string;
    };

    console.log("[Unibox Reply] Params:", { reply_to_uuid, from_email, subject, body: body?.slice(0, 50) });

    if (!reply_to_uuid) { res.status(400).json({ message: "reply_to_uuid is required" }); return; }
    if (!body || body.trim() === "") { res.status(400).json({ message: "Reply body is required" }); return; }
    if (!from_email) { res.status(400).json({ message: "from_email is required" }); return; }

    const result = await instantlyService.replyToEmail({
      reply_to_uuid,
      from_email,
      subject: subject || "Re: Reply",
      body,
      cc,
      bcc,
    });

    res.json({ message: "Reply sent successfully", result });
  } catch (error) {
    console.error("Reply email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send reply";
    res.status(500).json({ message });
  }
};

// PATCH /api/unibox/emails/:emailId/read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) { res.status(401).json({ message: "Unauthorized" }); return; }

    const emailId = req.params["emailId"] as string;
    if (!emailId) { res.status(400).json({ message: "Email ID is required" }); return; }

    try {
      await instantlyService.markEmailRead(emailId);
    } catch {
      // Instantly's mark-as-read API is unreliable — silently continue
      // We track read status locally in the frontend store
    }
    res.json({ message: "Marked as read" });
  } catch (error) {
    // Always return success — read status is tracked locally
    res.json({ message: "Marked as read" });
  }
};

// GET /api/unibox/emails/:emailId/thread
export const getEmailThread = async (req: Request, res: Response): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) { res.status(401).json({ message: "Unauthorized" }); return; }

    const emailId = req.params["emailId"] as string;
    if (!emailId) { res.status(400).json({ message: "Email ID is required" }); return; }

    // Fetch the selected email
    const emailRaw = await instantlyService.getEmail(emailId);
    if (!emailRaw) { res.status(404).json({ message: "Email not found" }); return; }

    const email = emailRaw as Record<string, unknown>;
    const emailUuid = (email.uuid ?? email.id ?? emailId) as string;
    const threadId = email.thread_id as string | undefined;

    const threadMap = new Map<string, Record<string, unknown>>();
    threadMap.set(emailUuid, email);

    // Determine contact email and base subject for strict filtering
    const normalized0 = normalizeEmail(email);
    const contactEmail = (
      normalized0.email_type === "sent"
        ? normalized0.to_address
        : normalized0.from_address
    ) as string | undefined;
    const rawSubject = ((normalized0.subject as string) ?? "").trim();
    const baseSubject = rawSubject.replace(/^(Re:\s*|Fwd:\s*|Fw:\s*)+/i, "").trim().toLowerCase();

    // Helper: check if an email belongs to this conversation
    const belongsToThread = (raw: Record<string, unknown>): boolean => {
      const norm = normalizeEmail(raw);
      // If the selected email has a thread_id, require matching thread_id
      if (threadId) {
        const candidateThreadId = (norm.thread_id as string | undefined);
        if (candidateThreadId && candidateThreadId !== threadId) return false;
      }
      // Must involve the same contact email
      const from = ((norm.from_address as string) ?? "").toLowerCase();
      const to = ((norm.to_address as string) ?? "").toLowerCase();
      const contact = (contactEmail ?? "").toLowerCase();
      if (!contact || (from !== contact && to !== contact)) return false;
      // Must have matching subject
      const subj = ((norm.subject as string) ?? "").replace(/^(Re:\s*|Fwd:\s*|Fw:\s*)+/i, "").trim().toLowerCase();
      if (baseSubject && subj !== baseSubject) return false;
      return true;
    };

    // Strategy 1: Walk up via reply_to_uuid (most reliable)
    let current = email;
    let depth = 0;
    while ((current.reply_to_uuid as string) && depth < 10) {
      const parentId = current.reply_to_uuid as string;
      if (threadMap.has(parentId)) break;
      try {
        const parentRaw = await instantlyService.getEmail(parentId);
        if (!parentRaw) break;
        const parent = parentRaw as Record<string, unknown>;
        const pid = (parent.uuid ?? parent.id ?? parentId) as string;
        threadMap.set(pid, parent);
        current = parent;
      } catch {
        break;
      }
      depth++;
    }

    // Strategy 2: Search by contact email, strictly filtered by subject
    if (threadMap.size <= 1 && contactEmail) {
      try {
        const searchResult = await instantlyService.listEmails({
          limit: 50,
          skip: 0,
          search: contactEmail,
        });
        const searchEmails = (() => {
          if (Array.isArray(searchResult)) return searchResult as Record<string, unknown>[];
          if (searchResult && typeof searchResult === "object") {
            const obj = searchResult as Record<string, unknown>;
            return ((obj.data ?? obj.items ?? obj.emails ?? []) as Record<string, unknown>[]);
          }
          return [];
        })();
        for (const se of searchEmails) {
          const id = (se.uuid ?? se.id ?? "") as string;
          if (!id || threadMap.has(id)) continue;
          if (belongsToThread(se)) {
            threadMap.set(id, se);
          }
        }
      } catch {
        // continue with what we have
      }
    }

    // Normalize and sort chronologically
    const thread = Array.from(threadMap.values())
      .map(normalizeEmail)
      .sort((a, b) => {
        const aTime = new Date((a.sent_at ?? a.timestamp_email ?? 0) as string).getTime();
        const bTime = new Date((b.sent_at ?? b.timestamp_email ?? 0) as string).getTime();
        return aTime - bTime;
      });

    res.json({ thread });
  } catch (error) {
    console.error("Get email thread error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch thread";
    res.status(500).json({ message });
  }
};
