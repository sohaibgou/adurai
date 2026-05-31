import { NextRequest, NextResponse } from "next/server";
import { checkUsage, IMAGE_LIMITS } from "@/lib/check-usage";
import { supabaseAdmin } from "@/lib/supabase-server";

export const maxDuration = 120;
export const dynamic    = "force-dynamic";

export interface ArabicTextData {
  headline:    string;
  subheadline: string;
  cta:         string;
}

/* ── Nanobanana models (latest first) ── */
const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
];

/* ── Shared 1:1 format spec for every prompt ── */
const FORMAT_SPEC = `
OUTPUT FORMAT — CRITICAL:
- SQUARE 1:1 composition — equal width and height, like a 1080×1080 pixel Meta Feed ad canvas
- Keep all critical content within the safe zone: centered 80% of the canvas, away from edges
- Mobile-first: typography must be large enough to read on a 6-inch phone screen
- Text coverage: ad copy should occupy no more than 20% of the image area
- No letterboxing, no widescreen, no portrait format — SQUARE ONLY`;

/* ── 4 Meta ad angles — text-to-image (no reference product image) ── */
const ANGLES = [
  {
    angle:     "Hero Product Shot",
    headline:  "",
    rationale: "",
    suffix:    `HERO PRODUCT SHOT — Channel Apple-level product photography. Pristine product centered on a clean, dramatic background (pure white, deep black, or bold complementary color). Professional studio lighting with subtle shadows for depth. Negative space. Zero clutter. Pure product confidence.
Ad copy on image: bold benefit-driven headline (4–7 words) + supporting subheadline (8–12 words) + pill-shaped CTA button at bottom. High-contrast typography legible on mobile.`,
  },
  {
    angle:     "Lifestyle & Emotion",
    headline:  "",
    rationale: "",
    suffix:    `LIFESTYLE & EMOTION — Show the transformation, not the product. Feature a real person experiencing the result or benefit. Capture confidence, joy, or relief. Warm color grading, golden-hour or soft natural lighting. Feel editorial but authentic — magazine meets UGC.
Ad copy on image: emotionally-charged transformation headline + specific benefit subheadline + pill-shaped CTA ("Start Today", "See Results") at bottom. Clean sans-serif, high-contrast.`,
  },
  {
    angle:     "Social Proof",
    headline:  "",
    rationale: "",
    suffix:    `SOCIAL PROOF — Lead with credibility. Bold numbers as the visual anchor: "50,000+ sold", "4.9★ from 12,400 reviews". Design feels like viral UGC or a screenshot testimonial blown up. Raw, authentic, trustworthy — not over-polished.
Ad copy on image: large bold proof statistic or star-rating graphic (★★★★★) as headline element + specific customer testimonial quote + trust-reinforcing CTA ("Join 50k+ Customers") at bottom.`,
  },
  {
    angle:     "Pattern Interrupt",
    headline:  "",
    rationale: "",
    suffix:    `PATTERN INTERRUPT — Break every category convention. Extreme macro close-up, bold unexpected color palette, split-screen contrast, or surreal conceptual scene. Something that makes someone stop mid-scroll and say "wait — what is that?" Visually disruptive, polarizing, and memorable.
Ad copy on image: oversized provocative headline as a design element (contrarian or curiosity-gap) + clarifying subheadline + bold CTA ("Find Out Why", "Switch Now"). Typography dominates.`,
  },
];

