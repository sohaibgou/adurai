"use client";

/**
 * /auth/confirm
 *
 * Handles Supabase's email verification link. Supabase redirects here after
 * the user clicks the confirmation email (emailRedirectTo points here).
 *
 * URL formats:
 *   ?token_hash=...&type=signup   (standard flow)
 *   ?token_hash=...&type=email
 *   ?code=...                     (PKCE flow)
 *
 * After verifying, calls /api/auth/mark-verified to set
 * app_metadata.email_link_verified = true, then redirects to /dashboard.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ConfirmPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [msg,    setMsg]    = useState("Verifying your email…");

  useEffect(() => {
    async function verify() {
      const tokenHash = searchParams.get("token_hash");
      const type      = searchParams.get("type") as "signup" | "email" | null;
      const code      = searchParams.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        } else {
          // No token — maybe they landed here directly. Just redirect.
          router.replace("/dashboard");
          return;
        }

        // Mark email as link-verified via admin (unlocks generation)
        await fetch("/api/auth/mark-verified", { method: "POST" });

        setStatus("success");
        setMsg("Email verified! Redirecting…");
        setTimeout(() => router.replace("/dashboard"), 1200);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Verification failed.";
        // If already confirmed, still mark verified and redirect
        if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("already")) {
          await fetch("/api/auth/mark-verified", { method: "POST" }).catch(() => {});
          setStatus("success");
          setMsg("Email already verified! Redirecting…");
          setTimeout(() => router.replace("/dashboard"), 1200);
        } else {
          setStatus("error");
          setMsg(message);
        }
      }
    }

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #E8E5E0",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background:
              status === "error"
                ? "rgba(220,38,38,0.1)"
                : "linear-gradient(135deg, #FF3CAC, #FF6B35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 24,
          }}
        >
          {status === "verifying" ? (
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
          ) : status === "success" ? (
            "✅"
          ) : (
            "❌"
          )}
        </div>

        <h1
          className="font-heading"
          style={{ fontSize: 22, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 10 }}
        >
          {status === "verifying" ? "Verifying email…" : status === "success" ? "Email verified!" : "Verification failed"}
        </h1>

        <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
          {msg}
        </p>

        {status === "error" && (
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              marginTop: 20,
              padding: "12px 28px",
              borderRadius: 100,
              background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-inter)",
            }}
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
