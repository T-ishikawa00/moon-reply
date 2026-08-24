\set ON_ERROR_STOP on
\pset tuples_only on

set role service_role;

do $proof$
declare
  result jsonb;
  replay jsonb;
  active_duplicate jsonb;
  later_case jsonb;
  context jsonb;
  invalid_case record;
  before_fingerprint text;
  after_fingerprint text;
  unauthorized_count integer;
  function_count integer;
  rls_count integer;
begin
  if (select count(*) from public.production_customer_support_cases
      where id = 'd2f00000-0000-4000-8000-000000000007') <> 1
     or (select count(*) from public.production_customer_support_case_events
      where case_id = 'd2f00000-0000-4000-8000-000000000007') <> 1 then
    raise exception 'M2_D2_CONCURRENCY_DURABLE_COUNT_FAILED';
  end if;

  select pg_catalog.md5(coalesce(pg_catalog.string_agg(
    authority.table_name || ':' || authority.digest,
    '|' order by authority.table_name
  ), '')) into before_fingerprint
  from (
    select 'production_purchase_intents' as table_name,
      pg_catalog.md5(coalesce(pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]')) as digest
    from public.production_purchase_intents as row_value
    union all
    select 'production_payment_attempts', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_payment_attempts as row_value
    union all
    select 'production_verified_payments', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_verified_payments as row_value
    union all
    select 'production_stripe_event_ledger', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_stripe_event_ledger as row_value
    union all
    select 'production_fulfillment_jobs', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_fulfillment_jobs as row_value
    union all
    select 'production_logical_assessments', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_logical_assessments as row_value
    union all
    select 'production_customer_deliveries', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_customer_deliveries as row_value
    union all
    select 'production_notification_outbox', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_notification_outbox as row_value
  ) as authority;

  result := public.create_production_customer_support_case_v1(
    'd2f00000-0000-4000-8000-000000000001',
    'd2e10000-0000-4000-8000-000000000001',
    'd2100000-0000-4000-8000-000000000001',
    'd2500000-0000-4000-8000-000000000001',
    'payment_charge', 'synthetic note', repeat('a1', 32), repeat('b1', 32),
    '2026-08-24T02:00:00Z'
  );
  if result->>'disposition' <> 'created' or result->>'status' <> 'open' then
    raise exception 'M2_D2_CREATE_FAILED';
  end if;

  replay := public.create_production_customer_support_case_v1(
    'd2f10000-0000-4000-8000-000000000001',
    'd2e20000-0000-4000-8000-000000000001',
    'd2100000-0000-4000-8000-000000000001',
    'd2500000-0000-4000-8000-000000000001',
    'payment_charge', 'synthetic note', repeat('a1', 32), repeat('b1', 32),
    '2026-08-24T02:00:01Z'
  );
  if replay->>'disposition' <> 'replay'
     or replay->>'case_id' <> result->>'case_id' then
    raise exception 'M2_D2_REPLAY_FAILED';
  end if;

  begin
    perform public.create_production_customer_support_case_v1(
      'd2f10000-0000-4000-8000-000000000002',
      'd2e20000-0000-4000-8000-000000000002',
      'd2100000-0000-4000-8000-000000000001',
      'd2500000-0000-4000-8000-000000000001',
      'payment_charge', 'changed', repeat('a1', 32), repeat('b2', 32),
      '2026-08-24T02:00:02Z'
    );
    raise exception 'M2_D2_EXPECTED_IDEMPOTENCY_CONFLICT';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'M2_D2_SUPPORT_IDEMPOTENCY_CONFLICT' then raise; end if;
  end;

  active_duplicate := public.create_production_customer_support_case_v1(
    'd2f10000-0000-4000-8000-000000000003',
    'd2e20000-0000-4000-8000-000000000003',
    'd2100000-0000-4000-8000-000000000001',
    'd2500000-0000-4000-8000-000000000001',
    'payment_charge', null, repeat('a2', 32), repeat('b2', 32),
    '2026-08-24T02:00:03Z'
  );
  if active_duplicate->>'disposition' <> 'active_case'
     or active_duplicate->>'case_id' <> result->>'case_id' then
    raise exception 'M2_D2_ACTIVE_DEDUPE_FAILED';
  end if;

  for invalid_case in
    select * from (values
      ('d2f10000-0000-4000-8000-000000000010'::uuid,
       'd2e20000-0000-4000-8000-000000000010'::uuid,
       'd2100000-0000-4000-8000-000000000002'::uuid,
       'd2500000-0000-4000-8000-000000000001'::uuid,
       'result_delivery'::text, repeat('c1', 32), repeat('d1', 32)),
      ('d2f10000-0000-4000-8000-000000000011'::uuid,
       'd2e20000-0000-4000-8000-000000000011'::uuid,
       'd2100000-0000-4000-8000-000000000001'::uuid,
       'd2500000-0000-4000-8000-000000000099'::uuid,
       'result_delivery'::text, repeat('c2', 32), repeat('d2', 32)),
      ('d2f10000-0000-4000-8000-000000000012'::uuid,
       'd2e20000-0000-4000-8000-000000000012'::uuid,
       null::uuid, 'd2500000-0000-4000-8000-000000000001'::uuid,
       'result_delivery'::text, repeat('c3', 32), repeat('d3', 32))
    ) as invalid_case(case_id, event_id, customer_id, purchase_id, category, key_hash, input_hash)
  loop
    begin
      perform public.create_production_customer_support_case_v1(
        invalid_case.case_id, invalid_case.event_id, invalid_case.customer_id,
        invalid_case.purchase_id, invalid_case.category, null,
        invalid_case.key_hash, invalid_case.input_hash,
        '2026-08-24T02:00:04Z'
      );
      raise exception 'M2_D2_EXPECTED_OWNERSHIP_REJECTION';
    exception when sqlstate 'P0001' then
      if sqlerrm not in (
        'M2_D2_SUPPORT_PURCHASE_NOT_OWNED', 'M2_D2_SUPPORT_CASE_INVALID'
      ) then raise; end if;
    end;
  end loop;

  begin
    perform public.create_production_customer_support_case_v1(
      'd2f10000-0000-4000-8000-000000000013',
      'd2e20000-0000-4000-8000-000000000013',
      'd2100000-0000-4000-8000-000000000001', null,
      'result_delivery', null, repeat('c4', 32), repeat('d4', 32),
      '2026-08-24T02:00:04Z'
    );
    raise exception 'M2_D2_EXPECTED_REQUIRED_PURCHASE_REJECTION';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'M2_D2_SUPPORT_PURCHASE_REQUIRED' then raise; end if;
  end;

  begin
    perform public.create_production_customer_support_case_v1(
      'd2f10000-0000-4000-8000-000000000014',
      'd2e20000-0000-4000-8000-000000000014',
      'd2100000-0000-4000-8000-000000000001', null,
      'invalid', null, repeat('c5', 32), repeat('d5', 32),
      '2026-08-24T02:00:04Z'
    );
    raise exception 'M2_D2_EXPECTED_CATEGORY_REJECTION';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'M2_D2_SUPPORT_CASE_INVALID' then raise; end if;
  end;

  result := public.create_production_customer_support_case_v1(
    'd2f10000-0000-4000-8000-000000000015',
    'd2e20000-0000-4000-8000-000000000015',
    'd2100000-0000-4000-8000-000000000001', null,
    'account_login', null, repeat('c6', 32), repeat('d6', 32),
    '2026-08-24T02:00:05Z'
  );
  if result->>'disposition' <> 'created' then
    raise exception 'M2_D2_NON_PURCHASE_CASE_FAILED';
  end if;

  perform public.transition_production_support_case_v1(
    'd2f00000-0000-4000-8000-000000000001',
    'd2e30000-0000-4000-8000-000000000001',
    'resolved', 'SYNTHETIC_RESOLVED', '2026-08-24T02:01:00Z'
  );
  perform public.transition_production_support_case_v1(
    'd2f00000-0000-4000-8000-000000000001',
    'd2e30000-0000-4000-8000-000000000002',
    'closed', 'SYNTHETIC_CLOSED', '2026-08-24T02:02:00Z'
  );
  later_case := public.create_production_customer_support_case_v1(
    'd2f10000-0000-4000-8000-000000000016',
    'd2e20000-0000-4000-8000-000000000016',
    'd2100000-0000-4000-8000-000000000001',
    'd2500000-0000-4000-8000-000000000001',
    'payment_charge', null, repeat('c7', 32), repeat('d7', 32),
    '2026-08-24T02:03:00Z'
  );
  if later_case->>'disposition' <> 'created'
     or later_case->>'case_id' = result->>'case_id' then
    raise exception 'M2_D2_CLOSED_LATER_CASE_FAILED';
  end if;

  for result in
    select public.create_production_customer_support_case_v1(
      format('d2f20000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
      format('d2e40000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
      'd2100000-0000-4000-8000-000000000001',
      format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
      'result_delivery', null,
      pg_catalog.md5('context-key-a-' || n) || pg_catalog.md5('context-key-b-' || n),
      pg_catalog.md5('context-input-a-' || n) || pg_catalog.md5('context-input-b-' || n),
      '2026-08-24T02:04:00Z'
    ) from generate_series(2, 6) as n
  loop
    if result->>'disposition' <> 'created' then
      raise exception 'M2_D2_CONTEXT_CASE_CREATE_FAILED';
    end if;
  end loop;

  context := public.resolve_production_support_case_context_v1(
    'd2f20000-0000-4000-8000-000000000002', '2026-08-24T02:05:00Z'
  );
  if context->>'purchase_state' <> 'verified'
     or (context->>'payment_verified')::boolean is not true
     or context->>'fulfillment_state' <> 'pending'
     or (context->>'result_available')::boolean is not false then
    raise exception 'M2_D2_CONTEXT_VERIFIED_PENDING_FAILED';
  end if;

  context := public.resolve_production_support_case_context_v1(
    'd2f20000-0000-4000-8000-000000000003', '2026-08-24T02:05:00Z'
  );
  if context->>'fulfillment_state' <> 'processing'
     or (context->>'result_available')::boolean is not false then
    raise exception 'M2_D2_CONTEXT_PROCESSING_FAILED';
  end if;

  context := public.resolve_production_support_case_context_v1(
    'd2f20000-0000-4000-8000-000000000004', '2026-08-24T02:05:00Z'
  );
  if context->>'fulfillment_state' <> 'manual_review'
     or (context->>'fulfillment_manual_review')::boolean is not true then
    raise exception 'M2_D2_CONTEXT_MANUAL_REVIEW_FAILED';
  end if;

  context := public.resolve_production_support_case_context_v1(
    'd2f20000-0000-4000-8000-000000000005', '2026-08-24T02:05:00Z'
  );
  if context->>'fulfillment_state' <> 'completed'
     or (context->>'delivery_completed')::boolean is not true
     or (context->>'result_available')::boolean is not true
     or context->>'notification_state' <> 'sent' then
    raise exception 'M2_D2_CONTEXT_COMPLETED_FAILED';
  end if;

  context := public.resolve_production_support_case_context_v1(
    'd2f20000-0000-4000-8000-000000000006', '2026-08-24T02:05:00Z'
  );
  if (context->>'result_available')::boolean is not true
     or context->>'notification_state' <> 'failed' then
    raise exception 'M2_D2_CONTEXT_EMAIL_FAILED_FAILED';
  end if;

  update public.production_customer_ownership_bindings set
    customer_user_id = null,
    delivery_email_sha256 = null,
    delivery_email_ciphertext = null,
    delivery_email_key_version = null,
    delivery_email_verified_source = null,
    delivery_email_verified_at = null,
    state = 'identity_detached',
    identity_detached_at = '2026-08-24T02:06:00Z',
    updated_at = '2026-08-24T02:06:00Z'
  where id = 'd2400000-0000-4000-8000-000000000008';
  begin
    perform public.create_production_customer_support_case_v1(
      'd2f10000-0000-4000-8000-000000000017',
      'd2e20000-0000-4000-8000-000000000017',
      'd2100000-0000-4000-8000-000000000002',
      'd2500000-0000-4000-8000-000000000008',
      'payment_charge', null, repeat('c8', 32), repeat('d8', 32),
      '2026-08-24T02:06:01Z'
    );
    raise exception 'M2_D2_EXPECTED_DETACHED_REJECTION';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'M2_D2_SUPPORT_PURCHASE_NOT_OWNED' then raise; end if;
  end;

  select count(*) into unauthorized_count
  from (values
    ('anon'), ('authenticated'), ('m2_b2_stripe_ingress')
  ) as role_name(name)
  cross join (values
    ('production_customer_support_cases'),
    ('production_customer_support_case_events')
  ) as table_name(name)
  where pg_catalog.has_table_privilege(
    role_name.name, 'public.' || table_name.name,
    'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
  );
  if unauthorized_count <> 0 then
    raise exception 'M2_D2_UNAUTHORIZED_TABLE_PRIVILEGE';
  end if;

  select count(*) into unauthorized_count
  from (values
    ('anon'), ('authenticated'), ('m2_b2_stripe_ingress')
  ) as role_name(name)
  cross join (values
    ('public.create_production_customer_support_case_v1(uuid,uuid,uuid,uuid,text,text,text,text,timestamptz)'),
    ('public.resolve_production_support_case_context_v1(uuid,timestamptz)'),
    ('public.transition_production_support_case_v1(uuid,uuid,text,text,timestamptz)')
  ) as function_name(name)
  where pg_catalog.has_function_privilege(
    role_name.name, function_name.name, 'EXECUTE'
  );
  if unauthorized_count <> 0 then
    raise exception 'M2_D2_UNAUTHORIZED_FUNCTION_EXECUTE';
  end if;

  select count(*) into function_count
  from pg_catalog.pg_proc as procedure
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname in (
      'create_production_customer_support_case_v1',
      'resolve_production_support_case_context_v1',
      'transition_production_support_case_v1'
    )
    and not procedure.prosecdef
    and coalesce(procedure.proconfig, array[]::text[])
      @> array['search_path=""']::text[];
  if function_count <> 3 then
    raise exception 'M2_D2_FUNCTION_SECURITY_FAILED';
  end if;

  select count(*) into rls_count
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname in (
      'production_customer_support_cases',
      'production_customer_support_case_events'
    )
    and relation.relrowsecurity;
  if rls_count <> 2 then raise exception 'M2_D2_RLS_FAILED'; end if;

  if pg_catalog.has_table_privilege(
      'service_role', 'public.production_customer_support_case_events',
      'UPDATE,DELETE,TRUNCATE'
    ) then
    raise exception 'M2_D2_EVENT_APPEND_ONLY_FAILED';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'production_customer_support_cases',
        'production_customer_support_case_events'
      )
      and column_name ~ '(consultation|result_body|token|otp|capability|email|stripe|provider|checkout|card)'
  ) then
    raise exception 'M2_D2_FORBIDDEN_SUPPORT_COLUMN';
  end if;

  select pg_catalog.md5(coalesce(pg_catalog.string_agg(
    authority.table_name || ':' || authority.digest,
    '|' order by authority.table_name
  ), '')) into after_fingerprint
  from (
    select 'production_purchase_intents' as table_name,
      pg_catalog.md5(coalesce(pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]')) as digest
    from public.production_purchase_intents as row_value
    union all
    select 'production_payment_attempts', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_payment_attempts as row_value
    union all
    select 'production_verified_payments', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_verified_payments as row_value
    union all
    select 'production_stripe_event_ledger', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_stripe_event_ledger as row_value
    union all
    select 'production_fulfillment_jobs', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_fulfillment_jobs as row_value
    union all
    select 'production_logical_assessments', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_logical_assessments as row_value
    union all
    select 'production_customer_deliveries', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_customer_deliveries as row_value
    union all
    select 'production_notification_outbox', pg_catalog.md5(coalesce(
      pg_catalog.jsonb_agg(pg_catalog.to_jsonb(row_value)
        order by pg_catalog.to_jsonb(row_value)::text)::text, '[]'))
    from public.production_notification_outbox as row_value
  ) as authority;
  if before_fingerprint <> after_fingerprint then
    raise exception 'M2_D2_PAYMENT_FULFILLMENT_MUTATED';
  end if;
end;
$proof$;

reset role;

select 'PASS M2-D2 ownership, idempotency, context, ACL and non-mutation proof';
