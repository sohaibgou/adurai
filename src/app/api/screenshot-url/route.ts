/**
 * POST /api/screenshot-url
 *
 * Takes a public URL and returns a screenshot image URL via Microlink.
 * No API key needed for basic usage (50 req/day on free tier).
 *
 * Body: { url: string }
 * Returns: { screenshotUrl: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireEmailVerified } from "@/lib/require-email-verified";

export const dynamic    = "force-dynamic";
export const maxDuration = 15;

interface MicrolinkResponse {
  status: string;
  data?: {
    screenshot?: { url?: string };
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireEmailVerified(req);
  if (auth instanceof NextResponse) return auth;

  let body: { url?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const url = body.url?.trim();
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
    const res    = await fetch(apiUrl, { headers: { "Accept": "application/json" } });

    if (!res.ok) {
      return NextResponse.json({ error: `Microlink error: ${res.status}` }, { status: 502 });
    }

    const json = await res.json() as MicrolinkResponse;
    const screenshotUrl = json.data?.screenshot?.url;

    if (!screenshotUrl) {
      return NextResponse.json({ error: "Screenshot not available for this URL" }, { status: 422 });
    }

    return NextResponse.json({ screenshotUrl });
  } catch (e) {
    console.error("[screenshot-url] error:", e);
    return NextResponse.json({ error: "Failed to screenshot URL" }, { status: 500 });
  }
}
