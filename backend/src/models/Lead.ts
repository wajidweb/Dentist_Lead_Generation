import mongoose, { Schema, Document } from "mongoose";

export interface IReview {
  author: string;
  rating: number;
  text: string;
  date: Date;
  relativeTime?: string;
}

export interface IWebsiteAnalysis {
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  loadTimeMs: number;
  isHttps: boolean;
  hasViewportMeta: boolean;
  coreWebVitals: {
    lcp: number;
    cls: number;
    inp: number;
  };
  visualScore: number;
  designModernity: number;
  colorScheme: number;
  layoutQuality: number;
  imageQuality: number;
  ctaVisibility: number;
  trustSignals: number;
  mobileExperience: number;
  designEraEstimate: string;
  visualIssues: string[];
  contentScore: number;
  contentItems: {
    serviceDescriptions: { present: boolean; quality: string; note: string };
    doctorBios: { present: boolean; quality: string; note: string };
    patientTestimonials: { present: boolean; quality: string; note: string };
    onlineBooking: { present: boolean; note: string };
    contactInfo: { present: boolean; quality: string; note: string };
    insuranceInfo: { present: boolean; note: string };
    officeHours: { present: boolean; note: string };
    newPatientInfo: { present: boolean; note: string };
    beforeAfter: { present: boolean; note: string };
    blogContent: { present: boolean; note: string };
    emergencyInfo: { present: boolean; note: string };
    aboutPractice: { present: boolean; quality: string; note: string };
  };
  contentItemsPresentCount: number;
  criticalMissing: string[];
  techStack: Array<{ name: string; version?: string; category: string }>;
  technologyScore: number;
  hasContactForm: boolean;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasBookingWidget: boolean;
  hasGoogleMap: boolean;
  hasSocialLinks: boolean;
  hasSchemaMarkup: boolean;
  imageCount: number;
  hasVideo: boolean;
  navigationItemCount: number;
  overallScore: number;
  issues: string[];
  screenshots: { desktop: string; mobile: string };
  analyzedAt: Date;
}

export interface IEmailHistoryEntry {
  sentAt: Date;
  templateName: string;
  subject: string;
  body: string;
  status: "sent" | "opened" | "replied" | "bounced";
  instantlyEmailId?: string;
}

export interface ILead extends Document {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  website: string;
  googlePlaceId: string;
  googleMapsUrl: string;
  googleRating: number;
  googleReviewCount: number;
  reviews: IReview[];
  email?: string;
  emailSource?: "scrape" | "hunter" | "outscraper" | "manual";
  emailVerified?: boolean;
  emailVerificationStatus?: "deliverable" | "risky" | "undeliverable";
  websiteAnalysis?: IWebsiteAnalysis;
  leadScore?: number;
  leadCategory?: "hot" | "warm" | "cool" | "skip";
  status:
    | "discovered"
    | "analyzed"
    | "qualified"
    | "website_created"
    | "email_sent"
    | "replied"
    | "converted"
    | "lost"
    | "skipped";
  customWebsiteUrl?: string;
  customWebsiteScreenshot?: string;
  emailHistory: IEmailHistoryEntry[];
  analyzed: boolean;
  notes?: string;
  searchQuery: string;
  searchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    author: { type: String, required: true },
    rating: { type: Number, required: true },
    text: { type: String, default: "" },
    date: { type: Date },
    relativeTime: { type: String },
  },
  { _id: false }
);

const emailHistorySchema = new Schema<IEmailHistoryEntry>(
  {
    sentAt: { type: Date, required: true },
    templateName: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["sent", "opened", "replied", "bounced"],
      default: "sent",
    },
    instantlyEmailId: { type: String },
  },
  { _id: false }
);

const websiteAnalysisSchema = new Schema(
  {
    performanceScore: Number,
    seoScore: Number,
    accessibilityScore: Number,
    bestPracticesScore: Number,
    loadTimeMs: Number,
    isHttps: Boolean,
    hasViewportMeta: Boolean,
    coreWebVitals: {
      lcp: Number,
      cls: Number,
      inp: Number,
    },
    visualScore: Number,
    designModernity: Number,
    colorScheme: Number,
    layoutQuality: Number,
    imageQuality: Number,
    ctaVisibility: Number,
    trustSignals: Number,
    mobileExperience: Number,
    designEraEstimate: String,
    visualIssues: [String],
    contentScore: Number,
    contentItems: Schema.Types.Mixed,
    contentItemsPresentCount: Number,
    criticalMissing: [String],
    techStack: [{ name: String, version: String, category: String }],
    technologyScore: Number,
    hasContactForm: Boolean,
    hasPhoneLink: Boolean,
    hasEmailLink: Boolean,
    hasBookingWidget: Boolean,
    hasGoogleMap: Boolean,
    hasSocialLinks: Boolean,
    hasSchemaMarkup: Boolean,
    imageCount: Number,
    hasVideo: Boolean,
    navigationItemCount: Number,
    overallScore: Number,
    issues: [String],
    screenshots: { desktop: String, mobile: String },
    analyzedAt: Date,
  },
  { _id: false }
);

const leadSchema = new Schema<ILead>(
  {
    businessName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    zipCode: { type: String },
    phone: { type: String },
    website: { type: String, required: true },
    googlePlaceId: { type: String, required: true, unique: true },
    googleMapsUrl: { type: String },
    googleRating: { type: Number, required: true },
    googleReviewCount: { type: Number, required: true },
    reviews: [reviewSchema],
    email: { type: String },
    emailSource: {
      type: String,
      enum: ["scrape", "hunter", "outscraper", "manual"],
    },
    emailVerified: { type: Boolean },
    emailVerificationStatus: {
      type: String,
      enum: ["deliverable", "risky", "undeliverable"],
    },
    websiteAnalysis: websiteAnalysisSchema,
    leadScore: { type: Number },
    leadCategory: {
      type: String,
      enum: ["hot", "warm", "cool", "skip"],
    },
    status: {
      type: String,
      enum: [
        "discovered",
        "analyzed",
        "qualified",
        "website_created",
        "email_sent",
        "replied",
        "converted",
        "lost",
        "skipped",
      ],
      default: "discovered",
    },
    customWebsiteUrl: { type: String },
    customWebsiteScreenshot: { type: String },
    emailHistory: [emailHistorySchema],
    analyzed: { type: Boolean, default: false },
    notes: { type: String },
    searchQuery: { type: String, required: true },
    searchId: { type: Schema.Types.ObjectId, ref: "SearchHistory", required: true },
  },
  { timestamps: true }
);

leadSchema.index({ city: 1, status: 1 });
leadSchema.index({ leadScore: -1 });
leadSchema.index({ googleRating: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ analyzed: 1 });

export default mongoose.model<ILead>("Lead", leadSchema);
