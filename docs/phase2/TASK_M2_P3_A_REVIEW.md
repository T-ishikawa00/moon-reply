# Task M2-P3-A Review

## Review identity

- Task: `M2-P3-A Internal AI Assessment Runtime Vertical Slice`
- Baseline: `72d4121ff4ad0682bcafbeed4f72f6491e697ffa`
- Branch: `feature/m2-p3-a-runtime-vertical-slice`
- Intended implementation commit: `feat: add internal AI assessment runtime slice`
- Acceptance state: implementation candidate pending final automated command sequence, code review, and Human setup

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
- fake transport and fake repository;
- dedicated M2-P3 verifier;
- M2-P3 successor capability manifest.

## Automated scenario matrix

The dedicated verifier must pass:

- `WAIT-003` ready/report path;
- `needs_more_information`;
- `safety_blocked`;
- invalid Stage Schema;
- returned-model mismatch;
- duplicate idempotency key;
- injected database write failure;
- PB-05 failure with no PB-06 invocation;
- exact Stage/local-step ordering;
- all Stage outputs/statuses persisted;
- completed assessment-note data renderable;
- actual OpenAI calls `0`;
- actual Supabase calls `0`;
- API spend `USD 0`.

The final review decision must rely on the terminal results of the exact sequential validation commands, not on this prospective checklist alone.

## Security review

- [ ] production and feature-disable fail closed;
- [ ] no secret value committed or logged;
- [ ] no browser provider/database client in the new runtime;
- [ ] same-origin and strict body validation;
- [ ] RLS enabled with no public policies;
- [ ] provider `store: false`, no tools/stream/background;
- [ ] exact model allowlist and returned-model match;
- [ ] no retry, Repair/PB-07, or fallback;
- [ ] raw provider errors and stacks not returned/persisted;
- [ ] public `/request` and public product behavior unchanged.

## Prohibited-scope review

Not implemented: payment, RevenueCat, authentication, email, public production release, real-user processing, analytics, download/PDF/share/print, background queue, cron, mobile API, public history, retry, Repair/PB-07, fallback model, Supabase Project setup, API-key creation, or PR creation.

## Human setup gate

After code review, Human must separately configure server secrets, apply the migration to a dedicated development project, confirm RLS/no-policy state, authorize a synthetic-only smoke test, and define cleanup. Until then, live OpenAI and Supabase bindings remain unconfigured.
