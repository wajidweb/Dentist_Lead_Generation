"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Mail,
  MailOpen,
  MessageSquare,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Pause,
  Play,
  Users,
  Calendar,
  List,
  BarChart3,
  Clock,
  ExternalLink,
  Save,
  CheckSquare,
  Square,
  Settings2,
  Eye,
  Link2,
} from "lucide-react";
import {
  useCampaignStore,
  CampaignDetails,
  SequenceStep,
  CampaignSchedule,
  CampaignAnalytics,
} from "../../../store/campaignStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OUTREACH_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  not_contacted: { label: "Not Contacted", color: "#8A9590", bg: "#8A959015" },
  sent:          { label: "Sent",          color: "#B89A4A", bg: "#B89A4A15" },
  opened:        { label: "Opened",        color: "#3D8B5E", bg: "#3D8B5E15" },
  replied:       { label: "Replied",       color: "#2A4A3A", bg: "#2A4A3A15" },
  bounced:       { label: "Bounced",       color: "#C75555", bg: "#C7555515" },
};

const CAMPAIGN_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",     color: "#8A9590", bg: "#8A959015" },
  active:    { label: "Active",    color: "#3D8B5E", bg: "#3D8B5E15" },
  paused:    { label: "Paused",    color: "#B89A4A", bg: "#B89A4A15" },
  completed: { label: "Completed", color: "#2A4A3A", bg: "#2A4A3A15" },
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildTimeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      opts.push(`${hh}:${mm}`);
    }
  }
  return opts;
}
const TIME_OPTIONS = buildTimeOptions();

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-[#3D8B5E] text-[#2A4A3A]"
          : "border-transparent text-[#5A6B60] hover:text-[#1A2E22] hover:border-[#D8D2C8]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Leads
// ---------------------------------------------------------------------------

function LeadsTab({
  details,
  campaignId,
}: {
  details: CampaignDetails;
  campaignId: string;
}) {
  const { syncStatuses, syncingStatuses, fetchCampaignDetails } = useCampaignStore();

  const handleSync = async () => {
    const ok = await syncStatuses(campaignId);
    if (ok) {
      toast.success("Statuses synced from Instantly");
      await fetchCampaignDetails(campaignId);
    } else {
      toast.error("Failed to sync statuses");
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-[#E8E2D8] bg-[#FDFCFA]">
        <span className="text-xs font-semibold text-[#5A6B60] uppercase tracking-wider">
          {(details.leads ?? []).length} lead{(details.leads ?? []).length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={handleSync}
          disabled={syncingStatuses}
          aria-label="Sync statuses from Instantly"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={syncingStatuses ? "animate-spin" : ""} />
          {syncingStatuses ? "Syncing…" : "Sync Statuses"}
        </button>
      </div>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[1fr_140px_120px_100px] gap-3 px-5 py-2 bg-[#F5F1EB] border-b border-[#E8E2D8] text-[10px] font-semibold text-[#8A9590] uppercase tracking-wider">
        <span>Business / Email</span>
        <span>Status</span>
        <span>Last Outreach</span>
        <span>Links</span>
      </div>

      {(details.leads ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <Users size={28} className="text-[#C8C2B8]" />
          <p className="text-sm text-[#8A9590]">No leads in this campaign yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F0ECE4]">
          {(details.leads ?? []).map((lead) => {
            const statusKey = lead.outreachStatus ?? "not_contacted";
            const statusCfg = OUTREACH_STATUS_CONFIG[statusKey] ?? {
              label: statusKey,
              color: "#8A9590",
              bg: "#8A959015",
            };
            return (
              <div
                key={lead._id}
                className="flex flex-wrap gap-2 items-center px-4 py-3 hover:bg-[#FAF8F5] transition text-sm sm:grid sm:grid-cols-[1fr_140px_120px_100px] sm:gap-3 sm:px-5"
              >
                {/* Business / email */}
                <div className="min-w-0 w-full sm:w-auto">
                  <p className="font-medium text-[#1A2E22] truncate">{lead.businessName}</p>
                  <p className="text-[11px] text-[#8A9590] truncate">{lead.email ?? "—"}</p>
                </div>

                {/* Status badge */}
                <div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                {/* Last outreach */}
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8A9590]">
                  {lead.lastOutreachAt ? (
                    <>
                      <Clock size={10} />
                      {new Date(lead.lastOutreachAt).toLocaleDateString()}
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </div>

                {/* Links */}
                <div className="hidden sm:flex items-center gap-2">
                  {lead.website && (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${lead.businessName} website`}
                      className="text-[#3D8B5E] hover:text-[#2A4A3A] transition"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Schedule
// ---------------------------------------------------------------------------

function ScheduleTab({
  details,
  campaignId,
}: {
  details: CampaignDetails;
  campaignId: string;
}) {
  const { updateSchedule, savingSchedule } = useCampaignStore();

  const initialDays = details.schedule?.days ?? ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const initialFrom = details.schedule?.from ?? "08:00";
  const initialTo   = details.schedule?.to   ?? "17:00";

  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays);
  const [fromTime, setFromTime]         = useState(initialFrom);
  const [toTime, setToTime]             = useState(initialTo);

  useEffect(() => {
    setSelectedDays(details.schedule?.days ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]);
    setFromTime(details.schedule?.from ?? "08:00");
    setToTime(details.schedule?.to ?? "17:00");
  }, [details.schedule]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      toast.error("Select at least one sending day");
      return;
    }
    const schedule: CampaignSchedule = {
      days: selectedDays,
      from: fromTime,
      to: toTime,
      timezone: "America/Chicago",
    };
    const ok = await updateSchedule(campaignId, schedule);
    if (ok) {
      toast.success("Schedule saved");
    } else {
      toast.error("Failed to save schedule");
    }
  };

  return (
    <div className="px-6 py-6 max-w-xl">
      <h2 className="text-sm font-bold text-[#1A2E22] mb-5">Sending Schedule</h2>

      {/* Days */}
      <fieldset className="mb-6">
        <legend className="text-xs font-semibold text-[#5A6B60] uppercase tracking-wider mb-3">
          Active Days
        </legend>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const active = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={active}
                className={`px-3 py-2 rounded-xs text-xs font-semibold border transition-all ${
                  active
                    ? "bg-[#2A4A3A] text-white border-[#2A4A3A]"
                    : "bg-white text-[#5A6B60] border-[#D8D2C8] hover:border-[#3D8B5E] hover:text-[#2A4A3A]"
                }`}
              >
                {active ? (
                  <span className="flex items-center gap-1">
                    <CheckSquare size={11} /> {day}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Square size={11} /> {day}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Time range */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="from-time" className="block text-xs font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">
            From
          </label>
          <select
            id="from-time"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#DDD8D0] rounded-xs bg-[#FAF8F5] text-[#1A2E22] focus:outline-none focus:ring-2 focus:ring-[#3D8B5E]/40 focus:border-[#3D8B5E]"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="to-time" className="block text-xs font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">
            To
          </label>
          <select
            id="to-time"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#DDD8D0] rounded-xs bg-[#FAF8F5] text-[#1A2E22] focus:outline-none focus:ring-2 focus:ring-[#3D8B5E]/40 focus:border-[#3D8B5E]"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timezone (fixed) */}
      <div className="mb-8 flex items-center gap-2 text-xs text-[#8A9590] bg-[#F5F1EB] px-3 py-2 rounded-xs border border-[#E8E2D8]">
        <Clock size={12} />
        Timezone: <span className="font-semibold text-[#5A6B60]">America/Chicago (Central Time)</span>
      </div>

      <button
        onClick={handleSave}
        disabled={savingSchedule}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xs text-sm font-semibold text-white bg-[#2A4A3A] hover:bg-[#1E3A2E] transition disabled:opacity-50"
      >
        {savingSchedule ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {savingSchedule ? "Saving…" : "Save Schedule"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Sequences
// ---------------------------------------------------------------------------

function SequencesTab({
  details,
  campaignId,
}: {
  details: CampaignDetails;
  campaignId: string;
}) {
  const { updateSequences, savingSequences } = useCampaignStore();

  const defaultSequences: SequenceStep[] = details.sequences?.length
    ? details.sequences
    : [
        { step: 1, delay: 0,  subject: "", body: "" },
        { step: 2, delay: 3,  subject: "", body: "" },
        { step: 3, delay: 7,  subject: "", body: "" },
      ];

  const [sequences, setSequences] = useState<SequenceStep[]>(defaultSequences);

  useEffect(() => {
    if (details.sequences?.length) {
      setSequences(details.sequences);
    }
  }, [details.sequences]);

  const updateStep = (index: number, field: keyof SequenceStep, value: string | number) => {
    setSequences((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    const ok = await updateSequences(campaignId, sequences);
    if (ok) {
      toast.success("Sequences saved");
    } else {
      toast.error("Failed to save sequences");
    }
  };

  return (
    <div className="px-6 py-6 max-w-2xl">
      <h2 className="text-sm font-bold text-[#1A2E22] mb-5">Email Sequences</h2>

      <div className="space-y-5">
        {sequences.map((step, i) => (
          <div
            key={step.step}
            className="bg-white border border-[#E8E2D8] rounded-xs overflow-hidden"
          >
            {/* Step header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F1EB] border-b border-[#E8E2D8]">
              <span className="w-6 h-6 rounded-full bg-[#2A4A3A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {step.step}
              </span>
              <span className="text-xs font-semibold text-[#2A4A3A]">
                Step {step.step}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-[#8A9590]">
                <Clock size={11} />
                {i === 0 ? (
                  "Sent immediately"
                ) : (
                  <span className="flex items-center gap-1">
                    Delay:
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={step.delay}
                      onChange={(e) => updateStep(i, "delay", parseInt(e.target.value, 10) || 0)}
                      aria-label={`Delay days for step ${step.step}`}
                      className="w-12 px-1.5 py-0.5 text-xs border border-[#DDD8D0] rounded-xs bg-white text-[#1A2E22] focus:outline-none focus:ring-1 focus:ring-[#3D8B5E]/40"
                    />
                    days after step {step.step - 1}
                  </span>
                )}
              </span>
            </div>

            {/* Step body */}
            <div className="px-4 py-4 space-y-3">
              <div>
                <label
                  htmlFor={`step-${step.step}-subject`}
                  className="block text-xs font-semibold text-[#5A6B60] mb-1.5"
                >
                  Subject
                </label>
                <input
                  id={`step-${step.step}-subject`}
                  type="text"
                  value={step.subject}
                  onChange={(e) => updateStep(i, "subject", e.target.value)}
                  placeholder="Email subject line…"
                  className="w-full px-3 py-2 text-sm border border-[#DDD8D0] rounded-xs bg-[#FAF8F5] text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:ring-2 focus:ring-[#3D8B5E]/40 focus:border-[#3D8B5E]"
                />
              </div>

              <div>
                <label
                  htmlFor={`step-${step.step}-body`}
                  className="block text-xs font-semibold text-[#5A6B60] mb-1.5"
                >
                  Body
                </label>
                <textarea
                  id={`step-${step.step}-body`}
                  value={step.body}
                  onChange={(e) => updateStep(i, "body", e.target.value)}
                  placeholder="Email body… You can use {{firstName}}, {{businessName}} etc."
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-[#DDD8D0] rounded-xs bg-[#FAF8F5] text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:ring-2 focus:ring-[#3D8B5E]/40 focus:border-[#3D8B5E] resize-y"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={savingSequences}
        className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xs text-sm font-semibold text-white bg-[#2A4A3A] hover:bg-[#1E3A2E] transition disabled:opacity-50"
      >
        {savingSequences ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {savingSequences ? "Saving…" : "Save Sequences"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Options (Open Tracking, Link Tracking)
// ---------------------------------------------------------------------------

function OptionsTab({
  details,
  campaignId,
}: {
  details: CampaignDetails;
  campaignId: string;
}) {
  const { updateOptions } = useCampaignStore();
  const [openTracking, setOpenTracking] = useState(details.openTracking ?? false);
  const [linkTracking, setLinkTracking] = useState(details.linkTracking ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOpenTracking(details.openTracking ?? false);
    setLinkTracking(details.linkTracking ?? false);
  }, [details.openTracking, details.linkTracking]);

  const handleToggle = async (
    option: "openTracking" | "linkTracking",
    value: boolean
  ) => {
    if (option === "openTracking") setOpenTracking(value);
    else setLinkTracking(value);

    setSaving(true);
    const success = await updateOptions(campaignId, { [option]: value });
    setSaving(false);

    if (success) {
      toast.success(`${option === "openTracking" ? "Open tracking" : "Link tracking"} ${value ? "enabled" : "disabled"}`);
    } else {
      // Revert on failure
      if (option === "openTracking") setOpenTracking(!value);
      else setLinkTracking(!value);
      toast.error("Failed to update option");
    }
  };

  return (
    <div className="space-y-4">
      {/* Open Tracking */}
      <div className="bg-white rounded-xs border border-[#E8E2D8] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
              <Eye size={16} className="text-[#3D8B5E]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A2E22]">Open Tracking</h3>
              <p className="text-[11px] text-[#6B7570] mt-0.5">
                Track when recipients open your emails
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-xs border border-[#E8E2D8] overflow-hidden">
            <button
              onClick={() => handleToggle("openTracking", false)}
              disabled={saving}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                !openTracking
                  ? "bg-[#2A4A3A] text-white"
                  : "bg-white text-[#6B7570] hover:bg-[#F5F1EB]"
              }`}
            >
              Disable
            </button>
            <button
              onClick={() => handleToggle("openTracking", true)}
              disabled={saving}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                openTracking
                  ? "bg-[#3D8B5E] text-white"
                  : "bg-white text-[#6B7570] hover:bg-[#F5F1EB]"
              }`}
            >
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Link Tracking */}
      <div className="bg-white rounded-xs border border-[#E8E2D8] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#B89A4A]/10 flex items-center justify-center">
              <Link2 size={16} className="text-[#B89A4A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A2E22]">Link Tracking</h3>
              <p className="text-[11px] text-[#6B7570] mt-0.5">
                Track when recipients click links in your emails
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-xs border border-[#E8E2D8] overflow-hidden">
            <button
              onClick={() => handleToggle("linkTracking", false)}
              disabled={saving}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                !linkTracking
                  ? "bg-[#2A4A3A] text-white"
                  : "bg-white text-[#6B7570] hover:bg-[#F5F1EB]"
              }`}
            >
              Disable
            </button>
            <button
              onClick={() => handleToggle("linkTracking", true)}
              disabled={saving}
              className={`px-4 py-2 text-xs font-semibold transition-all ${
                linkTracking
                  ? "bg-[#3D8B5E] text-white"
                  : "bg-white text-[#6B7570] hover:bg-[#F5F1EB]"
              }`}
            >
              Enable
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-[11px] text-[#6B7570]">
          <Loader2 size={12} className="animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5: Analytics
// ---------------------------------------------------------------------------

function AnalyticsTab({
  campaignId,
  details,
}: {
  campaignId: string;
  details: CampaignDetails;
}) {
  const { fetchAnalytics } = useCampaignStore();
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAnalytics(campaignId);
    if (data) {
      setAnalytics(data);
    } else {
      // Fall back to details stats — read from prop directly to avoid stale closure issues
      setAnalytics((prev) => {
        const fallbackSent = details.emailsSent ?? 0;
        return {
          sent:      fallbackSent,
          opened:    details.emailsOpened  ?? 0,
          replied:   details.emailsReplied ?? 0,
          bounced:   details.emailsBounced ?? 0,
          openRate:  fallbackSent > 0
            ? Math.round(((details.emailsOpened ?? 0) / fallbackSent) * 100)
            : (prev?.openRate ?? 0),
          replyRate: fallbackSent > 0
            ? Math.round(((details.emailsReplied ?? 0) / fallbackSent) * 100)
            : (prev?.replyRate ?? 0),
        };
      });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, fetchAnalytics]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={24} className="text-[#3D8B5E] animate-spin" />
        <p className="text-sm text-[#6B7570]">Loading analytics…</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <BarChart3 size={28} className="text-[#C8C2B8]" />
        <p className="text-sm text-[#8A9590]">No analytics data available</p>
      </div>
    );
  }

  const stats = [
    { label: "Sent",    value: analytics.sent,    icon: <Mail size={18} />,          color: "#3D8B5E", bg: "#3D8B5E12" },
    { label: "Opened",  value: analytics.opened,  icon: <MailOpen size={18} />,      color: "#B89A4A", bg: "#B89A4A12" },
    { label: "Replied", value: analytics.replied, icon: <MessageSquare size={18} />, color: "#2A4A3A", bg: "#2A4A3A12" },
    { label: "Bounced", value: analytics.bounced, icon: <AlertTriangle size={18} />, color: "#C75555", bg: "#C7555512" },
  ];

  const openRate  = typeof analytics.openRate  === "number" ? analytics.openRate  : 0;
  const replyRate = typeof analytics.replyRate === "number" ? analytics.replyRate : 0;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-[#1A2E22]">Campaign Analytics</h2>
        <button
          onClick={load}
          aria-label="Refresh analytics"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] transition"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-2 p-4 bg-white border border-[#E8E2D8] rounded-xs"
          >
            <div
              className="w-9 h-9 rounded-xs flex items-center justify-center"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-[#1A2E22]">{s.value}</p>
            <p className="text-xs text-[#8A9590]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rate bars */}
      <div className="space-y-4 max-w-sm">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-[#5A6B60]">Open Rate</span>
            <span className="text-[#1A2E22]">{openRate}%</span>
          </div>
          <div className="h-2.5 bg-[#F0ECE4] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(openRate, 100)}%`, backgroundColor: "#B89A4A" }}
              role="progressbar"
              aria-valuenow={openRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Open rate ${openRate}%`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-[#5A6B60]">Reply Rate</span>
            <span className="text-[#1A2E22]">{replyRate}%</span>
          </div>
          <div className="h-2.5 bg-[#F0ECE4] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(replyRate, 100)}%`, backgroundColor: "#3D8B5E" }}
              role="progressbar"
              aria-valuenow={replyRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Reply rate ${replyRate}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type TabKey = "leads" | "schedule" | "sequences" | "options" | "analytics";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const {
    campaignDetails,
    detailsLoading,
    fetchCampaignDetails,
    pauseCampaign,
    resumeCampaign,
  } = useCampaignStore();

  const [activeTab, setActiveTab] = useState<TabKey>("leads");
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (campaignId) {
      setLoadError(false);
      fetchCampaignDetails(campaignId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Detect failed load: not loading and no data
  useEffect(() => {
    if (!detailsLoading && mounted && !campaignDetails) {
      setLoadError(true);
    }
  }, [detailsLoading, campaignDetails, mounted]);

  if (!mounted) return null;

  const handleToggleStatus = async () => {
    if (!campaignDetails || togglingStatus) return;
    setTogglingStatus(true);
    const isActive = campaignDetails.status === "active";
    const ok = isActive
      ? await pauseCampaign(campaignId)
      : await resumeCampaign(campaignId);
    setTogglingStatus(false);
    if (ok) {
      toast.success(isActive ? "Campaign paused" : "Campaign resumed");
    } else {
      toast.error(isActive ? "Failed to pause campaign" : "Failed to resume campaign");
    }
  };

  // Loading state
  if (detailsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-[#3D8B5E] animate-spin" />
        <p className="text-sm text-[#6B7570]">Loading campaign…</p>
      </div>
    );
  }

  // Error / not found state
  if (loadError || !campaignDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle size={28} className="text-[#C75555]" />
        <p className="text-sm text-[#5A6B60]">Campaign not found or failed to load.</p>
        <button
          onClick={() => router.push("/dashboard/campaigns")}
          className="flex items-center gap-1.5 text-xs font-medium text-[#3D8B5E] hover:text-[#2A4A3A] transition"
        >
          <ArrowLeft size={14} />
          Back to Campaigns
        </button>
      </div>
    );
  }

  const details: CampaignDetails = campaignDetails;
  const statusCfg =
    CAMPAIGN_STATUS_CONFIG[details.status] ?? CAMPAIGN_STATUS_CONFIG.draft;
  const isActive = details.status === "active";

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "leads",     label: "Leads",     icon: <Users size={14} /> },
    { key: "schedule",  label: "Schedule",  icon: <Calendar size={14} /> },
    { key: "sequences", label: "Sequences", icon: <List size={14} /> },
    { key: "options",   label: "Options",   icon: <Settings2 size={14} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/campaigns")}
        aria-label="Back to campaigns"
        className="flex items-center gap-1.5 text-xs font-medium text-[#5A6B60] hover:text-[#1A2E22] transition"
      >
        <ArrowLeft size={14} />
        Back to Campaigns
      </button>

      {/* Campaign header card */}
      <div className="bg-white border border-[#E8E2D8] rounded-xs px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left: name + meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-[#1A2E22] truncate">{details.name}</h1>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
              >
                {statusCfg.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#8A9590]">
              <span className="flex items-center gap-1">
                <Mail size={11} />
                {details.sendingEmail}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Created {new Date(details.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Users size={11} />
                {details.leadsCount ?? (details.leads ?? []).length} leads
              </span>
            </div>
          </div>

          {/* Right: pause/resume */}
          <div className="shrink-0">
            {(details.status === "active" || details.status === "paused") && (
              <button
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                aria-label={isActive ? "Pause campaign" : "Resume campaign"}
                className={`flex items-center gap-2 px-4 py-2 rounded-xs text-sm font-semibold transition disabled:opacity-50 ${
                  isActive
                    ? "bg-[#B89A4A]/15 text-[#B89A4A] hover:bg-[#B89A4A]/25 border border-[#B89A4A]/30"
                    : "bg-[#3D8B5E]/15 text-[#3D8B5E] hover:bg-[#3D8B5E]/25 border border-[#3D8B5E]/30"
                }`}
              >
                {togglingStatus ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isActive ? (
                  <Pause size={14} />
                ) : (
                  <Play size={14} />
                )}
                {togglingStatus
                  ? "Processing…"
                  : isActive
                  ? "Pause Campaign"
                  : "Resume Campaign"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="bg-white border border-[#E8E2D8] rounded-xs overflow-hidden">
        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Campaign sections"
          className="flex border-b border-[#E8E2D8] overflow-x-auto"
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>

        {/* Tab panels */}
        <div role="tabpanel">
          {activeTab === "leads" && (
            <LeadsTab details={details} campaignId={campaignId} />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab details={details} campaignId={campaignId} />
          )}
          {activeTab === "sequences" && (
            <SequencesTab details={details} campaignId={campaignId} />
          )}
          {activeTab === "options" && (
            <OptionsTab details={details} campaignId={campaignId} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab details={details} campaignId={campaignId} />
          )}
        </div>
      </div>
    </div>
  );
}
