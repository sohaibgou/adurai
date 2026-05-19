-- Add token_expires_at column (safe to run even if table already exists)
alter table public.meta_connections
  add column if not exists token_expires_at timestamptz;
