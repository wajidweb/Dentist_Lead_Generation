"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardCheck,
  Calendar,
  AlertCircle,
  RotateCcw,
  Globe,
  Flame,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLeadsStore, AnalysisStatus } from "../../store/leadsStore";

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  discovered:      { bg: "bg-[#F5F1EB]",      text: "text-[#5A6B60]",  dot: "bg-[#8A9590]",  label: "Discovered" },
  analyzed:        { bg: "bg-[#3D8B5E]/10",   text: "text-[#2D7A4E]", dot: "bg-[#3D8B5E]",  label: "Analyzed" },
  qualified:       { bg: "bg-[#2D7A4E]/15",   text: "text-[#1A3D2B]", dot: "bg-[#2D7A4E]",  label: "Qualified" },
  website_created: { bg: "bg-[#3D8B5E]/15",   text: "text-[#2D7A4E]", dot: "bg-[#3D8B5E]",  label: "Site Created" },
  email_sent:      { bg: "bg-[#2D7A4E]/20",   text: "text-[#1A2E22]", dot: "bg-[#2D7A4E]",  label: "Emailed" },
  replied:         { bg: "bg-[#B89A4A]/15",   text: "text-[#7A5E1A]", dot: "bg-[#B89A4A]",  label: "Replied" },
  converted:       { bg: "bg-[#155030]/15",   text: "text-[#0D3020]", dot: "bg-[#155030]",  label: "Converted" },
  lost:            { bg: "bg-[#C75555]/10",   text: "text-[#C75555]", dot: "bg-[#C75555]",  label: "Lost" },
  skipped:         { bg: "bg-[#E8E2D8]",      text: "text-[#8A9590]", dot: "bg-[#B5AFA5]",  label: "Skipped" },
};

