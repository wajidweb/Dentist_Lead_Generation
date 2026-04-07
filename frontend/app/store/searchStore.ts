import { create } from "zustand";
import { apiFetch } from "../lib/api";

interface Lead {
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
  status: string;
  createdAt: string;
}

interface SearchResult {
  searchId: string;
  location: string;
  totalFromGoogle: number;
  leadsCreated: number;
  skippedExisting: number;
  pagesSearched: number;
  totalLeadsForLocation: number;
  allExhausted: boolean;
  leads: Lead[];
}

interface SearchHistoryItem {
  _id: string;
  query: string;
  location: string;
  totalResultsFromGoogle: number;
  leadsCreated: number;
  searchedAt: string;
}

interface SearchStore {
  results: SearchResult | null;
  history: SearchHistoryItem[];
  loading: boolean;
  historyLoading: boolean;
  error: string | null;

  searchDentists: (params: {
    location: string;
    minRating?: number;
    minReviews?: number;
    targetLeads?: number;
  }) => Promise<void>;
  fetchSearchHistory: () => Promise<void>;
  deleteSearchHistory: (id: string) => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  results: null,
  history: [],
  loading: false,
  historyLoading: false,
  error: null,

  searchDentists: async (params) => {
    set({ loading: true, error: null, results: null });
    try {
      const res = await apiFetch("/search/dentists", {
        method: "POST",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ loading: false, error: data.message || "Search failed" });
        return;
      }
      set({ loading: false, results: data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to connect to server";
      set({ loading: false, error: msg });
    }
  },

  fetchSearchHistory: async () => {
    set({ historyLoading: true });
    try {
      const res = await apiFetch("/search/history");
      const data = await res.json();
      if (!res.ok) {
        set({ historyLoading: false });
        return;
      }
      set({ historyLoading: false, history: data.searches });
    } catch {
      set({ historyLoading: false });
    }
  },

  deleteSearchHistory: async (id) => {
    try {
      const res = await apiFetch(`/search/history/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      set((state) => ({
        history: state.history.filter((item) => item._id !== id),
      }));
    } catch {
      // silent fail
    }
  },

  clearResults: () => set({ results: null, error: null }),
}));
