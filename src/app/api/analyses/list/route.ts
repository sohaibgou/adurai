/**
 * GET /api/analyses/list
 *
 * Returns up to 10 recent analyses (metadata only, no full result_json)
 * for the authenticated user. Used by the dashboard "Recent Analyses" section.
 *
 * Auth: Authorization: Bearer <access_token>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("analyses")
    .select("id, created_at, score, campaign_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    // Table might not exist yet — return empty gracefully
    return NextResponse.json({ analyses: [] });
  }

  return NextResponse.json({
    analyses: (data ?? []).map((row) => ({
      id:            row.id,
      date:          row.created_at,
      score:         row.score,
      campaignCount: row.campaign_count,
    })),
  });
}
