begin;

alter table public.assessment_stage_runs
  add column attempt_number integer;

update public.assessment_stage_runs
  set attempt_number = 1
  where attempt_number is null;

alter table public.assessment_stage_runs
  alter column attempt_number set not null,
  add constraint assessment_stage_runs_attempt_number
    check (attempt_number in (1, 2));

alter table public.assessment_stage_runs
  drop constraint assessment_stage_runs_unique_stage,
  drop constraint assessment_stage_runs_unique_sequence;

alter table public.assessment_stage_runs
  add constraint assessment_stage_runs_unique_stage_attempt
    unique (run_id, stage_id, attempt_number),
  add constraint assessment_stage_runs_unique_sequence_attempt
    unique (run_id, sequence_number, attempt_number);

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
          'prompt-bundle-runtime-v15.0.0'
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
            'prompt-bundle-runtime-v15.0.0'
          ) and schema_set_version = 'pipeline-schema-runtime-v6.0.0')
        )
      )
    );

drop trigger assessment_stage_runs_topology_v3
  on public.assessment_stage_runs;
drop function public.enforce_assessment_stage_topology_v3();

create function public.enforce_assessment_stage_topology_v4()
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
    parent_prompt_bundle = 'prompt-bundle-runtime-v15.0.0'
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
    ) then
      raise exception 'M2_STAGE_SKIP_INVALID' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$function$;

create trigger assessment_stage_runs_topology_v4
before insert or update on public.assessment_stage_runs
for each row execute function public.enforce_assessment_stage_topology_v4();

revoke all on function public.enforce_assessment_stage_topology_v4()
  from public, anon, authenticated;

commit;
