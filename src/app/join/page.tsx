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

const INVESTOR_REASONS = [
  { icon: "◐", title: "Massive, underserved market", body: "10M+ active Meta advertisers. Most are flying blind. We give them a senior media buyer on demand." },
  { icon: "⌁", title: "AI-native from day one", body: "Not a dashboard with AI bolted on. The entire product is designed around AI reasoning about ad performance." },
  { icon: "✦", title: "Strong early traction", body: "1,240+ brands in the first months. Organic growth through word-of-mouth from media buyers who actually use it." },
  { icon: "○", title: "Deep domain expertise", body: "$70M+ in managed ad spend. We know this space from the inside — every feature solves a real, painful problem." },
];

export default function JoinPage() {
  const [investorForm, setInvestorForm] = useState({ name: "", email: "", fund: "", message: "" });
  const [investorSent, setInvestorSent] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", email: "", role: "", linkedin: "", message: "" });
  const [roleSent, setRoleSent] = useState(false);

  function handleInvestorSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to backend
    setInvestorSent(true);
  }

  function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to backend
    setRoleSent(true);
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
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", padding: "8px 18px", borderRadius: 100, textDecoration: "none", fontFamily: "var(--font-inter)" }}>
            Try free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "88px 24px 64px", textAlign: "center" }}>
        <h1 className="font-heading" style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#0D0D12", marginBottom: 20 }}>
          Build the future of<br />
          <span style={{ background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            performance marketing
          </span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: "#6B6B72", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 32px", fontFamily: "var(--font-inter)" }}>
          We&apos;re a small, ambitious team. If you care about AI, paid media, and making a real impact for thousands of brands — you belong here.
        </p>

        {/* Quick jump links */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#open-roles" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 100, background: "#0D0D12", color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none", fontFamily: "var(--font-inter)" }}>
            Open roles
          </a>
          <a href="#investors" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 100, border: "1.5px solid #E2E0DA", background: "#fff", color: "#0D0D12", fontWeight: 600, fontSize: 14, textDecoration: "none", fontFamily: "var(--font-inter)" }}>
            Investor enquiries
          </a>
        </div>
      </section>

      {/* ── Open roles ── */}
      <section id="open-roles" style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <h2 className="font-heading" style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12" }}>
            Open roles
          </h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", background: "rgba(22,163,74,0.10)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
            {OPEN_ROLES.length} open
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 48 }}>
          {OPEN_ROLES.map(role => (
            <div key={role.title} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 18, padding: "24px 28px", transition: "box-shadow 0.15s" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ marginBottom: 10 }}>
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

          {roleSent ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div className="font-heading" style={{ fontSize: 20, fontWeight: 800, color: "#0D0D12", marginBottom: 8 }}>Application received!</div>
              <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>We&apos;ll be in touch within 48 hours if there&apos;s a fit.</p>
            </div>
          ) : (
            <form onSubmit={handleRoleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name", placeholder: "Full name", type: "text" },
                  { key: "email", placeholder: "Email address", type: "email" },
                ].map(f => (
                  <input
                    key={f.key}
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    value={roleForm[f.key as keyof typeof roleForm]}
                    onChange={e => setRoleForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                ))}
              </div>
              <input
                type="text"
                placeholder="Role you're applying for (or 'General interest')"
                value={roleForm.role}
                onChange={e => setRoleForm(p => ({ ...p, role: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <input
                type="url"
                placeholder="LinkedIn or portfolio URL"
                value={roleForm.linkedin}
                onChange={e => setRoleForm(p => ({ ...p, linkedin: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <textarea
                rows={4}
                placeholder="Tell us about yourself — what have you built? What do you care about?"
                value={roleForm.message}
                required
                onChange={e => setRoleForm(p => ({ ...p, message: e.target.value }))}
                style={{ ...inputStyle, resize: "none" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.10)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button type="submit" style={submitStyle}>
                Send application →
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Investors ── */}
      <section id="investors" style={{ background: "#0D0D12", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "rgba(255,60,172,0.12)", border: "1px solid rgba(255,60,172,0.25)", borderRadius: 100, padding: "6px 16px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF3CAC", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FF3CAC", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>Investors</span>
          </div>

          <h2 className="font-heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", marginBottom: 16 }}>
            Are you an investor?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.50)", fontFamily: "var(--font-inter)", lineHeight: 1.7, maxWidth: 560, marginBottom: 56 }}>
            We&apos;re building the AI operating system for paid media. If that excites you, let&apos;s talk.
          </p>

          {/* Why invest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ marginBottom: 64 }}>
            {INVESTOR_REASONS.map(r => (
              <div key={r.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px" }}>
                <div style={{ fontSize: 20, color: "#FF3CAC", marginBottom: 12 }}>{r.icon}</div>
                <div className="font-heading" style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>{r.title}</div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", lineHeight: 1.65, fontFamily: "var(--font-inter)" }}>{r.body}</p>
              </div>
            ))}
          </div>

          {/* Investor contact form */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 22, padding: "36px 32px" }}>
            <h3 className="font-heading" style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginBottom: 6 }}>Get in touch</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.40)", fontFamily: "var(--font-inter)", marginBottom: 28 }}>
              We reply to every investor enquiry within 24 hours.
            </p>

            {investorSent ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div className="font-heading" style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Message received!</div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)" }}>We&apos;ll reach out within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleInvestorSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "name", placeholder: "Your name", type: "text" },
                    { key: "email", placeholder: "Email address", type: "email" },
                  ].map(f => (
                    <input
                      key={f.key}
                      type={f.type}
                      required
                      placeholder={f.placeholder}
                      value={investorForm[f.key as keyof typeof investorForm]}
                      onChange={e => setInvestorForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={darkInputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.15)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Fund or firm name (optional)"
                  value={investorForm.fund}
                  onChange={e => setInvestorForm(p => ({ ...p, fund: e.target.value }))}
                  style={darkInputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.15)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your thesis and what you look for in investments."
                  value={investorForm.message}
                  onChange={e => setInvestorForm(p => ({ ...p, message: e.target.value }))}
                  style={{ ...darkInputStyle, resize: "none" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(255,60,172,0.15)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="submit" style={submitStyle}>
                  Send investor enquiry →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div style={{ background: "#0D0D12", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-inter)" }}>
          © {new Date().getFullYear()} Adur.ai ·{" "}
          <Link href="/about" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>About</Link>
          {" · "}
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Privacy</Link>
          {" · "}
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.30)", textDecoration: "none" }}>Terms</Link>
        </p>
      </div>

    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1.5px solid #E8E5E0", fontSize: 14,
  fontFamily: "var(--font-inter)", color: "#0D0D12",
  background: "#F7F5F2", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const darkInputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1.5px solid rgba(255,255,255,0.12)", fontSize: 14,
  fontFamily: "var(--font-inter)", color: "#fff",
  background: "rgba(255,255,255,0.06)", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const submitStyle: React.CSSProperties = {
  padding: "14px", borderRadius: 100, border: "none", cursor: "pointer",
  background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
  color: "#fff", fontWeight: 700, fontSize: 15,
  fontFamily: "var(--font-inter)", letterSpacing: "-0.01em",
  boxShadow: "0 4px 20px rgba(255,60,172,0.35)", transition: "opacity 0.15s",
};
