begin;

alter table public.assessment_runs
  add column stage_topology_version text;

update public.assessment_runs
  set stage_topology_version = 'legacy-six-v1'
  where stage_topology_version is null;

alter table public.assessment_runs
  alter column stage_topology_version set not null;

alter table public.assessment_runs
  add constraint assessment_runs_stage_topology_version
    check (
      stage_topology_version in (
        'legacy-six-v1',
        'split-base-candidate-v1'
      )
    ),
  add constraint assessment_runs_topology_runtime_identity
    check (
      (
        stage_topology_version = 'legacy-six-v1'
        and prompt_bundle_version <> 'prompt-bundle-runtime-v9.0.0'
        and schema_set_version <> 'pipeline-schema-runtime-v4.0.0'
      )
      or (
        stage_topology_version = 'split-base-candidate-v1'
        and prompt_bundle_version = 'prompt-bundle-runtime-v9.0.0'
        and schema_set_version = 'pipeline-schema-runtime-v4.0.0'
      )
    );

alter table public.assessment_stage_runs
  drop constraint assessment_stage_runs_stage_sequence,
  drop constraint assessment_stage_runs_status;

alter table public.assessment_stage_runs
  add constraint assessment_stage_runs_stage_sequence
    check (
      (stage_id = 'PB-01' and sequence_number = 1)
      or (stage_id = 'PB-01C' and sequence_number = 2)
      or (stage_id = 'PB-02' and sequence_number in (2, 3))
      or (stage_id = 'PB-03' and sequence_number in (3, 4))
      or (stage_id = 'PB-04' and sequence_number in (4, 5))
      or (stage_id = 'PB-05' and sequence_number in (5, 6))
      or (stage_id = 'PB-06' and sequence_number in (6, 7))
    ),
  add constraint assessment_stage_runs_status
    check (status in ('processing', 'completed', 'failed', 'skipped')),
  add constraint assessment_stage_runs_skipped_invariants
    check (
      status <> 'skipped'
      or (
        stage_id = 'PB-01C'
        and sequence_number = 2
        and response_id is null
        and returned_model is null
        and input_tokens = 0
        and cached_tokens = 0
        and output_tokens = 0
        and reasoning_tokens = 0
        and latency_ms = 0
        and output_json is null
        and error_code is null
      )
    ),
  add constraint assessment_stage_runs_unique_sequence
    unique (run_id, sequence_number);

create function public.enforce_assessment_stage_topology_v1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  parent_topology text;
  parent_prompt_bundle text;
  parent_schema_set text;
  expected_stage text;
begin
  select
    assessment_runs.stage_topology_version,
    assessment_runs.prompt_bundle_version,
    assessment_runs.schema_set_version
  into
    parent_topology,
    parent_prompt_bundle,
    parent_schema_set
  from public.assessment_runs
  where assessment_runs.id = new.run_id;

  if parent_topology is null then
    raise exception 'M2_STAGE_TOPOLOGY_INVALID'
      using errcode = 'P0001';
  end if;

  if parent_topology = 'legacy-six-v1' then
    if parent_prompt_bundle = 'prompt-bundle-runtime-v9.0.0'
       or parent_schema_set = 'pipeline-schema-runtime-v4.0.0' then
      raise exception 'M2_STAGE_TOPOLOGY_INVALID'
        using errcode = 'P0001';
    end if;
    expected_stage := case new.sequence_number
      when 1 then 'PB-01'
      when 2 then 'PB-02'
      when 3 then 'PB-03'
      when 4 then 'PB-04'
      when 5 then 'PB-05'
      when 6 then 'PB-06'
      else null
    end;
  elsif parent_topology = 'split-base-candidate-v1' then
    if parent_prompt_bundle <> 'prompt-bundle-runtime-v9.0.0'
       or parent_schema_set <> 'pipeline-schema-runtime-v4.0.0' then
      raise exception 'M2_STAGE_TOPOLOGY_INVALID'
        using errcode = 'P0001';
    end if;
    expected_stage := case new.sequence_number
      when 1 then 'PB-01'
      when 2 then 'PB-01C'
      when 3 then 'PB-02'
      when 4 then 'PB-03'
      when 5 then 'PB-04'
      when 6 then 'PB-05'
      when 7 then 'PB-06'
      else null
    end;
  else
    raise exception 'M2_STAGE_TOPOLOGY_INVALID'
      using errcode = 'P0001';
  end if;

  if expected_stage is null or new.stage_id <> expected_stage then
    raise exception 'M2_STAGE_TOPOLOGY_INVALID'
      using errcode = 'P0001';
  end if;

  if new.status = 'skipped'
     and (parent_topology <> 'split-base-candidate-v1'
          or new.stage_id <> 'PB-01C') then
    raise exception 'M2_STAGE_SKIP_INVALID'
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$;

create trigger assessment_stage_runs_topology_v1
before insert or update of
  run_id,
  stage_id,
  sequence_number,
  status,
  response_id,
  returned_model,
  input_tokens,
  cached_tokens,
  output_tokens,
  reasoning_tokens,
  latency_ms,
  output_json,
  error_code
on public.assessment_stage_runs
for each row
execute function public.enforce_assessment_stage_topology_v1();

revoke all on function public.enforce_assessment_stage_topology_v1()
  from public, anon, authenticated;

commit;
