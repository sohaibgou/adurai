import { NextResponse } from "next/server";

/**
 * GET /api/debug-creative
 * Tests every model + modality combination and returns the raw result.
 * Remove this route before going to production.
 */

const TEST_PROMPT =
  "A red apple on a white table. Simple product photography.";

const CANDIDATES = [
  { model: "nano-banana-pro-preview",                  modalities: ["TEXT", "IMAGE"] },
  { model: "gemini-2.0-flash-preview-image-generation", modalities: ["TEXT", "IMAGE"] },
  { model: "gemini-2.0-flash-preview-image-generation", modalities: ["IMAGE"] },
  { model: "gemini-2.0-flash-exp-image-generation",     modalities: ["TEXT", "IMAGE"] },
  { model: "gemini-2.0-flash-exp",                      modalities: ["TEXT", "IMAGE"] },
  { model: "gemini-2.0-flash-exp",                      modalities: ["IMAGE"] },
  { model: "gemini-2.0-flash",                          modalities: ["TEXT", "IMAGE"] },
  { model: "gemini-1.5-flash",                          modalities: ["TEXT", "IMAGE"] },
];

export async function GET() {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_AI_KEY not set" }, { status: 500 });
  }

  const results: Record<string, unknown>[] = [];

  for (const { model, modalities } of CANDIDATES) {
    const label = `${model} | modalities: ${modalities.join(",")}`;
    let status = 0;
    let hasImage = false;
    let errorMsg: string | null = null;
    let rawSnippet = "";

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents:         [{ parts: [{ text: TEST_PROMPT }] }],
            generationConfig: { responseModalities: modalities },
          }),
        },
      );

      status = res.status;
      const text = await res.text();
      rawSnippet = text.slice(0, 400);

      try {
        const data = JSON.parse(text) as {
          candidates?: { content: { parts: { inlineData?: unknown }[] } }[];
          error?: { message: string };
        };
        errorMsg = data.error?.message ?? null;
        hasImage = !!(data.candidates?.[0]?.content?.parts?.some((p) => "inlineData" in p));
      } catch {
        errorMsg = "non-JSON response";
      }
    } catch (err) {
      errorMsg = String(err);
    }

    const result = { label, status, hasImage, errorMsg, rawSnippet };
    console.log("[debug-creative]", result);
    results.push(result);

    // Small gap between requests so we don't hammer the API
    await new Promise((r) => setTimeout(r, 500));
  }

  return NextResponse.json({ apiKeyPresent: true, results }, { status: 200 });
}
