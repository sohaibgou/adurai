/**
 * POST /api/generate-avatar-ugc
 *
 * fal.ai UGC pipeline — mirrors the Arcads workflow exactly:
 *   Nano Banana "person holding the product" still  →  Seedance 2.0 with
 *   native audio (dialogue baked into the prompt). The video model speaks the
 *   lines and lip-syncs itself — no ElevenLabs, no FFmpeg mux, no lip-sync pass.
 *
 * Streams real progress to the client as NDJSON so the loading bar reflects
 * actual backend work.
 *
 * Stages (each emits a {type:"progress"} NDJSON line):
 *   1. Claude       → UGC script + scene + Nano Banana image prompt + 9-layer
 *                     video prompt (dialogue embedded for native speech)
 *   2. Nano Banana  → composite "person holding the product" still
 *                     (fal-ai/nano-banana/edit, Gemini multi-image fallback)
 *   3. Seedance 2.0 → reference-to-video with generate_audio (real motion + voice)
 *   4. Supabase     → re-host final MP4 → public CDN URL → save to library
 *
 * Response: Content-Type application/x-ndjson, one JSON object per line:
 *   {"type":"progress","stage":1,"progress":20}
 *   {"type":"done","videoUrl":"…","script":"…","hook":"…","scene":"…", …}
 *   {"type":"error","error":"…"}
 *
 * Plan / usage errors are returned as a normal JSON NextResponse (non-200)
 * BEFORE streaming starts, so the client can branch on res.ok.
 *
 * FormData fields: image | productUrl, avatarImageFile | avatarImageUrl,
 *   avatarId, productDescription, hookType, creatorStyle, language,
 *   duration ("5"|"10"|"15"), aspectRatio, resolution
 */
