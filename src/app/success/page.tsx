"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FEATURES = [
  "Unlimited analyses",
  "Full 7-Day Battle Plan",
  "Creative Studio",
];

type State = "verifying" | "success" | "invalid";

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>("verifying");
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    async function verify() {
      if (!sessionId) {
        router.replace("/");
        return;
      }
      try {
        // Verify Stripe payment
        const res = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await res.json();
        if (!data.valid) {
          router.replace("/");
          return;
        }

        // Set localStorage for immediate local access
        localStorage.setItem("adur_plan", "starter");
        localStorage.setItem("adur_analysis_count", "0");
        localStorage.setItem("adur_image_count", "0");
        localStorage.setItem("adur_copy_count", "0");

        // Activate subscription + send verification email in background
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Activate subscription (non-blocking)
          fetch("/api/activate-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          // If email not yet verified, resend verification link
          if (session.user && !session.user.email_confirmed_at) {
            setNeedsVerification(true);
            supabase.auth.resend({ type: "signup", email: session.user.email! });
          }
        }

        setState("success");
        fireConfetti();
      } catch {
        router.replace("/");
      }
    }

    verify();
  }, [searchParams, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#ffffff" }}
    >
      {state === "verifying" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(108,92,231,0.3)", borderTopColor: "#6c5ce7" }}
          />
          <p style={{ fontSize: 14, color: "#9ca3af", fontFamily: "var(--font-inter)" }}>
            Confirming your payment…
          </p>
        </motion.div>
      )}

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
            <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
              <circle cx="44" cy="44" r="44" fill="rgba(0,184,148,0.10)" />
              <motion.circle
                cx="44"
                cy="44"
                r="34"
                stroke="#00b894"
                strokeWidth="2.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              />
              <motion.path
                d="M28 44 L40 56 L60 33"
                stroke="#00b894"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }}
              />
            </svg>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading font-bold mb-3"
            style={{ fontSize: "clamp(28px, 6vw, 42px)", letterSpacing: "-0.03em", color: "#0d0d1a", lineHeight: 1.15 }}
          >
            {"You're on Starter! 🎉"}
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.65, fontFamily: "var(--font-inter)", marginBottom: 32 }}
          >
            Unlimited analyses unlocked. Welcome to{" "}
            <span style={{ color: "#6c5ce7", fontWeight: 600 }}>Adur.ai</span>
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-col gap-2.5 w-full mb-10"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.18)" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                  style={{ background: "#00b894", color: "#fff" }}
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
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer w-full justify-center"
            style={{
              padding: "15px 36px",
              borderRadius: 100,
              background: "linear-gradient(135deg, #6c5ce7, #e040fb)",
              fontSize: 15,
              fontFamily: "var(--font-inter)",
              boxShadow: "0 6px 30px rgba(108,92,231,0.40)",
              border: "none",
            }}
          >
            Start Analyzing
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          {/* Verification notice (non-blocking) */}
          {needsVerification && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="mt-5 w-full flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(108,92,231,0.06)", border: "1px solid rgba(108,92,231,0.15)" }}
            >
              <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#6c5ce7" }} />
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

function fireConfetti() {
  import("canvas-confetti").then(({ default: confetti }) => {
    const count = 220;
    const defaults = { origin: { y: 0.6 } };

    function fire(particleRatio: number, opts: Record<string, unknown>) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ["#6c5ce7", "#e040fb"] });
    fire(0.2, { spread: 60, colors: ["#6c5ce7", "#00b894"] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#e040fb", "#00b894", "#6c5ce7"] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#6c5ce7"] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ["#e040fb"] });
  });
}
