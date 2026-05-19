import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── GET /api/autopilot/settings ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("meta_connections")
    .select("autopilot_mode, automation_rules, target_cpa, break_even_roas, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected:       true,
    autopilotMode:   data.autopilot_mode   ?? "confirm",
    automationRules: data.automation_rules ?? null,
    targetCpa:       data.target_cpa       ?? 50,
    breakEvenRoas:   data.break_even_roas  ?? 2,
  });
}

// ── POST /api/autopilot/settings ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    autopilotMode?:   string;
    automationRules?: Record<string, unknown>;
    targetCpa?:       number;
    breakEvenRoas?:   number;
  };

  const allowed = ["confirm", "auto", "off"];
  if (body.autopilotMode && !allowed.includes(body.autopilotMode)) {
    return NextResponse.json({ error: "Invalid autopilotMode" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.autopilotMode   !== undefined) updates.autopilot_mode   = body.autopilotMode;
  if (body.automationRules !== undefined) updates.automation_rules = body.automationRules;
  if (body.targetCpa       !== undefined) updates.target_cpa       = body.targetCpa;
  if (body.breakEvenRoas   !== undefined) updates.break_even_roas  = body.breakEvenRoas;

  const { error } = await supabaseAdmin
    .from("meta_connections")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
