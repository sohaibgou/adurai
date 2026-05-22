/**
 * GET /api/meta/connect
 *
 * Initiates Meta Ads MCP OAuth flow.
 *
 * No META_APP_ID / META_APP_SECRET required.
 * Discovers OAuth endpoints from the Meta Ads MCP server
 * (https://mcp.facebook.com/ads) per RFC 8414, then:
 *   1. Dynamically registers this client (RFC 7591) to get a client_id
 *   2. Generates a PKCE code_verifier / code_challenge
 *   3. Stores OAuth state in a short-lived httpOnly cookie
 *   4. Redirects the user to Meta's authorisation endpoint
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const dynamic = "force-dynamic";

const META_MCP_URL    = "https://mcp.facebook.com/ads";
const META_MCP_ORIGIN = "https://mcp.facebook.com";

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Buffer.from(arr).toString("base64url");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Buffer.from(hash).toString("base64url");
}

// ── OAuth metadata discovery (RFC 8414) ──────────────────────────────────────

interface OAuthMetadata {
  authorization_endpoint:        string;
  token_endpoint:                string;
  registration_endpoint?:        string;
  code_challenge_methods_supported?: string[];
  scopes_supported?:             string[];
}

async function discoverOAuthMetadata(): Promise<OAuthMetadata> {
  // RFC 8414: try both the path-aware and origin-level discovery URLs
  const candidates = [
    `${META_MCP_URL}/.well-known/oauth-authorization-server`,
    `${META_MCP_ORIGIN}/.well-known/oauth-authorization-server/ads`,
    `${META_MCP_ORIGIN}/.well-known/oauth-authorization-server`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        cache:  "no-store",
        signal: AbortSignal.timeout(6_000),
      });
      if (!res.ok) continue;
      const data = await res.json() as Partial<OAuthMetadata>;
      if (data.authorization_endpoint && data.token_endpoint) {
        return data as OAuthMetadata;
      }
    } catch { /* try next */ }
  }

  throw new Error("Meta MCP OAuth discovery failed — server may be unavailable");
}

// ── Dynamic client registration (RFC 7591) ───────────────────────────────────

async function registerClient(
  registrationEndpoint: string,
  redirectUri:          string,
): Promise<string> {
  const res = await fetch(registrationEndpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      redirect_uris:              [redirectUri],
      client_name:                "Adur.ai",
      grant_types:                ["authorization_code"],
      response_types:             ["code"],
      token_endpoint_auth_method: "none",  // public client — PKCE only
    }),
    signal: AbortSignal.timeout(6_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Client registration failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as { client_id?: string };
  if (!data.client_id) throw new Error("Registration response missing client_id");
  return data.client_id;
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Ensure user is signed in
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/meta/callback`;

  try {
    // 2. Discover OAuth endpoints
    const meta = await discoverOAuthMetadata();

    // 3. Get a client_id — dynamic registration if the server supports it
    let clientId: string;
    if (meta.registration_endpoint) {
      clientId = await registerClient(meta.registration_endpoint, redirectUri);
    } else {
      // MCP server has no registration endpoint; some servers act as public
      // clients that accept any redirect_uri without a client_id.
      // We send an empty string and rely on PKCE for security.
      clientId = "";
    }

    // 4. Generate PKCE
    const codeVerifier  = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // 5. Build state (base64url JSON so the callback knows the user + clientId)
    const statePayload = Buffer.from(
      JSON.stringify({ userId: user.id, clientId }),
    ).toString("base64url");

    // 6. Build authorisation URL
    const authUrl = new URL(meta.authorization_endpoint);
    if (clientId)        authUrl.searchParams.set("client_id",             clientId);
    authUrl.searchParams.set("redirect_uri",           redirectUri);
    authUrl.searchParams.set("response_type",          "code");
    authUrl.searchParams.set("code_challenge",         codeChallenge);
    authUrl.searchParams.set("code_challenge_method",  "S256");
    authUrl.searchParams.set("state",                  statePayload);
    if (meta.scopes_supported?.length) {
      authUrl.searchParams.set("scope", meta.scopes_supported.join(" "));
    }

    // 7. Store PKCE verifier + token endpoint in an httpOnly cookie (10-min TTL)
    const cookiePayload = Buffer.from(
      JSON.stringify({
        codeVerifier,
        tokenEndpoint: meta.token_endpoint,
        clientId,
      }),
    ).toString("base64url");

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set("meta_mcp_oauth", cookiePayload, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   600, // 10 minutes
      path:     "/",
    });
    return response;

  } catch (err) {
    const reason = encodeURIComponent(
      err instanceof Error ? err.message.slice(0, 200) : "unknown",
    );
    console.error("[meta/connect]", err instanceof Error ? err.message : err);
    return NextResponse.redirect(
      new URL(`/dashboard?meta=error&reason=${reason}`, req.url),
    );
  }
}
