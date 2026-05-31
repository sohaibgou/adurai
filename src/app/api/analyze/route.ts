import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ANALYSIS_LIMITS, resolvePlan, type PlanTier } from "@/lib/check-usage";
import type { CampaignSummary } from "@/lib/types";

// Allow up to 120 seconds for the Claude API call
export const maxDuration = 120;

const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];
const FREE_LIMIT   = 3; // guest fallback (no session)

const INDUSTRY_BENCHMARKS = `
META ADS INDUSTRY BENCHMARKS — use these as hard reference points. Compare EVERY campaign metric against these benchmarks and cite them explicitly in your recommendations. Never guess without context.

CTR BENCHMARKS (average by industry):
- E-commerce: 1.5–2.5% (general), Fashion: 1.8%, Beauty: 2.1%, Electronics: 1.2%
- If a campaign CTR is below its industry average, flag it as underperforming and recommend creative refresh.
- If CTR is above 2.5%, call it out as strong engagement.

CPC BENCHMARKS (good range):
- E-commerce: $0.50–$1.50
- Lead generation: $1.00–$3.00
- If CPC is below these ranges, the campaign is efficient. If CPC is 2x+ above the range, flag as expensive and recommend audience or placement optimization.

ROAS BENCHMARKS (e-commerce):
- Minimum viable: 2.0x (breaking even after COGS/shipping)
- Healthy: 3.0–4.0x
- Excellent: 5.0x+
- Below 1.0x = losing money on every sale. Recommend immediate pause or restructure.
- Between 1.0–2.0x = marginal, may not cover overhead. Recommend optimization before scaling.

COST PER LEAD BENCHMARKS:
- Good: below $30
- Average: $30–$50
- Expensive: above $50 — recommend restructuring or cutting

FREQUENCY THRESHOLDS:
- Above 3.5 = creative fatigue is likely. Recommend rotating creatives or expanding audience.
- Above 5.0 = severe fatigue. Ad performance will degrade rapidly. Recommend immediate creative refresh and audience expansion.
- Below 2.0 = healthy frequency, audience is not oversaturated.

When making recommendations, always state: "Benchmark: [X]. Your campaign: [Y]. This is [above/below/within] the industry standard." Be explicit.`;

const DIAGNOSTIC_RULES = `
MANDATORY DIAGNOSTIC RULES — apply these BEFORE making any recommendation. These are hard-coded expert rules that override gut instinct:

RULE 1 — HIGH CTR + LOW ROAS = LANDING PAGE PROBLEM:
If a campaign has CTR above 2% but ROAS below 2x, the ad is working — people are clicking. The problem is the landing page, not the ad. Say this explicitly: "Your ad is doing its job (CTR: X%). The drop-off is happening after the click. Audit your landing page: load speed, offer clarity, checkout friction."

RULE 2 — LOW CPC + ZERO CONVERSIONS = WRONG AUDIENCE OR OFFER:
If CPC is low (below $1.50) but conversions are zero, the issue is NOT the budget. The audience is wrong or the offer is wrong. Say: "You're getting cheap clicks but nobody is converting. This is an audience-offer mismatch. Test a different audience or change your offer before increasing spend."

RULE 3 — BUDGET IMBALANCE = OVER-ALLOCATION:
If one campaign has 3x or more spend than other campaigns with similar ROAS, it is being over-allocated. Say: "This campaign is consuming X% of your budget but delivering similar ROAS to campaigns spending 3x less. Rebalance: shift $Y from this campaign to [campaign name] to test if the smaller campaign scales efficiently."

RULE 4 — RISING COST PER RESULT = CREATIVE FATIGUE:
If cost per result is high relative to benchmarks, the most likely cause is creative fatigue — not audience or budget. Always recommend new creative BEFORE recommending budget changes. Say: "Before touching the budget, test 2-3 new creatives. Creative fatigue is the #1 cause of rising CPAs on Meta."

RULE 5 — NEVER PAUSE NEW CAMPAIGNS PREMATURELY:
Never recommend pausing a campaign that has been running for less than 3 days or has very low spend (under $50 total). It needs time to exit Meta's learning phase. Say: "This campaign is still in the learning phase. Give it at least 3-5 days and $50-100 in spend before making a judgment."

Apply ALL five rules to every campaign before writing your final recommendations. If a rule applies, it MUST appear in your output.`;

