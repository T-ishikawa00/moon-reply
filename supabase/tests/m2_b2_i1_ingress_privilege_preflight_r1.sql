\set ON_ERROR_STOP on

-- Branch-independent catalog verifier for every future migration preflight.
-- Run after all candidate migrations have been applied to a disposable DB.
do $privilege_preflight$
declare
  ingress_role regrole := 'm2_b2_stripe_ingress'::regrole;
  target_function regprocedure :=
    'private_payment_ingress.record_stripe_webhook_evidence_v1(text,text,timestamp with time zone,text,text,text,text,text,text,text,integer,text)'::regprocedure;
  sequence_oid oid;
begin
  if not pg_catalog.has_function_privilege(
       ingress_role, target_function, 'EXECUTE'
     ) then
    raise exception 'M2_B2_PRIVILEGE_TARGET_EXECUTE_MISSING';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    where routine.oid = target_function::oid
      and (
        routine.proowner <> 'postgres'::regrole
        or not routine.prosecdef
      )
  ) then
    raise exception 'M2_B2_PRIVILEGE_TARGET_IDENTITY_DRIFT';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        routine.proacl,
        pg_catalog.acldefault('f', routine.proowner)
      )
    ) as privilege
    where routine.oid = target_function::oid
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
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
    raise exception 'M2_B2_PRIVILEGE_TARGET_EXECUTE_BROADENED';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as routine
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = routine.pronamespace
    where namespace.nspname in ('public', 'private_payment_ingress')
      and routine.oid <> target_function::oid
      and pg_catalog.has_function_privilege(
        ingress_role, routine.oid, 'EXECUTE'
      )
  ) then
    raise exception 'M2_B2_PRIVILEGE_NON_TARGET_EXECUTE';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p', 'v', 'm', 'f')
      and pg_catalog.has_table_privilege(
        ingress_role,
        relation.oid,
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
  ) then
    raise exception 'M2_B2_PRIVILEGE_APPLICATION_RELATION_AUTHORITY';
  end if;

  for sequence_oid in
    select sequence.oid
    from pg_catalog.pg_class as sequence
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = sequence.relnamespace
    where namespace.nspname = 'public'
      and sequence.relkind = 'S'
  loop
    if pg_catalog.has_sequence_privilege(
         ingress_role, sequence_oid, 'USAGE,SELECT,UPDATE'
       ) then
      raise exception 'M2_B2_PRIVILEGE_APPLICATION_SEQUENCE_AUTHORITY';
    end if;
  end loop;

  if pg_catalog.has_schema_privilege(ingress_role, 'public', 'CREATE')
     or pg_catalog.has_schema_privilege(
       ingress_role, 'private_payment_ingress', 'CREATE'
     ) then
    raise exception 'M2_B2_PRIVILEGE_SCHEMA_CREATE';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_default_acl as defaults
    where defaults.defaclrole = 'postgres'::regrole
      and defaults.defaclnamespace = 0
      and defaults.defaclobjtype = 'f'
  ) then
    raise exception 'M2_B2_PRIVILEGE_GLOBAL_FUNCTION_DEFAULT_MISSING';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_default_acl as defaults
    cross join lateral pg_catalog.aclexplode(defaults.defaclacl) as privilege
    left join pg_catalog.pg_namespace as namespace
      on namespace.oid = defaults.defaclnamespace
    where defaults.defaclrole = 'postgres'::regrole
      and defaults.defaclobjtype = 'f'
      and (
        defaults.defaclnamespace = 0
        or namespace.nspname in ('public', 'private_payment_ingress')
      )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'M2_B2_PRIVILEGE_PUBLIC_EXECUTE_DEFAULT';
  end if;
end;
$privilege_preflight$;

select 'M2-B2-I1 INGRESS PRIVILEGE PREFLIGHT PASS' as result;
