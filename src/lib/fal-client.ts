import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

export const FAL_MODELS = {
  UGC_HUMAN:    "bytedance/seedance-2.0/reference-to-video",
  UGC_PRODUCT:  "fal-ai/kling-video/v1.6/pro/image-to-video",
  AVATAR_VIDEO: "fal-ai/kling-video/v2.1/master/image-to-video",
  LIPSYNC:      "fal-ai/sync-lipsync",
};

/** Generate a UGC-style video via fal.ai — returns the video URL */
export const generateVideo = async ({
  model,
  prompt,
  imageUrl,
  duration,
  aspectRatio,
}: {
  model: string;
  prompt: string;
  imageUrl: string;
  duration: number;
  aspectRatio: string;
}): Promise<string | undefined> => {
  const result = await fal.subscribe(model, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: {
      prompt,
      image_url:      imageUrl,
      duration:       duration.toString(),
      aspect_ratio:   aspectRatio,
      generate_audio: true,
      resolution:     "1080p",
    } as any,
    logs: true,
  }) as { data?: { video?: { url?: string } } };

  return result.data?.video?.url;
};

/** Generate an avatar video via Kling v2.1 Master — returns the video URL */
export const generateAvatarVideo = async ({
  prompt,
  imageUrl,
  duration,
  aspectRatio,
}: {
  prompt:      string;
  imageUrl:    string;
  duration:    number;
  aspectRatio: string;
}): Promise<string | undefined> => {
  // Kling v2.1 supports "5" or "10" seconds
  const klingDuration = duration >= 10 ? "10" : "5";

  const result = await fal.subscribe(FAL_MODELS.AVATAR_VIDEO, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: {
      start_image_url: imageUrl,
      prompt,
      duration:        klingDuration,
      aspect_ratio:    aspectRatio,
      negative_prompt: "blurry, low quality, distorted, no face, faceless, text overlay, watermark, cartoon, animation, drawing",
    } as any,
    logs: true,
  }) as { data?: { video?: { url?: string } } };

  return result.data?.video?.url;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: {
      video_url: videoUrl,
      audio_url: audioUrl,
    } as any,
    logs: true,
  }) as { data?: { video?: { url?: string } } };

  return result.data?.video?.url;
};

/** Upload audio/binary data to fal storage and return the public URL */
export const uploadToFalStorage = async (
  data: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob  = new Blob([data as any], { type: mimeType });
  const file  = new File([blob], filename, { type: mimeType });
  return fal.storage.upload(file);
};

export { fal };