const categoryConfig: Record<string, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  hot:  { bg: "bg-[#C75555]/10", text: "text-[#C75555]", dot: "bg-[#C75555]", icon: <Flame size={10} /> },
  warm: { bg: "bg-[#C47A4A]/10", text: "text-[#C47A4A]", dot: "bg-[#C47A4A]", icon: <TrendingUp size={10} /> },
  cool: { bg: "bg-[#3D8B5E]/10", text: "text-[#3D8B5E]", dot: "bg-[#3D8B5E]", icon: <TrendingUp size={10} /> },
  skip: { bg: "bg-[#E8E2D8]",    text: "text-[#8A9590]", dot: "bg-[#B5AFA5]", icon: <X size={10} /> },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#3D8B5E" : score >= 40 ? "#B89A4A" : "#C75555";
  return (
    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 shrink-0" style={{ borderColor: color }}>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

export default function AnalyzeLeadsPage() {
  const {
    leads, total, page, totalPages, loading, fetchLeads, refreshLeads,
    startAnalysis, getAnalysisStatus, retryFailedAnalysis, cancelAnalysis,
    activeGroupId, analysisProgress: progress, setActiveGroup, restoreActiveGroup,
    stats, fetchDashboardStats,
  } = useLeadsStore();
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"pending" | "all">("pending");

  const analyzing = !!activeGroupId;

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    analyzed: "false" as string,
    status: "",
    city: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Keep a ref to filters so polling always uses the latest value
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    fetchLeads(filters);
    fetchDashboardStats();
    setSelected(new Set());
  }, [filters]);

  // On mount: restore active group from localStorage (survives refresh)
  useEffect(() => {
    restoreActiveGroup().then(() => {
      // After restore, refresh leads in case analysis completed while away
      fetchLeads(filtersRef.current);
    });
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // When activeGroupId clears (analysis done), refresh the list
  const prevGroupId = useRef(activeGroupId);
  useEffect(() => {
    if (prevGroupId.current && !activeGroupId) {
      // Group just finished — refresh to remove analyzed leads from the list
      fetchLeads(filtersRef.current);
    }
    prevGroupId.current = activeGroupId;
  }, [activeGroupId]);

  // Poll for analysis progress
  useEffect(() => {
    if (!activeGroupId) return;
    const interval = setInterval(async () => {
      const status = await getAnalysisStatus(activeGroupId);
      if (!status) return;
      setActiveGroup(activeGroupId, status);
      if (status.status === "completed" || status.status === "cancelled") {
        clearInterval(interval);
        setActiveGroup(null);
        if (status.failed > 0) {
          toast.error(`Analysis done: ${status.completed} completed, ${status.failed} failed`);
        } else {
          toast.success(`Analysis complete: ${status.completed} websites analyzed`);
        }
      } else {
        refreshLeads(filtersRef.current);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeGroupId]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const switchView = (mode: "pending" | "all") => {
    setViewMode(mode);
    setFilters((prev) => ({ ...prev, analyzed: mode === "pending" ? "false" : "", page: 1 }));
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(selected.size === leads.length ? new Set() : new Set(leads.map((l) => l._id)));
  };

  const handleAnalyze = async () => {
    if (selected.size === 0) return;
    const result = await startAnalysis(Array.from(selected));
    if (result) {
      toast.success(`Analyzing ${result.totalJobs} website${result.totalJobs > 1 ? "s" : ""}...`);
      setSelected(new Set());
    } else {
      toast.error("Failed to start analysis");
    }
  };

  const handleAnalyzeAll = async () => {
    if (leads.length === 0) return;
    const result = await startAnalysis(leads.map((l) => l._id));
    if (result) {
      toast.success(`Analyzing ${result.totalJobs} website${result.totalJobs > 1 ? "s" : ""}...`);
      setSelected(new Set());
    } else {
      toast.error("Failed to start analysis");
    }
  };

  const handleRetry = async () => {
    if (!activeGroupId && !progress?.groupId) return;
    const gid = activeGroupId || progress!.groupId;
    const count = await retryFailedAnalysis(gid);
    if (count > 0) {
      setActiveGroup(gid);
      toast.success(`Retrying ${count} failed analysis${count > 1 ? "es" : ""}...`);
    }
  };

  const handleCancel = async () => {
    if (!activeGroupId) return;
    await cancelAnalysis(activeGroupId);
    toast.success("Analysis cancelled");
    fetchLeads(filters);
    fetchDashboardStats();
  };

  const totalLeadsCount = stats?.totalLeads ?? 0;
  const analyzedCount   = stats?.analyzed ?? 0;
  const pendingCount    = totalLeadsCount - analyzedCount;
  const analyzedPct     = totalLeadsCount > 0 ? Math.round((analyzedCount / totalLeadsCount) * 100) : 0;

  const activeFilterCount = [filters.status, filters.city, filters.search].filter(Boolean).length;
  const allSelected  = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0 && selected.size < leads.length;

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* Header */}
      <div className={`mb-6 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">Analyze Leads</h1>
            <p className="text-sm text-[#6B7570] mt-1">Review and mark leads as analyzed to move them through the pipeline</p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xs font-medium text-sm border transition-all duration-200 flex items-center justify-center gap-2 ${
                showFilters || activeFilterCount > 0
                  ? "border-[#3D8B5E] bg-[#3D8B5E]/5 text-[#2D7A4E]"
                  : "border-[#CCC7BE] bg-white text-[#3D5347] hover:border-[#3D8B5E]/40"
              }`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden xs:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#3D8B5E] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <Link
              href="/dashboard/leads"
              className="px-4 py-2.5 rounded-xs font-medium text-sm border border-[#CCC7BE] bg-white text-[#3D5347] hover:border-[#CCC8C0] transition-all duration-200 text-center"
            >
              View All Leads
            </Link>
            {leads.length > 0 && (
              <button
                onClick={handleAnalyzeAll}
                disabled={analyzing}
                className="col-span-2 px-5 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 bg-[#2A4A3A]"
              >
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} strokeWidth={2.5} />}
                Analyze All on Page
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Progress Banner */}
      {progress && analyzing && (
        <div className="mb-4 bg-white rounded-xs border border-[#3D8B5E]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
          <div className="px-4 sm:px-5 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#3D8B5E] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#1A2E22]">
                  Analyzing... {progress.completed}/{progress.total}
                  {progress.failed > 0 && (
                    <span className="text-[#C75555] ml-1">({progress.failed} failed)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-6 sm:ml-0">
                {progress.failed > 0 && (
                  <button
                    onClick={handleRetry}
                    className="text-xs font-medium text-[#C47A4A] px-2.5 py-1 rounded-xs hover:bg-[#C47A4A]/10 transition flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    Retry
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="text-xs font-medium text-[#C75555] px-2.5 py-1 rounded-xs hover:bg-[#C75555]/10 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="w-full bg-[#E8E2D8] rounded-full h-2">
              <div
                className="bg-[#3D8B5E] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.total > 0 ? ((progress.completed + progress.failed) / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[10px] font-medium text-[#8A9590] uppercase tracking-wider">
              <span>{progress.waiting} waiting</span>
              <span>{progress.inProgress} processing</span>
              <span className="text-[#3D8B5E]">{progress.completed} done</span>
              {progress.failed > 0 && <span className="text-[#C75555]">{progress.failed} failed</span>}
            </div>
          </div>
        </div>
      )}

      {/* Progress Stats */}
      <div className={`bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 mb-4 transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 flex-1">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#1A2E22] tabular-nums">{totalLeadsCount}</p>
              <p className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mt-0.5">Total</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#E8E2D8]" />
            <div className="text-center border-x border-[#E8E2D8] sm:border-0">
              <p className="text-xl sm:text-2xl font-bold text-[#3D8B5E] tabular-nums">{analyzedCount}</p>
              <p className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mt-0.5">Analyzed</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#E8E2D8]" />
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#B89A4A] tabular-nums">{pendingCount}</p>
              <p className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mt-0.5">Pending</p>
            </div>
          </div>
          <div className="flex-1 sm:max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#5A6B60]">Analysis Progress</span>
              <span className="text-xs font-bold text-[#1A2E22] tabular-nums">{analyzedPct}%</span>
            </div>
            <div className="w-full bg-[#F0EDE8] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#3D8B5E] transition-all duration-1000 ease-out"
                style={{ width: `${analyzedPct}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8A9590] mt-1.5">
              {pendingCount > 0 ? `${pendingCount} leads still need analysis` : "All leads analyzed!"}
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle + Bulk Action Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 transition-all duration-500 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div className="flex items-center gap-1 bg-white border border-[#E8E2D8] rounded-xs p-1 self-start">
          <button
            onClick={() => switchView("pending")}
            className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              viewMode === "pending" ? "bg-[#2A4A3A] text-white shadow-sm" : "text-[#5A6B60] hover:bg-[#F5F1EB]"
            }`}
          >
            <Clock size={12} />
            Pending
            {pendingCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${viewMode === "pending" ? "bg-white/20 text-white" : "bg-[#B89A4A]/15 text-[#B89A4A]"}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => switchView("all")}
            className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              viewMode === "all" ? "bg-[#2A4A3A] text-white shadow-sm" : "text-[#5A6B60] hover:bg-[#F5F1EB]"
            }`}
          >
            <CheckCircle2 size={12} />
            All Leads
          </button>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 bg-[#2A4A3A] rounded-xs px-3 sm:px-4 py-2 animate-[fadeIn_0.15s_ease-out] self-start sm:self-auto">
            <button onClick={() => setSelected(new Set())} className="text-white/60 hover:text-white transition">
              <X size={14} />
            </button>
            <span className="text-xs font-medium text-white whitespace-nowrap">{selected.size} selected</span>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-3 py-1 rounded-xs text-[11px] font-semibold bg-white text-[#2A4A3A] hover:bg-white/90 transition flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              {analyzing ? <Loader2 size={11} className="animate-spin" /> : <ClipboardCheck size={11} />}
              Analyze
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters || activeFilterCount > 0 ? "max-h-[200px] opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}>
        <div className="bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9590]" />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full border border-[#CCC7BE] rounded-xs pl-9 pr-3 py-2 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-1 focus:ring-[#3D8B5E]/20 bg-[#FAF8F5] transition-all"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="City..."
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="border border-[#CCC7BE] rounded-xs px-3 py-2 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-1 focus:ring-[#3D8B5E]/20 bg-[#FAF8F5] transition-all"
              />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="border border-[#CCC7BE] rounded-xs px-3 py-2 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-1 focus:ring-[#3D8B5E]/20 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="discovered">Discovered</option>
                <option value="analyzed">Analyzed</option>
                <option value="qualified">Qualified</option>
                <option value="email_sent">Email Sent</option>
                <option value="replied">Replied</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
              <select
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split(":");
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder: sortOrder as "asc" | "desc", page: 1 }));
                }}
                className="border border-[#CCC7BE] rounded-xs px-3 py-2 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-1 focus:ring-[#3D8B5E]/20 transition-all"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="googleRating:desc">Highest Rating</option>
                <option value="googleReviewCount:desc">Most Reviews</option>
                <option value="leadScore:desc">Highest Score</option>
              </select>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, status: "", city: "", search: "", page: 1 }))}
                  className="text-xs font-medium text-[#C75555] px-3 py-2 rounded-xs hover:bg-[#C75555]/5 transition whitespace-nowrap"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className={`transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xs border border-[#E8E2D8] p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#E8E2D8] rounded" />
                  <div className="w-10 h-10 bg-[#E8E2D8] rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="w-48 h-3.5 bg-[#E8E2D8] rounded-xs" />
                    <div className="w-64 h-2.5 bg-[#F0EDE8] rounded-xs" />
                  </div>
                  <div className="w-16 h-6 bg-[#F0EDE8] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : leads.length > 0 ? (
          <>
            {/* Select All Row */}
            <div className="flex items-center justify-between px-1 py-2 mb-1 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button onClick={toggleSelectAll} className="text-[#8A9590] hover:text-[#3D8B5E] transition shrink-0">
                  {allSelected ? <CheckSquare size={15} className="text-[#3D8B5E]" /> : someSelected ? <MinusSquare size={15} className="text-[#3D8B5E]" /> : <Square size={15} />}
                </button>
                <span className="text-[11px] font-medium text-[#8A9590] truncate">
                  {selected.size > 0 ? `${selected.size} of ${leads.length} selected` : `${total} leads`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#8A9590] shrink-0">
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="border border-[#E8E2D8] rounded px-1.5 py-0.5 text-xs text-[#1A2E22] font-medium bg-white focus:outline-none focus:border-[#3D8B5E]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="hidden xs:inline">per page</span>
              </div>
            </div>

            <div className="space-y-2">
              {leads.map((lead) => {
                const status   = statusConfig[lead.status] || statusConfig.discovered;
                const cat      = lead.leadCategory ? categoryConfig[lead.leadCategory] : null;
                const isSelected = selected.has(lead._id);

                return (
                  <div
                    key={lead._id}
                    onClick={(e) => toggleSelect(e, lead._id)}
                    className={`rounded-xs border transition-all duration-200 cursor-pointer group ${
                      isSelected
                        ? "bg-[#3D8B5E]/5 border-[#3D8B5E]/30 shadow-[0_0_0_1px_rgba(61,139,94,0.15)]"
                        : "bg-white border-[#E8E2D8] hover:border-[#3D8B5E]/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    }`}
                  >
                    <div className="px-3 sm:px-4 py-3 sm:py-3.5">
                      {/* Desktop: single row layout */}
                      <div className="hidden sm:flex items-center gap-3">
                        {/* Checkbox */}
                        <div className={`shrink-0 transition-colors ${isSelected ? "text-[#3D8B5E]" : "text-[#C8C4BC] group-hover:text-[#8A9590]"}`}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>

                        {/* Score Ring */}
                        {lead.leadScore !== undefined ? (
                          <ScoreRing score={lead.leadScore} />
                        ) : (
                          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#E8E2D8] flex items-center justify-center shrink-0">
                            <MapPin size={13} className="text-[#B5AFA5]" />
                          </div>
                        )}

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-[#1A2E22] truncate group-hover:text-[#2D7A4E] transition-colors">
                              {lead.businessName}
                            </h3>
                            {cat && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cat.bg} ${cat.text}`}>
                                {cat.icon}
                                {lead.leadCategory}
                              </span>
                            )}
                            {lead.analyzed && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#3D8B5E]">
                                <CheckCircle2 size={10} />
                                Analyzed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-[#6B7570]">
                              <MapPin size={10} className="text-[#B5AFA5]" />
                              {lead.city}{lead.state ? `, ${lead.state}` : ""}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-[#6B7570]">
                              <Star size={10} fill="#facc15" stroke="#facc15" />
                              <span className="font-semibold text-[#1A2E22] tabular-nums">{lead.googleRating}</span>
                              <span className="text-[#B5AFA5] tabular-nums">({lead.googleReviewCount.toLocaleString()})</span>
                            </span>
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hidden md:flex items-center gap-1 text-[11px] text-[#8A9590] hover:text-[#3D8B5E] transition-colors truncate max-w-[180px]"
                              >
                                <Globe size={10} />
                                {lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                              </a>
                            )}
                            <span className="hidden lg:flex items-center gap-1 text-[11px] text-[#B5AFA5]">
                              <Calendar size={10} />
                              {timeAgo(lead.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Website Score */}
                        {lead.websiteQualityScore !== undefined && (
                          <div className="hidden lg:flex flex-col items-center gap-0.5 shrink-0">
                            <span className="text-[10px] text-[#8A9590]">Site Score</span>
                            <span className="text-sm font-bold tabular-nums" style={{
                              color: lead.websiteQualityScore >= 70 ? "#3D8B5E"
                                   : lead.websiteQualityScore >= 40 ? "#B89A4A" : "#C75555"
                            }}>
                              {lead.websiteQualityScore}
                            </span>
                          </div>
                        )}

                        {/* Analysis Status Badge */}
                        {lead.analysisStatus === "processing" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-[10px] font-semibold shrink-0 bg-[#3D8B5E]/10 text-[#2D7A4E]">
                            <Loader2 size={10} className="animate-spin" />
                            Analyzing...
                          </div>
                        ) : lead.analysisStatus === "queued" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-[10px] font-semibold shrink-0 bg-[#F5F1EB] text-[#8A9590]">
                            <div className="w-1 h-1 rounded-full bg-[#8A9590]" />
                            Queued
                          </div>
                        ) : lead.analysisStatus === "failed" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-[10px] font-semibold shrink-0 bg-[#C75555]/10 text-[#C75555]">
                            <AlertCircle size={10} />
                            Failed
                          </div>
                        ) : (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-[10px] font-semibold shrink-0 ${status.bg} ${status.text}`}>
                            <div className={`w-1 h-1 rounded-full ${status.dot}`} />
                            {status.label}
                          </div>
                        )}

                        {/* Detail link */}
                        <Link
                          href={`/dashboard/leads/${lead._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center w-7 h-7 rounded-xs text-[#B5AFA5] hover:text-[#3D8B5E] hover:bg-[#3D8B5E]/8 transition-all shrink-0"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </div>

                      {/* Mobile: stacked layout */}
                      <div className="flex sm:hidden gap-2.5">
                        {/* Checkbox */}
                        <div className={`shrink-0 mt-0.5 transition-colors ${isSelected ? "text-[#3D8B5E]" : "text-[#C8C4BC]"}`}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>

                        {/* Score Ring */}
                        <div className="shrink-0 mt-0.5">
                          {lead.leadScore !== undefined ? (
                            <ScoreRing score={lead.leadScore} />
                          ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#E8E2D8] flex items-center justify-center">
                              <MapPin size={13} className="text-[#B5AFA5]" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: Name + arrow */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-[#1A2E22] truncate">
                              {lead.businessName}
                            </h3>
                            <Link
                              href={`/dashboard/leads/${lead._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-center w-6 h-6 rounded-xs text-[#B5AFA5] shrink-0"
                            >
                              <ChevronRight size={14} />
                            </Link>
                          </div>

                          {/* Row 2: Location + Rating */}
                          <div className="flex items-center gap-2.5 mt-1 text-[11px] text-[#6B7570]">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin size={10} className="text-[#B5AFA5] shrink-0" />
                              {lead.city}{lead.state ? `, ${lead.state}` : ""}
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Star size={10} fill="#facc15" stroke="#facc15" />
                              <span className="font-semibold text-[#1A2E22] tabular-nums">{lead.googleRating}</span>
                              <span className="text-[#B5AFA5] tabular-nums">({lead.googleReviewCount.toLocaleString()})</span>
                            </span>
                          </div>

                          {/* Row 3: Badges */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {/* Status Badge */}
                            {lead.analysisStatus === "processing" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-[#3D8B5E]/10 text-[#2D7A4E]">
                                <Loader2 size={10} className="animate-spin" />
                                Analyzing
                              </span>
                            ) : lead.analysisStatus === "queued" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-[#F5F1EB] text-[#8A9590]">
                                Queued
                              </span>
                            ) : lead.analysisStatus === "failed" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-[#C75555]/10 text-[#C75555]">
                                <AlertCircle size={10} />
                                Failed
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold ${status.bg} ${status.text}`}>
                                <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                            )}
                            {cat && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cat.bg} ${cat.text}`}>
                                {cat.icon}
                                {lead.leadCategory}
                              </span>
                            )}
                            {lead.analyzed && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#3D8B5E]">
                                <CheckCircle2 size={10} />
                                Analyzed
                              </span>
                            )}
                            {lead.websiteQualityScore !== undefined && (
                              <span className="text-[10px] font-bold tabular-nums" style={{
                                color: lead.websiteQualityScore >= 70 ? "#3D8B5E"
                                     : lead.websiteQualityScore >= 40 ? "#B89A4A" : "#C75555"
                              }}>
                                Site: {lead.websiteQualityScore}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 px-1 gap-2">
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xs text-xs font-medium border border-[#CCC7BE] text-[#3D5347] bg-white hover:bg-[#FAF8F5] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /> <span className="hidden sm:inline">Previous</span><span className="sm:hidden">Prev</span>
                </button>
                <span className="text-xs text-[#8A9590] tabular-nums shrink-0">
                  <span className="font-semibold text-[#1A2E22]">{page}</span>/<span className="font-semibold text-[#1A2E22]">{totalPages}</span>
                </span>
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xs text-xs font-medium border border-[#CCC7BE] text-[#3D5347] bg-white hover:bg-[#FAF8F5] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 sm:p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck size={26} className="text-[#3D8B5E]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A2E22] mb-1">
              {viewMode === "pending" ? "All caught up!" : "No leads found"}
            </h3>
            <p className="text-xs text-[#8A9590] mb-5 max-w-xs mx-auto">
              {viewMode === "pending"
                ? "All leads have been analyzed. Search for new dentists to grow your pipeline."
                : "No leads match your current filters."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard/search"
                className="text-xs font-semibold text-white px-4 py-2 rounded-xs bg-[#2A4A3A] hover:bg-[#3D8B5E] transition w-full sm:w-auto text-center"
              >
                Search New Leads
              </Link>
              <Link
                href="/dashboard/leads"
                className="text-xs font-semibold text-[#3D8B5E] px-4 py-2 rounded-xs bg-[#3D8B5E]/10 hover:bg-[#3D8B5E]/20 transition w-full sm:w-auto text-center"
              >
                View All Leads
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
