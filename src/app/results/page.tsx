"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Info, Download, Loader2 } from "lucide-react";
import StatsBar from "@/components/stats-bar";
import CampaignTable from "@/components/campaign-table";
import SpendRoasChart from "@/components/spend-roas-chart";
import Recommendations from "@/components/recommendations";
import CreativeStudio from "@/components/creative-studio";
import SkeletonDashboard from "@/components/skeleton-dashboard";
import ProfitLeakBanner from "@/components/profit-leak-banner";
import PaywallModal from "@/components/paywall-modal";
import SiteFooter from "@/components/landing/site-footer";
import type { AnalysisResult, OnboardingData } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

function isPaidPlan(): boolean {
  try { return localStorage.getItem("adur_plan") === "starter"; } catch { return false; }
}

export default function ResultsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [analysis, setAnalysis]   = useState<AnalysisResult | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [hydrated, setHydrated]   = useState(false);   // true once sessionStorage is read
  const [paywallOpen, setPaywallOpen]     = useState(false);
  const [paywallReason, setPaywallReason] = useState<"analysis" | "image" | "copy">("analysis");
  const [paidPlan, setPaidPlan]   = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    document.title = "Your Campaign Analysis — Adur.ai";
  }, []);

  // Read session storage on mount
  useEffect(() => {
    try {
      const rawResults  = sessionStorage.getItem("adur_results");
      const rawFormData = sessionStorage.getItem("adur_form_data");

      if (!rawResults) {
        router.replace("/analyze");
        return;
      }

      const parsedAnalysis  = JSON.parse(rawResults) as AnalysisResult;
      const parsedOnboarding = rawFormData ? JSON.parse(rawFormData) as OnboardingData : null;

      setAnalysis(parsedAnalysis);
      setOnboarding(parsedOnboarding);
    } catch {
      router.replace("/analyze");
      return;
    }

    setPaidPlan(isPaidPlan());
    setHydrated(true);
  }, [router]);

  // Sync paid status from Supabase if logged in
  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPaidPlan(true);
          try { localStorage.setItem("adur_plan", "starter"); } catch { /* noop */ }
        }
      });
  }, [user]);

  const downloadPdf = useCallback(async () => {
    if (!analysis) return;
    setIsExporting(true);
    try {
      const { exportAnalysisPDF } = await import("@/lib/export-pdf");
      await exportAnalysisPDF(analysis, onboarding);
    } finally {
      setIsExporting(false);
    }
  }, [analysis, onboarding]);

  // Not yet hydrated — show full-page loader
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#6c5ce7] animate-spin" />
          <p className="text-sm text-[#6b7280]">Loading your analysis…</p>
        </div>
      </div>
    );
  }

  const summaries = analysis?.summaries ?? [];

  return (
    <>
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} reason={paywallReason} />

      <div className="min-h-screen bg-background">

        {/* ── Analysis loading skeleton ── */}
        {!analysis && <SkeletonDashboard />}

        {/* ── Header ── */}
        <header className="border-b border-card-border bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-teal flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-heading text-xl font-bold text-foreground">
                Adur<span className="text-purple">.ai</span>
              </span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Auth info */}
              {!authLoading && user && (
                <div className="hidden md:flex items-center gap-2 pr-2">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 28, height: 28, background: "linear-gradient(135deg, #6c5ce7, #8b7cf7)" }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                      {(user.email?.[0] ?? "U").toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-[#6b7280] max-w-[140px] truncate">
                    {user.email}
                  </span>
                  <button
                    onClick={async () => { await signOut(); router.push("/"); }}
                    className="text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors cursor-pointer"
                    style={{ background: "none", border: "none" }}
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {/* Download Report */}
              {analysis && (
                <button
                  onClick={downloadPdf}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all cursor-pointer hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: isExporting ? "#9ca3af" : "linear-gradient(135deg, #6c5ce7, #e040fb)",
                    boxShadow:  isExporting ? "none" : "0 3px 14px rgba(108,92,231,0.35)",
                  }}
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? "Exporting…" : "Download Report"}
                </button>
              )}

              {/* Upload new file */}
              <button
                onClick={() => router.push("/analyze")}
                className="text-sm text-muted hover:text-foreground px-4 py-2 rounded-lg border border-card-border hover:border-purple/30 transition-all cursor-pointer hover:shadow-sm"
              >
                Upload new file
              </button>
            </div>
          </div>
        </header>

        {/* ── Dashboard content ── */}
        {analysis && (
          <main className="max-w-7xl mx-auto px-6 py-16">
            <div className="space-y-16">

              {/* ── Dashboard Hero ── */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start justify-between flex-wrap gap-4"
              >
                <div>
                  <p className="section-label mb-2">Results Dashboard</p>
                  <h1
                    className="font-heading font-bold"
                    style={{ fontSize: 32, letterSpacing: "-0.03em", color: "var(--foreground)" }}
                  >
                    Campaign Analysis
                  </h1>
                  <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>
                    {summaries.length} campaign{summaries.length !== 1 ? "s" : ""} analyzed
                    {onboarding && (
                      <>
                        {" · "}
                        <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                          {onboarding.product}
                        </span>
                        {" · "}{onboarding.market}
                        {onboarding.breakEvenRoas > 0 && (
                          <> · Break-even: <span style={{ fontWeight: 600 }}>{onboarding.breakEvenRoas}x</span></>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Traffic-mode badge */}
                {analysis.analysisMode === "traffic" &&
                 !analysis.summaries.some(s => s.objective === "CONVERSIONS" || s.objective === "LEADS") && (
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                    style={{ background: "#fff8e6", border: "1px solid #fde9a0" }}
                  >
                    <Info className="w-4 h-4 flex-shrink-0" style={{ color: "#a05c00" }} />
                    <p style={{ fontSize: 13, color: "#a05c00", fontWeight: 500 }}>
                      Traffic mode — no revenue data detected
                    </p>
                  </div>
                )}
              </motion.div>

              {/* ── Overview Metrics ── */}
              <section>
                <StatsBar
                  totalSpend={analysis.totalSpend}
                  totalRevenue={analysis.totalRevenue}
                  convResults={analysis.convResults}
                  convAvgCPR={analysis.convAvgCPR}
                  convBestRoas={analysis.convBestRoas}
                  analysisMode={analysis.analysisMode}
                  currentRoas={onboarding?.currentRoas}
                />
              </section>

              {/* ── Profit Leak ── */}
              {onboarding && (
                <section>
                  <ProfitLeakBanner summaries={analysis.summaries} onboarding={onboarding} />
                </section>
              )}

              {/* ── Chart ── */}
              <section>
                <SpendRoasChart summaries={summaries} analysisMode={analysis.analysisMode} />
              </section>

              {/* ── Campaign Table ── */}
              <section>
                <CampaignTable summaries={summaries} analysisMode={analysis.analysisMode} />
              </section>

              {/* ── AI Recommendations ── */}
              <section>
                <div className="mb-8">
                  <p className="section-label mb-2">AI Intelligence</p>
                  <h2
                    className="font-heading font-bold"
                    style={{ fontSize: 26, letterSpacing: "-0.03em", color: "var(--foreground)" }}
                  >
                    Recommendations & Insights
                  </h2>
                </div>
                <Recommendations
                  summary={analysis.summary}
                  score={analysis.score}
                  winners={analysis.winners}
                  killers={analysis.killers}
                  recommendations={analysis.recommendations}
                  battlePlan={analysis.battlePlan}
                  insights={analysis.insights}
                  summaries={analysis.summaries}
                />
              </section>

              {/* ── Creative Studio ── */}
              <section>
                <CreativeStudio
                  summaries={summaries}
                  winners={analysis.winners}
                  isPaid={paidPlan}
                  isAdmin={!!(user?.email && ADMIN_EMAILS.includes(user.email))}
                  onPaywall={(reason) => { setPaywallReason(reason); setPaywallOpen(true); }}
                />
              </section>

            </div>
          </main>
        )}

        {analysis && <SiteFooter />}
      </div>
    </>
  );
}
