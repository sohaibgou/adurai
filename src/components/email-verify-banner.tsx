"use client";

/**
 * EmailVerifyBanner
 *
 * Shows a sticky top banner when the user has bypassed email confirmation
 * (app_metadata.email_link_verified === false). Includes a "Resend email" button.
 */

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  email?: string;
}

export default function EmailVerifyBanner({ email }: Props) {
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    await supabase.auth.resend({
      type:  "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #FF3CAC 0%, #FF6B35 100%)",
        padding:    "10px 20px",
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-inter)" }}>
        📧 Please verify your email to unlock AI generation features.
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
