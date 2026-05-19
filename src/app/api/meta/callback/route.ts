import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const META_APP_ID     = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const REDIRECT_URI    = `${process.env.NEXT_PUBLIC_URL}/api/meta/callback`;
const GRAPH           = "https://graph.facebook.com/v21.0";

async function exchangeCodeForToken(code: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id",     META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("redirect_uri",  REDIRECT_URI);
  url.searchParams.set("code",          code);

  const res  = await fetch(url.toString());
  const data = await res.json() as { access_token?: string; error?: { message: string } };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Failed to exchange code for token");
  }
  return data.access_token;
}

async function getLongLivedToken(shortToken: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type",        "fb_exchange_token");
  url.searchParams.set("client_id",         META_APP_ID);
  url.searchParams.set("client_secret",     META_APP_SECRET);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res  = await fetch(url.toString());
  const data = await res.json() as { access_token?: string; error?: { message: string } };
  if (!res.ok || !data.access_token) {
    console.warn("Long-lived token exchange failed, using short-lived:", data.error?.message);
    return shortToken; // fallback — still usable for ~1hr
  }
  return data.access_token;
}

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

async function getMetaUserId(token: string): Promise<string> {
  const res  = await fetch(`${GRAPH}/me?access_token=${token}&fields=id`);
  const data = await res.json() as { id?: string };
  return data.id ?? "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_URL!;

  // Meta returned an error (user denied)
  if (error) {
    console.warn("[meta/callback] User denied:", searchParams.get("error_description"));
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }

  // Decode user ID from state
  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
    if (!userId) throw new Error("empty");
  } catch {
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=invalid_state`);
  }

  try {
    // 1. Exchange code → short-lived token
    const shortToken = await exchangeCodeForToken(code);

    // 2. Exchange short → long-lived token (~60 days)
    const longToken = await getLongLivedToken(shortToken);

    // 3. Get Meta user ID
    const metaUserId = await getMetaUserId(longToken);

    // 4. Get ad accounts
    const accounts = await getAdAccounts(longToken);
    const activeAccounts = accounts.filter((a) => a.account_status === 1);

    // Pick the first active account (or first if none active)
    const account = activeAccounts[0] ?? accounts[0];

    if (!account) {
      return NextResponse.redirect(`${baseUrl}/dashboard?meta=no_accounts`);
    }

    // 5. Strip "act_" prefix for clean storage
    const adAccountId = account.id.replace(/^act_/, "");

    // 6. Upsert into meta_connections table
    const { error: dbError } = await supabaseAdmin
      .from("meta_connections")
      .upsert(
        {
          user_id:          userId,
          meta_user_id:     metaUserId,
          meta_access_token: longToken,
          meta_ad_account_id:   adAccountId,
          meta_ad_account_name: account.name,
          connected_at:     new Date().toISOString(),
          updated_at:       new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[meta/callback] DB error:", dbError);
      return NextResponse.redirect(`${baseUrl}/dashboard?meta=db_error`);
    }

    console.log(`[meta/callback] ✓ User ${userId} connected ad account ${adAccountId} (${account.name})`);
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=connected`);

  } catch (err) {
    console.error("[meta/callback] Error:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }
}
