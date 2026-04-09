"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Mail,
  MailOpen,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Users,
  Clock,
  ExternalLink,
  Zap,
  Trash2,
} from "lucide-react";
import { useCampaignStore, Campaign, CampaignLead } from "../../store/campaignStore";

const OUTREACH_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  sent: { label: "Sent", color: "#B89A4A", bg: "#B89A4A15" },
  opened: { label: "Opened", color: "#3D8B5E", bg: "#3D8B5E15" },
  replied: { label: "Replied", color: "#2A4A3A", bg: "#2A4A3A15" },
  bounced: { label: "Bounced", color: "#C75555", bg: "#C7555515" },
};

const CAMPAIGN_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "#8A9590", bg: "#8A959015" },
  active: { label: "Active", color: "#3D8B5E", bg: "#3D8B5E15" },
  paused: { label: "Paused", color: "#B89A4A", bg: "#B89A4A15" },
  completed: { label: "Completed", color: "#2A4A3A", bg: "#2A4A3A15" },
};

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-white border border-[#E8E2D8]">
      <span style={{ color }}>{icon}</span>
      <span className="text-[11px] text-[#6B7570]">{label}</span>
      <span className="text-xs font-bold text-[#1A2E22]">{value}</span>
    </div>
  );
}

function LeadRow({ lead }: { lead: CampaignLead }) {
  const statusCfg = OUTREACH_STATUS_CONFIG[lead.outreachStatus ?? ""] ?? {
    label: lead.outreachStatus ?? "—",
    color: "#8A9590",
    bg: "#8A959015",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF8F5] transition text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#1A2E22] truncate">
          {lead.businessName}
        </p>
        <p className="text-[11px] text-[#6B7570] truncate">
          {lead.email ?? "No email"} {lead.city && `· ${lead.city}`}
          {lead.state && `, ${lead.state}`}
        </p>
      </div>

      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
      >
        {statusCfg.label}
      </div>

      {lead.leadCategory && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs ${
            lead.leadCategory === "hot"
              ? "text-[#C75555] bg-[#C7555510]"
              : lead.leadCategory === "warm"
              ? "text-[#C47A4A] bg-[#C47A4A10]"
              : lead.leadCategory === "cool"
              ? "text-[#B89A4A] bg-[#B89A4A10]"
              : "text-[#8A9590] bg-[#8A959010]"
          }`}
        >
          {lead.leadCategory}
        </span>
      )}

      {lead.lastOutreachAt && (
        <span className="text-[11px] text-[#8A9590] flex items-center gap-1">
          <Clock size={10} />
          {new Date(lead.lastOutreachAt).toLocaleDateString()}
        </span>
      )}

      {lead.website && (
        <a
          href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3D8B5E] hover:text-[#2A4A3A] transition"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  onDelete,
  isDeleting,
}: {
  campaign: Campaign;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const statusCfg = CAMPAIGN_STATUS_CONFIG[campaign.status] ?? CAMPAIGN_STATUS_CONFIG.draft;

  const openRate =
    campaign.emailsSent > 0
      ? ((campaign.emailsOpened / campaign.emailsSent) * 100).toFixed(1)
      : "0";
  const replyRate =
    campaign.emailsSent > 0
      ? ((campaign.emailsReplied / campaign.emailsSent) * 100).toFixed(1)
      : "0";

  return (
    <div className="bg-white rounded-xs border border-[#E8E2D8] overflow-hidden">
      {/* Campaign Header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={16} className="text-[#3D8B5E]" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/dashboard/campaigns/${campaign._id}`}
                className="text-sm font-bold text-[#1A2E22] hover:text-[#3D8B5E] truncate block transition-colors"
                aria-label={`Open campaign details for ${campaign.name}`}
              >
                {campaign.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-[#6B7570]">
                  {campaign.sendingEmail}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-xs"
                  style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                >
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[#8A9590] whitespace-nowrap">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </span>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    onDelete();
                    setConfirmDelete(false);
                  }}
                  disabled={isDeleting}
                  className="px-2 py-1 rounded-xs text-[10px] font-semibold text-white bg-[#C75555] hover:bg-[#B04545] transition disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={10} className="animate-spin" /> : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded-xs text-[10px] font-medium text-[#6B7570] border border-[#D8D2C8] hover:bg-[#F5F1EB] transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-7 h-7 flex items-center justify-center rounded-xs text-[#8A9590] hover:text-[#C75555] hover:bg-[#C75555]/10 transition"
                title="Delete campaign"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <StatPill
            icon={<Mail size={12} />}
            label="Sent"
            value={campaign.emailsSent}
            color="#3D8B5E"
          />
          <StatPill
            icon={<MailOpen size={12} />}
            label="Opened"
            value={campaign.emailsOpened}
            color="#B89A4A"
          />
          <StatPill
            icon={<MessageSquare size={12} />}
            label="Replied"
            value={campaign.emailsReplied}
            color="#2A4A3A"
          />
          <StatPill
            icon={<AlertTriangle size={12} />}
            label="Bounced"
            value={campaign.emailsBounced}
            color="#C75555"
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-white border border-[#E8E2D8]">
            <Users size={12} className="text-[#6B7570]" />
            <span className="text-[11px] text-[#6B7570]">Leads</span>
            <span className="text-xs font-bold text-[#1A2E22]">
              {campaign.leadsCount}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-[11px] text-[#6B7570]">
            <span>
              Open rate:{" "}
              <span className="font-semibold text-[#1A2E22]">{openRate}%</span>
            </span>
            <span>
              Reply rate:{" "}
              <span className="font-semibold text-[#1A2E22]">{replyRate}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Leads */}
      {campaign.leads.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="w-full flex items-center justify-between px-5 py-2.5 bg-[#F5F1EB] hover:bg-[#EDE8E0] transition text-left border-t border-[#EDE8E0]"
          >
            <span className="text-[11px] font-semibold text-[#3D5347] uppercase tracking-wider">
              Contacted Leads ({campaign.leads.length})
            </span>
            {expanded ? (
              <ChevronUp size={14} className="text-[#6B7570]" />
            ) : (
              <ChevronDown size={14} className="text-[#6B7570]" />
            )}
          </button>

          {expanded && (
            <div className="divide-y divide-[#F0ECE4]">
              {campaign.leads.map((lead) => (
                <LeadRow key={lead._id} lead={lead} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  const { campaigns, loading, deletingId, fetchCampaigns, deleteCampaign } = useCampaignStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const totalSent = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.emailsOpened, 0);
  const totalReplied = campaigns.reduce((sum, c) => sum + c.emailsReplied, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A2E22]">Campaigns</h1>
          <p className="text-sm text-[#5A6B60] mt-1">
            Email outreach campaigns and their contacted leads
          </p>
        </div>
        <button
          onClick={fetchCampaigns}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Bar */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-xs border border-[#E8E2D8]">
          <span className="text-xs font-semibold text-[#6B7570] uppercase tracking-wider">
            All Campaigns
          </span>
          <div className="flex items-center gap-4 ml-auto text-sm">
            <span className="text-[#5A6B60]">
              Campaigns: <span className="font-bold text-[#1A2E22]">{campaigns.length}</span>
            </span>
            <span className="text-[#5A6B60]">
              Sent: <span className="font-bold text-[#1A2E22]">{totalSent}</span>
            </span>
            <span className="text-[#5A6B60]">
              Opened: <span className="font-bold text-[#1A2E22]">{totalOpened}</span>
            </span>
            <span className="text-[#5A6B60]">
              Replied: <span className="font-bold text-[#1A2E22]">{totalReplied}</span>
            </span>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      {loading && campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="text-[#3D8B5E] animate-spin" />
          <p className="text-sm text-[#6B7570]">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xs border border-[#E8E2D8]">
          <div className="w-14 h-14 rounded-full bg-[#F5F1EB] flex items-center justify-center">
            <Zap size={24} className="text-[#8A9590]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#1A2E22]">
              No campaigns yet
            </p>
            <p className="text-xs text-[#6B7570] mt-1 max-w-sm">
              Campaigns are created automatically when you send your first
              outreach email to a lead.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              isDeleting={deletingId === campaign._id}
              onDelete={async () => {
                const success = await deleteCampaign(campaign._id);
                if (success) {
                  toast.success("Campaign deleted successfully");
                } else {
                  toast.error("Failed to delete campaign");
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
