"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useLeadsStore } from "../../store/leadsStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const { stats, statsLoading, fetchDashboardStats } = useLeadsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const funnelData = stats
    ? [
        { name: "Discovered", value: stats.discovered },
        { name: "Analyzed", value: stats.analyzed },
        { name: "Qualified", value: stats.qualified },
        { name: "Emailed", value: stats.emailSent },
        { name: "Replied", value: stats.replied },
        { name: "Converted", value: stats.converted },
      ]
    : [];

  const funnelColors = ["#A8D4B8", "#7BC095", "#3D8B5E", "#2D7A4E", "#1E6B3E", "#155030"];

  const conversionRate =
    stats && stats.emailSent > 0
      ? ((stats.converted / stats.emailSent) * 100).toFixed(1)
      : "0.0";

  const replyRate =
    stats && stats.emailSent > 0
      ? ((stats.replied / stats.emailSent) * 100).toFixed(1)
      : "0.0";

  const qualifyRate =
    stats && stats.totalLeads > 0
      ? ((stats.qualified / stats.totalLeads) * 100).toFixed(1)
      : "0.0";

  function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`bg-[#E8E2D8] rounded-xs animate-pulse ${className}`} />;
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1A2E22] tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-[#8A9590] mt-1">
          Track your lead generation performance
        </p>
      </div>

      {/* Key Metrics */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 transition-all duration-500 delay-75 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {[
          { label: "Total Leads", value: stats?.totalLeads ?? 0 },
          { label: "Qualify Rate", value: `${qualifyRate}%` },
          { label: "Reply Rate", value: `${replyRate}%` },
          { label: "Conversion Rate", value: `${conversionRate}%` },
        ].map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-xs p-5 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className="text-[11px] font-medium text-[#8A9590] uppercase tracking-wider mb-1.5">
              {metric.label}
            </div>
            {statsLoading ? (
              <Skeleton className="w-16 h-8" />
            ) : (
              <p className="text-2xl font-semibold text-[#1A2E22] tabular-nums">
                {metric.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Funnel + Breakdown */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 transition-all duration-500 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {/* Funnel Chart */}
        <div className="lg:col-span-2 bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[#1A2E22]">Conversion Funnel</h2>
              <p className="text-xs text-[#8A9590] mt-0.5">Leads through each pipeline stage</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#FAF8F5] text-xs font-medium text-[#8A9590]">
              <div className="w-1.5 h-1.5 rounded-xs bg-[#3D8B5E]" />
              All time
            </div>
          </div>
          {statsLoading ? (
            <Skeleton className="w-full h-[220px]" />
          ) : stats && stats.totalLeads > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="18%">
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A9590" }} dy={8} />
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
                  {funnelData.map((_, index) => (
                    <Cell key={index} fill={funnelColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-[#8A9590]">No data yet. Search for dentists to start.</p>
            </div>
          )}
        </div>

        {/* Stage Breakdown */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#1A2E22] mb-5">Stage Breakdown</h2>
          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="w-full h-6" />
              ))}
            </div>
          ) : stats && stats.totalLeads > 0 ? (
            <div className="space-y-3.5">
              {[
                { label: "Discovered", value: stats.discovered, color: funnelColors[0] },
                { label: "Analyzed", value: stats.analyzed, color: funnelColors[1] },
                { label: "Qualified", value: stats.qualified, color: funnelColors[2] },
                { label: "Emailed", value: stats.emailSent, color: funnelColors[3] },
                { label: "Replied", value: stats.replied, color: funnelColors[4] },
                { label: "Converted", value: stats.converted, color: funnelColors[5] },
              ].map((stage) => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#5A6B60]">{stage.label}</span>
                    <span className="text-xs font-semibold text-[#1A2E22] tabular-nums">{stage.value}</span>
                  </div>
                  <div className="w-full bg-[#EDE8E0] rounded-xs h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-xs transition-all duration-1000 ease-out"
                      style={{
                        width: `${stats.totalLeads > 0 ? (stage.value / stats.totalLeads) * 100 : 0}%`,
                        backgroundColor: stage.color,
                        minWidth: stage.value > 0 ? "4px" : "0",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[180px]">
              <p className="text-sm text-[#8A9590] text-center">No pipeline data</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-500 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {/* Revenue */}
        <div className="bg-white rounded-xs p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-[#1A2E22] mb-5">Revenue</h2>
          {statsLoading ? (
            <Skeleton className="w-full h-[120px]" />
          ) : (
            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-medium text-[#8A9590] uppercase tracking-wider mb-1">Total Revenue</div>
                <p className="text-3xl font-semibold text-[#1A2E22] tabular-nums">
                  ${((stats?.revenue ?? 0)).toLocaleString()}
                </p>
                <p className="text-xs text-[#8A9590] mt-1">
                  {stats?.converted ?? 0} converted clients &times; $199/year
                </p>
              </div>
              <div className="border-t border-[#EDE8E0] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mb-1">Projected MRR</div>
                  <p className="text-lg font-semibold text-[#1A2E22] tabular-nums">
                    ${((stats?.converted ?? 0) * 29).toLocaleString()}
                  </p>
                  <p className="text-xs text-[#8A9590]">After year 1 @ $29/mo</p>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-[#8A9590] uppercase tracking-wider mb-1">Projected ARR</div>
                  <p className="text-lg font-semibold text-[#1A2E22] tabular-nums">
                    ${((stats?.converted ?? 0) * 29 * 12).toLocaleString()}
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
            <MapPin size={16} />
          </div>
          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="w-full h-8" />)}
            </div>
          ) : stats?.topCities && stats.topCities.length > 0 ? (
            <div className="space-y-3.5">
              {stats.topCities.map((city, idx) => {
                const max = stats.topCities[0]?.count ?? 1;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[#2A4A3A]">{city.city}</span>
                      <span className="text-sm font-semibold text-[#1A2E22] tabular-nums">{city.count}</span>
                    </div>
                    <div className="w-full bg-[#EDE8E0] rounded-xs h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-xs transition-all duration-1000 ease-out"
                        style={{
                          width: `${(city.count / max) * 100}%`,
                          backgroundColor: funnelColors[Math.min(idx, funnelColors.length - 1)],
                        }}
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
