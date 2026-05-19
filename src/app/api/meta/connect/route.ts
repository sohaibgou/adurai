import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const META_APP_ID       = process.env.META_APP_ID!;
const REDIRECT_URI      = `${process.env.NEXT_PUBLIC_URL}/api/meta/callback`;
const SCOPES            = "ads_read,ads_management,business_management,read_insights";

export async function GET(req: NextRequest) {
  // Verify user is authenticated
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!META_APP_ID) {
    return NextResponse.json({ error: "META_APP_ID not configured" }, { status: 500 });
  }

  // State = base64(userId) — verified in callback to prevent CSRF
  const state = Buffer.from(user.id).toString("base64url");

  const oauthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  oauthUrl.searchParams.set("client_id",     META_APP_ID);
  oauthUrl.searchParams.set("redirect_uri",  REDIRECT_URI);
  oauthUrl.searchParams.set("scope",         SCOPES);
  oauthUrl.searchParams.set("state",         state);
  oauthUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(oauthUrl.toString());
}
