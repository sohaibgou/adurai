/**
 * POST /api/auth/mark-verified
 *
 * Called by /auth/confirm after the user successfully verifies their email
 * via the Supabase OTP link. Sets app_metadata.email_link_verified = true
 * which unlocks all generation features.
 *
 * Uses cookie-based auth — only the authenticated user can mark themselves.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existingMeta = (user.app_metadata ?? {}) as Record<string, unknown>;

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...existingMeta, email_link_verified: true },
  });

  return NextResponse.json({ ok: true });
}
