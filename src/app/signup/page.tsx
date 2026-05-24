"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";
import AuthPanel from "@/components/auth-panel";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
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

function SignupContent() {
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("redirect");
  const planParam    = searchParams.get("plan") === "pro" ? "pro" : "starter";
  const router       = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);

    // Server-side signup — creates user pre-confirmed, no email verification needed
    const signupRes = await fetch("/api/auth/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim(), password }),
    });
    const signupJson = await signupRes.json() as { ok?: boolean; error?: string };

    if (!signupRes.ok && signupJson.error) {
      setError(signupJson.error);
      setLoading(false);
      return;
    }

    // Sign in — user is already confirmed so this will succeed
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) { setError(signInError.message); setLoading(false); return; }

    const token = signInData.session?.access_token;

    if (redirectTo === "checkout" && token) {
      try { await redirectToCheckout(token, planParam); return; } catch { /* fall through */ }
    }

    router.push("/dashboard");
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
            Create your account
          </h1>
          <p style={{ fontSize: 15, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 32, lineHeight: 1.5 }}>
            {redirectTo === "checkout"
              ? "One step away — fill in your details and go straight to payment."
              : "Start analyzing your Meta Ads in 60 seconds. Free."}
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { dot: "#16A34A", text: "No credit card" },
              { dot: "#FF3CAC", text: "60-second setup" },
              { dot: "#0984e3", text: "Data stays private" },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: b.dot, flexShrink: 0 }} />
                {b.text}
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
                disabled={loading}
                style={INPUT}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                disabled={loading}
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
                ? (redirectTo === "checkout" ? "Setting up your account…" : "Creating account…")
                : (redirectTo === "checkout" ? "Continue to Payment →" : "Get Started →")}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
            {"Already have an account? "}
            <Link
              href={redirectTo === "checkout" ? "/login?redirect=checkout" : "/login"}
              style={{ fontWeight: 700, color: "#0D0D12", textDecoration: "none" }}
            >
              Sign In
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