const OBJECTIVE_RULES = `
CRITICAL CAMPAIGN OBJECTIVE RULES — you MUST follow these strictly:

1. TRAFFIC / LINK_CLICKS objective campaigns:
   - NEVER recommend scaling a Traffic campaign. EVER.
   - Do NOT judge Traffic campaigns by ROAS, CPA, or conversions.
   - Only evaluate by CPC (cost per click) — lower is better.
   - Always recommend: "This is a Traffic campaign — optimize for cost per click only. Do not scale until you test a Conversions objective with this same audience."
   - If a Traffic campaign has good CPC, say it's efficient at driving clicks but recommend testing the audience with a Conversions objective before scaling spend.
   - Flag every Traffic campaign in killers or with a warning.

2. CONVERSIONS / PURCHASES objective campaigns:
   - Judge by ROAS, CPA (cost per purchase), and cost per result.
   - These are the ONLY campaigns worth recommending to scale.
   - Scale if ROAS ≥ 2x and CPA is sustainable. Cut if ROAS < 1x.

3. LEADS objective campaigns:
   - Judge by cost per lead ONLY.
   - Recommend scaling only if cost per lead is below $30 (industry average).
   - If cost per lead is above $50, recommend cutting or restructuring.

4. ENGAGEMENT / AWARENESS / REACH objective campaigns:
   - NEVER recommend scaling an Engagement campaign. EVER.
   - These campaigns are for brand visibility only — do NOT judge by ROAS, CPA, or conversions.
   - Only evaluate by CPM (cost per 1,000 impressions) and Reach.
   - Flag every Engagement campaign with a warning: "Engagement campaign — excluded from conversion metrics."

5. UNKNOWN objective campaigns:
   - Infer likely objective from the metrics. If no revenue and low conversions, treat as Traffic.
   - Be transparent: "Objective not detected — assuming [X] based on metrics."
   - Do NOT include Unknown campaigns in conversion/CPA metrics.

Always include the campaign objective in your analysis. Reference it explicitly when making recommendations.`;

const BASE_SYSTEM_PROMPT = `You are an elite performance marketing strategist with 15 years experience managing over $100M in Meta Ads spend for e-commerce brands. You think in first principles. You are brutally honest. You never give generic advice. Every insight you give must reference specific campaign names, specific numbers, and specific actions. You understand unit economics deeply — you always calculate profit and loss at campaign level. You know that a campaign with good CTR but no sales has a funnel problem not an ad problem. You know that scaling too fast kills ROAS. You know the difference between a learning phase campaign and a dead campaign. You think like a CFO and a creative director at the same time.

${INDUSTRY_BENCHMARKS}

${DIAGNOSTIC_RULES}

${OBJECTIVE_RULES}`;

const BATTLE_PLAN_SCHEMA = `
battlePlan: array of EXACTLY 7 objects, one per day, each with:
  - day: integer 1 through 7
  - title: string — 4-8 word action title, specific not generic (e.g. "Pause Summer Sale Campaign" not "Pause underperforming campaign")
  - action: string — 2-3 sentences referencing exact campaign names, actual dollar amounts, and specific steps. No vague advice.
  - effort: exactly one of "Quick Win", "Strategic", or "Monitor"

Strict day groupings (follow this or the output breaks):
  Day 1: Pause the single worst-performing campaign. effort = "Quick Win"
  Day 2: Scale the single best-performing campaign — specific budget amount. effort = "Quick Win"
  Day 3: Launch a creative test on a mid-tier campaign. effort = "Strategic"
  Day 4: Audience or bid strategy optimization on a specific campaign. effort = "Strategic"
  Day 5: Review results of Day 1-2 changes, adjust. effort = "Monitor"
  Day 6: Creative or copy refresh on a fatiguing campaign. effort = "Strategic"
  Day 7: Full account review — specific metrics to check, next week decision framework. effort = "Strategic"`;

