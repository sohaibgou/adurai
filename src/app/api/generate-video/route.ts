/**
 * POST /api/generate-video
 *
 * Submits an image-to-video job to fal.ai Kling Video v3 Pro.
 * Returns { requestId } immediately — the client polls /api/generate-video/poll.
 *
 * Accepts { image_url } — can be a public HTTP URL or a base64 data URL.
 * Data URLs are uploaded to fal storage first so Kling can fetch them.
 */
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { requireEmailVerified } from "@/lib/require-email-verified";

export const dynamic    = "force-dynamic";
export const maxDuration = 30;

const ENDPOINT = "fal-ai/kling-video/v3/pro/image-to-video";

export async function POST(req: NextRequest) {
  // Auth gate — image-to-video submits paid fal.ai jobs; never leave open.
  const auth = await requireEmailVerified(req);
  if (auth instanceof NextResponse) return auth;

  const key = process.env.FAL_KEY;
  if (!key) {
    return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
  }
  fal.config({ credentials: key });

  let body: { image_url?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawUrl = body.image_url?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "image_url required" }, { status: 400 });
  }

  // ── If data URL, upload to fal storage to get a public HTTP URL ─────────
  let imageUrl = rawUrl;
  if (rawUrl.startsWith("data:")) {
    const match = rawUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
    }
    try {
      const mimeType = match[1];
      const buffer   = Buffer.from(match[2], "base64");
      const blob     = new Blob([buffer], { type: mimeType });
      const file     = new File([blob], "image.png", { type: mimeType });
      imageUrl = await fal.storage.upload(file);
    } catch (e) {
      console.error("[generate-video] storage upload error:", e);
      return NextResponse.json({ error: "Failed to upload image to fal storage" }, { status: 500 });
    }
  }

  // ── Submit job — returns request_id immediately ─────────────────────────
  try {
    const { request_id } = await fal.queue.submit(ENDPOINT, {
      input: { start_image_url: imageUrl },
    });
    return NextResponse.json({ requestId: request_id });
  } catch (e) {
    console.error("[generate-video] submit error:", e);
    return NextResponse.json({ error: "Failed to submit video job" }, { status: 500 });
  }
}
