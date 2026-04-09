import { create } from "zustand";
import { apiFetch } from "../lib/api";

export interface Email {
  id: string;
  uuid?: string;
  timestamp_created?: string;
  timestamp_email?: string;
  sent_at?: string;
  from_address?: string;
  to_address?: string;
  subject?: string;
  body?: string;
  is_read?: boolean;
  is_unread?: boolean;
  is_reply?: boolean;
  reply_to_uuid?: string;
  thread_id?: string;
  campaign_id?: string;
  lead_email?: string;
  email_type?: string;
  campaign_name?: string;
  tags?: string[];
}

interface UniboxStore {
  emails: Email[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  selectedEmail: Email | null;
  selectedEmailDetails: Email | null;
  detailLoading: boolean;
  unreadCount: number;
  replyLoading: boolean;
  filter: "all" | "unread" | "received" | "sent";
  folder: "primary" | "others";
  thread: Email[];
  threadLoading: boolean;

  fetchEmails: (params?: {
    campaign_id?: string;
    search?: string;
    skip?: number;
    append?: boolean;
  }) => Promise<void>;
  loadMore: (params?: { campaign_id?: string; search?: string }) => Promise<void>;
  fetchEmailDetail: (emailId: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchThread: (emailId: string) => Promise<void>;
  sendReply: (
    replyToUuid: string,
    fromEmail: string,
    subject: string,
    body: string
  ) => Promise<boolean>;
  markAsRead: (emailId: string) => Promise<void>;
  setFilter: (filter: "all" | "unread" | "received" | "sent") => void;
  setFolder: (folder: "primary" | "others") => void;
  selectEmail: (email: Email | null) => void;
}

export const useUniboxStore = create<UniboxStore>((set, get) => ({
  emails: [],
  total: 0,
  loading: false,
  hasMore: false,
  selectedEmail: null,
  selectedEmailDetails: null,
  detailLoading: false,
  unreadCount: 0,
  replyLoading: false,
  filter: "all",
  folder: "primary",
  thread: [],
  threadLoading: false,

  fetchEmails: async (params) => {
    set({ loading: true });
    const { filter, folder, emails: currentEmails } = get();
    const query = new URLSearchParams();

    // Folder param
    query.set("folder", folder);

    // Filter within folder
    if (filter === "unread") query.set("is_read", "false");
    if (filter === "received") query.set("email_type", "received");
    if (filter === "sent") query.set("email_type", "sent");

    if (params?.campaign_id) query.set("campaign_id", params.campaign_id);
    if (params?.search) query.set("search", params.search);
    if (params?.skip !== undefined) query.set("skip", String(params.skip));

    try {
      const res = await apiFetch(`/unibox/emails?${query}`);
      const data = await res.json();
      if (!res.ok) {
        set({ loading: false });
        return;
      }
      const fetchedEmails: Email[] = data.emails ?? data;
      const total: number = data.total ?? fetchedEmails.length;
      const skip = params?.skip ?? 0;

      if (params?.append) {
        const merged = [...currentEmails, ...fetchedEmails];
        set({
          loading: false,
          emails: merged,
          total,
          hasMore: merged.length < total,
        });
      } else {
        set({
          loading: false,
          emails: fetchedEmails,
          total,
          hasMore: fetchedEmails.length < total,
        });
      }
    } catch {
      set({ loading: false });
    }
  },

  loadMore: async (params) => {
    const { emails, loading } = get();
    if (loading) return;
    await get().fetchEmails({
      ...params,
      skip: emails.length,
      append: true,
    });
  },

  fetchEmailDetail: async (emailId) => {
    set({ detailLoading: true });
    try {
      const res = await apiFetch(`/unibox/emails/${emailId}`);
      const data = await res.json();
      if (!res.ok) {
        set({ detailLoading: false });
        return;
      }
      set({ detailLoading: false, selectedEmailDetails: data.email ?? data });
    } catch {
      set({ detailLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await apiFetch("/unibox/emails/unread-count");
      const data = await res.json();
      if (!res.ok) return;
      set({ unreadCount: data.count ?? 0 });
    } catch {
      // silent fail
    }
  },

  fetchThread: async (emailId) => {
    set({ threadLoading: true, thread: [] });
    try {
      const res = await apiFetch(`/unibox/emails/${emailId}/thread`);
      const data = await res.json();
      if (!res.ok) {
        set({ threadLoading: false });
        return;
      }
      set({ threadLoading: false, thread: data.thread ?? [] });
    } catch {
      set({ threadLoading: false });
    }
  },

  sendReply: async (replyToUuid, fromEmail, subject, body) => {
    set({ replyLoading: true });
    try {
      const res = await apiFetch("/unibox/emails/reply", {
        method: "POST",
        body: JSON.stringify({
          reply_to_uuid: replyToUuid,
          from_email: fromEmail,
          subject,
          body,
        }),
      });
      set({ replyLoading: false });
      return res.ok;
    } catch {
      set({ replyLoading: false });
      return false;
    }
  },

  markAsRead: async (emailId) => {
    try {
      const res = await apiFetch(`/unibox/emails/${emailId}/read`, {
        method: "PATCH",
      });
      if (!res.ok) return;
      const { emails } = get();
      const email = emails.find(e => e.id === emailId);
      if (email && (email.is_unread || !email.is_read)) {
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
      }
      set({
        emails: emails.map((e) =>
          e.id === emailId ? { ...e, is_read: true, is_unread: false } : e
        ),
      });
    } catch {
      // silent fail
    }
  },

  setFilter: (filter) => {
    set({ filter, selectedEmail: null, selectedEmailDetails: null, thread: [] });
  },

  setFolder: (folder) => {
    set({
      folder,
      selectedEmail: null,
      selectedEmailDetails: null,
      thread: [],
      emails: [],
      total: 0,
      hasMore: false,
    });
  },

  selectEmail: (email) => {
    set({ selectedEmail: email, selectedEmailDetails: null, thread: [] });
  },
}));
