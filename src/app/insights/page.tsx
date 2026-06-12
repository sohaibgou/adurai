"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Crown, Zap, Upload, Sparkles,
  Calendar, TrendingUp, ChevronRight, FileText, LogOut, Bell,
  DollarSign, Target, Layers, Bot, Clock,
} from "lucide-react";
import type { AnalysisResult, OnboardingData, CampaignSummary } from "@/lib/types";
import AppSidebar from "@/components/app-sidebar";
import EmailVerifyBanner from "@/components/email-verify-banner";
import PaywallModal from "@/components/paywall-modal";
import MetaPanel from "@/components/meta-panel";
import PendingActions from "@/components/pending-actions";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["sohaibitotv@gmail.com", "sohaibtrepreneur@gmail.com"];

interface Subscription {
  plan:               "starter" | "pro" | string;
  status:             string;
  stripe_customer_id: string | null;
}

interface RecentAnalysis {
  id:            string;
  date:          string;
  campaignCount: number;
  score:         number;
}

function getAnalysisCount(): number {
  try { return parseInt(localStorage.getItem("adur_analysis_count") ?? "0", 10) || 0; } catch { return 0; }
}

function getRecentAnalyses(): RecentAnalysis[] {
  try { return JSON.parse(localStorage.getItem("adur_recent_analyses") ?? "[]").slice(0, 5); } catch { return []; }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Analysis score is on a 0–10 scale (matches the HealthGauge on the results page).
function scoreColor(score: number) {
  if (score >= 7) return { bg: "rgba(22,163,74,0.08)", text: "#16A34A", border: "rgba(22,163,74,0.20)", label: "Great" };
  if (score >= 4) return { bg: "rgba(234,179,8,0.10)", text: "#A16207", border: "rgba(234,179,8,0.25)", label: "Good" };
  return { bg: "rgba(225,112,85,0.10)", text: "#e17055", border: "rgba(225,112,85,0.22)", label: "Needs work" };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams  = useSearchParams();
  const metaParam     = searchParams.get("meta");
  const actionParam   = searchParams.get("action"); // from approve-email / reject-email
  const { user, session, loading: authLoading, signOut, emailVerified } = useAuth();
  const [subscription,     setSubscription]     = useState<Subscription | null>(null);
  const [subLoading,       setSubLoading]       = useState(true);
  const [analysisCount,    setAnalysisCount]    = useState(0);
  const [recentAnalyses,   setRecentAnalyses]   = useState<RecentAnalysis[]>([]);
  const [checkoutLoading,  setCheckoutLoading]  = useState<null | "starter" | "growth" | "pro">(null);
  const [checkoutError,    setCheckoutError]    = useState<string | null>(null);
  const [paywallOpen,      setPaywallOpen]      = useState(false);
  const [latest,           setLatest]           = useState<AnalysisResult | null>(null);
  const [latestForm,       setLatestForm]       = useState<OnboardingData | null>(null);

  async function handleCheckout(plan: "starter" | "growth" | "pro") {
    setCheckoutError(null);
    setCheckoutLoading(plan);
    try {
      const ok = await redirectToCheckout(undefined, plan);
      if (!ok) {
        // No session cookie — resume checkout after login.
        window.location.href = `/login?redirect=checkout&plan=${plan}`;
        return;
      }
      // ok === true → navigating to Stripe; keep the spinner.
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Checkout failed. Please try again.");
      setCheckoutLoading(null);
    }
  }
  // null = loading, true = verified, false = needs verification

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !session) return;

    // Load subscription
    supabase
      .from("subscriptions")
      .select("plan, status, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => { setSubscription(data ?? null); setSubLoading(false); });

    // Load analyses from DB — always authoritative, never use localStorage
    // (localStorage is per-browser not per-user; using it leaks previous users' data)
    fetch("/api/analyses/list", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.ok ? r.json() : { analyses: [] })
      .then((data: { analyses: RecentAnalysis[] }) => {
        const list = data.analyses ?? [];
        setRecentAnalyses(list);
        setAnalysisCount(list.length);
      })
      .catch(() => {
        // Network error — fall back to localStorage only as last resort
        setRecentAnalyses(getRecentAnalyses());
        setAnalysisCount(getAnalysisCount());
      });

    // Load the most recent analysis detail (result_json) to power the
    // performance cards, campaigns table and Account Health breakdown.
    // Read-only — no pipeline/business-logic changes.
    fetch("/api/analyses/latest", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.ok ? r.json() : { analysis: null })
      .then((data: { analysis: AnalysisResult | null; formData: OnboardingData | null }) => {
        setLatest(data.analysis ?? null);
        setLatestForm(data.formData ?? null);
      })
      .catch(() => { setLatest(null); setLatestForm(null); });
  }, [user, session]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F5F2" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(255,60,172,0.2)", borderTopColor: "#FF3CAC" }} />
      </div>
    );
  }

  const isAdmin      = !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const isPaid       = isAdmin || subscription?.status === "active";
  const planTier     = isAdmin ? "pro" : (isPaid ? (subscription?.plan ?? "starter") : "free");
  const isPro        = isAdmin || (isPaid && subscription?.plan === "pro");
  // Meta connection (READ) unlocks on Growth + Autopilot; autopilot/write stays Pro.
  const hasMeta      = isAdmin || (isPaid && (subscription?.plan === "growth" || subscription?.plan === "pro"));
  const planLabel    = { free: "Free", starter: "Starter", growth: "Growth", pro: "Autopilot" }[planTier] ?? "Starter";
  const FREE_LIMIT   = 3;
  const remaining    = Math.max(0, FREE_LIMIT - analysisCount);
  const firstName    = user.email?.split("@")[0] ?? "there";
  const createdAt    = user.created_at ? new Date(user.created_at) : null;
  const memberSince  = createdAt ? formatDate(createdAt.toISOString()) : "—";
  // Date.now() is read once for a display-only "days since signup" figure; a stale-by-render value is fine here.
  // eslint-disable-next-line react-hooks/purity
  const memberDays   = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)) : 0;
  const avgScore     = recentAnalyses.length > 0
    ? Math.round(recentAnalyses.reduce((s, a) => s + a.score, 0) / recentAnalyses.length)
    : null;

  // ── Topbar dynamic subtitle ──
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── Performance metrics derived from the latest real analysis ──
  const hasAnalysis   = !!latest && (latest.summaries?.length ?? 0) > 0;
  const summaries     = latest?.summaries ?? [];
  // Prefer the stored aggregate, but fall back to summing per-campaign rows.
  // Some stored result_json records have totalSpend/totalRevenue = 0/undefined
  // even though the campaign summaries carry real spend/revenue, which would
  // otherwise zero out every spend/ROAS-driven health bar.
  const totalSpend    = latest?.totalSpend && latest.totalSpend > 0
    ? latest.totalSpend
    : summaries.reduce((s, c) => s + (c.spend || 0), 0);
  const totalRevenue  = latest?.totalRevenue && latest.totalRevenue > 0
    ? latest.totalRevenue
    : summaries.reduce((s, c) => s + (c.revenue || 0), 0);
  const avgRoas       = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const breakEven     = latestForm?.breakEvenRoas && latestForm.breakEvenRoas > 0 ? latestForm.breakEvenRoas : 1;
  const healthScore   = latest?.score ?? 0;

  // ── Objective-aware metrics ──────────────────────────────────────────────
  // Traffic / awareness / lead campaigns carry no revenue or ROAS, so a
  // purchase/ROAS lens would (wrongly) flag healthy campaigns as 100% wasted.
  // Detect the mode and judge each campaign against the right outcome.
  const isRevenueMode = latest?.analysisMode === "roas"
    || totalRevenue > 0
    || summaries.some(c => (c.revenue ?? 0) > 0 || (c.roas ?? 0) > 0);
  const convOf = (c: CampaignSummary) => (c.conversions ?? 0) || (c.purchases ?? 0);
  const totalConversions = summaries.reduce((s, c) => s + convOf(c), 0);
  const costPerConv = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // A campaign is "unproductive" when it delivered no outcome for its objective.
  const isUnproductive = (c: CampaignSummary) =>
    isRevenueMode ? ((c.purchases ?? 0) === 0 || (c.roas ?? 0) <= 0.1)
                  : convOf(c) === 0;

  // Per-campaign status (Issue / Refresh / Scale / Active)
  type CampTone = "red" | "amber" | "green";
  const campStatus = (c: CampaignSummary): { label: string; tone: CampTone; mark: string } => {
    if (isUnproductive(c)) return { label: "Issue", tone: "red", mark: "⚠" };
    if (isRevenueMode) {
      if (c.roas >= breakEven * 1.5) return { label: "Scale",   tone: "green", mark: "↑" };
      if (c.roas < breakEven)        return { label: "Refresh", tone: "amber", mark: "↻" };
    }
    return { label: "Active", tone: "green", mark: "✓" };
  };

  const wastedBudget    = summaries.filter(isUnproductive).reduce((s, c) => s + (c.spend || 0), 0);
  const productiveSpend = Math.max(0, totalSpend - wastedBudget);
  const profitableSpend = isRevenueMode
    ? summaries.filter(c => (c.roas ?? 0) >= breakEven).reduce((s, c) => s + (c.spend || 0), 0)
    : productiveSpend;
  const issuesCount     = summaries.filter(isUnproductive).length;
  const deliveringCount = summaries.length - issuesCount;
  const scaleCount      = isRevenueMode
    ? summaries.filter(c => (c.roas ?? 0) >= breakEven * 1.5).length
    : deliveringCount;
  const healthLabel     = healthScore >= 7 ? "Great" : healthScore >= 4 ? "Good" : "Needs work";

  // Account-health breakdown bars — every value computed from real data (0–100)
  const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const healthBars = isRevenueMode
    ? [
        { label: "Budget efficiency", value: totalSpend > 0 ? clamp100((productiveSpend / totalSpend) * 100) : 0 },
        { label: "ROAS vs target",    value: clamp100((avgRoas / (breakEven * 2)) * 100) },
        { label: "Profitable spend",  value: totalSpend > 0 ? clamp100((profitableSpend / totalSpend) * 100) : 0 },
        { label: "Overall score",     value: clamp100(healthScore * 10) },
      ]
    : [
        { label: "Budget efficiency",    value: totalSpend > 0 ? clamp100((productiveSpend / totalSpend) * 100) : 0 },
        { label: "Converting campaigns", value: summaries.length > 0 ? clamp100((deliveringCount / summaries.length) * 100) : 0 },
        { label: "Overall score",        value: clamp100(healthScore * 10) },
      ];
  const barColor = (v: number) => (v >= 66 ? "#16A34A" : v >= 33 ? "#D97706" : "#DC2626");
  const toneStyle: Record<CampTone, { bg: string; text: string; border: string }> = {
    red:   { bg: "rgba(220,38,38,0.08)",  text: "#DC2626", border: "rgba(220,38,38,0.20)" },
    amber: { bg: "rgba(217,119,6,0.10)",  text: "#B45309", border: "rgba(217,119,6,0.22)" },
    green: { bg: "rgba(22,163,74,0.08)",  text: "#16A34A", border: "rgba(22,163,74,0.20)" },
  };
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  // Performance stat cards (real data) — shown once an analysis exists
  const perfCards = [
    {
      label: "Wasted Budget", value: money(wastedBudget),
      sub: issuesCount > 0 ? `${issuesCount} campaign${issuesCount !== 1 ? "s" : ""} need attention` : "No leaks detected",
      subOk: issuesCount === 0, subWarn: issuesCount > 0,
      icon: DollarSign, iconBg: "rgba(255,60,172,0.10)", iconColor: "#FF3CAC", small: false,
    },
    isRevenueMode
      ? {
          label: "Avg. ROAS", value: `${avgRoas.toFixed(1)}×`,
          sub: `Break-even ${breakEven}×`,
          subOk: avgRoas >= breakEven, subWarn: avgRoas < breakEven && avgRoas > 0,
          icon: TrendingUp, iconBg: "rgba(22,163,74,0.10)", iconColor: "#16A34A", small: false,
        }
      : {
          label: "Conversions", value: totalConversions.toLocaleString("en-US"),
          sub: costPerConv > 0 ? `${money(costPerConv)} / result` : "Tracked last run",
          subOk: totalConversions > 0, subWarn: false,
          icon: TrendingUp, iconBg: "rgba(22,163,74,0.10)", iconColor: "#16A34A", small: false,
        },
    {
      label: "Campaigns", value: String(summaries.length),
      sub: isRevenueMode
        ? (scaleCount > 0 ? `${scaleCount} ready to scale` : "Analyzed last run")
        : (deliveringCount > 0 ? `${deliveringCount} delivering results` : "Analyzed last run"),
      subOk: scaleCount > 0, subWarn: false,
      icon: Layers, iconBg: "rgba(255,107,53,0.10)", iconColor: "#FF6B35", small: false,
    },
    {
      label: "Health Score", value: `${healthScore}/10`,
      sub: healthLabel,
      subOk: healthScore >= 7, subWarn: healthScore < 4,
      icon: Target,
      iconBg: healthScore >= 7 ? "rgba(22,163,74,0.10)" : healthScore >= 4 ? "rgba(217,119,6,0.10)" : "rgba(220,38,38,0.10)",
      iconColor: healthScore >= 7 ? "#16A34A" : healthScore >= 4 ? "#D97706" : "#DC2626", small: false,
    },
  ];

  const fade = (delay: number) => ({
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F7F5F2" }}>

      <div className="flex flex-1 min-h-0">
      <AppSidebar
        activePage="dashboard"
        isPaid={isPaid}
        subLoading={subLoading}
        user={user}
        analysisCount={analysisCount}
        onSignOut={async () => { await signOut(); router.push("/"); }}
        onUpgrade={() => setPaywallOpen(true)}
      />

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════ */}
      <div className="flex-1 lg:ml-60 min-w-0 flex flex-col">

        {/* ── Top bar ── */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between pl-14 pr-4 lg:px-8 flex-shrink-0"
          style={{ height: 64, background: "rgba(247,245,242,0.90)", backdropFilter: "blur(16px)", borderBottom: "1px solid #E8E5E0" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 34, width: "auto" }} />
          </div>

          {/* Desktop greeting + dynamic subtitle */}
          <div className="hidden lg:flex flex-col" style={{ gap: 1 }}>
            <p className="font-heading" style={{ fontSize: 16, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.03em" }}>
              {getGreeting()}, {firstName} 👋
            </p>
            <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
              {todayLabel}
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Alerts */}
            <button
              onClick={() => router.push("/dashboard/autopilot")}
              className="hidden sm:inline-flex items-center gap-2 cursor-pointer transition-all"
              title="Pending actions & alerts"
              style={{ padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 500, fontFamily: "var(--font-inter)", background: "#FFFFFF", border: "1px solid #E4E0DB", color: "#6B6B72" }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#D4D0CA"; b.style.color = "#0D0D12"; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#E4E0DB"; b.style.color = "#6B6B72"; }}
            >
              <Bell className="w-3.5 h-3.5" />
              Alerts
            </button>
            <button
              onClick={() => router.push("/analyze")}
              className="hidden sm:inline-flex items-center gap-2 font-semibold text-white cursor-pointer transition-all"
              style={{ padding: "9px 20px", borderRadius: 100, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", fontSize: 13, fontFamily: "var(--font-inter)", boxShadow: "0 4px 16px rgba(255,60,172,0.28)", border: "none", letterSpacing: "-0.01em" }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 6px 22px rgba(255,60,172,0.42)"; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 16px rgba(255,60,172,0.28)"; }}
            >
              <Upload className="w-3.5 h-3.5" />
              New Analysis
            </button>

            {/* Sign-out icon — desktop only (sidebar bottom row already has it on mobile) */}
            <button
              onClick={async () => { await signOut(); router.push("/"); }}
              className="hidden sm:flex items-center justify-center cursor-pointer transition-all"
              title="Sign out"
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", color: "#A8A5A0", flexShrink: 0 }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(255,60,172,0.06)"; b.style.color = "#FF3CAC"; b.style.borderColor = "rgba(255,60,172,0.18)"; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(0,0,0,0.04)"; b.style.color = "#A8A5A0"; b.style.borderColor = "rgba(0,0,0,0.07)"; }}
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile avatar + sign out */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{(user.email?.[0] ?? "U").toUpperCase()}</span>
              </div>
              <button
                onClick={async () => { await signOut(); router.push("/"); }}
                style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)", background: "none", border: "none", cursor: "pointer" }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* ── Email verification banner (shown when unverified) ── */}
        {emailVerified === false && (
          <EmailVerifyBanner email={user.email ?? ""} />
        )}

        <main className="flex-1 px-6 lg:px-8 py-8">
          <div className="max-w-5xl space-y-5">

            {/* ══ AI Insight Banner ══ */}
            <motion.div {...fade(0)}>
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{ background: "#0D0D12", padding: "28px 32px" }}
              >
                {/* Glow orbs */}
                <div style={{ position: "absolute", top: -50, right: 60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.38) 0%, transparent 70%)", filter: "blur(35px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -30, right: 0, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.28) 0%, transparent 70%)", filter: "blur(28px)", pointerEvents: "none" }} />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#FF3CAC" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#FF3CAC", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)" }}>
                        AI Analyst Ready
                      </span>
                    </div>
                    <h2 className="font-heading" style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 7 }}>
                      {!hasAnalysis
                        ? "Upload your first Meta Ads CSV to get started"
                        : `Last campaign scored ${healthScore}/10 — ${healthScore >= 7 ? "your ads are performing" : healthScore >= 4 ? "solid, with room to scale" : "your ads need work"}`}
                    </h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                      {!hasAnalysis
                        ? "Get a full AI-powered breakdown of your campaigns in 60 seconds — free."
                        : isRevenueMode
                          ? `${issuesCount} critical issue${issuesCount !== 1 ? "s" : ""} detected · ${money(wastedBudget)} wasted budget identified · ${scaleCount} scale opportunit${scaleCount !== 1 ? "ies" : "y"}`
                          : `${totalConversions.toLocaleString("en-US")} conversions · ${costPerConv > 0 ? `${money(costPerConv)} per result` : "tracked"} · ${deliveringCount}/${summaries.length} campaigns delivering`}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/analyze")}
                    className="flex-shrink-0 inline-flex items-center gap-2 font-semibold text-white cursor-pointer transition-all whitespace-nowrap"
                    style={{ padding: "13px 24px", borderRadius: 100, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", fontSize: 14, fontFamily: "var(--font-inter)", boxShadow: "0 4px 20px rgba(255,60,172,0.42)", border: "none", letterSpacing: "-0.01em" }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 8px 28px rgba(255,60,172,0.56)"; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(255,60,172,0.42)"; }}
                  >
                    {recentAnalyses.length === 0 ? "Analyze Now" : "Run New Analysis"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ══ Stats grid ══ */}
            <motion.div {...fade(0.08)}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(hasAnalysis ? perfCards : [
                  {
                    label:      "Analyses Run",
                    value:      String(analysisCount),
                    sub:        isPaid ? "Unlimited plan" : `${remaining} of ${FREE_LIMIT} free left`,
                    subOk:      isPaid,
                    subWarn:    remaining === 0 && !isPaid,
                    icon:       BarChart3,
                    iconBg:     "rgba(255,60,172,0.10)",
                    iconColor:  "#FF3CAC",
                    small:      false,
                  },
                  {
                    label:      "Avg. Score",
                    value:      avgScore !== null ? `${avgScore}/10` : "—",
                    sub:        avgScore !== null
                      ? avgScore >= 7 ? "Great performance" : avgScore >= 4 ? "Good progress" : "Room to grow"
                      : "No analyses yet",
                    subOk:      avgScore !== null && avgScore >= 7,
                    subWarn:    avgScore !== null && avgScore < 4,
                    icon:       TrendingUp,
                    iconBg:     "rgba(22,163,74,0.10)",
                    iconColor:  "#16A34A",
                    small:      false,
                  },
                  {
                    label:      "Member Since",
                    value:      memberSince,
                    sub:        memberDays === 0 ? "Just joined — welcome!" : `${memberDays} day${memberDays !== 1 ? "s" : ""} active`,
                    subOk:      false,
                    subWarn:    false,
                    icon:       Calendar,
                    iconBg:     "rgba(255,107,53,0.10)",
                    iconColor:  "#FF6B35",
                    small:      true,
                  },
                  {
                    label:      "Plan",
                    value:      subLoading ? "…" : planLabel,
                    sub:        isPaid ? "All features unlocked" : `${remaining} of 3 analyses left`,
                    subOk:      isPaid,
                    subWarn:    false,
                    icon:       isPaid ? Crown : Zap,
                    iconBg:     isPaid ? "rgba(22,163,74,0.10)" : "rgba(168,165,160,0.12)",
                    iconColor:  isPaid ? "#16A34A" : "#A8A5A0",
                    small:      false,
                  },
                ]).map(({ label, value, sub, subOk, subWarn, icon: Icon, iconBg, iconColor, small }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-5"
                    style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#A8A5A0", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>
                        {label}
                      </p>
                      <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: iconBg, flexShrink: 0 }}>
                        <Icon className="w-4 h-4" style={{ color: iconColor }} />
                      </div>
                    </div>
                    <p className="font-heading" style={{ fontSize: small ? 17 : 34, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 6 }}>
                      {value}
                    </p>
                    <p style={{ fontSize: 11, fontFamily: "var(--font-inter)", fontWeight: subOk || subWarn ? 600 : 400, color: subOk ? "#16A34A" : subWarn ? "#e17055" : "#A8A5A0" }}>
                      {sub}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ══ Meta Integration (above campaigns) ══ */}
            <motion.div {...fade(0.09)}>
              {/* Coming-soon banner — autonomous management pre-launch */}
              <div
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "#fffbeb", border: "1px solid #fde68a",
                  borderRadius: 12, padding: "12px 16px", marginBottom: 12,
                }}
              >
                <Clock size={16} strokeWidth={2.2} style={{ color: "#b45309", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "#92400e", fontFamily: "var(--font-inter)" }}>
                  <strong style={{ fontWeight: 700 }}>Autonomous management is coming soon</strong> — we&apos;re finalizing our Meta approval. Connect your account now to be first when we launch.
                </p>
              </div>
              <MetaPanel flashParam={metaParam ?? actionParam} isPro={hasMeta} compact={!metaParam && !actionParam} />
            </motion.div>

            {/* ══ Campaigns table + Account Health (real analysis) ══ */}
            {hasAnalysis && (
              <motion.div {...fade(0.10)}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* ── Campaigns from last analysis ── */}
                  <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #F0EDE8" }}>
                      <h2 className="font-heading" style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.03em", color: "#0D0D12" }}>Campaigns from Last Analysis</h2>
                      <button
                        onClick={() => router.push("/results")}
                        className="inline-flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
                        style={{ fontSize: 13, color: "#FF3CAC", fontFamily: "var(--font-inter)", background: "none", border: "none" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#FF6B35"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#FF3CAC"; }}
                      >
                        View full report <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Column header */}
                    <div className="hidden sm:grid px-6 py-2.5" style={{ gridTemplateColumns: "1fr 90px 80px 96px", gap: 12, borderBottom: "1px solid #F7F5F2" }}>
                      {["Campaign", "Spend", isRevenueMode ? "ROAS" : "Results", "Status"].map((h, i) => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#A8A5A0", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)", textAlign: i === 0 ? "left" : i === 3 ? "right" : "right" }}>{h}</span>
                      ))}
                    </div>

                    {[...summaries].sort((a, b) => b.spend - a.spend).slice(0, 6).map((c, i, arr) => {
                      const st = campStatus(c);
                      const ts = toneStyle[st.tone];
                      const roasColor = isUnproductive(c) ? "#DC2626"
                        : isRevenueMode
                          ? (c.roas >= breakEven * 1.5 ? "#16A34A" : c.roas < breakEven ? "#B45309" : "#0D0D12")
                          : "#16A34A";
                      return (
                        <div key={`${c.campaignName}-${i}`} className="grid items-center px-6 py-3.5" style={{ gridTemplateColumns: "1fr 90px 80px 96px", gap: 12, borderBottom: i < arr.length - 1 ? "1px solid #F7F5F2" : "none" }}>
                          <div className="min-w-0">
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaignName}</p>
                            <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {isRevenueMode
                                ? `${money(c.spend)} spend · ${c.purchases} purchase${c.purchases !== 1 ? "s" : ""}`
                                : `${money(c.spend)} spend · ${convOf(c).toLocaleString("en-US")} result${convOf(c) !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)", textAlign: "right" }}>{money(c.spend)}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: roasColor, fontFamily: "var(--font-inter)", textAlign: "right" }}>{isRevenueMode ? `${c.roas.toFixed(1)}×` : convOf(c).toLocaleString("en-US")}</span>
                          <div style={{ textAlign: "right" }}>
                            <span className="inline-flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: ts.text, background: ts.bg, border: `1px solid ${ts.border}`, padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                              {st.mark} {st.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Right column: Account Health + Quick Actions ── */}
                  <div className="flex flex-col gap-4">

                  {/* Account Health */}
                  <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-heading" style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.03em", color: "#0D0D12" }}>Account Health</h2>
                      <span style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>From last analysis</span>
                    </div>

                    <div className="flex flex-col items-center text-center mb-5">
                      <p className="font-heading" style={{ fontSize: 56, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: barColor(healthScore * 10) }}>{healthScore}</p>
                      <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginTop: 4 }}>out of 10 — {healthLabel}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {healthBars.map(({ label, value }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ fontSize: 12, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>{value}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 100, background: "#F0EDE8", overflow: "hidden" }}>
                            <div style={{ width: `${value}%`, height: "100%", borderRadius: 100, background: barColor(value) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <h2 className="font-heading" style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.03em", color: "#0D0D12", marginBottom: 12 }}>Quick Actions</h2>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { icon: FileText, label: "View Full Report",      href: "/results",            color: "#FF3CAC" },
                        { icon: Upload,   label: "Run New Analysis",      href: "/analyze",            color: "#FF6B35" },
                        { icon: Sparkles, label: "Open Creative Studio",  href: "/creative-studio",    color: "#7C3AED" },
                        { icon: Bot,      label: "AI Manager",            href: "/dashboard/autopilot", color: "#16A34A" },
                      ].map(({ icon: Icon, label, href, color }) => (
                        <button
                          key={label}
                          onClick={() => router.push(href)}
                          className="flex items-center gap-3 cursor-pointer transition-all text-left"
                          style={{ padding: "9px 10px", borderRadius: 10, background: "transparent", border: "1px solid transparent" }}
                          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#F7F5F2"; b.style.borderColor = "#E8E5E0"; }}
                          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.borderColor = "transparent"; }}
                        >
                          <span className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 30, height: 30, background: `${color}14` }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                          </span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>{label}</span>
                          <ChevronRight className="w-3.5 h-3.5" style={{ color: "#D4D0CA" }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  </div>{/* /right column */}

                </div>
              </motion.div>
            )}

            {/* ══ Pending Actions (autopilot — Meta-enabled plans only) ══ */}
            {hasMeta && (
            <motion.div {...fade(0.14)}>
              <PendingActions />
            </motion.div>
            )}

            {/* ══ Recent Analyses ══ */}
            <motion.div {...fade(0.14)}>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #F0EDE8" }}>
                  <div>
                    <h2 className="font-heading" style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em", color: "#0D0D12" }}>Recent Analyses</h2>
                    <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginTop: 2 }}>
                      {recentAnalyses.length === 0 ? "No uploads yet" : `Your last ${recentAnalyses.length} upload${recentAnalyses.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/analyze")}
                    className="inline-flex items-center gap-1.5 cursor-pointer font-semibold transition-colors"
                    style={{ fontSize: 13, color: "#FF3CAC", fontFamily: "var(--font-inter)", background: "none", border: "none" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#FF6B35"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#FF3CAC"; }}
                  >
                    + New analysis
                  </button>
                </div>

                {recentAnalyses.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center text-center px-6 py-12 gap-4">
                    <div className="flex items-center justify-center rounded-2xl" style={{ width: 56, height: 56, background: "linear-gradient(135deg, rgba(255,60,172,0.10), rgba(255,107,53,0.08))", border: "1px solid rgba(255,60,172,0.18)" }}>
                      <Upload className="w-6 h-6" style={{ color: "#FF3CAC" }} />
                    </div>
                    <div>
                      <p className="font-heading" style={{ fontSize: 16, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.025em", marginBottom: 4 }}>No analyses yet</p>
                      <p style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Upload your first Meta Ads CSV to see insights here</p>
                    </div>
                    <button
                      onClick={() => router.push("/analyze")}
                      className="inline-flex items-center gap-2 font-semibold text-white cursor-pointer transition-all"
                      style={{ padding: "11px 24px", borderRadius: 100, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", fontSize: 14, fontFamily: "var(--font-inter)", boxShadow: "0 4px 16px rgba(255,60,172,0.30)", border: "none" }}
                      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 6px 22px rgba(255,60,172,0.44)"; }}
                      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 16px rgba(255,60,172,0.30)"; }}
                    >
                      Upload CSV <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Rows */
                  <div>
                    {recentAnalyses.map((a, i) => {
                      const sc = scoreColor(a.score);
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer transition-all"
                          style={{ borderBottom: i < recentAnalyses.length - 1 ? "1px solid #F7F5F2" : "none" }}
                          onClick={() => {
                            // Only pass the ID when it's a real DB UUID (has dashes).
                            // localStorage fallback entries have timestamp IDs like "1779645088999"
                            // which can't be looked up in the DB — just navigate to latest in that case.
                            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.id);
                            router.push(isUUID ? `/results?id=${a.id}` : "/results");
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#FAFAF9"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 38, height: 38, background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.14)" }}>
                              <BarChart3 className="w-4 h-4" style={{ color: "#FF3CAC" }} />
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                                {a.campaignCount} campaign{a.campaignCount !== 1 ? "s" : ""}
                              </p>
                              <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                                {formatDate(a.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: sc.text, fontFamily: "var(--font-inter)" }}>{a.score}</span>
                              <span style={{ fontSize: 11, color: sc.text, fontFamily: "var(--font-inter)" }}>{sc.label}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5" style={{ color: "#D4D0CA" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ══ Upgrade card (free users) ══ */}
            {!subLoading && !isPaid && (
              <motion.div {...fade(0.20)}>
                <div
                  className="relative overflow-hidden rounded-2xl"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(255,60,172,0.18)", boxShadow: "0 4px 24px rgba(255,60,172,0.07)" }}
                >
                  {/* Top gradient bar */}
                  <div style={{ height: 3, background: "linear-gradient(90deg, #FF3CAC, #FF6B35 50%, #7c3aed)" }} />

                  <div className="px-5 sm:px-7 pt-5 pb-6">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF3CAC" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B72", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)" }}>
                        Choose your plan — scale your ads
                      </span>
                    </div>

                    {/* Three plan cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Starter */}
                      <div className="flex flex-col rounded-xl p-4" style={{ background: "rgba(255,60,172,0.04)", border: "1.5px solid rgba(255,60,172,0.18)" }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Zap className="w-3.5 h-3.5" style={{ color: "#FF3CAC" }} />
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#FF3CAC", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Starter</span>
                        </div>
                        <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                          $19<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                        </p>
                        <ul className="flex-1 space-y-1.5 mb-4">
                          {["10 campaign analyses / mo", "5 image generations / mo", "3 UGC AI videos / mo", "Full 7-Day Battle Plan"].map(f => (
                            <li key={f} className="flex items-start gap-2">
                              <span style={{ color: "#FF3CAC", flexShrink: 0, fontSize: 13 }}>✓</span>
                              <span style={{ fontSize: 12, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleCheckout("starter")}
                          disabled={checkoutLoading !== null}
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", border: "none", boxShadow: "0 3px 12px rgba(255,60,172,0.30)", fontFamily: "var(--font-inter)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                        >
                          {checkoutLoading === "starter" ? "Redirecting…" : "Get Starter →"}
                        </button>
                      </div>

                      {/* Growth */}
                      <div className="flex flex-col rounded-xl p-4 relative" style={{ background: "rgba(255,60,172,0.06)", border: "1.5px solid rgba(255,60,172,0.40)" }}>
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "#FF3CAC", padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em", fontFamily: "var(--font-inter)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                            Most Popular
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                          <Zap className="w-3.5 h-3.5" style={{ color: "#FF3CAC" }} />
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#FF3CAC", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Growth</span>
                        </div>
                        <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                          $49<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                        </p>
                        <ul className="flex-1 space-y-1.5 mb-4">
                          {["Unlimited analyses", "20 image generations / mo", "10 UGC AI videos / mo", "Connect Meta — live insights"].map(f => (
                            <li key={f} className="flex items-start gap-2">
                              <span style={{ color: "#FF3CAC", flexShrink: 0, fontSize: 13 }}>✓</span>
                              <span style={{ fontSize: 12, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleCheckout("growth")}
                          disabled={checkoutLoading !== null}
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", border: "none", boxShadow: "0 3px 12px rgba(255,60,172,0.30)", fontFamily: "var(--font-inter)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                        >
                          {checkoutLoading === "growth" ? "Redirecting…" : "Get Growth →"}
                        </button>
                      </div>

                      {/* Autopilot */}
                      <div className="flex flex-col rounded-xl p-4 relative" style={{ background: "rgba(124,58,237,0.05)", border: "1.5px solid rgba(124,58,237,0.25)" }}>
                        <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                          <Crown className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Autopilot</span>
                        </div>
                        <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                          $99<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                        </p>
                        <ul className="flex-1 space-y-1.5 mb-4">
                          {["Everything in Growth", "30 UGC AI videos / mo", "Meta write + Autopilot", "24/7 AI monitoring"].map(f => (
                            <li key={f} className="flex items-start gap-2">
                              <span style={{ color: "#7c3aed", flexShrink: 0, fontSize: 13 }}>✓</span>
                              <span style={{ fontSize: 12, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleCheckout("pro")}
                          disabled={checkoutLoading !== null}
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", boxShadow: "0 3px 12px rgba(124,58,237,0.30)", fontFamily: "var(--font-inter)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                        >
                          {checkoutLoading === "pro" ? "Redirecting…" : "Get Autopilot →"}
                        </button>
                      </div>
                    </div>

                    {checkoutError && (
                      <p className="text-center mt-3" style={{ fontSize: 12, color: "#e17055", background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.18)", borderRadius: 10, padding: "9px 14px", fontFamily: "var(--font-inter)" }}>
                        {checkoutError}
                      </p>
                    )}
                    <p className="text-center mt-3" style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Cancel anytime · No commitment</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ Paid quick actions (only when the analysis Quick Actions card isn't shown) ══ */}
            {!subLoading && isPaid && !hasAnalysis && (
              <motion.div {...fade(0.20)}>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: FileText, label: "View Last Results",  desc: "Open your most recent analysis report",   color: "#FF3CAC", bg: "rgba(255,60,172,0.08)",  href: "/results"  },
                    { icon: Upload,   label: "Run New Analysis",   desc: "Upload another Meta Ads CSV export",      color: "#FF6B35", bg: "rgba(255,107,53,0.08)", href: "/analyze"  },
                  ].map(({ icon: Icon, label, desc, color, bg, href }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 p-5 rounded-2xl cursor-pointer group transition-all"
                      style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                      onClick={() => router.push(href)}
                      onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = `${color}55`; d.style.boxShadow = `0 6px 24px ${color}18`; }}
                      onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "#E8E5E0"; d.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 42, height: 42, background: bg }}>
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>{label}</p>
                          <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>{desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#D4D0CA" }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="pb-8" />
          </div>
        </main>
      </div>
      </div>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        currentPlan={(["free", "starter", "growth", "pro"].includes(planTier) ? planTier : "free") as "free" | "starter" | "growth" | "pro"}
      />
    </div>
  );
}
