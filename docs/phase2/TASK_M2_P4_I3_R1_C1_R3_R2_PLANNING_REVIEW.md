# M2-P4-I3-R1-C1-R3-R2 Planning Review

## Status

- Task: `M2-P4-I3-R1-C1-R3-R2 Candidate Source Isolation Architecture Planning`
- Package status: `human_chatgpt_accepted_complete`
- Automated planning validation: `PASS`
- Human / ChatGPT acceptance: `PLANNING PACKAGE ACCEPTED COMPLETE`
- Accepted planning content commit: `212720bba2ebb805da9ef701d645359a6bd470a7`
- Immutable planning snapshot: `df03cc2cc374ed059d40c122788e736f75883758..212720bba2ebb805da9ef701d645359a6bd470a7` (`10/10` exact paths; working tree excluded)
- Baseline: `df03cc2cc374ed059d40c122788e736f75883758`
- Planning review correction base: `b4e0300d78d4782a99cb8fdca178722ca9df7dd1`
- Planning review correction: `accepted_complete`
- PB-06 draft authority correction: `accepted_complete`
- PB-06 draft authority correction task: `M2-P4-I3-R1-C1-R3-R2-R2`
- PB-06 draft authority correction title: `PB-06 Candidate Draft Authority Planning Correction`
- PB-06 Decision Policy authority correction: `accepted_complete`
- PB-06 Decision Policy authority correction task: `M2-P4-I3-R1-C1-R3-R2-R3`
- PB-06 Decision Policy authority correction title: `PB-06 Decision Policy Authority Planning Correction`
- Branch: `docs/m2-p4-i3-r1-c1-r3-r2-planning-correction`
- Prior planning review correction scope: `10/10`
- PB-06 draft authority correction scope: `5/5`
- PB-06 Decision Policy authority correction scope: `5/5`
- Acceptance synchronization scope: `5/5`
- Provider calls / DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0 / 0`
- Active Runtime / Prompt / Schema / Pipeline / Service changed: `false / false / false / false / false`
- R4 / C2 authorized: `false / false`

## Acceptance decision

Human / ChatGPT result: `PLANNING PACKAGE ACCEPTED COMPLETE`.

Accepted Planning content commits:

1. `b4e0300d78d4782a99cb8fdca178722ca9df7dd1` — initial architecture plan
2. `9418a4615e29dbd59f6477fde576393f8efcb211` — planning review correction
3. `1485ce4b51331452aa84cc31969320a0286e0228` — PB-06 candidate draft authority correction
4. `212720bba2ebb805da9ef701d645359a6bd470a7` — PB-06 Decision Policy authority correction

The accepted immutable Planning snapshot is the historical commit range `df03cc2cc374ed059d40c122788e736f75883758..212720bba2ebb805da9ef701d645359a6bd470a7`, exact `10/10` paths, with `immutable: true` and `include working tree: false`.

## Review conclusion

The current single PB-01 architecture fails Candidate Source Isolation. R3-03 proves a source-boundary failure: candidate-only `木曜15時` entered an `other_person` incoming Timeline statement. The R3-R1 downstream context-inference canonicalization remains valid for unresolved inference cleanup, but it cannot repair semantics that were already merged across sources inside one Provider response.

The planning package therefore selects separate Provider boundaries:

- `PB-01`: Base Situation Intake
- `PB-01C`: Candidate Message Analysis

The successor disposition is recorded separately. No historical R3 or R3-R1 dedicated artifact is rewritten.

The architecture direction and Planning Package are Human / ChatGPT accepted complete. This exact `10/10` Planning snapshot resolves the five review gaps: independent PB-06 candidate fidelity, typed absent/unavailable routing, removal of arbitrary Production literal rejection, authoritative persisted topology selection, and Application-canonical Base fields.

The final Planning-only correction fixes the PB-06 draft-text authority in an exact existing-path scope of `5/5`. It does not alter the accepted architecture direction, routing topology, or implementation authority.

This Decision Policy authority correction restores Application-owned `decision_policy_result` to the PB-06 exact input in the same exact existing-path scope of `5/5`. It does not alter the prior draft-authority correction, CandidateEnvelope routing, Source Isolation, stage topology, legitimate-overlap gate, or A-through-E manifests.

## Architecture review points

### Base boundary

PB-01 accepts only `current_situation`, `relationship`, and `requested_topics`. Its Schema has no candidate fields. Base source refs use a closed three-value enum; `input:optional_message` is forbidden by Schema and typed Integrity.

Application grounding canonically fixes `base relationship_stage` and `decision_facts.relationship_stage` from `request.relationship`, and `decision_facts.selected_requests` from `request.requestedTopics`. Provider output cannot override them. Candidate presence remains outside Base Decision Facts; `contact_state.proposed_message_present` stays absent from Base Schema and Base Legacy View.

### Candidate boundary

PB-01C is called only for a non-empty trimmed candidate. It receives the raw candidate plus constant `user / unsent_candidate` metadata. Its four output fields are candidate style, intent, language/expression, and Safety signals. It cannot emit Base facts, provenance, IDs, or sequence.

Application code creates the exact `CandidateEnvelope { presence, analysis_status, safety_status, analysis }`. Null/blank maps to `false / absent / absent / null`; valid analysis maps to `true / available / available / CandidateAnalysis`; non-Safety unavailable with valid Safety maps to `true / unavailable / available / null`; Safety unavailable maps to `true / unavailable / unavailable / null` and blocks. Response IDs, usage, latency, Stage IDs, and expected values are forbidden from the envelope. PB-04, PB-05, and PB-06 receive it explicitly.

### Safety

Deterministic Safety still inspects both raw inputs. Candidate semantic Safety reaches PB-02 as a separate nullable key. Application code performs strictest aggregation and cross-channel checks such as explicit no-contact plus candidate contact action. Candidate Safety never enters Base facts.

Candidate Safety includes bounded `untrusted_embedded_instruction_detected`. PB-01C must not follow candidate-embedded instructions; PB-04 and PB-06 treat the raw candidate as inert untrusted data. The signal is Candidate-owned and never becomes a Base Fact.

### Topology and persistence

`PB-01C` is successor sequence 2; PB-02 through PB-06 become successor sequences 3 through 7. Persisted parent-run `stage_topology_version` is authoritative: historical runs are treated/backfilled as `legacy-six-v1`, successor runs use `split-base-candidate-v1`, and existing historical Stage rows are never modified. Readers, repository integrity, and verifiers select from this field; Schema and Prompt bundle versions are consistency checks only. Candidate absence creates zero Provider calls and, in the future implementation, one `skipped` audit row with null response/output and zero usage. R3-R2-C owns the future migration.

### Failure boundary

Base failure is terminal. Candidate analysis is nonblocking only when candidate Safety independently remains valid, aggregate Safety is normal, no candidate semantics are fabricated, and PB-04 uses the conservative minimal-edit fallback. Candidate Safety unavailable is fail-closed before candidate generation.

PB-04 receives `candidate_envelope` and nullable `user_supplied_optional_message`; PB-05 receives `candidate_envelope` with `decision_plan`; PB-06 receives exactly `base_structured_intake`, `candidate_envelope`, nullable `user_supplied_optional_message`, `aggregate_safety_result`, `decision_policy_result`, `decision_plan`, and `report_content`. The original candidate authority is exactly `user_supplied_optional_message`; the final draft-text authority is exactly `decision_plan.recommended_message_draft.text`. `report_content` is limited to report-explanation consistency, `report_content.message_draft_context` consistency, and detection of false statements about how the draft changed. It is not draft-text authority.

For `reply_now` and `send_now`, `recommended_message_draft` must be non-null with `required_now / now`, and PB-06 compares its `.text` against the original candidate. For `wait_and_reassess`, a non-null draft must be `later_only / later` and undergo the same comparison; a null draft is Policy-permitted only with null `message_draft_edit_metadata`, and no false preserved-meaning PASS is allowed. For `pause_additional_contact`, both fields must be null, no workaround or rewritten candidate may appear, text equivalence is not applicable, and boundary/Safety consistency remains blocking.

PB-06 validates dates/days/times/numbers, names/referents, polarity, acceptance/refusal, questions/invitations, commitments, affection, pressure, and boundary/contact-stop meaning. It independently checks PB-04's `decision_plan.message_draft_edit_metadata`, verifies candidate content was not treated as sent/received fact, and confirms that truthful `preserved_meaning` and fallback behavior added no meaning. Material drift remains major/critical and fail-closed.

Application code produces and owns `decision_policy_result`. PB-06 treats it as authoritative and does not recompute Policy from raw prose, Base facts, Candidate analysis, or the selected decision. The result contains no raw optional message, Candidate Provider output, response ID, usage, Stage metadata, fixture ID, or expected value. `CandidateEnvelope` remains a separate sibling input.

PB-06 checks the selected decision against `allowed_decisions` and `disallowed_decisions`; enforces `required_now`, `later_only`, and `not_allowed` draft/null/edit-metadata behavior; preserves pause reason, resume policy, and follow-up exception; aligns current actions with the selected allowed decision; distinguishes future change conditions from the current direction; and rejects material report contradiction of Policy. `DECISION_ALLOWED`, `MESSAGE_POLICY_CONSISTENCY`, `ACTION_CONSISTENCY`, and `SAFETY_REGRESSION` remain independently checkable, and true material major/critical findings remain fail-closed.

Selected requests reach PB-06 through Application-canonical `base_structured_intake.decision_facts.selected_requests`. A duplicate raw `requested_topics` input is unnecessary, and Provider output cannot override `selected_requests`.

## Exact planning artifacts

Existing dedicated Planning paths:

1. `docs/phase2/M2_P4_I3_R1_C1_R3_R2_CANDIDATE_SOURCE_ISOLATION_PLAN.md`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_PLANNING_REVIEW.md`
3. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/payload-routing-matrix-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json`
6. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/safety-failure-matrix-v1.json`
7. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/capabilities-v1.json`

Existing rolling documents, limited to their separate R3-R2 blocks:

8. `docs/CURRENT_FOCUS.md`
9. `docs/WBS.md`
10. `docs/CODEX_HANDOFF.md`

No Runtime or verifier file is in scope.

The prior `10/10` planning review correction manifest remains historical context. The PB-06 draft-authority correction updates only these existing paths:

1. `docs/phase2/M2_P4_I3_R1_C1_R3_R2_CANDIDATE_SOURCE_ISOLATION_PLAN.md`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_PLANNING_REVIEW.md`
3. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/payload-routing-matrix-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/capabilities-v1.json`

All five paths existed at correction start; the draft-authority correction added no path. This Decision Policy authority correction uses the same exact five existing paths and also adds no path.

### Exact acceptance-sync manifest

This final acceptance synchronization updates exactly five existing paths and creates no file:

1. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_PLANNING_REVIEW.md`
3. `docs/CURRENT_FOCUS.md`
4. `docs/WBS.md`
5. `docs/CODEX_HANDOFF.md`

