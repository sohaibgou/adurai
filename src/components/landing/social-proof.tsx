"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";

function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * to));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);

  return <span ref={ref}>{val}</span>;
}

const AVATARS = [
  { initials: "MK", bg: "#f0edff", color: "#6c5ce7" },
  { initials: "SR", bg: "#e6fffe", color: "#00a8a5" },
  { initials: "AL", bg: "#fdf0ed", color: "#c0503d" },
  { initials: "JP", bg: "#e6faf6", color: "#007a5e" },
  { initials: "DW", bg: "#fff8e6", color: "#a05c00" },
];

export default function SocialProof() {
  return (
    <section
      className="relative w-full"
      style={{
        borderTop: "1px solid #f0f0f5",
        borderBottom: "1px solid #f0f0f5",
        background: "#ffffff",
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6"
        style={{ paddingTop: 28, paddingBottom: 28 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -30px 0px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
        >
          {/* Avatars */}
          <div className="flex items-center">
            {AVATARS.map((a, i) => (
              <div
                key={a.initials}
                className="flex items-center justify-center font-semibold"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: a.bg,
                  color: a.color,
                  fontSize: 11,
                  border: "2px solid #ffffff",
                  marginLeft: i > 0 ? -10 : 0,
                  letterSpacing: "0.02em",
                  zIndex: AVATARS.length - i,
                  position: "relative",
                }}
              >
                {a.initials}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="hidden sm:block"
            style={{ width: 1, height: 28, background: "#f0f0f5" }}
          />

          {/* Counter + stars */}
          <div className="flex items-center gap-4">
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#0a0a0f",
                fontFamily: "var(--font-inter)",
              }}
            >
              <span className="font-heading font-bold" style={{ fontSize: 18, letterSpacing: "-0.02em" }}>
                <CountUp to={500} />+
              </span>{" "}
              media buyers trust Adur.ai
            </p>

            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4"
                  style={{ fill: "#fdcb6e", color: "#fdcb6e" }}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div
            className="hidden sm:block"
            style={{ width: 1, height: 28, background: "#f0f0f5" }}
          />

          {/* Trust signals */}
          <div className="flex items-center gap-6">
            {["Free forever", "No credit card", "Instant results"].map((text) => (
              <span
                key={text}
                className="flex items-center gap-1.5"
                style={{ fontSize: 13, color: "#6b7280" }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#00b894",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {text}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
