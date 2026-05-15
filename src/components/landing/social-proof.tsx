"use client";

import { motion } from "framer-motion";
import { TrendingUp, Layers, AlertTriangle, BarChart2 } from "lucide-react";
import FadeIn from "@/components/fade-in";

const PROBLEMS = [
  {
    icon: TrendingUp,
    label: "Rising Costs",
    title: "Ads are expensive.",
    desc: "CPMs up 24% YoY. You're paying more for the same reach while margins shrink.",
    mockup: (
      <div style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, border: "1px solid #f0f0f5", fontSize: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#e17055", fontWeight: 600 }}>
          <TrendingUp style={{ width: 13, height: 13 }} />
          CPMs +24% YOY
        </div>
        <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: "linear-gradient(90deg, #e17055 70%, #f0f0f5 70%)" }} />
      </div>
    ),
  },
  {
    icon: Layers,
    label: "Fragmented Data",
    title: "Data is fragmented.",
    desc: "Campaign data lives across 5 tabs, 3 tools, and a spreadsheet. Nothing talks to each other.",
    mockup: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 36, borderRadius: 8, border: "1.5px dashed #d1d5db", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: "#e040fb22" }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    label: "No Decisions",
    title: "Numbers, not decisions.",
    desc: "You see the data. You still don't know what to do. The platform shows metrics, not actions.",
    mockup: (
      <div style={{ padding: "10px 14px", background: "#fffbf0", borderRadius: 10, border: "1px solid #fdcb6e40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#92620a" }}>
          <AlertTriangle style={{ width: 12, height: 12, color: "#fdcb6e" }} />
          ACTION REQUIRED?
        </div>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {[80, 55, 35].map((w, i) => (
            <div key={i} style={{ height: 5, width: `${w}%`, borderRadius: 3, background: "#e5e7eb" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart2,
    label: "Guesswork",
    title: "Marketers are guessing.",
    desc: "Scale the winner? Cut the loser? Without clear signals, every decision is a coin flip.",
    mockup: (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 4 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ height: 40, borderRadius: 6, background: "#f0f0f5", marginBottom: 4 }} />
          <span style={{ fontSize: 10, color: "#9ca3af" }}>LOSER</span>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ height: 64, borderRadius: 6, background: "linear-gradient(180deg, #e040fb40 0%, #6c5ce740 100%)", border: "1.5px solid #6c5ce760", marginBottom: 4 }} />
          <span style={{ fontSize: 10, color: "#6c5ce7", fontWeight: 600 }}>SCALER</span>
        </div>
      </div>
    ),
  },
];

export default function SocialProof() {
  return (
    <section className="relative py-28 px-6 overflow-hidden" style={{ background: "#ffffff" }}>
      <div className="relative z-10 max-w-6xl mx-auto">
        <FadeIn>
          <div className="mb-16">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e040fb", marginBottom: 16, fontFamily: "var(--font-inter)" }}>
              The Advertising Crisis
            </p>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <h2 className="font-heading" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.05, maxWidth: 560 }}>
                Performance advertising<br />is{" "}
                <span style={{ fontStyle: "italic", background: "linear-gradient(135deg, #6c5ce7, #e040fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>broken.</span>
              </h2>
              <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.65, maxWidth: 360, fontFamily: "var(--font-inter)" }}>
                Every day, e-commerce brands waste thousands of dollars on underperforming campaigns — not because they don&apos;t care, but because no tool has ever told them exactly what to do. Until now.
              </p>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROBLEMS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(0,0,0,0.10)" }}
                transition={{ duration: 0.22 }}
                className="flex flex-col h-full rounded-2xl p-6 cursor-default"
                style={{ background: "#f9f9fc", border: "1px solid #f0f0f5", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                {/* Mini mockup */}
                <div className="mb-5 rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid #f0f0f5", minHeight: 80 }}>
                  {p.mockup}
                </div>
                {/* Icon + label */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(108,92,231,0.12), rgba(224,64,251,0.12))" }}>
                    <p.icon style={{ width: 14, height: 14, color: "#6c5ce7" }} />
                  </div>
                </div>
                <h3 className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: "#0d0d1a", letterSpacing: "-0.01em", marginBottom: 8 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, fontFamily: "var(--font-inter)" }}>{p.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
