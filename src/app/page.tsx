"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
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
import { parseCSV, aggregateByCampaign } from "@/lib/parse-csv";
import type { CampaignSummary, AnalysisResult, OnboardingData } from "@/lib/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<CampaignSummary[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const onboardingRef = useRef<HTMLDivElement>(null);

  async function handleFileSelected(file: File) {
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

      console.log("Response status:", response.status);

      // Safely extract body — .json() can itself throw on malformed responses
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

      console.log("Analysis complete, result keys:", Object.keys(data));

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
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "AbortError" ? "Analysis timed out after 90 seconds — please try again" : err.message)
        : "Something went wrong";
      console.log("Analysis failed:", msg);
      // Clear summaries so the landing page (which has the error display) becomes visible
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

  const showDashboard = summaries && summaries.length > 0;

  return (
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
              <button
                onClick={() => { setSummaries(null); setAnalysis(null); setError(null); setOnboarding(null); }}
                className="text-sm text-muted hover:text-foreground px-4 py-2 rounded-lg border border-card-border hover:border-purple/30 transition-all cursor-pointer hover:shadow-sm"
              >
                Upload new file
              </button>
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

                  {/* Mode badge — only show if there are zero Conversions/Leads campaigns */}
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
                  <CreativeStudio summaries={summaries} winners={analysis.winners} />
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
          <nav
            className="fixed top-0 left-0 right-0 z-50"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            {/* Top gradient line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg, #6c5ce7 0%, #00cec9 100%)",
              }}
            />
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              {/* Logo — text only */}
              <span
                className="font-heading font-bold cursor-default select-none"
                style={{ fontSize: 18, color: "#0a0a0f", letterSpacing: "-0.025em" }}
              >
                adur<span style={{ color: "#6c5ce7" }}>.ai</span>
              </span>

              {/* Center links */}
              <div className="hidden md:flex items-center gap-8">
                {["How it works", "Pricing", "Case studies"].map((link) => (
                  <span
                    key={link}
                    className="cursor-pointer transition-colors duration-150"
                    style={{ fontSize: 14, color: "#6b7280", fontWeight: 400, fontFamily: "var(--font-inter)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#0a0a0f"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#6b7280"; }}
                  >
                    {link}
                  </span>
                ))}
              </div>

              {/* CTA — solid black, rounded rect */}
              <button
                onClick={scrollToOnboarding}
                className="inline-flex items-center gap-2 text-white cursor-pointer transition-all duration-200"
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  background: "#0a0a0f",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--font-inter)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1a1a24"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0f"; }}
              >
                Get Early Access
              </button>
            </div>
          </nav>

          <HeroSection onCtaClick={scrollToOnboarding} />

          <div ref={onboardingRef}>
            <OnboardingForm
              onComplete={setOnboarding}
              onFileSelected={handleFileSelected}
              isLoading={isLoading}
            />
          </div>

          {error && (
            <div className="max-w-lg mx-auto px-6 -mt-8 mb-8">
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
  );
}
