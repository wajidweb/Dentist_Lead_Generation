import mongoose, { Document, Schema } from "mongoose";

export interface ILead extends Document {
  dentistName: string;
  clinicName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    dentistName: { type: String, required: true },
    clinicName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "lost"],
      default: "new",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<ILead>("Lead", leadSchema);
