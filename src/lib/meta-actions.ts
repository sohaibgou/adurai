/**
 * Core auto-actions engine.
 * Used by /api/monitor (cron), /api/meta/approve, and /api/meta/reject.
 */
import { supabaseAdmin } from "./supabase-server";

const GRAPH = "https://graph.facebook.com/v21.0";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionType    = "pause" | "scale" | "alert";
export type AutopilotMode = "confirm" | "auto" | "off";

export interface ActionParams {
  userId:       string;
  campaignId:   string;
  campaignName: string;
  actionType:   ActionType;
  reason:       string;
  metaToken:    string;
  newBudget?:   number; // new daily budget in $ for 'scale'
}

// ── Execute action on Meta Graph API ─────────────────────────────────────────

export async function executeMetaAction(params: {
  campaignId:  string;
  actionType:  ActionType;
  metaToken:   string;
  newBudget?:  number;
}): Promise<void> {
  if (params.actionType === "alert") return; // alerts never touch Meta API

  const body: Record<string, unknown> = { access_token: params.metaToken };

  if (params.actionType === "pause") {
    body.status = "PAUSED";
  } else if (params.actionType === "scale" && params.newBudget) {
    body.daily_budget = params.newBudget * 100; // Meta uses cents
  } else {
    return; // nothing to do
  }

  const res  = await fetch(`${GRAPH}/${params.campaignId}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(`Meta API error: ${err.error?.message ?? res.statusText}`);
  }
}

// ── Email helpers ─────────────────────────────────────────────────────────────

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch { return null; }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] no RESEND_API_KEY — skipped: "${subject}" → ${to}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body:    JSON.stringify({ from: "Adur.ai <alerts@adur.ai>", to: [to], subject, html }),
  });
  if (!res.ok) console.error("[email] Resend error:", await res.text());
}

const BASE = () => process.env.NEXT_PUBLIC_URL ?? "https://adur.ai";

export async function sendApprovalEmail(
  userId:       string,
  actionId:     string,
  emailToken:   string,
  campaignName: string,
  actionType:   string,
  reason:       string,
): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) return;

  const approveUrl = `${BASE()}/api/meta/approve-email?token=${emailToken}`;
  const rejectUrl  = `${BASE()}/api/meta/reject-email?token=${emailToken}`;
  const label      = actionType === "pause" ? "Pause campaign"
                   : actionType === "scale" ? "Increase budget"
                   : "Review campaign";

  await sendEmail(
    email,
    `Adur recommends: ${label} — ${campaignName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F7F5F2">
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E8E5E0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#FF3CAC,#FF6B35);display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-weight:900;font-size:15px">A</span>
          </div>
          <span style="font-size:16px;font-weight:700;color:#0D0D12">Adur.ai — Approval Needed</span>
        </div>
        <h2 style="color:#0D0D12;font-size:18px;margin:0 0 6px">${label}: <span style="color:#FF3CAC">${campaignName}</span></h2>
        <div style="background:#F7F5F2;border-radius:10px;padding:14px;margin:14px 0;border-left:3px solid #FF3CAC">
          <p style="margin:0;color:#0D0D12;font-size:13px;line-height:1.6">${reason}</p>
        </div>
        <p style="color:#6B6B72;font-size:12px;margin-bottom:20px">
          Your autopilot is set to <strong>Always Confirm</strong> — Adur will only act after you approve.
        </p>
        <table style="width:100%;border-collapse:separate;border-spacing:8px">
          <tr>
            <td style="width:50%">
              <a href="${approveUrl}" style="display:block;padding:13px;background:linear-gradient(135deg,#16A34A,#22c55e);color:#fff;text-decoration:none;border-radius:100px;font-weight:700;font-size:14px;text-align:center">✓ Approve</a>
            </td>
            <td style="width:50%">
              <a href="${rejectUrl}" style="display:block;padding:13px;background:#fff;color:#e17055;text-decoration:none;border-radius:100px;font-weight:700;font-size:14px;text-align:center;border:1px solid rgba(225,112,85,0.3)">✕ Reject</a>
            </td>
          </tr>
        </table>
        <p style="color:#A8A5A0;font-size:11px;text-align:center;margin-top:16px">
          Or <a href="${BASE()}/dashboard" style="color:#FF3CAC">manage in your dashboard</a>
        </p>
      </div>
    </div>`,
  );
}

export async function sendBriefingEmail(userId: string, message: string): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) return;
  await sendEmail(
    email,
    "Adur Autopilot — Action Executed",
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F7F5F2">
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E8E5E0">
        <h2 style="color:#0D0D12">Autopilot Executed ✓</h2>
        <div style="background:#F7F5F2;border-radius:10px;padding:14px;margin:14px 0;border-left:3px solid #16A34A">
          <p style="margin:0;color:#0D0D12;font-size:13px;line-height:1.6">${message}</p>
        </div>
        <a href="${BASE()}/dashboard" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#FF3CAC,#FF6B35);color:#fff;text-decoration:none;border-radius:100px;font-weight:700">View Dashboard →</a>
      </div>
    </div>`,
  );
}

export async function sendAlertOnlyEmail(userId: string, reason: string, campaignName: string): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) return;
  await sendEmail(
    email,
    `⚠️ Adur Alert — ${campaignName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F7F5F2">
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E8E5E0">
        <h2 style="color:#0D0D12">Campaign Alert ⚠️</h2>
        <div style="background:#FFF9F5;border-radius:10px;padding:14px;margin:14px 0;border-left:3px solid #e17055">
          <p style="margin:0;color:#0D0D12;font-size:13px;line-height:1.6">${reason}</p>
        </div>
        <a href="${BASE()}/dashboard" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#FF3CAC,#FF6B35);color:#fff;text-decoration:none;border-radius:100px;font-weight:700">View Dashboard →</a>
        <p style="color:#A8A5A0;font-size:11px;margin-top:14px">Autopilot is in Alerts Only mode — handle this change manually.</p>
      </div>
    </div>`,
  );
}

