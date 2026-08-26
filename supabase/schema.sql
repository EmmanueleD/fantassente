-- Idempotent schema for excel-assente-fantacalcio (design §2).
-- Run once in the Supabase SQL editor. Safe to re-run.

-- ---------- tables ----------
create table if not exists public.candidates (
  id           bigint generated always as identity primary key,
  slot         text    not null check (slot ~ '^(P[1-3]|D[1-8]|C[1-8]|A[1-6])$'),
  player_name  text    not null check (btrim(player_name) <> ''),
  max_price    integer not null check (max_price >= 1),
  priority     integer not null check (priority >= 1),
  created_at   timestamptz not null default now()
);
create index if not exists candidates_slot_idx on public.candidates (slot);
create index if not exists candidates_name_norm_idx
  on public.candidates (lower(btrim(player_name)));

create table if not exists public.purchases (
  id           bigint generated always as identity primary key,
  slot         text    not null unique              -- spec §1.4: one purchase per slot
                       check (slot ~ '^(P[1-3]|D[1-8]|C[1-8]|A[1-6])$'),
  player_name  text    not null check (btrim(player_name) <> ''),
  final_price  integer not null check (final_price >= 1),
  purchased_at timestamptz not null default now()
);

-- singleton config row (D-D): boolean PK pinned to true admits exactly one row
create table if not exists public.app_config (
  id              boolean primary key default true check (id),
  initial_budget  integer not null default 500 check (initial_budget >= 1),
  strategy_locked boolean not null default false,
  updated_at      timestamptz not null default now()
);
insert into public.app_config (id) values (true) on conflict (id) do nothing;

-- ---------- layer 1: RLS (no permissive policies at all) ----------
alter table public.candidates enable row level security;
alter table public.purchases  enable row level security;
alter table public.app_config enable row level security;
-- Deliberately ZERO policies: anon/authenticated see zero rows on every table.
-- service_role bypasses RLS and is the only key the app ever uses.

-- ---------- layer 2: column-level least privilege ----------
revoke all on public.candidates, public.purchases, public.app_config
  from anon, authenticated;

-- Mirrors exactly the client-visible field set of spec §7 / §2.2.
grant select (slot, player_name)                on public.candidates to anon, authenticated;
grant select (slot, player_name, final_price)   on public.purchases  to anon, authenticated;
grant select (initial_budget, strategy_locked)  on public.app_config to anon, authenticated;
-- max_price and priority are grantable to NO role except service_role/owner.
