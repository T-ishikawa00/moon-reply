# M2-P4-I3-R1-C1-R3-R2-C Review

## Status and boundary

- Status: `implementation_pending_human_chatgpt_review`
- Baseline: `93893d78b58463b067a1419e8bf7056540636921`
- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-c-routing-persistence`
- Exact implementation scope: `23/23`
- Provider / DB / Supabase operations: `0 / 0 / 0`
- Active Service catalog: unchanged; still `loadM2P4ProductQualityRuntimeStageCatalog`
- Migration: created, not applied
- Human / ChatGPT review: pending
- R3-R2-D: unauthorized

This implementation connects accepted A/B contracts to an inactive split Runtime. It does not establish Provider quality, migration application, live DB compatibility, isolated E2E readiness, Runtime activation, C2 eligibility, or Milestone 2 completion.

## Version identity and Stage table

Catalog Schema is `m2-p4-runtime-stage-catalog-v2`; Catalog is `runtime-stage-catalog-v9.0.0`; Prompt bundle is `prompt-bundle-runtime-v9.0.0`; Schema set is `pipeline-schema-runtime-v4.0.0`; topology is `split-base-candidate-v1`.

| Seq | Stage | Responsibility | Prompt SHA-256 | Schema / SHA-256 |
|---:|---|---|---|---|
| 1 | PB-01 | Candidate-free Base situation | `5add38000efcf812d6ecfc12807c29df12358e16f8cca521729e4452d1ea71eb` | Base v1 / `43d4ef598ccc1b2bd083d7dd86300c89f1db4805aa11537a182ec69899ce3ae6` |
| 2 | PB-01C | Candidate-only analysis and Safety signals | `9605685a8158a23c061f7a3a56c20b0d3ea1dad1be0059423a258144017d0c09` | Candidate v1 / `47b135176f187c9801637838a55aea8f734e425109d2e19da6b6ecb3975db86b` |
| 3 | PB-02 | Split semantic Safety | `d02baddeea20db089d3304876825a70dc09bcda6ddc2a7d05cf4c41811c0ef32` | Safety model result / `f4c758e61b8ebc425bfc5ff73a14e177cdf37579bf5863616065c3ea4045353c` |
| 4 | PB-03 | Application eligibility acknowledgment | `d282595168e09f5acfb4d4e22fe3f6997d8d748c9c9aed8e3defc3aabbf249f9` | Eligibility v3 / `5631202aeacf733ed9d40aa11766032fe685823ed8063fcf0941afcdbc673097` |
| 5 | PB-04 | Policy-bound Decision Plan v2 | `b963029b5369187de243a98439978c30cc3c0cd5c39ce91ea758d81c4408a362` | Decision Plan v2 / `76edb7009c3f341c915bc99307a2e8004f0dc86df34d6008509c8c022524bef0` |
| 6 | PB-05 | Explanation-only Report Content v2 | `cea7f5f3420107810876c03b52ed5e0c3b6b111ddb04941a8ef0e946cc0739c9` | Report Content v2 / `85b47d2c20b933b8faad4b7d2781573612fc38c8fee4313cb318a56ccff8a650` |
| 7 | PB-06 | Policy, fidelity, report, and Safety validator | `e26c2b6d2acb1e43ca9511470e87ee403228463033d0b8d63544329d321ba9b3` | Validation v1 / `62690536cce3021a7698caf7249dffc73a9326f2685e62502aa5d2863709f4be` |

The inherited common Prompt SHA-256 remains `218ebd586906c47910c7436874a13d2aa4ca6d6cef4df55dbfacff0ecb168fbf`.

## Execution order

The split path is fixed to: (1) persist split run topology; (2) deterministic Safety on original input; (3) project and validate Base request; (4) invoke PB-01; (5) validate raw Base Schema; (6) validate raw Base Source Integrity; (7) ground Base; (8) validate grounded Base Schema; (9) validate grounded Base Source Integrity and contextual consistency; (10) build the Legacy View from that same grounded Base; (11) execute or skip PB-01C; (12) validate Candidate Safety independently; (13) validate Candidate Source Integrity; (14) validate/ground full Candidate analysis or enter the bounded degraded state; (15) construct the discriminated Candidate lane and split envelope; (16) invoke PB-02 with the exact three-key input; (17) aggregate deterministic, PB-02, Candidate-semantic, and cross-channel Safety; (18) invoke PB-03 with the Application expectation; (19) apply the local eligibility gate; (20) transiently project Candidate presence into a clone of Base Decision Facts; (21) build Application-owned Policy; (22) invoke and locally validate PB-04; (23) invoke PB-05 without raw Candidate text; (24) ground relationship and change-condition report fields; (25) revalidate grounded PB-05; (26) invoke PB-06 with explicit authorities; (27) fail closed on true major/critical findings while retaining the accepted temporal disposition; (28) build split report and Decision Card; and (29) atomically finalize or complete the non-ready run.

## Candidate and Safety behavior

- Absent Candidate: PB-01C Provider calls are zero. One sequence-2 `skipped` audit row stores only immutable request/Prompt/Schema/model/time identity; repository-owned response/output/error values are null and usage/latency are zero.
- Available Candidate: PB-01C owns the response ID, model, raw output, usage, and latency. Downstream payloads receive only the grounded allowlist analysis, separate Safety result where authorized, and explicit raw Candidate only at PB-04/PB-06.
- Degraded Candidate: when Candidate Safety is independently valid but non-Safety analysis fails Schema, PB-01C is persisted failed with `M2_CANDIDATE_ANALYSIS_UNAVAILABLE`; response evidence and one usage charge are preserved, no retry occurs, and conservative PB-04/PB-06 processing may complete.
- Safety unavailable: PB-01C is persisted failed with `M2_CANDIDATE_SAFETY_UNAVAILABLE`. A deterministic-normal run fails; an already non-normal deterministic result completes `safety_blocked` without PB-02 through PB-06.
- Candidate Source Integrity contamination fails with `M2_CANDIDATE_SOURCE_INTEGRITY_FAILED`; it never degrades.
- Candidate direct Safety maps 25 material signal codes to ten established reason families. Four contact-action codes and embedded-instruction detection alone are nonblocking. Base `no_contact`, block/restriction, closure, and repeated-unanswered facts are evaluated cross-channel against Candidate presence. Final aggregation takes the strictest channel and deduplicates reason codes.

## Policy, fidelity, and report authorities

Base facts remain Candidate-free. Application code clones Base Decision Facts, assigns only `schema_version=m2-p4-decision-facts-v2` and `contact_state.proposed_message_present`, builds accepted Policy v3, and routes only the Policy result. The transient clone is neither persisted nor routed as Base.

PB-04 enforces selected-decision allowedness, draft timing/nullability, metadata nullability, Candidate source status, and conservative metadata in degraded mode. PB-05 never receives raw Candidate text. PB-06 receives the original Candidate, final draft, Application Policy, aggregate Safety, Base selected requests, Plan, and grounded report as distinct authorities. `decision_plan.recommended_message_draft.text` is the sole final draft; `report_content` is explanation only. True material major/critical findings fail with `M2_SEMANTIC_VALIDATION_FAILED`.

## Persistence and migration

Runtime repository types persist `stage_topology_version` and support `skipStage`. Migration `0004_m2_p4_candidate_source_isolation.sql` SHA-256 is `6ecc0f592fa6c1b0d70dd49f2bd0b9be560316d6c46fd1ccb0bfaa846545c538`. Static migration logic backfills parent runs only, admits the two exact topology values and `skipped`, adds `unique(run_id, sequence_number)`, enforces topology/sequence from the parent run, enforces v9/v4 agreement and skipped-row invariants, and does not update historical Stage rows. It was not applied and no Supabase connection was made.

## Offline evidence

- Routing fixtures: `16/16`, synthetic only
- Fake split scenarios: `11`
- Mutation rejection: `17/17`
- Payload routing: `7/7`
- Accepted A implementation blobs: `4/4` unchanged
- Accepted B non-sync blobs: `7/7` unchanged
- Accepted Planning blobs: `5/5` unchanged
- Legacy-six report and Decision Card: deep-equal parity PASS
- Dedicated verifier: PASS
- Decision Policy verifier: `40/40`
- Typecheck: PASS
- Lint: PASS, warnings `0`
- Production build: PASS
- `git diff --check`: PASS

These are Fake/offline and static results. They do not claim Provider quality, live persistence compatibility, migration application, isolated E2E readiness, or Runtime activation.
