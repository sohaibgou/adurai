"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works",    scrollTo: "how-it-works" },
      { label: "Features",        scrollTo: "features" },
      { label: "Pricing",         scrollTo: "pricing" },
      { label: "Dashboard",       href: "/dashboard" },
      { label: "Creative Studio", href: "/creative-studio" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us",  href: "/about" },
      { label: "Join us",   href: "/join" },
      { label: "Investors", href: "/investors" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of use",   href: "/terms" },
    ],
  },
];

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/adurai.app/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61589663770621",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
];

function FooterLink({ label, href, scrollTo }: { label: string; href?: string; scrollTo?: string }) {
  const base: React.CSSProperties = {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    fontFamily: "var(--font-inter)",
    fontWeight: 400,
    textDecoration: "none",
    transition: "color 0.15s",
    cursor: "pointer",
    display: "inline-block",
  };
  const enter = (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; };
  const leave = (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; };

  if (href) {
    return <Link href={href} style={base} onMouseEnter={enter} onMouseLeave={leave}>{label}</Link>;
  }
  return (
    <span style={base} onMouseEnter={enter} onMouseLeave={leave}
      onClick={() => document.getElementById(scrollTo!)?.scrollIntoView({ behavior: "smooth" })}>
      {label}
    </span>
  );
}

export default function SiteFooter() {
  const [year, setYear] = useState(2026);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);

  return (
    <footer style={{ background: "#0D0D12", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 48 }}>

        {/* ── Top row — logo + columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8" style={{ paddingBottom: 48, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", marginBottom: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logomark-white-clean.svg" alt="Adur.ai" style={{ height: 72, width: "auto" }} />
            </Link>

            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.40)", fontFamily: "var(--font-inter)", lineHeight: 1.65, maxWidth: 220, marginBottom: 24 }}>
              The AI that runs your Meta Ads — so you can focus on building your brand.
            </p>

            {/* Socials */}
            <div style={{ display: "flex", gap: 10 }}>
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.45)",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(255,60,172,0.18)";
                    el.style.color = "#FF3CAC";
                    el.style.borderColor = "rgba(255,60,172,0.40)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(255,255,255,0.06)";
                    el.style.color = "rgba(255,255,255,0.45)";
                    el.style.borderColor = "rgba(255,255,255,0.10)";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map(col => (
            <div key={col.heading}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-inter)", marginBottom: 16 }}>
                {col.heading}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ paddingTop: 28 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-inter)" }}>
            © {year} Adur.ai — All rights reserved
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A", display: "inline-block", boxShadow: "0 0 6px rgba(22,163,74,0.7)" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-inter)" }}>
              All systems operational
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-inter)" }}>
            Built for DTC brands
          </p>
        </div>

      </div>
    </footer>
  );
}
