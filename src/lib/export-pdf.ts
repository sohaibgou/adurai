import { jsPDF } from "jspdf";
import type { AnalysisResult, OnboardingData } from "@/lib/types";

// ── Color palette (RGB tuples) ─────────────────────────────────────────────
const C = {
  purple:   [108, 92, 231] as const,
  teal:     [0, 206, 201] as const,
  dark:     [13, 13, 26] as const,
  muted:    [107, 114, 128] as const,
  green:    [0, 184, 148] as const,
  red:      [225, 112, 85] as const,
  orange:   [253, 203, 110] as const,
  lightBg:  [248, 248, 252] as const,
  border:   [240, 240, 245] as const,
  white:    [255, 255, 255] as const,
};

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 18;           // left margin
const MR = 18;           // right margin
const CW = PAGE_W - ML - MR; // content width = 174mm

// ── Formatters ─────────────────────────────────────────────────────────────
function fmt$(n: number): string {
  if (!n || isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
function fmtRoas(n: number): string {
  return n > 0 ? `${n.toFixed(2)}x` : "—";
}
function safeStr(x: unknown): string {
  if (typeof x === "string") return x;
  if (typeof x === "object" && x !== null) {
    const o = x as Record<string, unknown>;
    return String(o.action ?? o.text ?? o.recommendation ?? o.insight ?? Object.values(o)[0] ?? "");
  }
  return String(x ?? "");
}

// ── Accent by battle-plan day ───────────────────────────────────────────────
const DAY_ACCENT: Record<number, readonly [number, number, number]> = {
  1: C.red, 2: C.red,
  3: C.purple, 4: C.purple,
  5: C.teal, 6: C.teal,
  7: [9, 132, 227] as const,
};
const EFFORT_COLOR: Record<string, readonly [number, number, number]> = {
  "Quick Win": C.green,
  "Strategic": C.purple,
  "Monitor":   C.teal,
};
const EFFORT_BG: Record<string, readonly [number, number, number]> = {
  "Quick Win": [230, 250, 246] as const,
  "Strategic": [240, 237, 255] as const,
  "Monitor":   [230, 255, 254] as const,
};

export async function exportAnalysisPDF(
  analysis: AnalysisResult,
  onboarding?: OnboardingData | null,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date();
  const dateStr  = today.toISOString().split("T")[0];
  const dateDisp = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  let y = 0;

  // ── Guard: add new page if not enough vertical space ──────────────────────
  const guard = (needed = 20) => {
    if (y + needed > PAGE_H - 16) { doc.addPage(); y = 22; }
  };

  // ── Drawing helpers ───────────────────────────────────────────────────────
  const setColor  = (rgb: readonly [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill   = (rgb: readonly [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setStroke = (rgb: readonly [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

  const hr = (gap = 4) => {
    y += gap;
    setStroke(C.border);
    doc.line(ML, y, PAGE_W - MR, y);
    y += gap;
  };

  const label = (text: string) => {
    guard(10);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(C.purple);
    doc.text(text.toUpperCase(), ML, y);
    y += 5;
  };

  const h2 = (text: string, size = 14) => {
    guard(10);
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    setColor(C.dark);
    doc.text(text, ML, y);
    y += size * 0.42 + 3;
  };

  const body = (text: string, size = 8, color = C.muted) => {
    guard(8);
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    setColor(color);
    const lines = doc.splitTextToSize(text, CW);
    doc.text(lines, ML, y);
    y += lines.length * (size * 0.42) + 2;
  };

  // ════════════════════════════════════════════════════════
  // HEADER BAND
  // ════════════════════════════════════════════════════════
  setFill(C.purple);
  doc.rect(0, 0, PAGE_W, 34, "F");
  setFill(C.teal);
  doc.rect(0, 31, PAGE_W, 3, "F");

  // Logo box
  setFill(C.white);
  doc.roundedRect(ML, 9, 10, 10, 2, 2, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  setColor(C.purple);
  doc.text("A", ML + 3.2, 16.2);

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  setColor(C.white);
  doc.text("Adur.ai", ML + 14, 16.5);

  // Report title / date (right-aligned)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor([200, 200, 220] as const);
  const titleText = "Campaign Analysis Report";
  doc.text(titleText, PAGE_W - MR - doc.getTextWidth(titleText), 12);
  doc.setFontSize(7.5);
  doc.text(dateDisp, PAGE_W - MR - doc.getTextWidth(dateDisp), 20);

  y = 44;

  // ── Onboarding meta bar ───────────────────────────────────────────────────
  if (onboarding) {
    setFill(C.lightBg);
    setStroke(C.border);
    doc.roundedRect(ML, y - 3, CW, 12, 2, 2, "FD");
    const meta = [
      onboarding.product   && `Product: ${onboarding.product}`,
      onboarding.market    && `Market: ${onboarding.market}`,
      onboarding.breakEvenRoas > 0 && `Break-even ROAS: ${onboarding.breakEvenRoas}x`,
      onboarding.mainGoal  && `Goal: ${onboarding.mainGoal}`,
    ].filter(Boolean).join("   ·   ");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setColor(C.muted);
    doc.text(meta, ML + 4, y + 4);
    y += 16;
  }

  // ════════════════════════════════════════════════════════
  // SECTION 1 — OVERVIEW METRICS
  // ════════════════════════════════════════════════════════
  label("Overview Metrics");
  h2("Performance Summary");

  const blendedRoas = analysis.totalSpend > 0 ? analysis.totalRevenue / analysis.totalSpend : 0;
  const roasColor: readonly [number, number, number] = blendedRoas >= 2 ? C.green : blendedRoas > 0 ? C.red : C.muted;

  const metrics = analysis.analysisMode === "roas"
    ? [
        { label: "Total Spend",   value: fmt$(analysis.totalSpend),    color: C.dark  },
        { label: "Total Revenue", value: fmt$(analysis.totalRevenue),   color: C.dark  },
        { label: "Blended ROAS",  value: fmtRoas(blendedRoas),          color: roasColor },
        { label: "Best ROAS",     value: fmtRoas(analysis.convBestRoas), color: C.green },
      ]
    : [
        { label: "Total Spend",     value: fmt$(analysis.totalSpend),                  color: C.dark },
        { label: "Total Results",   value: `${analysis.convResults.toLocaleString()}`, color: C.dark },
        { label: "Avg Cost/Result", value: analysis.convAvgCPR > 0 ? `$${analysis.convAvgCPR.toFixed(2)}` : "—", color: C.dark },
        { label: "Campaigns",       value: `${analysis.summaries.length}`,             color: C.dark },
      ];

  const cardW = (CW - 9) / 4;
  metrics.forEach((m, i) => {
    const cx = ML + i * (cardW + 3);
    setFill(C.white);
    setStroke(C.border);
    doc.roundedRect(cx, y, cardW, 20, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(C.muted);
    doc.text(m.label, cx + 4, y + 7);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    setColor(m.color);
    doc.text(m.value, cx + 4, y + 16);
  });
  y += 25;

  // Health score line
  if (analysis.score > 0) {
    const scoreColor: readonly [number, number, number] =
      analysis.score >= 70 ? C.green : analysis.score >= 40 ? C.orange : C.red;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    setColor(C.muted);
    doc.text("Account Health Score: ", ML, y);
    doc.setFont("helvetica", "bold");
    setColor(scoreColor);
    doc.text(`${analysis.score}/100`, ML + doc.getTextWidth("Account Health Score: ") + 1, y);
    y += 6;
  }

  if (analysis.summary) body(analysis.summary, 8.5, C.muted);

  hr();

  // ════════════════════════════════════════════════════════
  // SECTION 2 — CAMPAIGN TABLE
  // ════════════════════════════════════════════════════════
  guard(28);
  label("Campaign Performance");
  h2("Campaign Breakdown");

  type ColDef = { label: string; w: number };
  const cols: ColDef[] = analysis.analysisMode === "roas"
    ? [
        { label: "Campaign",     w: 66 },
        { label: "Spend",        w: 22 },
        { label: "Revenue",      w: 24 },
        { label: "ROAS",         w: 18 },
        { label: "CTR",          w: 16 },
        { label: "Conv.",        w: 28 },
      ]
    : [
        { label: "Campaign",     w: 72 },
        { label: "Spend",        w: 24 },
        { label: "Results",      w: 22 },
        { label: "Cost/Result",  w: 30 },
        { label: "CTR",          w: 16 },
        { label: "Clicks",       w: 10 },
      ];

  // Header row
  setFill(C.lightBg);
  doc.rect(ML, y, CW, 8, "F");
  let cx_ = ML + 3;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setColor(C.muted);
  cols.forEach(col => { doc.text(col.label, cx_, y + 5.5); cx_ += col.w; });
  y += 9;

  analysis.summaries.forEach((s, i) => {
    guard(9);
    if (i % 2 === 0) {
      setFill([252, 252, 255] as const);
      doc.rect(ML, y, CW, 8, "F");
    }
    const rc: readonly [number, number, number] =
      s.roas >= 3 ? C.green : s.roas >= 1.5 ? C.orange : s.roas > 0 ? C.red : C.muted;

    const vals: string[] = analysis.analysisMode === "roas"
      ? [
          s.campaignName.length > 38 ? s.campaignName.slice(0, 35) + "…" : s.campaignName,
          fmt$(s.spend),
          fmt$(s.revenue),
          s.roas > 0 ? fmtRoas(s.roas) : "—",
          s.ctr > 0 ? `${s.ctr.toFixed(2)}%` : "—",
          s.conversions > 0 ? `${s.conversions}` : s.purchases > 0 ? `${s.purchases}` : "—",
        ]
      : [
          s.campaignName.length > 42 ? s.campaignName.slice(0, 39) + "…" : s.campaignName,
          fmt$(s.spend),
          s.conversions > 0 ? `${s.conversions}` : "—",
          s.costPerResult > 0 ? `$${s.costPerResult.toFixed(2)}` : "—",
          s.ctr > 0 ? `${s.ctr.toFixed(2)}%` : "—",
          `${s.clicks.toLocaleString()}`,
        ];

    cx_ = ML + 3;
    vals.forEach((val, j) => {
      const isRoasCol = j === 3 && analysis.analysisMode === "roas" && s.roas > 0;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", isRoasCol ? "bold" : "normal");
      setColor(isRoasCol ? rc : C.dark);
      doc.text(val, cx_, y + 5.5);
      cx_ += cols[j].w;
    });
    y += 8;
  });

  hr();

  // ════════════════════════════════════════════════════════
  // SECTION 3 — SCALE / CUT RECOMMENDATIONS
  // ════════════════════════════════════════════════════════
  guard(18);
  label("AI Analysis");
  h2("Recommendations");

  if (analysis.winners.length > 0) {
    guard(12);
    setFill([230, 250, 246] as const);
    doc.roundedRect(ML, y, CW, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(C.green);
    doc.text(`SCALE THESE  (${analysis.winners.length})`, ML + 4, y + 5.5);
    y += 10;

    analysis.winners.forEach(w => {
      guard(9);
      const text = safeStr(w);
      const lines = doc.splitTextToSize(text, CW - 10);
      const h_ = Math.max(9, lines.length * 4 + 4);
      setFill([240, 253, 249] as const);
      doc.roundedRect(ML, y, CW, h_, 1.5, 1.5, "F");
      setFill(C.green);
      doc.rect(ML, y, 2.5, h_, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      setColor(C.dark);
      doc.text(lines, ML + 6, y + 5);
      y += h_ + 2;
    });
    y += 2;
  }

  if (analysis.killers.length > 0) {
    guard(12);
    setFill([253, 240, 237] as const);
    doc.roundedRect(ML, y, CW, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(C.red);
    doc.text(`CUT THESE  (${analysis.killers.length})`, ML + 4, y + 5.5);
    y += 10;

    analysis.killers.forEach(k => {
      guard(9);
      const text = safeStr(k);
      const lines = doc.splitTextToSize(text, CW - 10);
      const h_ = Math.max(9, lines.length * 4 + 4);
      setFill([255, 248, 246] as const);
      doc.roundedRect(ML, y, CW, h_, 1.5, 1.5, "F");
      setFill(C.red);
      doc.rect(ML, y, 2.5, h_, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      setColor(C.dark);
      doc.text(lines, ML + 6, y + 5);
      y += h_ + 2;
    });
    y += 2;
  }

  if (analysis.recommendations.length > 0) {
    guard(12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    setColor(C.dark);
    doc.text("Key Recommendations", ML, y);
    y += 7;

    analysis.recommendations.forEach((rec, i) => {
      guard(9);
      const text = `${i + 1}.  ${safeStr(rec)}`;
      const lines = doc.splitTextToSize(text, CW - 4);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      setColor(C.dark);
      doc.text(lines, ML + 2, y);
      y += lines.length * 4 + 3;
    });
  }

  hr();

  // ════════════════════════════════════════════════════════
  // SECTION 4 — 7-DAY BATTLE PLAN
  // ════════════════════════════════════════════════════════
  if (analysis.battlePlan.length > 0) {
    guard(18);
    label("Action Plan");
    h2("7-Day Battle Plan");

    analysis.battlePlan.forEach(day => {
      guard(20);
      const accent    = DAY_ACCENT[day.day] ?? C.purple;
      const effortFg  = EFFORT_COLOR[day.effort] ?? C.purple;
      const effortBg  = EFFORT_BG[day.effort] ?? ([240, 237, 255] as const);
      const actionLines = doc.splitTextToSize(day.action, CW - 52);
      const cardH = Math.max(20, actionLines.length * 4 + 16);

      // Card
      setFill([252, 252, 255] as const);
      setStroke(C.border);
      doc.roundedRect(ML, y, CW, cardH, 2, 2, "FD");
      // Left accent strip
      setFill(accent);
      doc.roundedRect(ML, y, 3, cardH, 1.5, 1.5, "F");

      // Day number
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      setColor(accent);
      doc.text(`${day.day}`, ML + 7.5, y + cardH / 2 + 4);

      // Vertical divider
      setStroke(C.border);
      doc.line(ML + 22, y + 4, ML + 22, y + cardH - 4);

      // Title
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      setColor(C.dark);
      doc.text(day.title, ML + 27, y + 9);

      // Action
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      setColor(C.muted);
      doc.text(actionLines, ML + 27, y + 15);

      // Effort badge
      const badgeW = doc.getTextWidth(day.effort) + 8;
      setFill(effortBg);
      doc.roundedRect(PAGE_W - MR - badgeW - 2, y + (cardH / 2) - 4, badgeW, 7, 2, 2, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      setColor(effortFg);
      doc.text(day.effort, PAGE_W - MR - badgeW + 2, y + (cardH / 2) + 1.5);

      y += cardH + 3;
    });

    hr();
  }

  // ════════════════════════════════════════════════════════
  // SECTION 5 — INSIGHTS
  // ════════════════════════════════════════════════════════
  if (analysis.insights.length > 0) {
    guard(18);
    label("Intelligence");
    h2("Deeper Insights");

    analysis.insights.forEach(ins => {
      guard(12);
      const text = safeStr(ins);
      const lines = doc.splitTextToSize(text, CW - 12);
      const cardH = Math.max(11, lines.length * 4 + 6);
      setFill([240, 255, 254] as const);
      setStroke([178, 240, 238] as const);
      doc.roundedRect(ML, y, CW, cardH, 2, 2, "FD");
      setFill(C.teal);
      doc.roundedRect(ML, y, 3, cardH, 1.5, 1.5, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      setColor(C.dark);
      doc.text(lines, ML + 8, y + 6.5);
      y += cardH + 3;
    });
  }

  // ════════════════════════════════════════════════════════
  // FOOTER on every page
  // ════════════════════════════════════════════════════════
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    setStroke(C.border);
    doc.line(ML, PAGE_H - 12, PAGE_W - MR, PAGE_H - 12);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(C.muted);
    doc.text("Generated by Adur.ai  ·  adur.ai", ML, PAGE_H - 7);
    const pg_ = `Page ${pg} of ${totalPages}`;
    doc.text(pg_, PAGE_W - MR - doc.getTextWidth(pg_), PAGE_H - 7);
  }

  doc.save(`adur-analysis-${dateStr}.pdf`);
}
