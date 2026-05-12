create table if not exists public.message_translations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  ai_output_id uuid references public.ai_outputs(id) on delete set null,
  source_locale text not null,
  target_locale text not null check (target_locale in ('en', 'et', 'ru')),
  translated_body text not null,
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (message_id, target_locale)
);
alter table public.message_translations enable row level security;
drop policy if exists message_translations_isolation on public.message_translations;
create policy message_translations_isolation on public.message_translations
  using (clinic_id = public.current_clinic_id())
  with check (clinic_id = public.current_clinic_id());
grant select on public.message_translations to authenticated;
create index if not exists message_translations_message_locale_idx
  on public.message_translations (message_id, target_locale);
create index if not exists message_translations_clinic_created_idx
  on public.message_translations (clinic_id, created_at desc);
alter table public.message_translations replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.message_translations;
exception
  when duplicate_object then null;
end $$;
