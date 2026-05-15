"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/success` },
      });

      if (signUpError) throw signUpError;

      // 2a. Got a session immediately (email confirmations disabled)
      if (data.session?.access_token) {
        await redirectToCheckout(data.session.access_token);
        return;
      }

      // 2b. No session yet — try signing in (handles already-existing account
      //     or Supabase projects with auto-confirm enabled)
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (signInError) {
        // Most likely: email not verified yet — still push to checkout
        // by using a guest token fallback handled in redirectToCheckout
        throw new Error(
          "Account created! Check your email to verify, then sign in to complete your purchase."
        );
      }

      if (signInData.session?.access_token) {
        await redirectToCheckout(signInData.session.access_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setEmail("");
    setPassword("");
    setError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(13,13,26,0.60)", backdropFilter: "blur(6px)" }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="relative w-full pointer-events-auto rounded-2xl overflow-hidden"
              style={{
                maxWidth: 420,
                background: "#ffffff",
                boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(108,92,231,0.15)",
              }}
            >
              {/* Top gradient strip */}
              <div style={{ height: 4, background: "linear-gradient(90deg, #6c5ce7, #e040fb)" }} />

              {/* Close */}
              <button
                onClick={handleClose}
                disabled={loading}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-40"
                style={{ color: "#9ca3af", background: "#f9f9fc" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#0d0d1a"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-8 py-8">
                {/* Icon + heading */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(108,92,231,0.10)" }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: "#6c5ce7" }} />
                </div>

                <h2
                  className="font-heading font-bold mb-1"
                  style={{ fontSize: 22, letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.2 }}
                >
                  Get started with Starter
                </h2>
                <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-inter)", marginBottom: 22 }}>
                  Create your account and go straight to payment — done in 60 seconds.
                </p>

                {/* Price pill */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-6"
                  style={{ background: "rgba(108,92,231,0.06)", border: "1px solid rgba(108,92,231,0.15)" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#6c5ce7", fontFamily: "var(--font-inter)" }}>
                    Starter Plan
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#0d0d1a", fontFamily: "var(--font-syne)" }}>
                    $19<span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280" }}>/month</span>
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="w-full outline-none transition-all disabled:opacity-60"
                    style={{
                      padding: "11px 14px",
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

                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password (min. 8 characters)"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className="w-full outline-none transition-all disabled:opacity-60"
                    style={{
                      padding: "11px 14px",
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
                    className="w-full flex items-center justify-center gap-2 font-semibold text-white py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-70 mt-1"
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
                    {loading ? "Setting up your account…" : "Continue to Payment"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <p
                  className="text-center mt-4"
                  style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)" }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login?redirect=checkout"
                    className="font-medium"
                    style={{ color: "#6c5ce7" }}
                    onClick={handleClose}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