import { NextRequest, NextResponse } from "next/server";
import { checkUsage } from "@/lib/check-usage";
import { supabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import {
  composeHeldProductImage,
  generateVideo,
  lipSyncVideo,
  uploadToFalStorage,
  FAL_MODELS,
  falAvailable,
} from "@/lib/fal-client";
import { synthesizeArabicSpeech } from "@/lib/google-tts";

/**
 * Upload raw bytes to Supabase Storage (ugc-videos bucket) and return a
 * public CDN URL. Used for product/avatar images, composed start frames,
 * and the final video.
 */
async function uploadAsset(
  data:        Buffer | Uint8Array,
  fileName:    string,
  contentType: string = "image/jpeg",
): Promise<string> {
  const key = `assets/${fileName}`;
  const { error } = await supabaseAdmin.storage
    .from("ugc-videos")
    .upload(key, data, { contentType, upsert: true });
  if (error) throw new Error(`Supabase asset upload failed: ${error.message}`);
  const { data: urlData } = supabaseAdmin.storage.from("ugc-videos").getPublicUrl(key);
  if (!urlData?.publicUrl) throw new Error("Supabase: no public URL returned for asset");
  return urlData.publicUrl;
}

export const maxDuration = 300;
export const dynamic     = "force-dynamic";

interface ScriptData {
  scene:       string;
  script:      string;
  imagePrompt: string; // Nano Banana product-showcase still (person holding product)
  videoPrompt: string; // scene-direction animation prompt with dialogue embedded
  hook:        string;
  videoStyle?: string; // auto-selected creative direction (unboxing | review | …)
  hookText?:   string; // ≤5-word text-overlay hook
}

/**
 * Gemini multi-image fallback for the Nano Banana compose step. Downloads each
 * input image, base64-encodes them, and asks gemini-*-image to produce a single
 * composite "person holding the product" still. Returns a Supabase public URL,
 * or null on failure.
 */
async function composeWithGemini(prompt: string, imageUrls: string[], ts: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return null;

  const inlineParts = await Promise.all(
    imageUrls.map(async (url) => {
      const res   = await fetch(url);
      const buf   = Buffer.from(await res.arrayBuffer());
      const mime  = res.headers.get("content-type") || "image/jpeg";
      return { inlineData: { mimeType: mime, data: buf.toString("base64") } };
    }),
  );

  const MODELS = ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"];
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body:    JSON.stringify({
            contents: [{ parts: [...inlineParts, { text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
      );
      if (!res.ok) { console.warn(`[ugc] gemini ${model} HTTP ${res.status}`); continue; }
      const json = await res.json() as {
        candidates?: { content: { parts: { inlineData?: { data: string; mimeType: string } }[] } }[];
      };
      const part = json.candidates?.[0]?.content?.parts?.find((p) => !!p.inlineData);
      if (part?.inlineData) {
        const buf = Buffer.from(part.inlineData.data, "base64");
        return await uploadAsset(buf, `frame_gemini_${ts}.jpg`, part.inlineData.mimeType || "image/jpeg");
      }
    } catch (e) {
      console.warn(`[ugc] gemini ${model} threw:`, e instanceof Error ? e.message.slice(0, 120) : e);
    }
  }
  return null;
}

/**
 * Build the start frame Seedance animates: a photoreal still of the person
 * physically holding the product. Tries fal Nano Banana edit first, then
 * Gemini multi-image, then falls back to the raw avatar/product photo.
 */
async function composeStartFrame(opts: {
  avatarUrl:  string | null;
  productUrl: string;
  prompt:     string;
  ts:         number;
}): Promise<string> {
  // Avatar MUST be first so "the first image" references resolve correctly.
  const imageUrls = opts.avatarUrl ? [opts.avatarUrl, opts.productUrl] : [opts.productUrl];

  // Identity lock — without this, Nano Banana keeps the product/outfit but
  // reinvents the person's face & hair. Only applied when a real avatar exists.
  const prompt = opts.avatarUrl
    ? `CRITICAL IDENTITY LOCK: The FIRST image is the real creator — this exact person must appear in the output. Preserve their face, bone structure, eyes, eyebrows, nose, mouth, jawline, hairstyle, hair colour, facial hair and skin tone IDENTICALLY. Same person, same age. Do NOT beautify, slim, restyle the hair, or alter their face in any way — it must be instantly recognisable as the same individual. The SECOND image is the product — reproduce its label, colours and design exactly, and place it naturally in the person's hand. ${opts.prompt}`
    : opts.prompt;

  // 1. fal Nano Banana edit (the Arcads engine)
  if (falAvailable()) {
    try {
      const url = await composeHeldProductImage({ prompt: opts.prompt, imageUrls });
      if (url) { console.log("[ugc] compose ✓ nano-banana"); return url; }
    } catch (e) {
      console.warn("[ugc] nano-banana compose failed:", e instanceof Error ? e.message.slice(0, 160) : e);
    }
  }

  // 2. Gemini multi-image fallback
  try {
    const url = await composeWithGemini(opts.prompt, imageUrls, opts.ts);
    if (url) { console.log("[ugc] compose ✓ gemini"); return url; }
  } catch (e) {
    console.warn("[ugc] gemini compose failed:", e instanceof Error ? e.message.slice(0, 160) : e);
  }

  // 3. Last resort — use the raw photo as the start frame
  console.warn("[ugc] compose fell back to raw photo");
  return opts.avatarUrl ?? opts.productUrl;
}

/* Clamp the requested duration to Seedance 2.0's supported range (integer 4–15s). */
function videoDuration(req: number): number {
  if (!Number.isFinite(req)) return 10;
  return Math.min(15, Math.max(4, Math.round(req)));
}

/* Map UI resolution to a Seedance-supported value. */
function videoResolution(res: string): "480p" | "720p" | "1080p" {
  if (res.startsWith("480"))  return "480p";
  if (res.startsWith("720"))  return "720p";
  return "1080p";
}

/*
 * Pick the Seedance endpoint + a resolution the endpoint actually supports.
 *  - "fast"     → fast/image-to-video  ($0.242/s, 720p max, no 1080p)
 *  - "standard" → image-to-video       ($0.303/s @720p, $0.682/s @1080p)
 * Fast is the cost-optimised default. If a caller asks for 1080p on the fast
 * tier we transparently clamp to 720p (the fast endpoint has no 1080p).
 */
function selectSeedance(
  quality: string,
  res: "480p" | "720p" | "1080p",
): { model: string; resolution: "480p" | "720p" | "1080p" } {
  if (quality === "standard") {
    return { model: FAL_MODELS.SEEDANCE, resolution: res };
  }
  return {
    model:      FAL_MODELS.SEEDANCE_FAST,
    resolution: res === "1080p" ? "720p" : res,
  };
}

/* ── Arabic detection ──────────────────────────────────────────────────────
 * Seedance's native speech doesn't cover Arabic, so when the user picks an
 * Arabic dialect OR writes Arabic script in the description we generate the
 * voiceover with Google (Gemini) TTS and lip-sync it onto the video instead.
 * English (and every non-Arabic language) keeps the native Seedance path.
 */
function needsGoogleVoice(language: string, productDesc: string): boolean {
  const lang = language.trim().toLowerCase();
  if (lang === "arabic" || lang === "darija") return true;
  // Arabic + Supplement + Extended-A + Presentation Forms A/B ranges.
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(productDesc);
}

/* ─────────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  /* ── 0. Auth + plan / usage gate (non-streamed errors) ──────────────────── */
  const usageResult = await checkUsage(req, "ugc");
  if (usageResult instanceof NextResponse) return usageResult;
  const { user, plan } = usageResult;

  if (!falAvailable()) {
    return NextResponse.json(
      { error: "Video studio is not configured (FAL_API_KEY missing)" },
      { status: 503 },
    );
  }

  /* ── 1. Parse form data ─────────────────────────────────────────────────── */
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const imageFile        = formData.get("image")               as File   | null;
  const productUrl       = (formData.get("productUrl")         as string | null)?.trim() || null;
  const productImageUrlIn = (formData.get("productImageUrl")   as string | null)?.trim() || null;
  const avatarImageFile  = formData.get("avatarImageFile")     as File   | null;
  const avatarImageUrl   = (formData.get("avatarImageUrl")     as string | null)?.trim() || null;
  const avatarId         = (formData.get("avatarId")           as string) || "sarah";
  const productDesc      = (formData.get("productDescription") as string | null)?.trim() || "";
  const hookType         = (formData.get("hookType")           as string) || "Problem/Solution";
  const creatorStyle     = (formData.get("creatorStyle")       as string) || "Natural/Authentic";
  const language         = (formData.get("language")           as string) || "English";
  const durationReq      = parseInt(formData.get("duration")   as string || "10", 10);
  const aspectRatio      = (formData.get("aspectRatio")        as string) || "9:16";
  // Default 720p: Seedance 1080p costs 2.25× more ($0.68/s vs $0.30/s) for no
  // meaningful gain on mobile feeds. The UI may still request "1080p" explicitly.
  const resolutionReq    = (formData.get("resolution")         as string) || "720p";
  // "fast" (cheapest, 720p max) | "standard". Defaults to fast for cost.
  const qualityReq       = (formData.get("quality")            as string) || "fast";

  if (!imageFile && !productUrl) {
    return NextResponse.json({ error: "Provide either a product image or a product URL" }, { status: 400 });
  }
  if (!productDesc) {
    return NextResponse.json({ error: "Product description is required" }, { status: 400 });
  }

  const vidDur                       = videoDuration(durationReq);
  const { model: vidModel, resolution: vidRes } =
    selectSeedance(qualityReq, videoResolution(resolutionReq));
  const ts                           = Date.now();

  /* ── Stream everything else as NDJSON ───────────────────────────────────── */
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      const progress = (stage: number, pct: number) =>
        emit({ type: "progress", stage, progress: Math.round(pct) });

      try {
        progress(1, 4);

        /* ── 2a. Resolve AVATAR image ── */
        let avatarStartUrl: string | null = null;
        if (avatarImageFile) {
          try {
            const bytes = Buffer.from(await avatarImageFile.arrayBuffer());
            avatarStartUrl = await uploadAsset(bytes, `avatar_${ts}.jpg`, avatarImageFile.type || "image/jpeg");
          } catch (e) {
            console.error("[generate-avatar-ugc] avatar upload error:", e instanceof Error ? e.message : e);
          }
        } else if (avatarImageUrl) {
          avatarStartUrl = avatarImageUrl;
        }

        /* ── 2b. Resolve PRODUCT image ── */
        let productImageUrl: string;
        if (productImageUrlIn) {
          // Best case: the pasted link already gave us the real product image
          // (og:image). Use it directly — far cleaner than a page screenshot.
          productImageUrl = productImageUrlIn;
        } else if (productUrl) {
          const proto = req.headers.get("x-forwarded-proto") ?? "https";
          const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
          const base  = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/$/, "") || `${proto}://${host}`;
          const ssRes = await fetch(`${base}/api/screenshot-url`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ url: productUrl }),
          });
          const ssData = await ssRes.json() as { screenshotUrl?: string; error?: string };
          if (!ssData.screenshotUrl) throw new Error("Could not screenshot the product URL. Try uploading an image instead.");
          productImageUrl = ssData.screenshotUrl;
        } else {
          const bytes = Buffer.from(await imageFile!.arrayBuffer());
          productImageUrl = await uploadAsset(bytes, `product_${ts}.jpg`, imageFile!.type || "image/jpeg");
        }
        progress(1, 10);

        /* ── 3. Anthropic — gender + script + Arcads-style prompts ── */
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const FEMALE_AVATARS = new Set(["sarah", "maya", "zoe"]);
        let personDesc = FEMALE_AVATARS.has(avatarId) ? "a young woman" : "a young man";
        if (avatarImageFile && avatarStartUrl) {
          try {
            const visionRes = await anthropic.messages.create({
              model:      "claude-haiku-4-5",
              max_tokens: 5,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "url", url: avatarStartUrl } },
                  { type: "text",  text: 'Is the person in this photo male or female? Reply with exactly one word: "male" or "female".' },
                ],
              }],
            });
            const answer = visionRes.content[0].type === "text" ? visionRes.content[0].text.toLowerCase().trim() : "";
            personDesc = answer.includes("female") ? "a young woman" : "a young man";
          } catch (e) {
            console.warn("[generate-avatar-ugc] Vision gender detection failed:", e instanceof Error ? e.message : e);
            personDesc = "a person";
          }
        }

        const SCENE_LABELS: Record<string, string> = {
          home: "a modern home living room", kitchen: "a bright kitchen counter",
          bathroom: "a clean well-lit bathroom shelf", gym: "a modern gym",
          outdoor: "an outdoor setting with natural greenery",
        };

        // Scene-specific creative direction: Claude acts as a film director,
        // auto-selecting the best video style for the product and translating
        // that style's act-by-act direction into the Seedance prompt. It also
        // still returns a Nano-Banana still prompt + scene so the existing
        // compose step works, and embeds spoken dialogue for native audio.
        const gender = personDesc;
        const scene  = "a real, lived-in setting that fits the product (home, kitchen, bathroom, gym, or outdoor)";

        const styleDirections: Record<string, string> = {
          unboxing: `
SCENE DIRECTION — UNBOXING STYLE:
This is a 3-act unboxing video.
Act 1 (0-3s): ${gender} person holds a plain package or the product box, excitement on face, camera close on hands and box
Act 2 (3-10s): Opens package/box slowly, pulls out product, holds it up to camera showing it clearly, genuine reaction of discovery
Act 3 (10-15s): Holds product confidently, shows different angles, nods approvingly at camera
Camera: Starts close on hands, pulls back slightly to show face and product together
Setting: ${scene} — clean and uncluttered
Lighting: Natural warm light, slightly bright to feel authentic
Audio: Sound of packaging opening, rustling, then ambient room tone
CRITICAL: Product must stay exactly as it looks in the reference image — same colors, same label
`,
          review: `
SCENE DIRECTION — REVIEW STYLE:
This is a direct-to-camera review.
Act 1 (0-3s): ${gender} person looks straight at camera, slight smile, product visible in hand or on surface nearby
Act 2 (3-10s): Picks up product, holds it toward camera showing label, talks directly to viewer, turns product to show different sides
Act 3 (10-15s): Sets product down, looks at camera with confident expression, thumbs up or nod
Camera: Medium shot showing face and upper body, slight handheld shake for authenticity
Setting: ${scene}
Lighting: Ring light or window light, face well lit
Audio: Clear voice quality, minimal background noise
`,
          before_after: `
SCENE DIRECTION — BEFORE/AFTER STYLE:
Act 1 (0-4s): Person looks tired/frustrated, showing the PROBLEM — no product visible, expressing pain point through expression and gesture
Act 2 (4-8s): TRANSITION — person picks up product, eyes light up, holds it to camera
Act 3 (8-15s): Complete transformation — person looks confident/happy, product in hand, pointing at it enthusiastically, clear positive energy
Camera: Same position throughout, person stays centered
Setting: ${scene}
Lighting: Slightly darker in Act 1, brighter in Act 3 to emphasize transformation
`,
          testimonial: `
SCENE DIRECTION — TESTIMONIAL STYLE:
Single continuous casual shot. Person sitting or standing comfortably.
0-3s: Natural greeting, relaxed energy, product visible but not front and center
3-10s: Picks up product naturally mid-conversation, holds it while talking, gestures with it
10-15s: Holds product up clearly to camera, genuine smile, direct eye contact
Camera: Slightly below eye level, handheld feel, occasional slight reframe
Setting: ${scene} — feels like their real home not a studio
Lighting: Imperfect, real — not perfectly lit
Audio: Slight room ambiance, real environment sounds
`,
          demo: `
SCENE DIRECTION — DEMO STYLE:
Focus on showing the product BEING USED.
0-3s: Hands shown picking up product, close shot on product and hands
3-8s: Product being used in its real context — applied, opened, poured, worn, etc.
8-12s: Results shown — the effect of using the product
12-15s: Person looks at camera with satisfied expression, product visible
Camera: Mix of close-up on hands/product and medium shot of person
Setting: Most relevant natural setting for this product type
Lighting: Natural, shows product clearly
Audio: Product sounds — opening, applying, using
`,
          lifestyle: `
SCENE DIRECTION — LIFESTYLE STYLE:
Product is part of a beautiful life moment.
0-5s: Person in aspirational setting doing something they love, product subtly visible
5-10s: Natural interaction with product — picking it up, using it as part of the moment
10-15s: Person looks at camera naturally, product visible, genuine smile
Camera: Wider shot, feels cinematic but authentic, slight movement
Setting: Premium version of ${scene} — beautiful, aspirational
Lighting: Golden hour or perfect natural light
Audio: Ambient beautiful sounds — coffee shop, nature, home sounds
`,
        };

        const claudeRes = await anthropic.messages.create({
          model:      "claude-sonnet-4-5",
          max_tokens: 1400,
          messages: [{
            role: "user",
            content: `You are a world-class UGC ad film director. You direct every shot with precision.

PRODUCT: ${productDesc}
CREATOR: ${gender} aged 25-35
LANGUAGE: ${language}
DURATION: ${vidDur} seconds

STEP 1 — SELECT VIDEO STYLE:
Analyze the product and automatically select the best style:
- Supplement/health/fitness product → unboxing or testimonial
- Skincare/beauty/cosmetics → before_after or lifestyle
- Food/beverage → demo or lifestyle
- Fashion/clothing/accessories → lifestyle or review
- Tech/gadget/electronics → demo or review
- Home product/cleaning → demo or lifestyle
- Generic/other → review

STEP 2 — APPLY SCENE DIRECTION:
Based on selected style use this exact scene direction:
${Object.entries(styleDirections).map(([key, val]) => `IF style is ${key}:\n${val}`).join("\n\n")}

STEP 3 — WRITE:

1. UGC SCRIPT — ${vidDur} seconds, spoken by the creator, in ${language}.
Write like a senior direct-response media buyer who has spent millions on Meta/TikTok ads and knows exactly what makes people stop scrolling and buy. Follow the scene direction acts above and hit this proven structure:
- HOOK (first 1-2s): a scroll-stopping opener that calls out the viewer's specific problem or a bold, curiosity-gap claim. NO generic openers — BAN phrases like "This changed everything", "This is amazing", "I love this", "Let me tell you about". Lead with the pain or the promise.
- AGITATE: name the exact frustration the target customer feels, in their own words, so they think "that's me".
- TURN: introduce the product as the obvious fix — confident, not salesy.
- PROOF/BENEFIT: ONE concrete, believable result or detail (a number, a timeframe, a sensory payoff) — not vague hype.
- CTA: a clear next step with light urgency (limited stock, selling out, link below) — never desperate.
It must sound like a REAL person talking to a friend on camera — natural, a little imperfect, never corporate.
Maximum ${Math.round(vidDur * 2.5)} words — every word must earn its place.
${language === "Darija" ? "Use authentic spoken Moroccan Darija (Arabic-French mix) the way real people actually talk." : ""}
${language === "Arabic" ? "Use natural conversational Arabic suitable for Gulf/MENA — not stiff Modern Standard Arabic." : ""}

2. SEEDANCE VIDEO PROMPT — Translate the selected scene direction into a detailed video prompt.
Start with: 'A ${gender} aged 25-35 in ${scene},'
Include every detail from the scene direction: hand movements, facial expressions, camera angle, lighting, sounds, and act-by-act beats.
The creator SPEAKS the script — embed the spoken lines split into 2-3 beats as Dialogue: "..." in ${language}, and the lines together must equal the script exactly.
100-150 words.

3. HOOK TEXT — 5 words max for a text overlay.

4. SCENE + IMAGE PROMPT (needed to composite the real product into the creator's hand):
- Pick the single best scene: home | kitchen | bathroom | gym | outdoor.
- Write a still-image prompt: "${gender} in [chosen scene], holding the product from the reference image in one hand at chest height, label facing camera, natural fingertip grip. Front-facing selfie angle, soft natural window light, authentic unfiltered phone photo, visible skin texture. The product is clearly visible and in-focus. Avoid: floating product, unnatural hand pose, perfect retouching."

Return ONLY valid JSON with no markdown:
{
  "videoStyle": "selected_style",
  "scene": "one of: home | kitchen | bathroom | gym | outdoor",
  "script": "full script — short enough for ${vidDur}s",
  "imagePrompt": "the still-image prompt from STEP 3.4",
  "videoPrompt": "detailed video prompt with Dialogue: \\"...\\" lines embedded",
  "hookText": "5 word hook",
  "hook": "first sentence of the script"
}`,
          }],
        });

        const raw       = claudeRes.content[0].type === "text" ? claudeRes.content[0].text : "";
        const cleaned   = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Failed to generate script");
        const scriptData = JSON.parse(jsonMatch[0]) as ScriptData;
        if (!SCENE_LABELS[scriptData.scene]) scriptData.scene = "home";
        console.log("1. Script ✓ | style:", scriptData.videoStyle, "| scene:", scriptData.scene, "| hook:", scriptData.hook?.slice(0, 60));
        progress(1, 18);

        /* ── 4. Nano Banana — composite "person holding product" still ── */
        progress(2, 26);
        const startFrameUrl = await composeStartFrame({
          avatarUrl:  avatarStartUrl,
          productUrl: productImageUrl,
          prompt:     scriptData.imagePrompt,
          ts,
        });
        console.log("2. Start frame ✓ |", startFrameUrl.slice(0, 80));
        progress(2, 38);

        /* ── 5. Seedance 2.0 — reference-to-video with native audio ── */
        progress(3, 42);
        let videoUrl: string | undefined;
        try {
          videoUrl = await generateVideo({
            model:       vidModel,
            prompt:      scriptData.videoPrompt,
            imageUrl:    startFrameUrl,
            duration:    vidDur,
            aspectRatio,
            resolution:  vidRes,
          });
        } catch (e) {
          console.error("[generate-avatar-ugc] Seedance failed:", e instanceof Error ? e.message.slice(0, 200) : e);
        }
        if (!videoUrl) throw new Error("Video generation failed (Seedance 2.0)");
        console.log("3. Seedance video ✓ | url:", videoUrl.slice(0, 80));
        progress(3, 78);

        /* ── 5b. Arabic path — Google (Gemini) TTS + fal lip-sync ──
         * Seedance can't speak Arabic, so for Arabic/Darija (or an Arabic-script
         * description) we generate the voiceover with Google TTS and lip-sync it
         * onto the video. Any failure falls back to the native Seedance video. */
        let usedGoogleVoice = false;
        if (needsGoogleVoice(language, productDesc)) {
          try {
            const voiceGender: "female" | "male" = gender.includes("woman") ? "female" : "male";
            console.log("3b. Arabic detected → Google TTS voiceover");
            const wav = await synthesizeArabicSpeech(scriptData.script, voiceGender);
            if (wav) {
              progress(3, 84);
              const audioUrl = await uploadToFalStorage(wav, "audio/wav", `voice_${ts}.wav`);
              const synced   = await lipSyncVideo({ videoUrl, audioUrl });
              if (synced) {
                videoUrl        = synced;
                usedGoogleVoice = true;
                console.log("3c. Lip-sync ✓ | url:", synced.slice(0, 80));
              } else {
                console.warn("[generate-avatar-ugc] lip-sync returned no URL — using native video");
              }
            } else {
              console.warn("[generate-avatar-ugc] Google TTS unavailable — using native Seedance audio");
            }
          } catch (e) {
            console.warn("[generate-avatar-ugc] Arabic voice path failed, using native video:", e instanceof Error ? e.message : e);
          }
        }
        progress(3, 86);

        /* ── 6. Re-host the final MP4 on Supabase ── */
        progress(4, 90);
        let finalVideoUrl = videoUrl;
        try {
          const dl = await fetch(videoUrl);
          if (!dl.ok) throw new Error(`video download HTTP ${dl.status}`);
          const buf      = Buffer.from(await dl.arrayBuffer());
          const fileName = `ugc_${user.id}_${ts}.mp4`;
          const { error: upErr } = await supabaseAdmin.storage
            .from("ugc-videos")
            .upload(fileName, buf, { contentType: "video/mp4", upsert: true });
          if (!upErr) {
            const { data: urlData } = supabaseAdmin.storage.from("ugc-videos").getPublicUrl(fileName);
            if (urlData?.publicUrl) finalVideoUrl = urlData.publicUrl;
          } else {
            console.warn("[generate-avatar-ugc] final upload error:", upErr.message);
          }
        } catch (e) {
          // Re-host failed — fall back to the fal-hosted URL.
          console.warn("[generate-avatar-ugc] re-host failed, using fal URL:", e instanceof Error ? e.message : e);
        }
        progress(4, 96);

        /* ── 7. Increment counter + save to library ── */
        if (plan === "starter" || plan === "growth" || plan === "pro") {
          try { await supabaseAdmin.rpc("increment_user_ugc", { p_user_id: user.id }); } catch { /**/ }
        }
        try {
          await supabaseAdmin.from("creatives").insert({
            user_id:    user.id,
            media_type: "video",
            video_url:  finalVideoUrl,
            image_urls: [],
            prompt:     productDesc,
            copy_variants: [{
              hookType, primaryText: scriptData.script, headline: scriptData.hook, description: "", cta: "",
            }],
          });
        } catch (e) {
          console.warn("[generate-avatar-ugc] Library save failed (non-fatal):", e instanceof Error ? e.message : e);
        }

        /* ── 8. Done ── */
        emit({
          type:         "done",
          videoUrl:     finalVideoUrl,
          script:       scriptData.script,
          hook:         scriptData.hook,
          scene:        scriptData.scene,
          duration:     vidDur,
          hasVoiceover: true,            // Seedance native, or Google TTS for Arabic
          hasLipsync:   true,            // Seedance self-syncs, or fal sync-lipsync
          voiceSource:  usedGoogleVoice ? "google-tts" : "seedance",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[generate-avatar-ugc] pipeline error:", msg);
        emit({ type: "error", error: msg.slice(0, 200) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
