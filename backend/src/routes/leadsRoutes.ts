import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  list,
  detail,
  changeStatus,
  update,
  remove,
  stats,
  bulkRemove,
  bulkChangeStatus,
  bulkAnalyze,
  exportLeads,
} from "../controllers/leadsController";

const router = Router();

router.get("/", authMiddleware, list);
router.get("/stats", authMiddleware, stats);
router.get("/export", authMiddleware, exportLeads);
router.post("/bulk-delete", authMiddleware, bulkRemove);
router.post("/bulk-status", authMiddleware, bulkChangeStatus);
router.post("/bulk-analyze", authMiddleware, bulkAnalyze);
router.get("/:id", authMiddleware, detail);
router.patch("/:id", authMiddleware, update);
router.patch("/:id/status", authMiddleware, changeStatus);
router.delete("/:id", authMiddleware, remove);

export default router;
