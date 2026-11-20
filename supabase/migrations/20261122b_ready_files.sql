-- "Ready to upload": things the dashboard prepares for a client to load into
-- an ad platform (first kind: Google keywords and words to block).
-- One saved set per kind per report.
create table if not exists public.ready_files (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  report_id  uuid not null,
  kind       text not null check (kind in ('google_keywords')),
  data       jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, report_id, kind)
);
create index if not exists ready_files_user_created on public.ready_files (user_id, created_at desc);

alter table public.ready_files enable row level security;
grant all on public.ready_files to service_role;
