"use client";

import Link from "next/link";
import { useState } from "react";

const REASONS = [
  { icon: "◐", title: "Massive, underserved market", body: "10M+ active Meta advertisers. Most are flying blind. We give them a senior media buyer on demand — at a fraction of the cost." },
  { icon: "⌁", title: "AI-native from day one", body: "Not a dashboard with AI bolted on. The entire product is designed around AI reasoning about ad performance data." },
  { icon: "✦", title: "Strong early traction", body: "1,240+ brands onboarded in the first months. Organic growth driven by word-of-mouth from media buyers who actually use it daily." },
  { icon: "○", title: "Deep domain expertise", body: "$70M+ in managed Meta ad spend. We know this space from the inside — every feature solves a real, painful operator problem." },
  { icon: "⊟", title: "Scalable SaaS model", body: "$19/month Starter plan with clear upgrade paths. Low churn due to high switching cost once the AI has learned your account patterns." },
  { icon: "◔", title: "Expanding product surface", body: "Analysis is the wedge. Autonomous campaign management, creative generation, and multi-platform expansion are on the roadmap." },
];

const METRICS = [
  { value: "$70M+",  label: "Ad spend managed by the team" },
  { value: "1,240+", label: "Brands onboarded" },
  { value: "30+",    label: "Countries" },
  { value: "$19",    label: "Starter plan / month" },
];

const darkInputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1.5px solid rgba(255,255,255,0.12)", fontSize: 14,
  fontFamily: "var(--font-inter)", color: "#fff",
  background: "rgba(255,255,255,0.06)", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const submitStyle: React.CSSProperties = {
  padding: "14px", borderRadius: 100, border: "none", cursor: "pointer",
  background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
  color: "#fff", fontWeight: 700, fontSize: 15,
  fontFamily: "var(--font-inter)", letterSpacing: "-0.01em",
  boxShadow: "0 4px 20px rgba(255,60,172,0.35)",
};

export default function InvestorsPage() {
  const [form, setForm] = useState({ name: "", email: "", fund: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#0D0D12", minHeight: "100vh" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(13,13,18,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-white.svg" alt="Adur.ai" style={{ height: 36, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/about" style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>About</Link>
          <Link href="/join" style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>Join us</Link>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", padding: "8px 18px", borderRadius: 100, textDecoration: "none", fontFamily: "var(--font-inter)" }}>
            Try free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "96px 24px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, background: "rgba(255,60,172,0.12)", border: "1px solid rgba(255,60,172,0.25)", borderRadius: 100, padding: "6px 16px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF3CAC", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FF3CAC", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>
            Investor relations
          </span>
        </div>

        <h1 className="font-heading" style={{ fontSize: "clamp(40px, 6vw, 68px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#fff", marginBottom: 24 }}>
          The AI operating system<br />
          <span style={{ background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            for paid media
          </span>
        </h1>

        <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.50)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px", fontFamily: "var(--font-inter)" }}>
          We&apos;re building the tool that every DTC brand needs but can&apos;t afford to hire: a senior performance marketer, available 24/7, powered by AI.
        </p>

        <a href="#contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 36px", borderRadius: 100, background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", fontFamily: "var(--font-inter)", boxShadow: "0 4px 24px rgba(255,60,172,0.38)" }}>
          Get in touch →
        </a>
      </section>

      {/* ── Traction metrics ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "48px 24px" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8" style={{ textAlign: "center" }}>
          {METRICS.map(m => (
            <div key={m.value}>
              <div className="font-heading" style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, letterSpacing: "-0.04em", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 6 }}>
                {m.value}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", fontFamily: "var(--font-inter)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why invest ── */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px" }}>
        <h2 className="font-heading" style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", marginBottom: 48 }}>
          Why Adur.ai
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {REASONS.map(r => (
            <div key={r.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "24px" }}>
              <div style={{ fontSize: 22, color: "#FF3CAC", marginBottom: 14 }}>{r.icon}</div>
              <div className="font-heading" style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 10 }}>{r.title}</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, fontFamily: "var(--font-inter)" }}>{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact form ── */}
      <section id="contact" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 className="font-heading" style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", marginBottom: 8 }}>
            Get in touch
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)", fontFamily: "var(--font-inter)", marginBottom: 36 }}>
            We reply to every investor enquiry within 24 hours.
          </p>

          {sent ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 26, color: "#16A34A" }}>✓</div>
              <div className="font-heading" style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Message received!</div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.40)", fontFamily: "var(--font-inter)" }}>We&apos;ll reach out within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name", placeholder: "Your name", type: "text" },
                  { key: "email", placeholder: "Email address", type: "email" },
                ].map(f => (
                  <input key={f.key} type={f.type} required placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={darkInputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.15)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                ))}
              </div>
              <input type="text" placeholder="Fund or firm name (optional)"
                value={form.fund}
                onChange={e => setForm(p => ({ ...p, fund: e.target.value }))}
                style={darkInputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.15)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <textarea rows={5} required placeholder="Tell us about your thesis and what you look for in investments."
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                style={{ ...darkInputStyle, resize: "none" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.15)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {error && (
                <p style={{ fontSize: 13, color: "#e17055", background: "rgba(225,112,85,0.08)", border: "1px solid rgba(255,60,172,0.15)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", textAlign: "center" }}>
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} style={{ ...submitStyle, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending…" : "Send investor enquiry →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-inter)" }}>
          © {new Date().getFullYear()} Adur.ai ·{" "}
          <Link href="/about" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>About</Link>
          {" · "}
          <Link href="/join" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Join us</Link>
          {" · "}
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Privacy</Link>
        </p>
      </div>

    </div>
  );
}
