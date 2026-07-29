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
- M2-P3 Runtime Vertical Slice is accepted and complete; Milestone 2 remains incomplete; and
- current work is successful-run DB integrity verification, followed by M2-P4 quality evaluation planning.

This post-acceptance Human record is separate from the task-time Fake zero-call/zero-spend evidence. CodeX did not revalidate secret values or query the development database for this documentation synchronization.
