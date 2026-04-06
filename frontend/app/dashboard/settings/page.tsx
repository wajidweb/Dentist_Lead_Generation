"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const sections = [
    {
      title: "API Keys",
      description: "Configure external service credentials",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      ),
      fields: [
        { label: "Google Places API Key", key: "GOOGLE_PLACES_API_KEY", placeholder: "AIzaSy...", type: "password" },
        { label: "Anthropic (Claude) API Key", key: "ANTHROPIC_API_KEY", placeholder: "sk-ant-api03-...", type: "password" },
        { label: "Hunter.io API Key", key: "HUNTER_API_KEY", placeholder: "Your Hunter.io key", type: "password" },
        { label: "Cloudinary Cloud Name", key: "CLOUDINARY_CLOUD_NAME", placeholder: "your-cloud-name", type: "text" },
      ],
    },
    {
      title: "Email Outreach",
      description: "Configure cold email settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
      fields: [
        { label: "Instantly.ai API Key", key: "INSTANTLY_API_KEY", placeholder: "Your Instantly key", type: "password" },
        { label: "Your Name", key: "SENDER_NAME", placeholder: "John Smith", type: "text" },
        { label: "Your Business Name", key: "BUSINESS_NAME", placeholder: "Dental Web Pros", type: "text" },
        { label: "Physical Address", key: "PHYSICAL_ADDRESS", placeholder: "123 Main St, City, ST 12345", type: "text" },
      ],
    },
    {
      title: "Search Defaults",
      description: "Default filters for dentist searches",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      fields: [
        { label: "Default Min Rating", key: "DEFAULT_MIN_RATING", placeholder: "3.5", type: "text" },
        { label: "Default Min Reviews", key: "DEFAULT_MIN_REVIEWS", placeholder: "10", type: "text" },
        { label: "Max Concurrent Analyses", key: "MAX_CONCURRENT", placeholder: "3", type: "text" },
      ],
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <h1 className="text-2xl sm:text-[28px] font-semibold text-gray-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your platform and API credentials
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div
            key={section.title}
            className={`bg-white rounded-xs border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: `${75 + sIdx * 75}ms` }}
          >
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xs bg-[#d1ff8f]/20 flex items-center justify-center text-gray-600">
                {section.icon}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
                <p className="text-xs text-gray-400">{section.description}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xs px-3 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#d1ff8f] focus:ring-2 focus:ring-[#d1ff8f]/30 bg-gray-50/50 focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Admin Info */}
        <div
          className={`bg-white rounded-xs border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-gray-50 flex items-center justify-center text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Account</h2>
              <p className="text-xs text-gray-400">Admin credentials are set via environment variables</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Admin Email</span>
                <span className="text-sm text-gray-900 font-medium">Set in .env</span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">JWT Expiry</span>
                <span className="text-sm text-gray-900 font-medium">7 days</span>
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Platform Version</span>
                <span className="text-sm text-gray-900 font-medium tabular-nums">1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div
          className={`flex justify-end pt-2 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transitionDelay: "375ms" }}
        >
          <button
            className="px-6 py-2.5 rounded-xs font-semibold text-black text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#d1ff8f" }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
