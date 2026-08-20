begin;

alter table public.assessment_requests
  drop constraint assessment_requests_source;
alter table public.assessment_requests
  add constraint assessment_requests_source
    check (source in ('internal_review_runtime', 'production_fulfillment_runtime'));

alter table public.assessment_runs
  drop constraint assessment_runs_run_kind;
alter table public.assessment_runs
  add constraint assessment_runs_run_kind
    check (run_kind in ('initial', 'clarification_resume', 'fulfillment_resume'));

alter table public.assessment_runs
  drop constraint assessment_runs_topology_runtime_identity;
alter table public.assessment_runs
  add constraint assessment_runs_topology_runtime_identity
    check (
      (
        stage_topology_version = 'legacy-six-v1'
        and prompt_bundle_version not in (
          'prompt-bundle-runtime-v9.0.0',
          'prompt-bundle-runtime-v10.0.0',
          'prompt-bundle-runtime-v11.0.0',
          'prompt-bundle-runtime-v12.0.0',
          'prompt-bundle-runtime-v13.0.0',
          'prompt-bundle-runtime-v14.0.0',
          'prompt-bundle-runtime-v15.0.0',
          'prompt-bundle-runtime-v16.0.0',
          'prompt-bundle-runtime-v17.0.0'
        )
        and schema_set_version not in (
          'pipeline-schema-runtime-v4.0.0',
          'pipeline-schema-runtime-v5.0.0',
          'pipeline-schema-runtime-v6.0.0'
        )
      )
      or (
        stage_topology_version = 'split-base-candidate-v1'
        and (
          (prompt_bundle_version in (
            'prompt-bundle-runtime-v9.0.0',
            'prompt-bundle-runtime-v10.0.0'
          ) and schema_set_version = 'pipeline-schema-runtime-v4.0.0')
          or (prompt_bundle_version = 'prompt-bundle-runtime-v11.0.0'
            and schema_set_version = 'pipeline-schema-runtime-v5.0.0')
          or (prompt_bundle_version in (
            'prompt-bundle-runtime-v12.0.0',
            'prompt-bundle-runtime-v13.0.0',
            'prompt-bundle-runtime-v14.0.0',
            'prompt-bundle-runtime-v15.0.0',
            'prompt-bundle-runtime-v16.0.0',
            'prompt-bundle-runtime-v17.0.0'
          ) and schema_set_version = 'pipeline-schema-runtime-v6.0.0')
        )
      )
    );

alter table public.assessment_stage_runs
  drop constraint assessment_stage_runs_skip_reason;
alter table public.assessment_stage_runs
  add constraint assessment_stage_runs_skip_reason
    check (
      (status = 'skipped' and skip_reason in (
        'candidate_absent',
        'reused_initial_authority',
        'reused_purchase_ready_authority',
        'routing_stopped'
      ))
      or (status <> 'skipped' and skip_reason is null)
    );

drop trigger assessment_stage_runs_topology_v4
  on public.assessment_stage_runs;
drop function public.enforce_assessment_stage_topology_v4();

create function public.enforce_assessment_stage_topology_v5()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  parent_topology text;
  parent_run_kind text;
  parent_prompt_bundle text;
  expected_stage text;
