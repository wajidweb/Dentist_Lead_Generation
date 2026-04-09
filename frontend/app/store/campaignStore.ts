import { create } from "zustand";
import { apiFetch } from "../lib/api";

export interface CampaignLead {
  _id: string;
  businessName: string;
  email?: string;
  status: string;
  outreachStatus?: string;
  lastOutreachAt?: string;
  website?: string;
  city?: string;
  state?: string;
  leadScore?: number;
  leadCategory?: string;
}

export interface Campaign {
  _id: string;
  userEmail: string;
  instantlyCampaignId: string;
  name: string;
  status: string;
  sendingEmail: string;
  leadsAdded: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  emailsBounced: number;
  leads: CampaignLead[];
  leadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  step: number;
  delay: number;
  subject: string;
  body: string;
}

export interface CampaignSchedule {
  days: string[];
  from: string;
  to: string;
  timezone: string;
}

export interface CampaignDetails {
  _id: string;
  name: string;
  status: string;
  sendingEmail: string;
  createdAt: string;
  leads?: CampaignLead[];
  schedule?: CampaignSchedule;
  sequences?: SequenceStep[];
  leadsCount?: number;
  emailsSent?: number;
  emailsOpened?: number;
  emailsReplied?: number;
  emailsBounced?: number;
  openTracking?: boolean;
  linkTracking?: boolean;
}

export interface CampaignAnalytics {
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
  openRate: number;
  replyRate: number;
}

interface CampaignStore {
  campaigns: Campaign[];
  loading: boolean;
  deletingId: string | null;
  selectedCampaignId: string | null;

  // Detail view state
  campaignDetails: CampaignDetails | null;
  detailsLoading: boolean;
  syncingStatuses: boolean;
  savingSchedule: boolean;
  savingSequences: boolean;

  fetchCampaigns: () => Promise<void>;
  deleteCampaign: (id: string) => Promise<boolean>;
  selectCampaign: (id: string | null) => void;

  // Detail actions
  fetchCampaignDetails: (campaignId: string) => Promise<void>;
  updateSchedule: (campaignId: string, schedules: CampaignSchedule) => Promise<boolean>;
  pauseCampaign: (campaignId: string) => Promise<boolean>;
  resumeCampaign: (campaignId: string) => Promise<boolean>;
  syncStatuses: (campaignId: string) => Promise<boolean>;
  updateSequences: (campaignId: string, sequences: SequenceStep[]) => Promise<boolean>;
  updateOptions: (campaignId: string, options: { openTracking?: boolean; linkTracking?: boolean }) => Promise<boolean>;
  fetchAnalytics: (campaignId: string) => Promise<CampaignAnalytics | null>;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: [],
  loading: false,
  deletingId: null,
  selectedCampaignId: null,

  // Detail view defaults
  campaignDetails: null,
  detailsLoading: false,
  syncingStatuses: false,
  savingSchedule: false,
  savingSequences: false,

  fetchCampaigns: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch("/email-outreach/campaigns");
      if (!res.ok) {
        set({ loading: false });
        return;
      }
      const data = await res.json();
      set({ campaigns: data.campaigns ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  deleteCampaign: async (id: string) => {
    set({ deletingId: id });
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${id}`, {
        method: "DELETE",
      });
      set({ deletingId: null });
      if (!res.ok) return false;
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c._id !== id),
      }));
      return true;
    } catch {
      set({ deletingId: null });
      return false;
    }
  },

  selectCampaign: (id) => set({ selectedCampaignId: id }),

  fetchCampaignDetails: async (campaignId: string) => {
    set({ detailsLoading: true, campaignDetails: null });
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/details`);
      if (!res.ok) {
        set({ detailsLoading: false });
        return;
      }
      const data = await res.json();
      set({ campaignDetails: data.campaign ?? data, detailsLoading: false });
    } catch {
      set({ detailsLoading: false });
    }
  },

  updateSchedule: async (campaignId: string, schedules: CampaignSchedule) => {
    set({ savingSchedule: true });
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({ schedules }),
      });
      set({ savingSchedule: false });
      return res.ok;
    } catch {
      set({ savingSchedule: false });
      return false;
    }
  },

  pauseCampaign: async (campaignId: string) => {
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/pause`, {
        method: "POST",
      });
      if (res.ok) {
        set((state) => ({
          campaignDetails: state.campaignDetails
            ? { ...state.campaignDetails, status: "paused" }
            : state.campaignDetails,
          campaigns: state.campaigns.map((c) =>
            c._id === campaignId ? { ...c, status: "paused" } : c
          ),
        }));
      }
      return res.ok;
    } catch {
      return false;
    }
  },

  resumeCampaign: async (campaignId: string) => {
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/resume`, {
        method: "POST",
      });
      if (res.ok) {
        set((state) => ({
          campaignDetails: state.campaignDetails
            ? { ...state.campaignDetails, status: "active" }
            : state.campaignDetails,
          campaigns: state.campaigns.map((c) =>
            c._id === campaignId ? { ...c, status: "active" } : c
          ),
        }));
      }
      return res.ok;
    } catch {
      return false;
    }
  },

  syncStatuses: async (campaignId: string) => {
    set({ syncingStatuses: true });
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/sync-statuses`, {
        method: "POST",
      });
      set({ syncingStatuses: false });
      return res.ok;
    } catch {
      set({ syncingStatuses: false });
      return false;
    }
  },

  updateSequences: async (campaignId: string, sequences: SequenceStep[]) => {
    set({ savingSequences: true });
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/sequences`, {
        method: "PATCH",
        body: JSON.stringify({ sequences }),
      });
      set({ savingSequences: false });
      return res.ok;
    } catch {
      set({ savingSequences: false });
      return false;
    }
  },

  updateOptions: async (campaignId: string, options: { openTracking?: boolean; linkTracking?: boolean }) => {
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/options`, {
        method: "PATCH",
        body: JSON.stringify(options),
      });
      if (res.ok) {
        set((state) => ({
          campaignDetails: state.campaignDetails
            ? {
                ...state.campaignDetails,
                ...(typeof options.openTracking === "boolean" ? { openTracking: options.openTracking } : {}),
                ...(typeof options.linkTracking === "boolean" ? { linkTracking: options.linkTracking } : {}),
              }
            : state.campaignDetails,
        }));
      }
      return res.ok;
    } catch {
      return false;
    }
  },

  fetchAnalytics: async (campaignId: string) => {
    try {
      const res = await apiFetch(`/email-outreach/campaigns/${campaignId}/analytics`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.analytics ?? data;
    } catch {
      return null;
    }
  },
}));
