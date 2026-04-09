import Campaign, { ICampaign } from "../models/Campaign";
import Lead from "../models/Lead";
import * as instantlyService from "./instantlyService";
import {
  generateSequence,
  EmailTemplateVariables,
} from "./emailTemplateService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookEventPayload {
  event_type: string;
  campaign_id: string;
  lead_email: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}

export interface OutreachStats {
  totalSent: number;
  opened: number;
  replied: number;
  bounced: number;
  openRate: string;
  replyRate: string;
  bounceRate: string;
  campaign: ICampaign | null;
}

// ---------------------------------------------------------------------------
// Status transition guard — don't downgrade (e.g., replied → opened)
// ---------------------------------------------------------------------------

const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  opened: 2,
  bounced: 2, // bounced and opened are parallel; neither overwrites the other
  replied: 3,
};

function isStatusUpgrade(
  current: string | undefined,
  next: string
): boolean {
  const currentRank = STATUS_RANK[current ?? "pending"] ?? 0;
  const nextRank = STATUS_RANK[next] ?? 0;
  return nextRank > currentRank;
}

// ---------------------------------------------------------------------------
// getOrCreateCampaign
// ---------------------------------------------------------------------------

export async function getOrCreateCampaign(
  userEmail: string,
  fromOverride?: string
): Promise<ICampaign> {
  const existing = await Campaign.findOne({ userEmail });
  if (existing) return existing;

  const sendingEmail =
    fromOverride || process.env.INSTANTLY_EMAIL || userEmail;
  const campaignName = `DentalLeads – ${userEmail}`;

  // Build a placeholder sequence so Instantly accepts the campaign creation
  const placeholderVars: EmailTemplateVariables = {
    businessName: "{{business_name}}",
    visualIssues: [],
    criticalMissing: [],
    issuesList: [],
    oneLineSummary: "{{one_line_summary}}",
    websiteUrl: "{{website_url}}",
    previewLink: undefined,
    senderName: "{{sender_name}}",
  };
  const sequence = generateSequence(placeholderVars);

  const campaignData = await instantlyService.createCampaign(
    campaignName,
    sendingEmail,
    sequence
  );
  const instantlyCampaignId = campaignData.id;

  // Activate the campaign
  await instantlyService.activateCampaign(instantlyCampaignId);

  // Register webhook
  const webhookBaseUrl = process.env.WEBHOOK_BASE_URL ?? "";
  let instantlyWebhookId: string | undefined;
  if (webhookBaseUrl) {
    try {
      const webhookData = await instantlyService.registerWebhook(
        `${webhookBaseUrl}/api/webhooks/instantly`,
        ["email_opened", "email_replied", "email_bounced", "email_sent"]
      );
      instantlyWebhookId = webhookData.id;
    } catch (err) {
      console.warn("Failed to register Instantly webhook:", err);
    }
  }

  const campaign = await Campaign.create({
    userEmail,
    instantlyCampaignId,
    name: campaignName,
    status: "active",
    sendingEmail,
    instantlyWebhookId,
    leadsAdded: 0,
    emailsSent: 0,
    emailsOpened: 0,
    emailsReplied: 0,
    emailsBounced: 0,
  });

  return campaign;
}

// ---------------------------------------------------------------------------
// sendOutreach — send to a single lead
// ---------------------------------------------------------------------------

export async function sendOutreach(
  leadId: string,
  userEmail: string,
  subject: string,
  body: string,
  previewLink?: string,
  toOverride?: string,
  fromOverride?: string
): Promise<{ lead: InstanceType<typeof Lead>; campaignId: string; message: string }> {
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error("Lead not found");

  // Use overridden "to" email if provided, otherwise fall back to lead's email
  const recipientEmail = toOverride?.trim() || lead.email;
  if (!recipientEmail) throw new Error("Lead has no email address");

  // Use overridden "from" email if provided, otherwise fall back to campaign default
  const campaign = await getOrCreateCampaign(userEmail, fromOverride?.trim());

  const variables: Record<string, string> = {
    business_name: lead.businessName,
    website_url: lead.website ?? "",
    one_line_summary: lead.websiteAnalysis?.oneLineSummary ?? "",
    ...(previewLink ? { preview_link: previewLink } : {}),
  };

  const result = await instantlyService.addLeadToCampaign(
    campaign.instantlyCampaignId,
    recipientEmail,
    variables
  );

  const instantlyLeadId = result.id;
  const now = new Date();

  // If a different email was used for sending, update the lead's email so webhooks can find it
  if (recipientEmail !== lead.email) {
    lead.email = recipientEmail;
  }
  lead.status = "email_sent";
  lead.outreachStatus = "sent";
  lead.lastOutreachAt = now;
  lead.instantlyCampaignId = campaign.instantlyCampaignId;
  lead.instantlyLeadId = instantlyLeadId;
  lead.emailHistory.push({
    sentAt: now,
    templateName: "instantly-outreach",
    subject,
    body,
    status: "sent",
    instantlyEmailId: instantlyLeadId,
  });
  await lead.save();

  // Update campaign counters
  await Campaign.findByIdAndUpdate(campaign._id, {
    $inc: { leadsAdded: 1, emailsSent: 1 },
  });

  return {
    lead,
    campaignId: campaign.instantlyCampaignId,
    message: "Email outreach queued successfully",
  };
}

// ---------------------------------------------------------------------------
// handleWebhookEvent
// ---------------------------------------------------------------------------

