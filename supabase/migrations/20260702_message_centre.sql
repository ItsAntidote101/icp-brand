-- Message Centre: lets any of the named media buyers log in and take over
-- a user's chat/escalation thread, instead of a single shared ADMIN_SECRET
-- posting replies attributed to a hardcoded "Eugene".
--
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: every statement is idempotent.

-- ─── media_buyers ───────────────────────────────────────────────────────────
-- Backs the previously hardcoded MEDIA_BUYERS array in the dashboard.
-- IDs are fixed literals so application code (src/lib/buyers.ts) can
-- reference the same rows without a lookup.

create table if not exists media_buyers (
  id           uuid primary key,
  email        text not null unique,
  name         text not null,
  first_name   text not null,
  initials     text not null,
  avatar_color text not null,
  title        text not null,
  speciality   text not null,
  bio          text not null,
  years_exp    integer not null default 0,
  cal_link     text,
  regions      text[] not null default '{}',
  industries   text[] not null default '{}',
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

insert into media_buyers (id, email, name, first_name, initials, avatar_color, title, speciality, bio, years_exp, cal_link, regions, industries)
values
  ('11111111-0000-4000-8000-000000000001', 'eugene@idealicp.com', 'Eugene Kariuki', 'Eugene', 'EK', '#201515',
   'B2B Media Buyer', 'B2B SaaS, Fintech, East Africa paid acquisition',
   '7 years running Meta and Google for B2B SaaS and fintech companies across East Africa. Specialist in M-Pesa-integrated funnels and WhatsApp lead qualification.',
   7, 'https://calendly.com/idealicp/eugene-review',
   array['Kenya','Uganda','Tanzania','East Africa'], array['SaaS','Fintech','B2B','Technology']),

  ('11111111-0000-4000-8000-000000000002', 'aisha@idealicp.com', 'Aisha Mensah', 'Aisha', 'AM', '#7c3aed',
   'E-commerce Media Buyer', 'DTC, e-commerce, West Africa performance',
   '6 years scaling DTC and e-commerce brands in Nigeria and Ghana. Built Meta Shopping and Google Performance Max campaigns generating 4x+ ROAS for over 40 brands.',
   6, 'https://calendly.com/idealicp/aisha-review',
   array['West Africa (Nigeria, Ghana)','Nigeria','Ghana'], array['E-commerce','DTC','Retail','FMCG','Consumer']),

  ('11111111-0000-4000-8000-000000000003', 'david@idealicp.com', 'David Osei', 'David', 'DO', '#0369a1',
   'Growth Media Buyer', 'B2B services, professional services, Southern Africa',
   '8 years in B2B lead generation for professional services firms. Managed LinkedIn and Google budgets from KES 50,000 to KES 2M per month across South Africa and global markets.',
   8, 'https://calendly.com/idealicp/david-review',
   array['South Africa','Global/Multiple Regions'], array['Professional Services','Consulting','Finance','Insurance','B2B Services']),

  ('11111111-0000-4000-8000-000000000004', 'grace@idealicp.com', 'Grace Nakato', 'Grace', 'GN', '#065f46',
   'Local & SME Media Buyer', 'Local businesses, healthcare, education, SMEs',
   '5 years growing local and SME brands in East Africa. Expert in Google Local, Meta lead ads, and low-budget high-efficiency campaigns for businesses under KES 200,000/month.',
   5, 'https://calendly.com/idealicp/grace-review',
   array['Kenya','Uganda','Tanzania'], array['Healthcare','Education','Local Services','Hospitality','Real Estate']),

  ('11111111-0000-4000-8000-000000000005', 'marcus@idealicp.com', 'Marcus Webb', 'Marcus', 'MW', '#9a3412',
   'International Media Buyer', 'UK, Europe, North America B2B and SaaS',
   '9 years managing international paid acquisition for B2B and SaaS companies across the UK, Europe, and North America. Specialist in multi-market funnel optimisation and LinkedIn ABM.',
   9, 'https://calendly.com/idealicp/marcus-review',
   array['UK & Ireland','Europe (non-UK)','North America (US/Canada)','Middle East','Southeast Asia','South Asia (India/Pakistan)','Latin America','Australia & New Zealand'], array[]::text[])
on conflict (id) do update set
  email        = excluded.email,
  name         = excluded.name,
  first_name   = excluded.first_name,
  initials     = excluded.initials,
  avatar_color = excluded.avatar_color,
  title        = excluded.title,
  speciality   = excluded.speciality,
  bio          = excluded.bio,
  years_exp    = excluded.years_exp,
  cal_link     = excluded.cal_link,
  regions      = excluded.regions,
  industries   = excluded.industries;

-- ─── users ──────────────────────────────────────────────────────────────────
-- Persists the assignment that was previously recomputed on every render.

alter table users
  add column if not exists assigned_buyer_id uuid references media_buyers(id);

-- ─── chat_messages ──────────────────────────────────────────────────────────
-- Know which buyer actually sent a media_buyer-role message, and let the
-- buyer inbox show unread counts for incoming user messages.

alter table chat_messages
  add column if not exists buyer_id uuid references media_buyers(id),
  add column if not exists read_by_buyer boolean not null default false;

create index if not exists idx_chat_messages_user_created
  on chat_messages (user_id, created_at);

-- ─── escalations ────────────────────────────────────────────────────────────
-- assigned_buyer_id: who this user is assigned to (informational).
-- claimed_by: whoever actually picked up the ticket — any buyer may claim
-- any conversation, so this can differ from assigned_buyer_id.

alter table escalations
  add column if not exists assigned_buyer_id uuid references media_buyers(id),
  add column if not exists claimed_by uuid references media_buyers(id),
  add column if not exists claimed_at timestamptz;

create index if not exists idx_escalations_status on escalations (status);
create index if not exists idx_escalations_claimed_by on escalations (claimed_by);
