import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  // ── 1. Try reading session from cookies (works for logged-in users) ──
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
    userId = session?.user?.id;
    userEmail = session?.user?.email;
  } catch { /* cookie read failed — fall through to header check */ }

  // ── 2. Fall back to Authorization header (used right after signup) ──
  if (!userId) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
      userEmail = user?.email;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized", requiresAuth: true }, { status: 401 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      ...(userEmail ? { customer_email: userEmail } : {}),
      line_items: [{ price: process.env.STRIPE_STARTER_PRICE_ID!, quantity: 1 }],
      metadata: { user_id: userId },
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
