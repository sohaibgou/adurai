"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";
import HeroSection from "@/components/landing/hero-section";
import OnboardingForm from "@/components/onboarding-form";
import CreativeStudio from "@/components/creative-studio";
import SocialProof from "@/components/landing/social-proof";
import DashboardPreview from "@/components/landing/dashboard-preview";
import FeaturesSection from "@/components/landing/features-section";
import HowItWorks from "@/components/landing/how-it-works";
import PricingSection from "@/components/landing/pricing-section";
import CtaSection from "@/components/landing/cta-section";
import PaywallModal from "@/components/paywall-modal";
import AnalysisLoadingScreen from "@/components/analysis-loading-screen";
import { parseCSV, aggregateByCampaign } from "@/lib/parse-csv";
import type { OnboardingData, AnalysisResult } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const FREE_LIMIT   = 3;
const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

function getCount(): number {
  try { return parseInt(localStorage.getItem("adur_analysis_count") ?? "0", 10) || 0; } catch { return 0; }
}
function isPaidPlan(): boolean {
  try { return localStorage.getItem("adur_plan") === "starter"; } catch { return false; }
}
function incrementCount(): number {
  const next = getCount() + 1;
  try { localStorage.setItem("adur_analysis_count", String(next)); } catch { /* noop */ }
  return next;
}

type ActiveMode = "analyze" | "creative";

