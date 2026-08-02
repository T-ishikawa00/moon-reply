# M2-P4-I3-R1-C1-R3-R2-B Implementation Review

## Status

- Task: `M2-P4-I3-R1-C1-R3-R2-B Grounding, Allowlist Merge, and Source Integrity`
- Status: `implementation_pending_human_chatgpt_review`
- Baseline: `be78f8930475e42d9a746a6754bc9e2f34c5aad0`
- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-b-source-integrity`
- Exact implementation scope: `13/13`
- Human / ChatGPT review: pending

This inactive Application slice implements Base request projection and grounding, a Base-only compatibility snapshot, Candidate request projection and allowlist grounding, four Candidate lane constructors, and structural Source Integrity. It is not connected to Pipeline, Service, Prompt, Catalog, persistence, DB, Supabase, or Active Runtime.

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
| Exact scope / duplicate paths | `13/13` / `0` |
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

Human / ChatGPT review remains pending. This implementation does not authorize or begin `M2-P4-I3-R1-C1-R3-R2-C Pipeline, Persistence, Safety, and Failure Semantics`.
