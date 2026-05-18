"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
import PaywallModal from "@/components/paywall-modal";
import AnalysisLoadingScreen from "@/components/analysis-loading-screen";
import { parseCSV, aggregateByCampaign } from "@/lib/parse-csv";
import type { OnboardingData } from "@/lib/types";
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

export default function Home() {
  const router = useRouter();
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [onboarding, setOnboarding]   = useState<OnboardingData | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"analysis" | "image" | "copy">("analysis");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [paidPlan, setPaidPlan]       = useState(false);
  const [showLoader, setShowLoader]   = useState(false);
  const onboardingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Adur.ai — AI Meta Ads Analysis for E-commerce";
  }, []);

  // Hydrate usage state from localStorage
  useEffect(() => {
    setAnalysisCount(getCount());
    setPaidPlan(isPaidPlan());
  }, []);

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
        onComplete={() => { setShowLoader(false); router.push("/results"); }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen overflow-x-hidden"
        style={{ background: "#FAF8F5", backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 10%, rgba(255, 100, 180, 0.09) 0%, transparent 65%)" }}
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
            <div className="flex items-center gap-2.5 cursor-default select-none flex-shrink-0">
              <div
                className="flex items-center justify-center font-bold text-white"
                style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", fontSize: 14, flexShrink: 0, boxShadow: "0 2px 8px rgba(255,60,172,0.30)" }}
              >
                A
              </div>
              <span
                className="font-heading font-bold"
                style={{ fontSize: 18, color: "#0d0d1a", letterSpacing: "-0.03em" }}
              >
                Adur<span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
              </span>
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
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
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
                    className="hidden md:inline-flex items-center cursor-pointer transition-colors"
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
                    className="hidden md:inline-flex items-center font-semibold cursor-pointer"
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
                      padding:      "11px 26px",
                      borderRadius:  100,
                      fontFamily:   "var(--font-inter)",
                      boxShadow:    "0 3px 16px rgba(255, 60, 172, 0.30)",
                      transition:   "opacity 0.15s, transform 0.15s",
                      letterSpacing: "-0.01em",
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

        {/* ── Onboarding form ── */}
        <div ref={onboardingRef} id="onboarding-form">
          <OnboardingForm
            onComplete={setOnboarding}
            onFileSelected={handleFileSelected}
            isLoading={isLoading}
            analysisCount={analysisCount}
            isPaid={paidPlan || !!(user?.email && ADMIN_EMAILS.includes(user.email))}
            onUpgradeClick={() => { setPaywallReason("analysis"); setPaywallOpen(true); }}
          />
        </div>

        {/* Error display */}
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
    </>
  );
}
