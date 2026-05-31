"use client";

/**
 * /preview
 *
 * Public results page for non-authenticated users who just ran an analysis
 * on the home page. Reads from sessionStorage, shows partial results, and
 * drives sign-up with a locked-content CTA.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock, TrendingUp, DollarSign, BarChart3, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmt(n: number | undefined, currency = true): string {
  if (n === undefined || isNaN(n)) return "—";
  return currency
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    : n.toFixed(2);
}

function scoreColor(s: number) {
  if (s >= 75) return { text: "#16A34A", bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.22)", label: "Great" };
  if (s >= 50) return { text: "#A16207", bg: "rgba(161,98,7,0.10)",  border: "rgba(161,98,7,0.22)",  label: "Good" };
  return       { text: "#e17055", bg: "rgba(225,112,85,0.10)", border: "rgba(225,112,85,0.22)", label: "Needs work" };
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function PreviewPage() {
  const router   = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("adur_results");
      if (!raw) { router.replace("/"); return; }
      // Hydrate from sessionStorage on mount — this is client-only data that cannot be read during render/SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalysis(JSON.parse(raw) as AnalysisResult);
    } catch {
      router.replace("/");
    }
    setReady(true);
  }, [router]);

  if (!ready || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F5F2" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(255,60,172,0.2)", borderTopColor: "#FF3CAC" }} />
      </div>
    );
  }

  const sc       = scoreColor(analysis.score);
  const visibleRecs  = analysis.recommendations.slice(0, 3);
  const lockedRecs   = analysis.recommendations.slice(3, 6);
  const totalSpend   = analysis.totalSpend ?? 0;
  const totalRevenue = analysis.totalRevenue ?? 0;
  const roas         = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const campaignCount = analysis.summaries.length;

  const fade = (delay = 0) => ({
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  });

  return (
    <div className="min-h-screen" style={{ background: "#F7F5F2" }}>

      {/* ── Navbar ── */}
      <div className="sticky z-50 px-5" style={{ top: 12 }}>
        <nav
          className="flex items-center justify-between"
          style={{
            height: 64, background: "#FFFFFF", borderRadius: 18,
            border: "1px solid #E8E5E0",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            padding: "0 24px", maxWidth: 1100, margin: "0 auto",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 32, width: "auto" }} />

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              style={{ fontSize: 13, color: "#4B4B55", fontFamily: "var(--font-inter)", fontWeight: 600, textDecoration: "none", padding: "8px 14px" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5"
              style={{
                fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "var(--font-inter)",
                background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                padding: "9px 18px", borderRadius: 100, textDecoration: "none",
                boxShadow: "0 3px 14px rgba(255,60,172,0.32)",
              }}
            >
              Save my results free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-24" style={{ paddingTop: 40 }}>

        {/* ── Score hero ── */}
        <motion.div {...fade(0)}>
          <div
            className="rounded-3xl overflow-hidden mb-5"
            style={{ background: "#0D0D12", padding: "36px 36px 32px" }}
          >
            {/* glow orbs */}
            <div style={{ position: "absolute", top: -40, right: 60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.35) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#FF3CAC", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)" }}>
                    AI Campaign Audit
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", fontFamily: "var(--font-inter)" }}>
                    · {campaignCount} campaign{campaignCount !== 1 ? "s" : ""} analysed
                  </span>
                </div>
                <h1 className="font-heading" style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 8 }}>
                  Your campaigns scored
                </h1>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                  {analysis.summary?.slice(0, 120)}{analysis.summary?.length > 120 ? "…" : ""}
                </p>
              </div>

              {/* Score ring */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div style={{
                  width: 110, height: 110, borderRadius: "50%",
                  background: `conic-gradient(${sc.text} ${analysis.score * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 32px ${sc.text}40`,
                }}>
                  <div style={{
                    width: 84, height: 84, borderRadius: "50%", background: "#0D0D12",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="font-heading" style={{ fontSize: 34, fontWeight: 900, color: sc.text, letterSpacing: "-0.05em", lineHeight: 1 }}>
                      {analysis.score}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-inter)" }}>/100</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: "var(--font-inter)",
                  color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`,
                  padding: "2px 10px", borderRadius: 100,
                }}>
                  {sc.label}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Metrics row ── */}
        <motion.div {...fade(0.07)}>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: DollarSign,  label: "Total Spend",   value: fmt(totalSpend),   color: "#FF3CAC", bg: "rgba(255,60,172,0.08)"  },
              { icon: TrendingUp,  label: "Total Revenue", value: fmt(totalRevenue), color: "#16A34A", bg: "rgba(22,163,74,0.08)"   },
              { icon: BarChart3,   label: "Blended ROAS",  value: roas > 0 ? `${roas.toFixed(2)}×` : "—", color: "#FF6B35", bg: "rgba(255,107,53,0.08)" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 16, padding: "18px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 4 }}>{value}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#A8A5A0", fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Visible recommendations ── */}
        <motion.div {...fade(0.12)}>
          <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 20, overflow: "hidden", marginBottom: 5, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0EDE8" }}>
              <h2 className="font-heading" style={{ fontSize: 16, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.025em" }}>
                Top Recommendations
              </h2>
              <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginTop: 3 }}>
                {visibleRecs.length} of {analysis.recommendations.length} actions shown — sign up to unlock all
              </p>
            </div>

            {visibleRecs.map((rec, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 24px", borderBottom: i < visibleRecs.length - 1 ? "1px solid #F7F5F2" : "none" }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 7, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <CheckCircle2 size={12} style={{ color: "#fff" }} />
                </div>
                <p style={{ fontSize: 14, color: "#0D0D12", fontFamily: "var(--font-inter)", lineHeight: 1.6, margin: 0 }}>
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Locked section ── */}
        <motion.div {...fade(0.16)}>
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>

            {/* Blurred locked content */}
            <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
              <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0EDE8" }}>
                  <h2 className="font-heading" style={{ fontSize: 16, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.025em" }}>7-Day Battle Plan</h2>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ padding: "16px 24px", borderBottom: i < 2 ? "1px solid #F7F5F2" : "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F0EDE8", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, borderRadius: 4, background: "#E8E5E0", width: "60%", marginBottom: 8 }} />
                      <div style={{ height: 12, borderRadius: 4, background: "#F0EDE8", width: "85%" }} />
                    </div>
                  </div>
                ))}
                {lockedRecs.map((rec, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 24px", borderBottom: i < lockedRecs.length - 1 ? "1px solid #F7F5F2" : "none" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: "#E8E5E0", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 14, color: "#0D0D12", fontFamily: "var(--font-inter)", lineHeight: 1.6, margin: 0 }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lock overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, rgba(247,245,242,0) 0%, rgba(247,245,242,0.85) 35%, rgba(247,245,242,0.98) 100%)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
              padding: "32px 24px",
            }}>
              <div style={{ textAlign: "center", maxWidth: 420 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: "#fff", border: "1px solid #E8E5E0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  <Lock size={18} style={{ color: "#A8A5A0" }} />
                </div>
                <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 8 }}>
                  Unlock your full audit
                </h3>
                <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.65, marginBottom: 20 }}>
                  Get your complete 7-Day Battle Plan, all {analysis.recommendations.length} recommendations, Creative Studio access and PDF export — free.
                </p>
                <Link
                  href={`/signup`}
                  className="inline-flex items-center gap-2"
                  style={{
                    padding: "13px 28px", borderRadius: 100,
                    background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                    color: "#fff", fontWeight: 700, fontSize: 15,
                    fontFamily: "var(--font-inter)", textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(255,60,172,0.38)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginTop: 10 }}>
                  Free · no credit card · results saved automatically
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Creative Studio teaser ── */}
        <motion.div {...fade(0.20)}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0D0D12", padding: "28px 28px 24px", position: "relative" }}
          >
            <div style={{ position: "absolute", top: -30, right: 40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.30) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} style={{ color: "#FF6B35" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6B35", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)" }}>
                    Creative Studio
                  </span>
                </div>
                <h3 className="font-heading" style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 6 }}>
                  Turn insights into winning ad creatives
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                  Generate hooks, headlines, and ad copy tailored to your best campaigns — powered by your data.
                </p>
              </div>
              <Link
                href="/signup"
                className="flex-shrink-0 inline-flex items-center gap-2"
                style={{
                  padding: "11px 22px", borderRadius: 100,
                  background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff", fontWeight: 600, fontSize: 13,
                  fontFamily: "var(--font-inter)", textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.10)"; }}
              >
                Unlock Creative Studio
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
