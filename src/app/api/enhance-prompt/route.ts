import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { prompt } = await req.json() as { prompt: string };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  console.log("━━━ /api/enhance-prompt ━━━");
  console.log("INPUT:", prompt);

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GOOGLE_AI_KEY! },
      body:    JSON.stringify({
        contents: [{
          parts: [{
            text: `Expand this into a detailed Gemini image generation prompt for a premium Meta Ad creative. Make it specific about composition, lighting, background, text overlay if relevant, and visual style. Keep it under 200 words. Output only the prompt text, no explanations or quotes.

Input: ${prompt.trim()}`,
          }],
        }],
      }),
    },
  );

  const json = await res.json() as { candidates?: { content: { parts: { text?: string }[] } }[] };
  const enhanced = json.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim() ?? null;
  console.log("ENHANCED:", enhanced);

  return NextResponse.json({ enhanced });
}
