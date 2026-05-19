"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Palette, ArrowRight, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import OnboardingForm from "@/components/onboarding-form";
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
  try { localStorage.setItem("adur_analysis_count", String(next)); } catch {}
  return next;
}

export default function AnalyzePage() {
  const router = useRouter();
  const { user, session, loading: authLoading, signOut } = useAuth();

  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [onboarding,    setOnboarding]    = useState<OnboardingData | null>(null);
  const [paywallOpen,   setPaywallOpen]   = useState(false);
  const [paywallReason, setPaywallReason] = useState<"analysis" | "image" | "copy">("analysis");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [paidPlan,      setPaidPlan]      = useState(false);
  const [showLoader,    setShowLoader]    = useState(false);
  const [subLoading,    setSubLoading]    = useState(true);

  useEffect(() => { document.title = "Analyze — Adur.ai"; }, []);

  useEffect(() => {
    setAnalysisCount(getCount());
    setPaidPlan(isPaidPlan());
  }, []);

  useEffect(() => {
    if (!user) { setSubLoading(false); return; }
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPaidPlan(true);
          try { localStorage.setItem("adur_plan", "starter"); } catch {}
        }
        setSubLoading(false);
      });
  }, [user]);

  async function handleFileSelected(file: File) {
    const currentCount = getCount();
    const currentPaid  = isPaidPlan();
    const isAdmin      = !!(user?.email && ADMIN_EMAILS.includes(user.email));
    if (!isAdmin && !currentPaid && currentCount >= FREE_LIMIT) {
      setPaywallReason("analysis"); setPaywallOpen(true); return;
    }

    setShowLoader(true); setIsLoading(true); setError(null);
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 90_000);

    try {
      const rows              = await parseCSV(file);
      const campaignSummaries = aggregateByCampaign(rows);

      const response = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          summaries: campaignSummaries, onboarding,
          sessionToken: session?.access_token,
          plan: localStorage.getItem("adur_plan") ?? "free",
          analysisCount: currentCount,
        }),
        signal: controller.signal,
      });

      let data: Record<string, unknown>;
      try { data = await response.json(); }
      catch { throw new Error(`Server returned non-JSON response (status ${response.status})`); }

      if (response.status === 403 && (data as { code?: string }).code === "FREE_LIMIT_EXCEEDED") {
        setShowLoader(false); setPaywallReason("analysis"); setPaywallOpen(true); return;
      }
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `Analysis failed (${response.status})`);

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

      try {
        const entry = { id: Date.now().toString(), date: new Date().toISOString(), campaignCount: campaignSummaries.length, score: (data.score as number) || 0 };
        const existing = JSON.parse(localStorage.getItem("adur_recent_analyses") || "[]");
        existing.unshift(entry);
        localStorage.setItem("adur_recent_analyses", JSON.stringify(existing.slice(0, 10)));
      } catch {}

      if (!currentPaid) setAnalysisCount(incrementCount());

      try {
        sessionStorage.setItem("adur_results",   JSON.stringify(analysisResult));
        sessionStorage.setItem("adur_form_data", JSON.stringify(onboarding));
      } catch {}

    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "AbortError" ? "Analysis timed out after 90 seconds — please try again" : err.message)
        : "Something went wrong";
      setShowLoader(false); setError(msg);
    } finally { clearTimeout(timeout); setIsLoading(false); }
  }

  const isPaid = paidPlan || !!(user?.email && ADMIN_EMAILS.includes(user.email));

  return (
    <>
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} reason={paywallReason} />
      <AnalysisLoadingScreen
        visible={showLoader}
        active={isLoading}
        onComplete={() => { setShowLoader(false); router.push("/results"); }}
      />

      <div className="flex min-h-screen" style={{ background: "#F7F5F2" }}>

        {/* ── Sidebar ── */}
        <AppSidebar
          activePage="analyze"
          isPaid={isPaid}
          subLoading={subLoading}
          user={user}
          analysisCount={analysisCount}
          onSignOut={async () => { await signOut(); router.push("/"); }}
          onUpgrade={() => { setPaywallReason("analysis"); setPaywallOpen(true); }}
        />

        {/* ── Main ── */}
        <div className="flex-1 lg:ml-60 min-w-0 flex flex-col">

          {/* Top bar */}
          <header
            className="sticky top-0 z-20 flex items-center justify-between pl-14 pr-4 lg:px-8 flex-shrink-0"
            style={{ height: 64, background: "rgba(247,245,242,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #E8E5E0" }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5">
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 12 }}>A</span>
              </div>
              <Link href="/" style={{ textDecoration: "none" }}>
                <span className="font-heading font-bold" style={{ fontSize: 16, color: "#0D0D12", letterSpacing: "-0.03em" }}>
                  Adur<span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
                </span>
              </Link>
            </div>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-2" style={{ fontSize: 13, fontFamily: "var(--font-inter)" }}>
              <Link href="/dashboard" style={{ color: "#A8A5A0", textDecoration: "none", fontWeight: 500 }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#0D0D12"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#A8A5A0"; }}>
                Dashboard
              </Link>
              <span style={{ color: "#D4D0CA" }}>›</span>
              <span style={{ color: "#0D0D12", fontWeight: 600 }}>New Analysis</span>
            </div>

            {/* Right */}
            {!authLoading && (
              user ? (
                <div className="hidden sm:flex items-center gap-2.5">
                  <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 30, height: 30, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", boxShadow: "0 2px 8px rgba(255,60,172,0.28)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{(user.email?.[0] ?? "U").toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" style={{ fontSize: 13, color: "#4B4B55", fontFamily: "var(--font-inter)", textDecoration: "none", padding: "8px 16px", borderRadius: 100, border: "1px solid #E8E5E0", background: "#FFFFFF", fontWeight: 600 }}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="inline-flex items-center gap-1.5" style={{ fontSize: 13, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", color: "#fff", textDecoration: "none", padding: "8px 18px", borderRadius: 100, boxShadow: "0 3px 12px rgba(255,60,172,0.30)", fontWeight: 600, fontFamily: "var(--font-inter)" }}>
                    Sign Up <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            )}
          </header>

          {/* ── Content ── */}
          <main className="flex-1 px-6 lg:px-8 py-8">

            {/* ── Mode switcher ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
              <div
                className="inline-flex p-1.5 gap-1"
                style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                {/* Active: Analyze */}
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5"
                  style={{ borderRadius: 11, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", boxShadow: "0 3px 14px rgba(255,60,172,0.30)" }}
                >
                  <BarChart3 className="w-4 h-4" style={{ color: "#fff", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}>
                    Analyze Campaigns
                  </span>
                </div>

                {/* Inactive: Creative Studio */}
                <button
                  onClick={() => router.push("/creative-studio")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer transition-all rounded-xl"
                  style={{ background: "transparent", border: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F5F2"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <Palette className="w-4 h-4" style={{ color: "#A8A5A0", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#6B6B72", fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}>
                    Creative Studio
                  </span>
                </button>
              </div>
            </motion.div>

            {/* ── Hero intro ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.04 }} className="mb-8">
              <div className="inline-flex items-center gap-2 mb-4" style={{ background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.20)", padding: "5px 14px", borderRadius: 100 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF3CAC", display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#FF3CAC", letterSpacing: "0.09em", textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>
                  AI-Powered Analysis
                </span>
              </div>
              <h1 className="font-heading" style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", lineHeight: 1.1, marginBottom: 10 }}>
                Analyze Your Meta Ads
              </h1>
              <p style={{ fontSize: 15, color: "#6B6B72", fontFamily: "var(--font-inter)", maxWidth: 500, lineHeight: 1.65 }}>
                Upload your Meta Ads Manager CSV and get a complete AI breakdown — winners, killers, a 7-day Battle Plan and scale strategy.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                {[{ dot: "#16A34A", t: "Data stays private" }, { dot: "#FF3CAC", t: "60-second results" }, { dot: "#FF6B35", t: "No credit card needed" }].map(({ dot, t }) => (
                  <div key={t} className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Free-tier info banner ── */}
            <AnimatePresence>
              {!isPaid && !subLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="mb-8">
                  <div className="relative overflow-hidden rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "#0D0D12", padding: "20px 28px" }}>
                    <div style={{ position: "absolute", top: -30, right: 40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.30) 0%, transparent 70%)", filter: "blur(24px)", pointerEvents: "none" }} />
                    <div className="relative flex items-center gap-3">
                      <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#FF3CAC" }} />
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.80)", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: "#FFFFFF" }}>
                          {Math.max(0, FREE_LIMIT - analysisCount)} free {FREE_LIMIT - analysisCount === 1 ? "analysis" : "analyses"} remaining.
                        </span>{" "}
                        Upgrade to Starter for unlimited analyses, 7-Day Battle Plan &amp; Creative Studio.
                      </p>
                    </div>
                    <button
                      onClick={() => { setPaywallReason("analysis"); setPaywallOpen(true); }}
                      className="relative flex-shrink-0 inline-flex items-center gap-1.5 font-semibold text-white cursor-pointer transition-all whitespace-nowrap"
                      style={{ padding: "9px 18px", borderRadius: 100, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", fontSize: 13, fontFamily: "var(--font-inter)", boxShadow: "0 3px 14px rgba(255,60,172,0.38)", border: "none" }}
                      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 6px 20px rgba(255,60,172,0.50)"; }}
                      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 3px 14px rgba(255,60,172,0.38)"; }}
                    >
                      Upgrade →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
              <OnboardingForm
                onComplete={setOnboarding}
                onFileSelected={handleFileSelected}
                isLoading={isLoading}
                analysisCount={analysisCount}
                isPaid={isPaid}
                onUpgradeClick={() => { setPaywallReason("analysis"); setPaywallOpen(true); }}
              />
            </motion.div>

            {/* Error */}
            {error && (
              <div className="mt-4 max-w-lg mx-auto">
                <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.22)", borderRadius: 12, padding: "12px 20px", fontSize: 14, color: "#e17055", fontFamily: "var(--font-inter)", textAlign: "center" }}>
                  {error}
                </div>
              </div>
            )}

            {/* ── Creative Studio CTA ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }} className="mt-10 mb-6">
              <div
                className="relative overflow-hidden rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
              >
                <div style={{ position: "absolute", top: -20, right: 30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div className="relative flex items-start gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: "linear-gradient(135deg, rgba(255,60,172,0.10), rgba(255,107,53,0.08))", border: "1px solid rgba(255,60,172,0.18)" }}>
                    <Palette className="w-5 h-5" style={{ color: "#FF3CAC" }} />
                  </div>
                  <div>
                    <p className="font-heading" style={{ fontSize: 16, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 4 }}>
                      Already have results? Go straight to Creative Studio
                    </p>
                    <p style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.55 }}>
                      Generate scroll-stopping ad images &amp; 5 copy variants powered by your winning campaigns.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {["AI-generated images", "5 copy variants", "Hook angles", "Instant download"].map(f => (
                        <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#FF3CAC", fontFamily: "var(--font-inter)", background: "rgba(255,60,172,0.06)", border: "1px solid rgba(255,60,172,0.16)", padding: "3px 10px", borderRadius: 100 }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#FF3CAC", display: "inline-block" }} />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/creative-studio")}
                  className="relative flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white cursor-pointer transition-all whitespace-nowrap"
                  style={{ padding: "11px 22px", borderRadius: 100, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", fontSize: 14, fontFamily: "var(--font-inter)", boxShadow: "0 4px 16px rgba(255,60,172,0.30)", border: "none", letterSpacing: "-0.01em" }}
                  onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 6px 22px rgba(255,60,172,0.44)"; }}
                  onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 16px rgba(255,60,172,0.30)"; }}
                >
                  Open Studio <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* ── How it works ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }} className="mb-8">
              <p style={{ fontSize: 11, fontWeight: 700, color: "#A8A5A0", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)", textAlign: "center", marginBottom: 16 }}>
                How it works
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                  { num: "01", icon: Upload,   title: "Upload your CSV",          desc: "Export directly from Ads Manager" },
                  { num: "02", icon: BarChart3, title: "AI analyzes campaigns",   desc: "Finds winners, leaks & patterns" },
                  { num: "03", icon: Palette,   title: "Scale &amp; create ads",  desc: "Battle Plan + winning creatives" },
                ].map(({ num, icon: Icon, title, desc }) => (
                  <div key={num} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div className="inline-flex items-center justify-center rounded-lg mb-3" style={{ width: 32, height: 32, background: "linear-gradient(135deg, rgba(255,60,172,0.10), rgba(255,107,53,0.08))", border: "1px solid rgba(255,60,172,0.18)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#FF3CAC" }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 4 }}>{title}</p>
                    <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </main>

          {/* Minimal footer */}
          <footer className="flex items-center justify-center gap-5 px-6 py-5" style={{ borderTop: "1px solid #E8E5E0" }}>
            {["Privacy Policy", "Terms of Service"].map(t => (
              <span key={t} style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", cursor: "pointer" }}>{t}</span>
            ))}
            <span style={{ color: "#D4D0CA" }}>·</span>
            <span style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>© 2025 Adur.ai</span>
          </footer>
        </div>
      </div>
    </>
  );
}
