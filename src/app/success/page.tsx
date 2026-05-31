"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Bot, Sparkles, BarChart3, Wand2, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PlanKey = "starter" | "pro";
type State   = "verifying" | "success" | "invalid";

interface PlanMeta {
  badge:     string;
  headline:  string;
  sub:       string;
  features:  string[];
  steps:     { icon: typeof Sparkles; label: string }[];
  color:     string;
  colorSoft: string;
  shadow:    string;
  ctaLabel:  string;
  ctaHref:   string;
}

const PLAN_META: Record<PlanKey, PlanMeta> = {
  starter: {
    badge:    "STARTER PLAN",
    headline: "Welcome to Adur 🎉",
    sub:      "Your Starter plan is live. Everything you need to turn ad data into profit — unlocked.",
    features: [
      "Unlimited campaign analyses",
      "Full 7-Day Battle Plan",
      "AI Creative Studio (images + copy)",
      "3 UGC AI videos every month",
    ],
    steps: [
      { icon: BarChart3, label: "Run your first full campaign analysis" },
      { icon: Wand2,     label: "Generate scroll-stopping ad creative" },
      { icon: Rocket,    label: "Ship your 7-Day Battle Plan" },
    ],
    color:     "#FF3CAC",
    colorSoft: "rgba(255,60,172,0.08)",
    shadow:    "rgba(255,60,172,0.38)",
    ctaLabel:  "Start Analyzing",
    ctaHref:   "/analyze",
  },
  pro: {
    badge:    "PRO PLAN",
    headline: "You're on Pro 🚀",
    sub:      "Everything in Starter, plus your autonomous AI ad manager. Let Adur run your campaigns.",
    features: [
      "Everything in Starter",
      "30 UGC AI videos every month",
      "Direct Meta account connection",
      "AI Manager & Autopilot · 24/7 monitoring",
    ],
    steps: [
      { icon: Bot,    label: "Connect your Meta Ad account" },
      { icon: Rocket, label: "Turn on Autopilot & set guardrails" },
      { icon: Sparkles, label: "Get your first daily AI briefing" },
    ],
    color:     "#6c5ce7",
    colorSoft: "rgba(108,92,231,0.08)",
    shadow:    "rgba(108,92,231,0.38)",
    ctaLabel:  "Connect Meta Account",
    ctaHref:   "/dashboard",
  },
};

