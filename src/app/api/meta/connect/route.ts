/**
 * GET /api/meta/connect
 *
 * Starts the standard Facebook OAuth flow using the app's own credentials.
 * Generates a random CSRF state token, stores it in an httpOnly cookie,
 * then redirects to the Facebook login dialog.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Require the user to be signed in before initiating OAuth
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const appId      = process.env.FACEBOOK_APP_ID!;
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectUri = `${appUrl}/api/meta/callback`;

  // Generate a random CSRF state token and embed the userId so the
  // callback can associate the token with the correct Supabase user.
  const csrfToken  = crypto.randomUUID();
  const statePayload = Buffer.from(
    JSON.stringify({ csrf: csrfToken, userId: user.id }),
  ).toString("base64url");

  // Build the Facebook OAuth dialog URL
  const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  authUrl.searchParams.set("client_id",     appId);
  authUrl.searchParams.set("redirect_uri",  redirectUri);
  authUrl.searchParams.set("scope",         "ads_read,ads_management,business_management");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state",         statePayload);

  // Store the CSRF token in a short-lived httpOnly cookie so the callback
  // can validate it and prevent CSRF attacks.
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("meta_oauth_state", csrfToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   600, // 10 minutes
    path:     "/",
  });
  return response;
}
