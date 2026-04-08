"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { useLeadsStore } from "../../store/leadsStore";

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  discovered: { bg: "bg-[#F5F1EB]", text: "text-[#3D5347]", dot: "bg-[#8A9590]", label: "Discovered" },
  analyzed: { bg: "bg-[#EDE8E0]", text: "text-[#3D5347]", dot: "bg-[#5A6B60]", label: "Analyzed" },
  qualified: { bg: "bg-[#3D8B5E]/10", text: "text-[#2D7A4E]", dot: "bg-[#3D8B5E]", label: "Qualified" },
  website_created: { bg: "bg-[#3D8B5E]/15", text: "text-[#2D7A4E]", dot: "bg-[#3D8B5E]", label: "Website Created" },
  email_sent: { bg: "bg-[#3D8B5E]/20", text: "text-[#1A2E22]", dot: "bg-[#2D7A4E]", label: "Email Sent" },
  replied: { bg: "bg-[#C47A4A]/15", text: "text-[#C47A4A]", dot: "bg-[#C47A4A]", label: "Replied" },
  converted: { bg: "bg-[#3D8B5E]", text: "text-white", dot: "bg-white", label: "Converted" },
  lost: { bg: "bg-[#C75555]/10", text: "text-[#C75555]", dot: "bg-[#C75555]", label: "Lost" },
  skipped: { bg: "bg-[#F5F1EB]", text: "text-[#6B7570]", dot: "bg-[#B5AFA5]", label: "Skipped" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function AnalyzeLeadsPage() {
  const { leads, total, page, totalPages, loading, fetchLeads, bulkAnalyzeLeads } = useLeadsStore();
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);

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

  useEffect(() => {
    fetchLeads(filters);
    setSelected(new Set());
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l._id)));
    }
  };

  const handleAnalyze = async () => {
    if (selected.size === 0) return;
    setAnalyzing(true);
    const count = await bulkAnalyzeLeads(Array.from(selected));
    if (count > 0) {
      toast.success(`${count} lead${count > 1 ? "s" : ""} marked as analyzed`);
    } else {
      toast.error("Failed to analyze leads");
    }
    setSelected(new Set());
    setAnalyzing(false);
    fetchLeads(filters);
  };

  const handleAnalyzeAll = async () => {
    if (leads.length === 0) return;
    const allIds = leads.map((l) => l._id);
    setAnalyzing(true);
    const count = await bulkAnalyzeLeads(allIds);
    if (count > 0) {
      toast.success(`${count} lead${count > 1 ? "s" : ""} marked as analyzed`);
    } else {
      toast.error("Failed to analyze leads");
    }
    setSelected(new Set());
    setAnalyzing(false);
    fetchLeads(filters);
  };

  const activeFilterCount = [filters.status, filters.city, filters.search].filter(Boolean).length;
  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0 && selected.size < leads.length;

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div
        className={`mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">
            Analyze Leads
          </h1>
          <p className="text-sm text-[#6B7570] mt-1">
            {total > 0 ? (
              <>
                <span className="font-semibold text-[#2A4A3A] tabular-nums">{total}</span> leads pending analysis
              </>
            ) : (
              "All leads have been analyzed"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xs font-medium text-sm border transition-all duration-200 flex items-center gap-2 ${
              showFilters || activeFilterCount > 0
                ? "border-[#3D8B5E] bg-[#3D8B5E]/5 text-[#2D7A4E]"
                : "border-[#CCC7BE] bg-white text-[#3D5347] hover:border-[#CCC8C0]"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#3D8B5E] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {leads.length > 0 && (
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzing}
              className="px-5 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              style={{ backgroundColor: "#2A4A3A" }}
            >
              {analyzing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ClipboardCheck size={16} strokeWidth={2.5} />
              )}
              Analyze All on Page
            </button>
          )}
          <Link
            href="/dashboard/leads"
            className="px-4 py-2.5 rounded-xs font-medium text-sm border border-[#CCC7BE] bg-white text-[#3D5347] hover:border-[#CCC8C0] transition-all duration-200 flex items-center gap-2"
          >
            View Analyzed
          </Link>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="mb-4 bg-[#2A4A3A] rounded-xs px-5 py-3 flex items-center justify-between animate-[fadeIn_0.15s_ease-out]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(new Set())} className="text-white/60 hover:text-white transition">
              <X size={16} />
            </button>
            <span className="text-sm font-medium text-white">
              {selected.size} lead{selected.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-1.5 rounded-xs text-xs font-semibold bg-white text-[#2A4A3A] hover:bg-white/90 transition flex items-center gap-2 disabled:opacity-50"
          >
            {analyzing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ClipboardCheck size={12} />
            )}
            Mark as Analyzed
          </button>
        </div>
      )}

      {/* Filters Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters || activeFilterCount > 0 ? "max-h-[500px] opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}
      >
        <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7570]" />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full border border-[#CCC7BE] rounded-xs pl-9 pr-3 py-2.5 text-sm text-[#1A2E22] placeholder-[#8A9590] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 bg-[#FAF8F5] focus:bg-white transition-all"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by city..."
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              className="sm:w-44 border border-[#CCC7BE] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] placeholder-[#8A9590] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 bg-[#FAF8F5] focus:bg-white transition-all"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="sm:w-44 border border-[#CCC7BE] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 focus:bg-white transition-all"
            >
              <option value="">All Statuses</option>
              <option value="discovered">Discovered</option>
              <option value="analyzed">Analyzed</option>
              <option value="qualified">Qualified</option>
              <option value="website_created">Website Created</option>
              <option value="email_sent">Email Sent</option>
              <option value="replied">Replied</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            <div className="flex items-center gap-2">
              <select
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split(":");
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder: sortOrder as "asc" | "desc", page: 1 }));
                }}
                className="sm:w-48 border border-[#CCC7BE] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 focus:bg-white transition-all"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="googleRating:desc">Highest Rating</option>
                <option value="googleReviewCount:desc">Most Reviews</option>
                <option value="leadScore:desc">Highest Lead Score</option>
              </select>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, status: "", city: "", search: "", page: 1 }))}
                  className="text-xs font-medium text-[#C75555] px-3 py-2.5 rounded-xs hover:bg-[#C75555]/5 transition whitespace-nowrap"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div
        className={`transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xs border border-[#D8D2C8] px-3 py-2.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#E8E2D8] rounded" />
                  <div className="w-8 h-8 bg-[#E8E2D8] rounded-xs" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-40 h-3.5 bg-[#E8E2D8] rounded-xs" />
                    <div className="w-52 h-2.5 bg-[#F5F1EB] rounded-xs" />
                  </div>
                  <div className="w-16 h-5 bg-[#F5F1EB] rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        ) : leads.length > 0 ? (
          <>
            {/* Select All Row */}
            <div className="flex items-center justify-between px-3 py-1.5 mb-0.5">
              <div className="flex items-center gap-2.5">
                <button onClick={toggleSelectAll} className="text-[#6B7570] hover:text-[#3D5347] transition">
                  {allSelected ? <CheckSquare size={16} /> : someSelected ? <MinusSquare size={16} /> : <Square size={16} />}
                </button>
                <span className="text-[10px] font-medium text-[#6B7570] uppercase tracking-wider">
                  {selected.size > 0 ? `${selected.size} selected` : "Select all"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#6B7570]">
                Showing
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="border border-[#CCC7BE] rounded px-1.5 py-0.5 text-xs text-[#1A2E22] font-semibold bg-white focus:outline-none focus:border-[#3D8B5E] mx-0.5 tabular-nums"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                of <span className="font-semibold text-[#3D5347] tabular-nums">{total}</span> results
              </div>
            </div>

            <div className="space-y-1">
              {leads.map((lead) => {
                const status = statusConfig[lead.status] || statusConfig.discovered;
                const isSelected = selected.has(lead._id);

                return (
                  <div
                    key={lead._id}
                    className={`rounded-xs border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all duration-200 group cursor-pointer ${
                      isSelected
                        ? "bg-[#3D8B5E]/5 border-[#3D8B5E]/25"
                        : "bg-white border-[#D8D2C8] hover:border-[#CCC8C0]"
                    }`}
                    onClick={(e) => toggleSelect(e, lead._id)}
                  >
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Checkbox */}
                        <div
                          className={`shrink-0 transition ${isSelected ? "text-[#3D8B5E]" : "text-[#8A9590] group-hover:text-[#6B7570]"}`}
                        >
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>

                        {/* Clinic Icon */}
                        <div className="w-8 h-8 rounded-xs bg-[#3D8B5E]/8 flex items-center justify-center text-[#3D8B5E] shrink-0 group-hover:bg-[#3D8B5E]/15 transition-colors">
                          <MapPin size={14} />
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold text-[#1A2E22] truncate group-hover:text-[#2D7A4E] transition-colors">
                            {lead.businessName}
                          </h3>
                          <div className="flex items-center gap-2 sm:gap-2.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-[#6B7570] truncate">
                              {lead.city}{lead.state ? `, ${lead.state}` : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7570]">
                              <Star size={10} fill="#facc15" stroke="#facc15" strokeWidth={1} />
                              <span className="font-semibold text-[#1A2E22] tabular-nums">{lead.googleRating}</span>
                            </span>
                            <span className="hidden sm:inline text-[11px] text-[#8A9590] tabular-nums">
                              {lead.googleReviewCount.toLocaleString()} reviews
                            </span>
                            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[#8A9590]">
                              <Calendar size={9} />
                              {timeAgo(lead.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Lead Score */}
                        {lead.leadScore !== undefined && (
                          <div className="hidden lg:flex items-center">
                            <div className="w-7 h-7 rounded-full border-2 border-[#3D8B5E]/30 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-[#2D7A4E] tabular-nums">{lead.leadScore}</span>
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-[10px] font-semibold shrink-0 ${status.bg} ${status.text}`}>
                          <div className={`w-1 h-1 rounded-full ${status.dot}`} />
                          {status.label}
                        </div>

                        {/* Website link */}
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hidden md:block text-[11px] text-[#8A9590] hover:text-[#1A2E22] truncate max-w-[160px] transition"
                        >
                          {lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xs text-xs font-medium border border-[#CCC7BE] text-[#3D5347] bg-white hover:bg-[#FAF8F5] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <span className="text-xs text-[#6B7570] tabular-nums">
                  Page <span className="font-semibold text-[#3D5347]">{page}</span> of{" "}
                  <span className="font-semibold text-[#3D5347]">{totalPages}</span>
                </span>
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xs text-xs font-medium border border-[#CCC7BE] text-[#3D5347] bg-white hover:bg-[#FAF8F5] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
            <div className="w-12 h-12 rounded-xs bg-[#3D8B5E]/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck size={24} className="text-[#3D8B5E]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A2E22] mb-1">
              No leads pending analysis
            </h3>
            <p className="text-xs text-[#8A9590] mb-4">
              All leads have been analyzed, or no leads match your filters.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard/search"
                className="text-xs font-medium text-white px-4 py-2 rounded-xs transition hover:shadow-md"
                style={{ backgroundColor: "#2A4A3A" }}
              >
                Search New Leads
              </Link>
              <Link
                href="/dashboard/leads"
                className="text-xs font-medium text-[#2A4A3A] px-4 py-2 rounded-xs bg-[#3D8B5E]/10 hover:bg-[#3D8B5E]/20 transition"
              >
                View Analyzed Leads
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
