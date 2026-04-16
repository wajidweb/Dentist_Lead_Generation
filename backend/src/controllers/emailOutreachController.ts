import { Request, Response } from "express";
import mongoose from "mongoose";
import Lead from "../models/Lead";
import Campaign from "../models/Campaign";
import {
  sendOutreach,
  getOutreachStats,
  getCampaignForUser,
} from "../services/emailOutreachService";
import * as instantlyService from "../services/instantlyService";
import {
  generatePreviewEmail,
  EmailTemplateVariables,
} from "../services/emailTemplateService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ---------------------------------------------------------------------------
// POST /api/email-outreach/preview
// ---------------------------------------------------------------------------

export const preview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId, previewLink } = req.body as {
      leadId?: string;
      previewLink?: string;
    };

    if (!leadId || !isValidObjectId(leadId)) {
      res.status(400).json({ message: "Valid leadId is required" });
      return;
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    if (!lead.email) {
      res.status(400).json({ message: "Lead does not have an email address" });
      return;
    }
    // CF-blocked leads have `analyzed: true` but no `websiteAnalysis` because
    // we deliberately skipped Claude analysis when the site was behind a
    // Cloudflare challenge. Accept them here and fall back to a generic
    // template — we still want to be able to email these leads.
    if (!lead.analyzed) {
      res.status(400).json({ message: "Lead has not been analyzed yet" });
      return;
    }
    if (!lead.websiteAnalysis && !lead.cloudflareBlocked) {
      res.status(400).json({ message: "Lead has not been analyzed yet" });
      return;
    }

    const senderName = "Thanks";
    const analysis = lead.websiteAnalysis;
    const vars: EmailTemplateVariables = {
      businessName: lead.businessName,
      visualIssues: analysis?.visualIssues ?? [],
      criticalMissing: analysis?.criticalMissing ?? [],
      issuesList: analysis?.issuesList ?? [],
      oneLineSummary:
        analysis?.oneLineSummary ??
        (lead.cloudflareBlocked
          ? `Your website was protected by security tooling that kept us from reviewing it automatically, so I took a quick manual look at the public pages.`
          : ""),
      websiteUrl: lead.website ?? "",
      previewLink: previewLink,
      senderName,
    };

    const emailPreview = generatePreviewEmail(vars);
    const sendingEmail = process.env.INSTANTLY_EMAIL ?? req.userEmail ?? "";
    res.json({
      preview: emailPreview,
      to: lead.email,
      from: sendingEmail,
      leadId,
      businessName: lead.businessName,
    });
  } catch (error) {
    console.error("Preview email error:", error);
    res.status(500).json({ message: "Failed to generate email preview" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/email-outreach/send
// ---------------------------------------------------------------------------

export const send = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId, to, from, subject, body, previewLink } = req.body as {
      leadId?: string;
      to?: string;
      from?: string;
      subject?: string;
      body?: string;
      previewLink?: string;
    };

    if (!leadId || !isValidObjectId(leadId)) {
      res.status(400).json({ message: "Valid leadId is required" });
      return;
    }
    if (!subject || subject.trim() === "") {
      res.status(400).json({ message: "subject is required" });
      return;
    }
    if (!body || body.trim() === "") {
      res.status(400).json({ message: "body is required" });
      return;
    }

    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await sendOutreach(
      leadId,
      userEmail,
      subject,
      body,
      previewLink,
      to,
      from
    );

    res.json(result);
  } catch (error) {
    console.error("Send outreach error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send outreach";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/email-outreach/send-bulk
// ---------------------------------------------------------------------------

export const sendBulk = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      leadIds,
      subject,
      body,
      previewLink,
      from,
    } = req.body as {
      leadIds?: string[];
      subject?: string;
      body?: string;
      previewLink?: string;
      from?: string;
    };

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({ message: "leadIds array is required" });
      return;
    }
    if (leadIds.length > 100) {
      res.status(400).json({ message: "Maximum 100 leads per bulk send" });
      return;
    }
    if (leadIds.some((id) => !isValidObjectId(id))) {
      res.status(400).json({ message: "All leadIds must be valid ObjectIds" });
      return;
    }
    if (!subject || subject.trim() === "") {
      res.status(400).json({ message: "subject is required" });
      return;
    }
    if (!body || body.trim() === "") {
      res.status(400).json({ message: "body is required" });
      return;
    }

    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const results = await Promise.allSettled(
      leadIds.map((leadId) =>
        sendOutreach(leadId, userEmail, subject, body, previewLink, undefined, from)
      )
    );

    const sent: string[] = [];
    const failed: string[] = [];
    const errors: Array<{ leadId: string; error: string }> = [];

    results.forEach((result, idx) => {
      const leadId = leadIds[idx];
      if (result.status === "fulfilled") {
        sent.push(leadId);
      } else {
        failed.push(leadId);
        errors.push({
          leadId,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
        });
      }
    });

    res.json({
      sent: sent.length,
      failed: failed.length,
      errors,
      message: `${sent.length} sent, ${failed.length} failed`,
    });
  } catch (error) {
    console.error("Bulk send outreach error:", error);
    res.status(500).json({ message: "Failed to send bulk outreach" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/email-outreach/tracking/:leadId
// ---------------------------------------------------------------------------

export const tracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = req.params["leadId"] as string;

    if (!leadId || !isValidObjectId(leadId)) {
      res.status(400).json({ message: "Valid leadId is required" });
      return;
    }

    const lead = await Lead.findById(leadId).select(
      "emailHistory outreachStatus lastOutreachAt instantlyCampaignId instantlyLeadId"
    );
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.json({
      emailHistory: lead.emailHistory,
      outreachStatus: lead.outreachStatus ?? null,
      lastOutreachAt: lead.lastOutreachAt ?? null,
      instantlyCampaignId: lead.instantlyCampaignId ?? null,
      instantlyLeadId: lead.instantlyLeadId ?? null,
    });
  } catch (error) {
    console.error("Tracking error:", error);
    res.status(500).json({ message: "Failed to fetch tracking data" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/email-outreach/stats
// ---------------------------------------------------------------------------

export const outreachStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { startDate, endDate } = req.query;
    const dateRange =
      startDate || endDate
        ? {
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
          }
        : undefined;

    const statsData = await getOutreachStats(userEmail, dateRange);
    res.json(statsData);
  } catch (error) {
    console.error("Outreach stats error:", error);
    res.status(500).json({ message: "Failed to fetch outreach stats" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/email-outreach/campaign
// ---------------------------------------------------------------------------

export const getCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaign = await getCampaignForUser(userEmail);
    // R4: Always return 200 with { campaign: T | null }
    res.json({ campaign: campaign ?? null });
  } catch (error) {
    console.error("Get campaign error:", error);
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/email-outreach/campaigns
// List all campaigns with their contacted leads
// ---------------------------------------------------------------------------

export const listCampaigns = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaigns = await Campaign.find({ userEmail }).sort({ createdAt: -1 }).lean();

    // For each campaign, get the leads that were added to it
    const campaignsWithLeads = await Promise.all(
      campaigns.map(async (campaign) => {
        const leads = await Lead.find(
          { instantlyCampaignId: campaign.instantlyCampaignId },
          {
            businessName: 1,
            email: 1,
            status: 1,
            outreachStatus: 1,
            lastOutreachAt: 1,
            website: 1,
            city: 1,
            state: 1,
            leadScore: 1,
            leadCategory: 1,
          }
        )
          .sort({ lastOutreachAt: -1 })
          .lean();

        return {
          ...campaign,
          leads,
          leadsCount: leads.length,
        };
      })
    );

    res.json({ campaigns: campaignsWithLeads });
  } catch (error) {
    console.error("List campaigns error:", error);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/email-outreach/campaigns/:campaignId/schedule
// Update campaign schedule (days, timing, timezone)
// ---------------------------------------------------------------------------

export const updateSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const { schedules } = req.body as { schedules?: unknown };
    if (!schedules) {
      res.status(400).json({ message: "schedules is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // Convert array of day names (["Mon","Tue",...]) to Instantly's numeric format ({"0":true,...})
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const scheduleData = schedules as { days?: string[]; from?: string; to?: string; timezone?: string };
    const daysObj: Record<string, boolean> = {};
    DAY_NAMES.forEach((name, idx) => {
      daysObj[String(idx)] = scheduleData.days?.includes(name) ?? false;
    });

    const instantlySchedule = {
      schedules: [
        {
          name: "Campaign Schedule",
          days: daysObj,
          timezone: scheduleData.timezone ?? "America/Chicago",
          timing: {
            from: scheduleData.from ?? "00:00",
            to: scheduleData.to ?? "23:59",
          },
        },
      ],
    };

    console.log("[UpdateSchedule] Updating schedule for campaign:", campaign.instantlyCampaignId);
    await instantlyService.updateCampaignSchedule(campaign.instantlyCampaignId, instantlySchedule);

    res.json({ message: "Schedule updated" });
  } catch (error) {
    console.error("Update schedule error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update schedule";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/email-outreach/campaigns/:campaignId/pause
// ---------------------------------------------------------------------------

export const pauseCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    console.log("[PauseCampaign] Pausing campaign:", campaign.instantlyCampaignId);
    await instantlyService.pauseCampaign(campaign.instantlyCampaignId);

    campaign.status = "paused";
    await campaign.save();

    res.json({ message: "Campaign paused" });
  } catch (error) {
    console.error("Pause campaign error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to pause campaign";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/email-outreach/campaigns/:campaignId/resume
// ---------------------------------------------------------------------------

export const resumeCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    console.log("[ResumeCampaign] Resuming campaign:", campaign.instantlyCampaignId);
    await instantlyService.activateCampaign(campaign.instantlyCampaignId);

    campaign.status = "active";
    await campaign.save();

    res.json({ message: "Campaign resumed" });
  } catch (error) {
    console.error("Resume campaign error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to resume campaign";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/email-outreach/campaigns/:campaignId/details
// Merged MongoDB + Instantly campaign data
// ---------------------------------------------------------------------------

export const getCampaignDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail }).lean();
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    console.log("[GetCampaignDetails] Fetching details from Instantly:", campaign.instantlyCampaignId);
    let instantlyData: unknown = null;
    try {
      instantlyData = await instantlyService.getCampaignDetails(
        campaign.instantlyCampaignId
      );
    } catch (err) {
      console.error("[GetCampaignDetails] Instantly API error:", err);
      // Continue with MongoDB data only if Instantly is unavailable
    }

    // Fetch leads for this campaign from MongoDB
    const leads = await Lead.find(
      { instantlyCampaignId: campaign.instantlyCampaignId },
      {
        businessName: 1,
        email: 1,
        status: 1,
        outreachStatus: 1,
        lastOutreachAt: 1,
        website: 1,
        city: 1,
        state: 1,
        leadScore: 1,
        leadCategory: 1,
      }
    )
      .sort({ lastOutreachAt: -1 })
      .lean();

    // Extract schedule and sequences from Instantly response
    let schedule: { days: string[]; from: string; to: string; timezone: string } | null = null;
    let sequences: Array<{ step: number; delay: number; subject: string; body: string }> | null = null;

    if (instantlyData) {
      const data = instantlyData as Record<string, unknown>;
      const campaignSchedule = data.campaign_schedule as Record<string, unknown> | undefined;
      const schedulesArr = campaignSchedule?.schedules as unknown[] | undefined;
      if (schedulesArr?.[0]) {
        const s = schedulesArr[0] as Record<string, unknown>;
        const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const days: string[] = [];
        if (s.days && typeof s.days === "object") {
          Object.entries(s.days as Record<string, unknown>).forEach(([key, val]) => {
            if (val === true && DAY_NAMES[Number(key)]) {
              days.push(DAY_NAMES[Number(key)]);
            }
          });
        }
        const timing = s.timing as Record<string, unknown> | undefined;
        schedule = {
          days,
          from: (timing?.from as string) ?? "00:00",
          to: (timing?.to as string) ?? "23:59",
          timezone: (s.timezone as string) ?? "America/Chicago",
        };
      }

      const seqArr = data.sequences as unknown[] | undefined;
      const firstSeq = seqArr?.[0] as Record<string, unknown> | undefined;
      const steps = firstSeq?.steps as unknown[] | undefined;
      if (steps) {
        sequences = steps.map((step) => {
          const st = step as Record<string, unknown>;
          const variants = st.variants as Array<Record<string, unknown>> | undefined;
          return {
            step: st.step as number,
            delay: (st.delay as number) ?? 0,
            subject: (variants?.[0]?.subject as string) ?? "",
            body: (variants?.[0]?.body as string) ?? "",
          };
        });
      }
    }

    // Extract tracking options from Instantly details
    let openTracking = false;
    let linkTracking = false;
    if (instantlyData) {
      const iData = instantlyData as Record<string, unknown>;
      openTracking = iData.open_tracking === 1 || iData.open_tracking === true;
      linkTracking = iData.link_tracking === 1 || iData.link_tracking === true;
    }

    res.json({
      campaign: {
        ...campaign,
        leads,
        leadsCount: leads.length,
        schedule,
        sequences,
        openTracking,
        linkTracking,
      },
    });
  } catch (error) {
    console.error("Get campaign details error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch campaign details";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/email-outreach/campaigns/:campaignId/sync-statuses
// Pull lead statuses from Instantly and update MongoDB
// ---------------------------------------------------------------------------

interface InstantlyLeadItem {
  email?: string;
  lead_status?: number;
  bounced?: boolean;
  [key: string]: unknown;
}

interface InstantlyLeadsResponse {
  items?: InstantlyLeadItem[];
  data?: InstantlyLeadItem[];
  [key: string]: unknown;
}

function mapInstantlyStatus(
  item: InstantlyLeadItem
): "pending" | "sent" | "opened" | "replied" | "bounced" {
  if (item.bounced === true) return "bounced";
  const s = item.lead_status ?? 0;
  if (s === 0) return "pending";  // not yet contacted
  if (s === 1) return "sent";     // active/sending
  if (s === 2) return "opened";
  if (s === 3) return "replied";
  return "sent";
}

export const syncStatuses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    console.log("[SyncStatuses] Fetching leads from Instantly:", campaign.instantlyCampaignId);
    const raw = await instantlyService.getCampaignLeads(
      campaign.instantlyCampaignId
    ) as InstantlyLeadsResponse;

    const items: InstantlyLeadItem[] = Array.isArray(raw)
      ? (raw as InstantlyLeadItem[])
      : (raw?.items ?? raw?.data ?? []);

    let synced = 0;
    let updated = 0;

    const counters = { pending: 0, sent: 0, opened: 0, replied: 0, bounced: 0 };

    for (const item of items) {
      synced++;
      if (!item.email) continue;

      const newStatus = mapInstantlyStatus(item);
      counters[newStatus]++;

      const lead = await Lead.findOne({
        email: item.email,
        instantlyCampaignId: campaign.instantlyCampaignId,
      });

      if (lead && lead.outreachStatus !== newStatus) {
        lead.outreachStatus = newStatus;
        await lead.save();
        updated++;
      }
    }

    // Update campaign counters (pending = not yet contacted, exclude from sent total)
    campaign.emailsSent = counters.sent + counters.opened + counters.replied + counters.bounced;
    campaign.emailsOpened = counters.opened;
    campaign.emailsReplied = counters.replied;
    campaign.emailsBounced = counters.bounced;
    await campaign.save();

    res.json({ synced, updated });
  } catch (error) {
    console.error("Sync statuses error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sync statuses";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/email-outreach/campaigns/:campaignId/sequences
// Update campaign email sequences
// ---------------------------------------------------------------------------

export const updateSequences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const { sequences } = req.body as { sequences?: unknown };
    if (!sequences) {
      res.status(400).json({ message: "sequences is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // Convert flat format [{step, delay, subject, body}] to Instantly's nested format
    const flatSteps = sequences as Array<{ step: number; delay?: number; subject: string; body: string }>;
    const instantlySequences = [
      {
        steps: flatSteps.map((step) => ({
          step: step.step,
          type: "email",
          delay: step.delay ?? 0,
          variants: [{ subject: step.subject, body: step.body }],
        })),
      },
    ];

    console.log("[UpdateSequences] Updating sequences for campaign:", campaign.instantlyCampaignId);
    await instantlyService.updateCampaignSequences(
      campaign.instantlyCampaignId,
      instantlySequences
    );

    res.json({ message: "Sequences updated" });
  } catch (error) {
    console.error("Update sequences error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update sequences";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/email-outreach/campaigns/:campaignId/analytics
// ---------------------------------------------------------------------------

export const campaignAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail }).lean();
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    console.log("[CampaignAnalytics] Fetching analytics from Instantly:", campaign.instantlyCampaignId);
    const result = await instantlyService.getCampaignSummary(
      campaign.instantlyCampaignId
    );

    // Instantly returns an array — take the first element
    const rawResult = Array.isArray(result) ? result[0] : result;
    const raw = (rawResult ?? {}) as Record<string, unknown>;
    console.log("[CampaignAnalytics] Raw Instantly response — all fields:");
    for (const [key, value] of Object.entries(raw)) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }

    // Try multiple field name formats — Instantly's response format varies
    const sent = Number(
      raw.emails_sent_count ?? raw.emails_sent ?? raw.sent ?? raw.sequence_started ?? campaign.emailsSent ?? 0
    );
    const opened = Number(
      raw.open_count_unique ?? raw.unique_opens ?? raw.opens ?? raw.opened ?? campaign.emailsOpened ?? 0
    );
    const replied = Number(
      raw.reply_count ?? raw.replies ?? raw.replied ?? raw.total_replies ?? campaign.emailsReplied ?? 0
    );
    const bounced = Number(
      raw.bounce_count ?? raw.bounces ?? raw.bounced ?? campaign.emailsBounced ?? 0
    );

    // Calculate rates ourselves: (count / delivered) * 100
    const delivered = sent - bounced;
    const openRate = delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0;
    const replyRate = delivered > 0 ? Math.round((replied / delivered) * 1000) / 10 : 0;

    const analytics = { sent, opened, replied, bounced, openRate, replyRate };
    console.log("[CampaignAnalytics] Computed:", analytics);

    res.json({ analytics });
  } catch (error) {
    console.error("Campaign analytics error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch campaign analytics";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/email-outreach/campaigns/:campaignId/options
// Update campaign options (open tracking, link tracking)
// ---------------------------------------------------------------------------

export const updateOptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId || !isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Valid campaign ID is required" });
      return;
    }

    const campaign = await Campaign.findOne({ _id: campaignId, userEmail });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const { openTracking, linkTracking } = req.body as {
      openTracking?: boolean;
      linkTracking?: boolean;
    };

    const options: Record<string, unknown> = {};
    if (typeof openTracking === "boolean") {
      options.open_tracking = openTracking ? 1 : 0;
    }
    if (typeof linkTracking === "boolean") {
      options.link_tracking = linkTracking ? 1 : 0;
    }

    if (Object.keys(options).length === 0) {
      res.status(400).json({ message: "No options provided" });
      return;
    }

    await instantlyService.updateCampaignOptions(
      campaign.instantlyCampaignId,
      options
    );

    res.json({ message: "Campaign options updated" });
  } catch (error) {
    console.error("Update options error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update options";
    res.status(500).json({ message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/email-outreach/campaigns/:campaignId
// Delete a campaign from Instantly + MongoDB + reset leads
// ---------------------------------------------------------------------------

export const deleteCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userEmail = req.userEmail;
    if (!userEmail) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const campaignId = req.params["campaignId"] as string;
    if (!campaignId) {
      res.status(400).json({ message: "Campaign ID is required" });
      return;
    }
    if (!isValidObjectId(campaignId)) {
      res.status(400).json({ message: "Invalid campaign ID" });
      return;
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      userEmail,
    });

    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // Delete from Instantly
    try {
      await instantlyService.deleteCampaign(campaign.instantlyCampaignId);
    } catch (err) {
      console.error("[Delete Campaign] Instantly API error:", err);
      // Continue with local cleanup even if Instantly fails
    }

    // Reset leads that were part of this campaign
    await Lead.updateMany(
      { instantlyCampaignId: campaign.instantlyCampaignId },
      {
        $unset: {
          instantlyCampaignId: 1,
          instantlyLeadId: 1,
          outreachStatus: 1,
          lastOutreachAt: 1,
        },
        $set: { status: "analyzed" },
      }
    );

    // Delete campaign from MongoDB
    await Campaign.findByIdAndDelete(campaignId);

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete campaign";
    res.status(500).json({ message });
  }
};
