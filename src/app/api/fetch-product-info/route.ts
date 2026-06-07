/**
 * POST /api/fetch-product-info
 *
 * Uses Microlink to extract product/app metadata from any public URL.
 * Works for e-commerce pages, App Store listings, SaaS landing pages, etc.
 *
 * Body:    { url: string }
 * Returns: { title, description, image, logo, publisher, url }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireEmailVerified } from "@/lib/require-email-verified";

export const dynamic    = "force-dynamic";
export const maxDuration = 15;

interface MicrolinkData {
  title?:       string;
  description?: string;
  image?:       { url?: string };
  logo?:        { url?: string };
  publisher?:   string;
  url?:         string;
}

interface MicrolinkResponse {
  status: string;
  data?:  MicrolinkData;
}

export async function POST(req: NextRequest) {
  const auth = await requireEmailVerified(req);
  if (auth instanceof NextResponse) return auth;

  let body: { url?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const url = body.url?.trim();
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  // Basic URL validation
  try { new URL(url.startsWith("http") ? url : `https://${url}`); }
  catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(normalizedUrl)}&meta=true`;
    const res    = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      // 12 s timeout via signal
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Microlink error: ${res.status}` }, { status: 502 });
    }

    const json = await res.json() as MicrolinkResponse;
    const d    = json.data;

    return NextResponse.json({
      title:       d?.title       ?? "",
      description: d?.description ?? "",
      image:       d?.image?.url  ?? "",
      logo:        d?.logo?.url   ?? "",
      publisher:   d?.publisher   ?? "",
      url:         d?.url         ?? normalizedUrl,
    });
  } catch (e) {
    console.error("[fetch-product-info]", e);
    return NextResponse.json({ error: "Failed to fetch product info. Check the URL and try again." }, { status: 500 });
  }
}
