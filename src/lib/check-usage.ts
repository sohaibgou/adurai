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
 *
 * Tier limits (null = unlimited). analysis + image reset monthly; copy is a
 * lifetime free-plan cap; ugc resets monthly.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireEmailVerified } from "@/lib/require-email-verified";
import { supabaseAdmin } from "@/lib/supabase-server";

export type FeatureKey = "image" | "copy" | "ugc";
export type PlanTier   = "free" | "starter" | "growth" | "pro";

const ADMIN_EMAILS = ["sohaibitotv@gmail.com", "sohaibtrepreneur@gmail.com"];

// null = unlimited
export const IMAGE_LIMITS: Record<PlanTier, number | null> = {
  free: 3, starter: 5, growth: 20, pro: null,
};
export const COPY_LIMITS: Record<PlanTier, number | null> = {
  free: 3, starter: null, growth: null, pro: null,
};
export const UGC_LIMITS: Record<PlanTier, number | null> = {
  free: 0, starter: 3, growth: 10, pro: 30,
};
export const ANALYSIS_LIMITS: Record<PlanTier, number | null> = {
  free: 3, starter: 10, growth: null, pro: null,
};

export function resolvePlan(rawPlan: string | null | undefined): PlanTier {
  return rawPlan === "pro" || rawPlan === "growth" || rawPlan === "starter"
    ? rawPlan
    : "free";
}

export interface UsageCheckResult {
  user:    { id: string; email?: string; app_metadata: Record<string, unknown> };
  plan:    PlanTier;
  isAdmin: boolean;
}

const currentMonth = () => new Date().toISOString().slice(0, 7); // "YYYY-MM"

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

  const plan = resolvePlan(sub?.plan);

  // ── 3. UGC is completely blocked for free users ───────────────────────────
  if (feature === "ugc" && plan === "free") {
    return NextResponse.json(
      { error: "UGC video generation requires a paid plan. Upgrade to Starter, Growth or Autopilot.", code: "PLAN_REQUIRED" },
      { status: 403 },
    );
  }

  // ── 4. Fetch usage row ────────────────────────────────────────────────────
  const { data: usage } = await supabaseAdmin
    .from("user_usage")
    .select("image_count, image_month, copy_count, ugc_count, ugc_month")
    .eq("user_id", user.id)
    .maybeSingle();

  const month = currentMonth();

  // ── 5. Image (monthly per-tier cap) ───────────────────────────────────────
  if (feature === "image") {
    const limit = IMAGE_LIMITS[plan];
    if (limit !== null) {
      const count = usage?.image_month === month ? (usage?.image_count ?? 0) : 0;
      if (count >= limit) {
        return NextResponse.json(
          { error: `You've used all ${limit} image generations for this month. Upgrade for more.`, code: "LIMIT_EXCEEDED" },
          { status: 403 },
        );
      }
    }
  }

  // ── 6. Copy (lifetime free cap; unlimited for paid) ───────────────────────
  if (feature === "copy") {
    const limit = COPY_LIMITS[plan];
    if (limit !== null) {
      const count = usage?.copy_count ?? 0;
      if (count >= limit) {
        return NextResponse.json(
          { error: `You've used all ${limit} free ad copy generations. Upgrade to keep going.`, code: "LIMIT_EXCEEDED" },
          { status: 403 },
        );
      }
    }
  }

  // ── 7. UGC (monthly per-tier cap) ─────────────────────────────────────────
  if (feature === "ugc") {
    const limit = UGC_LIMITS[plan];
    if (limit !== null) {
      const count = usage?.ugc_month === month ? (usage?.ugc_count ?? 0) : 0;
      if (count >= limit) {
        return NextResponse.json(
          { error: `You've used all ${limit} UGC videos for this month. Resets on the 1st.`, code: "UGC_MONTHLY_LIMIT" },
          { status: 403 },
        );
      }
    }
  }

  return { user, plan, isAdmin: false };
}
