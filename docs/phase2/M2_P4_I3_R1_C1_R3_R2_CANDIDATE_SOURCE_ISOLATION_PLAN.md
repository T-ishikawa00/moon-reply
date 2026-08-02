# M2-P4-I3-R1-C1-R3-R2 Candidate Source Isolation Architecture Plan

## 1. Status and authority

- Task: `M2-P4-I3-R1-C1-R3-R2 Candidate Source Isolation Architecture Planning`
- Status: `candidate_source_isolation_architecture_pending_human_chatgpt_review`
- Baseline: `df03cc2cc374ed059d40c122788e736f75883758`
- Branch: `docs/m2-p4-i3-r1-c1-r3-r2-candidate-source-isolation`
- `main` / `origin/main`: `61e33a10e195fad17e253a6b9719217e1992f273`
- Task type: Planning-only
- Exact mutation scope: `10/10`
- Provider calls / DB operations / Supabase operations / holdout / real-user data: `0 / 0 / 0 / 0 / 0`
- Runtime / Prompt / Schema / Pipeline / Service / DB-migration implementation: `0 / 0 / 0 / 0 / 0 / 0`

This package decides the successor architecture and acceptance order only. It does not implement or activate the split, execute a Provider, touch Supabase, run R4, activate Runtime, start C2 or E1, create a PR, or merge to `main`.

## 2. Accepted architectural decision

Decision B is controlling: Situation intake and the optional candidate message must be processed by separate Provider boundaries.

The current single PB-01 boundary has failed Candidate Source Isolation. In R3-03, candidate-only `木曜15時` was merged into an `other_person` incoming Timeline statement. The resulting sentence assigned the candidate detail to the wrong message owner and source surface.

This is not safely repairable by a language-independent Application filter after generation. Once two source meanings have been fused into one natural-language statement, deleting a candidate token can also delete legitimate Base meaning, while preserving the sentence can retain a false observed fact. The architecture must prevent the merge at request construction.

Disposition:

- Candidate Source Isolation: `FAIL`
- R3-R1 Context-Inference Canonicalization: accepted and retained
- `provider_semantic_quality_established=true`: superseded pending isolation
- `candidate_ready_for_isolated_e2e=true`: superseded pending isolation
- Provider semantic quality established: `false`
- Candidate ready for isolated E2E: `false`
- R4 / Runtime activation / C2: `HOLD`

Historical R3 and R3-R1 artifacts are not rewritten. This plan records a separate successor disposition.

## 3. Non-negotiable isolation invariants

1. PB-01 receives Base fields only.
2. PB-01C receives candidate fields only.
3. Base Provider request bytes do not depend on candidate presence or content.
4. Candidate content never appears in Base Timeline, Context, Observed Facts, Material Unknowns, Decision Facts, or Base Legacy View.
5. Candidate output cannot emit Base fact fields, source references, IDs, or sequence.
6. Application code owns candidate presence, provenance, IDs, sequence, nullability, policy, Safety aggregation, and the separate downstream envelope.
7. No merged Structured Intake is created.
8. Safety continues to inspect both raw `current_situation` and raw `optional_message` deterministically.
9. Candidate semantic Safety remains a separate nullable channel and never becomes a Base fact.
10. True material PB-06 major/critical findings remain fail-closed.

## 4. Existing topology and persistence constraints

The current implementation is closed around exactly six Stage IDs:

| Stage | Current sequence |
| --- | ---: |
| PB-01 | 1 |
| PB-02 | 2 |
| PB-03 | 3 |
| PB-04 | 4 |
| PB-05 | 5 |
| PB-06 | 6 |

The TypeScript Stage ID union, stage catalog loaders, fakes, and cost/routing tooling assume those six IDs. `assessment_stage_runs` has a unique `(run_id, stage_id)` constraint, hard-codes the six Stage/sequence pairs, permits only `processing / completed / failed`, stores nullable `response_id`, and requires nonnegative usage and latency.

Therefore, adding one Provider call without coordinated type, catalog, persistence, routing, and historical-regression work would be invalid. R3-R2-C must change those surfaces together in its separately accepted exact scope. This planning task changes none of them.

## 5. Successor Stage topology

The Base Stage retains `PB-01`. The Candidate Stage ID is `PB-01C`.

