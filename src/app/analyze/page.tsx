"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import OnboardingForm from "@/components/onboarding-form";
import PaywallModal from "@/components/paywall-modal";
import AnalysisLoadingScreen from "@/components/analysis-loading-screen";
import SiteFooter from "@/components/landing/site-footer";
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

export default function AnalyzePage() {
  const router = useRouter();
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [onboarding, setOnboarding]       = useState<OnboardingData | null>(null);
  const [paywallOpen, setPaywallOpen]     = useState(false);
  const [paywallReason, setPaywallReason] = useState<"analysis" | "image" | "copy">("analysis");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [paidPlan, setPaidPlan]           = useState(false);
  const [showLoader, setShowLoader]       = useState(false);

  useEffect(() => {
    document.title = "Analyze Your Meta Ads — Adur.ai";
  }, []);

  useEffect(() => {
    setAnalysisCount(getCount());
    setPaidPlan(isPaidPlan());
  }, []);

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
      const rows              = await parseCSV(file);
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

  const remaining = Math.max(0, FREE_LIMIT - analysisCount);

  return (
    <>
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} reason={paywallReason} />
      <AnalysisLoadingScreen
        visible={showLoader}
        active={isLoading}
        onComplete={() => { setShowLoader(false); router.push("/results"); }}
      />

      <div className="min-h-screen flex flex-col" style={{ background: "#fafafa" }}>

        {/* ── Header ── */}
        <header
          className="sticky top-0 z-40 border-b"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderColor: "rgba(0,0,0,0.07)" }}
        >
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="font-heading font-bold flex-shrink-0"
              style={{ fontSize: 18, color: "#0d0d1a", letterSpacing: "-0.025em", textDecoration: "none" }}
            >
              adur<span style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
            </Link>

            {/* Right side */}
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-3">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 30, height: 30, background: "linear-gradient(135deg, #6c5ce7, #8b7cf7)" }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      {(user.email?.[0] ?? "U").toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm text-[#6b7280] max-w-[160px] truncate">
                    {user.email}
                  </span>
                  <button
                    onClick={async () => { await signOut(); }}
                    className="text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors cursor-pointer"
                    style={{ background: "none", border: "none" }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-[#6b7280] hover:text-[#0d0d1a] transition-colors px-4 py-2 rounded-full border border-[rgba(0,0,0,0.12)] bg-white"
                    style={{ textDecoration: "none" }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-full"
                    style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", textDecoration: "none", boxShadow: "0 3px 14px rgba(108,92,231,0.35)" }}
                  >
                    Sign Up
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            )}
          </div>
        </header>

        {/* ── Page intro ── */}
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-2 w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors mb-6"
              style={{ textDecoration: "none" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to homepage
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.18)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00b894] inline-block" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6c5ce7", letterSpacing: "0.04em", textTransform: "uppercase" }}>Free Analysis</span>
            </div>
            <h1
              className="font-heading font-black"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.1 }}
            >
              Analyze Your Meta Ads
            </h1>
            <p className="mt-3 text-[#6b7280]" style={{ fontSize: 16, maxWidth: 480, fontFamily: "var(--font-inter)" }}>
              Upload your Meta Ads Manager CSV export and get a complete AI-powered campaign analysis in 60 seconds.
            </p>
          </motion.div>
        </div>

        {/* ── Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 w-full"
        >
          <OnboardingForm
            onComplete={setOnboarding}
            onFileSelected={handleFileSelected}
            isLoading={isLoading}
            analysisCount={0}
            isPaid={true}
            onUpgradeClick={() => {}}
          />
        </motion.div>

        {/* Usage counter */}
        {!paidPlan && analysisCount > 0 && !(user?.email && ADMIN_EMAILS.includes(user.email)) && (
          <div className="max-w-lg mx-auto px-6 -mt-4 mb-6 w-full">
            <div className="rounded-xl px-5 py-3" style={{ background: "#f8f8fc", border: "1px solid #f0f0f5" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)" }}>
                  {Math.min(analysisCount, FREE_LIMIT)} of {FREE_LIMIT} free analyses used
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
              <div style={{ height: 5, borderRadius: 100, background: "#e5e7eb", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(analysisCount / FREE_LIMIT) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    height: "100%", borderRadius: 100,
                    background: analysisCount >= FREE_LIMIT ? "#e17055" : analysisCount === FREE_LIMIT - 1 ? "linear-gradient(90deg, #6c5ce7, #fdcb6e)" : "linear-gradient(90deg, #6c5ce7, #e040fb)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="max-w-lg mx-auto px-6 -mt-4 mb-8 w-full">
            <div className="bg-red/10 border border-red/20 rounded-lg px-5 py-3 text-red text-sm text-center">
              {error}
            </div>
          </div>
        )}

        <SiteFooter />
      </div>
    </>
  );
}
