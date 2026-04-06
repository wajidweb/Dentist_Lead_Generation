"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchLeads, deleteLead } from "../../store/slices/leadsSlice";

const statusColors: Record<string, string> = {
  discovered: "bg-gray-50 text-gray-700 border-gray-200",
  analyzed: "bg-gray-100 text-gray-700 border-gray-200",
  qualified: "bg-[#d1ff8f]/20 text-gray-800 border-[#d1ff8f]/40",
  website_created: "bg-[#d1ff8f]/30 text-gray-800 border-[#d1ff8f]/50",
  email_sent: "bg-[#d1ff8f]/40 text-gray-900 border-[#d1ff8f]/60",
  replied: "bg-[#d1ff8f]/60 text-gray-900 border-[#d1ff8f]/70",
  converted: "bg-[#d1ff8f] text-gray-900 border-[#b8f26d]",
  lost: "bg-red-50 text-red-700 border-red-100",
  skipped: "bg-gray-50 text-gray-500 border-gray-200",
};

const categoryColors: Record<string, string> = {
  hot: "bg-gray-900 text-white",
  warm: "bg-gray-600 text-white",
  cool: "bg-gray-400 text-white",
  skip: "bg-gray-200 text-gray-500",
};

export default function LeadsPage() {
  const dispatch = useAppDispatch();
  const { leads, total, page, totalPages, loading } = useAppSelector(
    (s) => s.leads
  );
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
    dispatch(fetchLeads(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete lead "${name}"?`)) {
      dispatch(deleteLead(id));
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div
        className={`mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-gray-900 tracking-tight">
            Leads
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0 ? (
              <>
                <span className="font-semibold text-gray-800 tabular-nums">{total}</span> leads in your pipeline
              </>
            ) : (
              "Manage your dentist leads"
            )}
          </p>
        </div>
        <Link
          href="/dashboard/search"
          className="px-5 py-2.5 rounded-xs font-semibold text-black text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 w-fit"
          style={{ backgroundColor: "#d1ff8f" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search New
        </Link>
      </div>

      {/* Filters */}
      <div
        className={`bg-white rounded-xs border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-4 transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full border border-gray-200 rounded-xs pl-9 pr-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            className="sm:w-40 border border-gray-200 rounded-xs px-3 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 bg-gray-50/50 focus:bg-white transition-all"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="sm:w-40 border border-gray-200 rounded-xs px-3 py-2 text-sm text-black bg-gray-50/50 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 focus:bg-white transition-all"
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
            className="sm:w-44 border border-gray-200 rounded-xs px-3 py-2 text-sm text-black bg-gray-50/50 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 focus:bg-white transition-all"
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
        className={`bg-white rounded-xs border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-xs" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-40 h-3.5 bg-gray-100 rounded-xs" />
                  <div className="w-24 h-3 bg-gray-50 rounded-xs" />
                </div>
                <div className="w-12 h-4 bg-gray-100 rounded-xs" />
                <div className="w-20 h-6 bg-gray-50 rounded-xs" />
              </div>
            ))}
          </div>
        ) : leads.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      Clinic
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Reviews
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition group"
                    >
                      <td className="px-6 py-3.5">
                        <Link href={`/dashboard/leads/${lead._id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xs bg-[#d1ff8f]/20 flex items-center justify-center text-gray-600 shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7.5L12 22l3-5.5c2-2 4-4.5 4-7.5a7 7 0 0 0-7-7z" />
                              <circle cx="12" cy="9" r="2.5" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate group-hover:text-black">
                              {lead.businessName}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {lead.city}{lead.state ? `, ${lead.state}` : ""}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">
                            {lead.googleRating}
                          </span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-gray-600 tabular-nums">
                          {lead.googleReviewCount}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        {lead.leadScore !== undefined && lead.leadCategory ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-bold ${categoryColors[lead.leadCategory]}`}>
                            {lead.leadScore} &middot; {lead.leadCategory.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-medium border ${statusColors[lead.status] || "bg-gray-50 text-gray-500"}`}>
                          {lead.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/leads/${lead._id}`}
                            className="text-xs font-medium text-gray-500 hover:text-black px-2.5 py-1.5 rounded-xs hover:bg-gray-100 transition"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(lead._id, lead.businessName)}
                            className="text-xs font-medium text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-xs hover:bg-red-50 transition"
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
              <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400 tabular-nums">
                  Page {page} of {totalPages} &middot; {total} leads
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-xs border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-xs border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-14 text-center">
            <div className="w-12 h-12 rounded-xs bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">No leads found</p>
            <p className="text-xs text-gray-400">
              <Link href="/dashboard/search" className="text-gray-900 font-semibold hover:underline">
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
