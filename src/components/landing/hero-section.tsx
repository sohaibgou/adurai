"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
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
      style={{
        background: "linear-gradient(160deg, #fafafa 0%, #f5f0ff 60%, #faf5ff 100%)",
      }}
    >
      {/* Radial glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", top: "20%", left: "15%", width: 500, height: 500,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(108,92,231,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "10%", width: 400, height: 400,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(224,64,251,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-36 pb-24">

        {/* Badge */}
        <FadeIn delay={0}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 cursor-default"
            style={{ background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.18)" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00b894", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#6c5ce7", letterSpacing: "0.01em", fontFamily: "var(--font-inter)" }}>
              AI-Powered Media Buying
            </span>
          </div>
        </FadeIn>

        {/* Headline line 1 */}
        <FadeIn delay={0.06}>
          <h1
            className="font-heading"
            style={{ fontSize: "clamp(56px, 8vw, 88px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.03em", color: "#0d0d1a" }}
          >
            Your Meta Ads.
          </h1>
        </FadeIn>

        {/* Rotating word — gradient italic */}
        <FadeIn delay={0.1}>
          <div
            className="font-heading"
            style={{ fontSize: "clamp(56px, 8vw, 88px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", minHeight: "1.1em", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ y: 48, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -48, opacity: 0, filter: "blur(8px)" }}
                transition={{ type: "spring", stiffness: 280, damping: 26, opacity: { duration: 0.16 }, filter: { duration: 0.2 } }}
                style={{
                  display: "inline-block",
                  fontStyle: "italic",
                  background: "linear-gradient(135deg, #6c5ce7 0%, #e040fb 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {ROTATING_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </FadeIn>

        {/* Subheadline */}
        <FadeIn delay={0.18}>
          <p className="mx-auto mt-8" style={{ fontSize: 18, color: "#4b5563", lineHeight: 1.65, maxWidth: 500, fontFamily: "var(--font-inter)", fontWeight: 400 }}>
            Upload your Meta Ads CSV and get a complete AI media buyer analysis in 60 seconds. No agency. No login. No guesswork.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.26}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                padding: "15px 32px",
                borderRadius: 100,
                background: "linear-gradient(135deg, #6c5ce7 0%, #e040fb 100%)",
                fontSize: 15,
                boxShadow: "0 6px 30px rgba(108,92,231,0.38)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 36px rgba(108,92,231,0.52)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 30px rgba(108,92,231,0.38)"; }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ padding: "15px 32px", borderRadius: 100, background: "#ffffff", border: "1.5px solid #e5e7eb", fontSize: 15, color: "#0d0d1a" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#c4bef0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; }}
            >
              See how it works
            </button>
          </div>
        </FadeIn>

        {/* Social proof pill */}
        <FadeIn delay={0.34}>
          <div className="flex justify-center mt-8">
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full cursor-default"
              style={{ background: "#0d0d1a", color: "#ffffff" }}
            >
              <Users className="w-4 h-4 flex-shrink-0" style={{ color: "#e040fb" }} />
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-inter)" }}>
                Built by media buyers who&apos;ve managed{" "}
                <span style={{ color: "#e040fb", fontWeight: 700 }}>$70M+</span>
                {" "}in ad spend
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
