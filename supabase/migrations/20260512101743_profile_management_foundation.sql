-- Profile management foundation for staff, customers, and pets.
-- Staff identity stays in auth.users; editable display fields live here.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  phone text,
  job_title text,
  avatar_url text,
  locale text not null default 'en' check (locale in ('en', 'et', 'ru')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.owners
  add column if not exists photo_url text;

create or replace function public.set_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_user_profiles_updated_at();

create index if not exists user_profiles_display_name_idx
  on public.user_profiles (display_name);

create index if not exists owners_clinic_name_idx
  on public.owners (clinic_id, name);

alter table public.user_profiles enable row level security;

drop policy if exists user_profiles_self_or_clinic_select on public.user_profiles;
create policy user_profiles_self_or_clinic_select
on public.user_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.clinic_staff viewer
    join public.clinic_staff subject
      on subject.clinic_id = viewer.clinic_id
     and subject.user_id = public.user_profiles.user_id
     and subject.is_active = true
    where viewer.user_id = (select auth.uid())
      and viewer.is_active = true
  )
);

drop policy if exists user_profiles_self_insert on public.user_profiles;
create policy user_profiles_self_insert
on public.user_profiles
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists user_profiles_self_update on public.user_profiles;
create policy user_profiles_self_update
on public.user_profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, update on public.user_profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  false,
  5242880,
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

drop policy if exists "clinic staff can read profile media" on storage.objects;
create policy "clinic staff can read profile media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
);

drop policy if exists "clinic staff can upload profile media" on storage.objects;
create policy "clinic staff can upload profile media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
);

drop policy if exists "clinic staff can update profile media" on storage.objects;
create policy "clinic staff can update profile media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
)
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = public.current_clinic_id()::text
);

comment on table public.user_profiles is
  'Editable staff profile fields. Authentication identity remains in auth.users.';
comment on column public.user_profiles.avatar_url is
  'Private storage path or signed/public URL for the staff avatar.';
comment on column public.owners.photo_url is
  'Private storage path or signed/public URL for the owner/customer avatar.';
