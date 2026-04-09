import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { listEmails, unreadCount, getEmail, replyToEmail, markAsRead, getEmailThread } from "../controllers/uniboxController";

const router = Router();

router.get("/emails", authMiddleware, listEmails);
router.get("/emails/unread-count", authMiddleware, unreadCount);
// Thread endpoint MUST come before /:emailId to avoid being matched as emailId="thread"
router.get("/emails/:emailId/thread", authMiddleware, getEmailThread);
router.get("/emails/:emailId", authMiddleware, getEmail);
router.post("/emails/reply", authMiddleware, replyToEmail);
router.patch("/emails/:emailId/read", authMiddleware, markAsRead);

export default router;
