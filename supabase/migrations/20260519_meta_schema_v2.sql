-- ─────────────────────────────────────────────────────────────────
-- Meta connections schema v2
-- Renames verbose column prefixes, adds autopilot + status columns.
-- Safe to run multiple times (all ops use IF EXISTS / IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────

-- 1. Rename meta_access_token → access_token
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meta_connections'
      AND column_name = 'meta_access_token'
  ) THEN
    ALTER TABLE public.meta_connections RENAME COLUMN meta_access_token TO access_token;
  END IF;
END $$;

-- 2. Rename meta_ad_account_id → ad_account_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meta_connections'
      AND column_name = 'meta_ad_account_id'
  ) THEN
    ALTER TABLE public.meta_connections RENAME COLUMN meta_ad_account_id TO ad_account_id;
  END IF;
END $$;

-- 3. Rename meta_ad_account_name → ad_account_name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meta_connections'
      AND column_name = 'meta_ad_account_name'
  ) THEN
    ALTER TABLE public.meta_connections RENAME COLUMN meta_ad_account_name TO ad_account_name;
  END IF;
END $$;

-- 4. Add new columns (all safe to add multiple times)
ALTER TABLE public.meta_connections
  ADD COLUMN IF NOT EXISTS autopilot_enabled boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_synced_at    timestamptz,
  ADD COLUMN IF NOT EXISTS status            text     NOT NULL DEFAULT 'active';

-- 5. Drop old token_expires_at if it was added in a previous migration (replaced by status)
-- ALTER TABLE public.meta_connections DROP COLUMN IF EXISTS token_expires_at;
-- (commented out — safe to keep)

-- 6. Make access_token / ad_account_id nullable during migration (they may not exist yet)
-- These NOT NULL constraints are enforced by the application layer.
