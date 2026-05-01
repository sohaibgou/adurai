import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { productDescription, campaigns, winners } = (await request.json()) as {
      productDescription: string;
      campaigns?: { campaignName: string; spend: number; roas: number; ctr: number; conversions: number; objective: string }[];
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

    const sorted = [...(campaigns || [])].sort((a, b) => b.roas - a.roas);
    const topCampaigns = sorted.slice(0, 5);
    const campaignContext = topCampaigns.length > 0
      ? topCampaigns.map((c) => `- ${c.campaignName} [${c.objective}]: ROAS=${c.roas}x, CTR=${c.ctr}%, Conv=${c.conversions}`).join("\n")
      : "No campaign data provided.";

    const winnersContext = (winners || []).length > 0
      ? `\nWinning campaigns: ${winners!.join("; ")}`
      : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior creative director at a top-tier performance marketing agency specializing in Meta Ads. You design static image ad concepts that convert. Your concepts are detailed enough for a designer or AI image tool to execute immediately.

Generate exactly 3 static image ad concepts. Each must be a DIFFERENT visual approach and designed for a DIFFERENT Meta placement:

CONCEPT 1 — PRODUCT HERO (Feed 1080x1080)
Clean, bold product-centric image. Minimal background, strong lighting, product is the star. Bold headline typography overlaid.

CONCEPT 2 — LIFESTYLE (Story 1080x1920)
Product shown in real-life context. Aspirational, emotional. Person using the product or product in an environment that evokes desire.

CONCEPT 3 — SOCIAL PROOF (Reel Cover 1080x1920)
Results-focused. Numbers, testimonials, before/after, star ratings. Trust-building visual that leverages social proof psychology.

For EACH concept return:
- name: short concept name
- format: the Meta placement ("Feed 1080x1080", "Story 1080x1920", or "Reel Cover 1080x1920")
- visualDescription: DETAILED description of exactly what should be in the image — layout, product placement, background, lighting, colors, mood, composition, style. At least 80 words. This must be specific enough to hand to a designer or use as an AI image generation prompt.
- headlineOverlay: headline text to overlay on the image (max 6 words)
- subtextOverlay: supporting text line (max 12 words)
- whyItWorks: ONE sentence explaining why this concept will convert, referencing the campaign data if available
- dallePrompt: a refined, DALL-E 3 optimized prompt (100+ words) that will generate this exact image. Include: photographic style, composition details, lighting setup, color palette, mood, product positioning, background elements. Do NOT include any text/words in the prompt — DALL-E should generate the image without text overlays. Specify "1024x1024" for Feed or "1024x1792" for Story/Reel.

Return ONLY valid JSON:
{
  "concepts": [
    {
      "name": "...",
      "format": "Feed 1080x1080",
      "visualDescription": "...",
      "headlineOverlay": "...",
      "subtextOverlay": "...",
      "whyItWorks": "...",
      "dallePrompt": "..."
    }
  ]
}`,
        },
        {
          role: "user",
          content: `PRODUCT/OFFER: ${productDescription}

CAMPAIGN PERFORMANCE:
${campaignContext}${winnersContext}

Create 3 ad creative concepts based on this product and what's working in the campaigns.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(
      content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim(),
    );

    return NextResponse.json({ concepts: parsed.concepts || [] });
  } catch (error) {
    console.error("Creative generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate creative concepts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
