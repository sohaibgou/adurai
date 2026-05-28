/**
 * POST /api/auth/signup
 *
 * Server-side signup. Creates the user pre-confirmed (so password sign-in
 * works immediately) but sets email_link_verified=false in app_metadata so
 * the verify-gate blocks dashboard access until they click the email link.
 * A verification OTP email is sent right after account creation.
 *
 * Email validation (three layers):
 *   1. Obviously-fake LOCAL PART check (test, fake, temp, spam, …)
 *   2. 121k-domain disposable/throwaway blocklist via the npm package
 *   3. DNS MX-record lookup — domain must be able to receive mail
 */
import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const disposableDomains: string[] = require("disposable-email-domains");
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/* ── Additional domain blocklist (gaps in the npm package) ───────────────── */

const EXTRA_BLOCKED_DOMAINS = new Set([
  "test.com", "test.net", "test.org", "test.io",
  "example.com", "example.net", "example.org",
  "fake.com", "fake.net", "fake.org",
  "invalid.com", "invalid.net",
  "placeholder.com",
  "noemail.com", "noemail.net", "no-email.com",
  "domain.com",
]);

/* ── Obviously-fake local-part pattern ───────────────────────────────────── */
// Matches the ENTIRE local part (anchored ^ … $) so it never blocks
// real addresses that merely contain these words (e.g. contest@co.com).

const FAKE_LOCAL_RE = /^(test|tester|testing|testuser|fakeuser|fakeemail|fake|temp|temporary|throwaway|throwam|spam|spammy|trash|trashmail|null|void|invalid|example|demo|noreply|no-reply|donotreply|do-not-reply|anonymous|nobody|noemail|no-email|placeholder|sample|dummy|junk|discard)[\d_-]*$/i;

/* ── Validation ──────────────────────────────────────────────────────────── */

async function validateEmail(email: string): Promise<{ ok: boolean; reason?: string }> {
  const atIndex = email.lastIndexOf("@");
  if (atIndex < 1) return { ok: false, reason: "Invalid email format." };

  const local  = email.slice(0, atIndex).toLowerCase();
  const domain = email.slice(atIndex + 1).toLowerCase();

  // 1. Fake local-part check
  if (FAKE_LOCAL_RE.test(local)) {
    return { ok: false, reason: "Please use a real email address." };
  }

  // 2. Disposable / throwaway domain check (121k+ domains)
  if (disposableDomains.includes(domain) || EXTRA_BLOCKED_DOMAINS.has(domain)) {
    return { ok: false, reason: "Please use a real email address." };
  }

  // 3. MX record check — domain must be able to receive email
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { ok: false, reason: "That email domain cannot receive messages. Please use a real email address." };
    }
  } catch {
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

  // Run the three-layer email check before touching the DB
  const check = await validateEmail(normalizedEmail);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
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

  await sendVerificationEmail(normalizedEmail, origin);

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
