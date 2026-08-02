# M2-P4-I3-R1-C1-R3-R2-B Implementation Acceptance Review

## Status

- Task: `M2-P4-I3-R1-C1-R3-R2-B Grounding, Allowlist Merge, and Source Integrity`
- Status: `human_chatgpt_accepted_complete`
- Human / ChatGPT result: `IMPLEMENTATION ACCEPTED COMPLETE`
- Implementation accepted: `true`
- Accepted implementation commit: `ef5c6db66da77deebb9ad0d5498fe69ec584aad8`
- Immutable implementation snapshot: `be78f8930475e42d9a746a6754bc9e2f34c5aad0..ef5c6db66da77deebb9ad0d5498fe69ec584aad8` (`13/13` exact paths; working tree excluded)
- Baseline: `be78f8930475e42d9a746a6754bc9e2f34c5aad0`
- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-b-source-integrity`
- Exact implementation scope: `13/13`
- Acceptance synchronization exact scope: `6/6`
- Human / ChatGPT review: `accepted_complete`

Human / ChatGPT accepts this inactive Application slice for Base request projection and grounding, a Base-only compatibility snapshot, Candidate request projection and allowlist grounding, four Candidate lane constructors, separate Candidate Safety, structural Source Integrity, and the Split Analysis Envelope. It is not connected to Pipeline, Service, Prompt, Catalog, persistence, DB, Supabase, or Active Runtime.

## Helper identity

| Helper | Version | SHA-256 |
| --- | --- | --- |
| `base-structured-intake-grounding-v1.ts` | `m2-p4-base-structured-intake-grounding-v1` | `5c45bc62a439937aa1c9247caffae9966e4e09e8aaf09d31ca6021372dcf20c5` |
| `candidate-analysis-grounding-v1.ts` | `m2-p4-candidate-analysis-grounding-v1` | `4f8fb929b71595ce4eb1df77a9b567e46357060b78eee6f75c2d715c6d12e3f3` |
| `base-structured-intake-legacy-view-v1.ts` | `m2-p4-base-structured-intake-legacy-view-v1` | `65c23925ed62787196028d7523a2d04dcbcbebbc23ea5b543dd2334c02748da4` |
| `split-analysis-envelope-v1.ts` | `m2-p4-split-analysis-envelope-v1` | `cff35b4eec17d94c683cc9bb87e07d97c6ee2f3409a66cfdee805f07c3cfbd9b` |
| `base-source-integrity-v1.ts` | `m2-p4-base-source-integrity-v1` | `9981b71f4ff5437fc2405ab551d83068a6a4bd293323e08b2a9ee41ffe5ca68a` |
| `candidate-source-integrity-v1.ts` | `m2-p4-candidate-source-integrity-v1` | `ac37b4c54e5c44da2549527f6f78724af3c27fd5a405b978db02de802eda3f47` |

## Base lane

`projectBaseProviderInputV1` reads only `currentSituation`, `relationship`, and `requestedTopics`; it emits exact snake-case Provider keys, preserves the current-situation bytes, and clones topics. Candidate A, Candidate B, and null caller variants produce the same serialized request with SHA-256 `e408381856a5936be36b7dae6c376d329fcb3a4f78e24d8d267affd198c8bd2c`.

`groundBaseStructuredIntakeV1` performs this deterministic order:

1. deep-clone raw Base output;
2. assign Application-owned root and Decision Facts relationship values;
3. assign cloned Application-selected requests;
4. remove `relationship_stage` inference and unresolved residue;
5. canonicalize remaining inference refs from existing supporting facts while preserving raw refs when every cited fact is missing;
6. apply accepted `canonicalizeContextInferencesV5`; and
7. recompute `used_context_inference`.

The Base-only Legacy View is a byte-equivalent deep clone. Base Source Integrity independently validates the request, raw output, grounded output, and Legacy View with exact request keys, recursive Candidate-field exclusion, exact Base source-ref allowlisting, uniqueness, and Application canonical-field checks. Legitimate Base/Candidate literal overlap passes because Production validation performs no arbitrary literal scan.

## Candidate lane and split envelope

Candidate request projection requires nonblank trimmed content while preserving the original string and fixed `user / unsent_candidate` metadata. Grounding first validates Candidate Source Integrity and then explicitly reconstructs the three analysis profiles and separate Safety result field by field. It carries no raw Candidate text, source refs, IDs, sequence, or Provider operational metadata.

The four Application-owned lane states are:

| State | Analysis | Safety result |
| --- | --- | --- |
| absent | absent / `null` | `null` |
| available | available / non-null | non-null |
| analysis unavailable, Safety available | unavailable / `null` | non-null |
| Safety unavailable | unavailable / `null` | `null` |

The Split Analysis Envelope has exactly `base_structured_intake`, `base_legacy_view`, `candidate_envelope`, and `candidate_safety_result`. Base and Candidate remain siblings; neither CandidateEnvelope nor Candidate Safety is inserted into Base facts. Every returned mutable value is deep-cloned.

## Automated validation

| Gate | Result |
| --- | --- |
| Dedicated source-integrity verifier | PASS |
| Immutable implementation scope / duplicate paths | `13/13` / `0` |
| Acceptance synchronization scope / duplicate paths | `6/6` / `0` |
| Seven non-sync implementation blobs | `7/7` unchanged from accepted implementation commit |
| Accepted A implementation blobs | `4/4` unchanged |
| Accepted A acceptance state | unchanged at baseline |
| Accepted Planning blobs | `5/5` unchanged |
| Valid fixtures | `15/15` (`8` Base, `7` Candidate) |
| Invalid fixtures | `35/35` expected-failure PASS |
| Mutation tests | `10/10` rejection PASS |
| CandidateEnvelope / Safety cross-state | `4/4` PASS |
| Protected Pipeline / Service / Prompt / Catalog / DB diff | `0` |
| Typecheck | PASS |
| Lint | PASS, warnings `0` |
| Production build | PASS |
| `git diff --check` | PASS |

## Immutable implementation manifest

The accepted implementation snapshot is the historical commit range `be78f8930475e42d9a746a6754bc9e2f34c5aad0..ef5c6db66da77deebb9ad0d5498fe69ec584aad8`. It contains exactly these `13/13` paths and excludes the working tree:

1. `lib/assessment/runtime/base-structured-intake-grounding-v1.ts`
2. `lib/assessment/runtime/candidate-analysis-grounding-v1.ts`
3. `lib/assessment/runtime/base-structured-intake-legacy-view-v1.ts`
4. `lib/assessment/runtime/split-analysis-envelope-v1.ts`
5. `lib/assessment/runtime/base-source-integrity-v1.ts`
6. `lib/assessment/runtime/candidate-source-integrity-v1.ts`
7. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/source-integrity-fixtures-v1.json`
8. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/capabilities-v1.json`
9. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-b-source-integrity.mjs`
10. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_B_REVIEW.md`
11. `docs/CURRENT_FOCUS.md`
12. `docs/WBS.md`
13. `docs/CODEX_HANDOFF.md`

## Exact acceptance-sync manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-b/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_B_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-b-source-integrity.mjs`
4. `docs/CURRENT_FOCUS.md`
5. `docs/WBS.md`
6. `docs/CODEX_HANDOFF.md`

