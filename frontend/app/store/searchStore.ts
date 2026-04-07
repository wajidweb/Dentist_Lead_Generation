import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

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
  }) => Promise<void>;
  fetchSearchHistory: () => Promise<void>;
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
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/search/dentists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ loading: false, error: data.message || "Search failed" });
        return;
      }
      set({ loading: false, results: data });
    } catch {
      set({ loading: false, error: "Unable to connect to server" });
    }
  },

  fetchSearchHistory: async () => {
    set({ historyLoading: true });
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/search/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  clearResults: () => set({ results: null, error: null }),
}));
