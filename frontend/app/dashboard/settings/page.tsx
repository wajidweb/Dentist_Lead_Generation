"use client";

import { useState, useEffect } from "react";
import { Key, Mail, Search, User } from "lucide-react";

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
      icon: <Key size={18} />,
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
      icon: <Mail size={18} />,
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
      icon: <Search size={18} />,
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
        <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-[#8A9590] mt-1">
          Configure your platform and API credentials
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div
            key={section.title}
            className={`bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{ transitionDelay: `${75 + sIdx * 75}ms` }}
          >
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-[#EDE8E0] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xs bg-[#3D8B5E]/10 flex items-center justify-center text-[#5A6B60]">
                {section.icon}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1A2E22]">{section.title}</h2>
                <p className="text-xs text-[#8A9590]">{section.description}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="p-6 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] font-medium text-[#8A9590] uppercase tracking-wider mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full border border-[#DDD8D0] rounded-xs px-3 py-2.5 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] focus:ring-2 focus:ring-[#3D8B5E]/30 bg-[#FAF8F5] focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Admin Info */}
        <div
          className={`bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="px-6 py-4 border-b border-[#EDE8E0] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#FAF8F5] flex items-center justify-center text-[#8A9590]">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1A2E22]">Account</h2>
              <p className="text-xs text-[#8A9590]">Admin credentials are set via environment variables</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#5A6B60]">Admin Email</span>
                <span className="text-sm text-[#1A2E22] font-medium">Set in .env</span>
              </div>
              <div className="border-t border-[#EDE8E0]" />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#5A6B60]">JWT Expiry</span>
                <span className="text-sm text-[#1A2E22] font-medium">7 days</span>
              </div>
              <div className="border-t border-[#EDE8E0]" />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#5A6B60]">Platform Version</span>
                <span className="text-sm text-[#1A2E22] font-medium tabular-nums">1.0.0</span>
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
            className="px-6 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#2A4A3A" }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
