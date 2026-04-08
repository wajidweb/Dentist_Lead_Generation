import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  startBatch,
  startSingle,
  getStatus,
  retryFailed,
  cancelBatch,
} from "../controllers/analysisController";

const router = Router();

router.post("/start", authMiddleware, startBatch);
router.post("/start/:leadId", authMiddleware, startSingle);
router.get("/status/:groupId", authMiddleware, getStatus);
router.post("/retry/:groupId", authMiddleware, retryFailed);
router.post("/cancel/:groupId", authMiddleware, cancelBatch);

export default router;
