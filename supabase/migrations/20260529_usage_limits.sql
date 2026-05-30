-- Extend user_usage with per-feature counters
-- image_count / copy_count  — lifetime totals (free plan hard cap = 3)
-- ugc_count / ugc_month     — monthly UGC total + current month key (YYYY-MM)

ALTER TABLE user_usage
  ADD COLUMN IF NOT EXISTS image_count INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS copy_count  INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ugc_count   INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ugc_month   CHAR(7);    -- 'YYYY-MM', reset monthly

-- ── Increment image count ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_user_image(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_usage (user_id, image_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET image_count = user_usage.image_count + 1;
END;
$$;

-- ── Increment copy count ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_user_copy(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_usage (user_id, copy_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET copy_count = user_usage.copy_count + 1;
END;
$$;

-- ── Increment UGC count with automatic monthly reset ─────────────────────────
-- If the stored ugc_month differs from the current YYYY-MM the count resets to 1.
CREATE OR REPLACE FUNCTION increment_user_ugc(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_month CHAR(7) := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
BEGIN
  INSERT INTO user_usage (user_id, ugc_count, ugc_month)
  VALUES (p_user_id, 1, current_month)
  ON CONFLICT (user_id)
  DO UPDATE SET
    ugc_count = CASE
      WHEN user_usage.ugc_month IS DISTINCT FROM current_month THEN 1
      ELSE user_usage.ugc_count + 1
    END,
    ugc_month = current_month;
END;
$$;
