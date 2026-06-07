"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, Bot, Bell, AlertTriangle, CheckCircle2, XCircle,
  Pause, TrendingUp, Clock, ChevronLeft, ChevronRight,
  Loader2, Save, ToggleLeft, ToggleRight, BarChart3, Zap,
} from "lucide-react";
import AppSidebar from "@/components/app-sidebar";
import EmailVerifyBanner from "@/components/email-verify-banner";
import VerifyGate from "@/components/verify-gate";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { redirectToCheckout } from "@/lib/checkout";
import ProUpgradeModal from "@/components/pro-upgrade-modal";

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────────

type AutopilotMode = "confirm" | "auto" | "off";

interface AutomationRules {
  pauseHighCpa:       { enabled: boolean; targetCpa: number; thresholdPercent: number };
  scaleWinners:       { enabled: boolean; scaleBudgetPercent: number; roasMultiplier: number; maxIncreasePercent: number };
  creativeFatigue:    { enabled: boolean; ctrDropPercent: number; daysWindow: number };
  budgetConcentration:{ enabled: boolean; concentrationPercent: number };
}

interface PendingAction {
  id:            string;
  campaign_id:   string;
  campaign_name: string;
  action_type:   "pause" | "scale" | "alert";
  reason:        string;
  new_budget:    number | null;
  created_at:    string;
}

interface HistoryAction {
  id:            string;
  campaign_name: string;
  action_type:   string;
  reason:        string;
  status:        string;
  new_budget:    number | null;
  executed_at:   string | null;
  created_at:    string;
}

// Autonomous management is not live yet — controls are visible but inert and
// surface a "coming soon" toast. Flip to true once Meta approval lands.
const LAUNCHED: boolean = false;

