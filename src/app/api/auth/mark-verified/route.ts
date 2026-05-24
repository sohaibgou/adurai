/**
 * POST /api/auth/mark-verified
 *
 * Called by /auth/confirm after the user successfully verifies their email.
 * Sets app_metadata.email_link_verified = true which unlocks all features.
 *
 * Authentication priority:
 *   1. Authorization: Bearer <access_token>  — passed directly from confirm page
 *      (avoids cookie timing race right after verifyOtp / exchangeCodeForSession)
 *   2. Cookie-based session                  — fallback for other callers
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let existingMeta: Record<string, unknown> = {};

  // ── 1. Try Bearer token (confirm page passes this directly) ──────────────
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data?.user) {
      userId      = data.user.id;
      existingMeta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
    }
  }

  // ── 2. Fall back to cookie session ───────────────────────────────────────
  if (!userId) {
    const cookieStore = await cookies();
    const supabase    = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId       = user.id;
      existingMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { ...existingMeta, email_link_verified: true },
  });

  return NextResponse.json({ ok: true });
}