begin
  select
    assessment_runs.stage_topology_version,
    assessment_runs.run_kind,
    assessment_runs.prompt_bundle_version
    into parent_topology, parent_run_kind, parent_prompt_bundle
    from public.assessment_runs
    where assessment_runs.id = new.run_id;
  if parent_topology is null then
    raise exception 'M2_STAGE_TOPOLOGY_INVALID' using errcode = 'P0001';
  end if;
  if parent_topology = 'legacy-six-v1' then
    expected_stage := case new.sequence_number
      when 1 then 'PB-01' when 2 then 'PB-02' when 3 then 'PB-03'
      when 4 then 'PB-04' when 5 then 'PB-05' when 6 then 'PB-06'
      else null end;
  elsif parent_topology = 'split-base-candidate-v1' then
    expected_stage := case new.sequence_number
      when 1 then 'PB-01' when 2 then 'PB-01C' when 3 then 'PB-02'
      when 4 then 'PB-03' when 5 then 'PB-04' when 6 then 'PB-05'
      when 7 then 'PB-06' else null end;
  else
    raise exception 'M2_STAGE_TOPOLOGY_INVALID' using errcode = 'P0001';
  end if;
  if expected_stage is null or new.stage_id <> expected_stage then
    raise exception 'M2_STAGE_TOPOLOGY_INVALID' using errcode = 'P0001';
  end if;
  if new.attempt_number not in (1, 2) then
    raise exception 'M2_STAGE_ATTEMPT_INVALID' using errcode = 'P0001';
  end if;
  if new.attempt_number = 2 and not (
    parent_prompt_bundle in (
      'prompt-bundle-runtime-v15.0.0',
      'prompt-bundle-runtime-v16.0.0',
      'prompt-bundle-runtime-v17.0.0'
    )
    and new.stage_id in ('PB-04', 'PB-05', 'PB-06')
    and new.status <> 'skipped'
  ) then
    raise exception 'M2_STAGE_ATTEMPT_INVALID' using errcode = 'P0001';
  end if;
  if new.status = 'skipped' then
    if new.attempt_number <> 1
       or new.response_id is not null or new.returned_model is not null
       or new.input_tokens <> 0 or new.cached_tokens <> 0
       or new.output_tokens <> 0 or new.reasoning_tokens <> 0
       or new.latency_ms <> 0 or new.output_json is not null
       or new.error_code is not null then
      raise exception 'M2_STAGE_SKIP_INVALID' using errcode = 'P0001';
    end if;
    if not (
      (parent_run_kind = 'initial' and new.stage_id = 'PB-01C'
        and new.skip_reason = 'candidate_absent')
      or (parent_run_kind = 'clarification_resume'
        and new.stage_id in ('PB-01C', 'PB-02', 'PB-03')
        and new.skip_reason = 'reused_initial_authority')
      or (parent_run_kind = 'fulfillment_resume'
        and new.stage_id in ('PB-01', 'PB-01C', 'PB-02', 'PB-03')
        and new.skip_reason = 'reused_purchase_ready_authority')
    ) then
      raise exception 'M2_STAGE_SKIP_INVALID' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$function$;

create trigger assessment_stage_runs_topology_v5
before insert or update on public.assessment_stage_runs
for each row execute function public.enforce_assessment_stage_topology_v5();

