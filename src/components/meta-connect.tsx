"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Link2Off, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";

interface MetaStatus {
  connected:        boolean;
  adAccountId?:     string;
  adAccountName?:   string;
  connectedAt?:     string;
  tokenExpiresAt?:  string;
}

interface CampaignSummary {
  total:         number;
  adAccountName: string;
}

interface MetaConnectProps {
  /** banner message from URL param (?meta=connected / denied / error) */
  flashParam?: string | null;
}

export default function MetaConnect({ flashParam }: MetaConnectProps) {
  const router = useRouter();
  const [status,        setStatus]        = useState<MetaStatus | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [connecting,    setConnecting]    = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [campaigns,     setCampaigns]     = useState<CampaignSummary | null>(null);
  const [campsLoading,  setCampsLoading]  = useState(false);
  const [flash,         setFlash]         = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Flash from URL param ─────────────────────────────────────────────────
  useEffect(() => {
    if (flashParam === "connected") {
      setFlash({ type: "success", msg: "Meta Ads connected successfully!" });
    } else if (flashParam === "denied") {
      setFlash({ type: "error", msg: "Connection cancelled." });
    } else if (flashParam === "no_accounts") {
      setFlash({ type: "error", msg: "No active Meta ad accounts found on this account." });
    } else if (flashParam === "error" || flashParam === "db_error") {
      setFlash({ type: "error", msg: "Something went wrong. Please try again." });
    }
    if (flashParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("meta");
      window.history.replaceState({}, "", url.toString());
    }
  }, [flashParam]);

  // ── Load connection status ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/meta/status")
      .then((r) => r.json())
      .then((d: MetaStatus) => setStatus(d))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  // ── Load campaign count when connected ───────────────────────────────────
  useEffect(() => {
    if (!status?.connected) return;
    setCampsLoading(true);
    fetch("/api/meta/campaigns")
      .then((r) => r.json())
      .then((d: { total?: number; adAccountName?: string; error?: string }) => {
        if (d.total !== undefined) {
          setCampaigns({ total: d.total, adAccountName: d.adAccountName ?? "" });
        }
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setCampsLoading(false));
  }, [status?.connected]);

  // ── Disconnect ───────────────────────────────────────────────────────────
  async function handleDisconnect() {
    if (!confirm("Disconnect your Meta Ads account?")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/meta/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setCampaigns(null);
      setFlash({ type: "success", msg: "Meta account disconnected." });
    } catch {
      setFlash({ type: "error", msg: "Failed to disconnect. Please try again." });
    } finally {
      setDisconnecting(false);
    }
  }

  // ── Popup OAuth ──────────────────────────────────────────────────────────
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
      setFlash({ type: "error", msg: "Popup was blocked — please allow popups and try again." });
      return;
    }

    setConnecting(true);

    // Message handler
    function onMessage(ev: MessageEvent) {
      if (ev.data === "meta_connected") {
        cleanup();
        setFlash({ type: "success", msg: "Meta Ads connected successfully!" });
        router.refresh();
        // Re-fetch connection status so the UI updates immediately
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
        console.error("[meta-connect] OAuth failed:", reason ?? "unknown");
        setFlash({
          type: "error",
          msg: reason
            ? `Connection failed: ${reason}`
            : "Connection failed. Please try again.",
        });
      }
    }

    // Poll for popup close as a fallback
    pollRef.current = setInterval(() => {
      if (popup.closed) {
        cleanup();
      }
    }, 500);

    window.addEventListener("message", onMessage);

    function cleanup() {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener("message", onMessage);
      setConnecting(false);
      try { popup?.close(); } catch { /* already closed */ }
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
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width:          42,
            height:         42,
            borderRadius:   12,
            background:     "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
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
            {status?.connected ? "Connected via Meta MCP" : "Connect to auto-import campaigns"}
          </p>
        </div>
      </div>

      {/* ── Flash ──────────────────────────────────────────────────────── */}
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

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
          <Loader2 style={{ width: 16, height: 16, color: "#A8A5A0", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Checking connection…</span>
        </div>

      ) : status?.connected ? (
        <>
          {/* Connected pill */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              padding:      "12px 14px",
              borderRadius: 12,
              background:   "rgba(22,163,74,0.06)",
              border:       "1px solid rgba(22,163,74,0.20)",
              marginBottom: 12,
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

          {/* Campaign count */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              padding:      "10px 14px",
              borderRadius: 12,
              background:   "rgba(8,102,255,0.05)",
              border:       "1px solid rgba(8,102,255,0.14)",
              marginBottom: 14,
            }}
          >
            {campsLoading
              ? <Loader2 style={{ width: 14, height: 14, color: "#0866FF", animation: "spin 1s linear infinite", flexShrink: 0 }} />
              : <BarChart3 style={{ width: 14, height: 14, color: "#0866FF", flexShrink: 0 }} />
            }
            <span style={{ fontSize: 13, color: "#0866FF", fontFamily: "var(--font-inter)", fontWeight: 500 }}>
              {campsLoading
                ? "Loading campaigns…"
                : campaigns !== null
                  ? `${campaigns.total} campaign${campaigns.total !== 1 ? "s" : ""} imported`
                  : "Ready to import campaigns"
              }
            </span>
          </div>

          {/* Disconnect button */}
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
            Connect via Meta&apos;s official MCP — pre-approved, no app review needed. Campaigns auto-import after connecting.
          </p>

          <button
            onClick={connectMeta}
            disabled={connecting}
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          8,
              padding:      "11px 22px",
              borderRadius: 100,
              background:   connecting
                ? "linear-gradient(135deg, #4d90ff 0%, #5a9cf5 100%)"
                : "linear-gradient(135deg, #0866FF 0%, #1877F2 100%)",
              color:        "#fff",
              fontSize:     14,
              fontWeight:   700,
              border:       "none",
              cursor:       connecting ? "not-allowed" : "pointer",
              boxShadow:    "0 4px 20px rgba(8,102,255,0.32)",
              fontFamily:   "var(--font-inter)",
              transition:   "all 0.15s",
              opacity:      connecting ? 0.8 : 1,
            }}
            onMouseEnter={e => { if (!connecting) { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 8px 28px rgba(8,102,255,0.42)"; } }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(8,102,255,0.32)"; }}
          >
            {connecting
              ? <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
              : <Link2   style={{ width: 15, height: 15 }} />
            }
            {connecting ? "Connecting…" : "Connect Meta Account"}
          </button>
        </>
      )}
    </div>
  );
}
