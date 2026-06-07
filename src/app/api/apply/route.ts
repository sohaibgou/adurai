import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; role?: string; linkedin?: string; message?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, role, linkedin, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
  }

  // Length caps — reject oversized payloads before they hit the database.
  if (
    name.trim().length > 200 ||
    email.trim().length > 254 ||
    (role && role.length > 200) ||
    (linkedin && linkedin.length > 500) ||
    message.trim().length > 5000
  ) {
    return NextResponse.json({ error: "One or more fields are too long" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("job_applications").insert({
    name:    name.trim(),
    email:   email.trim().toLowerCase(),
    role:    role?.trim() || null,
    linkedin: linkedin?.trim() || null,
    message: message.trim(),
  });

  if (error) {
    console.error("[apply] Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