| Successor Stage | Sequence | Invocation |
| --- | ---: | --- |
| PB-01 Base Situation Intake | 1 | required |
| PB-01C Candidate Message Analysis | 2 | only when trimmed `optional_message` is non-empty |
| PB-02 Safety Semantic | 3 | after Base and candidate Safety routing are established |
| PB-03 Eligibility Projection | 4 | required after aggregate Safety |
| PB-04 Decision Plan | 5 | only when Application eligibility is ready |
| PB-05 Report Writer | 6 | only when Application eligibility is ready |
| PB-06 Semantic Validator | 7 | only when Application eligibility is ready |

`PB-01C` makes ownership explicit, keeps the stage adjacent to PB-01, and avoids renaming the historical PB-01 identity. PB-02 through PB-06 change sequence only for successor split runs.

Historical six-stage runs remain immutable. Readers and verifiers must select the six-stage or split-stage topology from the parent run's `schema_set_version`, `prompt_bundle_version`, and catalog version. A future migration must preserve existing rows, admit the historical and successor Stage/sequence pairs, add unique `(run_id, sequence_number)`, and enforce the exact topology in version-aware Application integrity. It must not update historical Stage rows.

### Candidate absence and persistence

A null, empty, or whitespace-only candidate makes zero PB-01C Provider calls. The successor persistence design nevertheless records one audit row:

- Stage: `PB-01C`
- sequence: `2`
- status: `skipped`
- `response_id` / `returned_model` / `output_json`: `null`
- all usage fields and latency: `0`
- `candidate_analysis=null`
- optional source refs: `0`

Persisting a zero-call skipped row gives a deterministic seven-position topology and distinguishes intentional absence from an interrupted run. Current DB status constraints do not permit it; R3-R2-C owns the future migration and implementation. No DB operation is authorized here.

Response IDs stay only on the Stage row that received the response. Candidate response IDs never enter downstream payloads. Skipped stages contribute zero usage; completed responses contribute once; failures before a response contribute zero; failures after a response contribute returned usage exactly once.

## 6. PB-01 Base Situation Intake

PB-01 input is a closed object containing only:

- `current_situation`
- `relationship`
- `requested_topics`

It must never receive:

- `optional_message`
- candidate text, presence, style, intent, or expected values
- fixture IDs, case IDs, oracles, or assertions

The Base output owns:

- Timeline
- Context
- Observed Facts
- Material Unknowns
- Decision Facts
- relationship semantics
- communication pattern supported by `current_situation`
- message ownership supported by `current_situation`
- boundary ownership
- Privacy, repeat-consultation, and injection semantics supported by `current_situation`

The successor Base Schema has no candidate fields. In particular, current candidate-derived `decision_facts.contact_state.proposed_message_present` cannot remain in Base Decision Facts. Candidate presence becomes an Application-owned fact outside Base Structured Intake.

The Base source-ref enum is exactly:

- `input:current_situation`
- `input:relationship`
- `input:requested_topics`

`input:optional_message` is forbidden by both Schema and Source Integrity. A generic `input|followup` regex is insufficient and is not the controlling check.

Three Base surfaces are explicit:

- `raw_base_structured_intake`: PB-01 Provider output
- `base_structured_intake`: Application-grounded canonical Base output
- `base_legacy_view`: Base-only compatibility projection

R3-R1 `canonicalizeContextInferencesV5` remains on the Base grounding path after evidence guarding. It cannot read candidate content and does not become a substitute for source isolation.

## 7. PB-01C Candidate Message Analysis

PB-01C is called only when `trim(optional_message).length > 0`.

Its closed input is:

- `optional_message`
- bounded constant metadata:
  - `message_owner=user`
  - `message_status=unsent_candidate`

It does not receive raw `current_situation`, relationship, requested topics, Base output, Decision Facts, expected style/intent values, case IDs, or oracles.

Its Provider output has exactly four top-level fields:

- `candidate_style_profile`
- `candidate_communicative_intent`
- `candidate_language_expression`
- `candidate_safety_signals`

It must not emit Timeline, Context, Observed Facts, Material Unknowns, relationship stage, Decision Facts, incoming-message facts, boundary facts, source refs, IDs, or sequence. It must not echo raw candidate text.

