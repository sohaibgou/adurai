"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Zap, CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";
import { useAuth } from "@/context/auth-context";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "analysis" | "image" | "copy";
}

const LIMIT_MESSAGES: Record<string, string> = {
  analysis: "You've used all 3 free analyses. Upgrade to Starter for unlimited access.",
  image:    "You've used all 3 free image generations. Upgrade to Starter for unlimited access.",
  copy:     "You've used all 3 free ad copy generations. Upgrade to Starter for unlimited access.",
};

const FEATURES = [
  "Unlimited campaign analyses",
  "Full 7-Day Battle Plan",
  "Profit Leak calculator",
  "Unlimited image generations",
  "Unlimited ad copy generations",
  "PDF report export",
  "Priority support",
];

export default function PaywallModal({ open, onClose, reason }: PaywallModalProps) {
  const { user } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // When a hard limit is hit the modal cannot be dismissed
  const hardLimit = !!reason;

  async function handleUpgrade(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (user) {
        await redirectToCheckout();
        return;
      }

      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/success` },
      });

      if (signUpError) throw signUpError;

      if (data.session?.access_token) {
        await redirectToCheckout(data.session.access_token);
        return;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (signInError) {
        throw new Error("Account created! Verify your email then sign in to complete your upgrade.");
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
    if (loading || hardLimit) return;
    setEmail("");
    setPassword("");
    setError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — not clickable when hard limit */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(13,13,26,0.72)", backdropFilter: "blur(8px)" }}
            onClick={hardLimit ? undefined : handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="relative w-full pointer-events-auto rounded-2xl overflow-hidden"
              style={{
                maxWidth: 460,
                background: "#ffffff",
                boxShadow: "0 32px 80px rgba(0,0,0,0.24), 0 0 0 1px rgba(108,92,231,0.18)",
              }}
            >
              {/* Gradient top strip */}
              <div style={{ height: 4, background: "linear-gradient(90deg, #6c5ce7, #e040fb)" }} />

              {/* X button — hidden when hard limit */}
              {!hardLimit && (
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
              )}

              <div className="px-8 py-8">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: hardLimit ? "rgba(224,64,251,0.10)" : "rgba(108,92,231,0.10)" }}
                >
                  {hardLimit ? (
                    <Lock className="w-6 h-6" style={{ color: "#e040fb" }} />
                  ) : (
                    <Zap className="w-6 h-6" style={{ color: "#6c5ce7" }} />
                  )}
                </div>

                {/* Heading */}
                <h2
                  className="font-heading font-bold mb-2"
                  style={{ fontSize: 22, letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.15 }}
                >
                  {hardLimit
                    ? "You've hit your free limit"
                    : user ? "Upgrade to Starter" : "Create an account to upgrade"}
                </h2>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: 18 }}>
                  {hardLimit
                    ? LIMIT_MESSAGES[reason!]
                    : user
                      ? "Unlock unlimited analyses, Creative Studio, and your full 7-Day Battle Plan."
                      : "Enter your details below — you'll be at checkout in under 60 seconds."}
                </p>

                {/* Price pill */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-5"
                  style={{ background: "rgba(108,92,231,0.06)", border: "1px solid rgba(108,92,231,0.15)" }}
                >
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#6c5ce7", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Starter Plan</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#0d0d1a", fontFamily: "var(--font-syne)", letterSpacing: "-0.02em" }}>
                      $19<span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>/month</span>
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#00b894", background: "rgba(0,184,148,0.1)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                    Cancel anytime
                  </span>
                </div>

                {/* Feature list */}
                <ul className="space-y-2 mb-5">
                  {FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#6c5ce7" }} />
                      <span style={{ fontSize: 13, color: "#374151", fontFamily: "var(--font-inter)" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Sign-up form — shown when not logged in */}
                {!user && (
                  <form onSubmit={handleUpgrade} className="flex flex-col gap-3 mb-4">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="w-full outline-none transition-all disabled:opacity-60"
                      style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, fontFamily: "var(--font-inter)", color: "#0d0d1a", background: "#fafafa" }}
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
                      style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, fontFamily: "var(--font-inter)", color: "#0d0d1a", background: "#fafafa" }}
                      onFocus={e => { e.currentTarget.style.border = "1px solid #6c5ce7"; e.currentTarget.style.background = "#fff"; }}
                      onBlur={e => { e.currentTarget.style.border = "1px solid #e5e7eb"; e.currentTarget.style.background = "#fafafa"; }}
                    />
                    {error && (
                      <p className="text-sm rounded-lg px-4 py-2.5 text-center" style={{ color: "#e17055", background: "rgba(225,112,85,0.08)", fontFamily: "var(--font-inter)" }}>
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 font-semibold text-white py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-70"
                      style={{ background: loading ? "#9ca3af" : "linear-gradient(135deg, #6c5ce7, #e040fb)", fontSize: 15, fontFamily: "var(--font-inter)", boxShadow: loading ? "none" : "0 4px 20px rgba(108,92,231,0.38)", border: "none" }}
                    >
                      {loading ? "Setting up your account…" : "Upgrade to Starter"}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                )}

                {/* Error for logged-in upgrade */}
                {user && error && (
                  <p className="text-sm rounded-lg px-4 py-2.5 text-center mb-3" style={{ color: "#e17055", background: "rgba(225,112,85,0.08)", fontFamily: "var(--font-inter)" }}>
                    {error}
                  </p>
                )}

                {/* CTA for logged-in users */}
                {user && (
                  <button
                    onClick={() => handleUpgrade()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 font-semibold text-white py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-70 mb-4"
                    style={{ background: loading ? "#9ca3af" : "linear-gradient(135deg, #6c5ce7, #e040fb)", fontSize: 15, fontFamily: "var(--font-inter)", boxShadow: loading ? "none" : "0 4px 20px rgba(108,92,231,0.38)", border: "none" }}
                  >
                    {loading ? "Redirecting…" : "Upgrade to Starter"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}

                {/* Footer — sign in link always visible */}
                <p className="text-center" style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>
                  Already have an account?{" "}
                  <Link
                    href="/login?redirect=checkout"
                    className="font-medium"
                    style={{ color: "#6c5ce7" }}
                    onClick={hardLimit ? undefined : handleClose}
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
