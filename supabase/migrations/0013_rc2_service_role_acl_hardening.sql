begin;

do $migration_creator$
declare
  expected_table_count constant integer := 22;
  actual_table_count integer;
  distinct_owner_count integer;
  object_creator_role name;
begin
  select
    count(*),
    count(distinct relation.relowner),
    min(owner_role.rolname::text)::name
  into
    actual_table_count,
    distinct_owner_count,
    object_creator_role
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  join pg_catalog.pg_roles as owner_role
    on owner_role.oid = relation.relowner
  where namespace.nspname = 'public'
    and relation.relkind = 'r'
    and relation.relname = any(array[
      'assessment_requests',
      'assessment_runs',
      'assessment_stage_runs',
      'assessment_reports',
      'assessment_clarifications',
      'production_preparations',
      'production_purchases',
      'production_assessment_grants',
      'production_logical_assessments',
      'production_customer_deliveries',
      'production_result_credentials',
      'production_notification_outbox',
      'production_email_verification_challenges',
      'production_verified_email_authorities',
      'production_trusted_email_sessions',
      'production_preparation_email_bindings',
      'production_purchase_intents',
      'production_payment_attempts',
      'production_verified_payments',
      'production_stripe_event_ledger',
      'production_fulfillment_jobs',
      'production_payment_adjustment_ledger'
    ]::name[]);

  if actual_table_count <> expected_table_count then
    raise exception 'RC2_ACL_HARDENING_TABLE_SET_MISMATCH'
      using errcode = 'P0001';
  end if;

  if distinct_owner_count <> 1 or object_creator_role is null then
    raise exception 'RC2_ACL_HARDENING_CREATOR_ROLE_AMBIGUOUS'
      using errcode = 'P0001';
  end if;

  if object_creator_role <> current_user::name then
    raise exception 'RC2_ACL_HARDENING_EXECUTOR_OWNER_MISMATCH'
      using errcode = 'P0001';
  end if;

  execute format(
    'alter default privileges for role %I in schema public revoke all privileges on tables from public',
    object_creator_role
  );
  execute format(
    'alter default privileges for role %I in schema public revoke all privileges on tables from anon',
    object_creator_role
  );
  execute format(
    'alter default privileges for role %I in schema public revoke all privileges on tables from authenticated',
    object_creator_role
  );
  execute format(
    'alter default privileges for role %I in schema public revoke all privileges on tables from service_role',
    object_creator_role
  );
end;
$migration_creator$;

revoke all privileges on table
  public.assessment_requests,
  public.assessment_runs,
  public.assessment_stage_runs,
  public.assessment_reports,
  public.assessment_clarifications,
  public.production_preparations,
  public.production_purchases,
  public.production_assessment_grants,
  public.production_logical_assessments,
  public.production_customer_deliveries,
  public.production_result_credentials,
  public.production_notification_outbox,
  public.production_email_verification_challenges,
  public.production_verified_email_authorities,
  public.production_trusted_email_sessions,
  public.production_preparation_email_bindings,
  public.production_purchase_intents,
  public.production_payment_attempts,
  public.production_verified_payments,
  public.production_stripe_event_ledger,
  public.production_fulfillment_jobs,
  public.production_payment_adjustment_ledger
from public, anon, authenticated, service_role;

grant select, insert, update on table
  public.assessment_requests,
  public.assessment_runs,
  public.assessment_stage_runs,
  public.assessment_clarifications,
  public.production_preparations,
  public.production_assessment_grants,
  public.production_logical_assessments,
  public.production_result_credentials,
  public.production_notification_outbox,
  public.production_email_verification_challenges,
  public.production_verified_email_authorities,
  public.production_trusted_email_sessions,
  public.production_preparation_email_bindings,
  public.production_purchase_intents,
  public.production_payment_attempts,
  public.production_verified_payments,
  public.production_stripe_event_ledger,
  public.production_fulfillment_jobs
to service_role;

grant select, insert on table
  public.assessment_reports,
  public.production_purchases,
  public.production_customer_deliveries
to service_role;

-- No accepted Runtime repository or RPC uses production_payment_adjustment_ledger.
-- It intentionally receives no service_role table privilege.

alter table public.assessment_requests enable row level security;
alter table public.assessment_runs enable row level security;
alter table public.assessment_stage_runs enable row level security;
alter table public.assessment_reports enable row level security;
alter table public.assessment_clarifications enable row level security;
alter table public.production_preparations enable row level security;
alter table public.production_purchases enable row level security;
alter table public.production_assessment_grants enable row level security;
alter table public.production_logical_assessments enable row level security;
alter table public.production_customer_deliveries enable row level security;
alter table public.production_result_credentials enable row level security;
alter table public.production_notification_outbox enable row level security;
alter table public.production_email_verification_challenges enable row level security;
alter table public.production_verified_email_authorities enable row level security;
alter table public.production_trusted_email_sessions enable row level security;
alter table public.production_preparation_email_bindings enable row level security;
alter table public.production_purchase_intents enable row level security;
alter table public.production_payment_attempts enable row level security;
alter table public.production_verified_payments enable row level security;
alter table public.production_stripe_event_ledger enable row level security;
alter table public.production_fulfillment_jobs enable row level security;
alter table public.production_payment_adjustment_ledger enable row level security;

commit;
