/**
 * POST /api/meta/save-token
 *
 * Saves a manually pasted Meta access token + ad account ID.
 * Validates the token against Meta's Graph API before saving.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { supabaseAdmin }             from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function POST(req: NextRequest) {
  // Auth
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { access_token, ad_account_id } = await req.json() as {
    access_token:  string;
    ad_account_id: string;
  };

  if (!access_token?.trim()) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 });
  }
  if (!ad_account_id?.trim()) {
    return NextResponse.json({ error: "Ad Account ID is required" }, { status: 400 });
  }

  // Strip leading "act_" if user pasted the full form
  const accountId = ad_account_id.trim().replace(/^act_/, "");

  try {
    // 1. Validate token + get Meta user ID
    const meRes  = await fetch(`${GRAPH}/me?fields=id,name&access_token=${access_token.trim()}`);
    const meData = await meRes.json() as { id?: string; name?: string; error?: { message: string } };

    if (!meRes.ok || meData.error || !meData.id) {
      return NextResponse.json(
        { error: meData.error?.message ?? "Invalid access token — please check and try again" },
        { status: 400 },
      );
    }

    // 2. Validate ad account + get name
    const acctRes  = await fetch(
      `${GRAPH}/act_${accountId}?fields=name,account_status,currency&access_token=${access_token.trim()}`
    );
    const acctData = await acctRes.json() as {
      name?: string;
      account_status?: number;
      error?: { message: string };
    };

    if (!acctRes.ok || acctData.error) {
      return NextResponse.json(
        { error: acctData.error?.message ?? "Could not access that Ad Account ID — verify it is correct" },
        { status: 400 },
      );
    }

    const accountName = acctData.name ?? `act_${accountId}`;

    // 3. Save to Supabase
    const { error: dbError } = await supabaseAdmin
      .from("meta_connections")
      .upsert(
        {
          user_id:         user.id,
          meta_user_id:    meData.id,
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

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[save-token]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
