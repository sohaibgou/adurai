/**
 * Claude-as-Meta-Agent
 *
 * ALL Meta Ads operations go through Claude + Meta MCP.
 * No direct Graph API calls anywhere else in the codebase.
 *
 * Usage:
 *   const text = await invokeClaudeWithMeta({ accessToken, adAccountId, action: "analyze", ... })
 *   const result = parseClaudeJSON<AnalysisResult>(text)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClaudeMetaAction =
  | "analyze"
  | "list_campaigns"
  | "monitor_and_optimize"
  | "pause_campaign"
  | "scale_campaign";

export interface MonitorAction {
  campaignId:   string;
  campaignName: string;
  actionType:   "pause" | "scale" | "alert";
  reason:       string;
  newBudget:    number | null;
}

export interface MonitorResult {
  actions:           MonitorAction[];
  summary:           string;
  totalSpend7d:      number;
  campaignsAnalyzed: number;
}

export interface ExecuteResult {
  success:      boolean;
  campaignName: string;
  message:      string;
  oldBudget?:   number;
  newBudget?:   number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MCP_BETA      = "mcp-client-2025-04-04";
const MODEL         = "claude-opus-4-5";
const META_MCP_URL  = "https://mcp.facebook.com/ads";

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(params: {
  action:         ClaudeMetaAction;
  adAccountId:    string;
  campaignId?:    string;
  targetCpa?:     number;
  breakEvenRoas?: number;
  aov?:           number;
  cogs?:          number;
  market?:        string;
  goal?:          string;
}): string {
  const {
    action, adAccountId,
    campaignId,
    targetCpa    = 50,
    breakEvenRoas = 2,
    aov          = 100,
    cogs         = 30,
    market       = "General",
    goal         = "Scale profitable campaigns",
  } = params;

  switch (action) {
    // ── Full account audit ────────────────────────────────────────────────────
    case "analyze":
      return `You are an expert media buyer with 15+ years managing profitable Meta Ads campaigns.
Ad Account: act_${adAccountId}

Using your Meta MCP tools, perform a complete account audit:
1. Pull ALL campaigns for this ad account
2. Get last 30 days performance: spend, results, CPA, CTR, ROAS, impressions, clicks
3. Identify profit leaks — campaigns spending above target CPA or below break-even ROAS
4. Identify winners — campaigns with strong ROAS to scale immediately
5. Generate a 7-Day Battle Plan with specific daily actions
6. Calculate total wasted spend in dollars

Business context:
- Average Order Value (AOV): $${aov}
- Cost of Goods Sold (COGS): $${cogs}
- Break-even ROAS: ${breakEvenRoas}x
- Target CPA: $${targetCpa}
- Market / Product category: ${market}
- Primary goal: ${goal}

Return ONLY a valid JSON object — no markdown, no code fences, no explanations. Start with { and end with }:
{
  "summaries": [
    {
      "campaignName": "string",
      "objective": "CONVERSIONS",
      "spend": 0,
      "impressions": 0,
      "clicks": 0,
      "ctr": 0,
      "cpc": 0,
      "conversions": 0,
      "purchases": 0,
      "revenue": 0,
      "roas": 0,
      "costPerResult": 0
    }
  ],
  "summary": "2-3 sentence executive summary of the account health",
  "score": 0,
  "winners": ["campaign name — reason it is a winner"],
  "killers": ["campaign name — reason it is a budget killer"],
  "recommendations": ["actionable recommendation"],
  "battlePlan": [
    { "day": 1, "title": "short title", "action": "specific action", "effort": "Quick Win" }
  ],
  "insights": ["key insight"],
  "totalSpend": 0,
  "totalRevenue": 0,
  "convResults": 0,
  "convAvgCPR": 0,
  "convBestRoas": 0,
  "analysisMode": "roas"
}`;

    // ── Monitoring cycle ──────────────────────────────────────────────────────
    case "monitor_and_optimize":
      return `You are an autonomous AI media buyer running a 6-hour monitoring cycle.
Ad Account: act_${adAccountId}

Using your Meta MCP tools:
1. Pull ALL campaigns — last 7 days: spend, CPA, CTR, ROAS, impressions
2. Pull previous 7 days (days 8–14 ago) for trend comparison
3. Pull current daily_budget per campaign

Evaluate each campaign against these rules:
- CPA > $${targetCpa} × 1.2 = $${(targetCpa * 1.2).toFixed(0)} → actionType: "pause"
- ROAS > ${breakEvenRoas}x × 2 = ${breakEvenRoas * 2}x AND daily_budget > 0 → actionType: "scale" (newBudget = daily_budget × 1.2, rounded to nearest dollar)
- CTR dropped 40%+ vs prior 7 days → actionType: "alert" (creative fatigue)
- Campaign > 80% of total account spend → actionType: "alert" (concentration risk)

Only include campaigns that trigger at least one rule. Skip campaigns with no data.

Return ONLY a valid JSON object — no markdown, no code fences:
{
  "actions": [
    {
      "campaignId": "string",
      "campaignName": "string",
      "actionType": "pause",
      "reason": "CPA $65.00 exceeds your $50 target by 30% over the last 7 days",
      "newBudget": null
    }
  ],
  "summary": "Found X issues across Y campaigns. Total 7-day spend: $Z.",
  "totalSpend7d": 0,
  "campaignsAnalyzed": 0
}
Note: for "scale" actions set newBudget to the new daily budget in dollars (number). For all others set newBudget to null.`;

    // ── Pause a campaign ──────────────────────────────────────────────────────
    case "pause_campaign":
      return `You are an autonomous AI media buyer for Meta Ads account act_${adAccountId}.

Using your Meta MCP tools, pause campaign ID: ${campaignId ?? "unknown"}
Set the campaign status to PAUSED.

Return ONLY a valid JSON object — no markdown:
{ "success": true, "campaignName": "the campaign name you paused", "message": "Campaign paused successfully" }`;

    // ── Scale a campaign budget ───────────────────────────────────────────────
    case "scale_campaign":
      return `You are an autonomous AI media buyer for Meta Ads account act_${adAccountId}.

Using your Meta MCP tools, scale the budget for campaign ID: ${campaignId ?? "unknown"}:
1. Fetch the campaign's current daily_budget
2. Calculate new budget = current × 1.2 (round to nearest dollar)
3. Update the campaign's daily_budget to the new amount

Return ONLY a valid JSON object — no markdown:
{ "success": true, "campaignName": "string", "oldBudget": 0, "newBudget": 0, "message": "Budget scaled from $X to $Y per day" }`;

    // ── List campaigns (lightweight) ──────────────────────────────────────────
    case "list_campaigns":
      return `You are a Meta Ads data retriever for account act_${adAccountId}.

Using your Meta MCP tools, list all campaigns for this ad account.
Return ONLY a valid JSON object — no markdown, no code fences, no explanations:
{
  "campaigns": [
    { "id": "string", "name": "string", "status": "ACTIVE", "effective_status": "ACTIVE", "objective": "string" }
  ],
  "total": 0
}`;
  }
}

// ── Core invoke function ──────────────────────────────────────────────────────

export async function invokeClaudeWithMeta(params: {
  accessToken:    string;
  adAccountId:    string;
  action:         ClaudeMetaAction;
  campaignId?:    string;
  targetCpa?:     number;
  breakEvenRoas?: number;
  aov?:           number;
  cogs?:          number;
  market?:        string;
  goal?:          string;
}): Promise<string> {
  const prompt    = buildPrompt(params);
  const maxTokens = params.action === "analyze"        ? 8000
                  : params.action === "list_campaigns" ? 2000
                  : 4000;

  const res = await fetch(ANTHROPIC_API, {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "anthropic-beta":    MCP_BETA,
    },
    body: JSON.stringify({
      model:       MODEL,
      max_tokens:  maxTokens,
      mcp_servers: [{
        type:                "url",
        url:                 META_MCP_URL,
        name:                "meta-ads",
        authorization_token: params.accessToken,
      }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    content?: Array<{ type: string; text?: string }>;
    error?:   { type: string; message: string };
  };

  if (data.error) throw new Error(`Claude error: ${data.error.message}`);

  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b)   => b.text ?? "")
    .join("\n")
    .trim();

  if (!text) throw new Error("Claude returned an empty response");
  return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

export function parseClaudeJSON<T>(text: string): T {
  // Strip markdown fences if Claude wrapped the response anyway
  const match =
    text.match(/```json\s*([\s\S]+?)\s*```/) ??
    text.match(/```\s*([\s\S]+?)\s*```/)     ??
    text.match(/(\{[\s\S]+\})/);

  const raw = match?.[1] ?? text;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${raw.slice(0, 300)}`);
  }
}
