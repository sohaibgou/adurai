/**
 * POST /api/creatives/save
 *
 * Saves a generation session (images + copy) to the creative hub.
 * Images (data URLs) are uploaded to Supabase Storage; only the
 * resulting public URLs are stored in the DB.
 *
 * Auth: Authorization: Bearer <access_token>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic   = "force-dynamic";
export const maxDuration = 30;

const BUCKET = "creatives";

interface IncomingImage {
  url:       string;
  angle?:    string;
  headline?: string;
}

interface AdCopyVariant {
  hookType:    string;
  primaryText: string;
  headline:    string;
  description: string;
  cta:         string;
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    images?:       IncomingImage[];
    copyVariants?: AdCopyVariant[];
    prompt?:       string;
  };

  // At least one of images or copyVariants must be present
  if (!body.images?.length && !body.copyVariants?.length) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  // ── Ensure storage bucket exists (only needed when images are present) ────
  if (body.images?.length) {
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public:        true,
      fileSizeLimit: 5 * 1024 * 1024,
    }).catch(() => { /* bucket likely already exists — ignore */ });
  }

  // ── Upload each image to Supabase Storage ────────────────────────────────
  const setId = crypto.randomUUID();
  const saved: Array<{ url: string; angle?: string; headline?: string }> = [];

  for (const img of (body.images ?? [])) {
    // If not a data URL, keep as-is (already a remote URL)
    const match = img.url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      saved.push({ url: img.url, angle: img.angle, headline: img.headline });
      continue;
    }

    try {
      const mimeType  = match[1];
      const base64    = match[2];
      const buffer    = Buffer.from(base64, "base64");
      const ext       = mimeType.split("/")[1] ?? "jpg";
      const slug      = (img.angle ?? "image").replace(/\s+/g, "-").toLowerCase();
      const path      = `${user.id}/${setId}/${slug}.${ext}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mimeType, upsert: true });

      if (uploadErr) {
        console.error("[creatives/save] upload error:", uploadErr.message);
        // Fall back to keeping the data URL in the DB (large, but works)
        saved.push({ url: img.url, angle: img.angle, headline: img.headline });
        continue;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(path);

      saved.push({ url: publicUrl, angle: img.angle, headline: img.headline });
    } catch (e) {
      console.error("[creatives/save] image processing error:", e);
      saved.push({ url: img.url, angle: img.angle, headline: img.headline });
    }
  }

  // ── Insert record ─────────────────────────────────────────────────────────
  const { data, error: insertErr } = await supabaseAdmin
    .from("creatives")
    .insert({
      user_id:      user.id,
      image_urls:   saved,
      copy_variants: body.copyVariants ?? null,
      prompt:       body.prompt ?? null,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[creatives/save] DB insert error:", insertErr.message);
    return NextResponse.json({ error: "Failed to save creative" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
