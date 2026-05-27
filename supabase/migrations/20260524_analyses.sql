-- Persist full AI analysis results per authenticated user
-- Allows /results page to reload data across sessions/tabs/browsers

CREATE TABLE IF NOT EXISTS analyses (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  score          integer     NOT NULL DEFAULT 0,
  campaign_count integer     NOT NULL DEFAULT 0,
  result_json    jsonb       NOT NULL,   -- full AnalysisResult object
  form_data      jsonb                   -- OnboardingData (nullable)
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users can read only their own analyses
CREATE POLICY "users_read_own_analyses"
  ON analyses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role inserts via server API (bypasses RLS automatically)

-- Fast lookup: latest analysis for a given user
CREATE INDEX IF NOT EXISTS analyses_user_created_idx
  ON analyses(user_id, created_at DESC);
