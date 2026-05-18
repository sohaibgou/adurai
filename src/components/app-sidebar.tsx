"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Palette,
  LogOut,
  Zap,
  Crown,
} from "lucide-react";

/* ── Props ──────────────────────────────────────────────── */

export interface AppSidebarProps {
  activePage: "dashboard" | "analyze" | "results" | "creative-studio";
  isPaid?: boolean;
  subLoading?: boolean;
  user?: { email?: string } | null;
  analysisCount?: number;
  onSignOut?: () => void;
  onUpgrade?: () => void;
}

/* ── Nav definition ─────────────────────────────────────── */

const NAV_ITEMS = [
  { id: "dashboard",       label: "Dashboard",       href: "/dashboard",        icon: LayoutDashboard },
  { id: "analyze",         label: "New Analysis",    href: "/analyze",          icon: Upload          },
  { id: "results",         label: "Last Results",    href: "/results",          icon: FileText        },
  { id: "creative-studio", label: "Creative Studio", href: "/creative-studio",  icon: Palette         },
] as const;

const FREE_LIMIT = 3;

/* ── Component ──────────────────────────────────────────── */

export default function AppSidebar({
  activePage,
  isPaid      = false,
  subLoading  = false,
  user        = null,
  analysisCount = 0,
  onSignOut,
  onUpgrade,
}: AppSidebarProps) {
  const initial  = (user?.email?.[0] ?? "U").toUpperCase();
  const remaining = Math.max(0, FREE_LIMIT - (analysisCount || 0));

  return (
    <aside
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30"
      style={{ width: 240, background: "#FFFFFF", borderRight: "1px solid #E8E5E0" }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 4px 12px rgba(255,60,172,0.28)",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>A</span>
        </div>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            className="font-heading font-bold"
            style={{ fontSize: 18, color: "#0D0D12", letterSpacing: "-0.03em" }}
          >
            Adur
            <span
              style={{
                background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              .ai
            </span>
          </span>
        </Link>
      </div>

      {/* ── Thin divider ── */}
      <div style={{ height: 1, background: "#F0EDE8", margin: "0 16px 8px" }} />

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label, href, icon: Icon }) => {
          const active = activePage === id;
          return (
            <Link
              key={id}
              href={href}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left no-underline group"
              style={{
                background: active
                  ? "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)"
                  : "transparent",
                boxShadow: active ? "0 4px 16px rgba(255,60,172,0.26)" : "none",
                textDecoration: "none",
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "#F7F5F2";
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: active ? "#fff" : "#6B6B72" }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#fff" : "#4B4B55",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="px-3 pb-5 space-y-3">
        {/* Upgrade pill / Plan pill */}
        {!subLoading && !isPaid && (
          <button
            onClick={onUpgrade}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer transition-all text-left"
            style={{
              background: "linear-gradient(135deg, rgba(255,60,172,0.08), rgba(255,107,53,0.06))",
              border: "1px solid rgba(255,60,172,0.20)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, rgba(255,60,172,0.14), rgba(255,107,53,0.10))";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, rgba(255,60,172,0.08), rgba(255,107,53,0.06))";
            }}
          >
            <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "#FF3CAC" }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#FF3CAC", fontFamily: "var(--font-inter)", lineHeight: 1.3 }}>
                Upgrade to Starter
              </p>
              <p style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                $19/mo · Unlimited
              </p>
            </div>
          </button>
        )}

        {!subLoading && isPaid && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.18)" }}
          >
            <Crown className="w-4 h-4 flex-shrink-0" style={{ color: "#16A34A" }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", fontFamily: "var(--font-inter)" }}>
                Starter Plan
              </p>
              <p style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                {remaining} of {FREE_LIMIT} analyses left
              </p>
            </div>
          </div>
        )}

        {/* Thin divider */}
        <div style={{ height: 1, background: "#F0EDE8" }} />

        {/* User row */}
        {user ? (
          <div className="flex items-center gap-3 px-1">
            {/* Avatar */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 34, height: 34,
                background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                boxShadow: "0 3px 10px rgba(255,60,172,0.26)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "var(--font-inter)" }}>
                {initial}
              </span>
            </div>
            {/* Email */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontSize: 12, fontWeight: 600, color: "#0D0D12",
                  fontFamily: "var(--font-inter)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </p>
              <p style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                {isPaid ? "Starter" : "Free Plan"}
              </p>
            </div>
            {/* Sign out */}
            <button
              onClick={onSignOut}
              className="flex-shrink-0 flex items-center justify-center cursor-pointer rounded-lg transition-all"
              style={{ width: 30, height: 30, background: "none", border: "none", color: "#A8A5A0" }}
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color = "#e17055";
                b.style.background = "rgba(225,112,85,0.08)";
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color = "#A8A5A0";
                b.style.background = "none";
              }}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* No user: Sign In + Get Started */
          <div className="flex flex-col gap-2 px-1">
            <Link
              href="/login"
              className="w-full text-center py-2 rounded-xl text-sm font-semibold transition-all no-underline"
              style={{
                border: "1px solid #E8E5E0",
                color: "#0D0D12",
                fontFamily: "var(--font-inter)",
                background: "transparent",
              }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full text-center py-2 rounded-xl text-sm font-bold transition-all no-underline"
              style={{
                background: "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                color: "#fff",
                fontFamily: "var(--font-inter)",
                boxShadow: "0 4px 12px rgba(255,60,172,0.28)",
              }}
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
