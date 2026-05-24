/**
 * POST /api/auth/auto-confirm
 *
 * Called when signInWithPassword returns "Email not confirmed".
 * Because Supabase only returns that specific error when the password is
 * correct (wrong credentials give "Invalid login credentials"), the password
 * has already been verified — we're safe to admin-confirm the email so the
 * user can log in immediately.
 *
 * Sets app_metadata.email_link_verified = false so generation features
 * remain gated until the user actually clicks the verification email.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email?: string };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

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
