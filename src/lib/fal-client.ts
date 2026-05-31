import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY || process.env.FAL_KEY });

/** True when a fal credential is configured. */
export const falAvailable = (): boolean =>
  !!(process.env.FAL_API_KEY || process.env.FAL_KEY);

export const FAL_MODELS = {
  /* ── Named shortcuts ─────────────────────────────────────────── */
  SEEDANCE:      "bytedance/seedance-2.0/image-to-video",       // start-frame → talking UGC + native audio
  KLING:         "fal-ai/kling-video/v1.6/pro/image-to-video",  // cinematic product showcase
  SEEDANCE_FAST: "bytedance/seedance-2.0/fast/image-to-video",  // same model, lower latency/cost

  /* ── Avatar video — ordered fallback chain ───────────────────── */
  AVATAR_VIDEO:    "fal-ai/kling-video/v2.1/master/image-to-video",
  AVATAR_VIDEO_V2: "fal-ai/kling-video/v2.1/pro/image-to-video",
  AVATAR_VIDEO_V1: "fal-ai/kling-video/v1.6/pro/image-to-video",

  /* ── Legacy aliases (kept for backward compat) ───────────────── */
  UGC_HUMAN:    "bytedance/seedance-2.0/reference-to-video",
  UGC_PRODUCT:  "fal-ai/kling-video/v1.6/pro/image-to-video",
  LIPSYNC:      "fal-ai/sync-lipsync",
};

/**
 * Select [primaryModel, fallbackModel] based on hook type.
 *  Testimonial Style | Problem/Solution → Seedance first (authentic human UGC feel)
 *  Everything else                      → Kling first  (product showcase / cinematic)
 */
export function selectModels(hookType: string): [string, string] {
  if (hookType === "Testimonial Style" || hookType === "Problem/Solution") {
    return [FAL_MODELS.SEEDANCE, FAL_MODELS.KLING];
  }
  return [FAL_MODELS.KLING, FAL_MODELS.SEEDANCE];
}

/** Generate a UGC-style video via fal.ai — returns the video URL */
export const generateVideo = async ({
  model,
  prompt,
  imageUrl,
  duration,
  aspectRatio,
  resolution = "1080p",
}: {
  model:       string;
  prompt:      string;
  imageUrl:    string;
  duration:    number;
  aspectRatio: string;
  resolution?: "480p" | "720p" | "1080p";
}): Promise<string | undefined> => {
  const isSeedance = model === FAL_MODELS.SEEDANCE || model === FAL_MODELS.SEEDANCE_FAST;

  // Seedance 2.0 image-to-video: image_url (string), INTEGER duration (4–15),
  // resolution enum, native audio. Kling: image_url + string duration, no resolution.
  const input: Record<string, unknown> = {
    prompt,
    image_url:      imageUrl,
    aspect_ratio:   aspectRatio,
    generate_audio: true,
  };
  if (isSeedance) {
    input.duration   = duration;   // integer seconds, e.g. 5 or 10
    input.resolution = resolution; // "480p" | "720p" | "1080p"
  } else {
    input.duration   = duration.toString(); // Kling expects a string ("5" | "10")
  }

  const result = await fal.subscribe(model, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: input as any,
    logs: true,
  }) as { data?: { video?: { url?: string } } };

  return result.data?.video?.url;
};

/**
 * Generate video with automatic fallback.
 * Tries the primary model first; on failure retries with the secondary model.
 * Returns both the URL and the model name that succeeded.
 */
export const generateVideoWithFallback = async ({
  hookType,
  prompt,
  imageUrl,
  duration,
  aspectRatio,
  resolution = "720p",
}: {
  hookType:    string;
  prompt:      string;
  imageUrl:    string;
  duration:    number;
  aspectRatio: string;
  resolution?: "480p" | "720p" | "1080p";
}): Promise<{ url: string; model: string }> => {
  const [primary, fallback] = selectModels(hookType);

  for (const model of [primary, fallback]) {
    try {
      const modelLabel = model === FAL_MODELS.SEEDANCE ? "seedance" : "kling";
      console.log(`[fal-client] Trying ${modelLabel} (${model})…`);
      const url = await generateVideo({ model, prompt, imageUrl, duration, aspectRatio, resolution });
      if (url) {
        console.log(`[fal-client] ✓ ${modelLabel} succeeded`);
        return { url, model: modelLabel };
      }
    } catch (e) {
      console.error(
        `[fal-client] ${model} failed, trying fallback:`,
        e instanceof Error ? e.message.slice(0, 200) : e,
      );
    }
  }

  throw new Error("All video generation models failed");
};

