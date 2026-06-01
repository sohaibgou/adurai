"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Zap, Sparkles, Bot, ArrowRight, Clock, ChevronDown } from "lucide-react";
import FadeIn from "@/components/fade-in";
import CheckoutModal from "@/components/checkout-modal";
import { handleGetStarted, type CheckoutPlan, type BillingInterval } from "@/lib/checkout";

interface PricingSectionProps {
  onCtaClick: () => void;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Badge = "NEW" | "READ" | "WRITE";
interface Feat  { label: string; ok: boolean; badge?: Badge }
interface Group { label: string; items: Feat[] }

// ── Plan feature data ─────────────────────────────────────────────────────────
const FREE_GROUPS: Group[] = [
  { label: "Analysis", items: [
    { label: "3 analyses / month", ok: true },
    { label: "Campaign performance table", ok: true },
    { label: "Basic AI recommendations", ok: true },
  ]},
  { label: "Creative Studio", items: [
    { label: "3 image generations", ok: true },
    { label: "3 ad copy generations", ok: true },
    { label: "UGC videos", ok: false },
  ]},
  { label: "Meta Integration", items: [
    { label: "Meta account connection", ok: false },
    { label: "AI Manager & Autopilot", ok: false },
  ]},
];

const STARTER_GROUPS: Group[] = [
  { label: "Analysis", items: [
    { label: "10 analyses / month", ok: true },
    { label: "Full 7-Day Battle Plan", ok: true },
    { label: "Profit Leak calculator", ok: true },
    { label: "PDF report export", ok: true },
    { label: "Priority support", ok: true },
  ]},
  { label: "Creative Studio", items: [
    { label: "5 image generations / month", ok: true },
    { label: "Unlimited ad copy", ok: true },
    { label: "3 UGC videos / month", ok: true },
  ]},
  { label: "Meta Integration", items: [
    { label: "Meta account connection", ok: false },
    { label: "AI Manager & Autopilot", ok: false },
  ]},
];

const GROWTH_GROUPS: Group[] = [
  { label: "Analysis", items: [
    { label: "Unlimited analyses", ok: true },
    { label: "Full 7-Day Battle Plan", ok: true },
    { label: "Profit Leak calculator", ok: true },
    { label: "PDF report export", ok: true },
  ]},
  { label: "Creative Studio", items: [
    { label: "20 image generations / month", ok: true },
    { label: "Unlimited ad copy", ok: true },
    { label: "10 UGC videos / month", ok: true, badge: "NEW" },
  ]},
  { label: "Meta Integration", items: [
    { label: "Connect Meta Account", ok: true, badge: "READ" },
    { label: "Live campaign data", ok: true },
    { label: "Creative fatigue alerts", ok: true },
    { label: "AI auto-execution", ok: false },
  ]},
];

const AUTOPILOT_GROUPS: Group[] = [
  { label: "Everything in Growth, plus:", items: [
    { label: "Connect Meta Account", ok: true, badge: "WRITE" },
    { label: "AI Manager & full Autopilot", ok: true },
    { label: "Auto pause / scale / budget", ok: true },
    { label: "Approve / reject AI actions", ok: true },
    { label: "24/7 campaign monitoring", ok: true },
    { label: "Daily AI briefing emails", ok: true },
    { label: "30 UGC videos / month", ok: true },
    { label: "Unlimited image generations", ok: true },
    { label: "Priority support", ok: true },
  ]},
];

// ── Compare table data ─────────────────────────────────────────────────────────
const COMPARE_ROWS: { feature: string; cells: string[] }[] = [
  { feature: "Analyses / month",        cells: ["3", "10", "Unlimited", "Unlimited"] },
  { feature: "7-Day Battle Plan",       cells: ["—", "✓", "✓", "✓"] },
  { feature: "PDF export",              cells: ["—", "✓", "✓", "✓"] },
  { feature: "Image generations / mo",  cells: ["3", "5", "20", "Unlimited"] },
  { feature: "Ad copy",                 cells: ["3", "Unlimited", "Unlimited", "Unlimited"] },
  { feature: "UGC videos / month",      cells: ["—", "3", "10", "30"] },
  { feature: "Connect Meta Account",    cells: ["—", "—", "READ", "READ + WRITE"] },
  { feature: "Live campaign data",      cells: ["—", "—", "✓", "✓"] },
  { feature: "AI Manager & Autopilot",  cells: ["—", "—", "—", "✓"] },
  { feature: "24/7 monitoring",         cells: ["—", "—", "—", "✓"] },
  { feature: "Auto execute actions",    cells: ["—", "—", "—", "✓"] },
  { feature: "Daily AI briefings",      cells: ["—", "—", "—", "✓"] },
];

// ── FAQ data ────────────────────────────────────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  {
    q: "What's the difference between Growth and Autopilot?",
    a: "Growth gives you READ access to your Meta account — Adur sees your live campaigns and gives you real-time recommendations. Autopilot adds WRITE access — Adur actually executes changes automatically: pausing ads, scaling budgets, adjusting bids, all done for you 24/7.",
  },
  {
    q: "Do I need Meta approval to use the Meta integration?",
    a: "Our Meta app is currently in review. In the meantime you can connect using CSV upload on any plan. Growth and Autopilot users get first access to live Meta connection once approved — we'll notify you immediately.",
  },
  {
    q: "What are UGC videos?",
    a: "UGC (User-Generated Content) videos are AI-generated video ads featuring realistic avatars. Adur writes the script from your campaign data, picks the hook, and generates a 15-30 second video in your chosen language — including Darija and Arabic.",
  },
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes. You can upgrade instantly and your new features activate immediately. Downgrades take effect at the end of your billing cycle. No cancellation fees.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — the Free plan is available forever with no credit card required. It includes 3 analyses, 3 image generations and 3 ad copy generations per month so you can experience the full quality of Adur's analysis before upgrading.",
  },
];

