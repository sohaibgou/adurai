"use client";

import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import FadeIn from "@/components/fade-in";

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section style={{ background: "transparent", position: "relative" }}>

      {/* ── Subtle grid overlay ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.35,
        backgroundImage: [
          "linear-gradient(rgba(13,13,18,0.025) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(13,13,18,0.025) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "64px 64px",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 10%, black 0%, transparent 75%)",
        maskImage:       "radial-gradient(ellipse 80% 60% at 50% 10%, black 0%, transparent 75%)",
      }} />

      {/* ── Hero copy ── */}
      <div
        className="flex flex-col items-center text-center mx-auto px-6"
        style={{ maxWidth: 960, paddingTop: 96, paddingBottom: 56, position: "relative", zIndex: 1 }}
      >

        {/* Headline */}
        <FadeIn delay={0.05}>
          <h1
            className="font-heading"
            style={{
              fontSize:      "clamp(50px, 7.5vw, 86px)",
              fontWeight:     900,
              lineHeight:     1.03,
              letterSpacing: "-0.04em",
              color:         "#0D0D12",
              maxWidth:       820,
              marginLeft:    "auto",
              marginRight:   "auto",
            }}
          >
            The AI That Runs
            <br />
            Your{" "}
            <span style={{
              background:              "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
              WebkitBackgroundClip:    "text",
              WebkitTextFillColor:     "transparent",
              backgroundClip:          "text",
            }}>Meta Ads</span>.
          </h1>
        </FadeIn>

        {/* Subhead */}
        <FadeIn delay={0.15}>
          <p
            style={{
              fontSize:     "clamp(15px, 2vw, 18px)",
              fontWeight:    400,
              lineHeight:    1.65,
              color:        "#6B6B72",
              maxWidth:      540,
              marginTop:     22,
              marginBottom:  40,
              fontFamily:   "var(--font-inter)",
            }}
          >
            Upload your Meta Ads CSV or connect your account.{" "}
            <strong style={{ color: "#0D0D12", fontWeight: 600 }}>Adur tells you what to kill, what to scale, generates your next winning creatives</strong>
            {" "}— and runs everything autonomously while you sleep.
          </p>
        </FadeIn>

        {/* Main CTAs */}
        <FadeIn delay={0.22}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3" style={{ marginBottom: 28 }}>
            {/* Primary */}
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer"
              style={{
                padding:       "16px 38px",
                borderRadius:   100,
                background:    "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                fontSize:       16,
                letterSpacing: "-0.01em",
                fontFamily:    "var(--font-inter)",
                boxShadow:     "0 4px 24px rgba(255,60,172,0.38)",
                border:        "none",
                transition:    "opacity 0.15s, transform 0.15s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.opacity = "0.92"; b.style.transform = "translateY(-2px)"; b.style.boxShadow = "0 10px 32px rgba(255,60,172,0.48)"; }}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.opacity = "1"; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 24px rgba(255,60,172,0.38)"; }}
            >
              Start Free — Upload CSV
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 font-semibold"
              style={{
                padding:       "16px 32px",
                borderRadius:   100,
                background:    "#ffffff",
                border:        "1.5px solid #E2E0DA",
                fontSize:       16,
                letterSpacing: "-0.01em",
                color:         "#0D0D12",
                fontFamily:    "var(--font-inter)",
                textDecoration: "none",
                transition:    "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "#B0ADAA"; a.style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)"; }}
              onMouseLeave={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "#E2E0DA"; a.style.boxShadow = "none"; }}
            >
              <LayoutDashboard className="w-4 h-4" />
              Open Dashboard
            </Link>
          </div>
        </FadeIn>

        {/* ── Trust badges ── */}
        <FadeIn delay={0.30}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", fontWeight: 500 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#DCFCE7", color: "#16A34A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>✓</span>
              Free analysis
            </span>
            <span style={{ margin: "0 12px", color: "#D4D0CA" }}>·</span>
            <span style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", fontWeight: 500 }}>No credit card</span>
            <span style={{ margin: "0 12px", color: "#D4D0CA" }}>·</span>
            <span style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", fontWeight: 500 }}>60-second setup</span>
          </div>
        </FadeIn>

        {/* ── Social proof ── */}
        <FadeIn delay={0.38}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
            marginTop: 32, paddingTop: 28, borderTop: "1px solid #E8E5E0", flexWrap: "wrap",
          }}>
            {/* Avatars */}
            <div style={{ display: "flex" }}>
              {[
                { initials: "MK", bg: "linear-gradient(135deg, #FF3CAC, #FF6B35)" },
                { initials: "JR", bg: "linear-gradient(135deg, #2A6FA3, #6BAEDB)" },
                { initials: "SH", bg: "linear-gradient(135deg, #16A34A, #84CC16)" },
                { initials: "DP", bg: "linear-gradient(135deg, #7C3AED, #C084FC)" },
                { initials: "+",  bg: "#0D0D12" },
              ].map((a, i) => (
                <div key={a.initials} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: "2.5px solid #FAF8F5",
                  background: a.bg,
                  marginLeft: i === 0 ? 0 : -10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "-0.02em",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)", flexShrink: 0,
                }}>
                  {a.initials}
                </div>
              ))}
            </div>
            {/* Stars + text */}
            <div>
              <div style={{ color: "#F59E0B", fontSize: 14, marginBottom: 4, letterSpacing: 2 }}>★ ★ ★ ★ ★</div>
              <div style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>
                Trusted by <strong style={{ color: "#0D0D12", fontWeight: 700 }}>1,240+ DTC brands</strong>
                {" · "}Built by buyers who managed{" "}
                <strong style={{ color: "#0D0D12", fontWeight: 700 }}>$70M+ in ad spend</strong>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Product preview ── */}
      <div className="px-4 sm:px-6" style={{ paddingBottom: 80, maxWidth: 1040, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ position: "relative" }}>

          {/* Floating Adur AI toast — top right */}
          <div className="hidden lg:flex" style={{
            position: "absolute", top: 68, right: -32,
            background: "#0D0D12", color: "#fff",
            borderRadius: 14, padding: "14px 18px 14px 14px",
            boxShadow: "0 20px 40px rgba(13,13,18,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
            alignItems: "flex-start", gap: 12,
            width: 280, transform: "rotate(2deg)", zIndex: 3,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14, flexShrink: 0, boxShadow: "0 4px 12px rgba(255,60,172,0.4)" }}>A</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FF3CAC", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3 }}>✦ Adur</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.4, color: "#fff", fontWeight: 500 }}>
                Killed <strong>Lookalike 2% — Cold</strong>.<br />CPA breached threshold for 6h.<br />Saved <span style={{ color: "#16A34A", fontWeight: 700 }}>+$1,420</span>.
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 6, fontFamily: "monospace", letterSpacing: "0.06em" }}>02:14 · TODAY</div>
            </div>
          </div>

          {/* Floating creative toast — bottom left */}
          <div className="hidden lg:flex" style={{
            position: "absolute", bottom: 60, left: -36,
            background: "#fff", border: "1px solid #E8E5E0",
            borderRadius: 14, padding: 12,
            boxShadow: "0 20px 40px rgba(13,13,18,0.12)",
            alignItems: "center", gap: 10,
            width: 270, transform: "rotate(-2deg)", zIndex: 3,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 11, boxShadow: "0 4px 10px rgba(255,60,172,0.25)" }}>AD</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}>4 new creatives drafted</div>
              <div style={{ fontSize: 10.5, color: "#6B6B72", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>✦ Generated</span>
                <span>·</span>
                <span>2 pushed live</span>
              </div>
            </div>
          </div>

          {/* Product frame */}
          <div
            className="md:[transform:rotateY(-3deg)_rotateX(2deg)] md:[transform-style:preserve-3d]"
            style={{
              background: "#fff", borderRadius: 18, border: "1px solid #E8E5E0", overflow: "hidden",
              boxShadow: "0 40px 80px -20px rgba(13,13,18,0.18), 0 24px 48px -16px rgba(255,60,172,0.08), 0 0 0 1px rgba(13,13,18,0.04)",
            }}
          >
            {/* Browser chrome */}
            <div style={{ background: "#F7F5F2", height: 36, display: "flex", alignItems: "center", padding: "0 14px", borderBottom: "1px solid #E8E5E0", gap: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFBD2E" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C940" }} />
              </div>
              <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 6, padding: "3px 10px", fontFamily: "monospace", fontSize: 11, color: "#A8A5A0", flex: 1, maxWidth: 280, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#16A34A", flexShrink: 0 }} />
                <span>app.adur.ai/dashboard</span>
              </div>
            </div>

            {/* Product body */}
            <div className="flex flex-col md:flex-row" style={{ background: "#FAF8F5" }}>

              {/* Sidebar — hidden on mobile */}
              <aside className="hidden md:flex flex-col" style={{ width: 200, flexShrink: 0, background: "#fff", borderRight: "1px solid #E8E5E0", padding: "20px 14px", gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A8A5A0", padding: "8px 10px 4px" }}>Account</div>
                {[
                  { icon: "◐", label: "Diagnose",   count: "12", active: true  },
                  { icon: "◔", label: "Campaigns",  count: null,  active: false },
                  { icon: "✦", label: "Creatives",  count: "47", active: false },
                  { icon: "⊟", label: "Battle plan",count: null,  active: false },
                  { icon: "⌁", label: "Autopilot",  count: null,  active: false },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, fontSize: 13, fontWeight: item.active ? 600 : 500, color: item.active ? "#0D0D12" : "#6B6B72", background: item.active ? "rgba(255,60,172,0.08)" : "transparent", cursor: "pointer" }}>
                    <span style={{ color: item.active ? "#FF3CAC" : "#A8A5A0", fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.count && (
                      <span style={{ fontSize: 11, background: item.active ? "linear-gradient(135deg, #FF3CAC, #FF6B35)" : "#F0EDE8", color: item.active ? "#fff" : "#6B6B72", padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>{item.count}</span>
                    )}
                  </div>
                ))}
                <div style={{ height: 1, background: "#E8E5E0", margin: "12px 4px" }} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A8A5A0", padding: "8px 10px 4px" }}>Settings</div>
                {[
                  { icon: "⌬", label: "Integrations" },
                  { icon: "○", label: "Team" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#6B6B72", cursor: "pointer" }}>
                    <span style={{ color: "#A8A5A0" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </aside>

              {/* Main panel */}
              <div className="flex flex-col p-4 md:p-5" style={{ gap: 16, flex: 1, minWidth: 0 }}>
                {/* Panel header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
                    Diagnose
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#DCFCE7", color: "#14532D", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 999 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
                      Live · 09:41
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["⤓", "⟳", "⋯"].map(icon => (
                      <div key={icon} style={{ width: 26, height: 26, borderRadius: 7, background: "#F7F5F2", border: "1px solid #E8E5E0", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6B72", cursor: "pointer", fontSize: 12 }}>{icon}</div>
                    ))}
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 10 }}>
                  {[
                    { label: "Spend (30d)", val: "$4,820",  suffix: null,  delta: "↓ 12%",   type: "down"  },
                    { label: "ROAS",        val: "3.2×",    suffix: null,  delta: "↑ 0.8×",  type: "up"    },
                    { label: "Wasted",      val: "$1,140",  suffix: null,  delta: "−68%",    type: "brand" },
                    { label: "Health",      val: "86",      suffix: "/100",delta: "↑ 24 pts",type: "up"    },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#A8A5A0", textTransform: "uppercase" }}>{kpi.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#0D0D12", marginTop: 4 }}>
                        {kpi.val}{kpi.suffix && <span style={{ fontSize: 13, color: "#A8A5A0", fontWeight: 600 }}>{kpi.suffix}</span>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: kpi.type === "up" ? "#16A34A" : kpi.type === "down" ? "#DC2626" : undefined }}>
                        {kpi.type === "brand"
                          ? <span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{kpi.delta}</span>
                          : kpi.delta}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Diagnosis list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { dot: "#DC2626", title: "Lookalike 2% — Cold is bleeding budget",          meta: "$640 SPENT · 0 PURCHASES · CPM 3× AVG",     action: "→ Pause",    actionBg: "#FEE2E2", actionColor: "#991B1B" },
                    { dot: "#16A34A", title: "Retargeting Viewers 7d has room to scale",        meta: "ROAS 5.8× · FREQ 1.4 · BUDGET TOO LOW",      action: "→ Scale 2×", actionBg: "#DCFCE7", actionColor: "#14532D" },
                    { dot: "#D97706", title: "Creative fatigue across 3 ad sets",               meta: "CTR −40% WoW · SAME CREATIVE 18 DAYS",        action: "→ Refresh",  actionBg: "#FEF3C7", actionColor: "#78350F" },
                    { dot: "#16A34A", title: "Summer Sale — Broad outperforming benchmark",     meta: "ROAS 4.6× · CPA $11.20 · +110% HEADROOM",    action: "→ Scale 3×", actionBg: "#DCFCE7", actionColor: "#14532D" },
                  ].map(card => (
                    <div key={card.title} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: card.dot, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>{card.title}</div>
                        <div style={{ fontSize: 11, color: "#6B6B72", marginTop: 2, fontFamily: "monospace" }}>{card.meta}</div>
                      </div>
                      <div style={{ alignSelf: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 7, background: card.actionBg, color: card.actionColor }}>{card.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
