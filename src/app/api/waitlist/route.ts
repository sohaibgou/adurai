import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const source = body.source?.trim() || null;

  // Lightweight email sanity check
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  // Length caps — reject oversized payloads before they hit the database.
  if (email.length > 254 || (source && source.length > 100)) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("waitlist").insert({ email, source });

  if (error) {
    console.error("[waitlist] Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