// ── Core executeOrQueue ───────────────────────────────────────────────────────

export async function executeOrQueue(action: ActionParams): Promise<void> {
  // Dedup: skip if a pending action already exists for this campaign + type
  const { data: existing } = await supabaseAdmin
    .from("auto_actions")
    .select("id")
    .eq("user_id",     action.userId)
    .eq("campaign_id", action.campaignId)
    .eq("action_type", action.actionType)
    .eq("status",      "pending")
    .maybeSingle();
  if (existing) return;

  // Get autopilot mode
  const { data: conn } = await supabaseAdmin
    .from("meta_connections")
    .select("autopilot_mode")
    .eq("user_id", action.userId)
    .single();

  const mode = (conn?.autopilot_mode ?? "confirm") as AutopilotMode;

  // ── MODE: auto — execute immediately ─────────────────────────────────────
  if (mode === "auto") {
    try {
      await executeMetaAction({
        campaignId: action.campaignId,
        actionType: action.actionType,
        metaToken:  action.metaToken,
        newBudget:  action.newBudget,
      });
      await supabaseAdmin.from("auto_actions").insert({
        user_id:       action.userId,
        campaign_id:   action.campaignId,
        campaign_name: action.campaignName,
        action_type:   action.actionType,
        reason:        action.reason,
        new_budget:    action.newBudget ?? null,
        status:        "executed",
        executed_at:   new Date().toISOString(),
      });
      await sendBriefingEmail(action.userId,
        `Adur auto-executed: ${action.reason}`);
    } catch (err) {
      console.error("[executeOrQueue] auto-exec failed:", err);
      // Fall back to confirm queue if execution fails
      await insertAndNotify(action);
    }

  // ── MODE: confirm — queue for approval ───────────────────────────────────
  } else if (mode === "confirm") {
    await insertAndNotify(action);

  // ── MODE: off — alerts only ───────────────────────────────────────────────
  } else {
    await supabaseAdmin.from("auto_actions").insert({
      user_id:       action.userId,
      campaign_id:   action.campaignId,
      campaign_name: action.campaignName,
      action_type:   action.actionType,
      reason:        action.reason,
      new_budget:    action.newBudget ?? null,
      status:        "alerted",
    });
    await sendAlertOnlyEmail(action.userId, action.reason, action.campaignName);
  }
}

async function insertAndNotify(action: ActionParams): Promise<void> {
  const { data: inserted } = await supabaseAdmin
    .from("auto_actions")
    .insert({
      user_id:       action.userId,
      campaign_id:   action.campaignId,
      campaign_name: action.campaignName,
      action_type:   action.actionType,
      reason:        action.reason,
      new_budget:    action.newBudget ?? null,
      status:        "pending",
    })
    .select("id, email_token")
    .single();

  if (inserted) {
    await sendApprovalEmail(
      action.userId,
      inserted.id,
      inserted.email_token,
      action.campaignName,
      action.actionType,
      action.reason,
    );
  }
}
