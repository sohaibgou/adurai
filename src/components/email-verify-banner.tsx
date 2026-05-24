"use client";

/**
 * EmailVerifyBanner
 *
 * Two modes:
 *   default  → sticky pink gradient bar across the top of the page
 *   compact  → just the resend button (used inside the verify-email wall card)
 */

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

  // ── Compact mode — just the resend button (no bar) ───────────────────────
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
          padding:      "12px 28px",
          borderRadius:  100,
          background:   loading ? "#d1d5db" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
          color:        "#fff",
          fontSize:      14,
          fontWeight:    700,
          border:        "none",
          cursor:        loading ? "default" : "pointer",
          fontFamily:   "var(--font-inter)",
          boxShadow:    loading ? "none" : "0 4px 20px rgba(255,60,172,0.32)",
          transition:   "all 0.15s",
        }}
      >
        {loading ? "Sending…" : "Resend verification email →"}
      </button>
    );
  }

  // ── Default mode — sticky banner bar ─────────────────────────────────────
  return (
    <div
      style={{
        background:     "linear-gradient(90deg, #FF3CAC 0%, #FF6B35 100%)",
        padding:        "10px 20px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            12,
        flexWrap:       "wrap",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-inter)" }}>
        📧 Please verify your email address to unlock all features.
      </span>
      {!sent ? (
        <button
          onClick={resend}
          disabled={loading}
          style={{
            padding:      "5px 14px",
            borderRadius:  100,
            background:   "rgba(255,255,255,0.22)",
            border:       "1px solid rgba(255,255,255,0.5)",
            color:        "#fff",
            fontSize:      12,
            fontWeight:    700,
            cursor:        loading ? "default" : "pointer",
            fontFamily:   "var(--font-inter)",
            whiteSpace:   "nowrap",
            opacity:       loading ? 0.7 : 1,
          }}
        >
          {loading ? "Sending…" : "Resend verification email"}
        </button>
      ) : (
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-inter)" }}>
          ✓ Email sent — check your inbox!
        </span>
      )}
    </div>
  );
}
