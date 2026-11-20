-- Admin control room. Additive only.
-- client_messages: human messages between a client and the media buyer, both
-- directions, so they live in one thread instead of only in email.
create table if not exists public.client_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  direction   text not null check (direction in ('in', 'out')),   -- in = from client
  kind        text not null default 'message',
  body        text not null,
  ref_id      uuid,
  created_at  timestamptz not null default now(),
  handled_at  timestamptz
);
create index if not exists client_messages_user_idx on public.client_messages (user_id, created_at desc);

-- Private notes the buyer keeps about a client. Never shown to the client.
create table if not exists public.admin_client_notes (
  user_id     uuid primary key references public.users(id) on delete cascade,
  body        text not null default '',
  updated_at  timestamptz not null default now()
);

alter table public.client_messages    enable row level security;
alter table public.admin_client_notes enable row level security;
grant select, insert, update, delete on public.client_messages, public.admin_client_notes to service_role;
