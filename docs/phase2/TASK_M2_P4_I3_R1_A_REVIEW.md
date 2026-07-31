# TASK M2-P4-I3-R1-A Review

## Status

- Task: `Successor Schemas and Typed Writing Context Contracts`
- Task ID: `M2-P4-I3-R1-A`
- Baseline: `e5cfd903740267db6d070964a9ec72a7d823f310`
- Branch: `feat/m2-p4-i3-r1-a-schema-contracts`
- Status: `implementation_pending_human_chatgpt_review`
- Accepted planning commit: `3c64e5e2179b4c03979119068716326337a002c6`
- Accepted planning snapshot: `ec7cd53884ab4056c78d2596c609baef5701274a..3c64e5e2179b4c03979119068716326337a002c6` (`12/12` exact paths)
- Candidate schema set: `pipeline-schema-runtime-v4.0.0`
- Active Runtime changed: false
- Provider diagnostic: not started
- Achieved score: none
- Final I3 acceptance: pending
- Milestone 2: incomplete
- `main`: `61e33a10e195fad17e253a6b9719217e1992f273`
- Next candidate: `M2-P4-I3-R1-B PB-01 v4 Writing Context Extraction and Grounding`
- Next candidate authorized: false

## Exact mutation manifest

Exactly 18 literal paths are authorized:

