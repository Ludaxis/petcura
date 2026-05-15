begin;

set local search_path = public, extensions;

select plan(8);

set local role anon;

select lives_ok(
  $test$
  insert into public.marketing_leads (
    id,
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
    '71000000-0000-4000-8000-000000000001',
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
  $test$ select 1 from public.marketing_lead_events limit 1 $test$,
  '42501',
  'permission denied for table marketing_lead_events',
  'anon cannot select marketing lead events'
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

set local role service_role;

select lives_ok(
  $test$
  update public.marketing_leads
  set
    status = 'contacted',
    admin_note = 'Follow up after the pilot intro.',
    last_contacted_at = now(),
    last_contacted_by = '71000000-0000-4000-8000-0000000000aa'
  where id = '71000000-0000-4000-8000-000000000001'
  $test$,
  'service role can update marketing lead workflow fields'
);

select lives_ok(
  $test$
  insert into public.marketing_lead_events (
    lead_id,
    actor_id,
    actor_email,
    action,
    payload_json
  )
  values (
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-0000000000aa',
    'superadmin@example.test',
    'status_changed',
    '{"status":"contacted"}'::jsonb
  )
  $test$,
  'service role can insert marketing lead events'
);

reset role;
select * from finish();

rollback;
