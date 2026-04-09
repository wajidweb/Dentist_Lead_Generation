import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  preview,
  send,
  sendBulk,
  tracking,
  outreachStats,
  getCampaign,
  listCampaigns,
  deleteCampaign,
  updateSchedule,
  pauseCampaign,
  resumeCampaign,
  getCampaignDetails,
  syncStatuses,
  updateSequences,
  campaignAnalytics,
  updateOptions,
} from "../controllers/emailOutreachController";

const router = Router();

router.post("/preview", authMiddleware, preview);
router.post("/send", authMiddleware, send);
router.post("/send-bulk", authMiddleware, sendBulk);
router.get("/tracking/:leadId", authMiddleware, tracking);
router.get("/stats", authMiddleware, outreachStats);
router.get("/campaign", authMiddleware, getCampaign);
router.get("/campaigns", authMiddleware, listCampaigns);
router.delete("/campaigns/:campaignId", authMiddleware, deleteCampaign);

// Campaign management
router.patch("/campaigns/:campaignId/schedule", authMiddleware, updateSchedule);
router.post("/campaigns/:campaignId/pause", authMiddleware, pauseCampaign);
router.post("/campaigns/:campaignId/resume", authMiddleware, resumeCampaign);
router.get("/campaigns/:campaignId/details", authMiddleware, getCampaignDetails);
router.post("/campaigns/:campaignId/sync-statuses", authMiddleware, syncStatuses);
router.patch("/campaigns/:campaignId/sequences", authMiddleware, updateSequences);
router.get("/campaigns/:campaignId/analytics", authMiddleware, campaignAnalytics);
router.patch("/campaigns/:campaignId/options", authMiddleware, updateOptions);

export default router;
