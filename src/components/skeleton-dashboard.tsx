"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_MESSAGES = [
  "Analyzing campaign performance...",
  "Calculating your profit leaks...",
  "Identifying winning campaigns...",
  "Building your 7-day plan...",
  "Generating ad copy recommendations...",
  "Finalizing your complete audit...",
];

export default function SkeletonDashboard() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showTip, setShowTip] = useState(false);

  // Rotate status messages every 3 seconds, cycling back to start
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Show tip after 10 seconds
  useEffect(() => {
    const tipTimer = setTimeout(() => setShowTip(true), 10_000);
    return () => clearTimeout(tipTimer);
  }, []);

  // Two-phase progress:
  // Phase 1 — ease-out from 0→92% over 10s (fast initial momentum)
  // Phase 2 — creep from 92→99% over 20s (always moving, never stalls)
  useEffect(() => {
    const start = Date.now();
    const phase1Duration = 10_000;
    const phase2Duration = 20_000;
    let raf: number;

    function tick() {
      const elapsed = Date.now() - start;

      let p: number;
      if (elapsed < phase1Duration) {
        const t = elapsed / phase1Duration;
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        p = eased * 92;
      } else {
        const t = Math.min((elapsed - phase1Duration) / phase2Duration, 1);
        const eased = 1 - Math.pow(1 - t, 2); // ease-out quadratic (slower creep)
        p = 92 + eased * 7; // 92→99
      }

      setProgress(p);

      // Keep ticking until 99 — 100% only fires when real response arrives
      if (p < 99) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "#f8f8fc" }}>
      <div className="flex flex-col items-center w-full max-w-md px-6">

        {/* Pulsing glow behind logo */}
        <div className="relative mb-8">
          <div
            className="absolute inset-0 rounded-full blur-2xl animate-pulse"
            style={{
              background: "radial-gradient(circle, rgba(108,92,231,0.25) 0%, rgba(108,92,231,0) 70%)",
              width: 120,
              height: 120,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)" }}
            >
              A
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
              Adur<span style={{ color: "#FF3CAC" }}>.ai</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full mb-6">
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "#e2e8f0" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #FF3CAC, #FF6B35, #FF3CAC)",
                backgroundSize: "200% 100%",
              }}
              animate={{
                width: `${progress}%`,
                backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
              }}
              transition={{
                width: { duration: 0.4, ease: "easeOut" },
                backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
              }}
            />
          </div>
          <div className="flex justify-end mt-1.5">
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Rotating status messages */}
        <div className="h-7 relative w-full flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-medium absolute"
              style={{ color: "#64748b" }}
            >
              {STATUS_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Tip — fades in after 10s */}
        <div className="mt-8 h-10 flex items-center justify-center">
          <AnimatePresence>
            {showTip && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-xs text-center leading-relaxed max-w-xs"
                style={{ color: "#94a3b8" }}
              >
                <span style={{ color: "#FF3CAC", fontWeight: 500 }}>Tip:</span> Adur is analyzing every campaign against your break-even ROAS. This takes 20–30 seconds for a thorough analysis.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom tagline */}
        <p className="mt-6 text-xs" style={{ color: "#cbd5e1" }}>
          Adur is analyzing your campaigns
        </p>
      </div>
    </div>
  );
}
