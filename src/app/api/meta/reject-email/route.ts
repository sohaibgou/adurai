/**
 * One-click reject from email link.
 * GET /api/meta/reject-email?token=<email_token>
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_URL ?? "https://adur.ai";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${BASE}/dashboard?action=invalid`);

  const { data: action } = await supabaseAdmin
    .from("auto_actions")
    .select("id, status")
    .eq("email_token", token)
    .eq("status", "pending")
    .single();

  if (!action) {
    return NextResponse.redirect(`${BASE}/dashboard?action=already_processed`);
  }

  await supabaseAdmin
    .from("auto_actions")
    .update({ status: "rejected" })
    .eq("id", action.id);

  return NextResponse.redirect(`${BASE}/dashboard?action=rejected`);
}
