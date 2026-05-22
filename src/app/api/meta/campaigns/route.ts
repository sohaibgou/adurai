/**
 * GET /api/meta/campaigns
 *
 * Returns the campaign list for the connected Meta ad account.
 * All data retrieval goes through Claude + Meta MCP —
 * no direct Graph API calls.
 */
import { NextRequest, NextResponse }        from "next/server";
import { createServerClient }               from "@supabase/ssr";
import { cookies }                          from "next/headers";
import { supabaseAdmin }                    from "@/lib/supabase-server";
import { invokeClaudeWithMeta, parseClaudeJSON } from "@/lib/claude-meta";

export const dynamic = "force-dynamic";

interface CampaignListResult {
  campaigns: Array<{
    id:               string;
    name:             string;
    status:           string;
    effective_status: string;
    objective?:       string;
  }>;
  total: number;
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
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

  try {
    // Claude calls Meta MCP to list campaigns — no direct Graph API
    const text   = await invokeClaudeWithMeta({
      accessToken: conn.access_token,
      adAccountId: conn.ad_account_id,
      action:      "list_campaigns",
    });
    const result = parseClaudeJSON<CampaignListResult>(text);

    return NextResponse.json({
      adAccountId:   conn.ad_account_id,
      adAccountName: conn.ad_account_name,
      campaigns:     result.campaigns ?? [],
      total:         result.total ?? result.campaigns?.length ?? 0,
    });
  } catch (err) {
    console.error("[campaigns]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
