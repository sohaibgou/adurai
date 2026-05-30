/**
 * check-usage.ts
 *
 * Shared helper for API routes that need to:
 *   1. Authenticate the caller (via requireEmailVerified / cookies)
 *   2. Look up their subscription plan
 *   3. Read + gate on feature-specific usage counters
 *
 * Usage example:
 *   const result = await checkUsage(req, "image");
 *   if (result instanceof NextResponse) return result;   // 401 / 403 / limit-exceeded
 *   const { user, plan, isAdmin } = result;
 */
import { NextRequest, NextResponse } from "next/server";
import { requireEmailVerified } from "@/lib/require-email-verified";
import { supabaseAdmin } from "@/lib/supabase-server";

export type FeatureKey = "image" | "copy" | "ugc";

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

/** Free-plan hard caps (image + copy are lifetime; ugc uses monthly reset). */
const FREE_LIMITS: Record<FeatureKey, number> = {
  image: 3,
  copy:  3,
  ugc:   0, // completely blocked for free users
};

const STARTER_UGC_LIMIT = 3;
const PRO_UGC_LIMIT     = 30;

export interface UsageCheckResult {
  user:    { id: string; email?: string; app_metadata: Record<string, unknown> };
  plan:    "free" | "starter" | "pro";
  isAdmin: boolean;
}

export async function checkUsage(
  req: NextRequest,
  feature: FeatureKey,
): Promise<UsageCheckResult | NextResponse> {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const authResult = await requireEmailVerified(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");
  if (isAdmin) return { user, plan: "pro", isAdmin: true };

  // ── 2. Subscription plan ─────────────────────────────────────────────────
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const plan: "free" | "starter" | "pro" =
    sub?.plan === "pro"     ? "pro"
    : sub?.plan === "starter" ? "starter"
    : "free";

  // ── 3. UGC is completely blocked for free users ───────────────────────────
  if (feature === "ugc" && plan === "free") {
    return NextResponse.json(
      { error: "UGC video generation requires a paid plan. Upgrade to Starter or Pro.", code: "PLAN_REQUIRED" },
      { status: 403 },
    );
  }

  // ── 4. Paid plans have no limit on image / copy ───────────────────────────
  if (feature !== "ugc" && plan !== "free") {
    return { user, plan, isAdmin: false };
  }

  // ── 5. Fetch usage row ────────────────────────────────────────────────────
  const { data: usage } = await supabaseAdmin
    .from("user_usage")
    .select("image_count, copy_count, ugc_count, ugc_month")
    .eq("user_id", user.id)
    .maybeSingle();

  // ── 6. Feature-specific gate ──────────────────────────────────────────────
  if (feature === "image" && plan === "free") {
    const count = usage?.image_count ?? 0;
    if (count >= FREE_LIMITS.image) {
      return NextResponse.json(
        { error: `You've used all ${FREE_LIMITS.image} free image generations. Upgrade to keep going.`, code: "LIMIT_EXCEEDED" },
        { status: 403 },
      );
    }
  }

  if (feature === "copy" && plan === "free") {
    const count = usage?.copy_count ?? 0;
    if (count >= FREE_LIMITS.copy) {
      return NextResponse.json(
        { error: `You've used all ${FREE_LIMITS.copy} free ad copy generations. Upgrade to keep going.`, code: "LIMIT_EXCEEDED" },
        { status: 403 },
      );
    }
  }

  if (feature === "ugc" && (plan === "starter" || plan === "pro")) {
    const limit         = plan === "pro" ? PRO_UGC_LIMIT : STARTER_UGC_LIMIT;
    const currentMonth  = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const storedMonth   = usage?.ugc_month ?? "";
    const count         = storedMonth === currentMonth ? (usage?.ugc_count ?? 0) : 0;

    if (count >= limit) {
      return NextResponse.json(
        { error: `You've used all ${limit} UGC videos for this month. Resets on the 1st.`, code: "UGC_MONTHLY_LIMIT" },
        { status: 403 },
      );
    }
  }

  return { user, plan, isAdmin: false };
}
