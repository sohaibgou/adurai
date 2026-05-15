"use client";

import { useState, useEffect } from "react";

export default function SiteFooter() {
  const [year, setYear] = useState(2026);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);

  return (
    <footer style={{ background: "#0d0d1a", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center font-bold text-white"
              style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #6c5ce7, #e040fb)", fontSize: 13 }}
            >
              A
            </div>
            <span className="font-heading font-bold" style={{ fontSize: 16, color: "#ffffff", letterSpacing: "-0.02em" }}>
              Adur<span style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>.ai</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            {["How it works", "Pricing", "Privacy", "Terms"].map(link => (
              <span
                key={link}
                className="cursor-pointer transition-colors duration-150"
                style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)", fontWeight: 400 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.85)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.4)"; }}
              >
                {link}
              </span>
            ))}
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
