import mongoose, { Schema, Document } from "mongoose";

export interface IAnalysisGroup extends Document {
  leadIds: string[];
  totalLeads: number;
  completedCount: number;
  failedCount: number;
  status: "running" | "completed" | "cancelled";
  startedAt: Date;
  completedAt?: Date;
  createdBy: string;
}

const analysisGroupSchema = new Schema<IAnalysisGroup>(
  {
    leadIds: [{ type: String, required: true }],
    totalLeads: { type: Number, required: true },
    completedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["running", "completed", "cancelled"],
      default: "running",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAnalysisGroup>("AnalysisGroup", analysisGroupSchema);
