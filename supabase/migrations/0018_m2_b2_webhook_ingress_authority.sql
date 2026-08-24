-- M2-B2-I1: isolated Stripe webhook ingress authority.
-- Accepted migrations 0002 through 0017 remain byte-identical.

begin;

do $role_guard$
begin
  if exists (
    select 1 from pg_catalog.pg_authid
    where rolname = 'm2_b2_stripe_ingress'
  ) then
    raise exception 'M2_B2_INGRESS_ROLE_ALREADY_EXISTS'
      using errcode = 'P0001';
  end if;
end;
$role_guard$;

create role m2_b2_stripe_ingress
  login
  password null
  noinherit
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication
  nobypassrls
  connection limit 4;

alter role m2_b2_stripe_ingress set search_path = '';
alter role m2_b2_stripe_ingress set statement_timeout = '5s';
alter role m2_b2_stripe_ingress set lock_timeout = '2s';
alter role m2_b2_stripe_ingress
  set idle_in_transaction_session_timeout = '5s';

create schema private_payment_ingress authorization postgres;

revoke all on schema private_payment_ingress
  from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
grant usage on schema private_payment_ingress to m2_b2_stripe_ingress;

do $migration_owner_guard$
begin
  if current_user <> 'postgres' then
    raise exception 'M2_B2_INGRESS_MIGRATION_OWNER_INVALID'
      using errcode = 'P0001';
  end if;
end;
$migration_owner_guard$;

-- Supabase-managed projects may already contain the event-trigger-only
-- public.rls_auto_enable() routine. PostgreSQL grants EXECUTE on new routines
-- to PUBLIC by default, which would otherwise leak effective EXECUTE to the
-- dedicated ingress login through public schema USAGE. Fail closed unless the
-- existing routine and its event-trigger binding match the reviewed remote
-- identity exactly, then remove only the unusable PUBLIC direct-call grant.
-- Explicit postgres/anon/authenticated/service_role grants are preserved.
do $remote_rls_event_trigger_compatibility$
declare
  target_function regprocedure :=
    pg_catalog.to_regprocedure('public.rls_auto_enable()');
  target_oid oid;
