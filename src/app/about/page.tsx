import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Adur.ai",
  description: "The story, mission, and people behind Adur.ai — built by media buyers who managed $70M+ in Meta ad spend.",
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
          Built by buyers.<br />
          <span style={{ background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            For buyers.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2vw, 18px)", color: "#6B6B72", lineHeight: 1.7, maxWidth: 580, margin: "0 auto", fontFamily: "var(--font-inter)" }}>
          Adur.ai didn&apos;t come from a pitch deck. It came from running live ad accounts — wasting money at 2am, fighting Meta&apos;s algorithm, and realising AI could do the heavy lifting.
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
          "We spent years managing Meta ad accounts for DTC brands — fashion, beauty, supplements, home goods. We saw the same mistakes everywhere: budgets burning on dead audiences, creative fatigue going unnoticed for weeks, ROAS numbers that looked fine but hid profit leaks.",
          "The tools existed. Meta Ads Manager shows you the data. But interpreting it, diagnosing the problems, and turning that into a prioritised action plan? That took hours of expertise every week — expertise most brands couldn't afford to hire full-time.",
          "When LLMs got good enough to reason about campaign data the way a senior media buyer does, we built Adur. Not as a replacement for human judgement, but as a force multiplier — so a solo founder can think like a $70M ad account manager.",
          "Today Adur is used by DTC brands across 30+ countries. It's opinionated, fast, and ruthlessly focused on one thing: making your ad spend more profitable.",
        ].map((para, i) => (
          <p key={i} style={{ fontSize: 16, color: "#4B4B55", lineHeight: 1.8, marginBottom: 20, fontFamily: "var(--font-inter)" }}>
            {para}
          </p>
        ))}
      </section>

      {/* ── Team placeholder ── */}
      <section style={{ background: "#fff", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 className="font-heading" style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 8 }}>
            The team
          </h2>
          <p style={{ fontSize: 15, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 48 }}>
            A small, focused team obsessed with paid media performance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { initials: "SG", name: "Sohaib G.", role: "Founder & CEO", bio: "Media buyer turned builder. Managed $70M+ in Meta ad spend across 200+ DTC brands." },
              { initials: "?",  name: "Your name here", role: "Join the team", bio: "We're looking for exceptional people who are obsessed with performance marketing.", cta: true },
              { initials: "?",  name: "Your name here", role: "Join the team", bio: "Engineers, growth marketers, and AI researchers — see our open roles.", cta: true },
            ].map((person, i) => (
              <div key={i} style={{ background: person.cta ? "transparent" : "#FAF8F5", border: `1px solid ${person.cta ? "rgba(255,60,172,0.20)" : "#E8E5E0"}`, borderRadius: 18, padding: "28px 24px", ...(person.cta ? { background: "rgba(255,60,172,0.03)" } : {}) }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", marginBottom: 16,
                  background: person.cta ? "rgba(255,60,172,0.10)" : "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                  border: person.cta ? "1.5px dashed rgba(255,60,172,0.35)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: person.cta ? "#FF3CAC" : "#fff", fontWeight: 700, fontSize: 18,
                }}>
                  {person.initials}
                </div>
                <div className="font-heading" style={{ fontSize: 17, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.02em", marginBottom: 3 }}>{person.name}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#FF3CAC", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-inter)", marginBottom: 12 }}>{person.role}</div>
                <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: person.cta ? 16 : 0 }}>{person.bio}</p>
                {person.cta && (
                  <Link href="/join" style={{ fontSize: 13, fontWeight: 600, color: "#FF3CAC", textDecoration: "none", fontFamily: "var(--font-inter)" }}>
                    See open roles →
                  </Link>
                )}
              </div>
            ))}
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

      {/* ── Minimal footer ── */}
      <div style={{ background: "#0D0D12", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-inter)" }}>
          © {new Date().getFullYear()} Adur.ai ·{" "}
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Privacy</Link>
          {" · "}
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Terms</Link>
        </p>
      </div>

    </div>
  );
}
