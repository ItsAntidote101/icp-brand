-- Five tables had no privileges for service_role, so every server write failed
-- with "permission denied": payments ledger, funnel events, AI context,
-- billing history and monthly check-ins. Server-only access; anon and
-- authenticated stay locked out (RLS on, no policies).
grant select, insert, update, delete on table
  public.paystack_payments,
  public.funnel_events,
  public.questionnaire_responses,
  public.billing_history,
  public.monthly_checkins
to service_role;

-- Future tables in public get server access by default
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
