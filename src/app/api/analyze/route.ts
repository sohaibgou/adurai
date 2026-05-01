import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { CampaignSummary } from "@/lib/types";

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

const ROAS_SYSTEM_PROMPT = `You are a world-class performance marketing expert and media buyer with 10+ years experience scaling e-commerce brands on Meta Ads. You have managed over $50M in ad spend. You analyze campaign data with brutal honesty — you don't sugarcoat. Your job is to look at this Meta Ads data and give the brand owner exactly what they need to hear: what's working, what's bleeding money, and exactly what to do in the next 7 days. Be specific with numbers. Reference actual campaign names from the data. Give prioritized action items ranked by impact. Think like a $10,000/month agency but speak plainly. Never be vague. Always give a specific next action for every insight.

${INDUSTRY_BENCHMARKS}

${DIAGNOSTIC_RULES}

${OBJECTIVE_RULES}

Format your response as JSON with these fields: summary (2-3 sentence overview), score (overall account health 1-10), winners (array of campaigns to scale with reasons — NEVER include Traffic campaigns here), killers (array of campaigns to cut with reasons), actions (array of 5 specific actions ranked by priority with expected impact), and insights (3 deeper observations about the account).`;

const TRAFFIC_SYSTEM_PROMPT = `You are a world-class performance marketing expert and media buyer with 10+ years experience running lead generation, traffic, and awareness campaigns on Meta Ads. You have managed over $50M in ad spend.

IMPORTANT: This account has NO purchase revenue data. Do NOT judge campaigns by ROAS or revenue — those metrics are zero/unavailable. Instead, analyze performance using these metrics ONLY:
- Cost Per Result (lower is better — this is the primary efficiency metric)
- CTR (higher is better — measures ad engagement quality)
- CPC (lower is better — measures cost efficiency of clicks)
- Conversion Volume (higher is better — total results/leads generated)
- Impressions and Reach efficiency

${INDUSTRY_BENCHMARKS}

${DIAGNOSTIC_RULES}

${OBJECTIVE_RULES}

Your job: identify which campaigns deliver the most results at the lowest cost, which campaigns are burning budget with poor CTR or high Cost Per Result, and exactly what to do in the next 7 days to improve cost efficiency and volume.

Be specific with numbers. Reference actual campaign names from the data. Give prioritized action items ranked by impact. Think like a $10,000/month agency but speak plainly. Never be vague. Always give a specific next action for every insight.

Format your response as JSON with these fields: summary (2-3 sentence overview focusing on cost efficiency and conversion volume), score (overall account health 1-10), winners (array of campaigns to scale — NEVER include Traffic campaigns, only Conversions/Leads campaigns with good metrics), killers (array of campaigns to cut — judge by high Cost/Result and low CTR), actions (array of 5 specific actions ranked by priority with expected impact), and insights (3 deeper observations about the account).`;

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
    const { summaries, onboarding } = (await request.json()) as {
      summaries: CampaignSummary[];
      onboarding?: OnboardingData | null;
    };

    if (!summaries || summaries.length === 0) {
      return NextResponse.json(
        { error: "No campaign data provided" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Set OPENAI_API_KEY in your .env.local file." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const totalSpend = summaries.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = summaries.reduce((s, c) => s + c.revenue, 0);

    // Filter to Conversion/Leads objective campaigns ONLY — exclude Traffic, Engagement, Unknown
    const convCampaigns = summaries.filter((c) => c.objective === "CONVERSIONS" || c.objective === "LEADS");
    const convResults = convCampaigns.reduce((s, c) => s + c.conversions, 0);
    const convSpend = convCampaigns.reduce((s, c) => s + c.spend, 0);
    // Use Meta's Cost Per Result directly — weighted average by conversions
    const convWithCPR = convCampaigns.filter((c) => c.costPerResult > 0);
    const convAvgCPR = convWithCPR.length > 0
      ? Number((convWithCPR.reduce((s, c) => s + c.costPerResult * (c.conversions || 1), 0) / convWithCPR.reduce((s, c) => s + (c.conversions || 1), 0)).toFixed(2))
      : (convResults > 0 ? Number((convSpend / convResults).toFixed(2)) : 0);
    const convBestRoas = convCampaigns.length > 0
      ? Math.max(...convCampaigns.map((c) => c.roas))
      : 0;

    // Detect analysis mode: if total revenue is 0 or every campaign has 0 revenue, use traffic mode
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

    // Build onboarding context block for the AI
    let onboardingBlock = "";
    if (onboarding) {
      onboardingBlock = `
BUSINESS CONTEXT (from the advertiser — reference these numbers in EVERY recommendation):
- Product: ${onboarding.product}
- Target Market: ${onboarding.market}
- Monthly Ad Budget: ${onboarding.monthlyBudget}
- Meta Ads Experience: ${onboarding.adExperience}
- Average Order Value (AOV): $${onboarding.aov}
- Product Cost (COGS): $${onboarding.cogs}
- Break-even ROAS: ${onboarding.breakEvenRoas}x (any campaign below this is LOSING money after product costs)
${onboarding.targetCpa ? `- Target CPA: $${onboarding.targetCpa}` : "- Target CPA: Not specified"}
${onboarding.currentRoas ? `- Current Average ROAS: ${onboarding.currentRoas}x` : ""}
- Main Goal: ${onboarding.mainGoal}
- Biggest Challenge: ${onboarding.biggestChallenge}
${onboarding.focusCampaigns ? `- Campaigns to Focus On: ${onboarding.focusCampaigns}` : ""}

CRITICAL: Use the break-even ROAS of ${onboarding.breakEvenRoas}x as the TRUE profitability threshold — not the generic 2x benchmark. Any campaign with ROAS below ${onboarding.breakEvenRoas}x is unprofitable for this business. Reference their AOV of $${onboarding.aov} and COGS of $${onboarding.cogs} when discussing profitability. Prioritize recommendations around their goal: "${onboarding.mainGoal}". Address their challenge: "${onboarding.biggestChallenge}". Never give generic advice — every insight must reference their specific numbers.
`;
    }

    let userPrompt: string;
    if (hasRevenue) {
      userPrompt = `Analyze this Meta Ads campaign data:
${onboardingBlock}
CAMPAIGN DATA:
${dataTable}

PORTFOLIO TOTALS:
- Total Spend (all campaigns): $${totalSpend.toFixed(2)}
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Results (Conversion campaigns only): ${convResults}
- Avg Cost Per Result (Conversion campaigns only): $${convAvgCPR}
- Best ROAS (Conversion campaigns only): ${convBestRoas}x

Return ONLY a valid JSON object — no markdown, no code fences, no explanation.`;
    } else {
      userPrompt = `Analyze this Meta Ads campaign data. NOTE: There is NO revenue data — do NOT mention ROAS or revenue in your analysis. Judge purely on cost efficiency, CTR, and conversion volume.
${onboardingBlock}
CAMPAIGN DATA:
${dataTable}

PORTFOLIO TOTALS:
- Total Spend (all campaigns): $${totalSpend.toFixed(2)}
- Total Results (Conversion campaigns only): ${convResults}
- Avg Cost Per Result (Conversion campaigns only): $${convAvgCPR > 0 ? convAvgCPR : "N/A"}

Return ONLY a valid JSON object — no markdown, no code fences, no explanation.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content?.trim() || "{}";

    let parsed: {
      summary?: string;
      score?: number;
      winners?: unknown[];
      killers?: unknown[];
      actions?: unknown[];
      insights?: unknown[];
    };
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "\nRaw content:", content.substring(0, 500));
      parsed = {
        summary: "Unable to parse AI response.",
        score: 0,
        actions: [
          hasRevenue
            ? "Review the raw campaign data in the table above and consider pausing campaigns with ROAS below 1.0x."
            : "Review the raw campaign data in the table above and consider pausing campaigns with high Cost Per Result.",
        ],
      };
    }

    const normalizedActions: string[] = (parsed.actions || []).map((a: unknown) => {
      if (typeof a === "string") return a;
      if (typeof a === "object" && a !== null) {
        const obj = a as Record<string, string>;
        if (obj.action && obj.impact) return `${obj.action} (Expected impact: ${obj.impact})`;
        if (obj.action) return obj.action;
        return JSON.stringify(a);
      }
      return String(a);
    });

    const normalizeItems = (items: unknown[]): string[] =>
      (items || []).map((item: unknown) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, string>;
          if (obj.campaign && obj.reason) return `${obj.campaign}: ${obj.reason}`;
          if (obj.campaign) return obj.campaign;
          return JSON.stringify(item);
        }
        return String(item);
      });

    return NextResponse.json({
      summary: parsed.summary || "",
      score: parsed.score || 0,
      winners: normalizeItems(parsed.winners || []),
      killers: normalizeItems(parsed.killers || []),
      recommendations: normalizedActions,
      insights: parsed.insights || [],
      totalSpend,
      totalRevenue,
      convResults,
      convAvgCPR,
      convBestRoas,
      analysisMode,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
