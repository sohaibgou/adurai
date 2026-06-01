"use client";

import { Sparkles, VolumeX } from "lucide-react";
import FadeIn from "@/components/fade-in";

/* ──────────────────────────────────────────────────────────────────────────
   UGC VIDEO SHOWCASE — animated right-to-left marquee
   Real generated ads in /public/showcase/ugc/ (ugc-1..ugc-5 .mp4 + .jpg poster),
   spanning English, Khaleeji Arabic, Spanish and Moroccan Darija to show off
   the multi-language / multi-dialect output.
   Videos autoplay muted + loop (required for mobile inline playback).
   ────────────────────────────────────────────────────────────────────────── */

interface UgcCard {
  src:      string;
  poster:   string;
  category: string;
  caption:  string;
}

const CARDS: UgcCard[] = [
  { src: "/showcase/ugc/ugc-1.mp4", poster: "/showcase/ugc/ugc-1.jpg", category: "English",        caption: "Founder-Led Brand Promo" },
  { src: "/showcase/ugc/ugc-2.mp4", poster: "/showcase/ugc/ugc-2.jpg", category: "Khaleeji Arabic", caption: "Anti-Dark-Spot Face Cream" },
  { src: "/showcase/ugc/ugc-3.mp4", poster: "/showcase/ugc/ugc-3.jpg", category: "Spanish",        caption: "Anti-Acne Skin Treatment" },
  { src: "/showcase/ugc/ugc-4.mp4", poster: "/showcase/ugc/ugc-4.jpg", category: "Moroccan Darija", caption: "Hair-Growth Shampoo" },
  { src: "/showcase/ugc/ugc-5.mp4", poster: "/showcase/ugc/ugc-5.jpg", category: "Khaleeji Arabic", caption: "Luxury Men's Fragrance" },
];

function Card({ card }: { card: UgcCard }) {
  return (
    <div
      className="relative overflow-hidden flex-shrink-0"
      style={{
        width: "clamp(165px, 44vw, 300px)",
        aspectRatio: "9 / 16",
        borderRadius: 20,
        background: "#111114",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
      }}
    >
      <video
        src={card.src}
        poster={card.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover" }}
      />

      {/* Top gradient + category badge */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ height: 90, background: "linear-gradient(180deg, rgba(0,0,0,0.55), transparent)" }}
      />
      <div
        className="absolute flex items-center gap-1.5"
        style={{
          top: 12, left: 12,
          padding: "5px 10px",
          borderRadius: 100,
          background: "rgba(8,8,10,0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", fontFamily: "var(--font-inter)" }}>{card.category}</span>
      </div>

      {/* Bottom gradient + caption + mute */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: 110, background: "linear-gradient(0deg, rgba(0,0,0,0.78), transparent)" }}
      />
      <div className="absolute flex items-end justify-between gap-2" style={{ left: 14, right: 14, bottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.3, fontFamily: "var(--font-inter)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          {card.caption}
        </span>
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(8,8,10,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <VolumeX style={{ width: 14, height: 14, color: "#fff" }} />
        </span>
      </div>
    </div>
  );
}

export default function UgcShowcase() {
  // Duplicate the set so the -50% translate loops seamlessly.
  const loop = [...CARDS, ...CARDS];

  return (
    <section className="relative pt-12 pb-12 overflow-hidden" style={{ background: "#08080A" }}>
      {/* Faint grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%)",
        }}
      />
      {/* Brand glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 45% at 50% 45%, rgba(255,60,172,0.09) 0%, transparent 72%)" }}
      />

      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <Sparkles style={{ width: 13, height: 13, color: "#22c55e" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#22c55e" }}>
                  100% AI-Generated Videos
                </span>
              </div>
              <h2 className="font-heading" style={{ fontSize: "clamp(34px, 4.6vw, 58px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1.05 }}>
                UGC That Actually Converts.{" "}
                <span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", whiteSpace: "nowrap" }}>
                  Made by AI.
                </span>
              </h2>
              <p style={{ fontSize: 17, color: "#9ca3af", marginTop: 18, maxWidth: 560, margin: "18px auto 0", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                Real ads created by our platform — in any language or dialect, from Khaleeji Arabic to Spanish. No creators. No shoots. Just describe what you sell.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Marquee — right to left, centered max-width, edge-faded, pauses on hover */}
        <div
          className="ugc-marquee"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            overflow: "hidden",
            maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
          }}
        >
          <div className="ugc-track flex" style={{ gap: 24, width: "max-content" }}>
            {loop.map((card, i) => (
              <Card key={`${card.caption}-${i}`} card={card} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ugcMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ugc-track {
          animation: ugcMarquee 45s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .ugc-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
