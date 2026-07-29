# M2-P3 Supabase Setup Handoff

## Current state

The active initial runtime migrations are
`supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql` and
`supabase/migrations/0003_m2_p3_atomic_finalization.sql`. The obsolete
`0001_stage3_data_foundation.sql` was never applied to `moon-reply-dev`; it is
archived only as historical design evidence and is not an active migration.
Archiving it does not mark it as applied, and `supabase migration repair` was
not used.

M2-P3-A and M2-P3-A-R1 are Human / ChatGPT accepted and complete. The accepted code contains the server repository binding, the four-table migration, and the atomic-finalization migration. No Supabase Project was created, no migration was applied, no secret was created or read, and no Supabase request was made.

## Next Human setup gate

1. Create or select a dedicated non-production Supabase project approved for synthetic development data.
2. Review `supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql`.
3. Review `supabase/migrations/0003_m2_p3_atomic_finalization.sql`.
4. Apply both migrations in order through the project's controlled migration process.
5. Confirm all four tables exist:
   - `assessment_requests`;
   - `assessment_runs`;
   - `assessment_stage_runs`;
   - `assessment_reports`.
6. Confirm RLS is enabled on all four tables.
7. Confirm no `anon` or `authenticated` policy exists.
8. Confirm `public.finalize_completed_assessment` is `SECURITY INVOKER`, uses an empty `search_path`, has no `PUBLIC`/`anon`/`authenticated` execute grant, and is executable only by `service_role`.
9. Store `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the server-only local secret mechanism. Do not put values in Git or a `NEXT_PUBLIC_` variable.
10. Store the separately approved OpenAI development key and `OPENAI_MODEL=gpt-5.6-luna` server-side.
11. Set `M2_INTERNAL_RUNTIME_ENABLED=true` only for a bounded local development smoke test.
12. Use synthetic/test content only.

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

## Development smoke-test gate

A live development smoke test requires a separate Human action after review. Before enabling:

- verify the page is not reachable in production;
- verify the origin and idempotency checks;
- verify no real-user records exist;
- define a synthetic record cleanup step;
- capture actual provider/Supabase call counts and spend separately from the M2-P3-A zero-network automated evidence.

Payment, authentication, email, deployment, public release, and real-user processing remain unauthorized.
