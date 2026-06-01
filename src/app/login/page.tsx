"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";
import AuthPanel from "@/components/auth-panel";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 12,
  border: "1.5px solid #E8E5E0",
  fontSize: 15,
  fontFamily: "var(--font-inter)",
  color: "#0D0D12",
  background: "#F7F5F2",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
};

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect");
  const rawPlan      = searchParams.get("plan");
  const planParam: "starter" | "growth" | "pro" =
    rawPlan === "pro" || rawPlan === "growth" ? rawPlan : "starter";
  const intervalParam: "monthly" | "annual" =
    searchParams.get("interval") === "annual" ? "annual" : "monthly";

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  // Guard: if already authenticated, send to dashboard immediately.
  // The middleware handles this for the first load, but this catches the
  // case where a session is set in a sibling tab between requests.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const dest =
          redirectTo && redirectTo.startsWith("/") && redirectTo !== "/login"
            ? redirectTo
            : "/dashboard";
        router.replace(dest);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend() {
    if (!email.trim()) return;
    setResendSent(false);
    await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setResendSent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerify(false);
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        // Server-side force-confirm so the user can sign in immediately
        await fetch("/api/auth/auto-confirm", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: email.trim() }),
        });
        // Give Supabase a moment to propagate the update
        await new Promise(r => setTimeout(r, 400));
        const { error: retryErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (retryErr) {
          // auto-confirm failed (likely wrong service key on server) —
          // show a soft banner with resend instead of a hard error
          setNeedsVerify(true);
          setLoading(false);
          return;
        }
      } else {
        setError(error.message); setLoading(false); return;
      }
    }

    // Wait until the auth cookie is durably readable before navigating. The
    // middleware reads the session from cookies on the server; navigating before
    // the cookie is flushed makes it see no session and bounce back to /login.
    for (let i = 0; i < 20; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) break;
      await new Promise(r => setTimeout(r, 50));
    }

    const dest =
      redirectTo && redirectTo.startsWith("/") && redirectTo !== "/login"
        ? redirectTo
        : "/dashboard";

    if (redirectTo === "checkout") {
      try { await redirectToCheckout(undefined, planParam, intervalParam); return; }
      catch { window.location.href = "/dashboard"; return; }
    }

    // Full-page navigation (not router.push) so the freshly-set auth cookies
    // ride along with the request the middleware inspects.
    window.location.href = dest;
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left: Form ── */}
      <div
        className="flex flex-col justify-center px-8 sm:px-12 w-full lg:w-[45%] xl:w-[40%] flex-shrink-0"
        style={{ background: "#FFFFFF", minHeight: "100vh" }}
      >
        <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>

          {/* Logo + back link */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 38, width: "auto" }} />
            </Link>
            <Link
              href="/"
              className="lg:hidden"
              style={{ fontSize: 13, fontWeight: 500, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none" }}
            >
              ← Home
            </Link>
          </div>

          {/* Headline */}
          <h1 className="font-heading" style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", lineHeight: 1.1, marginBottom: 8 }}>
            {redirectTo === "checkout" ? "Sign in to upgrade" : "Welcome back"}
          </h1>
          <p style={{ fontSize: 15, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 32, lineHeight: 1.5 }}>
            {redirectTo === "checkout"
              ? "Sign in and you'll be redirected to checkout."
              : "Sign in to your Adur.ai account."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                style={INPUT}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: 13, fontWeight: 500, color: "#FF3CAC", fontFamily: "var(--font-inter)", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
                style={INPUT}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.20)" }}>
                <p style={{ fontSize: 13, color: "#e17055", fontFamily: "var(--font-inter)", textAlign: "center" }}>{error}</p>
              </div>
            )}

            {needsVerify && (
              <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,60,172,0.06)", border: "1px solid rgba(255,60,172,0.20)" }}>
                <p style={{ fontSize: 13, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 8, lineHeight: 1.5 }}>
                  📧 <strong>Please verify your email</strong> — check your inbox for a confirmation link.
                </p>
                {resendSent ? (
                  <p style={{ fontSize: 12, color: "#16A34A", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
                    ✓ Verification email sent — check your inbox!
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{ fontSize: 12, fontWeight: 700, color: "#FF3CAC", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-inter)", textDecoration: "underline" }}
                  >
                    Didn&apos;t receive it? Resend verification email →
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold text-white cursor-pointer transition-all disabled:opacity-60"
              style={{
                padding:      "15px",
                borderRadius:  100,
                background:    loading ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                fontSize:       16,
                fontFamily:   "var(--font-inter)",
                boxShadow:     loading ? "none" : "0 4px 20px rgba(255,60,172,0.32)",
                border:        "none",
                letterSpacing: "-0.01em",
                marginTop:      4,
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(255,60,172,0.44)"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(255,60,172,0.32)"; }}
            >
              {loading
                ? (redirectTo === "checkout" ? "Redirecting…" : "Signing in…")
                : (redirectTo === "checkout" ? "Sign In & Upgrade →" : "Sign In →")}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
            {"Don't have an account? "}{" "}
            <Link
              href={redirectTo === "checkout" ? "/signup?redirect=checkout" : "/signup"}
              style={{ fontWeight: 700, color: "#0D0D12", textDecoration: "none" }}
            >
              Get Started
            </Link>
          </p>

          {/* Footer */}
          <div className="flex items-center justify-center gap-4 mt-12">
            {([["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]] as const).map(([t, href], i) => (
              <span key={t} className="flex items-center gap-4">
                {i > 0 && <span style={{ color: "#D4D0CA" }}>·</span>}
                <Link href={href} style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#0D0D12"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#A8A5A0"; }}
                >{t}</Link>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Visual panel ── */}
      <AuthPanel />
    </div>
  );
}
