import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  userEmail: string;
  instantlyCampaignId: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  sendingEmail: string;
  instantlyWebhookId?: string;
  leadsAdded: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  emailsBounced: number;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    userEmail: { type: String, required: true, index: true },
    instantlyCampaignId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed"],
      default: "draft",
    },
    sendingEmail: { type: String, required: true },
    instantlyWebhookId: { type: String },
    leadsAdded: { type: Number, default: 0 },
    emailsSent: { type: Number, default: 0 },
    emailsOpened: { type: Number, default: 0 },
    emailsReplied: { type: Number, default: 0 },
    emailsBounced: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// unique: true on the fields already creates indexes — no manual .index() needed

export default mongoose.model<ICampaign>("Campaign", campaignSchema);
