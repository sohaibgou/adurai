/**
 * POST /api/auth/resend-verify
 *
 * Sends a verification magic link to the authenticated user's email.
 * Calls the GoTrue /otp endpoint directly with the service-role key so it
 * works regardless of client-side flow type or rate-limit context.
 *
 * Auth: expects Authorization: Bearer <access_token> from the client.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Authenticate the caller
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call GoTrue OTP endpoint directly with service-role key.
  // This is equivalent to signInWithOtp but server-side, so it bypasses
  // the PKCE verifier issue and client-side rate-limit context.
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey":        serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      email:       user.email,
      create_user: false,
      redirect_to: `${appUrl}/auth/confirm`,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg  = (body as { msg?: string; message?: string }).msg
              ?? (body as { msg?: string; message?: string }).message
              ?? `OTP request failed (${res.status})`;
    return NextResponse.json({ error: msg }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
