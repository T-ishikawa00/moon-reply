# M2-P4-I3-R1-C1-R3-R2-A Implementation Acceptance Review

## Status

- Task: `M2-P4-I3-R1-C1-R3-R2-A Split Stage Contracts and Schemas`
- Status: `human_chatgpt_accepted_complete`
- Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`
- Implementation accepted: `true`
- Accepted implementation commit: `2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f`
- Immutable implementation snapshot: `7a4e5d3187e1731d677cc5aa19c23acdeb535ed8..2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f` (`10/10` exact paths; working tree excluded)
- Baseline: `7a4e5d3187e1731d677cc5aa19c23acdeb535ed8`
- Accepted Planning content: `212720bba2ebb805da9ef701d645359a6bd470a7`
- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-a-split-contracts`
- Exact implementation scope: `10/10`
- Acceptance synchronization exact scope: `6/6`
- Human / ChatGPT review: `accepted_complete`

Human / ChatGPT accepts this implementation as the inactive contract layer for the accepted Candidate Source Isolation design: closed Provider Schemas, pure TypeScript contracts, a machine-readable topology contract, and the exact `CandidateEnvelope` boundary. This acceptance does not integrate or activate the split Runtime, and it does not establish Provider quality.

## Schema and contract identity

| Artifact | Version | SHA-256 |
| --- | --- | --- |
| `base-structured-intake-v1.schema.json` | `pipeline-schema-base-v1.0.0` | `43d4ef598ccc1b2bd083d7dd86300c89f1db4805aa11537a182ec69899ce3ae6` |
| Base Decision Facts | `m2-p4-base-decision-facts-v1` | included in Base Schema |
| Base Writing Signals | `m2-p4-base-writing-signals-v1` | included in Base Schema |
| `candidate-analysis-v1.schema.json` | `pipeline-schema-candidate-v1.0.0` | `47b135176f187c9801637838a55aea8f734e425109d2e19da6b6ecb3975db86b` |
| `split-stage-contracts-v1.ts` | `m2-p4-split-stage-contracts-v1` | `7d10f031cfc948a005d98edae872f406dd4b26d0c123404a55aea3caf28c1f61` |
| Stage topology contract | `m2-p4-i3-r1-c1-r3-r2-a-stage-topology-v1` | recorded artifact, not a Provider Schema |

## Base Provider contract

The exact Base root is:

1. `schema_version`
2. `relationship_stage`
3. `user_goal`
4. `timeline`
5. `boundaries`
6. `context`
7. `observed_facts`
8. `user_assumptions`
9. `user_emotions`
10. `material_unknowns`
11. `safety_signals`
12. `untrusted_embedded_instructions_detected`
13. `context_inferences`
14. `decision_facts`
15. `base_writing_signals`

Every Base source ref is restricted to `input:current_situation`, `input:relationship`, or `input:requested_topics`. `input:optional_message`, generic input/followup patterns, Candidate fields, Candidate presence, and `contact_state.proposed_message_present` are structurally absent. Base writing-signal basis values cannot use `optional_message`.

Application canonical ownership remains explicit:

- `base_structured_intake.relationship_stage <- request.relationship`
- `decision_facts.relationship_stage <- request.relationship`
- `decision_facts.selected_requests <- request.requestedTopics`

## Candidate Provider contract

The exact Candidate root is:

1. `candidate_style_profile`
2. `candidate_communicative_intent`
3. `candidate_language_expression`
4. `candidate_safety_signals`

The schema has no output `schema_version`, Base fact surfaces, IDs, source refs, sequence, raw Candidate echo, Provider response metadata, expected values, confidence, or probability. Candidate language/expression is limited to five Candidate-observable fields. Candidate Safety is a closed boolean-plus-code object whose `signal_codes` enum equals the accepted Safety matrix union `29/29`; empty codes are valid.

## CandidateEnvelope states

| State | presence | analysis_status | safety_status | analysis |
| --- | --- | --- | --- | --- |
| absent | `false` | `absent` | `absent` | `null` |
| available | `true` | `available` | `available` | `CandidateAnalysisV1` |
| non-Safety analysis unavailable | `true` | `unavailable` | `available` | `null` |
| Safety unavailable | `true` | `unavailable` | `unavailable` | `null` |

