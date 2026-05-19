import { NextRequest, NextResponse } from "next/server";
import { requireEmailVerified } from "@/lib/require-email-verified";

export const maxDuration = 120;
export const dynamic    = "force-dynamic";

/* ── Nanobanana models (latest first) ── */
const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
];

/* ── Shared format spec injected into every prompt ── */
const FORMAT_SPEC = `
OUTPUT FORMAT — CRITICAL:
- SQUARE 1:1 composition exactly — equal width and height, like a 1080×1080 pixel canvas
- This is a Meta Feed static ad — square format is mandatory
- Keep all critical content (product, text, CTA) within the safe zone: centered 80% of the canvas, away from edges
- Mobile-first: text must be large enough to read on a 6-inch phone screen
- Text coverage: ad copy should cover no more than 20% of the image area
- No letterboxing, no widescreen cropping, no portrait/vertical format — SQUARE ONLY`;

/* ── 4 high-converting Meta ad angles ── */
const ANGLES = [
  {
    angle:     "Hero Product Shot",
    headline:  "",
    rationale: "Clean hero shots establish premium positioning and drive direct purchase intent.",
    prompt:    (brief: string) => `You are a world-class Meta ads creative director who has produced winning campaigns for Gymshark, MVMT, Dollar Shave Club, and dozens of 8-figure DTC brands.

Using the uploaded product image, produce a FINISHED, print-ready Meta Feed static ad creative.

BRIEF: ${brief}

CREATIVE ANGLE — HERO PRODUCT SHOT:
The product is the undisputed star. Channel Apple product photography — pristine, dramatic, confidence-exuding. Background should be clean (pure white, deep black, or a single bold complementary color). Use professional studio lighting with subtle shadows that give the product depth and premium feel. Negative space is your friend. No clutter. No props. Just the product commanding attention.

AD COPY TO RENDER ON THE IMAGE:
- Main headline: bold, short (4–7 words), benefit-driven or identity-driven — rendered in large typography at top or bottom third
- Subheadline: supporting line (8–12 words) — rendered smaller below headline
- CTA button: pill-shaped button with 2–4 word CTA ("Shop Now", "Try Risk-Free", "Get Yours") — placed at bottom
- Use high-contrast type (white on dark, or dark on white/light) — must be legible on mobile
${FORMAT_SPEC}

QUALITY BAR: This ad must look indistinguishable from a $50,000 agency production. Every pixel intentional.`,
  },
  {
    angle:     "Lifestyle & Emotion",
    headline:  "",
    rationale: "Lifestyle creatives connect emotionally and drive aspiration-based purchases.",
    prompt:    (brief: string) => `You are a world-class Meta ads creative director who has produced winning campaigns for Gymshark, MVMT, Dollar Shave Club, and dozens of 8-figure DTC brands.

Using the uploaded product image, produce a FINISHED, print-ready Meta Feed static ad creative.

BRIEF: ${brief}

CREATIVE ANGLE — LIFESTYLE & EMOTION:
Show the transformation — not the product, but what it DOES to someone's life. Integrate the product naturally into a scene featuring a real person experiencing the benefit or result. Capture the emotion: confidence, joy, relief, energy. Warm color grading. Golden hour or soft natural lighting. Feel editorial but authentic — like a magazine spread meets viral UGC. The product must be clearly visible and recognizable.

AD COPY TO RENDER ON THE IMAGE:
- Headline: emotionally-charged statement about the transformation or result (e.g. "Finally, skin you're proud of" / "More energy. Every morning.") — large, bold type
- Subheadline: specific benefit or social proof line — smaller type
- CTA button: action-oriented ("Start Today", "See Results", "Get Yours") — pill-shaped at bottom
- Typography should feel premium: clean sans-serif, high contrast against the scene
${FORMAT_SPEC}

QUALITY BAR: This ad must look indistinguishable from a $50,000 agency production. Every pixel intentional.`,
  },
  {
    angle:     "Social Proof",
    headline:  "",
    rationale: "Social proof creatives reduce purchase hesitation and build immediate trust.",
    prompt:    (brief: string) => `You are a world-class Meta ads creative director who has produced winning campaigns for Gymshark, MVMT, Dollar Shave Club, and dozens of 8-figure DTC brands.

Using the uploaded product image, produce a FINISHED, print-ready Meta Feed static ad creative.

BRIEF: ${brief}

CREATIVE ANGLE — SOCIAL PROOF / TRUST:
Lead with credibility. Design around proof: star ratings, customer counts, press mentions, or before/after results. The product should be featured clearly but secondary to the proof elements. Design feel: raw, authentic, trustworthy — not over-polished. Think UGC that went viral, or a screenshot-style testimonial blown up as an ad. Bold numbers command attention ("50,000+ sold", "4.9★ from 12,400 reviews").

AD COPY TO RENDER ON THE IMAGE:
- Primary element: large bold proof statistic or star rating — the visual anchor
- Testimonial line or headline: a specific, credible customer benefit statement in quotes
- Product name or brand — clearly visible
- CTA button: trust-reinforcing ("Join 50k+ Customers", "See All Reviews", "Try Risk-Free") — pill-shaped at bottom
- Include visual star rating graphic (★★★★★) prominently
${FORMAT_SPEC}

QUALITY BAR: This ad must look indistinguishable from a $50,000 agency production. Every pixel intentional.`,
  },
  {
    angle:     "Pattern Interrupt",
    headline:  "",
    rationale: "Unexpected creative stops the scroll and creates memorable brand moments.",
    prompt:    (brief: string) => `You are a world-class Meta ads creative director who has produced winning campaigns for Gymshark, MVMT, Dollar Shave Club, and dozens of 8-figure DTC brands.

Using the uploaded product image, produce a FINISHED, print-ready Meta Feed static ad creative.

BRIEF: ${brief}

CREATIVE ANGLE — PATTERN INTERRUPT:
Break every category convention. Do something visually that makes someone stop mid-scroll and say "wait — what is that?". Could be: extreme macro close-up of product texture, bold graphic design with vibrant unexpected color palette, split-screen contrast (before/after or problem/solution), provocative minimalism, or a surreal conceptual scene. The composition should feel like it was created by a visionary creative director, not a template. Bold, disruptive, polarizing — in the best way.

AD COPY TO RENDER ON THE IMAGE:
- Headline: provocative, contrarian, or curiosity-gap driven (e.g. "Stop wasting money on this" / "The last [product] you'll ever buy") — extremely bold and large
- Subheadline: delivers on the curiosity — clarifies the bold claim
- CTA: matches the disruptive energy ("Find Out Why", "See The Proof", "Switch Now") — pill-shaped button
- Typography should be oversized and dominant — type as design element
${FORMAT_SPEC}

QUALITY BAR: This ad must look indistinguishable from a $50,000 agency production. Every pixel intentional.`,
  },
];

