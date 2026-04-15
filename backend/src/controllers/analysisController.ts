import { Request, Response } from "express";
import Lead from "../models/Lead";
import AnalysisGroup from "../models/AnalysisGroup";
import { addAnalysisJobs, analysisQueue, EmailProvider } from "../jobs/analysisQueue";

export const startBatch = async (req: Request, res: Response) => {
  try {
    const { leadIds, emailProvider = "harvester" } = req.body as { leadIds?: string[]; emailProvider?: EmailProvider };
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({ message: "leadIds array is required" });
      return;
    }

    // Validate leads exist and have websites
    const leads = await Lead.find({
      _id: { $in: leadIds },
      website: { $exists: true, $ne: "" },
    }).select("_id website businessName");

    if (leads.length === 0) {
      res.status(400).json({ message: "No valid leads with websites found" });
      return;
    }

    // Create analysis group
    const userEmail = (req as any).userEmail || "admin";
    const group = await AnalysisGroup.create({
      leadIds: leads.map((l) => l._id.toString()),
      totalLeads: leads.length,
      createdBy: userEmail,
    });

    // Update leads status to queued
    await Lead.updateMany(
      { _id: { $in: leads.map((l) => l._id) } },
      {
        $set: {
          analysisStatus: "queued",
          analysisGroupId: group._id.toString(),
          analysisError: undefined,
        },
      }
    );

    // Add jobs to queue
    const jobData = leads.map((l) => ({
      leadId: l._id.toString(),
      websiteUrl: l.website,
    }));
    await addAnalysisJobs(jobData, group._id.toString(), emailProvider);

    res.json({
      groupId: group._id.toString(),
      totalJobs: leads.length,
      message: `Analysis started for ${leads.length} leads`,
    });
  } catch (error) {
    console.error("Start batch analysis error:", error);
    res.status(500).json({ message: "Failed to start analysis" });
  }
};

export const startSingle = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.leadId).select(
      "_id website businessName"
    );
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    if (!lead.website) {
      res.status(400).json({ message: "Lead has no website" });
      return;
    }

    const userEmail = (req as any).userEmail || "admin";
    const group = await AnalysisGroup.create({
      leadIds: [lead._id.toString()],
      totalLeads: 1,
      createdBy: userEmail,
    });

    await Lead.findByIdAndUpdate(lead._id, {
      analysisStatus: "queued",
      analysisGroupId: group._id.toString(),
      analysisError: undefined,
    });

    await addAnalysisJobs(
      [{ leadId: lead._id.toString(), websiteUrl: lead.website }],
      group._id.toString()
    );

    res.json({
      groupId: group._id.toString(),
      totalJobs: 1,
      message: "Analysis started",
    });
  } catch (error) {
    console.error("Start single analysis error:", error);
    res.status(500).json({ message: "Failed to start analysis" });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const group = await AnalysisGroup.findById(req.params.groupId);
    if (!group) {
      res.status(404).json({ message: "Analysis group not found" });
      return;
    }

    // Get per-status counts from leads
    const [inProgress, waiting, failedLeads] = await Promise.all([
      Lead.countDocuments({
        analysisGroupId: group._id.toString(),
        analysisStatus: "processing",
      }),
      Lead.countDocuments({
        analysisGroupId: group._id.toString(),
        analysisStatus: "queued",
      }),
      Lead.find({
        analysisGroupId: group._id.toString(),
        analysisStatus: "failed",
      }).select("_id businessName analysisError"),
    ]);

    res.json({
      groupId: group._id.toString(),
      total: group.totalLeads,
      completed: group.completedCount,
      failed: group.failedCount,
      inProgress,
      waiting,
      status: group.status,
      failedLeads: failedLeads.map((l) => ({
        leadId: l._id.toString(),
        businessName: l.businessName,
        error: l.analysisError || "Unknown error",
      })),
    });
  } catch (error) {
    console.error("Get analysis status error:", error);
    res.status(500).json({ message: "Failed to get analysis status" });
  }
};

export const retryFailed = async (req: Request, res: Response) => {
  try {
    const group = await AnalysisGroup.findById(req.params.groupId);
    if (!group) {
      res.status(404).json({ message: "Analysis group not found" });
      return;
    }

    const failedLeads = await Lead.find({
      analysisGroupId: group._id.toString(),
      analysisStatus: "failed",
    }).select("_id website");

    if (failedLeads.length === 0) {
      res.json({ retriedCount: 0, message: "No failed analyses to retry" });
      return;
    }

    // Reset status and re-queue
    await Lead.updateMany(
      { _id: { $in: failedLeads.map((l) => l._id) } },
      { $set: { analysisStatus: "queued", analysisError: undefined } }
    );

    // Reset group counters
    await AnalysisGroup.findByIdAndUpdate(group._id, {
      $inc: { failedCount: -failedLeads.length },
      status: "running",
      completedAt: undefined,
    });

    await addAnalysisJobs(
      failedLeads.map((l) => ({
        leadId: l._id.toString(),
        websiteUrl: l.website,
      })),
      group._id.toString()
    );

    res.json({
      retriedCount: failedLeads.length,
      message: `Retrying ${failedLeads.length} failed analyses`,
    });
  } catch (error) {
    console.error("Retry failed analyses error:", error);
    res.status(500).json({ message: "Failed to retry analyses" });
  }
};

export const cancelBatch = async (req: Request, res: Response) => {
  try {
    const group = await AnalysisGroup.findById(req.params.groupId);
    if (!group) {
      res.status(404).json({ message: "Analysis group not found" });
      return;
    }

    const groupIdStr = group._id.toString();

    // 1. Flip the group status FIRST so any in-flight worker that hits a
    //    checkpoint sees the cancellation and aborts itself.
    await AnalysisGroup.findByIdAndUpdate(group._id, {
      status: "cancelled",
      completedAt: new Date(),
    });

    // 2. Remove not-yet-started jobs from the BullMQ queue.
    const waitingJobs = await analysisQueue.getJobs(["waiting", "delayed"]);
    let removedFromQueue = 0;
    for (const job of waitingJobs) {
      if (job.data.groupId === groupIdStr) {
        await job.remove();
        removedFromQueue++;
      }
    }

    // 3. Currently-processing jobs can't be killed mid-function, but their
    //    next checkpoint call will throw BatchCancelledError and the worker's
    //    failed-handler will reset the lead. Count them so we can report.
    const activeJobs = await analysisQueue.getJobs(["active"]);
    const activeCount = activeJobs.filter(
      (j) => j.data.groupId === groupIdStr
    ).length;

    // 4. Reset any queued leads back to pending immediately.
    await Lead.updateMany(
      {
        analysisGroupId: groupIdStr,
        analysisStatus: "queued",
      },
      { $set: { analysisStatus: "pending" }, $unset: { analysisGroupId: "" } }
    );

    const total = removedFromQueue + activeCount;
    res.json({
      cancelledCount: total,
      queuedRemoved: removedFromQueue,
      activeAborting: activeCount,
      message:
        activeCount > 0
          ? `Cancelled ${removedFromQueue} queued; ${activeCount} in-flight will abort at the next checkpoint`
          : `Cancelled ${removedFromQueue} queued analyses`,
    });
  } catch (error) {
    console.error("Cancel batch error:", error);
    res.status(500).json({ message: "Failed to cancel analysis" });
  }
};
