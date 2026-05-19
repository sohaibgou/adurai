import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conn } = await supabaseAdmin
    .from("meta_connections")
    .select("access_token, ad_account_id, ad_account_name, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn || conn.status !== "active") {
    return NextResponse.json({ error: "Not connected" }, { status: 404 });
  }

  const url = new URL(`${GRAPH}/act_${conn.ad_account_id}/campaigns`);
  url.searchParams.set("access_token", conn.access_token);
  url.searchParams.set("fields", [
    "id", "name", "status", "effective_status", "objective",
    "daily_budget", "lifetime_budget", "start_time", "stop_time", "created_time",
    "insights.date_preset(last_30d){impressions,clicks,spend,ctr,cpm,cpc,reach,date_start,date_stop}",
  ].join(","));
  url.searchParams.set("limit", "50");

  const res  = await fetch(url.toString());
  const data = await res.json() as {
    data?:  Array<Record<string, unknown>>;
    error?: { message: string };
  };

  if (!res.ok || data.error) {
    return NextResponse.json({ error: data.error?.message ?? "Graph API error" }, { status: 500 });
  }

  const campaigns = (data.data ?? []).map((c) => {
    const insights = (c.insights as { data?: Record<string, unknown>[] } | undefined)?.data?.[0];
    return { ...c, insights };
  });

  return NextResponse.json({
    adAccountId:   conn.ad_account_id,
    adAccountName: conn.ad_account_name,
    campaigns,
    total:         campaigns.length,
  });
}
