# M2-P3 Supabase Setup Handoff

## Current state

The active initial runtime migrations are
`supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql` and
`supabase/migrations/0003_m2_p3_atomic_finalization.sql`. The obsolete
`0001_stage3_data_foundation.sql` was never applied to `moon-reply-dev`; it is
archived only as historical design evidence and is not an active migration.
Archiving it does not mark it as applied, and `supabase migration repair` was
not used.

M2-P3-A and M2-P3-A-R1 are Human / ChatGPT accepted and complete. The accepted code contains the server repository binding, the four-table migration, and the atomic-finalization migration.

The following is a Human-confirmed local development operational state, not a CodeX secret or database revalidation:

- dedicated non-production project: `moon-reply-dev`;
- migrations `0002_m2_p3_runtime_vertical_slice.sql` and `0003_m2_p3_atomic_finalization.sql`: applied;
- archived `0001_stage3_data_foundation.sql`: unapplied;
- migration repair: not used;
- RLS: enabled on all four runtime tables;
- public `anon` / `authenticated` policies: none;
- OpenAI and Supabase server-only local development configuration: completed without recording secret values here;
- model: `gpt-5.6-luna`;
- internal runtime: enabled for the bounded local development run; and
- data scope: synthetic/test only.

## Migration review points

- migration tracking, not `IF NOT EXISTS`, provides idempotency;
- all identifiers are server-generated UUIDs;
- request idempotency key is unique;
- `(run_id, stage_id)` is unique;
- foreign-key delete behavior is explicit (`on delete cascade`);
- request, run, Stage, eligibility, decision, model, and sequence constraints are explicit;
- usage and latency values must be nonnegative;
- report JSON and decision-card JSON must be objects;
- indexes cover request ID, run ID, status, and created timestamps;
- report, decision card, run completion, request completion, completion timestamp, final decision, and usage totals finalize in one transaction; and
- report-insert or run-update failure rolls back the entire finalization.

## Post-acceptance synthetic live E2E

Human confirms that the bounded synthetic live E2E succeeded through PB-01 to PB-06, Provider Structured Outputs, canonical AJV validation, Supabase Stage persistence, atomic finalization, usage-total persistence, and assessment-note display.

This is separate from the accepted M2-P3-A task-time automated evidence, which used deterministic fakes and remains OpenAI calls `0`, Supabase calls `0`, and API spend `USD 0`. Post-acceptance live usage is nonzero; exact aggregate tokens, cost, and call count have not been calculated. Real-user records and holdout use remain `0`.

## Current work handoff

Current work is DB integrity verification for the existing successful run. The next work after that is M2-P4 quality evaluation planning. This documentation synchronization performs no DB operation, does not apply or repair a migration, and does not authorize a new migration or run.

Payment, authentication, email, deployment, public release, and real-user processing remain unauthorized.
