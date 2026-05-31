"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Zap, Crown, CheckCircle, Loader2 } from "lucide-react";
import { redirectToCheckout, type CheckoutPlan } from "@/lib/checkout";

interface ProUpgradeModalProps {
  open:     boolean;
  onClose:  () => void;
  /** "meta" → Meta connection (Growth + Autopilot). "autopilot" → full Autopilot (Pro only). */
  variant?: "meta" | "autopilot";
}

const GROWTH_FEATURES = [
  "Connect your Meta account",
  "Live campaign performance data",
  "Creative fatigue alerts",
  "Unlimited analyses + 20 images / mo",
  "10 UGC AI videos / mo",
];

const PRO_FEATURES = [
  "Everything in Growth",
  "AI writes & pushes changes (Autopilot)",
  "24/7 AI monitoring",
  "Auto budget optimization",
  "Daily AI briefings",
];

export default function ProUpgradeModal({ open, onClose, variant = "autopilot" }: ProUpgradeModalProps) {
  const [loading, setLoading] = useState<CheckoutPlan | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const isMeta = variant === "meta";

  async function handleUpgrade(plan: CheckoutPlan) {
    setLoading(plan);
    setError(null);
    try {
      const ok = await redirectToCheckout(undefined, plan);
      if (!ok) {
        window.location.href = `/login?redirect=checkout&plan=${plan}`;
        return;
      }
      // ok === true → already navigating to Stripe; keep the spinner.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(13,13,18,0.65)", backdropFilter: "blur(10px)" }}
            onClick={() => { if (!loading) onClose(); }}
          />

          {/* Modal */}
          <motion.div
            key="pu-modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 pointer-events-none overflow-y-auto py-4"
          >
            <div
              className="relative w-full pointer-events-auto"
              style={{
                maxWidth:     isMeta ? 600 : 440,
                background:   "#FFFFFF",
                borderRadius:  24,
                boxShadow:    "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(232,229,224,1)",
                overflow:     "hidden",
                margin:       "auto",
              }}
            >
              {/* Top strip */}
              <div style={{ height: 5, background: isMeta ? "linear-gradient(90deg, #FF3CAC, #FF6B35)" : "linear-gradient(90deg, #6c5ce7, #a29bfe)" }} />

              {/* Close */}
              <button
                onClick={onClose}
                disabled={!!loading}
                className="absolute flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
                style={{
                  top: 16, right: 16,
                  width: 34, height: 34,
                  borderRadius: "50%",
                  background: "#F7F5F2",
                  border: "1px solid #E8E5E0",
                  color: "#A8A5A0",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F0EDE8"; (e.currentTarget as HTMLButtonElement).style.color = "#0D0D12"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F5F2"; (e.currentTarget as HTMLButtonElement).style.color = "#A8A5A0"; }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-5 sm:px-7 pt-7 pb-8">

                {/* Icon */}
                <div
                  className="flex items-center justify-center mb-5"
                  style={{
                    width: 52, height: 52,
                    borderRadius: 16,
                    background: isMeta ? "rgba(255,60,172,0.10)" : "rgba(108,92,231,0.10)",
                    border: `1px solid ${isMeta ? "rgba(255,60,172,0.22)" : "rgba(108,92,231,0.22)"}`,
                  }}
                >
                  <Bot className="w-6 h-6" style={{ color: isMeta ? "#FF3CAC" : "#6c5ce7" }} />
                </div>

                {/* Heading */}
                <h2
                  className="font-heading"
                  style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", lineHeight: 1.15, marginBottom: 8 }}
                >
                  {isMeta ? "Connect Meta to unlock live insights" : "Autopilot is an Autopilot-plan feature"}
                </h2>
                <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.65, fontFamily: "var(--font-inter)", marginBottom: 20 }}>
                  {isMeta
                    ? "Meta account connection is available on Growth & Autopilot. Start on Growth for live data, or go all-in with Autopilot for hands-free management."
                    : "Upgrade to Autopilot to let Adur connect, monitor and optimize your campaigns autonomously."}
                </p>

                {isMeta ? (
                  /* ── Growth + Pro side by side ── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Growth */}
                    <div className="flex flex-col rounded-2xl p-4 relative" style={{ background: "rgba(255,60,172,0.05)", border: "1.5px solid rgba(255,60,172,0.30)" }}>
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "#FF3CAC", padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em", fontFamily: "var(--font-inter)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                          Most Popular
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2 mt-1">
                        <Zap className="w-3.5 h-3.5" style={{ color: "#FF3CAC" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#FF3CAC", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Growth</span>
                      </div>
                      <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                        $49<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                      </p>
                      <ul className="flex-1 space-y-1.5 mb-4">
                        {GROWTH_FEATURES.map(f => (
                          <li key={f} className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#FF3CAC" }} />
                            <span style={{ fontSize: 11.5, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleUpgrade("growth")}
                        disabled={!!loading}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", border: "none", boxShadow: "0 3px 12px rgba(255,60,172,0.30)" }}
                      >
                        {loading === "growth" ? "…" : "Get Growth →"}
                      </button>
                    </div>

                    {/* Pro / Autopilot */}
                    <div className="flex flex-col rounded-2xl p-4" style={{ background: "rgba(108,92,231,0.05)", border: "1.5px solid rgba(108,92,231,0.25)" }}>
                      <div className="flex items-center gap-1.5 mb-2 mt-1">
                        <Crown className="w-3.5 h-3.5" style={{ color: "#6c5ce7" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#6c5ce7", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Autopilot</span>
                      </div>
                      <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                        $99<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                      </p>
                      <ul className="flex-1 space-y-1.5 mb-4">
                        {PRO_FEATURES.map(f => (
                          <li key={f} className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#6c5ce7" }} />
                            <span style={{ fontSize: 11.5, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleUpgrade("pro")}
                        disabled={!!loading}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                        style={{ background: "#6c5ce7", border: "none", boxShadow: "0 3px 12px rgba(108,92,231,0.30)" }}
                      >
                        {loading === "pro" ? "…" : "Get Autopilot →"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Autopilot only ── */
                  <>
                    <div
                      className="flex items-center justify-between mb-5"
                      style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(108,92,231,0.06)", border: "1px solid rgba(108,92,231,0.20)" }}
                    >
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#6c5ce7", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)", marginBottom: 3 }}>
                          Autopilot Plan
                        </p>
                        <p className="font-heading" style={{ fontSize: 26, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1 }}>
                          $99<span style={{ fontSize: 13, fontWeight: 400, color: "#6B6B72", letterSpacing: 0 }}>/month</span>
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "rgba(22,163,74,0.10)", padding: "5px 12px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                        Cancel anytime
                      </span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {PRO_FEATURES.map(f => (
                        <li key={f} className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#6c5ce7" }} />
                          <span style={{ fontSize: 13, color: "#0D0D12", fontFamily: "var(--font-inter)", fontWeight: 500 }}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {error && (
                      <p style={{ fontSize: 13, color: "#e17055", background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.18)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", textAlign: "center", marginBottom: 12 }}>
                        {error}
                      </p>
                    )}

                    <button
                      onClick={() => handleUpgrade("pro")}
                      disabled={!!loading}
                      className="w-full flex items-center justify-center gap-2 font-semibold text-white cursor-pointer transition-all disabled:opacity-60 mb-3"
                      style={{ padding: "15px", borderRadius: 100, background: loading ? "#9ca3af" : "#6c5ce7", fontSize: 15, fontFamily: "var(--font-inter)", letterSpacing: "-0.01em", boxShadow: loading ? "none" : "0 4px 20px rgba(108,92,231,0.35)", border: "none" }}
                      onMouseEnter={e => { if (!loading) { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 8px 28px rgba(108,92,231,0.48)"; } }}
                      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(108,92,231,0.35)"; }}
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                        : "Upgrade to Autopilot →"}
                    </button>
                  </>
                )}

                {/* Shared error for the meta two-card layout */}
                {isMeta && error && (
                  <p style={{ fontSize: 13, color: "#e17055", background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.18)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", textAlign: "center", marginTop: 14 }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={onClose}
                  disabled={!!loading}
                  className="w-full text-center cursor-pointer transition-colors mt-3"
                  style={{ fontSize: 13, color: "#9ca3af", background: "none", border: "none", fontFamily: "var(--font-inter)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
