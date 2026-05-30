"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CreativeStudio, { type SavedSession } from "@/components/creative-studio";
import PaywallModal from "@/components/paywall-modal";
import AppSidebar from "@/components/app-sidebar";
import EmailVerifyBanner from "@/components/email-verify-banner";
import VerifyGate from "@/components/verify-gate";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { AnalysisResult } from "@/lib/types";

/* ── Constants ──────────────────────────────────────────── */

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];
type PaywallReason = "analysis" | "image" | "copy" | "ugc";

/* ── Page ───────────────────────────────────────────────── */

export default function CreativeStudioPage() {
  const router = useRouter();
  const { user, loading: authLoading, session, signOut } = useAuth();

  const [hydrated,      setHydrated]      = useState(false);
  const [analysis,      setAnalysis]      = useState<AnalysisResult | null>(null);
  const [paidPlan,      setPaidPlan]      = useState(false);
  const [planName,      setPlanName]      = useState<string | null>(null);
  const [subLoading,    setSubLoading]    = useState(true);
  const [paywallOpen,   setPaywallOpen]   = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason | undefined>(undefined);
  const [creatives,     setCreatives]     = useState<SavedSession[]>([]);
  const [libLoaded,     setLibLoaded]     = useState(false);

  const analysisFetchedRef = useRef(false);

  useEffect(() => {
    try { const raw = sessionStorage.getItem("adur_results"); if (raw) setAnalysis(JSON.parse(raw) as AnalysisResult); } catch { /**/ }
    try { if (localStorage.getItem("adur_plan") === "starter") setPaidPlan(true); } catch { /**/ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!user || analysisFetchedRef.current) return;
    try { if (sessionStorage.getItem("adur_results")) return; } catch { /**/ }
    analysisFetchedRef.current = true;
    (async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        const token = s?.access_token;
        if (!token) return;
        const res  = await fetch("/api/analyses/latest", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json() as { analysis?: AnalysisResult };
        if (data.analysis) setAnalysis(data.analysis);
      } catch { /**/ }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) { setSubLoading(false); return; }
    setSubLoading(true);
    (async () => {
      try {
        const { data } = await supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).maybeSingle();
        if (data?.status === "active") {
          setPaidPlan(true); setPlanName(data.plan ?? null);
          try { localStorage.setItem("adur_plan", data.plan ?? "starter"); } catch { /**/ }
        } else {
          setPaidPlan(false); setPlanName(null);
          try { localStorage.removeItem("adur_plan"); } catch { /**/ }
        }
      } catch { /**/ } finally { setSubLoading(false); }
    })();
  }, [user]);

  const loadCreatives = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    try {
      const res  = await fetch("/api/creatives/list", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as { creatives?: SavedSession[] };
      setCreatives(data.creatives ?? []);
    } catch { /**/ } finally { setLibLoaded(true); }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token && !libLoaded) loadCreatives();
  }, [session?.access_token, libLoaded, loadCreatives]);

  const isPaid    = paidPlan || !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const isAdmin   = !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const isProPlan = planName === "pro" || isAdmin;

  if (!hydrated || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F18" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,60,172,0.2)", borderTopColor: "#FF3CAC" }} />
      </div>
    );
  }

  return (
    /* Full-viewport dark shell — sidebar + main column */
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", background: "#0F0F18" }}>

      {/* ── Sidebar ── */}
      <AppSidebar
        activePage="creative-studio"
        isPaid={isPaid}
        subLoading={subLoading}
        user={user}
        onSignOut={async () => { await signOut(); router.push("/"); }}
        onUpgrade={() => { setPaywallReason(undefined); setPaywallOpen(true); }}
      />

      {/* ── Main column ── */}
      <div
        className="lg:ml-60"
        style={{ flex: 1, minWidth: 0, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Slim header */}
        <header style={{
          height: 52, flexShrink: 0,
          background: "rgba(15,15,24,0.95)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.55)" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(238,238,245,0.55)", letterSpacing: "-0.01em" }}>Creative Studio</span>
            {analysis && (
              <span style={{ fontSize: 11, background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.22)", color: "#4ade80", padding: "2px 8px", borderRadius: 100 }}>
                Score {analysis.score}
              </span>
            )}
          </div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{user.email}</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                {(user.email?.[0] ?? "U").toUpperCase()}
              </div>
            </div>
          )}
        </header>

        <EmailVerifyBanner />

        {/* Content fills remaining height */}
        <VerifyGate>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <CreativeStudio
              summaries={analysis?.summaries ?? []}
              winners={analysis?.winners}
              isPaid={isPaid}
              isAdmin={isAdmin}
              isProPlan={isProPlan}
              savedSessions={creatives}
              onPaywall={(reason) => { setPaywallReason(reason); setPaywallOpen(true); }}
              onSaved={() => loadCreatives()}
              onLibraryOpen={() => loadCreatives()}
            />
          </div>
        </VerifyGate>
      </div>

      {/* ── Paywall ── */}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reason={paywallReason}
        currentPlan={isAdmin ? "pro" : isProPlan ? "pro" : isPaid ? "starter" : "free"}
      />
    </div>
  );
}
