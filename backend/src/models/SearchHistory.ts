import mongoose, { Schema, Document } from "mongoose";

export interface ISearchHistory extends Document {
  query: string;
  location: string;
  minRating: number;
  minReviews: number;
  totalResultsFromGoogle: number;
  leadsCreated: number;
  searchedAt: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>({
  query: { type: String, required: true },
  location: { type: String, required: true },
  minRating: { type: Number, default: 3.5 },
  minReviews: { type: Number, default: 10 },
  totalResultsFromGoogle: { type: Number, default: 0 },
  leadsCreated: { type: Number, default: 0 },
  searchedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISearchHistory>(
  "SearchHistory",
  searchHistorySchema
);
