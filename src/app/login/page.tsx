"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // After login, honour redirect intent
    if (redirectTo === "checkout") {
      try {
        await redirectToCheckout();
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#ffffff" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
        style={{ maxWidth: 420 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)" }}
          >
            <span className="text-white font-bold text-base">A</span>
          </div>
          <span
            className="font-heading font-bold"
            style={{ fontSize: 20, color: "#0d0d1a", letterSpacing: "-0.025em" }}
          >
            adur<span style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl px-8 py-8"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
          }}
        >
          <h1
            className="font-heading font-bold mb-1"
            style={{ fontSize: 24, color: "#0d0d1a", letterSpacing: "-0.03em" }}
          >
            {redirectTo === "checkout" ? "Sign in to upgrade" : "Welcome back"}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-inter)", marginBottom: 24 }}>
            {redirectTo === "checkout"
              ? "You'll be redirected to checkout right after."
              : "Sign in to your Adur.ai account."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", fontFamily: "var(--font-inter)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full outline-none transition-all"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  fontFamily: "var(--font-inter)",
                  color: "#0d0d1a",
                  background: "#fafafa",
                }}
                onFocus={e => { e.currentTarget.style.border = "1px solid #6c5ce7"; e.currentTarget.style.background = "#fff"; }}
                onBlur={e => { e.currentTarget.style.border = "1px solid #e5e7eb"; e.currentTarget.style.background = "#fafafa"; }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", fontFamily: "var(--font-inter)" }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium"
                  style={{ color: "#6c5ce7", fontFamily: "var(--font-inter)" }}
                >
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
                className="w-full outline-none transition-all"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                  fontFamily: "var(--font-inter)",
                  color: "#0d0d1a",
                  background: "#fafafa",
                }}
                onFocus={e => { e.currentTarget.style.border = "1px solid #6c5ce7"; e.currentTarget.style.background = "#fff"; }}
                onBlur={e => { e.currentTarget.style.border = "1px solid #e5e7eb"; e.currentTarget.style.background = "#fafafa"; }}
              />
            </div>

            {error && (
              <p
                className="text-sm rounded-lg px-4 py-2.5 text-center"
                style={{ color: "#e17055", background: "rgba(225,112,85,0.08)", fontFamily: "var(--font-inter)" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold text-white py-3 rounded-xl transition-all cursor-pointer disabled:opacity-70 mt-1"
              style={{
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #6c5ce7, #e040fb)",
                fontSize: 15,
                fontFamily: "var(--font-inter)",
                boxShadow: loading ? "none" : "0 4px 20px rgba(108,92,231,0.38)",
                border: "none",
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(108,92,231,0.52)"; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(108,92,231,0.38)"; }}
            >
              {loading
                ? (redirectTo === "checkout" ? "Redirecting to checkout…" : "Signing in…")
                : (redirectTo === "checkout" ? "Sign In & Upgrade" : "Sign In")}
            </button>
          </form>

          <p
            className="text-center mt-5"
            style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-inter)" }}
          >
            {"Don't have an account?"}{" "}
            <Link
              href={redirectTo === "checkout" ? "/signup?redirect=checkout" : "/signup"}
              className="font-semibold"
              style={{ color: "#6c5ce7" }}
            >
              Get Started
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
