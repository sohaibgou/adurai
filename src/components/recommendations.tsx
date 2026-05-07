"use client";

import { Lightbulb, TrendingUp, TrendingDown, Eye, Zap, Compass, Activity, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import HealthGauge from "@/components/health-gauge";
import type { CampaignSummary, BattlePlanDay } from "@/lib/types";

interface RecommendationsProps {
  summary: string;
  score: number;
  winners: unknown[];
  killers: unknown[];
  recommendations: unknown[];
  battlePlan?: BattlePlanDay[];
  insights: unknown[];
  summaries?: CampaignSummary[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeText = (item: any): string => {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    return (
      item.observation ??
      item.text ??
      item.description ??
      item.action ??
      item.recommendation ??
      item.insight ??
      item.campaign ??
      (Object.values(item)[0] as string) ??
      ""
    );
  }
  return String(item ?? "");
};

function findMatchingSummary(text: string, summaries: CampaignSummary[]): CampaignSummary | null {
  const lower = text.toLowerCase();
  // Prefer longest name match to avoid partial false-positives
  return (
    summaries
      .filter((s) => lower.includes(s.campaignName.toLowerCase()))
      .sort((a, b) => b.campaignName.length - a.campaignName.length)[0] ?? null
  );
}

function budgetSuggestion(s: CampaignSummary): { pct: string; color: string } {
  if (s.roas >= 4) return { pct: "+25–30%", color: "#00b894" };
  if (s.roas >= 3) return { pct: "+15–20%", color: "#00b894" };
  if (s.roas >= 2) return { pct: "+10–15%", color: "#fdcb6e" };
  if (s.roas > 0)  return { pct: "+5–10%",  color: "#fdcb6e" };
  // No ROAS data — fall back to CPR-based
  if (s.costPerResult > 0 && s.costPerResult <= 20) return { pct: "+20–25%", color: "#00b894" };
  if (s.costPerResult > 0 && s.costPerResult <= 40) return { pct: "+10–15%", color: "#fdcb6e" };
  return { pct: "+10%", color: "#fdcb6e" };
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const EFFORT_CONFIG = {
  "Quick Win": {
    icon: Zap,
    bg: "#e6faf6",
    color: "#00866b",
    border: "#a7f3d0",
  },
  "Strategic": {
    icon: Compass,
    bg: "#f0edff",
    color: "#5b4bd4",
    border: "#c4bef0",
  },
  "Monitor": {
    icon: Activity,
    bg: "#e6fffe",
    color: "#0694a2",
    border: "#9decf2",
  },
} as const;

const DAY_GROUP_ACCENT: Record<number, string> = {
  1: "#e17055", 2: "#e17055",   // Immediate — red-orange
  3: "#6c5ce7", 4: "#6c5ce7",   // Testing — purple
  5: "#00cec9", 6: "#00cec9",   // Monitor — teal
  7: "#0984e3",                  // Review — blue
};

export default function Recommendations({
  summary,
  score,
  winners,
  killers,
  recommendations,
  battlePlan = [],
  insights,
  summaries = [],
}: RecommendationsProps) {
  return (
    <div className="space-y-6">

      {/* ── Account Overview ──────────────────────────────────── */}
      {(summary || score > 0) && (
        <motion.div {...fadeUp(0.4)} className="card overflow-hidden">
          {/* Gradient accent top bar */}
          <div
            className="h-[3px] w-full"
            style={{ background: "linear-gradient(90deg, #6c5ce7 0%, #00cec9 100%)" }}
          />

          <div className="p-8">
            <p className="section-label mb-6">Account Health</p>

            <div className="flex items-start gap-10 flex-wrap">
              {/* Gauge */}
              {score > 0 && <HealthGauge score={score} />}

              {/* Text content */}
              <div className="flex-1 min-w-[240px]">
                <h2
                  className="font-heading font-bold mb-3"
                  style={{
                    fontSize: 24,
                    letterSpacing: "-0.03em",
                    color: "var(--foreground)",
                  }}
                >
                  Account Overview
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    maxWidth: 620,
                  }}
                >
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Scale / Cut Grid ──────────────────────────────────── */}
      {(winners.length > 0 || killers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Winners */}
          {winners.length > 0 && (
            <motion.div {...fadeUp(0.5)} className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#e6faf6" }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: "#00b894" }} />
                </div>
                <div>
                  <p className="section-label">Scale These</p>
                  <h2
                    className="font-heading font-bold"
                    style={{ fontSize: 18, letterSpacing: "-0.03em", color: "var(--foreground)" }}
                  >
                    {winners.length} Campaigns to Scale
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {winners.map((w, i) => {
                  const text = safeText(w);
                  const match = summaries.length > 0 ? findMatchingSummary(text, summaries) : null;
                  // Split "CampaignName: reason" or just use full text as reason
                  const colonIdx = text.indexOf(":");
                  const hasColon = colonIdx > 0 && colonIdx < 60;
                  const campaignLabel = hasColon ? text.slice(0, colonIdx).trim() : (match?.campaignName ?? null);
                  const reasonText = hasColon ? text.slice(colonIdx + 1).trim() : text;
                  const budget = match ? budgetSuggestion(match) : null;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="p-4 rounded-xl cursor-default transition-all duration-200"
                      style={{
                        background: "#f0fdf9",
                        border: "1px solid #d1fae5",
                        borderLeftWidth: 3,
                        borderLeftColor: "#00b894",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#e6faf6"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#f0fdf9"; }}
                    >
                      <div className="flex items-start gap-3">
                        <ArrowUpRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00b894" }} />
                        <div className="flex-1 min-w-0">
                          {/* Campaign name */}
                          {campaignLabel && (
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 3 }}>
                              {campaignLabel}
                            </p>
                          )}
                          {/* Reason */}
                          <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>
                            {reasonText}
                          </p>
                          {/* Metrics row — only when we found a matching summary */}
                          {match && (
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              {match.costPerResult > 0 && (
                                <span
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                                  style={{ background: "rgba(0,184,148,0.1)", color: "#00866b" }}
                                >
                                  Cost/Result: ${match.costPerResult.toFixed(2)}
                                </span>
                              )}
                              {match.roas > 0 && (
                                <span
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                                  style={{ background: "rgba(0,184,148,0.1)", color: "#00866b" }}
                                >
                                  ROAS: {match.roas.toFixed(2)}x
                                </span>
                              )}
                              {budget && (
                                <span
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                                  style={{ background: `${budget.color}18`, color: budget.color }}
                                >
                                  Suggested increase: {budget.pct}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Killers */}
          {killers.length > 0 && (
            <motion.div {...fadeUp(0.55)} className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#fdf0ed" }}
                >
                  <TrendingDown className="w-5 h-5" style={{ color: "#e17055" }} />
                </div>
                <div>
                  <p className="section-label" style={{ color: "#e17055" }}>Cut These</p>
                  <h2
                    className="font-heading font-bold"
                    style={{ fontSize: 18, letterSpacing: "-0.03em", color: "var(--foreground)" }}
                  >
                    {killers.length} Campaigns to Cut
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {killers.map((k, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="p-4 rounded-xl cursor-default transition-all duration-200"
                    style={{
                      background: "#fff8f6",
                      border: "1px solid #fbd5cc",
                      borderLeftWidth: 3,
                      borderLeftColor: "#e17055",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#fdf0ed";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#fff8f6";
                    }}
                  >
                    <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.65 }}>
                      {safeText(k)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── 7-Day Battle Plan ─────────────────────────────────── */}
      {battlePlan.length > 0 && (
        <motion.div {...fadeUp(0.6)} className="card overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-card-border flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#f0edff" }}
            >
              <Compass className="w-5 h-5" style={{ color: "#6c5ce7" }} />
            </div>
            <div>
              <p className="section-label">Action Plan</p>
              <h2
                className="font-heading font-bold"
                style={{ fontSize: 18, letterSpacing: "-0.03em", color: "var(--foreground)" }}
              >
                7-Day Battle Plan
              </h2>
            </div>
          </div>

          {/* Day cards */}
          <div className="divide-y divide-card-border">
            {battlePlan.map((day, i) => {
              const accent = DAY_GROUP_ACCENT[day.day] ?? "#6c5ce7";
              const effortCfg = EFFORT_CONFIG[day.effort] ?? EFFORT_CONFIG["Strategic"];
              const EffortIcon = effortCfg.icon;

              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.62 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-0 cursor-default transition-colors duration-200 group"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#fafaf9"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {/* Left accent bar */}
                  <div className="w-1 flex-shrink-0 self-stretch" style={{ background: accent, opacity: 0.7 }} />

                  {/* Day number column */}
                  <div
                    className="flex flex-col items-center justify-center flex-shrink-0 px-6 py-5"
                    style={{ minWidth: 80 }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: accent,
                        fontFamily: "var(--font-inter)",
                        opacity: 0.8,
                      }}
                    >
                      Day
                    </span>
                    <span
                      style={{
                        fontSize: 34,
                        fontWeight: 700,
                        color: accent,
                        fontFamily: "var(--font-syne)",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                        marginTop: 1,
                      }}
                    >
                      {day.day}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-px self-stretch" style={{ background: "var(--card-border)" }} />

                  {/* Content */}
                  <div className="flex-1 px-6 py-5 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "var(--foreground)",
                          fontFamily: "var(--font-syne)",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.3,
                        }}
                      >
                        {day.title}
                      </h3>
                      {/* Effort badge */}
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{
                          background: effortCfg.bg,
                          border: `1px solid ${effortCfg.border}`,
                        }}
                      >
                        <EffortIcon className="w-3 h-3" style={{ color: effortCfg.color }} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: effortCfg.color,
                            fontFamily: "var(--font-inter)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {day.effort}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                      {day.action}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Deeper Insights ──────────────────────────────────── */}
      {insights.length > 0 && (
        <motion.div {...fadeUp(0.65)} className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#e6fffe" }}
            >
              <Eye className="w-5 h-5" style={{ color: "#00cec9" }} />
            </div>
            <div>
              <p className="section-label" style={{ color: "#00cec9" }}>Intelligence</p>
              <h2
                className="font-heading font-bold"
                style={{ fontSize: 18, letterSpacing: "-0.03em", color: "var(--foreground)" }}
              >
                Deeper Insights
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.75 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-3 p-4 rounded-xl"
                style={{ background: "#f0fffe", border: "1px solid #b2f0ee" }}
              >
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00cec9" }} />
                <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.7 }}>{safeText(ins)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
