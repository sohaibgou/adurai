"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Lock, Zap, Crown } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout, type CheckoutPlan } from "@/lib/checkout";
import { useAuth } from "@/context/auth-context";

interface PaywallModalProps {
  open:          boolean;
  onClose:       () => void;
  reason?:       "analysis" | "image" | "copy" | "ugc";
  currentPlan?:  "free" | "starter" | "growth" | "pro";
}

const STARTER_FEATURES = [
  "Unlimited campaign analyses",
  "Full 7-Day Battle Plan",
  "Profit Leak calculator",
  "Unlimited image & copy generations",
  "3 UGC AI videos / month",
  "PDF report export",
  "Priority support",
];

const PRO_FEATURES = [
  "Everything in Starter",
  "30 UGC AI videos / month",
  "Connect Meta Ad Account",
  "AI Manager & Autopilot",
  "24/7 campaign monitoring",
  "Auto budget optimisation",
  "Daily AI briefings",
];

export default function PaywallModal({ open, onClose, reason, currentPlan = "free" }: PaywallModalProps) {
  const { user } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState<CheckoutPlan | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  // Paid non-Pro users (Starter / Growth) only see the Pro upgrade; free users see both plans
  const isStarterUser = currentPlan === "starter" || currentPlan === "growth";

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

      const { data, error: signUpError } = await supabase.auth.signUp({
        email:   email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/success` },
      });

      if (signUpError) throw signUpError;

      if (data.session?.access_token) {
        await redirectToCheckout(data.session.access_token, plan);
        return;
      }

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
                maxWidth:    isStarterUser ? 460 : 540,
                background:  "#FFFFFF",
                borderRadius: 20,
                boxShadow:   "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(232,229,224,1)",
                overflow:    "hidden",
                margin:      "auto",
              }}
            >
              {/* Gradient top strip */}
              <div style={{
                height:     5,
                background: isStarterUser
                  ? "linear-gradient(90deg, #7c3aed, #a855f7)"
                  : "linear-gradient(90deg, #FF3CAC, #FF6B35)",
              }} />

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
                    background: isStarterUser
                      ? "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.10))"
                      : "linear-gradient(135deg, rgba(255,60,172,0.12), rgba(255,107,53,0.10))",
                    border: `1px solid ${isStarterUser ? "rgba(124,58,237,0.20)" : "rgba(255,60,172,0.20)"}`,
                  }}
                >
                  {isStarterUser
                    ? <Crown className="w-6 h-6" style={{ color: "#7c3aed" }} />
                    : <Lock  className="w-6 h-6" style={{ color: "#FF3CAC" }} />
                  }
                </div>

                <h2
                  className="font-heading"
                  style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: "#0D0D12", lineHeight: 1.1, marginBottom: 6 }}
                >
                  {isStarterUser
                    ? "Upgrade to Pro"
                    : reason === "ugc"
                      ? "Unlock UGC AI Video"
                      : reason
                        ? "You've hit your free limit"
                        : "Choose your plan"}
                </h2>
                <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.6, fontFamily: "var(--font-inter)", marginBottom: 20 }}>
                  {isStarterUser
                    ? "Unlock 30 UGC AI videos per month, Meta account connection, AI Manager & Autopilot and more."
                    : reason === "ugc"
                      ? "Turn your product images into scroll-stopping UGC-style videos — available on Starter and Pro."
                      : reason
                        ? "Upgrade to keep going — choose the plan that suits you."
                        : "Start with Starter or go all-in with Pro."}
                </p>

                {/* ── STARTER USER: single Pro card ── */}
                {isStarterUser && (
                  <>
                    <PlanCard
                      name="Pro"
                      price={99}
                      features={PRO_FEATURES}
                      accent="#7c3aed"
                      accentLight="rgba(124,58,237,0.08)"
                      accentBorder="rgba(124,58,237,0.20)"
                    />

                    {!user && (
                      <SignupForm
                        email={email} setEmail={setEmail}
                        password={password} setPassword={setPassword}
                        loading={loading === "pro"}
                        error={error}
                        onSubmit={e => handleUpgrade("pro", e)}
                        accent="#7c3aed"
                        accentGlow="rgba(124,58,237,0.35)"
                        label="Upgrade to Pro →"
                      />
                    )}

                    {user && error && <ErrorMsg msg={error} />}

                    {user && (
                      <UpgradeBtn
                        loading={loading === "pro"}
                        onClick={() => handleUpgrade("pro")}
                        accent="#7c3aed"
                        accentGlow="rgba(124,58,237,0.35)"
                        label="Upgrade to Pro →"
                      />
                    )}
                  </>
                )}

                {/* ── FREE USER: Starter + Pro side by side ── */}
                {!isStarterUser && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {/* Starter card */}
                      <div
                        className="flex flex-col rounded-2xl p-4"
                        style={{ background: "rgba(255,60,172,0.04)", border: "1.5px solid rgba(255,60,172,0.22)" }}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <Zap className="w-3.5 h-3.5" style={{ color: "#FF3CAC" }} />
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#FF3CAC", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Starter</span>
                        </div>
                        <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                          $19<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                        </p>
                        <ul className="flex-1 space-y-1.5 mb-4">
                          {STARTER_FEATURES.slice(0, 5).map(f => (
                            <li key={f} className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#FF3CAC" }} />
                              <span style={{ fontSize: 11.5, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {user ? (
                          <UpgradeBtn
                            loading={loading === "starter"}
                            onClick={() => handleUpgrade("starter")}
                            accent="#FF3CAC"
                            accentGlow="rgba(255,60,172,0.35)"
                            label={loading === "starter" ? "Redirecting…" : "Get Starter"}
                            small
                          />
                        ) : (
                          <button
                            onClick={() => handleUpgrade("starter")}
                            disabled={!!loading}
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", border: "none", boxShadow: "0 3px 12px rgba(255,60,172,0.30)" }}
                          >
                            {loading === "starter" ? "…" : "Get Starter →"}
                          </button>
                        )}
                      </div>

                      {/* Pro card */}
                      <div
                        className="flex flex-col rounded-2xl p-4 relative"
                        style={{ background: "rgba(124,58,237,0.05)", border: "1.5px solid rgba(124,58,237,0.30)" }}
                      >
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "#7c3aed", padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em", fontFamily: "var(--font-inter)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                            Most Powerful
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2 mt-1">
                          <Crown className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)" }}>Pro</span>
                        </div>
                        <p className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
                          $99<span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B72" }}>/mo</span>
                        </p>
                        <ul className="flex-1 space-y-1.5 mb-4">
                          {PRO_FEATURES.slice(0, 5).map(f => (
                            <li key={f} className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#7c3aed" }} />
                              <span style={{ fontSize: 11.5, color: "#374151", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {user ? (
                          <UpgradeBtn
                            loading={loading === "pro"}
                            onClick={() => handleUpgrade("pro")}
                            accent="#7c3aed"
                            accentGlow="rgba(124,58,237,0.35)"
                            label={loading === "pro" ? "Redirecting…" : "Get Pro"}
                            small
                          />
                        ) : (
                          <button
                            onClick={() => handleUpgrade("pro")}
                            disabled={!!loading}
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", boxShadow: "0 3px 12px rgba(124,58,237,0.30)" }}
                          >
                            {loading === "pro" ? "…" : "Get Pro →"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sign-up form for logged-out free users */}
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

function PlanCard({ name, price, features, accent, accentLight, accentBorder }: {
  name: string; price: number; features: string[];
  accent: string; accentLight: string; accentBorder: string;
}) {
  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: accentLight, border: `1.5px solid ${accentBorder}` }}>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 11, fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-inter)" }}>
          {name} Plan
        </p>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#16A34A", background: "rgba(22,163,74,0.10)", padding: "4px 10px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
          Cancel anytime
        </span>
      </div>
      <p className="font-heading" style={{ fontSize: 28, fontWeight: 900, color: "#0D0D12", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 14 }}>
        ${price}<span style={{ fontSize: 13, fontWeight: 400, color: "#6B6B72", letterSpacing: 0 }}>/month</span>
      </p>
      <ul className="space-y-2">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
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
