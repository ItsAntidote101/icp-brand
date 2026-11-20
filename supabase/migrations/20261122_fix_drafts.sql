-- Ready-to-use wording for a fix ("Write it for me" on the dashboard).
-- One saved draft per fix per report, so it is written once and kept.
create table if not exists public.fix_drafts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  report_id  uuid not null,
  fix_index  smallint not null check (fix_index between 0 and 9),
  draft      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, report_id, fix_index)
);
create index if not exists fix_drafts_user_created on public.fix_drafts (user_id, created_at desc);

alter table public.fix_drafts enable row level security;
grant all on public.fix_drafts to service_role;
