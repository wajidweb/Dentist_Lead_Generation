import { create } from "zustand";
import { apiFetch } from "../lib/api";

interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  relativeTime?: string;
}

export interface WebsiteAnalysis {
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  loadTimeMs: number;
  isHttps: boolean;
  coreWebVitals: { lcp: number | null; cls: number | null; tbt: number | null };
  visualCategory: string;
  visualSubScores: {
    designModernity: string;
    colorScheme: string;
    layoutQuality: string;
    imageQuality: string;
    ctaVisibility: string;
    trustSignals: string;
    mobileExperience: string;
  };
  designEraEstimate: string;
  visualIssues: string[];
  contentCategory: string;
  contentItems: Record<string, { present: boolean; quality: string; note: string }>;
  contentItemsPresentCount: number;
  criticalMissing: string[];
  issuesList: string[];
  oneLineSummary: string;
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
  screenshots: { desktop: string; mobile: string };
  analyzedAt: string;
}

export interface Lead {
  _id: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  googlePlaceId: string;
  googleMapsUrl: string;
  googleRating: number;
  googleReviewCount: number;
  reviews: Review[];
  email?: string;
  emailSource?: string;
  websiteAnalysis?: WebsiteAnalysis;
  websiteQualityScore?: number;
  leadScore?: number;
  leadCategory?: "hot" | "warm" | "cool" | "skip";
  status: string;
  customWebsiteUrl?: string;
  customWebsiteScreenshot?: string;
  analyzed: boolean;
  analysisStatus?: string;
  analysisError?: string;
  analysisGroupId?: string;
  analyzedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisStatus {
  groupId: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  waiting: number;
  status: string;
  failedLeads: Array<{ leadId: string; businessName: string; error: string }>;
}

interface DashboardStats {
  totalLeads: number;
  discovered: number;
  analyzed: number;
  qualified: number;
  emailSent: number;
  replied: number;
  converted: number;
  lost: number;
  revenue: number;
  conversionRate: string;
  topCities: Array<{ city: string; count: number }>;
  categories: { hot: number; warm: number; cool: number; skip: number };
}

interface LeadsStore {
  leads: Lead[];
  currentLead: Lead | null;
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  stats: DashboardStats | null;
  statsLoading: boolean;

  // Analysis state (persists across navigation)
  activeGroupId: string | null;
  analysisProgress: AnalysisStatus | null;

