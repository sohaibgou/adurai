/**
 * GET /api/usage
 * Returns current usage counts + plan limits for the authenticated user.
 * Used by the frontend to enforce display-layer limits and show remaining counts.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-server";

const ADMIN_EMAILS      = ["sohaibitotv@gmail.com"];
const FREE_LIMIT        = 3;
const STARTER_UGC_LIMIT = 3;
const PRO_UGC_LIMIT     = 30;

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

  const plan: "free" | "starter" | "pro" =
    isAdmin         ? "pro"
    : sub?.plan === "pro"     ? "pro"
    : sub?.plan === "starter" ? "starter"
    : "free";

  const isPaid = plan !== "free";

  // Usage row
  const { data: usage } = await supabaseAdmin
    .from("user_usage")
    .select("analysis_count, image_count, copy_count, ugc_count, ugc_month")
    .eq("user_id", user.id)
    .maybeSingle();

  const analysisCount = usage?.analysis_count ?? 0;
  const imageCount    = usage?.image_count    ?? 0;
  const copyCount     = usage?.copy_count     ?? 0;

  // UGC count resets monthly
  const currentMonth = new Date().toISOString().slice(0, 7);
  const ugcCount     = (usage?.ugc_month === currentMonth) ? (usage?.ugc_count ?? 0) : 0;

  // Limits
  const ugcLimit =
    isAdmin         ? null    // unlimited
    : plan === "pro"     ? PRO_UGC_LIMIT
    : plan === "starter" ? STARTER_UGC_LIMIT
    : 0;                  // free = blocked

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
    analysisLimit: isAdmin || isPaid ? null : FREE_LIMIT,
    imageLimit:    isAdmin || isPaid ? null : FREE_LIMIT,
    copyLimit:     isAdmin || isPaid ? null : FREE_LIMIT,
    ugcLimit,
    // convenience "remaining" fields (null = unlimited)
    analysisRemaining: isAdmin || isPaid ? null : Math.max(0, FREE_LIMIT - analysisCount),
    imageRemaining:    isAdmin || isPaid ? null : Math.max(0, FREE_LIMIT - imageCount),
    copyRemaining:     isAdmin || isPaid ? null : Math.max(0, FREE_LIMIT - copyCount),
    ugcRemaining:      isAdmin          ? null : ugcLimit === null ? null : Math.max(0, ugcLimit - ugcCount),
  });
}
