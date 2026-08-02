# M2-P4-I3-R1-C1-R3-R2-C Review

## Status and boundary

- Task: `M2-P4-I3-R1-C1-R3-R2-C Pipeline, Topology Persistence, Candidate Fidelity, Safety, and Failure Semantics`
- Status: `human_chatgpt_accepted_complete`
- Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`
- Implementation accepted: `true`
- Initial implementation commit: `3afb05ad37073b6b95e872c2e34360341c2542dc`
- Accepted corrected implementation commit: `7e09b540220eac3b0afb91bc9cfb822cc0ab632d`
- Immutable cumulative implementation snapshot: `93893d78b58463b067a1419e8bf7056540636921..7e09b540220eac3b0afb91bc9cfb822cc0ab632d` (`23/23` exact paths; working tree excluded)
- Immutable review-correction snapshot: `3afb05ad37073b6b95e872c2e34360341c2542dc..7e09b540220eac3b0afb91bc9cfb822cc0ab632d` (`13/13` exact paths; working tree excluded)
- Baseline: `93893d78b58463b067a1419e8bf7056540636921`
- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-c-routing-persistence`
- Exact implementation scope: `23/23`
- Exact review-correction scope: `13/13`
- Acceptance synchronization exact scope: `6/6`
- Non-sync implementation blobs unchanged: `17/17`
- Review correction: `human_chatgpt_accepted_complete`
- Prompt responsibility parity: `PASS`
- Candidate persistence error ownership: `PASS`
- Provider / DB / Supabase operations: `0 / 0 / 0`
- Provider quality established: `false`
- Active Service catalog: unchanged; still `loadM2P4ProductQualityRuntimeStageCatalog`
- Migration: created, not applied
- Live DB compatibility established: `false`
- Active Runtime activated: `false`
- R3-R2-D ready / authorized: `true / false`

Human / ChatGPT accepts the corrected inactive split Runtime implementation. The R1 review correction restores accepted Base/Decision/Report/Validator Prompt responsibility parity and separates PB-01C Stage-persistence failures from Candidate analysis/Safety semantics. This acceptance does not establish Provider quality, migration application, live DB compatibility, isolated E2E readiness, Active Service activation, C2 eligibility, production readiness, or Milestone 2 completion.

## Version identity and Stage table

Catalog Schema is `m2-p4-runtime-stage-catalog-v2`; Catalog is `runtime-stage-catalog-v9.0.0`; Prompt bundle is `prompt-bundle-runtime-v9.0.0`; Schema set is `pipeline-schema-runtime-v4.0.0`; topology is `split-base-candidate-v1`.

| Seq | Stage | Responsibility | Prompt SHA-256 | Schema / SHA-256 |
|---:|---|---|---|---|
| 1 | PB-01 | Candidate-free Base situation | `c109a3fc13050f1cdafc17b3437611123b821c51bc89f9b514e432530a48c321` | Base v1 / `43d4ef598ccc1b2bd083d7dd86300c89f1db4805aa11537a182ec69899ce3ae6` |
| 2 | PB-01C | Candidate-only analysis and Safety signals | `9605685a8158a23c061f7a3a56c20b0d3ea1dad1be0059423a258144017d0c09` | Candidate v1 / `47b135176f187c9801637838a55aea8f734e425109d2e19da6b6ecb3975db86b` |
| 3 | PB-02 | Split semantic Safety | `d02baddeea20db089d3304876825a70dc09bcda6ddc2a7d05cf4c41811c0ef32` | Safety model result / `f4c758e61b8ebc425bfc5ff73a14e177cdf37579bf5863616065c3ea4045353c` |
| 4 | PB-03 | Application eligibility acknowledgment | `d282595168e09f5acfb4d4e22fe3f6997d8d748c9c9aed8e3defc3aabbf249f9` | Eligibility v3 / `5631202aeacf733ed9d40aa11766032fe685823ed8063fcf0941afcdbc673097` |
| 5 | PB-04 | Policy-bound Decision Plan v2 | `ab7f922ddcb5481c30aff097b26888c84597af238d76de1f398274022c70991b` | Decision Plan v2 / `76edb7009c3f341c915bc99307a2e8004f0dc86df34d6008509c8c022524bef0` |
| 6 | PB-05 | Explanation-only Report Content v2 | `95b74f072e5b587c8b598f3a5c6a7d9fe3094472ddd619c20c715b541f6dd6c5` | Report Content v2 / `85b47d2c20b933b8faad4b7d2781573612fc38c8fee4313cb318a56ccff8a650` |
| 7 | PB-06 | Policy, fidelity, report, and Safety validator | `7a38fec597393da4602c8c78cd92f37e35ac34ac3e70546d70c9149cce2e55dc` | Validation v1 / `62690536cce3021a7698caf7249dffc73a9326f2685e62502aa5d2863709f4be` |

