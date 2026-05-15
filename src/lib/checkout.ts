import { supabase } from "@/lib/supabase";

/**
 * Redirect the user to Stripe checkout.
 *
 * - If `token` is provided (right after signUp, before the cookie is set)
 *   it is sent as an Authorization header.
 * - Otherwise the Supabase session cookie is sent automatically and the
 *   route handler reads the session server-side — no extra header needed.
 *
 * Returns false (instead of throwing) if the user is not authenticated,
 * so callers can decide whether to open the signup modal.
 */
export async function redirectToCheckout(token?: string): Promise<boolean> {
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch("/api/create-checkout", {
    method: "POST",
    headers,
  });

  const data: { url?: string; error?: string; requiresAuth?: boolean } = await res.json();

  if (data.requiresAuth) return false;   // caller should show signup modal

  if (data.url) {
    window.location.href = data.url;
    return true;
  }

  throw new Error(data.error ?? "Checkout failed");
}

/**
 * Check if the current user is logged in, then:
 *   - Logged in  → call Stripe checkout directly (no modal)
 *   - Logged out → return false so the caller opens the signup modal
 */
export async function handleGetStarted(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Already authenticated — go straight to Stripe (cookie sent automatically)
    return redirectToCheckout();
  }

  // Not logged in — caller should show the signup modal
  return false;
}
