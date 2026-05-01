"use client";

import { useState, useEffect } from "react";

export default function SiteFooter() {
  const [year, setYear] = useState(2026);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);

  return (
    <footer
      style={{
        borderTop: "1px solid #f0f0f5",
        background: "#ffffff",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6"
        style={{ paddingTop: 28, paddingBottom: 28 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center font-bold text-white"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "linear-gradient(135deg, #6c5ce7, #00cec9)",
                fontSize: 13,
              }}
            >
              A
            </div>
            <span
              className="font-heading font-bold"
              style={{ fontSize: 16, color: "#0a0a0f", letterSpacing: "-0.02em" }}
            >
              Adur<span style={{ color: "#6c5ce7" }}>.ai</span>
            </span>
          </div>

          {/* Center links */}
          <div className="flex items-center gap-8">
            {["How it works", "Pricing", "Privacy", "Terms"].map((link) => (
              <span
                key={link}
                className="cursor-pointer transition-colors duration-150"
                style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-inter)", fontWeight: 400 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.color = "#0a0a0f";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.color = "#6b7280";
                }}
              >
                {link}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-inter)", fontWeight: 400 }}>
            © {year} Adur.ai · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