The inherited common Prompt SHA-256 remains `218ebd586906c47910c7436874a13d2aa4ca6d6cef4df55dbfacff0ecb168fbf`.

## Review-correction result

- PB-01 Base now carries known-taxonomy precedence, cross-projection agreement, concrete practical-reason rules, untrusted quoted-content preservation, boundary ownership, relationship limits, and a final internal consistency check without Candidate-owned extraction.
- PB-04 now carries one copy-ready draft, smallest-useful-edit, concrete current-action, distinct aftercare, observable future-condition, and brief limitation responsibilities while retaining CandidateEnvelope/degraded restrictions.
- PB-05 now assigns all thirteen Report Content v2 fields and restores the accepted calm Japanese product voice, epistemic separation, selected-topic fulfillment, and explanation-only draft boundary.
- PB-06 now carries the accepted major/critical versus minor quality boundary, three default-minor quality codes, required-section/message-policy distinctions, important non-findings, independent PB-04 metadata validation, and fail-closed material Candidate drift.
- The four predecessor accepted Prompts remain unchanged. Catalog identity, Stage definitions/paths/versions, common Prompt, all Schemas/hashes, PB-01C/PB-02/PB-03 Prompt hashes, topology, and Active Service remain unchanged.

## Execution order

The split path is fixed to: (1) persist split run topology; (2) deterministic Safety on original input; (3) project and validate Base request; (4) invoke PB-01; (5) validate raw Base Schema; (6) validate raw Base Source Integrity; (7) ground Base; (8) validate grounded Base Schema; (9) validate grounded Base Source Integrity and contextual consistency; (10) build the Legacy View from that same grounded Base; (11) execute or skip PB-01C; (12) validate Candidate Safety independently; (13) validate Candidate Source Integrity; (14) validate/ground full Candidate analysis or enter the bounded degraded state; (15) construct the discriminated Candidate lane and split envelope; (16) invoke PB-02 with the exact three-key input; (17) aggregate deterministic, PB-02, Candidate-semantic, and cross-channel Safety; (18) invoke PB-03 with the Application expectation; (19) apply the local eligibility gate; (20) transiently project Candidate presence into a clone of Base Decision Facts; (21) build Application-owned Policy; (22) invoke and locally validate PB-04; (23) invoke PB-05 without raw Candidate text; (24) ground relationship and change-condition report fields; (25) revalidate grounded PB-05; (26) invoke PB-06 with explicit authorities; (27) fail closed on true major/critical findings while retaining the accepted temporal disposition; (28) build split report and Decision Card; and (29) atomically finalize or complete the non-ready run.

## Candidate and Safety behavior

