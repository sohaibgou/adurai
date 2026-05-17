import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const maxDuration = 120;
export const dynamic    = "force-dynamic";

export interface ArabicTextData {
  headline:    string;
  subheadline: string;
  cta:         string;
}

const ANGLES = [
  {
    angle:  "Hero Shot",
    suffix: "Product hero shot. Clean premium background. Minimal composition. Apple-style product photography. Professional studio lighting.",
  },
  {
    angle:  "Lifestyle",
    suffix: "Lifestyle and emotion angle. Show transformation and aspiration. Warm relatable mood. Person benefiting from product.",
  },
  {
    angle:  "Social Proof",
    suffix: "Social proof angle. Raw authentic feel. High credibility visual. Bold statistics layout.",
  },
  {
    angle:  "Pattern Interrupt",
    suffix: "Bold unexpected scroll-stopping composition. Contrarian angle. High contrast. Something nobody else is doing.",
  },
];

const NO_TEXT_SUFFIX =
  "CRITICAL: The image must contain absolutely NO text, letters, words, numbers, Arabic script, or any written characters anywhere. Pure visual only — no captions, no headlines, no watermarks.";

async function generateArabicCopy(
  anthropic: Anthropic,
  userPrompt: string,
): Promise<ArabicTextData[]> {
  const response = await anthropic.messages.create({
    model:      "claude-haiku-4-5",
    max_tokens: 600,
    messages: [{
      role:    "user",
      content: `You are a professional Arabic advertising copywriter. Generate 4 Arabic ad copy sets for this brief: "${userPrompt}"

Angles (in order): Hero Shot, Lifestyle, Social Proof, Pattern Interrupt.

Return ONLY a valid JSON array with exactly 4 objects. No markdown, no explanation. Each object:
- headline: Arabic headline (5-8 words, bold and punchy)
- subheadline: Arabic subheadline (8-12 words, supporting the headline)
- cta: Arabic CTA button text (2-4 words)`,
    }],
  });

  const raw     = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as ArabicTextData[];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const { prompt, isArabic } = await req.json() as { prompt: string; isArabic?: boolean };

  const anthropic = isArabic ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }) : null;

  // Kick off Arabic copy + image generation in parallel
  const arabicCopyPromise = isArabic && anthropic
    ? generateArabicCopy(anthropic, prompt)
    : Promise.resolve<ArabicTextData[]>([]);

  const imagePromises = ANGLES.map(async ({ angle, suffix }) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY! });

    const fullPrompt = isArabic
      ? `Premium high-converting Meta Ads static creative. ${prompt}. ${suffix} Professional DTC brand advertising quality. Scroll-stopping visual. ${NO_TEXT_SUFFIX}`
      : `Premium high-converting Meta Ads static creative. ${prompt}. ${suffix} Professional DTC brand advertising quality. Scroll-stopping visual.`;

    try {
      const response = await ai.models.generateContent({
        model:    "gemini-3-pro-image-preview",
        contents: fullPrompt,
        config:   {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "1:1" },
        },
      });

      const parts     = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p) => !!p.inlineData);
      if (!imagePart?.inlineData) return null;

      const base64 = imagePart.inlineData.data;
      const mime   = imagePart.inlineData.mimeType || "image/png";
      return { url: `data:${mime};base64,${base64}`, angle, headline: "", rationale: "" };
    } catch {
      return null;
    }
  });

  const [imageResults, arabicTexts] = await Promise.all([
    Promise.all(imagePromises),
    arabicCopyPromise,
  ]);

  const images = imageResults.filter(Boolean);

  return NextResponse.json({
    images,
    ...(isArabic ? { arabicTexts } : {}),
  });
}
