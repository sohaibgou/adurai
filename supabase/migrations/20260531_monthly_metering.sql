-- Monthly metering for analysis + image counters
--
-- Previously analysis_count / image_count were lifetime totals. The new pricing
-- tiers cap these PER MONTH (Free 3 analyses/mo, Starter 10 analyses/mo + 5
-- images/mo, Growth 20 images/mo, etc.), so they must reset each calendar month
-- exactly like ugc_count already does via ugc_month.
--
-- Adds *_month tracking columns and rewrites the increment functions to reset
-- the counter to 1 whenever the stored month differs from the current YYYY-MM.

ALTER TABLE user_usage
  ADD COLUMN IF NOT EXISTS analysis_month CHAR(7),   -- 'YYYY-MM', reset monthly
  ADD COLUMN IF NOT EXISTS image_month    CHAR(7);   -- 'YYYY-MM', reset monthly

-- ── Increment analysis count with automatic monthly reset ────────────────────
CREATE OR REPLACE FUNCTION increment_user_analysis(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_month CHAR(7) := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
BEGIN
  INSERT INTO user_usage (user_id, analysis_count, analysis_month)
  VALUES (p_user_id, 1, current_month)
  ON CONFLICT (user_id)
  DO UPDATE SET
    analysis_count = CASE
      WHEN user_usage.analysis_month IS DISTINCT FROM current_month THEN 1
      ELSE user_usage.analysis_count + 1
    END,
    analysis_month = current_month;
END;
$$;

-- ── Increment image count with automatic monthly reset ───────────────────────
CREATE OR REPLACE FUNCTION increment_user_image(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_month CHAR(7) := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
BEGIN
  INSERT INTO user_usage (user_id, image_count, image_month)
  VALUES (p_user_id, 1, current_month)
  ON CONFLICT (user_id)
  DO UPDATE SET
    image_count = CASE
      WHEN user_usage.image_month IS DISTINCT FROM current_month THEN 1
      ELSE user_usage.image_count + 1
    END,
    image_month = current_month;
END;
$$;
