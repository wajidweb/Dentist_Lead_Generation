import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  listEmailAccounts,
  getEmailAccountStatus,
  deleteEmailAccount,
} from "../controllers/settingsController";

const router = Router();

router.get("/email-accounts", authMiddleware, listEmailAccounts);
router.get("/email-accounts/:email/status", authMiddleware, getEmailAccountStatus);
router.delete("/email-accounts/:email", authMiddleware, deleteEmailAccount);

export default router;
