"use client";

import { useEffect } from "react";
import { Mail, MailOpen, MessageSquare, AlertTriangle, Clock } from "lucide-react";
import { useEmailOutreachStore } from "../store/emailOutreachStore";

interface Props {
  leadId: string;
}

const STATUS_CONFIG = {
  sent: {
    label: "Sent",
    color: "#B89A4A",
    bg: "bg-[#B89A4A]/10",
    text: "text-[#B89A4A]",
    icon: Mail,
  },
  opened: {
    label: "Opened",
    color: "#3D8B5E",
    bg: "bg-[#3D8B5E]/10",
    text: "text-[#3D8B5E]",
    icon: MailOpen,
  },
  replied: {
    label: "Replied",
    color: "#2A4A3A",
    bg: "bg-[#2A4A3A]/10",
    text: "text-[#2A4A3A]",
    icon: MessageSquare,
  },
  bounced: {
    label: "Bounced",
    color: "#C75555",
    bg: "bg-[#C75555]/10",
    text: "text-[#C75555]",
    icon: AlertTriangle,
  },
} as const;

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function EmailTrackingTab({ leadId }: Props) {
  const { trackingData, trackingLoading, fetchTracking } =
    useEmailOutreachStore();

  useEffect(() => {
    if (leadId) fetchTracking(leadId);
    // fetchTracking is a stable Zustand action — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const entries = trackingData[leadId] ?? [];

  return (
    <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#EDE8E0] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1A2E22]">Email Outreach</h2>
        {entries.length > 0 && (
          <span className="text-[10px] font-semibold text-[#6B7570] bg-[#F5F1EB] px-2 py-0.5 rounded-xs">
            {entries.length} event{entries.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-4">
        {trackingLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-[#E8E2D8] shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-[#E8E2D8] rounded-xs" />
                  <div className="h-3 w-36 bg-[#F5F1EB] rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-10 h-10 rounded-full bg-[#F5F1EB] flex items-center justify-center">
              <Mail size={18} className="text-[#B5AFA5]" />
            </div>
            <p className="text-xs font-medium text-[#8A9590]">
              No outreach sent yet
            </p>
            <p className="text-[11px] text-[#B5AFA5] text-center">
              Send an outreach email to start tracking
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            {entries.length > 1 && (
              <div className="absolute left-3.5 top-7 bottom-2 w-px bg-[#EDE8E0]" />
            )}
            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const status =
                  STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.sent;
                const Icon = status.icon;
                return (
                  <div key={entry._id ?? idx} className="flex items-start gap-3 relative">
                    {/* Status icon bubble */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 relative z-10 ${status.bg}`}
                    >
                      <Icon size={13} className={status.text} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-[11px] font-semibold text-[#3D5347]">
                          Email {entry.sequenceStep ?? idx + 1}
                        </span>
                      </div>
                      {entry.subject && (
                        <p className="text-[12px] text-[#6B7570] mt-1 truncate">
                          {entry.subject}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-[#8A9590]">
                        <Clock size={10} />
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
