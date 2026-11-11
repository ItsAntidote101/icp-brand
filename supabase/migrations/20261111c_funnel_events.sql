-- Funnel events for the ad test: landing_view, questionnaire_started,
-- questionnaire_completed, report_viewed, call_requested, checkout_started, paid.
create table if not exists public.funnel_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null,
  anon_id     text,
  user_id     uuid references public.users(id) on delete set null,
  path        text,
  utm         jsonb,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists funnel_events_event_created_idx on public.funnel_events (event, created_at);
create index if not exists funnel_events_anon_idx on public.funnel_events (anon_id);
create index if not exists funnel_events_user_idx on public.funnel_events (user_id);
alter table public.funnel_events enable row level security;
