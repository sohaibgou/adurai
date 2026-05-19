import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { AnalysisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

// ── Security: verify Vercel cron secret ────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // skip in dev if not set
  return authHeader === `Bearer ${cronSecret}`;
}

// ── Fetch campaigns for an account ─────────────────────────────────────────
async function fetchCampaigns(adAccountId: string, token: string) {
  const url = new URL(`${GRAPH}/act_${adAccountId}/campaigns`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("fields", [
    "id", "name", "effective_status",
    "insights.date_preset(last_7d){spend,impressions,clicks,ctr,cpm,cpc,actions,action_values}",
  ].join(","));
  url.searchParams.set("limit", "30");
  const res  = await fetch(url.toString());
  const data = await res.json() as { data?: unknown[]; error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? "Graph error");
  return data.data ?? [];
}

// ── Run Claude MCP analysis for a single user ───────────────────────────────
async function runAnalysis(token: string, adAccountId: string): Promise<{ analysis: AnalysisResult; hasIssues: boolean }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type":    "application/json",
      "x-api-key":       process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "anthropic-beta":  "mcp-client-2025-04-04",
    },
    body: JSON.stringify({
      model:      "claude-opus-4-5",
      max_tokens: 4000,
      mcp_servers: [{
        type:                "url",
        url:                 "https://mcp.meta.com/ads",
        name:                "meta-ads",
        authorization_token: token,
      }],
      messages: [{
        role:    "user",
        content: `You are an expert media buyer running an automated account health check.

Using your Meta Ads MCP tools, pull the last 7 days of performance for ad account act_${adAccountId}.

Return a JSON object with exactly these fields:
{
  "summaries": [],
  "summary": "string",
  "score": number,
  "winners": [],
  "killers": [],
  "recommendations": [],
  "battlePlan": [],
  "insights": [],
  "totalSpend": number,
  "totalRevenue": number,
  "convResults": number,
  "convAvgCPR": number,
  "convBestRoas": number,
  "analysisMode": "roas"
}`,
      }],
    }),
  });

  const data = await res.json() as {
    content?: Array<{ type: string; text?: string }>;
    error?:   { message: string };
  };
  if (data.error) throw new Error(data.error.message);

  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");

  const jsonMatch = text.match(/```json\s*([\s\S]+?)\s*```/) ?? text.match(/(\{[\s\S]+\})/);
  const analysis  = JSON.parse(jsonMatch?.[1] ?? text) as AnalysisResult;
  const hasIssues = analysis.score < 60 || analysis.killers.length > 0;

  return { analysis, hasIssues };
}

// ── Send alert email via Resend (if configured) ────────────────────────────
async function sendAlertEmail(userEmail: string, score: number, killers: string[], adAccountName: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return; // Resend not configured — skip silently

  await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from:    "Adur.ai <alerts@adur.ai>",
      to:      [userEmail],
      subject: `⚠️ Meta Ads Alert — Account score dropped to ${score}/100`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#0D0D12">Autopilot Alert: ${adAccountName}</h2>
          <p>Your account health score dropped to <strong>${score}/100</strong>.</p>
          ${killers.length > 0 ? `
            <h3 style="color:#e17055">Budget Killers Detected</h3>
            <ul>
              ${killers.map((k) => `<li>${k}</li>`).join("")}
            </ul>
          ` : ""}
          <a href="https://adur.ai/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#FF3CAC,#FF6B35);color:#fff;text-decoration:none;border-radius:100px;font-weight:700;margin-top:16px">
            View Dashboard →
          </a>
          <p style="color:#A8A5A0;font-size:12px;margin-top:24px">
            Adur.ai Autopilot · <a href="https://adur.ai/dashboard">Manage alerts</a>
          </p>
        </div>
      `,
    }),
  });
}

// ── GET /api/monitor (Vercel Cron — every 6 hours) ─────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const results: Array<{ userId: string; score?: number; error?: string }> = [];

  // Get all active Meta connections
  const { data: connections, error: dbErr } = await supabaseAdmin
    .from("meta_connections")
    .select("user_id, access_token, ad_account_id, ad_account_name, autopilot_enabled, status")
    .eq("status", "active");

  if (dbErr) {
    console.error("[monitor] DB error:", dbErr);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  console.log(`[monitor] Running for ${connections?.length ?? 0} connections`);

  for (const conn of connections ?? []) {
    try {
      const { analysis, hasIssues } = await runAnalysis(conn.access_token, conn.ad_account_id);

      // Update last_synced_at
      await supabaseAdmin
        .from("meta_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", conn.user_id);

      // Send alert email if autopilot is on and issues found
      if (conn.autopilot_enabled && hasIssues) {
        // Get user email from auth
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(conn.user_id);
        if (authUser?.user?.email) {
          await sendAlertEmail(
            authUser.user.email,
            analysis.score,
            analysis.killers,
            conn.ad_account_name
          );
        }
      }

      results.push({ userId: conn.user_id, score: analysis.score });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      console.error(`[monitor] user=${conn.user_id} error:`, msg);
      results.push({ userId: conn.user_id, error: msg });
    }
  }

  const elapsed = Date.now() - startedAt;
  console.log(`[monitor] Done in ${elapsed}ms — ${results.length} processed`);

  return NextResponse.json({
    ok:        true,
    processed: results.length,
    elapsed:   `${elapsed}ms`,
    results,
  });
}
