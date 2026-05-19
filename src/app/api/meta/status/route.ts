import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("meta_connections")
    .select("meta_ad_account_id, meta_ad_account_name, meta_user_id, connected_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected:          true,
    adAccountId:        data.meta_ad_account_id,
    adAccountName:      data.meta_ad_account_name,
    metaUserId:         data.meta_user_id,
    connectedAt:        data.connected_at,
  });
}
