"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  searchDentists,
  fetchSearchHistory,
  clearResults,
} from "../../store/slices/searchSlice";

export default function SearchPage() {
  const dispatch = useAppDispatch();
  const { results, history, loading, historyLoading, error } = useAppSelector(
    (s) => s.search
  );

  const [location, setLocation] = useState("");
  const [minRating, setMinRating] = useState("3.5");
  const [minReviews, setMinReviews] = useState("10");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    dispatch(fetchSearchHistory());
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    dispatch(
      searchDentists({
        location: location.trim(),
        minRating: Number(minRating),
        minReviews: Number(minReviews),
      })
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <h1 className="text-2xl sm:text-[28px] font-semibold text-gray-900 tracking-tight">
          Search Dentists
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter a city to discover dentist clinics with good reviews
        </p>
      </div>

      {/* Search Card */}
      <div
        className={`bg-white rounded-xs border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6 overflow-hidden transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="p-6">
          <form onSubmit={handleSearch}>
            {/* Main search input */}
            <div className="relative mb-5">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter a city... e.g. New York, NY"
                required
                className="w-full border border-gray-200 rounded-xs pl-12 pr-4 py-4 text-[15px] text-black placeholder-gray-400 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Min Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full border border-gray-200 rounded-xs px-3 py-2.5 text-sm text-black bg-gray-50/50 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 focus:bg-white transition-all"
                >
                  <option value="3.0">3.0+ stars</option>
                  <option value="3.5">3.5+ stars</option>
                  <option value="4.0">4.0+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Min Reviews
                </label>
                <select
                  value={minReviews}
                  onChange={(e) => setMinReviews(e.target.value)}
                  className="w-full border border-gray-200 rounded-xs px-3 py-2.5 text-sm text-black bg-gray-50/50 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 focus:bg-white transition-all"
                >
                  <option value="5">5+ reviews</option>
                  <option value="10">10+ reviews</option>
                  <option value="20">20+ reviews</option>
                  <option value="50">50+ reviews</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xs font-semibold text-black text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#d1ff8f" }}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-6 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xs border border-red-100">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="border-t border-gray-100 p-10 text-center">
            <div className="inline-flex items-center gap-3 text-sm text-gray-500">
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Searching Google Places for dentists in{" "}
              <span className="font-medium text-gray-900">{location}</span>
              ...
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results && !loading && (
        <div
          className={`mb-6 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          {/* Results summary bar */}
          <div className="bg-white rounded-xs border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {results.location}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {results.totalFromGoogle} found on Google
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 tabular-nums">
                      {results.leadsCreated}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Leads Saved
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 tabular-nums">
                      {results.totalFromGoogle - results.leadsCreated}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Filtered Out
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/leads"
                  className="text-xs font-medium text-gray-900 px-3 py-1.5 rounded-xs bg-[#d1ff8f]/30 hover:bg-[#d1ff8f]/50 transition"
                >
                  View All Leads
                </Link>
                <button
                  onClick={() => dispatch(clearResults())}
                  className="text-xs text-gray-400 hover:text-gray-700 p-1.5 hover:bg-gray-50 rounded-xs transition"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Results table */}
            {results.leads.length > 0 ? (
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
                      <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Website
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.leads.map((lead, idx) => (
                      <tr
                        key={lead._id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition group"
                        style={{
                          animation: `fadeInRow 300ms ease-out ${idx * 30}ms both`,
                        }}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xs bg-[#d1ff8f]/20 flex items-center justify-center text-gray-600 shrink-0">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7.5L12 22l3-5.5c2-2 4-4.5 4-7.5a7 7 0 0 0-7-7z" />
                                <circle cx="12" cy="9" r="2.5" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {lead.businessName}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {lead.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                              {lead.googleRating}
                            </span>
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="#facc15"
                              stroke="#facc15"
                              strokeWidth="1"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 hidden sm:table-cell">
                          <span className="text-sm text-gray-600 tabular-nums">
                            {lead.googleReviewCount}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 hidden md:table-cell">
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-gray-900 truncate block max-w-[220px] transition"
                          >
                            {lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          </a>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium bg-[#d1ff8f]/20 text-gray-700 border border-[#d1ff8f]/30">
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Saved
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-400">
                  No qualified leads found. Try lowering the minimum rating or reviews.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search History */}
      <div
        className={`bg-white rounded-xs border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-900">
              Recent Searches
            </h2>
          </div>
          {history.length > 0 && (
            <span className="text-xs text-gray-400 tabular-nums">
              {history.length} searches
            </span>
          )}
        </div>

        {historyLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-xs" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-32 h-3.5 bg-gray-100 rounded-xs" />
                  <div className="w-48 h-3 bg-gray-50 rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div>
            {history.map((item, idx) => (
              <div
                key={item._id}
                className={`px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition group ${
                  idx < history.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-xs bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 group-hover:bg-[#d1ff8f]/20 group-hover:text-gray-600 transition">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7.5L12 22l3-5.5c2-2 4-4.5 4-7.5a7 7 0 0 0-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {item.location}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <span>
                      {new Date(item.searchedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-gray-200">&middot;</span>
                    <span>{item.totalResultsFromGoogle} found</span>
                    <span className="text-gray-200">&middot;</span>
                    <span className="text-gray-600 font-medium">
                      {item.leadsCreated} saved
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setLocation(item.location)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-900 px-3 py-1.5 rounded-xs hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
                >
                  Search again
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-10 h-10 rounded-xs bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-300"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No searches yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Your search history will appear here
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
