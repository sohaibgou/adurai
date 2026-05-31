/**
 * GET /api/usage
 * Returns current usage counts + plan limits for the authenticated user.
 * Used by the frontend to enforce display-layer limits and show remaining counts.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  IMAGE_LIMITS, COPY_LIMITS, UGC_LIMITS, ANALYSIS_LIMITS, resolvePlan,
} from "@/lib/check-usage";

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

  // Subscription plan
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const plan = isAdmin ? "pro" : resolvePlan(sub?.plan);
  const isPaid = plan !== "free";

  // Usage row
  const { data: usage } = await supabaseAdmin
    .from("user_usage")
    .select("analysis_count, analysis_month, image_count, image_month, copy_count, ugc_count, ugc_month")
    .eq("user_id", user.id)
    .maybeSingle();

  const month = new Date().toISOString().slice(0, 7);

  // analysis + image reset monthly; copy is a lifetime free cap
  const analysisCount = usage?.analysis_month === month ? (usage?.analysis_count ?? 0) : 0;
  const imageCount    = usage?.image_month    === month ? (usage?.image_count    ?? 0) : 0;
  const copyCount     = usage?.copy_count ?? 0;
  const ugcCount      = usage?.ugc_month      === month ? (usage?.ugc_count      ?? 0) : 0;

  // Limits (null = unlimited). Admins are unlimited everywhere.
  const analysisLimit = isAdmin ? null : ANALYSIS_LIMITS[plan];
  const imageLimit    = isAdmin ? null : IMAGE_LIMITS[plan];
  const copyLimit     = isAdmin ? null : COPY_LIMITS[plan];
  const ugcLimit      = isAdmin ? null : UGC_LIMITS[plan];

  const remaining = (limit: number | null, count: number) =>
    limit === null ? null : Math.max(0, limit - count);

  return NextResponse.json({
    plan,
    isPaid,
    isAdmin,
    // per-feature counts
    analysisCount,
    imageCount,
    copyCount,
    ugcCount,
    // limits (null = unlimited)
    analysisLimit,
    imageLimit,
    copyLimit,
    ugcLimit,
    // convenience "remaining" fields (null = unlimited)
    analysisRemaining: remaining(analysisLimit, analysisCount),
    imageRemaining:    remaining(imageLimit, imageCount),
    copyRemaining:     remaining(copyLimit, copyCount),
    ugcRemaining:      remaining(ugcLimit, ugcCount),
  });
}
