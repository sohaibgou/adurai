"use client";

/**
 * VerifyGate
 *
 * Wraps any authenticated page's main content.
 * When the user's email is not yet verified, replaces the content with a
 * clean locked-state card instead of letting them interact with features.
 */

import { useState, useEffect, useRef } from "react";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  markVerifyEmailSent,
  verifyCooldownRemaining,
  parseRateLimitSeconds,
} from "@/lib/verify-cooldown";

const COOLDOWN_SECS = 60;

export default function VerifyGate({ children }: { children: React.ReactNode }) {
  const { emailVerified, user } = useAuth();

  // null = still loading → render children (fail open, no flash)
  if (emailVerified !== false) return <>{children}</>;

  return (
    <div
      style={{
        flex:           1,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "40px 24px",
        background:     "#F7F5F2",
      }}
    >
      <LockedCard email={user?.email ?? ""} />
    </div>
  );
}

/* ── Locked card ──────────────────────────────────────────────────────────── */

function LockedCard({ email }: { email: string }) {
  const { session } = useAuth();
  const [sent,      setSent]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-arm the cooldown if signup just auto-sent a verification email, so the
  // user sees a calm countdown instead of clicking into a rate-limit error.
  useEffect(() => {
    const remain = verifyCooldownRemaining();
    if (remain > 0) { setSent(true); setCountdown(remain); }
  }, []);

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
        if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("after") || res.status === 429) {
          // Benign per-address frequency limit — the email is already sent.
          setSent(true);
          setCountdown(parseRateLimitSeconds(msg));
        } else {
          setErr(msg);
        }
        return;
      }
      markVerifyEmailSent();
      setSent(true);
      setCountdown(COOLDOWN_SECS);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background:   "#ffffff",
        border:       "1px solid #E8E5E0",
        borderRadius:  24,
        padding:      "48px 40px",
        maxWidth:      420,
        width:         "100%",
        textAlign:     "center",
        boxShadow:    "0 4px 32px rgba(0,0,0,0.06)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width:          56,
          height:         56,
          borderRadius:   16,
          background:     "#F7F5F2",
          border:         "1px solid #E8E5E0",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          margin:         "0 auto 20px",
        }}
      >
        <Lock size={22} style={{ color: "#A8A5A0" }} />
      </div>

      <h2
        className="font-heading"
        style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 10 }}
      >
        Verify your email to unlock
      </h2>

      <p
        style={{
          fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)",
          lineHeight: 1.65, marginBottom: 28,
        }}
      >
        We sent a confirmation link to{" "}
        <span style={{ color: "#0D0D12", fontWeight: 600 }}>{email}</span>.
        <br />Click it to access all features.
      </p>

      {/* Resend / sent state */}
      {sent ? (
        <div
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:             8,
            padding:        "10px 20px",
            borderRadius:    100,
            background:     "rgba(22,163,74,0.08)",
            border:         "1px solid rgba(22,163,74,0.22)",
            marginBottom:    24,
          }}
        >
          <Mail size={14} style={{ color: "#16A34A" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", fontFamily: "var(--font-inter)" }}>
            {countdown > 0
              ? `Email sent — resend available in ${countdown}s`
              : "Email sent — check your inbox"}
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button
            onClick={resend}
            disabled={loading || countdown > 0}
            style={{
              padding:      "11px 28px",
              borderRadius:  100,
              background:   "transparent",
              color:        countdown > 0 ? "#A8A5A0" : err ? "#e17055" : "#FF3CAC",
              fontSize:      13,
              fontWeight:    600,
              border:        `1.5px solid ${countdown > 0 ? "rgba(168,165,160,0.35)" : err ? "rgba(225,112,85,0.35)" : "rgba(255,60,172,0.35)"}`,
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
                : err ? "Retry →" : "Resend verification email →"}
          </button>
          {err && (
            <p style={{ fontSize: 12, color: "#e17055", fontFamily: "var(--font-inter)", margin: 0, maxWidth: 300, textAlign: "center" }}>{err}</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
        Already clicked the link?{" "}
        <button
          onClick={() => window.location.reload()}
          style={{
            color: "#FF3CAC", fontWeight: 600, background: "none",
            border: "none", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-inter)",
          }}
        >
          Refresh →
        </button>
      </p>
    </div>
  );
}
