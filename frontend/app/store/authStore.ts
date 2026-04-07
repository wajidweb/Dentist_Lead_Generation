import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface User {
  email: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  loginAdmin: (credentials: { email: string; password: string }) => Promise<boolean>;
  verifyToken: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: true,
  error: null,

  loginAdmin: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ loading: false, error: data.message || "Login failed" });
        return false;
      }
      localStorage.setItem("token", data.token);
      set({ loading: false, user: data.user, token: data.token });
      return true;
    } catch {
      set({ loading: false, error: "Unable to connect to server" });
      return false;
    }
  },

  verifyToken: async () => {
    set({ loading: true });
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false, user: null, token: null });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem("token");
        set({ loading: false, user: null, token: null });
        return;
      }
      const data = await res.json();
      set({ loading: false, user: data.user, token });
    } catch {
      localStorage.removeItem("token");
      set({ loading: false, user: null, token: null });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
