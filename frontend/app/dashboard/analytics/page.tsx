"use client";

import { useEffect, useState, useRef } from "react";
import { MapPin, Calendar, TrendingUp, Users, Mail, Zap } from "lucide-react";
import { useLeadsStore } from "../../store/leadsStore";
import { useEmailOutreachStore } from "../../store/emailOutreachStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Preset = "today" | "7d" | "30d" | "90d" | "all" | "custom";

const PRESETS: { label: string; value: Preset }[] = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "All Time", value: "all" },
  { label: "Custom", value: "custom" },
];

function getPresetDates(preset: Preset): { start: string; end: string } | null {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (preset === "all") return null;
  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const duration = 900;
    const startTime = performance.now();
    const startVal = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + eased * (target - startVal)));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return <>{value}{suffix}</>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#E8E2D8] rounded-xs animate-pulse ${className}`} />;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-xs px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-[#1A2E22] mb-0.5">{label}</p>
        <p className="text-[#3D8B5E] font-bold text-sm">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-xs px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-[#1A2E22] capitalize">{payload[0].name}</p>
        <p className="text-[#3D8B5E] font-bold">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { stats, statsLoading, fetchDashboardStats } = useLeadsStore();
  const { outreachStats, fetchOutreachStats } = useEmailOutreachStore();
  const [mounted, setMounted] = useState(false);
  const [preset, setPreset] = useState<Preset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const loadStats = (p: Preset, cStart?: string, cEnd?: string) => {
    if (p === "custom") {
      const s = cStart ?? customStart;
      const e = cEnd ?? customEnd;
      if (s && e) {
        const end = new Date(e);
        end.setHours(23, 59, 59, 999);
        fetchDashboardStats(new Date(s).toISOString(), end.toISOString());
      }
    } else {
      const range = getPresetDates(p);
      if (range) fetchDashboardStats(range.start, range.end);
      else fetchDashboardStats();
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchOutreachStats();
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handlePreset = (p: Preset) => {
    setPreset(p);
    setShowCustom(p === "custom");
    if (p !== "custom") loadStats(p);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) loadStats("custom", customStart, customEnd);
  };

  const funnelData = stats
    ? [
        { name: "Discovered", value: stats.discovered },
        { name: "Analyzed", value: stats.analyzed },
        { name: "Qualified", value: stats.qualified },
        { name: "Emailed", value: outreachStats?.totalSent ?? stats.emailSent },
        { name: "Replied", value: outreachStats?.replied ?? stats.replied },
        { name: "Converted", value: stats.converted },
      ]
    : [];

  const categoryData = stats?.categories
    ? [
        { name: "Hot", value: stats.categories.hot, color: "#C75555" },
        { name: "Warm", value: stats.categories.warm, color: "#C47A4A" },
        { name: "Cool", value: stats.categories.cool, color: "#3D8B5E" },
        { name: "Skip", value: stats.categories.skip, color: "#B5AFA5" },
      ].filter((d) => d.value > 0)
    : [];

  const funnelColors = ["#A8D4B8", "#7BC095", "#3D8B5E", "#2D7A4E", "#1E6B3E", "#155030"];

  const emailTotal = outreachStats?.totalSent ?? (stats?.emailSent ?? 0);
  const conversionRate = emailTotal > 0
    ? parseFloat(((stats?.converted ?? 0) / emailTotal * 100).toFixed(1))
    : 0;

  const replyRate = outreachStats && outreachStats.totalSent > 0
    ? parseFloat(((outreachStats.replied / outreachStats.totalSent) * 100).toFixed(1))
    : stats && stats.emailSent > 0
      ? parseFloat(((stats.replied / stats.emailSent) * 100).toFixed(1))
      : 0;

  const qualifyRate = stats && stats.totalLeads > 0
    ? parseFloat(((stats.qualified / stats.totalLeads) * 100).toFixed(1))
    : 0;

  const activePresetLabel = PRESETS.find((p) => p.value === preset)?.label ?? "All Time";

  const metricCards = [
    {
      label: "Total Leads",
      value: stats?.totalLeads ?? 0,
      suffix: "",
      icon: <Users size={16} />,
      accent: "#3D8B5E",
      bg: "bg-[#3D8B5E]/10",
    },
    {
      label: "Qualify Rate",
      value: qualifyRate,
      suffix: "%",
      icon: <TrendingUp size={16} />,
      accent: "#2D7A4E",
      bg: "bg-[#2D7A4E]/10",
    },
    {
      label: "Reply Rate",
      value: replyRate,
      suffix: "%",
      icon: <Mail size={16} />,
      accent: "#C47A4A",
      bg: "bg-[#C47A4A]/10",
    },
    {
      label: "Conversion Rate",
      value: conversionRate,
      suffix: "%",
      icon: <Zap size={16} />,
      accent: "#155030",
      bg: "bg-[#155030]/10",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* Header */}
      <div className={`mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">Analytics</h1>
          <p className="text-sm text-[#8A9590] mt-1">Track your lead generation performance</p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center gap-1 bg-white border border-[#E8E2D8] rounded-xs p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-x-auto max-w-full">
            <Calendar size={14} className="text-[#8A9590] ml-2 mr-1 shrink-0" />
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePreset(p.value)}
                className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-all duration-150 ${
                  preset === p.value
                    ? "bg-[#2A4A3A] text-white shadow-sm"
                    : "text-[#5A6B60] hover:bg-[#F5F1EB] hover:text-[#1A2E22]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {showCustom && (
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 bg-white border border-[#E8E2D8] rounded-xs px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                  className="text-xs text-[#1A2E22] bg-[#FAF8F5] border border-[#DDD8D0] rounded-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#3D8B5E]" />
                <span className="text-xs text-[#8A9590]">to</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                  className="text-xs text-[#1A2E22] bg-[#FAF8F5] border border-[#DDD8D0] rounded-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#3D8B5E]" />
              </div>
              <button onClick={handleCustomApply} disabled={!customStart || !customEnd}
                className="px-3 py-1 bg-[#2A4A3A] text-white text-xs font-medium rounded-xs disabled:opacity-40 hover:bg-[#3D8B5E] transition-colors shrink-0">
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        {metricCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xs border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="h-0.5 w-full" style={{ backgroundColor: card.accent }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-[#8A9590] uppercase tracking-wider">{card.label}</span>
                <div className={`${card.bg} p-1.5 rounded-xs`} style={{ color: card.accent }}>
                  {card.icon}
                </div>
              </div>
              {statsLoading ? (
                <Skeleton className="w-20 h-8" />
              ) : (
                <p className="text-2xl font-bold text-[#1A2E22] tabular-nums">
                  <AnimatedCounter target={card.value} suffix={card.suffix} />
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Area Chart + Donut */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[#1A2E22]">Conversion Funnel</h2>
              <p className="text-xs text-[#8A9590] mt-0.5">Leads through each pipeline stage</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#FAF8F5] text-xs font-medium text-[#8A9590]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3D8B5E]" />
              {activePresetLabel}
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[240px]" />
          ) : stats && stats.totalLeads > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3D8B5E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3D8B5E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8A9590" }}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3D8B5E"
                  strokeWidth={2.5}
                  fill="url(#funnelGradient)"
                  dot={{ fill: "#3D8B5E", strokeWidth: 2, r: 4, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#3D8B5E", stroke: "#fff", strokeWidth: 2 }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center">
              <p className="text-sm text-[#8A9590]">No data yet. Search for dentists to start.</p>
            </div>
          )}
        </div>

        {/* Donut — Lead Categories */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#1A2E22] mb-1">Lead Categories</h2>
          <p className="text-xs text-[#8A9590] mb-4">Distribution by quality tier</p>
          {statsLoading ? (
            <div className="flex items-center justify-center h-[240px]">
              <Skeleton className="w-40 h-40 rounded-full" />
            </div>
          ) : categoryData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <defs>
                    {categoryData.map((entry) => (
                      <radialGradient key={entry.name} id={`grad-${entry.name}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.75} />
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                    strokeWidth={0}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={`url(#grad-${entry.name})`} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-1">
                {categoryData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-[#5A6B60]">{entry.name}</span>
                    <span className="text-xs font-semibold text-[#1A2E22] ml-auto tabular-nums">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center">
              <p className="text-sm text-[#8A9590] text-center">No category data</p>
            </div>
          )}
        </div>
      </div>

      {/* Stage Breakdown + Revenue + Top Cities */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-500 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

        {/* Stage Breakdown */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#1A2E22] mb-5">Stage Breakdown</h2>
          {statsLoading ? (
            <div className="space-y-4">{[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="w-full h-6" />)}</div>
          ) : stats && stats.totalLeads > 0 ? (
            <div className="space-y-4">
              {[
                { label: "Discovered", value: stats.discovered, color: funnelColors[0] },
                { label: "Analyzed",   value: stats.analyzed,   color: funnelColors[1] },
                { label: "Qualified",  value: stats.qualified,  color: funnelColors[2] },
                { label: "Emailed",    value: outreachStats?.totalSent ?? stats.emailSent,  color: funnelColors[3] },
                { label: "Replied",    value: outreachStats?.replied ?? stats.replied,    color: funnelColors[4] },
                { label: "Converted",  value: stats.converted,  color: funnelColors[5] },
              ].map((stage) => {
                const pct = stats.totalLeads > 0 ? (stage.value / stats.totalLeads) * 100 : 0;
                return (
                  <div key={stage.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-xs font-medium text-[#5A6B60]">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#B5AFA5] tabular-nums">{pct.toFixed(0)}%</span>
                        <span className="text-xs font-bold text-[#1A2E22] tabular-nums w-8 text-right">{stage.value}</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#F0EDE8] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: stage.color, minWidth: stage.value > 0 ? "4px" : "0" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[180px]">
              <p className="text-sm text-[#8A9590] text-center">No pipeline data</p>
            </div>
          )}
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#1A2E22] mb-5">Revenue</h2>
          {statsLoading ? (
            <Skeleton className="w-full h-[160px]" />
          ) : (
            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-medium text-[#8A9590] uppercase tracking-wider mb-1">Total Revenue</div>
                <p className="text-3xl font-bold text-[#1A2E22] tabular-nums">
                  $<AnimatedCounter target={stats?.revenue ?? 0} />
                </p>
                <p className="text-xs text-[#8A9590] mt-1">{stats?.converted ?? 0} clients × $199/year</p>
              </div>
              <div className="border-t border-[#EDE8E0] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mb-1">Proj. MRR</div>
                  <p className="text-lg font-bold text-[#1A2E22] tabular-nums">
                    $<AnimatedCounter target={(stats?.converted ?? 0) * 29} />
                  </p>
                  <p className="text-xs text-[#8A9590]">@ $29/mo</p>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mb-1">Proj. ARR</div>
                  <p className="text-lg font-bold text-[#1A2E22] tabular-nums">
                    $<AnimatedCounter target={(stats?.converted ?? 0) * 29 * 12} />
                  </p>
                  <p className="text-xs text-[#8A9590]">Annual recurring</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#1A2E22]">Top Cities</h2>
            <MapPin size={15} className="text-[#8A9590]" />
          </div>
          {statsLoading ? (
            <div className="space-y-4">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="w-full h-8" />)}</div>
          ) : stats?.topCities && stats.topCities.length > 0 ? (
            <div className="space-y-4">
              {stats.topCities.map((city, idx) => {
                const max = stats.topCities[0]?.count ?? 1;
                const pct = (city.count / max) * 100;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#B5AFA5] tabular-nums w-4">#{idx + 1}</span>
                        <span className="text-xs font-medium text-[#2A4A3A]">{city.city}</span>
                      </div>
                      <span className="text-xs font-bold text-[#1A2E22] tabular-nums">{city.count}</span>
                    </div>
                    <div className="w-full bg-[#F0EDE8] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: funnelColors[Math.min(idx, funnelColors.length - 1)] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[140px]">
              <p className="text-sm text-[#8A9590]">Search different cities to see data</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