1. `lib/assessment/runtime/contracts/writing-context-v1.ts`
2. `lib/assessment/runtime/contracts/structured-intake-v4.schema.json`
3. `lib/assessment/runtime/contracts/decision-plan-v2.schema.json`
4. `lib/assessment/runtime/contracts/report-content-v2.schema.json`
5. `evals/runtime/m2-p4-i3-r1-a-schema-contract-v1.json`
6. `evals/runtime/m2-p4-i3-r1-a-contract-fixtures-v1.json`
7. `evals/runtime/m2-p4-i3-r1-a-capabilities-v1.json`
8. `scripts/verify-m2-p4-i3-r1-a-contracts.mjs`
9. `docs/phase2/TASK_M2_P4_I3_R1_A_REVIEW.md`
10. `scripts/verify-m2-p4-i3-product-quality.mjs`
11. `scripts/verify-m2-p4-i2-report-ia.mjs`
12. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`
13. `scripts/verify-m2-p4-i1-b-runtime-integration.mjs`
14. `scripts/verify-m2-eval-foundation.mjs`
15. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
16. `docs/CURRENT_FOCUS.md`
17. `docs/WBS.md`
18. `docs/CODEX_HANDOFF.md`

No wildcard, prefix authorization, or future-path authority is implied. Current v3 Schemas, current Decision / Report Schemas, validation-result Schema, Prompt, Runtime catalog, Pipeline, Service, schema catalog, runtime types, Policy, Safety, eligibility, grounding, disposition, app, components, CSS, Supabase, package files, development data, holdout, and accepted snapshots are protected.

## Candidate contract set

| Stage | Candidate path | Schema version | Activation |
| --- | --- | --- | --- |
| PB-01 | `lib/assessment/runtime/contracts/structured-intake-v4.schema.json` | `pipeline-schema-v4.0.0` | inactive candidate |
| PB-04 | `lib/assessment/runtime/contracts/decision-plan-v2.schema.json` | `pipeline-schema-v2.0.0` | inactive candidate |
| PB-05 | `lib/assessment/runtime/contracts/report-content-v2.schema.json` | `pipeline-schema-v2.0.0` | inactive candidate |
| PB-06 | current `ai/schemas/validation-result.schema.json` | unchanged | successor not in this slice |

The active Runtime remains `prompt-bundle-runtime-v4.0.0`, `pipeline-schema-runtime-v3.0.0`, and `lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json`. No loader, Pipeline, Service, or catalog connection is added.

## Contract decisions

- `writing-context-v1.ts` is a pure, inactive TypeScript contract module. It exports bounded enum constants, union types, and `WritingContextV1`; it has no function, I/O, Provider call, or Runtime activation.
- Structured Intake v4 is a versioned v3 successor with only the top-level version metadata and required `writing_context` definition added. Existing intake fields and `decision_facts` remain deep-equal to v3.
- `writing_context` contains typed evidence, source references, relationship dimensions, message ownership, incoming/candidate profiles, detailed goal and constraints, communication pattern, channel/timing, language/expression, repeat-consultation state, Privacy markers, and unresolved field paths. Raw message bodies, PII values, confidence, probability, fixture/oracle IDs, database IDs, and full UUIDs are excluded.
- `writing_context` and `decision_facts` are independent contracts. Broad relationship chips cannot synthesize decision-material, Safety-material, authority, consent, age, or reconciliation facts.
- Decision Plan v2 supports one conditionally valid draft, typed edit metadata, `pre_action_check`, bounded action counts, flexible aftercare, bounded change conditions, material unknowns, and zero-to-two model-generated limitations without forced filler.
- Report Content v2 removes `unknowns_commentary`, permits topic-dependent empty/null sections, and keeps report commentary cardinality synchronized with the Decision Plan through application-owned cross-contract validation.
- Canonical Schemas retain expressive constraints needed for local AJV and cross-contract validation. Provider projections are separately checked against OpenAI Structured Outputs restrictions; conditions not representable in the Provider projection remain application-owned.

## Canonical LF UTF-8 SHA-256

- `structured-intake-v4.schema.json`: `080de1b798d5abb91a85eb1b22e42bf4d862664fc8d6469f140c43d8622601d7`
- `decision-plan-v2.schema.json`: `76edb7009c3f341c915bc99307a2e8004f0dc86df34d6008509c8c022524bef0`
- `report-content-v2.schema.json`: `85b47d2c20b933b8faad4b7d2781573612fc38c8fee4313cb318a56ccff8a650`
- `writing-context-v1.ts`: `6f17df0f383458f475ffb56742d87c2cc11aa0129b852da0f134625a35d1917b`

## Fixture coverage

The synthetic-only fixture bundle contains six valid full contract sets and ten invalid full contract sets. Valid coverage includes reply-now with a minimal candidate edit, reply-now without a candidate, wait without a current draft, wait with a later-only draft, pause with zero aftercare, and next-three-days with three distinct aftercare items. Invalid coverage assigns an explicit expected failure code and Schema or cross-contract owner for each required negative case.

Fixtures contain no real person, real user, PII value, full UUID, holdout material, database record, or existing evaluation oracle.

## Required machine checks

- [x] R1-A dedicated contract verifier
- [x] M2-P4-I3 product-quality historical verifier
- [x] M2-P4-I2 report-IA historical verifier
- [x] M2-P4-I1-C contextual-best-effort historical verifier
- [x] M2-P4-I1-B runtime-integration historical verifier
- [x] Decision policy `40/40`
- [x] M2 evaluation-foundation historical verifier
- [x] M2-P3 runtime-vertical-slice historical verifier
- [x] TypeScript typecheck
- [x] ESLint
- [x] Production build
- [x] JSON parse, exact scope `18/18`, protected diff `0`, Provider projection, valid/invalid fixtures, cross-contract checks, Canonical Suite `64/64`, and `git diff --check`

## Capability boundary

- OpenAI calls: `0`
- Paid execution: `0`
- Database operations: `0`
- Supabase operations: `0`
- Migrations: `0`
- Holdout use: `0`
- Real-user data: `0`
- Prompt / Pipeline / Service / UI / Policy mutations: `0 / 0 / 0 / 0 / 0`
- Provider score: none
- Runtime activation: none
- PR / main merge / release: none

## Human / ChatGPT review questions

- [ ] Does the pure TypeScript contract exactly match every writing-context Schema enum?
- [ ] Does Structured Intake v4 preserve v3 and keep `decision_facts` deep-equal?
- [ ] Are candidate presence, message ownership, source references, explicit constraints, Privacy markers, and unresolved writing fields represented without raw text or PII values?
- [ ] Do Decision Plan v2 conditionals reject invalid decision/draft/metadata combinations without forcing redundant prose?
- [ ] Do Report Content v2 and application-owned cross-contract checks prevent stale draft context and count mismatches?
- [ ] Do canonical AJV and Provider projection both pass without activating Runtime?
- [ ] Are historical snapshots immutable and the R1-A successor allowlist exactly 18 literal paths?
- [ ] Is R1-B still not started and not authorized?

## Evidence boundary

Automated validation can establish Schema syntax, canonical AJV behavior, projected Provider compatibility, enum parity, v3 preservation, synthetic fixture outcomes, cross-contract invariants, historical snapshot preservation, exact mutation scope, and protected-diff absence. It cannot establish Provider model quality, a Human prose-quality decision, final I3 acceptance, release readiness, or Milestone 2 completion.

This task makes no live OpenAI call, database operation, Supabase operation, migration, holdout access, real-user-data access, Provider diagnostic, E1 execution, Runtime activation, PR, or `main` merge. R1-B remains not started and not authorized.
