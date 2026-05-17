"use client";

import { Play, Users, ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#F7F5F2" }}
    >
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-32 pb-24">

        {/* Headline */}
        <FadeIn delay={0.05}>
          <h1
            className="font-heading"
            style={{
              fontSize:      "clamp(48px, 7vw, 80px)",
              fontWeight:     900,
              lineHeight:     1.03,
              letterSpacing: "-0.04em",
              color:         "#0D0D12",
            }}
          >
            The AI Media Buyer
            <br />
            for Meta Ads.
          </h1>
        </FadeIn>

        {/* Subhead */}
        <FadeIn delay={0.15}>
          <p
            className="mx-auto mt-6"
            style={{
              fontSize:    18,
              color:       "#6B6B72",
              lineHeight:  1.65,
              maxWidth:    540,
              fontFamily:  "var(--font-inter)",
              fontWeight:  400,
            }}
          >
            Upload your Meta Ads CSV and get a complete diagnosis in 60 seconds — what to kill, what to scale, and exactly why. No agency. No guesswork.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.25}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            {/* Primary */}
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer transition-all duration-200"
              style={{
                padding:       "16px 36px",
                borderRadius:   12,
                background:    "linear-gradient(135deg, #7C3AED, #C026D3)",
                fontSize:       16,
                letterSpacing: "-0.01em",
                fontFamily:    "var(--font-inter)",
                boxShadow:     "0 4px 20px rgba(124,58,237,0.3)",
                border:        "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(124,58,237,0.38)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(124,58,237,0.3)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary */}
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 font-medium cursor-pointer transition-all duration-150"
              style={{
                padding:       "16px 32px",
                borderRadius:   12,
                background:    "#ffffff",
                border:        "1.5px solid #E2E0DA",
                fontSize:       16,
                letterSpacing: "-0.01em",
                color:         "#0D0D12",
                fontFamily:    "var(--font-inter)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#B0ADAA";
                (e.currentTarget as HTMLButtonElement).style.boxShadow   = "0 2px 8px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E0DA";
                (e.currentTarget as HTMLButtonElement).style.boxShadow   = "none";
              }}
            >
              <Play className="w-4 h-4" fill="currentColor" />
              See how it works
            </button>
          </div>
        </FadeIn>

        {/* Trust text */}
        <FadeIn delay={0.30}>
          <p
            style={{
              fontSize:   13,
              color:      "#A8A5A0",
              marginTop:  16,
              fontFamily: "var(--font-inter)",
            }}
          >
            No credit card required · Free analysis on your first account
          </p>
        </FadeIn>

        {/* Proof pill */}
        <FadeIn delay={0.35}>
          <div className="flex justify-center mt-10">
            <div
              className="inline-flex items-center gap-2.5 cursor-default"
              style={{
                background:   "#0D0D12",
                color:        "#ffffff",
                borderRadius:  100,
                padding:      "11px 22px",
                fontSize:      13,
                fontWeight:    400,
                fontFamily:   "var(--font-inter)",
              }}
            >
              <Users className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} />
              <span>
                Built by media buyers who&apos;ve managed{" "}
                <strong
                  style={{
                    fontWeight:           600,
                    background:           "linear-gradient(90deg, #A78BFA, #E879F9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor:  "transparent",
                    backgroundClip:       "text",
                  }}
                >
                  $70M+
                </strong>{" "}
                in ad spend
              </span>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
