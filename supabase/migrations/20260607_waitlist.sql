-- Waitlist for autonomous-management early access
-- Captured from dashboard modal, homepage CTA, and pricing page.
CREATE TABLE IF NOT EXISTS waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  source     text,                                  -- where the signup came from
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public can join the waitlist (insert only); reads happen via service role.
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Speed up dedupe / lookup by email
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);
