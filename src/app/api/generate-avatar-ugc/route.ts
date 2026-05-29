/**
 * POST /api/generate-avatar-ugc
 *
 * Higgsfield-style avatar UGC pipeline — 4 stages:
 *   1. Claude  → UGC script  + avatar video prompt
 *   2. fal.ai  → Kling v2.1 Master avatar video  (image-to-video)
 *   3. ElevenLabs → voiceover MP3  (skipped if ELEVENLABS_API_KEY unset)
 *   4. fal.ai  → sync-lipsync  (skipped if no audio)
 *
 * FormData fields:
 *   image?          File    — product photo (mutually exclusive with productUrl)
 *   productUrl?     string  — website / SaaS URL (screenshot used as product image)
 *   avatarId        string  — one of the AVATAR_PRESETS keys
 *   productDescription string
 *   hookType        string
 *   creatorStyle    string
 *   language        string
 *   duration        string  — "5" | "10" | "15"
 *   aspectRatio     string  — "9:16" | "1:1" | "16:9"
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateAvatarVideo,
  lipSyncVideo,
  uploadToFalStorage,
  fal,
} from "@/lib/fal-client";
import { generateSpeech } from "@/lib/elevenlabs";

export const maxDuration = 300;
export const dynamic     = "force-dynamic";

/* ── Avatar presets (must mirror creative-studio.tsx) ──────────────────── */
const AVATAR_PRESETS: Record<string, { voiceId: string; videoPrompt: string }> = {
  sarah: {
    voiceId:     "21m00Tcm4TlvDq8ikWAM",
    videoPrompt: "A confident young woman in her mid-20s wearing casual lifestyle clothes",
  },
  maya: {
    voiceId:     "EXAVITQu4vr4xnSDxMaL",
    videoPrompt: "A professional woman in her early 30s wearing smart casual attire",
  },
  zoe: {
    voiceId:     "MF3mGyEYCl7XYWbV9V6O",
    videoPrompt: "A trendy young woman in her early 20s wearing fashionable streetwear",
  },
  alex: {
    voiceId:     "pNInz6obpgDQGcFmaJgB",
    videoPrompt: "A friendly young man in his mid-20s wearing casual everyday clothes",
  },
  jordan: {
    voiceId:     "ErXwobaYiN019PkySvjV",
    videoPrompt: "A confident man in his early 30s wearing smart business casual attire",
  },
  marcus: {
    voiceId:     "TxGEqnHWrfWFTfGW9XjX",
    videoPrompt: "A tech-savvy young man in his late 20s wearing a clean minimalist outfit",
  },
};

interface ScriptData {
  script:      string;
  videoPrompt: string;
  hook:        string;
}

