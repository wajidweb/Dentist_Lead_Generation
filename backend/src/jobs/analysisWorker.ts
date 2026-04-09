import { Worker, Job } from "bullmq";
import { redisConnection, AnalysisJobData } from "./analysisQueue";
import { analyzePage, closeBrowser } from "../services/puppeteerService";
import { analyzeWebsite } from "../services/claudeAnalysisService";
import {
  calculateWebsiteQualityScore,
  calculateLeadScore,
  determineLeadCategory,
} from "../services/scoreService";
import { uploadScreenshots } from "../services/cloudinaryService";
import { findEmailByDomain } from "../services/domainEmailService";
import Lead from "../models/Lead";
import AnalysisGroup from "../models/AnalysisGroup";

let worker: Worker | null = null;

async function processJob(job: Job<AnalysisJobData>) {
  const { leadId, websiteUrl, groupId } = job.data;
  const tag = `[Lead ${leadId}]`;

  console.log(`${tag} Starting analysis for ${websiteUrl}`);

  // Mark lead as processing
  await Lead.findByIdAndUpdate(leadId, { analysisStatus: "processing" });

  // Step 1: Puppeteer — screenshots + text + DOM checks
  console.log(`${tag} Step 1/4: Puppeteer — visiting website...`);
  await job.updateProgress(10);
  const puppeteerResult = await analyzePage(websiteUrl);
  console.log(
    `${tag} Step 1/4: Puppeteer done — loadTime=${puppeteerResult.loadTimeMs}ms, https=${puppeteerResult.isHttps}, text=${puppeteerResult.pageText.length} chars, screenshot=${puppeteerResult.desktopScreenshot.length} bytes, emails=${puppeteerResult.emails.length > 0 ? puppeteerResult.emails.join(", ") : "none"}`
  );

  // Step 2: Claude — visual + content analysis
  console.log(`${tag} Step 2/4: Claude — analyzing website...`);
  await job.updateProgress(30);
  const claudeResult = await analyzeWebsite({
    desktopScreenshot: puppeteerResult.desktopScreenshot,
    pageText: puppeteerResult.pageText,
    isHttps: puppeteerResult.isHttps,
    loadTimeMs: puppeteerResult.loadTimeMs,
    domChecks: puppeteerResult.domChecks,
  });
  console.log(
    `${tag} Claude done — visual=${claudeResult.visualCategory}, content=${claudeResult.contentCategory}, items=${claudeResult.contentItemsPresentCount}/12, issues=${claudeResult.issuesList.length}`
  );

  // Step 3: Score aggregation
  console.log(`${tag} Step 3/4: Calculating scores...`);
  await job.updateProgress(60);
  const websiteQualityScore = calculateWebsiteQualityScore(
    claudeResult.visualCategory,
    claudeResult.contentCategory
  );

  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const leadScore = calculateLeadScore(
    lead.googleRating,
    lead.googleReviewCount,
    claudeResult.visualCategory,
    claudeResult.contentItemsPresentCount
  );
  const leadCategory = determineLeadCategory(leadScore);
  console.log(
    `${tag} Scores — websiteQuality=${websiteQualityScore}/100, leadScore=${leadScore}/100, category=${leadCategory.toUpperCase()}`
  );

  // Step 4: Upload screenshots to Cloudinary
  console.log(`${tag} Step 4/4: Uploading screenshots to Cloudinary...`);
  await job.updateProgress(80);
  const screenshots = await uploadScreenshots(
    puppeteerResult.desktopScreenshot,
    leadId
  );
  console.log(
    `${tag} Cloudinary done — ${screenshots.desktop ? "OK" : "FAILED"}`
  );

  // Save to MongoDB
  console.log(`${tag} Saving to MongoDB...`);
  await job.updateProgress(95);

  // Build update object
  const updateData: Record<string, unknown> = {
    websiteAnalysis: {
      loadTimeMs: puppeteerResult.loadTimeMs,
      isHttps: puppeteerResult.isHttps,
      // Claude visual
      visualCategory: claudeResult.visualCategory,
      visualSubScores: claudeResult.visualSubScores,
      designEraEstimate: claudeResult.designEraEstimate,
      visualIssues: claudeResult.visualIssues,
      // Claude content
      contentCategory: claudeResult.contentCategory,
      contentItems: claudeResult.contentItems,
      contentItemsPresentCount: claudeResult.contentItemsPresentCount,
      criticalMissing: claudeResult.criticalMissing,
      // Combined
      issuesList: claudeResult.issuesList,
      oneLineSummary: claudeResult.oneLineSummary,
      // DOM checks
      ...puppeteerResult.domChecks,
      // Screenshots
      screenshots,
      analyzedAt: new Date(),
    },
    websiteQualityScore,
    leadScore,
    leadCategory,
    analyzed: true,
    analysisStatus: "completed",
    analyzedAt: new Date(),
    status: "analyzed",
  };

  // Save email — try website scraping first, then domain search fallback
  if (!lead.email) {
    if (puppeteerResult.emails.length > 0) {
      updateData.email = puppeteerResult.emails[0];
      updateData.emailSource = "scrape";
      console.log(`${tag} Email found via scraping: ${puppeteerResult.emails[0]}`);
    } else {
      // Fallback: find email by domain (MX lookup + SMTP verification)
      console.log(`${tag} No email on website — trying domain search...`);
      try {
        const domainResult = await findEmailByDomain(websiteUrl);
        if (domainResult.email) {
          updateData.email = domainResult.email;
          updateData.emailSource = "domain-search";
          if (domainResult.method === "smtp-verified") {
            updateData.emailVerified = true;
            updateData.emailVerificationStatus = "deliverable";
          }
          console.log(`${tag} Email found via domain search: ${domainResult.email} (${domainResult.method}, tested ${domainResult.candidatesTested} candidates)`);
        } else {
          console.log(`${tag} No email found via domain search (tested ${domainResult.candidatesTested} candidates)`);
        }
      } catch (err) {
        console.log(`${tag} Domain email search failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  await Lead.findByIdAndUpdate(leadId, updateData);

  // Update group progress
  await AnalysisGroup.findByIdAndUpdate(groupId, {
    $inc: { completedCount: 1 },
  });
  await checkGroupCompletion(groupId);

  console.log(
    `${tag} COMPLETE — ${lead.businessName} | quality=${websiteQualityScore} | lead=${leadScore} (${leadCategory.toUpperCase()}) | "${claudeResult.oneLineSummary.substring(0, 80)}..."`
  );

  return { leadId, websiteQualityScore, leadScore, leadCategory };
}

async function checkGroupCompletion(groupId: string) {
  const group = await AnalysisGroup.findById(groupId);
  if (!group) return;

  if (group.completedCount + group.failedCount >= group.totalLeads) {
    group.status = "completed";
    group.completedAt = new Date();
    await group.save();
    console.log(
      `[Group ${groupId}] BATCH COMPLETE — ${group.completedCount} succeeded, ${group.failedCount} failed out of ${group.totalLeads}`
    );
  }
}

export function startAnalysisWorker() {
  const concurrency = Number(process.env.ANALYSIS_CONCURRENCY) || 2;

  worker = new Worker<AnalysisJobData>(
    "website-analysis",
    async (job) => processJob(job),
    {
      connection: redisConnection,
      concurrency,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job completed: lead ${job.data.leadId}`);
  });

  worker.on("failed", async (job, err) => {
    if (!job) return;
    console.error(
      `[Worker] Job FAILED: lead ${job.data.leadId} — ${err.message}`
    );

    await Lead.findByIdAndUpdate(job.data.leadId, {
      analysisStatus: "failed",
      analysisError: err.message,
    }).catch(() => {});

    await AnalysisGroup.findByIdAndUpdate(job.data.groupId, {
      $inc: { failedCount: 1 },
    }).catch(() => {});
    await checkGroupCompletion(job.data.groupId).catch(() => {});
  });

  console.log(`[Worker] Analysis worker started (concurrency: ${concurrency})`);
  return worker;
}

export async function stopAnalysisWorker() {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await closeBrowser();
  console.log("[Worker] Analysis worker stopped");
}
