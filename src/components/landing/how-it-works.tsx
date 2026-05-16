"use client";

import { motion } from "framer-motion";
import FadeIn from "@/components/fade-in";

const STEPS = [
  {
    number: "1",
    title: "Secure Connect",
    description: "Export your Meta Ads CSV from Ads Manager in 30 seconds. No API keys. No account connection needed.",
    mockup: (
      <div style={{ padding: "16px", background: "#f8f8ff", borderRadius: 12, border: "1px solid rgba(108,92,231,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1877f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, fontFamily: "Georgia, serif" }}>f</span>
          </div>
          <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, #6c5ce7, #e040fb)" }} />
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6c5ce7, #e040fb)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>A</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ffffff", borderRadius: 8, padding: "6px 10px", border: "1px solid rgba(0,184,148,0.3)" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00b894" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#00b894" }}>AUTH SECURE</span>
        </div>
      </div>
    ),
  },
  {
    number: "2",
    title: "AI Audit & Discovery",
    description: "Our AI parses every campaign, ad set, and creative. Cross-references spend, ROAS, and CPR against your goals.",
    mockup: (
      <div style={{ padding: "16px", background: "#fdf5ff", borderRadius: 12, border: "1px solid rgba(224,64,251,0.12)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 10 }}>
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} style={{ height: 28, borderRadius: 6, background: i === 5 ? "linear-gradient(135deg, #6c5ce7, #e040fb)" : "#fff", border: `1px solid ${i === 5 ? "transparent" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i === 5 && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.8)" }} />}
            </div>
          ))}
        </div>
        <div style={{ height: 2, borderRadius: 2, background: "linear-gradient(90deg, #6c5ce7, #e040fb)" }} />
      </div>
    ),
  },
  {
    number: "3",
    title: "Execute & Scale",
    description: "Get your full AI analysis, battle plan, and actionable recommendations — ready in 60 seconds.",
    mockup: (
      <div style={{ padding: "16px", background: "#f0fdf9", borderRadius: 12, border: "1px solid rgba(0,184,148,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b894" }} />
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#e5e7eb" }}>
            <div style={{ width: "65%", height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #6c5ce7, #e040fb)" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00b894" }}>+42.8% ROAS</span>
        </div>
        <div style={{ background: "#0d0d1a", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>DEPLOY OPTIMIZATION</span>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 0, height: 0, borderLeft: "5px solid #fff", borderTop: "3px solid transparent", borderBottom: "3px solid transparent", marginLeft: 1 }} />
          </div>
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 px-6 overflow-hidden" style={{ background: "#ffffff" }}>
      <div className="relative z-10 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.18)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6c5ce7" }}>Engine Workflow</span>
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.05 }}>
              Efficiency in{" "}
              <span style={{ fontStyle: "italic", background: "linear-gradient(135deg, #6c5ce7, #e040fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>3 Steps.</span>
            </h2>
            <p style={{ fontSize: 17, color: "#6b7280", marginTop: 16, maxWidth: 420, margin: "16px auto 0", fontFamily: "var(--font-inter)" }}>
              From raw CSV to full AI analysis in under 60 seconds.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <FadeIn key={step.number} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.10)" }}
                transition={{ duration: 0.22 }}
                className="relative flex flex-col h-full rounded-2xl p-7 cursor-default"
                style={{ background: "#ffffff", border: "1px solid #f0f0f5", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <div className="absolute top-6 right-6 font-heading font-black" style={{ fontSize: 48, color: "#f3f4f6", lineHeight: 1, letterSpacing: "-0.04em", userSelect: "none" }}>
                  {step.number}
                </div>
                <div className="mb-6 relative z-10">{step.mockup}</div>
                <h3 className="font-heading relative z-10" style={{ fontSize: 22, fontWeight: 700, color: "#0d0d1a", letterSpacing: "-0.02em", marginBottom: 10 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65, fontFamily: "var(--font-inter)" }}>
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
