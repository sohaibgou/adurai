-- Add video support to the creatives table
ALTER TABLE creatives
  ADD COLUMN IF NOT EXISTS video_url   TEXT,
  ADD COLUMN IF NOT EXISTS media_type  TEXT NOT NULL DEFAULT 'image';

-- Index for fast filtering by type
CREATE INDEX IF NOT EXISTS creatives_media_type_idx ON creatives (user_id, media_type, created_at DESC);
