"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  email?:   string;
  compact?: boolean;
}

export default function EmailVerifyBanner({ email, compact }: Props) {
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    await supabase.auth.resend({
      type:    "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setSent(true);
    setLoading(false);
  }

  // ── Compact mode (kept for potential reuse) ──────────────────────────────
  if (compact) {
    return sent ? (
      <p style={{ fontSize: 13, color: "#16A34A", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
        ✓ Verification email sent — check your inbox!
      </p>
    ) : (
      <button
        onClick={resend}
        disabled={loading}
        style={{
          padding:      "10px 24px",
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
      >
        {loading ? "Sending…" : "Resend verification email →"}
      </button>
    );
  }

  // ── Default mode — slim notification strip ───────────────────────────────
  return (
    <div
      style={{
        background:   "#ffffff",
        borderBottom: "1px solid #E8E5E0",
        padding:      "0 24px",
        height:        48,
        display:       "flex",
        alignItems:    "center",
        justifyContent:"space-between",
        gap:           16,
      }}
    >
      {/* Left — indicator dot + message */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {/* Pulsing dot */}
        <span style={{ position: "relative", flexShrink: 0, width: 8, height: 8 }}>
          <span style={{
            display:       "block",
            width:          8,
            height:         8,
            borderRadius:  "50%",
            background:    "#FF3CAC",
            position:      "absolute",
            animation:     "ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
            opacity:        0.4,
          }} />
          <span style={{
            display:       "block",
            width:          8,
            height:         8,
            borderRadius:  "50%",
            background:    "#FF3CAC",
            position:      "relative",
          }} />
        </span>

        <p style={{
          fontSize:   13,
          fontFamily: "var(--font-inter)",
          color:      "#6B6B72",
          margin:      0,
          whiteSpace: "nowrap",
          overflow:   "hidden",
          textOverflow:"ellipsis",
        }}>
          Verify your email
          {email && (
            <> — we sent a link to <span style={{ color: "#0D0D12", fontWeight: 600 }}>{email}</span></>
          )}
        </p>
      </div>

      {/* Right — action */}
      {sent ? (
        <span style={{
          fontSize:   12,
          fontFamily: "var(--font-inter)",
          fontWeight:  600,
          color:      "#16A34A",
          flexShrink:  0,
          display:    "flex",
          alignItems: "center",
          gap:         5,
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
            flexShrink:   0,
            padding:      "5px 14px",
            borderRadius:  100,
            background:   "transparent",
            color:        "#FF3CAC",
            fontSize:      12,
            fontWeight:    600,
            border:        "1.5px solid rgba(255,60,172,0.30)",
            cursor:        loading ? "default" : "pointer",
            fontFamily:   "var(--font-inter)",
            opacity:       loading ? 0.55 : 1,
            transition:   "border-color 0.15s, opacity 0.15s",
            whiteSpace:   "nowrap",
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,60,172,0.65)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,60,172,0.30)"; }}
        >
          {loading ? "Sending…" : "Resend"}
        </button>
      )}

      {/* Keyframe for the ping animation */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
