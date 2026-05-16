"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Crown, Zap, Upload,
  Sparkles, Calendar, Clock, Palette,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";

export const dynamic = "force-dynamic";

interface Subscription {
  plan: string;
  status: string;
  stripe_customer_id: string | null;
}

interface RecentAnalysis {
  id: string;
  date: string;
  campaignCount: number;
  score: number;
}

function getAnalysisCount(): number {
  try { return parseInt(localStorage.getItem("adur_analysis_count") ?? "0", 10) || 0; } catch { return 0; }
}

function getRecentAnalyses(): RecentAnalysis[] {
  try { return JSON.parse(localStorage.getItem("adur_recent_analyses") ?? "[]").slice(0, 3); } catch { return []; }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function scoreColor(score: number) {
  if (score >= 75) return { bg: "rgba(0,184,148,0.10)", text: "#00b894", border: "rgba(0,184,148,0.20)" };
  if (score >= 50) return { bg: "rgba(253,203,110,0.15)", text: "#b8860b", border: "rgba(253,203,110,0.30)" };
  return { bg: "rgba(225,112,85,0.10)", text: "#e17055", border: "rgba(225,112,85,0.20)" };
}

function scoreLabel(score: number) {
  if (score >= 75) return "Great";
  if (score >= 50) return "Good";
  return "Needs work";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setAnalysisCount(getAnalysisCount());
    setRecentAnalyses(getRecentAnalyses());

    supabase
      .from("subscriptions")
      .select("plan, status, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubscription(data ?? null);
        setSubLoading(false);
      });
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(108,92,231,0.3)", borderTopColor: "#6c5ce7" }} />
      </div>
    );
  }

  const isPaid = subscription?.status === "active";
  const FREE_LIMIT = 3;
  const remaining = Math.max(0, FREE_LIMIT - analysisCount);
  const initial = (user.email?.[0] ?? "U").toUpperCase();

  // Member since
  const createdAt = user.created_at ? new Date(user.created_at) : null;
  const memberDays = createdAt
    ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000))
    : 0;

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <div className="min-h-screen" style={{ background: "#f8f8fc" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)" }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-heading font-bold" style={{ fontSize: 17, color: "#0d0d1a", letterSpacing: "-0.025em" }}>
              adur<span style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
            </span>
          </Link>
          <button
            onClick={async () => { await signOut(); router.push("/"); }}
            className="text-sm font-medium cursor-pointer transition-colors"
            style={{ color: "#6b7280", fontFamily: "var(--font-inter)", background: "none", border: "none" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#0d0d1a"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* ── Hero action ── */}
        <motion.div {...fade(0)}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6c5ce7", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                Account
              </p>
              <h1 className="font-heading font-bold" style={{ fontSize: 30, letterSpacing: "-0.03em", color: "#0d0d1a" }}>
                Dashboard
              </h1>
            </div>

            {/* Primary CTA */}
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-white font-semibold cursor-pointer transition-all flex-shrink-0"
              style={{
                padding: "13px 28px",
                borderRadius: 100,
                background: "linear-gradient(135deg, #6c5ce7, #e040fb)",
                fontSize: 15,
                fontFamily: "var(--font-inter)",
                boxShadow: "0 5px 24px rgba(108,92,231,0.42)",
                border: "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 7px 32px rgba(108,92,231,0.56)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 5px 24px rgba(108,92,231,0.42)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              Start Analyzing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* ── Profile + Analyses cards ── */}
        <div className="grid gap-5 md:grid-cols-3">

          {/* Profile card */}
          <motion.div {...fade(0.06)} className="md:col-span-2 rounded-2xl px-7 py-6"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {/* Purple avatar */}
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 52, height: 52,
                    background: "linear-gradient(135deg, #6c5ce7, #8b7cf7)",
                    boxShadow: "0 4px 16px rgba(108,92,231,0.35)",
                  }}
                >
                  <span className="font-heading font-bold text-white" style={{ fontSize: 22, lineHeight: 1 }}>
                    {initial}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)", marginBottom: 3 }}>Signed in as</p>
                  <p className="font-heading font-bold" style={{ fontSize: 16, color: "#0d0d1a", letterSpacing: "-0.02em" }}>
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Plan badge */}
              {!subLoading && (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl flex-shrink-0"
                  style={
                    isPaid
                      ? { background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.22)" }
                      : { background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.10)" }
                  }
                >
                  {isPaid
                    ? <Crown className="w-4 h-4" style={{ color: "#00b894" }} />
                    : <Zap className="w-4 h-4" style={{ color: "#9ca3af" }} />
                  }
                  <span className="font-semibold"
                    style={{ fontSize: 13, fontFamily: "var(--font-inter)", color: isPaid ? "#00b894" : "#6b7280" }}>
                    {isPaid ? "Starter Plan" : "Free Plan"}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Analyses card */}
          <motion.div {...fade(0.1)} className="rounded-2xl px-7 py-6"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(0,184,148,0.10)" }}>
              <BarChart3 className="w-5 h-5" style={{ color: "#00b894" }} />
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)", marginBottom: 3 }}>Analyses run</p>
            <p className="font-heading font-bold" style={{ fontSize: 40, color: "#0d0d1a", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {analysisCount}
            </p>
            {!subLoading && (
              isPaid
                ? <p style={{ fontSize: 12, color: "#00b894", fontFamily: "var(--font-inter)", marginTop: 6, fontWeight: 600 }}>∞ Unlimited</p>
                : <p style={{ fontSize: 12, color: remaining === 0 ? "#e17055" : "#9ca3af", fontFamily: "var(--font-inter)", marginTop: 6 }}>
                    {remaining} of {FREE_LIMIT} free remaining
                  </p>
            )}
          </motion.div>
        </div>

        {/* ── Quick stats row ── */}
        <motion.div {...fade(0.13)}>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: <Calendar className="w-4 h-4" style={{ color: "#6c5ce7" }} />,
                label: "Member since",
                value: createdAt ? formatDate(createdAt.toISOString()) : "—",
              },
              {
                icon: <Clock className="w-4 h-4" style={{ color: "#6c5ce7" }} />,
                label: "Days active",
                value: memberDays === 0 ? "Today" : `${memberDays} day${memberDays === 1 ? "" : "s"}`,
              },
            ].map(({ icon, label, value }) => (
              <div key={label}
                className="rounded-2xl px-5 py-4 flex items-center gap-3"
                style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(108,92,231,0.08)" }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "var(--font-inter)", fontWeight: 500, marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Recent analyses ── */}
        <motion.div {...fade(0.16)}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
            <div className="px-7 pt-6 pb-4 flex items-center justify-between">
              <h2 className="font-heading font-bold" style={{ fontSize: 18, letterSpacing: "-0.025em", color: "#0d0d1a" }}>
                Recent Analyses
              </h2>
              {recentAnalyses.length > 0 && (
                <button onClick={() => router.push("/")}
                  className="text-sm font-medium cursor-pointer transition-colors"
                  style={{ color: "#6c5ce7", fontFamily: "var(--font-inter)", background: "none", border: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#5a4bd1"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6c5ce7"; }}>
                  + New analysis
                </button>
              )}
            </div>

            {recentAnalyses.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center text-center px-7 py-10 gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(108,92,231,0.07)", border: "1px solid rgba(108,92,231,0.12)" }}>
                  <Upload className="w-6 h-6" style={{ color: "#6c5ce7" }} />
                </div>
                <div>
                  <p className="font-heading font-bold mb-1" style={{ fontSize: 16, color: "#0d0d1a" }}>No analyses yet</p>
                  <p style={{ fontSize: 14, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>
                    Upload your first CSV to get started
                  </p>
                </div>
                <button
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-2 font-semibold text-white cursor-pointer transition-all"
                  style={{
                    padding: "10px 22px",
                    borderRadius: 100,
                    background: "linear-gradient(135deg, #6c5ce7, #e040fb)",
                    fontSize: 14,
                    fontFamily: "var(--font-inter)",
                    boxShadow: "0 4px 16px rgba(108,92,231,0.35)",
                    border: "none",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 5px 22px rgba(108,92,231,0.50)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(108,92,231,0.35)"; }}
                >
                  Upload CSV
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Analysis rows */
              <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                {recentAnalyses.map((a, i) => {
                  const sc = scoreColor(a.score);
                  return (
                    <div key={a.id}
                      className="px-7 py-4 flex items-center justify-between gap-4"
                      style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(108,92,231,0.07)" }}>
                          <BarChart3 className="w-4 h-4" style={{ color: "#6c5ce7" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>
                            {a.campaignCount} campaign{a.campaignCount !== 1 ? "s" : ""}
                          </p>
                          <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>
                            {formatDate(a.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: sc.text, fontFamily: "var(--font-inter)" }}>
                          {a.score}
                        </span>
                        <span style={{ fontSize: 11, color: sc.text, fontFamily: "var(--font-inter)" }}>
                          {scoreLabel(a.score)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: 6 }} />
          </div>
        </motion.div>

        {/* ── Upgrade card (free only) ── */}
        {!subLoading && !isPaid && (
          <motion.div {...fade(0.2)}>
            <div className="rounded-2xl px-7 py-7 relative overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1.5px solid transparent",
                backgroundClip: "padding-box",
                boxShadow: "0 4px 24px rgba(108,92,231,0.10), inset 0 0 0 1.5px rgba(108,92,231,0.22)",
              }}>
              {/* Subtle purple gradient bg */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(108,92,231,0.05) 0%, transparent 70%)" }} />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: "#6c5ce7" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#6c5ce7", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>
                      Starter — $19/mo
                    </span>
                  </div>
                  <h2 className="font-heading font-bold mb-2"
                    style={{ fontSize: 20, color: "#0d0d1a", letterSpacing: "-0.025em" }}>
                    Unlock Your Full Analysis
                  </h2>
                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      { emoji: "✨", label: "Unlimited analyses" },
                      { emoji: "🎯", label: "7-Day Battle Plan" },
                      { emoji: "🎨", label: "Creative Studio" },
                    ].map(({ emoji, label }) => (
                      <span key={label}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ background: "rgba(108,92,231,0.07)", border: "1px solid rgba(108,92,231,0.15)", fontSize: 12, fontWeight: 500, color: "#6c5ce7", fontFamily: "var(--font-inter)" }}>
                        {emoji} {label}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  disabled={checkoutLoading}
                  onClick={async () => {
                    setCheckoutLoading(true);
                    try { await redirectToCheckout(); } finally { setCheckoutLoading(false); }
                  }}
                  className="inline-flex items-center gap-2 text-white font-semibold cursor-pointer transition-all flex-shrink-0"
                  style={{
                    padding: "12px 26px",
                    borderRadius: 100,
                    background: "linear-gradient(135deg, #6c5ce7, #e040fb)",
                    fontSize: 14,
                    fontFamily: "var(--font-inter)",
                    boxShadow: "0 4px 20px rgba(108,92,231,0.38)",
                    border: "none",
                    opacity: checkoutLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!checkoutLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(108,92,231,0.52)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(108,92,231,0.38)"; }}
                >
                  {checkoutLoading ? "Redirecting…" : "Upgrade Now"}
                  {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Creative Studio quick link (paid only) ── */}
        {!subLoading && isPaid && (
          <motion.div {...fade(0.2)}>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Creative Studio card */}
              <div
                className="rounded-2xl px-6 py-5 flex items-center justify-between gap-4 cursor-pointer group transition-all"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
                onClick={() => router.push("/")}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 28px rgba(108,92,231,0.12)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(108,92,231,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.08)"; }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(108,92,231,0.12), rgba(224,64,251,0.12))" }}>
                    <Palette className="w-5 h-5" style={{ color: "#6c5ce7" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>Creative Studio</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>Generate ad creatives & copy</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#6c5ce7" }} />
              </div>

              {/* New analysis card */}
              <div
                className="rounded-2xl px-6 py-5 flex items-center justify-between gap-4 cursor-pointer group transition-all"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
                onClick={() => router.push("/")}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 28px rgba(0,184,148,0.12)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,184,148,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.08)"; }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,184,148,0.10)" }}>
                    <Upload className="w-5 h-5" style={{ color: "#00b894" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>New Analysis</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>Upload a Meta Ads CSV</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#00b894" }} />
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
