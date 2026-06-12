/**
 * Vercel Cron — daily at 10:00 UTC (see vercel.json)
 *
 * Activation email SEQUENCE for users who signed up but haven't activated.
 * Mirrors marketing/email-templates.md:
 *
 *   step 1 · day 1+  · zero generations              · "Your first free ad creative is waiting"
 *   step 2 · day 3+  · zero generations              · "This is what a $0 video shoot looks like"
 *   step 3 · day 5+  · made image/copy, no video,
 *                       still on the free plan       · "You made the ad. Now make it move."
 *   step 4 · day 7+  · zero generations              · "30 seconds. One link. Three free ads."
 *   step 5 · day 10+ · analyzed, never created       · "Your analysis told you what to fix..."
 *   step 6 · day 14+ · zero generations              · "Quick question before I stop emailing you"
 *
 * Rules enforced here:
 *  - At most ONE email per user per run; the HIGHEST step they qualify for is
 *    sent and recorded, so late deploys never blast the whole backlog.
 *  - app_metadata.activation_step is monotonic — a step is never re-sent.
 *    (Legacy activation_email_sent === true counts as step 1.)
 *  - Paying users are marked terminal and never emailed by this sequence.
 *  - app_metadata.email_optout (set by /api/email/unsubscribe) is respected.
 *  - Only accounts 1–21 days old are considered.
 *
 * Sends via the Resend REST API — requires RESEND_API_KEY and a verified
 * adur.ai domain in Resend (from: contact@adur.ai).
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { unsubscribeUrl } from "@/lib/email-unsubscribe";

export const dynamic    = "force-dynamic";
export const maxDuration = 60;

const FROM    = "Adur <contact@adur.ai>";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://adur.ai").replace(/\/+$/, "");
const STUDIO  = `${APP_URL}/creative-studio`;

const TERMINAL_STEP  = 99;  // paid / opted-out / sequence finished
const MAX_AGE_DAYS   = 21;  // older accounts never enter the sequence
const MAX_SENDS_PER_RUN = 100;

const DAY = 24 * 60 * 60 * 1000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret required
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/* ── Shared HTML skeleton (matches marketing/emails/*.html) ───────────────── */

