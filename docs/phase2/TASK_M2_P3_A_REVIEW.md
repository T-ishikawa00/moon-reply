# Task M2-P3-A Review

## Review identity

- Task: `M2-P3-A Internal AI Assessment Runtime Vertical Slice`
- Baseline: `72d4121ff4ad0682bcafbeed4f72f6491e697ffa`
- Branch: `feature/m2-p3-a-runtime-vertical-slice`
- Accepted implementation commit: `9bdae7cf05034c7742e5f58f7b104d65cb27a87f`
- Accepted R1 commit: `3f1123439dcbc724c70505956aa81fa03a9246ad`
- Live E2E code commit: `66ab02c566d61d0c563e26e3d2c5fb23f6500d45`
- Acceptance state: M2-P3-A and M2-P3-A-R1 Human / ChatGPT accepted and complete; Human Visual QA complete

## Product-path transition

The one-time paid calibration CLI is retained, paused, and classified as internal QA tooling. It is not an M2-P3 acceptance dependency and no additional paid-once execution is currently planned.

The active development path is now the real website shape:

`request sheet -> server runtime -> PB-01..PB-06 -> database persistence -> assessment-note rendering`

## Implemented review surfaces

- development-only `/review/runtime`;
- Node-runtime `POST /api/internal/assessments`;
- OpenAI Responses transport using the official SDK;
- Supabase server repository using the existing official SDK;
- four-table versioned SQL migration;
- deterministic application Safety/eligibility/decision ownership;
- Stage-by-Stage persistence and failure stop;
- atomic report, decision-card, run, and request finalization;
- fake transport and fake repository;
- dedicated M2-P3 verifier;
- M2-P3 successor capability manifest.

## Automated scenario matrix

This is accepted task-time Fake evidence only (`accepted_fake_validation_only`). It is not a statement that post-acceptance live usage remained zero.

The accepted dedicated-verifier evidence covers:

- `WAIT-003` ready/report path;
- `needs_more_information`;
- `safety_blocked`;
- invalid Stage Schema;
- returned-model mismatch;
- duplicate idempotency key;
- concurrent idempotency behavior;
- injected database write failure;
- rollback on report-insert failure;
- rollback on run-update failure;
- duplicate-finalization conflict;
- request/run and Stage-start persistence before provider execution;
- PB-05 failure with no PB-06 invocation;
- exact Stage/local-step ordering;
- all Stage outputs/statuses persisted;
- completed assessment-note data renderable;
- actual OpenAI calls `0`;
- actual Supabase calls `0`;
- API spend `USD 0`.

The exact sequential terminal results are automated evidence. The separate Human / ChatGPT decision establishes acceptance.

## Security review

- [x] production and feature-disable fail closed;
- [x] no secret value committed or logged;
- [x] no browser provider/database client in the new runtime;
- [x] same-origin and strict body validation;
- [x] RLS enabled with no public policies;
- [x] provider `store: false`, no tools/stream/background;
- [x] exact model allowlist and returned-model match;
- [x] no retry, Repair/PB-07, or fallback;
- [x] raw provider errors and stacks not returned/persisted;
- [x] public `/request` and public product behavior unchanged;
- [x] production-reachable high/critical vulnerabilities `0`;
- [x] three remaining production-installed findings classified as not reachable from M2 Runtime;
- [x] nine remaining findings classified as development-only; and
- [x] no `npm audit fix --force`.

## Human Visual QA

Accepted Human observations:

- desktop initial rendering: PASS;
- internal-only warning is prominent;
- current-situation field is primary and optional-message field is clear;
- relationship/requested-topic chips and privacy acknowledgement render correctly;
- required inputs, selections, and acknowledgement can be entered;
- submission becomes available only after required state is complete;
- missing runtime configuration fails closed;
- displayed safe code is `M2_RUNTIME_CONFIGURATION_INVALID`;
- no stack trace or secret leakage was observed; and
- the design remains consistent with 月の返事.

Mobile-width QA was intentionally omitted because the route is internal desktop-only Human-operator tooling.

Non-blocking internal-tool backlog:

