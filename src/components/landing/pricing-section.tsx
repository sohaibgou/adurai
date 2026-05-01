"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";

const FEATURES = [
  "Unlimited CSV uploads",
  "Full campaign audit",
  "7-Day Battle Plan",
  "Profit Leak calculator",
  "AI recommendations",
  "No login required",
];

interface PricingSectionProps {
  onCtaClick: () => void;
}

export default function PricingSection({ onCtaClick }: PricingSectionProps) {
  const [tab, setTab] = useState<"analyze" | "automate">("analyze");

  return (
    <section className="py-24 bg-background relative" id="pricing">
      <div className="max-w-2xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-foreground" style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em" }}>
              Simple pricing
            </h2>
            <p className="mt-3 text-muted text-lg">Start free. Scale when you&apos;re ready.</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="card relative overflow-visible">
            {/* Tab toggle */}
            <div className="flex items-center justify-center pt-8 pb-2 px-6">
              <div
                className="inline-flex p-1 rounded-xl border border-card-border bg-surface/80"
              >
                <button
                  onClick={() => setTab("analyze")}
                  className="relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                  style={{
                    color: tab === "analyze" ? "#ffffff" : "#64748b",
                    background: tab === "analyze" ? "#6c5ce7" : "transparent",
                  }}
                >
                  Analyze
                </button>
                <button
                  onClick={() => setTab("automate")}
                  className="relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                  style={{
                    color: tab === "automate" ? "#ffffff" : "#64748b",
                    background: tab === "automate" ? "#6c5ce7" : "transparent",
                  }}
                >
                  Automate
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="px-8 pb-10 pt-4 min-h-[420px]">
              <AnimatePresence mode="wait">
                {tab === "analyze" ? (
                  <motion.div
                    key="analyze"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="text-center"
                  >
                    {/* Price */}
                    <div className="mt-4 mb-2">
                      <span className="font-heading text-6xl font-bold text-foreground tracking-tight">Free</span>
                      <span className="font-heading text-6xl font-bold text-gradient">.</span>
                      <span className="block font-heading text-2xl font-bold text-muted mt-1">Forever.</span>
                    </div>

                    <p className="text-muted text-base max-w-md mx-auto mt-4 leading-relaxed">
                      No credit card required. No limits. Just upload your CSV and get your full AI analysis instantly.
                    </p>

                    {/* CTA */}
                    <button
                      onClick={onCtaClick}
                      className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-purple text-white font-semibold text-base shadow-lg shadow-purple/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple/30 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                    >
                      Start Analyzing Free
                      <ArrowRight className="w-4 h-4 opacity-70" />
                    </button>

                    {/* Feature list */}
                    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3.5 text-left max-w-md mx-auto">
                      {FEATURES.map((feature) => (
                        <div key={feature} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-foreground font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="automate"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center"
                  >
                    {/* Coming soon card */}
                    <div className="relative mt-4 w-full">
                      {/* Purple glow behind card */}
                      <div
                        className="absolute -inset-4 rounded-3xl blur-2xl pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at center, rgba(108,92,231,0.15) 0%, transparent 70%)" }}
                      />

                      <div
                        className="relative rounded-2xl p-8 text-center border"
                        style={{
                          background: "linear-gradient(135deg, #0f172a, #1e293b)",
                          borderColor: "rgba(108,92,231,0.25)",
                        }}
                      >
                        {/* Lock icon */}
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 backdrop-blur-sm border border-white/10">
                          <Lock className="w-6 h-6 text-purple" style={{ color: "#a78bfa" }} />
                        </div>

                        <h3 className="font-heading text-xl font-bold text-white tracking-tight">
                          Autonomous Media Buying
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "#94a3b8" }}>
                          Adur will monitor your Meta account 24/7, shift budgets automatically, and send you daily briefings — without you touching anything.
                        </p>

                        {/* Email input + button */}
                        <div className="mt-7 flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                          <input
                            type="email"
                            placeholder="you@company.com"
                            className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple/50"
                            style={{
                              background: "rgba(255,255,255,0.07)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                          <button
                            className="px-6 py-3 rounded-xl bg-purple text-white font-semibold text-sm shadow-lg shadow-purple/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple/35 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                          >
                            Join Waitlist
                          </button>
                        </div>

                        <p className="mt-4 text-xs" style={{ color: "#64748b" }}>
                          Be first when we launch. Cancel anytime.
                        </p>

                        {/* Subtle grid pattern */}
                        <div
                          className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.04]"
                          style={{
                            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