begin
  -- Fresh repository-only databases do not contain this Supabase-managed
  -- object. In that environment there is no compatibility ACL to harden.
  if target_function is null then
    return;
  end if;

  target_oid := target_function::oid;

  if not exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = routine.pronamespace
    join pg_catalog.pg_roles as owner_role
      on owner_role.oid = routine.proowner
    join pg_catalog.pg_language as language
      on language.oid = routine.prolang
    where routine.oid = target_oid
      and namespace.nspname = 'public'
      and routine.proname = 'rls_auto_enable'
      and routine.pronargs = 0
      and routine.prorettype = 'pg_catalog.event_trigger'::pg_catalog.regtype
      and owner_role.rolname = 'postgres'
      and language.lanname = 'plpgsql'
      and routine.prosecdef
      and routine.provolatile = 'v'
      and routine.proconfig is not distinct from
        array['search_path=pg_catalog']::text[]
      and pg_catalog.length(routine.prosrc) = 953
      and pg_catalog.md5(routine.prosrc) =
        '99be20677b456ea8d3be47bdd44fb369'
  ) then
    raise exception 'M2_B2_REMOTE_RLS_EVENT_TRIGGER_IDENTITY_INVALID'
      using errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*)
    from pg_catalog.pg_proc as routine
    cross join lateral pg_catalog.aclexplode(routine.proacl) as privilege
    where routine.oid = target_oid
  ) <> 5
  or exists (
    select 1
    from pg_catalog.pg_proc as routine
    cross join lateral pg_catalog.aclexplode(routine.proacl) as privilege
    where routine.oid = target_oid
      and (
        privilege.grantor <> 'postgres'::pg_catalog.regrole
        or privilege.privilege_type <> 'EXECUTE'
        or privilege.is_grantable
        or privilege.grantee not in (
          0,
          'postgres'::pg_catalog.regrole,
          'anon'::pg_catalog.regrole,
          'authenticated'::pg_catalog.regrole,
          'service_role'::pg_catalog.regrole
        )
      )
  )
  or not exists (
    select 1
    from pg_catalog.pg_proc as routine
    cross join lateral pg_catalog.aclexplode(routine.proacl) as privilege
    where routine.oid = target_oid and privilege.grantee = 0
  )
  or not pg_catalog.has_function_privilege(
    'postgres', target_oid, 'EXECUTE'
  )
  or not pg_catalog.has_function_privilege(
    'anon', target_oid, 'EXECUTE'
  )
  or not pg_catalog.has_function_privilege(
    'authenticated', target_oid, 'EXECUTE'
  )
  or not pg_catalog.has_function_privilege(
    'service_role', target_oid, 'EXECUTE'
  ) then
    raise exception 'M2_B2_REMOTE_RLS_EVENT_TRIGGER_ACL_INVALID'
      using errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*)
    from pg_catalog.pg_event_trigger
    where evtfoid = target_oid
  ) <> 1
  or not exists (
    select 1
    from pg_catalog.pg_event_trigger as trigger
    join pg_catalog.pg_roles as owner_role
      on owner_role.oid = trigger.evtowner
    where trigger.evtfoid = target_oid
      and trigger.evtname = 'ensure_rls'
      and owner_role.rolname = 'postgres'
      and trigger.evtevent = 'ddl_command_end'
      and trigger.evtenabled = 'O'
      and trigger.evttags is not distinct from
        array['CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO']::text[]
  ) then
    raise exception 'M2_B2_REMOTE_RLS_EVENT_TRIGGER_BINDING_INVALID'
      using errcode = 'P0001';
  end if;

  execute
    'revoke execute on function public.rls_auto_enable() from public';

  if pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress', target_oid, 'EXECUTE'
     )
     or exists (
       select 1
       from pg_catalog.pg_proc as routine
       cross join lateral pg_catalog.aclexplode(routine.proacl) as privilege
       where routine.oid = target_oid and privilege.grantee = 0
     )
     or (
       select pg_catalog.count(*)
       from pg_catalog.pg_proc as routine
       cross join lateral pg_catalog.aclexplode(routine.proacl) as privilege
       where routine.oid = target_oid
     ) <> 4
     or not pg_catalog.has_function_privilege(
       'postgres', target_oid, 'EXECUTE'
     )
     or not pg_catalog.has_function_privilege(
       'anon', target_oid, 'EXECUTE'
     )
     or not pg_catalog.has_function_privilege(
       'authenticated', target_oid, 'EXECUTE'
     )
     or not pg_catalog.has_function_privilege(
       'service_role', target_oid, 'EXECUTE'
     ) then
    raise exception 'M2_B2_REMOTE_RLS_EVENT_TRIGGER_REVOKE_INVALID'
      using errcode = 'P0001';
  end if;
end;
$remote_rls_event_trigger_compatibility$;

-- PostgreSQL's built-in function default grants EXECUTE to PUBLIC globally.
-- A schema-scoped REVOKE alone cannot remove that built-in grant, so the
-- global future default must be hardened first. The schema-scoped REVOKEs
-- then clear any additive defaults that may have been set for these schemas.
-- Existing function ACLs are not changed by ALTER DEFAULT PRIVILEGES.
alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema private_payment_ingress
  revoke execute on functions from public;

create function private_payment_ingress.record_stripe_webhook_evidence_v1(
  p_provider_event_id text,
  p_event_type text,
  p_provider_created_at timestamptz,
  p_payload_sha256 text,
  p_environment text,
  p_purchase_reference text,
  p_provider_checkout_session_id text,
  p_provider_payment_id text,
  p_mode text,
  p_payment_status text,
  p_amount_total integer,
  p_currency text
) returns text
language plpgsql
security definer
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $function$
declare
  intent public.production_purchase_intents%rowtype;
  attempt public.production_payment_attempts%rowtype;
  application_disposition text;
  application_reason_code text;
  recorded jsonb;
  safe_disposition text;
