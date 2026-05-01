import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { prompt, size } = (await request.json()) as {
      prompt: string;
      size?: "1024x1024" | "1024x1792" | "1792x1024";
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Image prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: size || "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      return NextResponse.json({ error: "No image was generated" }, { status: 500 });
    }

    return NextResponse.json({ imageUrl, revisedPrompt });
  } catch (error) {
    console.error("DALL-E generation error:", error);

    let message = "Failed to generate image";
    if (error instanceof Error) {
      // Surface OpenAI content policy or billing errors clearly
      if (error.message.includes("content_policy")) {
        message = "Image was rejected by content policy. Try adjusting the product description.";
      } else if (error.message.includes("billing") || error.message.includes("quota")) {
        message = "OpenAI billing limit reached. Check your API usage.";
      } else {
        message = error.message;
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
