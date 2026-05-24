/**
 * POST /api/auth/signup
 *
 * Server-side signup that creates users pre-confirmed so no email
 * verification is ever required to access the dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email?: string; password?: string };

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Create user with email pre-confirmed so they can sign in immediately
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email:         email.trim(),
    password:      password.trim(),
    email_confirm: true,
  });

  if (error) {
    // User already exists — just make sure they're confirmed
    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered") ||
      error.message.toLowerCase().includes("duplicate")
    ) {
      // Find the user and confirm them
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      if (existing && !existing.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, { email_confirm: true });
      }
      // Return a specific code so the client knows to just sign in
      return NextResponse.json({ ok: true, existed: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
