import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const OPENAI_KEY_PRESENT = !!process.env.OPENAI_API_KEY;
console.log(`[generate-image] API keys loaded: OPENAI=${OPENAI_KEY_PRESENT ? "yes" : "NO"}`);

type ProductCategory =
  | "supplement"
  | "beauty"
  | "tech"
  | "fashion"
  | "food"
  | "fitness"
  | "general";

function getProductCategory(description: string, headline: string): ProductCategory {
  const text = `${description} ${headline}`.toLowerCase();

  if (/supplement|vitamin|protein|greens|collagen|omega|probiotic|health|wellness|gummy|capsule|powder|nutrition|superfood/.test(text))
    return "supplement";
  if (/skincare|serum|moisturizer|beauty|makeup|cosmetic|lipstick|foundation|retinol|glow|cleanser|face|skin/.test(text))
    return "beauty";
  if (/tech|phone|laptop|earbuds|gadget|device|charger|speaker|headphone|electronic|app|software|saas/.test(text))
    return "tech";
  if (/fashion|clothing|apparel|sneaker|shoe|jacket|bag|accessory|watch|jewelry|dress|shirt|pants/.test(text))
    return "fashion";
  if (/food|coffee|tea|snack|drink|beverage|sauce|meal|recipe|eat|flavor|taste|organic|natural/.test(text))
    return "food";
  if (/fitness|gym|workout|training|sport|athlete|muscle|performance|endurance|run|crossfit/.test(text))
    return "fitness";
  return "general";
}

function getBackgroundStyle(category: ProductCategory): {
  background: string;
  overlay: string;
  mood: string;
} {
  switch (category) {
    case "supplement":
      return {
        background: "warm cream gradient from #FAF3E0 to #F5E6C8 with very subtle linen texture",
        overlay: "delicate organic leaf and botanical line-art pattern at 8% opacity in warm brown",
        mood: "clean, trustworthy, premium health brand aesthetic — like AG1 or Grüns",
      };
    case "beauty":
      return {
        background: "soft blush-to-lavender gradient from #FFF0F3 to #F5EFFF, silky smooth",
        overlay: "ultra-soft bokeh light orbs and gentle sparkle glints at 12% opacity",
        mood: "luxurious, feminine, editorial beauty brand aesthetic — like Glossier or Rhode",
      };
    case "tech":
      return {
        background: "deep charcoal to near-black gradient from #1a1a2e to #0f0f1a",
        overlay: "extremely subtle blue-purple circuit trace lines and hexagonal grid at 6% opacity",
        mood: "premium, modern, cutting-edge tech aesthetic — like Apple or Nothing",
      };
    case "fashion":
      return {
        background: "bold warm white #FAFAF8 with a razor-thin architectural shadow gradient at the edges",
        overlay: "clean — no pattern, let the product dominate",
        mood: "editorial fashion, high contrast, confident — like Allbirds or Everlane",
      };
    case "food":
      return {
        background: "fresh natural gradient from #F8FAF0 to #EEF5E4, soft sage-white",
        overlay: "very subtle watercolor wash of natural greens and cream at 10% opacity",
        mood: "fresh, appetizing, wholesome — like Brightland or Kin Euphorics",
      };
    case "fitness":
      return {
        background: "dark dramatic gradient from #1C1C24 to #2A2A3A",
        overlay: "diagonal energy streak lines and subtle motion blur at 8% opacity in electric blue #3D6BFF",
        mood: "powerful, athletic, high-performance — like Nike or Whoop",
      };
    default:
      return {
        background: "sophisticated light gradient from #F8F8F8 to #EFEFEF, clean and minimal",
        overlay: "no pattern — pure clean space",
        mood: "premium direct-to-consumer brand aesthetic — versatile and conversion-focused",
      };
  }
}

export async function POST(request: NextRequest) {
  console.log("[generate-image] Starting generation...");

  try {
    const body = await request.json() as {
      headlineOverlay?: string;
      subtextOverlay?: string;
      productDescription?: string;
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[generate-image] OPENAI_API_KEY is missing");
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const headline = body.headlineOverlay?.trim() || "Shop Now";
    const subtext = body.subtextOverlay?.trim() || "Premium quality. Fast shipping.";
    const productDescription = body.productDescription?.trim() || "";

    const category = getProductCategory(productDescription, headline);
    const { background, overlay, mood } = getBackgroundStyle(category);

    console.log(`[generate-image] Category: ${category} — headline: "${headline}"`);

    const bgPrompt =
      `Create a premium, high-converting Meta Ads static creative for Facebook and Instagram feed.\n\n` +

      (productDescription ? `PRODUCT: ${productDescription}\n` : "") +
      `HEADLINE: ${headline}\n` +
      `SUBTEXT: ${subtext}\n\n` +

      `VISUAL REQUIREMENTS:\n` +
      `- Background: ${background}\n` +
      `- Background overlay/texture: ${overlay}\n` +
      `- Mood and aesthetic: ${mood}\n` +
      `- Bold headline text at the very top reading "${headline}" — large font, dark color #0a0a0f, premium sans-serif typeface, high contrast\n` +
      `- Smaller subheadline text directly below the headline reading "${subtext}" — color #4a4a5a, elegant and readable\n` +
      `- Clean CTA button at the bottom — solid dark rounded rectangle (#0a0a0f) with white text reading "Shop Now"\n` +
      `- The CENTER and MIDDLE THIRD of the image must be completely empty — absolutely no objects, illustrations, or decorations in this center zone. This space is reserved for a product photo to be composited in post.\n` +
      `- Generous white space and breathing room around all text elements\n` +
      `- No clutter, no stock photo people, no busy backgrounds\n` +
      `- Professional advertising quality layout\n\n` +

      `TECHNICAL:\n` +
      `- Square 1:1 format (1024×1024) optimized for social feed\n` +
      `- High contrast between all text and the background\n` +
      `- All text must be clearly readable at a glance\n` +
      `- The empty center zone must be obvious — this is where the product will be placed\n` +
      `- Output should look like a real, ready-to-run paid ad from a premium DTC brand`;

    const openai = new OpenAI({ apiKey });

    console.log("[generate-image] Sending to OpenAI gpt-image-1...");

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: bgPrompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
    });

    console.log("[generate-image] Got response from OpenAI");

    const b64 = response.data?.[0]?.b64_json;

    if (!b64) {
      console.error("[generate-image] Response had no b64_json:", JSON.stringify(response.data));
      return NextResponse.json({ error: "OpenAI returned no image data" }, { status: 500 });
    }

    console.log("[generate-image] Done — returning backgroundUrl");
    return NextResponse.json({ backgroundUrl: `data:image/png;base64,${b64}` });

  } catch (error: unknown) {
    console.error("[generate-image] Error:", error);

    let message = "Failed to generate image";
    if (error instanceof Error) {
      console.error("[generate-image] Error message:", error.message);
      console.error("[generate-image] Error stack:", error.stack);
      if (error.message.includes("content_policy")) {
        message = "Image rejected by content policy. Try different ad copy.";
      } else if (error.message.includes("billing") || error.message.includes("quota")) {
        message = "OpenAI billing limit reached. Check your API usage.";
      } else if (error.message.includes("model")) {
        message = `Model error: ${error.message}`;
      } else {
        message = error.message;
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
