/**
 * requireEmailVerified
 *
 * Server-side guard for API routes that need verified email.
 * Reads app_metadata from the DB (via admin client) — not from the stale
 * session JWT — so auto-confirmed-but-unverified users are correctly blocked.
 *
 * Blocks only when email_link_verified === false (explicitly set by
 * auto-confirm). Legacy users without the key are treated as verified.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { supabaseAdmin }             from "@/lib/supabase-server";

export async function requireEmailVerified(
  _req: NextRequest,
): Promise<{ user: { id: string; email?: string; app_metadata: Record<string, unknown> } } | NextResponse> {
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Always read from DB, not the JWT, to get the current value
    const { data } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const meta     = (data?.user?.app_metadata ?? {}) as Record<string, unknown>;

    if (meta.email_link_verified === false) {
      return NextResponse.json(
        { error: "Please verify your email before using this feature." },
        { status: 403 },
      );
    }

    return { user: { id: user.id, email: user.email, app_metadata: meta } };
  } catch {
    // Admin check failed — fail open (don't lock out users due to config issues)
    const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
    return { user: { id: user.id, email: user.email, app_metadata: meta } };
  }
}
