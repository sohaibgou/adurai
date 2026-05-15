import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic    = "force-dynamic";

// Single-image regeneration — takes a pre-built brief prompt, skips Claude step
export async function POST(req: Request) {
  const { prompt } = await req.json() as { prompt: string };

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY! });

  const response = await ai.models.generateContent({
    model:    "gemini-3-pro-image-preview",
    contents: prompt,
    config:   { responseModalities: ["TEXT", "IMAGE"] },
  });

  const parts     = response.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find((p) => !!p.inlineData);

  if (!imagePart?.inlineData) {
    return NextResponse.json({ error: "No image generated" }, { status: 500 });
  }

  const base64 = imagePart.inlineData.data;
  const mime   = imagePart.inlineData.mimeType || "image/png";
  return NextResponse.json({ url: `data:${mime};base64,${base64}` });
}
