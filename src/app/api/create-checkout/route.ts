import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

// Price IDs keyed by plan → billing interval. Annual prices are billed once a
// year at the discounted rate; they fall back to the monthly price ID if an
// annual price isn't configured, so checkout never 500s on a missing env var.
const PRICES: Record<string, { monthly?: string; annual?: string }> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_PRICE_ID,
    annual:  process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  growth: {
    monthly: process.env.STRIPE_GROWTH_PRICE_ID,
    annual:  process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_PRICE_ID,
    annual:  process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
};

function resolvePriceId(plan: string, interval: string): string | undefined {
  const tier = PRICES[plan];
  if (!tier) return undefined;
  return interval === "annual" ? (tier.annual ?? tier.monthly) : tier.monthly;
}

/**
 * Resolve an absolute, scheme-qualified base URL for Stripe success/cancel URLs.
 * Order: NEXT_PUBLIC_URL → forwarded/host headers → request origin.
 * Guarantees an explicit http(s) scheme so Stripe never sees a malformed URL.
 */
function resolveBaseUrl(req: NextRequest): string {
  // 1. Explicit env var (preferred). Add a scheme if it was omitted.
  const raw = (process.env.NEXT_PUBLIC_URL ?? "").trim().replace(/\/+$/, "");
  if (raw) {
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  }

  // 2. Derive from request headers. Default scheme to http for local hosts,
  //    https otherwise — never leave it empty (which yields "://host").
  const host = (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host ??
    ""
  ).trim();
  if (host) {
    const fwdProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const isLocal  = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
    const proto    = fwdProto || (isLocal ? "http" : "https");
    return `${proto}://${host}`;
  }

  // 3. Last resort: the request's own origin is always absolute.
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  // ── 0. Guard: ensure Stripe is configured ───────────────────────────────
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("[create-checkout] STRIPE_SECRET_KEY is not set");
    return NextResponse.json({ error: "Payment system not configured" }, { status: 503 });
  }
  const stripe = new Stripe(stripeKey);

  // ── 1. Try reading session from cookies ──────────────────────────────────
  let userId: string | undefined;
  let userEmail: string | undefined;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    userId    = session?.user?.id;
    userEmail = session?.user?.email;
  } catch (e) {
    console.error("[create-checkout] cookie session read failed:", e);
  }

  // ── 2. Fall back to Authorization header ─────────────────────────────────
  if (!userId) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
    if (token) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        userId    = user?.id;
        userEmail = user?.email;
      } catch (e) {
        console.error("[create-checkout] token auth failed:", e);
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized", requiresAuth: true }, { status: 401 });
  }

  // ── 3. Resolve plan + billing interval ────────────────────────────────────
  let body: { plan?: string; interval?: string } = {};
  try { body = await req.json(); } catch { /* missing body is OK */ }

  const plan     = body.plan && PRICES[body.plan] ? body.plan : "starter";
  const interval = body.interval === "annual" ? "annual" : "monthly";
  const priceId  = resolvePriceId(plan, interval);

  if (!priceId) {
    console.error(`[create-checkout] price ID not configured for plan: ${plan} (${interval})`);
    return NextResponse.json({ error: `Price not configured for plan: ${plan}` }, { status: 500 });
  }

  // ── 3.5 Never create a second subscription for an already-subscribed user ──
  // Without this guard, a paying user who clicks a plan in the paywall gets a
  // brand-new Stripe subscription on top of their existing one — double-billed,
  // while the DB upsert silently overwrites their plan row. Same plan → reject;
  // different plan → change the price on the EXISTING subscription (prorated).
  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, stripe_subscription_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (existingSub) {
    if (existingSub.plan === plan) {
      return NextResponse.json(
        { error: "You're already on this plan." },
        { status: 409 }
      );
    }
    if (!existingSub.stripe_subscription_id) {
      // Active plan but no Stripe subscription on record — can't safely modify,
      // and creating a new subscription risks double-billing. Manual path only.
      return NextResponse.json(
        { error: "You already have an active plan. Contact support to change it." },
        { status: 409 }
      );
    }
    try {
      const sub = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);
      if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") {
        const itemId = sub.items.data[0]?.id;
        if (!itemId) {
          return NextResponse.json(
            { error: "Could not update your plan — please contact support." },
            { status: 500 }
          );
        }
        await stripe.subscriptions.update(sub.id, {
          items: [{ id: itemId, price: priceId }],
          proration_behavior: "always_invoice",
          metadata: { user_id: userId, plan, interval },
        });
        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id:                userId,
            plan,
            status:                 "active",
            stripe_subscription_id: sub.id,
            stripe_customer_id:     typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? null),
            updated_at:             new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        console.log(`[create-checkout] in-place plan change → ${plan} for user ${userId}`);
        return NextResponse.json({ updated: true, plan });
      }
      // Stripe subscription no longer alive (cancelled there) — the DB row is
      // stale, so a fresh checkout below is the correct path.
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code !== "resource_missing") {
        console.error("[create-checkout] plan change failed:", e);
        return NextResponse.json(
          { error: "Could not update your plan — please try again." },
          { status: 500 }
        );
      }
      // resource_missing → subscription gone in Stripe; fall through to checkout.
    }
  }

  // ── 4. Create Stripe session ──────────────────────────────────────────────
  // Resolve an absolute, scheme-qualified base URL. Stripe rejects relative or
  // scheme-less success/cancel URLs with "Not a valid URL", which previously
  // surfaced to users as a broken upgrade button. Normalise defensively.
  const baseUrl = resolveBaseUrl(req);

  // Final guard: never hand Stripe a malformed URL.
  try {
    new URL(baseUrl);
  } catch {
    console.error("[create-checkout] could not resolve a valid base URL:", JSON.stringify(baseUrl));
    return NextResponse.json(
      { error: "Site URL is misconfigured — please contact support." },
      { status: 500 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode:                 "subscription",
      ...(userEmail ? { customer_email: userEmail } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata:   { user_id: userId, plan, interval },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url:  `${baseUrl}/#pricing`,
    });

    if (!session.url) {
      console.error("[create-checkout] Stripe session created but URL is null");
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[create-checkout] Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
