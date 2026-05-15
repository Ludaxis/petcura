begin;

set local search_path = public, extensions;

select plan(5);

set local role anon;

select lives_ok(
  $test$
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
  )
  $test$,
  'anon can insert a consented marketing lead'
);

select throws_ok(
  $test$ select 1 from public.marketing_leads limit 1 $test$,
  '42501',
  'permission denied for table marketing_leads',
  'anon cannot select marketing leads'
);

select throws_ok(
  $test$ update public.marketing_leads set clinic_name = 'Updated' $test$,
  '42501',
  'permission denied for table marketing_leads',
  'anon cannot update marketing leads'
);

select throws_ok(
  $test$ delete from public.marketing_leads $test$,
  '42501',
  'permission denied for table marketing_leads',
  'anon cannot delete marketing leads'
);

select lives_ok(
  $test$
  do $block$
  begin
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
    end;
  end
  $block$;
  $test$,
  'anon cannot insert marketing leads without consent'
);

reset role;
select * from finish();

rollback;
