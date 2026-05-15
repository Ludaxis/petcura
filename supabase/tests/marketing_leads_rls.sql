begin;

set local role anon;

insert into public.marketing_leads (
  source,
  locale,
  clinic_name,
  contact_name,
  work_email,
  country,
  pms_system,
  monthly_request_volume,
  message,
  consent_given
)
values (
  'demo_page',
  'en',
  'Anonymous Vet Clinic',
  'Marta Tamm',
  'marta@example.test',
  'Estonia',
  'Provet',
  '100_300',
  'Interested in a WhatsApp-native pilot.',
  true
);

do $$
begin
  perform 1 from public.marketing_leads;
  raise exception 'anon should not select marketing leads';
exception
  when insufficient_privilege then
    null;
end $$;

do $$
begin
  update public.marketing_leads set clinic_name = 'Updated';
  raise exception 'anon should not update marketing leads';
exception
  when insufficient_privilege then
    null;
end $$;

do $$
begin
  delete from public.marketing_leads;
  raise exception 'anon should not delete marketing leads';
exception
  when insufficient_privilege then
    null;
end $$;

do $$
begin
  insert into public.marketing_leads (
    source,
    locale,
    clinic_name,
    contact_name,
    work_email,
    country,
    consent_given
  )
  values (
    'demo_page',
    'en',
    'No Consent Clinic',
    'Marta Tamm',
    'marta@example.test',
    'Estonia',
    false
  );
  raise exception 'anon should not insert marketing leads without consent';
exception
  when check_violation or insufficient_privilege then
    null;
end $$;

rollback;
