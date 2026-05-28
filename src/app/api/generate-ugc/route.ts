/**
 * POST /api/generate-ugc
 *
 * Two-step UGC video pipeline:
 *   1. Claude writes an authentic UGC script + model-specific video prompt
 *   2. fal.ai generates the video — model auto-selected from hookType:
 *        Testimonial Style | Problem/Solution  → Seedance 2.0 (human UGC feel)
 *        Direct Offer      | Shocking Fact     → Kling V3 Pro (product showcase)
 *        everything else                       → Seedance 2.0 (default)
 *
 * FormData fields: image, productDescription, hookType, creatorStyle,
 *                  language, duration, aspectRatio
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { FAL_MODELS, generateVideo } from "@/lib/fal-client";

export const maxDuration = 120;
export const dynamic     = "force-dynamic";

interface ScriptData {
  script:      string;
  videoPrompt: string;
  hook:        string;
}

export async function POST(req: NextRequest) {
  /* ── Parse form data ────────────────────────────────────────────────────── */
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const imageFile    = formData.get("image")              as File   | null;
  const productDesc  = formData.get("productDescription") as string | null;
  const hookType     = (formData.get("hookType")     as string) || "";
  const creatorStyle = (formData.get("creatorStyle") as string) || "";
  const language     = (formData.get("language")     as string) || "English";
  const duration     = parseInt(formData.get("duration") as string || "10", 10);
  const aspectRatio  = (formData.get("aspectRatio") as string) || "9:16";

  if (!imageFile || !productDesc?.trim()) {
    return NextResponse.json({ error: "Product image and description are required" }, { status: 400 });
  }

  /* ── Convert image → base64 data URL ───────────────────────────────────── */
  const imageBytes   = await imageFile.arrayBuffer();
  const base64Image  = Buffer.from(imageBytes).toString("base64");
  const mimeType     = imageFile.type || "image/jpeg";
  const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

  /* ── Choose model from hook type ────────────────────────────────────────── */
  const model = (
    hookType === "Testimonial Style" || hookType === "Problem/Solution"
  ) ? FAL_MODELS.UGC_HUMAN : FAL_MODELS.UGC_PRODUCT;

  const isSeedance = model === FAL_MODELS.UGC_HUMAN;

  /* ── Step 1: Claude writes UGC script + video prompt ───────────────────── */
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let scriptData: ScriptData;

  const modelPromptGuidance = isSeedance
    ? `Write a Seedance 2.0 optimized video prompt. Include: handheld camera movement, natural lighting, sound cues, multi-shot cuts, authentic human motion. UGC style. Example format: 'Handheld close-up of hands holding the product, pulling back to reveal a real person in a natural setting. Soft morning light. Sound of the product opening, then warm ambient music. Person looks at camera and smiles.'`
    : `Write a Kling V3 Pro optimized video prompt. Include: product hero shot, premium lighting, smooth cinematic camera movement, brand aesthetic. Focus on the product looking aspirational and high-quality.`;

  try {
    const claudeRes = await anthropic.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 900,
      messages: [{
        role: "user",
        content: `You are the world's best UGC ad scriptwriter for Meta Ads. You write scripts for 8-figure DTC brands.

Product: ${productDesc}
Hook type: ${hookType}
Creator style: ${creatorStyle}
Language: ${language}
Duration: ${duration} seconds

Write a UGC-style video script that feels 100% authentic — like a real customer or creator talking, NOT a corporate ad.

Rules:
- First 1.5 seconds = hook that STOPS the scroll
- Speak directly to the viewer's pain or desire
- Sound natural and conversational
- Include specific product details from the description
- End with a clear, urgent CTA
- Write in ${language}
${language === "Darija" ? "- Use Moroccan Darija dialect (mix of Arabic and French typical in Morocco)" : ""}
${language === "Arabic" ? "- Use Modern Standard Arabic suitable for Gulf/MENA ads" : ""}

${modelPromptGuidance}

Return ONLY valid JSON with no markdown:
{
  "script": "full voiceover script here",
  "videoPrompt": "detailed scene and motion description here",
  "hook": "first 1-2 sentences of script only"
}`,
      }],
    });

    const raw = claudeRes.content[0].type === "text" ? claudeRes.content[0].text : "";
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Claude response");
    scriptData = JSON.parse(jsonMatch[0]) as ScriptData;
  } catch (e) {
    console.error("[generate-ugc] Claude error:", e);
    return NextResponse.json({ error: "Failed to generate UGC script" }, { status: 500 });
  }

  /* ── Step 2: Generate video via fal.ai ──────────────────────────────────── */
  try {
    const videoUrl = await generateVideo({
      model,
      prompt:      scriptData.videoPrompt,
      imageUrl:    imageDataUrl,
      duration,
      aspectRatio,
    });

    if (!videoUrl) {
      return NextResponse.json({ error: "Video generation returned no URL" }, { status: 500 });
    }

    return NextResponse.json({
      videoUrl,
      clip2Url:   null,
      script:     scriptData.script,
      hook:       scriptData.hook,
      duration,
      needsMerge: false,
      model:      isSeedance ? "seedance" : "kling",
    });
  } catch (e) {
    console.error("[generate-ugc] fal.ai error:", e);
    return NextResponse.json({ error: "Video generation failed. Please try again." }, { status: 500 });
  }
}
