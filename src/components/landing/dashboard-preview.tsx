"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Calendar, Wand2, Video, Bot, CheckCircle2, Check, X } from "lucide-react";
import FadeIn from "@/components/fade-in";

/* ── Feature rail definitions ─────────────────────────────── */
const FEATURES = [
  { label: "Diagnose",     desc: "See exactly which campaigns bleed money — down to the dollar.", Icon: TrendingUp, path: "diagnose" },
  { label: "Battle Plan",  desc: "A priority-ranked 7-day action plan, built around your goals.",  Icon: Calendar,   path: "battle-plan" },
  { label: "Ad Creatives", desc: "Agency-grade Meta ad images in seconds — four proven angles.",   Icon: Wand2,      path: "creatives" },
  { label: "UGC Videos",   desc: "AI creators that actually sell. No shoots. No creators.",         Icon: Video,      path: "ugc-studio" },
  { label: "Autopilot",    desc: "An AI manager that monitors and optimizes your account 24/7.",    Icon: Bot,        path: "autopilot" },
];

const CAMPAIGNS = [
  { name: "Summer Sale — Broad Audiences", status: "ACTIVE", budget: "$500 CBO", spend: "$12,450", revenue: "$48,750", roas: "3.92", roas_color: "#00b894" },
  { name: "Retargeting — 7 Day Visitors",  status: "ACTIVE", budget: "$150 CBO", spend: "$3,200",  revenue: "$8,640",  roas: "2.70", roas_color: "#fdcb6e" },
  { name: "Interest Stack — Cold Traffic", status: "ACTIVE", budget: "$200 CBO", spend: "$4,100",  revenue: "$3,690",  roas: "0.90", roas_color: "#e17055" },
];

const BATTLE_PLAN = [
  { day: "Day 1", action: "Scale your best ROAS campaign by 20%",        badge: "Quick Win", badgeColor: "#00b894", badgeBg: "rgba(0,184,148,0.14)" },
  { day: "Day 2", action: "Launch 3 new creatives on your top performer", badge: "Strategic", badgeColor: "#FF3CAC", badgeBg: "rgba(255,60,172,0.12)" },
  { day: "Day 3", action: "Expand to Lookalike 2–5% audience",           badge: "Strategic", badgeColor: "#FF6B35", badgeBg: "rgba(255,107,53,0.12)" },
];

