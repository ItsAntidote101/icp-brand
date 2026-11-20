-- Two additive changes. Nothing existing is altered or removed.
--
-- 1. weekly_checkins.sales_value: what the week's sales were worth, so the
--    dashboard can show money earned beside money spent. Optional.
alter table public.weekly_checkins
  add column if not exists sales_value numeric(14,2) check (sales_value is null or sales_value >= 0);

-- 2. admin_client_views: the last time the media buyer opened a client's page
--    in the control room. One row per client. Lets the client's dashboard say,
--    truthfully, that their numbers were looked at.
create table if not exists public.admin_client_views (
  user_id        uuid primary key references public.users(id) on delete cascade,
  last_viewed_at timestamptz not null default now()
);

-- Server-only: RLS on with no policies, reached through the service role.
alter table public.admin_client_views enable row level security;
grant select, insert, update, delete on public.admin_client_views to service_role;