const PHASES = [
  "Confirming your payment…",
  "Unlocking your plan…",
  "Setting up your workspace…",
];

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [state,             setState]             = useState<State>("verifying");
  const [phase,             setPhase]             = useState(0);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [plan,              setPlan]              = useState<PlanKey>("starter");
  const ranRef = useRef(false);

  // Cycle the loading phase labels while verifying.
  useEffect(() => {
    if (state !== "verifying") return;
    const id = setInterval(() => setPhase(p => Math.min(p + 1, PHASES.length - 1)), 1100);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (ranRef.current) return;        // guard against double-invoke in dev/strict mode
    ranRef.current = true;

    const sessionId = searchParams.get("session_id");
    const planParam = searchParams.get("plan");

    async function activate(token: string, attempt = 0): Promise<PlanKey | null> {
      try {
        const res  = await fetch("/api/activate-subscription", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.plan === "pro" || data.plan === "starter")) return data.plan;
        if (res.ok) return planParam === "pro" ? "pro" : "starter";
      } catch { /* fall through to retry */ }
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 700));
        return activate(token, attempt + 1);
      }
      return null;
    }

    async function run() {
      if (!sessionId) { router.replace("/"); return; }

      try {
        // 1. Confirm the Stripe session is actually paid.
        const res  = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await res.json();
        if (!data.valid) { setState("invalid"); return; }

        // 2. Activate the subscription server-side and AWAIT it, so the plan
        //    row exists before the user ever lands on the dashboard. The
        //    Stripe webhook is the redundant safety net.
        const { data: { session } } = await supabase.auth.getSession();
        let resolved: PlanKey = planParam === "pro" ? "pro" : "starter";

        if (session?.access_token) {
          const confirmed = await activate(session.access_token);
          if (confirmed) resolved = confirmed;

          if (session.user && !session.user.email_confirmed_at) {
            setNeedsVerification(true);
            supabase.auth.resend({ type: "signup", email: session.user.email! });
          }
        }

        setPlan(resolved);

        // 3. Best-effort local cache reset (gating reads the DB, not this).
        try {
          localStorage.setItem("adur_plan",           resolved);
          localStorage.setItem("adur_analysis_count", "0");
          localStorage.setItem("adur_image_count",    "0");
          localStorage.setItem("adur_copy_count",     "0");
        } catch { /* private mode — ignore */ }

        setState("success");
        fireConfetti(resolved);
      } catch {
        setState("invalid");
      }
    }

    run();
  }, [searchParams, router]);

  const meta  = plan === "pro" ? PLAN_META.pro : PLAN_META.starter;
  const isPro = plan === "pro";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#ffffff" }}>
      <AnimatePresence mode="wait">

        {/* ── Verifying ── */}
        {state === "verifying" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative" style={{ width: 56, height: 56 }}>
              <div className="absolute inset-0 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(255,60,172,0.15)", borderTopColor: "#FF3CAC" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5" style={{ color: "#FF3CAC" }} />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-inter)", fontWeight: 500 }}
              >
                {PHASES[phase]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Invalid / error ── */}
        {state === "invalid" && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
              style={{ background: "rgba(225,112,85,0.10)" }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
            </div>
            <h1 className="font-heading font-bold mb-2" style={{ fontSize: 24, color: "#0d0d1a", letterSpacing: "-0.03em" }}>
              We couldn&apos;t confirm this payment
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: 24 }}>
              If you were charged, your plan will activate automatically within a minute. You can head to your dashboard and refresh.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 text-white font-semibold cursor-pointer"
              style={{ padding: "13px 28px", borderRadius: 100, background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", fontSize: 14, fontFamily: "var(--font-inter)", border: "none", boxShadow: "0 6px 24px rgba(255,60,172,0.32)" }}
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── Success / Welcome ── */}
        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center w-full"
            style={{ maxWidth: 460 }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 240, damping: 18 }}
              className="mb-6"
            >
              {isPro ? (
                <div style={{ width: 92, height: 92, borderRadius: "50%", background: "rgba(108,92,231,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#6c5ce7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(108,92,231,0.40)" }}>
                    <Bot style={{ width: 30, height: 30, color: "#fff" }} />
                  </div>
                </div>
              ) : (
                <svg width="92" height="92" viewBox="0 0 88 88" fill="none">
                  <circle cx="44" cy="44" r="44" fill="rgba(0,184,148,0.10)" />
                  <motion.circle cx="44" cy="44" r="34" stroke="#00b894" strokeWidth="2.5" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }} />
                  <motion.path d="M28 44 L40 56 L60 33" stroke="#00b894" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }} />
                </svg>
              )}
            </motion.div>

            {/* Plan badge */}
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.4 }}
              style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: meta.color, background: meta.colorSoft, padding: "5px 12px", borderRadius: 100, fontFamily: "var(--font-inter)", marginBottom: 14 }}
            >
              {meta.badge} · ACTIVE
            </motion.span>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading font-bold mb-3"
              style={{ fontSize: "clamp(28px, 6vw, 40px)", letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.12 }}
            >
              {meta.headline}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.4 }}
              style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: 28 }}
            >
              {meta.sub}
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-2.5 w-full mb-7"
            >
              {meta.features.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.52 + i * 0.07, duration: 0.32 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: meta.colorSoft, border: `1px solid ${meta.color}26`, textAlign: "left" }}
                >
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs" style={{ background: meta.color, color: "#fff" }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#0d0d1a", fontFamily: "var(--font-inter)" }}>{f}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.82, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(meta.ctaHref)}
              className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer w-full justify-center"
              style={{ padding: "15px 36px", borderRadius: 100, background: isPro ? "#6c5ce7" : "linear-gradient(135deg, #FF3CAC, #FF6B35)", fontSize: 15, fontFamily: "var(--font-inter)", letterSpacing: "-0.01em", boxShadow: `0 6px 30px ${meta.shadow}`, border: "none" }}
            >
              {meta.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            {/* Secondary link */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={() => router.push("/dashboard")}
              className="cursor-pointer"
              style={{ marginTop: 12, fontSize: 13, color: "#9ca3af", background: "none", border: "none", fontFamily: "var(--font-inter)", fontWeight: 500 }}
            >
              Go to dashboard
            </motion.button>

            {/* What's next */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.4 }}
              className="w-full mt-9 pt-7"
              style={{ borderTop: "1px solid #f0ede8" }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", fontFamily: "var(--font-inter)", marginBottom: 14, textTransform: "uppercase" }}>
                What&apos;s next
              </p>
              <div className="flex flex-col gap-3">
                {meta.steps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + i * 0.08, duration: 0.3 }}
                      className="flex items-center gap-3"
                      style={{ textAlign: "left" }}
                    >
                      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 9, background: meta.colorSoft }}>
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <span style={{ fontSize: 13.5, color: "#374151", fontFamily: "var(--font-inter)" }}>{s.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Email verification notice */}
            {needsVerification && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="mt-7 w-full flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: meta.colorSoft, border: `1px solid ${meta.color}26`, textAlign: "left" }}
              >
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: "#0d0d1a" }}>Verify your email</span> — we sent a link to your inbox. Your plan is active right now.
                </p>
              </motion.div>
            )}

            {/* Receipt note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.15, duration: 0.4 }}
              className="mt-5 text-xs"
              style={{ color: "#bcbcc4", fontFamily: "var(--font-inter)" }}
            >
              A receipt is on its way to your email.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
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
