"use client";

import { useEffect, useState } from "react";
import { Loader2, Link2, Link2Off, CheckCircle2, AlertCircle } from "lucide-react";

interface MetaStatus {
  connected:       boolean;
  adAccountId?:    string;
  adAccountName?:  string;
  connectedAt?:    string;
}

interface MetaConnectProps {
  /** banner message from URL param (?meta=connected / denied / error) */
  flashParam?: string | null;
}

export default function MetaConnect({ flashParam }: MetaConnectProps) {
  const [status,     setStatus]     = useState<MetaStatus | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [flash,      setFlash]      = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (flashParam === "connected") {
      setFlash({ type: "success", msg: "Meta account connected successfully!" });
    } else if (flashParam === "denied") {
      setFlash({ type: "error", msg: "Connection cancelled." });
    } else if (flashParam === "no_accounts") {
      setFlash({ type: "error", msg: "No active Meta ad accounts found on this account." });
    } else if (flashParam === "error" || flashParam === "db_error") {
      setFlash({ type: "error", msg: "Something went wrong. Please try again." });
    }
    if (flashParam) {
      // Clear param from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("meta");
      window.history.replaceState({}, "", url.toString());
    }
  }, [flashParam]);

  useEffect(() => {
    fetch("/api/meta/status")
      .then((r) => r.json())
      .then((d: MetaStatus) => setStatus(d))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div
      style={{
        background:   "#FFFFFF",
        border:       "1px solid #E8E5E0",
        borderRadius: 20,
        padding:      "22px 24px",
        boxShadow:    "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {/* Meta logo mark */}
        <div
          style={{
            width:        42,
            height:       42,
            borderRadius: 12,
            background:   "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            flexShrink:   0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", lineHeight: 1.3 }}>
            Meta Ads
          </p>
          <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
            Connect to auto-import your campaigns
          </p>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          8,
            padding:      "10px 14px",
            borderRadius: 12,
            marginBottom: 14,
            background:   flash.type === "success" ? "rgba(22,163,74,0.07)" : "rgba(225,112,85,0.07)",
            border:       `1px solid ${flash.type === "success" ? "rgba(22,163,74,0.22)" : "rgba(225,112,85,0.22)"}`,
          }}
        >
          {flash.type === "success"
            ? <CheckCircle2 style={{ width: 15, height: 15, color: "#16A34A", flexShrink: 0 }} />
            : <AlertCircle  style={{ width: 15, height: 15, color: "#e17055", flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13, fontWeight: 500, color: flash.type === "success" ? "#16A34A" : "#e17055", fontFamily: "var(--font-inter)" }}>
            {flash.msg}
          </span>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
          <Loader2 style={{ width: 16, height: 16, color: "#A8A5A0", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Checking connection…</span>
        </div>
      ) : status?.connected ? (
        <>
          {/* Connected state */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              padding:      "12px 14px",
              borderRadius: 12,
              background:   "rgba(22,163,74,0.06)",
              border:       "1px solid rgba(22,163,74,0.20)",
              marginBottom: 14,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A", flexShrink: 0, boxShadow: "0 0 6px rgba(22,163,74,0.55)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", fontFamily: "var(--font-inter)" }}>
                Connected
              </p>
              <p style={{ fontSize: 12, color: "#6B6B72", fontFamily: "var(--font-inter)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Ad Account: <strong style={{ color: "#0D0D12" }}>{status.adAccountName ?? status.adAccountId}</strong>
                {status.adAccountId && status.adAccountName && (
                  <span style={{ color: "#A8A5A0" }}> · act_{status.adAccountId}</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              fontSize:     13,
              fontWeight:   600,
              color:        "#e17055",
              background:   "none",
              border:       "1px solid rgba(225,112,85,0.25)",
              borderRadius: 100,
              padding:      "8px 16px",
              cursor:       disconnecting ? "not-allowed" : "pointer",
              opacity:      disconnecting ? 0.6 : 1,
              fontFamily:   "var(--font-inter)",
              transition:   "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(225,112,85,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >
            {disconnecting
              ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
              : <Link2Off style={{ width: 14, height: 14 }} />
            }
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </>
      ) : (
        <>
          {/* Disconnected state */}
          <p style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.55, marginBottom: 16 }}>
            Connect your Meta Ads account to automatically import campaigns — no CSV needed.
          </p>

          <a
            href="/api/meta/connect"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            8,
              padding:        "11px 22px",
              borderRadius:   100,
              background:     "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
              color:          "#fff",
              fontSize:       14,
              fontWeight:     700,
              textDecoration: "none",
              boxShadow:      "0 4px 20px rgba(8,102,255,0.32)",
              fontFamily:     "var(--font-inter)",
              transition:     "all 0.15s",
            }}
            onMouseEnter={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.transform = "translateY(-1px)"; a.style.boxShadow = "0 8px 28px rgba(8,102,255,0.42)"; }}
            onMouseLeave={e => { const a = e.currentTarget as HTMLAnchorElement; a.style.transform = "translateY(0)"; a.style.boxShadow = "0 4px 20px rgba(8,102,255,0.32)"; }}
          >
            <Link2 style={{ width: 15, height: 15 }} />
            Connect Meta Account
          </a>
        </>
      )}
    </div>
  );
}
