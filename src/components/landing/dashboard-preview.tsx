"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign, ShoppingCart, MousePointerClick, ArrowUpRight, Lightbulb } from "lucide-react";
import FadeIn from "@/components/fade-in";

const METRICS = [
  { label: "Total Spend", value: "$12.4k", color: "#6c5ce7", change: "+12%" },
  { label: "Best ROAS", value: "4.2x", color: "#00b894", change: "+0.8x" },
  { label: "Conversions", value: "284", color: "#00cec9", change: "+34" },
  { label: "Cost / Result", value: "$8.40", color: "#fdcb6e", change: "-$1.20" },
];

const BARS = [
  { height: 72, label: "Summer Sale" },
  { height: 45, label: "Retargeting" },
  { height: 88, label: "Lookalike" },
  { height: 30, label: "TOF Broad" },
  { height: 65, label: "DPA" },
  { height: 52, label: "Interests" },
];

const RECS = [
  { type: "scale", text: "Scale Lookalike Audience — 5.1x ROAS, $2.1k headroom", color: "#00b894", bg: "rgba(0,184,148,0.08)", border: "rgba(0,184,148,0.2)" },
  { type: "cut", text: "Pause TOF Broad — 1.2x ROAS, losing $340 after COGS", color: "#e17055", bg: "rgba(225,112,85,0.08)", border: "rgba(225,112,85,0.2)" },
];

export default function DashboardPreview() {
  return (
    <section
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-16">
            <p className="section-label mb-3">Product Preview</p>
            <h2
              className="font-heading"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#0a0a0f" }}
            >
              Your complete campaign intelligence
            </h2>
            <p
              className="mt-4 mx-auto"
              style={{ fontSize: 17, color: "#6b7280", maxWidth: 460, lineHeight: 1.65 }}
            >
              From raw CSV to full AI analysis — every number, every insight, every action.
            </p>
          </div>
        </FadeIn>

        {/* Dashboard mockup card */}
        <FadeIn delay={0.1}>
          <div
            className="mx-auto"
            style={{
              maxWidth: 920,
              transform: "perspective(1000px) rotateX(3deg)",
              transformOrigin: "center top",
            }}
          >
            <div
              style={{
                background: "#0f0f13",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 25px 50px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Browser chrome */}
              <div
                style={{
                  background: "#16161c",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  padding: "12px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#e17055", opacity: 0.9 }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fdcb6e", opacity: 0.9 }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#00b894", opacity: 0.9 }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    maxWidth: 280,
                    margin: "0 auto",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 6,
                    padding: "4px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b894", opacity: 0.8 }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-inter)" }}>
                    app.adur.ai/dashboard
                  </span>
                </div>
              </div>

              {/* App top bar */}
              <div
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  className="font-heading font-bold"
                  style={{ fontSize: 15, color: "#ffffff", letterSpacing: "-0.02em" }}
                >
                  adur<span style={{ color: "#6c5ce7" }}>.ai</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      background: "rgba(0,184,148,0.15)",
                      color: "#00b894",
                      border: "1px solid rgba(0,184,148,0.25)",
                      borderRadius: 9999,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    6 campaigns
                  </span>
                  <span
                    style={{
                      background: "rgba(108,92,231,0.15)",
                      color: "#9d8ff5",
                      border: "1px solid rgba(108,92,231,0.25)",
                      borderRadius: 9999,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    Analysis complete
                  </span>
                </div>
              </div>

              <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Metric cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {METRICS.map((m, i) => (
                    <div
                      key={m.label}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 12,
                        padding: "14px 16px",
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
                        {m.label}
                      </p>
                      <p
                        className="font-heading font-bold"
                        style={{ fontSize: 22, letterSpacing: "-0.03em", color: "#ffffff" }}
                      >
                        {m.value}
                      </p>
                      <p style={{ fontSize: 11, color: m.color, fontWeight: 600, marginTop: 4 }}>
                        {m.change}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chart + Recs row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {/* Bar chart */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>
                      Spend vs ROAS
                    </p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                      {BARS.map((bar, i) => (
                        <div key={i} style={{ flex: 1 }}>
                          <motion.div
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              height: bar.height,
                              width: "100%",
                              borderRadius: "4px 4px 0 0",
                              background: i % 2 === 0
                                ? "linear-gradient(180deg, #6c5ce7 0%, rgba(108,92,231,0.4) 100%)"
                                : "linear-gradient(180deg, #00cec9 0%, rgba(0,206,201,0.4) 100%)",
                              transformOrigin: "bottom",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: "#6c5ce7" }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Spend</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: "#00cec9" }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ROAS</span>
                      </div>
                    </div>
                  </div>

                  {/* Recs */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <Lightbulb style={{ width: 12, height: 12, color: "#6c5ce7" }} />
                      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                        AI Recommendations
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {RECS.map((rec, i) => (
                        <div
                          key={i}
                          style={{
                            background: rec.bg,
                            border: `1px solid ${rec.border}`,
                            borderLeftWidth: 3,
                            borderLeftColor: rec.color,
                            borderRadius: 8,
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <ArrowUpRight
                            style={{
                              width: 11,
                              height: 11,
                              color: rec.color,
                              flexShrink: 0,
                              marginTop: 1,
                              transform: rec.type === "cut" ? "rotate(180deg)" : "none",
                            }}
                          />
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>
                            {rec.text}
                          </p>
                        </div>
                      ))}
                      <div
                        style={{
                          border: "1px dashed rgba(108,92,231,0.3)",
                          borderRadius: 8,
                          padding: "8px 12px",
                          textAlign: "center",
                        }}
                      >
                        <span style={{ fontSize: 10, color: "#9d8ff5", fontWeight: 600 }}>
                          + 5 more recommendations
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
