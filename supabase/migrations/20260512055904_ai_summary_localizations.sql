alter table public.requests
  add column if not exists ai_summary_translations_json jsonb not null default '{}'::jsonb;

comment on column public.requests.ai_summary_translations_json is
  'Cached staff-facing AI summary localizations keyed by locale. Source English summary remains in ai_summary; staff edits for translated views are stored here.';
