# M2-P4-I3-R1-C1-R3-R2 Candidate Source Isolation Architecture Plan

## 1. Status and authority

- Task: `M2-P4-I3-R1-C1-R3-R2 Candidate Source Isolation Architecture Planning`
- Status: `candidate_source_isolation_architecture_pending_human_chatgpt_review`
- Baseline: `df03cc2cc374ed059d40c122788e736f75883758`
- Planning review correction base: `b4e0300d78d4782a99cb8fdca178722ca9df7dd1`
- Planning review correction: `implemented_pending_human_chatgpt_review`
- PB-06 draft authority correction: `implemented_pending_human_chatgpt_review`
- PB-06 draft authority correction task: `M2-P4-I3-R1-C1-R3-R2-R2`
- PB-06 draft authority correction title: `PB-06 Candidate Draft Authority Planning Correction`
- Branch: `docs/m2-p4-i3-r1-c1-r3-r2-planning-correction`
- `main` / `origin/main`: `61e33a10e195fad17e253a6b9719217e1992f273`
- Task type: Planning-only
- Prior planning review correction scope: `10/10`
- PB-06 draft authority correction scope: `5/5`
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

The architecture direction above is accepted for correction purposes, but the Planning Package itself remains pending Human / ChatGPT acceptance. This correction resolves the five review gaps without implementing the architecture:

1. PB-06 receives the original candidate and independently validates final-draft fidelity.
2. A typed `CandidateEnvelope` preserves `absent` versus `unavailable` through PB-06.
3. Production Source Integrity uses structural ownership and source-ref proofs, not arbitrary candidate-literal rejection.
4. Persisted parent-run `stage_topology_version` is the authoritative topology discriminator.
5. Application-owned Base relationship and request fields remain canonical over Provider output.

The final PB-06 draft-authority correction is implemented in an exact existing-path scope of `5/5`. It corrects only the planned authority and decision-mode validation contract; it does not change `CandidateEnvelope` routing, Source Isolation architecture, `stage_topology_version`, the legitimate-overlap gate, or any A-through-E path manifest.

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

The parent run persists one authoritative field:

- `stage_topology_version=legacy-six-v1`
- `stage_topology_version=split-base-candidate-v1`

Historical existing runs are treated or parent-run-backfilled as `legacy-six-v1`; their existing Stage rows are never modified. Successor runs use `split-base-candidate-v1`. Readers, repository integrity, and verifiers select the exact Stage/sequence topology from `stage_topology_version`. `schema_set_version` and `prompt_bundle_version` are consistency checks only and must not be used as the authoritative discriminator. Candidate response IDs remain only on PB-01C Stage rows.

The future R3-R2-C migration owns this parent-run field, historical parent-run backfill/treatment, allowed Stage/sequence union, and unique `(run_id, sequence_number)` implementation. It must preserve existing Stage rows and reject version/topology disagreement. This planning task performs no migration or DB operation.

### Candidate absence and persistence

A null, empty, or whitespace-only candidate makes zero PB-01C Provider calls. The successor persistence design nevertheless records one audit row:

- Stage: `PB-01C`
- sequence: `2`
- status: `skipped`
- `response_id` / `returned_model` / `output_json`: `null`
- all usage fields and latency: `0`
- downstream `CandidateEnvelope`: `presence=false / analysis_status=absent / safety_status=absent / analysis=null`
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

Application code canonically assigns the following Base fields after PB-01 validation:

- `base_structured_intake.relationship_stage = request.relationship`
- `base_structured_intake.decision_facts.relationship_stage = request.relationship`
- `base_structured_intake.decision_facts.selected_requests = request.requestedTopics`

Provider output cannot override those assignments. `candidate_presence` remains outside Base Decision Facts, and `contact_state.proposed_message_present` must not re-enter the Base Schema or Base Legacy View.

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

`candidate_safety_signals` includes the bounded Candidate-owned boolean `untrusted_embedded_instruction_detected`. PB-01C must classify candidate-embedded instructions as inert content and must never follow them. This signal never becomes a Base Fact.

