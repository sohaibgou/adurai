"use client";

/**
 * /admin — founder-only metrics dashboard.
 *
 * The client-side email check + redirect here is purely cosmetic UX;
 * the real gate is server-side in /api/admin/stats (403 for non-admins).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const ADMIN_DASHBOARD_EMAILS = ["sohaibtrepreneur@gmail.com", "sohaibitotv@gmail.com"];

interface AdminStats {
  totalSignups:   number;
  payingUsers:    number;
  starterCount:   number;
  growthCount:    number;
  proCount:       number;
  mrr:            number;
  totalAnalyses:  number;
  totalUgcVideos: number;
  latestSignups:  { email: string; date: string }[];
  latestPayments: { email: string; plan: string; date: string }[];
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E5E0",
  borderRadius: 16,
  padding: "18px 20px",
};

const TH: React.CSSProperties = {
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  color: "#A8A5A0",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  padding: "10px 16px",
  borderBottom: "1px solid #E8E5E0",
  fontFamily: "var(--font-inter)",
};

const TD: React.CSSProperties = {
  fontSize: 13,
  color: "#0D0D12",
  padding: "11px 16px",
  borderBottom: "1px solid #F0EDE8",
  fontFamily: "var(--font-inter)",
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!user?.email && ADMIN_DASHBOARD_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    document.title = "Admin — Adur.ai";
  }, []);

  // Non-admins (including logged-out users that slipped past middleware) → home.
  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { router.replace("/"); return; }

    fetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Error ${res.status}`);
        return res.json() as Promise<AdminStats>;
      })
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load stats"));
  }, [authLoading, isAdmin, router]);

  if (authLoading || (!isAdmin && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F5F2" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#A8A5A0" }} />
      </div>
    );
  }

  const statCards: { label: string; value: string }[] = stats
    ? [
        { label: "Total signups",   value: String(stats.totalSignups) },
        { label: "Paying users",    value: String(stats.payingUsers) },
        { label: "Starter",         value: String(stats.starterCount) },
        { label: "Growth",          value: String(stats.growthCount) },
        { label: "Autopilot (Pro)", value: String(stats.proCount) },
        { label: "MRR",             value: `$${stats.mrr.toLocaleString()}` },
        { label: "Analyses run",    value: String(stats.totalAnalyses) },
        { label: "UGC videos",      value: String(stats.totalUgcVideos) },
      ]
    : [];

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "#F7F5F2" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 className="font-heading" style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: "#0D0D12", marginBottom: 4 }}>
          Admin
        </h1>
        <p style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 28 }}>
          Live business metrics — visible only to you.
        </p>

        {error && (
          <div style={{ ...CARD, borderColor: "rgba(225,112,85,0.4)", color: "#e17055", fontSize: 14, fontFamily: "var(--font-inter)", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {!stats && !error && (
          <div className="flex items-center gap-2" style={{ color: "#A8A5A0", fontSize: 14, fontFamily: "var(--font-inter)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading metrics…
          </div>
        )}

        {stats && (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {statCards.map((s) => (
                <div key={s.label} style={CARD}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#A8A5A0", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-inter)", marginBottom: 6 }}>
                    {s.label}
                  </p>
                  <p className="font-heading" style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", color: "#0D0D12" }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Latest signups ── */}
            <div style={{ ...CARD, padding: 0, marginBottom: 24, overflow: "hidden" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0D0D12", padding: "14px 16px 10px", fontFamily: "var(--font-inter)" }}>
                Latest 10 signups
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH}>Email</th>
                    <th style={TH}>Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.latestSignups.length === 0 && (
                    <tr><td style={TD} colSpan={2}>No signups yet</td></tr>
                  )}
                  {stats.latestSignups.map((u, i) => (
                    <tr key={`${u.email}-${i}`}>
                      <td style={TD}>{u.email}</td>
                      <td style={{ ...TD, color: "#6B6B72" }}>{fmtDate(u.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Latest payments ── */}
            <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0D0D12", padding: "14px 16px 10px", fontFamily: "var(--font-inter)" }}>
                Latest 10 payments
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH}>Email</th>
                    <th style={TH}>Plan</th>
                    <th style={TH}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.latestPayments.length === 0 && (
                    <tr><td style={TD} colSpan={3}>No payments yet</td></tr>
                  )}
                  {stats.latestPayments.map((p, i) => (
                    <tr key={`${p.email}-${i}`}>
                      <td style={TD}>{p.email}</td>
                      <td style={TD}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                          background: p.plan === "pro" ? "rgba(108,92,231,0.10)" : "rgba(255,60,172,0.08)",
                          color:      p.plan === "pro" ? "#6c5ce7" : "#FF3CAC",
                          textTransform: "capitalize",
                        }}>
                          {p.plan}
                        </span>
                      </td>
                      <td style={{ ...TD, color: "#6B6B72" }}>{fmtDate(p.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
