import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { AnalysisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

// ── Build the Claude prompt ─────────────────────────────────────────────────
function buildPrompt(params: {
  aov:           number;
  cogs:          number;
  breakEvenRoas: number;
  targetCpa:     number;
  market:        string;
  goal:          string;
}): string {
  return `You are an expert media buyer with 15+ years managing profitable Meta Ads campaigns.

Using your Meta Ads MCP tools, perform a complete account audit:
1. Pull ALL campaigns for the connected ad account
2. Get last 30 days performance: spend, results, CPA, CTR, ROAS, impressions, clicks
3. Identify profit leaks — campaigns spending above target CPA or below break-even ROAS
4. Identify winners — campaigns with strong ROAS to scale immediately
5. Generate a 7-Day Battle Plan with specific daily actions
6. Calculate total wasted spend in dollars

Business context:
- Average Order Value (AOV): $${params.aov}
- Cost of Goods Sold (COGS): $${params.cogs}
- Break-even ROAS: ${params.breakEvenRoas}x
- Target CPA: $${params.targetCpa}
- Market / Product category: ${params.market}
- Primary goal: ${params.goal}

Return your analysis as a SINGLE valid JSON object with EXACTLY this structure (no extra keys, no markdown):
{
  "summaries": [
    {
      "campaignName": "string",
      "objective": "CONVERSIONS" | "TRAFFIC" | "LEADS" | "ENGAGEMENT" | "UNKNOWN",
      "spend": number,
      "impressions": number,
      "clicks": number,
      "ctr": number,
      "cpc": number,
      "conversions": number,
      "purchases": number,
      "revenue": number,
      "roas": number,
      "costPerResult": number
    }
  ],
  "summary": "2-3 sentence executive summary of the account health",
  "score": number (0-100, overall account health score),
  "winners": ["campaign name — reason it's a winner"],
  "killers": ["campaign name — reason it's a budget killer"],
  "recommendations": ["actionable recommendation 1", "..."],
  "battlePlan": [
    { "day": 1, "title": "short title", "action": "specific action", "effort": "Quick Win" | "Strategic" | "Monitor" }
  ],
  "insights": ["key insight 1", "key insight 2"],
  "totalSpend": number,
  "totalRevenue": number,
  "convResults": number,
  "convAvgCPR": number,
  "convBestRoas": number,
  "analysisMode": "roas" | "traffic"
}`;
}

// ── Parse Claude's response to extract the JSON block ───────────────────────
function parseAnalysis(text: string): AnalysisResult {
  // Try to find a JSON block (with or without markdown code fences)
  const jsonMatch =
    text.match(/```json\s*([\s\S]+?)\s*```/) ??
    text.match(/```\s*([\s\S]+?)\s*```/) ??
    text.match(/(\{[\s\S]+\})/);

  const raw = jsonMatch?.[1] ?? text;

  try {
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    throw new Error("Claude returned non-JSON response: " + raw.slice(0, 200));
  }
}

// ── POST /api/meta/analyze-live ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load user's Meta token
  const { data: conn } = await supabaseAdmin
    .from("meta_connections")
    .select("access_token, ad_account_id, ad_account_name, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn || conn.status !== "active") {
    return NextResponse.json({ error: "Meta account not connected" }, { status: 400 });
  }

  // Parse business context from request body
  const body = await req.json() as {
    aov?:           number;
    cogs?:          number;
    breakEvenRoas?: number;
    targetCpa?:     number;
    market?:        string;
    goal?:          string;
  };

  const params = {
    aov:           body.aov           ?? 100,
    cogs:          body.cogs          ?? 30,
    breakEvenRoas: body.breakEvenRoas ?? 2,
    targetCpa:     body.targetCpa     ?? 50,
    market:        body.market        ?? "General",
    goal:          body.goal          ?? "Scale profitable campaigns",
  };

  try {
    // ── Call Claude with Meta MCP ────────────────────────────────────────
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-api-key":       process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "anthropic-beta":  "mcp-client-2025-04-04",
      },
      body: JSON.stringify({
        model:      "claude-opus-4-5",
        max_tokens: 8000,
        mcp_servers: [
          {
            type:                "url",
            url:                 "https://mcp.meta.com/ads",
            name:                "meta-ads",
            authorization_token: conn.access_token,
          },
        ],
        messages: [
          {
            role:    "user",
            content: buildPrompt(params),
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error("[analyze-live] Claude error:", err);
      throw new Error(`Claude API error ${claudeRes.status}: ${err.slice(0, 200)}`);
    }

    const claudeData = await claudeRes.json() as {
      content?: Array<{ type: string; text?: string }>;
      error?:   { message: string };
    };

    if (claudeData.error) throw new Error(claudeData.error.message);

    // Extract text from final assistant message
    const textBlocks = (claudeData.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "");
    const fullText = textBlocks.join("\n");

    const analysis = parseAnalysis(fullText);

    // Update last_synced_at
    await supabaseAdmin
      .from("meta_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return NextResponse.json({ analysis, adAccountName: conn.ad_account_name });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[analyze-live] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
