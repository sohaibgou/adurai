/**
 * Silent server-side archive of every generated ad image.
 *
 * Purpose: keep a complete record of what clients generate (for oversight),
 * independent of whether they hit "Save". This does NOT change anything the
 * generation routes return to the client — it only uploads a copy of each
 * generated image to a private archive bucket. Failures are swallowed so the
 * archive can never break a generation response.
 *
 * Layout: ad-archive/{userId}/{YYYY-MM-DD}/{setId}-{angle}.{ext}
 * The bucket is PRIVATE — browse it from the Supabase dashboard (Storage).
 */
import { supabaseAdmin } from "@/lib/supabase-server";

const ARCHIVE_BUCKET = "ad-archive";
let bucketEnsured = false;

async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  await supabaseAdmin.storage
    .createBucket(ARCHIVE_BUCKET, { public: false, fileSizeLimit: 10 * 1024 * 1024 })
    .catch(() => { /* already exists — ignore */ });
  bucketEnsured = true;
}

/**
 * Archive a batch of generated images. Accepts the same `{ url, angle }` shape
 * the routes already build — `url` may be a `data:` URL (archived) or an
 * already-hosted URL (skipped). Never throws.
 */
export async function archiveGeneratedImages(
  userId: string,
  images: { url: string; angle?: string }[],
): Promise<void> {
  if (!userId || images.length === 0) return;
  try {
    await ensureBucket();
    const date  = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const setId = crypto.randomUUID();

    await Promise.all(images.map(async (img) => {
      const m = img.url.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return; // already a hosted URL — nothing to archive
      const mimeType = m[1];
      const buffer   = Buffer.from(m[2], "base64");
      const ext      = (mimeType.split("/")[1] ?? "png").split("+")[0];
      const slug     = (img.angle ?? "image").replace(/\s+/g, "-").toLowerCase();
      const path     = `${userId}/${date}/${setId}-${slug}.${ext}`;
      const { error } = await supabaseAdmin.storage
        .from(ARCHIVE_BUCKET)
        .upload(path, buffer, { contentType: mimeType, upsert: true });
      if (error) console.error("[archive] upload error:", error.message);
    }));
  } catch (e) {
    console.error("[archive] failed:", e instanceof Error ? e.message : e);
  }
}