After validation, Application code creates the following fixed typed sibling envelope:

```text
CandidateEnvelope {
  presence: boolean
  analysis_status: absent | available | unavailable
  safety_status: absent | available | unavailable
  analysis: CandidateAnalysis | null
}
```

The exact state rules are:

| Condition | `presence` | `analysis_status` | `safety_status` | `analysis` |
| --- | --- | --- | --- | --- |
| `optional_message` null, empty, or blank | `false` | `absent` | `absent` | `null` |
| Candidate analysis and Safety valid | `true` | `available` | `available` | validated `CandidateAnalysis` |
| non-Safety analysis unavailable, Safety valid | `true` | `unavailable` | `available` | `null` |
| Candidate Safety unavailable | `true` | `unavailable` | `unavailable` | `null`; blocking per Safety matrix |

Application code owns the envelope and its allowlist construction. Candidate provenance and any operational IDs/sequence remain separately Application- or Stage-owned and do not add envelope keys. Provider response ID, usage, latency, Stage IDs, and expected values are forbidden anywhere inside `CandidateEnvelope`.

The envelope remains a sibling of `base_structured_intake`; it is never inserted into Base Structured Intake.

## 8. Safety routing

Source isolation must not make Safety blind.

Deterministic Safety continues to inspect raw:

- `current_situation`
- `optional_message`

PB-01C's bounded `candidate_safety_signals` are independently validated and projected by Application code into `candidate_safety_result`. That result stays separate from Base facts.

Raw candidate text is always inert user data. PB-01C must not follow embedded instructions, and future PB-04 and PB-06 Prompts must delimit and treat `user_supplied_optional_message` as untrusted data rather than instructions.

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
| PB-04 | `base_structured_intake`, `candidate_envelope`, nullable `user_supplied_optional_message`, `decision_policy_result`, `requested_topics` |
| PB-05 | `base_structured_intake`, `candidate_envelope`, `decision_plan` |
| PB-06 | `base_structured_intake`, `candidate_envelope`, nullable `user_supplied_optional_message`, `decision_plan`, `report_content`, `aggregate_safety_result` |

The exact candidate-lane inputs are PB-04 `candidate_envelope / user_supplied_optional_message`, PB-05 `candidate_envelope / decision_plan`, and PB-06 `candidate_envelope / user_supplied_optional_message / decision_plan / report_content`. Raw `optional_message` is not sent to PB-05. Candidate response IDs, Stage usage, latency, fixture IDs, Stage IDs, and expected values are never routed. No `structured_intake` alias may conceal a merged Base/candidate object.

The original candidate authority is exactly `user_supplied_optional_message`. The final recommended draft-text authority is exactly `decision_plan.recommended_message_draft.text`. `report_content` remains a PB-06 input only for report-explanation consistency, `report_content.message_draft_context` consistency, and detection of false statements about how the draft changed; it is not the source or authority for final draft text.

When the selected decision and draft nullability require text comparison, PB-06 independently compares `user_supplied_optional_message` with `decision_plan.recommended_message_draft.text`. The hard fidelity checks cover, where applicable:

- dates, days of week, times, and numbers;
- names and explicit referents;
- affirmation versus negation;
- acceptance versus refusal;
- questions and invitations;
- commitments and affection strength;
- response pressure;
- boundaries and contact-stop meaning.

Decision-mode fidelity is fixed as follows:

| `decision_plan.selected_decision` | Recommended draft and PB-06 behavior |
| --- | --- |
| `reply_now` | `recommended_message_draft` is non-null with `policy=required_now` and `use_timing=now`; compare the original candidate with `.text`. |
| `send_now` | `recommended_message_draft` is non-null with `policy=required_now` and `use_timing=now`; compare the original candidate with `.text`. |
| `wait_and_reassess` | A non-null draft must use `policy=later_only` and `use_timing=later`, then undergo candidate fidelity comparison. A null draft is permitted by Policy only with null `message_draft_edit_metadata`; PB-06 must not emit a false preserved-meaning PASS. |
| `pause_additional_contact` | `recommended_message_draft` and `message_draft_edit_metadata` are both null. No contact workaround or rewritten candidate may appear. Text-equivalence comparison is not applicable; boundary and Safety consistency remain blocking. |