- Absent Candidate: PB-01C Provider calls are zero. One sequence-2 `skipped` audit row stores only immutable request/Prompt/Schema/model/time identity; repository-owned response/output/error values are null and usage/latency are zero.
- Available Candidate: PB-01C owns the response ID, model, raw output, usage, and latency. Downstream payloads receive only the grounded allowlist analysis, separate Safety result where authorized, and explicit raw Candidate only at PB-04/PB-06.
- Degraded Candidate: when Candidate Safety is independently valid but non-Safety analysis fails Schema, PB-01C is persisted failed with `M2_CANDIDATE_ANALYSIS_UNAVAILABLE`; response evidence and one usage charge are preserved, no retry occurs, and conservative PB-04/PB-06 processing may complete.
- Safety unavailable: PB-01C is persisted failed with `M2_CANDIDATE_SAFETY_UNAVAILABLE`. A deterministic-normal run fails; an already non-normal deterministic result completes `safety_blocked` without PB-02 through PB-06.
- Candidate Source Integrity contamination fails with `M2_CANDIDATE_SOURCE_INTEGRITY_FAILED`; it never degrades.
- Any PB-01C `startStage`, `completeStage`, `failStage`, or `skipStage` persistence failure fails the run as `M2_STAGE_PERSISTENCE_FAILED`. It is never reclassified as Candidate analysis/Safety unavailable, never completes `safety_blocked` or degraded, never continues to PB-02, and never performs a second Stage-failure write. A valid PB-01C response is counted exactly once even when its completion write fails.
- Candidate direct Safety maps 25 material signal codes to ten established reason families. Four contact-action codes and embedded-instruction detection alone are nonblocking. Base `no_contact`, block/restriction, closure, and repeated-unanswered facts are evaluated cross-channel against Candidate presence. Final aggregation takes the strictest channel and deduplicates reason codes.

## Policy, fidelity, and report authorities

Base facts remain Candidate-free. Application code clones Base Decision Facts, assigns only `schema_version=m2-p4-decision-facts-v2` and `contact_state.proposed_message_present`, builds accepted Policy v3, and routes only the Policy result. The transient clone is neither persisted nor routed as Base.

PB-04 enforces selected-decision allowedness, draft timing/nullability, metadata nullability, Candidate source status, and conservative metadata in degraded mode. PB-05 never receives raw Candidate text. PB-06 receives the original Candidate, final draft, Application Policy, aggregate Safety, Base selected requests, Plan, and grounded report as distinct authorities. `decision_plan.recommended_message_draft.text` is the sole final draft; `report_content` is explanation only. True material major/critical findings fail with `M2_SEMANTIC_VALIDATION_FAILED`.

## Persistence and migration

Runtime repository types persist `stage_topology_version` and support `skipStage`. Migration `0004_m2_p4_candidate_source_isolation.sql` SHA-256 is `6ecc0f592fa6c1b0d70dd49f2bd0b9be560316d6c46fd1ccb0bfaa846545c538`. Static migration logic backfills parent runs only, admits the two exact topology values and `skipped`, adds `unique(run_id, sequence_number)`, enforces topology/sequence from the parent run, enforces v9/v4 agreement and skipped-row invariants, and does not update historical Stage rows. It was not applied and no Supabase connection was made.

## Offline evidence

- Existing routing fixtures: `16/16` unchanged, synthetic only
- Persistence-correction routing fixtures: `4/4`, synthetic only
- Fake split scenarios: `15`
- Mutation rejection: `17/17`
- Payload routing: `7/7`
- Accepted A implementation blobs: `4/4` unchanged
- Accepted B non-sync blobs: `7/7` unchanged
- Accepted Planning blobs: `5/5` unchanged
- Legacy-six report and Decision Card: deep-equal parity PASS
- Dedicated verifier: `154` checks PASS, including the retained existing `99`
- Decision Policy verifier: `40/40`
- Typecheck: PASS
- Lint: PASS, warnings `0`
- Production build: PASS
- `git diff --check`: PASS

These are Fake/offline and static results. They establish the accepted inactive implementation boundary only; they do not establish Provider quality, live persistence compatibility, migration application, isolated E2E readiness, or Runtime activation.

## Immutable cumulative implementation manifest

