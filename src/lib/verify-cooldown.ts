/**
 * Shared cooldown bookkeeping for verification-email sends.
 *
 * Supabase/GoTrue enforces a per-address frequency limit (default 60s) between
 * verification emails. Our signup flow auto-sends one email the moment the
 * account is created, so if the user clicks "Resend" on the next screen they
 * hit that limit and see a scary "Rate limit reached" error — even though the
 * email is already in their inbox.
 *
 * We record the timestamp of every send (signup auto-send + manual resends) in
 * localStorage so the resend button can pre-arm its cooldown and present a calm
 * "resend available in Xs" instead of letting the user click into a 429.
 */

const KEY = "adur:verifyEmailSentAt";
export const VERIFY_COOLDOWN_SECS = 60;

/** Record that a verification email was just sent (now). */
export function markVerifyEmailSent(): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, Date.now().toString()); } catch { /* ignore */ }
}

/** Seconds still remaining on the per-address cooldown (0 if clear). */
export function verifyCooldownRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const sentAt = Number(localStorage.getItem(KEY) || 0);
    if (!sentAt) return 0;
    const elapsed = Math.floor((Date.now() - sentAt) / 1000);
    return Math.max(0, VERIFY_COOLDOWN_SECS - elapsed);
  } catch {
    return 0;
  }
}

/**
 * GoTrue rate-limit messages embed the wait time, e.g.
 * "For security purposes, you can only request this after 57 seconds."
 * Pull that number out so we can show the exact remaining time.
 */
export function parseRateLimitSeconds(msg: string): number {
  const m = msg.match(/after (\d+) second/i);
  return m ? parseInt(m[1], 10) : VERIFY_COOLDOWN_SECS;
}
