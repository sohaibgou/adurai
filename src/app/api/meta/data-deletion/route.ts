/**
 * POST /api/meta/data-deletion
 *
 * Meta Data Deletion Callback (required by Meta's platform policy).
 * Meta calls this endpoint when a user requests deletion of their
 * Facebook data from all connected apps.
 *
 * Meta sends a signed_request (form-encoded, not JSON):
 *   signed_request = <base64url_sig>.<base64url_payload>
 *
 * The payload contains: { user_id, algorithm, issued_at }
 * where user_id is the Facebook/Meta user ID stored in meta_connections.
 *
 * Register this URL in:
 *   developers.facebook.com → App → Settings → Basic
 *   → Data Deletion Instructions URL:
 *     https://adur.ai/api/meta/data-deletion
 *
 * Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// ── Signature verification ────────────────────────────────────────────────────

function parseSignedRequest(signedRequest: string, appSecret: string): { user_id: string } | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;

  const [encodedSig, encodedPayload] = parts;

  // Verify HMAC-SHA256 signature
  const expectedSig = createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  if (encodedSig !== expectedSig) return null;

  // Decode payload
  try {
    const json = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(json) as { user_id?: string; algorithm?: string };
    if (!payload.user_id) return null;
    return { user_id: payload.user_id };
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;

  // ── Parse body ──────────────────────────────────────────────────────────
  // Meta sends application/x-www-form-urlencoded with a signed_request field
  const contentType = req.headers.get("content-type") ?? "";
  let signedRequest: string | null = null;
  let metaUserId:    string | null = null;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text   = await req.text();
    const params = new URLSearchParams(text);
    signedRequest = params.get("signed_request");
  } else {
    // Fallback: accept plain JSON { user_id } for testing
    try {
      const body = await req.json() as { user_id?: string; signed_request?: string };
      signedRequest = body.signed_request ?? null;
      metaUserId    = body.user_id        ?? null;
    } catch { /* ignore */ }
  }

  // ── Verify signature when app secret is configured ──────────────────────
  if (appSecret && signedRequest) {
    const parsed = parseSignedRequest(signedRequest, appSecret);
    if (!parsed) {
      console.warn("[data-deletion] Invalid signed_request signature");
      return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
    }
    metaUserId = parsed.user_id;
  } else if (!metaUserId) {
    console.warn("[data-deletion] Missing signed_request or user_id");
    return NextResponse.json({ error: "signed_request or user_id required" }, { status: 400 });
  }

  const confirmationCode = `adur_${metaUserId}_${Date.now()}`;

  console.log(`[data-deletion] Deleting data for meta_user_id=${metaUserId} code=${confirmationCode}`);

  // ── Delete all data tied to this Meta user ID ────────────────────────────
  try {
    // 1. Find the Adur user ID from the Meta connection
    const { data: conn } = await supabaseAdmin
      .from("meta_connections")
      .select("user_id")
      .eq("meta_user_id", metaUserId)
      .maybeSingle();

    const adurUserId = conn?.user_id;

    // 2. Delete Meta connection (token, account data)
    await supabaseAdmin
      .from("meta_connections")
      .delete()
      .eq("meta_user_id", metaUserId);

    // 3. Delete all auto_actions for this user
    if (adurUserId) {
      await supabaseAdmin
        .from("auto_actions")
        .delete()
        .eq("user_id", adurUserId);
    }

    // Note: we retain the Adur account + subscription for billing/legal purposes.
    // The user can request full account deletion separately via privacy@adur.ai.

    console.log(`[data-deletion] ✓ meta_user_id=${metaUserId} adur_user_id=${adurUserId ?? "not found"}`);

  } catch (err) {
    // Log the error but still return a 200 with confirmation code so Meta
    // doesn't retry indefinitely. The code can be used to verify the request.
    console.error("[data-deletion] DB error:", err instanceof Error ? err.message : err);
  }

  // ── Meta requires this exact response shape ──────────────────────────────
  return NextResponse.json({
    url:               "https://adur.ai/privacy#data-deletion",
    confirmation_code: confirmationCode,
  });
}
