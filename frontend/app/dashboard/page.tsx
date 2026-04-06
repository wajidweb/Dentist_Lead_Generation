"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchDashboardStats } from "../store/slices/leadsSlice";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = ref.current;
    const diff = target - start;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = target;
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

/* ─── Greeting based on time ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Skeleton block ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-100 rounded-xs animate-pulse ${className}`}
    />
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { stats, statsLoading } = useAppSelector((s) => s.leads);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [dispatch]);

  const totalLeads = useCountUp(stats?.totalLeads ?? 0);
  const discovered = useCountUp(stats?.discovered ?? 0);
  const emailSent = useCountUp(stats?.emailSent ?? 0);
  const converted = useCountUp(stats?.converted ?? 0);
  const revenue = useCountUp(stats?.revenue ?? 0);

  const conversionRate =
    stats && stats.emailSent > 0
      ? ((stats.converted / stats.emailSent) * 100).toFixed(1)
      : "0";

  /* ─── Pipeline funnel data for bar chart ─── */
  const funnelData = stats
    ? [
        { name: "Discovered", value: stats.discovered, fill: "#d1ff8f" },
        { name: "Analyzed", value: stats.analyzed, fill: "#b8f26d" },
        { name: "Qualified", value: stats.qualified, fill: "#94e640" },
        { name: "Emailed", value: stats.emailSent, fill: "#6fd420" },
        { name: "Replied", value: stats.replied, fill: "#4caf0f" },
        { name: "Converted", value: stats.converted, fill: "#2e8b05" },
      ]
    : [];

  /* ─── Fake sparkline data (will be replaced with real data in Phase 5) ─── */
  const sparkData = Array.from({ length: 7 }, (_, i) => ({
    d: i,
    v: Math.max(0, (stats?.totalLeads ?? 0) * (0.3 + Math.random() * 0.7) * ((i + 1) / 7)),
  }));

  /* ─── Top cities bar data ─── */
  const citiesData = (stats?.topCities ?? []).map((c) => ({
    name: c.city,
    leads: c.count,
  }));

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ── Greeting Row ── */}
      <div
        className={`mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1 tracking-wide">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-gray-900 tracking-tight">
            {getGreeting()}
            {user ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          {stats && stats.totalLeads > 0 && (
            <p className="text-sm text-gray-500 mt-1.5">
              You have{" "}
              <span className="font-semibold text-gray-800">
                {stats.discovered} new leads
              </span>{" "}
              and{" "}
              <span className="font-semibold text-gray-800">
                {stats.emailSent} emails
              </span>{" "}
              in the pipeline
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/dashboard/search"
            className="px-5 py-2.5 rounded-xs font-semibold text-black text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#d1ff8f" }}
          >
            <span className="flex items-center gap-2">
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
              Search Dentists
            </span>
          </Link>
          <Link
            href="/dashboard/leads"
            className="px-5 py-2.5 rounded-xs font-semibold text-gray-700 text-sm border border-gray-200 bg-white transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            View Leads
          </Link>
        </div>
      </div>

      {/* ── Hero Card + Revenue ── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 transition-all duration-500 delay-75 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Hero - Total Leads with sparkline */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#d1ff8f]/15 via-white to-white rounded-xs p-6 border border-[#d1ff8f]/30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-xs bg-[#6fd420] animate-[pulse_2s_ease-in-out_infinite]" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Leads
                </span>
              </div>
              {statsLoading ? (
                <Skeleton className="w-28 h-12 mt-1" />
              ) : (
                <p className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight tabular-nums">
                  {totalLeads}
                </p>
              )}
              {stats && stats.totalLeads > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-xs font-medium bg-emerald-50 text-emerald-700">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    Active
                  </span>
                  <span className="text-xs text-gray-400">
                    across {stats.topCities?.length ?? 0} cities
                  </span>
                </div>
              )}
            </div>
            <div className="w-[140px] h-[60px] opacity-80">
              {!statsLoading && stats && stats.totalLeads > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient
                        id="sparkGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#d1ff8f"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="#d1ff8f"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#6fd420"
                      strokeWidth={2}
                      fill="url(#sparkGrad)"
                      isAnimationActive={true}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-xs p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </span>
          </div>
          {statsLoading ? (
            <Skeleton className="w-24 h-10 mt-1" />
          ) : (
            <p className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight tabular-nums">
              ${revenue.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {stats?.converted ?? 0} clients &times; $199
          </p>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Conversion</span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {conversionRate}%
              </span>
            </div>
            <div className="mt-1.5 w-full bg-gray-100 rounded-xs h-1.5 overflow-hidden">
              <div
                className="h-full rounded-xs bg-[#6fd420] transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Metric Cards Row ── */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 transition-all duration-500 delay-150 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {[
          {
            label: "Discovered",
            value: discovered,
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            ),
          },
          {
            label: "Analyzed",
            value: useCountUp(stats?.analyzed ?? 0),
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ),
          },
          {
            label: "Emails Sent",
            value: emailSent,
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            ),
          },
          {
            label: "Converted",
            value: converted,
            icon: (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
          },
        ].map((card, idx) => (
          <div
            key={card.label}
            className="bg-white rounded-xs p-4 sm:p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 group"
            style={{
              transitionDelay: mounted ? `${idx * 50}ms` : "0ms",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xs flex items-center justify-center bg-[#d1ff8f]/20 text-gray-700 transition-transform duration-200 group-hover:scale-110"
              >
                {card.icon}
              </div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            {statsLoading ? (
              <Skeleton className="w-14 h-8" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                {card.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts Row (2/3 + 1/3) ── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 transition-all duration-500 delay-200 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Funnel Chart */}
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Lead Pipeline
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Conversion funnel overview
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-gray-50 text-xs font-medium text-gray-500">
              <div className="w-1.5 h-1.5 rounded-xs bg-[#6fd420]" />
              All time
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[200px]" />
          ) : stats && stats.totalLeads > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={funnelData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #f0f0f0",
                    borderRadius: "2px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    padding: "8px 12px",
                    fontSize: "13px",
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.02)" }}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]} animationDuration={1000}>
                  {funnelData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xs bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-gray-300"
                  >
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No pipeline data yet</p>
                <Link
                  href="/dashboard/search"
                  className="text-xs font-semibold text-gray-900 hover:underline mt-1 inline-block"
                >
                  Search dentists to start
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Top Cities</h2>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-300"
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7.5L12 22l3-5.5c2-2 4-4.5 4-7.5a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-8" />
              ))}
            </div>
          ) : citiesData.length > 0 ? (
            <div className="space-y-3.5">
              {citiesData.map((city, idx) => {
                const maxLeads = citiesData[0]?.leads ?? 1;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">
                        {city.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {city.leads}
                      </span>
                    </div>
                    <div className="w-full bg-gray-50 rounded-xs h-2 overflow-hidden">
                      <div
                        className="h-full rounded-xs transition-all duration-1000 ease-out"
                        style={{
                          width: `${(city.leads / maxLeads) * 100}%`,
                          backgroundColor:
                            idx === 0
                              ? "#d1ff8f"
                              : idx === 1
                                ? "#b8f26d"
                                : idx === 2
                                  ? "#94e640"
                                  : "#c4e8a8",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[160px]">
              <p className="text-sm text-gray-400 text-center">
                Search different cities to see data here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Quick Actions + Pipeline Status ── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-500 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Quick Actions */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              {
                label: "Search Dentists",
                desc: "Find new leads by city",
                href: "/dashboard/search",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ),
                color: "#d1ff8f",
              },
              {
                label: "View All Leads",
                desc: "Manage your pipeline",
                href: "/dashboard/leads",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                color: "#f3f4f6",
              },
              {
                label: "Settings",
                desc: "Configure your account",
                href: "/dashboard/settings",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                color: "#f3f4f6",
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3.5 px-3.5 py-3 rounded-xs hover:bg-gray-50 transition-all duration-200 group"
              >
                <div
                  className="w-10 h-10 rounded-xs flex items-center justify-center text-gray-700 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: action.color }}
                >
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-400">{action.desc}</div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="ml-auto text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Pipeline Stages Detail */}
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Pipeline Breakdown
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Leads by current status
              </p>
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[140px]" />
          ) : stats && stats.totalLeads > 0 ? (
            <>
              {/* Segmented progress bar */}
              <div className="flex rounded-xs overflow-hidden h-3 mb-5 bg-gray-50">
                {[
                  { key: "discovered", value: stats.discovered, color: "#d1ff8f", label: "Discovered" },
                  { key: "analyzed", value: stats.analyzed, color: "#b8f26d", label: "Analyzed" },
                  { key: "qualified", value: stats.qualified, color: "#94e640", label: "Qualified" },
                  { key: "emailSent", value: stats.emailSent, color: "#6fd420", label: "Emailed" },
                  { key: "replied", value: stats.replied, color: "#4caf0f", label: "Replied" },
                  { key: "converted", value: stats.converted, color: "#2e8b05", label: "Converted" },
                ].map((seg) => (
                  <div
                    key={seg.key}
                    className="h-full transition-all duration-1000 ease-out first:rounded-l-lg last:rounded-r-lg"
                    style={{
                      width: `${(seg.value / stats.totalLeads) * 100}%`,
                      backgroundColor: seg.color,
                      minWidth: seg.value > 0 ? "4px" : "0",
                    }}
                    title={`${seg.label}: ${seg.value}`}
                  />
                ))}
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: "Discovered", value: stats.discovered, color: "#d1ff8f" },
                  { label: "Analyzed", value: stats.analyzed, color: "#b8f26d" },
                  { label: "Qualified", value: stats.qualified, color: "#94e640" },
                  { label: "Emailed", value: stats.emailSent, color: "#6fd420" },
                  { label: "Replied", value: stats.replied, color: "#4caf0f" },
                  { label: "Converted", value: stats.converted, color: "#2e8b05" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className="w-2.5 h-2.5 rounded-xs mx-auto mb-1.5"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-lg font-semibold text-gray-900 tabular-nums">
                      {item.value}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[140px] flex items-center justify-center">
              <p className="text-sm text-gray-400">
                Your pipeline will show here after searching for leads
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
