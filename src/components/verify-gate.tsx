"use client";

/**
 * VerifyGate
 *
 * Wraps any authenticated page's main content.
 * When the user's email is not yet verified, replaces the content with a
 * clean locked-state card instead of letting them interact with features.
 */

import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

export default function VerifyGate({ children }: { children: React.ReactNode }) {
  const { emailVerified, user } = useAuth();

  // null = still loading → render children (fail open, no flash)
  if (emailVerified !== false) return <>{children}</>;

  return (
    <div
      style={{
        flex:            1,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "40px 24px",
        background:      "#F7F5F2",
      }}
    >
      <LockedCard email={user?.email ?? ""} />
    </div>
  );
}

/* ── Locked card ──────────────────────────────────────────────────────────── */

function LockedCard({ email }: { email: string }) {
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

      {/* Heading */}
      <h2
        className="font-heading"
        style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 10 }}
      >
        Verify your email to unlock
      </h2>

      {/* Body */}
      <p
        style={{
          fontSize:   14,
          color:      "#6B6B72",
          fontFamily: "var(--font-inter)",
          lineHeight:  1.65,
          marginBottom: 28,
        }}
      >
        We sent a confirmation link to{" "}
        <span style={{ color: "#0D0D12", fontWeight: 600 }}>{email}</span>.
        <br />Click it to access all features.
      </p>

      {/* Resend */}
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
            Email sent — check your inbox
          </span>
        </div>
      ) : (
        <button
          onClick={resend}
          disabled={loading}
          style={{
            display:      "inline-block",
            marginBottom:  24,
            padding:      "11px 28px",
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
      )}

      {/* Refresh hint */}
      <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
        Already clicked the link?{" "}
        <button
          onClick={() => window.location.reload()}
          style={{
            color:      "#FF3CAC",
            fontWeight:  600,
            background: "none",
            border:     "none",
            cursor:     "pointer",
            fontSize:    12,
            fontFamily: "var(--font-inter)",
          }}
        >
          Refresh →
        </button>
      </p>
    </div>
  );
}
