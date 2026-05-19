/**
 * One-click approve from email link.
 * GET /api/meta/approve-email?token=<email_token>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { executeMetaAction } from "@/lib/meta-actions";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_URL ?? "https://adur.ai";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${BASE}/dashboard?action=invalid`);

  // Find action by email_token
  const { data: action } = await supabaseAdmin
    .from("auto_actions")
    .select("*")
    .eq("email_token", token)
    .eq("status", "pending")
    .single();

  if (!action) {
    return NextResponse.redirect(`${BASE}/dashboard?action=already_processed`);
  }

  // Load user's Meta token
  const { data: conn } = await supabaseAdmin
    .from("meta_connections")
    .select("access_token")
    .eq("user_id", action.user_id)
    .single();

  if (!conn) return NextResponse.redirect(`${BASE}/dashboard?action=no_token`);

  try {
    await executeMetaAction({
      campaignId: action.campaign_id,
      actionType: action.action_type,
      metaToken:  conn.access_token,
      newBudget:  action.new_budget ?? undefined,
    });

    await supabaseAdmin
      .from("auto_actions")
      .update({ status: "executed", executed_at: new Date().toISOString() })
      .eq("id", action.id);

    return NextResponse.redirect(`${BASE}/dashboard?action=approved`);
  } catch (err) {
    console.error("[approve-email]", err);
    return NextResponse.redirect(`${BASE}/dashboard?action=error`);
  }
}
