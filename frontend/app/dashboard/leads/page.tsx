"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  Users,
  Trash2,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Mail,
  Calendar,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader2,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLeadsStore } from "../../store/leadsStore";
import { useHunterStore } from "../../store/hunterStore";

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

const categoryConfig: Record<string, { bg: string; text: string }> = {
  hot: { bg: "bg-[#C75555]/10", text: "text-[#C75555]" },
  warm: { bg: "bg-[#C47A4A]/10", text: "text-[#C47A4A]" },
  cool: { bg: "bg-[#3D8B5E]/10", text: "text-[#3D8B5E]" },
  skip: { bg: "bg-[#F5F1EB]", text: "text-[#6B7570]" },
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

export default function LeadsPage() {
  const { leads, total, page, totalPages, loading, stats, fetchLeads, fetchDashboardStats, deleteLead, bulkDeleteLeads, bulkUpdateStatus, exportLeads } = useLeadsStore();
  const { isBulkSearching, isSearching, searchDecisionMakers, bulkSearch: hunterBulkSearch } = useHunterStore();
  const hunterSearching = isBulkSearching();
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportBtnRef = useRef<HTMLButtonElement>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    analyzed: "true" as string,
    status: "",
    category: "",
    city: "",
    search: "",
    sortBy: "leadScore",
    sortOrder: "desc" as "asc" | "desc",
  });

  useEffect(() => {
    fetchLeads(filters);
    setSelected(new Set());
  }, [filters]);

  useEffect(() => {
    fetchDashboardStats();
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

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} lead${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    const count = await bulkDeleteLeads(Array.from(selected));
    if (count > 0) toast.success(`${count} lead${count > 1 ? "s" : ""} deleted`);
    else toast.error("Failed to delete leads");
    setSelected(new Set());
    fetchLeads(filters);
  };

  const handleBulkStatus = async () => {
    if (selected.size === 0 || !bulkStatus) return;
    const count = await bulkUpdateStatus(Array.from(selected), bulkStatus);
    if (count > 0) toast.success(`${count} lead${count > 1 ? "s" : ""} updated to ${bulkStatus.replace("_", " ")}`);
    else toast.error("Failed to update leads");
    setSelected(new Set());
    setBulkStatus("");
    fetchLeads(filters);
  };

  const handleSingleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteLead(deleteConfirm.id);
    toast.success(`"${deleteConfirm.name}" deleted`);
    setDeleteConfirm(null);
    fetchLeads(filters);
  };

  const handleExport = async (format: "csv" | "xlsx" | "json") => {
    setExporting(true);
    setShowExportMenu(false);
    const selectedIds = selected.size > 0 ? Array.from(selected) : undefined;
    const success = await exportLeads(filters, format, selectedIds);
    if (success) {
      toast.success(`${selected.size > 0 ? selected.size + " leads" : "All leads"} exported as ${format.toUpperCase()}`);
    } else {
      toast.error("Export failed. No matching leads found.");
    }
    setExporting(false);
  };

  const handleBulkFindContacts = async () => {
    const ids = Array.from(selected).slice(0, 10);
    if (ids.length === 0) return;
    const result = await hunterBulkSearch(ids);
    if (result) {
      const totalAdded = result.results.reduce((sum, r) => sum + r.added, 0);
      toast.success(`Found ${totalAdded} contact${totalAdded !== 1 ? "s" : ""} across ${ids.length} lead${ids.length !== 1 ? "s" : ""}`);
      fetchLeads(filters);
    } else {
      toast.error("Bulk contact search failed");
    }
  };

  const handleFindContact = async (e: React.MouseEvent, leadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await searchDecisionMakers(leadId);
    if (result) {
      const { personalCount: p, genericCount: g } = result;
      if (p > 0 && g === 0) toast.success(`${p} decision-maker(s) found`);
      else if (p > 0 && g > 0) toast.success(`${p} decision-maker(s) found (${g} generic hidden)`);
      else if (p === 0 && g > 0) toast(`Only ${g} generic inbox(es) found — no named contacts`, { icon: "⚠️" });
      else toast(`No decision-makers found`, { icon: "ℹ️" });
    } else {
      const err = useHunterStore.getState().error;
      toast.error(err || "Contact search failed");
      useHunterStore.getState().clearError();
    }
  };

  const activeFilterCount = [filters.status, filters.city, filters.search].filter(Boolean).length;
  const cats = stats?.categories || { hot: 0, warm: 0, cool: 0, skip: 0 };
  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0 && selected.size < leads.length;

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xs shadow-xl border border-[#D8D2C8] p-6 max-w-sm mx-4 animate-[fadeIn_0.15s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-xs bg-[#C75555]/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={18} className="text-[#C75555]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A2E22] text-center mb-1">Delete Lead</h3>
            <p className="text-xs text-[#6B7570] text-center mb-5">
              Are you sure you want to delete <span className="font-medium text-[#1A2E22]">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xs text-sm font-medium border border-[#CCC7BE] text-[#3D5347] hover:bg-[#FAF8F5] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xs text-sm font-medium bg-[#C75555] text-white hover:bg-[#B04545] transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">
            Leads
          </h1>
          <p className="text-sm text-[#6B7570] mt-1">
            {total > 0 ? (
              <>
                <span className="font-semibold text-[#2A4A3A] tabular-nums">{total}</span> leads in your pipeline
              </>
            ) : (
              "Manage your dentist leads"
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 sm:px-4 py-2.5 rounded-xs font-medium text-sm border transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 ${
              showFilters || activeFilterCount > 0
                ? "border-[#3D8B5E] bg-[#3D8B5E]/5 text-[#2D7A4E]"
                : "border-[#CCC7BE] bg-white text-[#3D5347] hover:border-[#CCC8C0]"
            }`}
          >
            <SlidersHorizontal size={15} className="shrink-0" />
            <span className="truncate">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#3D8B5E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export Button */}
          <button
            ref={exportBtnRef}
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={exporting || total === 0}
            className="px-3 sm:px-4 py-2.5 rounded-xs font-medium text-sm border border-[#CCC7BE] bg-white text-[#3D5347] hover:border-[#CCC8C0] transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={15} className="animate-spin shrink-0" /> : <Download size={15} className="shrink-0" />}
            <span className="truncate">Export</span>
            {selected.size > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#2A4A3A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {selected.size}
              </span>
            )}
          </button>

          <Link
            href="/dashboard/search"
            className="px-3 sm:px-5 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 sm:gap-2"
            style={{ backgroundColor: "#2A4A3A" }}
          >
            <Search size={16} strokeWidth={2.5} className="shrink-0" />
            <span className="truncate">Search New</span>
          </Link>
        </div>
      </div>

      {/* Category Tabs */}
      <div
        className={`mb-4 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {[
          { key: "", label: "All", count: total },
          { key: "hot", label: "Hot", count: cats.hot, color: "text-[#C75555]", activeBg: "bg-[#C75555]/10", dotColor: "bg-[#C75555]" },
          { key: "warm", label: "Warm", count: cats.warm, color: "text-[#C47A4A]", activeBg: "bg-[#C47A4A]/10", dotColor: "bg-[#C47A4A]" },
          { key: "cool", label: "Cool", count: cats.cool, color: "text-[#3D8B5E]", activeBg: "bg-[#3D8B5E]/10", dotColor: "bg-[#3D8B5E]" },
          { key: "skip", label: "Skip", count: cats.skip, color: "text-[#6B7570]", activeBg: "bg-[#F5F1EB]", dotColor: "bg-[#8A9590]" },
        ].map((tab) => {
          const isActive = filters.category === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleFilterChange("category", isActive ? "" : tab.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xs text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? `${tab.activeBg || "bg-[#2A4A3A]/5"} ${tab.color || "text-[#2A4A3A]"} border-current/20`
                  : "bg-white border-[#D8D2C8] text-[#3D5347] hover:border-[#CCC8C0] hover:bg-[#FAF8F5]"
              }`}
            >
              {tab.dotColor && <div className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />}
              <span className={isActive ? tab.color || "text-[#2A4A3A]" : "text-[#3D5347]"}>{tab.label}</span>
              <span className={`tabular-nums text-[10px] font-semibold ${isActive ? "opacity-80" : "text-[#6B7570]"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="mb-4 bg-[#2A4A3A] rounded-xs px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-[fadeIn_0.15s_ease-out]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(new Set())} className="text-white/60 hover:text-white transition">
              <X size={16} />
            </button>
            <span className="text-sm font-medium text-white">
              {selected.size} lead{selected.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border border-white/20 bg-white/10 text-white text-xs rounded-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="" className="text-[#1A2E22]">Change status...</option>
              <option value="discovered" className="text-[#1A2E22]">Discovered</option>
              <option value="analyzed" className="text-[#1A2E22]">Analyzed</option>
              <option value="qualified" className="text-[#1A2E22]">Qualified</option>
              <option value="email_sent" className="text-[#1A2E22]">Email Sent</option>
              <option value="replied" className="text-[#1A2E22]">Replied</option>
              <option value="converted" className="text-[#1A2E22]">Converted</option>
              <option value="lost" className="text-[#1A2E22]">Lost</option>
            </select>
            {bulkStatus && (
              <button
                onClick={handleBulkStatus}
                className="px-3 py-1.5 rounded-xs text-xs font-semibold bg-white text-[#2A4A3A] hover:bg-white/90 transition"
              >
                Apply
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xs text-xs font-medium text-[#C75555] bg-[#C75555]/10 hover:bg-[#C75555]/20 border border-[#C75555]/20 transition flex items-center gap-1.5"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters || activeFilterCount > 0 ? "max-h-[500px] opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}
      >
        <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          <div className="flex flex-col gap-3">
            {/* Search — full width on top */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7570]" />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full border border-[#CCC7BE] rounded-xs pl-9 pr-3 py-2.5 text-sm text-[#1A2E22] placeholder-[#8A9590] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 bg-[#FAF8F5] focus:bg-white transition-all"
              />
            </div>
            {/* Rest — 2-col grid on mobile, row on sm+ */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Filter by city..."
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="border border-[#CCC7BE] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] placeholder-[#8A9590] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 bg-[#FAF8F5] focus:bg-white transition-all sm:w-44"
              />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="border border-[#CCC7BE] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 focus:bg-white transition-all sm:w-44"
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
              <select
                value={`${filters.sortBy}:${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split(":");
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder: sortOrder as "asc" | "desc", page: 1 }));
                }}
                className="col-span-2 sm:col-span-1 border border-[#CCC7BE] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 focus:bg-white transition-all sm:w-48"
              >
                <option value="leadScore:desc">Highest Lead Score</option>
                <option value="websiteQualityScore:asc">Worst Website First</option>
                <option value="analyzedAt:desc">Recently Analyzed</option>
                <option value="googleRating:desc">Highest Rating</option>
                <option value="googleReviewCount:desc">Most Reviews</option>
              </select>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, status: "", category: "", city: "", search: "", page: 1 }))}
                  className="col-span-2 sm:col-span-1 text-xs font-medium text-[#C75555] px-3 py-2.5 rounded-xs hover:bg-[#C75555]/5 transition whitespace-nowrap"
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
              <div className="hidden sm:flex items-center gap-1 text-xs text-[#6B7570]">
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
              {leads.map((lead, idx) => {
                const status = statusConfig[lead.status] || statusConfig.discovered;
                const category = lead.leadCategory ? categoryConfig[lead.leadCategory] : null;
                const isSelected = selected.has(lead._id);
                const hasEmail = !!lead.email;

                return (
                  <Link
                    key={lead._id}
                    href={`/dashboard/leads/${lead._id}`}
                    className={`block rounded-xs border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-all duration-200 group ${
                      isSelected
                        ? "bg-[#3D8B5E]/5 border-[#3D8B5E]/25"
                        : "bg-white border-[#D8D2C8] hover:border-[#CCC8C0]"
                    }`}
                  >
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                      {/* Top row: checkbox + icon + name + status (+ desktop actions) */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={(e) => toggleSelect(e, lead._id)}
                          className={`shrink-0 transition ${isSelected ? "text-[#3D8B5E]" : "text-[#8A9590] hover:text-[#6B7570]"}`}
                        >
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>

                        {/* Clinic Icon */}
                        <div className="w-8 h-8 rounded-xs bg-[#3D8B5E]/8 flex items-center justify-center text-[#3D8B5E] shrink-0 group-hover:bg-[#3D8B5E]/15 transition-colors">
                          <MapPin size={14} />
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-semibold text-[#1A2E22] truncate group-hover:text-[#2D7A4E] transition-colors">
                              {lead.businessName}
                            </h3>
                            {category && (
                              <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${category.bg} ${category.text}`}>
                                {lead.leadCategory}
                              </span>
                            )}
                            {(() => {
                              const personalDMs = (lead.decisionMakers ?? []).filter((d) => !d.isGeneric);
                              const genericDMs = (lead.decisionMakers ?? []).filter((d) => d.isGeneric);
                              return personalDMs.length > 0 ? (
                                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#3D8B5E]/10 text-[#3D8B5E]">
                                  <Users size={8} />
                                  {personalDMs.length}
                                  {genericDMs.length > 0 && <span className="text-[#8A9590] font-normal ml-0.5">(+{genericDMs.length})</span>}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-2.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-[#6B7570] truncate">
                              {lead.city}{lead.state ? `, ${lead.state}` : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7570]">
                              <Star size={10} fill="#facc15" stroke="#facc15" strokeWidth={1} />
                              <span className="font-semibold text-[#1A2E22] tabular-nums">{lead.googleRating}</span>
                            </span>
                            <span className="hidden sm:inline text-[11px] text-[#8A9590] tabular-nums">
                              {(lead.googleReviewCount ?? 0).toLocaleString()} reviews
                            </span>
                            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[#8A9590]">
                              <Calendar size={9} />
                              {lead.analyzedAt ? timeAgo(lead.analyzedAt) : timeAgo(lead.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Score (desktop) */}
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

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-1 shrink-0">
                          {lead.phone && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(lead.phone); toast.success("Phone number copied"); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#6B7570] hover:text-[#1A2E22] hover:bg-[#F5F1EB] transition"
                              title="Click to copy"
                            >
                              <Phone size={12} />
                              {lead.phone}
                            </button>
                          )}
                          {lead.email && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(lead.email!); toast.success("Email copied"); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#6B7570] hover:text-[#1A2E22] hover:bg-[#F5F1EB] transition"
                              title="Click to copy"
                            >
                              <Mail size={12} />
                              {lead.email}
                            </button>
                          )}
                          {lead.website && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(lead.website, "_blank"); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#3D5347] hover:text-[#1A2E22] hover:bg-[#F5F1EB] transition"
                            >
                              <Globe size={12} />
                              Website
                            </button>
                          )}
                          <button
                            onClick={(e) => handleSingleDelete(e, lead._id, lead.businessName)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#8A9590] hover:text-[#C75555] hover:bg-[#C75555]/5 transition"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>

                        {/* Chevron (desktop) */}
                        <ChevronRight
                          size={14}
                          className="text-[#8A9590] group-hover:text-[#6B7570] group-hover:translate-x-0.5 transition-all shrink-0 hidden md:block"
                        />
                      </div>

                      {/* Mobile actions row */}
                      <div className="md:hidden flex items-center gap-1 mt-2 ml-[42px] flex-wrap">
                        {lead.phone && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(lead.phone); toast.success("Phone copied"); }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#6B7570] bg-[#F5F1EB] active:bg-[#EDE8E0] transition"
                          >
                            <Phone size={11} />
                            {lead.phone}
                          </button>
                        )}
                        {lead.email && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(lead.email!); toast.success("Email copied"); }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#6B7570] bg-[#F5F1EB] active:bg-[#EDE8E0] transition truncate max-w-[180px]"
                          >
                            <Mail size={11} className="shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </button>
                        )}
                        {lead.website && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(lead.website, "_blank"); }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#3D5347] bg-[#F5F1EB] active:bg-[#EDE8E0] transition"
                          >
                            <Globe size={11} />
                            Website
                          </button>
                        )}
                        <button
                          onClick={(e) => handleSingleDelete(e, lead._id, lead.businessName)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-medium text-[#C75555] bg-[#C75555]/5 active:bg-[#C75555]/10 transition"
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-5 py-3.5 flex items-center justify-between">
                <p className="text-xs text-[#6B7570] tabular-nums">
                  Page <span className="font-medium text-[#3D5347]">{page}</span> of <span className="font-medium text-[#3D5347]">{totalPages}</span>
                </p>
                <div className="flex items-center gap-1">
                  {/* Page number buttons — desktop only */}
                  {page > 3 && (
                    <>
                      <button
                        onClick={() => setFilters((prev) => ({ ...prev, page: 1 }))}
                        className="hidden sm:block w-8 h-8 rounded-xs text-xs font-medium text-[#3D5347] hover:bg-[#FAF8F5] transition"
                      >
                        1
                      </button>
                      {page > 4 && <span className="hidden sm:flex w-8 h-8 items-center justify-center text-xs text-[#8A9590]">...</span>}
                    </>
                  )}
                  {(() => {
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);
                    const pages = [];
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                        className={`hidden sm:block w-8 h-8 rounded-xs text-xs font-medium transition ${
                          page === p ? "bg-[#2A4A3A] text-white shadow-sm" : "text-[#3D5347] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {p}
                      </button>
                    ));
                  })()}
                  {page < totalPages - 2 && (
                    <>
                      {page < totalPages - 3 && <span className="hidden sm:flex w-8 h-8 items-center justify-center text-xs text-[#8A9590]">...</span>}
                      <button
                        onClick={() => setFilters((prev) => ({ ...prev, page: totalPages }))}
                        className="hidden sm:block w-8 h-8 rounded-xs text-xs font-medium text-[#3D5347] hover:bg-[#FAF8F5] transition"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <div className="flex items-center gap-1 sm:ml-2 sm:pl-2 sm:border-l sm:border-[#EDE8E0]">
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={page <= 1}
                      className="p-1.5 rounded-xs text-[#3D5347] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:hover:bg-transparent transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-xs text-[#3D5347] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:hover:bg-transparent transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xs border border-[#D8D2C8] p-16 text-center">
            <div className="w-14 h-14 rounded-xs bg-[#3D8B5E]/8 flex items-center justify-center mx-auto mb-5">
              <Users size={24} strokeWidth={1.5} className="text-[#3D8B5E]" />
            </div>
            <h3 className="text-base font-semibold text-[#1A2E22] mb-1.5">No leads found</h3>
            <p className="text-sm text-[#6B7570] mb-5 max-w-sm mx-auto">
              {activeFilterCount > 0
                ? "Try adjusting your filters to see more results"
                : "Search for dentists to start building your pipeline"
              }
            </p>
            {activeFilterCount > 0 ? (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, status: "", category: "", city: "", search: "", page: 1 }))}
                className="px-5 py-2.5 rounded-xs font-semibold text-sm border border-[#CCC7BE] text-[#3D5347] hover:bg-[#FAF8F5] transition"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/dashboard/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: "#2A4A3A" }}
              >
                <Search size={16} strokeWidth={2.5} />
                Search Dentists
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Export Dropdown — bottom sheet on mobile, positioned dropdown on sm+ */}
      {showExportMenu && (() => {
        const rect = exportBtnRef.current?.getBoundingClientRect();
        const isSmUp = typeof window !== "undefined" && window.innerWidth >= 640;
        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 sm:bg-transparent bg-black/30"
              style={{ zIndex: 9998 }}
              onClick={() => setShowExportMenu(false)}
            />
            {/* Menu */}
            <div
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:w-56 bg-white rounded-t-2xl sm:rounded-t-xs sm:rounded-b-xs border-t sm:border border-[#D8D2C8] shadow-xl animate-[slideUp_0.2s_ease-out] sm:animate-[fadeIn_0.12s_ease-out]"
              style={{
                zIndex: 9999,
                ...(isSmUp && rect
                  ? { top: rect.bottom + 6, left: Math.max(8, rect.right - 224) }
                  : {}),
              }}
            >
              {/* Drag handle — mobile only */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#D8D2C8]" />
              </div>

              <div className="px-4 sm:px-3 py-2.5 sm:py-2 border-b border-[#EDE8E0] flex items-center justify-between">
                <p className="text-xs sm:text-[10px] font-semibold uppercase tracking-wider text-[#8A9590]">
                  {selected.size > 0 ? `Export ${selected.size} selected` : `Export all ${total} leads`}
                </p>
                <button onClick={() => setShowExportMenu(false)} className="sm:hidden p-1 text-[#8A9590] hover:text-[#1A2E22] transition">
                  <X size={18} />
                </button>
              </div>
              <div className="py-1 sm:py-1">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full flex items-center gap-3 px-4 sm:px-3 py-3.5 sm:py-2.5 text-sm text-[#1A2E22] hover:bg-[#FAF8F5] active:bg-[#F0EBE3] transition-colors"
                >
                  <div className="w-9 h-9 sm:w-auto sm:h-auto rounded-lg sm:rounded-none bg-[#3D8B5E]/10 sm:bg-transparent flex items-center justify-center">
                    <FileText size={18} className="sm:!w-4 sm:!h-4 text-[#3D8B5E]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[14px] sm:text-[13px]">CSV</p>
                    <p className="text-[12px] sm:text-[11px] text-[#8A9590]">Spreadsheets, CRM import</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full flex items-center gap-3 px-4 sm:px-3 py-3.5 sm:py-2.5 text-sm text-[#1A2E22] hover:bg-[#FAF8F5] active:bg-[#F0EBE3] transition-colors"
                >
                  <div className="w-9 h-9 sm:w-auto sm:h-auto rounded-lg sm:rounded-none bg-[#2D7A4E]/10 sm:bg-transparent flex items-center justify-center">
                    <FileSpreadsheet size={18} className="sm:!w-4 sm:!h-4 text-[#2D7A4E]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[14px] sm:text-[13px]">Excel (.xlsx)</p>
                    <p className="text-[12px] sm:text-[11px] text-[#8A9590]">Formatted with column widths</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full flex items-center gap-3 px-4 sm:px-3 py-3.5 sm:py-2.5 text-sm text-[#1A2E22] hover:bg-[#FAF8F5] active:bg-[#F0EBE3] transition-colors"
                >
                  <div className="w-9 h-9 sm:w-auto sm:h-auto rounded-lg sm:rounded-none bg-[#C47A4A]/10 sm:bg-transparent flex items-center justify-center">
                    <FileJson size={18} className="sm:!w-4 sm:!h-4 text-[#C47A4A]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[14px] sm:text-[13px]">JSON</p>
                    <p className="text-[12px] sm:text-[11px] text-[#8A9590]">API integrations, developers</p>
                  </div>
                </button>
              </div>
              {(activeFilterCount > 0 || filters.category) && (
                <div className="px-4 sm:px-3 py-2.5 sm:py-2 border-t border-[#EDE8E0]">
                  <p className="text-[11px] sm:text-[10px] text-[#8A9590]">
                    Active filters will be applied to export
                  </p>
                </div>
              )}
              {/* Safe area padding for phones with home indicator */}
              <div className="sm:hidden h-[env(safe-area-inset-bottom,8px)]" />
            </div>
          </>
        );
      })()}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