The TypeScript contract contains an exact four-member discriminated union plus type-level rejection checks for the forbidden combinations. Candidate Safety signals remain separate from `CandidateAnalysisV1`.

## Stage topology

- `legacy-six-v1`: `PB-01:1`, `PB-02:2`, `PB-03:3`, `PB-04:4`, `PB-05:5`, `PB-06:6`
- `split-base-candidate-v1`: `PB-01:1`, `PB-01C:2`, `PB-02:3`, `PB-03:4`, `PB-04:5`, `PB-05:6`, `PB-06:7`

`PB-01C` is called only when `trim(optional_message).length > 0`. A null, empty, or blank Candidate makes zero Provider calls. Persistence of its future skipped row remains `planned_in_R3_R2_C_not_implemented`; this slice does not change Stage IDs in `types.ts` or any persistence implementation.

## Automated validation

| Gate | Result |
| --- | --- |
| Dedicated split-contract verifier | PASS |
| Immutable implementation scope / duplicates | `10/10` / `0` |
| Acceptance synchronization scope / duplicates | `6/6` / `0` |
| Four non-sync implementation blobs | `4/4` unchanged from accepted implementation commit |
| JSON parse | `4/4` |
| AJV Draft 2020-12 compile | `2/2` |
| Valid fixtures | `2/2` |
| Invalid fixtures | `18/18` expected-failure PASS |
| Candidate Safety code parity | `29/29` |
| CandidateEnvelope states | `4/4` |
| TypeScript / JSON topology parity | `2/2` |
| Typecheck | PASS |
| Lint | PASS, warnings `0` |
| Production build | PASS |
| Accepted Planning blobs | `5/5` unchanged |
| Existing Runtime / Prompt / Schema / Pipeline / Service / DB protected diff | `0` |
| `git diff --check` | PASS |

## Immutable implementation manifest

The accepted implementation snapshot is the historical commit range `7a4e5d3187e1731d677cc5aa19c23acdeb535ed8..2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f`. It contains exactly these `10/10` paths and excludes the working tree:

1. `lib/assessment/runtime/contracts/base-structured-intake-v1.schema.json`
2. `lib/assessment/runtime/contracts/candidate-analysis-v1.schema.json`
3. `lib/assessment/runtime/contracts/split-stage-contracts-v1.ts`
4. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/stage-topology-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/capabilities-v1.json`
6. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-a-split-contracts.mjs`
7. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_A_REVIEW.md`
8. `docs/CURRENT_FOCUS.md`
9. `docs/WBS.md`
10. `docs/CODEX_HANDOFF.md`

## Exact acceptance-sync manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-a/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_A_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-a-split-contracts.mjs`
4. `docs/CURRENT_FOCUS.md`
5. `docs/WBS.md`
6. `docs/CODEX_HANDOFF.md`

The Base Schema, Candidate Schema, TypeScript contract, and Stage topology JSON remain content-identical to accepted implementation commit `2a5c8ed6ea02a4173c50a4d1e31ad54a857d707f`. The five accepted Planning blobs remain unchanged. This `6/6` synchronization records acceptance without rewriting the immutable `10/10` implementation snapshot.

## Acceptance statement

Human / ChatGPT accepted complete. This acceptance establishes only inactive Split Stage Schema contracts, inactive TypeScript contracts, the machine-readable topology contract, and the exact `CandidateEnvelope` type boundary. It does not establish Application grounding, CandidateEnvelope construction, Runtime Source Integrity, Pipeline integration, Prompt quality, Provider quality, persistence or migration, isolated E2E readiness, or Runtime activation.

## Authority boundary

- Provider calls: `0`
- DB operations: `0`
- Supabase operations: `0`
- Active Runtime changed: `false`
- Main changed: `false`
- Runtime integration or activation: not implemented and unauthorized
- Provider quality: not established
- R3-R2-B: unauthorized
- R4: unauthorized
- C2: unauthorized

The next candidate is `M2-P4-I3-R1-C1-R3-R2-B Grounding, Allowlist Merge, and Source Integrity`; it is not authorized by this acceptance.
