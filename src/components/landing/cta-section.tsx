"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";

interface CtaSectionProps {
  onCtaClick: () => void;
}

export default function CtaSection({ onCtaClick }: CtaSectionProps) {
  return (
    <section
      className="relative py-32 px-6 overflow-hidden"
      style={{ background: "#070709" }}
    >
      {/* Orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "20%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,92,231,0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          right: "10%",
          transform: "translateY(-50%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,206,201,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeIn>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#00cec9",
              marginBottom: 20,
              fontFamily: "var(--font-inter)",
            }}
          >
            Get Started Free
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              lineHeight: 1.06,
            }}
          >
            Stop guessing.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #6c5ce7, #00cec9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Start winning.
            </span>
          </h2>

          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.45)",
              marginTop: 20,
              maxWidth: 440,
              margin: "20px auto 0",
              lineHeight: 1.65,
              fontFamily: "var(--font-inter)",
            }}
          >
            Upload your CSV. Get your full AI analysis. Know exactly what to
            scale, what to cut, and what to do next — free, forever.
          </p>
        </FadeIn>

        <FadeIn delay={0.14}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={onCtaClick}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 font-semibold text-white cursor-pointer"
              style={{
                padding: "16px 34px",
                borderRadius: 100,
                background: "#6c5ce7",
                fontSize: 15,
                boxShadow: "0 4px 24px rgba(108,92,231,0.40)",
              }}
            >
              Analyze My Ads Free
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
              No credit card · No login · 60 seconds
            </p>
          </div>
        </FadeIn>

        {/* Stats row */}
        <FadeIn delay={0.22}>
          <div
            className="flex flex-wrap items-center justify-center gap-10 mt-16"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32 }}
          >
            {[
              { val: "500+", label: "Media buyers" },
              { val: "Free", label: "Forever" },
              { val: "60s", label: "Time to insight" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p
                  className="font-heading font-bold"
                  style={{ fontSize: 28, letterSpacing: "-0.03em", color: "#ffffff" }}
                >
                  {s.val}
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
