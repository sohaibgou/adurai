"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Wand2, Calendar, CheckCircle2 } from "lucide-react";
import FadeIn from "@/components/fade-in";

const TABS = ["Analysis", "Battle Plan", "Creative Studio", "Insights"];

const CAMPAIGNS = [
  { name: "Summer Sale — Broad Audiences", status: "ACTIVE", budget: "$500 CBO", spend: "$12,450", revenue: "$48,750", roas: "3.92", roas_color: "#00b894" },
  { name: "Retargeting — 7 Day Visitors",  status: "ACTIVE", budget: "$150 CBO", spend: "$3,200",  revenue: "$8,640",  roas: "2.70", roas_color: "#fdcb6e" },
  { name: "Interest Stack — Cold Traffic", status: "ACTIVE", budget: "$200 CBO", spend: "$4,100",  revenue: "$3,690",  roas: "0.90", roas_color: "#e17055" },
];

const BATTLE_PLAN = [
  { day: "Day 1", action: "Scale your best ROAS campaign by 20%",          badge: "Quick Win",  badgeColor: "#00b894", badgeBg: "rgba(0,184,148,0.14)" },
  { day: "Day 2", action: "Launch 3 new creatives on your top performer",   badge: "Strategic",  badgeColor: "#FF3CAC", badgeBg: "rgba(255,60,172,0.12)" },
  { day: "Day 3", action: "Expand to Lookalike 2–5% audience",             badge: "Strategic",  badgeColor: "#FF6B35", badgeBg: "rgba(255,107,53,0.12)" },
];

const INSIGHTS = [
  { text: "Your CPC of $0.07 is 93% below industry benchmark — verify conversion event quality", color: "#fdcb6e", bg: "rgba(253,203,110,0.08)", border: "rgba(253,203,110,0.2)" },
  { text: "Your top campaign has 7.2% CTR — highest in account — untapped scaling potential",    color: "#00b894", bg: "rgba(0,184,148,0.08)",   border: "rgba(0,184,148,0.2)"   },
  { text: "Zero retargeting layer detected — add warm audience campaign to boost ROAS by ~0.8×", color: "#FF3CAC", bg: "rgba(255,60,172,0.08)",  border: "rgba(255,60,172,0.2)"  },
];

