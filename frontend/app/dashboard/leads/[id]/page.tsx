"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLeadsStore } from "../../../store/leadsStore";
import { useEmailOutreachStore } from "../../../store/emailOutreachStore";
import { useHunterStore } from "../../../store/hunterStore";
import { EmailPreviewModal } from "../../../components/EmailPreviewModal";
import { EmailTrackingTab } from "../../../components/EmailTrackingTab";
import {
  ChevronLeft,
  MapPin,
  Star,
  Check,
  ExternalLink,
  Phone,
  Globe,
  Mail,
  Copy,
  Calendar,
  Hash,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Zap,
  Send,
  Users,
  Search,
  ShieldCheck,
  Loader2,
  User,
  Pencil,
  X,
} from "lucide-react";

const pipelineSteps = [
  { key: "discovered", label: "Discovered", color: "#8A9590" },
  { key: "analyzed", label: "Analyzed", color: "#5A6B60" },
  { key: "qualified", label: "Qualified", color: "#3D8B5E" },
  { key: "website_created", label: "Website Created", color: "#3D8B5E" },
  { key: "email_sent", label: "Email Sent", color: "#2D7A4E" },
  { key: "replied", label: "Replied", color: "#C47A4A" },
  { key: "converted", label: "Converted", color: "#1E6B3E" },
];

