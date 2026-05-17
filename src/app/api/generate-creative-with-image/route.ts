import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { ArabicTextData } from "@/app/api/generate-creative/route";

export const maxDuration = 120;
export const dynamic    = "force-dynamic";

interface CreativeBrief {
  angle:           string;
  prompt:          string;
  headline:        string;
  rationale:       string;
  headline_ar?:    string;
  subheadline_ar?: string;
  cta_ar?:         string;
}

interface CreativeResult {
  url:       string;
  angle:     string;
  headline:  string;
  rationale: string;
}

const NO_TEXT_INSTRUCTION =
  "CRITICAL: The image must contain absolutely NO text, letters, words, numbers, Arabic script, or any written characters anywhere. Pure visual only — no captions, no headlines, no watermarks.";

export async function POST(req: Request) {
  console.log("━━━ /api/generate-creative-with-image ━━━");

  const formData  = await req.formData();
  const imageFile = formData.get("image")    as File;
  const prompt    = formData.get("prompt")   as string ?? "";
  const isArabic  = formData.get("isArabic") === "true";

  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const imageBytes  = await imageFile.arrayBuffer();
  const base64Image = Buffer.from(imageBytes).toString("base64");
  const mimeType    = imageFile.type || "image/jpeg";

  console.log("Image:", imageFile.name, imageFile.size, "bytes | Prompt:", prompt, "| Arabic:", isArabic);

  /* ── Step 1: Claude generates 4 creative briefs ─────── */
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log("[step1] Asking Claude for 4 creative briefs...");

  const imagePromptInstruction = isArabic
    ? `- Exact background description with colors\n- Product placement and size\n- Lighting style and mood\n- Color palette and style references\n- Composition details\n- ${NO_TEXT_INSTRUCTION}`
    : `- Exact background description with colors\n- Product placement and size\n- Lighting style and mood\n- Text overlays with exact copy (headline, subheadline, CTA)\n- Color palette\n- Style references\n- Composition details`;

  const arabicFieldsInstruction = isArabic
    ? `\n- headline_ar: Arabic headline (5-8 words, bold and punchy)\n- subheadline_ar: Arabic subheadline (8-12 words, supporting the headline)\n- cta_ar: Arabic CTA button text (2-4 words)`
    : "";

  const briefResponse = await anthropic.messages.create({
    model:      "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{
      role:    "user",
      content: [{
        type:   "image",
        source: {
          type:       "base64",
          media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
          data:       base64Image,
        },
      }, {
        type: "text",
        text: `You are the world's best e-commerce ad creative director. You have created winning static ads for brands like Gymshark, MVMT, Dollar Shave Club, Hims, Athletic Greens, and hundreds of 8-figure DTC brands.

The user has uploaded a product image and this brief: "${prompt || "premium product ad creative"}"

Generate 4 completely different Meta Ads static creative concepts using this product. Each must use a different angle:

CONCEPT 1 — HERO PRODUCT SHOT:
Product as the absolute hero. Clean premium background. Bold composition. Minimal clutter. Think Apple product photography.

CONCEPT 2 — LIFESTYLE/EMOTION:
Show the transformation or result. Lead with emotion and aspiration. Person using or benefiting from the product. Warm and relatable.

CONCEPT 3 — SOCIAL PROOF/UGC STYLE:
Raw and authentic feel. Before/after or testimonial style. Numbers and proof. "50,000+ customers" type angle. High trust.

CONCEPT 4 — PATTERN INTERRUPT:
Bold, unexpected, scroll-stopping. Contrarian headline. Humor or shock. Something nobody else in the niche is doing.

For each concept write a detailed image generation prompt that incorporates the product. Include:
${imagePromptInstruction}

Return ONLY a valid JSON array with exactly 4 objects, no markdown, no explanation. Each object must have:
- angle (short concept name, e.g. "Hero Product Shot")
- prompt (detailed image generation prompt, 100-150 words)
- headline (main ad headline in English, under 8 words)
- rationale (one sentence on why this angle converts)${arabicFieldsInstruction}`,
      }],
    }],
  });

  const rawText = briefResponse.content[0].type === "text"
    ? briefResponse.content[0].text.trim()
    : "";
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let briefs: CreativeBrief[];
  try {
    briefs = JSON.parse(cleaned) as CreativeBrief[];
    if (!Array.isArray(briefs) || briefs.length === 0) throw new Error("Not an array");
    console.log(`[step1] Got ${briefs.length} briefs:`, briefs.map(b => b.angle));
  } catch (e) {
    console.error("[step1] Failed to parse Claude response:", e, rawText.slice(0, 200));
    return NextResponse.json({ error: "Failed to generate creative briefs" }, { status: 500 });
  }

  /* ── Step 2: Generate 4 images in parallel (each with product image) ── */
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY! });

  console.log("[step2] Starting 4 parallel image generations...");
  const t2 = Date.now();

  const imagePromises = briefs.map(async (brief, i): Promise<CreativeResult | null> => {
    const t = Date.now();
    try {
      const geminiInstruction = isArabic
        ? `Create a premium high-converting Meta Ads static creative. Keep the product exactly as shown — do not redraw or modify it. Build a professional DTC advertising layout around the product. ${brief.prompt}. Style: premium brand advertising, scroll-stopping, high contrast, clean composition. ${NO_TEXT_INSTRUCTION}`
        : `Create a premium high-converting Meta Ads static creative. Keep the product exactly as shown — do not redraw or modify it. Build a professional DTC advertising layout around the product. ${brief.prompt}. Style: premium brand advertising, scroll-stopping, high contrast, clean composition.`;

      const response = await ai.models.generateContent({
        model:    "gemini-3-pro-image-preview",
        contents: [
          { inlineData: { mimeType, data: base64Image } },
          { text: geminiInstruction },
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "1:1" },
        },
      });

      const parts     = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p) => !!p.inlineData);

      if (!imagePart?.inlineData) {
        console.log(`[step2][${i}] No image in response after ${Date.now() - t}ms`);
        return null;
      }

      console.log(`[step2][${i}] ✓ ${brief.angle} — ${Date.now() - t}ms`);
      return {
        url:       `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`,
        angle:     brief.angle,
        headline:  brief.headline,
        rationale: brief.rationale,
      };
    } catch (err) {
      console.error(`[step2][${i}] ${brief.angle} failed after ${Date.now() - t}ms:`,
        err instanceof Error ? err.message.slice(0, 120) : err);
      return null;
    }
  });

  const results = await Promise.all(imagePromises);
  const images  = results.filter((r): r is CreativeResult => r !== null);

  console.log(`[step2] Done in ${Date.now() - t2}ms — ${images.length}/4 images generated`);

  if (images.length === 0) {
    return NextResponse.json({ error: "No images generated" }, { status: 500 });
  }

  // Extract Arabic texts from briefs when in Arabic mode
  const arabicTexts: ArabicTextData[] = isArabic
    ? briefs.map(b => ({
        headline:    b.headline_ar    ?? "",
        subheadline: b.subheadline_ar ?? "",
        cta:         b.cta_ar         ?? "",
      }))
    : [];

  return NextResponse.json({
    images,
    briefs,
    ...(isArabic ? { arabicTexts } : {}),
  });
}
