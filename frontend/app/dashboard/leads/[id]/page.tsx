"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchLeadDetail,
  updateLeadStatus,
  clearCurrentLead,
} from "../../../store/slices/leadsSlice";

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

const allStatuses = [
  "discovered", "analyzed", "qualified", "website_created",
  "email_sent", "replied", "converted", "lost", "skipped",
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentLead: lead, detailLoading } = useAppSelector((s) => s.leads);
  const [mounted, setMounted] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    if (id) dispatch(fetchLeadDetail(id));
    const t = setTimeout(() => setMounted(true), 50);
    return () => {
      dispatch(clearCurrentLead());
      clearTimeout(t);
    };
  }, [dispatch, id]);

  const handleStatusChange = (newStatus: string) => {
    dispatch(updateLeadStatus({ id, status: newStatus }));
  };

  if (detailLoading || !lead) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="w-32 h-4 bg-gray-100 rounded-xs" />
          <div className="w-64 h-8 bg-gray-100 rounded-xs" />
          <div className="w-96 h-4 bg-gray-50 rounded-xs" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className="lg:col-span-2 h-64 bg-gray-50 rounded-xs" />
            <div className="h-64 bg-gray-50 rounded-xs" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div
        className={`mb-6 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <button
          onClick={() => router.back()}
          className="text-xs font-medium text-gray-400 hover:text-gray-900 mb-4 inline-flex items-center gap-1.5 transition group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Leads
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xs bg-[#d1ff8f]/20 flex items-center justify-center text-gray-600 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7.5L12 22l3-5.5c2-2 4-4.5 4-7.5a7 7 0 0 0-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                  {lead.businessName}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">{lead.address}</p>
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-xs text-[11px] font-medium border shrink-0 ${statusColors[lead.status] || "bg-gray-50 text-gray-500"}`}
          >
            {lead.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div
          className={`lg:col-span-2 space-y-4 transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rating", value: lead.googleRating, suffix: "", icon: "star" },
              { label: "Reviews", value: lead.googleReviewCount, suffix: "", icon: "chat" },
              { label: "Phone", value: lead.phone || "N/A", suffix: "", icon: "phone" },
              { label: "City", value: `${lead.city}${lead.state ? `, ${lead.state}` : ""}`, suffix: "", icon: "map" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xs p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  {stat.label}
                </div>
                <div className="flex items-center gap-1.5">
                  {stat.icon === "star" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  <span className={`font-semibold text-gray-900 ${typeof stat.value === "number" ? "text-lg tabular-nums" : "text-sm"}`}>
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Links Card */}
          <div className="bg-white rounded-xs p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Details</h2>
            <div className="space-y-2.5">
              {[
                { label: "Website", value: lead.website, href: lead.website },
                { label: "Maps", value: "View on Google Maps", href: lead.googleMapsUrl },
                lead.email ? { label: "Email", value: `${lead.email}${lead.emailSource ? ` (via ${lead.emailSource})` : ""}`, href: `mailto:${lead.email}` } : null,
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item!.label} className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider w-14 shrink-0">
                      {item!.label}
                    </span>
                    <a
                      href={item!.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-700 hover:text-gray-900 truncate transition"
                    >
                      {item!.value}
                    </a>
                  </div>
                ))}
            </div>
          </div>

          {/* Reviews */}
          {lead.reviews && lead.reviews.length > 0 && (
            <div className="bg-white rounded-xs p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Google Reviews
                </h2>
                <span className="text-xs text-gray-400 tabular-nums">{lead.reviews.length} reviews</span>
              </div>
              <div className="space-y-4">
                {lead.reviews.map((review, idx) => (
                  <div key={idx} className={idx < lead.reviews.length - 1 ? "pb-4 border-b border-gray-50" : ""}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-900">{review.author}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < review.rating ? "#facc15" : "#e5e7eb"} stroke={i < review.rating ? "#facc15" : "#e5e7eb"} strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                    {review.relativeTime && (
                      <p className="text-xs text-gray-400 mt-1.5">{review.relativeTime}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Website Analysis */}
          <div className="bg-white rounded-xs p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Website Analysis</h2>
            {lead.websiteAnalysis ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Overall", value: `${lead.websiteAnalysis.overallScore}/100` },
                    { label: "Performance", value: lead.websiteAnalysis.performanceScore },
                    { label: "SEO", value: lead.websiteAnalysis.seoScore },
                    { label: "Visual", value: `${lead.websiteAnalysis.visualScore}/10` },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xs p-3 text-center">
                      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
                      <div className="text-lg font-semibold text-gray-900 tabular-nums">{s.value}</div>
                    </div>
                  ))}
                </div>
                {lead.websiteAnalysis.issues?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Issues Found</h3>
                    <ul className="space-y-1.5">
                      {lead.websiteAnalysis.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-300 mt-0.5">&#x2022;</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Not analyzed yet. Analysis will be available in Phase 2.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`space-y-4 transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          {/* Status */}
          <div className="bg-white rounded-xs p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Pipeline</h2>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xs px-3 py-2.5 text-sm text-black bg-gray-50/50 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 focus:bg-white transition-all mb-3"
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>

            <div className="space-y-1">
              {allStatuses.slice(0, -2).map((s) => {
                const isActive = lead.status === s;
                const isPast = allStatuses.indexOf(lead.status) > allStatuses.indexOf(s);
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xs text-xs font-medium transition ${
                      isActive ? "bg-[#d1ff8f] text-black" : isPast ? "text-gray-600 bg-[#d1ff8f]/10" : "text-gray-400 bg-gray-50"
                    }`}
                  >
                    {isPast ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-1.5 h-1.5 rounded-xs bg-black" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-xs bg-gray-300" />
                    )}
                    {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xs p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
            <div className="space-y-1.5">
              {[
                { label: "Visit Website", href: lead.website, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg> },
                lead.googleMapsUrl ? { label: "View on Maps", href: lead.googleMapsUrl, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7.5L12 22l3-5.5c2-2 4-4.5 4-7.5a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg> } : null,
                lead.phone ? { label: `Call ${lead.phone}`, href: `tel:${lead.phone}`, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg> } : null,
              ]
                .filter(Boolean)
                .map((action) => (
                  <a
                    key={action!.label}
                    href={action!.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-100 transition group"
                  >
                    <span className="text-gray-400 group-hover:text-gray-600 transition">{action!.icon}</span>
                    {action!.label}
                  </a>
                ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-xs p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Info</h2>
            <div className="space-y-2.5">
              {[
                { label: "Place ID", value: lead.googlePlaceId, mono: true },
                { label: "Added", value: new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                { label: "Updated", value: new Date(lead.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                lead.leadScore !== undefined ? { label: "Lead Score", value: lead.leadScore, bold: true } : null,
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item!.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{item!.label}</span>
                    <span className={`text-xs text-gray-900 ${item!.mono ? "font-mono truncate max-w-[120px]" : ""} ${item!.bold ? "font-bold" : ""} tabular-nums`}>
                      {item!.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
