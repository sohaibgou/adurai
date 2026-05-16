"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Download, ArrowRight } from "lucide-react";
import Link from "next/link";
import HeroSection from "@/components/landing/hero-section";
import OnboardingForm from "@/components/onboarding-form";
import SocialProof from "@/components/landing/social-proof";
import DashboardPreview from "@/components/landing/dashboard-preview";
import FeaturesSection from "@/components/landing/features-section";
import HowItWorks from "@/components/landing/how-it-works";
import PricingSection from "@/components/landing/pricing-section";
import CtaSection from "@/components/landing/cta-section";
import SiteFooter from "@/components/landing/site-footer";
import StatsBar from "@/components/stats-bar";
import CampaignTable from "@/components/campaign-table";
import SpendRoasChart from "@/components/spend-roas-chart";
import Recommendations from "@/components/recommendations";
import CreativeStudio from "@/components/creative-studio";
import SkeletonDashboard from "@/components/skeleton-dashboard";
import ProfitLeakBanner from "@/components/profit-leak-banner";
import PaywallModal from "@/components/paywall-modal";
import { parseCSV, aggregateByCampaign } from "@/lib/parse-csv";
import type { CampaignSummary, AnalysisResult, OnboardingData } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { handleGetStarted } from "@/lib/checkout";

const FREE_LIMIT = 3;