begin
  -- Fail before the durable authority on malformed or unbound input. The
  -- public ingress can neither choose another evidence source nor supply IDs,
  -- timestamps, or an application disposition for generated durable rows.
  if p_provider_event_id is null
     or pg_catalog.char_length(p_provider_event_id) > 255
     or p_provider_event_id !~ '^evt_[A-Za-z0-9_]+$'
     or p_event_type is null
     or p_event_type not in (
       'checkout.session.completed',
       'checkout.session.async_payment_succeeded',
       'checkout.session.async_payment_failed',
       'checkout.session.expired'
     )
     or p_provider_created_at is null
     or p_payload_sha256 is null
     or p_payload_sha256 !~ '^[0-9a-f]{64}$'
     or p_environment not in ('test', 'live')
     or p_purchase_reference is null
     or p_purchase_reference !~
       '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or p_provider_checkout_session_id is null
     or pg_catalog.char_length(p_provider_checkout_session_id) > 255
     or not public.rc2_checkout_session_matches_environment_v1(
       p_environment, p_provider_checkout_session_id
     ) then
    return 'rejected';
  end if;

  select * into intent
    from public.production_purchase_intents
    where id::text = p_purchase_reference;
  select * into attempt
    from public.production_payment_attempts
    where provider_checkout_session_id = p_provider_checkout_session_id;

  if intent.id is null
     or attempt.id is null
     or attempt.purchase_intent_id is distinct from intent.id
     or intent.expected_product_code <>
       'moon_reply_love_message_assessment_note_v1'
     or intent.expected_amount <> 980
     or intent.currency <> 'jpy'
     or intent.purchase_kind <> 'one_time'
     or intent.provider <> 'stripe'
     or intent.environment is distinct from p_environment
     or p_mode is distinct from 'payment' then
    return 'rejected';
  end if;

  if p_event_type in (
       'checkout.session.completed',
       'checkout.session.async_payment_succeeded'
     ) and p_payment_status = 'paid' then
    if p_amount_total is distinct from 980
       or pg_catalog.lower(p_currency) is distinct from 'jpy'
       or p_provider_payment_id is null
       or pg_catalog.char_length(p_provider_payment_id) > 255
       or p_provider_payment_id !~ '^pi_[A-Za-z0-9_]+$' then
      return 'rejected';
    end if;
    application_disposition := 'verified';
    application_reason_code := null;
  elsif p_event_type = 'checkout.session.async_payment_failed' then
    application_disposition := 'failed';
    application_reason_code := null;
  elsif p_event_type = 'checkout.session.expired' then
    application_disposition := 'canceled';
    application_reason_code := null;
  else
    application_disposition := 'pending';
    application_reason_code := null;
  end if;

  recorded := public.record_rc2_stripe_evidence_v2(
    p_provider_event_id,
    'webhook',
    p_event_type,
    p_provider_created_at,
    p_payload_sha256,
    p_environment,
    p_purchase_reference,
    p_provider_checkout_session_id,
    p_provider_payment_id,
    p_mode,
    p_payment_status,
    p_amount_total,
    p_currency,
    application_disposition,
    application_reason_code,
    pg_catalog.gen_random_uuid(),
    pg_catalog.gen_random_uuid(),
    pg_catalog.statement_timestamp()
  );
  safe_disposition := recorded ->> 'disposition';
  if safe_disposition not in (
    'verified', 'duplicate', 'conflict', 'pending', 'failed', 'canceled',
    'rejected', 'stale'
  ) then
    raise exception 'M2_B2_INGRESS_DISPOSITION_INVALID'
      using errcode = 'P0001';
  end if;
  return safe_disposition;
end;
$function$;

alter function private_payment_ingress.record_stripe_webhook_evidence_v1(
  text, text, timestamptz, text, text, text, text, text,
  text, text, integer, text
) owner to postgres;

