"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
            style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)" }}
          >
            <span className="text-white font-bold text-base">A</span>
          </div>
          <span
            className="font-heading font-bold"
            style={{ fontSize: 20, color: "#0d0d1a", letterSpacing: "-0.025em" }}
          >
            adur<span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
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
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center gap-4 py-4"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,60,172,0.08)" }}
              >
                <span style={{ fontSize: 28 }}>✉️</span>
              </div>
              <h2 className="font-heading font-bold" style={{ fontSize: 22, color: "#0d0d1a", letterSpacing: "-0.025em" }}>
                Check your email
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, fontFamily: "var(--font-inter)" }}>
                {"We've sent a password reset link to "}
                <strong style={{ color: "#0d0d1a" }}>{email}</strong>.
              </p>
              <Link
                href="/login"
                className="text-sm font-semibold"
                style={{ color: "#FF3CAC", fontFamily: "var(--font-inter)" }}
              >
                Back to Sign In →
              </Link>
            </motion.div>
          ) : (
            <>
              <h1
                className="font-heading font-bold mb-1"
                style={{ fontSize: 24, color: "#0d0d1a", letterSpacing: "-0.03em" }}
              >
                Reset password
              </h1>
              <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-inter)", marginBottom: 24 }}>
                Enter your email and we'll send you a reset link.
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
                    onFocus={e => { e.currentTarget.style.border = "1px solid #FF3CAC"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,60,172,0.10)"; }}
                    onBlur={e => { e.currentTarget.style.border = "1px solid #e5e7eb"; e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; }}
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
                    background: loading ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                    fontSize: 15,
                    fontFamily: "var(--font-inter)",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(255,60,172,0.35)",
                    border: "none",
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(255,60,172,0.48)"; }}
                  onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(255,60,172,0.35)"; }}
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p
                className="text-center mt-5"
                style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-inter)" }}
              >
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold"
                  style={{ color: "#FF3CAC" }}
                >
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