The following five accepted Planning blobs remain byte-identical to accepted planning content commit `212720bba2ebb805da9ef701d645359a6bd470a7`:

1. `docs/phase2/M2_P4_I3_R1_C1_R3_R2_CANDIDATE_SOURCE_ISOLATION_PLAN.md`
2. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json`
3. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/payload-routing-matrix-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/safety-failure-matrix-v1.json`

The acceptance sync changes metadata only. Architecture Plan, Architecture Contract, Payload Routing Matrix, Counterfactual Suite, Safety Failure Matrix, A-through-E manifests, Runtime, Prompt, Schema, Pipeline, Service, DB/migration, and historical R3/R3-R1 artifacts remain unchanged.

## Counterfactual review

The planned offline suite uses candidate A, candidate B, and null against one fixed Base request and one shared Base output. It requires identical Base request hashes and byte-identical Base Intake/Legacy View, zero registered candidate sentinels in Base/PB-02/PB-03, zero null-candidate calls, and candidate deltas only in candidate-owned fields. It also contains `CSI-LEGITIMATE-LITERAL-OVERLAP-NO-FALSE-POSITIVE`: a phrase may occur in both `current_situation` and `optional_message`, and Base output may legitimately contain it from the Base source without Production rejection. Arbitrary candidate-literal scanning is prohibited in Production; registered Sentinel A/B and values proven absent from Base Input are test-only. The suite explicitly does not require three independent live LLM outputs to be byte-identical.

