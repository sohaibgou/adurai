-- Meta Ads OAuth connections
create table if not exists public.meta_connections (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  meta_user_id         text,
  meta_access_token    text not null,
  meta_ad_account_id   text not null,
  meta_ad_account_name text,
  connected_at         timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (user_id)
);

-- Only the user themselves or service role can read/write
alter table public.meta_connections enable row level security;

create policy "owner_select" on public.meta_connections
  for select using (auth.uid() = user_id);

create policy "owner_insert" on public.meta_connections
  for insert with check (auth.uid() = user_id);

create policy "owner_update" on public.meta_connections
  for update using (auth.uid() = user_id);

create policy "owner_delete" on public.meta_connections
  for delete using (auth.uid() = user_id);
