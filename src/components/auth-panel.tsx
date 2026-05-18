"use client";

/* Right-side visual panel shared by Login and Signup */
export default function AuthPanel() {
  const bars = [38, 52, 44, 62, 48, 58, 72, 94];

  return (
    <div
      className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #12000e 0%, #2a0520 30%, #1a0808 60%, #240e00 100%)",
        minHeight: "100vh",
        flex: "1 1 0%",
      }}
    >
      {/* Orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.45) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.40) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "55%", left: "40%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,172,0.20) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* Glass card */}
      <div
        style={{
          position: "relative", zIndex: 10,
          width: "min(420px, 85%)",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* Browser dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-inter)", textTransform: "uppercase" }}>Live Optimization</span>
          </div>
        </div>

        {/* Metric row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {/* ROAS */}
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)", marginBottom: 8 }}>ROAS</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", fontFamily: "var(--font-inter)" }}>4.2<span style={{ fontSize: 22 }}>×</span></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#28c840", background: "rgba(40,200,64,0.14)", border: "1px solid rgba(40,200,64,0.2)", padding: "2px 7px", borderRadius: 100 }}>+18%</span>
            </div>
          </div>
          {/* Wasted Spend */}
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)", marginBottom: 8 }}>Wasted Spend</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "#ffffff", fontFamily: "var(--font-inter)" }}>$0.00</span>
              <span style={{ fontSize: 16, color: "#28c840" }}>✓</span>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 100, paddingBottom: 0 }}>
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: "6px 6px 0 0",
                  background: i === bars.length - 1
                    ? "linear-gradient(180deg, #FF3CAC 0%, #FF6B35 100%)"
                    : i >= bars.length - 3
                    ? "linear-gradient(180deg, rgba(255,60,172,0.7) 0%, rgba(255,107,53,0.6) 100%)"
                    : "rgba(255,255,255,0.12)",
                  boxShadow: i === bars.length - 1 ? "0 0 20px rgba(255,60,172,0.5)" : "none",
                  transition: "height 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Tooltip on tallest bar */}
          <div
            style={{
              position: "absolute",
              top: -48,
              right: 0,
              background: "rgba(255,255,255,0.95)",
              borderRadius: 10,
              padding: "8px 12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "var(--font-inter)", marginBottom: 2 }}>Ad Set #42 Optimized</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#16A34A", fontFamily: "var(--font-inter)", letterSpacing: "-0.02em" }}>+$420 Saved</p>
            {/* Arrow */}
            <div style={{ position: "absolute", bottom: -6, right: 20, width: 12, height: 12, background: "rgba(255,255,255,0.95)", transform: "rotate(45deg)", boxShadow: "2px 2px 4px rgba(0,0,0,0.1)" }} />
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <p
        style={{
          position: "absolute",
          bottom: 32,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.25)",
          fontFamily: "var(--font-inter)",
          zIndex: 10,
        }}
      >
        YOUR AI-POWERED META ADS ANALYST
      </p>
    </div>
  );
}
