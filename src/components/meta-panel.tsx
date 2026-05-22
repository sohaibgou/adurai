"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Link2Off, CheckCircle2, AlertCircle,
  Zap, Clock,
} from "lucide-react";
import type { AnalysisResult, OnboardingData } from "@/lib/types";
import ProUpgradeModal from "@/components/pro-upgrade-modal";

// ── Types ────────────────────────────────────────────────────────────────────

interface MetaStatus {
  connected:         boolean;
  adAccountId?:      string;
  adAccountName?:    string;
  connectedAt?:      string;
  lastSyncedAt?:     string;
  autopilotEnabled?: boolean;
  status?:           string;
}

interface AnalyzeForm {
  aov:           string;
  cogs:          string;
  breakEvenRoas: string;
  targetCpa:     string;
  market:        string;
  goal:          string;
}

interface MetaPanelProps {
  flashParam?: string | null;
  isPro?:      boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeSince(iso?: string): string {
  if (!iso) return "Never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? "s" : ""} ago`;
}

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: "1px solid #e5e7eb", background: "#fff",
  fontSize: 13, fontFamily: "var(--font-inter)", color: "#0a0a0f",
  outline: "none", boxSizing: "border-box",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MetaPanel({ flashParam, isPro = false }: MetaPanelProps) {
  const router = useRouter();

  const [upgradeOpen,   setUpgradeOpen]   = useState(false);
  const [status,        setStatus]        = useState<MetaStatus | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [connecting,    setConnecting]    = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [flash,         setFlash]         = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Analyze state
  const [showForm,     setShowForm]     = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [form, setForm] = useState<AnalyzeForm>({
    aov:           "100",
    cogs:          "30",
    breakEvenRoas: "2",
    targetCpa:     "50",
    market:        "",
    goal:          "Scale profitable campaigns, cut wasted spend",
  });

  // ── Flash from URL param ──────────────────────────────────────────────────
  useEffect(() => {
    if      (flashParam === "connected")    setFlash({ type: "success", msg: "Meta Ads connected successfully!" });
    else if (flashParam === "denied")       setFlash({ type: "error",   msg: "Connection cancelled." });
    else if (flashParam === "no_accounts")  setFlash({ type: "error",   msg: "No active Meta ad accounts found." });
    else if (flashParam === "error" || flashParam === "db_error")
      setFlash({ type: "error", msg: "Something went wrong. Please try again." });

    if (flashParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("meta");
      window.history.replaceState({}, "", url.toString());
    }
  }, [flashParam]);

  // ── Load status ───────────────────────────────────────────────────────────
  const loadStatus = useCallback(() => {
    setLoading(true);
    fetch("/api/meta/status")
      .then((r) => r.json())
      .then((d: MetaStatus) => setStatus(d))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  async function handleDisconnect() {
    if (!confirm("Disconnect your Meta Ads account?")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/meta/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setFlash({ type: "success", msg: "Meta account disconnected." });
    } catch {
      setFlash({ type: "error", msg: "Failed to disconnect. Please try again." });
    } finally {
      setDisconnecting(false);
    }
  }

  // ── Run live analysis via Claude + Meta MCP ──────────────────────────────
  async function handleAnalyzeLive() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      // Claude is the agent — all Meta operations go through /api/claude-meta
      const res = await fetch("/api/claude-meta", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action:        "analyze",
          aov:           parseFloat(form.aov)           || 100,
          cogs:          parseFloat(form.cogs)          || 30,
          breakEvenRoas: parseFloat(form.breakEvenRoas) || 2,
          targetCpa:     parseFloat(form.targetCpa)     || 50,
          market:        form.market,
          goal:          form.goal,
        }),
      });

      const data = await res.json() as {
        analysis?:      AnalysisResult;
        adAccountName?: string;
        error?:         string;
      };

      if (!res.ok || !data.analysis) throw new Error(data.error ?? "Analysis failed");

