/**
 * Vercel Cron — runs every 6 hours (see vercel.json)
 *
 * For each connected Meta account Claude (via Meta MCP):
 *   1. Pulls current campaign performance data
 *   2. Compares vs targets (CPA, ROAS, CTR, budget concentration)
 *   3. Returns recommended actions as structured JSON
 *   4. executeOrQueue handles auto-execute vs confirm vs alert-only mode
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin }             from "@/lib/supabase-server";
import { executeOrQueue }            from "@/lib/meta-actions";
import { invokeClaudeWithMeta, parseClaudeJSON, type MonitorResult } from "@/lib/claude-meta";

export const dynamic = "force-dynamic";

// ── Auth ──────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret required
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// ── Claude-powered monitoring for one user ────────────────────────────────────
async function runClaudeMonitor(params: {
  userId:        string;
  adAccountId:   string;
  metaToken:     string;
  targetCpa:     number;
  breakEvenRoas: number;
}): Promise<{ triggered: number; summary: string }> {
  const { userId, adAccountId, metaToken, targetCpa, breakEvenRoas } = params;

  // Ask Claude to analyze the account and return recommended actions
  const text = await invokeClaudeWithMeta({
    accessToken:   metaToken,
    adAccountId,
    action:        "monitor_and_optimize",
    targetCpa,
    breakEvenRoas,
  });

  const result = parseClaudeJSON<MonitorResult>(text);

  // Pass each recommended action through executeOrQueue
  // (respects user's autopilot mode: auto / confirm / off)
  for (const recommended of result.actions ?? []) {
    await executeOrQueue({
      userId,
      adAccountId,
      campaignId:   recommended.campaignId,
      campaignName: recommended.campaignName,
      actionType:   recommended.actionType,
      reason:       recommended.reason,
      metaToken,
      newBudget:    recommended.newBudget ?? undefined,
    });
  }

  return {
    triggered: (result.actions ?? []).length,
    summary:   result.summary ?? "",
  };
}

// ── GET /api/monitor ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startedAt = Date.now();
  const results: Array<{
    userId:    string;
    triggered?: number;
    summary?:  string;
    error?:    string;
  }> = [];

  // Fetch all active Meta connections
  const { data: connections, error: dbErr } = await supabaseAdmin
    .from("meta_connections")
    .select("user_id, access_token, ad_account_id, target_cpa, break_even_roas, status")
    .eq("status", "active");

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  for (const conn of connections ?? []) {
    try {
      const { triggered, summary } = await runClaudeMonitor({
        userId:        conn.user_id,
        adAccountId:   conn.ad_account_id,
        metaToken:     conn.access_token,
        targetCpa:     conn.target_cpa     ?? 50,
        breakEvenRoas: conn.break_even_roas ?? 2,
      });

      // Update last_synced_at
      await supabaseAdmin
        .from("meta_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", conn.user_id);

      results.push({ userId: conn.user_id, triggered, summary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.error(`[monitor] user=${conn.user_id}`, msg);
      results.push({ userId: conn.user_id, error: msg });
    }
  }

  return NextResponse.json({
    ok:        true,
    processed: results.length,
    elapsed:   `${Date.now() - startedAt}ms`,
    results,
  });
}
