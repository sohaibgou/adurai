"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Status = "verifying" | "success" | "expired" | "error";
type ResendState = "idle" | "sending" | "sent" | "rateLimited" | "noSession" | "failed";

export default function ConfirmContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [status,      setStatus]      = useState<Status>("verifying");
  const [msg,         setMsg]         = useState("Verifying your email…");
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [countdown,   setCountdown]   = useState(0);

  /* ── Resend cooldown timer ── */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown > 0]);

  /* ── Resend handler ── */
  async function handleResend() {
    if (countdown > 0 || resendState === "sending") return;
    setResendState("sending");
    try {
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

      if (!session?.access_token) {
        // No active session — send user to login to get a new link there
        setResendState("noSession");
        return;
      }

      const res = await fetch("/api/auth/resend-verify", {
        method:  "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        const errMsg = body.error ?? "";
        if (errMsg.toLowerCase().includes("rate") || res.status === 429) {
          setResendState("rateLimited");
          setCountdown(60);
        } else {
          setResendState("failed");
        }
        return;
      }

      setResendState("sent");
      setCountdown(60);
    } catch {
      setResendState("failed");
    }
  }

  /* ── Main verification logic ── */
  useEffect(() => {
    async function verify() {
      const tokenHash = searchParams.get("token_hash");
      const type      = searchParams.get("type") as "signup" | "email" | "magiclink" | "invite" | null;
      const code      = searchParams.get("code");

      async function markVerified(accessToken?: string | null) {
        await fetch("/api/auth/mark-verified", {
          method: "POST",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }).catch(() => {});
      }

      try {
        let session: Session | null = null;

        if (code) {
          // PKCE flow — ?code=...
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data.session;

        } else if (tokenHash && type) {
          // Token-hash flow — ?token_hash=...&type=magiclink|signup|email
          const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
          session = data.session;

        } else if (typeof window !== "undefined" && window.location.hash.includes("error")) {
          // Supabase returned an error in the hash (e.g. expired OTP, invalid link)
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const desc = hashParams.get("error_description") ?? "Verification link is invalid or has expired.";
          const decoded = decodeURIComponent(desc.replace(/\+/g, " "));
          setStatus("expired");
          setMsg(decoded);
          return;

        } else if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          // Implicit / hash flow — #access_token=...
          session = await new Promise<Session | null>((resolve) => {
            let done = false;

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
              if (!done && s) {
                done = true;
                subscription.unsubscribe();
                resolve(s);
              }
            });

            supabase.auth.getSession().then(({ data }) => {
              if (!done && data.session) {
                done = true;
                subscription.unsubscribe();
                resolve(data.session);
              }
            });

            setTimeout(() => {
              if (!done) {
                done = true;
                subscription.unsubscribe();
                resolve(null);
              }
            }, 8000);
          });

        } else {
          // No token at all — already verified or stale link
          router.replace("/dashboard");
          return;
        }

        await markVerified(session?.access_token);
        setStatus("success");
        setMsg("Email verified! Redirecting…");
        setTimeout(() => router.replace("/dashboard"), 1200);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Verification failed.";

        if (message.toLowerCase().includes("already")) {
          // Email was already confirmed — user re-clicked an old valid link
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          await fetch("/api/auth/mark-verified", {
            method: "POST",
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          }).catch(() => {});
          setStatus("success");
          setMsg("Email already verified! Redirecting…");
          setTimeout(() => router.replace("/dashboard"), 1200);

        } else if (
          message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("invalid")
        ) {
          // OTP / token is expired or invalid — show the expired UI
          setStatus("expired");
          setMsg("This verification link has expired. Please request a new one.");

        } else {
          setStatus("error");
          setMsg(message);
        }
      }
    }

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Helpers ── */
  const iconBg =
    status === "error"   ? "rgba(220,38,38,0.1)"  :
    status === "expired" ? "rgba(245,158,11,0.12)" :
    "linear-gradient(135deg, #FF3CAC, #FF6B35)";

  const icon =
    status === "verifying" ? "⏳" :
    status === "success"   ? "✅" :
    status === "expired"   ? "⏰" : "❌";

  const headline =
    status === "verifying" ? "Verifying email…"      :
    status === "success"   ? "Email verified!"        :
    status === "expired"   ? "Link expired"           : "Verification failed";

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
            width: 52, height: 52, borderRadius: 14,
            background: iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 24,
          }}
        >
          {icon}
        </div>

        {/* Headline */}
        <h1
          className="font-heading"
          style={{ fontSize: 22, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 10 }}
        >
          {headline}
        </h1>

        {/* Sub-message */}
        <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
          {status === "expired"
            ? "Verification links expire after 24 hours. Request a new one and verify straight away."
            : msg}
        </p>

        {/* ── Expired actions ── */}
        {status === "expired" && (
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>

            {resendState === "noSession" ? (
              /* User has no session — take them to login */
              <>
                <p style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                  You&apos;re not signed in. Log in to send a new link.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  style={{
                    padding: "12px 28px", borderRadius: 100,
                    background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                    color: "#fff", fontWeight: 600, fontSize: 14,
                    border: "none", cursor: "pointer",
                    fontFamily: "var(--font-inter)",
                    boxShadow: "0 4px 14px rgba(255,60,172,0.32)",
                  }}
                >
                  Go to Login
                </button>
              </>
            ) : resendState === "sent" ? (
              /* Email sent */
              <div
                style={{
                  padding: "14px 20px", borderRadius: 12,
                  background: "rgba(22,163,74,0.07)",
                  border: "1px solid rgba(22,163,74,0.20)",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", fontFamily: "var(--font-inter)", margin: 0 }}>
                  ✓ New link sent — check your inbox!
                </p>
                {countdown > 0 && (
                  <p style={{ fontSize: 12, color: "#6B6B72", fontFamily: "var(--font-inter)", margin: "4px 0 0" }}>
                    Resend again in {countdown}s
                  </p>
                )}
              </div>
            ) : (
              /* Default: resend button */
              <>
                <button
                  onClick={handleResend}
                  disabled={resendState === "sending" || countdown > 0}
                  style={{
                    padding: "12px 28px", borderRadius: 100,
                    background: (resendState === "sending" || countdown > 0)
                      ? "#F0EDE8"
                      : "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                    color: (resendState === "sending" || countdown > 0) ? "#A8A5A0" : "#fff",
                    fontWeight: 600, fontSize: 14, border: "none",
                    cursor: (resendState === "sending" || countdown > 0) ? "default" : "pointer",
                    fontFamily: "var(--font-inter)",
                    boxShadow: (resendState === "sending" || countdown > 0)
                      ? "none" : "0 4px 14px rgba(255,60,172,0.32)",
                    transition: "all 0.15s",
                  }}
                >
                  {resendState === "sending"
                    ? "Sending…"
                    : countdown > 0
                      ? `Retry in ${countdown}s`
                      : "Send new verification link"}
                </button>

                {resendState === "rateLimited" && (
                  <p style={{ fontSize: 12, color: "#e17055", fontFamily: "var(--font-inter)", margin: 0 }}>
                    Rate limit reached — please wait {countdown}s
                  </p>
                )}
                {resendState === "failed" && (
                  <p style={{ fontSize: 12, color: "#e17055", fontFamily: "var(--font-inter)", margin: 0 }}>
                    Couldn&apos;t send email. Please try again.
                  </p>
                )}

                <button
                  onClick={() => router.push("/login")}
                  style={{
                    padding: "10px 20px", borderRadius: 100,
                    background: "transparent", color: "#A8A5A0",
                    fontWeight: 500, fontSize: 13, border: "none",
                    cursor: "pointer", fontFamily: "var(--font-inter)",
                  }}
                >
                  Back to login
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Generic error action ── */}
        {status === "error" && (
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              marginTop: 20, padding: "12px 28px", borderRadius: 100,
              background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
              color: "#fff", fontWeight: 600, fontSize: 14,
              border: "none", cursor: "pointer",
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
