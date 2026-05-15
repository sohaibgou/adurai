import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: Request) {
  const { prompt } = await req.json() as { prompt: string };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  console.log("━━━ /api/enhance-prompt ━━━");
  console.log("INPUT:", prompt);

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Expand this into a detailed Ideogram image generation prompt for a premium Meta Ad creative. Make it specific about composition, lighting, background, text overlay if relevant, and visual style. Keep it under 200 words. Output only the prompt text, no explanations or quotes.

Input: ${prompt.trim()}`,
      },
    ],
  });

  const enhanced = message.content[0].type === "text" ? message.content[0].text.trim() : null;
  console.log("ENHANCED:", enhanced);

  return NextResponse.json({ enhanced });
}
