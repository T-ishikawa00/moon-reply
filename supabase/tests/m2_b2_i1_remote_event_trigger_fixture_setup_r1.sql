\set ON_ERROR_STOP on

-- Reproduce the remote-only Supabase event-trigger identity before applying
-- candidate 0018. This fixture is for a disposable local database only.
do $fixture_absence_guard$
begin
  if pg_catalog.to_regprocedure('public.rls_auto_enable()') is not null
     or exists (
       select 1 from pg_catalog.pg_event_trigger where evtname = 'ensure_rls'
     )
     or exists (
       select 1 from pg_catalog.pg_roles
       where rolname in ('m2_b2_r3_plain_call', 'm2_b2_r3_ddl')
     ) then
    raise exception 'M2_B2_R3_FIXTURE_ALREADY_PRESENT';
  end if;
end;
$fixture_absence_guard$;

create schema m2_b2_r3_fixture authorization postgres;
create table m2_b2_r3_fixture.identity_before (
  function_oid oid not null,
  event_trigger_oid oid not null,
  function_owner oid not null,
  function_acl aclitem[] not null,
  function_source_md5 text not null,
  event_trigger_owner oid not null,
  event_trigger_enabled "char" not null,
  plain_call_sqlstate text
);

create role m2_b2_r3_plain_call nologin noinherit;
create role m2_b2_r3_ddl nologin noinherit;
grant m2_b2_r3_plain_call, m2_b2_r3_ddl to postgres;
grant usage, create on schema public to m2_b2_r3_ddl;

create function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

alter function public.rls_auto_enable() owner to postgres;
grant execute on function public.rls_auto_enable()
  to anon, authenticated, service_role;

create event trigger ensure_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();

insert into m2_b2_r3_fixture.identity_before (
  function_oid,
  event_trigger_oid,
  function_owner,
  function_acl,
  function_source_md5,
  event_trigger_owner,
  event_trigger_enabled
)
select
  routine.oid,
  trigger.oid,
  routine.proowner,
  routine.proacl,
  pg_catalog.md5(routine.prosrc),
  trigger.evtowner,
  trigger.evtenabled
from pg_catalog.pg_proc as routine
join pg_catalog.pg_event_trigger as trigger
  on trigger.evtfoid = routine.oid
where routine.oid = 'public.rls_auto_enable()'::pg_catalog.regprocedure;

do $plain_call_proof$
begin
  if not pg_catalog.has_function_privilege(
       'm2_b2_r3_plain_call', 'public.rls_auto_enable()', 'EXECUTE'
     ) then
    raise exception 'M2_B2_R3_PUBLIC_EXECUTE_NOT_REPRODUCED';
  end if;

  begin
    perform pg_catalog.set_config('role', 'm2_b2_r3_plain_call', true);
    perform public.rls_auto_enable();
    raise exception 'M2_B2_R3_PLAIN_CALL_UNEXPECTEDLY_SUCCEEDED';
  exception
    when sqlstate '0A000' then
      perform pg_catalog.set_config('role', 'none', true);
      update m2_b2_r3_fixture.identity_before
        set plain_call_sqlstate = sqlstate;
  end;

  if not exists (
    select 1
    from m2_b2_r3_fixture.identity_before
    where plain_call_sqlstate = '0A000'
  ) then
    raise exception 'M2_B2_R3_PLAIN_CALL_DISPOSITION_INVALID';
  end if;
end;
$plain_call_proof$;

select
  function_oid,
  event_trigger_oid,
  function_source_md5,
  plain_call_sqlstate,
  pg_catalog.has_function_privilege(
    'm2_b2_r3_plain_call', 'public.rls_auto_enable()', 'EXECUTE'
  ) as effective_execute_before
from m2_b2_r3_fixture.identity_before;
