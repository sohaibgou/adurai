/**
 * POST /api/meta/analyze-live
 *
 * Thin wrapper — delegates to the shared Claude-Meta lib.
 * The meta-panel component now calls /api/claude-meta directly,
 * but this route is kept for any existing integrations.
 */
import { NextRequest, NextResponse }         from "next/server";
import { createServerClient }                from "@supabase/ssr";
import { cookies }                           from "next/headers";
import { supabaseAdmin }                     from "@/lib/supabase-server";
import { invokeClaudeWithMeta, parseClaudeJSON } from "@/lib/claude-meta";
import type { AnalysisResult }               from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conn } = await supabaseAdmin
    .from("meta_connections")
    .select("access_token, ad_account_id, ad_account_name, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn || conn.status !== "active") {
    return NextResponse.json({ error: "Meta account not connected" }, { status: 400 });
  }

  const body = await req.json() as {
    aov?:           number;
    cogs?:          number;
    breakEvenRoas?: number;
    targetCpa?:     number;
    market?:        string;
    goal?:          string;
  };

  try {
    const text = await invokeClaudeWithMeta({
      accessToken:   conn.access_token,
      adAccountId:   conn.ad_account_id,
      action:        "analyze",
      aov:           body.aov,
      cogs:          body.cogs,
      breakEvenRoas: body.breakEvenRoas,
      targetCpa:     body.targetCpa,
      market:        body.market,
      goal:          body.goal,
    });

    const analysis = parseClaudeJSON<AnalysisResult>(text);

    await supabaseAdmin
      .from("meta_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return NextResponse.json({ analysis, adAccountName: conn.ad_account_name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[analyze-live]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