After validation, Application code creates the candidate envelope. Application code owns:

- `candidate_presence`
- `candidate_analysis_status: absent | available | unavailable`
- `input:optional_message` provenance on candidate-owned fields only
- candidate IDs and sequence
- nullability
- allowlist merge into the candidate envelope

The envelope remains a sibling of `base_structured_intake`; it is never inserted into Base Structured Intake.

## 8. Safety routing

Source isolation must not make Safety blind.

Deterministic Safety continues to inspect raw:

- `current_situation`
- `optional_message`

PB-01C's bounded `candidate_safety_signals` are independently validated and projected by Application code into `candidate_safety_result`. That result stays separate from Base facts.

PB-02 receives exactly:

- `base_structured_intake`
- `deterministic_rule_result`
- nullable `candidate_safety_result`

PB-03 receives exactly:

- `base_structured_intake`
- `aggregate_safety_result`
- `application_eligibility_expectation`

The Application Safety router performs strictest-result aggregation and the cross-channel checks that PB-01C cannot perform without Base context. Explicit no-contact violation is the key example: Base owns the explicit boundary, PB-01C owns whether the candidate initiates or continues contact, and Application code evaluates the cross-product without merging either source.

Required categories are fixed in `safety-failure-matrix-v1.json`:

- threat/coercion
- stalking/contact pressure
- doxxing/privacy disclosure
- self-harm
- harm to others
- minor-related content
- illegal content
- explicit no-contact violation

Any non-normal aggregate blocks ordinary PB-04 through PB-06 generation. Safety response mode is selected from the strictest bounded reason set.

## 9. PB-04 through PB-06 payloads

| Stage | Exact input keys |
| --- | --- |
| PB-04 | `base_structured_intake`, nullable `candidate_analysis`, nullable `user_supplied_optional_message`, `decision_policy_result`, `requested_topics` |
| PB-05 | `base_structured_intake`, nullable `candidate_analysis`, `decision_plan` |
| PB-06 | `base_structured_intake`, nullable `candidate_analysis`, `decision_plan`, `report_content`, `aggregate_safety_result` |

Raw `optional_message` is not sent to PB-05 or PB-06. Candidate response IDs, Stage usage, fixture IDs, and expected values are never routed. No `structured_intake` alias may conceal a merged Base/candidate object.

## 10. Failure semantics

### Base failure

PB-01 Provider, Schema, grounding, or Source Integrity failure is terminal and fail-closed. No downstream Provider Stage runs.

### Candidate absent

- PB-01C Provider calls: `0`
- `candidate_analysis=null`
- `candidate_analysis_status=absent`
- optional source refs: `0`

### Candidate analysis unavailable but Candidate Safety valid

Candidate Safety is validated independently from style, intent, and language. If Candidate Safety is valid, aggregate Safety is `normal_allowed`, and only non-Safety candidate fields fail:

- Base assessment continues
- `candidate_analysis=null`
- `candidate_analysis_status=unavailable`
- no candidate semantics are fabricated
- raw optional message remains a separate PB-04 input
- PB-04 may perform conservative minimal editing only
- PB-06 remains fail-closed for material findings

Conservative minimal editing may preserve the original, correct obvious surface typography, or remove content forbidden by Application policy. It may not add facts, schedule details, relationship meaning, questions, invitations, affection, commitment, or pressure.

### Candidate Safety unavailable

If PB-01C fails before independently valid Candidate Safety exists, ordinary candidate generation is fail-closed with `M2_CANDIDATE_SAFETY_UNAVAILABLE`. If deterministic Safety already yields `needs_review` or `rejected`, the system returns the stricter `safety_blocked` result and does not mask it as a technical error.

A Candidate Stage failure is therefore nonblocking only when Candidate Safety remains independently valid and all degraded-mode gates hold. It is never acceptable to claim Safety from absent semantic evidence.

## 11. Fail-closed Source Integrity

The primary guarantee is request separation. Validators provide defense in depth and reject:

- any `input:optional_message` ref in Base output
- any candidate literal or registered counterfactual sentinel in Base Timeline
- any candidate literal or sentinel in Base Context
- any candidate literal or sentinel in Base Observed Facts
- any candidate literal or sentinel in Base Material Unknowns
- any candidate-derived Decision Fact
- any candidate ref in Base Legacy View
- any Base fact field emitted by PB-01C
- any optional source ref when `optional_message` is null