- correct or clarify the truncated `実行境` label; and
- improve the visual distinction of the disabled submit state.

No correction task is created by this acceptance.

## Prohibited-scope review

Not implemented by M2-P3-A: payment, RevenueCat, authentication, email, public production release, real-user processing, analytics, download/PDF/share/print, background queue, cron, mobile API, public history, retry, Repair/PB-07, fallback model, Supabase Project setup, API-key creation, or PR creation. The later Human-operated development setup below is a separate post-acceptance record.

## Post-acceptance Human-configured live E2E record

- Human-confirmed local development live E2E executed against code commit `66ab02c566d61d0c563e26e3d2c5fb23f6500d45`;
- dedicated Supabase project `moon-reply-dev` created;
- migrations `0002` and `0003` applied; `0001` archived and unapplied; migration repair not used;
- persistent OpenAI development key configured server-side, internal runtime enabled, and model fixed to `gpt-5.6-luna`;
- following the R1/R2 Structured Outputs corrections, the synthetic live E2E completed PB-01 through PB-06, Provider Structured Outputs, canonical AJV validation, Supabase Stage persistence, atomic finalization, usage-total persistence, and assessment-note display successfully;
- live OpenAI/Supabase usage is nonzero, but exact aggregate tokens, cost, and call count have not been calculated;
- real-user records and holdout use remain `0`;
- M2-P3 Runtime Vertical Slice is fully complete after successful-run DB integrity verification; Milestone 2 remains incomplete; and
- current work is M2-P4 quality evaluation planning; quality evaluation execution has not started.

This post-acceptance Human record is separate from the task-time Fake zero-call/zero-spend evidence. CodeX did not revalidate secret values or query the development database for this documentation synchronization.

## Historical implementation snapshot boundary correction

- The M2-P3 exact-path check incorrectly mixed current `HEAD` and untracked successor work into the historical M2-P3 scope.
- The accepted historical code range is fixed from `72d4121ff4ad0682bcafbeed4f72f6491e697ffa` through `66ab02c566d61d0c563e26e3d2c5fb23f6500d45`.
- The exact historical path set contains `47` unique paths.
- The manifest is synchronized with the five previously omitted paths: `.gitignore`, `lib/assessment/runtime/openai-diagnostics.ts`, `lib/assessment/runtime/openai-schema.ts`, `supabase/archive/0001_stage3_data_foundation.sql`, and `supabase/archive/README.md`.
- Current and untracked successor work is excluded from the immutable M2-P3 implementation snapshot.
- M2-P1 historical assets remain unchanged.
- Product runtime, Prompt, Schema, policy, dataset, DB state, OpenAI configuration, and migration contents are unchanged by this boundary correction.
- This correction does not accept the contents of the M2-P4 Planning Package.
- The M2-P4 work is preserved in a stash and will be revalidated after this boundary correction; the stash is not applied, popped, or dropped by this task.

## Successful-run DB integrity verification

The existing synthetic live E2E records were inspected read-only through server-side SELECT only. The target identifiers are recorded only as run prefix `b91f8927` and request prefix `972bfdd1`; no full UUID or request, report, or Stage output body is recorded.

- overall DB integrity: PASS;
- Request integrity: PASS;
- Run integrity: PASS;
- Stage cardinality/order: PASS;
- Stage persistence: PASS;
- Usage totals: PASS;
- Report integrity: PASS;
- Atomic timestamp consistency: PASS;
- No mixed success/failure under request: PASS;
- Global anomaly scan: PASS;
- database counts: requests `3`, runs `3`, stages `8`, reports `1`, completed-ready runs `1`;
- failed runs: `2`, both with safe error code `M2_STAGE_PROVIDER_FAILED`;
- processing rows: `0`;
- integrity anomalies: `0`;
- OpenAI API calls during verification: `0`;
- DB writes during verification: `0`;
- migration operations during verification: `0`; and
- temporary inspection file: deleted.

The two failed runs are retained historical operational records and do not mix with the verified successful request. No orphan or in-progress residue was found. Historical task-time Fake zero-call/zero-spend evidence and post-acceptance live nonzero evidence remain separate and unchanged.
