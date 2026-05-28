/**
 * POST /api/auth/signup
 *
 * Server-side signup. Creates the user pre-confirmed (so password sign-in
 * works immediately) but sets email_link_verified=false in app_metadata so
 * the verify-gate blocks dashboard access until they click the email link.
 * A verification OTP email is sent right after account creation.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function sendVerificationEmail(email: string, origin: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      email,
      create_user: false,
      redirect_to: `${appUrl}/auth/confirm`,
    }),
  }).catch(() => { /* non-critical — user can resend from verify gate */ });
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email?: string; password?: string };

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const origin = req.nextUrl.origin;

  // Create user pre-confirmed (so signInWithPassword works right away) but
  // with email_link_verified=false so the verify gate stays up until they
  // click the verification link we send below.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email:         email.trim(),
    password:      password.trim(),
    email_confirm: true,
    app_metadata:  { email_link_verified: false },
  });

  if (error) {
    // User already exists — make sure they are at least Supabase-confirmed
    // so sign-in works, but don't touch email_link_verified (it may be true).
    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered") ||
      error.message.toLowerCase().includes("duplicate")
    ) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      if (existing && !existing.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, { email_confirm: true });
      }
      return NextResponse.json({ ok: true, existed: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Send verification email asynchronously (non-blocking)
  await sendVerificationEmail(email.trim(), origin);

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
