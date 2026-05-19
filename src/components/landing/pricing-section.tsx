"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Sparkles, Bot, X, ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";
import CheckoutModal from "@/components/checkout-modal";
import { handleGetStarted } from "@/lib/checkout";

interface PricingSectionProps {
  onCtaClick: () => void;
}

// ── Feature lists ─────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  "3 analyses per month",
  "3 ad image generations",
  "3 ad copy generations",
  "Campaign performance table",
  "Basic AI recommendations",
  "No login required",
  "❌ Meta account connection",
];

const STARTER_FEATURES = [
  "Unlimited analyses",
  "Unlimited ad image generations",
  "Unlimited ad copy generations",
  "Full 7-Day Battle Plan",
  "Profit Leak calculator",
  "PDF report export",
  "Priority support",
  "❌ Meta account connection",
  "❌ AI Manager & Autopilot",
  "❌ 24/7 monitoring",
];

const PRO_FEATURES = [
  "Everything in Starter",
  "Connect Meta Ad Account",
  "AI Manager & Autopilot",
  "24/7 campaign monitoring",
  "Auto budget optimization",
  "Daily AI briefings",
  "Approve / reject AI actions",
  "Creative fatigue alerts",
  "Priority support",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PricingSection({ onCtaClick }: PricingSectionProps) {
  const [starterCheckoutOpen, setStarterCheckoutOpen] = useState(false);
  const [proCheckoutOpen,     setProCheckoutOpen]     = useState(false);
  const [starterLoading,      setStarterLoading]      = useState(false);
  const [proLoading,          setProLoading]          = useState(false);

  async function onGetStarter() {
    setStarterLoading(true);
    try {
      const loggedIn = await handleGetStarted("starter");
      if (!loggedIn) setStarterCheckoutOpen(true);
    } finally {
      setStarterLoading(false);
    }
  }

  async function onGetPro() {
    setProLoading(true);
    try {
      const loggedIn = await handleGetStarted("pro");
      if (!loggedIn) setProCheckoutOpen(true);
    } finally {
      setProLoading(false);
    }
  }

  return (
    <section className="py-28 relative" id="pricing" style={{ background: "#FAF8F5" }}>
      <CheckoutModal open={starterCheckoutOpen} onClose={() => setStarterCheckoutOpen(false)} plan="starter" />
      <CheckoutModal open={proCheckoutOpen}     onClose={() => setProCheckoutOpen(false)}     plan="pro"     />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(108,92,231,0.05) 0%, transparent 70%)" }}
      />

      <div className="max-w-6xl mx-auto px-6 relative">

        {/* ── Header ── */}
        <FadeIn>
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#6c5ce7", letterSpacing: "0.12em" }}
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

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* ════════════ FREE ════════════ */}
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
                {FREE_FEATURES.map((f) => {
                  const isNeg = f.startsWith("❌");
                  const label = isNeg ? f.slice(2).trim() : f;
                  return (
                    <li key={f} className="flex items-start gap-3">
                      {isNeg ? (
                        <span className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full" style={{ background: "rgba(156,163,175,0.12)" }}>
                          <X className="w-2.5 h-2.5" style={{ color: "#9ca3af" }} strokeWidth={3} />
                        </span>
                      ) : (
                        <div className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(0,184,148,0.12)" }}>
                          <Check className="w-3 h-3" style={{ color: "#00b894" }} strokeWidth={3} />
                        </div>
                      )}
                      <span className="text-sm font-medium" style={{ color: isNeg ? "#9ca3af" : "#374151" }}>{label}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Upgrade prompt */}
              <p className="text-xs mb-4 text-center" style={{ color: "#6c5ce7", fontWeight: 600 }}>
                Connect your Meta account — upgrade to Pro
              </p>

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

          {/* ════════════ STARTER ════════════ */}
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
                style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,60,172,0.06) 0%, transparent 70%)" }}
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
                {STARTER_FEATURES.map((f) => {
                  const isNeg = f.startsWith("❌");
                  const label = isNeg ? f.slice(2).trim() : f;
                  return (
                    <li key={f} className="flex items-start gap-3">
                      {isNeg ? (
                        <span className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full" style={{ background: "rgba(156,163,175,0.12)" }}>
                          <X className="w-2.5 h-2.5" style={{ color: "#9ca3af" }} strokeWidth={3} />
                        </span>
                      ) : (
                        <div className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,60,172,0.1)" }}>
                          <Check className="w-3 h-3" style={{ color: "#FF3CAC" }} strokeWidth={3} />
                        </div>
                      )}
                      <span className="text-sm font-medium" style={{ color: isNeg ? "#9ca3af" : "#374151" }}>{label}</span>
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={onGetStarter}
                disabled={starterLoading}
                className="relative w-full py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  borderRadius: "8px",
                  background: starterLoading ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                  boxShadow: starterLoading ? "none" : "0 4px 20px rgba(255,60,172,0.3)",
                }}
              >
                {starterLoading ? "Checking…" : "Get Started"}
              </button>
            </motion.div>
          </FadeIn>

          {/* ════════════ PRO — MOST POWERFUL ════════════ */}
          <FadeIn delay={0.15}>
            <motion.div
              whileHover={{ y: -8, boxShadow: "0 24px 70px rgba(108,92,231,0.22)" }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full rounded-2xl p-8 relative"
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(108,92,231,0.35)",
                boxShadow: "0 8px 40px rgba(108,92,231,0.12)",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(108,92,231,0.06) 0%, transparent 70%)" }}
              />

              <div className="mb-5 relative">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(108,92,231,0.10)", color: "#6c5ce7", letterSpacing: "0.08em" }}
                >
                  <Bot className="w-3 h-3" />
                  Most Powerful
                </span>
              </div>

              <div className="mb-1 relative flex items-end gap-2">
                <span
                  className="font-heading font-bold"
                  style={{ fontSize: "clamp(38px, 5vw, 52px)", letterSpacing: "-0.03em", color: "#0a0a0f", lineHeight: 1 }}
                >
                  $99
                </span>
                <span className="text-base font-medium mb-2" style={{ color: "#6b7280" }}>/month</span>
              </div>
              <p className="text-sm leading-relaxed mb-6 relative" style={{ color: "#6b7280" }}>
                Full autonomous media buying — let Adur manage your account
              </p>

              <ul className="flex-1 space-y-3.5 mb-8 relative">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(108,92,231,0.12)" }}
                    >
                      <Check className="w-3 h-3" style={{ color: "#6c5ce7" }} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onGetPro}
                disabled={proLoading}
                className="relative w-full py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  borderRadius: "8px",
                  background: proLoading ? "#9ca3af" : "#6c5ce7",
                  boxShadow: proLoading ? "none" : "0 4px 20px rgba(108,92,231,0.32)",
                }}
              >
                {proLoading ? "Checking…" : <>Get Pro <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
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
    </section>
  );
}
