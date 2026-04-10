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

export interface OutreachStats {
  totalSent: number;
  opened: number;
  replied: number;
  bounced: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
  campaign: ICampaign | null;
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
  const campaignName = `DentalLeads`;

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

  const campaign = await Campaign.create({
    userEmail,
    instantlyCampaignId,
    name: campaignName,
    status: "active",
    sendingEmail,
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

  // Try fetching real stats from Instantly API first
  if (campaign?.instantlyCampaignId) {
    try {
      const rawResult = await instantlyService.getCampaignSummary(
        campaign.instantlyCampaignId
      );

      // Instantly returns an array — take the first element
      const analyticsRaw = Array.isArray(rawResult) ? rawResult[0] : rawResult;
      const analytics = (analyticsRaw ?? null) as Record<string, unknown> | null;

      console.log("[OutreachStats] Instantly analytics raw response:", JSON.stringify(analytics));
      if (analytics) {
        console.log("[OutreachStats] All fields and values:");
        for (const [key, value] of Object.entries(analytics)) {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        }
        // Instantly V2 API field names from /campaigns/analytics
        const totalSent = Number(
          analytics.emails_sent_count ?? analytics.sent ?? analytics.emails_sent ?? 0
        );
        const opened = Number(
          analytics.open_count_unique ?? analytics.open_count ?? analytics.opened ?? 0
        );
        const replied = Number(
          analytics.reply_count ?? analytics.reply_count_unique ?? analytics.replied ?? analytics.replies ?? 0
        );
        const bounced = Number(
          analytics.bounced_count ?? analytics.bounced ?? analytics.emails_bounced ?? 0
        );

        const delivered = totalSent - bounced;
        const openRate = delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0;
        const replyRate = delivered > 0 ? Math.round((replied / delivered) * 1000) / 10 : 0;
        const bounceRate = totalSent > 0 ? Math.round((bounced / totalSent) * 1000) / 10 : 0;

        // Also sync counters back to MongoDB campaign for consistency
        await Campaign.findByIdAndUpdate(campaign._id, {
          emailsSent: totalSent,
          emailsOpened: opened,
          emailsReplied: replied,
          emailsBounced: bounced,
        });

        return {
          totalSent,
          opened,
          replied,
          bounced,
          openRate,
          replyRate,
          bounceRate,
          campaign,
        };
      }
    } catch (err) {
      console.warn("[OutreachStats] Failed to fetch from Instantly API, falling back to MongoDB:", err);
    }
  }

  // Fallback: count from MongoDB
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

  const delivered = totalSent - bounced;
  const openRate = delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0;
  const replyRate = delivered > 0 ? Math.round((replied / delivered) * 1000) / 10 : 0;
  const bounceRate = totalSent > 0 ? Math.round((bounced / totalSent) * 1000) / 10 : 0;

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
