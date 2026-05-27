"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Loader2,
  BarChart3,
  Table2,
  Sparkles,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  MousePointer,
  ArrowLeft,
  Plus,
} from "lucide-react";
import AppSidebar from "@/components/app-sidebar";
import EmailVerifyBanner from "@/components/email-verify-banner";
import VerifyGate from "@/components/verify-gate";
import CampaignTable from "@/components/campaign-table";
import SpendRoasChart from "@/components/spend-roas-chart";
import Recommendations from "@/components/recommendations";
import ProfitLeakBanner from "@/components/profit-leak-banner";
import PaywallModal from "@/components/paywall-modal";
import type { AnalysisResult, OnboardingData } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

/* ── Constants ───────────────────────────────────────────── */

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

function isPaidPlan(): boolean {
  try {
    return localStorage.getItem("adur_plan") === "starter";
  } catch {
    return false;
  }
}

function scoreGradient(score: number): string {
  if (score >= 75) return "linear-gradient(135deg, #16A34A, #22c55e)";
  if (score >= 50) return "linear-gradient(135deg, #A16207, #d97706)";
  return "linear-gradient(135deg, #e17055, #ef4444)";
}

function scoreColor(score: number): string {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#A16207";
  return "#e17055";
}

/* ── MetricCard ──────────────────────────────────────────── */

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
}

function MetricCard({ label, value, sub, subColor, iconBg, iconColor, icon: Icon }: MetricCardProps) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E5E0",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#A8A5A0",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-inter)",
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ width: 16, height: 16, color: iconColor }} />
        </div>
      </div>
      <p
        className="font-heading"
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: "#0D0D12",
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          marginBottom: 5,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 11,
          color: subColor ?? "#A8A5A0",
          fontFamily: "var(--font-inter)",
          fontWeight: subColor ? 600 : 400,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

/* ── Tab types ───────────────────────────────────────────── */

type TabId = "overview" | "campaigns" | "insights";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "campaigns", label: "Campaigns", icon: Table2 },
  { id: "insights", label: "AI Insights", icon: Sparkles },
];