/* ── Raw REST call to Gemini (nanobanana approach) ── */
async function generateImage(
  apiKey: string,
  prompt: string,
): Promise<{ data: string; mimeType: string } | null> {
  for (const model of IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body:    JSON.stringify({
            contents:         [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[generate-creative] ${model} HTTP ${res.status}:`, errText.slice(0, 200));
        continue;
      }

      const json = await res.json() as {
        candidates?: { content: { parts: { inlineData?: { data: string; mimeType: string } }[] } }[];
        error?: { message: string };
      };

      if (json.error) {
        console.error(`[generate-creative] ${model} error:`, json.error.message);
        continue;
      }

      const parts     = json.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => !!p.inlineData);
      if (imagePart?.inlineData) {
        console.log(`[generate-creative] ✓ ${model}`);
        return { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || "image/jpeg" };
      }

      console.warn(`[generate-creative] ${model} returned no image`);
    } catch (err) {
      console.error(`[generate-creative] ${model} threw:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

/* ── Arabic copy (text-only, raw REST) ── */
async function generateArabicCopy(
  apiKey: string,
  userPrompt: string,
): Promise<ArabicTextData[]> {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method:  "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body:    JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional Arabic advertising copywriter. Generate 4 Arabic ad copy sets for this brief: "${userPrompt}"

Angles (in order): Hero Shot, Lifestyle, Social Proof, Pattern Interrupt.

Return ONLY a valid JSON array with exactly 4 objects. No markdown, no explanation. Each object:
- headline: Arabic headline (5-8 words, bold and punchy)
- subheadline: Arabic subheadline (8-12 words, supporting the headline)
- cta: Arabic CTA button text (2-4 words)`,
            }],
          }],
        }),
      },
    );
    const json    = await res.json() as { candidates?: { content: { parts: { text?: string }[] } }[] };
    const raw     = json.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned) as ArabicTextData[];
  } catch {
    return [];
  }
}

/* ── POST ── */
export async function POST(req: NextRequest) {
  const usageResult = await checkUsage(req, "image");
  if (usageResult instanceof NextResponse) return usageResult;
  const { user, plan, isAdmin } = usageResult;

  const { prompt, isArabic, language } = await req.json() as { prompt: string; isArabic?: boolean; language?: string };

  const apiKey = process.env.GOOGLE_AI_KEY!;
  const lang   = (language || "English").trim();

  const arabicCopyPromise = isArabic
    ? generateArabicCopy(apiKey, prompt)
    : Promise.resolve<ArabicTextData[]>([]);

  const imagePromises = ANGLES.map(async ({ angle, suffix }) => {
    // Arabic → no text baked in (added as RTL overlay). Other languages → force on-image copy into that language.
    const langClause = isArabic
      ? "\n\nCRITICAL: The image must contain absolutely NO text, letters, words, numbers, or any written characters anywhere. Pure visual only — text will be added separately as an overlay."
      : `\n\nLANGUAGE — CRITICAL: Every word of on-image text (headline, subheadline, CTA, badges, captions, and any other written characters) MUST be written in ${lang}, and ${lang} only. Do NOT use English or any other language unless the requested language is English. Spelling must be flawless and native.`;

    const fullPrompt = `You are a world-class Meta ads creative director who has produced campaigns for Gymshark, MVMT, Dollar Shave Club, and dozens of 8-figure DTC brands. Produce a FINISHED, print-ready Meta Feed static ad creative.

BRIEF: ${prompt}

CREATIVE ANGLE — ${suffix}

VISUAL STYLE: Choose the most effective visual style, color palette, lighting, mood, and typography for this specific product and target audience based on the brief — do not default to a generic look.

QUALITY BAR: This ad must look indistinguishable from a $50,000 agency production. Every pixel intentional. Scroll-stopping on a busy Instagram feed.${FORMAT_SPEC}${langClause}`;

    const result = await generateImage(apiKey, fullPrompt);
    if (!result) return null;
    return { url: `data:${result.mimeType};base64,${result.data}`, angle, headline: "", rationale: "" };
  });

  const [imageResults, arabicTexts] = await Promise.all([
    Promise.all(imagePromises),
    arabicCopyPromise,
  ]);

  const images = imageResults.filter(Boolean);

  if (images.length === 0) {
    return NextResponse.json(
      { error: "Image generation failed — no images returned. Check GOOGLE_AI_KEY." },
      { status: 500 },
    );
  }

  // Increment the monthly image counter for any tier that has a finite cap
  // (free 3, starter 5, growth 20). Pro/Autopilot + admins are unlimited.
  if (!isAdmin && IMAGE_LIMITS[plan] !== null) {
    try { await supabaseAdmin.rpc("increment_user_image", { p_user_id: user.id }); } catch { /**/ }
  }

  return NextResponse.json({
    images,
    ...(isArabic ? { arabicTexts } : {}),
  });
}
