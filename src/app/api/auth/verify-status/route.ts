/**
 * GET /api/auth/verify-status
 *
 * Returns the REAL email-verification status by reading app_metadata
 * directly from the database via the admin client — NOT from the session
 * JWT, which can be stale immediately after auto-confirm.
 *
 * Logic:
 *   email_link_verified === true   → verified (clicked the email link)
 *   email_link_verified === false  → auto-confirmed but not yet clicked
 *   email_link_verified === undefined → legacy user (treat as verified)
 */
import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { supabaseAdmin }              from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ emailVerified: false, unauthenticated: true });

  try {
    // Read straight from the DB — not from the stale session JWT
    const { data } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const meta     = (data?.user?.app_metadata ?? {}) as Record<string, unknown>;

    // Explicitly set to false → auto-confirmed, not yet clicked the link
    // undefined / true     → legacy or genuinely verified
    const needsVerification = meta.email_link_verified === false;

    return NextResponse.json({ emailVerified: !needsVerification, userId: user.id });
  } catch {
    // If admin check fails (wrong service key etc.) — fail open so we
    // don't lock out legitimate users
    return NextResponse.json({ emailVerified: true });
  }
}
