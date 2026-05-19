-- ────────────────────────────────────────────────────────────────────
-- auto_actions: every action Adur detects (pending, executed, etc.)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.auto_actions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  campaign_id   text not null,
  campaign_name text not null,
  action_type   text not null,        -- 'pause' | 'scale' | 'alert'
  reason        text not null,
  status        text not null default 'pending',
                                      -- 'pending' | 'approved' | 'rejected'
                                      -- | 'executed' | 'alerted'
  new_budget    integer,              -- new daily budget in $ for 'scale' actions
  email_token   uuid not null default gen_random_uuid(),
  executed_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.auto_actions enable row level security;

create policy "aa_owner_select" on public.auto_actions
  for select using (auth.uid() = user_id);
create policy "aa_owner_insert" on public.auto_actions
  for insert with check (auth.uid() = user_id);
create policy "aa_owner_update" on public.auto_actions
  for update using (auth.uid() = user_id);
create policy "aa_owner_delete" on public.auto_actions
  for delete using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists aa_user_status on public.auto_actions(user_id, status);
create index if not exists aa_email_token  on public.auto_actions(email_token);

-- ────────────────────────────────────────────────────────────────────
-- meta_connections: add autopilot_mode + detection thresholds
-- ────────────────────────────────────────────────────────────────────
alter table public.meta_connections
  add column if not exists autopilot_mode  text    not null default 'confirm',
  add column if not exists target_cpa      numeric          default 50,
  add column if not exists break_even_roas numeric          default 2;

-- autopilot_mode values: 'confirm' | 'auto' | 'off'