create function public.finalize_purchase_ready_assessment_v1(
  p_run_id uuid,
  p_request_id uuid,
  p_returned_model text,
  p_policy_result_json jsonb,
  p_total_input_tokens bigint,
  p_total_cached_tokens bigint,
  p_total_output_tokens bigint,
  p_total_reasoning_tokens bigint,
  p_usage_derived_cost_usd numeric,
  p_completed_at timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_returned_model <> 'gpt-5.6-luna'
     or jsonb_typeof(p_policy_result_json) <> 'object' then
    raise exception 'M2_PREPARATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.assessment_requests
    where id = p_request_id and source = 'production_fulfillment_runtime'
      and status = 'processing' for update;
  if not found then
    raise exception 'M2_PREPARATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_runs set
    status = 'completed', returned_model = p_returned_model,
    eligibility = 'ready', decision = null,
    policy_result_json = p_policy_result_json, result_json = null,
    total_input_tokens = p_total_input_tokens,
    total_cached_tokens = p_total_cached_tokens,
    total_output_tokens = p_total_output_tokens,
    total_reasoning_tokens = p_total_reasoning_tokens,
    usage_derived_cost_usd = p_usage_derived_cost_usd,
    completed_at = p_completed_at, error_code = null
    where id = p_run_id and request_id = p_request_id
      and status = 'processing'
      and run_kind in ('initial', 'clarification_resume')
      and requested_model = 'gpt-5.6-luna'
      and prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
      and schema_set_version = 'pipeline-schema-runtime-v6.0.0'
      and stage_topology_version = 'split-base-candidate-v1';
  if not found then
    raise exception 'M2_PREPARATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_requests
    set updated_at = p_completed_at
    where id = p_request_id and status = 'processing';
end;
$function$;

create table public.production_preparations (
  id uuid primary key,
  assessment_request_id uuid not null unique,
  idempotency_key_hash text not null unique,
  consultation_snapshot_sha256 text not null,
  consultation_snapshot_json jsonb not null,
  safety_authority_json jsonb not null,
  status text not null,
  stop_reason text,
  clarification_id text unique,
  clarification_capability_hash text unique,
  clarification_question text,
  clarification_answer_fingerprint text,
  purchase_capability_hash text unique,
  purchase_ready_authority_json jsonb,
  purchase_ready_authority_sha256 text,
  last_error_code text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_preparations_request_fk foreign key (assessment_request_id)
    references public.assessment_requests(id) on delete restrict,
  constraint production_preparations_clarification_fk foreign key (clarification_id)
    references public.assessment_clarifications(id) on delete restrict,
  constraint production_preparations_hashes check (
    idempotency_key_hash ~ '^[0-9a-f]{64}$'
    and consultation_snapshot_sha256 ~ '^[0-9a-f]{64}$'
    and (clarification_capability_hash is null
      or clarification_capability_hash ~ '^[0-9a-f]{64}$')
    and (purchase_capability_hash is null
      or purchase_capability_hash ~ '^[0-9a-f]{64}$')
    and (purchase_ready_authority_sha256 is null
      or purchase_ready_authority_sha256 ~ '^[0-9a-f]{64}$')
  ),
  constraint production_preparations_json check (
    jsonb_typeof(consultation_snapshot_json) = 'object'
    and jsonb_typeof(safety_authority_json) = 'object'
    and safety_authority_json ->> 'purchaseGateSatisfied' = 'true'
    and safety_authority_json ->> 'paymentAuthorityIssued' = 'false'
    and (purchase_ready_authority_json is null
      or jsonb_typeof(purchase_ready_authority_json) = 'object')
  ),
  constraint production_preparations_status check (status in (
    'preparing', 'awaiting_clarification', 'purchase_ready',
    'stopped', 'failed', 'consumed', 'revoked'
  )),
  constraint production_preparations_stop_reason check (
    stop_reason is null
    or stop_reason in ('not_full_product_candidate', 'safety_blocked')
  ),
  constraint production_preparations_state check (
    (status = 'awaiting_clarification'
      and clarification_id is not null
      and clarification_capability_hash is not null
      and clarification_question is not null
      and purchase_capability_hash is null
      and purchase_ready_authority_json is null
      and purchase_ready_authority_sha256 is null
      and stop_reason is null)
    or (status in ('purchase_ready', 'consumed')
      and purchase_capability_hash is not null
      and purchase_ready_authority_json is not null
      and purchase_ready_authority_sha256 is not null
      and purchase_ready_authority_json ->> 'schemaVersion'
        = 'rc1-purchase-ready-runtime-authority-v1'
      and purchase_ready_authority_json #>> '{runtimeIdentity,model}'
        = 'gpt-5.6-luna'
      and purchase_ready_authority_json #>> '{runtimeIdentity,promptBundleVersion}'
        = 'prompt-bundle-runtime-v17.0.0'
      and purchase_ready_authority_json #>> '{runtimeIdentity,schemaSetVersion}'
        = 'pipeline-schema-runtime-v6.0.0'
      and purchase_ready_authority_json #>> '{runtimeIdentity,stageTopologyVersion}'
        = 'split-base-candidate-v1'
      and stop_reason is null)
    or (status = 'stopped' and stop_reason is not null
      and purchase_capability_hash is null
      and purchase_ready_authority_json is null
      and purchase_ready_authority_sha256 is null)
    or status in ('preparing', 'failed', 'revoked')
  )
);

create table public.production_purchases (
  id uuid primary key,
  preparation_id uuid not null unique,
  purchase_authority_reference_hash text not null unique,
  verified_at timestamptz not null,
  constraint production_purchases_preparation_fk foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_purchases_authority_hash
    check (purchase_authority_reference_hash ~ '^[0-9a-f]{64}$')
);

create table public.production_assessment_grants (
  id uuid primary key,
  purchase_id uuid not null unique,
  preparation_id uuid not null unique,
  delivery_authority_reference text not null,
  status text not null,
  issued_at timestamptz not null,
  completed_at timestamptz,
  constraint production_assessment_grants_purchase_fk foreign key (purchase_id)
    references public.production_purchases(id) on delete restrict,
  constraint production_assessment_grants_preparation_fk foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_assessment_grants_status
    check (status in ('issued', 'completed', 'revoked')),
  constraint production_assessment_grants_delivery_reference
    check (char_length(delivery_authority_reference) between 16 and 256)
);

create table public.production_logical_assessments (
  id uuid primary key,
  grant_id uuid not null unique,
  preparation_id uuid not null unique,
  assessment_request_id uuid not null unique,
  status text not null,
  owner_id uuid,
  ownership_acquired_at timestamptz,
  generation_started_at timestamptz,
  attempt_count integer not null default 0,
  last_error_code text,
  recovery_state text not null,
  created_at timestamptz not null,
  completed_at timestamptz,
  updated_at timestamptz not null,
  constraint production_logical_assessments_grant_fk foreign key (grant_id)
    references public.production_assessment_grants(id) on delete restrict,
  constraint production_logical_assessments_preparation_fk foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_logical_assessments_request_fk foreign key (assessment_request_id)
    references public.assessment_requests(id) on delete restrict,
  constraint production_logical_assessments_status
    check (status in ('pending', 'generating', 'retryable', 'completed', 'revoked')),
  constraint production_logical_assessments_attempt_count
    check (attempt_count >= 0),
  constraint production_logical_assessments_recovery check (recovery_state in (
    'not_started', 'pre_provider_retryable',
    'post_provider_retryable_same_assessment', 'completed', 'manual_review'
  )),
  constraint production_logical_assessments_owner check (
    (status = 'generating' and owner_id is not null and ownership_acquired_at is not null)
    or (status <> 'generating' and owner_id is null and ownership_acquired_at is null)
  )
);

create table public.production_customer_deliveries (
  id uuid primary key,
  logical_assessment_id uuid not null unique,
  runtime_run_id uuid not null unique,
  experience_projection_json jsonb not null,
  projection_sha256 text not null,
  delivery_authority_reference text not null,
  created_at timestamptz not null,
  constraint production_customer_deliveries_logical_fk
    foreign key (logical_assessment_id)
    references public.production_logical_assessments(id) on delete restrict,
  constraint production_customer_deliveries_run_fk foreign key (runtime_run_id)
    references public.assessment_runs(id) on delete restrict,
  constraint production_customer_deliveries_projection check (
    jsonb_typeof(experience_projection_json) = 'object'
    and projection_sha256 ~ '^[0-9a-f]{64}$'
  )
);

create table public.production_result_credentials (
  id uuid primary key,
  delivery_id uuid not null,
  token_hash text not null unique,
  purpose text not null,
  issued_at timestamptz not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  constraint production_result_credentials_delivery_fk foreign key (delivery_id)
    references public.production_customer_deliveries(id) on delete cascade,
  constraint production_result_credentials_token_hash
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint production_result_credentials_purpose
    check (purpose in ('customer_handoff', 'notification', 'recovery')),
  constraint production_result_credentials_expiry
    check (expires_at is null or expires_at > issued_at)
);

create table public.production_notification_outbox (
  id uuid primary key,
  delivery_id uuid not null unique,
  delivery_authority_reference text not null,
  status text not null,
  attempt_count integer not null default 0,
  owner_id uuid,
  requested_at timestamptz not null,
  processing_started_at timestamptz,
  sent_at timestamptz,
  provider_message_reference text,
  last_error_code text,
  updated_at timestamptz not null,
  constraint production_notification_outbox_delivery_fk foreign key (delivery_id)
    references public.production_customer_deliveries(id) on delete cascade,
  constraint production_notification_outbox_status
    check (status in ('pending', 'processing', 'failed', 'sent')),
  constraint production_notification_outbox_attempt_count
    check (attempt_count >= 0),
  constraint production_notification_outbox_provider_reference check (
    provider_message_reference is null
    or char_length(provider_message_reference) between 1 and 256
  ),
  constraint production_notification_outbox_owner check (
    (status = 'processing' and owner_id is not null and processing_started_at is not null)
    or (status <> 'processing' and owner_id is null and processing_started_at is null)
  )
);

create index production_preparations_status_idx
  on public.production_preparations(status);
create index production_logical_assessments_status_idx
  on public.production_logical_assessments(status);
create index production_result_credentials_delivery_idx
  on public.production_result_credentials(delivery_id);
create index production_notification_outbox_status_idx
  on public.production_notification_outbox(status);

alter table public.production_preparations enable row level security;
alter table public.production_purchases enable row level security;
alter table public.production_assessment_grants enable row level security;
alter table public.production_logical_assessments enable row level security;
alter table public.production_customer_deliveries enable row level security;
alter table public.production_result_credentials enable row level security;
alter table public.production_notification_outbox enable row level security;

create function public.begin_production_preparation_v1(
  p_preparation_id uuid,
  p_request_id uuid,
  p_idempotency_key_hash text,
  p_consultation_snapshot_sha256 text,
  p_consultation_snapshot_json jsonb,
  p_safety_authority_json jsonb,
  p_current_situation text,
  p_optional_message text,
  p_relationship text,
  p_requested_topics jsonb,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  existing public.production_preparations%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key_hash, 0)
  );
  select * into existing from public.production_preparations
    where idempotency_key_hash = p_idempotency_key_hash for update;
  if existing.id is not null then
    if existing.consultation_snapshot_sha256 <> p_consultation_snapshot_sha256 then
      raise exception 'PRODUCTION_IDEMPOTENCY_CONFLICT' using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'disposition', 'existing', 'preparation_id', existing.id
    );
  end if;
  insert into public.assessment_requests (
    id, idempotency_key, source, raw_situation, optional_message,
    relationship, requested_topics, privacy_acknowledged, status,
    created_at, updated_at
  ) values (
    p_request_id, p_idempotency_key_hash, 'production_fulfillment_runtime',
    p_current_situation, p_optional_message, p_relationship,
    p_requested_topics, true, 'processing', p_now, p_now
  );
  insert into public.production_preparations (
    id, assessment_request_id, idempotency_key_hash,
    consultation_snapshot_sha256, consultation_snapshot_json,
    safety_authority_json, status, created_at, updated_at
  ) values (
    p_preparation_id, p_request_id, p_idempotency_key_hash,
    p_consultation_snapshot_sha256, p_consultation_snapshot_json,
    p_safety_authority_json, 'preparing', p_now, p_now
  );
  return jsonb_build_object(
    'disposition', 'created', 'preparation_id', p_preparation_id
  );
