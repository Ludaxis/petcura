-- Demo seed for local/staging only. Do not use real owner PII in seed files.

insert into public.clinics (id, name, slug, country, timezone, locale)
values (
  '00000000-0000-4000-8000-000000000001',
  'Alex Veterinary Clinic',
  'alex-vet-demo',
  'EE',
  'Europe/Tallinn',
  'en'
)
on conflict (slug) do nothing;
