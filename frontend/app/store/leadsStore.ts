import { create } from "zustand";
import { apiFetch } from "../lib/api";

interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  relativeTime?: string;
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
  websiteAnalysis?: {
    overallScore: number;
    performanceScore: number;
    seoScore: number;
    visualScore: number;
    contentScore: number;
    issues: string[];
    screenshots?: { desktop: string; mobile: string };
  };
  leadScore?: number;
  leadCategory?: "hot" | "warm" | "cool" | "skip";
  status: string;
  customWebsiteUrl?: string;
  customWebsiteScreenshot?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

  fetchLeads: (params: Record<string, string | number | undefined>) => Promise<void>;
  fetchLeadDetail: (id: string) => Promise<void>;
  updateLeadStatus: (id: string, status: string) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  clearCurrentLead: () => void;
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
      const res = await apiFetch(`/leads/${id}`, {
        method: "DELETE",
      });
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

  fetchDashboardStats: async () => {
    set({ statsLoading: true });
    try {
      const res = await apiFetch(`/leads/stats`);
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
}));
