import { Request, Response } from "express";
import crypto from "crypto";
import { handleWebhookEvent, WebhookEventPayload } from "../services/emailOutreachService";

const WEBHOOK_SECRET = process.env.INSTANTLY_WEBHOOK_SECRET ?? "";
const MAX_EVENT_AGE_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// HMAC-SHA256 signature verification
// ---------------------------------------------------------------------------

function verifySignature(
  rawBody: string,
  signatureHeader: string | undefined
): boolean {
  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === "production") {
      // Secret is mandatory in production — do not bypass
      return false;
    }
    // Dev mode: skip verification with a warning
    console.warn("INSTANTLY_WEBHOOK_SECRET not set — skipping signature check");
    return true;
  }
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  // Support both "sha256=<hex>" and bare "<hex>" formats
  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex")
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/instantly
// ---------------------------------------------------------------------------

export const instantlyWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Guard: in production the webhook secret is mandatory
  if (!WEBHOOK_SECRET && process.env.NODE_ENV === "production") {
    console.error(
      "Webhook: INSTANTLY_WEBHOOK_SECRET is not set in production — rejecting request"
    );
    res.status(500).json({ message: "Webhook secret not configured" });
    return;
  }

  // Always respond 200 — to prevent Instantly from retrying
  // We process asynchronously and swallow errors internally.

  try {
    // Raw body must be available for signature verification.
    // Express JSON middleware replaces body, so we use the raw body
    // attached by the rawBody middleware (registered in routes).
    const rawBody: string =
      (req as Request & { rawBody?: string }).rawBody ??
      JSON.stringify(req.body);

    const signature = req.headers["x-instantly-signature"] as
      | string
      | undefined;

    if (!verifySignature(rawBody, signature)) {
      console.warn("Webhook: invalid signature — ignoring request");
      res.status(200).json({ received: true });
      return;
    }

    const rawPayload = req.body as Record<string, unknown>;

    // Log full payload structure (without PII) for debugging
    const safeKeys = Object.keys(rawPayload).filter(
      (k) => !["lead_email", "email", "to_email", "from_email"].includes(k)
    );
    console.log(`Webhook: received event, keys: [${safeKeys.join(", ")}]`);
    console.log(`Webhook: raw payload (no PII):`, JSON.stringify(
      Object.fromEntries(safeKeys.map((k) => [k, rawPayload[k]]))
    ));

    // Temporarily log all keys to find the recipient email field
    console.log("Webhook: ALL keys:", Object.keys(rawPayload));

    // Log both email fields to identify which is the lead
    console.log(`Webhook: lead_email="${rawPayload.lead_email}", email="${rawPayload.email}", email_account="${rawPayload.email_account}"`);

    // Normalize payload — Instantly sends:
    // lead_email = the lead/recipient email
    // email = sometimes the lead email, sometimes the sender
    // email_account = the sending account
    // We want the LEAD email, not the sender. If lead_email equals email_account, use email instead.
    const emailAccount = (rawPayload.email_account ?? "") as string;
    let resolvedLeadEmail = (rawPayload.lead_email ?? "") as string;

    // If lead_email is actually the sending account, try email field instead
    if (resolvedLeadEmail && resolvedLeadEmail === emailAccount) {
      resolvedLeadEmail = (rawPayload.email ?? rawPayload.lead ?? "") as string;
    }
    // If still empty or still the sender, try other fields
    if (!resolvedLeadEmail || resolvedLeadEmail === emailAccount) {
      resolvedLeadEmail = (rawPayload.email ?? rawPayload.to_email ?? rawPayload.to_address ?? rawPayload.lead ?? "") as string;
    }

    const payload: WebhookEventPayload & { timestamp?: string } = {
      event_type: (rawPayload.event_type ?? rawPayload.event ?? rawPayload.type ?? "") as string,
      campaign_id: (rawPayload.campaign_id ?? rawPayload.campaign ?? "") as string,
      lead_email: resolvedLeadEmail,
      timestamp: (rawPayload.timestamp ?? rawPayload.created_at ?? rawPayload.date) as string | undefined,
    };
    console.log(`Webhook: resolved lead_email="${payload.lead_email}"`);

    if (!payload.event_type || !payload.lead_email) {
      console.warn("Webhook: missing event_type or lead_email — ignoring");
      res.status(200).json({ received: true });
      return;
    }

    // Reject events older than 5 minutes
    if (payload.timestamp) {
      const eventTime = new Date(payload.timestamp).getTime();
      if (!isNaN(eventTime) && Date.now() - eventTime > MAX_EVENT_AGE_MS) {
        console.warn(
          `Webhook: stale event (type=${payload.event_type}) — ignoring`
        );
        res.status(200).json({ received: true });
        return;
      }
    }

    console.log(
      `Webhook: processing event type=${payload.event_type} campaign=${payload.campaign_id}`
    );

    await handleWebhookEvent(payload);
  } catch (err) {
    // Log but don't expose error details; always return 200
    console.error("Webhook processing error:", err instanceof Error ? err.message : err);
  }

  res.status(200).json({ received: true });
};
