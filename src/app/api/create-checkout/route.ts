import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

const PRICES: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro:     process.env.STRIPE_PRO_PRICE_ID,
};

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

  // ── 3. Resolve plan ───────────────────────────────────────────────────────
  let body: { plan?: string } = {};
  try { body = await req.json(); } catch { /* missing body is OK */ }

  const plan    = body.plan && PRICES[body.plan] ? body.plan : "starter";
  const priceId = PRICES[plan];

  if (!priceId) {
    console.error(`[create-checkout] price ID not configured for plan: ${plan}`);
    return NextResponse.json({ error: `Price not configured for plan: ${plan}` }, { status: 500 });
  }

  // ── 4. Create Stripe session ──────────────────────────────────────────────
  const baseUrl = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/$/, "")
    || `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode:                 "subscription",
      ...(userEmail ? { customer_email: userEmail } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata:   { user_id: userId, plan },
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
