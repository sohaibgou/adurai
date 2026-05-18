"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { motion } from "framer-motion";
import type { CampaignSummary } from "@/lib/types";

interface SpendRoasChartProps {
  summaries: CampaignSummary[];
  analysisMode?: "roas" | "traffic";
}

const PURPLE = "#FF3CAC";
const TEAL = "#00cec9";

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fullName?: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName || label;

  return (
    <div
      className="card p-4"
      style={{
        minWidth: 200,
        background: "#ffffff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        borderColor: "#f0f0f5",
      }}
    >
      <p
        className="mb-3"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--foreground)",
          letterSpacing: "-0.01em",
          maxWidth: 220,
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {fullName}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const v = Number(entry.value);
          let formatted = "";
          if (entry.name === "Spend") formatted = `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
          else if (entry.name === "Cost/Result") formatted = `$${v.toFixed(2)}`;
          else if (entry.name === "CTR") formatted = `${v.toFixed(2)}%`;
          else formatted = `${v.toFixed(2)}x`;

          const color = entry.name === "Spend" ? PURPLE : TEAL;

          return (
            <div key={entry.name} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                  {entry.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  fontFamily: "var(--font-syne)",
                  letterSpacing: "-0.02em",
                }}
              >
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-6 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SpendRoasChart({ summaries, analysisMode = "roas" }: SpendRoasChartProps) {
  const isTraffic = analysisMode === "traffic";

  const data = [...summaries]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 12)
    .map((c) => ({
      name: c.campaignName.length > 18 ? c.campaignName.slice(0, 16) + "…" : c.campaignName,
      fullName: c.campaignName,
      Spend: Number(c.spend.toFixed(2)),
      ...(isTraffic
        ? { "Cost/Result": c.costPerResult, CTR: c.ctr }
        : { ROAS: c.roas }),
    }));

  const maxSpend = Math.max(...data.map((d) => d.Spend), 0);
  const TICK_COUNT = 5;
  const niceStep = (() => {
    const raw = maxSpend / (TICK_COUNT - 1);
    const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const residual = raw / mag;
    if (residual <= 1) return mag;
    if (residual <= 2) return 2 * mag;
    if (residual <= 5) return 5 * mag;
    return 10 * mag;
  })();
  const spendTicks = Array.from({ length: TICK_COUNT }, (_, i) => i * niceStep);

  const secondaryKey = isTraffic ? "Cost/Result" : "ROAS";
  const title = isTraffic ? "Spend vs Cost / Result" : "Spend vs ROAS";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="card p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-2">Performance Breakdown</p>
        <h2
          className="font-heading font-bold"
          style={{
            fontSize: 22,
            letterSpacing: "-0.03em",
            color: "var(--foreground)",
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
          Top {data.length} campaigns by spend
        </p>
      </div>

      <div className="h-[460px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 24, left: 4, bottom: 72 }} barCategoryGap="32%">
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={0.95} />
                <stop offset="100%" stopColor={PURPLE} stopOpacity={0.65} />
              </linearGradient>
              <linearGradient id="secondaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity={0.95} />
                <stop offset="100%" stopColor={TEAL} stopOpacity={0.65} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="0"
              stroke="#f0f0f5"
              horizontal={true}
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
              angle={-38}
              textAnchor="end"
              height={76}
              axisLine={false}
              tickLine={false}
              interval={0}
            />

            <YAxis
              yAxisId="spend"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, spendTicks[spendTicks.length - 1]]}
              ticks={spendTicks}
              tickFormatter={(v: number) => {
                if (v === 0) return "$0";
                if (v >= 1000) {
                  const k = v / 1000;
                  return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
                }
                return `$${v}`;
              }}
              width={60}
            />

            <YAxis
              yAxisId="secondary"
              orientation="right"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (isTraffic ? `$${v}` : `${v}x`)}
              width={44}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(108,92,231,0.04)", radius: 8 } as React.SVGProps<SVGRectElement>}
            />

            <Legend content={<CustomLegend />} />

            <Bar
              yAxisId="spend"
              dataKey="Spend"
              fill="url(#spendGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
            />
            <Bar
              yAxisId="secondary"
              dataKey={secondaryKey}
              fill="url(#secondaryGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
