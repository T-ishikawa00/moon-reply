\set ON_ERROR_STOP on

begin;

create temporary table m2_b2_existing_function_authority_before
on commit drop as
select
  routine.oid,
  routine.proowner,
  routine.proacl,
  role.rolname,
  pg_catalog.has_function_privilege(
    role.oid, routine.oid, 'EXECUTE'
  ) as can_execute
from pg_catalog.pg_proc as routine
join pg_catalog.pg_namespace as namespace
  on namespace.oid = routine.pronamespace
cross join pg_catalog.pg_roles as role
where namespace.nspname in ('public', 'private_payment_ingress')
  and role.rolname in (
    'anon', 'authenticated', 'service_role', 'm2_b2_stripe_ingress'
  );

alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema private_payment_ingress
  revoke execute on functions from public;

create function public.m2_b2_future_function_canary()
returns text
language sql
as 'select ''public-canary''::text';

create function private_payment_ingress.m2_b2_future_function_canary()
returns text
language sql
as 'select ''private-canary''::text';

do $future_function_proof$
declare
  target_function regprocedure :=
    'private_payment_ingress.record_stripe_webhook_evidence_v1(text,text,timestamp with time zone,text,text,text,text,text,text,text,integer,text)'::regprocedure;
begin
  if pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress',
       'public.m2_b2_future_function_canary()',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress',
       'private_payment_ingress.m2_b2_future_function_canary()',
       'EXECUTE'
     ) then
    raise exception 'M2_B2_FUTURE_FUNCTION_PUBLIC_EXECUTE';
  end if;

  if not pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress', target_function, 'EXECUTE'
     ) then
    raise exception 'M2_B2_FUTURE_FUNCTION_TARGET_EXECUTE_MISSING';
  end if;

  if pg_catalog.has_schema_privilege(
       'm2_b2_stripe_ingress', 'public', 'CREATE'
     )
     or pg_catalog.has_schema_privilege(
       'm2_b2_stripe_ingress', 'private_payment_ingress', 'CREATE'
     ) then
    raise exception 'M2_B2_FUTURE_FUNCTION_SCHEMA_CREATE';
  end if;

  if exists (
    select 1
    from m2_b2_existing_function_authority_before as before
    where before.oid not in (
      'public.m2_b2_future_function_canary()'::regprocedure::oid,
      'private_payment_ingress.m2_b2_future_function_canary()'::regprocedure::oid
    )
      and (
        before.proowner is distinct from (
          select routine.proowner
          from pg_catalog.pg_proc as routine
          where routine.oid = before.oid
        )
        or before.proacl is distinct from (
          select routine.proacl
          from pg_catalog.pg_proc as routine
          where routine.oid = before.oid
        )
        or before.can_execute is distinct from
          pg_catalog.has_function_privilege(
            before.rolname, before.oid, 'EXECUTE'
          )
      )
  ) then
    raise exception 'M2_B2_FUTURE_FUNCTION_EXISTING_AUTHORITY_DRIFT';
  end if;
end;
$future_function_proof$;

grant execute on function public.m2_b2_future_function_canary()
  to authenticated;

do $explicit_grant_proof$
begin
  if not pg_catalog.has_function_privilege(
       'authenticated',
       'public.m2_b2_future_function_canary()',
       'EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress',
       'public.m2_b2_future_function_canary()',
       'EXECUTE'
     ) then
    raise exception 'M2_B2_FUTURE_FUNCTION_EXPLICIT_GRANT_INVALID';
  end if;
end;
$explicit_grant_proof$;

select
  pg_catalog.has_function_privilege(
    'm2_b2_stripe_ingress',
    'public.m2_b2_future_function_canary()',
    'EXECUTE'
  ) as ingress_public_canary_execute,
  pg_catalog.has_function_privilege(
    'm2_b2_stripe_ingress',
    'private_payment_ingress.m2_b2_future_function_canary()',
    'EXECUTE'
  ) as ingress_private_canary_execute,
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.m2_b2_future_function_canary()',
    'EXECUTE'
  ) as explicit_grant_effective,
  pg_catalog.has_schema_privilege(
    'm2_b2_stripe_ingress', 'public', 'CREATE'
  ) as ingress_public_schema_create,
  pg_catalog.has_schema_privilege(
    'm2_b2_stripe_ingress', 'private_payment_ingress', 'CREATE'
  ) as ingress_private_schema_create;

rollback;
