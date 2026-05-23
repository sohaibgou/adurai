/**
 * requireEmailVerified
 *
 * Previously gated generation features on email verification.
 * Now just checks that the user is authenticated — email verification
 * is no longer required to use any feature.
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

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  return { user: { id: user.id, email: user.email, app_metadata: meta } };
}
