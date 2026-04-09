import { Request, Response } from "express";
import * as instantlyService from "../services/instantlyService";

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
    // "others" folder uses the folder param only, NOT email_type
    let resolvedEmailType = email_type as string | undefined;
    if (!resolvedEmailType && folder) {
      if (folder === "primary") resolvedEmailType = "received";
      // "others" folder — don't set email_type, just pass folder
    }
    // Ensure email_type is only "sent" or "received"
    if (resolvedEmailType && resolvedEmailType !== "sent" && resolvedEmailType !== "received") {
      resolvedEmailType = undefined;
    }

    const result = await instantlyService.listEmails({
      campaign_id: campaign_id as string | undefined,
      is_read: is_read === "true" ? true : is_read === "false" ? false : undefined,
      email_type: resolvedEmailType,
      folder: folder as string | undefined,
      search: search as string | undefined,
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    });

    // Debug: log FULL raw Instantly response
    console.log("[Unibox] RAW response type:", typeof result, Array.isArray(result) ? "array" : "object");
    console.log("[Unibox] RAW response:", JSON.stringify(result).slice(0, 1500));

    // Instantly may return array or { data: [], total: number }
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

    const normalized = (emails as Record<string, unknown>[]).map(normalizeEmail);
    res.json({ emails: normalized, total });
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

    // If there's a thread_id, fetch all emails in the same thread
    if (threadId) {
      try {
        const threadResult = await instantlyService.listEmails({
          limit: 50,
          skip: 0,
          search: threadId,
        });
        const threadEmails = (() => {
          if (Array.isArray(threadResult)) return threadResult as Record<string, unknown>[];
          if (threadResult && typeof threadResult === "object") {
            const obj = threadResult as Record<string, unknown>;
            return ((obj.data ?? obj.items ?? obj.emails ?? []) as Record<string, unknown>[]);
          }
          return [];
        })();
        for (const te of threadEmails) {
          const id = (te.uuid ?? te.id ?? "") as string;
          if (id && !threadMap.has(id)) threadMap.set(id, te);
        }
      } catch {
        // continue with single email
      }
    }

    // Also walk up via reply_to_uuid
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
