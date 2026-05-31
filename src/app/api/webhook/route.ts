import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Map Stripe price IDs → plan tier. Used as a robust fallback when session
// metadata isn't available (e.g. plan changes made in the Stripe portal).
const PLAN_BY_PRICE: Record<string, "starter" | "pro"> = {
  [process.env.STRIPE_STARTER_PRICE_ID ?? "__starter"]: "starter",
  [process.env.STRIPE_PRO_PRICE_ID ?? "__pro"]:         "pro",
};

/** Resolve the plan tier from a subscription's first line item price. */
function planFromSubscription(sub: Stripe.Subscription): "starter" | "pro" | null {
  const priceId = sub.items?.data?.[0]?.price?.id;
  return priceId ? (PLAN_BY_PRICE[priceId] ?? null) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log("Stripe webhook:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.warn("checkout.session.completed: no user_id in metadata");
      return NextResponse.json({ ok: true });
    }

    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    const customerId =
      typeof session.customer === "string" ? session.customer : null;

    // ── Resolve the purchased plan ──────────────────────────────────────────
    // Primary: the plan we stamped into metadata at checkout creation.
    // Fallback: look up the subscription's price ID. NEVER hardcode "starter"
    // — doing so silently downgraded every Pro purchaser.
    let plan: "starter" | "pro" = session.metadata?.plan === "pro" ? "pro" : "starter";
    if (session.metadata?.plan !== "pro" && session.metadata?.plan !== "starter" && subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        plan = planFromSubscription(sub) ?? plan;
      } catch (e) {
        console.error("[webhook] could not retrieve subscription to resolve plan:", e);
      }
    }

    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id:                userId,
        stripe_customer_id:     customerId,
        stripe_subscription_id: subscriptionId,
        plan,
        status:                 "active",
        updated_at:             new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) console.error("DB upsert error:", error);
    else console.log(`[webhook] activated ${plan} for user ${userId}`);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);

    if (error) console.error("DB update error:", error);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const newStatus = subscription.status === "active" ? "active" : "inactive";

    // Keep the plan tier in sync too, so an upgrade/downgrade made in Stripe's
    // billing portal is reflected in the user's unlocked features.
    const plan = planFromSubscription(subscription);

    const update: Record<string, unknown> = {
      status:     newStatus,
      updated_at: new Date().toISOString(),
    };
    if (plan) update.plan = plan;

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(update)
      .eq("stripe_subscription_id", subscription.id);

    if (error) console.error("DB update error:", error);
  }

  return NextResponse.json({ ok: true });
}