  fetchLeads: (params: Record<string, string | number | undefined>) => Promise<void>;
  refreshLeads: (params: Record<string, string | number | undefined>) => Promise<void>;
  fetchLeadDetail: (id: string) => Promise<void>;
  updateLeadStatus: (id: string, status: string) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  fetchDashboardStats: (startDate?: string, endDate?: string) => Promise<void>;
  clearCurrentLead: () => void;
  bulkDeleteLeads: (ids: string[]) => Promise<number>;
  bulkUpdateStatus: (ids: string[], status: string) => Promise<number>;
  startAnalysis: (ids: string[]) => Promise<{ groupId: string; totalJobs: number } | null>;
  getAnalysisStatus: (groupId: string) => Promise<AnalysisStatus | null>;
  retryFailedAnalysis: (groupId: string) => Promise<number>;
  cancelAnalysis: (groupId: string) => Promise<number>;
  setActiveGroup: (groupId: string | null, progress?: AnalysisStatus | null) => void;
  restoreActiveGroup: () => Promise<void>;
}

export const useLeadsStore = create<LeadsStore>((set, get) => ({
  leads: [],
  currentLead: null,
  total: 0,
  page: 1,
  totalPages: 0,
  loading: false,
  detailLoading: false,
  error: null,
  stats: null,
  statsLoading: false,
  activeGroupId: null,
  analysisProgress: null,

  fetchLeads: async (params) => {
    set({ loading: true, error: null });
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v));
    });
    try {
      const res = await apiFetch(`/leads?${query}`);
      const data = await res.json();
      if (!res.ok) {
        set({ loading: false, error: data.message || "Failed to fetch leads" });
        return;
      }
      set({
        loading: false,
        leads: data.leads,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
      });
    } catch {
      set({ loading: false, error: "Unable to connect to server" });
    }
  },

  refreshLeads: async (params) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v));
    });
    try {
      const res = await apiFetch(`/leads?${query}`);
      const data = await res.json();
      if (!res.ok) return;
      set({
        leads: data.leads,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
      });
    } catch {
      // Silent — don't show error during background refresh
    }
  },

  fetchLeadDetail: async (id) => {
    set({ detailLoading: true });
    try {
      const res = await apiFetch(`/leads/${id}`);
      const data = await res.json();
      if (!res.ok) {
        set({ detailLoading: false });
        return;
      }
      set({ detailLoading: false, currentLead: data.lead });
    } catch {
      set({ detailLoading: false });
    }
  },

  updateLeadStatus: async (id, status) => {
    try {
      const res = await apiFetch(`/leads/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) return;
      const updatedLead = data.lead as Lead;
      const { leads, currentLead } = get();
      const idx = leads.findIndex((l) => l._id === updatedLead._id);
      const newLeads = [...leads];
      if (idx !== -1) newLeads[idx] = updatedLead;
      set({
        leads: newLeads,
        currentLead: currentLead?._id === updatedLead._id ? updatedLead : currentLead,
      });
    } catch {
      // silent fail
    }
  },

  deleteLead: async (id) => {
    try {
      const res = await apiFetch(`/leads/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      const { leads, total } = get();
      set({
        leads: leads.filter((l) => l._id !== id),
        total: total - 1,
      });
    } catch {
      // silent fail
    }
  },

  fetchDashboardStats: async (startDate?: string, endDate?: string) => {
    set({ statsLoading: true });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiFetch(`/leads/stats${query}`);
      const data = await res.json();
      if (!res.ok) {
        set({ statsLoading: false });
        return;
      }
      set({ statsLoading: false, stats: data });
    } catch {
      set({ statsLoading: false });
    }
  },

  clearCurrentLead: () => set({ currentLead: null }),

  bulkDeleteLeads: async (ids) => {
    try {
      const res = await apiFetch("/leads/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) return 0;
      const { leads, total } = get();
      set({
        leads: leads.filter((l) => !ids.includes(l._id)),
        total: total - (data.count || 0),
      });
      return data.count || 0;
    } catch {
      return 0;
    }
  },

  bulkUpdateStatus: async (ids, status) => {
    try {
      const res = await apiFetch("/leads/bulk-status", {
        method: "POST",
        body: JSON.stringify({ ids, status }),
      });
      const data = await res.json();
      if (!res.ok) return 0;
      const { leads } = get();
      set({
        leads: leads.map((l) =>
          ids.includes(l._id) ? { ...l, status } : l
        ),
      });
      return data.count || 0;
    } catch {
      return 0;
    }
  },

  startAnalysis: async (ids) => {
    try {
      const res = await apiFetch("/analysis/start", {
        method: "POST",
        body: JSON.stringify({ leadIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) return null;
      const { leads } = get();
      const progress: AnalysisStatus = {
        groupId: data.groupId,
        total: data.totalJobs,
        completed: 0,
        failed: 0,
        inProgress: 0,
        waiting: data.totalJobs,
        status: "running",
        failedLeads: [],
      };
      set({
        leads: leads.map((l) =>
          ids.includes(l._id) ? { ...l, analysisStatus: "queued" } : l
        ),
        activeGroupId: data.groupId,
        analysisProgress: progress,
      });
      localStorage.setItem("analysisGroupId", data.groupId);
      return { groupId: data.groupId, totalJobs: data.totalJobs };
    } catch {
      return null;
    }
  },

  getAnalysisStatus: async (groupId) => {
    try {
      const res = await apiFetch(`/analysis/status/${groupId}`);
      const data = await res.json();
      if (!res.ok) return null;
      return data as AnalysisStatus;
    } catch {
      return null;
    }
  },

  retryFailedAnalysis: async (groupId) => {
    try {
      const res = await apiFetch(`/analysis/retry/${groupId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) return 0;
      return data.retriedCount || 0;
    } catch {
      return 0;
    }
  },

  cancelAnalysis: async (groupId) => {
    try {
      const res = await apiFetch(`/analysis/cancel/${groupId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) return 0;
      set({ activeGroupId: null, analysisProgress: null });
      localStorage.removeItem("analysisGroupId");
      return data.cancelledCount || 0;
    } catch {
      return 0;
    }
  },

  setActiveGroup: (groupId, progress = null) => {
    set({ activeGroupId: groupId, analysisProgress: progress });
    if (groupId) {
      localStorage.setItem("analysisGroupId", groupId);
    } else {
      localStorage.removeItem("analysisGroupId");
    }
  },

  restoreActiveGroup: async () => {
    const savedGroupId = localStorage.getItem("analysisGroupId");
    if (!savedGroupId) return;

    try {
      const res = await apiFetch(`/analysis/status/${savedGroupId}`);
      const data = await res.json();
      if (!res.ok) {
        localStorage.removeItem("analysisGroupId");
        return;
      }
      const status = data as AnalysisStatus;
      if (status.status === "completed" || status.status === "cancelled") {
        // Already done — clear it
        localStorage.removeItem("analysisGroupId");
        set({ activeGroupId: null, analysisProgress: null });
      } else {
        // Still running — restore polling state
        set({ activeGroupId: savedGroupId, analysisProgress: status });
      }
    } catch {
      localStorage.removeItem("analysisGroupId");
    }
  },
}));