const JSON_FORMAT_INSTRUCTION = `

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no code blocks, no explanation text before or after. Start your response with { and end with }.`;

const ROAS_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Format your response as JSON with these exact fields:
- summary: 2-3 sentence account overview
- score: integer 1-10 for overall account health
- winners: array of strings — campaigns to scale with specific reasons (NEVER include Traffic campaigns)
- killers: array of strings — campaigns to cut with specific reasons
- ${BATTLE_PLAN_SCHEMA}
- insights: array of 3 strings — deeper observations with specific numbers${JSON_FORMAT_INSTRUCTION}`;

const TRAFFIC_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

IMPORTANT: This account has NO purchase revenue data. Do NOT judge campaigns by ROAS or revenue — those metrics are zero/unavailable. Instead, analyze performance using these metrics ONLY:
- Cost Per Result (lower is better — this is the primary efficiency metric)
- CTR (higher is better — measures ad engagement quality)
- CPC (lower is better — measures cost efficiency of clicks)
- Conversion Volume (higher is better — total results/leads generated)
- Impressions and Reach efficiency

Format your response as JSON with these exact fields:
- summary: 2-3 sentence account overview focusing on cost efficiency and conversion volume
- score: integer 1-10 for overall account health
- winners: array of strings — campaigns to scale (NEVER Traffic campaigns, only Conversions/Leads with good metrics)
- killers: array of strings — campaigns to cut (high Cost/Result and low CTR)
- ${BATTLE_PLAN_SCHEMA}
- insights: array of 3 strings — deeper observations with specific numbers${JSON_FORMAT_INSTRUCTION}`;

