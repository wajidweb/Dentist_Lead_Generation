import { Router, Request, Response, NextFunction } from "express";
import { instantlyWebhook } from "../controllers/webhookController";

const router = Router();

// Capture raw body for HMAC signature verification before JSON parsing
// This middleware runs only for webhook routes and stores req.rawBody
router.use(
  (req: Request & { rawBody?: string }, _res: Response, next: NextFunction) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString("utf8");
    });
    req.on("end", () => {
      req.rawBody = data;
      // Re-parse body from rawBody so downstream can use req.body normally
      if (data) {
        try {
          (req as Request).body = JSON.parse(data) as unknown;
        } catch {
          // leave body as-is if parse fails
        }
      }
      next();
    });
  }
);

router.post("/instantly", instantlyWebhook);

export default router;
