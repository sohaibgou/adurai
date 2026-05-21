import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Adur.ai",
  description: "Adur.ai was built by Souhaib Gouaalla — a 23-year-old agency owner and media buyer who managed $70M+ in Meta ad spend and built the tool he wished existed.",
};

const NAV_LOGO = (
  <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 36, width: "auto" }} />
  </Link>
);

const STATS = [
  { value: "$70M+",  label: "Ad spend managed" },
  { value: "1,240+", label: "DTC brands served" },
  { value: "3.8×",   label: "Avg ROAS improvement" },
  { value: "60s",    label: "Time to first insight" },
];

const VALUES = [
  {
    icon: "◐",
    title: "Radical transparency",
    body: "We tell you exactly what's bleeding your budget — not what you want to hear. No fluffy insights, no vanity metrics.",
  },
  {
    icon: "⌁",
    title: "Operators first",
    body: "We built this while running live ad accounts. Every feature solves a real problem we hit ourselves managing real spend.",
  },
  {
    icon: "✦",
    title: "Speed over perfection",
    body: "A good decision in 60 seconds beats a perfect one in 6 hours. We're built for the pace of paid social.",
  },
  {
    icon: "○",
    title: "Human + AI",
    body: "AI does the analysis. You make the calls. We're a co-pilot, not an autopilot — your judgment stays in the loop.",
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,248,245,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8E5E0",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {NAV_LOGO}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/join" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>
            Join us
          </Link>
          <Link href="/" style={{
            fontSize: 13, fontWeight: 600, color: "#fff",
            background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
            padding: "8px 18px", borderRadius: 100, textDecoration: "none",
            fontFamily: "var(--font-inter)",
          }}>
            Try free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "96px 24px 72px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
          background: "rgba(255,60,172,0.07)", border: "1px solid rgba(255,60,172,0.18)",
          borderRadius: 100, padding: "6px 16px",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF3CAC", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FF3CAC", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>
            Who is behind Adur.ai
          </span>
        </div>

        <h1 className="font-heading" style={{ fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 24 }}>
          Built by media buyers.<br />
          <span style={{ background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            For media buyers.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2vw, 18px)", color: "#6B6B72", lineHeight: 1.7, maxWidth: 580, margin: "0 auto", fontFamily: "var(--font-inter)" }}>
          Adur.ai didn&apos;t come from a pitch deck or a VC war room. It came from one person — running live accounts, wasting money at 2am, and deciding there had to be a better way.
        </p>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: "#0D0D12", padding: "48px 24px" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.value} style={{ textAlign: "center" }}>
              <div className="font-heading" style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, letterSpacing: "-0.04em", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 6 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)", fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
        <h2 className="font-heading" style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 24 }}>
          The story
        </h2>

        {[
          "I spent years running Meta ad accounts for DTC brands — fashion, beauty, supplements, home goods. I saw the same mistakes everywhere: budgets burning on dead audiences, creative fatigue going unnoticed for weeks, ROAS numbers that looked fine but hid serious profit leaks.",
          "The data was always there in Meta Ads Manager. But turning it into a clear diagnosis and a prioritised action plan? That took hours of senior expertise every week — expertise most brands couldn't afford to have on call.",
          "When LLMs got good enough to reason about campaign data the way a senior media buyer does, I built Adur. Not as a replacement for human judgement, but as a force multiplier — so any brand can think like a $70M account manager.",
          "I built every line of it myself. Today Adur is used by DTC brands across 30+ countries. It&apos;s opinionated, fast, and focused on one thing: making your ad spend more profitable.",
        ].map((para, i) => (
          <p key={i} style={{ fontSize: 16, color: "#4B4B55", lineHeight: 1.8, marginBottom: 20, fontFamily: "var(--font-inter)" }}>
            {para}
          </p>
        ))}
      </section>

      {/* ── Founder ── */}
      <section style={{ background: "#fff", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0", padding: "80px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 className="font-heading" style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 8 }}>
            The founder
          </h2>
          <p style={{ fontSize: 15, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 48 }}>
            One person. One obsession. Built from scratch.
          </p>

          <div className="flex flex-col lg:flex-row" style={{ background: "#FAF8F5", border: "1px solid #E8E5E0", borderRadius: 22, overflow: "hidden" }}>

            {/* Photo — full width on mobile / fixed square on desktop */}
            <div className="w-full lg:w-[340px] lg:flex-shrink-0" style={{ overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/founder2.jpg"
                alt="Souhaib Gouaalla"
                className="w-full lg:h-full"
                style={{ display: "block", objectFit: "cover", objectPosition: "center top", height: "auto" }}
              />
            </div>

            {/* Info — below on mobile, right column on desktop */}
            <div className="flex flex-col justify-center" style={{ padding: "32px 36px", gap: 18, display: "flex", flexDirection: "column" }}>

              {/* Name + tags */}
              <div>
                <div className="font-heading" style={{ fontSize: 24, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 10 }}>
                  Souhaib Gouaalla
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Founder & CEO", "Agency Owner", "23 y/o"].map(tag => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 700, color: "#FF3CAC", background: "rgba(255,60,172,0.08)", padding: "4px 12px", borderRadius: 100, fontFamily: "var(--font-inter)", letterSpacing: "0.04em" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <p style={{ fontSize: 15, color: "#4B4B55", lineHeight: 1.75, fontFamily: "var(--font-inter)", margin: 0 }}>
                I&apos;m Souhaib — a media buyer and agency owner who managed over $70M in Meta ad spend across 200+ DTC brands. I built Adur.ai entirely by myself because I was tired of doing manually what AI could do in seconds. No co-founders, no dev team, no VC money. Just the conviction that every brand deserves a senior media buyer on call — at a price anyone can afford.
              </p>

              {/* Stats row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, paddingTop: 16, borderTop: "1px solid #E8E5E0" }}>
                {[
                  { value: "$70M+", label: "Ad spend managed" },
                  { value: "200+",  label: "DTC brands" },
                  { value: "30+",   label: "Countries" },
                  { value: "Solo",  label: "Built it alone" },
                ].map(s => (
                  <div key={s.value}>
                    <div className="font-heading" style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}>
        <h2 className="font-heading" style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 48 }}>
          How we work
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {VALUES.map(v => (
            <div key={v.title} style={{ padding: "28px", border: "1px solid #E8E5E0", borderRadius: 18, background: "#fff" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, rgba(255,60,172,0.10), rgba(255,107,53,0.08))", border: "1px solid rgba(255,60,172,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#FF3CAC", marginBottom: 16 }}>
                {v.icon}
              </div>
              <div className="font-heading" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#0D0D12", marginBottom: 8 }}>{v.title}</div>
              <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.65, fontFamily: "var(--font-inter)" }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#0D0D12", padding: "80px 24px", textAlign: "center" }}>
        <h2 className="font-heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", marginBottom: 16 }}>
          Ready to stop wasting ad spend?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", marginBottom: 36 }}>
          Free analysis. No credit card. 60 seconds.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "15px 36px", borderRadius: 100,
            background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
            color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none",
            fontFamily: "var(--font-inter)", boxShadow: "0 4px 24px rgba(255,60,172,0.38)",
          }}>
            Start free analysis →
          </Link>
          <Link href="/join" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "15px 32px", borderRadius: 100,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.80)", fontWeight: 600, fontSize: 15, textDecoration: "none",
            fontFamily: "var(--font-inter)",
          }}>
            Join the team
          </Link>
        </div>
      </section>


    </div>
  );
}
