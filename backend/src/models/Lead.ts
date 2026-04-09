import mongoose, { Schema, Document } from "mongoose";

export interface IReview {
  author: string;
  rating: number;
  text: string;
  date: Date;
  relativeTime?: string;
}

export interface IWebsiteAnalysis {
  // PSI data
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  loadTimeMs: number;
  isHttps: boolean;
  coreWebVitals: {
    lcp: number | null;
    cls: number | null;
    tbt: number | null;
  };

  // Claude visual analysis (categorical)
  visualCategory: 'poor' | 'fair' | 'good' | 'excellent';
  visualSubScores: {
    designModernity: 'poor' | 'fair' | 'good' | 'excellent';
    colorScheme: 'poor' | 'fair' | 'good' | 'excellent';
    layoutQuality: 'poor' | 'fair' | 'good' | 'excellent';
    imageQuality: 'poor' | 'fair' | 'good' | 'excellent';
    ctaVisibility: 'poor' | 'fair' | 'good' | 'excellent';
    trustSignals: 'poor' | 'fair' | 'good' | 'excellent';
    mobileExperience: 'poor' | 'fair' | 'good' | 'excellent';
  };
  designEraEstimate: string;
  visualIssues: string[];

  // Claude content analysis
  contentCategory: 'poor' | 'fair' | 'good' | 'excellent';
  contentItems: {
    serviceDescriptions: { present: boolean; quality: string; note: string };
    doctorBios: { present: boolean; quality: string; note: string };
    patientTestimonials: { present: boolean; quality: string; note: string };
    onlineBooking: { present: boolean; quality: string; note: string };
    contactInfo: { present: boolean; quality: string; note: string };
    insuranceInfo: { present: boolean; quality: string; note: string };
    officeHours: { present: boolean; quality: string; note: string };
    newPatientInfo: { present: boolean; quality: string; note: string };
    beforeAfter: { present: boolean; quality: string; note: string };
    blogContent: { present: boolean; quality: string; note: string };
    emergencyInfo: { present: boolean; quality: string; note: string };
    aboutPractice: { present: boolean; quality: string; note: string };
  };
  contentItemsPresentCount: number;
  criticalMissing: string[];

  // Combined
  issuesList: string[];
  oneLineSummary: string;

  // DOM checks
  hasContactForm: boolean;
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasBookingWidget: boolean;
  hasGoogleMap: boolean;
  hasSocialLinks: boolean;
  hasSchemaMarkup: boolean;
  hasVideo: boolean;
  imageCount: number;
  navigationItemCount: number;

  // Screenshots (Cloudinary URLs)
  screenshots: {
    desktop: string;
    mobile: string;
  };

  analyzedAt: Date;
}

export interface IEmailHistoryEntry {
  sentAt: Date;
  templateName: string;
  subject: string;
  body: string;
  status: "sent" | "opened" | "replied" | "bounced";
  instantlyEmailId?: string;
  sequenceStep?: number;
  openedAt?: Date;
  repliedAt?: Date;
  bouncedAt?: Date;
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
  analysisStatus: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  analysisError?: string;
  analysisGroupId?: string;
  analyzedAt?: Date;
  websiteQualityScore?: number;
  notes?: string;
  instantlyCampaignId?: string;
  instantlyLeadId?: string;
  outreachStatus?: "pending" | "sent" | "opened" | "replied" | "bounced";
  lastOutreachAt?: Date;
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
    sequenceStep: { type: Number },
    openedAt: { type: Date },
    repliedAt: { type: Date },
    bouncedAt: { type: Date },
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
    coreWebVitals: {
      lcp: Number,
      cls: Number,
      tbt: Number,
    },
    visualCategory: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
    visualSubScores: {
      designModernity: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
      colorScheme: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
      layoutQuality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
      imageQuality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
      ctaVisibility: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
      trustSignals: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
      mobileExperience: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
    },
    designEraEstimate: String,
    visualIssues: [String],
    contentCategory: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
    contentItems: Schema.Types.Mixed,
    contentItemsPresentCount: Number,
    criticalMissing: [String],
    issuesList: [String],
    oneLineSummary: String,
    hasContactForm: Boolean,
    hasPhoneLink: Boolean,
    hasEmailLink: Boolean,
    hasBookingWidget: Boolean,
    hasGoogleMap: Boolean,
    hasSocialLinks: Boolean,
    hasSchemaMarkup: Boolean,
    hasVideo: Boolean,
    imageCount: Number,
    navigationItemCount: Number,
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
    analysisStatus: {
      type: String,
      enum: ['pending', 'queued', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    analysisError: { type: String },
    analysisGroupId: { type: String },
    analyzedAt: { type: Date },
    websiteQualityScore: { type: Number },
    notes: { type: String },
    instantlyCampaignId: { type: String },
    instantlyLeadId: { type: String },
    outreachStatus: {
      type: String,
      enum: ["pending", "sent", "opened", "replied", "bounced"],
    },
    lastOutreachAt: { type: Date },
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
leadSchema.index({ analysisStatus: 1 });
leadSchema.index({ analysisGroupId: 1 });
leadSchema.index({ websiteQualityScore: -1 });

export default mongoose.model<ILead>("Lead", leadSchema);
