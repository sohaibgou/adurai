"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Link2, Link2Off, CheckCircle2, AlertCircle,
  Zap, RefreshCw, Clock, BarChart3, Power,
} from "lucide-react";
import type { AnalysisResult, OnboardingData } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface MetaStatus {
  connected:        boolean;
  adAccountId?:     string;
  adAccountName?:   string;
  connectedAt?:     string;
  lastSyncedAt?:    string;
  autopilotEnabled?: boolean;
  status?:          string;
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
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeSince(iso?: string): string {
  if (!iso) return "Never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MetaPanel({ flashParam }: MetaPanelProps) {
  const router = useRouter();

  const [status,        setStatus]        = useState<MetaStatus | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [flash,         setFlash]         = useState<{ type: "success" | "error"; msg: string } | null>(null);

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

  // Autopilot state
  const [togglingAutopilot, setTogglingAutopilot] = useState(false);

  // ── Flash from URL param ────────────────────────────────────────────────
  useEffect(() => {
    if      (flashParam === "connected")  setFlash({ type: "success", msg: "Meta Ads connected successfully!" });
    else if (flashParam === "denied")     setFlash({ type: "error",   msg: "Connection cancelled." });
    else if (flashParam === "no_accounts") setFlash({ type: "error",  msg: "No active Meta ad accounts found." });
    else if (flashParam === "error" || flashParam === "db_error")
      setFlash({ type: "error", msg: "Something went wrong. Please try again." });

    if (flashParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("meta");
      window.history.replaceState({}, "", url.toString());
    }
  }, [flashParam]);

  // ── Load status ──────────────────────────────────────────────────────────
  const loadStatus = useCallback(() => {
    setLoading(true);
    fetch("/api/meta/status")
      .then((r) => r.json())
      .then((d: MetaStatus) => setStatus(d))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ── Disconnect ───────────────────────────────────────────────────────────
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

  // ── Autopilot toggle ─────────────────────────────────────────────────────
  async function handleAutopilot(enabled: boolean) {
    setTogglingAutopilot(true);
    try {
      const res = await fetch("/api/meta/autopilot", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ enabled }),
      });
      const data = await res.json() as { autopilotEnabled?: boolean };
      setStatus((prev) => prev ? { ...prev, autopilotEnabled: data.autopilotEnabled } : prev);
    } finally {
      setTogglingAutopilot(false);
    }
  }

  // ── Run live analysis ────────────────────────────────────────────────────
  async function handleAnalyzeLive() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/meta/analyze-live", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
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

      if (!res.ok || !data.analysis) {
        throw new Error(data.error ?? "Analysis failed");
      }

      // Store in sessionStorage exactly like CSV analysis → go to /results
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

      // Refresh last synced
      loadStatus();
      setShowForm(false);
      router.push("/results");

    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        background:   "#FFFFFF",
        border:       "1px solid #E8E5E0",
        borderRadius: 20,
        overflow:     "hidden",
        boxShadow:    "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Gradient top bar ── */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #0866FF, #1877F2)" }} />

      <div style={{ padding: "22px 24px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", lineHeight: 1.3 }}>
              Meta Ads
            </p>
            <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
              {status?.connected ? "Live account connected" : "Connect to analyze your live campaigns"}
            </p>
          </div>
          {/* Status badge */}
          {status?.connected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 100,
              background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)",
              flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A", boxShadow: "0 0 6px rgba(22,163,74,0.55)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", fontFamily: "var(--font-inter)" }}>
                Meta Connected
              </span>
            </div>
          )}
        </div>

        {/* ── Flash ── */}
        {flash && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 12, marginBottom: 14,
            background: flash.type === "success" ? "rgba(22,163,74,0.07)" : "rgba(225,112,85,0.07)",
            border: `1px solid ${flash.type === "success" ? "rgba(22,163,74,0.22)" : "rgba(225,112,85,0.22)"}`,
          }}>
            {flash.type === "success"
              ? <CheckCircle2 style={{ width: 15, height: 15, color: "#16A34A", flexShrink: 0 }} />
              : <AlertCircle  style={{ width: 15, height: 15, color: "#e17055", flexShrink: 0 }} />}
            <span style={{ fontSize: 13, fontWeight: 500, color: flash.type === "success" ? "#16A34A" : "#e17055", fontFamily: "var(--font-inter)" }}>
              {flash.msg}
            </span>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <Loader2 style={{ width: 16, height: 16, color: "#A8A5A0", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Checking connection…</span>
          </div>

        ) : status?.connected ? (
          <>
            {/* ── Account info row ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 12,
              background: "#F7F5F2", marginBottom: 12,
            }}>
              <BarChart3 style={{ width: 14, height: 14, color: "#0866FF", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {status.adAccountName ?? `act_${status.adAccountId}`}
                </p>
                <p style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                  act_{status.adAccountId}
                </p>
              </div>
              {/* Last synced */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <Clock style={{ width: 11, height: 11, color: "#A8A5A0" }} />
                <span style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                  {timeSince(status.lastSyncedAt)}
                </span>
              </div>
            </div>

            {/* ── Analyze Live + Autopilot row ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>

              {/* Analyze Live button */}
              <button
                onClick={() => setShowForm(!showForm)}
                disabled={analyzing}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 18px", borderRadius: 100,
                  background: analyzing ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  fontFamily: "var(--font-inter)", border: "none",
                  cursor: analyzing ? "not-allowed" : "pointer",
                  boxShadow: analyzing ? "none" : "0 4px 16px rgba(255,60,172,0.30)",
                  transition: "all 0.15s",
                  opacity: analyzing ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!analyzing) { const b = e.currentTarget; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 6px 22px rgba(255,60,172,0.44)"; } }}
                onMouseLeave={(e) => { const b = e.currentTarget; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 16px rgba(255,60,172,0.30)"; }}
              >
                {analyzing
                  ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                  : <Zap style={{ width: 13, height: 13 }} />
                }
                {analyzing ? "Analyzing…" : "Analyze Live Account"}
              </button>

              {/* Autopilot toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <Power style={{ width: 13, height: 13, color: status.autopilotEnabled ? "#16A34A" : "#A8A5A0" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: status.autopilotEnabled ? "#16A34A" : "#6B6B72", fontFamily: "var(--font-inter)" }}>
                  Autopilot {status.autopilotEnabled ? "ON" : "OFF"}
                </span>
                <button
                  onClick={() => handleAutopilot(!status.autopilotEnabled)}
                  disabled={togglingAutopilot}
                  aria-label="Toggle autopilot"
                  style={{
                    width: 40, height: 22, borderRadius: 100,
                    background: status.autopilotEnabled ? "#16A34A" : "#D4D0CA",
                    border: "none", cursor: togglingAutopilot ? "not-allowed" : "pointer",
                    position: "relative", transition: "background 0.2s",
                    opacity: togglingAutopilot ? 0.6 : 1,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s",
                    left: status.autopilotEnabled ? 21 : 3,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  }} />
                </button>
              </div>
            </div>

            {/* Autopilot description */}
            {status.autopilotEnabled && (
              <p style={{ fontSize: 11, color: "#16A34A", fontFamily: "var(--font-inter)", marginBottom: 12, lineHeight: 1.5 }}>
                ✓ Autopilot active — Adur monitors your account every 6 hours and emails alerts when issues are detected.
              </p>
            )}

            {/* ── Analyze form (collapsible) ── */}
            {showForm && (
              <div style={{
                background: "#F7F5F2", borderRadius: 16, padding: "18px 18px",
                marginBottom: 14, border: "1px solid #E8E5E0",
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 14 }}>
                  Business context for analysis
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", marginBottom: 10 }}>
                  {([
                    { key: "aov",           label: "Avg. Order Value ($)" },
                    { key: "cogs",          label: "COGS ($)" },
                    { key: "breakEvenRoas", label: "Break-even ROAS" },
                    { key: "targetCpa",     label: "Target CPA ($)" },
                  ] as Array<{ key: keyof AnalyzeForm; label: string }>).map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                        {label}
                      </label>
                      <input
                        type="number"
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 10,
                          border: "1px solid #E8E5E0", background: "#fff",
                          fontSize: 13, fontFamily: "var(--font-inter)", color: "#0D0D12",
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                    Product / Market
                  </label>
                  <input
                    type="text"
                    value={form.market}
                    placeholder="e.g. Fashion, SaaS, E-commerce"
                    onChange={(e) => setForm((f) => ({ ...f, market: e.target.value }))}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 10,
                      border: "1px solid #E8E5E0", background: "#fff",
                      fontSize: 13, fontFamily: "var(--font-inter)", color: "#0D0D12",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                    Primary Goal
                  </label>
                  <input
                    type="text"
                    value={form.goal}
                    onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 10,
                      border: "1px solid #E8E5E0", background: "#fff",
                      fontSize: 13, fontFamily: "var(--font-inter)", color: "#0D0D12",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                {analyzeError && (
                  <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(225,112,85,0.07)", border: "1px solid rgba(225,112,85,0.22)", marginBottom: 12 }}>
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
                      background: analyzing ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      fontFamily: "var(--font-inter)", border: "none",
                      cursor: analyzing ? "not-allowed" : "pointer",
                      opacity: analyzing ? 0.7 : 1,
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
                      border: "1px solid #E8E5E0", color: "#6B6B72", fontSize: 13,
                      fontFamily: "var(--font-inter)", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Disconnect ── */}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600, color: "#A8A5A0",
                background: "none", border: "none",
                cursor: disconnecting ? "not-allowed" : "pointer",
                opacity: disconnecting ? 0.5 : 1,
                fontFamily: "var(--font-inter)", padding: "4px 0",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#e17055"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#A8A5A0"; }}
            >
              {disconnecting
                ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
                : <Link2Off style={{ width: 12, height: 12 }} />}
              {disconnecting ? "Disconnecting…" : "Disconnect account"}
            </button>
          </>

        ) : (
          <>
            {/* ── Disconnected state ── */}
            <p style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.55, marginBottom: 16 }}>
              Connect your Meta Ads account to auto-import campaigns and run AI analysis — no CSV needed.
            </p>

            <a
              href="/api/meta/connect"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 22px", borderRadius: 100,
                background: "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(8,102,255,0.32)",
                fontFamily: "var(--font-inter)", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.transform = "translateY(-1px)"; a.style.boxShadow = "0 8px 28px rgba(8,102,255,0.42)"; }}
              onMouseLeave={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.transform = "translateY(0)"; a.style.boxShadow = "0 4px 20px rgba(8,102,255,0.32)"; }}
            >
              <Link2 style={{ width: 15, height: 15 }} />
              Connect Meta Account
            </a>
          </>
        )}
      </div>
    </div>
  );
}
