/**
 * POST /api/auth/signup
 *
 * Server-side signup. Creates the user pre-confirmed (so password sign-in
 * works immediately) but sets email_link_verified=false in app_metadata so
 * the verify-gate blocks dashboard access until they click the email link.
 * A verification OTP email is sent right after account creation.
 *
 * Email validation:
 *   1. Blocks known fake / disposable domains via a static blocklist.
 *   2. Verifies the domain has at least one MX record (can actually receive mail).
 */
import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/* ── Disposable / fake domain blocklist ──────────────────────────────────── */

const BLOCKED_DOMAINS = new Set([
  // Generic test / placeholder domains
  "test.com", "test.net", "test.org", "test.io",
  "example.com", "example.net", "example.org",
  "fake.com", "fake.net", "fake.org",
  "noemail.com", "noemail.net", "no-email.com",
  "invalid.com", "invalid.net",
  "placeholder.com",
  "domain.com", "email.com",
  // Disposable / temp-mail services
  "mailinator.com", "mailinator.net",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
  "guerrillamailblock.com", "sharklasers.com", "spam4.me",
  "grr.la", "jourrapide.com", "armyspy.com",
  "tempmail.com", "tempmail.net", "tempmail.org",
  "temp-mail.org", "temp-mail.io", "temp-mail.ru",
  "throwaway.email", "throwam.com", "trashmail.at",
  "trashmail.com", "trashmail.net", "trashmail.me",
  "trashmail.io", "trashmail.org",
  "yopmail.com", "yopmail.fr", "cool.fr.nf",
  "jetable.fr.nf", "nospam.ze.tc", "nomail.xl.cx",
  "mega.zik.dj", "speed.1s.fr", "courriel.fr.nf",
  "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf",
  "fakeinbox.com", "fakeinbox.net",
  "maildrop.cc", "dispostable.com",
  "10minutemail.com", "10minutemail.net", "10minutemail.org",
  "10minutemail.de", "10minutemail.nl", "10minutemail.be",
  "mintemail.com", "tempomail.fr",
  "discard.email", "discardmail.com", "discardmail.de",
  "spam.la", "spamfree24.org", "spamgourmet.com",
  "spamgourmet.net", "spamgrave.com", "spamhole.com",
  "spamify.com", "spamoff.de", "spamthisplease.com",
  "spammotel.com", "spamgourmet.com",
  "mailnull.com", "mailnesia.com", "mailnew.com",
  "getairmail.com", "harakirimail.com",
  "proxymail.eu", "rcpt.at", "wegwerpemail.de",
  "kurzepost.de", "objectmail.com",
  "fakemailgenerator.com",
  "getnada.com", "nada.email",
  "mohmal.com", "33mail.com",
  "emkei.cz", "mt2015.com",
  "inboxbear.com", "tmailinator.com",
  "boun.cr", "bugmenot.com",
]);

/* ── Email domain validation ─────────────────────────────────────────────── */

async function validateEmailDomain(email: string): Promise<{ ok: boolean; reason?: string }> {
  const parts  = email.split("@");
  const domain = parts[1]?.toLowerCase().trim();

  if (!domain || parts.length !== 2) {
    return { ok: false, reason: "Invalid email format." };
  }

  // 1. Block known fake / disposable domains
  if (BLOCKED_DOMAINS.has(domain)) {
    return { ok: false, reason: "Please use a real email address." };
  }

  // 2. Verify the domain has MX records (can actually receive email)
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { ok: false, reason: "That email domain cannot receive messages. Please use a real email address." };
    }
  } catch {
    // DNS lookup failed — domain doesn't exist or has no MX records
    return { ok: false, reason: "That email domain doesn't exist. Please use a real email address." };
  }

  return { ok: true };
}

/* ── Verification email ───────────────────────────────────────────────────── */

async function sendVerificationEmail(email: string, origin: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? origin;

  await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      email,
      create_user: false,
      redirect_to: `${appUrl}/auth/confirm`,
    }),
  }).catch(() => { /* non-critical — user can resend from verify gate */ });
}

/* ── Route handler ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email?: string; password?: string };

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const origin          = req.nextUrl.origin;

  // ── Validate the email domain before touching the DB ──
  const domainCheck = await validateEmailDomain(normalizedEmail);
  if (!domainCheck.ok) {
    return NextResponse.json({ error: domainCheck.reason }, { status: 400 });
  }

  // Create user pre-confirmed (so signInWithPassword works right away) but
  // with email_link_verified=false so the verify gate stays up until they
  // click the verification link we send below.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email:         normalizedEmail,
    password:      password.trim(),
    email_confirm: true,
    app_metadata:  { email_link_verified: false },
  });

  if (error) {
    // User already exists — make sure they are at least Supabase-confirmed
    // so sign-in works, but don't touch email_link_verified (it may be true).
    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered") ||
      error.message.toLowerCase().includes("duplicate")
    ) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = users.find(u => u.email?.toLowerCase() === normalizedEmail);
      if (existing && !existing.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, { email_confirm: true });
      }
      return NextResponse.json({ ok: true, existed: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Send verification email asynchronously (non-blocking)
  await sendVerificationEmail(normalizedEmail, origin);

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