/* ── Analysis tab ─────────────────────────────────────────── */
function AnalysisContent() {
  return (
    <div style={{ padding: "20px 24px", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1877f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 14, fontFamily: "Georgia" }}>f</span>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>Ads Manager</p>
          <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>Manage and monitor your advertising campaigns</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, borderBottom: "1px solid #f0f0f5", marginBottom: 14 }}>
        {["Campaigns", "Ad Sets", "Ads"].map((t, i) => (
          <span key={t} style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#FF3CAC" : "#9ca3af", paddingBottom: 10, borderBottom: i === 0 ? "2px solid #FF3CAC" : "2px solid transparent", fontFamily: "var(--font-inter)", cursor: "default" }}>{t}</span>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, fontFamily: "var(--font-inter)" }}>Results from <strong style={{ color: "#0d0d1a" }}>3 campaigns</strong></p>

      {/* Scrollable table wrapper for mobile */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: 520 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 90px 90px 70px", gap: 8, padding: "8px 0", borderBottom: "1px solid #f0f0f5", marginBottom: 4 }}>
            {["Campaign", "Status", "Budget", "Spend", "Revenue", "ROAS"].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "var(--font-inter)", letterSpacing: "0.03em" }}>{h}</span>
            ))}
          </div>
          {CAMPAIGNS.map((c) => (
            <div key={c.name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 90px 90px 70px", gap: 8, padding: "10px 0", borderBottom: "1px solid #f9f9f9", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#FF3CAC", fontFamily: "var(--font-inter)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#00b894", background: "rgba(0,184,148,0.1)", padding: "3px 8px", borderRadius: 4, display: "inline-block", fontFamily: "var(--font-inter)" }}>{c.status}</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "var(--font-inter)" }}>{c.budget}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>{c.spend}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>{c.revenue}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.roas_color, fontFamily: "var(--font-inter)" }}>{c.roas}×</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Battle Plan tab ──────────────────────────────────────── */
function BattlePlanContent() {
  return (
    <div style={{ padding: "24px", background: "#0d0d1a", minHeight: 300 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Calendar style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-inter)" }}>7-Day Battle Plan</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>Priority-ranked actions by revenue impact</p>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#00b894", background: "rgba(0,184,148,0.15)", border: "1px solid rgba(0,184,148,0.25)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
          3 actions ready
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BATTLE_PLAN.map((item, i) => (
          <div
            key={item.day}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "14px 16px",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-inter)", textAlign: "center", lineHeight: 1.2 }}>D{i + 1}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)", marginBottom: 3 }}>{item.day}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{item.action}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: item.badgeColor, background: item.badgeBg, border: `1px solid ${item.badgeColor}30`, padding: "4px 10px", borderRadius: 100, flexShrink: 0, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
              {item.badge}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <CheckCircle2 style={{ width: 14, height: 14, color: "#00b894", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-inter)" }}>4 more days planned · Est. +$4,200 revenue impact</span>
      </div>
    </div>
  );
}

/* ── Creative Studio tab ──────────────────────────────────── */
const MOCK_CONCEPTS = [
  {
    direction: "Bold & Direct",
    name: "Power Move",
    headline: "Stop Wasting Budget",
    sub: "Know exactly what to cut and scale",
    headerBg: "#0a0a0f",
    directionColor: "#FF3CAC",
    adBg: "linear-gradient(145deg, #1a0020 0%, #0a0a0f 55%, #200025 100%)",
    glowColor: "rgba(255,60,172,0.45)",
    productBg: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
    productShape: "tall",
    adTextColor: "#ffffff",
    ctaBg: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
    ctaColor: "#ffffff",
  },
  {
    direction: "Clean & Premium",
    name: "Elevated",
    headline: "Built for Performance",
    sub: "Proven by data. Trusted by buyers.",
    headerBg: "#fff5f9",
    directionColor: "#FF3CAC",
    adBg: "linear-gradient(150deg, #ffffff 0%, #fff0f6 60%, #ffe8f3 100%)",
    glowColor: "rgba(255,60,172,0.14)",
    productBg: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
    productShape: "round",
    adTextColor: "#0d0d1a",
    ctaBg: "#0d0d1a",
    ctaColor: "#ffffff",
  },
  {
    direction: "Pattern Interrupt",
    name: "Scroll Stopper",
    headline: "You Almost Missed This",
    sub: "Your spend is bleeding right now",
    headerBg: "#fff3e0",
    directionColor: "#FF6B35",
    adBg: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 55%, #ffeaa7 100%)",
    glowColor: "rgba(255,107,53,0.4)",
    productBg: "linear-gradient(135deg, #0a0a0f 0%, #2d3436 100%)",
    productShape: "diamond",
    adTextColor: "#0a0a0f",
    ctaBg: "#0a0a0f",
    ctaColor: "#ffffff",
  },
];

function MockAdImage({ concept }: { concept: typeof MOCK_CONCEPTS[0] }) {
  const isTall    = concept.productShape === "tall";
  const isRound   = concept.productShape === "round";
  const isDiamond = concept.productShape === "diamond";
  return (
    <div style={{ position: "relative", aspectRatio: "1", background: concept.adBg, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10px" }}>
      <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: "80%", height: "70%", borderRadius: "50%", background: concept.glowColor, filter: "blur(28px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "50%", top: "46%", transform: `translate(-50%, -50%)${isDiamond ? " rotate(12deg)" : ""}`, width: isTall ? "28%" : isRound ? "38%" : "32%", height: isTall ? "52%" : isRound ? "38%" : "32%", borderRadius: isTall ? "100px" : isRound ? "50%" : "12px", background: concept.productBg, boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: concept.adTextColor, fontFamily: "var(--font-inter)", lineHeight: 1.25, maxWidth: "62%" }}>{concept.headline}</p>
      </div>
      <div style={{ position: "relative", zIndex: 2 }}>
        <p style={{ fontSize: 7.5, color: concept.adTextColor, opacity: 0.65, fontFamily: "var(--font-inter)", marginBottom: 5, lineHeight: 1.3 }}>{concept.sub}</p>
        <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 100, background: concept.ctaBg }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, color: concept.ctaColor, fontFamily: "var(--font-inter)" }}>Shop Now</span>
        </div>
      </div>
    </div>
  );
}

function CreativeStudioContent() {
  return (
    <div style={{ padding: "18px 20px", background: "#ffffff" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Wand2 style={{ width: 13, height: 13, color: "#fff" }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0d0d1a", fontFamily: "var(--font-inter)", lineHeight: 1 }}>Creative Studio</p>
          <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#FF3CAC", background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.18)", padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-inter)", flexShrink: 0, whiteSpace: "nowrap" }}>
            Adur Creative Studio
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "var(--font-inter)", paddingLeft: 34 }}>Bold &amp; Direct · Clean &amp; Premium · Pattern Interrupt</p>
      </div>

      {/* Horizontally scrollable on mobile */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, minWidth: 360 }}>
          {MOCK_CONCEPTS.map((concept, i) => (
            <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #f0f0f5", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "7px 9px", background: concept.headerBg }}>
                <p style={{ fontSize: 8.5, fontWeight: 700, color: concept.directionColor, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "var(--font-inter)", lineHeight: 1 }}>{concept.direction}</p>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: concept.headerBg === "#0a0a0f" ? "#ffffff" : "#0a0a0f", fontFamily: "var(--font-inter)", marginTop: 2, lineHeight: 1 }}>{concept.name}</p>
              </div>
              <MockAdImage concept={concept} />
              <div style={{ display: "flex", gap: 5, padding: "7px 8px", background: "#fafafa", borderTop: "1px solid #f0f0f5" }}>
                <div style={{ flex: 1, textAlign: "center", padding: "4px 0", borderRadius: 5, background: "rgba(255,60,172,0.08)", fontSize: 8.5, fontWeight: 600, color: "#FF3CAC", fontFamily: "var(--font-inter)", cursor: "default" }}>↓ Download</div>
                <div style={{ flex: 1, textAlign: "center", padding: "4px 0", borderRadius: 5, background: "#f0f0f5", fontSize: 8.5, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)", cursor: "default" }}>↺ Regen</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", padding: "9px", borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 16px rgba(255,60,172,0.28)" }}>
        <Wand2 style={{ width: 12, height: 12, color: "#ffffff" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-inter)" }}>Generate Your Real Ad Creatives</span>
      </div>
    </div>
  );
}

/* ── Insights tab ─────────────────────────────────────────── */
function InsightsContent() {
  return (
    <div style={{ padding: "24px", background: "#0d0d1a", minHeight: 300 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Lightbulb style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-inter)" }}>AI Insights</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>Patterns and anomalies detected in your account</p>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#FF3CAC", background: "rgba(255,60,172,0.12)", border: "1px solid rgba(255,60,172,0.22)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
          3 insights
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {INSIGHTS.map((insight, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "flex-start", gap: 12, background: insight.bg, border: `1px solid ${insight.border}`, borderRadius: 12, padding: "14px 16px" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: insight.color + "20", border: `1px solid ${insight.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <Lightbulb style={{ width: 14, height: 14, color: insight.color }} />
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.55, fontFamily: "var(--font-inter)" }}>{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TAB_CONTENT = [
  <AnalysisContent    key="analysis"  />,
  <BattlePlanContent  key="battle"    />,
  <CreativeStudioContent key="creative" />,
  <InsightsContent    key="insights"  />,
];

/* ── Section ──────────────────────────────────────────────── */
export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="relative overflow-hidden" style={{ background: "#0d0d1a", padding: "80px 0 100px" }}>

      {/* Background orbs — brand colors */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "20%", left: "5%",  width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "40%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 mx-auto px-4 sm:px-6" style={{ maxWidth: 1000 }}>

        {/* ── Heading ── */}
        <FadeIn>
          <div className="text-center mb-10 sm:mb-14">
            <div
              className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
              style={{ background: "rgba(255,60,172,0.10)", border: "1px solid rgba(255,60,172,0.20)" }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FF3CAC", fontFamily: "var(--font-inter)" }}>Platform Preview</span>
            </div>
            <h2
              className="font-heading"
              style={{ fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1.05, marginBottom: 14 }}
            >
              Discover the{" "}
              <span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Adur.ai
              </span>{" "}
              platform
            </h2>
            <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", maxWidth: 440, margin: "0 auto" }}>
              Everything you need to dominate your Meta campaigns.
            </p>
          </div>
        </FadeIn>

        {/* ── Tab buttons ── */}
        <FadeIn delay={0.08}>
          <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className="cursor-pointer transition-all duration-200"
                style={{
                  padding:    "10px 22px",
                  borderRadius: 100,
                  fontSize:   13,
                  fontWeight:  600,
                  fontFamily: "var(--font-inter)",
                  background: activeTab === i ? "linear-gradient(135deg, #FF3CAC, #FF6B35)" : "rgba(255,255,255,0.06)",
                  color:      activeTab === i ? "#fff" : "rgba(255,255,255,0.45)",
                  border:     activeTab === i ? "none" : "1px solid rgba(255,255,255,0.10)",
                  boxShadow:  activeTab === i ? "0 4px 20px rgba(255,60,172,0.32)" : "none",
                  letterSpacing: "-0.01em",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* ── Browser mockup ── */}
        <FadeIn delay={0.14}>
          <div
            className="relative mx-auto"
            style={{
              padding:      2,
              borderRadius: 22,
              background:   "linear-gradient(135deg, #FF3CAC, #FF6B35)",
              boxShadow:    "0 0 60px rgba(255,60,172,0.28), 0 0 100px rgba(255,107,53,0.16)",
            }}
          >
            <div style={{ borderRadius: 20, overflow: "hidden" }}>
              {/* Browser chrome */}
              <div style={{ background: "#F7F5F2", borderBottom: "1px solid #E8E5E0", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                  ))}
                </div>
                <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "4px 12px", border: "1px solid #E8E5E0", fontSize: 11, color: "#9ca3af", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  app.adur.ai/{["dashboard", "battle-plan", "creative-studio", "insights"][activeTab]}
                </div>
              </div>

              {/* Animated content */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {TAB_CONTENT[activeTab]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
