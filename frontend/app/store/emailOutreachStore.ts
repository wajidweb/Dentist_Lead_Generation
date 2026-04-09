import { create } from "zustand";
import { apiFetch } from "../lib/api";

export interface EmailPreview {
  to: string;
  from: string;
  subject: string;
  body: string;
  leadId: string;
  businessName: string;
  previewLink?: string;
}

export interface OutreachStats {
  totalSent: number;
  opened: number;
  replied: number;
  bounced: number;
  openRate: number | string;
  replyRate: number | string;
}

export interface TrackingEntry {
  _id?: string;
  sequenceStep: number;
  status: "sent" | "opened" | "replied" | "bounced";
  timestamp: string;
  subject?: string;
  messageId?: string;
}

interface EmailOutreachStore {
  previewModalOpen: boolean;
  emailPreview: EmailPreview | null;
  previewLoading: boolean;
  sendingLoading: boolean;
  trackingData: Record<string, TrackingEntry[]>;
  trackingLoading: boolean;
  outreachStats: OutreachStats | null;
  statsLoading: boolean;

  openPreviewModal: (leadId: string, previewLink?: string) => Promise<void>;
  closePreviewModal: () => void;
  updatePreviewField: (
    field: "to" | "from" | "subject" | "body" | "previewLink",
    value: string
  ) => void;
  sendOutreach: () => Promise<boolean>;
  sendBulkOutreach: (
    leadIds: string[],
    subject: string,
    body: string,
    previewLink?: string
  ) => Promise<{ sent: number; failed: number }>;
  fetchTracking: (leadId: string) => Promise<void>;
  fetchOutreachStats: (startDate?: string, endDate?: string) => Promise<void>;
}

export const useEmailOutreachStore = create<EmailOutreachStore>((set, get) => ({
  previewModalOpen: false,
  emailPreview: null,
  previewLoading: false,
  sendingLoading: false,
  trackingData: {},
  trackingLoading: false,
  outreachStats: null,
  statsLoading: false,

  openPreviewModal: async (leadId, previewLink) => {
    set({ previewModalOpen: true, previewLoading: true, emailPreview: null });
    try {
      const res = await apiFetch("/email-outreach/preview", {
        method: "POST",
        body: JSON.stringify({ leadId, previewLink }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ previewLoading: false });
        return;
      }
      // Use the user's selected sending email from settings if available
      const selectedSendingEmail =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedSendingEmail")
          : null;
      set({
        previewLoading: false,
        emailPreview: {
          to: data.to ?? "",
          from: selectedSendingEmail || data.from || "",
          subject: data.preview?.subject ?? "",
          body: data.preview?.body ?? "",
          leadId: data.leadId ?? leadId,
          businessName: data.businessName ?? "",
          previewLink: previewLink ?? data.previewLink ?? "",
        },
      });
    } catch {
      set({ previewLoading: false });
    }
  },

  closePreviewModal: () =>
    set({ previewModalOpen: false, emailPreview: null, previewLoading: false }),

  updatePreviewField: (field, value) => {
    const { emailPreview } = get();
    if (!emailPreview) return;
    set({ emailPreview: { ...emailPreview, [field]: value } });
  },

  sendOutreach: async () => {
    const { emailPreview } = get();
    if (!emailPreview) return false;
    set({ sendingLoading: true });
    try {
      const res = await apiFetch("/email-outreach/send", {
        method: "POST",
        body: JSON.stringify({
          leadId: emailPreview.leadId,
          to: emailPreview.to,
          from: emailPreview.from,
          subject: emailPreview.subject,
          body: emailPreview.body,
          previewLink: emailPreview.previewLink,
        }),
      });
      if (!res.ok) {
        set({ sendingLoading: false });
        return false;
      }
      set({ sendingLoading: false });
      return true;
    } catch {
      set({ sendingLoading: false });
      return false;
    }
  },

  sendBulkOutreach: async (leadIds, subject, body, previewLink) => {
    try {
      const res = await apiFetch("/email-outreach/send-bulk", {
        method: "POST",
        body: JSON.stringify({ leadIds, subject, body, previewLink }),
      });
      const data = await res.json();
      if (!res.ok) return { sent: 0, failed: leadIds.length };
      return { sent: data.sent ?? 0, failed: data.failed ?? 0 };
    } catch {
      return { sent: 0, failed: leadIds.length };
    }
  },

  fetchTracking: async (leadId) => {
    set({ trackingLoading: true });
    try {
      const res = await apiFetch(`/email-outreach/tracking/${leadId}`);
      const data = await res.json();
      if (!res.ok) {
        set({ trackingLoading: false });
        return;
      }
      const entries: TrackingEntry[] = Array.isArray(data.tracking)
        ? data.tracking
        : Array.isArray(data)
        ? data
        : [];
      set((state) => ({
        trackingLoading: false,
        trackingData: { ...state.trackingData, [leadId]: entries },
      }));
    } catch {
      set({ trackingLoading: false });
    }
  },

  fetchOutreachStats: async (startDate, endDate) => {
    set({ statsLoading: true });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await apiFetch(`/email-outreach/stats${query}`);
      const data = await res.json();
      if (!res.ok) {
        set({ statsLoading: false });
        return;
      }
      set({ statsLoading: false, outreachStats: data });
    } catch {
      set({ statsLoading: false });
    }
  },
}));