function getCount(): number {
  try { return parseInt(localStorage.getItem("adur_analysis_count") ?? "0", 10) || 0; } catch { return 0; }
}
function isPaid(): boolean {
  try { return localStorage.getItem("adur_plan") === "starter"; } catch { return false; }
}
function incrementCount(): number {
  const next = getCount() + 1;
  try { localStorage.setItem("adur_analysis_count", String(next)); } catch { /* noop */ }
  return next;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<CampaignSummary[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [paywallOpen,   setPaywallOpen]   = useState(false);
  const [paywallReason, setPaywallReason] = useState<"analysis" | "image" | "copy">("analysis");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [paidPlan, setPaidPlan] = useState(false);
  const onboardingRef = useRef<HTMLDivElement>(null);

  // Hydrate usage state from localStorage, then sync from Supabase if logged in
  useEffect(() => {
    setAnalysisCount(getCount());
    setPaidPlan(isPaid());
  }, []);

  useEffect(() => {
    if (!user) return;
    // Check Supabase subscriptions table for active subscription
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

  async function handleFileSelected(file: File) {
    // Usage gate — check before doing anything
    const currentCount = getCount();
    const currentPaid = isPaid();
    if (!currentPaid && currentCount >= FREE_LIMIT) {
      setPaywallReason("analysis");
      setPaywallOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummaries(null);
    setAnalysis(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    try {
      const rows = await parseCSV(file);
      const campaignSummaries = aggregateByCampaign(rows);
      setSummaries(campaignSummaries);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaries: campaignSummaries, onboarding }),
        signal: controller.signal,
      });

      let data: Record<string, unknown>;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned non-JSON response (status ${response.status})`);
      }

      if (!response.ok) {
        const msg = typeof data.error === "string" ? data.error : `Analysis failed (${response.status})`;
        throw new Error(msg);
      }

      setAnalysis({
        summaries: campaignSummaries,
        summary: (data.summary as string) || "",
        score: (data.score as number) || 0,
        winners: (data.winners as string[]) || [],
        killers: (data.killers as string[]) || [],
        recommendations: (data.recommendations as string[]) || [],
        battlePlan: (data.battlePlan as import("@/lib/types").BattlePlanDay[]) || [],
        insights: (data.insights as string[]) || [],
        totalSpend: data.totalSpend as number,
        totalRevenue: data.totalRevenue as number,
        convResults: (data.convResults as number) || 0,
        convAvgCPR: (data.convAvgCPR as number) || 0,
        convBestRoas: (data.convBestRoas as number) || 0,
        analysisMode: (data.analysisMode as "roas" | "traffic") || "roas",
      });

      // Save to recent analyses history
      try {
        const recentEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          campaignCount: campaignSummaries.length,
          score: (data.score as number) || 0,
        };
        const existing = JSON.parse(localStorage.getItem("adur_recent_analyses") || "[]");
        existing.unshift(recentEntry);
        localStorage.setItem("adur_recent_analyses", JSON.stringify(existing.slice(0, 10)));
      } catch { /* noop */ }

      // Increment usage count on success (skip for paid plan)
      if (!currentPaid) {
        const next = incrementCount();
        setAnalysisCount(next);
      }
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "AbortError" ? "Analysis timed out after 90 seconds — please try again" : err.message)
        : "Something went wrong";
      setSummaries(null);
      setError(msg);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  function scrollToOnboarding() {
    onboardingRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const [navCheckoutLoading, setNavCheckoutLoading] = useState(false);

  async function handleNavStart() {
    setNavCheckoutLoading(true);
    try {
      const loggedIn = await handleGetStarted();
      if (!loggedIn) router.push("/signup");
    } finally {
      setNavCheckoutLoading(false);
    }
  }

  const [isExporting, setIsExporting] = useState(false);
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

  const showDashboard = summaries && summaries.length > 0;
  const remaining = Math.max(0, FREE_LIMIT - analysisCount);

  return (
    <>
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} reason={paywallReason} />

      <AnimatePresence mode="wait">
        {showDashboard ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-background"
          >
            {!analysis && <SkeletonDashboard />}

            <header className="border-b border-card-border bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-teal flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="font-heading text-xl font-bold text-foreground">
                    Adur<span className="text-purple">.ai</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {analysis && (
                    <button
                      onClick={downloadPdf}
                      disabled={isExporting}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all cursor-pointer hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: isExporting ? "#9ca3af" : "linear-gradient(135deg, #6c5ce7, #e040fb)",
                        boxShadow: isExporting ? "none" : "0 3px 14px rgba(108,92,231,0.35)",
                      }}
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Exporting…" : "Download Report"}
                    </button>
                  )}
                  <button
                    onClick={() => { setSummaries(null); setAnalysis(null); setError(null); setOnboarding(null); }}
                    className="text-sm text-muted hover:text-foreground px-4 py-2 rounded-lg border border-card-border hover:border-purple/30 transition-all cursor-pointer hover:shadow-sm"
                  >
                    Upload new file
                  </button>
                </div>
              </div>
            </header>

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

                    {/* Mode badge */}
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
                    onPaywall={(reason) => { setPaywallReason(reason); setPaywallOpen(true); }}
                  />
                  </section>

                </div>
              </main>
            )}

            {analysis && <SiteFooter />}
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen overflow-x-hidden"
            style={{ background: "#ffffff" }}
          >
            {/* Floating pill nav */}
            <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
              <nav
                className="flex items-center justify-between gap-4 sm:gap-8"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 100,
                  padding: "10px 16px 10px 20px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  width: "100%",
                  maxWidth: 720,
                }}
              >
                <span
                  className="font-heading font-bold cursor-default select-none flex-shrink-0"
                  style={{ fontSize: 17, color: "#0d0d1a", letterSpacing: "-0.025em" }}
                >
                  adur<span style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
                </span>

                <div className="hidden md:flex items-center gap-7">
                  {["How it works", "Pricing"].map((link) => (
                    <span
                      key={link}
                      className="cursor-pointer transition-colors duration-150"
                      style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, fontFamily: "var(--font-inter)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#0d0d1a"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#6b7280"; }}
                      onClick={() => {
                        if (link === "How it works") document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                        if (link === "Pricing") document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {link}
                    </span>
                  ))}
                </div>

                {!authLoading && (
                  user ? (
                    /* ── Logged-in nav ── */
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Avatar + email */}
                      <div className="hidden md:flex items-center gap-2 pr-2">
                        <div
                          className="flex-shrink-0 flex items-center justify-center rounded-full"
                          style={{
                            width: 28, height: 28,
                            background: "linear-gradient(135deg, #6c5ce7, #8b7cf7)",
                            boxShadow: "0 2px 8px rgba(108,92,231,0.40)",
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1, fontFamily: "var(--font-inter)" }}>
                            {(user.email?.[0] ?? "U").toUpperCase()}
                          </span>
                        </div>
                        <span
                          className="max-w-[128px] truncate"
                          style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-inter)", fontWeight: 500 }}
                        >
                          {user.email}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="hidden md:block w-px h-4 mx-1" style={{ background: "rgba(0,0,0,0.10)" }} />

                      {/* Dashboard */}
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="hidden md:inline-flex items-center cursor-pointer transition-colors"
                        style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, fontFamily: "var(--font-inter)", background: "none", border: "none", padding: "6px 10px" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#0d0d1a"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
                      >
                        Dashboard
                      </button>

                      {/* Sign Out */}
                      <button
                        onClick={async () => { await signOut(); }}
                        className="inline-flex items-center cursor-pointer transition-colors"
                        style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, fontFamily: "var(--font-inter)", background: "none", border: "none", padding: "6px 10px" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    /* ── Logged-out nav ── */
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Ghost Sign In */}
                      <Link
                        href="/login"
                        className="hidden md:inline-flex items-center font-medium cursor-pointer transition-all duration-150"
                        style={{
                          padding: "8px 16px",
                          borderRadius: 100,
                          border: "1px solid rgba(0,0,0,0.14)",
                          background: "#ffffff",
                          fontSize: 13,
                          color: "#0d0d1a",
                          fontFamily: "var(--font-inter)",
                          textDecoration: "none",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,0,0,0.26)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.10)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,0,0,0.14)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                      >
                        Sign In
                      </Link>

                      {/* Filled Start Free */}
                      <button
                        onClick={scrollToOnboarding}
                        className="inline-flex items-center gap-1.5 font-semibold text-white cursor-pointer transition-all duration-200"
                        style={{
                          padding: "8px 18px",
                          borderRadius: 100,
                          background: "linear-gradient(135deg, #6c5ce7, #e040fb)",
                          fontSize: 13,
                          fontFamily: "var(--font-inter)",
                          border: "none",
                          boxShadow: "0 3px 16px rgba(108,92,231,0.38)",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 22px rgba(108,92,231,0.54)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 16px rgba(108,92,231,0.38)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                      >
                        Start Free
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}
              </nav>
            </div>

            <HeroSection onCtaClick={scrollToOnboarding} />

            <div ref={onboardingRef} id="onboarding-form">
              <OnboardingForm
                onComplete={setOnboarding}
                onFileSelected={handleFileSelected}
                isLoading={isLoading}
              />
            </div>

            {/* Usage counter — only for free users who've used at least 1 analysis */}
            {!paidPlan && analysisCount > 0 && (
              <div className="max-w-lg mx-auto px-6 -mt-4 mb-6">
                <div
                  className="rounded-xl px-5 py-3"
                  style={{ background: "#f8f8fc", border: "1px solid #f0f0f5" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)" }}>
                      {analysisCount} of {FREE_LIMIT} free analyses used
                    </span>
                    {remaining === 0 ? (
                      <button
                        onClick={() => { setPaywallReason("analysis"); setPaywallOpen(true); }}
                        className="text-xs font-semibold cursor-pointer transition-colors"
                        style={{ color: "#6c5ce7", fontFamily: "var(--font-inter)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#e040fb"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6c5ce7"; }}
                      >
                        Upgrade for unlimited →
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: remaining === 1 ? "#e17055" : "#6b7280", fontFamily: "var(--font-inter)", fontWeight: remaining === 1 ? 600 : 400 }}>
                        {remaining} remaining
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 5, borderRadius: 100, background: "#e5e7eb", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(analysisCount / FREE_LIMIT) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: "100%",
                        borderRadius: 100,
                        background: analysisCount >= FREE_LIMIT
                          ? "#e17055"
                          : analysisCount === FREE_LIMIT - 1
                          ? "linear-gradient(90deg, #6c5ce7, #fdcb6e)"
                          : "linear-gradient(90deg, #6c5ce7, #e040fb)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-lg mx-auto px-6 -mt-4 mb-8">
                <div className="bg-red/10 border border-red/20 rounded-lg px-5 py-3 text-red text-sm text-center">
                  {error}
                </div>
              </div>
            )}

            <SocialProof />
            <DashboardPreview />
            <HowItWorks />
            <FeaturesSection />
            <PricingSection onCtaClick={scrollToOnboarding} />
            <CtaSection onCtaClick={scrollToOnboarding} />
            <SiteFooter />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
