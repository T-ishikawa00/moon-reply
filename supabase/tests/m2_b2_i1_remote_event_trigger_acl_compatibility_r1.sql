\set ON_ERROR_STOP on

begin;

do $identity_and_acl_proof$
declare
  target_function regprocedure := 'public.rls_auto_enable()'::regprocedure;
  target_oid oid := target_function::oid;
begin
  if not exists (
    select 1
    from m2_b2_r3_fixture.identity_before as before
    join pg_catalog.pg_proc as routine
      on routine.oid = before.function_oid
    join pg_catalog.pg_event_trigger as trigger
      on trigger.oid = before.event_trigger_oid
    where before.function_oid = target_oid
      and before.function_owner = routine.proowner
      and before.function_source_md5 = pg_catalog.md5(routine.prosrc)
      and before.function_source_md5 =
        '99be20677b456ea8d3be47bdd44fb369'
      and before.event_trigger_owner = trigger.evtowner
      and before.event_trigger_enabled = trigger.evtenabled
      and before.plain_call_sqlstate = '0A000'
      and trigger.evtfoid = target_oid
      and trigger.evtname = 'ensure_rls'
      and trigger.evtevent = 'ddl_command_end'
      and trigger.evtenabled = 'O'
      and trigger.evttags is not distinct from
        array['CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO']::text[]
  ) then
    raise exception 'M2_B2_R3_EVENT_TRIGGER_IDENTITY_DRIFT';
  end if;

  if pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress', target_oid, 'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'm2_b2_r3_plain_call', target_oid, 'EXECUTE'
     )
     or exists (
       select 1
       from pg_catalog.pg_proc as routine
       cross join lateral pg_catalog.aclexplode(routine.proacl) as privilege
       where routine.oid = target_oid and privilege.grantee = 0
     ) then
    raise exception 'M2_B2_R3_PUBLIC_EXECUTE_REVOKE_FAILED';
  end if;

  if not pg_catalog.has_function_privilege(
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
    raise exception 'M2_B2_R3_EXPLICIT_EXECUTE_GRANT_DRIFT';
  end if;

  if pg_catalog.has_schema_privilege(
       'm2_b2_stripe_ingress', 'public', 'CREATE'
     )
     or pg_catalog.has_schema_privilege(
       'm2_b2_stripe_ingress', 'private_payment_ingress', 'CREATE'
     ) then
    raise exception 'M2_B2_R3_INGRESS_SCHEMA_CREATE';
  end if;
end;
$identity_and_acl_proof$;

set local role m2_b2_r3_ddl;
create table public.m2_b2_r3_rls_probe (id bigint primary key);
reset role;

do $event_trigger_behavior_proof$
begin
  if not exists (
    select 1
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    join pg_catalog.pg_roles as owner_role
      on owner_role.oid = relation.relowner
    where namespace.nspname = 'public'
      and relation.relname = 'm2_b2_r3_rls_probe'
      and owner_role.rolname = 'm2_b2_r3_ddl'
      and relation.relrowsecurity
  ) then
    raise exception 'M2_B2_R3_EVENT_TRIGGER_RLS_BEHAVIOR_FAILED';
  end if;
end;
$event_trigger_behavior_proof$;

select
  'M2-B2-I1-R3 EVENT TRIGGER ACL COMPATIBILITY PASS' as result,
  pg_catalog.has_function_privilege(
    'm2_b2_stripe_ingress', 'public.rls_auto_enable()', 'EXECUTE'
  ) as ingress_execute_after,
  pg_catalog.has_function_privilege(
    'anon', 'public.rls_auto_enable()', 'EXECUTE'
  ) as anon_explicit_execute_preserved,
  (
    select relation.relrowsecurity
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'm2_b2_r3_rls_probe'
  ) as rls_auto_enabled_after_revoke;

rollback;
