import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY });

export const FAL_MODELS = {
  UGC_HUMAN:   "bytedance/seedance-2.0/reference-to-video",
  UGC_PRODUCT: "fal-ai/kling-video/v1.6/pro/image-to-video",
};

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

export { fal };
