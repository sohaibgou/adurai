"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import FadeIn from "@/components/fade-in";

/* ──────────────────────────────────────────────────────────────────────────
   AD IMAGE CREATIVE SHOWCASE
   Drop real 1:1 files into /public/showcase/ads/ using these names (or edit below):
     ad-1.jpg ... ad-4.jpg   (square, ~1080×1080)
   ────────────────────────────────────────────────────────────────────────── */

interface AdCard {
  src:      string;
  category: string;
  caption:  string;
}

// Filenames carry a version suffix (-v3) so regenerated creatives get a fresh URL
// and bypass the browser + Next image cache. Bump the suffix when you regenerate.
// One cohesive demo brand ("Adur" skincare serum) shown across the four proven
// Meta ad angles — the kind of campaign a $1M DTC brand would run.
const CARDS: AdCard[] = [
  { src: "/showcase/ads/ad-1-v3.jpg", category: "Hero Shot",        caption: "Adur — Glow Serum" },
  { src: "/showcase/ads/ad-2-v3.jpg", category: "Social Proof",     caption: "Loved by 12,000+" },
  { src: "/showcase/ads/ad-3-v3.jpg", category: "Lifestyle",        caption: "Skin That Loves You Back" },
  { src: "/showcase/ads/ad-4-v3.jpg", category: "Pattern Interrupt", caption: "The Glow Drop" },
];

export default function AdImageShowcase() {
  return (
    <section className="relative pt-12 pb-28 px-6 overflow-hidden" style={{ background: "#08080A" }}>
      {/* Faint grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, #000 30%, transparent 75%)",
        }}
      />
      {/* Brand glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 45% at 50% 45%, rgba(255,107,53,0.09) 0%, transparent 72%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,107,53,0.10)", border: "1px solid rgba(255,107,53,0.25)" }}
            >
              <ImageIcon style={{ width: 13, height: 13, color: "#FF6B35" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FF6B35" }}>
                100% AI-Generated Images
              </span>
            </div>
            <h2 className="font-heading" style={{ fontSize: "clamp(34px, 4.6vw, 58px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1.05 }}>
              Scroll-Stopping Ad Creatives.{" "}
              <span style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", whiteSpace: "nowrap" }}>
                Generated Instantly.
              </span>
            </h2>
            <p style={{ fontSize: 17, color: "#9ca3af", marginTop: 18, maxWidth: 520, margin: "18px auto 0", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
              Agency-grade Meta feed ads in seconds. Four proven angles, perfect copy, every language — just describe your product.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CARDS.map((card, i) => (
            <FadeIn key={card.caption} delay={0.05 * i}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 20,
                  background: "#111114",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                }}
              >
                <Image
                  src={card.src}
                  alt={card.caption}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />

                {/* Top gradient + category badge */}
                <div
                  className="absolute top-0 left-0 right-0 pointer-events-none"
                  style={{ height: 80, background: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent)" }}
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
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6B35", boxShadow: "0 0 6px #FF6B35" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#FF6B35", fontFamily: "var(--font-inter)" }}>{card.category}</span>
                </div>

                {/* Bottom gradient + caption */}
                <div
                  className="absolute bottom-0 left-0 right-0 pointer-events-none"
                  style={{ height: 90, background: "linear-gradient(0deg, rgba(0,0,0,0.72), transparent)" }}
                />
                <span
                  className="absolute"
                  style={{ left: 14, bottom: 14, fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-inter)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
                >
                  {card.caption}
                </span>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
