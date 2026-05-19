import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Ensure user is authenticated before starting OAuth
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  if (!process.env.META_APP_ID) {
    return NextResponse.json({ error: "META_APP_ID not configured" }, { status: 500 });
  }

  const metaMCPAuthUrl =
    `https://www.facebook.com/dialog/oauth` +
    `?client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${process.env.NEXT_PUBLIC_URL}/api/meta/callback` +
    `&scope=ads_read,ads_management,business_management` +
    `&response_type=code` +
    `&state=${Buffer.from(user.id).toString("base64url")}`;

  return NextResponse.redirect(metaMCPAuthUrl);
}