export async function POST(req: NextRequest) {
  /* ── 1. Parse form data ─────────────────────────────────────────────────── */
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const imageFile        = formData.get("image")              as File   | null;
  const productUrl       = (formData.get("productUrl")        as string | null)?.trim() || null;
  const avatarImageFile  = formData.get("avatarImageFile")    as File   | null;
  const avatarImageUrl   = (formData.get("avatarImageUrl")    as string | null)?.trim() || null;
  const avatarId         = (formData.get("avatarId")          as string) || "sarah";
  const productDesc      = (formData.get("productDescription") as string | null)?.trim() || "";
  const hookType         = (formData.get("hookType")          as string) || "Problem/Solution";
  const creatorStyle     = (formData.get("creatorStyle")      as string) || "Natural/Authentic";
  const language         = (formData.get("language")          as string) || "English";
  const duration         = parseInt(formData.get("duration")  as string || "10", 10);
  const aspectRatio      = (formData.get("aspectRatio")       as string) || "9:16";

  if (!imageFile && !productUrl) {
    return NextResponse.json({ error: "Provide either a product image or a product URL" }, { status: 400 });
  }
  if (!productDesc) {
    return NextResponse.json({ error: "Product description is required" }, { status: 400 });
  }

  const avatar = AVATAR_PRESETS[avatarId] ?? AVATAR_PRESETS["sarah"];

  fal.config({ credentials: process.env.FAL_KEY });

  /* ── 2a. Resolve AVATAR image URL (used as start_image_url for Kling) ──── */
  // Priority: custom upload > preset photo URL > fallback to product image
  let avatarStartUrl: string | null = null;

  if (avatarImageFile) {
    try {
      const bytes = await avatarImageFile.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob  = new Blob([new Uint8Array(bytes) as any], { type: avatarImageFile.type || "image/jpeg" });
      const file  = new File([blob], avatarImageFile.name || "avatar.jpg", { type: avatarImageFile.type || "image/jpeg" });
      avatarStartUrl = await fal.storage.upload(file);
    } catch (e) {
      console.error("[generate-avatar-ugc] avatar upload error:", e);
    }
  } else if (avatarImageUrl) {
    avatarStartUrl = avatarImageUrl; // randomuser.me URL is already public
  }

  /* ── 2b. Resolve PRODUCT image URL ─────────────────────────────────────── */
  let productImageUrl: string;

  if (productUrl) {
    try {
      const proto   = req.headers.get("x-forwarded-proto") ?? "https";
      const host    = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
      const base    = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/$/, "") || `${proto}://${host}`;
      const ssRes   = await fetch(`${base}/api/screenshot-url`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: productUrl }),
      });
      const ssData  = await ssRes.json() as { screenshotUrl?: string; error?: string };
      if (!ssData.screenshotUrl) throw new Error(ssData.error ?? "Screenshot failed");
      productImageUrl = ssData.screenshotUrl;
    } catch (e) {
      console.error("[generate-avatar-ugc] screenshot error:", e);
      return NextResponse.json({ error: "Could not screenshot the product URL. Try uploading an image instead." }, { status: 422 });
    }
  } else {
    try {
      const bytes  = await imageFile!.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob   = new Blob([new Uint8Array(bytes) as any], { type: imageFile!.type || "image/jpeg" });
      const file   = new File([blob], imageFile!.name || "product.jpg", { type: imageFile!.type || "image/jpeg" });
      productImageUrl = await fal.storage.upload(file);
    } catch (e) {
      console.error("[generate-avatar-ugc] product image upload error:", e);
      return NextResponse.json({ error: "Failed to upload product image" }, { status: 500 });
    }
  }

  // Kling start frame: avatar photo if available, else product image
  const klingStartUrl = avatarStartUrl ?? productImageUrl;

  /* ── 3. Claude — script + avatar video prompt ───────────────────────────── */
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let scriptData: ScriptData;

  try {
    const claudeRes = await anthropic.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are the world's best UGC ad scriptwriter for Meta Ads. You write scripts for 8-figure DTC brands.

Product: ${productDesc}
Hook type: ${hookType}
Creator style: ${creatorStyle}
Language: ${language}
Duration: ${duration} seconds
Avatar: ${avatar.videoPrompt}

Write a UGC-style video script that feels 100% authentic — like a real customer or creator talking to camera.

Rules:
- First 1.5 seconds = scroll-stopping hook
- Speak directly to viewer's pain or desire
- Natural, conversational tone — NOT corporate
- Include specific product details from the description
- End with urgent CTA
- Write in ${language}
${language === "Darija" ? "- Use Moroccan Darija dialect (Arabic-French mix)" : ""}
${language === "Arabic" ? "- Use Modern Standard Arabic suitable for Gulf/MENA" : ""}

Also write a Kling v2.1 video generation prompt describing the avatar VISUALLY:
- Avatar: "${avatar.videoPrompt} picks up the product and holds it confidently toward the camera, face clearly visible, mouth slightly open as if speaking"
- Scene: clean modern lifestyle setting (kitchen counter / bright living room / home office)
- Camera: close-up handheld, slight natural shake, authentic UGC feel
- Lighting: natural soft daylight from window
- The product MUST be clearly visible in the avatar's hands
- End the prompt with: "mouth moving naturally, talking to camera, authentic UGC creator style"

Return ONLY valid JSON with no markdown:
{
  "script": "full voiceover script here",
  "videoPrompt": "Kling v2.1 optimized avatar + product scene description",
  "hook": "first 1-2 sentences of script only"
}`,
      }],
    });

    const raw       = claudeRes.content[0].type === "text" ? claudeRes.content[0].text : "";
    const cleaned   = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");
    scriptData = JSON.parse(jsonMatch[0]) as ScriptData;
  } catch (e) {
    console.error("[generate-avatar-ugc] Claude error:", e);
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 });
  }

  /* ── 4. Generate avatar video — Kling v2.1 Master ───────────────────────── */
  let rawVideoUrl: string;

  try {
    const url = await generateAvatarVideo({
      prompt:      scriptData.videoPrompt,
      imageUrl:    klingStartUrl,
      duration,
      aspectRatio,
    });
    if (!url) throw new Error("Kling returned no video URL");
    rawVideoUrl = url;
  } catch (e) {
    console.error("[generate-avatar-ugc] Kling error:", e);
    return NextResponse.json({ error: "Avatar video generation failed. Please try again." }, { status: 500 });
  }

  /* ── 5. Voiceover — ElevenLabs TTS ─────────────────────────────────────── */
  let audioUrl: string | null = null;

  const audioBuffer = await generateSpeech(scriptData.script, avatar.voiceId);
  if (audioBuffer) {
    try {
      audioUrl = await uploadToFalStorage(audioBuffer, "audio/mpeg", "voiceover.mp3");
    } catch (e) {
      console.error("[generate-avatar-ugc] audio upload error (continuing without):", e);
    }
  }

  /* ── 6. Lip sync — fal sync-lipsync ────────────────────────────────────── */
  let finalVideoUrl = rawVideoUrl;

  if (audioUrl) {
    try {
      const synced = await lipSyncVideo({ videoUrl: rawVideoUrl, audioUrl });
      if (synced) finalVideoUrl = synced;
    } catch (e) {
      console.error("[generate-avatar-ugc] lipsync error (using raw video):", e);
      // Fall back to raw video — voiceover lost but video still returns
    }
  }

  /* ── 7. Return ──────────────────────────────────────────────────────────── */
  return NextResponse.json({
    videoUrl:    finalVideoUrl,
    audioUrl,
    script:      scriptData.script,
    hook:        scriptData.hook,
    duration,
    hasVoiceover: !!audioUrl,
    hasLipsync:   !!audioUrl && finalVideoUrl !== rawVideoUrl,
  });
}
