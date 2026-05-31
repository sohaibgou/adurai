"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout, type CheckoutPlan, type BillingInterval } from "@/lib/checkout";

interface CheckoutModalProps {
  open:      boolean;
  onClose:   () => void;
  plan?:     CheckoutPlan;
  interval?: BillingInterval;
}

interface PlanInfo {
  title:    string;
  label:    string;
  monthly:  string;
  annual:   string;
  purple:   boolean;            // purple accent (Autopilot) vs pink gradient
  features: string[];
}

const PLAN_INFO: Record<CheckoutPlan, PlanInfo> = {
  starter: {
    title: "Upgrade to Starter",
    label: "Starter Plan",
    monthly: "$19", annual: "$15",
    purple: false,
    features: [
      "10 campaign analyses / month",
      "Full 7-Day Battle Plan",
      "Profit Leak calculator",
      "5 ad images / month + unlimited copy",
      "3 UGC AI videos / month",
    ],
  },
  growth: {
    title: "Upgrade to Growth",
    label: "Growth Plan",
    monthly: "$49", annual: "$39",
    purple: false,
    features: [
      "Unlimited campaign analyses",
      "Connect Meta Account (live data)",
      "20 ad images / month + unlimited copy",
      "10 UGC AI videos / month",
      "Creative fatigue alerts",
    ],
  },
  pro: {
    title: "Upgrade to Autopilot",
    label: "Autopilot Plan",
    monthly: "$99", annual: "$79",
    purple: true,
    features: [
      "Everything in Growth",
      "AI Manager & full Autopilot",
      "Auto pause / scale / budget",
      "24/7 campaign monitoring",
      "30 UGC AI videos / month",
    ],
  },
};

