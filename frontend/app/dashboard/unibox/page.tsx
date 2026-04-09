"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
} from "lucide-react";
import { useUniboxStore, Email } from "../../store/uniboxStore";

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

// ─── Email List Item ──────────────────────────────────────────────────────────

function EmailListItem({
  email,
  isSelected,
  onClick,
}: {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isSent = email.email_type === "sent";
  const isUnread = (email.is_unread === true || email.is_read === false) && !isSent;
  const displayName = isSent
    ? email.to_address ?? "Unknown"
    : email.from_address ?? "Unknown";
  const dateStr =
    email.sent_at ?? email.timestamp_email ?? email.timestamp_created;
  const bodyPreview = email.body ? stripHtml(email.body) : "";

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 border-b border-[#EDE8E0]
        transition-colors duration-150
        ${isSelected
          ? "bg-[#3D8B5E]/5 border-l-2 border-l-[#3D8B5E]"
          : "bg-white hover:bg-[#FAF8F5] border-l-2 border-l-transparent"
        }
      `}
      aria-label={`Email from ${displayName}: ${email.subject ?? "No subject"}`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-2.5">
        {/* Unread dot */}
        <div className="mt-1.5 shrink-0 w-2 h-2">
          {isUnread && (
            <span className="block w-2 h-2 rounded-full bg-[#3D8B5E]" aria-label="Unread" />
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
              <Clock size={10} />
              {formatRelativeDate(dateStr)}
            </span>
          </div>

          <p
            className={`text-xs mt-0.5 truncate ${
              isUnread ? "font-semibold text-[#1A2E22]" : "text-[#5A6B60]"
            }`}
          >
            {email.subject ?? "(No subject)"}
          </p>

          <p className="text-[11px] text-[#8A9590] mt-0.5 truncate leading-relaxed">
            {bodyPreview || "(No preview)"}
          </p>

          {email.campaign_name && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-xs bg-[#3D8B5E]/10 text-[#2A4A3A] uppercase tracking-wide">
              {email.campaign_name}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Thread Message Bubble ────────────────────────────────────────────────────

function ThreadMessage({ email }: { email: Email }) {
  const isSent = email.email_type === "sent";
  const dateStr = email.sent_at ?? email.timestamp_email ?? email.timestamp_created;
  const address = isSent ? email.to_address : email.from_address;

  return (
    <div
      className={`rounded-sm border-l-2 px-4 py-3 ${
        isSent
          ? "bg-[#F5F1EB] border-l-[#3D8B5E]"
          : "bg-white border-l-[#B89A4A] border border-[#E8E2D8]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isSent ? "bg-[#3D8B5E] text-white" : "bg-[#B89A4A]/20 text-[#B89A4A]"
            }`}
          >
            {(address ?? "?").charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-[#1A2E22] truncate">
            {address ?? "Unknown"}
          </span>
          {isSent && (
            <span className="shrink-0 text-[10px] font-semibold text-[#3D8B5E] bg-[#3D8B5E]/10 px-1.5 py-0.5 rounded-xs uppercase tracking-wide">
              You
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-[#8A9590] flex items-center gap-1">
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
}: {
  email: Email;
  detailLoading: boolean;
  onBack: () => void;
}) {
  const { sendReply, replyLoading, thread, threadLoading } = useUniboxStore();
  const [replyBody, setReplyBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSent = email.email_type === "sent";
  const dateStr = email.sent_at ?? email.timestamp_email ?? email.timestamp_created;

  const handleSend = async () => {
    if (!replyBody.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    const replyToUuid = email.reply_to_uuid || email.uuid || email.id;
    const fromEmail = email.to_address
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

  // Decide what to show: if thread has > 1 message, show thread view
  const showThread = thread.length > 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#EDE8E0] bg-white">
        <button
          onClick={onBack}
          className="lg:hidden flex items-center gap-1.5 text-xs font-medium text-[#5A6B60] hover:text-[#1A2E22] transition"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-[#1A2E22] truncate flex items-center gap-1.5">
            {email.subject ?? "(No subject)"}
            {showThread && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#3D8B5E] bg-[#3D8B5E]/10 px-1.5 py-0.5 rounded-xs">
                <MessageSquare size={9} />
                {thread.length}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-[#8A9590] mt-0.5">
            {formatRelativeDate(dateStr)}
          </p>
        </div>
        {isSent ? (
          <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-[#B89A4A] bg-[#B89A4A]/10 px-2 py-0.5 rounded-xs uppercase tracking-wide">
            <Send size={10} />
            Sent
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-[#3D8B5E] bg-[#3D8B5E]/10 px-2 py-0.5 rounded-xs uppercase tracking-wide">
            <Mail size={10} />
            Received
          </span>
        )}
      </div>

      {/* Meta (only shown when not in thread mode) */}
      {!showThread && (
        <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[#EDE8E0] space-y-1 text-xs text-[#5A6B60]">
          <div>
            <span className="font-semibold text-[#8A9590]">From: </span>
            {email.from_address ?? "—"}
          </div>
          <div>
            <span className="font-semibold text-[#8A9590]">To: </span>
            {email.to_address ?? "—"}
          </div>
          {email.campaign_name && (
            <div>
              <span className="font-semibold text-[#8A9590]">Campaign: </span>
              {email.campaign_name}
            </div>
          )}
        </div>
      )}

      {/* Body / Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {(detailLoading || threadLoading) ? (
          <div className="flex items-center justify-center h-32 gap-3">
            <Loader2 size={20} className="animate-spin text-[#3D8B5E]" />
            <span className="text-sm text-[#5A6B60]">
              {threadLoading ? "Loading thread..." : "Loading email..."}
            </span>
          </div>
        ) : showThread ? (
          <div className="flex flex-col gap-3">
            {thread.map((msg) => (
              <ThreadMessage key={msg.id} email={msg} />
            ))}
          </div>
        ) : email.body ? (
          <div
            className="prose prose-sm max-w-none text-[#1A2E22] leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body ?? "") }}
            style={{
              fontFamily: "inherit",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          />
        ) : (
          <p className="text-sm text-[#8A9590] italic">(Empty email body)</p>
        )}
      </div>

      {/* Reply box — only for received emails */}
      {!isSent && (
        <div className="border-t border-[#EDE8E0] px-5 py-4 bg-white">
          <label
            htmlFor="reply-textarea"
            className="text-xs font-semibold text-[#5A6B60] uppercase tracking-wide flex items-center gap-1.5 mb-2"
          >
            <MessageSquare size={12} />
            Reply
          </label>
          <textarea
            id="reply-textarea"
            ref={textareaRef}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={4}
            placeholder="Type your reply..."
            className="w-full resize-none rounded-xs border border-[#DDD8D0] bg-[#FAF8F5] px-3 py-2.5 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-1 focus:ring-[#3D8B5E]/30 transition"
            aria-label="Reply message body"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSend}
              disabled={replyLoading || !replyBody.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xs text-sm font-semibold text-white bg-[#2A4A3A] hover:bg-[#1E3A2E] disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Send reply"
            >
              {replyLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {replyLoading ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyDetailState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-[#F5F1EB] flex items-center justify-center">
        <MailOpen size={28} className="text-[#B5AFA5]" />
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

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchEmails({ search: search || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, folder, search, mounted]);

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
    fetchEmails({ search: search || undefined });
    fetchUnreadCount();
    toast.success("Inbox refreshed");
  };

  const handleBack = () => {
    setShowDetail(false);
    selectEmail(null);
  };

  const handleLoadMore = () => {
    loadMore({ search: search || undefined });
  };

  const displayEmail: Email | null = selectedEmailDetails ?? selectedEmail;

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
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
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
          aria-label="Refresh inbox"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 rounded-xs border border-[#E8E2D8] overflow-hidden bg-white min-h-0" style={{ height: "calc(100vh - 200px)" }}>

        {/* Left: Folders + Filters */}
        <div className="w-40 shrink-0 border-r border-[#E8E2D8] bg-[#FAF8F5] flex flex-col py-3 px-2 gap-1">

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
                  flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors w-full text-left
                  border-b-2
                  ${folder === f
                    ? "border-b-[#3D8B5E] text-[#1A2E22] bg-white font-semibold"
                    : "border-b-transparent text-[#5A6B60] hover:bg-[#EDE8E0] hover:text-[#1A2E22]"
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
                flex items-center gap-2 px-3 py-2 rounded-xs text-sm font-medium transition-colors w-full text-left
                ${filter === opt.id
                  ? "bg-[#3D8B5E] text-white"
                  : "text-[#5A6B60] hover:bg-[#EDE8E0] hover:text-[#1A2E22]"
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
        </div>

        {/* Middle: Email list */}
        <div
          className={`
            flex flex-col border-r border-[#E8E2D8]
            ${showDetail ? "hidden lg:flex lg:w-80 xl:w-96" : "flex flex-1 lg:w-80 xl:w-96"}
            min-w-0
          `}
        >
          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 px-3 py-2.5 border-b border-[#EDE8E0]"
            role="search"
            aria-label="Search emails"
          >
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
                className="text-[#8A9590] hover:text-[#1A2E22] transition text-xs"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
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
                <div className="w-12 h-12 rounded-full bg-[#F5F1EB] flex items-center justify-center">
                  <Inbox size={20} className="text-[#B5AFA5]" />
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
                {emails.map((email) => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onClick={() => handleEmailClick(email)}
                  />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="px-4 py-3 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xs text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
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
                {emails.length} email{emails.length !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </p>
            </div>
          )}
        </div>

        {/* Right: Email detail */}
        <div
          className={`
            flex-1 flex flex-col min-w-0
            ${showDetail ? "flex" : "hidden lg:flex"}
          `}
        >
          {displayEmail ? (
            <EmailDetail
              email={displayEmail}
              detailLoading={detailLoading}
              onBack={handleBack}
            />
          ) : (
            <EmptyDetailState />
          )}
        </div>
      </div>
    </div>
  );
}
