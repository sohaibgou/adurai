import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_URL!;

  if (error) {
    console.warn("[meta/callback] denied:", searchParams.get("error_description"));
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }

  // Decode user ID from state (set in /api/meta/connect)
  let userId: string;
  try {
    userId = Buffer.from(state, "base64url").toString("utf8");
    if (!userId) throw new Error("empty");
  } catch {
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch(
      `${GRAPH}/oauth/access_token` +
      `?client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&redirect_uri=${process.env.NEXT_PUBLIC_URL}/api/meta/callback` +
      `&code=${code}`
    );
    const tokenData = await tokenResponse.json() as {
      access_token?: string;
      error?: { message: string };
    };
    if (!tokenData.access_token) {
      throw new Error(tokenData.error?.message ?? "Token exchange failed");
    }
    const { access_token } = tokenData;

    // 2. Get ad accounts
    const accountsResponse = await fetch(
      `${GRAPH}/me/adaccounts?fields=id,name,account_id,account_status,currency&access_token=${access_token}`
    );
    const accountsData = await accountsResponse.json() as {
      data?: Array<{ id: string; name: string; account_id: string; account_status: number; currency: string }>;
      error?: { message: string };
    };
    if (!accountsData.data) {
      throw new Error(accountsData.error?.message ?? "Failed to fetch ad accounts");
    }

    const { data: adAccounts } = accountsData;
    if (!adAccounts.length) {
      return NextResponse.redirect(`${baseUrl}/dashboard?meta=no_accounts`);
    }

    // Prefer first active account
    const account = adAccounts.find((a) => a.account_status === 1) ?? adAccounts[0];

    // 3. Get Meta user ID
    const meRes  = await fetch(`${GRAPH}/me?fields=id&access_token=${access_token}`);
    const meData = await meRes.json() as { id?: string };

    // 4. Store in Supabase
    const { error: dbError } = await supabaseAdmin
      .from("meta_connections")
      .upsert(
        {
          user_id:         userId,
          meta_user_id:    meData.id ?? "",
          access_token,
          ad_account_id:   account.account_id ?? account.id.replace(/^act_/, ""),
          ad_account_name: account.name,
          status:          "active",
          connected_at:    new Date().toISOString(),
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[meta/callback] DB error:", dbError);
      return NextResponse.redirect(`${baseUrl}/dashboard?meta=db_error`);
    }

    console.log(`[meta/callback] ✓ user=${userId} account=${account.account_id} (${account.name})`);
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=connected`);

  } catch (err) {
    console.error("[meta/callback] Error:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }
}