const allStatuses = [
  "discovered", "analyzed", "qualified", "website_created",
  "email_sent", "replied", "converted", "lost", "skipped",
];

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentLead: lead, detailLoading, fetchLeadDetail, updateLeadStatus, clearCurrentLead, updateLead } = useLeadsStore();
  const { openPreviewModal } = useEmailOutreachStore();
  const { isSearching, verifying, error: hunterError, searchDecisionMakers, findEmail, verifyEmail, clearError } = useHunterStore();
  const [mounted, setMounted] = useState(false);
  const [finderFirstName, setFinderFirstName] = useState("");
  const [finderLastName, setFinderLastName] = useState("");
  const [ownerEditing, setOwnerEditing] = useState(false);
  const [ownerFirst, setOwnerFirst] = useState("");
  const [ownerLast, setOwnerLast] = useState("");
  const [ownerPosition, setOwnerPosition] = useState("");
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [showGenerics, setShowGenerics] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  const id = params.id as string;
  const searching = isSearching(id);

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
    toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
  };

  const handleSearchDecisionMakers = async () => {
    const result = await searchDecisionMakers(id);
    if (result) {
      const { personalCount: p, genericCount: g } = result;
      if (p > 0 && g === 0) toast.success(`${p} decision-maker(s) found`);
      else if (p > 0 && g > 0) toast.success(`${p} decision-maker(s) found (${g} generic hidden)`);
      else if (p === 0 && g > 0) toast(`Only ${g} generic inbox(es) found — no named contacts`, { icon: "⚠️" });
      else toast(`No decision-makers found`, { icon: "ℹ️" });
    } else {
      toast.error(hunterError || "Search failed");
    }
    clearError();
  };

  const handleFindEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finderFirstName.trim() || !finderLastName.trim()) return;
    const result = await findEmail(id, finderFirstName.trim(), finderLastName.trim());
    if (result) {
      const { personalCount: p, genericCount: g } = result;
      if (p > 0 && g === 0) toast.success(`${p} decision-maker(s) found`);
      else if (p > 0 && g > 0) toast.success(`${p} decision-maker(s) found (${g} generic hidden)`);
      else if (p === 0 && g > 0) toast(`Only ${g} generic inbox(es) found — no named contacts`, { icon: "⚠️" });
      else toast(`No decision-makers found`, { icon: "ℹ️" });
      setFinderFirstName("");
      setFinderLastName("");
    } else {
      toast.error(hunterError || "Email not found");
    }
    clearError();
  };

  const handleVerifyEmail = async (email: string) => {
    const ok = await verifyEmail(id, email);
    if (ok) toast.success("Email verified");
    else toast.error(hunterError || "Verification failed");
    clearError();
  };

  const handleOpenOwnerEdit = () => {
    setOwnerFirst(lead?.likelyOwner?.firstName ?? "");
    setOwnerLast(lead?.likelyOwner?.lastName ?? "");
    setOwnerPosition(lead?.likelyOwner?.position ?? "");
    setOwnerEditing(true);
  };

  const handleCancelOwnerEdit = () => {
    setOwnerEditing(false);
  };

  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerFirst.trim() || !ownerLast.trim()) return;
    setOwnerSaving(true);
    try {
      await updateLead(id, {
        likelyOwner: {
          firstName: ownerFirst.trim(),
          lastName: ownerLast.trim(),
          position: ownerPosition.trim() || undefined,
          source: "manual",
        },
      });
      toast.success("Owner saved");
      setOwnerEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save owner");
    } finally {
      setOwnerSaving(false);
    }
  };

  const currentStepIndex = lead ? allStatuses.indexOf(lead.status) : 0;

  if (detailLoading || !lead) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="w-24 h-4 bg-[#E8E2D8] rounded-xs" />
          <div className="bg-white rounded-xs border border-[#D8D2C8] p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#E8E2D8] rounded-xs" />
              <div className="flex-1 space-y-2">
                <div className="w-72 h-6 bg-[#E8E2D8] rounded-xs" />
                <div className="w-48 h-4 bg-[#F5F1EB] rounded-xs" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-[#F5F1EB] rounded-xs" />)}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-80 bg-[#F5F1EB] rounded-xs" />
            <div className="h-80 bg-[#F5F1EB] rounded-xs" />
          </div>
        </div>
      </div>
    );
  }

  const canSendOutreach =
    lead?.email &&
    lead?.analyzed &&
    lead?.status !== "email_sent" &&
    lead?.status !== "replied" &&
    lead?.status !== "converted";

  return (
    <div className="max-w-[1200px] mx-auto">
      <EmailPreviewModal />
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className={`text-xs font-medium text-[#6B7570] hover:text-[#1A2E22] mb-4 inline-flex items-center gap-1.5 transition group ${mounted ? "opacity-100" : "opacity-0"}`}
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Leads
      </button>

      {/* Hero Card */}
      <div
        className={`bg-white rounded-xs border border-[#D8D2C8] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden mb-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#3D8B5E] via-[#2D7A4E] to-[#1E6B3E]" />

        <div className="p-5 sm:p-6">
          {/* Business name + status */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xs bg-[#3D8B5E]/10 flex items-center justify-center text-[#3D8B5E] shrink-0">
                <MapPin size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1A2E22] tracking-tight">
                  {lead.businessName}
                </h1>
                <p className="text-sm text-[#6B7570] mt-0.5">{lead.address}</p>
              </div>
            </div>
            {lead.leadCategory && (
              <span className={`px-2.5 py-1 rounded-xs text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                lead.leadCategory === "hot" ? "bg-[#C75555]/10 text-[#C75555]" :
                lead.leadCategory === "warm" ? "bg-[#C47A4A]/10 text-[#C47A4A]" :
                lead.leadCategory === "cool" ? "bg-[#3D8B5E]/10 text-[#3D8B5E]" :
                "bg-[#F5F1EB] text-[#6B7570]"
              }`}>
                {lead.leadCategory}
                {lead.leadScore !== undefined && <span className="ml-1">{lead.leadScore}</span>}
              </span>
            )}
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F5F1EB] rounded-xs px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Star size={12} fill="#facc15" stroke="#facc15" />
                <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">Rating</span>
              </div>
              <span className="text-xl font-bold text-[#1A2E22] tabular-nums">{lead.googleRating}</span>
            </div>
            <div className="bg-[#F5F1EB] rounded-xs px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare size={12} className="text-[#6B7570]" />
                <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">Reviews</span>
              </div>
              <span className="text-xl font-bold text-[#1A2E22] tabular-nums">{(lead.googleReviewCount ?? 0).toLocaleString()}</span>
            </div>
            <div className="bg-[#F5F1EB] rounded-xs px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Phone size={12} className="text-[#6B7570]" />
                <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">Phone</span>
              </div>
              {lead.phone ? (
                <button
                  onClick={() => copyToClipboard(lead.phone, "Phone")}
                  className="text-sm font-semibold text-[#1A2E22] hover:text-[#3D8B5E] transition flex items-center gap-1.5 group"
                >
                  {lead.phone}
                  <Copy size={11} className="opacity-0 group-hover:opacity-100 transition" />
                </button>
              ) : (
                <span className="text-sm text-[#8A9590]">N/A</span>
              )}
            </div>
            <div className="bg-[#F5F1EB] rounded-xs px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={12} className="text-[#6B7570]" />
                <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">City</span>
              </div>
              <span className="text-sm font-semibold text-[#1A2E22]">{lead.city}{lead.state ? `, ${lead.state}` : ""}</span>
            </div>
          </div>

          {/* Contact row */}
          {(lead.email || lead.website) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#EDE8E0]">
              {lead.email && (
                <button
                  onClick={() => copyToClipboard(lead.email!, "Email")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium text-[#3D5347] bg-[#3D8B5E]/8 hover:bg-[#3D8B5E]/15 transition group"
                >
                  <Mail size={13} />
                  {lead.email}
                  <Copy size={10} className="opacity-0 group-hover:opacity-100 transition" />
                </button>
              )}
              {lead.allEmailsFound && lead.allEmailsFound.length > 1 && (
                <div className="w-full mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wide">All emails found ({lead.allEmailsFound.length})</p>
                    <div className="flex items-center gap-2">
                      {selectedEmails.size > 0 && (
                        <span className="text-[10px] font-medium text-[#3D8B5E]">{selectedEmails.size} selected for outreach</span>
                      )}
                      <button
                        onClick={() => {
                          if (selectedEmails.size === lead.allEmailsFound!.length) {
                            setSelectedEmails(new Set());
                          } else {
                            setSelectedEmails(new Set(lead.allEmailsFound!));
                          }
                        }}
                        className="text-[10px] font-medium text-[#3D8B5E] hover:text-[#2D7A4E] transition"
                      >
                        {selectedEmails.size === lead.allEmailsFound.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.allEmailsFound.map((e: string) => {
                      const dm = (lead.decisionMakers ?? []).find((d) => d.email === e);
                      const prefix = e.split("@")[0].toLowerCase();
                      const isGeneric = ["info", "contact", "hello", "office", "admin", "support", "help", "reception", "appointments", "billing", "team", "sales", "marketing", "general", "mail", "noreply"].includes(prefix);
                      const label = dm?.position || (dm && !dm.isGeneric ? `${dm.firstName} ${dm.lastName}`.trim() : null);
                      const isSelected = selectedEmails.has(e);
                      return (
                        <button
                          key={e}
                          onClick={() => {
                            setSelectedEmails((prev) => {
                              const next = new Set(prev);
                              next.has(e) ? next.delete(e) : next.add(e);
                              return next;
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs text-[11px] transition group ${
                            isSelected
                              ? "font-semibold text-[#1A2E22] bg-[#3D8B5E]/15 ring-1 ring-[#3D8B5E]/40"
                              : e === lead.email
                              ? "font-semibold text-[#1A2E22] bg-[#3D8B5E]/12 ring-1 ring-[#3D8B5E]/30"
                              : "text-[#5A6B60] bg-[#F5F1EB] hover:bg-[#EDE8E0]"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 transition ${
                            isSelected ? "bg-[#3D8B5E] border-[#3D8B5E]" : "border-[#CCC7BE] bg-white"
                          }`}>
                            {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                          </span>
                          <Mail size={10} className="shrink-0" />
                          <span>{e}</span>
                          {label && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-bold bg-[#2A4A3A]/10 text-[#2A4A3A]">
                              {label}
                            </span>
                          )}
                          {!label && dm?.isGeneric && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-bold bg-[#B89A4A]/10 text-[#B89A4A]">
                              generic
                            </span>
                          )}
                          {!label && !dm && isGeneric && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-bold bg-[#8A9590]/10 text-[#8A9590]">
                              generic
                            </span>
                          )}
                          {!label && !dm && !isGeneric && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-bold bg-[#3D8B5E]/10 text-[#3D8B5E]">
                              personal
                            </span>
                          )}
                          {e === lead.email && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-bold bg-[#3D8B5E] text-white">
                              primary
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium text-[#3D5347] bg-[#F5F1EB] hover:bg-[#EDE8E0] transition"
                >
                  <Globe size={13} />
                  {lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  <ExternalLink size={10} />
                </a>
              )}
              {lead.googleMapsUrl && (
                <a
                  href={lead.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium text-[#3D5347] bg-[#F5F1EB] hover:bg-[#EDE8E0] transition"
                >
                  <MapPin size={13} />
                  Google Maps
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}

          {/* Owner row */}
          <div className="mt-4 pt-4 border-t border-[#EDE8E0]">
            {ownerEditing ? (
              <form onSubmit={handleSaveOwner} className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="block text-[10px] text-[#8A9590] mb-1">First Name</label>
                  <input
                    type="text"
                    value={ownerFirst}
                    onChange={(e) => setOwnerFirst(e.target.value)}
                    placeholder="Jane"
                    className="border border-[#CCC7BE] rounded-xs px-2.5 py-1.5 text-xs text-[#1A2E22] placeholder-[#8A9590] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 w-28 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8A9590] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={ownerLast}
                    onChange={(e) => setOwnerLast(e.target.value)}
                    placeholder="Smith"
                    className="border border-[#CCC7BE] rounded-xs px-2.5 py-1.5 text-xs text-[#1A2E22] placeholder-[#8A9590] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 w-28 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8A9590] mb-1">Position</label>
                  <input
                    type="text"
                    value={ownerPosition}
                    onChange={(e) => setOwnerPosition(e.target.value)}
                    placeholder="DDS"
                    className="border border-[#CCC7BE] rounded-xs px-2.5 py-1.5 text-xs text-[#1A2E22] placeholder-[#8A9590] bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 w-20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={ownerSaving || !ownerFirst.trim() || !ownerLast.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-semibold text-white bg-[#3D8B5E] hover:bg-[#2D7A4E] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {ownerSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelOwnerEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium text-[#6B7570] bg-[#F5F1EB] hover:bg-[#EDE8E0] transition"
                >
                  <X size={11} />
                  Cancel
                </button>
              </form>
            ) : lead.likelyOwner ? (
              <div className="flex items-center gap-2">
                <User size={13} className="text-[#3D8B5E] shrink-0" />
                <span className="text-xs text-[#3D5347]">
                  Likely owner: Dr. {lead.likelyOwner.firstName} {lead.likelyOwner.lastName}
                  {lead.likelyOwner.position ? `, ${lead.likelyOwner.position}` : ""}
                </span>
                <span className="text-[10px] text-[#8A9590] ml-1">({lead.likelyOwner.source})</span>
                <button
                  onClick={handleOpenOwnerEdit}
                  className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] text-[#6B7570] hover:text-[#3D8B5E] hover:bg-[#F5F1EB] transition"
                  title="Edit owner"
                >
                  <Pencil size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenOwnerEdit}
                className="inline-flex items-center gap-1.5 text-xs text-[#8A9590] hover:text-[#3D8B5E] transition"
              >
                <User size={12} />
                + Add owner
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div
          className={`lg:col-span-2 space-y-4 transition-all duration-500 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          {/* Pipeline Progress */}
          <div className="bg-white rounded-xs p-5 border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1A2E22]">Pipeline Progress</h2>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="border border-[#CCC7BE] rounded-xs px-2.5 py-1.5 text-xs text-[#1A2E22] font-medium bg-[#FAF8F5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-1 mb-3">
              {pipelineSteps.map((step, idx) => {
                const isCurrent = lead.status === step.key;
                const isPast = currentStepIndex > idx;
                return (
                  <div
                    key={step.key}
                    className="flex-1 h-2 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isPast || isCurrent ? step.color : "#EDE8E0",
                      opacity: isCurrent ? 1 : isPast ? 0.6 : 0.3,
                    }}
                  />
                );
              })}
            </div>

            {/* Step labels */}
            <div className="flex items-center gap-1">
              {pipelineSteps.map((step, idx) => {
                const isCurrent = lead.status === step.key;
                const isPast = currentStepIndex > idx;
                return (
                  <button
                    key={step.key}
                    onClick={() => handleStatusChange(step.key)}
                    className={`flex-1 text-center py-2 rounded-xs text-[10px] font-medium transition-all ${
                      isCurrent
                        ? "bg-[#3D8B5E] text-white"
                        : isPast
                        ? "bg-[#3D8B5E]/10 text-[#2D7A4E] hover:bg-[#3D8B5E]/20"
                        : "text-[#8A9590] hover:bg-[#F5F1EB]"
                    }`}
                  >
                    {isCurrent && <span className="mr-1">●</span>}
                    {isPast && <Check size={10} className="inline mr-0.5" strokeWidth={3} />}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>


          {/* Reviews */}
          {lead.reviews && lead.reviews.length > 0 && (
            <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1A2E22]">Google Reviews</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill={i < Math.round(lead.googleRating) ? "#facc15" : "#E8E2D8"} stroke={i < Math.round(lead.googleRating) ? "#facc15" : "#E8E2D8"} strokeWidth={1} />
                    ))}
                  </div>
                  <span className="text-xs text-[#6B7570] tabular-nums">{lead.reviews.length} reviews</span>
                </div>
              </div>
              <div className="divide-y divide-[#EDE8E0]">
                {lead.reviews.map((review, idx) => (
                  <div key={idx} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center text-[#3D8B5E] text-xs font-bold">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#1A2E22]">{review.author}</span>
                          {review.relativeTime && (
                            <span className="text-[11px] text-[#8A9590] ml-2">{review.relativeTime}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} fill={i < review.rating ? "#facc15" : "#E8E2D8"} stroke={i < review.rating ? "#facc15" : "#E8E2D8"} strokeWidth={1} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[13px] text-[#3D5347] leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Website Analysis */}
          {lead.websiteAnalysis && (
            <div className="space-y-4">
              {/* Screenshot */}
              {lead.websiteAnalysis.screenshots?.desktop && (
                <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#EDE8E0]">
                    <h2 className="text-sm font-bold text-[#1A2E22]">Website Screenshot</h2>
                  </div>
                  <div className="p-5">
                    <img src={lead.websiteAnalysis.screenshots.desktop} alt="Website screenshot" className="w-full rounded-xs border border-[#E8E2D8]" />
                  </div>
                </div>
              )}

              {/* Score Overview */}
              <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1A2E22]">Website Analysis</h2>
                  {lead.websiteQualityScore !== undefined && (
                    <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-xs ${
                      lead.websiteQualityScore <= 30 ? "bg-[#C75555]/10 text-[#C75555]" :
                      lead.websiteQualityScore <= 50 ? "bg-[#C47A4A]/10 text-[#C47A4A]" :
                      lead.websiteQualityScore <= 70 ? "bg-[#B89A4A]/10 text-[#B89A4A]" :
                      "bg-[#3D8B5E]/10 text-[#3D8B5E]"
                    }`}>{lead.websiteQualityScore}/100</span>
                  )}
                </div>
                <div className="p-5">
                  {/* Summary */}
                  {lead.websiteAnalysis.oneLineSummary && (
                    <p className="text-[13px] text-[#3D5347] italic mb-4 pb-4 border-b border-[#EDE8E0]">
                      &ldquo;{lead.websiteAnalysis.oneLineSummary}&rdquo;
                    </p>
                  )}

                  {/* Category scores */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Visual Quality", value: lead.websiteAnalysis.visualCategory, icon: <Globe size={13} /> },
                      { label: "Content Quality", value: lead.websiteAnalysis.contentCategory, icon: <MessageSquare size={13} /> },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#F5F1EB] rounded-xs p-3">
                        <div className="flex items-center gap-1.5 mb-1.5 text-[#6B7570]">
                          {s.icon}
                          <span className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</span>
                        </div>
                        <div className="text-sm font-bold text-[#1A2E22] capitalize">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Visual breakdown */}
                  {lead.websiteAnalysis.visualSubScores && (
                    <div className="border-t border-[#EDE8E0] pt-4 mb-4">
                      <h3 className="text-xs font-semibold text-[#6B7570] uppercase tracking-wider mb-2.5">Visual Breakdown</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(lead.websiteAnalysis.visualSubScores).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between bg-[#FAF8F5] rounded-xs px-2.5 py-1.5">
                            <span className="text-[11px] text-[#6B7570] capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span className={`text-[10px] font-bold capitalize ${
                              val === "poor" ? "text-[#C75555]" : val === "fair" ? "text-[#C47A4A]" : val === "good" ? "text-[#3D8B5E]" : "text-[#2D7A4E]"
                            }`}>{val}</span>
                          </div>
                        ))}
                      </div>
                      {lead.websiteAnalysis.designEraEstimate && (
                        <p className="text-[11px] text-[#8A9590] mt-2">Design era: ~{lead.websiteAnalysis.designEraEstimate}</p>
                      )}
                    </div>
                  )}

                  {/* Content checklist */}
                  {lead.websiteAnalysis.contentItems && (
                    <div className="border-t border-[#EDE8E0] pt-4 mb-4">
                      <h3 className="text-xs font-semibold text-[#6B7570] uppercase tracking-wider mb-2.5">
                        Content ({lead.websiteAnalysis.contentItemsPresentCount}/12 items)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {Object.entries(lead.websiteAnalysis.contentItems).map(([key, item]) => (
                          <div key={key} className="flex items-center gap-2 text-[12px]">
                            <span className={item.present ? "text-[#3D8B5E]" : "text-[#C75555]"}>
                              {item.present ? "✓" : "✗"}
                            </span>
                            <span className="text-[#3D5347] capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span className={`text-[10px] font-medium ${
                              item.quality === "good" ? "text-[#3D8B5E]" : item.quality === "basic" ? "text-[#C47A4A]" : "text-[#C75555]"
                            }`}>{item.quality}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {lead.websiteAnalysis.issuesList?.length > 0 && (
                    <div className="border-t border-[#EDE8E0] pt-4">
                      <h3 className="text-xs font-semibold text-[#6B7570] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        Issues Found ({lead.websiteAnalysis.issuesList.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {lead.websiteAnalysis.issuesList.map((issue: string, idx: number) => (
                          <li key={idx} className="text-[13px] text-[#3D5347] flex items-start gap-2">
                            <span className="text-[#C47A4A] mt-0.5 shrink-0">●</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div
          className={`space-y-4 transition-all duration-500 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          {/* Quick Actions */}
          <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#EDE8E0]">
              <h2 className="text-sm font-bold text-[#1A2E22]">Quick Actions</h2>
            </div>
            <div className="p-2">
              {[
                lead.phone ? { label: lead.phone, icon: <Phone size={15} />, action: () => copyToClipboard(lead.phone, "Phone"), type: "copy" } : null,
                lead.email ? { label: lead.email, icon: <Mail size={15} />, action: () => copyToClipboard(lead.email!, "Email"), type: "copy" } : null,
                { label: "Visit Website", icon: <Globe size={15} />, href: lead.website, type: "link" },
                lead.googleMapsUrl ? { label: "View on Maps", icon: <MapPin size={15} />, href: lead.googleMapsUrl, type: "link" } : null,
              ]
                .filter(Boolean)
                .map((action) =>
                  action!.type === "link" ? (
                    <a
                      key={action!.label}
                      href={action!.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm text-[#3D5347] hover:bg-[#F5F1EB] transition group"
                    >
                      <span className="text-[#6B7570] group-hover:text-[#3D8B5E] transition">{action!.icon}</span>
                      <span className="truncate">{action!.label}</span>
                      <ExternalLink size={11} className="ml-auto text-[#8A9590] shrink-0" />
                    </a>
                  ) : (
                    <button
                      key={action!.label}
                      onClick={action!.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm text-[#3D5347] hover:bg-[#F5F1EB] transition group text-left"
                    >
                      <span className="text-[#6B7570] group-hover:text-[#3D8B5E] transition">{action!.icon}</span>
                      <span className="truncate">{action!.label}</span>
                      <Copy size={11} className="ml-auto text-[#8A9590] opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </button>
                  )
                )}
              {/* Send Outreach button */}
              <div className="px-2 pt-2 pb-1">
                <button
                  onClick={() => {
                    openPreviewModal(lead._id).then(() => {
                      if (selectedEmails.size > 0) {
                        const emails = Array.from(selectedEmails);
                        const { updatePreviewField } = useEmailOutreachStore.getState();
                        updatePreviewField("to", emails.join(", "));
                      }
                    });
                  }}
                  disabled={!canSendOutreach && selectedEmails.size === 0}
                  title={
                    !lead.email && selectedEmails.size === 0
                      ? "No email address available"
                      : !lead.analyzed
                      ? "Lead must be analyzed first"
                      : !canSendOutreach && selectedEmails.size === 0
                      ? "Outreach already sent"
                      : selectedEmails.size > 0
                      ? `Send to ${selectedEmails.size} selected email${selectedEmails.size > 1 ? "s" : ""}`
                      : "Send email outreach"
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xs text-sm font-semibold text-white bg-[#2A4A3A] hover:bg-[#1E3A2E] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  {selectedEmails.size > 1 ? `Send to ${selectedEmails.size} Emails` : "Send Outreach"}
                </button>
                {!lead.email && (
                  <p className="text-[10px] text-[#C75555] text-center mt-1.5">
                    No email address found
                  </p>
                )}
                {lead.email && !lead.analyzed && (
                  <p className="text-[10px] text-[#C47A4A] text-center mt-1.5">
                    Analyze lead to unlock
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Email Tracking */}
          <EmailTrackingTab leadId={lead._id} />

          {/* Info */}
          <div className="bg-white rounded-xs border border-[#D8D2C8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#EDE8E0]">
              <h2 className="text-sm font-bold text-[#1A2E22]">Lead Info</h2>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Added", value: new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), icon: <Calendar size={13} /> },
                { label: "Updated", value: new Date(lead.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), icon: <Calendar size={13} /> },
                lead.leadScore !== undefined ? { label: "Lead Score", value: `${lead.leadScore} / 100`, icon: <TrendingUp size={13} /> } : null,
                lead.emailSource ? { label: "Email Source", value: lead.emailSource.charAt(0).toUpperCase() + lead.emailSource.slice(1), icon: <Mail size={13} /> } : null,
                { label: "Place ID", value: lead.googlePlaceId, icon: <Hash size={13} />, mono: true },
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item!.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#6B7570] shrink-0">
                      {item!.icon}
                      <span className="text-xs">{item!.label}</span>
                    </div>
                    <span className={`text-xs font-medium text-[#1A2E22] tabular-nums text-right ${item!.mono ? "font-mono truncate max-w-[140px]" : ""}`}>
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
