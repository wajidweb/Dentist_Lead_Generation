import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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

interface SearchState {
  results: SearchResult | null;
  history: SearchHistoryItem[];
  loading: boolean;
  historyLoading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  results: null,
  history: [],
  loading: false,
  historyLoading: false,
  error: null,
};

export const searchDentists = createAsyncThunk(
  "search/dentists",
  async (
    params: { location: string; minRating?: number; minReviews?: number },
    { rejectWithValue }
  ) => {
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
      if (!res.ok) return rejectWithValue(data.message || "Search failed");
      return data as SearchResult;
    } catch {
      return rejectWithValue("Unable to connect to server");
    }
  }
);

export const fetchSearchHistory = createAsyncThunk(
  "search/history",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/search/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data.message || "Failed to fetch history");
      return data.searches as SearchHistoryItem[];
    } catch {
      return rejectWithValue("Unable to connect to server");
    }
  }
);

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    clearResults(state) {
      state.results = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchDentists.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.results = null;
      })
      .addCase(searchDentists.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(searchDentists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSearchHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchSearchHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchSearchHistory.rejected, (state) => {
        state.historyLoading = false;
      });
  },
});

export const { clearResults } = searchSlice.actions;
export default searchSlice.reducer;
