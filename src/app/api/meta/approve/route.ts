import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { executeMetaAction } from "@/lib/meta-actions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action_id } = await req.json() as { action_id: string };
  if (!action_id) return NextResponse.json({ error: "action_id required" }, { status: 400 });

  // Load the action — must belong to this user and be pending
  const { data: action } = await supabaseAdmin
    .from("auto_actions")
    .select("*")
    .eq("id",      action_id)
    .eq("user_id", user.id)
    .eq("status",  "pending")
    .single();

  if (!action) return NextResponse.json({ error: "Action not found or already processed" }, { status: 404 });

  // Load user's Meta token + ad account
  const { data: conn } = await supabaseAdmin
    .from("meta_connections")
    .select("access_token, ad_account_id")
    .eq("user_id", user.id)
    .single();

  if (!conn) return NextResponse.json({ error: "Meta not connected" }, { status: 400 });

  try {
    await executeMetaAction({
      adAccountId: conn.ad_account_id,
      campaignId:  action.campaign_id,
      actionType:  action.action_type,
      metaToken:   conn.access_token,
      newBudget:   action.new_budget ?? undefined,
    });

    await supabaseAdmin
      .from("auto_actions")
      .update({ status: "executed", executed_at: new Date().toISOString() })
      .eq("id", action_id);

    return NextResponse.json({ ok: true, status: "executed" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Execution failed";
    console.error("[approve]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
