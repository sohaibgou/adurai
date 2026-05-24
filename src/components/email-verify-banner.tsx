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
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          setErr("Rate limit reached");
          setCountdown(COOLDOWN_SECS);
        } else {
          setErr(msg);
        }
        return;
      }
      setSent(true);
      setCountdown(COOLDOWN_SECS);
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
        ✓ Email sent — check your inbox!
      </p>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <button
          onClick={resend}
          disabled={loading || countdown > 0}
          style={{
            padding: "10px 28px", borderRadius: 100, background: "transparent",
            color: countdown > 0 ? "#A8A5A0" : "#FF3CAC", fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${countdown > 0 ? "rgba(168,165,160,0.35)" : "rgba(255,60,172,0.35)"}`,
            cursor: (loading || countdown > 0) ? "default" : "pointer",
            fontFamily: "var(--font-inter)", opacity: loading ? 0.6 : 1, transition: "all 0.15s",
          }}
        >
          {loading ? "Sending…" : countdown > 0 ? `Retry in ${countdown}s` : "Resend verification email →"}
        </button>
        {err && <p style={{ fontSize: 12, color: "#e17055", fontFamily: "var(--font-inter)", margin: 0, textAlign: "center" }}>{err}</p>}
      </div>
    );
  }

  // ── Default mode — centered banner strip ─────────────────────────────────
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Thin gradient accent line across the top */}
      <div style={{ height: 2, background: "linear-gradient(90deg, #FF3CAC 0%, #FF6B35 100%)" }} />

      <div
        style={{
          background:     "#ffffff",
          borderBottom:   "1px solid #E8E5E0",
          padding:        "0 24px",
          height:          46,
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>

          {/* Pulsing dot */}
          <span style={{ position: "relative", flexShrink: 0, width: 7, height: 7 }}>
            <span style={{
              display: "block", width: 7, height: 7, borderRadius: "50%",
              background: sent ? "#16A34A" : err ? "#e17055" : "#FF3CAC",
              position: "absolute",
              animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.35,
            }} />
            <span style={{
              display: "block", width: 7, height: 7, borderRadius: "50%",
              background: sent ? "#16A34A" : err ? "#e17055" : "#FF3CAC",
              position: "relative",
            }} />
          </span>

          {/* Message */}
          <span style={{ fontSize: 13, fontFamily: "var(--font-inter)", color: "#4B4B55", fontWeight: 500 }}>
            {sent
              ? "Verification email sent — check your inbox"
              : err
                ? countdown > 0
                  ? <><span style={{ color: "#e17055" }}>{err}</span> — retry in <span style={{ fontWeight: 700 }}>{countdown}s</span></>
                  : <span style={{ color: "#e17055" }}>{err}</span>
                : <>Verify your email to unlock all features</>
            }
          </span>

          {/* Email address pill */}
          {!sent && !err && email && (
            <>
              <span style={{ color: "#D4D0CA", fontSize: 11, fontFamily: "var(--font-inter)" }}>·</span>
              <span style={{
                fontSize: 12, fontFamily: "var(--font-inter)", fontWeight: 600,
                color: "#0D0D12", background: "#F7F5F2",
                padding: "2px 10px", borderRadius: 100,
                border: "1px solid #E8E5E0",
              }}>
                {email}
              </span>
            </>
          )}

          {/* Separator + action */}
          {!sent && (
            <>
              <span style={{ color: "#D4D0CA", fontSize: 11, fontFamily: "var(--font-inter)" }}>·</span>
              <button
                onClick={resend}
                disabled={loading || countdown > 0}
                style={{
                  background: "none", border: "none", padding: 0,
                  fontSize: 13, fontFamily: "var(--font-inter)", fontWeight: 600,
                  color: (loading || countdown > 0) ? "#A8A5A0" : "#FF3CAC",
                  cursor: (loading || countdown > 0) ? "default" : "pointer",
                  textDecoration: (loading || countdown > 0) ? "none" : "underline",
                  textDecorationColor: "rgba(255,60,172,0.35)",
                  textUnderlineOffset: "3px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => { if (!loading && !countdown) (e.currentTarget as HTMLButtonElement).style.color = "#e0339a"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = (loading || countdown > 0) ? "#A8A5A0" : "#FF3CAC"; }}
              >
                {loading ? "Sending…" : countdown > 0 ? `Retry in ${countdown}s` : "Resend email"}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes ping { 75%,100%{transform:scale(2.4);opacity:0} }`}</style>
    </div>
  );
}
