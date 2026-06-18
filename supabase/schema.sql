-- ════════════════════════════════════════════════════════════════
-- MOOD Procurement Hub — Supabase schema (cloud sync backend)
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- It creates a single `records` table that stores every entity as JSON,
-- enables Realtime so all phones/devices stay in sync live, and sets
-- access policies.
--
-- Simple, robust, and a perfect fit for a small team's procurement tool.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- One row per entity (supplier / event / material / sample / quote / task / file).
create table if not exists records (
  id          text primary key,          -- the app-generated id (e.g. sup_xxx)
  kind        text not null,             -- supplier | event | material | sample | quote | task | file
  supplier_id text,                      -- denormalized for fast cascade deletes
  data        jsonb not null,            -- the full entity object, exactly as the app uses it
  updated_at  timestamptz not null default now()
);

create index if not exists records_kind_idx on records (kind);
create index if not exists records_supplier_idx on records (supplier_id);

-- Keep updated_at fresh.
create or replace function records_touch() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists records_touch_trg on records;
create trigger records_touch_trg before update on records
  for each row execute function records_touch();

-- ── Realtime ── broadcast every change to connected clients.
alter table records replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'records'
  ) then
    alter publication supabase_realtime add table records;
  end if;
end $$;

-- ── Access ──
-- The app ships with the public anon key, so the deployed URL + key act as
-- the shared workspace key. This lets every phone read/write with zero login
-- friction. Keep the deployment URL private to your team.
--
-- To lock it down later: turn on Supabase Auth (email magic link) and change
-- the policy roles from {anon, authenticated} to {authenticated}.
alter table records enable row level security;

drop policy if exists records_all on records;
create policy records_all on records
  for all
  to anon, authenticated
  using (true)
  with check (true);
