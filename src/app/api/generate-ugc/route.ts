/**
 * POST /api/generate-ugc
 *
 * Two-step UGC video pipeline:
 *   1. Claude writes an authentic UGC script + Kling video prompt
 *   2. fal.ai Kling v1.6 Pro generates the video from the product image
 *
 * For 15 s videos, two 10 s + 5 s clips are generated and returned separately.
 * FormData fields: image, productDescription, hookType, creatorStyle, language, duration, aspectRatio
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";

export const maxDuration = 120;
export const dynamic     = "force-dynamic";

const KLING = "fal-ai/kling-video/v1.6/pro/image-to-video";

interface ScriptData {
  script:      string;
  videoPrompt: string;
  hook:        string;
}

interface KlingOutput {
  data?: { video?: { url?: string } };
}

export async function POST(req: NextRequest) {
  /* ── Parse form data ────────────────────────────────────────────────────── */
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const imageFile    = formData.get("image")              as File   | null;
  const productDesc  = formData.get("productDescription") as string | null;
  const hookType     = formData.get("hookType")           as string;
  const creatorStyle = formData.get("creatorStyle")       as string;
  const language     = formData.get("language")           as string;
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

  /* ── Step 1: Claude writes UGC script ──────────────────────────────────── */
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let scriptData: ScriptData;

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

Also write a detailed Kling AI video generation prompt (in English regardless of language):
- Scene: where is the person, what is the setting (bedroom, kitchen, gym, outdoors, etc.)
- Person: what they look like, what they are doing with the product
- Camera: movement style (slow zoom, handheld feel, close-up reveal, pull-back)
- Lighting: natural window light, warm golden hour, studio ring-light, etc.
- Mood: matches ${creatorStyle} style exactly
- Motion: natural everyday movements, authentic unscripted feel
- Product should be clearly featured and recognizable
- Avoid text, watermarks, logos in the frame

Return ONLY valid JSON with no markdown:
{
  "script": "full voiceover script here",
  "videoPrompt": "detailed scene and motion description for Kling AI here",
  "hook": "first 1-2 sentences of script only"
}`,
      }],
    });

    const raw = claudeRes.content[0].type === "text" ? claudeRes.content[0].text : "";
    // Strip markdown code fences if Claude wrapped it
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Claude response");
    scriptData = JSON.parse(jsonMatch[0]) as ScriptData;
  } catch (e) {
    console.error("[generate-ugc] Claude error:", e);
    return NextResponse.json({ error: "Failed to generate UGC script" }, { status: 500 });
  }

  /* ── Step 2: fal.ai Kling video generation ──────────────────────────────── */
  fal.config({ credentials: process.env.FAL_KEY });

  // Kling v1.6 supports "5" or "10" seconds only
  const klingDuration = duration >= 10 ? "10" : "5";
  const klingRatio    = aspectRatio === "9:16" ? "9:16" : aspectRatio === "1:1" ? "1:1" : "16:9";

  try {
    const videoResult = await fal.subscribe(KLING, {
      input: {
        prompt:          scriptData.videoPrompt,
        image_url:       imageDataUrl,
        duration:        klingDuration,
        aspect_ratio:    klingRatio,
        negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, text overlay, watermark, logo, subtitles",
      },
      logs: true,
      onQueueUpdate: (update: { status: string }) => {
        console.log("[generate-ugc] Kling:", update.status);
      },
    }) as KlingOutput;

    const videoUrl = videoResult.data?.video?.url;
    if (!videoUrl) {
      return NextResponse.json({ error: "Video generation returned no URL" }, { status: 500 });
    }

    /* ── 15 s: second 5 s clip (CTA moment) ─────────────────────────────── */
    if (duration === 15) {
      try {
        const clip2Result = await fal.subscribe(KLING, {
          input: {
            prompt:       `${scriptData.videoPrompt} — final CTA moment, product close-up, viewer looking at camera`,
            image_url:    imageDataUrl,
            duration:     "5",
            aspect_ratio: klingRatio,
          },
          logs: false,
        }) as KlingOutput;

        return NextResponse.json({
          videoUrl,
          clip2Url:  clip2Result.data?.video?.url ?? null,
          script:    scriptData.script,
          hook:      scriptData.hook,
          duration,
          needsMerge: true,
        });
      } catch (e2) {
        console.error("[generate-ugc] clip2 error (falling back to single clip):", e2);
        // Fall through to single-clip return
      }
    }

    return NextResponse.json({
      videoUrl,
      clip2Url:   null,
      script:     scriptData.script,
      hook:       scriptData.hook,
      duration,
      needsMerge: false,
    });
  } catch (e) {
    console.error("[generate-ugc] Kling error:", e);
    return NextResponse.json({ error: "Video generation failed. Please try again." }, { status: 500 });
  }
}
