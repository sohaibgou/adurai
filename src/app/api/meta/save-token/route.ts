/**
 * POST /api/meta/save-token  (legacy / admin fallback)
 *
 * Saves a Meta MCP OAuth token directly, without going through the
 * full OAuth redirect flow.  Useful for testing or for power users
 * who have obtained their token through another means.
 *
 * No direct Graph API calls — token validation happens lazily
 * when Claude first uses it with the Meta MCP server.
 *
 * Body: { access_token, ad_account_id, ad_account_name? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { supabaseAdmin }             from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { access_token, ad_account_id, ad_account_name } = await req.json() as {
    access_token?:   string;
    ad_account_id?:  string;
    ad_account_name?: string;
  };

  if (!access_token?.trim()) {
    return NextResponse.json({ error: "access_token is required" }, { status: 400 });
  }
  if (!ad_account_id?.trim()) {
    return NextResponse.json({ error: "ad_account_id is required" }, { status: 400 });
  }

  const accountId   = ad_account_id.trim().replace(/^act_/, "");
  const accountName = ad_account_name?.trim() || `act_${accountId}`;

  const { error: dbError } = await supabaseAdmin
    .from("meta_connections")
    .upsert(
      {
        user_id:         user.id,
        meta_user_id:    "",
        access_token:    access_token.trim(),
        ad_account_id:   accountId,
        ad_account_name: accountName,
        status:          "active",
        connected_at:    new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (dbError) {
    console.error("[save-token] DB error:", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, accountName, accountId });
}
