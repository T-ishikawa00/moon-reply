# M2-P4-I3-R1-C1 Review

## Status

- Task: `M2-P4-I3-R1-C1 PB-01 v4 Bounded Provider Diagnostic`
- Status: `human_chatgpt_reviewed_fail_complete`
- Human authorization: `M2-P4-I3-R1-C1-2026-08-01`
- Confirmation phrase: `R1-C1-12-CALL-SYNTHETIC-ONLY`
- Baseline: `76c469db264cd1cb9434b6a19ec5c75db5754a2a`
- Branch: `test/m2-p4-i3-r1-c1-provider-diagnostic`
- Exact cumulative mutation scope: `21/21`
- Synthetic cases: `8`
- PB-01 v4 calls: `8`
- PB-01 v3 comparison calls: `4`
- Total Provider call maximum: `12`
- Model: `gpt-5.6-luna`
- Retry / repair / fallback: `0 / 0 / 0`
- DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0`
- Active Runtime changed: `false`
- Package commit (Commit A): `0c228406298fbb829cbb216e31c00e6812cc1393`
- Result commit (Commit B): `7b0c1b6da5d877f7a7a6de5be431276452e3b8b2`
- Calls attempted / completed: `12 / 12`
- Execution protocol accepted: `true`
- Product gate passed: `false`
- C1 verdict: `FAIL`
- C2 eligible for review: `false`
- C2 authorized: `false`

The Human authorization covers one bounded PB-01-only Provider diagnostic after Commit A is pushed. It does not authorize Service activation, C2, PB-02 through PB-06, a full Pipeline run, DB or Supabase access, holdout use, real-user input, retry, repair, fallback, PR, merge, force push, or a release.

## Two-commit evidence model

Commit A prepares the diagnostic package with `not_executed` artifacts and is pushed normally. Only after HEAD equals upstream, the tree and stash are clean, main is unchanged, the model and confirmation phrase match, and the local one-time marker is unused may the runner create that marker and make the first Provider call.

Commit B records the immutable result, deterministic evaluation, summary, capability status, review evidence, and actual documentation. A failed Provider, Schema, grounding, Integrity, or assertion result is recorded without rerunning that call. C2 remains unauthorized regardless of the result.

## Evaluation boundary

- Exact full output is not used as an oracle.
- Case IDs are never sent to PB-01 and have no Runtime lookup authority.
- Expected evidence uses hard assertions, soft acceptable-value sets, forbidden assertions, source ownership, Decision Facts subsets, and writing-context subsets.
- Raw consultation prose and Provider response envelopes are not persisted.
- Recomputable SHA-256 values cover bounded typed projections only: embedded-instruction detection, Decision Facts, and writing context where applicable.
- The existing PB-01 v3/v4 Prompt, Schema, grounding, Integrity, legacy view, catalogs, Pipeline, Application, Service, Policy, UI, and accepted R1-A/R1-B evidence remain immutable.

## Human / ChatGPT review

- [x] C1 bounded execution protocol accepted complete.
- [x] Commit A package and execution preflight evidence accepted.
- [x] All 12 authorized call records and immutable result evidence reviewed.
- [x] C1 product-quality verdict `FAIL` confirmed.
- [x] Secret leakage remains zero and the diagnostic boundaries remained intact.
- [x] Active Runtime remains catalog v4; C2 eligibility and authorization remain false.

## Accepted execution snapshot

- Type: `historical_commit_range`
- Base commit: `76c469db264cd1cb9434b6a19ec5c75db5754a2a`
- End commit: `7b0c1b6da5d877f7a7a6de5be431276452e3b8b2`
- Exact paths: `21/21`
- Immutable snapshot: `true`
- Include working tree: `false`
- Execution commits: `0c228406298fbb829cbb216e31c00e6812cc1393`, `7b0c1b6da5d877f7a7a6de5be431276452e3b8b2`

## Result

The one-time diagnostic ran from `2026-08-01T10:12:21.219Z` through `2026-08-01T10:14:33.391Z` after Commit A was normally pushed and the exact branch, HEAD/upstream equality, clean tree, empty stash, unchanged main, model, confirmation phrase, not-executed result, and unused-marker preflight passed. The marker is consumed and no rerun is authorized.

- Calls: `12/12` attempted and completed; PB-01 v3 `4`, PB-01 v4 `8`; retry / repair / fallback `0 / 0 / 0`.
- Case verdicts: `0/8` passed.
- Provider transport calls: `12/12` completed.
- Raw Schema validation: `12/12` passed.
- Grounded Schema validation: `12/12` passed.
- v4 Writing Context Integrity: `0/8`.
- v3 contextual Integrity: `3/4`.
- Legacy v3 view from v4: `0/8`.
- Paired critical Decision Facts parity: `0/4`; PAIR-03 mismatched `/boundary_state/kind` and `/boundary_state/status`, and PAIR-04 mismatched `/contact_state/usual_cadence_relation`.
- Hard assertions: `3/3`; forbidden assertions: `1/1`; soft assertions: `0/0`. Current style evidence is unavailable; an empty denominator is not positive evidence.
- Hard fail codes: `PROVIDER_SCHEMA_VIABILITY_FAILED`, `DECISION_FACTS_REGRESSION` (`2`).
- Integrity exceptions: every v4 call returned `M2_WRITING_CONTEXT_INVALID`; PAIR-02 v3 returned `M2_CONTEXTUAL_INFERENCE_INVALID`.
- Usage: input `67048`, cached `55413`, output `21727`, reasoning `1766` tokens.
- Secret leakage scan: `0`; DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0`.
- Active Runtime changed: `false`; C1 verdict: `FAIL`; C2 eligible for review: `false`; C2 authorized: `false`.

The completed-package verifier passes artifact integrity, evaluator recomputation, call-boundary enforcement, historical compatibility, and protected-diff checks. It does not convert the C1 quality verdict to PASS. Human / ChatGPT review of the bounded execution is complete; final I3 acceptance remains pending.

## Review conclusions

1. Provider/Schema transport itself succeeded.
2. The current `provider_schema_viability` metric conflates Schema success with later Integrity status.
3. Assertions are skipped for non-completed Integrity cases, so `0/0` metrics are unavailable evidence rather than PASS evidence.
4. Several failures are provenance, unresolved-state, or application-grounding mismatches.
5. PAIR-03 contains a material Decision Facts regression: the user-owned `no_private_contact_at_work` constraint was misclassified as an other-person temporary-distance boundary.
6. PAIR-04's cadence difference is likely nonmaterial under the explicit no-contact boundary and requires conditional evaluation.
7. The v3 PAIR-02 failure proves that live v3 output is not a perfect oracle.
8. No paid rerun occurs before a separately authorized offline root-cause correction.

The next candidate is `M2-P4-I3-R1-C1-R1 Offline Diagnostic Postmortem and Grounding Responsibility Revision`. It is not authorized. C2 remains ineligible and unauthorized; no Provider re-execution, Runtime activation, Prompt/Grounding/Evaluator correction, E1, PR, force push, or main merge is authorized by this review sync.
