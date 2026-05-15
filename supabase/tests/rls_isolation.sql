begin;

select plan(3);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'staff-a@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'staff-b@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'viewer-a@example.test',
    '',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.clinics (id, name, slug)
values
  ('20000000-0000-4000-8000-000000000001', 'Clinic A', 'rls-clinic-a'),
  ('20000000-0000-4000-8000-000000000002', 'Clinic B', 'rls-clinic-b');

insert into public.clinic_staff (clinic_id, user_id, role)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'admin'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'admin'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'viewer'
  );

insert into public.owners (id, clinic_id, phone, name)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '+372000001',
    'Owner A'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '+372000002',
    'Owner B'
  );

insert into public.clinic_web_intake_configs (clinic_id)
values
  ('20000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002');

insert into public.clinic_hours (clinic_id, weekday, opens_at, closes_at)
values
  ('20000000-0000-4000-8000-000000000001', 1, '09:00', '17:00'),
  ('20000000-0000-4000-8000-000000000002', 1, '09:00', '17:00');

insert into public.clinic_emergency_policies (clinic_id, emergency_phone)
values
  ('20000000-0000-4000-8000-000000000001', '+372000001'),
  ('20000000-0000-4000-8000-000000000002', '+372000002');

insert into public.web_intake_sessions (
  clinic_id,
  public_token_hash,
  owner_id,
  locale,
  consented_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'token-a',
    '30000000-0000-4000-8000-000000000001',
    'en',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'token-b',
    '30000000-0000-4000-8000-000000000002',
    'en',
    now()
  );

insert into public.ai_memory_items (
  id,
  clinic_id,
  scope_type,
  scope_id,
  memory_type,
  content_text,
  status,
  confidence
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'owner',
    '30000000-0000-4000-8000-000000000001',
    'communication_preference',
    'Owner prefers Estonian follow-up messages.',
    'accepted',
    0.900
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'owner',
    '30000000-0000-4000-8000-000000000002',
    'communication_preference',
    'Owner prefers Russian follow-up messages.',
    'accepted',
    0.900
  );

insert into public.ai_memory_sources (
  clinic_id,
  memory_item_id,
  source_type,
  source_id
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'ai_output',
    '50000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'ai_output',
    '50000000-0000-4000-8000-000000000002'
  );

set local role authenticated;
do $jwt$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '10000000-0000-4000-8000-000000000001',
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end
$jwt$;

select lives_ok(
  $test$
  do $block$
begin
  if (select count(*) from public.owners) <> 1 then
    raise exception 'staff A should see exactly one owner';
  end if;

  if exists (
    select 1
    from public.owners
    where clinic_id = '20000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'staff A can see clinic B owner';
  end if;

  if (select count(*) from public.ai_memory_items) <> 1 then
    raise exception 'staff A should see exactly one AI memory item';
  end if;

  if (select count(*) from public.clinic_web_intake_configs) <> 1 then
    raise exception 'staff A should see exactly one web intake config';
  end if;

  if (select count(*) from public.clinic_hours) <> 1 then
    raise exception 'staff A should see exactly one clinic hours row';
  end if;

  if (select count(*) from public.clinic_emergency_policies) <> 1 then
    raise exception 'staff A should see exactly one emergency policy';
  end if;

  if (select count(*) from public.web_intake_sessions) <> 1 then
    raise exception 'staff A should see exactly one web intake session';
  end if;

  if exists (
    select 1
    from public.ai_memory_sources
    where clinic_id = '20000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'staff A can see clinic B AI memory source';
  end if;

  insert into public.ai_memory_items (
    clinic_id,
    scope_type,
    scope_id,
    memory_type,
    content_text,
    status
  )
  values (
    '20000000-0000-4000-8000-000000000001',
    'owner',
    '30000000-0000-4000-8000-000000000001',
    'owner_preference',
    'Owner prefers morning callback windows.',
    'candidate'
  );

  begin
    insert into public.clinic_hours (clinic_id, weekday, opens_at, closes_at)
    values ('20000000-0000-4000-8000-000000000002', 2, '09:00', '17:00');
    raise exception 'staff A inserted clinic B hours row';
  exception
    when others then
      if sqlstate not in ('42501', '23514') then
        raise;
      end if;
  end;

  begin
    insert into public.ai_memory_items (
      clinic_id,
      scope_type,
      scope_id,
      memory_type,
      content_text,
      status
    )
    values (
      '20000000-0000-4000-8000-000000000002',
      'owner',
      '30000000-0000-4000-8000-000000000002',
      'owner_preference',
      'Cross-clinic write should be blocked.',
      'candidate'
    );
    raise exception 'staff A inserted clinic B AI memory item';
  exception
    when others then
      if sqlstate not in ('42501', '23514') then
        raise;
      end if;
  end;
end
$block$;
  $test$,
  'staff A can only read and write allowed clinic A data'
);

reset role;
set local role authenticated;
do $jwt$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '10000000-0000-4000-8000-000000000003',
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end
$jwt$;

select lives_ok(
  $test$
  do $block$
begin
  if (select count(*) from public.ai_memory_items) <> 2 then
    raise exception 'viewer A should read clinic A AI memory items';
  end if;

  begin
    insert into public.ai_memory_items (
      clinic_id,
      scope_type,
      scope_id,
      memory_type,
      content_text,
      status
    )
    values (
      '20000000-0000-4000-8000-000000000001',
      'owner',
      '30000000-0000-4000-8000-000000000001',
      'owner_preference',
      'Viewer write should be blocked.',
      'candidate'
    );
    raise exception 'viewer inserted AI memory item';
  exception
    when others then
      if sqlstate not in ('42501', '23514') then
        raise;
      end if;
  end;
end
$block$;
  $test$,
  'viewer A can read clinic A memory but cannot write'
);

reset role;
set local role anon;
do $jwt$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
end
$jwt$;

select lives_ok(
  $test$
  do $block$
begin
  if (select count(*) from public.owners) <> 0 then
    raise exception 'anonymous user can read owners';
  end if;

  if (select count(*) from public.ai_memory_items) <> 0 then
    raise exception 'anonymous user can read AI memory items';
  end if;

  begin
    if (select count(*) from public.web_intake_sessions) <> 0 then
      raise exception 'anonymous user can read web intake sessions';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    if (select count(*) from public.clinic_web_intake_configs) <> 0 then
      raise exception 'anonymous user can read web intake configs';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    if (select count(*) from public.clinic_emergency_policies) <> 0 then
      raise exception 'anonymous user can read emergency policies';
    end if;
  exception
    when insufficient_privilege then null;
  end;
end
$block$;
  $test$,
  'anonymous users cannot read tenant-owned private data'
);

reset role;
select * from finish();

rollback;
