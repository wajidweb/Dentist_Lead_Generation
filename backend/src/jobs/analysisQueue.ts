import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const analysisQueue = new Queue("website-analysis", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export type EmailProvider = "harvester" | "hunter";

export interface AnalysisJobData {
  leadId: string;
  websiteUrl: string;
  groupId: string;
  emailProvider: EmailProvider;
}

export async function addAnalysisJobs(
  leads: Array<{ leadId: string; websiteUrl: string }>,
  groupId: string,
  emailProvider: EmailProvider = "harvester"
) {
  const jobs = leads.map((lead) => ({
    name: "analyze-website",
    data: {
      leadId: lead.leadId,
      websiteUrl: lead.websiteUrl,
      groupId,
      emailProvider,
    } as AnalysisJobData,
    opts: {
      jobId: `analysis-${lead.leadId}-${groupId}`,
      timeout: Number(process.env.ANALYSIS_TIMEOUT_MS) || 120000,
    },
  }));

  await analysisQueue.addBulk(jobs);
  return jobs.length;
}
