#!/usr/bin/env node
/**
 * Run Supabase migrations against the remote project.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<token> node scripts/migrate.js
 *
 * Get your personal access token at:
 *   https://supabase.com/dashboard/account/tokens
 *
 * The token is different from the service role key —
 * it's your personal management API token.
 */

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

const PROJECT_REF = "yfgergzqwjwvkxqilqrv";
const API_BASE    = "https://api.supabase.com/v1";

// ── Load env ──────────────────────────────────────────────────────────────────
let token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  // Try to read from .env.local
  try {
    const env = readFileSync(".env.local", "utf8");
    const match = env.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/m);
    if (match) token = match[1].trim();
  } catch { /* no .env.local */ }
}

if (!token) {
  console.error("\n❌  SUPABASE_ACCESS_TOKEN not set.\n");
  console.error("1. Go to https://supabase.com/dashboard/account/tokens");
  console.error("2. Create a new access token");
  console.error("3. Run: SUPABASE_ACCESS_TOKEN=<token> node scripts/migrate.js\n");
  process.exit(1);
}

// ── SQL to execute ────────────────────────────────────────────────────────────
const SQL = `
CREATE TABLE IF NOT EXISTS analyses (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  score          integer     NOT NULL DEFAULT 0,
  campaign_count integer     NOT NULL DEFAULT 0,
  result_json    jsonb       NOT NULL,
  form_data      jsonb
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analyses' AND policyname = 'users_read_own_analyses'
  ) THEN
    CREATE POLICY users_read_own_analyses
      ON analyses FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS analyses_user_created_idx
  ON analyses(user_id, created_at DESC);
`;

// ── Run via Management API ────────────────────────────────────────────────────
async function run() {
  console.log(`\n🔄  Running migration on project ${PROJECT_REF}…\n`);

  const res = await fetch(
    `${API_BASE}/projects/${PROJECT_REF}/database/query`,
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  const text = await res.text();

  if (!res.ok) {
    console.error(`❌  Migration failed (HTTP ${res.status}):`);
    try { console.error(JSON.parse(text)); } catch { console.error(text); }
    process.exit(1);
  }

  console.log("✅  Migration applied successfully!\n");
  console.log("    Table 'analyses' is ready — analysis results will now persist across sessions.\n");
}

run().catch(err => {
  console.error("❌  Unexpected error:", err.message);
  process.exit(1);
});
