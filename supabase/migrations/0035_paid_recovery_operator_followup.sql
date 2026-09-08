begin;

-- Derive operator work from the existing job. The existing operator outbox,
-- incident vocabulary and send identity remain authoritative; no new queue.
create function public.paid_recovery_operator_signal_v1(p_fulfillment_job_id uuid,p_now timestamptz)
returns jsonb language sql stable security invoker set search_path = '' as $function$
  select jsonb_build_object(
    'event_key','action_required:' || j.purchase_intent_id::text || ':manual_review:paid_recovery:'
      || j.recovery_cycle_count::text || case when j.recovery_review_due_at <= p_now
        then ':review_due:' || floor(extract(epoch from j.recovery_review_due_at))::bigint::text else ':block' end,
    'source_occurred_at',case when j.recovery_review_due_at <= p_now then j.recovery_review_due_at else j.updated_at end)
  from public.production_fulfillment_jobs j
  join public.production_purchase_intents i on i.id=j.purchase_intent_id
    and i.state='verified' and i.successful_payment_id=j.verified_payment_id
  where j.id=p_fulfillment_job_id and p_now is not null
    and (j.state<>'completed' or exists (
      select 1 from public.production_customer_deliveries d
      join public.production_notification_outbox n on n.delivery_id=d.id
      where d.logical_assessment_id=j.logical_assessment_id and n.status<>'sent'))
    and (j.recovery_review_due_at <= p_now or (j.recovery_cycle_count>0
      and j.recovery_reason_code is not null and j.recovery_next_attempt_at is null
      and j.state in ('manual_review','completed')));
$function$;
revoke all on function public.paid_recovery_operator_signal_v1(uuid,timestamptz)
from public,anon,authenticated,m2_b2_stripe_ingress;
grant execute on function public.paid_recovery_operator_signal_v1(uuid,timestamptz) to service_role;

-- Keep all historical event keys valid and immutable. A subsequent block or
-- review deadline gets a distinct key; sent notices are never reset/reused.
do $constraint$
declare previous_expression text;
begin
  select pg_get_expr(conbin,conrelid) into previous_expression from pg_constraint
    where conrelid='public.production_operator_notification_outbox'::regclass
      and conname='production_operator_notification_event_key';
  if previous_expression is null then raise exception 'PAID_RECOVERY_OPERATOR_BASELINE_MISSING'; end if;
  alter table public.production_operator_notification_outbox drop constraint production_operator_notification_event_key;
  execute 'alter table public.production_operator_notification_outbox add constraint production_operator_notification_event_key check (('
    ||previous_expression||') or (notification_type=''action_required'' and incident_code=''manual_review'' and '
    ||'event_key ~ (''^action_required:'' || purchase_intent_id::text || '':manual_review:paid_recovery:[0-9]+:(block|review_due:[0-9]+)$'')))';
end;
$constraint$;

-- Patch only the incident materialization and corresponding send-time active
-- checks. Exact marker checks fail the transaction if the accepted baseline
-- differs; legacy limits, leases, environments, payloads and ACLs stay intact.
do $upgrade$
declare claim_definition text; send_definition text; old_part text; new_part text;
  materialization text := $materialize$
  -- Paid recovery blocks and overdue operator review use the same C2 incident.
  insert into public.production_operator_notification_outbox (
    event_key,notification_type,incident_code,environment,purchase_intent_id,
    verified_payment_id,delivery_id,source_occurred_at,status,requested_at,created_at,updated_at
  )
  select signal.value->>'event_key','action_required','manual_review',i.environment,
    j.purchase_intent_id,j.verified_payment_id,null,(signal.value->>'source_occurred_at')::timestamptz,
    'pending',p_now,p_now,p_now
  from public.production_fulfillment_jobs j
  join public.production_purchase_intents i on i.id=j.purchase_intent_id
  join public.production_verified_payments v on v.id=j.verified_payment_id
  cross join lateral (select public.paid_recovery_operator_signal_v1(j.id,p_now) value) signal
  where i.environment=p_environment and v.environment=p_environment
    and signal.value is not null
    and (signal.value->>'source_occurred_at')::timestamptz between p_active_from and p_now
  on conflict(event_key) do nothing;

$materialize$;
begin
  select replace(pg_get_functiondef('public.claim_production_operator_notification_batch_v1(uuid,text,timestamptz,timestamptz,timestamptz,integer)'::regprocedure),E'\r\n',E'\n')
    into claim_definition;
  select replace(pg_get_functiondef('public.begin_production_operator_notification_send_v1(uuid,uuid,timestamptz)'::regprocedure),E'\r\n',E'\n')
    into send_definition;
  old_part := '  -- C2 excludes the more specific retry-exhausted C3 classification.';
  if position(old_part in claim_definition)=0 then raise exception 'PAID_RECOVERY_OPERATOR_BASELINE_MISMATCH'; end if;
  claim_definition := replace(claim_definition,old_part,materialization||old_part);

  -- Existing cycle-zero/manual incidents retain their original keys. New
  -- recovery blocks are materialized above, avoiding two notices per block.
  old_part := $old$    and (
      intent.state = 'manual_review'
      or job.state = 'manual_review'
      or logical_assessment.recovery_state = 'manual_review'
    )$old$;
  if position(old_part in claim_definition)=0 then raise exception 'PAID_RECOVERY_OPERATOR_BASELINE_MISMATCH'; end if;
  claim_definition := replace(claim_definition,old_part,old_part||$new$
    and (job.recovery_reason_code is null or job.recovery_cycle_count=0)$new$);

  old_part := $old$        when 'manual_review' then
          (intent.state = 'manual_review'
            or job.state = 'manual_review'
            or logical_assessment.recovery_state = 'manual_review')
          and coalesce(job.last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
          and coalesce(job.dispatch_last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'$old$;
  new_part := $new$        when 'manual_review' then
          case when operator_outbox.event_key like '%:manual_review:paid_recovery:%' then
            operator_outbox.event_key=public.paid_recovery_operator_signal_v1(job.id,p_now)->>'event_key'
          else
          (intent.state = 'manual_review'
            or job.state = 'manual_review'
            or logical_assessment.recovery_state = 'manual_review')
          and coalesce(job.last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
          and coalesce(job.dispatch_last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
          end$new$;
  if position(old_part in claim_definition)=0 then raise exception 'PAID_RECOVERY_OPERATOR_BASELINE_MISMATCH'; end if;
  claim_definition := replace(claim_definition,old_part,new_part);

  old_part := $old$      when 'manual_review' then
        (intent.state = 'manual_review'
          or job.state = 'manual_review'
          or logical_assessment.recovery_state = 'manual_review')
        and coalesce(job.last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        and coalesce(job.dispatch_last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'$old$;
  new_part := $new$      when 'manual_review' then
        case when locked.event_key like '%:manual_review:paid_recovery:%' then
          locked.event_key=public.paid_recovery_operator_signal_v1(job.id,p_now)->>'event_key'
        else
        (intent.state = 'manual_review'
          or job.state = 'manual_review'
          or logical_assessment.recovery_state = 'manual_review')
        and coalesce(job.last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        and coalesce(job.dispatch_last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        end$new$;
  if position(old_part in send_definition)=0 then raise exception 'PAID_RECOVERY_OPERATOR_BASELINE_MISMATCH'; end if;
  send_definition := replace(send_definition,old_part,new_part);
  execute claim_definition;
  execute send_definition;
end;
$upgrade$;

commit;
