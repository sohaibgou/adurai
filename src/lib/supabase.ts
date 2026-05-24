import { createBrowserClient } from "@supabase/ssr";

// Uses cookie storage so the session is readable server-side in route handlers.
// flowType: 'implicit' avoids PKCE for OTP/magic-link flows — the code_verifier
// is stored in the browser that *initiated* the request, which may differ from
// the browser that opens the email link. Implicit flow returns the session in
// the URL hash instead, which works across browsers.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: "implicit" } }
);
