import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const META_MCP_APP_ID = "1419958862115515";
const REDIRECT_URI    = "https://adur.ai/api/meta/callback";
const GRAPH           = "https://graph.facebook.com/v21.0";
const BASE_URL        = "https://adur.ai";

// ── Token exchange (PKCE — no app secret required) ─────────────────────────
async function exchangeCode(code: string, codeVerifier: string): Promise<string> {
  const res  = await fetch(`${GRAPH}/oauth/access_token`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      client_id:     META_MCP_APP_ID,
      redirect_uri:  REDIRECT_URI,
      code,
      code_verifier: codeVerifier,
    }),
  });
  const data = await res.json() as { access_token?: string; error?: { message: string } };
  if (!data.access_token) {
    throw new Error(data.error?.message ?? "Token exchange failed");
  }
  return data.access_token;
}

// ── Inspect the token to get expiry, type, and user ID ─────────────────────
interface TokenInfo {
  user_id:     string;
  expires_at?: number; // unix timestamp
  is_valid:    boolean;
}
async function inspectToken(token: string): Promise<TokenInfo> {
  const url = new URL(`${GRAPH}/debug_token`);
  url.searchParams.set("input_token",  token);
  url.searchParams.set("access_token", `${META_MCP_APP_ID}|${token}`);
  const res  = await fetch(url.toString());
  const body = await res.json() as { data?: TokenInfo };
  return body.data ?? { user_id: "", is_valid: false };
}

// ── Get Meta user ID ────────────────────────────────────────────────────────
async function getMetaUserId(token: string): Promise<string> {
  const res  = await fetch(`${GRAPH}/me?fields=id&access_token=${token}`);
  const data = await res.json() as { id?: string };
  return data.id ?? "";
}

// ── Get ad accounts ─────────────────────────────────────────────────────────
interface AdAccount {
  id:             string;
  name:           string;
  account_status: number;
  currency:       string;
}
async function getAdAccounts(token: string): Promise<AdAccount[]> {
  const url = new URL(`${GRAPH}/me/adaccounts`);
  url.searchParams.set("fields",       "id,name,account_status,currency");
  url.searchParams.set("access_token", token);
  const res  = await fetch(url.toString());
  const data = await res.json() as { data?: AdAccount[]; error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? "Failed to fetch ad accounts");
  return data.data ?? [];
}

// ── Main handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.warn("[meta/callback] User denied:", searchParams.get("error_description"));
    return NextResponse.redirect(`${BASE_URL}/dashboard?meta=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?meta=error`);
  }

  // Decode user ID from state
  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
    if (!userId) throw new Error("empty");
  } catch {
    return NextResponse.redirect(`${BASE_URL}/dashboard?meta=error`);
  }

  // Read code_verifier from cookie
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("_meta_cv")?.value;
  if (!codeVerifier) {
    console.error("[meta/callback] No code_verifier cookie found");
    return NextResponse.redirect(`${BASE_URL}/dashboard?meta=error`);
  }

  try {
    // 1. Exchange code → access token (PKCE, no app secret needed)
    const accessToken = await exchangeCode(code, codeVerifier);

    // 2. Get Meta user ID
    const metaUserId = await getMetaUserId(accessToken);

    // 3. Get ad accounts — pick first active
    const accounts       = await getAdAccounts(accessToken);
    const activeAccounts = accounts.filter((a) => a.account_status === 1);
    const account        = activeAccounts[0] ?? accounts[0];

    if (!account) {
      return NextResponse.redirect(`${BASE_URL}/dashboard?meta=no_accounts`);
    }

    // 4. Strip "act_" prefix for clean storage
    const adAccountId = account.id.replace(/^act_/, "");

    // 5. Try to get token expiry (optional — won't fail if debug_token doesn't work)
    let tokenExpiresAt: string | null = null;
    try {
      const info = await inspectToken(accessToken);
      if (info.expires_at) {
        tokenExpiresAt = new Date(info.expires_at * 1000).toISOString();
      }
    } catch { /* non-fatal */ }

    // 6. Upsert into meta_connections
    const { error: dbError } = await supabaseAdmin
      .from("meta_connections")
      .upsert(
        {
          user_id:              userId,
          meta_user_id:         metaUserId,
          meta_access_token:    accessToken,
          meta_ad_account_id:   adAccountId,
          meta_ad_account_name: account.name,
          token_expires_at:     tokenExpiresAt,
          connected_at:         new Date().toISOString(),
          updated_at:           new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[meta/callback] DB error:", dbError);
      return NextResponse.redirect(`${BASE_URL}/dashboard?meta=db_error`);
    }

    console.log(`[meta/callback] ✓ user=${userId} account=${adAccountId} (${account.name})`);

    // Clear the PKCE cookie
    const response = NextResponse.redirect(`${BASE_URL}/dashboard?meta=connected`);
    response.cookies.set("_meta_cv", "", { maxAge: 0, path: "/" });
    return response;

  } catch (err) {
    console.error("[meta/callback] Error:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(`${BASE_URL}/dashboard?meta=error`);
  }
}
