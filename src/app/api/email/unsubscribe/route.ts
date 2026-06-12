/**
 * GET /api/email/unsubscribe?uid=<user_id>&sig=<hmac>
 *
 * One-click unsubscribe target for the activation email sequence.
 * Sets app_metadata.email_optout = true; the cron skips opted-out users.
 * The HMAC signature prevents unsubscribing arbitrary users by guessing ids.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyUnsubscribeSig } from "@/lib/email-unsubscribe";

export const dynamic = "force-dynamic";

function page(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Adur.ai</title></head>
<body style="margin:0;background:#F7F5F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="background:#fff;border:1px solid #E8E5E0;border-radius:16px;padding:40px 36px;max-width:380px;text-align:center;">
    <p style="font-size:18px;font-weight:800;color:#0D0D12;margin:0 0 10px;">${title}</p>
    <p style="font-size:14px;color:#6B6B72;line-height:1.6;margin:0;">${body}</p>
  </div>
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";

  if (!uid || !sig || !verifyUnsubscribeSig(uid, sig)) {
    return page("Invalid link", "This unsubscribe link is invalid or expired.");
  }

  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (!data?.user) {
      return page("Invalid link", "This unsubscribe link is invalid or expired.");
    }
    const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
    await supabaseAdmin.auth.admin.updateUserById(uid, {
      app_metadata: { ...meta, email_optout: true },
    });
    return page(
      "You're unsubscribed",
      "You won't receive any more marketing emails from Adur. Account and billing emails still apply.",
    );
  } catch (e) {
    console.error("[unsubscribe] failed:", e);
    return page("Something went wrong", "Please try the link again in a minute.");
  }
}
