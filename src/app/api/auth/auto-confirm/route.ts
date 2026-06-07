/**
 * POST /api/auth/auto-confirm
 *
 * Called when signInWithPassword returns "Email not confirmed".
 *
 * SECURITY: This endpoint admin-confirms an email, so it must NOT trust the
 * caller. We re-verify the password server-side first by attempting a sign-in
 * with a throwaway anon client. Supabase returns the specific error
 * "Email not confirmed" ONLY when the password is correct on an unconfirmed
 * account (a wrong password yields "Invalid login credentials"). So:
 *   - "Email not confirmed"        -> password correct  -> proceed to confirm
 *   - "Invalid login credentials"  -> wrong password    -> reject (401)
 *   - sign-in succeeds              -> already confirmed -> nothing to do
 *   - any other error               -> reject (400)
 *
 * Sets app_metadata.email_link_verified = false so generation features
 * remain gated until the user actually clicks the verification email.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  // ── Re-verify the password server-side before confirming anything ───────
  // Use a fresh anon client that never persists a session.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error: signInErr } = await anon.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (!signInErr) {
    // Already confirmed and credentials valid — nothing to do.
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
  }
  const msg = (signInErr.message || "").toLowerCase();
  if (!msg.includes("not confirmed")) {
    // Wrong password ("invalid login credentials") or any other failure.
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }
  // Password is correct (account merely unconfirmed) — safe to proceed.

  // Find the user by email (paginate until found or exhausted)
  let user: { id: string; email?: string; app_metadata?: Record<string, unknown> } | undefined;
  let page = 1;
  while (!user) {
    const { data, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listErr) return NextResponse.json({ error: "lookup failed" }, { status: 500 });
    user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (data.users.length < 1000) break; // last page
    page++;
  }
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // Confirm the email so signInWithPassword works
  // Also mark email_link_verified = false (our own gate for generation)
  const existingMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const alreadyMarked = "email_link_verified" in existingMeta;

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    app_metadata: {
      ...existingMeta,
      // Only set to false if not already set (don't overwrite a true)
      email_link_verified: alreadyMarked ? existingMeta.email_link_verified : false,
    },
  });

  return NextResponse.json({ ok: true });
}
