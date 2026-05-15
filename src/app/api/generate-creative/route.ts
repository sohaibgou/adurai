import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 120;
export const dynamic    = "force-dynamic";

const ANGLES = [
  {
    angle:  "Hero Shot",
    suffix: "Product hero shot. Clean premium background. Bold headline. Minimal composition. Apple-style product photography.",
  },
  {
    angle:  "Lifestyle",
    suffix: "Lifestyle and emotion angle. Show transformation and aspiration. Warm relatable mood. Person benefiting from product.",
  },
  {
    angle:  "Social Proof",
    suffix: "Social proof angle. Raw authentic feel. Numbers and trust. Bold statistics. High credibility visual.",
  },
  {
    angle:  "Pattern Interrupt",
    suffix: "Bold unexpected scroll-stopping composition. Contrarian angle. High contrast. Something nobody else is doing.",
  },
];

export async function POST(req: Request) {
  const { prompt } = await req.json() as { prompt: string };

  const imagePromises = ANGLES.map(async ({ angle, suffix }) => {
    const ai         = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY! });
    const fullPrompt = `Premium high-converting Meta Ads static creative. ${prompt}. ${suffix} Professional DTC brand advertising quality. Scroll-stopping visual.`;

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

  const images = (await Promise.all(imagePromises)).filter(Boolean);
  return NextResponse.json({ images });
}
