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
          'prompt-bundle-runtime-v10.0.0',
          'prompt-bundle-runtime-v11.0.0',
          'prompt-bundle-runtime-v12.0.0',
          'prompt-bundle-runtime-v13.0.0',
          'prompt-bundle-runtime-v14.0.0'
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
            'prompt-bundle-runtime-v14.0.0'
          ) and schema_set_version = 'pipeline-schema-runtime-v6.0.0')
        )
      )
    );

commit;
