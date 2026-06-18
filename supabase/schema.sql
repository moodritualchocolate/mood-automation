-- ════════════════════════════════════════════════════════════════
-- MOOD Procurement Hub — Supabase schema
-- Run in the Supabase SQL editor to provision the cloud backend.
-- Provides multi-user data, realtime, role-based access and storage.
-- ════════════════════════════════════════════════════════════════

-- ── Enums ──
create type supplier_status as enum (
  'new','contacted','awaiting_response','sample_requested',
  'sample_received','quote_received','negotiation','approved','rejected'
);
create type material_kind as enum ('cocoa_mass','cocoa_butter','allulose','lecithin');
create type event_type as enum ('call','email','meeting','note','status','sample','quote');
create type file_category as enum ('coa','tds','quote','email','certificate','photo','other');
create type app_role as enum ('admin','manager','viewer');

-- ── Membership / roles ──
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role app_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- ── Suppliers ──
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact text,
  phone text,
  email text,
  website text,
  country text,
  notes text,
  status supplier_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Timeline events ──
create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers on delete cascade,
  type event_type not null default 'note',
  text text not null,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ── Raw materials ──
create table raw_materials (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers on delete cascade,
  kind material_kind not null,
  country text,
  product_code text,
  moq text,
  price text,
  coa boolean default false,
  score numeric,
  notes text,
  taste_notes text,
  variety text,
  origin text,           -- 'single' | 'blend'
  deodorized boolean,
  purity text,
  source text,           -- 'sunflower' | 'soy'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Samples ──
create table samples (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers on delete cascade,
  material_id uuid references raw_materials on delete set null,
  date timestamptz not null default now(),
  material text,
  impression text,
  taste numeric,
  texture numeric,
  melt numeric,
  aftertaste text,
  final_score numeric,
  suitable boolean,
  created_at timestamptz not null default now()
);

-- ── Quotes ──
create table quotes (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers on delete cascade,
  material text,
  price_per_kg numeric,
  moq text,
  lead_time text,
  payment_terms text,
  notes text,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ── Tasks ──
create table tasks (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

-- ── Files (metadata; binaries live in the 'files' storage bucket) ──
create table file_assets (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers on delete cascade,
  name text not null,
  category file_category not null default 'other',
  mime text,
  size bigint,
  storage_path text,
  created_at timestamptz not null default now()
);

-- ── updated_at trigger ──
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger trg_suppliers_updated before update on suppliers
  for each row execute function set_updated_at();
create trigger trg_materials_updated before update on raw_materials
  for each row execute function set_updated_at();

-- ── Realtime ──
alter publication supabase_realtime add table
  suppliers, timeline_events, raw_materials, samples, quotes, tasks, file_assets;

-- ── Row Level Security ──
-- Helper: current user's role.
create or replace function current_role() returns app_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

alter table suppliers       enable row level security;
alter table timeline_events enable row level security;
alter table raw_materials   enable row level security;
alter table samples         enable row level security;
alter table quotes          enable row level security;
alter table tasks           enable row level security;
alter table file_assets     enable row level security;
alter table profiles        enable row level security;

-- Authenticated users can read everything; admins/managers can write.
do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','timeline_events','raw_materials','samples','quotes','tasks','file_assets'
  ] loop
    execute format('create policy %1$s_read on %1$s for select to authenticated using (true);', t);
    execute format($f$create policy %1$s_write on %1$s for all to authenticated
      using (current_role() in ('admin','manager'))
      with check (current_role() in ('admin','manager'));$f$, t);
  end loop;
end $$;

create policy profiles_self on profiles for select to authenticated using (true);
create policy profiles_admin on profiles for all to authenticated
  using (current_role() = 'admin') with check (current_role() = 'admin');

-- New users get a profile automatically (default role: viewer).
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  return new;
end; $$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ── Storage bucket for COA / TDS / quotes / photos ──
insert into storage.buckets (id, name, public) values ('files','files', false)
  on conflict (id) do nothing;
create policy "files read"  on storage.objects for select to authenticated using (bucket_id = 'files');
create policy "files write" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and current_role() in ('admin','manager'));
