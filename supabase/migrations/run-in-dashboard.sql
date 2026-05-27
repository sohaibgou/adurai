-- Run this in your Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/yfgergzqwjwvkxqilqrv/sql/new

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
