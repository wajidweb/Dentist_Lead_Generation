"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Star, Users } from "lucide-react";
import { useLeadsStore } from "../../store/leadsStore";

const statusColors: Record<string, string> = {
  discovered: "bg-[#F5F1EB] text-[#5A6B60] border-[#DDD8D0]",
  analyzed: "bg-[#EDE8E0] text-[#5A6B60] border-[#DDD8D0]",
  qualified: "bg-[#3D8B5E]/10 text-[#2D7A4E] border-[#3D8B5E]/20",
  website_created: "bg-[#3D8B5E]/15 text-[#2D7A4E] border-[#3D8B5E]/25",
  email_sent: "bg-[#3D8B5E]/20 text-[#1A2E22] border-[#3D8B5E]/30",
  replied: "bg-[#3D8B5E]/40 text-[#1A2E22] border-[#3D8B5E]/50",
  converted: "bg-[#3D8B5E] text-white border-[#2D7A4E]",
  lost: "bg-red-50 text-[#C75555] border-red-100",
  skipped: "bg-[#F5F1EB] text-[#8A9590] border-[#DDD8D0]",
};

const categoryColors: Record<string, string> = {
  hot: "bg-[#2A4A3A] text-white",
  warm: "bg-[#3D8B5E] text-white",
  cool: "bg-[#E8E2D8] text-[#5A6B60]",
  skip: "bg-[#F5F1EB] text-[#8A9590]",
};

export default function LeadsPage() {
  const { leads, total, page, totalPages, loading, fetchLeads, deleteLead } = useLeadsStore();
  const [mounted, setMounted] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "",
    city: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  useEffect(() => {
    fetchLeads(filters);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete lead "${name}"?`)) {
      deleteLead(id);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div
        className={`mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">
            Leads
          </h1>
          <p className="text-sm text-[#8A9590] mt-1">
            {total > 0 ? (
              <>
                <span className="font-semibold text-[#2A4A3A] tabular-nums">{total}</span> leads in your pipeline
              </>
            ) : (
              "Manage your dentist leads"
            )}
          </p>
        </div>
        <Link
          href="/dashboard/search"
          className="px-5 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 w-fit"
          style={{ backgroundColor: "#2A4A3A" }}
        >
          <Search size={16} strokeWidth={2.5} />
          Search New
        </Link>
      </div>

      {/* Filters */}
      <div
        className={`bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-4 transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9590]"
            />
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full border border-[#DDD8D0] rounded-xs pl-9 pr-3 py-2 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 bg-[#FAF8F5] focus:bg-white transition-all"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            className="sm:w-40 border border-[#DDD8D0] rounded-xs px-3 py-2 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 bg-[#FAF8F5] focus:bg-white transition-all"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="sm:w-40 border border-[#DDD8D0] rounded-xs px-3 py-2 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 focus:bg-white transition-all"
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
            className="sm:w-44 border border-[#DDD8D0] rounded-xs px-3 py-2 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 focus:bg-white transition-all"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="googleRating:desc">Highest Rating</option>
            <option value="googleReviewCount:desc">Most Reviews</option>
            <option value="leadScore:desc">Highest Lead Score</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div
        className={`bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-[#E8E2D8] rounded-xs" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-40 h-3.5 bg-[#E8E2D8] rounded-xs" />
                  <div className="w-24 h-3 bg-[#FAF8F5] rounded-xs" />
                </div>
                <div className="w-12 h-4 bg-[#E8E2D8] rounded-xs" />
                <div className="w-20 h-6 bg-[#FAF8F5] rounded-xs" />
              </div>
            ))}
          </div>
        ) : leads.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E2D8]">
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-[#8A9590] uppercase tracking-wider">
                      Clinic
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-[#8A9590] uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-[#8A9590] uppercase tracking-wider hidden sm:table-cell">
                      Reviews
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-[#8A9590] uppercase tracking-wider hidden lg:table-cell">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-[#8A9590] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-[11px] font-medium text-[#8A9590] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="border-b border-[#EDE8E0] hover:bg-[#FAF8F5] transition group"
                    >
                      <td className="px-6 py-3.5">
                        <Link href={`/dashboard/leads/${lead._id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xs bg-[#3D8B5E]/10 flex items-center justify-center text-[#5A6B60] shrink-0">
                            <MapPin size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[#1A2E22] truncate group-hover:text-[#1A2E22]">
                              {lead.businessName}
                            </div>
                            <div className="text-xs text-[#8A9590] truncate">
                              {lead.city}{lead.state ? `, ${lead.state}` : ""}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[#1A2E22] tabular-nums">
                            {lead.googleRating}
                          </span>
                          <Star size={13} fill="#facc15" stroke="#facc15" strokeWidth={1} />
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-[#5A6B60] tabular-nums">
                          {lead.googleReviewCount}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        {lead.leadScore !== undefined && lead.leadCategory ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-bold ${categoryColors[lead.leadCategory]}`}>
                            {lead.leadScore} &middot; {lead.leadCategory.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-[#B5AFA5]">--</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-medium border ${statusColors[lead.status] || "bg-[#F5F1EB] text-[#8A9590]"}`}>
                          {lead.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/leads/${lead._id}`}
                            className="text-xs font-medium text-[#5A6B60] hover:text-[#1A2E22] px-2.5 py-1.5 rounded-xs hover:bg-[#F5F1EB] transition"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(lead._id, lead.businessName)}
                            className="text-xs font-medium text-[#C75555]/70 hover:text-[#C75555] px-2.5 py-1.5 rounded-xs hover:bg-[#C75555]/10 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3.5 border-t border-[#E8E2D8] flex items-center justify-between">
                <p className="text-xs text-[#8A9590] tabular-nums">
                  Page {page} of {totalPages} &middot; {total} leads
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-xs border border-[#DDD8D0] text-[#5A6B60] hover:bg-[#FAF8F5] disabled:opacity-30 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-xs border border-[#DDD8D0] text-[#5A6B60] hover:bg-[#FAF8F5] disabled:opacity-30 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-14 text-center">
            <div className="w-12 h-12 rounded-xs bg-[#FAF8F5] flex items-center justify-center mx-auto mb-4">
              <Users size={22} strokeWidth={1.5} className="text-[#B5AFA5]" />
            </div>
            <p className="text-sm text-[#8A9590] mb-1">No leads found</p>
            <p className="text-xs text-[#8A9590]">
              <Link href="/dashboard/search" className="text-[#1A2E22] font-semibold hover:underline">
                Search for dentists
              </Link>{" "}
              to start building your pipeline
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
