import mongoose, { Schema, Document } from "mongoose";

export interface IHarvesterCache extends Document {
  domain: string;
  emails: string[];
  hosts: string[];
  sources: string[];
  queriedAt: Date;
  expiresAt: Date;
}

const harvesterCacheSchema = new Schema<IHarvesterCache>({
  domain: { type: String, required: true, unique: true, index: true },
  emails: [{ type: String }],
  hosts: [{ type: String }],
  sources: [{ type: String }],
  queriedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expires: 0 } }, // TTL index — MongoDB auto-deletes when expiresAt is reached
});

export default mongoose.model<IHarvesterCache>("HarvesterCache", harvesterCacheSchema);
