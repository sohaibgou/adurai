"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";
import AnimatedCounter from "@/components/animated-counter";
import type { CampaignSummary, OnboardingData } from "@/lib/types";

interface ProfitLeakBannerProps {
  summaries: CampaignSummary[];
  onboarding: OnboardingData | null;
}

interface LeakResult {
  totalLeak: number;
  targetCpa: number;
  method: "cpa" | "roas" | null;
  offenders: { campaign: CampaignSummary; waste: number }[];
}

function calcLeak(summaries: CampaignSummary[], onboarding: OnboardingData | null): LeakResult {
  const empty: LeakResult = { totalLeak: 0, targetCpa: 0, method: null, offenders: [] };
  if (!onboarding) return empty;

  let targetCpa = 0;
  let method: "cpa" | "roas" | null = null;

  if (onboarding.targetCpa > 0) {
    targetCpa = onboarding.targetCpa;
    method = "cpa";
  } else if (onboarding.breakEvenRoas > 0 && onboarding.aov > 0) {
    // Implied max CPA: spend/conversion = aov/breakEvenRoas at break-even
    targetCpa = onboarding.aov / onboarding.breakEvenRoas;
    method = "roas";
  }

  if (!method) return empty;

  const offenders: LeakResult["offenders"] = [];
  let totalLeak = 0;

  for (const c of summaries) {
    if (c.conversions <= 0 || c.costPerResult <= 0) continue;
    // wasted spend = actual spend − what spend would be at target CPA
    const waste = c.spend - targetCpa * c.conversions;
    if (waste > 0) {
      offenders.push({ campaign: c, waste });
      totalLeak += waste;
    }
  }

  offenders.sort((a, b) => b.waste - a.waste);

  return { totalLeak, targetCpa, method, offenders };
}

export default function ProfitLeakBanner({ summaries, onboarding }: ProfitLeakBannerProps) {
  const { totalLeak, targetCpa, method, offenders } = calcLeak(summaries, onboarding);

  if (!method) return null;

  const isClean = totalLeak === 0;
  const targetLabel =
    method === "cpa"
      ? `$${onboarding!.targetCpa}`
      : `$${targetCpa.toFixed(2)} (implied from ${onboarding!.breakEvenRoas}x break-even ROAS)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${isClean ? "#a7f3d0" : "#fbd5cc"}`,
        borderLeftWidth: 4,
        borderLeftColor: isClean ? "#00b894" : "#e17055",
        background: isClean ? "#f0fdf9" : "#fff8f6",
      }}
    >
      <div className="px-7 py-5 flex items-center gap-6 flex-wrap">

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isClean ? "#d1fae5" : "#fde8e2" }}
        >
          {isClean
            ? <CheckCircle className="w-6 h-6" style={{ color: "#00b894" }} />
            : <AlertCircle className="w-6 h-6" style={{ color: "#e17055" }} />
          }
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-[200px]">
          {isClean ? (
            <>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#00866b",
                  fontFamily: "var(--font-syne)",
                  letterSpacing: "-0.02em",
                }}
              >
                All campaigns within target CPA — no profit leak detected
              </p>
              <p style={{ fontSize: 13, color: "#059669", marginTop: 3 }}>
                Every campaign is spending within your {targetLabel} target
              </p>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#e17055",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-inter)",
                  marginBottom: 4,
                }}
              >
                Estimated Profit Leak
              </p>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: "#e17055",
                    fontFamily: "var(--font-syne)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  <AnimatedCounter value={totalLeak} prefix="$" decimals={0} duration={1400} />
                </span>
                <span style={{ fontSize: 15, color: "#b05a3a", fontWeight: 500 }}>
                  this period
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#9c4a36", marginTop: 5, lineHeight: 1.5 }}>
                Excess spend on campaigns above your{" "}
                <span style={{ fontWeight: 600 }}>{targetLabel}</span> target CPA
              </p>
            </>
          )}
        </div>

        {/* Offender pills — top 3, desktop only */}
        {!isClean && offenders.length > 0 && (
          <div className="hidden lg:flex flex-col gap-2 flex-shrink-0 min-w-[200px]">
            {offenders.slice(0, 3).map(({ campaign: c, waste }) => (
              <div
                key={c.campaignName}
                className="flex items-center justify-between gap-4 px-3 py-2 rounded-xl"
                style={{ background: "#fde8e2", border: "1px solid #fbd5cc" }}
              >
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: "#7c3a26", maxWidth: 180 }}
                  title={c.campaignName}
                >
                  {c.campaignName}
                </span>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: "#e17055" }}>
                  −${waste.toFixed(0)}
                </span>
              </div>
            ))}
            {offenders.length > 3 && (
              <p className="text-xs text-center" style={{ color: "#b05a3a", opacity: 0.7 }}>
                +{offenders.length - 3} more campaigns
              </p>
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
}