/**
 * Generate an avatar video via Kling — tries v2.1 Master → v2.1 Pro → v1.6 Pro.
 * Uses `image_url` (the correct fal.ai parameter for image-to-video endpoints).
 */
export const generateAvatarVideo = async ({
  prompt,
  imageUrl,
  duration,
  aspectRatio,
  resolution = "720p",
}: {
  prompt:       string;
  imageUrl:     string;
  duration:     number;
  aspectRatio:  string;
  resolution?:  "480p" | "720p" | "1080p";
}): Promise<string | undefined> => {
  void resolution; // Kling doesn't expose a resolution param

  // Kling supports 5 or 10 seconds
  const klingDuration = duration >= 10 ? "10" : "5";

  const modelsToTry = [
    FAL_MODELS.AVATAR_VIDEO,    // v2.1 master
    FAL_MODELS.AVATAR_VIDEO_V2, // v2.1 pro
    FAL_MODELS.AVATAR_VIDEO_V1, // v1.6 pro (most stable)
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`[fal-client] generateAvatarVideo trying ${model}…`);
      const result = await fal.subscribe(model, {
        input: {
          image_url:       imageUrl,   // correct param name for all Kling image-to-video models
          prompt,
          duration:        klingDuration,
          aspect_ratio:    aspectRatio,
          negative_prompt: "blurry, low quality, distorted, no face, faceless, text overlay, watermark, cartoon, animation, drawing",
        },
        logs: true,
      }) as { data?: { video?: { url?: string } } };

      const url = result.data?.video?.url;
      if (url) {
        console.log(`[fal-client] ✓ ${model} returned video`);
        return url;
      }
      console.warn(`[fal-client] ${model} returned no video URL — trying next`);
    } catch (e) {
      console.error(
        `[fal-client] ${model} failed:`,
        e instanceof Error ? e.message.slice(0, 200) : e,
      );
    }
  }

  return undefined; // all models failed
};

/**
 * Compose a single photoreal "person holding the product" still from up to a
 * few input images (e.g. [avatarUrl, productUrl]) using Nano Banana edit.
 * This is the Arcads product-showcase first-frame step: the model composites
 * the real product into the person's hand so it is genuinely held, not a
 * floating pasted tile. Returns the generated image URL.
 */
export const composeHeldProductImage = async ({
  prompt,
  imageUrls,
}: {
  prompt:    string;
  imageUrls: string[];
}): Promise<string | undefined> => {
  const result = await fal.subscribe("fal-ai/nano-banana/edit", {
    input: {
      prompt,
      image_urls:    imageUrls,
      num_images:    1,
      output_format: "jpeg",
    },
    logs: true,
  }) as { data?: { images?: { url?: string }[] } };

  return result.data?.images?.[0]?.url;
};

/** Lip-sync a talking-head video to an audio track — returns final video URL */
export const lipSyncVideo = async ({
  videoUrl,
  audioUrl,
}: {
  videoUrl: string;
  audioUrl: string;
}): Promise<string | undefined> => {
  const result = await fal.subscribe(FAL_MODELS.LIPSYNC, {
    input: {
      video_url: videoUrl,
      audio_url: audioUrl,
    },
    logs: true,
  }) as { data?: { video?: { url?: string } } };

  return result.data?.video?.url;
};

/** Upload audio/binary data to fal storage and return the public URL */
export const uploadToFalStorage = async (
  data:     Buffer,
  mimeType: string,
  filename: string,
): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = new Blob([data as any], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });
  return fal.storage.upload(file);
};

export { fal };