interface OnboardingData {
  product: string;
  market: string;
  monthlyBudget: string;
  adExperience: string;
  aov: number;
  cogs: number;
  breakEvenRoas: number;
  targetCpa: number;
  currentRoas: number;
  mainGoal: string;
  biggestChallenge: string;
  focusCampaigns: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      summaries: CampaignSummary[];
      onboarding?: OnboardingData | null;
      sessionToken?: string;
      plan?: string;
      analysisCount?: number;
    };
    const { summaries, onboarding, sessionToken, plan, analysisCount: clientCount } = body;

    // ── Server-side limit enforcement ─────────────────────────────────────────
    let serverPlan    : PlanTier = "free";
    let serverAdmin   = false;
    let authedUserId: string | undefined;

    if (sessionToken) {
      try {
        // Use supabaseAdmin.auth.getUser — consistent with all other API routes
        const { data: { user }, error: tokenErr } = await supabaseAdmin.auth.getUser(sessionToken);
        if (tokenErr) {
          console.error("[analyze] token verification failed:", tokenErr.message);
        } else if (user?.email) {
          authedUserId = user.id;
          serverAdmin  = ADMIN_EMAILS.includes(user.email);
          if (!serverAdmin) {
            const { data: sub } = await supabaseAdmin
              .from("subscriptions")
              .select("plan, status")
              .eq("user_id", user.id)
              .eq("status", "active")
              .maybeSingle();
            serverPlan = resolvePlan(sub?.plan);
          }
        }
      } catch (e) {
        console.error("[analyze] auth check threw:", e);
      }
    }

    // Analysis caps reset monthly. Free 3/mo, Starter 10/mo, Growth+/Autopilot
    // unlimited (null). Admins are always unlimited.
    const analysisLimit = serverAdmin ? null : ANALYSIS_LIMITS[serverPlan];
    if (analysisLimit !== null) {
      const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const overMessage =
        serverPlan === "free"
          ? "You've used all 3 free analyses for this month. Upgrade to continue."
          : `You've used all ${analysisLimit} analyses for this month. Resets on the 1st.`;

      if (authedUserId) {
        // Authenticated user — enforce via DB count (authoritative, monthly reset)
        const { data: usageRow } = await supabaseAdmin
          .from("user_usage")
          .select("analysis_count, analysis_month")
          .eq("user_id", authedUserId)
          .maybeSingle();
        const dbCount = usageRow?.analysis_month === month ? (usageRow?.analysis_count ?? 0) : 0;
        if (dbCount >= analysisLimit) {
          return NextResponse.json(
            { error: overMessage, code: "FREE_LIMIT_EXCEEDED" },
            { status: 403 }
          );
        }
      } else {
        // Guest user — fall back to client-reported count (free tier only)
        const count = typeof clientCount === "number" ? clientCount : 0;
        if (count >= FREE_LIMIT) {
          return NextResponse.json(
            { error: "You've used all 3 free analyses. Upgrade to continue.", code: "FREE_LIMIT_EXCEEDED" },
            { status: 403 }
          );
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!summaries || summaries.length === 0) {
      return NextResponse.json(
        { error: "No campaign data provided" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key is not configured. Set ANTHROPIC_API_KEY in your .env.local file." },
        { status: 500 },
      );
    }

    const anthropic = new Anthropic({ apiKey, timeout: 120_000 });

    const totalSpend = summaries.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = summaries.reduce((s, c) => s + c.revenue, 0);

    const convCampaigns = summaries.filter((c) => c.objective === "CONVERSIONS" || c.objective === "LEADS");
    const convResults = convCampaigns.reduce((s, c) => s + c.conversions, 0);
    const convSpend = convCampaigns.reduce((s, c) => s + c.spend, 0);
    const convWithCPR = convCampaigns.filter((c) => c.costPerResult > 0);
    const convAvgCPR = convWithCPR.length > 0
      ? Number((convWithCPR.reduce((s, c) => s + c.costPerResult * (c.conversions || 1), 0) / convWithCPR.reduce((s, c) => s + (c.conversions || 1), 0)).toFixed(2))
      : (convResults > 0 ? Number((convSpend / convResults).toFixed(2)) : 0);
    const convBestRoas = convCampaigns.length > 0
      ? Math.max(...convCampaigns.map((c) => c.roas))
      : 0;

    const hasRevenue = totalRevenue > 0 && summaries.some((c) => c.revenue > 0);
    const analysisMode = hasRevenue ? "roas" : "traffic";
    const systemPrompt = hasRevenue ? ROAS_SYSTEM_PROMPT : TRAFFIC_SYSTEM_PROMPT;

    let dataTable: string;
    if (hasRevenue) {
      dataTable = summaries
        .map(
          (c) =>
            `- ${c.campaignName} [Objective: ${c.objective}]: Spend=$${c.spend.toFixed(2)}, Revenue=$${c.revenue.toFixed(2)}, ROAS=${c.roas}x, CPC=$${c.cpc}, CTR=${c.ctr}%, Conversions=${c.conversions}, Cost/Result=$${c.costPerResult}`,
        )
        .join("\n");
    } else {
      dataTable = summaries
        .map(
          (c) =>
            `- ${c.campaignName} [Objective: ${c.objective}]: Spend=$${c.spend.toFixed(2)}, CPC=$${c.cpc}, CTR=${c.ctr}%, Results=${c.conversions}, Cost/Result=$${c.costPerResult}, Impressions=${c.impressions}, Clicks=${c.clicks}`,
        )
        .join("\n");
    }

    // Build business context block with profit/loss calculations
    let businessContext = "";
    if (onboarding) {
      const grossMarginPerOrder = onboarding.aov - onboarding.cogs;
      const marginPct = onboarding.aov > 0 ? ((grossMarginPerOrder / onboarding.aov) * 100).toFixed(1) : "N/A";

      businessContext = `
BUSINESS CONTEXT (reference these numbers in EVERY recommendation — never use generic benchmarks when these specifics are available):
- Product: ${onboarding.product}
- Target Market: ${onboarding.market}
- Monthly Ad Budget: ${onboarding.monthlyBudget}
- Meta Ads Experience: ${onboarding.adExperience}
- Average Order Value (AOV): $${onboarding.aov}
- Product Cost (COGS): $${onboarding.cogs}
- Gross Margin Per Order: $${grossMarginPerOrder.toFixed(2)} (${marginPct}% margin)
- Break-Even ROAS: ${onboarding.breakEvenRoas}x — ANY campaign below this ROAS is losing money after product costs
${onboarding.targetCpa ? `- Target CPA: $${onboarding.targetCpa} — flag EVERY campaign exceeding this CPA` : "- Target CPA: Not specified"}
${onboarding.currentRoas ? `- Advertiser's Reported ROAS: ${onboarding.currentRoas}x` : ""}
- Main Goal: ${onboarding.mainGoal}
- Biggest Challenge: ${onboarding.biggestChallenge}
${onboarding.focusCampaigns ? `- Priority Campaigns: ${onboarding.focusCampaigns}` : ""}

PROFIT/LOSS CALCULATION RULES (apply to every Conversions campaign):
1. For each Conversions campaign: Profit = (Revenue) - (Spend) - (COGS × Conversions)
2. Profit leak in dollars = Spend on campaigns with ROAS < ${onboarding.breakEvenRoas}x
3. Any campaign with ROAS below ${onboarding.breakEvenRoas}x is unprofitable — state the dollar loss explicitly
4. If target CPA is set ($${onboarding.targetCpa}), calculate % over/under target for each campaign
5. Best-case profit if budget shifted from unprofitable → profitable campaigns

MARKET-SPECIFIC REQUIREMENTS:
- Tailor ALL recommendations for the ${onboarding.market} market
- Pricing sensitivity, buying behavior, and seasonal patterns differ by market — factor this in
- If recommending audience changes, specify market-appropriate targeting

ANALYSIS INSTRUCTIONS:
- Address the stated goal directly: "${onboarding.mainGoal}"
- Solve the stated challenge: "${onboarding.biggestChallenge}"
- Every recommendation must reference their AOV ($${onboarding.aov}), COGS ($${onboarding.cogs}), and break-even ROAS (${onboarding.breakEvenRoas}x)
- The 7-day battle plan must be specific to their product and market — no generic advice
- If a campaign is above target CPA ($${onboarding.targetCpa}), state exactly how much over and what to do
`;
    }

    let userPrompt: string;
    if (hasRevenue) {
      userPrompt = `Analyze this Meta Ads account and provide a complete performance audit.
${businessContext}
CAMPAIGN DATA:
${dataTable}

PORTFOLIO TOTALS:
- Total Spend: $${totalSpend.toFixed(2)}
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Results (Conversion/Leads campaigns only): ${convResults}
- Avg Cost Per Result (Conversion/Leads campaigns only): $${convAvgCPR}
- Best ROAS (Conversion campaigns only): ${convBestRoas}x

ANALYSIS INSTRUCTIONS:
1. Calculate profit/loss for each Conversions campaign using the business context above
2. Flag every campaign exceeding the target CPA with exact dollar overage
3. State total profit leak in dollars from campaigns below break-even ROAS
4. Provide a specific 7-day battle plan referencing exact campaign names and dollar amounts
5. All winners must have ROAS above the break-even ROAS of ${onboarding?.breakEvenRoas ?? 2}x

Return ONLY a valid JSON object — no markdown, no code fences, no explanation.`;
    } else {
      userPrompt = `Analyze this Meta Ads account. NOTE: No revenue data available — judge purely on cost efficiency, CTR, and result volume.
${businessContext}
CAMPAIGN DATA:
${dataTable}

PORTFOLIO TOTALS:
- Total Spend: $${totalSpend.toFixed(2)}
- Total Results (Conversion/Leads campaigns only): ${convResults}
- Avg Cost Per Result (Conversion/Leads campaigns only): $${convAvgCPR > 0 ? convAvgCPR : "N/A"}

ANALYSIS INSTRUCTIONS:
1. Identify which campaigns deliver the most results at the lowest cost
2. Flag campaigns with high Cost Per Result relative to industry benchmarks
3. If target CPA is set, compare Cost Per Result against it and flag overages
4. Provide a specific 7-day battle plan referencing exact campaign names
5. Do NOT mention ROAS or revenue — those metrics are unavailable

Return ONLY a valid JSON object — no markdown, no code fences, no explanation.`;
    }

    console.log("[analyze] Sending request to Claude...");
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
      ],
    });
    console.log("[analyze] Got response from Claude, stop_reason:", message.stop_reason);

    const rawText = message.content[0]?.type === "text" ? message.content[0].text : "";
    console.log("[analyze] Raw Claude response:", rawText.substring(0, 1000));

    let parsed: {
      summary?: string;
      score?: number;
      winners?: unknown[];
      killers?: unknown[];
      battlePlan?: unknown[];
      insights?: unknown[];
    };
    try {
      // Strip markdown code fences
      const stripped = rawText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Extract the outermost JSON object in case there's preamble/postamble text
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in response");

      parsed = JSON.parse(jsonMatch[0]);
      console.log("[analyze] Parsed successfully — keys:", Object.keys(parsed));
    } catch (parseErr) {
      console.error("[analyze] JSON parse error:", parseErr);
      console.error("[analyze] Raw response (first 500 chars):", rawText.substring(0, 500));
      return NextResponse.json(
        { error: "Parse failed", raw: rawText.substring(0, 500) },
        { status: 500 },
      );
    }

    const VALID_EFFORTS = new Set(["Quick Win", "Strategic", "Monitor"]);

    const normalizedBattlePlan = (parsed.battlePlan || [])
      .map((item: unknown, idx: number) => {
        if (typeof item !== "object" || item === null) return null;
        const obj = item as Record<string, unknown>;
        return {
          day: typeof obj.day === "number" ? obj.day : idx + 1,
          title: typeof obj.title === "string" ? obj.title : `Day ${idx + 1} Action`,
          action: typeof obj.action === "string" ? obj.action : "",
          effort: VALID_EFFORTS.has(obj.effort as string)
            ? (obj.effort as "Quick Win" | "Strategic" | "Monitor")
            : "Strategic",
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => a.day - b.day);

    const normalizeItems = (items: unknown[]): string[] =>
      (items || []).map((item: unknown) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, string>;
          if (obj.campaign && obj.reason) return `${obj.campaign}: ${obj.reason}`;
          if (obj.campaign) return obj.campaign;
          return (
            obj.observation ??
            obj.text ??
            obj.description ??
            obj.insight ??
            obj.recommendation ??
            obj.action ??
            JSON.stringify(item)
          );
        }
        return String(item);
      });

    const responsePayload = {
      summary: parsed.summary || "",
      score: parsed.score || 0,
      winners: normalizeItems(parsed.winners || []),
      killers: normalizeItems(parsed.killers || []),
      recommendations: [],
      battlePlan: normalizedBattlePlan,
      insights: normalizeItems(parsed.insights || []),
      totalSpend,
      totalRevenue,
      convResults,
      convAvgCPR,
      convBestRoas,
      analysisMode,
      summaries,  // ← include campaign rows so DB-loaded results show Overview & Campaigns tabs
    };
    // Increment the monthly analysis counter for tiers with a finite cap
    // (free 3/mo, starter 10/mo). Growth/Autopilot + admins are unlimited.
    if (authedUserId && !serverAdmin && ANALYSIS_LIMITS[serverPlan] !== null) {
      try {
        await supabaseAdmin.rpc("increment_user_analysis", { p_user_id: authedUserId });
      } catch { /* non-fatal — count will be checked next request */ }
    }

    // Persist full analysis result for authenticated users (free or paid)
    // so /results page can reload it across sessions
    if (authedUserId) {
      console.log("[analyze] saving analysis for user", authedUserId);
      const { error: insertErr } = await supabaseAdmin.from("analyses").insert({
        user_id:        authedUserId,
        score:          responsePayload.score ?? 0,
        campaign_count: summaries.length,
        result_json:    responsePayload,
        form_data:      onboarding ?? null,
      });
      if (insertErr) {
        console.error("[analyze] DB insert failed:", insertErr.message, insertErr.details ?? "");
      } else {
        console.log("[analyze] analysis saved to DB ✓");
      }
    } else {
      console.warn("[analyze] no authedUserId — analysis NOT saved (no session token or auth failed)");
    }

    console.log("[analyze] Analysis complete, sending response");
    return NextResponse.json(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    console.log("[analyze] Analysis failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
