import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Meta's official MCP App ID — pre-approved, no review needed for ads_read
const META_MCP_APP_ID = "1419958862115515";
const REDIRECT_URI    = "https://adur.ai/api/meta/callback";
const SCOPES          = "ads_read,ads_management,business_management";

export async function GET(req: NextRequest) {
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

  // ── PKCE: code_verifier (random 32 bytes → base64url) ─────────────────────
  const verifierBytes  = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier   = Buffer.from(verifierBytes).toString("base64url");

  // code_challenge = BASE64URL( SHA-256( code_verifier ) )
  const hashBuf        = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge  = Buffer.from(hashBuf).toString("base64url");

  // State = base64url(userId) — verified in callback to prevent CSRF
  const state = Buffer.from(user.id).toString("base64url");

  const oauthUrl = new URL("https://www.facebook.com/dialog/oauth");
  oauthUrl.searchParams.set("client_id",             META_MCP_APP_ID);
  oauthUrl.searchParams.set("redirect_uri",          REDIRECT_URI);
  oauthUrl.searchParams.set("scope",                 SCOPES);
  oauthUrl.searchParams.set("response_type",         "code");
  oauthUrl.searchParams.set("state",                 state);
  oauthUrl.searchParams.set("code_challenge",        codeChallenge);
  oauthUrl.searchParams.set("code_challenge_method", "S256");

  // Store code_verifier in a short-lived httpOnly cookie (10 min)
  const response = NextResponse.redirect(oauthUrl.toString());
  response.cookies.set("_meta_cv", codeVerifier, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    maxAge:   600,
    path:     "/",
  });
  return response;
}