export default function Home() {
  const router = useRouter();
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [onboarding, setOnboarding]   = useState<OnboardingData | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"analysis" | "image" | "copy" | "ugc">("analysis");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [paidPlan, setPaidPlan]       = useState(false);
  const [showLoader, setShowLoader]   = useState(false);
  const [activeMode, setActiveMode]   = useState<ActiveMode>("analyze");
  const [analysis, setAnalysis]       = useState<AnalysisResult | null>(null);
  const onboardingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Adur.ai — AI Meta Ads Analysis for E-commerce";
  }, []);

  // Hydrate usage state from localStorage + prior analysis from sessionStorage
  useEffect(() => {
    setAnalysisCount(getCount());
    setPaidPlan(isPaidPlan());
    try {
      const raw = sessionStorage.getItem("adur_results");
      if (raw) setAnalysis(JSON.parse(raw) as AnalysisResult);
    } catch { /* ignore */ }
  }, []);

  // Sync real usage + paid status from server when logged in
  useEffect(() => {
    if (!user || !session) return;
    fetch("/api/usage", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: { analysisCount: number; isPaid: boolean; isAdmin: boolean } | null) => {
        if (!data) return;
        if (data.isPaid || data.isAdmin) {
          setPaidPlan(true);
          try { localStorage.setItem("adur_plan", "starter"); } catch { /* noop */ }
        }
        // Override localStorage count with authoritative server count
        setAnalysisCount(data.analysisCount);
        try { localStorage.setItem("adur_analysis_count", String(data.analysisCount)); } catch { /* noop */ }
      })
      .catch(() => { /* non-fatal, falls back to localStorage */ });
  }, [user, session]);

  async function handleFileSelected(file: File) {
    const currentCount = getCount();
    const currentPaid  = isPaidPlan();
    const isAdmin      = !!(user?.email && ADMIN_EMAILS.includes(user.email));
    if (!isAdmin && !currentPaid && currentCount >= FREE_LIMIT) {
      setPaywallReason("analysis");
      setPaywallOpen(true);
      return;
    }

    setShowLoader(true);
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 90_000);

    try {
      const rows             = await parseCSV(file);
      const campaignSummaries = aggregateByCampaign(rows);

      const response = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          summaries:     campaignSummaries,
          onboarding,
          sessionToken:  session?.access_token,
          plan:          localStorage.getItem("adur_plan") ?? "free",
          analysisCount: currentCount,
        }),
        signal:  controller.signal,
      });

      let data: Record<string, unknown>;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned non-JSON response (status ${response.status})`);
      }

      // Server-side limit gate
      if (response.status === 403 && (data as { code?: string }).code === "FREE_LIMIT_EXCEEDED") {
        setShowLoader(false);
        setPaywallReason("analysis");
        setPaywallOpen(true);
        return;
      }

      if (!response.ok) {
        const msg = typeof data.error === "string" ? data.error : `Analysis failed (${response.status})`;
        throw new Error(msg);
      }

      const analysisResult = {
        summaries:       campaignSummaries,
        summary:         (data.summary as string) || "",
        score:           (data.score as number) || 0,
        winners:         (data.winners as string[]) || [],
        killers:         (data.killers as string[]) || [],
        recommendations: (data.recommendations as string[]) || [],
        battlePlan:      (data.battlePlan as import("@/lib/types").BattlePlanDay[]) || [],
        insights:        (data.insights as string[]) || [],
        totalSpend:      data.totalSpend as number,
        totalRevenue:    data.totalRevenue as number,
        convResults:     (data.convResults as number) || 0,
        convAvgCPR:      (data.convAvgCPR as number) || 0,
        convBestRoas:    (data.convBestRoas as number) || 0,
        analysisMode:    (data.analysisMode as "roas" | "traffic") || "roas",
      };

      // Save to recent analyses history
      try {
        const recentEntry = {
          id:            Date.now().toString(),
          date:          new Date().toISOString(),
          campaignCount: campaignSummaries.length,
          score:         (data.score as number) || 0,
        };
        const existing = JSON.parse(localStorage.getItem("adur_recent_analyses") || "[]");
        existing.unshift(recentEntry);
        localStorage.setItem("adur_recent_analyses", JSON.stringify(existing.slice(0, 10)));
      } catch { /* noop */ }

      if (!currentPaid) {
        const next = incrementCount();
        setAnalysisCount(next);
      }

      // Store results — loader will navigate to /results once animation completes
      try {
        sessionStorage.setItem("adur_results",   JSON.stringify(analysisResult));
        sessionStorage.setItem("adur_form_data", JSON.stringify(onboarding));
      } catch { /* noop */ }

    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "AbortError" ? "Analysis timed out after 90 seconds — please try again" : err.message)
        : "Something went wrong";
      setShowLoader(false); // hide loader immediately on error
      setError(msg);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  function scrollToOnboarding() {
    onboardingRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const remaining = Math.max(0, FREE_LIMIT - analysisCount);

  return (
    <>
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} reason={paywallReason} />
      <AnalysisLoadingScreen
        visible={showLoader}
        active={isLoading}
        onComplete={() => { setShowLoader(false); router.push(user ? "/results" : "/preview"); }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen overflow-x-hidden"
        style={{ background: "#FAF8F5" }}
      >
        {/* ── Nav wrapper — sticky floating pill ── */}
        <div className="sticky z-50 px-5" style={{ top: 12 }}>
        <nav
          className="flex items-center justify-between"
          style={{
            height:       68,
            background:   "#FFFFFF",
            borderRadius: 22,
            border:       "1px solid #E8E5E0",
            boxShadow:    "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            padding:      "0 28px",
            maxWidth:     1200,
            margin:       "0 auto",
          }}
        >
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 36, width: "auto" }} />
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                { label: "HOW IT WORKS", id: "how-it-works" },
                { label: "FEATURES",     id: "features" },
                { label: "PRICING",      id: "pricing" },
              ].map(({ label, id }) => (
                <span
                  key={label}
                  className="cursor-pointer"
                  style={{ fontSize: 11, color: "#4B4B55", fontWeight: 700, fontFamily: "var(--font-inter)", letterSpacing: "0.09em", transition: "color 0.15s", whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#0D0D12"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#4B4B55"; }}
                  onClick={() => {
                    const el = document.getElementById(id);
                    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {!authLoading && (
              user ? (
                /* ── Logged-in nav ── */
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="hidden md:flex items-center gap-2 pr-2">
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{ width: 28, height: 28, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", boxShadow: "0 2px 8px rgba(255,60,172,0.35)" }}
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
                  <div className="hidden md:block w-px h-4 mx-1" style={{ background: "rgba(0,0,0,0.10)" }} />
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex items-center cursor-pointer transition-colors"
                    style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, fontFamily: "var(--font-inter)", background: "none", border: "none", padding: "6px 10px" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#0d0d1a"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
                  >
                    Dashboard
                  </button>
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
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <Link
                    href="/login"
                    className="inline-flex items-center font-semibold cursor-pointer"
                    style={{
                      fontSize:      13,
                      color:         "#4B4B55",
                      background:    "none",
                      border:        "none",
                      padding:       "8px 12px",
                      textDecoration: "none",
                      fontFamily:    "var(--font-inter)",
                      letterSpacing: "0.02em",
                      transition:    "color 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#0D0D12"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#4B4B55"; }}
                  >
                    LOG IN
                  </Link>
                  <button
                    onClick={scrollToOnboarding}
                    className="inline-flex items-center gap-1.5 font-semibold text-white cursor-pointer"
                    style={{
                      fontSize:      14,
                      background:   "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                      border:       "none",
                      padding:      "10px 18px",
                      borderRadius:  100,
                      fontFamily:   "var(--font-inter)",
                      boxShadow:    "0 3px 16px rgba(255, 60, 172, 0.30)",
                      transition:   "opacity 0.15s, transform 0.15s",
                      letterSpacing: "-0.01em",
                      whiteSpace:   "nowrap",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                  >
                    Start Free →
                  </button>
                </div>
              )
            )}
        </nav>
        </div>

        <HeroSection onCtaClick={scrollToOnboarding} />

        {/* ── Form section ── */}
        <div ref={onboardingRef} id="onboarding-form">

          {/* Switcher node — passed as prop so it renders inside each mode's own section */}
          {(() => {
            const isPaidUser = paidPlan || !!(user?.email && ADMIN_EMAILS.includes(user.email));
            const switcherNode = (
              <div
                className="inline-flex p-1.5 gap-1"
                style={{
                  background:   "#FFFFFF",
                  border:       "1px solid #E8E5E0",
                  borderRadius:  16,
                  boxShadow:    "0 4px 20px rgba(0,0,0,0.07)",
                }}
              >
                <button
                  onClick={() => setActiveMode("analyze")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold cursor-pointer transition-all"
                  style={{
                    borderRadius: 11,
                    border:       "none",
                    fontSize:     14,
                    fontFamily:  "var(--font-inter)",
                    background:   activeMode === "analyze"
                      ? "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)"
                      : "transparent",
                    color:        activeMode === "analyze" ? "#fff" : "#6B6B72",
                    boxShadow:    activeMode === "analyze"
                      ? "0 4px 14px rgba(255,60,172,0.32)"
                      : "none",
                  }}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analyze Campaigns
                </button>
                <button
                  onClick={() => setActiveMode("creative")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold cursor-pointer transition-all"
                  style={{
                    borderRadius: 11,
                    border:       "none",
                    fontSize:     14,
                    fontFamily:  "var(--font-inter)",
                    background:   activeMode === "creative"
                      ? "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)"
                      : "transparent",
                    color:        activeMode === "creative" ? "#fff" : "#6B6B72",
                    boxShadow:    activeMode === "creative"
                      ? "0 4px 14px rgba(255,60,172,0.32)"
                      : "none",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Creative Studio
                </button>
              </div>
            );

            return (
              <AnimatePresence mode="wait">
                {activeMode === "analyze" ? (

                  /* ─── Analyze mode — switcher lives inside OnboardingForm ─── */
                  <motion.div
                    key="analyze"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <OnboardingForm
                      onComplete={setOnboarding}
                      onFileSelected={handleFileSelected}
                      isLoading={isLoading}
                      analysisCount={analysisCount}
                      isPaid={isPaidUser}
                      onUpgradeClick={() => { setPaywallReason("analysis"); setPaywallOpen(true); }}
                      modeSwitcher={switcherNode}
                    />
                    {error && (
                      <div className="max-w-lg mx-auto px-6 -mt-4 mb-8">
                        <div
                          style={{
                            background:   "rgba(225,112,85,0.08)",
                            border:       "1px solid rgba(225,112,85,0.22)",
                            borderRadius: 12,
                            padding:      "12px 18px",
                            fontSize:     13,
                            color:        "#e17055",
                            textAlign:    "center",
                            fontFamily:   "var(--font-inter)",
                          }}
                        >
                          {error}
                        </div>
                      </div>
                    )}
                  </motion.div>

                ) : (

                  /* ─── Creative Studio mode — same section bg as OnboardingForm ─── */
                  <motion.div
                    key="creative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <section
                      style={{
                        background:      "#FFFFFF",
                        paddingTop:       72,
                        paddingBottom:    80,
                      }}
                    >
                      <div className="px-4 sm:px-6" style={{ maxWidth: 900, margin: "0 auto" }}>

                        {/* Switcher — centered, same slot as in analyze mode */}
                        <div className="flex justify-center mb-8">
                          {switcherNode}
                        </div>

                        {/* No-analysis banner */}
                        {!analysis && (
                          <div
                            className="relative overflow-hidden rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
                            style={{ background: "#0D0D12", border: "1px solid rgba(255,255,255,0.07)" }}
                          >
                            <div
                              style={{
                                position:     "absolute",
                                top:          -50,
                                right:        -20,
                                width:        180,
                                height:       180,
                                borderRadius: "50%",
                                background:   "radial-gradient(circle, rgba(255,60,172,0.32) 0%, transparent 70%)",
                                pointerEvents: "none",
                              }}
                            />
                            <div className="flex items-center gap-3 flex-1 min-w-0 relative">
                              <div
                                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                                style={{
                                  width:      40,
                                  height:     40,
                                  background: "linear-gradient(135deg, rgba(255,60,172,0.20), rgba(255,107,53,0.12))",
                                  border:     "1px solid rgba(255,60,172,0.28)",
                                }}
                              >
                                <Sparkles className="w-4 h-4" style={{ color: "#FF3CAC" }} />
                              </div>
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>
                                  Get better results with your campaign data
                                </p>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", marginTop: 3, lineHeight: 1.5 }}>
                                  Analyze first — we&apos;ll tailor every creative to your actual winning campaigns.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveMode("analyze")}
                              className="relative flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                              style={{
                                background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                                color:      "#fff",
                                border:     "none",
                                boxShadow:  "0 4px 16px rgba(255,60,172,0.36)",
                                fontFamily: "var(--font-inter)",
                              }}
                            >
                              Analyze First
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Connected pill */}
                        {analysis && (
                          <div className="mb-6">
                            <div
                              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                              style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.22)" }}
                            >
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#16A34A", boxShadow: "0 0 6px rgba(22,163,74,0.55)" }} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", fontFamily: "var(--font-inter)" }}>Connected to your analysis</span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A", fontFamily: "var(--font-inter)" }}>
                                Score {analysis.score}
                              </span>
                              <span style={{ color: "rgba(22,163,74,0.40)", fontSize: 14 }}>·</span>
                              <span style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                                {analysis.summaries.length} campaign{analysis.summaries.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Creative Studio card */}
                        <div
                          style={{
                            background:   "#FFFFFF",
                            border:       "1px solid #E8E5E0",
                            borderRadius: 20,
                            overflow:     "hidden",
                            boxShadow:    "0 4px 24px rgba(0,0,0,0.06)",
                          }}
                        >
                          <CreativeStudio
                            summaries={analysis?.summaries ?? []}
                            winners={analysis?.winners}
                            isPaid={isPaidUser}
                            isAdmin={!!(user?.email && ADMIN_EMAILS.includes(user.email))}
                            onPaywall={(reason) => {
                              setPaywallReason(reason);
                              setPaywallOpen(true);
                            }}
                          />
                        </div>
                      </div>
                    </section>
                  </motion.div>

                )}
              </AnimatePresence>
            );
          })()}

        </div>

        <SocialProof />
        <DashboardPreview />
        <HowItWorks />
        <FeaturesSection />
        <PricingSection onCtaClick={scrollToOnboarding} />
        <CtaSection onCtaClick={scrollToOnboarding} />

      </motion.div>
    </>
  );
}
