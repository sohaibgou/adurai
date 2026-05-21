-- Job applications from /join
CREATE TABLE IF NOT EXISTS job_applications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  role        text,
  linkedin    text,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
-- Public insert only; reads via service role
CREATE POLICY "public_insert_job_applications"
  ON job_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Investor enquiries from /investors
CREATE TABLE IF NOT EXISTS investor_enquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  fund        text,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE investor_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_investor_enquiries"
  ON investor_enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
