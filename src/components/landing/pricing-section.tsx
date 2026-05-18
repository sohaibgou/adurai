"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Zap, Sparkles, Bot, X, ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";
import CheckoutModal from "@/components/checkout-modal";
import { handleGetStarted } from "@/lib/checkout";

interface PricingSectionProps {
  onCtaClick: () => void;
}

const FREE_FEATURES = [
  "3 analyses per month",
  "3 ad image generations",
  "3 ad copy generations",
  "Campaign performance table",
  "Basic AI recommendations",
  "No login required",
];

const STARTER_FEATURES = [
  "Unlimited analyses",
  "Unlimited ad image generations",
  "Unlimited ad copy generations",
  "Full 7-Day Battle Plan",
  "Profit Leak calculator",
  "PDF report export",
  "Priority support",
];

const PRO_FEATURES = [
  "Everything in Starter",
  "Direct Meta account connection",
  "24/7 campaign monitoring",
  "Auto budget optimization",
  "Daily AI briefings",
  "Creative fatigue alerts",
];

export default function PricingSection({ onCtaClick }: PricingSectionProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  async function onGetStarted() {
    setCheckoutLoading(true);
    try {
      const loggedIn = await handleGetStarted();
      if (!loggedIn) setCheckoutOpen(true); // not authenticated → show signup modal
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitted(true);
  }

  return (
    <section className="py-28 relative" id="pricing" style={{ background: "#FAF8F5" }}>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,60,172,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#FF3CAC", letterSpacing: "0.12em" }}
            >
              Pricing
            </span>
            <h2
              className="font-heading font-bold text-foreground"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
            >
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg" style={{ color: "#6b7280" }}>
              Start free. Upgrade when you&apos;re ready to scale.
            </p>
          </div>
        </FadeIn>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* ── FREE ── */}
          <FadeIn delay={0.05}>
            <motion.div
              whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.10)" }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full rounded-2xl bg-white p-8"
              style={{ border: "1px solid #f0f0f5", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
            >
              <div className="mb-5">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{ background: "#f0f0f5", color: "#6b7280", letterSpacing: "0.08em" }}
                >
                  <Zap className="w-3 h-3" />
                  Get Started
                </span>
              </div>

              <div className="mb-1">
                <span
                  className="font-heading font-bold"
                  style={{ fontSize: "clamp(38px, 5vw, 52px)", letterSpacing: "-0.03em", color: "#0a0a0f", lineHeight: 1 }}
                >
                  Free
                </span>
              </div>
              <p className="text-sm font-medium mb-6" style={{ color: "#6b7280" }}>Forever</p>

              <ul className="flex-1 space-y-3.5 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(0,184,148,0.12)" }}
                    >
                      <Check className="w-3 h-3" style={{ color: "#00b894" }} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onCtaClick}
                className="w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200 hover:bg-gray-50 active:scale-[0.98] cursor-pointer"
                style={{ border: "1.5px solid #e5e7eb", color: "#0a0a0f" }}
              >
                Start Free
              </button>
              <p className="mt-3 text-center text-xs" style={{ color: "#9ca3af" }}>
                No credit card required
              </p>
            </motion.div>
          </FadeIn>

          {/* ── STARTER (highlighted) ── */}
          <FadeIn delay={0.1}>
            <motion.div
              whileHover={{ y: -8, boxShadow: "0 24px 70px rgba(255,60,172,0.22)" }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full rounded-2xl p-8 relative"
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(255,60,172,0.35)",
                boxShadow: "0 8px 40px rgba(255,60,172,0.14)",
                transform: "scale(1.03)",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,60,172,0.06) 0%, transparent 70%)",
                }}
              />

              <div className="mb-5 relative">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(255,60,172,0.1)", color: "#FF3CAC", letterSpacing: "0.08em" }}
                >
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </span>
              </div>

              <div className="mb-1 relative flex items-end gap-2">
                <span
                  className="font-heading font-bold"
                  style={{ fontSize: "clamp(38px, 5vw, 52px)", letterSpacing: "-0.03em", color: "#0a0a0f", lineHeight: 1 }}
                >
                  $19
                </span>
                <span className="text-base font-medium mb-2" style={{ color: "#6b7280" }}>/month</span>
              </div>
              <p className="text-sm leading-relaxed mb-6 relative" style={{ color: "#6b7280" }}>
                For media buyers who want unlimited AI-powered analysis
              </p>

              <ul className="flex-1 space-y-3.5 mb-8 relative">
                {STARTER_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(255,60,172,0.1)" }}
                    >
                      <Check className="w-3 h-3" style={{ color: "#FF3CAC" }} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onGetStarted}
                disabled={checkoutLoading}
                className="relative w-full py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  borderRadius: "8px",
                  background: checkoutLoading ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                  boxShadow: checkoutLoading ? "none" : "0 4px 20px rgba(255,60,172,0.3)",
                }}
              >
                {checkoutLoading ? "Checking…" : "Get Started"}
              </button>
            </motion.div>
          </FadeIn>

          {/* ── PRO (Coming Soon) ── */}
          <FadeIn delay={0.15}>
            <motion.div
              whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.10)" }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full rounded-2xl bg-white p-8 relative overflow-hidden"
              style={{ border: "1px solid #f0f0f5", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
            >
              <div className="mb-5">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{ background: "#fef3cd", color: "#92620a", letterSpacing: "0.08em" }}
                >
                  <Bot className="w-3 h-3" />
                  Coming Soon
                </span>
              </div>

              <div className="mb-1 flex items-end gap-2">
                <span
                  className="font-heading font-bold"
                  style={{ fontSize: "clamp(38px, 5vw, 52px)", letterSpacing: "-0.03em", color: "#0a0a0f", lineHeight: 1 }}
                >
                  $99
                </span>
                <span className="text-base font-medium mb-2" style={{ color: "#6b7280" }}>/month</span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#6b7280" }}>
                Full autonomous media buying — let Adur manage your account
              </p>

              <ul className="flex-1 space-y-3.5 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(0,184,148,0.12)" }}
                    >
                      <Check className="w-3 h-3" style={{ color: "#00b894" }} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setWaitlistOpen(true)}
                className="w-full py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                style={{ background: "#0a0a0f", pointerEvents: "auto", position: "relative", zIndex: 10 }}
              >
                Join Waitlist
              </button>

              {/* Coming soon overlay */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: "rgba(248,248,252,0.45)",
                  backdropFilter: "blur(0.5px)",
                }}
              />

              {/* Lock icon */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ paddingTop: "40%" }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #f0f0f5" }}
                >
                  <Lock className="w-4 h-4" style={{ color: "#FF3CAC" }} />
                </div>
              </div>
            </motion.div>
          </FadeIn>
        </div>

        {/* Footer note */}
        <FadeIn delay={0.2}>
          <p className="mt-12 text-center text-sm" style={{ color: "#9ca3af" }}>
            🔒 All plans include SSL encryption and data privacy. Cancel anytime.
          </p>
        </FadeIn>
      </div>

      {/* Waitlist modal */}
      <AnimatePresence>
        {waitlistOpen && (
          <>
            <motion.div
              key="wl-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(13,13,26,0.55)", backdropFilter: "blur(6px)" }}
              onClick={() => { setWaitlistOpen(false); setWaitlistSubmitted(false); setWaitlistEmail(""); }}
            />
            <motion.div
              key="wl-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            >
              <div
                className="relative w-full pointer-events-auto rounded-2xl overflow-hidden"
                style={{
                  maxWidth: 420,
                  background: "#ffffff",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ height: 4, background: "linear-gradient(90deg, #0D0D12, #FF3CAC)" }} />
                <button
                  onClick={() => { setWaitlistOpen(false); setWaitlistSubmitted(false); setWaitlistEmail(""); }}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors"
                  style={{ color: "#9ca3af", background: "#f9f9fc" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#0d0d1a"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="px-8 py-8">
                  {waitlistSubmitted ? (
                    <div className="text-center py-4">
                      <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                        style={{ background: "rgba(0,184,148,0.10)" }}
                      >
                        <Check className="w-7 h-7" style={{ color: "#00b894" }} />
                      </div>
                      <h3 className="font-heading font-bold mb-2" style={{ fontSize: 22, letterSpacing: "-0.03em", color: "#0d0d1a" }}>
                        {"You're on the list!"}
                      </h3>
                      <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, fontFamily: "var(--font-inter)" }}>
                        {"We'll notify you as soon as Pro launches. Expect early access pricing."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                        style={{ background: "rgba(10,10,15,0.06)" }}
                      >
                        <Bot className="w-6 h-6" style={{ color: "#0a0a0f" }} />
                      </div>
                      <h3 className="font-heading font-bold mb-2" style={{ fontSize: 22, letterSpacing: "-0.03em", color: "#0d0d1a" }}>
                        Join the Pro waitlist
                      </h3>
                      <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: 24 }}>
                        {"Be first to access autonomous media buying when Pro launches. Early members get 40% off."}
                      </p>
                      <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3">
                        <input
                          type="email"
                          required
                          value={waitlistEmail}
                          onChange={e => setWaitlistEmail(e.target.value)}
                          placeholder="you@brand.com"
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={{
                            border: "1.5px solid #e5e7eb",
                            fontFamily: "var(--font-inter)",
                            color: "#0d0d1a",
                          }}
                          onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "#FF3CAC"; }}
                          onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "#e5e7eb"; }}
                        />
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 font-semibold text-white py-3.5 rounded-xl transition-all cursor-pointer"
                          style={{
                            background: "#0a0a0f",
                            fontSize: 14,
                            fontFamily: "var(--font-inter)",
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1a1a2e"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0f"; }}
                        >
                          Reserve My Spot
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
