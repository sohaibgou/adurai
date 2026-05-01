"use client";

import { motion } from "framer-motion";
import { TrendingDown, Target, Wand2 } from "lucide-react";
import FadeIn from "@/components/fade-in";

const FEATURES = [
  {
    icon: TrendingDown,
    accentColor: "#e17055",
    topBorder: "#e17055",
    label: "Loss Detection",
    title: "Profit Leak Detection",
    description:
      "Our AI cross-references your spend, ROAS, and cost-per-result against your AOV and COGS. It finds exactly which campaigns are bleeding money — down to the dollar.",
    bullets: ["ROAS vs break-even analysis", "Campaign-level P&L view", "Hidden cost per result"],
  },
  {
    icon: Target,
    accentColor: "#6c5ce7",
    topBorder: "#6c5ce7",
    label: "Action Plan",
    title: "7-Day Battle Plan",
    description:
      "Stop wondering what to do next. Get a precise, ordered list of actions ranked by revenue impact — built specifically around your goals and account data.",
    bullets: ["Priority-ranked action list", "Tailored to your goals", "7-day execution timeline"],
  },
  {
    icon: Wand2,
    accentColor: "#00cec9",
    topBorder: "#00cec9",
    label: "AI Creative",
    title: "Ad Copy Generator",
    description:
      "Turn your winners into a content engine. Upload a product description and our AI writes high-converting Meta ad copy — headlines, primary text, and CTAs — based on what already works.",
    bullets: ["Platform-native copy", "Trained on winner patterns", "5 copy variants instantly"],
  },
];

export default function FeaturesSection() {
  return (
    <section
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 1,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-18">
            <p className="section-label mb-3">Features</p>
            <h2
              className="font-heading"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#0a0a0f" }}
            >
              Everything you need to{" "}
              <span style={{ color: "#6c5ce7" }}>win on Meta</span>
            </h2>
            <p
              style={{ fontSize: 16, color: "#6b7280", marginTop: 14, maxWidth: 420, margin: "14px auto 0" }}
            >
              From raw data to revenue-driving decisions — in under a minute.
            </p>
          </div>
        </FadeIn>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full flex flex-col p-8 rounded-2xl cursor-default relative overflow-hidden"
                style={{
                  background: "#ffffff",
                  border: "1px solid #f0f0f5",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                  paddingTop: 32,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#e8e8ef";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#f0f0f5";
                }}
              >
                {/* Colored top border */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: f.topBorder,
                    borderRadius: "16px 16px 0 0",
                  }}
                />

                {/* Icon */}
                <div
                  className="flex items-center justify-center mb-6 flex-shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#f8f8fc",
                    border: "1px solid #f0f0f5",
                  }}
                >
                  <f.icon style={{ width: 22, height: 22, color: f.accentColor }} />
                </div>

                {/* Label */}
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: f.accentColor,
                    marginBottom: 8,
                  }}
                >
                  {f.label}
                </p>

                {/* Title */}
                <h3
                  className="font-heading mb-3"
                  style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "#0a0a0f" }}
                >
                  {f.title}
                </h3>

                {/* Description */}
                <p
                  style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, marginBottom: 20, fontFamily: "var(--font-inter)", fontWeight: 400 }}
                >
                  {f.description}
                </p>

                {/* Bullets */}
                <div className="mt-auto space-y-2.5">
                  {f.bullets.map((b) => (
                    <div key={b} className="flex items-center gap-2.5">
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: f.accentColor,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#4b5563", fontWeight: 500 }}>
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
