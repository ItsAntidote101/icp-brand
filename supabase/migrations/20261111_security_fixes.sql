-- Security and data fixes for IdealICP (Nov 2026 review)
-- Safe to run on the live database: only adds tables/constraints and removes
-- a public permission. No existing rows are changed or deleted.

-- 1. Payment ledger: each Paystack reference can be applied exactly once,
--    at the amount and tier the server decided (see src/lib/payments.ts).
create table if not exists public.paystack_payments (
  reference        text primary key,
  email            text not null,
  tier             text not null,
  kind             text not null check (kind in ('new_subscription', 'proration')),
  expected_amount  integer not null check (expected_amount > 0),
  status           text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  paid_amount      integer,
  reject_reason    text,
  meta             jsonb,
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);
create index if not exists paystack_payments_email_idx on public.paystack_payments (email);
alter table public.paystack_payments enable row level security;
-- No policies on purpose: only the server (service role) may read or write.

-- 2. Table the code already reads and writes for AI personalisation
--    (region, industry, product). It never existed, so every call failed quietly.
create table if not exists public.questionnaire_responses (
  email       text primary key,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
alter table public.questionnaire_responses enable row level security;

-- 3. Reports are saved with ON CONFLICT (questionnaire_id), which needs a
--    unique constraint. Without it every report view failed to save.
alter table public.reports
  add constraint reports_questionnaire_id_key unique (questionnaire_id);

-- 4. rls_auto_enable() runs with owner rights and was callable by anyone
--    through the public API. Only the database itself needs it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
