"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PlanKey = "starter" | "pro";
type State   = "verifying" | "success" | "invalid";

const PLAN_META: Record<PlanKey, {
  headline:  string;
  sub:       string;
  features:  string[];
  color:     string;
  shadow:    string;
  ctaLabel:  string;
  ctaHref:   string;
}> = {
  starter: {
    headline: "You're on Starter! 🎉",
    sub:      "Unlimited analyses unlocked. Welcome to Adur.ai",
    features: ["Unlimited analyses", "Full 7-Day Battle Plan", "Creative Studio"],
    color:    "#FF3CAC",
    shadow:   "rgba(255,60,172,0.38)",
    ctaLabel: "Start Analyzing",
    ctaHref:  "/analyze",
  },
  pro: {
    headline: "You're on Pro! 🚀",
    sub:      "Your Meta account is ready to connect. Let Adur manage your campaigns.",
    features: [
      "Meta account connection",
      "AI Manager & Autopilot",
      "24/7 monitoring + daily briefings",
    ],
    color:    "#6c5ce7",
    shadow:   "rgba(108,92,231,0.38)",
    ctaLabel: "Connect Meta Account",
    ctaHref:  "/dashboard",
  },
};

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [state,             setState]             = useState<State>("verifying");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [plan,              setPlan]              = useState<PlanKey>("starter");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const planParam = searchParams.get("plan");

    async function verify() {
      if (!sessionId) { router.replace("/"); return; }

      try {
        const res  = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await res.json();
        if (!data.valid) { router.replace("/"); return; }

        // Resolve plan
        const resolvedPlan: PlanKey = planParam === "pro" ? "pro" : "starter";
        setPlan(resolvedPlan);

        // Set localStorage
        localStorage.setItem("adur_plan",           resolvedPlan);
        localStorage.setItem("adur_analysis_count", "0");
        localStorage.setItem("adur_image_count",    "0");
        localStorage.setItem("adur_copy_count",     "0");

        // Activate subscription in background
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch("/api/activate-subscription", {
            method:  "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (session.user && !session.user.email_confirmed_at) {
            setNeedsVerification(true);
            supabase.auth.resend({ type: "signup", email: session.user.email! });
          }
        }

        setState("success");
        fireConfetti(resolvedPlan);
      } catch {
        router.replace("/");
      }
    }

    verify();
  }, [searchParams, router]);

  const meta  = PLAN_META[plan];
  const isPro = plan === "pro";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#ffffff" }}
    >
      {/* ── Verifying ── */}
      {state === "verifying" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor:    isPro ? "rgba(108,92,231,0.20)" : "rgba(255,60,172,0.20)",
              borderTopColor: isPro ? "#6c5ce7"               : "#FF3CAC",
            }}
          />
          <p style={{ fontSize: 14, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>
            Confirming your payment…
          </p>
        </motion.div>
      )}

      {/* ── Success ── */}
      {state === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-md w-full"
        >
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 240, damping: 20 }}
            className="mb-8"
          >
            {isPro ? (
              /* Pro: purple Bot icon orb */
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: "rgba(108,92,231,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "#6c5ce7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 28px rgba(108,92,231,0.38)",
                }}>
                  <Bot style={{ width: 28, height: 28, color: "#fff" }} />
                </div>
              </div>
            ) : (
              /* Starter: animated green checkmark */
              <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                <circle cx="44" cy="44" r="44" fill="rgba(0,184,148,0.10)" />
                <motion.circle
                  cx="44" cy="44" r="34"
                  stroke="#00b894" strokeWidth="2.5" fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                />
                <motion.path
                  d="M28 44 L40 56 L60 33"
                  stroke="#00b894" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round" fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }}
                />
              </svg>
            )}
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading font-bold mb-3"
            style={{ fontSize: "clamp(28px, 6vw, 40px)", letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.15 }}
          >
            {meta.headline}
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.65, fontFamily: "var(--font-inter)", marginBottom: 32 }}
          >
            {isPro ? (
              <>
                Your Meta account is ready to connect.{" "}
                <span style={{ color: "#6c5ce7", fontWeight: 600 }}>Let Adur manage your campaigns.</span>
              </>
            ) : (
              <>
                Unlimited analyses unlocked. Welcome to{" "}
                <span style={{ color: "#FF3CAC", fontWeight: 600 }}>Adur.ai</span>
              </>
            )}
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-col gap-2.5 w-full mb-10"
          >
            {meta.features.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isPro ? "rgba(108,92,231,0.06)" : "rgba(0,184,148,0.06)",
                  border:     isPro ? "1px solid rgba(108,92,231,0.18)" : "1px solid rgba(0,184,148,0.18)",
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                  style={{ background: isPro ? "#6c5ce7" : "#00b894", color: "#fff" }}
                >
                  ✓
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>
                  {f}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.78, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(meta.ctaHref)}
            className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer w-full justify-center"
            style={{
              padding:      "15px 36px",
              borderRadius:  100,
              background:    isPro
                ? "#6c5ce7"
                : "linear-gradient(135deg, #FF3CAC, #FF6B35)",
              fontSize:      15,
              fontFamily:    "var(--font-inter)",
              letterSpacing: "-0.01em",
              boxShadow:     `0 6px 30px ${meta.shadow}`,
              border:        "none",
            }}
          >
            {meta.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          {/* Email verification notice */}
          {needsVerification && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="mt-5 w-full flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background: isPro ? "rgba(108,92,231,0.06)" : "rgba(255,60,172,0.06)",
                border:     isPro ? "1px solid rgba(108,92,231,0.18)" : "1px solid rgba(255,60,172,0.18)",
              }}
            >
              <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isPro ? "#6c5ce7" : "#FF3CAC" }} />
              <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: "#0d0d1a" }}>Verify your email</span> — we sent a link to your inbox. Your account is active now.
              </p>
            </motion.div>
          )}

          {/* Receipt note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="mt-4 text-xs"
            style={{ color: "#9ca3af", fontFamily: "var(--font-inter)" }}
          >
            Check your email for your receipt
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}

function fireConfetti(plan: PlanKey) {
  import("canvas-confetti").then(({ default: confetti }) => {
    const count    = 220;
    const defaults = { origin: { y: 0.6 } };
    const primary  = plan === "pro" ? "#6c5ce7" : "#FF3CAC";
    const accent   = plan === "pro" ? "#a29bfe" : "#FF6B35";

    function fire(ratio: number, opts: Record<string, unknown>) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * ratio) });
    }

    fire(0.25, { spread: 26,  startVelocity: 55, colors: [primary, accent] });
    fire(0.20, { spread: 60,  colors: [primary, "#00b894"] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8,  colors: [accent, "#00b894", primary] });
    fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: [primary] });
    fire(0.10, { spread: 120, startVelocity: 45, colors: [accent] });
  });
}
