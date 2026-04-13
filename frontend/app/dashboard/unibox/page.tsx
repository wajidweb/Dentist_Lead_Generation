"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Inbox,
  Mail,
  MailOpen,
  Send,
  RefreshCw,
  Search,
  MessageSquare,
  Clock,
  Loader2,
  ArrowLeft,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useUniboxStore, Email } from "../../store/uniboxStore";
import { useCampaignStore } from "../../store/campaignStore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeHtml(html: unknown): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript\s*:/gi, "blocked:")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<object\b[^>]*>.*?<\/object>/gi, "");
}

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function stripHtml(html: unknown): string {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getAvatarProps(email: string): { initials: string; bgColor: string } {
  const colors = ['#2A4A3A', '#3D8B5E', '#5A7A6A', '#B89A4A', '#8A6B4A', '#4A7A8A'];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
  const bgColor = colors[Math.abs(hash) % colors.length];
  const initials = email.charAt(0).toUpperCase();
  return { initials, bgColor };
}

// ─── Email List Item ──────────────────────────────────────────────────────────

function EmailListItem({
  email,
  isSelected,
  onClick,
  threadCount,
  hasUnread,
  isSent,
}: {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
  threadCount?: number;
  hasUnread?: boolean;
  isSent: boolean;
}) {
  const isUnread = hasUnread ?? ((email.is_unread === true || email.is_read === false) && !isSent);
  const displayName = isSent
    ? email.to_address ?? "Unknown"
    : email.from_address ?? "Unknown";
  const dateStr =
    email.sent_at ?? email.timestamp_email ?? email.timestamp_created;
  const bodyPreview = email.body ? stripHtml(email.body) : "";
  const avatar = getAvatarProps(displayName);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left mx-2 my-0.5 rounded-lg px-3 py-3.5
        transition-all duration-150
        ${isSelected
          ? "bg-[#3D8B5E]/[0.08] shadow-sm ring-1 ring-[#3D8B5E]/20 border-l-[3px] border-l-[#3D8B5E]"
          : "hover:bg-[#FAF8F5] hover:shadow-sm border-l-[3px] border-l-transparent"
        }
      `}
      style={{ width: "calc(100% - 1rem)" }}
      aria-label={`Email from ${displayName}: ${email.subject ?? "No subject"}`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar with optional unread dot */}
        <div className="relative mt-0.5 shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: avatar.bgColor }}
          >
            {avatar.initials}
          </div>
          {isUnread && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#3D8B5E]"
              aria-label="Unread"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm truncate ${
                isUnread
                  ? "font-bold text-[#1A2E22]"
                  : "font-medium text-[#1A2E22]"
              }`}
            >
              {displayName}
            </span>
            <span className="text-[11px] text-[#8A9590] whitespace-nowrap flex items-center gap-1 shrink-0">
              {threadCount && threadCount > 1 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#3D8B5E]/10 text-[#2A4A3A] text-[10px] font-bold">
                  {threadCount}
                </span>
              )}
              <Clock size={10} />
              {formatRelativeDate(dateStr)}
            </span>
          </div>

          <p
            className={`text-[13px] mt-0.5 truncate ${
              isUnread ? "font-semibold text-[#1A2E22]" : "text-[#5A6B60]"
            }`}
          >
            {email.subject ?? "(No subject)"}
          </p>

          <p className="text-[11px] text-[#8A9590] mt-0.5 truncate leading-relaxed">
            {bodyPreview || "(No preview)"}
          </p>

          {email.campaign_name && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#3D8B5E]/10 text-[#2A4A3A] uppercase tracking-wide">
              {email.campaign_name}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Thread Message Bubble ────────────────────────────────────────────────────

function ThreadMessage({ email, isSent }: { email: Email; isSent: boolean }) {
  const dateStr = email.sent_at ?? email.timestamp_email ?? email.timestamp_created;
  const address = isSent ? email.from_address : email.from_address;
  const avatar = getAvatarProps(address ?? "?");

  return (
    <div
      className={`px-3 sm:px-5 py-3 sm:py-4 rounded-xl ${
        isSent
          ? "bg-[#2A4A3A]/[0.06] border-l-4 border-l-[#3D8B5E] border border-[#3D8B5E]/20 ml-4 sm:ml-12"
          : "bg-[#FBF9F6] border-l-4 border-l-[#C47A4A] border border-[#E8E2D8] mr-4 sm:mr-12 shadow-sm"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-white ${
              isSent ? "ring-2 ring-[#3D8B5E]/30" : "ring-2 ring-[#C47A4A]/30"
            }`}
            style={{ backgroundColor: isSent ? '#3D8B5E' : '#C47A4A' }}
          >
            {isSent ? (
              <Send size={12} />
            ) : (
              (address ?? "?").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[#1A2E22] truncate max-w-[140px] sm:max-w-none">
                {address ?? "Unknown"}
              </span>
              {isSent ? (
                <span className="shrink-0 text-[9px] sm:text-[10px] font-bold text-white bg-[#3D8B5E] px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Sent
                </span>
              ) : (
                <span className="shrink-0 text-[9px] sm:text-[10px] font-bold text-white bg-[#C47A4A] px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Received
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="hidden sm:flex shrink-0 text-[11px] text-[#8A9590] items-center gap-1">
          <Clock size={10} />
          {formatFullDate(dateStr)}
        </span>
      </div>
      {email.body ? (
        <div
          className="prose prose-sm max-w-none text-[#1A2E22] leading-relaxed text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body) }}
          style={{ fontFamily: "inherit", wordBreak: "break-word", overflowWrap: "break-word" }}
        />
      ) : (
        <p className="text-sm text-[#8A9590] italic">(Empty email body)</p>
      )}
    </div>
  );
}

// ─── Email Detail (with threading) ───────────────────────────────────────────

function EmailDetail({
  email,
  detailLoading,
  onBack,
  isSentByUser,
}: {
  email: Email;
  detailLoading: boolean;
  onBack: () => void;
  isSentByUser: (email: Email) => boolean;
}) {
  const { sendReply, replyLoading, thread, threadLoading } = useUniboxStore();
  const [replyBody, setReplyBody] = useState("");
  const [threadExpanded, setThreadExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSent = isSentByUser(email);
  const dateStr = email.sent_at ?? email.timestamp_email ?? email.timestamp_created;

  const handleSend = async () => {
    if (!replyBody.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    const replyToUuid = email.reply_to_uuid || email.uuid || email.id;
    const fromEmail = isSent
      ? email.from_address
      : email.to_address
      || (typeof window !== "undefined" ? localStorage.getItem("selectedSendingEmail") : null)
      || "";

    if (!fromEmail) {
      toast.error("No sending email configured. Set one in Settings.");
      return;
    }

    const subject = email.subject?.startsWith("Re:") ? email.subject : `Re: ${email.subject ?? ""}`;
    const ok = await sendReply(replyToUuid, fromEmail, subject, replyBody.trim());
    if (ok) {
      toast.success("Reply sent successfully");
      setReplyBody("");
    } else {
      toast.error("Failed to send reply. Please try again.");
    }
  };

  // Thread logic: latest message on top, older ones collapsible
  const hasThread = thread.length > 1;
  const latestMessage = hasThread ? thread[thread.length - 1] : null;
  const olderMessages = hasThread ? thread.slice(0, -1) : [];

  return (
    <div className="grid h-full" style={{ gridTemplateRows: "auto 1fr auto" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#EDE8E0] bg-white">
        {/* Back button row — mobile only */}
        <button
          onClick={onBack}
          className="md:hidden flex items-center gap-1.5 text-xs font-medium text-[#5A6B60] hover:text-[#1A2E22] transition mb-2"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Subject + badge row */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm sm:text-lg font-bold text-[#1A2E22] leading-snug line-clamp-2 min-w-0">
            {email.subject ?? "(No subject)"}
          </h2>
          <div className="shrink-0">
            {isSent ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#B89A4A] bg-[#B89A4A]/10 px-1.5 sm:px-2 py-0.5 rounded-lg uppercase tracking-wide whitespace-nowrap">
                <Send size={10} />
                Sent
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#3D8B5E] bg-[#3D8B5E]/10 px-1.5 sm:px-2 py-0.5 rounded-lg uppercase tracking-wide whitespace-nowrap">
                <Mail size={10} />
                Received
              </span>
            )}
          </div>
        </div>

        {/* From / To + date */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 mt-1.5 text-xs sm:text-sm text-[#5A6B60]">
          <div className="min-w-0">
            <p className="truncate">From: {(latestMessage ?? email).from_address ?? "—"}</p>
            <p className="truncate">To: {(latestMessage ?? email).to_address ?? "—"}</p>
          </div>
          <p className="hidden sm:block text-xs text-[#8A9590] shrink-0">
            {formatFullDate(dateStr)}
          </p>
        </div>
      </div>

      {/* Body / Thread */}
      <div className="overflow-y-auto min-h-0">
        {(detailLoading || threadLoading) ? (
          <div className="flex items-center justify-center h-32 gap-3">
            <Loader2 size={20} className="animate-spin text-[#3D8B5E]" />
            <span className="text-sm text-[#5A6B60]">
              {threadLoading ? "Loading thread..." : "Loading email..."}
            </span>
          </div>
        ) : (
          <>
            {/* Latest message */}
            <div className="px-3 sm:px-6 py-4 sm:py-5 border-b border-[#EDE8E0]">
              <ThreadMessage email={latestMessage ?? email} isSent={isSentByUser(latestMessage ?? email)} />
            </div>

            {/* Collapsible older thread messages */}
            {hasThread && olderMessages.length > 0 && (
              <div className="border-b border-[#EDE8E0]">
                <button
                  onClick={() => setThreadExpanded(!threadExpanded)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#8A9590] hover:text-[#5A6B60] transition-colors"
                  aria-expanded={threadExpanded}
                  aria-label={`${threadExpanded ? "Hide" : "Show"} ${olderMessages.length} more messages`}
                >
                  <div className="flex-1 h-px bg-[#EDE8E0]" />
                  <span className="flex items-center gap-1.5 px-3 shrink-0">
                    {olderMessages.length} more message{olderMessages.length !== 1 ? "s" : ""}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${threadExpanded ? "rotate-180" : ""}`}
                    />
                  </span>
                  <div className="flex-1 h-px bg-[#EDE8E0]" />
                </button>

                {threadExpanded && (
                  <div className="flex flex-col gap-4 px-3 sm:px-6 pb-5">
                    {olderMessages.map((msg) => (
                      <ThreadMessage key={msg.id} email={msg} isSent={isSentByUser(msg)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reply box — always visible at bottom */}
      <div className="border-t border-[#EDE8E0] px-4 py-3 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-end gap-2">
          <textarea
            id="reply-textarea"
            ref={textareaRef}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={1}
            placeholder="Type your reply..."
            className="flex-1 resize-none rounded-lg border border-[#DDD8D0] bg-[#FAF8F5] px-3 py-2 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 focus:bg-white transition max-h-32 overflow-y-auto"
            aria-label="Reply message body"
            style={{ minHeight: "38px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "38px";
              el.style.height = Math.min(el.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={replyLoading || !replyBody.trim()}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm hover:shadow-md text-sm font-semibold text-white bg-[#2A4A3A] hover:bg-[#1E3A2E] disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Send reply"
          >
            {replyLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {replyLoading ? (
              <span className="hidden sm:inline">Sending...</span>
            ) : (
              <span className="hidden sm:inline">Send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyDetailState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5F1EB] to-[#EDE8E0] border-2 border-dashed border-[#DDD8D0] flex items-center justify-center">
        <MailOpen size={32} className="text-[#B5AFA5]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1A2E22]">Select an email</p>
        <p className="text-xs text-[#8A9590] mt-1 max-w-xs">
          Choose an email from the list to read its contents and reply.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: {
  id: "all" | "unread" | "received" | "sent";
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "all", label: "All", icon: <Inbox size={14} /> },
  { id: "unread", label: "Unread", icon: <Mail size={14} /> },
  { id: "received", label: "Received", icon: <MailOpen size={14} /> },
  { id: "sent", label: "Sent", icon: <Send size={14} /> },
];

export default function UniboxPage() {
  const {
    emails,
    loading,
    hasMore,
    selectedEmail,
    selectedEmailDetails,
    detailLoading,
    unreadCount,
    filter,
    folder,
    fetchEmails,
    loadMore,
    fetchEmailDetail,
    fetchUnreadCount,
    fetchThread,
    markAsRead,
    setFilter,
    setFolder,
    selectEmail,
  } = useUniboxStore();

  const { campaigns, fetchCampaigns } = useCampaignStore();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  // Build a set of the user's sending emails to detect sent vs received
  const sendingEmails = useMemo(() => {
    const set = new Set<string>();
    for (const c of campaigns) {
      if (c.sendingEmail) set.add(c.sendingEmail.toLowerCase());
    }
    return set;
  }, [campaigns]);

  // Detect if an email was sent by the user (handles empty email_type from Instantly)
  const isSentByUser = useCallback((email: Email): boolean => {
    if (email.email_type === "sent") return true;
    if (email.email_type === "received") return false;
    // Fallback: check if from_address matches a sending email
    const from = (email.from_address ?? "").toLowerCase();
    return from !== "" && sendingEmails.has(from);
  }, [sendingEmails]);

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUnreadCount();
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchEmails({
        campaign_id: selectedCampaignId || undefined,
        search: search || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, folder, search, mounted, selectedCampaignId]);

  useEffect(() => {
    setSearchInput("");
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, folder]);

  const handleEmailClick = useCallback(
    async (email: Email) => {
      selectEmail(email);
      setShowDetail(true);
      fetchEmailDetail(email.id);
      fetchThread(email.id);
      if (email.is_unread || !email.is_read) {
        await markAsRead(email.id);
        fetchUnreadCount();
      }
    },
    [selectEmail, fetchEmailDetail, fetchThread, markAsRead, fetchUnreadCount]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleRefresh = () => {
    fetchEmails({ campaign_id: selectedCampaignId || undefined, search: search || undefined });
    fetchUnreadCount();
    toast.success("Inbox refreshed");
  };

  const handleBack = () => {
    setShowDetail(false);
    selectEmail(null);
  };

  const handleLoadMore = () => {
    loadMore({ campaign_id: selectedCampaignId || undefined, search: search || undefined });
  };

  const displayEmail: Email | null = selectedEmailDetails ?? selectedEmail;

  // Group emails into conversations by contact email
  const conversations = useMemo(() => {
    const groups = new Map<string, { latest: Email; count: number; hasUnread: boolean }>();

    for (const email of emails) {
      const sent = isSentByUser(email);
      const contactEmail = (sent ? email.to_address : email.from_address)?.toLowerCase() ?? "";

      if (!contactEmail) continue;

      const existing = groups.get(contactEmail);
      if (!existing) {
        groups.set(contactEmail, {
          latest: email,
          count: 1,
          hasUnread: !!(email.is_unread || email.is_read === false),
        });
      } else {
        existing.count++;
        if (email.is_unread || email.is_read === false) existing.hasUnread = true;
        const existingTime = new Date(existing.latest.sent_at ?? existing.latest.timestamp_email ?? 0).getTime();
        const emailTime = new Date(email.sent_at ?? email.timestamp_email ?? 0).getTime();
        if (emailTime > existingTime) {
          existing.latest = email;
        }
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      const aTime = new Date(a.latest.sent_at ?? a.latest.timestamp_email ?? 0).getTime();
      const bTime = new Date(b.latest.sent_at ?? b.latest.timestamp_email ?? 0).getTime();
      return bTime - aTime;
    });
  }, [emails, isSentByUser]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1A2E22] flex items-center gap-2">
            <Inbox size={20} className="text-[#3D8B5E]" />
            Unibox
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#3D8B5E] text-white text-[11px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-[#5A6B60] mt-0.5">
            Email conversations from your Instantly.ai campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all"
            aria-label="Show filters"
          >
            <Zap size={12} />
            Filters
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
            aria-label="Refresh inbox"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div
        className="flex flex-1 rounded-xl border border-[#E8E2D8] overflow-hidden bg-white shadow-lg shadow-black/5 min-h-0"
      >

        {/* Mobile sidebar backdrop */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Left: Folders + Filters */}
        <div
          className={`
            ${showSidebar ? "fixed inset-y-0 left-0 z-40 w-64 shadow-xl" : "hidden"}
            md:relative md:flex md:w-40 md:shadow-none md:inset-auto md:z-auto
            shrink-0 border-r border-[#E8E2D8] bg-[#FAF8F5] flex-col py-3 px-2 gap-1
          `}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex justify-end px-1 pb-1">
            <button
              onClick={() => setShowSidebar(false)}
              className="text-xs font-medium text-[#5A6B60] hover:text-[#1A2E22] px-2 py-1 rounded-md hover:bg-[#EDE8E0] transition"
              aria-label="Close filters"
            >
              Close
            </button>
          </div>

          {/* Folder tabs */}
          <p className="text-[10px] font-bold text-[#8A9590] uppercase tracking-widest px-2 pb-1">
            Folder
          </p>
          <div className="flex flex-col gap-0.5 mb-3">
            {(["primary", "others"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors w-full text-left rounded-md
                  ${folder === f
                    ? "bg-[#3D8B5E]/10 text-[#2A4A3A] font-semibold border-l-[3px] border-l-[#3D8B5E]"
                    : "text-[#8A9590] hover:bg-[#EDE8E0] hover:text-[#5A6B60] border-l-[3px] border-l-transparent"
                  }
                `}
                aria-pressed={folder === f}
                aria-label={`Folder: ${f === "primary" ? "Primary" : "Others"}`}
              >
                {f === "primary" ? <Mail size={13} /> : <Inbox size={13} />}
                <span className="flex-1 capitalize">{f === "primary" ? "Primary" : "Others"}</span>
              </button>
            ))}
          </div>

          {/* Filter pills */}
          <p className="text-[10px] font-bold text-[#8A9590] uppercase tracking-widest px-2 pb-1">
            Filter
          </p>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left
                ${filter === opt.id && opt.id !== "all"
                  ? "bg-[#3D8B5E] text-white"
                  : filter === opt.id && opt.id === "all"
                  ? "text-[#1A2E22] font-semibold"
                  : "text-[#8A9590] hover:bg-[#EDE8E0] hover:text-[#5A6B60]"
                }
              `}
              aria-pressed={filter === opt.id}
              aria-label={`Filter: ${opt.label}`}
            >
              <span className="shrink-0">{opt.icon}</span>
              <span className="flex-1">{opt.label}</span>
              {opt.id === "unread" && unreadCount > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                    ${filter === "unread" ? "bg-white/30 text-white" : "bg-[#3D8B5E] text-white"}
                  `}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}

          {/* Campaign filter */}
          <p className="text-[10px] font-bold text-[#8A9590] uppercase tracking-widest px-2 pb-1 mt-3">
            Campaign
          </p>
          <div className="px-1">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDD8D0] rounded-md px-2 py-2 text-[#1A2E22] focus:outline-none focus:ring-1 focus:ring-[#3D8B5E] appearance-none cursor-pointer"
              aria-label="Filter by campaign"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c.instantlyCampaignId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Middle: Email list */}
        <div
          className={`
            flex flex-col border-r border-[#E8E2D8]
            ${showDetail ? "hidden md:flex md:w-72 lg:w-80 xl:w-96" : "flex flex-1 md:w-72 lg:w-80 xl:w-96"}
            min-w-0
          `}
        >
          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-3 my-2.5"
            role="search"
            aria-label="Search emails"
          >
            <div className="group flex items-center gap-2 px-3 py-2 bg-[#FAF8F5] rounded-lg border border-[#DDD8D0] focus-within:border-[#3D8B5E] focus-within:ring-2 focus-within:ring-[#3D8B5E]/15 focus-within:bg-white transition-all">
              <Search size={14} className="text-[#8A9590] shrink-0" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchInput);
                  }
                }}
                placeholder="Search emails..."
                className="flex-1 text-sm bg-transparent border-none outline-none text-[#1A2E22] placeholder-[#B5AFA5]"
                aria-label="Type to search emails"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="text-[#8A9590] hover:text-[#1A2E22] transition text-xs rounded-full bg-[#EDE8E0] hover:bg-[#DDD8D0] px-2 py-0.5"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={20} className="animate-spin text-[#3D8B5E]" />
                <p className="text-xs text-[#8A9590]">Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5F1EB] to-[#EDE8E0] border-2 border-dashed border-[#DDD8D0] flex items-center justify-center">
                  <Inbox size={32} className="text-[#B5AFA5]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A2E22]">
                    {search ? "No results found" : "No emails"}
                  </p>
                  <p className="text-xs text-[#8A9590] mt-1">
                    {search
                      ? `No emails match "${search}"`
                      : filter === "unread"
                      ? "All emails have been read"
                      : folder === "others"
                      ? "No auto-replies or bounces in this folder"
                      : "Emails from your campaigns will appear here"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {conversations.map((convo) => (
                  <EmailListItem
                    key={convo.latest.id}
                    email={convo.latest}
                    isSelected={selectedEmail?.id === convo.latest.id}
                    onClick={() => handleEmailClick(convo.latest)}
                    threadCount={convo.count}
                    hasUnread={convo.hasUnread}
                    isSent={isSentByUser(convo.latest)}
                  />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="px-4 py-3 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
                      aria-label="Load more emails"
                    >
                      {loading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer count */}
          {emails.length > 0 && (
            <div className="px-4 py-2 border-t border-[#EDE8E0] bg-[#FAF8F5]">
              <p className="text-[11px] text-[#8A9590]">
                {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </p>
            </div>
          )}
        </div>

        {/* Right: Email detail */}
        <div
          className={`
            flex-1 flex flex-col min-w-0 overflow-hidden
            ${showDetail ? "flex" : "hidden md:flex"}
          `}
        >
          {displayEmail ? (
            <EmailDetail
              email={displayEmail}
              detailLoading={detailLoading}
              onBack={handleBack}
              isSentByUser={isSentByUser}
            />
          ) : (
            <EmptyDetailState />
          )}
        </div>
      </div>
    </div>
  );
}