## Rollout and authority

The implementation is divided into sequentially accepted slices:

1. R3-R2-A — Stage topology version, CandidateEnvelope, Schemas, typed contracts
2. R3-R2-B — Base canonicalization, CandidateEnvelope construction, structural Source Integrity
3. R3-R2-C — inactive successor routing/Prompts, PB-06 fidelity, topology migration, Safety, failure semantics
4. R3-R2-D — A/B/null plus legitimate-overlap counterfactual, test-only Sentinels, historical regression
5. R3-R2-E — bounded split-stage Provider diagnostic with Candidate Safety/fidelity evidence
6. R4 — isolated full Runtime E2E
7. C2 — activation only after R4 acceptance

The exact future path manifests for A through E are in `architecture-contract-v1.json`. Every slice requires Human / ChatGPT acceptance before the next. None is authorized by this planning package.

All A-through-E exact path counts and path lists are unchanged. Any required future manifest change is a stop-and-re-scope condition.

## Validation record

The following checks must be completed before commit:

- [x] Acceptance synchronization exact scope `5/5`
- [x] Immutable Planning snapshot exact scope `10/10`
- [x] Five accepted Planning blobs unchanged from `212720bba2ebb805da9ef701d645359a6bd470a7`: `5/5`
- [x] Architecture Contract, Payload Routing Matrix, Counterfactual Suite, Safety Failure Matrix, and Capabilities JSON parse PASS: `5/5`
- [x] A-through-E exact path counts and path lists unchanged
- [x] PB-06 draft-authority correction exact scope `5/5`; prior planning review correction scope remains `10/10`
- [x] PB-06 Decision Policy authority correction exact scope `5/5`
- [x] Runtime diff `0`
- [x] Prompt diff `0`
- [x] Schema diff `0`
- [x] Pipeline diff `0`
- [x] Service diff `0`
- [x] DB / migration diff `0`
- [x] historical R3 dedicated artifacts unchanged
- [x] historical R3-R1 dedicated artifacts unchanged
- [x] existing rolling-document R3 and R3-R1 blocks byte-text-identical after LF normalization
- [x] Provider calls `0`
- [x] DB / Supabase operations `0`
- [x] holdout / real-user data `0`
- [x] corrected JSON parse PASS: `3/3`
- [x] `CandidateEnvelope` fully specified
- [x] PB-06 original-candidate fidelity route specified
- [x] PB-06 exact input contains Application-owned `decision_policy_result`
- [x] PB-06 does not recompute Decision Policy from raw prose, Base facts, Candidate analysis, or selected decision
- [x] `decision_policy_result` contains no raw candidate, Candidate Provider, operational, Stage, fixture, or expected-value contamination
- [x] `DECISION_ALLOWED` remains independently checkable
- [x] `MESSAGE_POLICY_CONSISTENCY` remains independently checkable
- [x] current/future temporal distinction remains preserved
- [x] pause reason, resume policy, follow-up exception, current actions, report wording, and Safety remain Policy-checkable
- [x] selected requests route through Application-canonical `base_structured_intake.decision_facts.selected_requests`; duplicate raw `requested_topics` input absent
- [x] Provider output cannot override Application-owned `selected_requests`
- [x] final draft-text source is exactly `decision_plan.recommended_message_draft.text`
- [x] no contract identifies `report_content` as draft-text authority
- [x] nullable draft behavior is defined for `reply_now`, `send_now`, `wait_and_reassess`, and `pause_additional_contact`
- [x] PB-06 independently checks PB-04 `message_draft_edit_metadata`
- [x] absent/unavailable distinction preserved through PB-06
- [x] arbitrary Production candidate-literal scanning removed
- [x] registered Sentinel scanning restricted to tests
- [x] legitimate-overlap no-false-positive gate specified
- [x] Application-owned Base fields specified
- [x] authoritative `stage_topology_version` specified
- [x] CandidateEnvelope routing, Source Isolation architecture, stage topology, legitimate-overlap gate, and A-through-E manifests unchanged
- [x] required architecture assertions PASS
- [x] `git diff --check` PASS

Automated Planning validation is `PASS`. Human / ChatGPT separately accepts the Planning Package complete. Neither result establishes Provider semantic quality or authorizes implementation.

## Result boundary

Planning acceptance approves only the architecture direction and rollout contract. It does not establish Provider quality, make the candidate ready for isolated E2E, authorize or start R3-R2-A, run R4, activate Runtime, start C2/E1, create a PR, or merge to `main`.

Next candidate: `M2-P4-I3-R1-C1-R3-R2-A Split Stage Contracts and Schemas`.

Next candidate authorized: `false`.

R4: `HOLD`.

C2: `HOLD`.
