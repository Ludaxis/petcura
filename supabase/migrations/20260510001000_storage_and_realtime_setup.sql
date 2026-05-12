-- PetCura hosted Supabase setup for private media and realtime clinic inboxes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'request-attachments',
    'request-attachments',
    false,
    52428800,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'video/mp4',
      'application/pdf'
    ]
  ),
  (
    'pet-photos',
    'pet-photos',
    false,
    10485760,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
create policy "clinic staff can read request attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'request-attachments'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
);
create policy "clinic staff can upload request attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'request-attachments'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
);
create policy "clinic staff can read pet photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
);
create policy "clinic staff can upload pet photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
);
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'requests'
  ) then
    alter publication supabase_realtime add table public.requests;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'request_events'
  ) then
    alter publication supabase_realtime add table public.request_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reminders'
  ) then
    alter publication supabase_realtime add table public.reminders;
  end if;
end $$;
alter table public.requests replica identity full;
alter table public.messages replica identity full;
alter table public.request_events replica identity full;
alter table public.reminders replica identity full;