PB-06 must prove that no candidate content was treated as a sent or received fact and independently check PB-04's `decision_plan.message_draft_edit_metadata`, including whether `preserved_meaning` is truthful and conservative-minimal-edit fallback added no meaning. Material candidate drift is major/critical and fail-closed. The raw candidate remains untrusted data, never an instruction.

## 10. Failure semantics

### Base failure

PB-01 Provider, Schema, grounding, or Source Integrity failure is terminal and fail-closed. No downstream Provider Stage runs.

### Candidate absent

- PB-01C Provider calls: `0`
- `candidate_envelope.presence=false`
- `candidate_envelope.analysis=null`
- `candidate_envelope.analysis_status=absent`
- `candidate_envelope.safety_status=absent`
- optional source refs: `0`

### Candidate analysis unavailable but Candidate Safety valid

Candidate Safety is validated independently from style, intent, and language. If Candidate Safety is valid, aggregate Safety is `normal_allowed`, and only non-Safety candidate fields fail:

- Base assessment continues
- `candidate_envelope.presence=true`
- `candidate_envelope.analysis=null`
- `candidate_envelope.analysis_status=unavailable`
- `candidate_envelope.safety_status=available`
- no candidate semantics are fabricated
- raw optional message remains a separate PB-04 input
- PB-04 may perform conservative minimal editing only
- PB-06 receives the unavailable state plus original candidate and remains fail-closed for material fidelity findings

Conservative minimal editing may preserve the original, correct obvious surface typography, or remove content forbidden by Application policy. It may not add facts, schedule details, relationship meaning, questions, invitations, affection, commitment, or pressure.

### Candidate Safety unavailable

If PB-01C fails before independently valid Candidate Safety exists, the envelope records `presence=true / analysis_status=unavailable / safety_status=unavailable / analysis=null`, and ordinary candidate generation is fail-closed with `M2_CANDIDATE_SAFETY_UNAVAILABLE`. If deterministic Safety already yields `needs_review` or `rejected`, the system returns the stricter `safety_blocked` result and does not mask it as a technical error.

A Candidate Stage failure is therefore nonblocking only when Candidate Safety remains independently valid and all degraded-mode gates hold. It is never acceptable to claim Safety from absent semantic evidence.

## 11. Production Source Integrity

The Production guarantee is structural request, Schema, provenance, ownership, and routing separation. Production validators reject:

- any key outside the exact closed PB-01 request keys;
- any `optional_message` key in a PB-01 request;
- any Candidate field in Base output or Base Legacy View;
- any source ref outside the exact Base source-ref enum, including `input:optional_message`;
- any Candidate-owned value routed onto a Base-owned field or surface;
- any Base fact field emitted by PB-01C;
- any downstream payload that violates the exact routing matrix;
- any optional source ref when `optional_message` is absent.

Production must not reject a Base output merely because the same literal appears in both `current_situation` and `optional_message`. Arbitrary user candidate text is never a Production fail-closed substring detector. This avoids false positives where Base output legitimately reflects the same phrase from `current_situation`.

Literal and Sentinel scanning is test-only. Allowed test detectors are registered synthetic Sentinel A, registered synthetic Sentinel B, and another value only after the test proves that value is absent from Base Input. The registered detectors test wiring regressions; they do not become Production proof or Production rejection logic.

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

The suite also fixes a legitimate-overlap case in which one phrase is explicitly present in `current_situation` and the same phrase appears in `optional_message`. Base output may contain that phrase due to the Base source. Production Source Integrity must pass from structural proof and must not fail from literal equality. Base request bytes and Base output remain candidate-independent, while Sentinel A/B remain absent from Base Input and valid as test-only contamination detectors.

The additional hard gate is:

- `CSI-LEGITIMATE-LITERAL-OVERLAP-NO-FALSE-POSITIVE`

