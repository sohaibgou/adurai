/**
 * Live probe for the fal UGC pipeline (Arcads workflow).
 * Verifies the two unverified endpoints before trusting the full route:
 *   1. fal-ai/nano-banana/edit   — person + product -> "holding it" still
 *   2. bytedance/seedance-2.0/reference-to-video — still -> talking UGC video
 *
 * Usage: node scripts/test-fal-ugc.mjs
 */
import { readFileSync } from "fs";
import { fal } from "@fal-ai/client";

/* ── Load FAL key from .env.local without printing it ── */
function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const KEY = process.env.FAL_API_KEY || process.env.FAL_KEY;
if (!KEY) { console.error("No FAL key in .env.local"); process.exit(1); }
fal.config({ credentials: KEY });
console.log("fal key loaded:", KEY.slice(0, 6) + "…");

/* Public test images */
const AVATAR  = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1024&q=80";
const PRODUCT = "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1024&q=80"; // cosmetic bottle

const IMG_PROMPT =
  "A young woman in a bright bathroom, holding the product from the reference image in one hand at chest height, " +
  "label facing camera, natural fingertip grip. Front-facing selfie angle, soft natural window light, authentic " +
  "unfiltered phone photo, visible skin texture. The product is clearly visible and in-focus. " +
  "Avoid: studio lighting, floating product, unnatural hand pose, perfect retouching.";

const VIDEO_PROMPT =
  "5s UGC selfie filmed on a smartphone in natural window light. A young woman with visible skin texture and a few " +
  "freckles holds the product to camera in a lived-in bathroom. She looks into the lens and speaks. " +
  'Dialogue: "Okay I have to show you this — my skin has never looked better." She tilts the bottle to show the label. ' +
  "Relaxed unhurried pace, natural pauses, direct phone-mic audio, soft focus, not color graded. " +
  "The overall feel is real and trustworthy, like a friend sharing a find.";

async function main() {
  /* ── STEP 1: nano-banana/edit ── */
  console.log("\n[1] nano-banana/edit — composing held-product still…");
  let stillUrl;
  try {
    const r = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: { prompt: IMG_PROMPT, image_urls: [AVATAR, PRODUCT], num_images: 1, output_format: "jpeg" },
      logs: false,
    });
    stillUrl = r?.data?.images?.[0]?.url;
    console.log("  RAW keys:", Object.keys(r?.data ?? {}));
    console.log("  still URL:", stillUrl);
  } catch (e) {
    console.error("  nano-banana FAILED:", e?.message || e);
    console.error("  body:", JSON.stringify(e?.body ?? {}).slice(0, 400));
    process.exit(2);
  }
  if (!stillUrl) { console.error("  no image URL returned"); process.exit(2); }

  /* ── STEP 2: seedance-2.0 reference-to-video (with audio) ── */
  console.log("\n[2] seedance-2.0/reference-to-video — animating + speaking…");
  try {
    const r = await fal.subscribe("bytedance/seedance-2.0/image-to-video", {
      input: {
        prompt:         VIDEO_PROMPT,
        image_url:      stillUrl,
        duration:       5,
        aspect_ratio:   "9:16",
        resolution:     "1080p",
        generate_audio: true,
      },
      logs: true,
      onQueueUpdate: (u) => { if (u.status) console.log("  queue:", u.status); },
    });
    console.log("  RAW keys:", Object.keys(r?.data ?? {}));
    console.log("  video URL:", r?.data?.video?.url);
  } catch (e) {
    console.error("  seedance FAILED:", e?.message || e);
    console.error("  body:", JSON.stringify(e?.body ?? {}).slice(0, 600));
    process.exit(3);
  }

  console.log("\n✅ Both endpoints succeeded.");
}

main().catch((e) => { console.error("fatal:", e); process.exit(1); });
