-- Track per-user analysis usage for free-plan enforcement
CREATE TABLE IF NOT EXISTS user_usage (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_count int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Users can read their own row; only service role can write
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_usage"
  ON user_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_usage_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION update_user_usage_timestamp();

-- Atomic upsert-increment called by the server after each successful analysis
CREATE OR REPLACE FUNCTION increment_user_analysis(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_usage (user_id, analysis_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET analysis_count = user_usage.analysis_count + 1;
END;
$$;
