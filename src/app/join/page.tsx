"use client";

import Link from "next/link";
import { useState } from "react";

const OPEN_ROLES = [
  {
    title: "Senior Growth Engineer",
    type: "Full-time · Remote",
    tags: ["Next.js", "AI/LLM", "Paid Media"],
    description: "Build the infrastructure that makes AI-powered ad analysis possible. You'll work on data pipelines, API integrations, and the core analysis engine.",
  },
  {
    title: "Performance Marketing Lead",
    type: "Full-time · Remote",
    tags: ["Meta Ads", "DTC", "Analytics"],
    description: "Own our own growth. You understand paid social at a deep level and can run experiments, analyse data, and scale what works.",
  },
  {
    title: "AI/ML Engineer",
    type: "Full-time · Remote",
    tags: ["LLMs", "Python", "Prompt Engineering"],
    description: "Push the boundaries of what's possible when AI meets ad performance data. Work directly with Claude and custom fine-tuned models.",
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1.5px solid #E8E5E0", fontSize: 14,
  fontFamily: "var(--font-inter)", color: "#0D0D12",
  background: "#F7F5F2", outline: "none",
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

export default function JoinPage() {
  const [form, setForm] = useState({ name: "", email: "", role: "", linkedin: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apply", {
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
    <div style={{ background: "#FAF8F5", minHeight: "100vh" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,248,245,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8E5E0",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>A</span>
          </div>
          <span className="font-heading" style={{ fontSize: 17, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.03em" }}>
            Adur<span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/about" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>About</Link>
          <Link href="/investors" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>Investors</Link>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", padding: "8px 18px", borderRadius: 100, textDecoration: "none", fontFamily: "var(--font-inter)" }}>
            Try free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "88px 24px 64px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, background: "rgba(255,60,172,0.07)", border: "1px solid rgba(255,60,172,0.18)", borderRadius: 100, padding: "6px 16px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF3CAC", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FF3CAC", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>
            {OPEN_ROLES.length} open roles
          </span>
        </div>

        <h1 className="font-heading" style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 20 }}>
          Join the team building<br />
          <span style={{ background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            the future of paid media
          </span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: "#6B6B72", lineHeight: 1.7, maxWidth: 520, margin: "0 auto", fontFamily: "var(--font-inter)" }}>
          We&apos;re a small, ambitious team. If you care about AI, paid media, and making a real impact for thousands of brands — you belong here.
        </p>
      </section>

      {/* ── Perks strip ── */}
      <section style={{ background: "#0D0D12", padding: "40px 24px", marginBottom: 80 }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8" style={{ textAlign: "center" }}>
          {[
            { value: "100%", label: "Remote" },
            { value: "Equity", label: "For everyone" },
            { value: "Small", label: "Tight-knit team" },
            { value: "Real", label: "Impact on brands" },
          ].map(s => (
            <div key={s.value}>
              <div className="font-heading" style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Open roles ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 64px" }}>
        <h2 className="font-heading" style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 32 }}>
          Open roles
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 56 }}>
          {OPEN_ROLES.map(role => (
            <div key={role.title} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 18, padding: "24px 28px" }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3" style={{ marginBottom: 10 }}>
                <div>
                  <div className="font-heading" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#0D0D12", marginBottom: 4 }}>{role.title}</div>
                  <div style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>{role.type}</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {role.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 600, color: "#FF3CAC", background: "rgba(255,60,172,0.08)", padding: "3px 10px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>{t}</span>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.65, fontFamily: "var(--font-inter)" }}>{role.description}</p>
            </div>
          ))}
        </div>

        {/* Apply form */}
        <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 22, padding: "36px 32px" }}>
          <h3 className="font-heading" style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#0D0D12", marginBottom: 6 }}>Apply now</h3>
          <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 28 }}>
            Don&apos;t see a perfect fit? Send us a message — we hire for talent first.
          </p>

          {sent ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(22,163,74,0.10)", border: "1px solid rgba(22,163,74,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22, color: "#16A34A" }}>✓</div>
              <div className="font-heading" style={{ fontSize: 20, fontWeight: 800, color: "#0D0D12", marginBottom: 8 }}>Application received!</div>
              <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>We&apos;ll be in touch within 48 hours if there&apos;s a fit.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name", placeholder: "Full name", type: "text" },
                  { key: "email", placeholder: "Email address", type: "email" },
                ].map(f => (
                  <input key={f.key} type={f.type} required placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                ))}
              </div>
              <input type="text" placeholder="Role you're applying for (or 'General interest')"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <input type="url" placeholder="LinkedIn or portfolio URL"
                value={form.linkedin}
                onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <textarea rows={4} required placeholder="Tell us about yourself — what have you built? What do you care about?"
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                style={{ ...inputStyle, resize: "none" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {error && (
                <p style={{ fontSize: 13, color: "#e17055", background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.20)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", textAlign: "center" }}>
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} style={{ ...submitStyle, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending…" : "Send application →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{ background: "#0D0D12", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-inter)" }}>
          © {new Date().getFullYear()} Adur.ai ·{" "}
          <Link href="/about" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>About</Link>
          {" · "}
          <Link href="/investors" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Investors</Link>
          {" · "}
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Privacy</Link>
        </p>
      </div>

    </div>
  );
}
