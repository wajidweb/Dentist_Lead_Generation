import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

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

interface LeadsState {
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
}

const initialState: LeadsState = {
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
};

export const fetchLeads = createAsyncThunk(
  "leads/fetchAll",
  async (
    params: Record<string, string | number | undefined>,
    { rejectWithValue }
  ) => {
    const token = localStorage.getItem("token");
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v));
    });
    try {
      const res = await fetch(`${API_URL}/leads?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch leads");
      return data as {
        leads: Lead[];
        total: number;
        page: number;
        totalPages: number;
      };
    } catch {
      return rejectWithValue("Unable to connect to server");
    }
  }
);

export const fetchLeadDetail = createAsyncThunk(
  "leads/fetchDetail",
  async (id: string, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch lead");
      return data.lead as Lead;
    } catch {
      return rejectWithValue("Unable to connect to server");
    }
  }
);

export const updateLeadStatus = createAsyncThunk(
  "leads/updateStatus",
  async (
    { id, status }: { id: string; status: string },
    { rejectWithValue }
  ) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/leads/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to update status");
      return data.lead as Lead;
    } catch {
      return rejectWithValue("Unable to connect to server");
    }
  }
);

export const deleteLead = createAsyncThunk(
  "leads/delete",
  async (id: string, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        return rejectWithValue(data.message || "Failed to delete lead");
      }
      return id;
    } catch {
      return rejectWithValue("Unable to connect to server");
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  "leads/stats",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/leads/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message || "Failed to fetch stats");
      return data as DashboardStats;
    } catch {
      return rejectWithValue("Unable to connect to server");
    }
  }
);

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    clearCurrentLead(state) {
      state.currentLead = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leads
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload.leads;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch detail
      .addCase(fetchLeadDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchLeadDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentLead = action.payload;
      })
      .addCase(fetchLeadDetail.rejected, (state) => {
        state.detailLoading = false;
      })
      // Update status
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        const idx = state.leads.findIndex((l) => l._id === action.payload._id);
        if (idx !== -1) state.leads[idx] = action.payload;
        if (state.currentLead?._id === action.payload._id) {
          state.currentLead = action.payload;
        }
      })
      // Delete
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter((l) => l._id !== action.payload);
        state.total -= 1;
      })
      // Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state) => {
        state.statsLoading = false;
      });
  },
});

export const { clearCurrentLead } = leadsSlice.actions;
export default leadsSlice.reducer;
