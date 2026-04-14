import { create } from "zustand";
import { useLeadsStore } from "./leadsStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function hunterFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${API_URL}/hunter${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export interface HunterQuota {
  searches: { used: number; available: number };
  verifications: { used: number; available: number };
  plan: string;
}

interface HunterStore {
  /** Per-lead loading state keyed by leadId. Use "bulk" key for bulk search. */
  searching: Record<string, boolean>;
  verifying: boolean;
  quota: HunterQuota | null;
  quotaLoading: boolean;
  error: string | null;

  isSearching: (leadId: string) => boolean;
  isBulkSearching: () => boolean;
  searchDecisionMakers: (leadId: string) => Promise<{ success: boolean; personalCount: number; genericCount: number } | null>;
  findEmail: (leadId: string, firstName: string, lastName: string) => Promise<{ success: boolean; personalCount: number; genericCount: number } | null>;
  verifyEmail: (leadId: string, email: string) => Promise<boolean>;
  bulkSearch: (leadIds: string[]) => Promise<{ results: Array<{ leadId: string; added: number; error?: string }> } | null>;
  fetchQuota: () => Promise<void>;
  clearError: () => void;
}

export const useHunterStore = create<HunterStore>((set, get) => ({
  searching: {},
  verifying: false,
  quota: null,
  quotaLoading: false,
  error: null,

  isSearching: (leadId) => !!get().searching[leadId],
  isBulkSearching: () => !!get().searching["bulk"],

  searchDecisionMakers: async (leadId) => {
    set((s) => ({ searching: { ...s.searching, [leadId]: true }, error: null }));
    try {
      const res = await hunterFetch(`/leads/${leadId}/search`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        set((s) => ({ searching: { ...s.searching, [leadId]: false }, error: data.message || "Search failed" }));
        return null;
      }
      set((s) => ({ searching: { ...s.searching, [leadId]: false } }));
      await useLeadsStore.getState().fetchLeadDetail(leadId);
      const dms = useLeadsStore.getState().currentLead?.decisionMakers ?? [];
      const personalCount = dms.filter((d) => !d.isGeneric).length;
      const genericCount = dms.filter((d) => d.isGeneric).length;
      return { success: true, personalCount, genericCount };
    } catch {
      set((s) => ({ searching: { ...s.searching, [leadId]: false }, error: "Unable to connect to server" }));
      return null;
    }
  },

  findEmail: async (leadId, firstName, lastName) => {
    set((s) => ({ searching: { ...s.searching, [leadId]: true }, error: null }));
    try {
      const res = await hunterFetch(`/leads/${leadId}/find-email`, {
        method: "POST",
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) {
        set((s) => ({ searching: { ...s.searching, [leadId]: false }, error: data.message || "Email finder failed" }));
        return null;
      }
      set((s) => ({ searching: { ...s.searching, [leadId]: false } }));
      await useLeadsStore.getState().fetchLeadDetail(leadId);
      const dms = useLeadsStore.getState().currentLead?.decisionMakers ?? [];
      const personalCount = dms.filter((d) => !d.isGeneric).length;
      const genericCount = dms.filter((d) => d.isGeneric).length;
      return { success: true, personalCount, genericCount };
    } catch {
      set((s) => ({ searching: { ...s.searching, [leadId]: false }, error: "Unable to connect to server" }));
      return null;
    }
  },

  verifyEmail: async (leadId, email) => {
    set({ verifying: true, error: null });
    try {
      const res = await hunterFetch(`/leads/${leadId}/verify`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ verifying: false, error: data.message || "Verification failed" });
        return false;
      }
      set({ verifying: false });
      await useLeadsStore.getState().fetchLeadDetail(leadId);
      return true;
    } catch {
      set({ verifying: false, error: "Unable to connect to server" });
      return false;
    }
  },

  bulkSearch: async (leadIds) => {
    set((s) => ({ searching: { ...s.searching, bulk: true }, error: null }));
    try {
      const res = await hunterFetch("/bulk-search", {
        method: "POST",
        body: JSON.stringify({ ids: leadIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        set((s) => ({ searching: { ...s.searching, bulk: false }, error: data.message || "Bulk search failed" }));
        return null;
      }
      set((s) => ({ searching: { ...s.searching, bulk: false } }));
      return data as { results: Array<{ leadId: string; added: number; error?: string }> };
    } catch {
      set((s) => ({ searching: { ...s.searching, bulk: false }, error: "Unable to connect to server" }));
      return null;
    }
  },

  fetchQuota: async () => {
    set({ quotaLoading: true });
    try {
      const res = await hunterFetch("/quota");
      const data = await res.json();
      if (!res.ok) {
        set({ quotaLoading: false });
        return;
      }
      set({ quotaLoading: false, quota: data as HunterQuota });
    } catch {
      set({ quotaLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
