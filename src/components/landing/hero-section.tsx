"use client";

import { ArrowRight, ArrowDown, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import FadeIn from "@/components/fade-in";

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section style={{ background: "transparent" }}>

      {/* ── Hero copy ── */}
      <div
        className="flex flex-col items-center text-center mx-auto px-6"
        style={{ maxWidth: 960, paddingTop: 96, paddingBottom: 56 }}
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
            Your Meta Ads.
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
            Upload your CSV or connect your Meta account. Adur tells you exactly what to kill, what to scale, generates your next winning ad creatives — and manages everything autonomously.{" "}
            <br className="hidden sm:block" />
            No agency needed.
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

        {/* ── Two-path pills ── */}
        <FadeIn delay={0.30}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full" style={{ maxWidth: 620 }}>

            {/* Pill 1 — CSV */}
            <button
              onClick={onCtaClick}
              className="flex items-center gap-3 text-left cursor-pointer group"
              style={{
                flex:         1.2,
                minWidth:     220,
                padding:      "12px 18px",
                borderRadius:  14,
                background:   "#F7F5F2",
                border:       "1.5px solid #E8E5E0",
                transition:   "border-color 0.15s, box-shadow 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#FF3CAC"; b.style.background = "#fff"; b.style.boxShadow = "0 4px 16px rgba(255,60,172,0.12)"; }}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#E8E5E0"; b.style.background = "#F7F5F2"; b.style.boxShadow = "none"; }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>📊</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}>
                    Upload CSV
                  </span>
                  <span style={{ background: "#DCFCE7", color: "#14532D", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100 }}>Free</span>
                </div>
                <div style={{ fontSize: 11, color: "#6B6B72", fontFamily: "var(--font-inter)", marginTop: 1 }}>
                  Free · instant analysis
                </div>
              </div>
              <ArrowDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#A8A5A0" }} />
            </button>

            {/* Pill 2 — Meta / Pro */}
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-3 text-left cursor-pointer"
              style={{
                flex:       0.8,
                minWidth:   220,
                padding:    "12px 18px",
                borderRadius: 14,
                background: "rgba(108,92,231,0.06)",
                border:     "1.5px solid rgba(108,92,231,0.22)",
                transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "#6c5ce7"; b.style.background = "rgba(108,92,231,0.10)"; b.style.boxShadow = "0 4px 16px rgba(108,92,231,0.18)"; }}
              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(108,92,231,0.22)"; b.style.background = "rgba(108,92,231,0.06)"; b.style.boxShadow = "none"; }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>🤖</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}>
                    Connect Meta Account
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#6c5ce7", background: "rgba(108,92,231,0.12)", padding: "2px 7px", borderRadius: 100, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Pro
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#6B6B72", fontFamily: "var(--font-inter)", marginTop: 1 }}>
                  Full autopilot · AI Manager
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#6c5ce7" }} />
            </button>
          </div>
        </FadeIn>

        {/* Trust pill */}
        <FadeIn delay={0.38}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#0D0D12", color: "#fff", borderRadius: 20, padding: "10px 18px", marginTop: 28 }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6, flexShrink: 0 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div style={{ fontSize: 12, lineHeight: 1.5, textAlign: "center" }}>
              Built by media buyers who&apos;ve managed&nbsp;
              <strong style={{ fontWeight: 700, background: "linear-gradient(90deg,#FF3CAC,#FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$70M+</strong>
              &nbsp;in ad spend
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Product preview ── */}
      <div className="px-4 sm:px-6" style={{ paddingBottom: 80, maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 20, padding: 2, boxShadow: "0 24px 64px rgba(0,0,0,0.09),0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          {/* Browser chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: "1px solid #F0EDE8" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C940" }} />
          </div>
          <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6">
            {/* Sidebar */}
            <div className="md:w-56 flex-shrink-0" style={{ background: "#F7F5F2", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A8A5A0", marginBottom: 12 }}>Account overview</p>
              {[
                { label: "Total spend",   val: "$4,820",   color: undefined },
                { label: "Avg. ROAS",     val: "3.2×",     color: "#16A34A" },
                { label: "CPP",           val: "$38.40",   color: "#DC2626" },
                { label: "Wasted spend",  val: "$1,140",   color: "#DC2626" },
                { label: "Active ad sets",val: "14",       color: undefined },
                { label: "Health score",  val: "62 / 100", color: "#D97706" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid #EDE9E3" : "none" }}>
                  <span style={{ fontSize: 12, color: "#6B6B72" }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color ?? "#0D0D12" }}>{row.val}</span>
                </div>
              ))}
            </div>
            {/* Diagnosis cards */}
            <div className="flex-1 flex flex-col gap-3">
              {[
                { dot: "#DC2626", title: 'Ad Set "Lookalike 2% — Cold" is bleeding budget', body: "$640 spent in 7 days. 0 purchases. CPM is 3× account average. Audience likely saturated.", tag: "→ Pause immediately", tagBg: "#FEE2E2", tagColor: "#991B1B" },
                { dot: "#16A34A", title: '"Retargeting — Viewers 7d" has room to scale',   body: "ROAS 5.8× on $320 spend. Frequency still low at 1.4. Budget is too conservative.", tag: "→ Scale budget 2×", tagBg: "#DCFCE7", tagColor: "#14532D" },
                { dot: "#D97706", title: "Creative fatigue detected across 3 ad sets",       body: "CTR dropped 40% week-over-week. Same creative running 18 days. Refresh needed.", tag: "→ Refresh creatives", tagBg: "#FEF3C7", tagColor: "#78350F" },
              ].map(card => (
                <div key={card.tag} style={{ background: "#F7F5F2", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: card.dot, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{card.title}</p>
                    <p style={{ fontSize: 12, color: "#6B6B72", lineHeight: 1.5 }}>{card.body}</p>
                    <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: card.tagBg, color: card.tagColor }}>{card.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
