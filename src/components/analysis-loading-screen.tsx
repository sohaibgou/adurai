"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Parsing your campaign data...",
  "Calculating profit leaks...",
  "Identifying winning campaigns...",
  "Building your 7-Day Battle Plan...",
  "Generating ad copy recommendations...",
  "Finalizing your complete audit...",
];

function speedFor(p: number): number {
  if (p < 20) return 0.85;   // fast — parsing
  if (p < 60) return 0.40;   // medium — AI analysis
  if (p < 90) return 0.13;   // slow — building recommendations
  return 0.022;               // very slow — waiting for API
}

interface Props {
  /** Controls overall visibility of the overlay */
  visible: boolean;
  /** True while the API call is still running; false when done (success or error handled by parent) */
  active: boolean;
  /** Called after the 100% animation completes — parent does router.push('/results') here */
  onComplete: () => void;
}

export default function AnalysisLoadingScreen({ visible, active, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx]     = useState(0);
  const [completing, setCompleting] = useState(false);
  const doneRef      = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep the latest onComplete callback without reading/writing a ref during render
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Reset when overlay becomes visible again
  useEffect(() => {
    if (visible) {
      doneRef.current = false;
      // Reset the overlay's animation state each time it re-opens; must run in an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);
      setMsgIdx(0);
      setCompleting(false);
    }
  }, [visible]);

  // Progress ticker — runs while visible and API is active
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      if (doneRef.current) return;
      setProgress(prev => {
        const next = Math.min(prev + speedFor(prev), 99);
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [visible]);

  // Message rotation
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setMsgIdx(p => (p + 1) % MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, [visible]);

  // When API finishes (active→false while visible), jump to 100% then navigate
  useEffect(() => {
    if (!active && visible && !doneRef.current) {
      doneRef.current = true;
      // Reacting to the API finishing (active→false): snap the ring to 100% then navigate.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(100);
      setMsgIdx(MESSAGES.length - 1); // "Finalizing your complete audit..."
      setCompleting(true);
      const t = setTimeout(() => onCompleteRef.current(), 900);
      return () => clearTimeout(t);
    }
  }, [active, visible]);

  if (!visible) return null;

  // SVG ring math
  const R    = 54;
  const CX   = 80;
  const CY   = 80;
  const circ = 2 * Math.PI * R;
  const dash = circ * (1 - progress / 100);
  const isCompleting = completing;

  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "#ffffff" }}
    >
      <div className="flex flex-col items-center gap-10 w-full max-w-xs px-8">

        {/* ── Logo with pulse ── */}
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/logo-black.svg"
            alt="Adur.ai"
            style={{ height: 36, width: "auto" }}
          />
        </motion.div>

        {/* ── Circular progress ring ── */}
        <div className="relative" style={{ width: 160, height: 160 }}>
          <svg width={160} height={160} viewBox="0 0 160 160" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3CAC" />
                <stop offset="100%" stopColor="#FF6B35" />
              </linearGradient>
              <filter id="ring-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Track ring */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke="#F0EDE8"
              strokeWidth={9}
            />
            {/* Progress ring */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke="url(#ring-gradient)"
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              transform={`rotate(-90 ${CX} ${CY})`}
              filter="url(#ring-glow)"
              style={{
                transition: isCompleting
                  ? "stroke-dashoffset 0.75s cubic-bezier(0.22,1,0.36,1)"
                  : "stroke-dashoffset 0.12s linear",
              }}
            />
          </svg>

          {/* Percentage in ring center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="font-heading font-black"
              style={{
                fontSize: 36,
                letterSpacing: "-0.05em",
                color: "#0d0d1a",
                lineHeight: 1,
                background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        </div>

        {/* ── Rotating status message ── */}
        <div style={{ height: 26, overflow: "hidden", width: "100%", textAlign: "center" }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{
                fontSize: 14,
                color: "#6b7280",
                fontFamily: "var(--font-inter)",
                fontWeight: 500,
                lineHeight: "26px",
              }}
            >
              {MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── Linear progress bar ── */}
        <div style={{ width: "100%", height: 5, borderRadius: 100, background: "#F0EDE8", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 100,
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF3CAC, #FF6B35)",
              transition: isCompleting
                ? "width 0.75s cubic-bezier(0.22,1,0.36,1)"
                : "width 0.12s linear",
              boxShadow: "0 0 8px rgba(255,60,172,0.45)",
            }}
          />
        </div>

        {/* ── Footer text ── */}
        <div className="text-center" style={{ marginTop: -4 }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)", fontWeight: 500, letterSpacing: "0.01em" }}>
            Powered by Adur AI · Analyzing your campaigns
          </p>
          <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 5, fontFamily: "var(--font-inter)" }}>
            Usually ready in 20–30 seconds
          </p>
        </div>

      </div>
    </motion.div>
  );
}
