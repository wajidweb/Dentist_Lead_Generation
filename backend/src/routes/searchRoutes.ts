import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { search, history, autocompleteCities } from "../controllers/searchController";

const router = Router();

router.post("/dentists", authMiddleware, search);
router.get("/history", authMiddleware, history);
router.get("/autocomplete", authMiddleware, autocompleteCities);

export default router;
