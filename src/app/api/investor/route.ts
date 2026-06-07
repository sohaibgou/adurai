import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; fund?: string; message?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, fund, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
  }

  // Length caps — reject oversized payloads before they hit the database.
  if (
    name.trim().length > 200 ||
    email.trim().length > 254 ||
    (fund && fund.length > 200) ||
    message.trim().length > 5000
  ) {
    return NextResponse.json({ error: "One or more fields are too long" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("investor_enquiries").insert({
    name:    name.trim(),
    email:   email.trim().toLowerCase(),
    fund:    fund?.trim() || null,
    message: message.trim(),
  });

  if (error) {
    console.error("[investor] Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
