/**
 * GET /api/analyses/latest
 *
 * Returns the most recent saved analysis for the authenticated user.
 * Used by the results page when sessionStorage is empty (new tab, browser refresh after close, etc.)
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

  // Optional ?id= param — fetch a specific analysis instead of the latest
  const specificId = req.nextUrl.searchParams.get("id");

  let query = supabaseAdmin
    .from("analyses")
    .select("id, created_at, score, campaign_count, result_json, form_data")
    .eq("user_id", user.id); // always scope to the authenticated user

  if (specificId) {
    query = query.eq("id", specificId);
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error("[analyses/latest] DB query error:", error.message, error.details ?? "");
    return NextResponse.json({ analysis: null });
  }

  if (!data) {
    console.log("[analyses/latest] no rows found for user", user.id, specificId ? `(id=${specificId})` : "(latest)");
    return NextResponse.json({ analysis: null });
  }

  console.log("[analyses/latest] returning analysis", data.id, "for user", user.id);

  return NextResponse.json({
    analysis:  data.result_json,
    formData:  data.form_data ?? null,
    createdAt: data.created_at,
  });
}
