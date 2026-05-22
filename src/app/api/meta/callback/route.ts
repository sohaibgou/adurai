/**
 * GET /api/meta/callback
 *
 * Handles the redirect back from Meta's OAuth authorisation endpoint.
 *
 * 1. Reads PKCE state from the httpOnly cookie set by /api/meta/connect
 * 2. Exchanges the authorisation code for a Meta MCP access token
 * 3. Calls Claude API with the MCP token to discover the user's ad accounts
 * 4. Upserts the connection in Supabase
 * 5. Redirects to /dashboard?meta=connected
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies }                   from "next/headers";
import { supabaseAdmin }             from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const META_MCP_URL  = "https://mcp.facebook.com/ads";
const MCP_BETA      = "mcp-client-2025-04-04";

// ── Use Claude + Meta MCP to resolve the first active ad account ──────────────

interface AdAccountInfo {
  adAccountId:   string;
  adAccountName: string;
  metaUserId:    string;
}

async function resolveAdAccount(mcpToken: string): Promise<AdAccountInfo | null> {
  try {
    const res = await fetch(ANTHROPIC_API, {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "anthropic-beta":    MCP_BETA,
      },
      body: JSON.stringify({
        model:       "claude-opus-4-5",
        max_tokens:  1024,
        mcp_servers: [{
          type:                "url",
          url:                 META_MCP_URL,
          name:                "meta-ads",
          authorization_token: mcpToken,
        }],
        messages: [{
          role:    "user",
          content: `List the Meta ad accounts accessible to this user.
Return ONLY a valid JSON object — no markdown, no explanations:
{
  "userId": "meta_user_id_string",
  "adAccounts": [
    { "id": "act_XXXXXXX", "name": "Account Name", "status": 1 }
  ]
}
Prefer accounts with status=1 (ACTIVE). Include all accounts found.`,
        }],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error("[callback] Claude API error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json() as {
      content?: Array<{ type: string; text?: string }>;
      error?:   { message: string };
    };

    if (data.error) {
      console.error("[callback] Claude error:", data.error.message);
      return null;
    }

    const text = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n")
      .trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]+\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      userId?:     string;
      adAccounts?: Array<{ id: string; name: string; status?: number }>;
    };

    const accounts   = parsed.adAccounts ?? [];
    const activeAcct = accounts.find((a) => a.status === 1) ?? accounts[0];
    if (!activeAcct) return null;

    return {
      adAccountId:   activeAcct.id.replace(/^act_/, ""),
      adAccountName: activeAcct.name,
      metaUserId:    parsed.userId ?? "",
    };
  } catch (err) {
    console.error("[callback] resolveAdAccount error:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_URL!;

  if (error) {
    console.warn("[meta/callback] OAuth denied:", searchParams.get("error_description"));
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=denied`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }

  // 1. Decode state to get userId + clientId
  let userId:   string;
  let clientId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      userId?: string;
      clientId?: string;
    };
    userId   = decoded.userId   ?? "";
    clientId = decoded.clientId ?? "";
    if (!userId) throw new Error("missing userId in state");
  } catch (err) {
    console.error("[meta/callback] invalid state:", err);
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }

  // 2. Read PKCE state from httpOnly cookie
  const cookieStore  = await cookies();
  const cookieValue  = cookieStore.get("meta_mcp_oauth")?.value;
  if (!cookieValue) {
    console.error("[meta/callback] missing meta_mcp_oauth cookie");
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }

  let codeVerifier:   string;
  let tokenEndpoint:  string;
  try {
    const decoded = JSON.parse(Buffer.from(cookieValue, "base64url").toString("utf8")) as {
      codeVerifier?:  string;
      tokenEndpoint?: string;
    };
    codeVerifier  = decoded.codeVerifier  ?? "";
    tokenEndpoint = decoded.tokenEndpoint ?? "";
    if (!codeVerifier || !tokenEndpoint) throw new Error("incomplete cookie");
  } catch (err) {
    console.error("[meta/callback] invalid cookie:", err);
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }

  const redirectUri = `${baseUrl}/api/meta/callback`;

  try {
    // 3. Exchange code for MCP access token
    const body = new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  redirectUri,
      code_verifier: codeVerifier,
    });
    if (clientId) body.set("client_id", clientId);

    const tokenRes = await fetch(tokenEndpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
      signal:  AbortSignal.timeout(10_000),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      console.error("[meta/callback] token exchange failed:", tokenRes.status, errText.slice(0, 300));
      return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
    }

    const tokenData = await tokenRes.json() as {
      access_token?: string;
      error?:        string;
    };
    if (!tokenData.access_token) {
      console.error("[meta/callback] no access_token in response:", tokenData);
      return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
    }

    const mcpToken = tokenData.access_token;

    // 4. Resolve ad account via Claude + Meta MCP
    const accountInfo = await resolveAdAccount(mcpToken);

    // 5. Upsert into Supabase
    const { error: dbError } = await supabaseAdmin
      .from("meta_connections")
      .upsert(
        {
          user_id:         userId,
          meta_user_id:    accountInfo?.metaUserId    ?? "",
          access_token:    mcpToken,
          ad_account_id:   accountInfo?.adAccountId  ?? "",
          ad_account_name: accountInfo?.adAccountName ?? "Meta Ads Account",
          status:          "active",
          connected_at:    new Date().toISOString(),
          updated_at:      new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (dbError) {
      console.error("[meta/callback] DB error:", dbError);
      return NextResponse.redirect(`${baseUrl}/dashboard?meta=db_error`);
    }

    console.log(
      `[meta/callback] ✓ user=${userId} account=${accountInfo?.adAccountId ?? "unknown"} (${accountInfo?.adAccountName ?? "unknown"})`,
    );

    // 6. Redirect to dashboard, clearing the OAuth cookie
    const response = NextResponse.redirect(`${baseUrl}/dashboard?meta=connected`);
    response.cookies.set("meta_mcp_oauth", "", { maxAge: 0, path: "/" });
    return response;

  } catch (err) {
    console.error("[meta/callback] error:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(`${baseUrl}/dashboard?meta=error`);
  }
}
