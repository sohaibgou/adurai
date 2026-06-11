/**
 * GET /api/admin/stats
 *
 * Founder-only metrics for the /admin page. Auth is cookie-based and the
 * email is checked server-side — the client-side redirect on /admin is
 * cosmetic; THIS check is the security boundary.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireEmailVerified } from "@/lib/require-email-verified";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ADMIN_DASHBOARD_EMAILS = ["sohaibtrepreneur@gmail.com", "sohaibitotv@gmail.com"];

// Monthly USD price per tier — keep in sync with pricing-section / Stripe.
const PLAN_PRICE: Record<string, number> = { starter: 19, growth: 49, pro: 99 };

export async function GET(req: NextRequest) {
  const auth = await requireEmailVerified(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  if (!ADMIN_DASHBOARD_EMAILS.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // ── Users (first 1000 covers early stage; `total` is the true count) ────
    const { data: usersPage, error: usersErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersErr) throw usersErr;

    const users        = usersPage.users;
    const totalSignups = usersPage.total ?? users.length;
    const emailById    = new Map(users.map((u) => [u.id, u.email ?? "—"]));

    const latestSignups = [...users]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((u) => ({ email: u.email ?? "—", date: u.created_at }));

    // ── Active subscriptions ────────────────────────────────────────────────
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, plan, updated_at")
      .eq("status", "active");
    if (subsErr) throw subsErr;

    const active = subs ?? [];
    const planCount = (tier: string) => active.filter((s) => s.plan === tier).length;
    const starterCount = planCount("starter");
    const growthCount  = planCount("growth");
    const proCount     = planCount("pro");

    const mrr = active.reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);

    const latestPayments = [...active]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map((s) => ({
        email: emailById.get(s.user_id) ?? "—",
        plan:  s.plan,
        date:  s.updated_at,
      }));

    // ── Lifetime feature totals ─────────────────────────────────────────────
    const { count: totalAnalyses } = await supabaseAdmin
      .from("analyses")
      .select("*", { count: "exact", head: true });

    const { count: totalUgcVideos } = await supabaseAdmin
      .from("creatives")
      .select("*", { count: "exact", head: true })
      .eq("media_type", "video");

    return NextResponse.json({
      totalSignups,
      payingUsers: active.length,
      starterCount,
      growthCount,
      proCount,
      mrr,
      totalAnalyses:  totalAnalyses  ?? 0,
      totalUgcVideos: totalUgcVideos ?? 0,
      latestSignups,
      latestPayments,
    });
  } catch (e) {
    console.error("[admin/stats] failed:", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