function shell(inner: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F7F5F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <p style="font-size:20px;font-weight:800;color:#0D0D12;margin:0 0 28px;">Adur.ai</p>
      <div style="background:#FFFFFF;border:1px solid #E8E5E0;border-radius:16px;padding:32px 28px;">
        ${inner}
      </div>
      <p style="font-size:11px;color:#A8A5A0;margin:24px 0 0;text-align:center;">
        Adur.ai — AI ad creative &amp; Meta Ads analysis<br/>
        You're receiving this because you created an Adur account.
        <a href="${unsubUrl}" style="color:#A8A5A0;">Unsubscribe</a>
      </p>
    </div>
  </body>
</html>`;
}

const P  = `font-size:14px;color:#4B4B55;line-height:1.65;margin:0 0 18px;`;
const H1 = `font-size:22px;font-weight:800;color:#0D0D12;margin:0 0 12px;line-height:1.3;`;
const CTA = `display:inline-block;background:#FF3CAC;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:100px;`;

/* ── Per-step content ─────────────────────────────────────────────────────── */

interface UsageProfile {
  paid:     boolean;
  analyzed: boolean;
  image:    boolean;
  copy:     boolean;
  video:    boolean;
}
const anyCreative = (p: UsageProfile) => p.image || p.copy || p.video;
const inactive    = (p: UsageProfile) => !p.analyzed && !anyCreative(p);

interface Step {
  step:    number;
  minDays: number;
  applies: (p: UsageProfile) => boolean;
  subject: string;
  body:    string; // inner HTML (without shell)
}

const STEPS: Step[] = [
  {
    step: 1, minDays: 1, applies: inactive,
    subject: "Your first free ad creative is waiting",
    body: `
      <h1 style="${H1}">Your first free ad creative is waiting</h1>
      <p style="${P}">You created your Adur account but haven't generated anything yet — here's what Creative Studio does in about 30 seconds:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
        <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;">🎨&nbsp;&nbsp;Scroll-stopping <strong>AI image ads</strong> for your product</td></tr>
        <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;">✍️&nbsp;&nbsp;<strong>5 ad copy variants</strong> with hooks that convert</td></tr>
        <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;">🎬&nbsp;&nbsp;<strong>UGC-style AI videos</strong> in your language</td></tr>
      </table>
      <p style="${P}margin-bottom:26px;">Your free plan includes 3 image ads and 3 ad copy generations — no credit card needed.</p>
      <a href="${STUDIO}" style="${CTA}">Generate Free Creative &rarr;</a>`,
  },
  {
    step: 2, minDays: 3, applies: inactive,
    subject: "This is what a $0 video shoot looks like",
    body: `
      <h1 style="${H1}">This is what a $0 video shoot looks like</h1>
      <p style="${P}">The most expensive part of running Meta ads in 2026 isn't the ad spend. It's the creative: finding creators, shipping products, waiting two weeks for one usable video.</p>
      <p style="${P}">Adur generates <strong>UGC-style video ads</strong> from nothing but your product link. A realistic AI creator presents your product, speaks your script (English, Spanish, French, Arabic — even Darija), and it's ready in about a minute.</p>
      <p style="${P}margin-bottom:26px;">Your free account already includes <strong>3 image ads and 3 ad copy generations</strong> — try those today. When you're ready for video, Starter is $19/mo.</p>
      <a href="${STUDIO}" style="${CTA}">See it in action &rarr;</a>`,
  },
  {
    step: 3, minDays: 5,
    applies: (p) => !p.paid && (p.image || p.copy) && !p.video,
    subject: "You made the ad. Now make it move.",
    body: `
      <h1 style="${H1}">You made the ad. Now make it move.</h1>
      <p style="${P}">You've already generated ad creatives in Adur — nice. Here's the uncomfortable truth from $70M+ in managed ad spend:</p>
      <p style="${P}"><strong>Video outperforms static on Meta in almost every e-commerce vertical.</strong> UGC-style video especially — it doesn't look like an ad, so people actually watch it.</p>
      <p style="${P}">The <strong>Video Ads</strong> tab takes the same product link you already used and turns it into a UGC video: AI creator, native script, your choice of language and format (Feed, Story, Reel).</p>
      <div style="background:#F7F5F2;border-radius:12px;padding:16px 18px;margin:0 0 22px;">
        <p style="font-size:13px;font-weight:700;color:#0D0D12;margin:0 0 8px;">Starter — $19/mo</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:13px;color:#0D0D12;padding:3px 0;">🎬&nbsp;&nbsp;3 UGC video ads every month</td></tr>
          <tr><td style="font-size:13px;color:#0D0D12;padding:3px 0;">🎨&nbsp;&nbsp;5 image ads + unlimited ad copy</td></tr>
          <tr><td style="font-size:13px;color:#0D0D12;padding:3px 0;">📊&nbsp;&nbsp;10 campaign analyses + full 7-Day Battle Plan</td></tr>
        </table>
      </div>
      <a href="${STUDIO}" style="${CTA}">Make your first video ad &rarr;</a>`,
  },
  {
    step: 4, minDays: 7, applies: inactive,
    subject: "30 seconds. One link. Three free ads.",
    body: `
      <h1 style="${H1}">30 seconds. One link. Three free ads.</h1>
      <p style="${P}">Most tools die in the setup. So we removed it.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
        <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;"><strong>1.</strong>&nbsp;&nbsp;Paste your product URL</td></tr>
        <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;"><strong>2.</strong>&nbsp;&nbsp;Press <strong>Generate</strong></td></tr>
        <tr><td style="font-size:14px;color:#0D0D12;padding:5px 0;"><strong>3.</strong>&nbsp;&nbsp;Download your ad</td></tr>
      </table>
      <p style="${P}margin-bottom:26px;">That's the entire workflow. No brief, no brand kit, no onboarding call. Your free plan includes <strong>3 image ads and 3 ad copy generations</strong> — they're sitting there unused.</p>
      <a href="${STUDIO}" style="${CTA}">Generate your first ad now &rarr;</a>`,
  },
  {
    step: 5, minDays: 10,
    applies: (p) => p.analyzed && !anyCreative(p),
    subject: "Your analysis told you what to fix. This builds the fix.",
    body: `
      <h1 style="${H1}">Your analysis told you what to fix. This builds the fix.</h1>
      <p style="${P}">You ran a campaign analysis on Adur — so you've seen the verdict most accounts get: <strong>creative fatigue</strong>. Same ads, falling CTR, rising CPA.</p>
      <p style="${P}">The fix isn't a bigger budget. It's fresh creative, shipped fast.</p>
      <p style="${P}margin-bottom:26px;">That's exactly what <strong>Creative Studio</strong> is for: image ads, ad copy variants and UGC video ads generated from your product link — so the campaigns your analysis flagged get new creative this week, not next month.</p>
      <a href="${STUDIO}" style="${CTA}">Generate fresh creative &rarr;</a>`,
  },
  {
    step: 6, minDays: 14, applies: inactive,
    subject: "Quick question before I stop emailing you",
    body: `
      <p style="${P}">Hey, Sohaib here — I build Adur.</p>
      <p style="${P}">You signed up two weeks ago but never generated anything, and I'd rather learn from that than pretend it didn't happen. One question:</p>
      <p style="font-size:16px;font-weight:700;color:#0D0D12;line-height:1.5;margin:0 0 18px;">What were you hoping Adur would do for you?</p>
      <p style="${P}margin-bottom:22px;">Hit reply and tell me — I read every answer myself. And if you just got busy, your <strong>3 free image ads and 3 free copy generations</strong> are still waiting:</p>
      <a href="${STUDIO}" style="${CTA}">Open Creative Studio &rarr;</a>
      <p style="font-size:13px;color:#A8A5A0;line-height:1.6;margin:22px 0 0;">Either way, this is the last email in this series. No hard feelings.</p>`,
  },
];

/* ── Usage profile ────────────────────────────────────────────────────────── */

async function getProfile(userId: string): Promise<UsageProfile> {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  // Raw counters (no month gate) — accounts here are ≤21 days old, so any
  // non-zero count means "has generated at some point".
  const { data: usage } = await supabaseAdmin
    .from("user_usage")
    .select("analysis_count, image_count, copy_count, ugc_count")
    .eq("user_id", userId)
    .maybeSingle();

  const { count: analysesRows } = await supabaseAdmin
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { count: videoRows } = await supabaseAdmin
    .from("creatives")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("media_type", "video");

  const { count: creativeRows } = await supabaseAdmin
    .from("creatives")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    paid:     !!sub,
    analyzed: (usage?.analysis_count ?? 0) > 0 || (analysesRows ?? 0) > 0,
    image:    (usage?.image_count ?? 0) > 0 || ((creativeRows ?? 0) - (videoRows ?? 0)) > 0,
    copy:     (usage?.copy_count ?? 0) > 0,
    video:    (usage?.ugc_count ?? 0) > 0 || (videoRows ?? 0) > 0,
  };
}