const PINK = "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)";

// ── Feature row ─────────────────────────────────────────────────────────────────
function FeatureRow({ feat, dark }: { feat: Feat; dark?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      {feat.ok ? (
        <span
          className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: dark ? "rgba(74,222,128,0.15)" : "rgba(22,163,74,0.12)" }}
        >
          <Check className="w-2.5 h-2.5" style={{ color: dark ? "#4ade80" : "#16A34A" }} strokeWidth={3.5} />
        </span>
      ) : (
        <span
          className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(156,163,175,0.12)" }}
        >
          <X className="w-2 h-2" style={{ color: dark ? "rgba(255,255,255,0.3)" : "#9ca3af" }} strokeWidth={3.5} />
        </span>
      )}
      <span
        className="text-[13px] leading-snug"
        style={{
          color: feat.ok
            ? (dark ? "rgba(255,255,255,0.85)" : "#374151")
            : (dark ? "rgba(255,255,255,0.3)" : "#9ca3af"),
          textDecoration: feat.ok ? "none" : "line-through",
          fontWeight: 500,
        }}
      >
        {feat.label}
        {feat.badge === "NEW" && (
          <span className="ml-1.5 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#DCFCE7", color: "#14532D" }}>NEW</span>
        )}
        {feat.badge === "READ" && (
          <span className="ml-1.5 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,60,172,0.10)", color: "#FF3CAC" }}>READ</span>
        )}
        {feat.badge === "WRITE" && (
          <span className="ml-1.5 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>WRITE</span>
        )}
      </span>
    </li>
  );
}

