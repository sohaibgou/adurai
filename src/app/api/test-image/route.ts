import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_AI_KEY not found in environment" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: "A red apple on a white background",
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  const parts     = response.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find((p) => !!p.inlineData);

  if (!imagePart?.inlineData) {
    return NextResponse.json({ error: "No image in response", success: false });
  }

  return NextResponse.json({
    success:   true,
    hasImage:  true,
    modelUsed: "gemini-3.1-flash-image-preview",
  });
}

export async function POST(req: Request) {
  const { prompt } = await req.json() as { prompt: string };

  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_AI_KEY not found in environment" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: prompt,
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });

  const parts     = response.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find((p) => !!p.inlineData);

  if (!imagePart?.inlineData) {
    return NextResponse.json({ error: "No image in response" }, { status: 500 });
  }

  const base64 = imagePart.inlineData.data;
  const mime   = imagePart.inlineData.mimeType || "image/png";
  return NextResponse.json({ images: [`data:${mime};base64,${base64}`] });
}
