-- Monthly note from the media buyer to each paid client. Additive only.
-- A note is a draft until the buyer sends it; only sent notes reach clients.
create table if not exists public.buyer_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  body        text not null,
  media_url   text,
  status      text not null default 'draft' check (status in ('draft', 'sent')),
  ai_drafted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  sent_at     timestamptz,
  read_at     timestamptz
);
create index if not exists buyer_notes_user_sent_idx on public.buyer_notes (user_id, sent_at desc);

alter table public.buyer_notes enable row level security;
grant select, insert, update, delete on public.buyer_notes to service_role;
