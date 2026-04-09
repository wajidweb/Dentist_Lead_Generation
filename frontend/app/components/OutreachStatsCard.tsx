"use client";

import { Mail, MailOpen, MessageSquare, AlertTriangle } from "lucide-react";
import { useEmailOutreachStore } from "../store/emailOutreachStore";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[#E8E2D8] rounded-xs animate-pulse ${className}`} />
  );
}

interface StatRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  subValue?: string;
  loading: boolean;
}

function StatRow({
  icon,
  iconBg,
  label,
  value,
  subValue,
  loading,
}: StatRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">
          {label}
        </p>
        {loading ? (
          <Skeleton className="w-16 h-5 mt-0.5" />
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#1A2E22] tabular-nums">
              {value}
            </span>
            {subValue && (
              <span className="text-[11px] text-[#8A9590]">{subValue}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function OutreachStatsCard() {
  const { outreachStats, statsLoading } = useEmailOutreachStore();

  const openRate = outreachStats
    ? `${(Number(outreachStats.openRate) || 0).toFixed(1)}%`
    : "0%";
  const replyRate = outreachStats
    ? `${(Number(outreachStats.replyRate) || 0).toFixed(1)}%`
    : "0%";

  return (
    <div className="bg-white rounded-xs p-5 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-[#1A2E22]">
            Email Outreach
          </h2>
          <p className="text-[11px] text-[#6B7570] mt-0.5">
            Instantly.ai campaign stats
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
          <Mail size={16} className="text-[#3D8B5E]" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="space-y-3">
        <StatRow
          icon={<Mail size={15} className="text-[#3D8B5E]" />}
          iconBg="bg-[#3D8B5E]/10"
          label="Total Sent"
          value={outreachStats?.totalSent ?? 0}
          loading={statsLoading}
        />
        <div className="h-px bg-[#F5F1EB]" />
        <StatRow
          icon={<MailOpen size={15} className="text-[#B89A4A]" />}
          iconBg="bg-[#B89A4A]/10"
          label="Open Rate"
          value={openRate}
          subValue={outreachStats ? `${outreachStats.opened} opened` : undefined}
          loading={statsLoading}
        />
        <div className="h-px bg-[#F5F1EB]" />
        <StatRow
          icon={<MessageSquare size={15} className="text-[#2A4A3A]" />}
          iconBg="bg-[#2A4A3A]/10"
          label="Reply Rate"
          value={replyRate}
          subValue={outreachStats ? `${outreachStats.replied} replied` : undefined}
          loading={statsLoading}
        />
        <div className="h-px bg-[#F5F1EB]" />
        <StatRow
          icon={<AlertTriangle size={15} className="text-[#C75555]" />}
          iconBg="bg-[#C75555]/10"
          label="Bounced"
          value={outreachStats?.bounced ?? 0}
          loading={statsLoading}
        />
      </div>
    </div>
  );
}
