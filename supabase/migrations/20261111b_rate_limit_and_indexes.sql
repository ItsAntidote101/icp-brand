-- Per-IP diagnosis rate limit + indexes on foreign keys (Supabase advisor).
-- Additive only: no data changes.

alter table public.diagnostics add column if not exists client_ip text;
create index if not exists diagnostics_client_ip_created_idx on public.diagnostics (client_ip, created_at);

create index if not exists billing_history_user_id_idx        on public.billing_history (user_id);
create index if not exists chat_messages_user_id_idx          on public.chat_messages (user_id);
create index if not exists diagnostics_questionnaire_id_idx   on public.diagnostics (questionnaire_id);
create index if not exists diagnostics_user_id_idx            on public.diagnostics (user_id);
create index if not exists escalations_user_id_idx            on public.escalations (user_id);
create index if not exists intelligence_briefings_user_id_idx on public.intelligence_briefings (user_id);
create index if not exists intelligence_questions_user_id_idx on public.intelligence_questions (user_id);
create index if not exists questionnaires_user_id_idx         on public.questionnaires (user_id);
create index if not exists quick_win_completions_user_id_idx  on public.quick_win_completions (user_id);
create index if not exists reports_user_id_idx                on public.reports (user_id);
create index if not exists subscriptions_user_id_idx          on public.subscriptions (user_id);
create index if not exists user_milestones_user_id_idx        on public.user_milestones (user_id);
-- reports.questionnaire_id is already covered by its unique constraint
