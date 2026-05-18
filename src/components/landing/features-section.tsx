"use client";

import { motion } from "framer-motion";
import { TrendingDown, Target, Wand2, Check } from "lucide-react";
import FadeIn from "@/components/fade-in";

const FEATURES = [
  {
    icon: TrendingDown,
    accentColor: "#e17055",
    label: "Loss Detection",
    title: "Profit Leak Detection",
    description: "Our AI cross-references your spend, ROAS, and cost-per-result against your AOV and COGS. It finds exactly which campaigns are bleeding money — down to the dollar.",
    bullets: ["ROAS vs break-even analysis", "Campaign-level P&L view", "Hidden cost per result"],
    mockup: (
      <div style={{ background: "#fff7f5", borderRadius: 16, padding: 20, border: "1px solid rgba(225,112,85,0.12)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#e17055", marginBottom: 12 }}>PROFIT LEAK ANALYSIS</p>
        {[{ label: "Summer Sale", val: 3.9, color: "#00b894", w: "78%" }, { label: "Retargeting", val: 2.1, color: "#fdcb6e", w: "42%" }, { label: "BOF Cold", val: 0.8, color: "#e17055", w: "16%" }].map(r => (
          <div key={r.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#374151", fontFamily: "var(--font-inter)" }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.val}x</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#f0f0f5" }}>
              <div style={{ width: r.w, height: "100%", borderRadius: 3, background: r.color }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(225,112,85,0.08)", borderRadius: 8, border: "1px solid rgba(225,112,85,0.15)" }}>
          <p style={{ fontSize: 12, color: "#e17055", fontWeight: 600, fontFamily: "var(--font-inter)" }}>⚠ BOF Cold losing $340/day after COGS</p>
        </div>
      </div>
    ),
  },
  {
    icon: Target,
    accentColor: "#FF3CAC",
    label: "Action Plan",
    title: "7-Day Battle Plan",
    description: "Stop wondering what to do next. Get a precise, ordered list of actions ranked by revenue impact — built specifically around your goals and account data.",
    bullets: ["Priority-ranked action list", "Tailored to your goals", "7-day execution timeline"],
    mockup: (
      <div style={{ background: "#FAF8F5", borderRadius: 16, padding: 20, border: "1px solid rgba(255,60,172,0.12)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#FF3CAC", marginBottom: 12 }}>7-DAY BATTLE PLAN</p>
        {[
          { day: "Day 1", action: "Pause BOF Cold campaign immediately", priority: "HIGH", color: "#e17055" },
          { day: "Day 2", action: "Scale Summer Sale budget +40%", priority: "HIGH", color: "#e17055" },
          { day: "Day 3-4", action: "Test new TOF creatives (3 variants)", priority: "MED", color: "#fdcb6e" },
          { day: "Day 5-7", action: "Launch lookalike from top buyers", priority: "MED", color: "#fdcb6e" },
        ].map(item => (
          <div key={item.day} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: item.color, background: `${item.color}15`, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0, fontFamily: "var(--font-inter)" }}>{item.priority}</span>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", display: "block", fontFamily: "var(--font-inter)" }}>{item.day}</span>
              <span style={{ fontSize: 12, color: "#374151", fontFamily: "var(--font-inter)" }}>{item.action}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Wand2,
    accentColor: "#FF6B35",
    label: "AI Creative",
    title: "Ad Copy Generator",
    description: "Turn your winners into a content engine. Our AI writes high-converting Meta ad copy — headlines, primary text, and CTAs — based on what already works in your account.",
    bullets: ["Platform-native copy", "Trained on winner patterns", "5 copy variants instantly"],
    mockup: (
      <div style={{ background: "#FAF8F5", borderRadius: 16, padding: 20, border: "1px solid rgba(255,107,53,0.12)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#FF6B35", marginBottom: 12 }}>AI COPY GENERATOR</p>
        {[
          { label: "Headline", copy: "Stop wasting money on Meta ads →" },
          { label: "Primary", copy: "Your ROAS data tells a story. We read it for you in 60 seconds..." },
          { label: "CTA", copy: "Analyze My Campaigns Free" },
        ].map(item => (
          <div key={item.label} style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-inter)" }}>{item.label}</span>
            <div style={{ marginTop: 4, padding: "8px 10px", background: "#ffffff", borderRadius: 8, border: "1px solid #f0f0f5" }}>
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5, fontFamily: "var(--font-inter)" }}>{item.copy}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative py-28 px-6 overflow-hidden" style={{ background: "#FAF8F5" }}>
      <div className="relative z-10 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.18)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FF3CAC" }}>Execution Layer</span>
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.05 }}>
              One-Click Meta{" "}
              <span style={{ fontStyle: "italic", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Auto-Implementation.
              </span>
            </h2>
            <p style={{ fontSize: 17, color: "#6b7280", marginTop: 16, maxWidth: 480, margin: "16px auto 0", fontFamily: "var(--font-inter)" }}>
              Tired of finding issues but having to manually fix them in Meta&apos;s slow dashboard? Our AI finds the wins, and we do the heavy lifting.
            </p>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-24">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.title} delay={0.06}>
              <div className={`flex flex-col lg:flex-row items-center gap-16 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                {/* Text */}
                <div className="flex-1">
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: feature.accentColor, marginBottom: 16, fontFamily: "var(--font-inter)" }}>
                    {feature.label}
                  </p>
                  <h3 className="font-heading" style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, letterSpacing: "-0.02em", color: "#0d0d1a", lineHeight: 1.1, marginBottom: 16 }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, fontFamily: "var(--font-inter)", marginBottom: 24 }}>
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.bullets.map(b => (
                      <li key={b} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${feature.accentColor}18` }}>
                          <Check style={{ width: 11, height: 11, color: feature.accentColor }} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "#374151", fontFamily: "var(--font-inter)" }}>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mockup */}
                <motion.div
                  whileHover={{ y: -6, boxShadow: "0 24px 64px rgba(0,0,0,0.10)" }}
                  transition={{ duration: 0.22 }}
                  className="flex-1 w-full rounded-2xl p-6"
                  style={{ background: "#ffffff", border: "1px solid #E8E5E0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                >
                  {feature.mockup}
                </motion.div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
