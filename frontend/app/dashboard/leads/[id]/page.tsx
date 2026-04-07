"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLeadsStore } from "../../../store/leadsStore";
import { ChevronLeft, MapPin, Star, Check, ExternalLink, Phone, User } from "lucide-react";

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

const allStatuses = [
  "discovered", "analyzed", "qualified", "website_created",
  "email_sent", "replied", "converted", "lost", "skipped",
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentLead: lead, detailLoading, fetchLeadDetail, updateLeadStatus, clearCurrentLead } = useLeadsStore();
  const [mounted, setMounted] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    if (id) fetchLeadDetail(id);
    const t = setTimeout(() => setMounted(true), 50);
    return () => {
      clearCurrentLead();
      clearTimeout(t);
    };
  }, [id]);

  const handleStatusChange = (newStatus: string) => {
    updateLeadStatus(id, newStatus);
  };

  if (detailLoading || !lead) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="w-32 h-4 bg-[#E8E2D8] rounded-xs" />
          <div className="w-64 h-8 bg-[#E8E2D8] rounded-xs" />
          <div className="w-96 h-4 bg-[#FAF8F5] rounded-xs" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className="lg:col-span-2 h-64 bg-[#FAF8F5] rounded-xs" />
            <div className="h-64 bg-[#FAF8F5] rounded-xs" />
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
          className="text-xs font-medium text-[#8A9590] hover:text-[#1A2E22] mb-4 inline-flex items-center gap-1.5 transition group"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Leads
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xs bg-[#3D8B5E]/10 flex items-center justify-center text-[#5A6B60] shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#1A2E22] tracking-tight">
                  {lead.businessName}
                </h1>
                <p className="text-sm text-[#8A9590] mt-0.5">{lead.address}</p>
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-xs text-[11px] font-medium border shrink-0 ${statusColors[lead.status] || "bg-[#FAF8F5] text-[#8A9590]"}`}
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
              <div key={stat.label} className="bg-white rounded-xs p-4 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="text-[11px] font-medium text-[#8A9590] uppercase tracking-wider mb-1.5">
                  {stat.label}
                </div>
                <div className="flex items-center gap-1.5">
                  {stat.icon === "star" && (
                    <Star size={14} fill="#facc15" stroke="#facc15" strokeWidth={1} />
                  )}
                  <span className={`font-semibold text-[#1A2E22] ${typeof stat.value === "number" ? "text-lg tabular-nums" : "text-sm"}`}>
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Links Card */}
          <div className="bg-white rounded-xs p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-[#1A2E22] mb-3">Details</h2>
            <div className="space-y-2.5">
              {[
                { label: "Website", value: lead.website, href: lead.website },
                { label: "Maps", value: "View on Google Maps", href: lead.googleMapsUrl },
                lead.email ? { label: "Email", value: `${lead.email}${lead.emailSource ? ` (via ${lead.emailSource})` : ""}`, href: `mailto:${lead.email}` } : null,
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item!.label} className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-[#8A9590] uppercase tracking-wider w-14 shrink-0">
                      {item!.label}
                    </span>
                    <a
                      href={item!.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#5A6B60] hover:text-[#1A2E22] truncate transition"
                    >
                      {item!.value}
                    </a>
                  </div>
                ))}
            </div>
          </div>

          {/* Reviews */}
          {lead.reviews && lead.reviews.length > 0 && (
            <div className="bg-white rounded-xs p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#1A2E22]">
                  Google Reviews
                </h2>
                <span className="text-xs text-[#8A9590] tabular-nums">{lead.reviews.length} reviews</span>
              </div>
              <div className="space-y-4">
                {lead.reviews.map((review, idx) => (
                  <div key={idx} className={idx < lead.reviews.length - 1 ? "pb-4 border-b border-[#EDE8E0]" : ""}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[#1A2E22]">{review.author}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          i < review.rating
                            ? <Star key={i} size={11} fill="#facc15" stroke="#facc15" strokeWidth={1} />
                            : <Star key={i} size={11} fill="#e5e7eb" stroke="#e5e7eb" strokeWidth={1} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[#5A6B60] leading-relaxed">{review.text}</p>
                    {review.relativeTime && (
                      <p className="text-xs text-[#8A9590] mt-1.5">{review.relativeTime}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Website Analysis */}
          <div className="bg-white rounded-xs p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-[#1A2E22] mb-2">Website Analysis</h2>
            {lead.websiteAnalysis ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Overall", value: `${lead.websiteAnalysis.overallScore}/100` },
                    { label: "Performance", value: lead.websiteAnalysis.performanceScore },
                    { label: "SEO", value: lead.websiteAnalysis.seoScore },
                    { label: "Visual", value: `${lead.websiteAnalysis.visualScore}/10` },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#FAF8F5] rounded-xs p-3 text-center">
                      <div className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mb-1">{s.label}</div>
                      <div className="text-lg font-semibold text-[#1A2E22] tabular-nums">{s.value}</div>
                    </div>
                  ))}
                </div>
                {lead.websiteAnalysis.issues?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-[#8A9590] uppercase tracking-wider mb-2">Issues Found</h3>
                    <ul className="space-y-1.5">
                      {lead.websiteAnalysis.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-[#5A6B60] flex items-start gap-2">
                          <span className="text-[#B5AFA5] mt-0.5">&#x2022;</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[#8A9590]">Not analyzed yet. Analysis will be available in Phase 2.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`space-y-4 transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          {/* Status */}
          <div className="bg-white rounded-xs p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-[#1A2E22] mb-3">Pipeline</h2>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full border border-[#DDD8D0] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 focus:bg-white transition-all mb-3"
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
                      isActive ? "bg-[#3D8B5E] text-white" : isPast ? "text-[#2D7A4E] bg-[#3D8B5E]/10" : "text-[#8A9590] bg-[#F5F1EB]"
                    }`}
                  >
                    {isPast ? (
                      <Check size={12} strokeWidth={3} />
                    ) : isActive ? (
                      <div className="w-1.5 h-1.5 rounded-xs bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-xs bg-[#B5AFA5]" />
                    )}
                    {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xs p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-[#1A2E22] mb-3">Actions</h2>
            <div className="space-y-1.5">
              {[
                { label: "Visit Website", href: lead.website, icon: <ExternalLink size={15} /> },
                lead.googleMapsUrl ? { label: "View on Maps", href: lead.googleMapsUrl, icon: <MapPin size={15} /> } : null,
                lead.phone ? { label: `Call ${lead.phone}`, href: `tel:${lead.phone}`, icon: <Phone size={15} /> } : null,
              ]
                .filter(Boolean)
                .map((action) => (
                  <a
                    key={action!.label}
                    href={action!.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm font-medium text-[#5A6B60] hover:bg-[#FAF8F5] border border-[#E8E2D8] transition group"
                  >
                    <span className="text-[#8A9590] group-hover:text-[#5A6B60] transition">{action!.icon}</span>
                    {action!.label}
                  </a>
                ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-xs p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-[#1A2E22] mb-3">Info</h2>
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
                    <span className="text-xs text-[#8A9590]">{item!.label}</span>
                    <span className={`text-xs text-[#1A2E22] ${item!.mono ? "font-mono truncate max-w-[120px]" : ""} ${item!.bold ? "font-bold" : ""} tabular-nums`}>
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