const DEFAULT_RULES: AutomationRules = {
  pauseHighCpa:        { enabled: true,  targetCpa: 50,          thresholdPercent: 20 },
  scaleWinners:        { enabled: true,  scaleBudgetPercent: 20, roasMultiplier: 2,    maxIncreasePercent: 50 },
  creativeFatigue:     { enabled: true,  ctrDropPercent: 40,     daysWindow: 7 },
  budgetConcentration: { enabled: true,  concentrationPercent: 80 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeSince(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function actionResult(action: HistoryAction): string {
  if (action.status === "rejected")  return "Action rejected";
  if (action.status === "pending")   return "Awaiting approval";
  if (action.status === "alerted")   return "Alert sent";
  if (action.action_type === "pause") return "Campaign paused";
  if (action.action_type === "scale" && action.new_budget)
    return `Budget set to $${action.new_budget}/day`;
  return "Action executed";
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  executed: { bg: "rgba(22,163,74,0.10)",   color: "#16A34A", label: "Executed"  },
  pending:  { bg: "rgba(234,179,8,0.12)",   color: "#A16207", label: "Pending"   },
  rejected: { bg: "rgba(225,112,85,0.10)",  color: "#e17055", label: "Rejected"  },
  alerted:  { bg: "rgba(8,102,255,0.10)",   color: "#0866FF", label: "Alerted"   },
  approved: { bg: "rgba(22,163,74,0.10)",   color: "#16A34A", label: "Approved"  },
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  pause: { bg: "rgba(225,112,85,0.10)",  color: "#e17055" },
  scale: { bg: "rgba(22,163,74,0.10)",   color: "#16A34A" },
  alert: { bg: "rgba(8,102,255,0.10)",   color: "#0866FF" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, accent = "#7C3AED" }: { title: string; subtitle?: string; accent?: string }) {
  return (
    <>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}99)` }} />
      <div style={{ padding: "20px 24px 0" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: subtitle ? 3 : 0 }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginBottom: 18 }}>{subtitle}</p>}
      </div>
    </>
  );
}

function RuleInput({
  value, onChange, suffix, prefix, min = 0, step = 1, width = 72,
}: {
  value: number; onChange: (n: number) => void;
  suffix?: string; prefix?: string; min?: number; step?: number; width?: number;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, verticalAlign: "middle" }}>
      {prefix && <span style={{ fontSize: 13, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width, padding: "4px 8px", borderRadius: 8, border: "1px solid #E8E5E0",
          background: "#F7F5F2", fontSize: 13, fontWeight: 600, color: "#0D0D12",
          fontFamily: "var(--font-inter)", outline: "none", textAlign: "center",
          display: "inline-block",
        }}
      />
      {suffix && <span style={{ fontSize: 13, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>{suffix}</span>}
    </span>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      title={enabled ? "Disable rule" : "Enable rule"}
      style={{
        width: 40, height: 22, borderRadius: 100, border: "none",
        background: enabled ? "#16A34A" : "#D4D0CA",
        cursor: "pointer", position: "relative", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        left: enabled ? 21 : 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
      }} />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AutopilotPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [subLoading,       setSubLoading]       = useState(true);
  const [isPaid,           setIsPaid]           = useState(false);
  const [isPro,            setIsPro]            = useState(false);
  const [upgradeOpen,      setUpgradeOpen]      = useState(false);
  const [checkoutLoading,  setCheckoutLoading]  = useState(false);
  const [connected,        setConnected]        = useState<boolean | null>(null);

  // Settings state
  const [mode,             setMode]             = useState<AutopilotMode>("confirm");
  const [pendingMode,      setPendingMode]      = useState<AutopilotMode | null>(null); // for confirm modal
  const [rules,            setRules]            = useState<AutomationRules>(DEFAULT_RULES);
  const [settingsSaving,   setSettingsSaving]   = useState(false);
  const [settingsSaved,    setSettingsSaved]    = useState(false);
  const [rulesSaving,      setRulesSaving]      = useState(false);
  const [rulesSaved,       setRulesSaved]       = useState(false);

  // Pending actions state
  const [pending,          setPending]          = useState<PendingAction[]>([]);
  const [pendingLoading,   setPendingLoading]   = useState(true);
  const [processing,       setProcessing]       = useState<string | null>(null);
  const [justExecuted,     setJustExecuted]     = useState<Set<string>>(new Set());

  // Coming-soon toast
  const [toast,            setToast]            = useState<string | null>(null);
  function comingSoon() {
    setToast("Coming soon — you'll be notified when this launches");
    setTimeout(() => setToast(null), 3000);
  }

  // History state
  const [history,          setHistory]          = useState<HistoryAction[]>([]);
  const [historyLoading,   setHistoryLoading]   = useState(true);
  const [historyFilter,    setHistoryFilter]    = useState("all");
  const [historyPage,      setHistoryPage]      = useState(1);
  const [historyTotal,     setHistoryTotal]     = useState(0);
  const [historyPageCount, setHistoryPageCount] = useState(1);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay },
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Subscription
  useEffect(() => {
    if (!user) return;
    const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
      setIsPaid(true);
      setIsPro(true);
      setSubLoading(false);
      return;
    }
    supabase.from("subscriptions").select("status, plan").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const active = data?.status === "active";
        setIsPaid(active);
        setIsPro(active && data?.plan === "pro");
        setSubLoading(false);
      });
  }, [user]);

  // Load settings
  useEffect(() => {
    if (!user) return;
    fetch("/api/autopilot/settings")
      .then((r) => r.json())
      .then((d: {
        connected?: boolean;
        autopilotMode?: AutopilotMode;
        automationRules?: AutomationRules;
      }) => {
        setConnected(d.connected ?? false);
        if (d.connected) {
          setMode(d.autopilotMode ?? "confirm");
          setRules(d.automationRules ?? DEFAULT_RULES);
        }
      })
      .catch(() => setConnected(false));
  }, [user]);

  // Load pending
  const loadPending = useCallback(() => {
    setPendingLoading(true);
    fetch("/api/autopilot/pending")
      .then((r) => r.json())
      .then((d: { actions?: PendingAction[] }) => setPending(d.actions ?? []))
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }, []);
  useEffect(() => { if (user) loadPending(); }, [user, loadPending]);

  // Load history
  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    fetch(`/api/autopilot/history?page=${historyPage}&status=${historyFilter}`)
      .then((r) => r.json())
      .then((d: {
        actions?: HistoryAction[];
        total?: number;
        pageCount?: number;
      }) => {
        setHistory(d.actions ?? []);
        setHistoryTotal(d.total ?? 0);
        setHistoryPageCount(d.pageCount ?? 1);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [historyPage, historyFilter]);
  useEffect(() => { if (user) loadHistory(); }, [user, loadHistory]);

  // ── Save mode ────────────────────────────────────────────────────────────────
  async function saveMode(newMode: AutopilotMode) {
    if (!LAUNCHED) { comingSoon(); return; }
    setSettingsSaving(true);
    await fetch("/api/autopilot/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autopilotMode: newMode }),
    });
    setMode(newMode);
    setSettingsSaving(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  // ── Save rules ───────────────────────────────────────────────────────────────
  async function saveRules() {
    if (!LAUNCHED) { comingSoon(); return; }
    setRulesSaving(true);
    await fetch("/api/autopilot/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automationRules: rules }),
    });
    setRulesSaving(false);
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2500);
  }

  // ── Approve / Reject ─────────────────────────────────────────────────────────
  async function handleApprove(id: string) {
    if (!LAUNCHED) { comingSoon(); return; }
    setProcessing(id);
    const res = await fetch("/api/meta/approve", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: id }),
    });
    if (res.ok) {
      setJustExecuted((s) => new Set([...s, id]));
      setTimeout(() => {
        setPending((p) => p.filter((a) => a.id !== id));
        setJustExecuted((s) => { const n = new Set(s); n.delete(id); return n; });
        loadHistory();
      }, 1500);
    }
    setProcessing(null);
  }

  async function handleReject(id: string) {
    if (!LAUNCHED) { comingSoon(); return; }
    setProcessing(id);
    const res = await fetch("/api/meta/reject", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: id }),
    });
    if (res.ok) {
      setPending((p) => p.filter((a) => a.id !== id));
      loadHistory();
    }
    setProcessing(null);
  }

  // ── Rule helper ──────────────────────────────────────────────────────────────
  function updateRule<K extends keyof AutomationRules>(
    key: K, field: keyof AutomationRules[K], value: unknown
  ) {
    setRules((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F5F2" }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(124,58,237,0.2)", borderTopColor: "#7C3AED" }} />
    </div>
  );

  const MODES: Array<{
    id:      AutopilotMode;
    icon:    React.ElementType;
    label:   string;
    desc:    string;
    badge?:  string;
    badgeColor?: string;
    accentColor: string;
    accentBg:    string;
    borderActive: string;
  }> = [
    {
      id: "confirm", icon: Shield, label: "Always Confirm",
      desc: "Adur recommends changes. You approve before anything happens.",
      badge: "Recommended", badgeColor: "#7C3AED",
      accentColor: "#7C3AED", accentBg: "rgba(124,58,237,0.08)",
      borderActive: "2px solid #7C3AED",
    },
    {
      id: "auto", icon: Bot, label: "Full Autopilot",
      desc: "Adur detects and executes automatically. You get notified after.",
      badge: "Changes happen automatically", badgeColor: "#FF6B35",
      accentColor: "#FF6B35", accentBg: "rgba(255,107,53,0.08)",
      borderActive: "2px solid #FF6B35",
    },
    {
      id: "off", icon: Bell, label: "Alerts Only",
      desc: "Adur watches and alerts you. You execute everything manually.",
      accentColor: "#A8A5A0", accentBg: "rgba(168,165,160,0.08)",
      borderActive: "2px solid #A8A5A0",
    },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "#F7F5F2" }}>

      <AppSidebar
        activePage="autopilot"
        isPaid={isPaid}
        subLoading={subLoading}
        user={user}
        onSignOut={async () => { await signOut(); router.push("/"); }}
        onUpgrade={async () => {
          setCheckoutLoading(true);
          try {
            const ok = await redirectToCheckout(undefined, "pro");
            if (!ok) window.location.href = "/login?redirect=checkout&plan=pro";
          } catch { /* surfaced via spinner reset below */ }
          finally { setCheckoutLoading(false); }
        }}
      />

      <ProUpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} variant="autopilot" />

      <div className="flex-1 lg:ml-60 min-w-0 flex flex-col">

        {/* ── Top bar ── */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between pl-14 pr-4 lg:px-8 flex-shrink-0"
          style={{ height: 64, background: "rgba(247,245,242,0.90)", backdropFilter: "blur(16px)", borderBottom: "1px solid #E8E5E0" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "#A8A5A0", fontSize: 13, fontFamily: "var(--font-inter)", padding: 0 }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} />
              Dashboard
            </button>
            <span style={{ color: "#E8E5E0" }}>/</span>
            <p className="font-heading" style={{ fontSize: 15, fontWeight: 700, color: "#0D0D12", letterSpacing: "-0.02em" }}>
              Autopilot
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 100, background: connected ? "rgba(22,163,74,0.08)" : "rgba(168,165,160,0.10)", border: `1px solid ${connected ? "rgba(22,163,74,0.22)" : "#E8E5E0"}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#16A34A" : "#A8A5A0", boxShadow: connected ? "0 0 6px rgba(22,163,74,0.55)" : "none" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: connected ? "#16A34A" : "#A8A5A0", fontFamily: "var(--font-inter)" }}>
              {connected === null ? "Loading…" : connected ? "Meta Connected" : "Meta Not Connected"}
            </span>
          </div>
        </header>

        <EmailVerifyBanner />

        <VerifyGate>
        {/* ── Page content ── */}
        <main className="flex-1 px-6 lg:px-8 py-8">
          <div className="max-w-4xl space-y-6">

            {/* ── Coming-soon banner (autonomous management pre-launch) ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #6c5ce7 0%, #8b5cf6 100%)",
                color: "#fff", borderRadius: 16, padding: "16px 22px",
                display: "flex", alignItems: "flex-start", gap: 12,
                boxShadow: "0 8px 28px rgba(108,92,231,0.28)",
              }}
            >
              <Clock size={18} strokeWidth={2.2} style={{ color: "#fff", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em", fontFamily: "var(--font-inter)", marginBottom: 2, color: "#fff" }}>
                  Coming Soon
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.92)", fontFamily: "var(--font-inter)" }}>
                  Autonomous management is launching soon. Your settings are saved and will activate automatically when we go live.
                </p>
              </div>
            </div>

            {/* ── Pro lock overlay ── */}
            {!subLoading && !isPro && (
              <motion.div {...fade(0)}>
                <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 420 }}>
                  {/* Blurred preview */}
                  <div style={{ filter: "blur(6px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
                    <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 20, padding: 24, marginBottom: 16 }}>
                      <div style={{ height: 16, background: "#F0EDE8", borderRadius: 8, width: "60%", marginBottom: 12 }} />
                      <div style={{ display: "flex", gap: 10 }}>
                        {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 80, background: "#F7F5F2", borderRadius: 12 }} />)}
                      </div>
                    </div>
                    <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 20, padding: 24 }}>
                      <div style={{ height: 16, background: "#F0EDE8", borderRadius: 8, width: "40%", marginBottom: 16 }} />
                      {[1,2,3,4,5].map(i => <div key={i} style={{ height: 12, background: "#F7F5F2", borderRadius: 6, marginBottom: 10, width: `${70 + (i * 5) % 25}%` }} />)}
                    </div>
                  </div>

                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(247,245,242,0.70)", backdropFilter: "blur(2px)" }}>
                    <div style={{
                      background: "#ffffff", borderRadius: 24,
                      border: "1.5px solid rgba(108,92,231,0.25)",
                      boxShadow: "0 20px 60px rgba(108,92,231,0.12)",
                      padding: "40px 44px", textAlign: "center", maxWidth: 400,
                    }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
                        background: "rgba(108,92,231,0.10)", border: "1px solid rgba(108,92,231,0.22)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Bot style={{ width: 26, height: 26, color: "#6c5ce7" }} />
                      </div>
                      <h2 className="font-heading" style={{ fontSize: 20, fontWeight: 900, color: "#0a0a0f", letterSpacing: "-0.03em", marginBottom: 10 }}>
                        AI Manager is a Pro feature
                      </h2>
                      <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-inter)", lineHeight: 1.6, marginBottom: 24 }}>
                        Upgrade to Pro to unlock 24/7 monitoring, autopilot actions, and daily briefings.
                      </p>
                      <button
                        onClick={() => setUpgradeOpen(true)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "13px 28px", borderRadius: 100,
                          background: "#6c5ce7", color: "#fff",
                          fontSize: 14, fontWeight: 700,
                          fontFamily: "var(--font-inter)",
                          boxShadow: "0 4px 20px rgba(108,92,231,0.32)",
                          border: "none", cursor: "pointer",
                          letterSpacing: "-0.01em",
                        }}
                        onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(-1px)"; b.style.boxShadow = "0 8px 28px rgba(108,92,231,0.44)"; }}
                        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "translateY(0)"; b.style.boxShadow = "0 4px 20px rgba(108,92,231,0.32)"; }}
                      >
                        Upgrade to Pro →
                      </button>
                      <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-inter)", marginTop: 12 }}>
                        $99/month · Cancel anytime
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Pro-gated content ── */}
            {(subLoading || isPro) && <>

            {/* Not connected banner */}
            {connected === false && (
              <motion.div {...fade(0)}>
                <div style={{ background: "rgba(255,60,172,0.05)", border: "1px solid rgba(255,60,172,0.18)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Zap style={{ width: 16, height: 16, color: "#FF3CAC", flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: "#0D0D12", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
                    Connect your Meta Ads account to enable Autopilot.{" "}
                    <button onClick={() => router.push("/dashboard")} style={{ color: "#FF3CAC", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-inter)", fontSize: 13 }}>
                      Connect on Dashboard →
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════
                SECTION 1 — AUTOPILOT MODE
            ═══════════════════════════════════════════════════ */}
            <motion.div {...fade(0.04)}>
              <SectionCard>
                <SectionHeader
                  title="Autopilot Settings"
                  subtitle="Choose how Adur handles issues detected in your campaigns"
                  accent="#7C3AED"
                />
                <div style={{ padding: "0 24px 24px", opacity: LAUNCHED ? 1 : 0.6 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12, marginBottom: 20 }}>
                    {MODES.map((m) => {
                      const active = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            if (m.id === "auto" && mode !== "auto") {
                              setPendingMode("auto");
                            } else {
                              setMode(m.id);
                            }
                          }}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "flex-start",
                            gap: 10, padding: "16px", borderRadius: 14,
                            border: active ? m.borderActive : "1px solid #E8E5E0",
                            background: active ? m.accentBg : "#F7F5F2",
                            cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: m.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <m.icon style={{ width: 16, height: 16, color: m.accentColor }} />
                            </div>
                            {m.badge && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, color: m.badgeColor,
                                background: `${m.badgeColor}18`, padding: "3px 8px",
                                borderRadius: 100, textTransform: "uppercase",
                                letterSpacing: "0.07em", fontFamily: "var(--font-inter)",
                                maxWidth: 110, textAlign: "center", lineHeight: 1.3,
                              }}>
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                              {m.label}
                            </p>
                            <p style={{ fontSize: 11, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
                              {m.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => saveMode(mode)}
                    disabled={settingsSaving}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "10px 22px", borderRadius: 100,
                      background: settingsSaving ? "#9ca3af" : settingsSaved ? "#16A34A" : "linear-gradient(135deg, #7C3AED, #9333EA)",
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      fontFamily: "var(--font-inter)", border: "none",
                      cursor: settingsSaving ? "not-allowed" : "pointer",
                      boxShadow: settingsSaving ? "none" : "0 4px 14px rgba(124,58,237,0.28)",
                      transition: "all 0.2s",
                    }}
                  >
                    {settingsSaving ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> :
                     settingsSaved  ? <CheckCircle2 style={{ width: 13, height: 13 }} /> :
                     <Save style={{ width: 13, height: 13 }} />}
                    {settingsSaving ? "Saving…" : settingsSaved ? "Saved!" : "Save Mode"}
                  </button>
                </div>
              </SectionCard>
            </motion.div>

            {/* ══════════════════════════════════════════════════
                SECTION 2 — MY RULES
            ═══════════════════════════════════════════════════ */}
            <motion.div {...fade(0.08)}>
              <SectionCard>
                <SectionHeader
                  title="My Automation Rules"
                  subtitle="Adur uses these thresholds to make decisions about your account"
                  accent="#FF3CAC"
                />
                <div style={{ padding: "0 24px 24px", opacity: LAUNCHED ? 1 : 0.6 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                    {/* Rule 1 — Pause high CPA */}
                    <div style={{ padding: "16px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(225,112,85,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Pause style={{ width: 12, height: 12, color: "#e17055" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                              Pause underperforming campaigns
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: rules.pauseHighCpa.enabled ? "#0D0D12" : "#A8A5A0", fontFamily: "var(--font-inter)", lineHeight: 1.7, marginLeft: 34 }}>
                            Pause campaign when CPA exceeds{" "}
                            <RuleInput
                              value={rules.pauseHighCpa.targetCpa}
                              onChange={(v) => updateRule("pauseHighCpa", "targetCpa", v)}
                              prefix="$"
                            />{" "}
                            target by{" "}
                            <RuleInput
                              value={rules.pauseHighCpa.thresholdPercent}
                              onChange={(v) => updateRule("pauseHighCpa", "thresholdPercent", v)}
                              suffix="%"
                            />
                          </p>
                          <p style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginLeft: 34, marginTop: 4 }}>
                            Adur will pause campaigns bleeding above this threshold
                          </p>
                        </div>
                        <Toggle
                          enabled={rules.pauseHighCpa.enabled}
                          onChange={(v) => updateRule("pauseHighCpa", "enabled", v)}
                        />
                      </div>
                    </div>

                    {/* Rule 2 — Scale winners */}
                    <div style={{ padding: "16px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(22,163,74,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <TrendingUp style={{ width: 12, height: 12, color: "#16A34A" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                              Scale winning campaigns
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: rules.scaleWinners.enabled ? "#0D0D12" : "#A8A5A0", fontFamily: "var(--font-inter)", lineHeight: 1.7, marginLeft: 34 }}>
                            Scale budget by{" "}
                            <RuleInput
                              value={rules.scaleWinners.scaleBudgetPercent}
                              onChange={(v) => updateRule("scaleWinners", "scaleBudgetPercent", v)}
                              suffix="%"
                            />{" "}
                            when ROAS exceeds{" "}
                            <RuleInput
                              value={rules.scaleWinners.roasMultiplier}
                              onChange={(v) => updateRule("scaleWinners", "roasMultiplier", v)}
                              suffix="× break-even"
                              width={52}
                              step={0.1}
                            />
                          </p>
                          <p style={{ fontSize: 13, color: rules.scaleWinners.enabled ? "#6B6B72" : "#A8A5A0", fontFamily: "var(--font-inter)", lineHeight: 1.7, marginLeft: 34 }}>
                            Never increase more than{" "}
                            <RuleInput
                              value={rules.scaleWinners.maxIncreasePercent}
                              onChange={(v) => updateRule("scaleWinners", "maxIncreasePercent", v)}
                              suffix="% per action"
                            />
                          </p>
                        </div>
                        <Toggle
                          enabled={rules.scaleWinners.enabled}
                          onChange={(v) => updateRule("scaleWinners", "enabled", v)}
                        />
                      </div>
                    </div>

                    {/* Rule 3 — Creative fatigue */}
                    <div style={{ padding: "16px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(8,102,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Bell style={{ width: 12, height: 12, color: "#0866FF" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                              Creative fatigue alert
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: rules.creativeFatigue.enabled ? "#0D0D12" : "#A8A5A0", fontFamily: "var(--font-inter)", lineHeight: 1.7, marginLeft: 34 }}>
                            Alert when CTR drops more than{" "}
                            <RuleInput
                              value={rules.creativeFatigue.ctrDropPercent}
                              onChange={(v) => updateRule("creativeFatigue", "ctrDropPercent", v)}
                              suffix="%"
                            />{" "}
                            over{" "}
                            <RuleInput
                              value={rules.creativeFatigue.daysWindow}
                              onChange={(v) => updateRule("creativeFatigue", "daysWindow", v)}
                              suffix=" days"
                              width={52}
                            />
                          </p>
                        </div>
                        <Toggle
                          enabled={rules.creativeFatigue.enabled}
                          onChange={(v) => updateRule("creativeFatigue", "enabled", v)}
                        />
                      </div>
                    </div>

                    {/* Rule 4 — Budget concentration */}
                    <div style={{ padding: "16px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,107,53,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <BarChart3 style={{ width: 12, height: 12, color: "#FF6B35" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                              Budget concentration alert
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: rules.budgetConcentration.enabled ? "#0D0D12" : "#A8A5A0", fontFamily: "var(--font-inter)", lineHeight: 1.7, marginLeft: 34 }}>
                            Alert when one campaign takes more than{" "}
                            <RuleInput
                              value={rules.budgetConcentration.concentrationPercent}
                              onChange={(v) => updateRule("budgetConcentration", "concentrationPercent", v)}
                              suffix="% of total budget"
                              width={52}
                            />
                          </p>
                        </div>
                        <Toggle
                          enabled={rules.budgetConcentration.enabled}
                          onChange={(v) => updateRule("budgetConcentration", "enabled", v)}
                        />
                      </div>
                    </div>

                    {/* Rule 5 — Custom (coming soon) */}
                    <div style={{ padding: "16px 0", opacity: 0.55 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(168,165,160,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Zap style={{ width: 12, height: 12, color: "#A8A5A0" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)" }}>
                          Custom rule
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "rgba(124,58,237,0.10)", padding: "2px 8px", borderRadius: 100, fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          Coming soon
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)", marginLeft: 34 }}>
                        If [condition] then [action] — define your own rules with natural language
                      </p>
                    </div>

                  </div>

                  <button
                    onClick={saveRules}
                    disabled={rulesSaving}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "10px 22px", borderRadius: 100,
                      background: rulesSaving ? "#9ca3af" : rulesSaved ? "#16A34A" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      fontFamily: "var(--font-inter)", border: "none",
                      cursor: rulesSaving ? "not-allowed" : "pointer",
                      boxShadow: rulesSaving ? "none" : "0 4px 14px rgba(255,60,172,0.28)",
                      transition: "all 0.2s",
                    }}
                  >
                    {rulesSaving ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> :
                     rulesSaved  ? <CheckCircle2 style={{ width: 13, height: 13 }} /> :
                     <Save style={{ width: 13, height: 13 }} />}
                    {rulesSaving ? "Saving…" : rulesSaved ? "Rules Saved!" : "Save Rules"}
                  </button>
                </div>
              </SectionCard>
            </motion.div>

            {/* ══════════════════════════════════════════════════
                SECTION 3 — PENDING ACTIONS
            ═══════════════════════════════════════════════════ */}
            <motion.div {...fade(0.12)}>
              <SectionCard>
                <SectionHeader
                  title="Pending Actions"
                  subtitle="Waiting for your approval"
                  accent="#FF6B35"
                />
                <div style={{ padding: "0 24px 24px" }}>

                  {pendingLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Loader2 style={{ width: 15, height: 15, color: "#A8A5A0", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Loading…</span>
                    </div>
                  ) : pending.length === 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.18)" }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: "#16A34A", flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: "#16A34A", fontWeight: 500, fontFamily: "var(--font-inter)" }}>
                        All clear — no pending actions. Adur is watching your account.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {pending.map((action) => {
                        const busy      = processing === action.id;
                        const executed  = justExecuted.has(action.id);
                        const actColor  = ACTION_COLORS[action.action_type] ?? ACTION_COLORS.alert;
                        const ActionIcon = action.action_type === "pause" ? Pause :
                                          action.action_type === "scale" ? TrendingUp : Bell;

                        return (
                          <div
                            key={action.id}
                            style={{ border: "1px solid #E8E5E0", borderRadius: 14, overflow: "hidden", opacity: busy ? 0.7 : 1, transition: "opacity 0.2s" }}
                          >
                            {/* Card top */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#F7F5F2", borderBottom: "1px solid #EEEBE5" }}>
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: actColor.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <ActionIcon style={{ width: 13, height: 13, color: actColor.color }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {action.campaign_name}
                                </p>
                                {action.action_type === "scale" && action.new_budget && (
                                  <p style={{ fontSize: 11, color: "#16A34A", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
                                    New daily budget: ${action.new_budget}/day
                                  </p>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: actColor.bg, color: actColor.color, fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  {action.action_type}
                                </span>
                                <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: "rgba(234,179,8,0.12)", color: "#A16207", fontFamily: "var(--font-inter)" }}>
                                  Pending
                                </span>
                              </div>
                            </div>

                            {/* Card body */}
                            <div style={{ padding: "12px 16px 14px" }}>
                              <p style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.6, marginBottom: 10 }}>
                                {action.reason}
                              </p>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <Clock style={{ width: 11, height: 11, color: "#A8A5A0" }} />
                                  <span style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                                    Pending for {timeSince(action.created_at)}
                                  </span>
                                </div>
                                {executed ? (
                                  <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 100, background: "rgba(22,163,74,0.10)", color: "#16A34A", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-inter)" }}>
                                    <CheckCircle2 style={{ width: 12, height: 12 }} /> Executed ✓
                                  </span>
                                ) : (
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => handleApprove(action.id)} disabled={busy}
                                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 100, background: "linear-gradient(135deg,#16A34A,#22c55e)", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-inter)", border: "none", cursor: busy ? "not-allowed" : "pointer" }}>
                                      {busy ? <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} /> : <CheckCircle2 style={{ width: 11, height: 11 }} />}
                                      Approve
                                    </button>
                                    <button onClick={() => handleReject(action.id)} disabled={busy}
                                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 100, background: "#fff", color: "#e17055", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-inter)", border: "1px solid rgba(225,112,85,0.28)", cursor: busy ? "not-allowed" : "pointer" }}>
                                      <XCircle style={{ width: 11, height: 11 }} />
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SectionCard>
            </motion.div>

            {/* ══════════════════════════════════════════════════
                SECTION 4 — ACTION HISTORY
            ═══════════════════════════════════════════════════ */}
            <motion.div {...fade(0.16)}>
              <SectionCard>
                <SectionHeader
                  title="Action History"
                  subtitle="Everything Adur has done on your account"
                  accent="#0866FF"
                />
                <div style={{ padding: "0 24px 24px" }}>

                  {/* Filter tabs */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                    {["all", "executed", "pending", "rejected", "alerted"].map((f) => (
                      <button
                        key={f}
                        onClick={() => { setHistoryFilter(f); setHistoryPage(1); }}
                        style={{
                          padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                          fontFamily: "var(--font-inter)", border: "none", cursor: "pointer",
                          background: historyFilter === f ? "#0D0D12" : "#F0EDE8",
                          color: historyFilter === f ? "#fff" : "#6B6B72",
                          textTransform: "capitalize",
                          transition: "all 0.15s",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", alignSelf: "center" }}>
                      {historyTotal} total
                    </span>
                  </div>

                  {historyLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Loader2 style={{ width: 15, height: 15, color: "#A8A5A0", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Loading history…</span>
                    </div>
                  ) : history.length === 0 ? (
                    <div style={{ padding: "24px 0", textAlign: "center" }}>
                      <p style={{ fontSize: 14, color: "#A8A5A0", fontFamily: "var(--font-inter)", lineHeight: 1.6 }}>
                        No actions yet. Connect your Meta account and enable monitoring to get started.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Table */}
                      <div style={{ overflowX: "auto" }}>
                        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #F0EDE8" }}>
                              {["Date/Time", "Campaign", "Action", "Reason", "Status", "Result"].map((col) => (
                                <th key={col} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#A8A5A0", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((row, i) => {
                              const stColor = STATUS_COLORS[row.status] ?? STATUS_COLORS.pending;
                              const actColor = ACTION_COLORS[row.action_type] ?? ACTION_COLORS.alert;
                              return (
                                <tr key={row.id} style={{ borderBottom: i < history.length - 1 ? "1px solid #F7F5F2" : "none" }}>
                                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
                                    {formatDateTime(row.created_at)}
                                  </td>
                                  <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#0D0D12", fontFamily: "var(--font-inter)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {row.campaign_name}
                                  </td>
                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{ padding: "3px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: actColor.bg, color: actColor.color, fontFamily: "var(--font-inter)", textTransform: "capitalize", whiteSpace: "nowrap" }}>
                                      {row.action_type}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 12px", fontSize: 11, color: "#6B6B72", fontFamily: "var(--font-inter)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {row.reason}
                                  </td>
                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{ padding: "3px 9px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: stColor.bg, color: stColor.color, fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
                                      {stColor.label}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 12px", fontSize: 11, color: "#6B6B72", fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
                                    {actionResult(row)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>{/* /overflow-x-auto */}
                      </div>

                      {/* Pagination */}
                      {historyPageCount > 1 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
                          <button
                            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                            disabled={historyPage === 1}
                            style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #E8E5E0", background: "#F7F5F2", cursor: historyPage === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: historyPage === 1 ? 0.4 : 1 }}
                          >
                            <ChevronLeft style={{ width: 14, height: 14, color: "#6B6B72" }} />
                          </button>
                          {Array.from({ length: historyPageCount }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setHistoryPage(p)}
                              style={{
                                width: 32, height: 32, borderRadius: 9, fontSize: 12, fontWeight: 600,
                                fontFamily: "var(--font-inter)", cursor: "pointer",
                                border: p === historyPage ? "none" : "1px solid #E8E5E0",
                                background: p === historyPage ? "#0D0D12" : "#F7F5F2",
                                color: p === historyPage ? "#fff" : "#6B6B72",
                              }}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setHistoryPage((p) => Math.min(historyPageCount, p + 1))}
                            disabled={historyPage === historyPageCount}
                            style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #E8E5E0", background: "#F7F5F2", cursor: historyPage === historyPageCount ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: historyPage === historyPageCount ? 0.4 : 1 }}
                          >
                            <ChevronRight style={{ width: 14, height: 14, color: "#6B6B72" }} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </SectionCard>
            </motion.div>

            <div className="pb-8" />
            </> /* end isPro gate */}
          </div>
        </main>
        </VerifyGate>
      </div>

      {/* ══════════════════════════════════════════════════
          CONFIRMATION MODAL — Full Autopilot
      ═══════════════════════════════════════════════════ */}
      {pendingMode === "auto" && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setPendingMode(null)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,13,18,0.55)", backdropFilter: "blur(4px)" }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", background: "#fff", borderRadius: 20, padding: "28px", maxWidth: 400, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,107,53,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertTriangle style={{ width: 20, height: 20, color: "#FF6B35" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 10 }}>
              Enable Full Autopilot?
            </h3>
            <p style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.6, marginBottom: 20 }}>
              Adur will make changes to your <strong style={{ color: "#0D0D12" }}>live campaigns</strong> without asking first — pausing underperformers and scaling winners automatically. You&apos;ll receive email notifications after each action.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setMode("auto");
                  setPendingMode(null);
                }}
                style={{ flex: 1, padding: "11px", borderRadius: 100, background: "linear-gradient(135deg,#FF6B35,#FF3CAC)", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-inter)", border: "none", cursor: "pointer" }}
              >
                Yes, enable Autopilot
              </button>
              <button
                onClick={() => setPendingMode(null)}
                style={{ flex: 1, padding: "11px", borderRadius: 100, background: "#F7F5F2", color: "#6B6B72", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-inter)", border: "1px solid #E8E5E0", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Coming-soon toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            zIndex: 60, background: "#0D0D12", color: "#fff",
            padding: "13px 22px", borderRadius: 100,
            fontSize: 13, fontWeight: 600, fontFamily: "var(--font-inter)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.28)",
            display: "flex", alignItems: "center", gap: 9, maxWidth: "90vw",
          }}
        >
          <Clock style={{ width: 15, height: 15, color: "#8b5cf6", flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}