end;
$function$;

create function public.finalize_production_preparation_v1(
  p_preparation_id uuid,
  p_status text,
  p_stop_reason text,
  p_clarification_id text,
  p_clarification_capability_hash text,
  p_clarification_question text,
  p_clarification_answer_fingerprint text,
  p_purchase_capability_hash text,
  p_purchase_ready_authority_json jsonb,
  p_purchase_ready_authority_sha256 text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_status not in ('awaiting_clarification', 'purchase_ready', 'stopped') then
    raise exception 'PRODUCTION_PREPARATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.production_preparations set
    status = p_status,
    stop_reason = p_stop_reason,
    clarification_id = p_clarification_id,
    clarification_capability_hash = p_clarification_capability_hash,
    clarification_question = p_clarification_question,
    clarification_answer_fingerprint = p_clarification_answer_fingerprint,
    purchase_capability_hash = p_purchase_capability_hash,
    purchase_ready_authority_json = p_purchase_ready_authority_json,
    purchase_ready_authority_sha256 = p_purchase_ready_authority_sha256,
    last_error_code = null,
    updated_at = p_now
    where id = p_preparation_id
      and status in ('preparing', 'awaiting_clarification', 'failed');
  if not found then
    raise exception 'PRODUCTION_PREPARATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.fail_production_preparation_v1(
  p_preparation_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_preparations set
    status = 'failed', last_error_code = p_error_code, updated_at = p_now
    where id = p_preparation_id
      and status in ('preparing', 'awaiting_clarification');
  if not found then
    raise exception 'PRODUCTION_PREPARATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.rotate_production_preparation_capability_v1(
  p_preparation_id uuid,
  p_capability_kind text,
  p_capability_hash text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_capability_kind = 'clarification' then
    update public.production_preparations set
      clarification_capability_hash = p_capability_hash, updated_at = p_now
      where id = p_preparation_id and status = 'awaiting_clarification';
  elsif p_capability_kind = 'purchase' then
    update public.production_preparations set
      purchase_capability_hash = p_capability_hash, updated_at = p_now
      where id = p_preparation_id and status = 'purchase_ready';
  else
    raise exception 'PRODUCTION_CAPABILITY_KIND_INVALID' using errcode = 'P0001';
  end if;
  if not found then
    raise exception 'PRODUCTION_PREPARATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.issue_production_assessment_grant_v1(
  p_grant_id uuid,
  p_purchase_id uuid,
  p_logical_assessment_id uuid,
  p_preparation_capability_hash text,
  p_purchase_authority_reference_hash text,
  p_delivery_authority_reference text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
  existing_grant public.production_assessment_grants%rowtype;
  existing_logical_id uuid;
  existing_purchase_authority_hash text;
begin
  select * into preparation from public.production_preparations
    where purchase_capability_hash = p_preparation_capability_hash for update;
  if preparation.id is null
     or preparation.status not in ('purchase_ready', 'consumed') then
    raise exception 'PRODUCTION_VERIFIED_PURCHASE_REQUIRED' using errcode = 'P0001';
  end if;
  select * into existing_grant from public.production_assessment_grants
    where preparation_id = preparation.id;
  if existing_grant.id is not null then
    select purchase_authority_reference_hash
      into existing_purchase_authority_hash
      from public.production_purchases
      where id = existing_grant.purchase_id;
    if existing_purchase_authority_hash <> p_purchase_authority_reference_hash
       or existing_grant.delivery_authority_reference <>
         p_delivery_authority_reference then
      raise exception 'PRODUCTION_PURCHASE_AUTHORITY_CONFLICT'
        using errcode = 'P0001';
    end if;
    select id into existing_logical_id from public.production_logical_assessments
      where grant_id = existing_grant.id;
    return jsonb_build_object(
      'grant_id', existing_grant.id,
      'logical_assessment_id', existing_logical_id
    );
  end if;
  insert into public.production_purchases (
    id, preparation_id, purchase_authority_reference_hash, verified_at
  ) values (
    p_purchase_id, preparation.id, p_purchase_authority_reference_hash, p_now
  );
  insert into public.production_assessment_grants (
    id, purchase_id, preparation_id, delivery_authority_reference,
    status, issued_at
  ) values (
    p_grant_id, p_purchase_id, preparation.id,
    p_delivery_authority_reference, 'issued', p_now
  );
  insert into public.production_logical_assessments (
    id, grant_id, preparation_id, assessment_request_id, status,
    attempt_count, recovery_state, created_at, updated_at
  ) values (
    p_logical_assessment_id, p_grant_id, preparation.id,
    preparation.assessment_request_id, 'pending', 0, 'not_started', p_now, p_now
  );
  update public.production_preparations set
    status = 'consumed', updated_at = p_now
    where id = preparation.id and status = 'purchase_ready';
  return jsonb_build_object(
    'grant_id', p_grant_id,
    'logical_assessment_id', p_logical_assessment_id
  );
end;
$function$;

create function public.claim_production_fulfillment_v1(
  p_grant_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked public.production_logical_assessments%rowtype;
  request_status text;
  recoverable_runtime_run_id uuid;
begin
  select * into locked from public.production_logical_assessments
    where grant_id = p_grant_id for update;
  if locked.id is null then
    raise exception 'PRODUCTION_GRANT_INVALID' using errcode = 'P0001';
  end if;
  if locked.status = 'completed' then
    return jsonb_build_object(
      'disposition', 'completed', 'grant_id', p_grant_id,
      'logical_assessment_id', locked.id,
      'preparation_id', locked.preparation_id, 'owner_id', null,
      'recoverable_runtime_run_id', null
    );
  end if;
  if locked.status = 'generating' then
    return jsonb_build_object(
      'disposition', 'in_progress', 'grant_id', p_grant_id,
      'logical_assessment_id', locked.id,
      'preparation_id', locked.preparation_id, 'owner_id', locked.owner_id,
      'recoverable_runtime_run_id', null
    );
  end if;
  if locked.status not in ('pending', 'retryable') then
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  select status into request_status from public.assessment_requests
    where id = locked.assessment_request_id
      and source = 'production_fulfillment_runtime' for update;
  if request_status = 'completed' then
    select runs.id into recoverable_runtime_run_id
      from public.assessment_runs runs
      join public.assessment_reports reports on reports.run_id = runs.id
      where runs.request_id = locked.assessment_request_id
        and runs.status = 'completed'
        and runs.eligibility = 'ready'
        and runs.run_kind = 'fulfillment_resume'
        and runs.requested_model = 'gpt-5.6-luna'
        and runs.prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
        and runs.schema_set_version = 'pipeline-schema-runtime-v6.0.0'
        and runs.stage_topology_version = 'split-base-candidate-v1'
      order by runs.started_at desc limit 1;
    if recoverable_runtime_run_id is null then
      raise exception 'PRODUCTION_FULFILLMENT_RECOVERY_INVALID' using errcode = 'P0001';
    end if;
  elsif request_status in ('processing', 'failed') then
    update public.assessment_requests set
      status = 'processing', updated_at = p_now
      where id = locked.assessment_request_id;
  else
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.production_logical_assessments set
    status = 'generating', owner_id = p_owner_id,
    ownership_acquired_at = p_now,
    attempt_count = attempt_count + 1,
    updated_at = p_now
    where id = locked.id;
  return jsonb_build_object(
    'disposition', 'acquired', 'grant_id', p_grant_id,
    'logical_assessment_id', locked.id,
    'preparation_id', locked.preparation_id, 'owner_id', p_owner_id,
    'recoverable_runtime_run_id', recoverable_runtime_run_id
  );
end;
$function$;

create function public.mark_production_generation_started_v1(
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  recorded_at timestamptz;
begin
  update public.production_logical_assessments set
    generation_started_at = coalesce(generation_started_at, p_now),
    recovery_state = 'post_provider_retryable_same_assessment',
    updated_at = p_now
    where id = p_logical_assessment_id and status = 'generating'
      and owner_id = p_owner_id
    returning generation_started_at into recorded_at;
  if recorded_at is null then
    raise exception 'PRODUCTION_GENERATION_BOUNDARY_CONFLICT' using errcode = 'P0001';
  end if;
  return recorded_at::text;
end;
$function$;

create function public.complete_production_fulfillment_v1(
  p_grant_id uuid,
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_runtime_run_id uuid,
  p_delivery_id uuid,
  p_experience_projection_json jsonb,
  p_projection_sha256 text,
  p_result_credential_id uuid,
  p_result_token_hash text,
  p_notification_id uuid,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked public.production_logical_assessments%rowtype;
  delivery_reference text;
begin
  select * into locked from public.production_logical_assessments
    where id = p_logical_assessment_id and grant_id = p_grant_id for update;
  if locked.id is null or locked.status <> 'generating'
     or locked.owner_id <> p_owner_id
     or locked.generation_started_at is null then
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.assessment_reports reports
    join public.assessment_runs runs on runs.id = reports.run_id
    where reports.run_id = p_runtime_run_id
      and runs.request_id = locked.assessment_request_id
      and runs.run_kind = 'fulfillment_resume'
      and runs.status = 'completed'
      and runs.requested_model = 'gpt-5.6-luna'
      and runs.prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
      and runs.schema_set_version = 'pipeline-schema-runtime-v6.0.0'
      and runs.stage_topology_version = 'split-base-candidate-v1';
  if not found then
    raise exception 'PRODUCTION_CANONICAL_REPORT_REQUIRED' using errcode = 'P0001';
  end if;
  select delivery_authority_reference into delivery_reference
    from public.production_assessment_grants
    where id = p_grant_id and status = 'issued' for update;
  if delivery_reference is null then
    raise exception 'PRODUCTION_GRANT_INVALID' using errcode = 'P0001';
  end if;
  insert into public.production_customer_deliveries (
    id, logical_assessment_id, runtime_run_id, experience_projection_json,
    projection_sha256, delivery_authority_reference, created_at
  ) values (
    p_delivery_id, p_logical_assessment_id, p_runtime_run_id,
    p_experience_projection_json, p_projection_sha256,
    delivery_reference, p_now
  );
  insert into public.production_result_credentials (
    id, delivery_id, token_hash, purpose, issued_at
  ) values (
    p_result_credential_id, p_delivery_id, p_result_token_hash,
    'customer_handoff', p_now
  );
  insert into public.production_notification_outbox (
    id, delivery_id, delivery_authority_reference, status,
    attempt_count, requested_at, updated_at
  ) values (
    p_notification_id, p_delivery_id, delivery_reference,
    'pending', 0, p_now, p_now
  );
  update public.production_logical_assessments set
    status = 'completed', owner_id = null, ownership_acquired_at = null,
    recovery_state = 'completed', completed_at = p_now,
    last_error_code = null, updated_at = p_now
    where id = p_logical_assessment_id;
  update public.production_assessment_grants set
    status = 'completed', completed_at = p_now
    where id = p_grant_id and status = 'issued';
end;
$function$;

create function public.fail_production_fulfillment_v1(
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_logical_assessments set
    status = 'retryable', owner_id = null, ownership_acquired_at = null,
    recovery_state = case when generation_started_at is null
      then 'pre_provider_retryable'
      else 'post_provider_retryable_same_assessment' end,
    last_error_code = p_error_code, updated_at = p_now
    where id = p_logical_assessment_id and status = 'generating'
      and owner_id = p_owner_id;
  if not found then
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.resolve_production_result_v1(
  p_token_hash text,
  p_now timestamptz
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select jsonb_build_object(
    'delivery_id', deliveries.id,
    'experience_projection_json', deliveries.experience_projection_json,
    'projection_sha256', deliveries.projection_sha256
  )
  from public.production_result_credentials credentials
  join public.production_customer_deliveries deliveries
    on deliveries.id = credentials.delivery_id
  where credentials.token_hash = p_token_hash
    and credentials.revoked_at is null
    and (credentials.expires_at is null or credentials.expires_at > p_now)
  limit 1
$function$;

create function public.claim_production_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked public.production_notification_outbox%rowtype;
begin
  select * into locked from public.production_notification_outbox
    where id = p_notification_id for update;
  if locked.id is null or locked.status not in ('pending', 'failed') then
    return null;
  end if;
  update public.production_notification_outbox set
    status = 'processing', owner_id = p_owner_id,
    processing_started_at = p_now,
    attempt_count = attempt_count + 1,
    updated_at = p_now
    where id = p_notification_id;
  return jsonb_build_object(
    'id', locked.id, 'delivery_id', locked.delivery_id,
    'delivery_authority_reference', locked.delivery_authority_reference,
    'attempt_count', locked.attempt_count + 1
  );
end;
$function$;

create function public.complete_production_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_provider_message_reference text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_notification_outbox set
    status = 'sent', owner_id = null, processing_started_at = null,
    sent_at = p_now, provider_message_reference = p_provider_message_reference,
    last_error_code = null, updated_at = p_now
    where id = p_notification_id and status = 'processing'
      and owner_id = p_owner_id;
  if not found then
    raise exception 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.fail_production_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_notification_outbox set
    status = 'failed', owner_id = null, processing_started_at = null,
    last_error_code = p_error_code, updated_at = p_now
    where id = p_notification_id and status = 'processing'
      and owner_id = p_owner_id;
  if not found then
    raise exception 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on table public.production_preparations from public, anon, authenticated;
revoke all on table public.production_purchases from public, anon, authenticated;
revoke all on table public.production_assessment_grants from public, anon, authenticated;
revoke all on table public.production_logical_assessments from public, anon, authenticated;
revoke all on table public.production_customer_deliveries from public, anon, authenticated;
revoke all on table public.production_result_credentials from public, anon, authenticated;
revoke all on table public.production_notification_outbox from public, anon, authenticated;

grant select, insert, update on table public.production_preparations to service_role;
grant select, insert, update on table public.production_purchases to service_role;
grant select, insert, update on table public.production_assessment_grants to service_role;
grant select, insert, update on table public.production_logical_assessments to service_role;
grant select, insert on table public.production_customer_deliveries to service_role;
grant select, insert, update on table public.production_result_credentials to service_role;
grant select, insert, update on table public.production_notification_outbox to service_role;

revoke all on function public.enforce_assessment_stage_topology_v5()
  from public, anon, authenticated;
revoke all on function public.finalize_purchase_ready_assessment_v1(
  uuid, uuid, text, jsonb, bigint, bigint, bigint, bigint, numeric, timestamptz
) from public, anon, authenticated;
revoke all on function public.begin_production_preparation_v1(
  uuid, uuid, text, text, jsonb, jsonb, text, text, text, jsonb, timestamptz
) from public, anon, authenticated;
revoke all on function public.finalize_production_preparation_v1(
  uuid, text, text, text, text, text, text, text, jsonb, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.fail_production_preparation_v1(uuid, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.rotate_production_preparation_capability_v1(
  uuid, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.issue_production_assessment_grant_v1(
  uuid, uuid, uuid, text, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.claim_production_fulfillment_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated;
revoke all on function public.mark_production_generation_started_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated;
revoke all on function public.complete_production_fulfillment_v1(
  uuid, uuid, uuid, uuid, uuid, jsonb, text, uuid, text, uuid, timestamptz
) from public, anon, authenticated;
revoke all on function public.fail_production_fulfillment_v1(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.resolve_production_result_v1(text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.claim_production_notification_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated;
revoke all on function public.complete_production_notification_v1(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.fail_production_notification_v1(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.finalize_purchase_ready_assessment_v1(
  uuid, uuid, text, jsonb, bigint, bigint, bigint, bigint, numeric, timestamptz
) to service_role;
grant execute on function public.begin_production_preparation_v1(
  uuid, uuid, text, text, jsonb, jsonb, text, text, text, jsonb, timestamptz
) to service_role;
grant execute on function public.finalize_production_preparation_v1(
  uuid, text, text, text, text, text, text, text, jsonb, text, timestamptz
) to service_role;
grant execute on function public.fail_production_preparation_v1(uuid, text, timestamptz)
  to service_role;
grant execute on function public.rotate_production_preparation_capability_v1(
  uuid, text, text, timestamptz
) to service_role;
grant execute on function public.issue_production_assessment_grant_v1(
  uuid, uuid, uuid, text, text, text, timestamptz
) to service_role;
grant execute on function public.claim_production_fulfillment_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.mark_production_generation_started_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.complete_production_fulfillment_v1(
  uuid, uuid, uuid, uuid, uuid, jsonb, text, uuid, text, uuid, timestamptz
) to service_role;
grant execute on function public.fail_production_fulfillment_v1(
  uuid, uuid, text, timestamptz
) to service_role;
grant execute on function public.resolve_production_result_v1(text, timestamptz)
  to service_role;
grant execute on function public.claim_production_notification_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.complete_production_notification_v1(
  uuid, uuid, text, timestamptz
) to service_role;
grant execute on function public.fail_production_notification_v1(
  uuid, uuid, text, timestamptz
) to service_role;

commit;