/* ── Cron handler ─────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const now = Date.now();
  let sent = 0, terminal = 0, skipped = 0, errors = 0;
  let page = 1;

  outer:
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[activation-email] listUsers failed:", error.message);
      return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
    }

    for (const u of data.users) {
      if (sent >= MAX_SENDS_PER_RUN) break outer;
      if (!u.email) continue;

      const meta = (u.app_metadata ?? {}) as Record<string, unknown>;
      if (meta.email_optout) continue;

      // Legacy boolean from v1 of this cron counts as step 1.
      const currentStep =
        typeof meta.activation_step === "number" ? meta.activation_step
        : meta.activation_email_sent ? 1
        : 0;
      if (currentStep >= TERMINAL_STEP || currentStep >= 6) continue;

      const ageDays = (now - new Date(u.created_at).getTime()) / DAY;
      if (isNaN(ageDays) || ageDays < 1 || ageDays > MAX_AGE_DAYS) continue;

      try {
        const profile = await getProfile(u.id);

        // Paying users exit the sequence permanently.
        if (profile.paid) {
          await supabaseAdmin.auth.admin.updateUserById(u.id, {
            app_metadata: { ...meta, activation_step: TERMINAL_STEP },
          });
          terminal++;
          continue;
        }

        // Highest step they qualify for — exactly one send per user per run.
        const target = [...STEPS].reverse().find(
          (s) => s.step > currentStep && ageDays >= s.minDays && s.applies(profile)
        );
        if (!target) { skipped++; continue; }

        const res = await fetch("https://api.resend.com/emails", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            from:    FROM,
            to:      [u.email],
            subject: target.subject,
            html:    shell(target.body, unsubscribeUrl(APP_URL, u.id)),
          }),
        });
        if (!res.ok) {
          console.error(`[activation-email] Resend ${res.status} for ${u.email}:`, await res.text());
          errors++;
          continue; // step not recorded — retried tomorrow
        }

        await supabaseAdmin.auth.admin.updateUserById(u.id, {
          app_metadata: { ...meta, activation_step: target.step, activation_email_sent: true },
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

  console.log(`[activation-email] done — sent ${sent}, terminal ${terminal}, skipped ${skipped}, errors ${errors}`);
  return NextResponse.json({ ok: true, sent, terminal, skipped, errors });
}