revoke all on function
  private_payment_ingress.record_stripe_webhook_evidence_v1(
    text, text, timestamptz, text, text, text, text, text,
    text, text, integer, text
  ) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
grant execute on function
  private_payment_ingress.record_stripe_webhook_evidence_v1(
    text, text, timestamptz, text, text, text, text, text,
    text, text, integer, text
  ) to m2_b2_stripe_ingress;

do $least_privilege_guard$
declare
  target_function regprocedure :=
    'private_payment_ingress.record_stripe_webhook_evidence_v1(text,text,timestamp with time zone,text,text,text,text,text,text,text,integer,text)'::regprocedure;
begin
  if exists (
    select 1 from pg_catalog.pg_authid
    where rolname = 'm2_b2_stripe_ingress'
      and (rolsuper or rolinherit or rolcreatedb or rolcreaterole
        or rolreplication or rolbypassrls or not rolcanlogin
        or rolconnlimit <> 4 or rolpassword is not null)
  ) then
    raise exception 'M2_B2_INGRESS_ROLE_ATTRIBUTES_INVALID'
      using errcode = 'P0001';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
      and pg_catalog.has_table_privilege(
        'm2_b2_stripe_ingress', relation.oid,
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
  ) then
    raise exception 'M2_B2_INGRESS_RELATION_PRIVILEGE_DRIFT'
      using errcode = 'P0001';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = routine.pronamespace
    where namespace.nspname in ('public', 'private_payment_ingress')
      and routine.oid <> target_function::oid
      and pg_catalog.has_function_privilege(
        'm2_b2_stripe_ingress', routine.oid, 'EXECUTE'
      )
  ) then
    raise exception 'M2_B2_INGRESS_FUNCTION_PRIVILEGE_DRIFT'
      using errcode = 'P0001';
  end if;
  if pg_catalog.has_schema_privilege(
       'm2_b2_stripe_ingress', 'public', 'CREATE'
     )
     or pg_catalog.has_schema_privilege(
       'm2_b2_stripe_ingress', 'private_payment_ingress', 'CREATE'
     ) then
    raise exception 'M2_B2_INGRESS_SCHEMA_CREATE_PRIVILEGE_DRIFT'
      using errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from pg_catalog.pg_default_acl as defaults
    join pg_catalog.pg_roles as owner_role
      on owner_role.oid = defaults.defaclrole
    where owner_role.rolname = 'postgres'
      and defaults.defaclnamespace = 0
      and defaults.defaclobjtype = 'f'
  ) then
    raise exception 'M2_B2_INGRESS_GLOBAL_FUNCTION_DEFAULT_MISSING'
      using errcode = 'P0001';
  end if;
  if exists (
    select 1
    from pg_catalog.pg_default_acl as defaults
    join pg_catalog.pg_roles as owner_role
      on owner_role.oid = defaults.defaclrole
    cross join lateral pg_catalog.aclexplode(defaults.defaclacl) as privilege
    left join pg_catalog.pg_namespace as namespace
      on namespace.oid = defaults.defaclnamespace
    where owner_role.rolname = 'postgres'
      and defaults.defaclobjtype = 'f'
      and (
        defaults.defaclnamespace = 0
        or namespace.nspname in ('public', 'private_payment_ingress')
      )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'M2_B2_INGRESS_PUBLIC_EXECUTE_DEFAULT_DRIFT'
      using errcode = 'P0001';
  end if;
  if not pg_catalog.has_schema_privilege(
       'm2_b2_stripe_ingress', 'private_payment_ingress', 'USAGE'
     )
     or not pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress', target_function, 'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'anon', target_function, 'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'authenticated', target_function, 'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'service_role', target_function, 'EXECUTE'
     ) then
    raise exception 'M2_B2_INGRESS_WRAPPER_ACL_INVALID'
      using errcode = 'P0001';
  end if;
end;
$least_privilege_guard$;

commit;
