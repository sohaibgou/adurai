"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import CreativeStudio, { type SavedSession } from "@/components/creative-studio";
import PaywallModal from "@/components/paywall-modal";
import AppSidebar from "@/components/app-sidebar";
import EmailVerifyBanner from "@/components/email-verify-banner";
import VerifyGate from "@/components/verify-gate";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";
import type { AnalysisResult } from "@/lib/types";

/* ── Constants ──────────────────────────────────────────── */

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

type PaywallReason = "analysis" | "image" | "copy" | "ugc";


/* ── Page ───────────────────────────────────────────────── */

export default function CreativeStudioPage() {
  const router = useRouter();
  const { user, loading: authLoading, session, signOut } = useAuth();

  const [hydrated,       setHydrated]       = useState(false);
  const [analysis,       setAnalysis]       = useState<AnalysisResult | null>(null);
  const [paidPlan,       setPaidPlan]       = useState(false);
  const [planName,       setPlanName]       = useState<string | null>(null);
  const [subLoading,     setSubLoading]     = useState(true);
  const [paywallOpen,    setPaywallOpen]    = useState(false);
  const [paywallReason,  setPaywallReason]  = useState<PaywallReason | undefined>(undefined);

  // Saved sessions for in-tab history
  const [creatives,  setCreatives]  = useState<SavedSession[]>([]);
  const [libLoaded,  setLibLoaded]  = useState(false);

  const analysisFetchedRef = useRef(false);

  /* ── Hydrate from sessionStorage on mount ── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("adur_results");
      if (raw) setAnalysis(JSON.parse(raw) as AnalysisResult);
    } catch { /* ignore */ }

    try {
      if (localStorage.getItem("adur_plan") === "starter") setPaidPlan(true);
    } catch { /* ignore */ }

    setHydrated(true);
  }, []);

  /* ── DB fallback: load latest analysis when sessionStorage is empty ── */
  useEffect(() => {
    if (!user || analysisFetchedRef.current) return;
    // If sessionStorage already gave us an analysis, skip the DB call
    try {
      if (sessionStorage.getItem("adur_results")) return;
    } catch { /* ignore */ }

    analysisFetchedRef.current = true;

    (async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        const token = s?.access_token;
        if (!token) return;
        const res  = await fetch("/api/analyses/latest", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as { analysis?: AnalysisResult };
        if (data.analysis) setAnalysis(data.analysis);
      } catch { /* non-critical — studio still works without analysis */ }
    })();
  }, [user]);

  /* ── Check Supabase subscription when user changes ── */
  useEffect(() => {
    if (!user) { setSubLoading(false); return; }
    setSubLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.status === "active") {
          setPaidPlan(true);
          setPlanName(data.plan ?? null);
          // Sync to localStorage so components can gate features client-side
          try { localStorage.setItem("adur_plan", data.plan ?? "starter"); } catch { /* noop */ }
        } else {
          // No active subscription — reset so stale localStorage never grants access
          setPaidPlan(false);
          setPlanName(null);
          try { localStorage.removeItem("adur_plan"); } catch { /* noop */ }
        }
      } catch { /* treat as free */ } finally {
        setSubLoading(false);
      }
    })();
  }, [user]);

  /* ── Load saved sessions for in-tab history ── */
  const loadCreatives = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    try {
      const res  = await fetch("/api/creatives/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { creatives?: SavedSession[] };
      setCreatives(data.creatives ?? []);
    } catch { /* silent */ } finally {
      setLibLoaded(true);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token && !libLoaded) {
      loadCreatives();
    }
  }, [session?.access_token, libLoaded, loadCreatives]);

  /* ── Derived ── */
  const isPaid    = paidPlan || !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const isAdmin   = !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const isProPlan = planName === "pro" || isAdmin;

  /* ── Loading state (pre-hydration) ── */
  if (!hydrated || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F5F2" }}>
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(255,60,172,0.2)", borderTopColor: "#FF3CAC" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F7F5F2" }}>
      <div className="flex flex-1 min-h-0">

        {/* ═══════════════════════════════════════════════════════
            SIDEBAR
        ════════════════════════════════════════════════════════ */}
        <AppSidebar
          activePage="creative-studio"
          isPaid={isPaid}
          subLoading={subLoading}
          user={user}
          onSignOut={async () => {
            await signOut();
            router.push("/");
          }}
          onUpgrade={() => { setPaywallReason(undefined); setPaywallOpen(true); }}
        />

        {/* ═══════════════════════════════════════════════════════
            MAIN
        ════════════════════════════════════════════════════════ */}
        <div className="flex-1 lg:ml-60 min-w-0 flex flex-col">

          {/* ── Top bar ── */}
          <header
            className="sticky top-0 z-20 flex items-center justify-between pl-14 pr-4 lg:px-8 flex-shrink-0"
            style={{
              height: 64,
              background: "rgba(247,245,242,0.90)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid #E8E5E0",
            }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 34, width: "auto" }} />
            </div>

            {/* Desktop breadcrumb */}
            <p
              className="hidden lg:block font-heading"
              style={{ fontSize: 15, fontWeight: 700, color: "#0D0D12", letterSpacing: "-0.02em" }}
            >
              <span style={{ color: "#A8A5A0" }}>Dashboard</span>
              <span style={{ color: "#C8C5C0", margin: "0 6px" }}>›</span>
              Creative Studio
            </p>

            {/* Right: user avatar + email (desktop only) */}
            {user && (
              <div className="hidden lg:flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 32, height: 32,
                    background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                    boxShadow: "0 3px 8px rgba(255,60,172,0.24)",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "var(--font-inter)" }}>
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13, fontWeight: 500, color: "#4B4B55",
                    fontFamily: "var(--font-inter)",
                    maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </span>
              </div>
            )}
          </header>

          <EmailVerifyBanner />

          <VerifyGate>
            {/* ── Page content ── */}
            <main className="px-6 lg:px-8 py-8 space-y-6">

              {/* 1 — Hero section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {/* Pink badge */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,60,172,0.10), rgba(255,107,53,0.08))",
                      border: "1px solid rgba(255,60,172,0.22)",
                      color: "#FF3CAC",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Creative Studio
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className="font-heading"
                  style={{
                    fontSize: "clamp(28px, 4vw, 40px)",
                    fontWeight: 900,
                    color: "#0D0D12",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                  }}
                >
                  Generate Winning Ad Creatives
                </h1>

                {/* Subtitle */}
                <p
                  style={{
                    fontSize: 15,
                    color: "#6B6B72",
                    fontFamily: "var(--font-inter)",
                    maxWidth: 560,
                    lineHeight: 1.6,
                  }}
                >
                  Create scroll-stopping images and high-converting ad copy powered by your campaign data.
                </p>

                {/* Trust chips */}
                <div className="flex flex-wrap gap-2">
                  {["AI-powered images", "5 copy variants", "Instant generation"].map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E8E5E0",
                        color: "#6B6B72",
                        fontFamily: "var(--font-inter)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* 2 — No-analysis banner OR 3 — Connected pill */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                {!analysis ? (
                  /* Dark banner */
                  <div
                    className="relative overflow-hidden rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                    style={{ background: "#0D0D12", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {/* Pink orb glow */}
                    <div
                      style={{
                        position: "absolute", top: -40, right: -40,
                        width: 180, height: 180, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,60,172,0.30) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-xl"
                        style={{
                          width: 40, height: 40,
                          background: "linear-gradient(135deg, rgba(255,60,172,0.20), rgba(255,107,53,0.12))",
                          border: "1px solid rgba(255,60,172,0.28)",
                        }}
                      >
                        <Sparkles className="w-5 h-5" style={{ color: "#FF3CAC" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>
                          Unlock better creatives with analysis data
                        </p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-inter)", marginTop: 2, lineHeight: 1.5 }}>
                          Run a campaign analysis first — we&apos;ll tailor your creatives to your actual winning campaigns.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push("/analyze")}
                      className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                      style={{
                        background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                        color: "#fff",
                        border: "none",
                        boxShadow: "0 4px 16px rgba(255,60,172,0.36)",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      Run Analysis
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Green connected pill */
                  <div
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(22,163,74,0.07)",
                      border: "1px solid rgba(22,163,74,0.22)",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: "#16A34A", boxShadow: "0 0 6px rgba(22,163,74,0.55)" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", fontFamily: "var(--font-inter)" }}>
                      Connected to your analysis
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A", fontFamily: "var(--font-inter)" }}
                    >
                      Score {analysis.score}
                    </span>
                    <span style={{ color: "rgba(22,163,74,0.50)", fontSize: 13 }}>·</span>
                    <span style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                      {analysis.summaries?.length ?? 0} campaign{(analysis.summaries?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* 4 — CreativeStudio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E5E0",
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <CreativeStudio
                  summaries={analysis?.summaries ?? []}
                  winners={analysis?.winners}
                  isPaid={isPaid}
                  isAdmin={isAdmin}
                  isProPlan={isProPlan}
                  savedSessions={creatives}
                  onPaywall={(reason) => {
                    setPaywallReason(reason);
                    setPaywallOpen(true);
                  }}
                  onSaved={() => loadCreatives()}
                  onLibraryOpen={() => loadCreatives()}
                />
              </motion.div>


            </main>
          </VerifyGate>
        </div>

        {/* ── Paywall modal ── */}
        <PaywallModal
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          reason={paywallReason}
          currentPlan={isAdmin ? "pro" : isProPlan ? "pro" : isPaid ? "starter" : "free"}
        />
      </div>
    </div>
  );
}
