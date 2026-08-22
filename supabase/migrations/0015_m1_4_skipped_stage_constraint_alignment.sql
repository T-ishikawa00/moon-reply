begin;

alter table public.assessment_stage_runs
  drop constraint assessment_stage_runs_skipped_invariants;

alter table public.assessment_stage_runs
  add constraint assessment_stage_runs_skipped_invariants
    check (
      status <> 'skipped'
      or (
        response_id is null
        and returned_model is null
        and input_tokens = 0
        and cached_tokens = 0
        and output_tokens = 0
        and reasoning_tokens = 0
        and latency_ms = 0
        and output_json is null
        and error_code is null
      )
    );

comment on constraint assessment_stage_runs_skipped_invariants
  on public.assessment_stage_runs is
  'Structural invariants for skipped rows. Contextual skip policy remains enforced by the current topology trigger and skip-reason constraint.';

commit;