      const onboarding: Partial<OnboardingData> = {
        product:          form.market,
        market:           form.market,
        aov:              parseFloat(form.aov)           || 100,
        cogs:             parseFloat(form.cogs)          || 30,
        breakEvenRoas:    parseFloat(form.breakEvenRoas) || 2,
        targetCpa:        parseFloat(form.targetCpa)     || 50,
        mainGoal:         form.goal,
        biggestChallenge: "",
        focusCampaigns:   "",
        monthlyBudget:    "",
        adExperience:     "",
        currentRoas:      0,
      };
      sessionStorage.setItem("adur_results",   JSON.stringify(data.analysis));
      sessionStorage.setItem("adur_form_data", JSON.stringify(onboarding));

      loadStatus();
      setShowForm(false);
      router.push("/results");
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Popup OAuth ───────────────────────────────────────────────────────────
  function connectMeta() {
    const width  = 600;
    const height = 700;
    const left   = window.screenX + Math.round((window.outerWidth  - width)  / 2);
    const top    = window.screenY + Math.round((window.outerHeight - height) / 2);

    const popup = window.open(
      "/api/meta/connect",
      "Connect Meta Account",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`,
    );

    if (!popup) {
      setFlash({ type: "error", msg: "Popup blocked — please allow popups and try again." });
      return;
    }

    setConnecting(true);

    function onMessage(ev: MessageEvent) {
      if (ev.data === "meta_connected") {
        cleanup();
        setFlash({ type: "success", msg: "Meta Ads connected successfully!" });
        router.refresh();
        fetch("/api/meta/status")
          .then((r) => r.json())
          .then((d: MetaStatus) => setStatus(d))
          .catch(() => {});
      } else if (
        ev.data === "meta_connection_failed" ||
        (typeof ev.data === "object" && ev.data?.type === "meta_connection_failed")
      ) {
        cleanup();
        const reason: string | undefined = typeof ev.data === "object" ? ev.data.reason : undefined;
        console.error("[meta-panel] OAuth failed:", reason ?? "unknown");
        setFlash({ type: "error", msg: reason ? `Connection failed: ${reason}` : "Connection failed. Please try again." });
      }
    }

    pollRef.current = setInterval(() => {
      if (popup.closed) cleanup();
    }, 500);

    window.addEventListener("message", onMessage);

    function cleanup() {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener("message", onMessage);
      setConnecting(false);
      try { popup.close(); } catch { /* already closed */ }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
    <ProUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    <div
      style={{
        background:   "#ffffff",
        border:       "1px solid #e8e5e0",
        borderLeft:   "3px solid #6c5ce7",
        borderRadius: 16,
        padding:      32,
        boxShadow:    "0 2px 16px rgba(0,0,0,0.06)",
      }}
    >

      {/* ── Flash banner ── */}
      {flash && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "10px 14px", borderRadius: 12, marginBottom: 20,
          background: flash.type === "success" ? "rgba(22,163,74,0.07)" : "rgba(225,112,85,0.07)",
          border: `1px solid ${flash.type === "success" ? "rgba(22,163,74,0.22)" : "rgba(225,112,85,0.22)"}`,
        }}>
          {flash.type === "success"
            ? <CheckCircle2 style={{ width: 15, height: 15, color: "#16A34A", flexShrink: 0 }} />
            : <AlertCircle  style={{ width: 15, height: 15, color: "#e17055", flexShrink: 0 }} />}
          <span style={{ fontSize: 13, fontWeight: 500, color: flash.type === "success" ? "#16A34A" : "#e17055", fontFamily: "var(--font-inter)" }}>
            {flash.msg}
          </span>
          <button
            onClick={() => setFlash(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── TOP ROW: logo + title + status badge ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>

        {/* Left: Meta logo + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 3px 10px rgba(8,102,255,0.24)",
          }}>
            {/* Facebook f */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0f", fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}>
            Meta Ads
          </span>
        </div>

        {/* Right: status badge */}
        {loading ? (
          <Loader2 style={{ width: 16, height: 16, color: "#d1d5db", animation: "spin 1s linear infinite", flexShrink: 0 }} />
        ) : status?.connected ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 13px", borderRadius: 100,
            background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)",
            flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A", boxShadow: "0 0 6px rgba(22,163,74,0.55)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", fontFamily: "var(--font-inter)" }}>
              Connected ✓
            </span>
          </div>
        ) : (
          <div style={{
            padding: "5px 13px", borderRadius: 100,
            background: "#f3f4f6", border: "1px solid #e5e7eb",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)" }}>
              Not connected
            </span>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 0" }}>
          <Loader2 style={{ width: 15, height: 15, color: "#d1d5db", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>Checking connection…</span>
        </div>

      ) : status?.connected ? (

        /* ═══════════════════════ CONNECTED STATE ═══════════════════════ */
        <>
          {/* Connected pill with account name */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 16px", borderRadius: 100,
              background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.20)",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: "#16A34A", boxShadow: "0 0 7px rgba(22,163,74,0.60)",
              }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", fontFamily: "var(--font-inter)" }}>
                Connected — {status.adAccountName ?? `act_${status.adAccountId}`}
              </span>
            </div>
          </div>

          {/* Last synced */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 28 }}>
            <Clock style={{ width: 12, height: 12, color: "#9ca3af", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>
              Last synced: {timeSince(status.lastSyncedAt)}
            </span>
          </div>

          {/* ── Analyze form (collapsible) ── */}
          {showForm && (
            <div style={{
              background: "#fafafa", borderRadius: 14, padding: 20,
              marginBottom: 20, border: "1px solid #f0ede8",
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", fontFamily: "var(--font-inter)", marginBottom: 16 }}>
                Business context for analysis
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginBottom: 12 }}>
                {([
                  { key: "aov",           label: "Avg. Order Value ($)" },
                  { key: "cogs",          label: "COGS ($)" },
                  { key: "breakEvenRoas", label: "Break-even ROAS" },
                  { key: "targetCpa",     label: "Target CPA ($)" },
                ] as Array<{ key: keyof AnalyzeForm; label: string }>).map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                      {label}
                    </label>
                    <input
                      type="number"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                  Product / Market
                </label>
                <input
                  type="text"
                  value={form.market}
                  placeholder="e.g. Fashion, SaaS, E-commerce"
                  onChange={(e) => setForm((f) => ({ ...f, market: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                  Primary Goal
                </label>
                <input
                  type="text"
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {analyzeError && (
                <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(225,112,85,0.07)", border: "1px solid rgba(225,112,85,0.22)", marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: "#e17055", fontFamily: "var(--font-inter)" }}>{analyzeError}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleAnalyzeLive}
                  disabled={analyzing}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "11px 18px", borderRadius: 100,
                    background: analyzing ? "#9ca3af" : "#6c5ce7",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    fontFamily: "var(--font-inter)", border: "none",
                    cursor: analyzing ? "not-allowed" : "pointer",
                    boxShadow: analyzing ? "none" : "0 4px 16px rgba(108,92,231,0.30)",
                    opacity: analyzing ? 0.75 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {analyzing
                    ? <><Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> Analyzing with Claude…</>
                    : <><Zap style={{ width: 13, height: 13 }} /> Run Live Analysis</>
                  }
                </button>
                <button
                  onClick={() => { setShowForm(false); setAnalyzeError(null); }}
                  style={{
                    padding: "11px 16px", borderRadius: 100, background: "none",
                    border: "1px solid #e5e7eb", color: "#6b7280", fontSize: 13,
                    fontFamily: "var(--font-inter)", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Action row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

            {/* Primary: Analyze Live Account */}
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={analyzing}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 100,
                background: analyzing ? "#9ca3af" : "#6c5ce7",
                color: "#fff", fontSize: 14, fontWeight: 700,
                fontFamily: "var(--font-inter)", border: "none",
                cursor: analyzing ? "not-allowed" : "pointer",
                boxShadow: analyzing ? "none" : "0 4px 20px rgba(108,92,231,0.30)",
                transition: "all 0.15s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => { if (!analyzing) { const b = e.currentTarget; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 8px 28px rgba(108,92,231,0.42)"; } }}
              onMouseLeave={(e) => { const b = e.currentTarget; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(108,92,231,0.30)"; }}
            >
              {analyzing
                ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                : <Zap style={{ width: 14, height: 14 }} />}
              {analyzing ? "Analyzing…" : "Analyze Live Account →"}
            </button>

            {/* Secondary: AI Manager Settings */}
            <Link
              href="/dashboard/autopilot"
              style={{
                fontSize: 14, fontWeight: 600, color: "#6c5ce7",
                textDecoration: "none", fontFamily: "var(--font-inter)",
                letterSpacing: "-0.01em", transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#5a4bd1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6c5ce7"; }}
            >
              AI Manager Settings →
            </Link>

            {/* Disconnect — pushed to far right */}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                marginLeft: "auto",
                fontSize: 12, fontWeight: 600,
                color: disconnecting ? "#d1d5db" : "#fca5a5",
                background: "none", border: "none",
                cursor: disconnecting ? "not-allowed" : "pointer",
                fontFamily: "var(--font-inter)",
                display: "flex", alignItems: "center", gap: 5,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { if (!disconnecting) (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { if (!disconnecting) (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5"; }}
            >
              {disconnecting
                ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
                : <Link2Off style={{ width: 12, height: 12 }} />}
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        </>

      ) : (

        /* ═══════════════════════ DISCONNECTED STATE ═══════════════════════ */
        <>
          {/* Headline */}
          <h2
            className="font-heading"
            style={{
              fontSize: 22, fontWeight: 700, color: "#0a0a0f",
              letterSpacing: "-0.03em", lineHeight: 1.25, marginBottom: 12,
            }}
          >
            Let Adur manage your Meta Ads — automatically
          </h2>

          {/* Subtext */}
          <p style={{
            fontSize: 15, color: "#6b7280",
            fontFamily: "var(--font-inter)",
            lineHeight: 1.65, marginBottom: 22,
            maxWidth: 560,
          }}>
            Connect your account once. Adur monitors 24/7, detects profit leaks, scales winners, and sends you a daily briefing — while you focus on your business.
          </p>

          {/* 3 feature pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {[
              "⚡ Live campaign data",
              "🤖 AI-powered decisions",
              "📧 Daily briefings",
            ].map((pill) => (
              <span
                key={pill}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "6px 15px", borderRadius: 100,
                  background: "#f3f0ff",
                  fontSize: 13, fontWeight: 600, color: "#6c5ce7",
                  fontFamily: "var(--font-inter)", letterSpacing: "-0.01em",
                }}
              >
                {pill}
              </span>
            ))}
          </div>

          {/* CTA — Facebook OAuth popup (Pro) or upgrade prompt (free) */}
          {isPro ? (
            <button
              onClick={connectMeta}
              disabled={connecting}
              style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           8,
                padding:       "13px 28px",
                borderRadius:  100,
                background:    connecting
                  ? "linear-gradient(135deg, #4d90ff 0%, #5a9cf5 100%)"
                  : "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
                color:         "#fff",
                fontSize:      14,
                fontWeight:    700,
                border:        "none",
                cursor:        connecting ? "not-allowed" : "pointer",
                boxShadow:     "0 4px 20px rgba(8,102,255,0.32)",
                fontFamily:    "var(--font-inter)",
                transition:    "all 0.15s",
                letterSpacing: "-0.01em",
                marginBottom:  12,
                opacity:       connecting ? 0.8 : 1,
              }}
              onMouseEnter={(e) => { if (!connecting) { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 8px 28px rgba(8,102,255,0.44)"; }}}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(8,102,255,0.32)"; }}
            >
              {connecting ? (
                <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              )}
              {connecting ? "Connecting…" : "Connect Meta Account →"}
            </button>
          ) : (
            <button
              onClick={() => setUpgradeOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 100,
                background: "#6c5ce7",
                color: "#fff", fontSize: 14, fontWeight: 700,
                boxShadow: "0 4px 20px rgba(108,92,231,0.32)",
                fontFamily: "var(--font-inter)", transition: "all 0.15s",
                letterSpacing: "-0.01em",
                marginBottom: 12, border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 8px 28px rgba(108,92,231,0.44)"; }}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(108,92,231,0.32)"; }}
            >
              Connect Meta Account →
            </button>
          )}

          {/* Disclaimer */}
          <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
            {isPro
              ? "Authorise via Meta Business OAuth — no app setup needed."
              : "Available on Pro plan · $99/month"}
          </p>
        </>
      )}
    </div>
    </>
  );
}
