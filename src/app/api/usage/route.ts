import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-server";

const FREE_LIMIT   = 3;
const ADMIN_EMAILS = ["sohaibitotv@gmail.com"];

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the token and get the user
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

  // Check paid status
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  const isPaid = !!sub;

  // Get usage count
  const { data: usageRow } = await supabaseAdmin
    .from("user_usage")
    .select("analysis_count")
    .eq("user_id", user.id)
    .maybeSingle();
  const analysisCount = usageRow?.analysis_count ?? 0;

  return NextResponse.json({
    analysisCount,
    freeLimit: FREE_LIMIT,
    remaining: isAdmin || isPaid ? null : Math.max(0, FREE_LIMIT - analysisCount),
    isPaid,
    isAdmin,
  });
}
