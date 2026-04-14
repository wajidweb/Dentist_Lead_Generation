import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  searchDecisionMakers,
  findEmail,
  verifyEmail,
  bulkSearch,
  getQuota,
} from "../controllers/hunterController";

const router = Router();

router.post("/leads/:id/search", authMiddleware, searchDecisionMakers);
router.post("/leads/:id/find-email", authMiddleware, findEmail);
router.post("/leads/:id/verify", authMiddleware, verifyEmail);
router.post("/bulk-search", authMiddleware, bulkSearch);
router.get("/quota", authMiddleware, getQuota);

export default router;
