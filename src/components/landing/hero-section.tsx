"use client";

import { Play, Users, ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";

interface HeroSectionProps {
  onCtaClick: () => void;
}

/* ─── Metric sidebar data ─── */
const METRICS = [
  { name: "Total spend",    val: "$4,820",   type: "neutral" },
  { name: "Avg. ROAS",      val: "3.2×",     type: "good"    },
  { name: "CPP",            val: "$38.40",   type: "bad"     },
  { name: "Wasted budget",  val: "$1,140",   type: "bad"     },
  { name: "Active ad sets", val: "14",       type: "neutral" },
  { name: "Health score",   val: "62 / 100", type: "amber"   },
] as const;

/* ─── Diagnosis cards data ─── */
const DIAGNOSIS = [
  {
    dot:   "#DC2626",
    title: `Ad Set "Lookalike 2% — Cold" is bleeding budget`,
    body:  "$640 spent in 7 days. 0 purchases. CPM is 3× account average. Audience likely saturated or wrong creative match.",
    tag:   "→ Pause immediately",
    tagBg: "#FEE2E2",
    tagColor: "#991B1B",
  },
  {
    dot:   "#16A34A",
    title: `"Retargeting — Viewers 7d" has room to scale`,
    body:  "ROAS 5.8× on $320 spend. Frequency still low at 1.4. Budget is too conservative for this performance level.",
    tag:   "→ Scale budget 2×",
    tagBg: "#DCFCE7",
    tagColor: "#14532D",
  },
  {
    dot:   "#D97706",
    title: "Creative fatigue detected across 3 ad sets",
    body:  "CTR dropped 40% week-over-week. Same creative running for 18 days. Introduce new angles to reset performance.",
    tag:   "→ Refresh creatives",
    tagBg: "#FEF3C7",
    tagColor: "#78350F",
  },
] as const;

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section style={{ background: "#F7F5F2" }}>

      {/* ── Hero copy ── */}
      <div
        className="flex flex-col items-center text-center mx-auto px-6"
        style={{ maxWidth: 900, paddingTop: 80, paddingBottom: 60 }}
      >

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
              marginBottom:  24,
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
            style={{
              fontSize:    18,
              fontWeight:  400,
              lineHeight:  1.65,
              color:       "#6B6B72",
              maxWidth:    540,
              marginBottom: 40,
              fontFamily:  "var(--font-inter)",
            }}
          >
            Upload your Meta Ads CSV and get a complete diagnosis in 60 seconds —
            what to kill, what to scale, and exactly why. No agency. No guesswork.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.25}>
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ marginBottom: 16 }}
          >
            {/* Primary */}
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer"
              style={{
                padding:       "16px 36px",
                borderRadius:   12,
                background:    "linear-gradient(135deg, #7C3AED, #C026D3)",
                fontSize:       16,
                letterSpacing: "-0.01em",
                fontFamily:    "var(--font-inter)",
                boxShadow:     "0 4px 20px rgba(124,58,237,0.3)",
                border:        "none",
                transition:    "opacity 0.15s, transform 0.15s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity   = "0.92";
                b.style.transform = "translateY(-2px)";
                b.style.boxShadow = "0 8px 28px rgba(124,58,237,0.35)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity   = "1";
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "0 4px 20px rgba(124,58,237,0.3)";
              }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary */}
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 font-medium cursor-pointer"
              style={{
                padding:       "16px 32px",
                borderRadius:   12,
                background:    "#ffffff",
                border:        "1.5px solid #E2E0DA",
                fontSize:       16,
                letterSpacing: "-0.01em",
                color:         "#0D0D12",
                fontFamily:    "var(--font-inter)",
                transition:    "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "#B0ADAA";
                b.style.boxShadow   = "0 2px 8px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "#E2E0DA";
                b.style.boxShadow   = "none";
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
              fontSize:    13,
              color:       "#A8A5A0",
              marginBottom: 48,
              fontFamily:  "var(--font-inter)",
            }}
          >
            No credit card required · Free analysis on your first account
          </p>
        </FadeIn>

        {/* Proof pill */}
        <FadeIn delay={0.35}>
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
            <Users
              className="flex-shrink-0"
              style={{ width: 18, height: 18, opacity: 0.6 }}
            />
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
                &nbsp;$10M+&nbsp;
              </strong>
              {" "}in Arab market ad spend
            </span>
          </div>
        </FadeIn>
      </div>

      {/* ── Product preview / screen mockup ── */}
      <FadeIn delay={0.45}>
        <div
          style={{
            padding:   "0 24px 80px",
            maxWidth:   1000,
            margin:    "0 auto",
          }}
        >
          {/* Screen frame */}
          <div
            style={{
              background:  "#FFFFFF",
              border:      "1px solid #E8E5E0",
              borderRadius: 20,
              padding:      2,
              boxShadow:   "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              overflow:    "hidden",
            }}
          >
            {/* Browser chrome bar */}
            <div
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          6,
                padding:      "12px 16px",
                borderBottom: "1px solid #F0EDE8",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C940" }} />
            </div>

            {/* Screen body: sidebar + main */}
            <div
              style={{
                padding:             24,
                display:             "grid",
                gridTemplateColumns: "240px 1fr",
                gap:                 16,
                minHeight:           320,
              }}
            >
              {/* ── Sidebar ── */}
              <div
                style={{
                  background:   "#F7F5F2",
                  borderRadius:  12,
                  padding:       16,
                }}
              >
                <p
                  style={{
                    fontSize:       10,
                    fontWeight:     600,
                    letterSpacing:  "0.1em",
                    textTransform:  "uppercase",
                    color:          "#A8A5A0",
                    marginBottom:   12,
                    fontFamily:     "var(--font-inter)",
                  }}
                >
                  Account overview
                </p>

                {METRICS.map(({ name, val, type }, i) => (
                  <div
                    key={name}
                    style={{
                      display:        "flex",
                      justifyContent: "space-between",
                      alignItems:     "center",
                      padding:        "9px 0",
                      borderBottom:   i < METRICS.length - 1 ? "1px solid #EDE9E3" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize:   13,
                        color:      "#6B6B72",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        fontSize:   13,
                        fontWeight: 600,
                        fontFamily: "var(--font-inter)",
                        color:
                          type === "good"    ? "#16A34A" :
                          type === "bad"     ? "#DC2626" :
                          type === "amber"   ? "#D97706" :
                          "#0D0D12",
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Diagnosis cards ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {DIAGNOSIS.map(({ dot, title, body, tag, tagBg, tagColor }) => (
                  <div
                    key={title}
                    style={{
                      background:   "#F7F5F2",
                      borderRadius:  12,
                      padding:      "16px 20px",
                      display:      "flex",
                      alignItems:   "flex-start",
                      gap:          12,
                    }}
                  >
                    {/* Status dot */}
                    <div
                      style={{
                        width:       8,
                        height:      8,
                        borderRadius: "50%",
                        background:  dot,
                        marginTop:   5,
                        flexShrink:  0,
                      }}
                    />

                    <div>
                      <p
                        style={{
                          fontSize:    13,
                          fontWeight:  600,
                          marginBottom: 4,
                          color:       "#0D0D12",
                          fontFamily:  "var(--font-inter)",
                        }}
                      >
                        {title}
                      </p>
                      <p
                        style={{
                          fontSize:   12,
                          color:      "#6B6B72",
                          lineHeight:  1.5,
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {body}
                      </p>
                      <span
                        style={{
                          display:      "inline-block",
                          marginTop:    8,
                          fontSize:     11,
                          fontWeight:   600,
                          padding:      "3px 10px",
                          borderRadius:  6,
                          background:   tagBg,
                          color:        tagColor,
                          fontFamily:   "var(--font-inter)",
                        }}
                      >
                        {tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

    </section>
  );
}
