/**
 * Signed unsubscribe links for marketing/activation emails.
 *
 * The link carries the user id + an HMAC so nobody can unsubscribe other
 * users by guessing ids. Keyed off the service-role key — always present
 * server-side, never exposed to the client.
 */
import { createHmac, timingSafeEqual } from "crypto";

export function unsubscribeSig(userId: string): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", key).update(userId).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeSig(userId: string, sig: string): boolean {
  const expected = unsubscribeSig(userId);
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function unsubscribeUrl(appUrl: string, userId: string): string {
  return `${appUrl}/api/email/unsubscribe?uid=${userId}&sig=${unsubscribeSig(userId)}`;
}
