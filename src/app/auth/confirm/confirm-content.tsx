"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function ConfirmContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [msg,    setMsg]    = useState("Verifying your email…");

  useEffect(() => {
    async function verify() {
      const tokenHash = searchParams.get("token_hash");
      const type      = searchParams.get("type") as "signup" | "email" | "magiclink" | "invite" | null;
      const code      = searchParams.get("code");

      // Pass access_token directly so mark-verified doesn't need cookies
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

        } else if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          // Implicit / hash flow — #access_token=...
          // createBrowserClient processes the hash asynchronously; wait for it.
          session = await new Promise<Session | null>((resolve) => {
            let done = false;

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
              if (!done && s) {
                done = true;
                subscription.unsubscribe();
                resolve(s);
              }
            });

            // Also check immediately — might already be processed
            supabase.auth.getSession().then(({ data }) => {
              if (!done && data.session) {
                done = true;
                subscription.unsubscribe();
                resolve(data.session);
              }
            });

            // 8-second safety timeout
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

        // "already confirmed" / "expired" → still mark as verified and continue
        if (
          message.toLowerCase().includes("expired") ||
          message.toLowerCase().includes("already")
        ) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          await fetch("/api/auth/mark-verified", {
            method: "POST",
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          }).catch(() => {});
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
        <div
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: status === "error"
              ? "rgba(220,38,38,0.1)"
              : "linear-gradient(135deg, #FF3CAC, #FF6B35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 24,
          }}
        >
          {status === "verifying" ? "⏳" : status === "success" ? "✅" : "❌"}
        </div>

        <h1
          className="font-heading"
          style={{ fontSize: 22, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 10 }}
        >
          {status === "verifying"
            ? "Verifying email…"
            : status === "success"
              ? "Email verified!"
              : "Verification failed"}
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
