import { create } from "zustand";
import { apiFetch } from "../lib/api";

export interface EmailAccount {
  email: string;
  first_name?: string;
  last_name?: string;
  status?: number;
  warmup_status?: number;
}

interface SettingsStore {
  emailAccounts: EmailAccount[];
  loading: boolean;
  selectedSendingEmail: string | null;

  fetchEmailAccounts: () => Promise<void>;
  setSelectedSendingEmail: (email: string) => void;
  deleteEmailAccount: (email: string) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  emailAccounts: [],
  loading: false,
  selectedSendingEmail:
    typeof window !== "undefined"
      ? localStorage.getItem("selectedSendingEmail")
      : null,

  fetchEmailAccounts: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch("/settings/email-accounts");
      if (!res.ok) {
        set({ loading: false });
        return;
      }
      const data = await res.json();
      set({ emailAccounts: data.accounts ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setSelectedSendingEmail: (email: string) => {
    set({ selectedSendingEmail: email });
    localStorage.setItem("selectedSendingEmail", email);
  },

  deleteEmailAccount: async (email: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/settings/email-accounts/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (!res.ok) return false;

      set((state) => {
        const updatedAccounts = state.emailAccounts.filter(
          (a) => a.email !== email
        );
        const wasSelected = state.selectedSendingEmail === email;
        if (wasSelected) {
          localStorage.removeItem("selectedSendingEmail");
        }
        return {
          emailAccounts: updatedAccounts,
          selectedSendingEmail: wasSelected ? null : state.selectedSendingEmail,
        };
      });
      return true;
    } catch {
      return false;
    }
  },
}));
