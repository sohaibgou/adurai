"use client";

import { motion } from "framer-motion";
import { Download, Zap, BarChart3 } from "lucide-react";
import FadeIn from "@/components/fade-in";

const STEPS = [
  {
    number: "01",
    icon: Download,
    title: "Export from Meta Ads Manager",
    description:
      "Go to Meta Ads Manager → Reports → Export. Select any date range. Download your CSV — takes under 30 seconds.",
    accentColor: "#6c5ce7",
  },
  {
    number: "02",
    icon: Zap,
    title: "Upload to Adur.ai — 30 seconds",
    description:
      "Drop your CSV file. Our AI instantly parses every campaign, ad set, and creative. No account connection needed.",
    accentColor: "#00cec9",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Get your complete AI analysis",
    description:
      "Receive a full performance audit, campaign health score, scale / cut list, and a 7-day priority action plan.",
    accentColor: "#00b894",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: "#f8f8fc" }}
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-20">
            <p className="section-label mb-3">Process</p>
            <h2
              className="font-heading"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#0a0a0f" }}
            >
              Three steps. Sixty seconds.{" "}
              <span style={{ color: "#6c5ce7" }}>Full clarity.</span>
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280", marginTop: 14, maxWidth: 400, margin: "14px auto 0" }}>
              No technical setup. No integrations. Just your CSV and our AI.
            </p>
          </div>
        </FadeIn>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {STEPS.map((step, i) => (
            <FadeIn key={step.number} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative flex flex-col cursor-default"
              >
                {/* Big background number */}
                <div
                  className="font-heading font-bold select-none pointer-events-none"
                  style={{
                    fontSize: 120,
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    color: "#f0f0f0",
                    lineHeight: 1,
                    marginBottom: -40,
                    position: "relative",
                    zIndex: 0,
                  }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className="relative z-10 flex items-center justify-center mb-6"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: "#ffffff",
                    border: "1px solid #f0f0f5",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <step.icon style={{ width: 24, height: 24, color: step.accentColor }} />
                </div>

                {/* Text */}
                <h3
                  className="relative z-10 mb-3"
                  style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: "#0a0a0f", fontFamily: "var(--font-inter)" }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "#6b7280",
                    lineHeight: 1.6,
                    maxWidth: 300,
                    fontFamily: "var(--font-inter)",
                    fontWeight: 400,
                  }}
                >
                  {step.description}
                </p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
