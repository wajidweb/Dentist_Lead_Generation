import mongoose, { Schema, Document } from "mongoose";

export interface IQueryProgress {
  query: string;
  nextPageToken: string | null;
  exhausted: boolean;
  pagesSearched: number;
}

export interface ISearchProgress extends Document {
  userEmail: string;
  location: string;
  queries: IQueryProgress[];
  currentQueryIndex: number;
  totalLeadsFetched: number;
  updatedAt: Date;
}

const queryProgressSchema = new Schema<IQueryProgress>(
  {
    query: { type: String, required: true },
    nextPageToken: { type: String, default: null },
    exhausted: { type: Boolean, default: false },
    pagesSearched: { type: Number, default: 0 },
  },
  { _id: false }
);

const searchProgressSchema = new Schema<ISearchProgress>({
  userEmail: { type: String, required: true },
  location: { type: String, required: true },
  queries: [queryProgressSchema],
  currentQueryIndex: { type: Number, default: 0 },
  totalLeadsFetched: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

// Compound unique: one progress per user per location
searchProgressSchema.index({ userEmail: 1, location: 1 }, { unique: true });

export default mongoose.model<ISearchProgress>(
  "SearchProgress",
  searchProgressSchema
);
