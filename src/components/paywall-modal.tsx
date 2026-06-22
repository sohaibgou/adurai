"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Lock, Zap, Crown } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout, type CheckoutPlan } from "@/lib/checkout";
import { useAuth } from "@/context/auth-context";
import { MetaPixel } from "@/lib/meta-pixel";

interface PaywallModalProps {
  open:          boolean;
  onClose:       () => void;
  reason?:       "analysis" | "image" | "copy" | "ugc";
  currentPlan?:  "free" | "starter" | "growth" | "pro";
}

type PlanId = "starter" | "growth" | "pro";

const PLAN_META: Record<PlanId, {
  name: string; price: number; accent: string; grad: string; glow: string;
  badge?: string; features: string[];
}> = {
  starter: {
    name: "Starter", price: 19, accent: "#FF3CAC",
    grad: "linear-gradient(135deg,#FF3CAC,#FF6B35)", glow: "rgba(255,60,172,0.35)",
    features: [
      "10 campaign analyses / mo",
      "5 image generations / mo",
      "3 UGC AI videos / mo",
      "Full 7-Day Battle Plan",
      "PDF report export",
    ],
  },
  growth: {
    name: "Growth", price: 49, accent: "#FF3CAC",
    grad: "linear-gradient(135deg,#FF3CAC,#FF6B35)", glow: "rgba(255,60,172,0.35)",
    badge: "Most Popular",
    features: [
      "Unlimited campaign analyses",
      "20 image generations / mo",
      "10 UGC AI videos / mo",
      "Connect Meta — live insights",
      "Creative fatigue alerts",
    ],
  },
  pro: {
    name: "Autopilot", price: 99, accent: "#6c5ce7",
    grad: "linear-gradient(135deg,#6c5ce7,#a29bfe)", glow: "rgba(108,92,231,0.35)",
    features: [
      "Everything in Growth",
      "30 UGC AI videos / mo",
      "Meta write access + Autopilot",
      "24/7 AI monitoring",
      "Auto budget optimization",
    ],
  },
};