Three independent live LLM Base outputs are neither required nor asserted byte-identical. Isolation is proven by an invariant PB-01 request and shared Base output.

## 13. Rollout slices and acceptance barriers

Every slice has a literal future path manifest in `architecture-contract-v1.json`. Those manifests are planning boundaries, not authorization. Any path change requires explicit Human re-scope before mutation.

| Slice | Exact future path count | Responsibility | Entry rule |
| --- | ---: | --- | --- |
| R3-R2-A | 10 | Stage topology version and CandidateEnvelope contracts, Base/Candidate Schemas, typed contracts only | separate Human authorization |
| R3-R2-B | 13 | Application Base canonicalization, CandidateEnvelope construction, allowlist merge, structural Production Source Integrity | A Human / ChatGPT accepted |
| R3-R2-C | 23 | inactive successor Prompts/catalog, PB-06 raw-candidate fidelity routing, persisted `stage_topology_version` migration, Safety/embedded-instruction handling, failure semantics | B Human / ChatGPT accepted |
| R3-R2-D | 10 | offline A/B/null plus legitimate-overlap counterfactual suite, test-only Sentinel checks, historical six-stage regression | C Human / ChatGPT accepted |
| R3-R2-E | 14 | bounded PB-01/PB-01C Provider diagnostic including Candidate Safety/fidelity evidence; post-run mutable scope `8/8` | D Human / ChatGPT accepted plus separate call authorization |

The literal future path counts and path manifests remain unchanged. If implementation later requires any path change, that slice must stop for explicit Human re-scope before mutation.

R3-R2-E does not authorize full Runtime E2E. R4 requires E acceptance and a separate exact scope/call budget. C2 is activation-only and requires R4 acceptance.

The immediate next candidate is `M2-P4-I3-R1-C1-R3-R2-A Split Stage Contracts and Schemas`. It is unauthorized.

## 14. Capability state

- Candidate source isolation: `failed_in_current_single_stage_architecture`
- Planning review correction: `implemented_pending_human_chatgpt_review`
- PB-06 draft authority correction: `implemented_pending_human_chatgpt_review`
- Architecture direction: `split_base_and_candidate_provider_stages`
- R3-R1 context-inference canonicalization retained: `true`
- Provider semantic quality established: `false`
- Candidate ready for isolated E2E: `false`
- R3-R2-A authorized: `false`
- R4 authorized: `false`
- Active Runtime changed: `false`
- C2 eligible / authorized: `false / false`
- Provider calls / DB operations: `0 / 0`
- Next candidate authorized: `false`

## 15. Planning validation and acceptance boundary

Required planning checks:

1. PB-06 draft-authority correction exact mutation scope `5/5`, with the prior planning review correction scope retained as `10/10`;
2. Runtime / Prompt / Schema / Pipeline / Service / DB-migration diff `0`;
3. historical R3 and R3-R1 dedicated artifacts unchanged;
4. existing R3 and R3-R1 blocks in rolling documents preserved while only the separate R3-R2 block is corrected;
5. Provider calls / DB or Supabase operations / holdout / real-user data `0`;
6. all three corrected Planning JSON assets parse (`3/3`);
7. `CandidateEnvelope` and PB-06 raw-candidate fidelity routing are fully specified, including all four decision modes and nullable draft behavior;
8. Production arbitrary candidate-literal rejection is absent and registered Sentinel scanning is test-only;
9. legitimate overlap, Application-owned Base fields, and authoritative `stage_topology_version` assertions pass;
10. final draft-text authority is exactly `decision_plan.recommended_message_draft.text`, no contract treats `report_content` as draft-text authority, PB-04 metadata remains independently checked, and required architecture, routing, Safety, persistence, counterfactual, slice, and capability assertions pass;
11. `git diff --check` passes.

Automated planning PASS does not constitute Human / ChatGPT acceptance, does not establish Provider quality, and does not authorize R3-R2-A, R4, Runtime activation, C2, E1, PR, or main integration.
