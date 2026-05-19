import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

// ── Types ───────────────────────────────────────────────────────────────────
interface Campaign {
  id:              string;
  name:            string;
  status:          string;
  effective_status: string;
  objective:       string;
  daily_budget?:   string;
  lifetime_budget?: string;
  spend_cap?:      string;
  start_time?:     string;
  stop_time?:      string;
  created_time:    string;
  updated_time:    string;
}

interface Insights {
  impressions:  string;
  clicks:       string;
  spend:        string;
  ctr:          string;
  cpm:          string;
  cpc:          string;
  reach:        string;
  date_start:   string;
  date_stop:    string;
}

interface CampaignWithInsights extends Campaign {
  insights?: Insights;
}

// ── Fetch campaigns for an ad account ───────────────────────────────────────
async function fetchCampaigns(
  adAccountId: string,
  token: string
): Promise<CampaignWithInsights[]> {
  const url = new URL(`${GRAPH}/act_${adAccountId}/campaigns`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("fields", [
    "id",
    "name",
    "status",
    "effective_status",
    "objective",
    "daily_budget",
    "lifetime_budget",
    "spend_cap",
    "start_time",
    "stop_time",
    "created_time",
    "updated_time",
    // Inline insights for last 30 days
    "insights.date_preset(last_30d){impressions,clicks,spend,ctr,cpm,cpc,reach,date_start,date_stop}",
  ].join(","));
  url.searchParams.set("limit",  "50");
  url.searchParams.set("filtering", JSON.stringify([
    { field: "effective_status", operator: "IN", value: ["ACTIVE","PAUSED","ARCHIVED"] }
  ]));

  const res  = await fetch(url.toString());
  const data = await res.json() as {
    data?:  Array<Campaign & { insights?: { data: Insights[] } }>;
    error?: { message: string; code: number };
  };

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to fetch campaigns");
  }

  // Flatten inline insights → single object
  return (data.data ?? []).map((c) => ({
    ...c,
    insights: c.insights?.data?.[0],
  }));
}

// ── GET /api/meta/campaigns ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load stored token + ad account
  const { data: conn, error: connErr } = await supabaseAdmin
    .from("meta_connections")
    .select("meta_access_token, meta_ad_account_id, meta_ad_account_name, token_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (connErr || !conn) {
    return NextResponse.json({ error: "Not connected" }, { status: 404 });
  }

  // Warn if token is near expiry
  const expired = conn.token_expires_at
    ? new Date(conn.token_expires_at) < new Date()
    : false;
  if (expired) {
    return NextResponse.json({ error: "Token expired — please reconnect Meta." }, { status: 401 });
  }

  try {
    const campaigns = await fetchCampaigns(
      conn.meta_ad_account_id,
      conn.meta_access_token
    );

    return NextResponse.json({
      adAccountId:   conn.meta_ad_account_id,
      adAccountName: conn.meta_ad_account_name,
      campaigns,
      total:         campaigns.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[meta/campaigns]", msg);

    // Surface token errors cleanly
    if (msg.includes("OAuthException") || msg.includes("Invalid OAuth")) {
      return NextResponse.json({ error: "Token invalid — please reconnect Meta." }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
