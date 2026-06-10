"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import HeroSection from "@/components/landing/hero-section";
import SocialProof from "@/components/landing/social-proof";
import DashboardPreview from "@/components/landing/dashboard-preview";
import FeaturesSection from "@/components/landing/features-section";
import AdImageShowcase from "@/components/landing/ad-image-showcase";
import UgcShowcase from "@/components/landing/ugc-showcase";
import HowItWorks from "@/components/landing/how-it-works";
import PricingSection from "@/components/landing/pricing-section";
import CtaSection from "@/components/landing/cta-section";
import { useAuth } from "@/context/auth-context";
import { MetaPixel } from "@/lib/meta-pixel";

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    document.title = "Adur.ai — AI Meta Ads Analysis for E-commerce";
    MetaPixel.track("ViewContent", {
      content_name: "Adur.ai Homepage",
      content_category: "SaaS",
    });
  }, []);

  // Logged-in users go straight to the dashboard; everyone else signs up.
  const goStart = () => router.push(user ? "/dashboard" : "/signup");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen overflow-x-clip"
      style={{ background: "#FAF8F5" }}
    >
      {/* ── Nav wrapper — sticky floating pill ── */}
      <div className="sticky z-50 px-5" style={{ top: 12 }}>
        <nav
          className="flex items-center justify-between"
          style={{
            height:                 68,
            background:             "rgba(255,255,255,0.72)",
            backdropFilter:         "blur(20px) saturate(180%)",
            WebkitBackdropFilter:   "blur(20px) saturate(180%)",
            borderRadius:           22,
            border:                 "1px solid #E8E5E0",
            boxShadow:              "0 4px 20px rgba(13,13,18,0.04), 0 1px 3px rgba(13,13,18,0.03)",
            padding:                "0 28px",
            maxWidth:               1200,
            margin:                 "0 auto",
          }}
        >
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 36, width: "auto" }} />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "HOW IT WORKS", id: "how-it-works" },
              { label: "FEATURES",     id: "features" },
              { label: "PRICING",      id: "pricing" },
            ].map(({ label, id }) => (
              <span
                key={label}
                className="cursor-pointer"
                style={{ fontSize: 11, color: "#4B4B55", fontWeight: 700, fontFamily: "var(--font-inter)", letterSpacing: "0.09em", transition: "color 0.15s", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#0D0D12"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = "#4B4B55"; }}
                onClick={() => {
                  const el = document.getElementById(id);
                  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {!loading && (
            user ? (
              /* ── Logged-in nav ── */
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="hidden md:flex items-center gap-2 pr-2">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 28, height: 28, background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", boxShadow: "0 2px 8px rgba(255,60,172,0.35)" }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1, fontFamily: "var(--font-inter)" }}>
                      {(user.email?.[0] ?? "U").toUpperCase()}
                    </span>
                  </div>
                  <span
                    className="max-w-[128px] truncate"
                    style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-inter)", fontWeight: 500 }}
                  >
                    {user.email}
                  </span>
                </div>
                <div className="hidden md:block w-px h-4 mx-1" style={{ background: "rgba(0,0,0,0.10)" }} />
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center cursor-pointer transition-colors"
                  style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, fontFamily: "var(--font-inter)", background: "none", border: "none", padding: "6px 10px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#0d0d1a"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
                >
                  Dashboard
                </button>
                <button
                  onClick={async () => { await signOut(); }}
                  className="inline-flex items-center cursor-pointer transition-colors"
                  style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, fontFamily: "var(--font-inter)", background: "none", border: "none", padding: "6px 10px" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* ── Logged-out nav ── */
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <Link
                  href="/login"
                  className="inline-flex items-center font-semibold cursor-pointer"
                  style={{
                    fontSize:      13,
                    color:         "#4B4B55",
                    background:    "none",
                    border:        "none",
                    padding:       "8px 12px",
                    textDecoration: "none",
                    fontFamily:    "var(--font-inter)",
                    letterSpacing: "0.02em",
                    transition:    "color 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#0D0D12"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#4B4B55"; }}
                >
                  LOG IN
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 font-semibold text-white cursor-pointer"
                  style={{
                    fontSize:      14,
                    background:   "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                    border:       "none",
                    padding:      "10px 18px",
                    borderRadius:  100,
                    fontFamily:   "var(--font-inter)",
                    textDecoration: "none",
                    boxShadow:    "0 3px 16px rgba(255, 60, 172, 0.30)",
                    transition:   "opacity 0.15s, transform 0.15s",
                    letterSpacing: "-0.01em",
                    whiteSpace:   "nowrap",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
                >
                  Start Free →
                </Link>
              </div>
            )
          )}
        </nav>
      </div>

      <HeroSection onCtaClick={goStart} />

      <SocialProof />
      <DashboardPreview />
      <HowItWorks />
      <FeaturesSection />
      <UgcShowcase />
      <AdImageShowcase />
      <PricingSection onCtaClick={goStart} />
      <CtaSection onCtaClick={goStart} />

    </motion.div>
  );
}
