"use client";

import { useEffect, useState } from "react";
import { Shield, Bot, Bell, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

type AutopilotMode = "confirm" | "auto" | "off";

interface Settings {
  autopilotMode:  AutopilotMode;
  targetCpa:      string;
  breakEvenRoas:  string;
}

export default function AutopilotSettings() {
  const [settings, setSettings]   = useState<Settings>({
    autopilotMode: "confirm",
    targetCpa:     "50",
    breakEvenRoas: "2",
  });
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState(false);
  const [saved,    setSaved]      = useState(false);
  const [notConn,  setNotConn]    = useState(false);

  useEffect(() => {
    fetch("/api/meta/status")
      .then((r) => r.json())
      .then((d: {
        connected: boolean;
        autopilotEnabled?: boolean;
        autopilotMode?: string;
        targetCpa?: number;
        breakEvenRoas?: number;
      }) => {
        if (!d.connected) { setNotConn(true); return; }
        setSettings({
          autopilotMode: (d.autopilotMode as AutopilotMode) ?? "confirm",
          targetCpa:     String(d.targetCpa     ?? 50),
          breakEvenRoas: String(d.breakEvenRoas ?? 2),
        });
      })
      .catch(() => setNotConn(true))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/meta/autopilot-mode", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autopilot_mode:  settings.autopilotMode,
          target_cpa:      parseFloat(settings.targetCpa)     || 50,
          break_even_roas: parseFloat(settings.breakEvenRoas) || 2,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const MODES: Array<{
    id:      AutopilotMode;
    icon:    React.ElementType;
    label:   string;
    badge?:  string;
    desc:    string;
    warning?: string;
    iconColor: string;
    iconBg:    string;
    border:    string;
    activeBorder: string;
  }> = [
    {
      id:           "confirm",
      icon:         Shield,
      label:        "Always Confirm",
      badge:        "Recommended",
      desc:         "Adur asks before every change. You stay in full control.",
      iconColor:    "#7C3AED",
      iconBg:       "rgba(124,58,237,0.10)",
      border:       "1px solid #E8E5E0",
      activeBorder: "2px solid #7C3AED",
    },
    {
      id:           "auto",
      icon:         Bot,
      label:        "Full Autopilot",
      desc:         "Adur executes immediately and notifies you after.",
      warning:      "Adur will make changes to your campaigns automatically",
      iconColor:    "#FF6B35",
      iconBg:       "rgba(255,107,53,0.10)",
      border:       "1px solid #E8E5E0",
      activeBorder: "2px solid #FF6B35",
    },
    {
      id:           "off",
      icon:         Bell,
      label:        "Alerts Only",
      desc:         "Adur watches and alerts — you execute manually.",
      iconColor:    "#0866FF",
      iconBg:       "rgba(8,102,255,0.10)",
      border:       "1px solid #E8E5E0",
      activeBorder: "2px solid #0866FF",
    },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "24px" }}>
      <Loader2 style={{ width: 16, height: 16, color: "#A8A5A0", animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Loading settings…</span>
    </div>
  );

  if (notConn) return null; // only show when Meta is connected

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E8E5E0",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #7C3AED, #FF6B35)" }} />
      <div style={{ padding: "22px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 3 }}>
            Autopilot Settings
          </h3>
          <p style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
            Choose how Adur handles detected issues in your campaigns
          </p>
        </div>

        {/* Mode cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {MODES.map((mode) => {
            const active = settings.autopilotMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSettings((s) => ({ ...s, autopilotMode: mode.id }))}
                style={{
                  display:      "flex",
                  flexDirection: "column",
                  alignItems:   "flex-start",
                  gap:          10,
                  padding:      "14px",
                  borderRadius: 14,
                  border:       active ? mode.activeBorder : mode.border,
                  background:   active ? `${mode.iconBg}` : "#F7F5F2",
                  cursor:       "pointer",
                  textAlign:    "left",
                  transition:   "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: mode.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <mode.icon style={{ width: 15, height: 15, color: mode.iconColor }} />
                  </div>
                  {mode.badge && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: mode.iconColor,
                      background: mode.iconBg, padding: "3px 7px",
                      borderRadius: 100, textTransform: "uppercase" as const,
                      letterSpacing: "0.06em", fontFamily: "var(--font-inter)",
                    }}>
                      {mode.badge}
                    </span>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0D0D12", fontFamily: "var(--font-inter)", marginBottom: 3 }}>
                    {mode.label}
                  </p>
                  <p style={{ fontSize: 11, color: "#6B6B72", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>
                    {mode.desc}
                  </p>
                </div>
                {mode.warning && active && (
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 5,
                    padding: "7px 9px", borderRadius: 8,
                    background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)",
                  }}>
                    <AlertTriangle style={{ width: 11, height: 11, color: "#FF6B35", flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 10, color: "#FF6B35", fontFamily: "var(--font-inter)", lineHeight: 1.4 }}>
                      {mode.warning}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detection thresholds */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#6B6B72", fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Detection Thresholds
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "targetCpa",     label: "Target CPA ($)",    placeholder: "50" },
              { key: "breakEvenRoas", label: "Break-even ROAS (×)", placeholder: "2" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B6B72", fontFamily: "var(--font-inter)", marginBottom: 4 }}>
                  {label}
                </label>
                <input
                  type="number"
                  value={settings[key as keyof Settings] as string}
                  placeholder={placeholder}
                  onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 10,
                    border: "1px solid #E8E5E0", background: "#F7F5F2",
                    fontSize: 13, fontFamily: "var(--font-inter)", color: "#0D0D12",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            7,
            padding:        "10px 22px",
            borderRadius:   100,
            background:     saving ? "#9ca3af" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
            color:          "#fff",
            fontSize:       13,
            fontWeight:     700,
            fontFamily:     "var(--font-inter)",
            border:         "none",
            cursor:         saving ? "not-allowed" : "pointer",
            boxShadow:      saving ? "none" : "0 4px 14px rgba(255,60,172,0.28)",
            transition:     "all 0.15s",
          }}
        >
          {saving
            ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
            : saved
              ? <CheckCircle2 style={{ width: 13, height: 13 }} />
              : null
          }
          {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
