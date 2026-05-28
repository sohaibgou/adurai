"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Crown, Zap, Upload, Sparkles,
  Calendar, TrendingUp, ChevronRight, FileText, LogOut,
} from "lucide-react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import EmailVerifyBanner from "@/components/email-verify-banner";
import PaywallModal from "@/components/paywall-modal";
import MetaPanel from "@/components/meta-panel";
import PendingActions from "@/components/pending-actions";
import AutopilotSettings from "@/components/autopilot-settings";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

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

function scoreColor(score: number) {
  if (score >= 75) return { bg: "rgba(22,163,74,0.08)", text: "#16A34A", border: "rgba(22,163,74,0.20)", label: "Great" };
  if (score >= 50) return { bg: "rgba(234,179,8,0.10)", text: "#A16207", border: "rgba(234,179,8,0.25)", label: "Good" };
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
  const [checkoutLoading,  setCheckoutLoading]  = useState(false);
  const [paywallOpen,      setPaywallOpen]      = useState(false);
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
  const isPro        = isAdmin || (isPaid && subscription?.plan === "pro");
  const FREE_LIMIT   = 3;
  const remaining    = Math.max(0, FREE_LIMIT - analysisCount);
  const firstName    = user.email?.split("@")[0] ?? "there";
  const createdAt    = user.created_at ? new Date(user.created_at) : null;
  const memberSince  = createdAt ? formatDate(createdAt.toISOString()) : "—";
  const memberDays   = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)) : 0;
  const avgScore     = recentAnalyses.length > 0
    ? Math.round(recentAnalyses.reduce((s, a) => s + a.score, 0) / recentAnalyses.length)
    : null;

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

          {/* Desktop greeting */}
          <p className="hidden lg:block font-heading" style={{ fontSize: 15, fontWeight: 700, color: "#0D0D12", letterSpacing: "-0.02em" }}>
            {getGreeting()}, {firstName} 👋
          </p>

          {/* Right */}
          <div className="flex items-center gap-3">
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
                      {recentAnalyses.length === 0
                        ? "Upload your first Meta Ads CSV to get started"
                        : `Last campaign scored ${recentAnalyses[0].score}/100 — ready for your next run`}
                    </h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                      {recentAnalyses.length === 0
                        ? "Get a full AI-powered breakdown of your campaigns in 60 seconds — free."
                        : "Upload a fresh export to track progress, spot new leaks, and scale winners."}
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
                {[
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
                    value:      avgScore !== null ? `${avgScore}` : "—",
                    sub:        avgScore !== null
                      ? avgScore >= 75 ? "Great performance" : avgScore >= 50 ? "Good progress" : "Room to grow"
                      : "No analyses yet",
                    subOk:      avgScore !== null && avgScore >= 75,
                    subWarn:    avgScore !== null && avgScore < 50,
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
                    value:      subLoading ? "…" : isPaid ? "Starter" : "Free",
                    sub:        isPaid ? "All features unlocked" : `${remaining} of 3 analyses left`,
                    subOk:      isPaid,
                    subWarn:    false,
                    icon:       isPaid ? Crown : Zap,
                    iconBg:     isPaid ? "rgba(22,163,74,0.10)" : "rgba(168,165,160,0.12)",
                    iconColor:  isPaid ? "#16A34A" : "#A8A5A0",
                    small:      false,
                  },
                ].map(({ label, value, sub, subOk, subWarn, icon: Icon, iconBg, iconColor, small }) => (
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

            {/* ══ Meta Integration ══ */}
            <motion.div {...fade(0.12)}>
              <MetaPanel flashParam={metaParam ?? actionParam} isPro={isPro} />
            </motion.div>

            {/* ══ Pending Actions ══ */}
            <motion.div {...fade(0.14)}>
              <PendingActions />
            </motion.div>

            {/* ══ Autopilot Settings ══ */}
            <motion.div {...fade(0.16)}>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F0EDE8" }}>
                  <h2 className="font-heading" style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em", color: "#0D0D12" }}>Autopilot</h2>
                  <Link
                    href="/dashboard/autopilot"
                    className="inline-flex items-center gap-1.5 font-semibold no-underline transition-colors"
                    style={{ fontSize: 13, color: "#7C3AED", fontFamily: "var(--font-inter)", textDecoration: "none" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#6D28D9"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#7C3AED"; }}
                  >
                    Autopilot Settings <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="px-6 py-5">
                  <AutopilotSettings />
                </div>
              </div>
            </motion.div>

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
                  style={{ background: "#FFFFFF", border: "1px solid rgba(255,60,172,0.22)", boxShadow: "0 4px 24px rgba(255,60,172,0.08)" }}
                >
                  {/* Top gradient bar */}
                  <div style={{ height: 3, background: "linear-gradient(90deg, #FF3CAC, #FF6B35)" }} />
                  {/* Bg orb */}
                  <div style={{ position: "absolute", top: -50, right: 40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-7 py-7">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF3CAC" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#FF3CAC", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)" }}>
                          Starter — $19/mo
                        </span>
                      </div>
                      <h2 className="font-heading" style={{ fontSize: 20, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 14 }}>
                        Unlock unlimited analyses & your full Battle Plan
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {["✨ Unlimited analyses", "🎯 7-Day Battle Plan", "🎨 AI Creative Studio", "📄 PDF Export"].map((f) => (
                          <span
                            key={f}
                            style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: 100, background: "rgba(255,60,172,0.06)", border: "1px solid rgba(255,60,172,0.16)", fontSize: 12, fontWeight: 500, color: "#FF3CAC", fontFamily: "var(--font-inter)" }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
                      <button
                        disabled={checkoutLoading}
                        onClick={async () => { setCheckoutLoading(true); try { await redirectToCheckout(); } finally { setCheckoutLoading(false); } }}
                        className="inline-flex items-center justify-center gap-2 text-white font-semibold cursor-pointer transition-all disabled:opacity-60"
                        style={{ padding: "13px 28px", borderRadius: 100, background: checkoutLoading ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", fontSize: 14, fontFamily: "var(--font-inter)", boxShadow: checkoutLoading ? "none" : "0 4px 20px rgba(255,60,172,0.35)", border: "none", letterSpacing: "-0.01em" }}
                        onMouseEnter={e => { if (!checkoutLoading) { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 7px 28px rgba(255,60,172,0.50)"; } }}
                        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(255,60,172,0.35)"; }}
                      >
                        {checkoutLoading ? "Redirecting…" : "Upgrade Now"}
                        {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                      </button>
                      <p className="text-center" style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Cancel anytime · No commitment</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ Paid quick actions ══ */}
            {!subLoading && isPaid && (
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
        currentPlan="free"
      />
    </div>
  );
}