function FeatureGroups({ groups, dark }: { groups: Group[]; dark?: boolean }) {
  return (
    <div className="flex-1 mb-7">
      {/* Centered as a block, but rows stay left-aligned so the check/X
          icons line up in a clean vertical column. */}
      <div className="inline-block text-left">
        {groups.map((g, gi) => (
          <div key={g.label} className={gi > 0 ? "mt-4" : ""}>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2.5"
              style={{ color: dark ? "rgba(255,255,255,0.35)" : "#A8A5A0", letterSpacing: "0.1em" }}
            >
              {g.label}
            </p>
            <ul className="space-y-2.5">
              {g.items.map((f) => <FeatureRow key={f.label} feat={f} dark={dark} />)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PricingSection({ onCtaClick }: PricingSectionProps) {
  const [interval, setInterval]   = useState<BillingInterval>("monthly");
  const [modalPlan, setModalPlan] = useState<CheckoutPlan | null>(null);
  const [loadingPlan, setLoading] = useState<CheckoutPlan | null>(null);
  const [errorPlan, setErrorPlan] = useState<{ plan: CheckoutPlan; msg: string } | null>(null);
  const [openFaq, setOpenFaq]     = useState<number | null>(0);

  const annual = interval === "annual";

  async function onGet(plan: CheckoutPlan) {
    setLoading(plan);
    setErrorPlan(null);
    try {
      const loggedIn = await handleGetStarted(plan, interval);
      if (!loggedIn) setModalPlan(plan);
    } catch (err) {
      setErrorPlan({ plan, msg: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setLoading(null);
    }
  }

  const PRICES: Record<CheckoutPlan, { monthly: string; annual: string }> = {
    starter: { monthly: "19", annual: "15" },
    growth:  { monthly: "49", annual: "39" },
    pro:     { monthly: "99", annual: "79" },
  };

  return (
    <section className="pt-12 pb-28 relative" id="pricing" style={{ background: "#FAF8F5" }}>
      <CheckoutModal open={modalPlan !== null} onClose={() => setModalPlan(null)} plan={modalPlan ?? "starter"} interval={interval} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,100,180,0.06) 0%, transparent 70%)" }}
      />

      <div className="max-w-[1180px] mx-auto px-6 relative">

        {/* ── Header ── */}
        <FadeIn>
          <div className="text-center mb-10 mx-auto">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-5 px-3.5 py-1.5 rounded-full"
              style={{ color: "#FF3CAC", background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.2)", letterSpacing: "0.08em" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF3CAC", boxShadow: "0 0 6px #FF3CAC" }} />
              Simple Pricing
            </span>
            <h2
              className="font-heading font-black text-foreground sm:whitespace-nowrap"
              style={{ fontSize: "clamp(34px, 4.5vw, 54px)", letterSpacing: "-0.04em", lineHeight: 1.05 }}
            >
              Start free.{" "}
              <span style={{ background: PINK, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Scale when ready.
              </span>
            </h2>
            <p className="mt-4 text-[17px] max-w-xl mx-auto" style={{ color: "#6b7280", lineHeight: 1.6 }}>
              No hidden fees. No agency contracts. Cancel any time.
            </p>
          </div>
        </FadeIn>

        {/* ── Billing toggle ── */}
        <FadeIn delay={0.08}>
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="text-sm font-medium" style={{ color: annual ? "#9ca3af" : "#0a0a0f" }}>Monthly</span>
            <button
              onClick={() => setInterval(annual ? "monthly" : "annual")}
              aria-label="Toggle annual billing"
              className="relative cursor-pointer rounded-full transition-colors"
              style={{ width: 46, height: 26, background: annual ? PINK : "#D4D0CA", border: "none" }}
            >
              <span
                className="absolute rounded-full bg-white transition-transform"
                style={{ width: 20, height: 20, top: 3, left: 3, transform: annual ? "translateX(20px)" : "translateX(0)", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
              />
            </button>
            <span className="text-sm font-medium" style={{ color: annual ? "#0a0a0f" : "#9ca3af" }}>Annual</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#14532D", letterSpacing: "0.04em" }}>
              Save 20%
            </span>
          </div>
        </FadeIn>

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch justify-items-center md:justify-items-stretch">

          {/* ════ FREE ════ */}
          <FadeIn delay={0.1} className="w-full max-w-[420px] md:max-w-none">
            <div className="flex flex-col h-full rounded-2xl bg-white p-7 text-left md:text-center" style={{ border: "1.5px solid #E8E5E0" }}>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-5 self-start md:self-center" style={{ background: "#FAF8F5", color: "#6b7280", border: "1px solid #E8E5E0", letterSpacing: "0.1em" }}>
                <Zap className="w-2.5 h-2.5" /> Get Started
              </span>
              <p className="font-heading font-black" style={{ fontSize: 18, color: "#0a0a0f", letterSpacing: "-0.03em" }}>Free</p>
              <div className="flex items-baseline gap-1 mt-1 justify-start md:justify-center">
                <span className="font-heading font-black" style={{ fontSize: 44, lineHeight: 1, color: "#0a0a0f", letterSpacing: "-0.04em" }}>$0</span>
              </div>
              <p className="text-[13px] font-medium mb-1" style={{ color: "#A8A5A0" }}>Forever</p>
              <p className="text-xs mb-5" style={{ color: "#6b7280", lineHeight: 1.5 }}>Try Adur.ai with no commitment. No credit card needed.</p>
              <div className="h-px mb-5" style={{ background: "#E8E5E0" }} />
              <FeatureGroups groups={FREE_GROUPS} />
              <button
                onClick={onCtaClick}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50 active:scale-[0.98] cursor-pointer"
                style={{ border: "1.5px solid #E8E5E0", color: "#0a0a0f" }}
              >
                Start Free
              </button>
              <p className="mt-2.5 text-center text-[11px]" style={{ color: "#A8A5A0" }}>No credit card required</p>
            </div>
          </FadeIn>

          {/* ════ STARTER ════ */}
          <FadeIn delay={0.15} className="w-full max-w-[420px] md:max-w-none">
            <div className="flex flex-col h-full rounded-2xl bg-white p-7 text-left md:text-center" style={{ border: "1.5px solid #E8E5E0" }}>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-5 self-start md:self-center" style={{ background: "#FAF8F5", color: "#6b7280", border: "1px solid #E8E5E0", letterSpacing: "0.1em" }}>
                Starter
              </span>
              <p className="font-heading font-black" style={{ fontSize: 18, color: "#0a0a0f", letterSpacing: "-0.03em" }}>Starter</p>
              <div className="flex items-baseline gap-1 mt-1 justify-start md:justify-center">
                <span className="font-heading font-black" style={{ fontSize: 44, lineHeight: 1, color: "#0a0a0f", letterSpacing: "-0.04em" }}>${PRICES.starter[interval]}</span>
                <span className="text-sm" style={{ color: "#A8A5A0" }}>/month</span>
              </div>
              <p className="text-[11px] font-medium mb-1" style={{ color: annual ? "#16A34A" : "transparent" }}>billed annually</p>
              <p className="text-xs mb-5" style={{ color: "#6b7280", lineHeight: 1.5 }}>For brand owners doing manual analysis and creative work.</p>
              <div className="h-px mb-5" style={{ background: "#E8E5E0" }} />
              <FeatureGroups groups={STARTER_GROUPS} />
              <button
                onClick={() => onGet("starter")}
                disabled={loadingPlan === "starter"}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-70"
                style={{ background: loadingPlan === "starter" ? "#9ca3af" : PINK, boxShadow: loadingPlan === "starter" ? "none" : "0 4px 20px rgba(255,60,172,0.28)" }}
              >
                {loadingPlan === "starter" ? "Checking…" : "Get Started"}
              </button>
              {errorPlan?.plan === "starter" && <p className="mt-2 text-[11px] text-center" style={{ color: "#e17055" }}>{errorPlan.msg}</p>}
            </div>
          </FadeIn>

          {/* ════ GROWTH — FEATURED ════ */}
          <FadeIn delay={0.2} className="w-full max-w-[420px] md:max-w-none">
            <div
              className="flex flex-col h-full rounded-2xl bg-white p-7 relative text-left md:text-center"
              style={{ border: "2px solid #FF3CAC", boxShadow: "0 14px 50px rgba(255,60,172,0.16)" }}
            >
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,60,172,0.06) 0%, transparent 70%)" }} />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-5 self-start md:self-center relative" style={{ background: "rgba(255,60,172,0.08)", color: "#FF3CAC", border: "1px solid rgba(255,60,172,0.25)", letterSpacing: "0.1em" }}>
                <Sparkles className="w-2.5 h-2.5" /> Most Popular
              </span>
              <p className="font-heading font-black relative" style={{ fontSize: 18, color: "#0a0a0f", letterSpacing: "-0.03em" }}>Growth</p>
              <div className="flex items-baseline gap-1 mt-1 relative justify-start md:justify-center">
                <span className="font-heading font-black" style={{ fontSize: 44, lineHeight: 1, background: PINK, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.04em" }}>${PRICES.growth[interval]}</span>
                <span className="text-sm" style={{ color: "#A8A5A0" }}>/month</span>
              </div>
              <p className="text-[11px] font-medium mb-1 relative" style={{ color: annual ? "#16A34A" : "transparent" }}>billed annually</p>
              <p className="text-xs mb-4 relative" style={{ color: "#6b7280", lineHeight: 1.5 }}>Connect your Meta account. Live data and unlimited analysis.</p>
              <div className="flex items-center justify-start md:justify-center gap-2 mb-5 relative rounded-lg px-3 py-2" style={{ background: "rgba(255,60,172,0.06)", border: "1px solid rgba(255,60,172,0.15)" }}>
                <Clock className="w-3 h-3 flex-shrink-0" style={{ color: "#FF3CAC" }} />
                <span className="text-[11px]" style={{ color: "#6b7280" }}>Live campaigns · Real-time monitoring</span>
              </div>
              <FeatureGroups groups={GROWTH_GROUPS} />
              <button
                onClick={() => onGet("growth")}
                disabled={loadingPlan === "growth"}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 relative"
                style={{ background: loadingPlan === "growth" ? "#9ca3af" : PINK, boxShadow: loadingPlan === "growth" ? "none" : "0 4px 20px rgba(255,60,172,0.32)" }}
              >
                {loadingPlan === "growth" ? "Checking…" : <>Get Growth <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
              {errorPlan?.plan === "growth" && <p className="mt-2 text-[11px] text-center relative" style={{ color: "#e17055" }}>{errorPlan.msg}</p>}
            </div>
          </FadeIn>

          {/* ════ AUTOPILOT — DARK ════ */}
          <FadeIn delay={0.25} className="w-full max-w-[420px] md:max-w-none">
            <div className="flex flex-col h-full rounded-2xl p-7 text-left md:text-center" style={{ background: "#0D0D12", border: "1.5px solid #0D0D12" }}>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-5 self-start md:self-center" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
                <Bot className="w-2.5 h-2.5" /> Most Powerful
              </span>
              <p className="font-heading font-black" style={{ fontSize: 18, color: "#fff", letterSpacing: "-0.03em" }}>Autopilot</p>
              <div className="flex items-baseline gap-1 mt-1 justify-start md:justify-center">
                <span className="font-heading font-black" style={{ fontSize: 44, lineHeight: 1, color: "#fff", letterSpacing: "-0.04em" }}>${PRICES.pro[interval]}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>/month</span>
              </div>
              <p className="text-[11px] font-medium mb-1" style={{ color: annual ? "#4ade80" : "transparent" }}>billed annually</p>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>Full autonomous media buying — let Adur manage your account.</p>
              <div className="h-px mb-5" style={{ background: "rgba(255,255,255,0.08)" }} />
              <FeatureGroups groups={AUTOPILOT_GROUPS} dark />
              <button
                onClick={() => onGet("pro")}
                disabled={loadingPlan === "pro"}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: loadingPlan === "pro" ? "rgba(255,255,255,0.4)" : "#fff", color: "#0D0D12", boxShadow: "0 4px 16px rgba(255,255,255,0.12)" }}
              >
                {loadingPlan === "pro" ? "Checking…" : <>Get Autopilot <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
              {errorPlan?.plan === "pro" && <p className="mt-2 text-[11px] text-center" style={{ color: "#ff9a8a" }}>{errorPlan.msg}</p>}
            </div>
          </FadeIn>
        </div>

        {/* ── Compare table ── */}
        <FadeIn delay={0.1}>
          <div className="mt-24">
            <h3 className="font-heading font-bold mb-6" style={{ fontSize: 22, color: "#0a0a0f", letterSpacing: "-0.03em" }}>Full comparison</h3>
            <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid #E8E5E0" }}>
              <table className="w-full text-[13px]" style={{ borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr>
                    <th className="text-left font-bold uppercase tracking-wide px-4 py-3" style={{ width: "30%", fontSize: 11, color: "#A8A5A0", letterSpacing: "0.06em", borderBottom: "1px solid #E8E5E0" }}>Feature</th>
                    {[
                      { n: "Free", p: "" },
                      { n: "Starter", p: `$${PRICES.starter[interval]}/mo` },
                      { n: "Growth", p: `$${PRICES.growth[interval]}/mo` },
                      { n: "Autopilot", p: `$${PRICES.pro[interval]}/mo` },
                    ].map((c, i) => (
                      <th key={c.n} className="text-center font-bold uppercase tracking-wide px-4 py-3" style={{ fontSize: 11, color: i === 2 ? "#FF3CAC" : "#A8A5A0", letterSpacing: "0.06em", borderBottom: "1px solid #E8E5E0", background: i === 2 ? "rgba(255,60,172,0.03)" : "transparent" }}>
                        {c.n}{c.p && <><br /><span className="font-normal text-[10px] normal-case" style={{ color: "#A8A5A0" }}>{c.p}</span></>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td className="px-4 py-3 font-medium" style={{ color: "#0a0a0f", borderBottom: "1px solid #F0EDE8" }}>{row.feature}</td>
                      {row.cells.map((cell, ci) => {
                        const isGrowthCol = ci === 2;
                        const isDash = cell === "—";
                        const color = isDash ? "#D4D0CA" : cell === "✓" ? "#16A34A" : isGrowthCol ? "#FF3CAC" : "#6b7280";
                        return (
                          <td key={ci} className="px-4 py-3 text-center font-semibold" style={{ color, borderBottom: "1px solid #F0EDE8", background: isGrowthCol ? "rgba(255,60,172,0.03)" : "transparent" }}>
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>

        {/* ── FAQ ── */}
        <FadeIn delay={0.1}>
          <div className="mt-24 max-w-2xl mx-auto">
            <h3 className="font-heading font-bold text-center mb-7" style={{ fontSize: 24, color: "#0a0a0f", letterSpacing: "-0.03em" }}>Common questions</h3>
            <div>
              {FAQS.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={item.q} style={{ borderBottom: "1px solid #E8E5E0" }}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer"
                    >
                      <span className="text-sm font-semibold" style={{ color: "#0a0a0f" }}>{item.q}</span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: "#A8A5A0", transform: open ? "rotate(180deg)" : "none" }} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <p className="text-[13px] pb-4" style={{ color: "#6b7280", lineHeight: 1.65 }}>{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* Footer note */}
        <FadeIn delay={0.15}>
          <p className="mt-16 text-center text-sm" style={{ color: "#9ca3af" }}>
            🔒 All plans include SSL encryption and data privacy. Cancel anytime.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
