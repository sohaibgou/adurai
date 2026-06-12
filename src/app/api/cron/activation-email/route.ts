/**
 * Vercel Cron — daily (see vercel.json)
 *
 * Activation email: users who signed up 24h+ ago and have NOT generated
 * anything (no analysis, no image/copy/UGC, no saved creative) get a single
 * nudge email pointing them at Creative Studio.
 *
 * Dedupe: app_metadata.activation_email_sent is set after a successful send
 * (or when the user turns out to be already activated), so nobody is ever
 * emailed twice. Window is capped at 7 days back so old accounts are left
 * alone if this job is deployed/re-enabled late.
 *
 * Sends via the Resend REST API — requires RESEND_API_KEY and a verified
 * adur.ai domain in Resend (from: contact@adur.ai).
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic    = "force-dynamic";
export const maxDuration = 60;

const FROM     = "Adur <contact@adur.ai>";
const SUBJECT  = "Your first free ad creative is waiting";
const APP_URL  = (process.env.NEXT_PUBLIC_APP_URL ?? "https://adur.ai").replace(/\/+$/, "");

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret required
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function emailHtml(): string {
  const cta = `${APP_URL}/creative-studio`;
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F7F5F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <p style="font-size:20px;font-weight:800;color:#0D0D12;margin:0 0 28px;">Adur.ai</p>
      <div style="background:#FFFFFF;border:1px solid #E8E5E0;border-radius:16px;padding:32px 28px;">
        <h1 style="font-size:22px;font-weight:800;color:#0D0D12;margin:0 0 12px;line-height:1.3;">
          Your first free ad creative is waiting
        </h1>
        <p style="font-size:14px;color:#4B4B55;line-height:1.65;margin:0 0 18px;">
          You created your Adur account but haven't generated anything yet — here's what Creative Studio does in about 30 seconds:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
          <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;">🎨&nbsp;&nbsp;Scroll-stopping <strong>AI ad images</strong> for your product</td></tr>
          <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;">✍️&nbsp;&nbsp;<strong>5 ad copy variants</strong> with hooks that convert</td></tr>
          <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;">🎬&nbsp;&nbsp;<strong>UGC-style AI videos</strong> in your language</td></tr>
        </table>
        <p style="font-size:14px;color:#4B4B55;line-height:1.65;margin:0 0 26px;">
          Your free plan includes 3 image generations and 3 ad copy generations — no credit card needed.
        </p>
        <a href="${cta}"
           style="display:inline-block;background:#FF3CAC;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:100px;">
          Generate Free Creative &rarr;
        </a>
      </div>
      <p style="font-size:11px;color:#A8A5A0;margin:24px 0 0;text-align:center;">
        Adur.ai — AI Meta Ads analysis &amp; creative generation<br/>
        You're receiving this because you created an Adur account.
      </p>
    </div>
  </body>
</html>`;
}

async function hasGeneratedAnything(userId: string): Promise<boolean> {
  const { data: usage } = await supabaseAdmin
    .from("user_usage")
    .select("analysis_count, image_count, copy_count, ugc_count")
    .eq("user_id", userId)
    .maybeSingle();
  if (
    usage &&
    ((usage.analysis_count ?? 0) > 0 ||
      (usage.image_count ?? 0) > 0 ||
      (usage.copy_count ?? 0) > 0 ||
      (usage.ugc_count ?? 0) > 0)
  ) return true;

  // Unlimited tiers don't increment usage counters — check real artifacts too.
  const { count: analyses } = await supabaseAdmin
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((analyses ?? 0) > 0) return true;

  const { count: creatives } = await supabaseAdmin
    .from("creatives")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return (creatives ?? 0) > 0;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const now      = Date.now();
  const minAgeMs = 24 * 60 * 60 * 1000;      // signed up at least 24h ago
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;  // …but not more than 7 days ago

  let sent = 0, skippedActive = 0, errors = 0;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[activation-email] listUsers failed:", error.message);
      return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
    }

    for (const u of data.users) {
      if (!u.email) continue;
      const meta = (u.app_metadata ?? {}) as Record<string, unknown>;
      if (meta.activation_email_sent) continue;

      const age = now - new Date(u.created_at).getTime();
      if (isNaN(age) || age < minAgeMs || age > maxAgeMs) continue;

      try {
        if (await hasGeneratedAnything(u.id)) {
          // Already activated — flag so we never re-check or email them.
          await supabaseAdmin.auth.admin.updateUserById(u.id, {
            app_metadata: { ...meta, activation_email_sent: true },
          });
          skippedActive++;
          continue;
        }

        const res = await fetch("https://api.resend.com/emails", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            from:    FROM,
            to:      [u.email],
            subject: SUBJECT,
            html:    emailHtml(),
          }),
        });
        if (!res.ok) {
          console.error(`[activation-email] Resend ${res.status} for ${u.email}:`, await res.text());
          errors++;
          continue; // no flag — retried on the next run
        }

        await supabaseAdmin.auth.admin.updateUserById(u.id, {
          app_metadata: { ...meta, activation_email_sent: true },
        });
        sent++;
      } catch (e) {
        console.error(`[activation-email] failed for ${u.email}:`, e);
        errors++;
      }
    }

    if (data.users.length < 1000) break;
    page++;
  }

  console.log(`[activation-email] done — sent ${sent}, already active ${skippedActive}, errors ${errors}`);
  return NextResponse.json({ ok: true, sent, skippedActive, errors });
}
