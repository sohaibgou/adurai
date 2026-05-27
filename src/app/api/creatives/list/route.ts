/**
 * GET /api/creatives/list
 *
 * Returns all saved creative sets for the authenticated user, newest first.
 * Each row contains: id, created_at, image_urls, copy_variants, prompt.
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
    .from("creatives")
    .select("id, created_at, image_urls, copy_variants, prompt")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24); // last 24 sessions

  if (error) {
    console.error("[creatives/list] DB query error:", error.message);
    return NextResponse.json({ creatives: [] });
  }

  return NextResponse.json({ creatives: data ?? [] });
}
