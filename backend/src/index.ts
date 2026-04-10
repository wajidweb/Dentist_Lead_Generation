import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import searchRoutes from "./routes/searchRoutes";
import leadsRoutes from "./routes/leadsRoutes";
import analysisRoutes from "./routes/analysisRoutes";
import emailOutreachRoutes from "./routes/emailOutreachRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import uniboxRoutes from "./routes/uniboxRoutes";
import { startAnalysisWorker, stopAnalysisWorker } from "./jobs/analysisWorker";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/email-outreach", emailOutreachRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/unibox", uniboxRoutes);
app.get("/", (_req, res) => {
  res.json({ message: "DentalLeads API" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Start analysis worker (requires Redis)
  try {
    startAnalysisWorker();
  } catch (err) {
    console.warn("Analysis worker failed to start (Redis may be unavailable):", err);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await stopAnalysisWorker();
  process.exit(0);
});
process.on("SIGINT", async () => {
  await stopAnalysisWorker();
  process.exit(0);
});
