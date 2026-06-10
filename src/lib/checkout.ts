import { supabase } from "@/lib/supabase";

export type CheckoutPlan = "starter" | "growth" | "pro";
export type BillingInterval = "monthly" | "annual";

/**
 * Redirect the user to Stripe Checkout for the given plan + billing interval.
 *
 * - `token`    — pass the access token right after signUp (before cookie is set)
 * - `plan`     — "starter" (default), "growth", or "pro" (Autopilot)
 * - `interval` — "monthly" (default) or "annual"
 */
export async function redirectToCheckout(
  token?: string,
  plan: CheckoutPlan = "starter",
  interval: BillingInterval = "monthly"
): Promise<boolean> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch("/api/create-checkout", {
      method:      "POST",
      credentials: "include",
      headers,
      body:        JSON.stringify({ plan, interval }),
    });
  } catch {
    throw new Error("Network error — please check your connection and try again.");
  }

  let data: { url?: string; error?: string; requiresAuth?: boolean; updated?: boolean; plan?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}) — please try again.`);
  }

  if (data.requiresAuth) return false;

  // Existing subscription was changed in place (prorated) — no Stripe checkout
  // page involved. Land on the dashboard, which reads the fresh plan from DB.
  if (data.updated) {
    window.location.href = "/dashboard?plan_updated=1";
    return true;
  }

  if (data.url) {
    window.location.href = data.url;
    return true;
  }

  throw new Error(data.error ?? "Checkout failed — please try again.");
}

/**
 * Check if the current user is logged in, then:
 *   - Logged in  → redirect to Stripe checkout
 *   - Logged out → return false so the caller shows the signup modal
 */
export async function handleGetStarted(
  plan: CheckoutPlan = "starter",
  interval: BillingInterval = "monthly"
): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return redirectToCheckout(undefined, plan, interval);
  }

  return false;
}
