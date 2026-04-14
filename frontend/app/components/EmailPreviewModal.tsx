"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  X,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Loader2,
  User,
  Clock,
  Sparkles,
} from "lucide-react";
import { useEmailOutreachStore } from "../store/emailOutreachStore";

export function EmailPreviewModal() {
  const {
    previewModalOpen,
    emailPreview,
    previewLoading,
    sendingLoading,
    closePreviewModal,
    updatePreviewField,
    sendOutreach,
  } = useEmailOutreachStore();

  const [sequenceOpen, setSequenceOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewModalOpen) {
      closeButtonRef.current?.focus();
    }
  }, [previewModalOpen]);

  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab" && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
  };

  if (!previewModalOpen) return null;

  const handleSend = async () => {
    const success = await sendOutreach();
    if (success) {
      toast.success("Outreach sent successfully!");
      setTimeout(() => {
        closePreviewModal();
      }, 1500);
    } else {
      toast.error("Failed to send outreach. Please try again.");
    }
  };

  const recipientCount = (emailPreview?.to ?? "").split(",").filter((e) => e.trim()).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={(e) => { if (e.key === "Escape") closePreviewModal(); }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A2E22]/60 backdrop-blur-sm"
        onClick={closePreviewModal}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onKeyDown={handleModalKeyDown}
        className="relative z-10 w-full max-w-2xl bg-white rounded-lg border border-[#D8D2C8] shadow-[0_25px_65px_rgba(0,0,0,0.25)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#EDE8E0] bg-gradient-to-r from-[#2A4A3A] to-[#3D8B5E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Mail size={18} className="text-white" />
              </div>
              <div>
                <h2 id="modal-title" className="text-base font-bold text-white">
                  Email Outreach
                </h2>
                {emailPreview?.businessName && (
                  <p className="text-[12px] text-white/70 mt-0.5">
                    {emailPreview.businessName}
                  </p>
                )}
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={closePreviewModal}
              aria-label="Close email preview"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/15 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
          {recipientCount > 1 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-md w-fit">
              <Sparkles size={12} className="text-white/80" />
              <span className="text-[11px] font-medium text-white/90">
                Sending to {recipientCount} recipients
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-[#3D8B5E] animate-spin" />
              <p className="text-sm text-[#6B7570]">Loading email preview...</p>
            </div>
          ) : emailPreview ? (
            <div className="space-y-5">
              {/* To / From */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email-to" className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">
                    <User size={10} />
                    To
                    {recipientCount > 1 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#3D8B5E]/10 text-[#3D8B5E] normal-case tracking-normal">
                        {recipientCount} emails
                      </span>
                    )}
                  </label>
                  <input
                    id="email-to"
                    type="text"
                    value={emailPreview.to}
                    onChange={(e) => updatePreviewField("to", e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-md border border-[#DDD8D0] text-[13px] text-[#1A2E22] font-medium placeholder:text-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email-from" className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">
                    <Send size={10} />
                    From
                  </label>
                  <input
                    id="email-from"
                    type="email"
                    value={emailPreview.from}
                    onChange={(e) => updatePreviewField("from", e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-md border border-[#DDD8D0] text-[13px] text-[#1A2E22] font-medium placeholder:text-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="email-subject" className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">
                  <Mail size={10} />
                  Subject Line
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={emailPreview.subject}
                  onChange={(e) => updatePreviewField("subject", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-md border border-[#DDD8D0] text-[13px] text-[#1A2E22] font-semibold focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="email-body" className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">
                  Email Body
                </label>
                <div className="bg-white rounded-md border border-[#DDD8D0] overflow-hidden focus-within:border-[#3D8B5E] focus-within:ring-2 focus-within:ring-[#3D8B5E]/20 transition-all">
                  <textarea
                    id="email-body"
                    value={emailPreview.body}
                    onChange={(e) => updatePreviewField("body", e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-transparent text-[13px] text-[#1A2E22] leading-[1.8] focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Preview Link */}
              <div>
                <label htmlFor="preview-link" className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5A6B60] uppercase tracking-wider mb-2">
                  <LinkIcon size={10} />
                  Website Preview Link
                  <span className="text-[#B5AFA5] normal-case font-normal tracking-normal">
                    (optional)
                  </span>
                </label>
                <input
                  id="preview-link"
                  type="url"
                  value={emailPreview.previewLink ?? ""}
                  onChange={(e) => updatePreviewField("previewLink", e.target.value)}
                  placeholder="https://preview.example.com/dental-site"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] rounded-md border border-[#DDD8D0] text-[13px] text-[#1A2E22] placeholder:text-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                />
              </div>

              {/* Sequence Preview */}
              <div className="border border-[#E8E2D8] rounded-lg overflow-hidden">
                <button
                  onClick={() => setSequenceOpen((v) => !v)}
                  aria-expanded={sequenceOpen}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-[#F5F1EB]/80 hover:bg-[#EDE8E0] transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-[#5A6B60]" />
                    <span className="text-[11px] font-semibold text-[#3D5347] uppercase tracking-wider">
                      Follow-up Sequence (Emails 2 &amp; 3)
                    </span>
                  </div>
                  {sequenceOpen ? (
                    <ChevronUp size={14} className="text-[#6B7570]" />
                  ) : (
                    <ChevronDown size={14} className="text-[#6B7570]" />
                  )}
                </button>
                {sequenceOpen && (
                  <div className="divide-y divide-[#EDE8E0]">
                    <div className="px-4 py-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-[#C47A4A] px-2 py-0.5 rounded-md">
                          Email 2
                        </span>
                        <span className="text-[11px] text-[#6B7570]">
                          Sent 3 days after Email 1
                        </span>
                      </div>
                      <p className="text-[12px] text-[#5A6B60] leading-relaxed">
                        A gentle follow-up reminding {emailPreview.businessName || "the practice"} about the
                        website proposal, highlighting one key benefit.
                      </p>
                    </div>
                    <div className="px-4 py-3.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-[#2A4A3A] px-2 py-0.5 rounded-md">
                          Email 3
                        </span>
                        <span className="text-[11px] text-[#6B7570]">
                          Sent 7 days after Email 1
                        </span>
                      </div>
                      <p className="text-[12px] text-[#5A6B60] leading-relaxed">
                        Final touchpoint with a clear call-to-action and limited-time offer
                        to encourage a reply.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F1EB] flex items-center justify-center">
                <Mail size={20} className="text-[#8A9590]" />
              </div>
              <p className="text-sm text-[#6B7570]">
                Could not load email preview.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#EDE8E0] bg-[#FAFAF8]">
          <button
            onClick={closePreviewModal}
            disabled={sendingLoading}
            className="px-5 py-2.5 rounded-md text-sm font-medium text-[#5A6B60] border border-[#D8D2C8] bg-white hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={
              sendingLoading ||
              previewLoading ||
              !emailPreview ||
              !emailPreview.to
            }
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-[#2A4A3A] hover:bg-[#1E3A2E] shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={15} />
                {recipientCount > 1 ? `Send to ${recipientCount} Recipients` : "Send Outreach"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
