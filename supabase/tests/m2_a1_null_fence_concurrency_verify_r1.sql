\set ON_ERROR_STOP on
\pset tuples_only on

do $proof$
begin
  if (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'logical_claim' and disposition = 'acquired') <> 1
     or (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'logical_claim' and disposition = 'in_progress') <> 1
     or not exists (
       select 1 from public.production_logical_assessments
       where id = '51000000-0000-4000-8000-000000000012'
         and status = 'generating' and owner_id is not null
         and lease_expires_at = '2026-08-23T00:40:00Z'
         and attempt_count = 1
     ) then
    raise exception 'M2_A1_CONCURRENT_LOGICAL_CLAIM_INVALID';
  end if;

  if (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'notification_claim' and disposition = 'acquired') <> 1
     or (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'notification_claim' and disposition = 'in_progress') <> 1
     or not exists (
       select 1 from public.production_notification_outbox
       where id = '91000000-0000-4000-8000-000000000006'
         and status = 'processing' and owner_id is not null
         and lease_expires_at = '2026-08-23T00:40:00Z'
         and attempt_count = 1
     ) then
    raise exception 'M2_A1_CONCURRENT_NOTIFICATION_CLAIM_INVALID';
  end if;

  if (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'notification_reclaim' and disposition = 'reclaimed') <> 1
     or (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'notification_reclaim' and disposition = 'in_progress') <> 1
     or not exists (
       select 1 from public.production_notification_outbox
       where id = '91000000-0000-4000-8000-000000000005'
         and status = 'processing' and owner_id is not null
         and lease_expires_at = '2026-08-23T00:40:00Z'
         and attempt_count = 4
         and processing_started_at = '2026-08-23T00:10:00Z'
         and last_error_code = 'SYNTHETIC_RETRYABLE'
         and updated_at = '2026-08-23T00:20:00Z'
     ) or (
       select to_jsonb(notification) - array[
         'owner_id', 'lease_expires_at', 'attempt_count', 'updated_at'
       ]::text[]
       from public.production_notification_outbox notification
       where id = '91000000-0000-4000-8000-000000000005'
     ) is distinct from (
       select row_json - array[
         'owner_id', 'lease_expires_at', 'attempt_count', 'updated_at'
       ]::text[]
       from m2_a1_concurrency_proof.baselines
       where kind = 'notification_reclaim'
     ) then
    raise exception 'M2_A1_CONCURRENT_NOTIFICATION_RECLAIM_INVALID';
  end if;

  if (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'logical_completion' and disposition = 'completed') <> 1
     or (select count(*) from m2_a1_concurrency_proof.results
      where kind = 'logical_completion' and disposition = 'conflict'
        and sqlstate = 'P0001'
        and message = 'PRODUCTION_FULFILLMENT_STATE_CONFLICT') <> 1
     or not exists (
       select 1 from public.production_logical_assessments
       where id = '51000000-0000-4000-8000-000000000002'
         and status = 'completed' and owner_id is null and lease_expires_at is null
     )
     or (select count(*) from public.production_customer_deliveries
       where logical_assessment_id = '51000000-0000-4000-8000-000000000002') <> 1
     or (select count(*) from public.production_result_credentials credentials
       join public.production_customer_deliveries deliveries
         on deliveries.id = credentials.delivery_id
       where deliveries.logical_assessment_id = '51000000-0000-4000-8000-000000000002'
         and credentials.purpose = 'customer_handoff') <> 1
     or (select count(*) from public.production_notification_outbox notifications
       join public.production_customer_deliveries deliveries
         on deliveries.id = notifications.delivery_id
       where deliveries.logical_assessment_id = '51000000-0000-4000-8000-000000000002') <> 1 then
    raise exception 'M2_A1_CONCURRENT_COMPLETION_INVALID';
  end if;
end;
$proof$;

select kind, client_id, disposition, coalesce(sqlstate, '-'), coalesce(message, '-')
from m2_a1_concurrency_proof.results
order by kind, client_id;
select 'M2-A1 CONCURRENT CLAIM/NOTIFICATION/COMPLETION PASS';
