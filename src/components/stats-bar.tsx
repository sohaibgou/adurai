"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, ShoppingCart, MousePointerClick, Info } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/animated-counter";

interface StatsBarProps {
  totalSpend: number;
  totalRevenue: number;
  convResults: number;
  convAvgCPR: number;
  convBestRoas: number;
  analysisMode?: "roas" | "traffic";
  currentRoas?: number;
}

function TooltipIcon({ tooltip }: { tooltip: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info className="w-3 h-3 cursor-help" style={{ color: "var(--muted)", opacity: 0.5 }} />
      {visible && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-2 rounded-xl text-xs text-white z-50"
          style={{
            background: "#0a0a0f",
            whiteSpace: "nowrap",
            maxWidth: 300,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            fontSize: 11,
            letterSpacing: "0.01em",
          }}
        >
          {tooltip}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ background: "#0a0a0f", marginTop: -4 }}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  icon: Icon,
  accentColor,
  delay,
  tooltip,
  children,
}: {
  label: string;
  icon: React.ElementType;
  accentColor: string;
  delay: number;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card p-6 flex flex-col gap-4 cursor-default relative overflow-hidden group"
    >
      {/* Top: label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {label}
          </span>
          {tooltip && <TooltipIcon tooltip={tooltip} />}
        </div>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${accentColor}16` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>

      {/* Value */}
      <div
        className="leading-none font-heading font-bold"
        style={{
          fontSize: 30,
          letterSpacing: "-0.03em",
          color: "var(--foreground)",
          fontFamily: "var(--font-syne)",
        }}
      >
        {children}
      </div>

      {/* Bottom accent line on hover */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }}
      />
    </motion.div>
  );
}

const CONV_TOOLTIP = "Conversions & Leads only — Traffic / Engagement excluded";

export default function StatsBar({
  totalSpend,
  totalRevenue,
  convResults,
  convAvgCPR,
  convBestRoas,
  analysisMode = "roas",
  currentRoas,
}: StatsBarProps) {
  const cprColor =
    convAvgCPR > 0 && convAvgCPR <= 20
      ? "#00b894"
      : convAvgCPR <= 50
      ? "#fdcb6e"
      : "#e17055";
  const effectiveRoas = convBestRoas > 0 ? convBestRoas : (currentRoas ?? 0);
  const roasColor =
    effectiveRoas >= 3 ? "#00b894" : effectiveRoas >= 2 ? "#fdcb6e" : "#e17055";

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Spend" icon={DollarSign} accentColor="#6c5ce7" delay={0}>
          <AnimatedCounter value={totalSpend} prefix="$" />
        </StatCard>

        <StatCard
          label="Total Results"
          icon={ShoppingCart}
          accentColor="#00cec9"
          delay={0.07}
          tooltip={CONV_TOOLTIP}
        >
          {convResults > 0 ? (
            <AnimatedCounter value={convResults} />
          ) : (
            <span style={{ fontSize: 20, color: "var(--muted)" }}>No data</span>
          )}
        </StatCard>

        <StatCard
          label="Avg Cost / Result"
          icon={MousePointerClick}
          accentColor={cprColor}
          delay={0.14}
          tooltip={CONV_TOOLTIP}
        >
          {convAvgCPR > 0 ? (
            <AnimatedCounter value={convAvgCPR} prefix="$" decimals={2} />
          ) : (
            <span style={{ fontSize: 20, color: "var(--muted)" }}>—</span>
          )}
        </StatCard>

        <StatCard
          label="Best ROAS"
          icon={TrendingUp}
          accentColor={roasColor}
          delay={0.21}
          tooltip={
            convBestRoas > 0
              ? CONV_TOOLTIP
              : currentRoas && currentRoas > 0
              ? "Based on the ROAS you reported during setup — add purchase revenue to your CSV for campaign-level data"
              : "No purchase revenue found in CSV — add a 'Purchase ROAS' or 'Revenue' column for ROAS tracking"
          }
        >
          {convBestRoas > 0 ? (
            <AnimatedCounter value={convBestRoas} suffix="x" decimals={2} />
          ) : currentRoas && currentRoas > 0 ? (
            <div className="flex flex-col gap-1">
              <AnimatedCounter value={currentRoas} suffix="x" decimals={2} />
              <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-inter)", fontWeight: 400, letterSpacing: "0.02em" }}>
                reported avg
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--font-inter)", fontWeight: 500, lineHeight: 1.4 }}>
              Add revenue data
            </span>
          )}
        </StatCard>
      </div>

      <p
        className="mt-3 ml-1"
        style={{
          fontSize: 11,
          color: "var(--muted)",
          letterSpacing: "0.01em",
          opacity: 0.7,
        }}
      >
        Conversions &amp; Leads campaigns only — Traffic, Engagement, and other objectives excluded.
      </p>
    </div>
  );
}
