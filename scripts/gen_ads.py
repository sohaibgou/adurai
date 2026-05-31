#!/usr/bin/env python3
"""Generate premium $1M-brand Meta ad creatives using the SAME prompt engine
the production /api/generate-creative route uses (persona + angle suffix +
FORMAT_SPEC + quality bar, text baked into the image)."""
import os, sys, json, base64, time, urllib.request, urllib.error

KEY = os.environ["GOOGLE_AI_KEY"]
# latest first, fall back to flash (mirrors IMAGE_MODELS in the backend route)
IMAGE_MODELS = ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"]
OUT_DIR = "public/showcase/ads"

FORMAT_SPEC = """
OUTPUT FORMAT — CRITICAL:
- SQUARE 1:1 composition — equal width and height, like a 1080×1080 pixel Meta Feed ad canvas
- Keep all critical content within the safe zone: centered 80% of the canvas, away from edges
- Mobile-first: typography must be large enough to read on a 6-inch phone screen
- Text coverage: ad copy should occupy no more than 20% of the image area
- No letterboxing, no widescreen, no portrait format — SQUARE ONLY"""

# (name, brief, angle_suffix)  — 4 angles matching the homepage showcase cards
ADS = [
    ("ad-1",
     "AURELIA — a $1M luxury skincare brand. Flagship product: a Vitamin-C + hyaluronic "
     "brightening serum in a frosted-glass dropper bottle. Premium, clinical-yet-warm, sells "
     "to women 28-45 who buy La Mer and Drunk Elephant.",
     """HERO PRODUCT SHOT — Channel Apple-level product photography. Pristine product centered on a clean, dramatic background (pure white, deep black, or bold complementary color). Professional studio lighting with subtle shadows for depth. Negative space. Zero clutter. Pure product confidence.
Ad copy on image: bold benefit-driven headline (4–7 words) + supporting subheadline (8–12 words) + pill-shaped CTA button at bottom. High-contrast typography legible on mobile."""),

    ("ad-2",
     "VITAL ROOTS — a $1M daily-wellness supplement brand. Flagship: a clinically-dosed "
     "immunity + energy capsule in a matte amber jar. Clean, trustworthy, modern health brand "
     "for busy professionals 30-50.",
     """SOCIAL PROOF — Lead with credibility. Bold numbers as the visual anchor: "50,000+ sold", "4.9★ from 12,400 reviews". Design feels like viral UGC or a screenshot testimonial blown up. Raw, authentic, trustworthy — not over-polished.
Ad copy on image: large bold proof statistic or star-rating graphic (★★★★★) as headline element + specific customer testimonial quote + trust-reinforcing CTA ("Join 50k+ Customers") at bottom."""),

    ("ad-3",
     "MAISON NOIR — a $1M elevated-basics fashion label. Hero look: a tailored oversized "
     "neutral-tone blazer and trousers set. Editorial, confident, minimalist. Targets style-led "
     "women 25-40 who shop COS and Aritzia.",
     """LIFESTYLE & EMOTION — Show the transformation, not the product. Feature a real person experiencing the result or benefit. Capture confidence, joy, or relief. Warm color grading, golden-hour or soft natural lighting. Feel editorial but authentic — magazine meets UGC.
Ad copy on image: emotionally-charged transformation headline + specific benefit subheadline + pill-shaped CTA ("Shop The Edit", "Discover Now") at bottom. Clean sans-serif, high-contrast."""),

    ("ad-4",
     "VOLT — a $1M functional sparkling-energy beverage brand. Hero: a sleek aluminium can, "
     "zero-sugar citrus flavor. Bold, youthful, scroll-stopping. Targets Gen-Z and millennial "
     "gym-goers and creators.",
     """PATTERN INTERRUPT — Break every category convention. Extreme macro close-up, bold unexpected color palette, split-screen contrast, or surreal conceptual scene. Something that makes someone stop mid-scroll and say "wait — what is that?" Visually disruptive, polarizing, and memorable.
Ad copy on image: oversized provocative headline as a design element (contrarian or curiosity-gap) + clarifying subheadline + bold CTA ("Find Out Why", "Switch Now"). Typography dominates."""),
]


def build_prompt(brief, suffix):
    langClause = ("\n\nLANGUAGE — CRITICAL: Every word of on-image text (headline, "
                  "subheadline, CTA, badges, captions) MUST be written in flawless, native English.")
    return f"""You are a world-class Meta ads creative director who has produced campaigns for Gymshark, MVMT, Dollar Shave Club, and dozens of 8-figure DTC brands. Produce a FINISHED, print-ready Meta Feed static ad creative.

BRIEF: {brief}

CREATIVE ANGLE — {suffix}

VISUAL STYLE: Choose the most effective visual style, color palette, lighting, mood, and typography for this specific product and target audience based on the brief — do not default to a generic look.

QUALITY BAR: This ad must look indistinguishable from a $50,000 agency production. Every pixel intentional. Scroll-stopping on a busy Instagram feed.{FORMAT_SPEC}{langClause}"""


def generate(prompt):
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }).encode()
    for model in IMAGE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/json", "x-goog-api-key": KEY},
        )
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=180) as r:
                    data = json.loads(r.read())
                parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                for p in parts:
                    if "inlineData" in p:
                        print(f"  ✓ {model}")
                        return base64.b64decode(p["inlineData"]["data"])
                print(f"  {model}: no image in response")
                break  # try next model
            except urllib.error.HTTPError as e:
                msg = e.read().decode()[:160]
                print(f"  {model} attempt {attempt+1}: HTTP {e.code} {msg}")
                if e.code in (429, 500, 503):
                    time.sleep(5 * (attempt + 1)); continue
                break  # try next model
            except Exception as e:
                print(f"  {model} attempt {attempt+1}: {e}")
                time.sleep(4 * (attempt + 1))
    raise RuntimeError("all models failed")


os.makedirs(OUT_DIR, exist_ok=True)
targets = sys.argv[1:] or [a[0] for a in ADS]
for name, brief, suffix in ADS:
    if name not in targets:
        continue
    print(f"Generating {name} ...")
    img = generate(build_prompt(brief, suffix))
    raw = f"{OUT_DIR}/{name}.png"
    with open(raw, "wb") as f:
        f.write(img)
    print(f"  saved {raw} ({len(img)} bytes)")
print("DONE")
