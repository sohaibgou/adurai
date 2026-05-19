import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    autopilot_mode?:  string;
    target_cpa?:      number;
    break_even_roas?: number;
  };

  const allowed = ["confirm", "auto", "off"];
  if (body.autopilot_mode && !allowed.includes(body.autopilot_mode)) {
    return NextResponse.json({ error: "Invalid autopilot_mode" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.autopilot_mode  !== undefined) updates.autopilot_mode  = body.autopilot_mode;
  if (body.target_cpa      !== undefined) updates.target_cpa      = body.target_cpa;
  if (body.break_even_roas !== undefined) updates.break_even_roas = body.break_even_roas;

  const { error } = await supabaseAdmin
    .from("meta_connections")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, ...updates });
}
