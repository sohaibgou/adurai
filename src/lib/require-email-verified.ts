/**
 * requireEmailVerified
 *
 * Call at the top of any generation API route to enforce email verification.
 *
 * Logic:
 *   - undefined  → user existed before this system → ALLOW
 *   - true       → user clicked the verification link → ALLOW
 *   - false      → user bypassed login but hasn't verified → BLOCK
 *
 * Returns null if allowed, or a NextResponse 403 if blocked.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function requireEmailVerified(
  _req: NextRequest,
): Promise<{ user: { id: string; email?: string; app_metadata: Record<string, unknown> } } | NextResponse> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in — allow routes to handle their own auth
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const verified = meta.email_link_verified;

  // explicitly false = new user who bypassed but hasn't clicked the link
  if (verified === false) {
    return NextResponse.json(
      {
        error: "email_not_verified",
        message: "Please verify your email address to use this feature. Check your inbox for the verification link.",
      },
      { status: 403 },
    );
  }

  return { user: { id: user.id, email: user.email, app_metadata: meta } };
}
