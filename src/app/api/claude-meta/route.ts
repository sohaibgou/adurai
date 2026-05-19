/**
 * POST /api/claude-meta
 *
 * Central Claude-as-Meta-Agent endpoint.
 * Authenticated via cookie session — looks up the user's Meta token
 * in Supabase and passes it to Claude via Meta MCP.
 *
 * Body:
 *   { action, campaignId?, targetCpa?, breakEvenRoas?, aov?, cogs?, market?, goal? }
 *
 * Returns:
 *   "analyze"              → { analysis, adAccountName }
 *   "monitor_and_optimize" → { actions, summary, totalSpend7d, campaignsAnalyzed }
 *   "pause_campaign"       → { success, campaignName, message }
 *   "scale_campaign"       → { success, campaignName, oldBudget, newBudget, message }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { supabaseAdmin }             from "@/lib/supabase-server";
import {
  invokeClaudeWithMeta,
  parseClaudeJSON,
  type ClaudeMetaAction,
  type MonitorResult,
  type ExecuteResult,
} from "@/lib/claude-meta";
import type { AnalysisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── Authenticate via cookie session ─────────────────────────────────────
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Parse request body ───────────────────────────────────────────────────
  const body = await req.json() as {
    action:         ClaudeMetaAction;
    campaignId?:    string;
    targetCpa?:     number;
    breakEvenRoas?: number;
    aov?:           number;
    cogs?:          number;
    market?:        string;
    goal?:          string;
  };

  const { action } = body;
  if (!action) return NextResponse.json({ error: "action is required" }, { status: 400 });

  // ── Load user's Meta connection ──────────────────────────────────────────
  const { data: conn } = await supabaseAdmin
    .from("meta_connections")
    .select("access_token, ad_account_id, ad_account_name, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn || conn.status !== "active") {
    return NextResponse.json({ error: "Meta account not connected" }, { status: 400 });
  }

  // ── Invoke Claude with Meta MCP ──────────────────────────────────────────
  try {
    const text = await invokeClaudeWithMeta({
      accessToken:   conn.access_token,
      adAccountId:   conn.ad_account_id,
      action,
      campaignId:    body.campaignId,
      targetCpa:     body.targetCpa,
      breakEvenRoas: body.breakEvenRoas,
      aov:           body.aov,
      cogs:          body.cogs,
      market:        body.market,
      goal:          body.goal,
    });

    // Update last_synced_at
    await supabaseAdmin
      .from("meta_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // ── Parse + return based on action ─────────────────────────────────────
    if (action === "analyze") {
      const analysis = parseClaudeJSON<AnalysisResult>(text);
      return NextResponse.json({ analysis, adAccountName: conn.ad_account_name });
    }

    if (action === "monitor_and_optimize") {
      const result = parseClaudeJSON<MonitorResult>(text);
      return NextResponse.json(result);
    }

    // pause_campaign | scale_campaign
    const result = parseClaudeJSON<ExecuteResult>(text);
    return NextResponse.json(result);

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claude Meta agent failed";
    console.error(`[claude-meta] action=${action} user=${user.id}`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
