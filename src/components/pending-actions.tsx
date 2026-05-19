"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, Pause, TrendingUp, Bell, Clock } from "lucide-react";

interface AutoAction {
  id:            string;
  campaign_id:   string;
  campaign_name: string;
  action_type:   "pause" | "scale" | "alert";
  reason:        string;
  status:        string;
  new_budget:    number | null;
  executed_at:   string | null;
  created_at:    string;
}

function timeSince(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs !== 1 ? "s" : ""}`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? "s" : ""}`;
}

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pause: { label: "Pause Campaign",    icon: Pause,      color: "#e17055", bg: "rgba(225,112,85,0.10)" },
  scale: { label: "Increase Budget",   icon: TrendingUp, color: "#16A34A", bg: "rgba(22,163,74,0.10)"  },
  alert: { label: "Review Needed",     icon: Bell,       color: "#0866FF", bg: "rgba(8,102,255,0.10)"  },
};

export default function PendingActions() {
  const [actions,    setActions]    = useState<AutoAction[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState<string | null>(null); // action id being processed

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/meta/actions?status=pending")
      .then((r) => r.json())
      .then((d: { actions?: AutoAction[] }) => setActions(d.actions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      const res = await fetch("/api/meta/approve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action_id: id }),
      });
      if (res.ok) setActions((prev) => prev.filter((a) => a.id !== id));
      else console.error("Approve failed:", await res.text());
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    setProcessing(id);
    try {
      const res = await fetch("/api/meta/reject", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action_id: id }),
      });
      if (res.ok) setActions((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div style={{
      background:   "#FFFFFF",
      border:       "1px solid #E8E5E0",
      borderRadius: 20,
      overflow:     "hidden",
      boxShadow:    "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #FF3CAC, #FF6B35)" }} />
      <div style={{ padding: "22px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 2 }}>
              Pending Actions
            </h3>
            <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
              {loading ? "Loading…" : actions.length === 0 ? "Adur is watching your account" : `${actions.length} action${actions.length !== 1 ? "s" : ""} waiting for approval`}
            </p>
          </div>
          {!loading && actions.length > 0 && (
            <span style={{
              padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 700,
              background: "rgba(255,60,172,0.08)", color: "#FF3CAC",
              fontFamily: "var(--font-inter)", border: "1px solid rgba(255,60,172,0.20)",
            }}>
              {actions.length}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <Loader2 style={{ width: 15, height: 15, color: "#A8A5A0", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Checking actions…</span>
          </div>

        ) : actions.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.15)" }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: "#16A34A", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#16A34A", fontFamily: "var(--font-inter)", fontWeight: 500 }}>
              No pending actions — Adur is watching your account
            </p>
          </div>

        ) : (
          /* Action cards */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actions.map((action) => {
              const meta    = ACTION_META[action.action_type] ?? ACTION_META.alert;
              const busy    = processing === action.id;
              const Icon    = meta.icon;

              return (
                <div
                  key={action.id}
                  style={{
                    borderRadius: 14,
                    border:       "1px solid #E8E5E0",
                    overflow:     "hidden",
                    opacity:      busy ? 0.65 : 1,
                    transition:   "opacity 0.2s",
                  }}
                >
                  {/* Action header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F7F5F2" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 14, height: 14, color: meta.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {meta.label}: {action.campaign_name}
                      </p>
                      {action.action_type === "scale" && action.new_budget && (
                        <p style={{ fontSize: 11, color: "#16A34A", fontFamily: "var(--font-inter)", fontWeight: 600 }}>
                          New daily budget: ${action.new_budget}/day
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <Clock style={{ width: 11, height: 11, color: "#A8A5A0" }} />
                      <span style={{ fontSize: 11, color: "#A8A5A0", fontFamily: "var(--font-inter)", whiteSpace: "nowrap" }}>
                        {timeSince(action.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div style={{ padding: "10px 14px 12px" }}>
                    <p style={{ fontSize: 12, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.55, marginBottom: 12 }}>
                      {action.reason}
                    </p>

                    {/* Approve / Reject */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleApprove(action.id)}
                        disabled={busy}
                        style={{
                          flex:         1,
                          display:      "flex",
                          alignItems:   "center",
                          justifyContent: "center",
                          gap:          6,
                          padding:      "9px 14px",
                          borderRadius: 100,
                          background:   "linear-gradient(135deg, #16A34A, #22c55e)",
                          color:        "#fff",
                          fontSize:     12,
                          fontWeight:   700,
                          fontFamily:   "var(--font-inter)",
                          border:       "none",
                          cursor:       busy ? "not-allowed" : "pointer",
                        }}
                      >
                        {busy
                          ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
                          : <CheckCircle2 style={{ width: 12, height: 12 }} />
                        }
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(action.id)}
                        disabled={busy}
                        style={{
                          flex:         1,
                          display:      "flex",
                          alignItems:   "center",
                          justifyContent: "center",
                          gap:          6,
                          padding:      "9px 14px",
                          borderRadius: 100,
                          background:   "#fff",
                          color:        "#e17055",
                          fontSize:     12,
                          fontWeight:   700,
                          fontFamily:   "var(--font-inter)",
                          border:       "1px solid rgba(225,112,85,0.28)",
                          cursor:       busy ? "not-allowed" : "pointer",
                        }}
                      >
                        <XCircle style={{ width: 12, height: 12 }} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