/* ── Analysis tab ─────────────────────────────────────────── */
function AnalysisContent() {
  return (
    <div style={{ padding: "20px 24px", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ffffff", border: "1px solid #ECECF2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 287.56 191" aria-label="Meta" role="img">
            <defs>
              <linearGradient id="meta-a" x1="62.34" y1="101.45" x2="260.34" y2="91.45" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#0064e1" />
                <stop offset="0.4" stopColor="#0064e1" />
                <stop offset="0.83" stopColor="#0073ee" />
                <stop offset="1" stopColor="#0082fb" />
              </linearGradient>
              <linearGradient id="meta-b" x1="41.42" y1="53" x2="41.42" y2="126" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#0082fb" />
                <stop offset="1" stopColor="#0064e0" />
              </linearGradient>
            </defs>
            <path fill="#0081fb" d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z" />
            <path fill="url(#meta-a)" d="M24.49,37.3C38.73,15.35,59.28,0,82.85,0c13.65,0,27.22,4,41.39,15.61,15.5,12.65,32,33.48,52.63,67.81l7.39,12.32c17.84,29.72,28,45,33.93,52.22,7.64,9.26,13,12,19.94,12,17.63,0,22-16.2,22-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191c-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71L146.08,93.6c-12.94-21.62-24.81-37.74-31.68-45C107,40.71,97.51,31.23,82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78Z" />
            <path fill="url(#meta-b)" d="M82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78C38.61,71.62,31.06,99.34,31.06,126c0,11,2.41,19.41,5.56,24.51L10.14,167.91C3.34,156.6,0,141.76,0,124.85,0,94.1,8.44,62.05,24.49,37.3,38.73,15.35,59.28,0,82.85,0Z" />
          </svg>
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
    <div style={{ padding: "24px", background: "#0d0d1a", minHeight: 320 }}>
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
          <div key={item.day} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
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

/* ── Ad Creatives tab ─────────────────────────────────────── */
const MOCK_CONCEPTS = [
  { direction: "Bold & Direct", name: "Power Move", headline: "Stop Wasting Budget", sub: "Know exactly what to cut and scale", headerBg: "#0a0a0f", directionColor: "#FF3CAC", adBg: "linear-gradient(145deg, #1a0020 0%, #0a0a0f 55%, #200025 100%)", glowColor: "rgba(255,60,172,0.45)", productBg: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", productShape: "tall", adTextColor: "#ffffff", ctaBg: "linear-gradient(135deg, #FF3CAC, #FF6B35)", ctaColor: "#ffffff" },
  { direction: "Clean & Premium", name: "Elevated", headline: "Built for Performance", sub: "Proven by data. Trusted by buyers.", headerBg: "#fff5f9", directionColor: "#FF3CAC", adBg: "linear-gradient(150deg, #ffffff 0%, #fff0f6 60%, #ffe8f3 100%)", glowColor: "rgba(255,60,172,0.14)", productBg: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", productShape: "round", adTextColor: "#0d0d1a", ctaBg: "#0d0d1a", ctaColor: "#ffffff" },
  { direction: "Pattern Interrupt", name: "Scroll Stopper", headline: "You Almost Missed This", sub: "Your spend is bleeding right now", headerBg: "#fff3e0", directionColor: "#FF6B35", adBg: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 55%, #ffeaa7 100%)", glowColor: "rgba(255,107,53,0.4)", productBg: "linear-gradient(135deg, #0a0a0f 0%, #2d3436 100%)", productShape: "diamond", adTextColor: "#0a0a0f", ctaBg: "#0a0a0f", ctaColor: "#ffffff" },
];

function MockAdImage({ concept }: { concept: typeof MOCK_CONCEPTS[0] }) {
  const isTall = concept.productShape === "tall";
  const isRound = concept.productShape === "round";
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
            4 angles generated
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "var(--font-inter)", paddingLeft: 34 }}>Bold &amp; Direct · Clean &amp; Premium · Pattern Interrupt</p>
      </div>

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

/* ── UGC Videos tab ───────────────────────────────────────── */
const UGC_CARDS = [
  { cat: "English",  cap: "Brand Promo",     src: "/showcase/ugc/ugc-1.mp4", poster: "/showcase/ugc/ugc-1.jpg" },
  { cat: "Khaleeji", cap: "Anti-Spot Cream", src: "/showcase/ugc/ugc-2.mp4", poster: "/showcase/ugc/ugc-2.jpg" },
  { cat: "Spanish",  cap: "Anti-Acne Care",  src: "/showcase/ugc/ugc-3.mp4", poster: "/showcase/ugc/ugc-3.jpg" },
];

function UgcContent() {
  return (
    <div style={{ padding: "22px 22px 20px", background: "#0d0d1a", minHeight: 320 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Video style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-inter)" }}>UGC Video Studio</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>AI creators, lip-synced and ready to post</p>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.28)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
          3 ready
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {UGC_CARDS.map((c) => (
          <div key={c.cap} style={{ position: "relative", aspectRatio: "9 / 16", borderRadius: 14, overflow: "hidden", background: "#111114", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* real generated clip — autoplay muted loop */}
            <video
              src={c.src}
              poster={c.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* category */}
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 100, background: "rgba(8,8,10,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: "#22c55e", fontFamily: "var(--font-inter)" }}>{c.cat}</span>
            </div>
            {/* caption */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60, background: "linear-gradient(0deg, rgba(0,0,0,0.7), transparent)" }} />
            <span style={{ position: "absolute", left: 8, bottom: 8, fontSize: 10, fontWeight: 600, color: "#fff", fontFamily: "var(--font-inter)", lineHeight: 1.25, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{c.cap}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, width: "100%", padding: "9px", borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 16px rgba(255,60,172,0.28)" }}>
        <Video style={{ width: 12, height: 12, color: "#ffffff" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-inter)" }}>Generate a UGC Video</span>
      </div>
    </div>
  );
}

/* ── Autopilot tab ────────────────────────────────────────── */
const AUTOPILOT_ACTIONS = [
  { text: "Scaled “Summer Sale” budget +20%", meta: "Auto-applied · 2h ago", state: "done" as const },
  { text: "Pause “Cold Traffic” — ROAS 0.9× below break-even", meta: "Awaiting your approval", state: "pending" as const },
  { text: "Launch 3 fresh creatives on top performer", meta: "Awaiting your approval", state: "pending" as const },
];

function AutopilotContent() {
  return (
    <div style={{ padding: "22px", background: "#0d0d1a", minHeight: 320 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bot style={{ width: 16, height: 16, color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-inter)" }}>AI Manager · Autopilot</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>Monitoring your account around the clock</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.28)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
          Live
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ k: "12", v: "campaigns watched" }, { k: "3", v: "actions today" }, { k: "+$4,200", v: "impact this week" }].map(s => (
          <div key={s.v} style={{ flex: 1, minWidth: 110, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px" }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-inter)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.k}</p>
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)", marginTop: 4 }}>{s.v}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {AUTOPILOT_ACTIONS.map((a) => (
          <div key={a.text} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "13px 14px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: a.state === "done" ? "rgba(0,184,148,0.16)" : "rgba(124,58,237,0.16)", border: `1px solid ${a.state === "done" ? "rgba(0,184,148,0.3)" : "rgba(124,58,237,0.3)"}` }}>
              {a.state === "done" ? <Check style={{ width: 14, height: 14, color: "#00b894" }} strokeWidth={3} /> : <Bot style={{ width: 14, height: 14, color: "#a855f7" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", fontFamily: "var(--font-inter)", lineHeight: 1.35 }}>{a.text}</p>
              <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-inter)", marginTop: 2 }}>{a.meta}</p>
            </div>
            {a.state === "pending" ? (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,184,148,0.16)", border: "1px solid rgba(0,184,148,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check style={{ width: 13, height: 13, color: "#00b894" }} strokeWidth={3} />
                </span>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X style={{ width: 13, height: 13, color: "rgba(255,255,255,0.5)" }} strokeWidth={3} />
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#00b894", background: "rgba(0,184,148,0.14)", border: "1px solid rgba(0,184,148,0.25)", padding: "3px 9px", borderRadius: 100, flexShrink: 0, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>Done</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const TAB_CONTENT = [
  <AnalysisContent key="analysis" />,
  <BattlePlanContent key="battle" />,
  <CreativeStudioContent key="creative" />,
  <UgcContent key="ugc" />,
  <AutopilotContent key="autopilot" />,
];

/* ── Section ──────────────────────────────────────────────── */
export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="relative overflow-hidden" style={{ background: "#0A0A0F", padding: "84px 0 100px" }}>
      {/* Faint grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 30%, #000 25%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 30%, #000 25%, transparent 75%)",
        }}
      />
      {/* Brand orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: "18%", left: "4%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "42%", right: "4%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 mx-auto px-5 sm:px-6" style={{ maxWidth: 1200 }}>
        {/* ── Heading ── */}
        <FadeIn>
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: "rgba(255,60,172,0.10)", border: "1px solid rgba(255,60,172,0.20)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FF3CAC", fontFamily: "var(--font-inter)" }}>Platform Preview</span>
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1.05, marginBottom: 16 }}>
              One platform to run{" "}
              <span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", whiteSpace: "nowrap" }}>
                profitable Meta ads.
              </span>
            </h2>
            <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
              Diagnose what&apos;s losing money, get the fix, and generate the creative — images, UGC video, and an AI manager that executes it for you.
            </p>
          </div>
        </FadeIn>

        {/* ── Two-column: feature rail + app window ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 lg:gap-10 items-start">

          {/* Feature rail */}
          <FadeIn delay={0.06}>
            <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2.5">
              {FEATURES.map((f, i) => {
                const active = activeTab === i;
                const Icon = f.Icon;
                const isLast = i === FEATURES.length - 1;
                return (
                  <button
                    key={f.label}
                    onClick={() => setActiveTab(i)}
                    className={`text-left cursor-pointer transition-all duration-200 relative w-full ${isLast ? "col-span-2 justify-center lg:col-span-1 lg:justify-start" : ""}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 13,
                      padding: "13px 14px",
                      borderRadius: 16,
                      background: active ? "rgba(255,255,255,0.06)" : "transparent",
                      border: `1px solid ${active ? "rgba(255,60,172,0.30)" : "rgba(255,255,255,0.07)"}`,
                      boxShadow: active ? "0 8px 30px rgba(255,60,172,0.10)" : "none",
                    }}
                  >
                    {/* active accent bar (desktop) */}
                    <span className="hidden lg:block" style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 3, borderRadius: 3, background: active ? "linear-gradient(180deg,#FF3CAC,#FF6B35)" : "transparent" }} />
                    <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "linear-gradient(135deg,#FF3CAC,#FF6B35)" : "rgba(255,255,255,0.06)", border: active ? "none" : "1px solid rgba(255,255,255,0.10)", boxShadow: active ? "0 4px 14px rgba(255,60,172,0.32)" : "none" }}>
                      <Icon style={{ width: 18, height: 18, color: active ? "#fff" : "rgba(255,255,255,0.55)" }} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.75)", fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}>{f.label}</span>
                      <span className="hidden lg:block" style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", fontFamily: "var(--font-inter)", lineHeight: 1.45, marginTop: 3 }}>{f.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </FadeIn>

          {/* App window */}
          <FadeIn delay={0.12}>
            <div
              className="relative"
              style={{ padding: 2, borderRadius: 22, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", boxShadow: "0 0 60px rgba(255,60,172,0.24), 0 30px 80px rgba(0,0,0,0.5)" }}
            >
              <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff" }}>
                {/* Browser chrome */}
                <div style={{ background: "#F7F5F2", borderBottom: "1px solid #E8E5E0", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "4px 12px", border: "1px solid #E8E5E0", fontSize: 11, color: "#9ca3af", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    app.adur.ai/{FEATURES[activeTab].path}
                  </div>
                  <div className="hidden sm:flex" style={{ alignItems: "center", gap: 5, flexShrink: 0, fontSize: 10, fontWeight: 600, color: "#16A34A", background: "rgba(22,163,74,0.10)", padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A" }} />
                    Live
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
      </div>
    </section>
  );
}
