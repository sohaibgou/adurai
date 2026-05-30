import { NextRequest, NextResponse } from "next/server";
import { checkUsage } from "@/lib/check-usage";
import { supabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface AdCopyVariant {
  hookType:    string;
  primaryText: string;
  headline:    string;
  description: string;
  cta:         string;
}

export async function POST(req: NextRequest) {
  const usageResult = await checkUsage(req, "copy");
  if (usageResult instanceof NextResponse) return usageResult;
  const { user, plan } = usageResult;

  const { productDescription, targetAudience, mainBenefit, language } = await req.json() as {
    productDescription: string;
    targetAudience:     string;
    mainBenefit:        string;
    language:           string;
  };

  console.log("━━━ /api/generate-ad-copy ━━━");
  console.log("PRODUCT:", productDescription);
  console.log("AUDIENCE:", targetAudience);
  console.log("BENEFIT:", mainBenefit);
  console.log("LANGUAGE:", language);

  if (!productDescription?.trim()) {
    return NextResponse.json({ error: "Product description is required" }, { status: 400 });
  }

  const message = await client.messages.create({
    model:      "claude-opus-4-5",
    max_tokens: 4000,
    messages: [
      {
        role:    "user",
        content: `You are a world-class direct response copywriter specializing in Meta Ads for e-commerce and DTC brands. You write copy that stops the scroll, triggers emotion, and drives clicks.

Generate 5 Meta Ad copy variants. Each variant MUST have:

PRIMARY TEXT: 4-6 sentences minimum. Start with a powerful hook. Build desire. Address objections. Create urgency. This should be substantial copy that tells a story and sells — not just 1-2 lines. Make it feel human and conversational, not robotic.

HEADLINE: Bold, clear, under 8 words. Action-oriented. Makes the value instantly obvious.

DESCRIPTION: 1-2 sentences expanding on the headline. Adds a supporting detail or reinforces the core promise.

CTA: Specific action phrase with context (not just "Shop Now" — e.g. "Get Your Free Sample", "Start Your 30-Day Trial", "Claim Your Discount").

Hook types — one per variant:
1. Pain Point — open with the customer's deepest frustration, agitate it viscerally, then present the solution as relief
2. Curiosity Gap — create an open loop they NEED to close. Tease the transformation without revealing it fully
3. Social Proof — lead with a specific result, real number, or before/after transformation story
4. Direct Offer — lead with the deal, value stack, or irresistible offer. Make the math undeniable
5. Pattern Interrupt — completely unexpected, counterintuitive opening that breaks the scroll pattern

Product: ${productDescription.trim()}
Target audience: ${targetAudience?.trim() || "general consumers"}
Main benefit: ${mainBenefit?.trim() || "not specified"}

Rules:
- Write in ${language || "English"}
- Primary text minimum 4 sentences — be substantial, be a storyteller
- Be specific with numbers, timeframes, and tangible outcomes — never vague
- Reference the target audience and main benefit directly in the copy
- Every line must earn its place — no filler, no clichés
- Write like the best human copywriter in the world — natural, punchy, persuasive

Return ONLY a valid JSON array with exactly 5 objects, each with these exact fields: hookType, primaryText, headline, description, cta
No markdown, no explanation, no code fences — just the raw JSON array.`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  console.log("CLAUDE RAW:", raw.slice(0, 300));

  let variants: AdCopyVariant[];
  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    variants = JSON.parse(cleaned) as AdCopyVariant[];
    if (!Array.isArray(variants) || variants.length === 0) throw new Error("Not an array");
  } catch (err) {
    console.error("Failed to parse Claude response:", err, raw);
    return NextResponse.json({ error: "Failed to parse ad copy response", details: raw }, { status: 500 });
  }

  console.log("SUCCESS — returning", variants.length, "variants");

  if (plan === "free") {
    try { await supabaseAdmin.rpc("increment_user_copy", { p_user_id: user.id }); } catch { /**/ }
  }

  return NextResponse.json({ variants });
}
