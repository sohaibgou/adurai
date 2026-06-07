/**
 * GET /api/generate-video/poll?requestId=<id>
 *
 * Checks the status of a Kling Video generation job.
 * Returns:
 *   { status: "IN_QUEUE" | "IN_PROGRESS" }  — still running
 *   { status: "COMPLETED", video_url: string } — done
 *   { status: "FAILED", error: string }        — failed
 */
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { requireEmailVerified } from "@/lib/require-email-verified";

export const dynamic    = "force-dynamic";
export const maxDuration = 20;

const ENDPOINT = "fal-ai/kling-video/v3/pro/image-to-video";

export async function GET(req: NextRequest) {
  const auth = await requireEmailVerified(req);
  if (auth instanceof NextResponse) return auth;

  const key = process.env.FAL_KEY;
  if (!key) {
    return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
  }
  fal.config({ credentials: key });

  const requestId = req.nextUrl.searchParams.get("requestId");
  if (!requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = await fal.queue.status(ENDPOINT, { requestId, logs: false }) as any;
    const statusStr: string = status?.status ?? "";

    if (statusStr === "COMPLETED") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await fal.queue.result(ENDPOINT, { requestId }) as any;
      const videoUrl: string | undefined = result?.data?.video?.url;

      if (!videoUrl) {
        return NextResponse.json({ status: "FAILED", error: "No video URL in result" });
      }
      return NextResponse.json({ status: "COMPLETED", video_url: videoUrl });
    }

    if (statusStr === "FAILED") {
      return NextResponse.json({ status: "FAILED", error: "Video generation failed on fal.ai" });
    }

    // IN_QUEUE or IN_PROGRESS
    return NextResponse.json({ status: statusStr });
  } catch (e) {
    console.error("[generate-video/poll] error:", e);
    return NextResponse.json({ status: "FAILED", error: "Poll request failed" }, { status: 500 });
  }
}
