begin;

alter table public.assessment_runs
  drop constraint assessment_runs_topology_runtime_identity;

alter table public.assessment_runs
  add constraint assessment_runs_topology_runtime_identity
    check (
      (
        stage_topology_version = 'legacy-six-v1'
        and prompt_bundle_version not in (
          'prompt-bundle-runtime-v9.0.0',
          'prompt-bundle-runtime-v10.0.0'
        )
        and schema_set_version <> 'pipeline-schema-runtime-v4.0.0'
      )
      or (
        stage_topology_version = 'split-base-candidate-v1'
        and prompt_bundle_version in (
          'prompt-bundle-runtime-v9.0.0',
          'prompt-bundle-runtime-v10.0.0'
        )
        and schema_set_version = 'pipeline-schema-runtime-v4.0.0'
      )
    );

drop trigger assessment_stage_runs_topology_v1
  on public.assessment_stage_runs;

drop function public.enforce_assessment_stage_topology_v1();

create function public.enforce_assessment_stage_topology_v2()
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
    if parent_prompt_bundle in (
         'prompt-bundle-runtime-v9.0.0',
         'prompt-bundle-runtime-v10.0.0'
       )
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
    if parent_prompt_bundle not in (
         'prompt-bundle-runtime-v9.0.0',
         'prompt-bundle-runtime-v10.0.0'
       )
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
          or new.stage_id <> 'PB-01C'
          or new.sequence_number <> 2
          or new.response_id is not null
          or new.returned_model is not null
          or new.input_tokens <> 0
          or new.cached_tokens <> 0
          or new.output_tokens <> 0
          or new.reasoning_tokens <> 0
          or new.latency_ms <> 0
          or new.output_json is not null
          or new.error_code is not null) then
    raise exception 'M2_STAGE_SKIP_INVALID'
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$;

create trigger assessment_stage_runs_topology_v2
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
execute function public.enforce_assessment_stage_topology_v2();

revoke all on function public.enforce_assessment_stage_topology_v2()
  from public, anon, authenticated;

commit;
