"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Crown, Sparkles } from "lucide-react";

/* ── Props ──────────────────────────────────────────────── */

export interface AppSidebarProps {
  activePage: "dashboard" | "analyze" | "results" | "creative-studio" | "autopilot";
  isPaid?: boolean;
  subLoading?: boolean;
  user?: { email?: string } | null;
  analysisCount?: number;
  onSignOut?: () => void;
  onUpgrade?: () => void;
  /** Optional real data for nav badges — render only when provided. */
  lastScore?: number;
  pendingCount?: number;
  /** Color of the mobile hamburger icon. Use a light value on dark-header pages. */
  menuIconColor?: string;
}

/* ── Design tokens ──────────────────────────────────────── */
const C = {
  white: "#FFFFFF", bg: "#F4F2EF", ink: "#0D0D12", ink2: "#6B6B72",
  ink3: "#A8A5A0", border: "#E4E0DB", border2: "#D4D0CA", accent: "#FF3CAC",
  grad: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)", danger: "#DC2626",
};
const FREE_LIMIT = 3;

/* ── Nav icons (match reference SVGs) ───────────────────── */
const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  ),
  analyze: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  results: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  ),
  "creative-studio": (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  ),
  autopilot: (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  ),
};

/* ── Nav definition (grouped by section) ────────────────── */
const NAV_GROUPS = [
  { label: "Overview",   items: [{ id: "dashboard", label: "Dashboard", href: "/dashboard" }] },
  { label: "Analysis",   items: [
    { id: "analyze", label: "New Analysis", href: "/analyze" },
    { id: "results", label: "Last Results", href: "/results" },
  ] },
  { label: "Create",     items: [{ id: "creative-studio", label: "Creative Studio", href: "/creative-studio" }] },
  { label: "Automation", items: [{ id: "autopilot", label: "AI Manager", href: "/dashboard/autopilot" }] },
] as const;

/* ── Logout SVG (reference) ─────────────────────────────── */
const LogoutIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

/* ── Shared inner content ───────────────────────────────── */

function SidebarInner({
  activePage, isPaid, subLoading, user, analysisCount,
  onSignOut, onUpgrade, onLinkClick, lastScore, pendingCount,
}: AppSidebarProps & { onLinkClick?: () => void }) {
  const username  = (user?.email?.split("@")[0]) || "User";
  const initial   = (user?.email?.[0] ?? "U").toUpperCase();
  const remaining = Math.max(0, FREE_LIMIT - (analysisCount || 0));

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "var(--font-inter)" }}>
      {/* ── Logo (our real brand mark) ── */}
      <div className="flex items-center" style={{ padding: "20px 18px 18px", borderBottom: `1px solid ${C.border}` }}>
        <Link href="/" onClick={onLinkClick} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 32, width: "auto" }} />
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink3, padding: "10px 8px 4px" }}>{group.label}</div>
            {group.items.map(({ id, label, href }) => {
              const active = activePage === id;
              const badge =
                id === "creative-studio" ? { text: "NEW", kind: "new" as const } :
                id === "results" && typeof lastScore === "number" ? { text: `Score ${lastScore}`, kind: "default" as const } :
                id === "autopilot" && typeof pendingCount === "number" && pendingCount > 0 ? { text: `${pendingCount} pending`, kind: "alert" as const } :
                null;
              return (
                <Link
                  key={id}
                  href={href}
                  onClick={onLinkClick}
                  className="group no-underline"
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "9px 10px", borderRadius: 9, transition: "all 0.15s",
                    textDecoration: "none", fontSize: 13, fontWeight: 500,
                    color: active ? C.ink : C.ink2,
                    background: active ? C.bg : "transparent",
                    border: `1px solid ${active ? C.border : "transparent"}`,
                  }}
                  onMouseEnter={e => { if (!active) { const a = e.currentTarget as HTMLElement; a.style.background = C.bg; a.style.color = C.ink; } }}
                  onMouseLeave={e => { if (!active) { const a = e.currentTarget as HTMLElement; a.style.background = "transparent"; a.style.color = C.ink2; } }}
                >
                  <span style={{ width: 16, height: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: active ? C.accent : C.ink3 }}>
                    {ICONS[id]}
                  </span>
                  <span>{label}</span>
                  {badge && (
                    <span style={{
                      marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 100,
                      ...(badge.kind === "new"
                        ? { background: C.grad, color: "#fff" }
                        : badge.kind === "alert"
                        ? { background: "#FEE2E2", color: C.danger }
                        : { background: "rgba(255,60,172,0.1)", color: C.accent }),
                    }}>
                      {badge.text}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${C.border}` }}>
        {/* Plan pill */}
        {!subLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
            {isPaid
              ? <Crown size={15} strokeWidth={2.2} style={{ color: "#D97706", flexShrink: 0 }} />
              : <Sparkles size={15} strokeWidth={2.2} style={{ color: C.accent, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{isPaid ? "Starter Plan" : "Free Plan"}</div>
              <div style={{ fontSize: 10, color: C.ink3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{remaining} of {FREE_LIMIT} analyses left</div>
            </div>
            {!isPaid && onUpgrade && (
              <button
                onClick={onUpgrade}
                style={{ fontSize: 9, fontWeight: 700, color: C.accent, background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.2)", borderRadius: 5, padding: "2px 6px", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,60,172,0.14)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,60,172,0.08)"; }}
              >
                Upgrade
              </button>
            )}
          </div>
        )}

        {/* User row */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div title={user.email} style={{ fontSize: 11, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
              <div style={{ fontSize: 10, color: C.ink3 }}>{isPaid ? "Starter" : "Free"}</div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign out"
              style={{ color: C.ink3, cursor: "pointer", padding: 4, borderRadius: 5, transition: "color 0.15s", flexShrink: 0, background: "none", border: "none", display: "flex" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.ink; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.ink3; }}
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-1">
            <Link href="/login" onClick={onLinkClick} className="w-full text-center py-2 rounded-xl text-sm font-semibold no-underline" style={{ border: `1px solid ${C.border}`, color: C.ink, background: "transparent" }}>Sign In</Link>
            <Link href="/signup" onClick={onLinkClick} className="w-full text-center py-2 rounded-xl text-sm font-bold no-underline" style={{ background: C.grad, color: "#fff", boxShadow: "0 4px 12px rgba(255,60,172,0.28)" }}>Get Started Free</Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */

export default function AppSidebar(props: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* DESKTOP SIDEBAR (lg+) */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30"
        style={{ width: 240, background: C.white, borderRight: `1px solid ${C.border}` }}
      >
        <SidebarInner {...props} />
      </aside>

      {/* MOBILE HAMBURGER */}
      <button
        className="lg:hidden fixed z-40 flex items-center justify-center"
        style={{ top: 0, left: 0, width: 56, height: 64, background: "none", border: "none", cursor: "pointer" }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" style={{ color: props.menuIconColor ?? C.ink }} />
      </button>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(13,13,18,0.52)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden"
              style={{ width: 272, background: C.white, borderRight: `1px solid ${C.border}`, boxShadow: "6px 0 32px rgba(0,0,0,0.10)" }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute flex items-center justify-center rounded-xl transition-all"
                style={{ top: 16, right: 14, width: 32, height: 32, background: C.bg, border: `1px solid ${C.border}`, color: C.ink3, cursor: "pointer", zIndex: 10 }}
                aria-label="Close menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <SidebarInner {...props} onLinkClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
