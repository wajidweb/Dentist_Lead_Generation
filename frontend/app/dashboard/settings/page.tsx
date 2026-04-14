"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Circle,
  Trash2,
  Users,
  Search,
  BarChart2,
} from "lucide-react";
import { useSettingsStore, EmailAccount } from "../../store/settingsStore";
import { useHunterStore } from "../../store/hunterStore";

function getStatusInfo(status?: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 1:
      return {
        label: "Active",
        color: "#3D8B5E",
        icon: <CheckCircle size={14} />,
      };
    case 0:
      return {
        label: "Inactive",
        color: "#C75555",
        icon: <XCircle size={14} />,
      };
    case -1:
      return {
        label: "Error",
        color: "#C75555",
        icon: <XCircle size={14} />,
      };
    default:
      return {
        label: "Unknown",
        color: "#8A9590",
        icon: <Circle size={14} />,
      };
  }
}

function getWarmupInfo(warmupStatus?: number): {
  label: string;
  color: string;
} {
  switch (warmupStatus) {
    case 1:
      return { label: "Warming Up", color: "#C47A4A" };
    case 2:
      return { label: "Warmed Up", color: "#3D8B5E" };
    case 0:
      return { label: "Not Started", color: "#8A9590" };
    default:
      return { label: "N/A", color: "#8A9590" };
  }
}

