"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

export default function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1300,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }
    hasAnimated.current = true;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplay(value);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  let formatted: string;
  if (display >= 1_000_000) {
    formatted = `${(display / 1_000_000).toFixed(1)}M`;
  } else if (display >= 10_000) {
    formatted = `${(display / 1_000).toFixed(0)}k`;
  } else if (display >= 1_000) {
    formatted = `${(display / 1_000).toFixed(1)}k`;
  } else {
    formatted = display.toFixed(decimals);
  }

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}
