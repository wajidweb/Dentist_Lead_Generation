"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { useLeadsStore } from "../store/leadsStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Search,
  FileText,
  Mail,
  CheckCircle,
  DollarSign,
  TrendingUp,
  MapPin,
  ChevronRight,
  BarChart3,
  Users,
  Settings,
  Activity,
  Target,
  Zap,
} from "lucide-react";

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

/* ─── Greeting ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Skeleton ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#E8E2D8] rounded-xs animate-pulse ${className}`} />;
}

/* ─── Custom Tooltips ─── */
function DarkTooltip({ active, payload, totalLeads }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }>; totalLeads: number }) {
  if (!active || !payload?.[0]) return null;
  const { name, value } = payload[0].payload;
  const pct = totalLeads > 0 ? ((value / totalLeads) * 100).toFixed(1) : "0";
  return (
    <div className="bg-[#1A2E22] text-white px-3.5 py-2.5 rounded-xs shadow-xl text-xs border border-[#2A4A3A]">
      <p className="font-bold mb-0.5">{name}</p>
      <p className="tabular-nums text-[#A8D4B8]">{value} leads <span className="text-white/50">({pct}%)</span></p>
    </div>
  );
}

function CityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; leads: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const { name, leads } = payload[0].payload;
  return (
    <div className="bg-[#1A2E22] text-white px-3.5 py-2.5 rounded-xs shadow-xl text-xs border border-[#2A4A3A]">
      <p className="font-bold mb-0.5">{name}</p>
      <p className="tabular-nums text-[#A8D4B8]">{leads} leads</p>
    </div>
  );
}