/* ── Main page ───────────────────────────────────────────── */

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id"); // specific analysis to load (from dashboard)
  const { user, session, loading: authLoading, signOut } = useAuth();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"analysis" | "image" | "copy">("analysis");
  const [paidPlan, setPaidPlan] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [needsDbFetch, setNeedsDbFetch] = useState(false);

  useEffect(() => {
    document.title = "Your Campaign Analysis — Adur.ai";
  }, []);

  /* ── Step 1: Try sessionStorage on mount (skip when a specific ID is requested) ── */
  useEffect(() => {
    // If a specific analysis ID is in the URL, always go to the DB —
    // sessionStorage only has the most-recent result, not the clicked one.
    if (analysisId) {
      setNeedsDbFetch(true);
      return;
    }
    try {
      const rawResults  = sessionStorage.getItem("adur_results");
      const rawFormData = sessionStorage.getItem("adur_form_data");
      if (rawResults) {
        setAnalysis(JSON.parse(rawResults) as AnalysisResult);
        if (rawFormData) setOnboarding(JSON.parse(rawFormData) as OnboardingData);
        setPaidPlan(isPaidPlan());
        setHydrated(true);
        return;
      }
    } catch { /* ignore */ }
    // sessionStorage empty — wait for auth then try DB
    setNeedsDbFetch(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Step 2: If sessionStorage was empty, fetch latest from DB once auth is ready ── */
  useEffect(() => {
    if (!needsDbFetch || authLoading) return;

    if (!user || !session) {
      // Not logged in — nothing to fetch
      setNoResults(true);
      setPaidPlan(isPaidPlan());
      setHydrated(true);
      setNeedsDbFetch(false);
      return;
    }

    (async () => {
      try {
        // Append specific ID when coming from the dashboard Recent Analyses list
        const url = analysisId
          ? `/api/analyses/latest?id=${encodeURIComponent(analysisId)}`
          : "/api/analyses/latest";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const body = await res.json() as {
            analysis: AnalysisResult | null;
            formData: OnboardingData | null;
          };
          if (body.analysis) {
            setAnalysis(body.analysis);
            if (body.formData) setOnboarding(body.formData);
            // Only repopulate sessionStorage for "latest" fetches, not for
            // specific-ID fetches (we don't want to overwrite the current result)
            if (!analysisId) {
              try {
                sessionStorage.setItem("adur_results", JSON.stringify(body.analysis));
                if (body.formData) sessionStorage.setItem("adur_form_data", JSON.stringify(body.formData));
              } catch { /* noop */ }
            }
          } else if (analysisId) {
            // Specific ID not found in DB (table may not exist yet, or ID is stale).
            // Fallback chain: sessionStorage → DB latest → no results
            let recovered = false;
            try {
              const raw = sessionStorage.getItem("adur_results");
              if (raw) {
                setAnalysis(JSON.parse(raw) as AnalysisResult);
                const rawForm = sessionStorage.getItem("adur_form_data");
                if (rawForm) setOnboarding(JSON.parse(rawForm) as OnboardingData);
                recovered = true;
              }
            } catch { /* ignore */ }

            if (!recovered) {
              // Last resort: try DB latest (no ID filter)
              try {
                const fallbackRes = await fetch("/api/analyses/latest", {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (fallbackRes.ok) {
                  const fallback = await fallbackRes.json() as { analysis: AnalysisResult | null; formData: OnboardingData | null };
                  if (fallback.analysis) {
                    setAnalysis(fallback.analysis);
                    if (fallback.formData) setOnboarding(fallback.formData);
                    recovered = true;
                  }
                }
              } catch { /* ignore */ }
            }

            if (!recovered) setNoResults(true);
          } else {
            setNoResults(true);
          }
        } else {
          setNoResults(true);
        }
      } catch {
        setNoResults(true);
      } finally {
        setPaidPlan(isPaidPlan());
        setHydrated(true);
        setNeedsDbFetch(false);
      }
    })();
  }, [needsDbFetch, authLoading, user, session]);

  /* ── Sync paid status from Supabase ── */
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
          try {
            localStorage.setItem("adur_plan", "starter");
          } catch {
            /* noop */
          }
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

  /* ── Loading state ── */
  if (!hydrated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F7F5F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Loader2
            className="animate-spin"
            style={{ width: 32, height: 32, color: "#FF3CAC" }}
          />
          <p
            style={{
              fontSize: 14,
              color: "#6B6B72",
              fontFamily: "var(--font-inter)",
            }}
          >
            Loading your analysis…
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (noResults) {
    const isPaidEmpty = paidPlan || !!(user?.email && ADMIN_EMAILS.includes(user.email));
    return (
      <>
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} reason={paywallReason} />
      <div style={{ display: "flex", minHeight: "100vh", background: "#F7F5F2" }}>
        <AppSidebar
          activePage="results"
          isPaid={isPaidEmpty}
          subLoading={authLoading}
          user={user}
          onSignOut={async () => { await signOut(); router.push("/"); }}
          onUpgrade={() => { setPaywallReason("analysis"); setPaywallOpen(true); }}
        />
        <div style={{ flex: 1 }} className="lg:ml-60">
          {/* Top bar — empty state */}
          <header
            className="pl-14 pr-4 lg:px-8"
            style={{
              height: 64,
              background: "rgba(247,245,242,0.90)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid #E8E5E0",
              position: "sticky",
              top: 0,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 34, width: "auto" }} />
            </div>

            {/* Desktop left */}
            <div className="hidden lg:flex items-center gap-2" style={{ fontFamily: "var(--font-inter)" }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, color: "#A8A5A0", fontSize: 13, fontWeight: 500, transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F0EDE8"; (e.currentTarget as HTMLButtonElement).style.color = "#0D0D12"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#A8A5A0"; }}
              >
                <ArrowLeft style={{ width: 13, height: 13 }} />
                Dashboard
              </button>
              <span style={{ color: "#D4D0CA", fontSize: 14 }}>›</span>
              <span className="font-heading" style={{ fontSize: 15, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.02em" }}>Results</span>
            </div>

            {/* Right */}
            {!authLoading && user && (
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(255,60,172,0.26)", flexShrink: 0 }} title={user.email ?? ""}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "var(--font-inter)" }}>
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </span>
              </div>
            )}
          </header>

          {/* Empty state body */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "40px 24px", textAlign: "center" }}>
            {/* Illustration */}
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,60,172,0.08)", border: "1.5px solid rgba(255,60,172,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
              <BarChart3 style={{ width: 36, height: 36, color: "#FF3CAC", opacity: 0.6 }} />
            </div>

            <h2 className="font-heading" style={{ fontSize: 26, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: 10 }}>
              No results yet
            </h2>
            <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.65, maxWidth: 360, marginBottom: 32 }}>
              You haven&apos;t run any analysis in this session. Upload your Meta Ads CSV and get a full breakdown in under 60 seconds.
            </p>

            <button
              onClick={() => router.push("/analyze")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: 100,
                background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                fontFamily: "var(--font-inter)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(255,60,172,0.34)",
                letterSpacing: "-0.01em",
                transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Analyze My Campaigns
            </button>

            <p style={{ marginTop: 16, fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
              Free · no credit card needed
            </p>
          </div>
        </div>
      </div>
      </>
    );
  }

  const summaries = analysis?.summaries ?? [];
  const score = analysis?.score ?? 0;
  const isPaid = paidPlan || !!(user?.email && ADMIN_EMAILS.includes(user.email));

  /* ── Derived metrics ── */
  const totalSpend = analysis?.totalSpend ?? 0;
  const totalRevenue = analysis?.totalRevenue ?? 0;
  const convResults = analysis?.convResults ?? 0;
  const convBestRoas = analysis?.convBestRoas ?? 0;
  const isRoasMode = analysis?.analysisMode === "roas";

  const bestRoasColor =
    convBestRoas >= 2 ? "#16A34A" : convBestRoas >= 1 ? "#A16207" : "#e17055";
  const bestRoasBg =
    convBestRoas >= 2
      ? "rgba(22,163,74,0.10)"
      : convBestRoas >= 1
      ? "rgba(161,98,7,0.10)"
      : "rgba(225,112,85,0.10)";

  const userInitial = (user?.email?.[0] ?? "U").toUpperCase();

  const isTrafficWarning =
    analysis?.analysisMode === "traffic" &&
    !summaries.some(
      (s) => s.objective === "CONVERSIONS" || s.objective === "LEADS"
    );

  /* ── Render ── */
  return (
    <>
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reason={paywallReason}
      />

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#F7F5F2",
        }}
      >
        {/* ── Sidebar ── */}
        <AppSidebar
          activePage="results"
          isPaid={isPaid}
          subLoading={authLoading}
          user={user}
          onSignOut={async () => {
            await signOut();
            router.push("/");
          }}
          onUpgrade={() => {
            setPaywallReason("analysis");
            setPaywallOpen(true);
          }}
        />

        {/* ── Main area ── */}
        <div style={{ flex: 1 }} className="lg:ml-60">

          {/* ── Sticky top bar ── */}
          <header
            className="pl-14 pr-4 lg:px-8"
            style={{
              height: 64,
              background: "rgba(247,245,242,0.90)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderBottom: "1px solid #E8E5E0",
              position: "sticky",
              top: 0,
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 34, width: "auto" }} />
            </div>

            {/* Desktop left — back link · title · score badge · campaign count */}
            <div className="hidden lg:flex items-center gap-2 min-w-0" style={{ fontFamily: "var(--font-inter)" }}>
              {/* Back */}
              <button
                onClick={() => router.push("/dashboard")}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 8, color: "#A8A5A0", fontSize: 13, fontWeight: 500, flexShrink: 0, transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F0EDE8"; (e.currentTarget as HTMLButtonElement).style.color = "#0D0D12"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#A8A5A0"; }}
              >
                <ArrowLeft style={{ width: 13, height: 13 }} />
                Dashboard
              </button>

              <span style={{ color: "#D4D0CA", fontSize: 14, flexShrink: 0 }}>›</span>

              {/* Title */}
              <span className="font-heading" style={{ fontSize: 15, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.02em", flexShrink: 0 }}>
                Results
              </span>

              {/* Score badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 8, flexShrink: 0,
                background: score >= 75 ? "rgba(22,163,74,0.10)" : score >= 50 ? "rgba(161,98,7,0.10)" : "rgba(225,112,85,0.10)",
                border: `1px solid ${score >= 75 ? "rgba(22,163,74,0.22)" : score >= 50 ? "rgba(161,98,7,0.22)" : "rgba(225,112,85,0.22)"}`,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: score >= 75 ? "#16A34A" : score >= 50 ? "#A16207" : "#e17055",
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: score >= 75 ? "#16A34A" : score >= 50 ? "#A16207" : "#e17055" }}>
                  {score}/100
                </span>
              </div>

              {/* Campaign count */}
              {summaries.length > 0 && (
                <span style={{ fontSize: 12, color: "#A8A5A0", flexShrink: 0 }}>
                  · {summaries.length} campaign{summaries.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Right: actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* New Analysis */}
              <button
                onClick={() => router.push("/analyze")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  border: "1px solid #E8E5E0",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#6B6B72",
                  fontFamily: "var(--font-inter)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#FF3CAC";
                  (e.currentTarget as HTMLButtonElement).style.color = "#FF3CAC";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E5E0";
                  (e.currentTarget as HTMLButtonElement).style.color = "#6B6B72";
                }}
              >
                <Plus style={{ width: 13, height: 13 }} />
                <span className="hidden sm:inline">New Analysis</span>
              </button>

              {/* Download PDF */}
              {analysis && (
                <button
                  onClick={downloadPdf}
                  disabled={isExporting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: isExporting
                      ? "#C8C5C0"
                      : "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                    color: "#fff",
                    cursor: isExporting ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "var(--font-inter)",
                    boxShadow: isExporting
                      ? "none"
                      : "0 3px 14px rgba(255,60,172,0.30)",
                    transition: "all 0.15s",
                    opacity: isExporting ? 0.7 : 1,
                  }}
                >
                  <Download style={{ width: 13, height: 13 }} />
                  <span className="hidden sm:inline">
                    {isExporting ? "Exporting…" : "Download PDF"}
                  </span>
                </button>
              )}

              {/* User avatar */}
              {!authLoading && user && (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 3px 10px rgba(255,60,172,0.26)",
                    flexShrink: 0,
                    cursor: "default",
                  }}
                  title={user.email ?? ""}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {userInitial}
                  </span>
                </div>
              )}
            </div>
          </header>

          <EmailVerifyBanner />

          <VerifyGate>
          {/* ── Tab navigation bar ── */}
          <div
            style={{
              background: "#FFFFFF",
              borderBottom: "1px solid #E8E5E0",
              position: "sticky",
              top: 64,
              zIndex: 10,
            }}
          >
            <div
              className="px-6 lg:px-8"
              style={{ display: "flex", gap: 4, paddingTop: 8, paddingBottom: 8 }}
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      background: isActive
                        ? "linear-gradient(135deg, #FF3CAC, #FF6B35)"
                        : "transparent",
                      color: isActive ? "#fff" : "#6B6B72",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "var(--font-inter)",
                      boxShadow: isActive
                        ? "0 3px 12px rgba(255,60,172,0.28)"
                        : "none",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Page content ── */}
          {analysis && (
            <main className="px-6 lg:px-8 py-8">

              {/* ── Hero section ── */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginBottom: 32 }}
              >
                {/* Pink badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 20,
                    background: "rgba(255,60,172,0.08)",
                    border: "1px solid rgba(255,60,172,0.18)",
                    marginBottom: 14,
                  }}
                >
                  <Sparkles style={{ width: 11, height: 11, color: "#FF3CAC" }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#FF3CAC",
                      textTransform: "uppercase",
                      letterSpacing: "0.09em",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Analysis Results
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <h1
                        className="font-heading"
                        style={{
                          fontSize: 32,
                          fontWeight: 900,
                          color: "#0D0D12",
                          letterSpacing: "-0.04em",
                          lineHeight: 1.1,
                        }}
                      >
                        Campaign Analysis
                      </h1>
                      {/* Score badge */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: scoreGradient(score),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="font-heading"
                          style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color: "#fff",
                            letterSpacing: "-0.03em",
                          }}
                        >
                          {score}
                        </span>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: 14,
                        color: "#6B6B72",
                        marginTop: 8,
                        fontFamily: "var(--font-inter)",
                        lineHeight: 1.5,
                      }}
                    >
                      {summaries.length} campaign{summaries.length !== 1 ? "s" : ""}
                      {onboarding && (
                        <>
                          {" · "}
                          <span style={{ color: "#0D0D12", fontWeight: 600 }}>
                            {onboarding.product}
                          </span>
                          {" · "}
                          {onboarding.market}
                          {onboarding.breakEvenRoas > 0 && (
                            <>
                              {" · Break-even "}
                              <span style={{ fontWeight: 700, color: "#0D0D12" }}>
                                {onboarding.breakEvenRoas}×
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Traffic mode warning */}
                  {isTrafficWarning && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: "#FFF8E6",
                        border: "1px solid #FDE9A0",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#A16207",
                          fontWeight: 500,
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        Traffic mode — no revenue data detected
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ── Tab content ── */}
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-6"
                    style={{ paddingTop: 0 }}
                  >
                    {/* ── Metric cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total Spend */}
                      <MetricCard
                        label="Total Spend"
                        value={`$${totalSpend.toLocaleString()}`}
                        sub="Ad spend across all campaigns"
                        iconBg="rgba(255,60,172,0.10)"
                        iconColor="#FF3CAC"
                        icon={DollarSign}
                      />

                      {/* Revenue */}
                      {isRoasMode ? (
                        <MetricCard
                          label="Revenue"
                          value={`$${totalRevenue.toLocaleString()}`}
                          sub={
                            totalSpend > 0
                              ? `${(totalRevenue / totalSpend).toFixed(2)}× blended ROAS`
                              : "Total attributed revenue"
                          }
                          subColor={
                            totalSpend > 0 && totalRevenue / totalSpend >= 2
                              ? "#16A34A"
                              : undefined
                          }
                          iconBg="rgba(22,163,74,0.10)"
                          iconColor="#16A34A"
                          icon={TrendingUp}
                        />
                      ) : (
                        <MetricCard
                          label="Revenue"
                          value="—"
                          sub="Traffic mode — no revenue"
                          iconBg="rgba(22,163,74,0.10)"
                          iconColor="#16A34A"
                          icon={TrendingUp}
                        />
                      )}

                      {/* Best ROAS */}
                      <MetricCard
                        label="Best ROAS"
                        value={`${convBestRoas.toFixed(1)}×`}
                        sub={
                          convBestRoas >= 2
                            ? "Above break-even"
                            : convBestRoas >= 1
                            ? "Near break-even"
                            : "Below break-even"
                        }
                        subColor={bestRoasColor}
                        iconBg={bestRoasBg}
                        iconColor={bestRoasColor}
                        icon={BarChart3}
                      />

                      {/* Conversions / Traffic */}
                      {isRoasMode ? (
                        <MetricCard
                          label="Conversions"
                          value={convResults.toLocaleString()}
                          sub="Total conversion results"
                          iconBg="rgba(99,102,241,0.10)"
                          iconColor="#6366f1"
                          icon={ShoppingCart}
                        />
                      ) : (
                        <MetricCard
                          label="Mode"
                          value="Traffic"
                          sub="Click & reach focused"
                          iconBg="rgba(99,102,241,0.10)"
                          iconColor="#6366f1"
                          icon={MousePointer}
                        />
                      )}
                    </div>

                    {/* ── Profit Leak Banner ── */}
                    {onboarding && (
                      <ProfitLeakBanner
                        summaries={analysis.summaries ?? []}
                        onboarding={onboarding}
                      />
                    )}

                    {/* ── Spend vs ROAS Chart ── */}
                    {summaries.length > 0 ? (
                      <div
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E8E5E0",
                          borderRadius: 20,
                          padding: "24px",
                          overflow: "hidden",
                        }}
                      >
                        <h3
                          className="font-heading"
                          style={{
                            fontSize: 17,
                            fontWeight: 900,
                            color: "#0D0D12",
                            letterSpacing: "-0.03em",
                            marginBottom: 20,
                          }}
                        >
                          Spend vs ROAS
                        </h3>
                        <SpendRoasChart
                          summaries={summaries}
                          analysisMode={analysis.analysisMode}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center gap-3 py-12 rounded-2xl"
                        style={{ background: "#FFFFFF", border: "1px solid #E8E5E0" }}
                      >
                        <span style={{ fontSize: 28 }}>📊</span>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                          Campaign chart not available
                        </p>
                        <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "var(--font-inter)", textAlign: "center", maxWidth: 340 }}>
                          This analysis was saved before per-campaign data was stored. Run a new analysis to see the full chart and table.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "campaigns" && (
                  <motion.div
                    key="campaigns"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {summaries.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl"
                        style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", marginTop: 8 }}
                      >
                        <span style={{ fontSize: 28 }}>📋</span>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                          Campaign data not available
                        </p>
                        <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "var(--font-inter)", textAlign: "center", maxWidth: 340 }}>
                          This analysis was saved before per-campaign data was stored. Run a new analysis to see the full campaign breakdown.
                        </p>
                      </div>
                    ) : (
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E8E5E0",
                        borderRadius: 20,
                        overflow: "hidden",
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          padding: "20px 24px",
                          borderBottom: "1px solid #F0EDE8",
                        }}
                      >
                        <h3
                          className="font-heading"
                          style={{
                            fontSize: 17,
                            fontWeight: 900,
                            color: "#0D0D12",
                            letterSpacing: "-0.03em",
                          }}
                        >
                          Campaign Breakdown
                        </h3>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#A8A5A0",
                            fontFamily: "var(--font-inter)",
                            marginTop: 4,
                          }}
                        >
                          {summaries.length} campaign{summaries.length !== 1 ? "s" : ""} analyzed
                        </p>
                      </div>
                      <CampaignTable
                        summaries={summaries}
                        analysisMode={analysis.analysisMode}
                      />
                    </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "insights" && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-6"
                    style={{ paddingTop: 8 }}
                  >
                    {/* ── Score hero card ── */}
                    <div
                      style={{
                        background: "#0D0D12",
                        borderRadius: 20,
                        padding: "28px 32px",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Pink orb glow */}
                      <div
                        style={{
                          position: "absolute",
                          top: -40,
                          right: 60,
                          width: 180,
                          height: 180,
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle, rgba(255,60,172,0.35) 0%, transparent 70%)",
                          filter: "blur(30px)",
                          pointerEvents: "none",
                        }}
                      />

                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 20,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <Sparkles
                              style={{ width: 16, height: 16, color: "#FF3CAC", flexShrink: 0 }}
                            />
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#FF3CAC",
                                textTransform: "uppercase",
                                letterSpacing: "0.09em",
                                fontFamily: "var(--font-inter)",
                              }}
                            >
                              AI Health Score
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 13,
                              color: "rgba(255,255,255,0.55)",
                              fontFamily: "var(--font-inter)",
                              lineHeight: 1.6,
                              maxWidth: 400,
                            }}
                          >
                            {analysis.summary?.slice(0, 140)}
                            {analysis.summary && analysis.summary.length > 140 ? "…" : ""}
                          </p>
                        </div>

                        {/* Score circle */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            background: scoreGradient(score),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 8px 32px ${scoreColor(score)}66`,
                          }}
                        >
                          <span
                            className="font-heading"
                            style={{
                              fontSize: 28,
                              fontWeight: 900,
                              color: "#fff",
                              letterSpacing: "-0.04em",
                            }}
                          >
                            {score}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Recommendations ── */}
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E8E5E0",
                        borderRadius: 20,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          padding: "20px 24px",
                          borderBottom: "1px solid #F0EDE8",
                        }}
                      >
                        <h3
                          className="font-heading"
                          style={{
                            fontSize: 17,
                            fontWeight: 900,
                            color: "#0D0D12",
                            letterSpacing: "-0.03em",
                          }}
                        >
                          Recommendations & Battle Plan
                        </h3>
                      </div>
                      <div style={{ padding: "24px" }}>
                        <Recommendations
                          summary={analysis.summary}
                          score={analysis.score}
                          winners={analysis.winners}
                          killers={analysis.killers}
                          recommendations={analysis.recommendations}
                          battlePlan={analysis.battlePlan}
                          insights={analysis.insights}
                          summaries={analysis.summaries ?? []}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          )}
          </VerifyGate>
        </div>
      </div>
    </>
  );
}
