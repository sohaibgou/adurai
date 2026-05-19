"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const LINKS: Array<{ label: string; href?: string; scrollTo?: string }> = [
  { label: "How it works", scrollTo: "how-it-works" },
  { label: "Pricing",      scrollTo: "pricing" },
  { label: "Privacy",      href: "/privacy" },
  { label: "Terms",        href: "/terms" },
];

export default function SiteFooter() {
  const [year, setYear] = useState(2026);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);

  return (
    <footer style={{ background: "#0d0d1a", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              className="flex items-center justify-center font-bold text-white"
              style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", fontSize: 13 }}
            >
              A
            </div>
            <span className="font-heading font-bold" style={{ fontSize: 16, color: "#ffffff", letterSpacing: "-0.02em" }}>
              Adur<span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8">
            {LINKS.map(({ label, href, scrollTo }) =>
              href ? (
                <Link
                  key={label}
                  href={href}
                  style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)", fontWeight: 400, textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)"; }}
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={label}
                  className="cursor-pointer"
                  style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)", fontWeight: 400, transition: "color 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.4)"; }}
                  onClick={() => { document.getElementById(scrollTo!)?.scrollIntoView({ behavior: "smooth" }); }}
                >
                  {label}
                </span>
              )
            )}
          </div>

          {/* Copyright */}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-inter)" }}>
            © {year} Adur.ai
          </p>
        </div>
      </div>
    </footer>
  );
}
