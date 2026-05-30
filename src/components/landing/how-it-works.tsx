"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import FadeIn from "@/components/fade-in";
import { ArrowRight, Upload, BarChart3, Link2, Zap } from "lucide-react";

type Flow = "csv" | "meta";

// ── CSV flow mockups ──────────────────────────────────────────────────────────

const CsvStep1Mockup = () => (
  <div style={{ padding: 14, background: "#F7F5F2", borderRadius: 12, border: "1px solid #E8E5E0" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} />
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} />
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C940" }} />
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: "#E8E5E0", marginLeft: 4 }} />
      <div style={{ padding: "3px 10px", borderRadius: 6, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>Export ↓</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {[
        ["Lookalike 2%", "$640", "0.4×"],
        ["Retargeting 7d", "$320", "5.8×"],
        ["TOF — Interest", "$890", "2.1×"],
      ].map(([name, spend, roas]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "#fff", borderRadius: 6, border: "1px solid #E8E5E0" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D1D5DB", flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: "#6B6B72", flex: 1, fontFamily: "var(--font-inter)" }}>{name}</span>
          <span style={{ fontSize: 10, color: "#0D0D12", fontWeight: 600, fontFamily: "var(--font-inter)" }}>{spend}</span>
          <span style={{ fontSize: 10, color: parseFloat(roas) >= 3 ? "#16A34A" : "#DC2626", fontWeight: 700, fontFamily: "var(--font-inter)" }}>{roas}</span>
        </div>
      ))}
    </div>
  </div>
);

const CsvStep2Mockup = () => (
  <div style={{ padding: 14, background: "#F7F5F2", borderRadius: 12, border: "1px solid #E8E5E0" }}>
    <div
      style={{
        borderRadius: 10,
        border: "1.5px dashed rgba(255,60,172,0.35)",
        background: "rgba(255,60,172,0.04)",
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,60,172,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Upload style={{ width: 16, height: 16, color: "#FF3CAC" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>meta_ads_export.csv</span>
      <div style={{ width: "100%", height: 4, borderRadius: 4, background: "#E8E5E0", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #FF3CAC, #FF6B35)", originX: 0 }}
          initial={{ width: "0%" }}
          animate={{ width: ["0%", "72%", "72%"] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" }}
        />
      </div>
      <span style={{ fontSize: 10, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Parsing 47 ad sets…</span>
    </div>
  </div>
);

const CsvStep3Mockup = () => (
  <div style={{ padding: 14, background: "#F7F5F2", borderRadius: 12, border: "1px solid #E8E5E0", display: "flex", flexDirection: "column", gap: 6 }}>
    {[
      { dot: "#DC2626", label: "Lookalike 2% bleeding $640", tag: "Pause", tagBg: "#FEE2E2", tagC: "#991B1B" },
      { dot: "#16A34A", label: "Retargeting 7d — ROAS 5.8×",  tag: "Scale",  tagBg: "#DCFCE7", tagC: "#14532D" },
      { dot: "#D97706", label: "Creative fatigue across 3 sets", tag: "Refresh", tagBg: "#FEF3C7", tagC: "#78350F" },
    ].map(c => (
      <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, padding: "7px 10px", border: "1px solid #E8E5E0" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: "#0D0D12", flex: 1, fontFamily: "var(--font-inter)", lineHeight: 1.3 }}>{c.label}</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: c.tagBg, color: c.tagC, whiteSpace: "nowrap" }}>{c.tag}</span>
      </div>
    ))}
  </div>
);

// ── Meta flow mockups ─────────────────────────────────────────────────────────

const MetaStep1Mockup = () => (
  <div style={{ padding: 14, background: "#F7F5F2", borderRadius: 12, border: "1px solid #E8E5E0", display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 12 }}>A</span>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>adur.ai / dashboard</div>
        <div style={{ fontSize: 10, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Connect your Meta account</div>
      </div>
    </div>
    <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: "rgba(24,119,242,0.08)", border: "1.5px solid rgba(24,119,242,0.28)", cursor: "pointer" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877f2" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#1877f2", fontFamily: "var(--font-inter)" }}>Connect Meta Account</span>
      <ArrowRight style={{ width: 10, height: 10, color: "#1877f2" }} />
    </button>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 1, background: "#E8E5E0" }} />
      <span style={{ fontSize: 9, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>secure connection</span>
      <div style={{ flex: 1, height: 1, background: "#E8E5E0" }} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#28C940" }} />
      <span style={{ fontSize: 10, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>Token encrypted at rest · read/write API</span>
    </div>
  </div>
);

const MetaStep2Mockup = () => (
  <div style={{ padding: 14, background: "#F7F5F2", borderRadius: 12, border: "1px solid #E8E5E0" }}>
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8E5E0", padding: "14px 14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1877f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>Log in with Facebook</div>
      <div style={{ width: "100%", height: 24, borderRadius: 6, background: "#1877f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: "var(--font-inter)" }}>Continue as Sohaib</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <motion.div
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#28C940" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span style={{ fontSize: 9, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>Verifying — 10 seconds</span>
      </div>
    </div>
  </div>
);

const MetaStep3Mockup = () => (
  <div style={{ padding: 14, background: "#F7F5F2", borderRadius: 12, border: "1px solid #E8E5E0", display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>AI Manager — Auto</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <motion.div
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#28C940" }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span style={{ fontSize: 9, color: "#28C940", fontWeight: 600, fontFamily: "var(--font-inter)" }}>Live</span>
      </div>
    </div>
    {[
      { icon: "⏸", label: "Paused bleeding ad set",   time: "2m ago",  c: "#DC2626" },
      { icon: "⚡", label: "Scaled retargeting 2×",    time: "18m ago", c: "#16A34A" },
      { icon: "📊", label: "Refreshed 3 creatives",    time: "1h ago",  c: "#6c5ce7" },
    ].map(a => (
      <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, padding: "7px 10px", border: "1px solid #E8E5E0" }}>
        <span style={{ fontSize: 12, lineHeight: 1 }}>{a.icon}</span>
        <span style={{ fontSize: 10, color: "#0D0D12", flex: 1, fontFamily: "var(--font-inter)" }}>{a.label}</span>
        <span style={{ fontSize: 9, color: "#A8A5A0", fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>{a.time}</span>
      </div>
    ))}
  </div>
);

// ── Step data ────────────────────────────────────────────────────────────────

const CSV_STEPS = [
  {
    icon: BarChart3,
    step: "01",
    title: "Export from Meta Ads Manager",
    body: "Go to Meta Ads Manager → Columns → Export. Download the CSV. Takes 30 seconds.",
    mockup: <CsvStep1Mockup />,
  },
  {
    icon: Upload,
    step: "02",
    title: "Upload to Adur — 30 seconds",
    body: "Drag-and-drop your CSV. Adur parses every campaign, ad set, and creative instantly.",
    mockup: <CsvStep2Mockup />,
  },
  {
    icon: Zap,
    step: "03",
    title: "Get your complete AI analysis",
    body: "Immediate diagnosis: what to pause, what to scale, where your budget is being wasted.",
    mockup: <CsvStep3Mockup />,
  },
];

const META_STEPS = [
  {
    icon: Link2,
    step: "01",
    title: "Click Connect Meta Account",
    body: "Open your Adur dashboard and paste your Meta access token. One-time setup, fully encrypted.",
    mockup: <MetaStep1Mockup />,
  },
  {
    icon: Link2,
    step: "02",
    title: "Log in with Facebook — 10 seconds",
    body: "Adur validates your token and ad account ID against Meta's API. No manual API setup required.",
    mockup: <MetaStep2Mockup />,
  },
  {
    icon: Zap,
    step: "03",
    title: "Adur monitors and manages automatically",
    body: "AI Manager watches your account 24/7. Pauses losers, scales winners, alerts you before money burns.",
    mockup: <MetaStep3Mockup />,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: Flow; label: string; badge?: string; accent: string; accentBg: string; accentBorder: string }[] = [
  {
    id: "csv",
    label: "Analyze with CSV",
    accent: "#FF3CAC",
    accentBg: "rgba(255,60,172,0.08)",
    accentBorder: "rgba(255,60,172,0.28)",
  },
  {
    id: "meta",
    label: "Connect Meta Account",
    badge: "Pro",
    accent: "#6c5ce7",
    accentBg: "rgba(108,92,231,0.08)",
    accentBorder: "rgba(108,92,231,0.28)",
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState<Flow>("csv");

  const steps  = active === "csv" ? CSV_STEPS  : META_STEPS;
  const tabCfg = TAB_CONFIG.find(t => t.id === active)!;

  return (
    <section id="how-it-works" className="py-16 sm:py-24" style={{ background: "#ffffff" }}>
      <div className="px-4 sm:px-6" style={{ maxWidth: 1040, margin: "0 auto" }}>

        {/* ── Header ── */}
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 16px", borderRadius: 100,
                background: "rgba(255,60,172,0.07)", border: "1px solid rgba(255,60,172,0.18)",
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FF3CAC", fontFamily: "var(--font-inter)" }}>
                How It Works
              </span>
            </div>

            <h2
              className="font-heading"
              style={{
                fontSize: "clamp(34px, 5vw, 60px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "#0D0D12",
                lineHeight: 1.06,
                maxWidth: 620,
                margin: "0 auto 16px",
              }}
            >
              Two ways to run{" "}
              <span style={{ background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                smarter ads.
              </span>
            </h2>

            <p
              style={{
                fontSize: 16,
                color: "#6B6B72",
                fontFamily: "var(--font-inter)",
                maxWidth: 440,
                margin: "0 auto",
                lineHeight: 1.65,
              }}
            >
              Start free with a CSV upload, or unlock full AI autonomy by connecting your Meta account.
            </p>
          </div>
        </FadeIn>

        {/* ── Tab switcher ── */}
        <FadeIn delay={0.08}>
          <div className="flex justify-center mb-10 sm:mb-12">
            <div
              className="flex w-full sm:w-auto"
              style={{
                background: "#F7F5F2",
                border: "1px solid #E8E5E0",
                borderRadius: 100,
                padding: 4,
                gap: 4,
              }}
            >
              {TAB_CONFIG.map(tab => {
                const isActive = tab.id === active;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className="flex-1 sm:flex-none"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "9px 14px",
                      borderRadius: 100,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-inter)",
                      fontSize: 13,
                      fontWeight: 600,
                      transition: "all 0.18s",
                      background: isActive ? "#ffffff" : "transparent",
                      color: isActive ? tab.accent : "#6B6B72",
                      boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: 100,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          background: isActive ? "rgba(108,92,231,0.12)" : "rgba(108,92,231,0.07)",
                          color: "#6c5ce7",
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* ── Step cards ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.22, ease: "easeOut" }}
                  whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(0,0,0,0.09)" }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #E8E5E0",
                    borderRadius: 20,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    cursor: "default",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Large step number watermark */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 18,
                      fontSize: 52,
                      fontWeight: 900,
                      color: "#F3F4F6",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      userSelect: "none",
                      fontFamily: "var(--font-syne, sans-serif)",
                    }}
                  >
                    {step.step}
                  </div>

                  {/* Icon chip */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: tabCfg.accentBg,
                      border: `1px solid ${tabCfg.accentBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 16, height: 16, color: tabCfg.accent }} />
                  </div>

                  {/* Mockup */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {step.mockup}
                  </div>

                  {/* Text */}
                  <div>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#0D0D12",
                        letterSpacing: "-0.025em",
                        lineHeight: 1.25,
                        marginBottom: 8,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: "#6B6B72",
                        lineHeight: 1.65,
                        fontFamily: "var(--font-inter)",
                        margin: 0,
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Bottom CTA strip ── */}
        <FadeIn delay={0.2}>
          <div className="flex flex-col items-center text-center gap-3 mt-10 sm:mt-12">
            {active === "csv" ? (
              <>
                <p style={{ fontSize: 14, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                  Free to use · no account required · instant results
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#28C940" }} />
                  <span style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                    Want full automation?{" "}
                    <button
                      onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6c5ce7",
                        fontWeight: 700,
                        fontSize: 13,
                        fontFamily: "var(--font-inter)",
                        padding: 0,
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                      }}
                    >
                      See the Pro flow →
                    </button>
                  </span>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                  AI Manager works 24/7 — pause, scale, alert, all automatically
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#28C940" }} />
                  <span style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                    Not ready to connect?{" "}
                    <Link
                      href="/signup"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#FF3CAC",
                        fontWeight: 700,
                        fontSize: 13,
                        fontFamily: "var(--font-inter)",
                        padding: 0,
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                      }}
                    >
                      Start Free →
                    </Link>
                  </span>
                </div>
              </>
            )}
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
