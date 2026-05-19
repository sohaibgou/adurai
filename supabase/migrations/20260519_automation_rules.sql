-- Add automation_rules JSONB column to meta_connections
-- Stores per-user rule config: thresholds, enabled flags, caps
alter table public.meta_connections
  add column if not exists automation_rules jsonb;
