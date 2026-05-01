"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";

const ROTATING_WORDS = ["Analyzed.", "Optimized.", "Scaled.", "Automated."];

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Top gradient accent line */}
      <div
        className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
        style={{
          height: 2,
          background: "linear-gradient(90deg, #6c5ce7 0%, #00cec9 100%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-24">

        {/* Badge */}
        <FadeIn delay={0}>
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-12 cursor-default"
            style={{
              background: "#f8f8fc",
              border: "1px solid #f0f0f5",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00b894",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#6b7280",
                letterSpacing: "0.01em",
                fontFamily: "var(--font-inter)",
              }}
            >
              AI-Powered Media Buying
            </span>
          </div>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.06}>
          <h1
            className="font-heading"
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#0a0a0f",
              marginBottom: 0,
            }}
          >
            Your Meta Ads.
          </h1>
        </FadeIn>

        {/* Rotating word */}
        <FadeIn delay={0.1}>
          <div
            className="font-heading"
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              minHeight: "1.12em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ y: 48, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -48, opacity: 0, filter: "blur(8px)" }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 26,
                  opacity: { duration: 0.16 },
                  filter: { duration: 0.2 },
                }}
                style={{ color: "#6c5ce7", display: "inline-block" }}
              >
                {ROTATING_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </FadeIn>

        {/* Subheadline */}
        <FadeIn delay={0.18}>
          <p
            className="mx-auto mt-8"
            style={{
              fontSize: 16,
              color: "#6b7280",
              lineHeight: 1.6,
              maxWidth: 480,
              fontFamily: "var(--font-inter)",
              fontWeight: 400,
            }}
          >
            Upload your Meta Ads CSV and get a complete AI media buyer
            analysis in 60 seconds. No agency. No login. No guesswork.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.26}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2.5 text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                padding: "14px 28px",
                borderRadius: 8,
                background: "#0a0a0f",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "var(--font-inter)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1a1a24";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0f";
              }}
            >
              Upload your CSV
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{
                padding: "14px 28px",
                borderRadius: 8,
                background: "#ffffff",
                border: "1px solid #e8e8ef",
                fontSize: 14,
                color: "#6b7280",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#c4bef0";
                (e.currentTarget as HTMLButtonElement).style.color = "#0a0a0f";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e8e8ef";
                (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
              }}
            >
              See how it works
            </button>
          </div>
        </FadeIn>

        {/* Trust line */}
        <FadeIn delay={0.34}>
          <div className="flex flex-wrap items-center justify-center gap-8 mt-10">
            {["No login required", "AI-powered insights", "Data stays private"].map((text) => (
              <span
                key={text}
                className="flex items-center gap-2"
                style={{ fontSize: 13, color: "#9ca3af", fontFamily: "var(--font-inter)" }}
              >
                <span
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "#00b894", display: "inline-block", flexShrink: 0 }}
                />
                {text}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
