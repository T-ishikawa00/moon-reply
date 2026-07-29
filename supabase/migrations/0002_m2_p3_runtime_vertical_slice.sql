begin;

create table public.assessment_requests (
  id uuid primary key,
  idempotency_key text not null unique,
  source text not null,
  raw_situation text not null,
  optional_message text,
  relationship text not null,
  requested_topics jsonb not null,
  privacy_acknowledged boolean not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint assessment_requests_idempotency_key_length
    check (char_length(idempotency_key) between 1 and 128),
  constraint assessment_requests_source
    check (source = 'internal_review_runtime'),
  constraint assessment_requests_raw_situation_length
    check (char_length(raw_situation) between 1 and 5000),
  constraint assessment_requests_optional_message_length
    check (optional_message is null or char_length(optional_message) <= 2000),
  constraint assessment_requests_relationship
    check (
      relationship in (
        'dating',
        'in_relationship',
        'ambiguous',
        'former_partner',
        'matching_app',
        'work_or_school',
        'other'
      )
    ),
  constraint assessment_requests_topics_array
    check (
      jsonb_typeof(requested_topics) = 'array'
      and jsonb_array_length(requested_topics) between 1 and 3
    ),
  constraint assessment_requests_privacy_acknowledged
    check (privacy_acknowledged is true),
  constraint assessment_requests_status
    check (status in ('processing', 'completed', 'failed'))
);

create table public.assessment_runs (
  id uuid primary key,
  request_id uuid not null,
  status text not null,
  requested_model text not null,
  returned_model text,
  prompt_bundle_version text not null,
  schema_set_version text not null,
  eligibility text,
  decision text,
  total_input_tokens bigint not null,
  total_cached_tokens bigint not null,
  total_output_tokens bigint not null,
  total_reasoning_tokens bigint not null,
  usage_derived_cost_usd numeric(18, 9) not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  error_code text,
  constraint assessment_runs_request_fk
    foreign key (request_id)
    references public.assessment_requests(id)
    on delete cascade,
  constraint assessment_runs_status
    check (status in ('processing', 'completed', 'failed')),
  constraint assessment_runs_requested_model
    check (requested_model = 'gpt-5.6-luna'),
  constraint assessment_runs_returned_model
    check (returned_model is null or returned_model = 'gpt-5.6-luna'),
  constraint assessment_runs_eligibility
    check (
      eligibility is null
      or eligibility in ('ready', 'needs_more_information', 'safety_blocked')
    ),
  constraint assessment_runs_decision
    check (
      decision is null
      or decision in (
        'reply_now',
        'send_now',
        'wait_and_reassess',
        'pause_additional_contact'
      )
    ),
  constraint assessment_runs_usage_nonnegative
    check (
      total_input_tokens >= 0
      and total_cached_tokens >= 0
      and total_output_tokens >= 0
      and total_reasoning_tokens >= 0
      and usage_derived_cost_usd >= 0
    )
);

create table public.assessment_stage_runs (
  id uuid primary key,
  run_id uuid not null,
  stage_id text not null,
  sequence_number integer not null,
  status text not null,
  request_hash text not null,
  prompt_hash text not null,
  schema_hash text not null,
  response_id text,
  requested_model text not null,
  returned_model text,
  input_tokens bigint not null,
  cached_tokens bigint not null,
  output_tokens bigint not null,
  reasoning_tokens bigint not null,
  latency_ms bigint not null,
  output_json jsonb,
  error_code text,
  created_at timestamptz not null,
  constraint assessment_stage_runs_run_fk
    foreign key (run_id)
    references public.assessment_runs(id)
    on delete cascade,
  constraint assessment_stage_runs_unique_stage
    unique (run_id, stage_id),
  constraint assessment_stage_runs_stage_sequence
    check (
      (stage_id = 'PB-01' and sequence_number = 1)
      or (stage_id = 'PB-02' and sequence_number = 2)
      or (stage_id = 'PB-03' and sequence_number = 3)
      or (stage_id = 'PB-04' and sequence_number = 4)
      or (stage_id = 'PB-05' and sequence_number = 5)
      or (stage_id = 'PB-06' and sequence_number = 6)
    ),
  constraint assessment_stage_runs_status
    check (status in ('processing', 'completed', 'failed')),
  constraint assessment_stage_runs_request_hash
    check (request_hash ~ '^[0-9a-f]{64}$'),
  constraint assessment_stage_runs_prompt_hash
    check (prompt_hash ~ '^[0-9a-f]{64}$'),
  constraint assessment_stage_runs_schema_hash
    check (schema_hash ~ '^[0-9a-f]{64}$'),
  constraint assessment_stage_runs_requested_model
    check (requested_model = 'gpt-5.6-luna'),
  constraint assessment_stage_runs_returned_model
    check (returned_model is null or returned_model = 'gpt-5.6-luna'),
  constraint assessment_stage_runs_usage_nonnegative
    check (
      input_tokens >= 0
      and cached_tokens >= 0
      and output_tokens >= 0
      and reasoning_tokens >= 0
      and latency_ms >= 0
    )
);

create table public.assessment_reports (
  id uuid primary key,
  run_id uuid not null unique,
  report_json jsonb not null,
  decision_card_json jsonb not null,
  created_at timestamptz not null,
  constraint assessment_reports_run_fk
    foreign key (run_id)
    references public.assessment_runs(id)
    on delete cascade,
  constraint assessment_reports_report_object
    check (jsonb_typeof(report_json) = 'object'),
  constraint assessment_reports_decision_card_object
    check (jsonb_typeof(decision_card_json) = 'object')
);

create index assessment_requests_status_idx
  on public.assessment_requests(status);
create index assessment_requests_created_at_idx
  on public.assessment_requests(created_at);
create index assessment_runs_request_id_idx
  on public.assessment_runs(request_id);
create index assessment_runs_status_idx
  on public.assessment_runs(status);
create index assessment_runs_started_at_idx
  on public.assessment_runs(started_at);
create index assessment_stage_runs_run_id_idx
  on public.assessment_stage_runs(run_id);
create index assessment_stage_runs_status_idx
  on public.assessment_stage_runs(status);
create index assessment_stage_runs_created_at_idx
  on public.assessment_stage_runs(created_at);
create index assessment_reports_created_at_idx
  on public.assessment_reports(created_at);

alter table public.assessment_requests enable row level security;
alter table public.assessment_runs enable row level security;
alter table public.assessment_stage_runs enable row level security;
alter table public.assessment_reports enable row level security;

commit;
