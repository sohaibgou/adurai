"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_MESSAGES = [
  "Parsing your campaign data...",
  "Running AI analysis...",
  "Identifying profit leaks...",
  "Building your 7-day plan...",
  "Finalizing recommendations...",
];

export default function SkeletonDashboard() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  /* Rotate status messages every 2s */
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /* Animate progress bar smoothly from 0→92% over ~10s, last 8% saved for completion */
  useEffect(() => {
    const start = Date.now();
    const duration = 10000;
    const maxProgress = 92;

    function tick() {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased * maxProgress);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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
          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #6c5ce7, #a855f7)" }}
            >
              A
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
              Adur<span style={{ color: "#6c5ce7" }}>.ai</span>
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
                background: "linear-gradient(90deg, #6c5ce7, #a855f7, #6c5ce7)",
                backgroundSize: "200% 100%",
              }}
              animate={{
                width: `${progress}%`,
                backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
              }}
              transition={{
                width: { duration: 0.3, ease: "easeOut" },
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

        {/* Subtle bottom tagline */}
        <p className="mt-10 text-xs" style={{ color: "#cbd5e1" }}>
          Powered by GPT-4o · Analyzing your campaigns
        </p>
      </div>
    </div>
  );
}