export default function PaywallModal({ open, onClose, reason, currentPlan = "free" }: PaywallModalProps) {
  const { user } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState<CheckoutPlan | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  // Conversion: upgrade prompt surfaced. Fire once each time the modal opens.
  useEffect(() => {
    if (open) {
      MetaPixel.track("AddToCart", {
        content_name: "Upgrade Prompt Shown",
        currency: "USD",
        value: 19,
      });
    }
  }, [open]);

  // Which upgrade tiers to offer, depending on what the user is already on.
  // Never offer a tier at or below the current one — clicking it would be a
  // downgrade (now billed immediately), not an upgrade.
  const upgradePlans: PlanId[] =
    currentPlan === "pro" ? ["pro"]
    : currentPlan === "growth" ? ["pro"]
    : currentPlan === "starter" ? ["growth", "pro"]
    : ["starter", "growth", "pro"]; // free / unknown

  const single  = upgradePlans.length === 1;
  // Theme the header: pink unless the ONLY option is Autopilot.
  const theme   = single && upgradePlans[0] === "pro" ? PLAN_META.pro : PLAN_META.growth;

  const gridClass =
    upgradePlans.length === 3 ? "sm:grid-cols-3"
    : upgradePlans.length === 2 ? "sm:grid-cols-2"
    : "";

  const maxWidth =
    upgradePlans.length === 3 ? 780
    : upgradePlans.length === 2 ? 600
    : 460;

  async function handleUpgrade(plan: CheckoutPlan, e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(plan);
    setError(null);

    try {
      if (user) {
        await redirectToCheckout(undefined, plan);
        return;
      }

      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields.");
        setLoading(null);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(null);
        return;
      }

      // Register through the validated endpoint (same fake-email / disposable /
      // MX-record checks as the main signup page) instead of calling Supabase
      // Auth directly — otherwise junk emails like vvvh@hhhh.hhh slip through.
      const signupRes = await fetch("/api/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const signupJson = await signupRes.json() as { ok?: boolean; error?: string };
      if (!signupRes.ok && signupJson.error) throw new Error(signupJson.error);

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (signInError) throw new Error("Account created! If sign-in failed, try again in a moment.");

      if (signInData.session?.access_token) {
        await redirectToCheckout(signInData.session.access_token, plan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  function handleClose() {
    if (loading) return;
    setEmail("");
    setPassword("");
    setError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(13,13,18,0.60)", backdropFilter: "blur(10px)" }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 pointer-events-none overflow-y-auto py-4"
          >
            <div
              className="relative w-full pointer-events-auto"
              style={{
                maxWidth,
                background:  "#FFFFFF",
                borderRadius: 20,
                boxShadow:   "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(232,229,224,1)",
                overflow:    "hidden",
                margin:      "auto",
              }}
            >
              {/* Gradient top strip */}
              <div style={{ height: 5, background: theme.grad }} />

              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={!!loading}
                className="absolute flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
                style={{
                  top: 16, right: 16,
                  width: 34, height: 34,
                  borderRadius: "50%",
                  background: "#F7F5F2",
                  border: "1px solid #E8E5E0",
                  color: "#A8A5A0",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F0EDE8"; (e.currentTarget as HTMLButtonElement).style.color = "#0D0D12"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F5F2"; (e.currentTarget as HTMLButtonElement).style.color = "#A8A5A0"; }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-4 sm:px-7 pt-5 sm:pt-7 pb-6 sm:pb-8">

                {/* Icon + heading */}
                <div
                  className="flex items-center justify-center mb-4"
                  style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `${theme.accent}1a`,
                    border: `1px solid ${theme.accent}33`,
                  }}
                >
                  {single
                    ? <Crown className="w-6 h-6" style={{ color: theme.accent }} />
                    : <Lock  className="w-6 h-6" style={{ color: theme.accent }} />
                  }
                </div>

                <h2
                  className="font-heading"
                  style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", lineHeight: 1.1, marginBottom: 6 }}
                >
                  {reason === "ugc"
                    ? "Unlock UGC AI Video"
                    : single
                      ? `Upgrade to ${theme.name}`
                      : reason
                        ? "You've hit your plan limit"
                        : "Choose your plan"}
                </h2>
                <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: 20 }}>
                  {reason === "ugc"
                    ? "Turn product images into scroll-stopping UGC videos — available on Starter, Growth and Autopilot."
                    : single
                      ? "Unlock Meta write access, 24/7 monitoring and full campaign Autopilot."
                      : currentPlan === "starter"
                        ? "Scale up — unlock unlimited analyses, more creatives and live Meta insights."
                        : "Pick the plan that fits. Upgrade or cancel anytime."}
                </p>

                {/* ── Plan cards ── */}
                {single ? (
                  <>
                    <PlanCard meta={PLAN_META[upgradePlans[0]]} />

                    {!user && (
                      <SignupForm
                        email={email} setEmail={setEmail}
                        password={password} setPassword={setPassword}
                        loading={loading === upgradePlans[0]}
                        error={error}
                        onSubmit={e => handleUpgrade(upgradePlans[0], e)}
                        accent={PLAN_META[upgradePlans[0]].accent}
                        accentGlow={PLAN_META[upgradePlans[0]].glow}
                        label={`Upgrade to ${PLAN_META[upgradePlans[0]].name} →`}
                      />
                    )}

                    {user && error && <ErrorMsg msg={error} />}

                    {user && (
                      <UpgradeBtn
                        loading={loading === upgradePlans[0]}
                        onClick={() => handleUpgrade(upgradePlans[0])}
                        accent={PLAN_META[upgradePlans[0]].accent}
                        accentGlow={PLAN_META[upgradePlans[0]].glow}
                        label={`Upgrade to ${PLAN_META[upgradePlans[0]].name} →`}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div className={`grid grid-cols-1 ${gridClass} gap-3 mb-4`}>
                      {upgradePlans.map(p => {
                        const meta = PLAN_META[p];
                        const featured = !!meta.badge;
                        return (
                          <div
                            key={p}
                            className="flex flex-col rounded-2xl p-4 relative"
                            style={{
                              background: `${meta.accent}0a`,
                              border: `1.5px solid ${meta.accent}${featured ? "4d" : "33"}`,
                            }}
                          >
                            {meta.badge && (
                              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: meta.accent, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em", fontFamily: "var(--font-inter)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                  {meta.badge}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mb-2 mt-1">
                              {p === "pro"
                                ? <Crown className="w-3.5 h-3.5" style={{ color: meta.accent }} />
                                : <Zap   className="w-3.5 h-3.5" style={{ color: meta.accent }} />}
                              <span style={{ fontSize: 11, fontWeight: 800, color: meta.accent, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>{meta.name}</span>
                            </div>
                            <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                              ${meta.price}<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                            </p>
                            <ul className="flex-1 space-y-1.5 mb-4">
                              {meta.features.slice(0, 5).map(f => (
                                <li key={f} className="flex items-start gap-2">
                                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: meta.accent }} />
                                  <span style={{ fontSize: 11.5, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                                </li>
                              ))}
                            </ul>
                            <button
                              onClick={() => handleUpgrade(p)}
                              disabled={!!loading}
                              className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                              style={{ background: meta.grad, border: "none", boxShadow: `0 3px 12px ${meta.glow}` }}
                            >
                              {loading === p ? "…" : `Get ${meta.name} →`}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sign-up fields for logged-out users (shared by all cards) */}
                    {!user && (
                      <>
                        <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", textAlign: "center", marginBottom: 10 }}>
                          Don&apos;t have an account? Enter your details and click a plan above.
                        </p>
                        <div className="flex flex-col gap-2.5 mb-3">
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            autoComplete="email"
                            disabled={!!loading}
                            className="w-full outline-none transition-all disabled:opacity-60"
                            style={{ padding: "11px 16px", borderRadius: 12, border: "1.5px solid #E8E5E0", fontSize: 14, fontFamily: "var(--font-inter)", color: "#0D0D12", background: "#F7F5F2" }}
                            onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.background = "#fff"; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; }}
                          />
                          <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password (min. 8 characters)"
                            autoComplete="new-password"
                            disabled={!!loading}
                            className="w-full outline-none transition-all disabled:opacity-60"
                            style={{ padding: "11px 16px", borderRadius: 12, border: "1.5px solid #E8E5E0", fontSize: 14, fontFamily: "var(--font-inter)", color: "#0D0D12", background: "#F7F5F2" }}
                            onFocus={e => { e.currentTarget.style.borderColor = "#FF3CAC"; e.currentTarget.style.background = "#fff"; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; }}
                          />
                        </div>
                      </>
                    )}

                    {error && <ErrorMsg msg={error} />}
                  </>
                )}

                {/* Sign-in link — only for logged-out users */}
                {!user && (
                  <p className="text-center mt-3" style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                    Already have an account?{" "}
                    <Link href="/login?redirect=checkout" className="font-semibold" style={{ color: "#FF3CAC", textDecoration: "none" }} onClick={handleClose}>
                      Sign in
                    </Link>
                  </p>
                )}

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Small reusable sub-components ──────────────────────────────────────── */

function PlanCard({ meta }: { meta: typeof PLAN_META[PlanId] }) {
  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: `${meta.accent}0f`, border: `1.5px solid ${meta.accent}33` }}>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 11, fontWeight: 800, color: meta.accent, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)" }}>
          {meta.name} Plan
        </p>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "rgba(22,163,74,0.10)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
          Cancel anytime
        </span>
      </div>
      <p className="font-heading" style={{ fontSize: 28, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 14 }}>
        ${meta.price}<span style={{ fontSize: 13, fontWeight: 400, color: "#6B6B72", letterSpacing: 0 }}>/month</span>
      </p>
      <ul className="space-y-2">
        {meta.features.map(f => (
          <li key={f} className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: meta.accent }} />
            <span style={{ fontSize: 13, color: "#0D0D12", fontFamily: "var(--font-inter)", fontWeight: 500 }}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UpgradeBtn({ loading, onClick, accent, accentGlow, label, small = false }: {
  loading: boolean; onClick: () => void;
  accent: string; accentGlow: string; label: string; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 font-semibold text-white cursor-pointer transition-all disabled:opacity-60 ${small ? "mb-0" : "mb-4"}`}
      style={{
        padding:      small ? "10px" : "15px",
        borderRadius:  100,
        background:    loading ? "#9ca3af" : `linear-gradient(135deg, ${accent}, ${accent}dd)`,
        fontSize:      small ? 13 : 15,
        fontFamily:   "var(--font-inter)",
        letterSpacing: "-0.01em",
        boxShadow:     loading ? "none" : `0 4px 20px ${accentGlow}`,
        border:        "none",
      }}
      onMouseEnter={e => { if (!loading) { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = `0 8px 28px ${accentGlow}`; } }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = loading ? "none" : `0 4px 20px ${accentGlow}`; }}
    >
      {label}
    </button>
  );
}

function SignupForm({ email, setEmail, password, setPassword, loading, error, onSubmit, accent, accentGlow, label }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  loading: boolean; error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  accent: string; accentGlow: string; label: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 mb-4">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" required disabled={loading}
        className="w-full outline-none transition-all disabled:opacity-60"
        style={{ padding: "12px 16px", borderRadius: 12, border: "1.5px solid #E8E5E0", fontSize: 14, fontFamily: "var(--font-inter)", color: "#0D0D12", background: "#F7F5F2" }}
        onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "#fff"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; }}
      />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min. 8 characters)" autoComplete="new-password" required disabled={loading}
        className="w-full outline-none transition-all disabled:opacity-60"
        style={{ padding: "12px 16px", borderRadius: 12, border: "1.5px solid #E8E5E0", fontSize: 14, fontFamily: "var(--font-inter)", color: "#0D0D12", background: "#F7F5F2" }}
        onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "#fff"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "#E8E5E0"; e.currentTarget.style.background = "#F7F5F2"; }}
      />
      {error && <ErrorMsg msg={error} />}
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 font-semibold text-white cursor-pointer transition-all disabled:opacity-60"
        style={{ padding: "15px", borderRadius: 100, background: loading ? "#9ca3af" : `linear-gradient(135deg, ${accent}, ${accent}cc)`, fontSize: 15, fontFamily: "var(--font-inter)", letterSpacing: "-0.01em", boxShadow: loading ? "none" : `0 4px 20px ${accentGlow}`, border: "none" }}
        onMouseEnter={e => { if (!loading) { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = `0 8px 28px ${accentGlow}`; } }}
        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = loading ? "none" : `0 4px 20px ${accentGlow}`; }}
      >
        {loading ? "Setting up your account…" : label}
      </button>
    </form>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: 13, color: "#e17055", background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.18)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-inter)", textAlign: "center", marginBottom: 12 }}>
      {msg}
    </p>
  );
}