function EmailAccountCard({
  account,
  isSelected,
  onSelect,
  onDelete,
}: {
  account: EmailAccount;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const statusInfo = getStatusInfo(account.status);
  const warmupInfo = getWarmupInfo(account.warmup_status);

  return (
    <div
      className={`
        relative rounded-xs border p-4 transition-all duration-200
        ${
          isSelected
            ? "border-[#3D8B5E] bg-[#3D8B5E]/5 shadow-sm"
            : "border-[#E8E2D8] bg-white hover:border-[#CCC8C0] hover:shadow-sm"
        }
      `}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#3D8B5E] px-2 py-0.5 rounded-xs uppercase tracking-wider">
            <CheckCircle size={10} />
            Selected
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center shrink-0
            ${isSelected ? "bg-[#3D8B5E]/15" : "bg-[#F5F1EB]"}
          `}
        >
          <Mail
            size={18}
            className={isSelected ? "text-[#3D8B5E]" : "text-[#6B7570]"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A2E22] truncate">
            {account.email}
          </p>
          {(account.first_name || account.last_name) && (
            <p className="text-xs text-[#6B7570] mt-0.5">
              {[account.first_name, account.last_name]
                .filter(Boolean)
                .join(" ")}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <span style={{ color: statusInfo.color }}>{statusInfo.icon}</span>
              <span
                className="text-[11px] font-medium"
                style={{ color: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Zap size={12} style={{ color: warmupInfo.color }} />
              <span
                className="text-[11px] font-medium"
                style={{ color: warmupInfo.color }}
              >
                {warmupInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#EDE8E0] flex items-center gap-2">
        <button
          onClick={onSelect}
          disabled={isSelected}
          className={`
            flex-1 px-3 py-1.5 rounded-xs text-xs font-semibold transition-all
            ${
              isSelected
                ? "bg-[#3D8B5E]/10 text-[#3D8B5E] cursor-default"
                : "bg-[#2A4A3A] text-white hover:bg-[#1E3A2E]"
            }
          `}
        >
          {isSelected ? "Currently Selected" : "Use for Outreach"}
        </button>
        <button
          onClick={onDelete}
          title="Delete account"
          className="p-1.5 rounded-xs transition-all text-[#8A9590] hover:text-[#C75555] hover:bg-[#C75555]/10"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    emailAccounts,
    loading,
    selectedSendingEmail,
    fetchEmailAccounts,
    setSelectedSendingEmail,
    deleteEmailAccount,
  } = useSettingsStore();

  const { quota, quotaLoading, fetchQuota } = useHunterStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchEmailAccounts();
    fetchQuota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (email: string) => {
    setSelectedSendingEmail(email);
    toast.success(`${email} set as sending email`);
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm("Are you sure you want to delete this email account?")) {
      return;
    }
    const success = await deleteEmailAccount(email);
    if (success) {
      toast.success(`${email} deleted successfully`);
    } else {
      toast.error(`Failed to delete ${email}`);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A2E22]">Settings</h1>
          <p className="text-sm text-[#5A6B60] mt-1">
            Manage your email accounts and outreach preferences
          </p>
        </div>
      </div>

      {/* Email Accounts Section */}
      <div className="bg-white rounded-xs border border-[#E8E2D8] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE8E0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
              <Mail size={16} className="text-[#3D8B5E]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A2E22]">
                Instantly.ai Email Accounts
              </h2>
              <p className="text-[11px] text-[#6B7570] mt-0.5">
                Email accounts connected to your Instantly.ai workspace
              </p>
            </div>
          </div>
          <button
            onClick={fetchEmailAccounts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={12}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="p-5">
          {loading && emailAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2
                size={24}
                className="text-[#3D8B5E] animate-spin"
              />
              <p className="text-sm text-[#6B7570]">
                Loading email accounts from Instantly.ai...
              </p>
            </div>
          ) : emailAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F1EB] flex items-center justify-center">
                <Mail size={20} className="text-[#8A9590]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#1A2E22]">
                  No email accounts found
                </p>
                <p className="text-xs text-[#6B7570] mt-1 max-w-sm">
                  Add email accounts in your Instantly.ai dashboard first,
                  then refresh to see them here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Shield size={13} className="text-[#6B7570]" />
                <p className="text-[11px] text-[#6B7570]">
                  Select which email account to use when sending outreach
                  emails. Add new accounts in{" "}
                  <a
                    href="https://app.instantly.ai/app/accounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3D8B5E] hover:underline font-medium"
                  >
                    Instantly.ai
                  </a>
                  .
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emailAccounts.map((account) => (
                  <EmailAccountCard
                    key={account.email}
                    account={account}
                    isSelected={selectedSendingEmail === account.email}
                    onSelect={() => handleSelect(account.email)}
                    onDelete={() => handleDelete(account.email)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hunter.io Section */}
      <div className="bg-white rounded-xs border border-[#E8E2D8] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE8E0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
              <Users size={16} className="text-[#3D8B5E]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A2E22]">Hunter.io — Decision Maker Search</h2>
              <p className="text-[11px] text-[#6B7570] mt-0.5">
                Find named contacts (owners, office managers) for each dental practice
              </p>
            </div>
          </div>
          <button
            onClick={fetchQuota}
            disabled={quotaLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium border border-[#D8D2C8] text-[#5A6B60] hover:bg-[#F5F1EB] hover:border-[#CCC8C0] transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={quotaLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="p-5">
          {quotaLoading && !quota ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 size={20} className="animate-spin text-[#3D8B5E]" />
              <span className="text-sm text-[#6B7570]">Loading quota...</span>
            </div>
          ) : quota ? (
            <div className="space-y-4">
              {/* Plan badge */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3D8B5E] animate-pulse" />
                <span className="text-sm text-[#1A2E22] font-medium">Hunter.io</span>
                <span className="text-xs text-[#6B7570] bg-[#F5F1EB] px-2 py-0.5 rounded-xs capitalize">
                  {quota.plan} plan
                </span>
              </div>

              {/* Quota bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Searches */}
                <div className="bg-[#F5F1EB] rounded-xs p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={13} className="text-[#3D8B5E]" />
                    <span className="text-xs font-semibold text-[#1A2E22]">Domain Searches</span>
                  </div>
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-2xl font-bold text-[#1A2E22] tabular-nums">
                      {quota.searches.used}
                    </span>
                    <span className="text-xs text-[#6B7570] tabular-nums">
                      / {quota.searches.used + quota.searches.available} total
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3D8B5E] rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((quota.searches.used / (quota.searches.used + quota.searches.available || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#8A9590] mt-1 tabular-nums">
                    {quota.searches.available} remaining
                  </p>
                </div>

                {/* Verifications */}
                <div className="bg-[#F5F1EB] rounded-xs p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 size={13} className="text-[#3D8B5E]" />
                    <span className="text-xs font-semibold text-[#1A2E22]">Email Verifications</span>
                  </div>
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-2xl font-bold text-[#1A2E22] tabular-nums">
                      {quota.verifications.used}
                    </span>
                    <span className="text-xs text-[#6B7570] tabular-nums">
                      / {quota.verifications.used + quota.verifications.available} total
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3D8B5E] rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((quota.verifications.used / (quota.verifications.used + quota.verifications.available || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#8A9590] mt-1 tabular-nums">
                    {quota.verifications.available} remaining
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[#8A9590]">
                API key is configured server-side via the HUNTER_API_KEY environment variable.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#F5F1EB] flex items-center justify-center">
                <Users size={18} className="text-[#8A9590]" />
              </div>
              <p className="text-sm font-medium text-[#1A2E22]">Hunter.io not connected</p>
              <p className="text-xs text-[#6B7570] max-w-xs">
                Set the HUNTER_API_KEY environment variable on the server to enable decision-maker search.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* API Connection Info */}
      <div className="bg-white rounded-xs border border-[#E8E2D8] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EDE8E0]">
          <h2 className="text-sm font-bold text-[#1A2E22]">
            API Connection
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3D8B5E] animate-pulse" />
              <span className="text-sm text-[#1A2E22] font-medium">
                Instantly.ai
              </span>
            </div>
            <span className="text-xs text-[#6B7570] bg-[#F5F1EB] px-2 py-0.5 rounded-xs">
              Connected
            </span>
          </div>
          <p className="text-[11px] text-[#8A9590] mt-2">
            API key is configured server-side. To update, modify the
            INSTANTLY_API_KEY environment variable.
          </p>
        </div>
      </div>
    </div>
  );
}
