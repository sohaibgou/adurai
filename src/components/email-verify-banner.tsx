"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";

interface Props {
  email?:   string;
  compact?: boolean;
}

const COOLDOWN_SECS = 60;

export default function EmailVerifyBanner({ email: emailProp, compact }: Props) {
  const { user, emailVerified, session } = useAuth();
  const email = emailProp ?? user?.email ?? "";

  const [sent,      setSent]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);   // seconds remaining
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [countdown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  async function resend() {
    if (!email || countdown > 0) return;
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
        const msg  = body.error ?? `Failed (${res.status})`;

        if (msg.toLowerCase().includes("rate limit") || res.status === 429) {
          setErr("Rate limit reached — please wait 60 s before retrying.");
          setCountdown(COOLDOWN_SECS);
        } else {
          setErr(msg);
        }
        return;
      }
      setSent(true);
      setCountdown(COOLDOWN_SECS); // prevent double-sending
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (emailVerified !== false && !emailProp) return null;

  // ── Compact mode ─────────────────────────────────────────────────────────
  if (compact) {
    if (sent && !err) return (
      <p style={{ fontSize: 13, color: "#16A34A", fontFamily: "var(--font-inter)", fontWeight: 600, margin: 0 }}>
        ✓ Verification email sent — check your inbox!
      </p>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <button
          onClick={resend}
          disabled={loading || countdown > 0}
          style={{
            padding:      "10px 28px",
            borderRadius:  100,
            background:   "transparent",
            color:        countdown > 0 ? "#A8A5A0" : "#FF3CAC",
            fontSize:      13,
            fontWeight:    600,
            border:        `1.5px solid ${countdown > 0 ? "rgba(168,165,160,0.35)" : "rgba(255,60,172,0.35)"}`,
            cursor:        (loading || countdown > 0) ? "default" : "pointer",
            fontFamily:   "var(--font-inter)",
            opacity:       loading ? 0.6 : 1,
            transition:   "all 0.15s",
          }}
        >
          {loading
            ? "Sending…"
            : countdown > 0
              ? `Retry in ${countdown}s`
              : "Resend verification email →"}
        </button>
        {err && (
          <p style={{ fontSize: 12, color: "#e17055", fontFamily: "var(--font-inter)", margin: 0, maxWidth: 300, textAlign: "center" }}>
            {err}
          </p>
        )}
      </div>
    );
  }

  // ── Default slim strip ───────────────────────────────────────────────────
  const isRateLimit = err?.toLowerCase().includes("rate limit");

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
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ position: "relative", flexShrink: 0, width: 8, height: 8 }}>
          <span style={{
            display: "block", width: 8, height: 8, borderRadius: "50%",
            background: err ? "#e17055" : "#FF3CAC", position: "absolute",
            animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.4,
          }} />
          <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: err ? "#e17055" : "#FF3CAC", position: "relative" }} />
        </span>

        <p style={{ fontSize: 13, fontFamily: "var(--font-inter)", color: err ? "#e17055" : "#6B6B72", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {isRateLimit
            ? `Rate limit — retry in ${countdown}s`
            : err
              ? err
              : <>Verify your email{email && <> — link sent to <span style={{ color: "#0D0D12", fontWeight: 600 }}>{email}</span></>}</>
          }
        </p>
      </div>

      {/* Right */}
      {sent && !err ? (
        <span style={{ fontSize: 12, fontFamily: "var(--font-inter)", fontWeight: 600, color: "#16A34A", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="6.5" fill="rgba(22,163,74,0.12)" />
            <path d="M3.5 6.5l2 2 3.5-3.5" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Email sent
        </span>
      ) : (
        <button
          onClick={resend}
          disabled={loading || countdown > 0}
          style={{
            flexShrink:  0,
            padding:     "5px 14px",
            borderRadius: 100,
            background:  "transparent",
            color:       countdown > 0 ? "#A8A5A0" : err ? "#e17055" : "#FF3CAC",
            fontSize:     12,
            fontWeight:   600,
            border:       `1.5px solid ${countdown > 0 ? "rgba(168,165,160,0.30)" : err ? "rgba(225,112,85,0.30)" : "rgba(255,60,172,0.30)"}`,
            cursor:       (loading || countdown > 0) ? "default" : "pointer",
            fontFamily:  "var(--font-inter)",
            opacity:      loading ? 0.55 : 1,
            transition:  "border-color 0.15s",
            whiteSpace:  "nowrap",
          }}
        >
          {loading ? "Sending…" : countdown > 0 ? `${countdown}s` : err ? "Retry" : "Resend"}
        </button>
      )}

      <style>{`@keyframes ping { 75%,100%{transform:scale(2.2);opacity:0} }`}</style>
    </div>
  );
}
