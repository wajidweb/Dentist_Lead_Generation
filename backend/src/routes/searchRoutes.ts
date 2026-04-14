import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { search, history, deleteHistory, autocompleteCities, resetProgress } from "../controllers/searchController";

const router = Router();

router.post("/dentists", authMiddleware, search);
router.get("/history", authMiddleware, history);
router.delete("/history/:id", authMiddleware, deleteHistory);
router.get("/autocomplete", authMiddleware, autocompleteCities);
router.post("/reset-progress", authMiddleware, resetProgress);

export default router;