1. `lib/assessment/runtime/types.ts`
2. `lib/assessment/runtime/pipeline.ts`
3. `lib/assessment/runtime/fakes.ts`
4. `lib/assessment/runtime/schema-catalog.ts`
5. `lib/assessment/runtime/supabase-repository.ts`
6. `lib/assessment/runtime/safety-aggregation-v3.ts`
7. `lib/assessment/runtime/candidate-safety-routing-v1.ts`
8. `lib/assessment/runtime/contracts/runtime-stage-catalog-v9.json`
9. `lib/assessment/runtime/contracts/pb-01-base-situation-v1.developer.md`
10. `lib/assessment/runtime/contracts/pb-01c-candidate-analysis-v1.developer.md`
11. `lib/assessment/runtime/contracts/pb-02-split-safety-v1.developer.md`
12. `lib/assessment/runtime/contracts/pb-03-split-projection-v1.developer.md`
13. `lib/assessment/runtime/contracts/pb-04-split-decision-v1.developer.md`
14. `lib/assessment/runtime/contracts/pb-05-split-report-v1.developer.md`
15. `lib/assessment/runtime/contracts/pb-06-split-validator-v1.developer.md`
16. `supabase/migrations/0004_m2_p4_candidate_source_isolation.sql`
17. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/routing-fixtures-v1.json`
18. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/capabilities-v1.json`
19. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-c-routing-persistence.mjs`
20. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_C_REVIEW.md`
21. `docs/CURRENT_FOCUS.md`
22. `docs/WBS.md`
23. `docs/CODEX_HANDOFF.md`

## Immutable review-correction manifest

1. `lib/assessment/runtime/pipeline.ts`
2. `lib/assessment/runtime/contracts/runtime-stage-catalog-v9.json`
3. `lib/assessment/runtime/contracts/pb-01-base-situation-v1.developer.md`
4. `lib/assessment/runtime/contracts/pb-04-split-decision-v1.developer.md`
5. `lib/assessment/runtime/contracts/pb-05-split-report-v1.developer.md`
6. `lib/assessment/runtime/contracts/pb-06-split-validator-v1.developer.md`
7. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/routing-fixtures-v1.json`
8. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/capabilities-v1.json`
9. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-c-routing-persistence.mjs`
10. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_C_REVIEW.md`
11. `docs/CURRENT_FOCUS.md`
12. `docs/WBS.md`
13. `docs/CODEX_HANDOFF.md`

## Exact acceptance-sync manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-c/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_C_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-c-routing-persistence.mjs`
4. `docs/CURRENT_FOCUS.md`
5. `docs/WBS.md`
6. `docs/CODEX_HANDOFF.md`

The other seventeen implementation paths remain content-identical to accepted corrected implementation commit `7e09b540220eac3b0afb91bc9cfb822cc0ab632d`. This `6/6` synchronization does not extend or rewrite either immutable historical implementation snapshot.

## Validation and acceptance statement

Validated sequentially:

1. `node scripts/verify-m2-p4-i3-r1-c1-r3-r2-c-routing-persistence.mjs`
2. `node evals/quality/m2-p4-i1/verify-decision-policy.mjs`
3. `npm run typecheck`
4. `npm run lint`
5. `npm run build`
6. `git diff --check`

Verified result: acceptance sync `6/6`, immutable cumulative scope `23/23`, immutable correction scope `13/13`, non-sync implementation blobs `17/17` unchanged, accepted A `4/4`, accepted B `7/7`, accepted Planning `5/5`, predecessor Prompts `4/4`, verifier `154` checks, routing fixtures `20/20`, mutations `17/17`, Fake split scenarios `15`, payload routing `7/7`, Decision Policy `40/40`, typecheck PASS, lint PASS with warnings `0`, build PASS, migration unchanged and unapplied, Provider / DB / Supabase `0 / 0 / 0`, Active Service unchanged, and `git diff --check` PASS.

Human / ChatGPT accepted complete. R3-R2-D is ready but remains unauthorized and was not started. R3-R2-E, R4, C2, Provider execution, migration application, Supabase access, Runtime activation, PR creation, and main integration remain unauthorized. `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`.
