"use client";

import { Lightbulb, TrendingUp, TrendingDown, Eye, Target, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import HealthGauge from "@/components/health-gauge";

interface RecommendationsProps {
  summary: string;
  score: number;
  winners: unknown[];
  killers: unknown[];
  recommendations: unknown[];
  insights: unknown[];
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

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function Recommendations({
  summary,
  score,
  winners,
  killers,
  recommendations,
  insights,
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
                {winners.map((w, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="p-4 rounded-xl cursor-default group transition-all duration-200"
                    style={{
                      background: "#f0fdf9",
                      borderLeft: "3px solid #00b894",
                      border: "1px solid #d1fae5",
                      borderLeftColor: "#00b894",
                      borderLeftWidth: 3,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#e6faf6";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#f0fdf9";
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <ArrowUpRight
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: "#00b894" }}
                      />
                      <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.65 }}>
                        {safeText(w)}
                      </p>
                    </div>
                  </motion.div>
                ))}
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

      {/* ── Priority Actions ──────────────────────────────────── */}
      {recommendations.length > 0 && (
        <motion.div {...fadeUp(0.6)} className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#f0edff" }}
            >
              <Target className="w-5 h-5" style={{ color: "#6c5ce7" }} />
            </div>
            <div>
              <p className="section-label">Action Plan</p>
              <h2
                className="font-heading font-bold"
                style={{ fontSize: 18, letterSpacing: "-0.03em", color: "var(--foreground)" }}
              >
                Priority Actions — Next 7 Days
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-4 p-5 rounded-xl cursor-default transition-all duration-200"
                style={{
                  background: "#fafaf9",
                  border: "1px solid var(--card-border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "#f8f6ff";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#d4cfff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "#fafaf9";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--card-border)";
                }}
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-heading font-bold text-xs"
                  style={{
                    background: "#6c5ce7",
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  {i + 1}
                </span>
                <p style={{ fontSize: 14, color: "var(--foreground)", lineHeight: 1.7 }}>{safeText(rec)}</p>
              </motion.div>
            ))}
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
