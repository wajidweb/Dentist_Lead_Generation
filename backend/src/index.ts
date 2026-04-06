import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import leadRoutes from "./routes/leadRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/leads", leadRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Dentist Lead Generation API" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
