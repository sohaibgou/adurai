"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { CampaignSummary, CampaignObjective } from "@/lib/types";

interface CampaignTableProps {
  summaries: CampaignSummary[];
  analysisMode?: "roas" | "traffic";
}

function getRoasBadge(roas: number): { bg: string; text: string; label: string } {
  if (roas >= 2) return { bg: "#e6faf6", text: "#007a5e", label: "Good" };
  if (roas >= 1) return { bg: "#fff8e6", text: "#a05c00", label: "Break-even" };
  return { bg: "#fdf0ed", text: "#b04030", label: "Under" };
}

function getCostBadge(costPerResult: number): { bg: string; text: string; label: string } {
  if (costPerResult <= 30) return { bg: "#e6faf6", text: "#007a5e", label: "Good" };
  if (costPerResult <= 60) return { bg: "#fff8e6", text: "#a05c00", label: "Moderate" };
  return { bg: "#fdf0ed", text: "#b04030", label: "Expensive" };
}

function getRoasColor(roas: number): string {
  if (roas >= 2) return "#00b894";
  if (roas >= 1) return "#fdcb6e";
  return "#e17055";
}

const OBJECTIVE_BADGE: Record<CampaignObjective, { bg: string; text: string; label: string }> = {
  TRAFFIC:     { bg: "#eef2ff", text: "#4338ca", label: "Traffic" },
  CONVERSIONS: { bg: "#f0edff", text: "#5b21b6", label: "Conversions" },
  LEADS:       { bg: "#fff4e6", text: "#9a3412", label: "Leads" },
  ENGAGEMENT:  { bg: "#fdf2f8", text: "#9d174d", label: "Engagement" },
  UNKNOWN:     { bg: "#f4f4f8", text: "#6b7280", label: "Unknown" },
};

function ColHeader({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      className={`py-3.5 font-medium whitespace-nowrap ${align === "right" ? "px-4 text-right" : align === "center" ? "px-4 text-center" : "px-6 text-left"}`}
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--muted)",
        background: "var(--surface)",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      {children}
    </th>
  );
}

export default function CampaignTable({ summaries, analysisMode = "roas" }: CampaignTableProps) {
  const isTraffic = analysisMode === "traffic";
  const sorted = [...summaries].sort((a, b) =>
    isTraffic ? a.costPerResult - b.costPerResult : b.spend - a.spend
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "var(--card-border)" }}>
        <p className="section-label mb-1.5">Campaign Data</p>
        <div className="flex items-baseline gap-3">
          <h2
            className="font-heading font-bold"
            style={{ fontSize: 22, letterSpacing: "-0.03em", color: "var(--foreground)" }}
          >
            Campaign Performance
          </h2>
          <span
            className="badge"
            style={{ background: "#f0edff", color: "#5b21b6", fontSize: 11 }}
          >
            {sorted.length} campaigns
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-sticky">
          <thead>
            <tr>
              <ColHeader>Campaign</ColHeader>
              <ColHeader>Objective</ColHeader>
              <ColHeader align="right">Spend</ColHeader>
              {!isTraffic && <ColHeader align="right">Revenue</ColHeader>}
              {!isTraffic && <ColHeader align="right">ROAS</ColHeader>}
              <ColHeader align="right">CPC</ColHeader>
              <ColHeader align="right">CTR</ColHeader>
              <ColHeader align="right">{isTraffic ? "Results" : "Conv."}</ColHeader>
              <ColHeader align="right">Cost / Result</ColHeader>
              <ColHeader align="center">Status</ColHeader>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const badge = isTraffic ? getCostBadge(c.costPerResult) : getRoasBadge(c.roas);
              const objBadge = OBJECTIVE_BADGE[c.objective] || OBJECTIVE_BADGE.UNKNOWN;
              const isTrafficCampaign = c.objective === "TRAFFIC" || c.objective === "ENGAGEMENT";
              const rowBg = i % 2 === 1 ? "#fafafa" : "#ffffff";

              return (
                <tr
                  key={c.campaignName}
                  className="transition-colors duration-150 cursor-default"
                  style={{ backgroundColor: rowBg, borderBottom: "1px solid var(--card-border)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#f8f6ff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = rowBg;
                  }}
                >
                  {/* Name */}
                  <td className="px-6 py-4 font-medium max-w-[260px]" style={{ color: "var(--foreground)" }}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{c.campaignName}</span>
                      {isTrafficCampaign && (
                        <span title="Traffic campaign — do not scale on conversion metrics">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#fdcb6e" }} />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Objective */}
                  <td className="px-4 py-4">
                    <span className="badge" style={{ backgroundColor: objBadge.bg, color: objBadge.text }}>
                      {objBadge.label}
                    </span>
                  </td>

                  {/* Spend */}
                  <td
                    className="px-4 py-4 text-right tabular-nums font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    ${c.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Revenue */}
                  {!isTraffic && (
                    <td
                      className="px-4 py-4 text-right tabular-nums"
                      style={{ color: "var(--foreground)" }}
                    >
                      ${c.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  )}

                  {/* ROAS */}
                  {!isTraffic && (
                    <td
                      className="px-4 py-4 text-right tabular-nums font-bold"
                      style={{
                        color: getRoasColor(c.roas),
                        fontFamily: "var(--font-syne)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {c.roas}x
                    </td>
                  )}

                  {/* CPC */}
                  <td className="px-4 py-4 text-right tabular-nums" style={{ color: "var(--muted)" }}>
                    ${c.cpc.toFixed(2)}
                  </td>

                  {/* CTR */}
                  <td className="px-4 py-4 text-right tabular-nums" style={{ color: "var(--muted)" }}>
                    {c.ctr}%
                  </td>

                  {/* Conversions */}
                  <td
                    className="px-4 py-4 text-right tabular-nums font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {c.conversions.toLocaleString()}
                  </td>

                  {/* Cost / Result */}
                  <td
                    className="px-4 py-4 text-right tabular-nums font-semibold"
                    style={{
                      color: isTraffic
                        ? getCostBadge(c.costPerResult).text
                        : "var(--foreground)",
                    }}
                  >
                    ${c.costPerResult.toFixed(2)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    {isTrafficCampaign ? (
                      <span
                        className="badge"
                        style={{ background: "#fff8e6", color: "#a05c00" }}
                      >
                        Do Not Scale
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: badge.bg, color: badge.text }}>
                        {badge.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
