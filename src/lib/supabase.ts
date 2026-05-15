import { createBrowserClient } from "@supabase/ssr";

// Uses cookie storage so the session is readable server-side in route handlers
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
