import { NextRequest, NextResponse } from "next/server";
import { requireEmailVerified } from "@/lib/require-email-verified";

export const maxDuration = 60;
export const dynamic    = "force-dynamic";

/* ── Nanobanana models (latest first) ── */
const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
];

/* ── Single-image regeneration using nanobanana approach ── */
export async function POST(req: NextRequest) {
  const check = await requireEmailVerified(req);
  if (check instanceof NextResponse) return check;

  const { prompt, isArabic } = await req.json() as { prompt: string; isArabic?: boolean };

  const apiKey      = process.env.GOOGLE_AI_KEY!;
  const finalPrompt = isArabic
    ? `${prompt} CRITICAL: The image must contain absolutely NO text, letters, words, numbers, Arabic script, or any written characters anywhere. Pure visual only.`
    : prompt;

  for (const model of IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body:    JSON.stringify({
            contents:         [{ parts: [{ text: finalPrompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
      );

      if (!res.ok) {
        console.error(`[generate-one] ${model} HTTP ${res.status}`);
        continue;
      }

      const json = await res.json() as {
        candidates?: { content: { parts: { inlineData?: { data: string; mimeType: string } }[] } }[];
        error?:      { message: string };
      };

      if (json.error) {
        console.error(`[generate-one] ${model} error:`, json.error.message);
        continue;
      }

      const parts   = json.candidates?.[0]?.content?.parts ?? [];
      const imgPart = parts.find((p) => !!p.inlineData);
      if (imgPart?.inlineData) {
        console.log(`[generate-one] ✓ ${model}`);
        const { data, mimeType } = imgPart.inlineData;
        return NextResponse.json({ url: `data:${mimeType || "image/jpeg"};base64,${data}` });
      }
    } catch (err) {
      console.error(`[generate-one] ${model} threw:`, err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ error: "No image generated." }, { status: 500 });
}
