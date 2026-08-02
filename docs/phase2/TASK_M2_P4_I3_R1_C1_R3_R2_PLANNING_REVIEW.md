# M2-P4-I3-R1-C1-R3-R2 Planning Review

## Status

- Task: `M2-P4-I3-R1-C1-R3-R2 Candidate Source Isolation Architecture Planning`
- Package status: `candidate_source_isolation_architecture_pending_human_chatgpt_review`
- Automated planning validation: `PASS`
- Human / ChatGPT acceptance: pending
- Baseline: `df03cc2cc374ed059d40c122788e736f75883758`
- Branch: `docs/m2-p4-i3-r1-c1-r3-r2-candidate-source-isolation`
- Exact scope: `10/10`
- Provider calls / DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0 / 0`
- Active Runtime / Prompt / Schema / Pipeline / Service changed: `false / false / false / false / false`
- R4 / C2 authorized: `false / false`

## Review conclusion

The current single PB-01 architecture fails Candidate Source Isolation. R3-03 proves a source-boundary failure: candidate-only `木曜15時` entered an `other_person` incoming Timeline statement. The R3-R1 downstream context-inference canonicalization remains valid for unresolved inference cleanup, but it cannot repair semantics that were already merged across sources inside one Provider response.

The planning package therefore selects separate Provider boundaries:

- `PB-01`: Base Situation Intake
- `PB-01C`: Candidate Message Analysis

The successor disposition is recorded separately. No historical R3 or R3-R1 dedicated artifact is rewritten.

## Architecture review points

### Base boundary

PB-01 accepts only `current_situation`, `relationship`, and `requested_topics`. Its Schema has no candidate fields. Base source refs use a closed three-value enum; `input:optional_message` is forbidden by Schema and typed Integrity.

### Candidate boundary

PB-01C is called only for a non-empty trimmed candidate. It receives the raw candidate plus constant `user / unsent_candidate` metadata. Its four output fields are candidate style, intent, language/expression, and Safety signals. It cannot emit Base facts, provenance, IDs, or sequence.

### Safety

Deterministic Safety still inspects both raw inputs. Candidate semantic Safety reaches PB-02 as a separate nullable key. Application code performs strictest aggregation and cross-channel checks such as explicit no-contact plus candidate contact action. Candidate Safety never enters Base facts.

### Topology and persistence

`PB-01C` is successor sequence 2; PB-02 through PB-06 become successor sequences 3 through 7. Historical six-stage runs retain their stored sequences and are selected by parent-run version. Candidate absence creates zero Provider calls and, in the future implementation, one `skipped` audit row with null response/output and zero usage.

### Failure boundary

Base failure is terminal. Candidate analysis is nonblocking only when candidate Safety independently remains valid, aggregate Safety is normal, no candidate semantics are fabricated, and PB-04 uses the conservative minimal-edit fallback. Candidate Safety unavailable is fail-closed before candidate generation.

## Exact planning artifacts

New:

1. `docs/phase2/M2_P4_I3_R1_C1_R3_R2_CANDIDATE_SOURCE_ISOLATION_PLAN.md`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_PLANNING_REVIEW.md`
3. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/architecture-contract-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/payload-routing-matrix-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/counterfactual-suite-v1.json`
6. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/safety-failure-matrix-v1.json`
7. `evals/runtime/m2-p4-i3-r1-c1-r3-r2/capabilities-v1.json`

Updated with a separate successor block:

8. `docs/CURRENT_FOCUS.md`
9. `docs/WBS.md`
10. `docs/CODEX_HANDOFF.md`

No Runtime or verifier file is in scope.

## Counterfactual review

The planned offline suite uses candidate A, candidate B, and null against one fixed Base request and one shared Base output. It requires identical Base request hashes and byte-identical Base Intake/Legacy View, zero candidate sentinels in Base/PB-02/PB-03, zero null-candidate calls, and candidate deltas only in candidate-owned fields. It explicitly does not require three independent live LLM outputs to be byte-identical.

## Rollout and authority

The implementation is divided into sequentially accepted slices:

1. R3-R2-A — Stage topology, Schemas, typed contracts
2. R3-R2-B — grounding, allowlist envelope, Source Integrity
3. R3-R2-C — inactive successor routing, persistence, Safety, failure semantics
4. R3-R2-D — offline counterfactual and historical regression
5. R3-R2-E — bounded split-stage Provider diagnostic
6. R4 — isolated full Runtime E2E
7. C2 — activation only after R4 acceptance

The exact future path manifests for A through E are in `architecture-contract-v1.json`. Every slice requires Human / ChatGPT acceptance before the next. None is authorized by this planning package.

## Validation record

The following checks must be completed before commit:

- [x] exact planning scope `10/10`
- [x] Runtime diff `0`
- [x] Prompt diff `0`
- [x] Schema diff `0`
- [x] Pipeline diff `0`
- [x] Service diff `0`
- [x] DB / migration diff `0`
- [x] historical R3 dedicated artifacts unchanged
- [x] historical R3-R1 dedicated artifacts unchanged
- [x] existing rolling-document R3-R1 blocks byte-text-identical after LF normalization
- [x] Provider calls `0`
- [x] DB / Supabase operations `0`
- [x] holdout / real-user data `0`
- [x] JSON parse PASS: `5/5`
- [x] required architecture assertions PASS
- [x] `git diff --check` PASS

Automated Planning validation is `PASS`. This is protocol evidence only; Human / ChatGPT acceptance remains pending.

## Result boundary

Planning acceptance, if later granted, approves only the architecture direction and rollout contract. It does not establish Provider quality, make the candidate ready for isolated E2E, authorize R3-R2-A, run R4, activate Runtime, start C2/E1, create a PR, or merge to `main`.

Next candidate: `M2-P4-I3-R1-C1-R3-R2-A Split Stage Contracts and Schemas`.

Next candidate authorized: `false`.
