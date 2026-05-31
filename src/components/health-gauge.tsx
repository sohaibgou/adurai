"use client";

import { useEffect, useState } from "react";

interface HealthGaugeProps {
  score: number;
}

export default function HealthGauge({ score }: HealthGaugeProps) {
  const [animated, setAnimated] = useState(0);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const percentage = animated / 10;
  const offset = circumference * (1 - percentage);

  const color =
    score >= 7 ? "#00b894" : score >= 4 ? "#fdcb6e" : "#e17055";
  const trackColor =
    score >= 7 ? "#e6faf6" : score >= 4 ? "#fff8e6" : "#fdf0ed";
  const label =
    score >= 7 ? "Healthy" : score >= 4 ? "Needs Work" : "Critical";

  useEffect(() => {
    const duration = 1400;
    const startTime = performance.now();

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Reduced-motion users skip the animation and jump straight to the final value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimated(score);
      return;
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(eased * score);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3 flex-shrink-0">
      <div className="relative" style={{ width: 140, height: 140 }}>
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
          }}
        />

        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="9"
          />
          {/* Progress */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.05s ease" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-heading font-bold leading-none"
            style={{
              fontSize: 34,
              letterSpacing: "-0.04em",
              color,
              fontFamily: "var(--font-syne)",
            }}
          >
            {Math.round(animated)}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
              fontWeight: 500,
              marginTop: 2,
            }}
          >
            / 10
          </span>
        </div>
      </div>

      <div className="text-center">
        <span
          className="badge"
          style={{
            background: trackColor,
            color,
            fontSize: 11,
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
