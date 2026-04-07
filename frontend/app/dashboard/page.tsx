"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { useLeadsStore } from "../store/leadsStore";
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
import { Search, FileText, Mail, CheckCircle, DollarSign, TrendingUp, MapPin, ChevronRight, BarChart3, Users, Settings } from "lucide-react";

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
      className={`bg-[#E8E2D8] rounded-xs animate-pulse ${className}`}
    />
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, statsLoading, fetchDashboardStats } = useLeadsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
        { name: "Discovered", value: stats.discovered, fill: "#A8D4B8" },
        { name: "Analyzed", value: stats.analyzed, fill: "#7BC095" },
        { name: "Qualified", value: stats.qualified, fill: "#3D8B5E" },
        { name: "Emailed", value: stats.emailSent, fill: "#2D7A4E" },
        { name: "Replied", value: stats.replied, fill: "#1E6B3E" },
        { name: "Converted", value: stats.converted, fill: "#155030" },
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
          <p className="text-sm font-medium text-[#8A9590] mb-1 tracking-wide">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">
            {getGreeting()}
            {user ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          {stats && stats.totalLeads > 0 && (
            <p className="text-sm text-[#8A9590] mt-1.5">
              You have{" "}
              <span className="font-semibold text-[#2A4A3A]">
                {stats.discovered} new leads
              </span>{" "}
              and{" "}
              <span className="font-semibold text-[#2A4A3A]">
                {stats.emailSent} emails
              </span>{" "}
              in the pipeline
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/dashboard/search"
            className="px-5 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:shadow-[#3D8B5E]/20 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#2A4A3A" }}
          >
            <span className="flex items-center gap-2">
              <Search size={16} strokeWidth={2.5} />
              Search Dentists
            </span>
          </Link>
          <Link
            href="/dashboard/leads"
            className="px-5 py-2.5 rounded-xs font-semibold text-[#5A6B60] text-sm border border-[#DDD8D0] bg-white transition-all duration-200 hover:shadow-md hover:border-[#CCC8C0] hover:scale-[1.02] active:scale-[0.98]"
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
        <div className="lg:col-span-2 bg-white rounded-xs p-6 border border-[#3D8B5E]/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-xs bg-[#3D8B5E] animate-[pulse_2s_ease-in-out_infinite]" />
                <span className="text-xs font-medium text-[#8A9590] uppercase tracking-wider">
                  Total Leads
                </span>
              </div>
              {statsLoading ? (
                <Skeleton className="w-28 h-12 mt-1" />
              ) : (
                <p className="text-4xl sm:text-5xl font-semibold text-[#1A2E22] tracking-tight tabular-nums">
                  {totalLeads}
                </p>
              )}
              {stats && stats.totalLeads > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-xs font-medium bg-[#3D8B5E]/10 text-[#2D7A4E]">
                    <TrendingUp size={12} strokeWidth={2.5} />
                    Active
                  </span>
                  <span className="text-xs text-[#8A9590]">
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
                          stopColor="#3D8B5E"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3D8B5E"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#2D7A4E"
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
        <div className="bg-white rounded-xs p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-[#8A9590]" />
            <span className="text-xs font-medium text-[#8A9590] uppercase tracking-wider">
              Revenue
            </span>
          </div>
          {statsLoading ? (
            <Skeleton className="w-24 h-10 mt-1" />
          ) : (
            <p className="text-3xl sm:text-4xl font-semibold text-[#1A2E22] tracking-tight tabular-nums">
              ${revenue.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-[#8A9590] mt-2">
            {stats?.converted ?? 0} clients &times; $199
          </p>
          <div className="mt-4 pt-4 border-t border-[#EDE8E0]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A9590]">Conversion</span>
              <span className="font-semibold text-[#1A2E22] tabular-nums">
                {conversionRate}%
              </span>
            </div>
            <div className="mt-1.5 w-full bg-[#E8E2D8] rounded-xs h-1.5 overflow-hidden">
              <div
                className="h-full rounded-xs bg-[#3D8B5E] transition-all duration-1000 ease-out"
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
            icon: <Search size={18} />,
          },
          {
            label: "Analyzed",
            value: useCountUp(stats?.analyzed ?? 0),
            icon: <FileText size={18} />,
          },
          {
            label: "Emails Sent",
            value: emailSent,
            icon: <Mail size={18} />,
          },
          {
            label: "Converted",
            value: converted,
            icon: <CheckCircle size={18} />,
          },
        ].map((card, idx) => (
          <div
            key={card.label}
            className="bg-white rounded-xs p-4 sm:p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 group"
            style={{
              transitionDelay: mounted ? `${idx * 50}ms` : "0ms",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xs flex items-center justify-center bg-[#3D8B5E]/10 text-[#5A6B60] transition-transform duration-200 group-hover:scale-110"
              >
                {card.icon}
              </div>
              <span className="text-[11px] font-medium text-[#8A9590] uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            {statsLoading ? (
              <Skeleton className="w-14 h-8" />
            ) : (
              <p className="text-2xl font-semibold text-[#1A2E22] tabular-nums">
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
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[#1A2E22]">
                Lead Pipeline
              </h2>
              <p className="text-xs text-[#8A9590] mt-0.5">
                Conversion funnel overview
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#F5F1EB] text-xs font-medium text-[#8A9590]">
              <div className="w-1.5 h-1.5 rounded-xs bg-[#3D8B5E]" />
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
                  tick={{ fontSize: 11, fill: "#8A9590" }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E8E2D8",
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
                <div className="w-12 h-12 rounded-xs bg-[#F5F1EB] flex items-center justify-center mx-auto mb-3">
                  <BarChart3 size={20} strokeWidth={1.5} className="text-[#B5AFA5]" />
                </div>
                <p className="text-sm text-[#8A9590]">No pipeline data yet</p>
                <Link
                  href="/dashboard/search"
                  className="text-xs font-semibold text-[#1A2E22] hover:underline mt-1 inline-block"
                >
                  Search dentists to start
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#1A2E22]">Top Cities</h2>
            <MapPin size={16} className="text-[#B5AFA5]" />
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
                      <span className="text-sm font-medium text-[#2A4A3A]">
                        {city.name}
                      </span>
                      <span className="text-sm font-semibold text-[#1A2E22] tabular-nums">
                        {city.leads}
                      </span>
                    </div>
                    <div className="w-full bg-[#EDE8E0] rounded-xs h-2 overflow-hidden">
                      <div
                        className="h-full rounded-xs transition-all duration-1000 ease-out"
                        style={{
                          width: `${(city.leads / maxLeads) * 100}%`,
                          backgroundColor:
                            idx === 0
                              ? "#3D8B5E"
                              : idx === 1
                                ? "#7BC095"
                                : idx === 2
                                  ? "#2D7A4E"
                                  : "#A8D4B8",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[160px]">
              <p className="text-sm text-[#8A9590] text-center">
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
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#1A2E22] mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              {
                label: "Search Dentists",
                desc: "Find new leads by city",
                href: "/dashboard/search",
                icon: <Search size={18} />,
                color: "#3D8B5E",
                iconColor: "text-white",
              },
              {
                label: "View All Leads",
                desc: "Manage your pipeline",
                href: "/dashboard/leads",
                icon: <Users size={18} />,
                color: "#F5F1EB",
                iconColor: "text-[#5A6B60]",
              },
              {
                label: "Settings",
                desc: "Configure your account",
                href: "/dashboard/settings",
                icon: <Settings size={18} />,
                color: "#F5F1EB",
                iconColor: "text-[#5A6B60]",
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3.5 px-3.5 py-3 rounded-xs hover:bg-[#F5F1EB] transition-all duration-200 group"
              >
                <div
                  className={`w-10 h-10 rounded-xs flex items-center justify-center ${action.iconColor} shrink-0 transition-transform duration-200 group-hover:scale-110`}
                  style={{ backgroundColor: action.color }}
                >
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1A2E22]">
                    {action.label}
                  </div>
                  <div className="text-xs text-[#8A9590]">{action.desc}</div>
                </div>
                <ChevronRight
                  size={16}
                  className="ml-auto text-[#B5AFA5] group-hover:text-[#8A9590] transition-colors shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Pipeline Stages Detail */}
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[#1A2E22]">
                Pipeline Breakdown
              </h2>
              <p className="text-xs text-[#8A9590] mt-0.5">
                Leads by current status
              </p>
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[140px]" />
          ) : stats && stats.totalLeads > 0 ? (
            <>
              {/* Segmented progress bar */}
              <div className="flex rounded-xs overflow-hidden h-3 mb-5 bg-[#F5F1EB]">
                {[
                  { key: "discovered", value: stats.discovered, color: "#A8D4B8", label: "Discovered" },
                  { key: "analyzed", value: stats.analyzed, color: "#7BC095", label: "Analyzed" },
                  { key: "qualified", value: stats.qualified, color: "#3D8B5E", label: "Qualified" },
                  { key: "emailSent", value: stats.emailSent, color: "#2D7A4E", label: "Emailed" },
                  { key: "replied", value: stats.replied, color: "#1E6B3E", label: "Replied" },
                  { key: "converted", value: stats.converted, color: "#155030", label: "Converted" },
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
                  { label: "Discovered", value: stats.discovered, color: "#A8D4B8" },
                  { label: "Analyzed", value: stats.analyzed, color: "#7BC095" },
                  { label: "Qualified", value: stats.qualified, color: "#3D8B5E" },
                  { label: "Emailed", value: stats.emailSent, color: "#2D7A4E" },
                  { label: "Replied", value: stats.replied, color: "#1E6B3E" },
                  { label: "Converted", value: stats.converted, color: "#155030" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className="w-2.5 h-2.5 rounded-xs mx-auto mb-1.5"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-lg font-semibold text-[#1A2E22] tabular-nums">
                      {item.value}
                    </p>
                    <p className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mt-0.5">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[140px] flex items-center justify-center">
              <p className="text-sm text-[#8A9590]">
                Your pipeline will show here after searching for leads
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