Enforcement is structural:

1. closed input and output Schemas;
2. exact source-ref enums;
3. typed field-ownership maps;
4. recursive validators over each Base surface and Base Legacy View;
5. candidate literal/sentinel absence checks as defense in depth;
6. null-candidate ref-count validation.

Literal scanning alone cannot prove the absence of paraphrased contamination. The closed PB-01 request is the proof mechanism; literal and sentinel checks detect wiring regressions.

## 12. Counterfactual isolation suite

The suite fixes one synthetic Base Situation and three candidate variants:

- A: `CANDIDATE_SENTINEL_A_R3R2_7F19`
- B: `CANDIDATE_SENTINEL_B_R3R2_4C82`
- null candidate

The same serialized PB-01 request and one shared Base Provider output are reused for all three offline paths. The hard gates are:

- Base request SHA-256 identical across A/B/null
- Base request contains no `optional_message` key
- one shared Base output reused for all variants
- Base Intake byte-identical
- Base Legacy View byte-identical
- A/B sentinels in Base Intake: `0`
- A/B sentinel literals in PB-02 payload: `0`
- A/B sentinel literals in PB-03 payload: `0`
- A/B deltas limited to candidate-owned fields
- null candidate PB-01C calls: `0`
- optional source refs in all Base surfaces: `0`

Three independent live LLM Base outputs are neither required nor asserted byte-identical. Isolation is proven by an invariant PB-01 request and shared Base output.

## 13. Rollout slices and acceptance barriers

Every slice has a literal future path manifest in `architecture-contract-v1.json`. Those manifests are planning boundaries, not authorization. Any path change requires explicit Human re-scope before mutation.

| Slice | Exact future path count | Responsibility | Entry rule |
| --- | ---: | --- | --- |
| R3-R2-A | 10 | Stage topology, Base/Candidate Schemas, typed contracts only | separate Human authorization |
| R3-R2-B | 13 | Application grounding, sibling envelope, allowlist merge, Source Integrity | A Human / ChatGPT accepted |
| R3-R2-C | 23 | inactive successor Prompts/catalog, Pipeline routing, persistence migration, Safety, failure semantics | B Human / ChatGPT accepted |
| R3-R2-D | 10 | offline counterfactual suite and historical six-stage regression | C Human / ChatGPT accepted |
| R3-R2-E | 14 | bounded PB-01/PB-01C Provider diagnostic; post-run mutable scope `8/8` | D Human / ChatGPT accepted plus separate call authorization |

R3-R2-E does not authorize full Runtime E2E. R4 requires E acceptance and a separate exact scope/call budget. C2 is activation-only and requires R4 acceptance.

The immediate next candidate is `M2-P4-I3-R1-C1-R3-R2-A Split Stage Contracts and Schemas`. It is unauthorized.

## 14. Capability state

- Candidate source isolation: `failed_in_current_single_stage_architecture`
- Architecture direction: `split_base_and_candidate_provider_stages`
- R3-R1 context-inference canonicalization retained: `true`
- Provider semantic quality established: `false`
- Candidate ready for isolated E2E: `false`
- R4 authorized: `false`
- Active Runtime changed: `false`
- C2 eligible / authorized: `false / false`
- Provider calls / DB operations: `0 / 0`
- Next candidate authorized: `false`

## 15. Planning validation and acceptance boundary

Required planning checks:

1. exact mutation scope `10/10`;
2. Runtime / Prompt / Schema / Pipeline / Service / DB-migration diff `0`;
3. historical R3 and R3-R1 dedicated artifacts unchanged;
4. existing R3-R1 blocks in rolling documents preserved and a separate R3-R2 block added;
5. Provider calls / DB or Supabase operations / holdout / real-user data `0`;
6. all five new JSON assets parse;
7. required architecture, routing, Safety, persistence, counterfactual, slice, and capability assertions pass;
8. `git diff --check` passes.

Automated planning PASS does not constitute Human / ChatGPT acceptance, does not establish Provider quality, and does not authorize R3-R2-A, R4, Runtime activation, C2, E1, PR, or main integration.