/* ── Raw REST call to Gemini (nanobanana approach) ── */
async function generateAdImage(
  apiKey:    string,
  prompt:    string,
  imageData: { mimeType: string; data: string },
): Promise<{ data: string; mimeType: string } | null> {
  for (const model of IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body:    JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
                { text: prompt },
              ],
            }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[cwi] ${model} HTTP ${res.status}:`, errText.slice(0, 200));
        continue;
      }

      const json = await res.json() as {
        candidates?: { content: { parts: { inlineData?: { data: string; mimeType: string }; text?: string }[] } }[];
        error?:      { message: string };
      };

      if (json.error) {
        console.error(`[cwi] ${model} error:`, json.error.message);
        continue;
      }

      const parts   = json.candidates?.[0]?.content?.parts ?? [];
      const imgPart = parts.find((p) => !!p.inlineData);
      if (imgPart?.inlineData) {
        console.log(`[cwi] ✓ ${model}`);
        return { data: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType || "image/jpeg" };
      }

      console.warn(`[cwi] ${model} returned no image`);
    } catch (err) {
      console.error(`[cwi] ${model} threw:`, err instanceof Error ? err.message.slice(0, 120) : err);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  console.log("━━━ /api/generate-creative-with-image ━━━");
  const check = await requireEmailVerified(req);
  if (check instanceof NextResponse) return check;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const imageFile = formData.get("image")   as File | null;
  const prompt    = (formData.get("prompt") as string | null) ?? "";

  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const imageBytes  = await imageFile.arrayBuffer();
  const base64Image = Buffer.from(imageBytes).toString("base64");
  const mimeType    = imageFile.type || "image/jpeg";
  const apiKey      = process.env.GOOGLE_AI_KEY!;

  console.log(`Image: ${imageFile.name} ${imageFile.size}b | prompt: "${prompt}"`);

  const t0 = Date.now();

  const results = await Promise.all(
    ANGLES.map(async (a, i) => {
      const t      = Date.now();
      const brief  = prompt.trim() || "premium product ad";
      const result = await generateAdImage(apiKey, a.prompt(brief), { mimeType, data: base64Image });
      if (!result) {
        console.log(`[cwi][${i}] ${a.angle} — no image after ${Date.now() - t}ms`);
        return null;
      }
      console.log(`[cwi][${i}] ✓ ${a.angle} — ${Date.now() - t}ms`);
      return {
        url:       `data:${result.mimeType};base64,${result.data}`,
        angle:     a.angle,
        headline:  a.headline,
        rationale: a.rationale,
      };
    }),
  );

  const images = results.filter(Boolean);
  console.log(`[cwi] Done in ${Date.now() - t0}ms — ${images.length}/4 images`);

  if (images.length === 0) {
    return NextResponse.json({ error: "No images generated. Check GOOGLE_AI_KEY." }, { status: 500 });
  }

  return NextResponse.json({ images, briefs: [] });
}