/* ─── Pipeline colors ─── */
const PIPELINE_COLORS = [
  { key: "discovered", label: "Discovered", color: "#A8D4B8" },
  { key: "analyzed", label: "Analyzed", color: "#7BC095" },
  { key: "qualified", label: "Qualified", color: "#3D8B5E" },
  { key: "emailed", label: "Emailed", color: "#2D7A4E" },
  { key: "replied", label: "Replied", color: "#1E6B3E" },
  { key: "converted", label: "Converted", color: "#155030" },
];

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

  const conversionNum = Number(conversionRate);

  /* ─── Funnel data ─── */
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

  /* ─── Donut data ─── */
  const donutData = stats
    ? [
        { name: "Discovered", value: stats.discovered, color: "#A8D4B8" },
        { name: "Analyzed", value: stats.analyzed, color: "#7BC095" },
        { name: "Qualified", value: stats.qualified, color: "#3D8B5E" },
        { name: "Emailed", value: stats.emailSent, color: "#2D7A4E" },
        { name: "Replied", value: stats.replied, color: "#1E6B3E" },
        { name: "Converted", value: stats.converted, color: "#155030" },
      ].filter((d) => d.value > 0)
    : [];

  /* ─── Radial gauge data ─── */
  const gaugeData = [{ value: conversionNum, fill: "#3D8B5E" }];

  /* ─── Sparkline data ─── */
  const sparkData = stats
    ? [
        { d: "Mon", v: stats.discovered * 0.4 },
        { d: "Tue", v: stats.discovered * 0.55 },
        { d: "Wed", v: stats.discovered * 0.7 },
        { d: "Thu", v: stats.discovered * 0.6 },
        { d: "Fri", v: stats.discovered * 0.85 },
        { d: "Sat", v: stats.discovered * 0.75 },
        { d: "Sun", v: stats.totalLeads * 0.9 },
      ]
    : [];

  /* ─── Cities ─── */
  const citiesData = (stats?.topCities ?? []).map((c) => ({
    name: c.city,
    leads: c.count,
  }));

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ── Greeting ── */}
      <div
        className={`mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <div>
          <p className="text-sm font-medium text-[#6B7570] mb-1 tracking-wide">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1A2E22] tracking-tight">
            {getGreeting()}{user ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/dashboard/search"
            className="px-5 py-2.5 rounded-xs font-semibold text-white text-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            style={{ backgroundColor: "#2A4A3A" }}
          >
            <Search size={16} strokeWidth={2.5} />
            Search Dentists
          </Link>
          <Link
            href="/dashboard/leads"
            className="px-5 py-2.5 rounded-xs font-semibold text-[#3D5347] text-sm border border-[#D8D2C8] bg-white hover:shadow-md hover:border-[#CCC8C0] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            View Leads
          </Link>
        </div>
      </div>

      {/* ── KPI Cards + Sparkline ── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 transition-all duration-500 delay-75 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Total Leads with sparkline */}
        <div className="bg-white rounded-xs p-5 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
              <Users size={18} className="text-[#3D8B5E]" />
            </div>
            <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">Total Leads</span>
          </div>
          {statsLoading ? (
            <Skeleton className="w-20 h-9" />
          ) : (
            <p className="text-3xl font-bold text-[#1A2E22] tabular-nums mb-2">{totalLeads}</p>
          )}
          <div className="h-[40px] -mx-1">
            {!statsLoading && stats && stats.totalLeads > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3D8B5E" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3D8B5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#3D8B5E" strokeWidth={2} fill="url(#sparkGrad)" dot={false} isAnimationActive animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xs p-5 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#C47A4A]/10 flex items-center justify-center">
              <DollarSign size={18} className="text-[#C47A4A]" />
            </div>
            <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">Revenue</span>
          </div>
          {statsLoading ? (
            <Skeleton className="w-24 h-9" />
          ) : (
            <p className="text-3xl font-bold text-[#1A2E22] tabular-nums">${revenue.toLocaleString()}</p>
          )}
          <p className="text-[11px] text-[#8A9590] mt-1.5">{stats?.converted ?? 0} clients &times; $199</p>
        </div>

        {/* Emails Sent */}
        <div className="bg-white rounded-xs p-5 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
              <Mail size={18} className="text-[#3D8B5E]" />
            </div>
            <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">Emails Sent</span>
          </div>
          {statsLoading ? (
            <Skeleton className="w-16 h-9" />
          ) : (
            <p className="text-3xl font-bold text-[#1A2E22] tabular-nums">{emailSent}</p>
          )}
          <p className="text-[11px] text-[#8A9590] mt-1.5">{stats?.replied ?? 0} replied</p>
        </div>

        {/* Conversion Rate Gauge */}
        <div className="bg-white rounded-xs p-5 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="w-10 h-10 rounded-full bg-[#3D8B5E]/10 flex items-center justify-center">
              <Target size={18} className="text-[#3D8B5E]" />
            </div>
            <span className="text-[10px] font-semibold text-[#6B7570] uppercase tracking-wider">Conversion</span>
          </div>
          <div className="flex items-center gap-3">
            {statsLoading ? (
              <Skeleton className="w-16 h-9" />
            ) : (
              <p className="text-3xl font-bold text-[#1A2E22] tabular-nums">{conversionRate}%</p>
            )}
            <div className="w-[56px] h-[56px] -my-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={gaugeData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: "#EDE8E0" }}
                    isAnimationActive
                    animationDuration={1200}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-[11px] text-[#8A9590] mt-0.5">{converted} of {emailSent} emailed</p>
        </div>
      </div>

      {/* ── Pipeline Funnel + Donut ── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 transition-all duration-500 delay-150 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Funnel Chart */}
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#1A2E22]">Lead Pipeline</h2>
              <p className="text-[11px] text-[#6B7570] mt-0.5">Conversion funnel overview</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#F5F1EB] text-[11px] font-semibold text-[#6B7570]">
              <Activity size={12} />
              All time
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[240px]" />
          ) : stats && stats.totalLeads > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={funnelData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} barCategoryGap="18%">
                  <defs>
                    {funnelData.map((entry, i) => (
                      <linearGradient key={i} id={`funnel-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.fill} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7570", fontWeight: 500 }} dy={8} />
                  <YAxis hide />
                  <Tooltip content={<DarkTooltip totalLeads={stats.totalLeads} />} cursor={{ fill: "rgba(61,139,94,0.05)" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={`url(#funnel-${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-[#EDE8E0]">
                {PIPELINE_COLORS.map((p) => (
                  <div key={p.key} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[11px] text-[#6B7570] font-medium">{p.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#F5F1EB] flex items-center justify-center mx-auto mb-3">
                  <BarChart3 size={22} strokeWidth={1.5} className="text-[#8A9590]" />
                </div>
                <p className="text-sm font-medium text-[#6B7570]">No pipeline data yet</p>
                <Link href="/dashboard/search" className="text-xs font-bold text-[#3D8B5E] hover:underline mt-1 inline-block">
                  Search dentists to start
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#1A2E22]">Distribution</h2>
              <p className="text-[11px] text-[#6B7570] mt-0.5">Pipeline breakdown</p>
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[200px]" />
          ) : donutData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative w-[180px] h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      isAnimationActive
                      animationDuration={1200}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#1A2E22] text-white px-3 py-2 rounded-xs shadow-xl text-xs border border-[#2A4A3A]">
                            <p className="font-bold">{d.name}</p>
                            <p className="tabular-nums text-[#A8D4B8]">{d.value} leads</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-[#1A2E22] tabular-nums">{stats?.totalLeads ?? 0}</p>
                  <p className="text-[10px] font-semibold text-[#8A9590] uppercase tracking-wider">Total</p>
                </div>
              </div>
              {/* Donut legend */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 w-full">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] text-[#6B7570]">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1A2E22] tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-[#8A9590] text-center">Search leads to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Cities + Quick Actions ── */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-500 delay-200 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Top Cities Chart */}
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#1A2E22]">Top Cities</h2>
              <p className="text-[11px] text-[#6B7570] mt-0.5">Leads by location</p>
            </div>
            <MapPin size={16} className="text-[#8A9590]" />
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[220px]" />
          ) : citiesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={citiesData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3D8B5E" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3D8B5E" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7570", fontWeight: 500 }} dy={8} />
                <YAxis hide />
                <Tooltip content={<CityTooltip />} cursor={{ fill: "rgba(61,139,94,0.05)" }} />
                <Bar dataKey="leads" radius={[6, 6, 0, 0]} fill="url(#cityGrad)" animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-[#8A9590] text-center">Search different cities to see data here</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#D8D2C8] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <h2 className="text-sm font-bold text-[#1A2E22] mb-4">Quick Actions</h2>
          <div className="space-y-1.5">
            {[
              {
                label: "Search Dentists",
                desc: "Find new leads by city",
                href: "/dashboard/search",
                icon: <Search size={18} />,
                iconBg: "bg-[#2A4A3A]",
                iconColor: "text-white",
              },
              {
                label: "View All Leads",
                desc: "Manage your pipeline",
                href: "/dashboard/leads",
                icon: <Users size={18} />,
                iconBg: "bg-[#3D8B5E]/10",
                iconColor: "text-[#3D8B5E]",
              },
              {
                label: "Analytics",
                desc: "Track performance",
                href: "/dashboard/analytics",
                icon: <TrendingUp size={18} />,
                iconBg: "bg-[#C47A4A]/10",
                iconColor: "text-[#C47A4A]",
              },
              {
                label: "Settings",
                desc: "Configure your account",
                href: "/dashboard/settings",
                icon: <Settings size={18} />,
                iconBg: "bg-[#F5F1EB]",
                iconColor: "text-[#6B7570]",
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3.5 px-3 py-3 rounded-xs hover:bg-[#F5F1EB] transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-xs flex items-center justify-center ${action.iconBg} ${action.iconColor} shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                  {action.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#1A2E22]">{action.label}</div>
                  <div className="text-[11px] text-[#8A9590]">{action.desc}</div>
                </div>
                <ChevronRight size={16} className="text-[#D8D2C8] group-hover:text-[#8A9590] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
