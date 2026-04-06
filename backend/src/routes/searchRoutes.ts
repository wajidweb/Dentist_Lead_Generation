import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { search, history } from "../controllers/searchController";

const router = Router();

router.post("/dentists", authMiddleware, search);
router.get("/history", authMiddleware, history);

export default router;
