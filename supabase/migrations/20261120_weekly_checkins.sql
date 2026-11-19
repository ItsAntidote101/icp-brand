-- Weekly numbers check-in: the client logs last week's ad spend, leads and
-- sales. Additive only: one new table and one new column.
create table if not exists public.weekly_checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  week_start  date not null,                       -- Monday of the week reported
  spend       numeric(14,2) not null check (spend >= 0),
  currency    text not null default 'KES',
  leads       integer not null check (leads >= 0),
  sales       integer not null default 0 check (sales >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, week_start)
);

-- Server-only table: RLS on with no policies, reached through the service role.
alter table public.weekly_checkins enable row level security;
grant select, insert, update, delete on public.weekly_checkins to service_role;

alter table public.users add column if not exists weekly_numbers_opt_out boolean not null default false;
