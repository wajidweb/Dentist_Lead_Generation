"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Clock, Star, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchStore } from "../../store/searchStore";

export default function SearchPage() {
  const { results, history, loading, historyLoading, error, searchDentists, fetchSearchHistory, clearResults } = useSearchStore();

  const [location, setLocation] = useState("");
  const [minRating, setMinRating] = useState("3.5");
  const [minReviews, setMinReviews] = useState("10");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchSearchHistory();
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    searchDentists({
      location: location.trim(),
      minRating: Number(minRating),
      minReviews: Number(minReviews),
    }).then(() => {
      const { results, error } = useSearchStore.getState();
      if (results) toast.success(`Found ${results.leadsCreated} leads in ${results.location}`);
      if (error) toast.error(error);
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">
          Search Dentists
        </h1>
        <p className="text-sm text-[#8A9590] mt-1">
          Enter a city to discover dentist clinics with good reviews
        </p>
      </div>

      {/* Search Card */}
      <div
        className={`bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6 overflow-hidden transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="p-6">
          <form onSubmit={handleSearch}>
            {/* Main search input */}
            <div className="relative mb-5">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9590]">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter a city... e.g. New York, NY"
                required
                className="w-full border border-[#DDD8D0] rounded-xs pl-12 pr-4 py-4 text-[15px] text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 bg-[#FAF8F5] focus:bg-white transition-all"
              />
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-[#8A9590] uppercase tracking-wider mb-1.5">
                  Min Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full border border-[#DDD8D0] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 focus:bg-white transition-all"
                >
                  <option value="3.0">3.0+ stars</option>
                  <option value="3.5">3.5+ stars</option>
                  <option value="4.0">4.0+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-[#8A9590] uppercase tracking-wider mb-1.5">
                  Min Reviews
                </label>
                <select
                  value={minReviews}
                  onChange={(e) => setMinReviews(e.target.value)}
                  className="w-full border border-[#DDD8D0] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 focus:bg-white transition-all"
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
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:shadow-[#2A4A3A]/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#2A4A3A" }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={16} strokeWidth={2.5} />
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
          <div className="mx-6 mb-6 bg-[#C75555]/10 text-[#C75555] text-sm px-4 py-3 rounded-xs border border-[#C75555]/20">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="border-t border-[#E8E2D8] p-10 text-center">
            <div className="inline-flex items-center gap-3 text-sm text-[#8A9590]">
              <Loader2 size={20} className="animate-spin" />
              Searching Google Places for dentists in{" "}
              <span className="font-medium text-[#1A2E22]">{location}</span>
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
          <div className="bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8E2D8] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#1A2E22]">
                    {results.location}
                  </h2>
                  <p className="text-xs text-[#8A9590] mt-0.5">
                    {results.totalFromGoogle} found on Google
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-[#E8E2D8]">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[#1A2E22] tabular-nums">
                      {results.leadsCreated}
                    </p>
                    <p className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider">
                      Leads Saved
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[#1A2E22] tabular-nums">
                      {results.totalFromGoogle - results.leadsCreated}
                    </p>
                    <p className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider">
                      Filtered Out
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/leads"
                  className="text-xs font-medium text-[#2A4A3A] px-3 py-1.5 rounded-xs bg-[#3D8B5E]/10 hover:bg-[#3D8B5E]/20 transition"
                >
                  View All Leads
                </Link>
                <button
                  onClick={() => clearResults()}
                  className="text-xs text-[#8A9590] hover:text-[#5A6B60] p-1.5 hover:bg-[#FAF8F5] rounded-xs transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Results table */}
            {results.leads.length > 0 ? (
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
                      <th className="px-6 py-3 text-left text-[11px] font-medium text-[#8A9590] uppercase tracking-wider hidden md:table-cell">
                        Website
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-medium text-[#8A9590] uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.leads.map((lead, idx) => (
                      <tr
                        key={lead._id}
                        className="border-b border-[#EDE8E0] hover:bg-[#FAF8F5] transition group"
                        style={{
                          animation: `fadeInRow 300ms ease-out ${idx * 30}ms both`,
                        }}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xs bg-[#3D8B5E]/10 flex items-center justify-center text-[#5A6B60] shrink-0">
                              <MapPin size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-[#1A2E22] truncate">
                                {lead.businessName}
                              </div>
                              <div className="text-xs text-[#8A9590] truncate">
                                {lead.address}
                              </div>
                            </div>
                          </div>
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
                        <td className="px-6 py-3.5 hidden md:table-cell">
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#8A9590] hover:text-[#1A2E22] truncate block max-w-[220px] transition"
                          >
                            {lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          </a>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium bg-[#3D8B5E]/10 text-[#2A4A3A] border border-[#3D8B5E]/20">
                            <Check size={10} strokeWidth={3} />
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
                <p className="text-sm text-[#8A9590]">
                  No qualified leads found. Try lowering the minimum rating or reviews.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search History */}
      <div
        className={`bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <div className="px-6 py-4 border-b border-[#E8E2D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#8A9590]" />
            <h2 className="text-sm font-semibold text-[#1A2E22]">
              Recent Searches
            </h2>
          </div>
          {history.length > 0 && (
            <span className="text-xs text-[#8A9590] tabular-nums">
              {history.length} searches
            </span>
          )}
        </div>

        {historyLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-[#E8E2D8] rounded-xs" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-32 h-3.5 bg-[#E8E2D8] rounded-xs" />
                  <div className="w-48 h-3 bg-[#FAF8F5] rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div>
            {history.map((item, idx) => (
              <div
                key={item._id}
                className={`px-6 py-3.5 flex items-center gap-4 hover:bg-[#FAF8F5] transition group ${
                  idx < history.length - 1 ? "border-b border-[#EDE8E0]" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-xs bg-[#FAF8F5] flex items-center justify-center text-[#8A9590] shrink-0 group-hover:bg-[#3D8B5E]/10 group-hover:text-[#5A6B60] transition">
                  <MapPin size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1A2E22]">
                    {item.location}
                  </div>
                  <div className="text-xs text-[#8A9590] mt-0.5 flex items-center gap-1.5">
                    <span>
                      {new Date(item.searchedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-[#B5AFA5]">&middot;</span>
                    <span>{item.totalResultsFromGoogle} found</span>
                    <span className="text-[#B5AFA5]">&middot;</span>
                    <span className="text-[#5A6B60] font-medium">
                      {item.leadsCreated} saved
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setLocation(item.location)}
                  className="text-xs font-medium text-[#8A9590] hover:text-[#1A2E22] px-3 py-1.5 rounded-xs hover:bg-[#F0ECE4] transition opacity-0 group-hover:opacity-100"
                >
                  Search again
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-10 h-10 rounded-xs bg-[#FAF8F5] flex items-center justify-center mx-auto mb-3">
              <Search size={18} strokeWidth={1.5} className="text-[#B5AFA5]" />
            </div>
            <p className="text-sm text-[#8A9590]">No searches yet</p>
            <p className="text-xs text-[#B5AFA5] mt-1">
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
