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

      {/* ── Two-column hero ── */}
      <div
        className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center px-6 sm:px-10 lg:px-12 pt-16 sm:pt-24 lg:pt-28"
        style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: 80, gap: 64, position: "relative", zIndex: 1 }}
      >

        {/* ════════════ LEFT — copy ════════════ */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Headline */}
          <FadeIn delay={0.08}>
            <h1
              className="font-heading"
              style={{
                fontSize:      "clamp(46px, 5vw, 82px)",
                fontWeight:     900,
                lineHeight:     0.96,
                letterSpacing: "-0.045em",
                color:         "#0D0D12",
                marginBottom:   28,
              }}
            >
              Fire your<br />
              <span style={{ position: "relative", display: "inline-block", color: "#A8A5A0" }}>
                media&nbsp;buyer.
                <span style={{
                  content: "''", position: "absolute", left: -4, right: -4, top: "53%", height: 6,
                  background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                  borderRadius: 3, transform: "rotate(-2deg)",
                }} />
              </span><br />
              Hire{" "}
              <span style={{
                background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Adur.</span>
            </h1>
          </FadeIn>

          {/* Subhead */}
          <FadeIn delay={0.14}>
            <p className="mx-auto lg:mx-0" style={{
              fontSize: 19, fontWeight: 400, lineHeight: 1.55, color: "#6B6B72",
              maxWidth: 540, marginBottom: 36, fontFamily: "var(--font-inter)",
            }}>
              Upload your Meta Ads CSV or connect your account.{" "}
              <strong style={{ color: "#0D0D12", fontWeight: 600 }}>Adur tells you what to kill, what to scale, generates your next winning creatives</strong>
              {" "}— and runs everything autonomously while you sleep.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.20}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start" style={{ gap: 12, marginBottom: 22 }}>
              {/* Primary */}
              <button
                onClick={onCtaClick}
                className="inline-flex items-center justify-center gap-2.5 text-white font-semibold cursor-pointer"
                style={{
                  padding:       "16px 34px",
                  borderRadius:   12,
                  background:    "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                  fontSize:       16,
                  letterSpacing: "-0.01em",
                  fontFamily:    "var(--font-inter)",
                  boxShadow:     "0 4px 24px rgba(255,60,172,0.28)",
                  border:        "none",
                  transition:    "box-shadow 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-2px)"; b.style.boxShadow = "0 8px 32px rgba(255,60,172,0.4)"; }}
                onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 24px rgba(255,60,172,0.28)"; }}
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary */}
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 font-medium"
                style={{
                  padding:       "15px 24px",
                  borderRadius:   12,
                  background:    "#ffffff",
                  border:        "1.5px solid #E8E5E0",
                  fontSize:       16,
                  letterSpacing: "-0.01em",
                  color:         "#0D0D12",
                  fontFamily:    "var(--font-inter)",
                  textDecoration: "none",
                  transition:    "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "#D4D0CA"; a.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                onMouseLeave={(e) => { const a = e.currentTarget as HTMLAnchorElement; a.style.borderColor = "#E8E5E0"; a.style.boxShadow = "none"; }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Open Dashboard
              </Link>
            </div>
          </FadeIn>

          {/* Trust line */}
          <FadeIn delay={0.26}>
            <div className="justify-center lg:justify-start" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0, fontFamily: "var(--font-inter)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#A8A5A0", fontWeight: 500 }}>
                <span style={{ width: 16, height: 16, borderRadius: 999, background: "#DCFCE7", color: "#16A34A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0 }}>✓</span>
                Free analysis
              </span>
              <span style={{ margin: "0 12px", color: "#D4D0CA" }}>·</span>
              <span style={{ fontSize: 13, color: "#A8A5A0", fontWeight: 500 }}>No credit card</span>
              <span style={{ margin: "0 12px", color: "#D4D0CA" }}>·</span>
              <span style={{ fontSize: 13, color: "#A8A5A0", fontWeight: 500 }}>60-second setup</span>
            </div>
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={0.32}>
            <div className="justify-center lg:justify-start w-full" style={{
              display: "flex", alignItems: "center", gap: 20,
              marginTop: 48, paddingTop: 32, borderTop: "1px solid #E8E5E0", flexWrap: "wrap",
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
                <div style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.4, maxWidth: 340 }}>
                  Trusted by <strong style={{ color: "#0D0D12", fontWeight: 700 }}>1,240+ DTC brands</strong>
                  {" · "}Built by media buyers who managed{" "}
                  <strong style={{ color: "#0D0D12", fontWeight: 700 }}>$70M+ in ad spend</strong>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ════════════ RIGHT — product preview ════════════ */}
        <FadeIn delay={0.18}>
          <div style={{ position: "relative", perspective: 1600 }}>

            {/* Floating Adur AI toast — top right */}
            <div className="hidden lg:flex" style={{
              position: "absolute", top: 8, right: -24,
              background: "#0D0D12", color: "#fff",
              borderRadius: 14, padding: "14px 18px 14px 14px",
              boxShadow: "0 20px 40px rgba(13,13,18,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
              alignItems: "flex-start", gap: 12,
              width: 280, transform: "rotate(2deg)", zIndex: 3,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/logomark-white.svg" alt="Adur" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              </div>
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
              position: "absolute", bottom: 28, left: -32,
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
              className="lg:[transform:rotateY(-3deg)_rotateX(2deg)]"
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
                      <div key={kpi.label} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, padding: "11px 12px", minWidth: 0, overflow: "hidden" }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", color: "#A8A5A0", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{kpi.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#0D0D12", marginTop: 4, whiteSpace: "nowrap" }}>
                          {kpi.val}{kpi.suffix && <span style={{ fontSize: 11, color: "#A8A5A0", fontWeight: 600 }}>{kpi.suffix}</span>}
                        </div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, marginTop: 4, whiteSpace: "nowrap", color: kpi.type === "up" ? "#16A34A" : kpi.type === "down" ? "#DC2626" : undefined }}>
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
        </FadeIn>
      </div>

      {/* keyframes for eyebrow pulse */}
      <style>{`@keyframes adurPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }`}</style>

    </section>
  );
}
