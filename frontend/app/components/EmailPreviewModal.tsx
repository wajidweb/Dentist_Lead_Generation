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

  // A2: Focus close button when modal opens
  useEffect(() => {
    if (previewModalOpen) {
      closeButtonRef.current?.focus();
    }
  }, [previewModalOpen]);

  // A2: Focus trap inside modal
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
        className="relative z-10 w-full max-w-2xl bg-white rounded-xs border border-[#D8D2C8] shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE8E0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
              <Mail size={16} className="text-[#3D8B5E]" />
            </div>
            <div>
              <h2 id="modal-title" className="text-sm font-bold text-[#1A2E22]">
                Email Outreach Preview
              </h2>
              {emailPreview?.businessName && (
                <p className="text-[11px] text-[#6B7570] mt-0.5">
                  {emailPreview.businessName}
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closePreviewModal}
            aria-label="Close email preview"
            className="w-7 h-7 flex items-center justify-center rounded-xs text-[#6B7570] hover:bg-[#F5F1EB] hover:text-[#1A2E22] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-[#3D8B5E] animate-spin" />
              <p className="text-sm text-[#6B7570]">Loading email preview...</p>
            </div>
          ) : emailPreview ? (
            <div className="space-y-4">
              {/* To / From (editable) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="email-to" className="block text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider mb-1.5">
                    To
                  </label>
                  <input
                    id="email-to"
                    type="email"
                    value={emailPreview.to}
                    onChange={(e) => updatePreviewField("to", e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xs border border-[#DDD8D0] text-sm text-[#1A2E22] font-medium placeholder:text-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="email-from" className="block text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider mb-1.5">
                    From
                  </label>
                  <input
                    id="email-from"
                    type="email"
                    value={emailPreview.from}
                    onChange={(e) => updatePreviewField("from", e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xs border border-[#DDD8D0] text-sm text-[#1A2E22] font-medium placeholder:text-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                  />
                </div>
              </div>

              {/* Subject (editable) */}
              <div>
                <label htmlFor="email-subject" className="block text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={emailPreview.subject}
                  onChange={(e) =>
                    updatePreviewField("subject", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xs border border-[#DDD8D0] text-sm text-[#1A2E22] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                />
              </div>

              {/* Body (editable) */}
              <div>
                <label htmlFor="email-body" className="block text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider mb-1.5">
                  Email Body
                </label>
                <textarea
                  id="email-body"
                  value={emailPreview.body}
                  onChange={(e) => updatePreviewField("body", e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] rounded-xs border border-[#DDD8D0] text-sm text-[#1A2E22] font-mono leading-relaxed focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all resize-none"
                />
              </div>

              {/* Preview Link (optional) */}
              <div>
                <label htmlFor="preview-link" className="block text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <LinkIcon size={11} />
                  Website Preview Link
                  <span className="text-[#B5AFA5] normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  id="preview-link"
                  type="url"
                  value={emailPreview.previewLink ?? ""}
                  onChange={(e) =>
                    updatePreviewField("previewLink", e.target.value)
                  }
                  placeholder="https://preview.example.com/dental-site"
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xs border border-[#DDD8D0] text-sm text-[#1A2E22] placeholder:text-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/20 transition-all"
                />
              </div>

              {/* Sequence Preview (collapsible) */}
              <div className="border border-[#E8E2D8] rounded-xs overflow-hidden">
                <button
                  onClick={() => setSequenceOpen((v) => !v)}
                  aria-expanded={sequenceOpen}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F1EB] hover:bg-[#EDE8E0] transition text-left"
                >
                  <span className="text-[11px] font-semibold text-[#3D5347] uppercase tracking-wider">
                    Follow-up Sequence (Emails 2 &amp; 3)
                  </span>
                  {sequenceOpen ? (
                    <ChevronUp size={14} className="text-[#6B7570]" />
                  ) : (
                    <ChevronDown size={14} className="text-[#6B7570]" />
                  )}
                </button>
                {sequenceOpen && (
                  <div className="divide-y divide-[#EDE8E0]">
                    <div className="px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-[#C47A4A] px-1.5 py-0.5 rounded-xs">
                          Email 2
                        </span>
                        <span className="text-[11px] text-[#6B7570]">
                          Sent 3 days after Email 1
                        </span>
                      </div>
                      <p className="text-xs text-[#3D5347] leading-relaxed">
                        A gentle follow-up reminding {emailPreview.businessName || "the practice"} about the
                        website proposal, highlighting one key benefit.
                      </p>
                    </div>
                    <div className="px-4 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-[#2A4A3A] px-1.5 py-0.5 rounded-xs">
                          Email 3
                        </span>
                        <span className="text-[11px] text-[#6B7570]">
                          Sent 7 days after Email 1
                        </span>
                      </div>
                      <p className="text-xs text-[#3D5347] leading-relaxed">
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
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#EDE8E0] bg-[#FAFAF8]">
          <button
            onClick={closePreviewModal}
            disabled={sendingLoading}
            className="px-4 py-2 rounded-xs text-sm font-medium text-[#6B7570] border border-[#D8D2C8] bg-white hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition disabled:opacity-50"
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xs text-sm font-semibold text-white bg-[#2A4A3A] hover:bg-[#1E3A2E] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={15} />
                Send Outreach
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
