/**
 * GET /api/meta/callback
 *
 * Handles the redirect back from Facebook OAuth.
 *
 * 1. Validates the CSRF state token from the cookie
 * 2. Exchanges the authorisation code for an access token via Graph API
 * 3. Fetches the user's Meta user ID and first active ad account
 * 4. Upserts the connection in Supabase
 * 5. Posts a message to the opener and closes the popup
 */
import { NextRequest } from "next/server";
import { cookies }     from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const HTML_OK = `<html><body><script>
  window.opener && window.opener.postMessage('meta_connected', '*');
  window.close();
</script></body></html>`;

function htmlFail(reason: string) {
  const safe = JSON.stringify(reason);
  return new Response(
    `<html><body><script>
      console.error('[meta/callback] failed:', ${safe});
      window.opener && window.opener.postMessage({type:'meta_connection_failed',reason:${safe}},'*');
      window.close();
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code        = searchParams.get("code");
  const stateParam  = searchParams.get("state");
  const oauthError  = searchParams.get("error");

  // ── User denied the permission dialog ─────────────────────────────────────
  if (oauthError) {
    const desc = searchParams.get("error_description") ?? oauthError;
    console.warn("[meta/callback] OAuth denied:", desc);
    return htmlFail(`oauth_denied: ${desc}`);
  }

  if (!code || !stateParam) {
    console.error("[meta/callback] Missing code or state");
    return htmlFail("missing_code_or_state");
  }

  // ── Validate CSRF state ────────────────────────────────────────────────────
  let userId: string;
  let csrf:   string;
  try {
    const decoded = JSON.parse(
      Buffer.from(stateParam, "base64url").toString("utf8"),
    ) as { csrf?: string; userId?: string };
    csrf   = decoded.csrf   ?? "";
    userId = decoded.userId ?? "";
    if (!csrf || !userId) throw new Error("Incomplete state payload");
  } catch (err) {
    console.error("[meta/callback] Invalid state:", err);
    return htmlFail("invalid_state_payload");
  }

  const cookieStore = await cookies();
  const storedCsrf  = cookieStore.get("meta_oauth_state")?.value;
  if (!storedCsrf || storedCsrf !== csrf) {
    console.error("[meta/callback] CSRF mismatch — storedCsrf:", storedCsrf ? "present" : "missing");
    return htmlFail("csrf_mismatch");
  }

  const appId       = process.env.FACEBOOK_APP_ID!;
  const appSecret   = process.env.FACEBOOK_APP_SECRET!;
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectUri = `${appUrl}/api/meta/callback`;

  try {
    // ── 1. Exchange code for access token ─────────────────────────────────────
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id",     appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri",  redirectUri);
    tokenUrl.searchParams.set("code",          code);

    const tokenRes = await fetch(tokenUrl.toString(), {
      cache:  "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text().catch(() => "");
      console.error("[meta/callback] Token exchange failed:", tokenRes.status, errBody.slice(0, 300));
      return htmlFail(`token_exchange_http_${tokenRes.status}: ${errBody.slice(0, 120)}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token?: string;
      token_type?:   string;
      expires_in?:   number;
      error?:        { message: string; code?: number };
    };

    if (!tokenData.access_token) {
      const msg = tokenData.error?.message ?? JSON.stringify(tokenData);
      console.error("[meta/callback] No access_token in response:", tokenData);
      return htmlFail(`no_access_token: ${msg}`);
    }

    const accessToken = tokenData.access_token;

    // ── 2. Fetch Meta user ID ──────────────────────────────────────────────────
    let metaUserId = "";
    try {
      const meRes  = await fetch(
        `https://graph.facebook.com/v19.0/me?access_token=${accessToken}`,
        { signal: AbortSignal.timeout(8_000) },
      );
      const meData = await meRes.json() as { id?: string; name?: string };
      metaUserId   = meData.id ?? "";
    } catch (err) {
      console.warn("[meta/callback] /me fetch failed (non-fatal):", err);
    }

    // ── 3. Fetch first active ad account ──────────────────────────────────────
    let adAccountId   = "";
    let adAccountName = "Meta Ads Account";
    try {
      const acctRes  = await fetch(
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(8_000) },
      );
      const acctData = await acctRes.json() as {
        data?: Array<{ id: string; name: string; account_status?: number }>;
      };
      const accounts = acctData.data ?? [];
      const active   = accounts.find((a) => a.account_status === 1) ?? accounts[0];
      if (active) {
        adAccountId   = active.id.replace(/^act_/, "");
        adAccountName = active.name;
      }
    } catch (err) {
      console.warn("[meta/callback] /me/adaccounts fetch failed (non-fatal):", err);
    }

    // ── 4. Upsert connection in Supabase ───────────────────────────────────────
    const { error: dbError } = await supabaseAdmin
      .from("meta_connections")
      .upsert(
        {
          user_id:         userId,
          meta_user_id:    metaUserId,
          access_token:    accessToken,
          ad_account_id:   adAccountId,
          ad_account_name: adAccountName,
          status:          "active",
          connected_at:    new Date().toISOString(),
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (dbError) {
      console.error("[meta/callback] Supabase upsert error:", dbError);
      return htmlFail(`supabase_upsert: ${dbError.message}`);
    }

    console.log(
      `[meta/callback] ✓ Connected user=${userId} meta_user=${metaUserId} account=${adAccountId} (${adAccountName})`,
    );

    // ── 5. Notify popup — it closes itself ────────────────────────────────────
    return new Response(HTML_OK, { headers: { "Content-Type": "text/html" } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[meta/callback] Unexpected error:", msg);
    return htmlFail(`unexpected: ${msg}`);
  }
}
