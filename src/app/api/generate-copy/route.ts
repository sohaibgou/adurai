import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { campaigns, productDescription, winners } = (await request.json()) as {
      campaigns: { campaignName: string; spend: number; roas: number; ctr: number; conversions: number; objective: string }[];
      productDescription: string;
      winners?: string[];
    };

    if (!productDescription?.trim()) {
      return NextResponse.json({ error: "Product description is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    // Build context from best-performing campaigns
    const sorted = [...(campaigns || [])].sort((a, b) => b.roas - a.roas);
    const topCampaigns = sorted.slice(0, 5);

    const campaignContext = topCampaigns
      .map(
        (c) =>
          `- ${c.campaignName} [${c.objective}]: Spend=$${c.spend}, ROAS=${c.roas}x, CTR=${c.ctr}%, Conversions=${c.conversions}`,
      )
      .join("\n");

    const winnersContext = (winners || []).length > 0
      ? `\n\nWINNING CAMPAIGNS (from analysis):\n${winners!.map((w) => `- ${w}`).join("\n")}`
      : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a world-class direct response copywriter and Meta Ads expert who has written copy for 8-figure e-commerce brands. You write copy that stops the scroll, triggers emotion, and drives clicks. You understand hooks, pattern interrupts, social proof, urgency, and pain-point marketing at the highest level.

YOUR TASK: Generate exactly 5 ad copy variants for Meta Ads (Facebook/Instagram). Each variant uses a DIFFERENT hook type:

HOOK 1 — PAIN POINT: Lead with the customer's biggest frustration. Make them feel understood. Agitate the problem before presenting the solution.

HOOK 2 — CURIOSITY GAP: Make them NEED to know more. Create an information gap that can only be closed by clicking. Use intrigue, surprise, or a counterintuitive statement.

HOOK 3 — SOCIAL PROOF: Lead with results, numbers, testimonials, or authority. "10,000+ customers", "Rated #1", "As seen in", real results.

HOOK 4 — DIRECT OFFER: Lead with the deal, discount, or value proposition. Be clear, specific, and irresistible. Price anchoring, free shipping, bundles.

HOOK 5 — PATTERN INTERRUPT: Unexpected opening that stops the scroll. Break the pattern of what people expect in their feed. Unusual statement, question, or format.

RULES FOR EACH VARIANT:
- Primary Text: 2-3 compelling lines. First line is the HOOK — the most important line. Second line builds desire or agitates. Third line is the CTA or payoff.
- Headline: Under 7 words. Punchy, benefit-driven, creates urgency.
- Description: One single line. Supports the headline, reinforces the offer.

COPY QUALITY STANDARDS:
- Write like you're talking to ONE person, not a crowd
- Use specific numbers over vague claims
- Every word must earn its place — cut filler ruthlessly
- The hook must work in the first 3 seconds of reading
- Match the copy angle to what actually works for this product based on campaign data

Return ONLY valid JSON with this exact structure:
{
  "variants": [
    {
      "hookType": "Pain Point",
      "hookNumber": 1,
      "primaryText": "Line 1 hook\\nLine 2 build\\nLine 3 CTA",
      "headline": "Under 7 Words Here",
      "description": "One supporting line here"
    },
    {
      "hookType": "Curiosity Gap",
      "hookNumber": 2,
      "primaryText": "...",
      "headline": "...",
      "description": "..."
    },
    {
      "hookType": "Social Proof",
      "hookNumber": 3,
      "primaryText": "...",
      "headline": "...",
      "description": "..."
    },
    {
      "hookType": "Direct Offer",
      "hookNumber": 4,
      "primaryText": "...",
      "headline": "...",
      "description": "..."
    },
    {
      "hookType": "Pattern Interrupt",
      "hookNumber": 5,
      "primaryText": "...",
      "headline": "...",
      "description": "..."
    }
  ]
}`,
        },
        {
          role: "user",
          content: `PRODUCT/OFFER: ${productDescription}

TOP PERFORMING CAMPAIGNS:
${campaignContext}${winnersContext}

Generate 5 ad copy variants — one for each hook type. Base the copy on this specific product and what's working in their best campaigns. Make every word count.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(
      content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim(),
    );

    return NextResponse.json({
      variants: parsed.variants || [],
    });
  } catch (error) {
    console.error("Copy generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate ad copy";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
