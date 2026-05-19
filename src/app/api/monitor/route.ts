/**
 * Vercel Cron — runs every 6 hours (see vercel.json)
 * 1. Fetches all active Meta connections
 * 2. Pulls campaign metrics via Graph API
 * 3. Runs detection rules
 * 4. Calls executeOrQueue for each triggered rule
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { executeOrQueue } from "@/lib/meta-actions";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

// ── Auth ──────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret required
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function isoDate(d: Date): string { return d.toISOString().split("T")[0]; }

function prevWeekRange(): { since: string; until: string } {
  const today = new Date();
  const until = new Date(today); until.setDate(until.getDate() - 7);
  const since = new Date(today); since.setDate(since.getDate() - 14);
  return { since: isoDate(since), until: isoDate(until) };
}

// ── Fetch campaign insights ───────────────────────────────────────────────────
interface InsightRow {
  campaign_id:       string;
  campaign_name:     string;
  spend:             number;
  impressions:       number;
  clicks:            number;
  ctr:               number;
  cost_per_result:   number;
  roas:              number;
  daily_budget:      number; // in $ (raw from campaign, not insights)
}

function parseRoas(purchase_roas?: Array<{ value: string }>): number {
  const v = purchase_roas?.[0]?.value;
  return v ? parseFloat(v) : 0;
}

function parseCostPerResult(actions?: Array<{ action_type: string; value: string }>): number {
  const cpr = actions?.find((a) => a.action_type === "offsite_conversion.fb_pixel_purchase")?.value
           ?? actions?.[0]?.value;
  return cpr ? parseFloat(cpr) : 0;
}

async function fetchInsights(
  adAccountId: string,
  token: string,
  datePreset: string | null,
  customRange?: { since: string; until: string }
): Promise<InsightRow[]> {
  const url = new URL(`${GRAPH}/act_${adAccountId}/insights`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("level", "campaign");
  url.searchParams.set("fields", [
    "campaign_id",
    "campaign_name",
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "cost_per_result",
    "purchase_roas",
  ].join(","));
  url.searchParams.set("limit", "50");

  if (datePreset) {
    url.searchParams.set("date_preset", datePreset);
  } else if (customRange) {
    url.searchParams.set("time_range", JSON.stringify(customRange));
  }

  const res  = await fetch(url.toString());
  const data = await res.json() as {
    data?:  Array<Record<string, unknown>>;
    error?: { message: string };
  };

  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Insights fetch failed");

  return (data.data ?? []).map((row) => ({
    campaign_id:     String(row.campaign_id ?? ""),
    campaign_name:   String(row.campaign_name ?? ""),
    spend:           parseFloat(String(row.spend ?? "0")),
    impressions:     parseInt(String(row.impressions ?? "0"), 10),
    clicks:          parseInt(String(row.clicks ?? "0"), 10),
    ctr:             parseFloat(String(row.ctr ?? "0")),
    cost_per_result: parseCostPerResult(row.cost_per_result as undefined),
    roas:            parseRoas(row.purchase_roas as undefined),
    daily_budget:    0, // filled from campaign list below
  }));
}

async function fetchCampaignBudgets(adAccountId: string, token: string): Promise<Map<string, number>> {
  const url = new URL(`${GRAPH}/act_${adAccountId}/campaigns`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("fields", "id,daily_budget,effective_status");
  url.searchParams.set("limit", "50");

  const res  = await fetch(url.toString());
  const data = await res.json() as {
    data?: Array<{ id: string; daily_budget?: string; effective_status: string }>;
  };

  const map = new Map<string, number>();
  for (const c of data.data ?? []) {
    map.set(c.id, c.daily_budget ? parseInt(c.daily_budget, 10) / 100 : 0); // cents → $
  }
  return map;
}

// ── Run detection rules for one user ─────────────────────────────────────────
async function runDetection(params: {
  userId:        string;
  adAccountId:   string;
  metaToken:     string;
  targetCpa:     number;
  breakEvenRoas: number;
}): Promise<number> {
  const { userId, adAccountId, metaToken, targetCpa, breakEvenRoas } = params;

  // Current 7-day insights
  const current = await fetchInsights(adAccountId, metaToken, "last_7d");
  // Previous 7-day insights (days 8-14 ago) for CTR comparison
  const prev    = await fetchInsights(adAccountId, metaToken, null, prevWeekRange());
  // Daily budgets per campaign
  const budgets = await fetchCampaignBudgets(adAccountId, metaToken);

  const totalSpend = current.reduce((s, c) => s + c.spend, 0);
  const prevMap    = new Map(prev.map((c) => [c.campaign_id, c.ctr]));
  let   triggered  = 0;

  for (const campaign of current) {
    const dailyBudget  = budgets.get(campaign.campaign_id) ?? 0;
    const budgetShare  = totalSpend > 0 ? campaign.spend / totalSpend : 0;
    const prevCtr      = prevMap.get(campaign.campaign_id) ?? 0;
    const ctrChange    = prevCtr > 0 ? ((campaign.ctr - prevCtr) / prevCtr) * 100 : 0;

    // ── Rule 1: CPA > target * 1.2 (pause) ────────────────────────────────
    if (campaign.cost_per_result > 0 && campaign.cost_per_result > targetCpa * 1.2) {
      const excess = Math.round((campaign.cost_per_result / targetCpa - 1) * 100);
      await executeOrQueue({
        userId,
        campaignId:   campaign.campaign_id,
        campaignName: campaign.campaign_name,
        actionType:   "pause",
        reason:       `CPA $${campaign.cost_per_result.toFixed(2)} exceeds your $${targetCpa} target by ${excess}% over the last 7 days`,
        metaToken,
      });
      triggered++;
    }

    // ── Rule 2: ROAS > break-even * 2 (scale by 20%) ──────────────────────
    if (campaign.roas > 0 && campaign.roas > breakEvenRoas * 2 && dailyBudget > 0) {
      const newBudget    = Math.round(dailyBudget * 1.2);
      const roasMultiple = Math.round(campaign.roas / breakEvenRoas);
      await executeOrQueue({
        userId,
        campaignId:   campaign.campaign_id,
        campaignName: campaign.campaign_name,
        actionType:   "scale",
        reason:       `ROAS ${campaign.roas.toFixed(2)}x is ${roasMultiple}× your break-even — scaling daily budget 20% to $${newBudget}/day`,
        metaToken,
        newBudget,
      });
      triggered++;
    }

    // ── Rule 3: CTR dropped 40%+ in 7 days (alert) ────────────────────────
    if (prevCtr > 0 && ctrChange < -40) {
      await executeOrQueue({
        userId,
        campaignId:   campaign.campaign_id,
        campaignName: campaign.campaign_name,
        actionType:   "alert",
        reason:       `CTR dropped ${Math.abs(Math.round(ctrChange))}% in 7 days (${prevCtr.toFixed(2)}% → ${campaign.ctr.toFixed(2)}%) — creative fatigue detected on "${campaign.campaign_name}"`,
        metaToken,
      });
      triggered++;
    }

    // ── Rule 4: Budget concentration > 80% (alert) ────────────────────────
    if (budgetShare > 0.8 && totalSpend > 10) {
      await executeOrQueue({
        userId,
        campaignId:   campaign.campaign_id,
        campaignName: campaign.campaign_name,
        actionType:   "alert",
        reason:       `"${campaign.campaign_name}" is consuming ${Math.round(budgetShare * 100)}% of total spend ($${campaign.spend.toFixed(0)} of $${totalSpend.toFixed(0)}) — rebalancing recommended`,
        metaToken,
      });
      triggered++;
    }
  }

  return triggered;
}

// ── GET /api/monitor ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startedAt = Date.now();
  const results: Array<{ userId: string; triggered?: number; error?: string }> = [];

  const { data: connections, error: dbErr } = await supabaseAdmin
    .from("meta_connections")
    .select("user_id, access_token, ad_account_id, target_cpa, break_even_roas, status")
    .eq("status", "active");

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  for (const conn of connections ?? []) {
    try {
      const triggered = await runDetection({
        userId:        conn.user_id,
        adAccountId:   conn.ad_account_id,
        metaToken:     conn.access_token,
        targetCpa:     conn.target_cpa    ?? 50,
        breakEvenRoas: conn.break_even_roas ?? 2,
      });

      await supabaseAdmin
        .from("meta_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", conn.user_id);

      results.push({ userId: conn.user_id, triggered });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.error(`[monitor] user=${conn.user_id}`, msg);
      results.push({ userId: conn.user_id, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    elapsed:   `${Date.now() - startedAt}ms`,
    results,
  });
}
