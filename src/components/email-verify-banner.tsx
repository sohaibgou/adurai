"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";

interface Props {
  email?:   string; // fallback; normally read from auth context
  compact?: boolean;
}

export default function EmailVerifyBanner({ email: emailProp, compact }: Props) {
  const { user, emailVerified, session } = useAuth();
  const email = emailProp ?? user?.email ?? "";

  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  async function resend() {
    if (!email) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/resend-verify", {
        method:  "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  // Don't render if verified (protects against flash)
  if (emailVerified !== false && !emailProp) return null;

  // ── Compact mode (resend button only — used in VerifyGate) ───────────────
  if (compact) {
    if (sent) return (
      <p style={{ fontSize: 13, color: "#16A34A", fontFamily: "var(--font-inter)", fontWeight: 600, margin: 0 }}>
        ✓ Verification email sent — check your inbox!
      </p>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <button
          onClick={resend}
          disabled={loading}
          style={{
            padding:      "10px 28px",
            borderRadius:  100,
            background:   "transparent",
            color:        "#FF3CAC",
            fontSize:      13,
            fontWeight:    600,
            border:        "1.5px solid rgba(255,60,172,0.35)",
            cursor:        loading ? "default" : "pointer",
            fontFamily:   "var(--font-inter)",
            opacity:       loading ? 0.6 : 1,
            transition:   "all 0.15s",
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,60,172,0.70)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,60,172,0.35)"; }}
        >
          {loading ? "Sending…" : "Resend verification email →"}
        </button>
        {err && (
          <p style={{ fontSize: 12, color: "#e17055", fontFamily: "var(--font-inter)", margin: 0 }}>{err}</p>
        )}
      </div>
    );
  }

  // ── Default mode — slim notification strip ───────────────────────────────
  return (
    <div
      style={{
        background:    "#ffffff",
        borderBottom:  "1px solid #E8E5E0",
        padding:       "0 24px",
        height:         48,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            16,
        flexShrink:     0,
      }}
    >
      {/* Left — pulsing dot + message */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ position: "relative", flexShrink: 0, width: 8, height: 8 }}>
          <span style={{
            display: "block", width: 8, height: 8, borderRadius: "50%",
            background: "#FF3CAC", position: "absolute",
            animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.4,
          }} />
          <span style={{
            display: "block", width: 8, height: 8, borderRadius: "50%",
            background: "#FF3CAC", position: "relative",
          }} />
        </span>

        <p style={{
          fontSize: 13, fontFamily: "var(--font-inter)", color: "#6B6B72",
          margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {err
            ? <span style={{ color: "#e17055" }}>{err}</span>
            : <>Verify your email{email && <> — link sent to <span style={{ color: "#0D0D12", fontWeight: 600 }}>{email}</span></>}</>
          }
        </p>
      </div>

      {/* Right — action */}
      {sent ? (
        <span style={{
          fontSize: 12, fontFamily: "var(--font-inter)", fontWeight: 600,
          color: "#16A34A", flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="6.5" fill="rgba(22,163,74,0.12)" />
            <path d="M3.5 6.5l2 2 3.5-3.5" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Email sent
        </span>
      ) : (
        <button
          onClick={resend}
          disabled={loading}
          style={{
            flexShrink:  0,
            padding:     "5px 14px",
            borderRadius: 100,
            background:  "transparent",
            color:       err ? "#e17055" : "#FF3CAC",
            fontSize:     12,
            fontWeight:   600,
            border:       `1.5px solid ${err ? "rgba(225,112,85,0.35)" : "rgba(255,60,172,0.30)"}`,
            cursor:       loading ? "default" : "pointer",
            fontFamily:  "var(--font-inter)",
            opacity:      loading ? 0.55 : 1,
            transition:  "border-color 0.15s, opacity 0.15s",
            whiteSpace:  "nowrap",
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = err ? "rgba(225,112,85,0.70)" : "rgba(255,60,172,0.65)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = err ? "rgba(225,112,85,0.35)" : "rgba(255,60,172,0.30)"; }}
        >
          {loading ? "Sending…" : err ? "Retry" : "Resend"}
        </button>
      )}

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