The six runtime helpers and `source-integrity-fixtures-v1.json` remain content-identical to accepted implementation commit `ef5c6db66da77deebb9ad0d5498fe69ec584aad8`. The accepted A implementation blobs `4/4`, accepted A acceptance state, and accepted Planning blobs `5/5` remain unchanged. This `6/6` synchronization records acceptance without rewriting the immutable `13/13` implementation snapshot.

## Acceptance statement

Human / ChatGPT accepted complete. This acceptance establishes inactive Application Base projection and grounding, an inactive Base-only Legacy View, inactive Candidate projection and allowlist grounding, inactive CandidateEnvelope constructors with a separate Candidate Safety sibling lane, inactive Base/Candidate structural Source Integrity, the inactive Split Analysis Envelope, legitimate Base/Candidate literal overlap, and deterministic A/B/null Base-request isolation.

This acceptance does not establish Provider Schema execution order, Pipeline or Prompt integration, Safety aggregation, persistence or migration, DB compatibility, Provider quality, isolated Runtime E2E readiness, or Runtime activation.

## Required R3-R2-C integration prerequisites

These accepted entry requirements constrain a future separately authorized R3-R2-C integration; they do not mutate or authorize it:

1. Validate raw Base output against the accepted Base Schema before Grounding.
2. Validate raw Candidate output against the accepted Candidate Schema before Grounding.
3. Validate raw Base Source Integrity before Grounding.
4. Run Base Grounding.
5. Validate grounded Base Source Integrity with the Base input, Base Provider request, raw Base output, and grounded Base output.
6. Build the Base Legacy View only from that same grounded Base output.
7. Validate the Base Legacy View before downstream routing.
8. Build an available Candidate lane only from `groundCandidateAnalysisV1` output.
9. Validate Candidate Provider input, raw output, analysis, Safety result, Envelope, and Split Envelope.
10. Never construct or route a merged Base/Candidate Structured Intake.

## Authority boundary

- Provider calls: `0`
- DB operations: `0`
- Supabase operations: `0`
- Active Runtime changed: `false`
- Pipeline, Service, Prompt, Catalog, persistence, and migration changed: `false`
- Provider quality: not established
- DB compatibility: not established
- Runtime readiness: not established
- Isolated E2E readiness: not established
- R3-R2-C: unauthorized
- R4: unauthorized
- C2: unauthorized

Human / ChatGPT accepted this implementation complete. The next candidate is `M2-P4-I3-R1-C1-R3-R2-C Pipeline, Persistence, Safety, and Failure Semantics`; it remains unauthorized and was not begun by this acceptance.