export async function handleWebhookEvent(
  payload: WebhookEventPayload
): Promise<void> {
  const { event_type, campaign_id, lead_email } = payload;

  console.log(`[Webhook] Processing: event_type=${event_type}, campaign_id=${campaign_id}`);

  // Map Instantly event types to our outreach status
  // Instantly may send various event type formats
  const eventStatusMap: Record<string, "sent" | "opened" | "replied" | "bounced"> = {
    email_sent: "sent",
    "email.sent": "sent",
    sent: "sent",
    email_opened: "opened",
    "email.opened": "opened",
    opened: "opened",
    open: "opened",
    email_replied: "replied",
    "email.replied": "replied",
    replied: "replied",
    reply: "replied",
    email_bounced: "bounced",
    "email.bounced": "bounced",
    bounced: "bounced",
    bounce: "bounced",
    email_clicked: "opened",
    "email.clicked": "opened",
    clicked: "opened",
    click: "opened",
    lead_interested: "replied",
    lead_not_interested: "replied",
    lead_meeting_booked: "replied",
    lead_meeting_completed: "replied",
    lead_won: "replied",
    lead_out_of_office: "opened",
  };

  const newStatus = eventStatusMap[event_type];
  if (!newStatus) {
    console.log(`[Webhook] Unknown event type: ${event_type} — ignoring`);
    return;
  }

  // Try exact match first (email + campaign), then fallback to just email
  // Also try case-insensitive search
  const emailLower = lead_email.toLowerCase().trim();
  console.log(`[Webhook] Searching for lead with email: "${emailLower}", campaign: "${campaign_id}"`);

  let lead = await Lead.findOne({
    email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    instantlyCampaignId: campaign_id,
  });

  if (!lead) {
    // Fallback: find by email only (campaign might have been recreated)
    lead = await Lead.findOne({
      email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (lead) console.log(`[Webhook] Found lead via email-only fallback: ${lead._id}`);
  }

  if (!lead) {
    console.warn(
      `Webhook: lead not found for campaign ${campaign_id} (email redacted for PII)`
    );
    return;
  }

  console.log(`[Webhook] Found lead: ${lead._id}, current outreachStatus: ${lead.outreachStatus}, updating to: ${newStatus}`);

  const now = new Date();

  // Only upgrade status, never downgrade
  if (isStatusUpgrade(lead.outreachStatus, newStatus)) {
    lead.outreachStatus = newStatus;
  }

  // Update the most recent emailHistory entry
  if (lead.emailHistory.length > 0) {
    const lastEntry = lead.emailHistory[lead.emailHistory.length - 1];
    if (isStatusUpgrade(lastEntry.status, newStatus)) {
      lastEntry.status = newStatus;
    }
    if (newStatus === "opened" && !lastEntry.openedAt) {
      lastEntry.openedAt = now;
    } else if (newStatus === "replied" && !lastEntry.repliedAt) {
      lastEntry.repliedAt = now;
    } else if (newStatus === "bounced" && !lastEntry.bouncedAt) {
      lastEntry.bouncedAt = now;
    }
  }

  // Sync lead status with outreach status where appropriate
  if (newStatus === "replied" && lead.status !== "converted") {
    lead.status = "replied";
  }

  await lead.save();

  // Update campaign counters
  const counterMap: Record<string, Record<string, number>> = {
    sent: { emailsSent: 1 },
    opened: { emailsOpened: 1 },
    replied: { emailsReplied: 1 },
    bounced: { emailsBounced: 1 },
  };

  const incFields = counterMap[newStatus];
  if (incFields) {
    await Campaign.findOneAndUpdate(
      { instantlyCampaignId: campaign_id },
      { $inc: incFields }
    );
  }
}

// ---------------------------------------------------------------------------
// getCampaignForUser
// ---------------------------------------------------------------------------

export async function getCampaignForUser(
  userEmail: string
): Promise<ICampaign | null> {
  return Campaign.findOne({ userEmail });
}

// ---------------------------------------------------------------------------
// getOutreachStats
// ---------------------------------------------------------------------------

export async function getOutreachStats(
  userEmail: string,
  dateRange?: { startDate?: Date; endDate?: Date }
): Promise<OutreachStats> {
  const campaign = await Campaign.findOne({ userEmail });

  const dateFilter: Record<string, unknown> = {};
  if (dateRange?.startDate || dateRange?.endDate) {
    dateFilter.lastOutreachAt = {};
    if (dateRange.startDate) {
      (dateFilter.lastOutreachAt as Record<string, Date>).$gte =
        dateRange.startDate;
    }
    if (dateRange.endDate) {
      (dateFilter.lastOutreachAt as Record<string, Date>).$lte =
        dateRange.endDate;
    }
  }

  const [totalSent, opened, replied, bounced] =
    await Promise.all([
      Lead.countDocuments({ outreachStatus: { $in: ["sent", "opened", "replied", "bounced"] }, ...dateFilter }),
      Lead.countDocuments({ outreachStatus: "opened", ...dateFilter }),
      Lead.countDocuments({ outreachStatus: "replied", ...dateFilter }),
      Lead.countDocuments({ outreachStatus: "bounced", ...dateFilter }),
    ]);

  const openRate =
    totalSent > 0
      ? ((opened / totalSent) * 100).toFixed(1)
      : "0";
  const replyRate =
    totalSent > 0
      ? ((replied / totalSent) * 100).toFixed(1)
      : "0";
  const bounceRate =
    totalSent > 0
      ? ((bounced / totalSent) * 100).toFixed(1)
      : "0";

  return {
    totalSent,
    opened,
    replied,
    bounced,
    openRate,
    replyRate,
    bounceRate,
    campaign: campaign ?? null,
  };
}