export default function CheckoutModal({ open, onClose, plan = "starter", interval = "monthly" }: CheckoutModalProps) {
  const info     = PLAN_INFO[plan];
  const purple   = info.purple;
  const price    = interval === "annual" ? info.annual : info.monthly;
  const period   = interval === "annual" ? "/mo billed yearly" : "/month";
  const accent   = purple ? "#6c5ce7" : "#FF3CAC";
  const btnBg     = purple ? "#6c5ce7" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)";
  const shadowSm  = purple ? "0 4px 20px rgba(108,92,231,0.35)" : "0 4px 20px rgba(255,60,172,0.35)";
  const shadowLg  = purple ? "0 8px 28px rgba(108,92,231,0.48)" : "0 8px 28px rgba(255,60,172,0.48)";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:   email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/success` },
      });

      if (signUpError) throw signUpError;

      if (data.session?.access_token) {
        await redirectToCheckout(data.session.access_token, plan, interval);
        return;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (signInError) {
        throw new Error(
          "Account created! Check your email to verify, then sign in to complete your purchase."
        );
      }

      if (signInData.session?.access_token) {
        await redirectToCheckout(signInData.session.access_token, plan, interval);
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
            style={{ background: "rgba(13,13,18,0.60)", backdropFilter: "blur(10px)" }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="relative w-full pointer-events-auto"
              style={{
                maxWidth:     460,
                background:   "#FFFFFF",
                borderRadius:  24,
                boxShadow:    "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(232,229,224,1)",
                overflow:     "hidden",
              }}
            >
              {/* Gradient top strip */}
              <div style={{ height: 5, background: purple ? "linear-gradient(90deg, #6c5ce7, #a29bfe)" : "linear-gradient(90deg, #FF3CAC, #FF6B35)" }} />

              {/* Close */}
              <button
                onClick={handleClose}
                disabled={loading}
                className="absolute flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
                style={{
                  top: 16, right: 16,
                  width: 34, height: 34,
                  borderRadius: "50%",
                  background: "#F7F5F2",
                  border: "1px solid #E8E5E0",
                  color: "#A8A5A0",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#F0EDE8";
                  (e.currentTarget as HTMLButtonElement).style.color = "#0D0D12";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#F7F5F2";
                  (e.currentTarget as HTMLButtonElement).style.color = "#A8A5A0";
                }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-7 pt-7 pb-8">

                {/* Icon */}
                <div
                  className="flex items-center justify-center mb-5"
                  style={{
                    width: 52, height: 52,
                    borderRadius: 16,
                    background: purple
                      ? "linear-gradient(135deg, rgba(108,92,231,0.12), rgba(162,155,254,0.10))"
                      : "linear-gradient(135deg, rgba(255,60,172,0.12), rgba(255,107,53,0.10))",
                    border: purple ? "1px solid rgba(108,92,231,0.20)" : "1px solid rgba(255,60,172,0.20)",
                  }}
                >
                  <Zap className="w-6 h-6" style={{ color: accent }} />
                </div>

                {/* Heading */}
                <h2
                  className="font-heading"
                  style={{
                    fontSize: 24, fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "#0D0D12",
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {info.title}
                </h2>
                <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.65, fontFamily: "var(--font-inter)", marginBottom: 20 }}>
                  Create your account and go straight to payment — done in 60 seconds.
                </p>

                {/* Price pill */}
                <div
                  className="flex items-center justify-between mb-5"
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: purple ? "rgba(108,92,231,0.06)" : "rgba(255,60,172,0.05)",
                    border: purple ? "1px solid rgba(108,92,231,0.20)" : "1px solid rgba(255,60,172,0.18)",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)", marginBottom: 3 }}>
                      {info.label}
                    </p>
                    <p className="font-heading" style={{ fontSize: 26, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {price}<span style={{ fontSize: 13, fontWeight: 400, color: "#6B6B72", letterSpacing: 0 }}>{period}</span>
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "rgba(22,163,74,0.10)", padding: "5px 12px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                    Cancel anytime
                  </span>
                </div>

                {/* Feature list */}
                <ul className="space-y-2 mb-6">
                  {info.features.map(f => (
                    <li key={f} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                      <span style={{ fontSize: 13, color: "#0D0D12", fontFamily: "var(--font-inter)", fontWeight: 500 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
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
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1.5px solid #E8E5E0",
                      fontSize: 14,
                      fontFamily: "var(--font-inter)",
                      color: "#0D0D12",
                      background: "#F7F5F2",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = `0 0 0 4px ${purple ? "rgba(108,92,231,0.10)" : "rgba(255,60,172,0.10)"}`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; e.currentTarget.style.boxShadow = "none"; }}
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
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1.5px solid #E8E5E0",
                      fontSize: 14,
                      fontFamily: "var(--font-inter)",
                      color: "#0D0D12",
                      background: "#F7F5F2",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = `0 0 0 4px ${purple ? "rgba(108,92,231,0.10)" : "rgba(255,60,172,0.10)"}`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; e.currentTarget.style.boxShadow = "none"; }}
                  />

                  {error && (
                    <p style={{ fontSize: 13, color: "#e17055", background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.18)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", textAlign: "center" }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 font-semibold text-white cursor-pointer transition-all disabled:opacity-60"
                    style={{
                      padding: "15px",
                      borderRadius: 100,
                      background: loading ? "#9ca3af" : btnBg,
                      fontSize: 15,
                      fontFamily: "var(--font-inter)",
                      letterSpacing: "-0.01em",
                      boxShadow: loading ? "none" : shadowSm,
                      border: "none",
                    }}
                    onMouseEnter={e => { if (!loading) { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = shadowLg; } }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = shadowSm; }}
                  >
                    {loading ? "Setting up your account…" : "Continue to Payment"}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <p className="text-center" style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                  Already have an account?{" "}
                  <Link
                    href={`/login?redirect=checkout&plan=${plan}&interval=${interval}`}
                    className="font-semibold"
                    style={{ color: accent, textDecoration: "none" }}
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
