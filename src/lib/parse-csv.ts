import Papa from "papaparse";
import { COLUMN_MAP, type CampaignRow, type CampaignSummary, type CampaignObjective } from "./types";

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseNumber(val: unknown): number {
  if (val === undefined || val === null || val === "" || val === "-") return 0;
  const str = String(val).replace(/[$,%]/g, "").replace(/,/g, "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function parseCSV(file: File): Promise<CampaignRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (!results.data || results.data.length === 0) {
          reject(new Error("CSV file is empty or has no valid rows."));
          return;
        }

        const rows = (results.data as Record<string, string>[]).map((raw) => {
          const mapped: Record<string, string | number> = {};
          for (const [originalKey, value] of Object.entries(raw)) {
            const normalizedKey = normalizeHeader(originalKey);
            const mappedKey = COLUMN_MAP[normalizedKey];
            if (mappedKey) {
              if (mappedKey === "campaignName" || mappedKey === "adSetName" || mappedKey === "adName" || mappedKey === "objective" || mappedKey === "resultIndicator") {
                mapped[mappedKey] = String(value).trim();
              } else {
                mapped[mappedKey] = parseNumber(value);
              }
            }
          }

          // Derive ROAS if not present but we have revenue and spend
          if (!mapped.roas && mapped.revenue && mapped.spend) {
            mapped.roas = (mapped.spend as number) > 0
              ? Number(((mapped.revenue as number) / (mapped.spend as number)).toFixed(2))
              : 0;
          }

          // Derive CTR if not present
          if (!mapped.ctr && mapped.clicks && mapped.impressions) {
            mapped.ctr = (mapped.impressions as number) > 0
              ? Number((((mapped.clicks as number) / (mapped.impressions as number)) * 100).toFixed(2))
              : 0;
          }

          // Derive CPC if not present
          if (!mapped.cpc && mapped.clicks && mapped.spend) {
            mapped.cpc = (mapped.clicks as number) > 0
              ? Number(((mapped.spend as number) / (mapped.clicks as number)).toFixed(2))
              : 0;
          }

          return mapped as unknown as CampaignRow;
        });

        // Filter out rows with no campaign name
        const validRows = rows.filter((r) => r.campaignName);
        if (validRows.length === 0) {
          reject(new Error("No valid campaign data found. Please check your CSV column headers."));
          return;
        }

        resolve(validRows);
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

/** Normalize raw objective string to a known CampaignObjective */
function normalizeObjective(raw: string): CampaignObjective {
  const v = raw.toUpperCase().trim();
  if (v.includes("TRAFFIC") || v.includes("LINK_CLICK") || v.includes("LINK CLICK")) return "TRAFFIC";
  if (v.includes("CONVERSION") || v.includes("PURCHASE") || v.includes("OUTCOME_SALES") || v.includes("SALES")) return "CONVERSIONS";
  if (v.includes("LEAD") || v.includes("OUTCOME_LEADS")) return "LEADS";
  if (v.includes("ENGAGEMENT") || v.includes("AWARENESS") || v.includes("REACH") || v.includes("BRAND") || v.includes("VIDEO_VIEW") || v.includes("POST_ENGAGEMENT")) return "ENGAGEMENT";
  return "UNKNOWN";
}

/** Infer objective from Meta's result indicator (e.g., actions:offsite_conversion.fb_pixel_purchase) */
function inferObjectiveFromIndicator(indicator: string): CampaignObjective {
  const v = indicator.toLowerCase();
  if (v.includes("purchase") || v.includes("sale") || v.includes("offsite_conversion")) return "CONVERSIONS";
  if (v.includes("lead")) return "LEADS";
  if (v.includes("link_click") || v.includes("landing_page_view")) return "TRAFFIC";
  if (v.includes("post_engagement") || v.includes("page_engagement") || v.includes("video_view") || v.includes("reach") || v.includes("impression")) return "ENGAGEMENT";
  return "UNKNOWN";
}

/** Try to infer objective from campaign name heuristics when CSV has no objective column */
function inferObjective(campaignName: string): CampaignObjective {
  const n = campaignName.toUpperCase();
  if (n.includes("TRAFFIC") || n.includes("LINK CLICK") || n.includes("CLICKS")) return "TRAFFIC";
  if (n.includes("CONVERSION") || n.includes("PURCHASE") || n.includes("SALES") || n.includes("CBO") || n.includes("RETARGET") || n.includes("BOF") || n.includes("MOF")) return "CONVERSIONS";
  if (n.includes("LEAD") || n.includes("LEADS") || n.includes("LEAD GEN")) return "LEADS";
  if (n.includes("BRAND") || n.includes("AWARENESS") || n.includes("ENGAGEMENT") || n.includes("REACH") || n.includes("VIDEO VIEW")) return "ENGAGEMENT";
  return "UNKNOWN";
}

export function aggregateByCampaign(rows: CampaignRow[]): CampaignSummary[] {
  const map = new Map<string, CampaignRow[]>();
  for (const row of rows) {
    const existing = map.get(row.campaignName) || [];
    existing.push(row);
    map.set(row.campaignName, existing);
  }

  return Array.from(map.entries()).filter(([, campaignRows]) => {
    // Exclude campaigns with $0 spend
    const totalSpend = campaignRows.reduce((s, r) => s + (r.spend || 0), 0);
    return totalSpend > 0;
  }).map(([campaignName, campaignRows]) => {
    const spend = campaignRows.reduce((s, r) => s + (r.spend || 0), 0);
    const impressions = campaignRows.reduce((s, r) => s + (r.impressions || 0), 0);
    const clicks = campaignRows.reduce((s, r) => s + (r.clicks || 0), 0);
    const conversions = campaignRows.reduce((s, r) => s + (r.conversions || 0), 0);
    const purchases = campaignRows.reduce((s, r) => s + (r.purchases || 0), 0);
    const revenue = campaignRows.reduce((s, r) => s + (r.revenue || 0), 0);
    const roas = spend > 0 ? Number((revenue / spend).toFixed(2)) : 0;
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;
    // RULE 1: Use Meta's Cost Per Result directly — weighted average, never recalculate
    const rowsWithCPR = campaignRows.filter((r) => r.costPerResult > 0);
    const costPerResult = rowsWithCPR.length > 0
      ? Number((rowsWithCPR.reduce((s, r) => s + r.costPerResult * (r.conversions || 1), 0) / rowsWithCPR.reduce((s, r) => s + (r.conversions || 1), 0)).toFixed(2))
      : 0;

    // Resolve objective: 1) explicit objective column, 2) result indicator, 3) campaign name heuristic
    const rawObjective = campaignRows.find((r) => r.objective)?.objective || "";
    const rawIndicator = campaignRows.find((r) => r.resultIndicator)?.resultIndicator || "";
    let objective: CampaignObjective;
    if (rawObjective) {
      objective = normalizeObjective(rawObjective);
    } else if (rawIndicator) {
      objective = inferObjectiveFromIndicator(rawIndicator);
    } else {
      objective = inferObjective(campaignName);
    }

    return {
      campaignName,
      objective,
      spend: Number(spend.toFixed(2)),
      impressions,
      clicks,
      ctr,
      cpc,
      conversions,
      purchases,
      revenue: Number(revenue.toFixed(2)),
      roas,
      costPerResult,
    };
  });
}
