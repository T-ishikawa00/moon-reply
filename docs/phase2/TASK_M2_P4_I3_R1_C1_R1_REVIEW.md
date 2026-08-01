# M2-P4-I3-R1-C1-R1 Review

## Status

- Task: `M2-P4-I3-R1-C1-R1 Offline Diagnostic Postmortem and Grounding Responsibility Revision`
- Status: `human_chatgpt_accepted_complete`
- Accepted implementation commit: `d8415e2ae165143d646c6f9573e24752d8b1a1c7`
- Implementation commits: `715fd906ad94ecc18b55dd13b16784c26bf12129`, `28bedad969d1007bbd731f0e9d47824eecd84651`, `d8415e2ae165143d646c6f9573e24752d8b1a1c7`
- Immutable implementation snapshot: `bdc98af2c7c59a1d7ececa2077906c8fbb839ac9..d8415e2ae165143d646c6f9573e24752d8b1a1c7` (`31/31` exact paths; working tree excluded)
- Final review correction: `28bedad969d1007bbd731f0e9d47824eecd84651..d8415e2ae165143d646c6f9573e24752d8b1a1c7` (`9/9` exact paths)
- Baseline: `bdc98af2c7c59a1d7ececa2077906c8fbb839ac9`
- Uncontaminated replay correction baseline: `715fd906ad94ecc18b55dd13b16784c26bf12129`
- Replay adjudication / absent-boundary correction baseline: `28bedad969d1007bbd731f0e9d47824eecd84651`
- Branch: `feat/m2-p4-i3-r1-c1-r1-grounding-responsibility`
- Exact current correction scope: `9/9`
- Cumulative implementation scope: `31/31`
- Source diagnostic: `human_chatgpt_reviewed_fail_complete`
- New Provider calls: `0`
- DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0`
- Active Runtime changed: `false`
- Application architecture accepted: `true`
- Application offline implementation accepted: `true`
- Provider quality accepted: `false`
- C2 eligible: `false`
- C2 authorized: `false`
- Final I3 acceptance: `pending`
- Milestone 2: `incomplete`
- `main`: unchanged at `61e33a10e195fad17e253a6b9719217e1992f273`

This offline successor Application architecture and implementation are Human / ChatGPT accepted complete. Strict source replay remains honestly `FAIL / 5/8`; Application-adjudicated Decision Facts and Application canonical fixtures are separately `8/8`. Neither verifier PASS nor Application unit evidence establishes Provider-quality acceptance. This acceptance does not authorize a Provider diagnostic, R1-C1-R2, C2 Runtime activation, E1, a Service switch, PR, merge, force push, release, or deployment.

## Postmortem conclusion

C1 proved that Provider transport and both raw and grounded Schema validation could succeed while the v4 writing-context contract still failed Integrity `0/8`. The defect was architectural: PB-01 was required to construct Application-owned bookkeeping such as source references, evidence state, identifiers, sequence, ownership, nullability, and unresolved-state closure. That allocation made structurally valid Provider output fragile and obscured which layer owned correction.

The saved evidence also exposed two decision-material distinctions. PAIR-03 incorrectly promoted a user-owned constraint into an other-person `temporary_distance` boundary; PAIR-04 carried an explicit other-person `no_contact` boundary that had to remain restrictive while cadence became `not_applicable`. The correction therefore separates semantic classification from canonical grounding and adds a negative evidence guard. It does not derive a Decision from Writing Context.

V4-08 separately exposed an absent-boundary canonicalization gap. When typed boundary state is `unknown / unknown` and there is no owned restrictive signal, typed top-level restrictive boundary, or typed block/restriction evidence, the Application now normalizes the observed absence to `none / none`. This does not infer that Safety is absent, parse raw prose, create a boundary from user preference, or remove supported `no_contact`, `relationship_closed`, or block/restriction facts.

## Corrected responsibility boundary

1. Provider raw output is Structured Intake v5 (`pipeline-schema-v5.0.0`). It preserves the v3 intake and Decision Facts responsibilities and adds semantic-only `writing_signals`; it does not emit `writing_context` or canonical bookkeeping.
2. Application grounding converts those signals into Structured Intake v4 (`pipeline-schema-v4.0.0`) with `WritingContextV1`, canonical provenance, IDs, ownership, nullability, unresolved state, and a restrictive Decision Facts evidence guard.
3. PB-02 through PB-06 receive only the Structured Intake v3 legacy view (`pipeline-schema-v3.0.0`), with neither `writing_signals` nor `writing_context`.

Candidate catalog v6 uses `runtime-stage-catalog-v6.0.0`, prompt bundle `prompt-bundle-runtime-v6.0.0`, and candidate Runtime schema set `pipeline-schema-runtime-v3.2.0`. It is inactive. Active Service remains on catalog v4, prompt bundle v4, and schema set v3.

## Immutable, uncontaminated replay evidence

The replay reads only the saved C1 evidence at baseline `bdc98af2c7c59a1d7ececa2077906c8fbb839ac9`. The four evidence blobs, diagnostic marker, C1 runner, and evaluator v1 remain unchanged. This correction changes only Decision Facts evidence guard v4 within Production code. Production Prompt v5, Structured Intake v5 Schema, Writing Signals, grounding v5, writing-signals grounding, Integrity v2, Pipeline, schema catalog, catalog v6, Provider runner, Service, Policy, UI, and Supabase remain unchanged.

Input construction authority is limited to the saved C1 raw typed projection, synthetic `AssessmentInput`, deterministic schema-version conversion, and Application-owned request fields. `expected_decision_fact_subset`, `expected_writing_context_subset`, `expected_source_ownership`, hard/soft/forbidden assertions, and acceptable value sets are evaluation-only. They cannot alter raw v5 input. Extracted `message_signals` come only from saved `writing_context.message_ownership`, excluding `unsent_candidate`.

- Input construction audit: `8/8`
- Expected/assertion data injected into replay input: `0`
- Strict source replay verdict / passing cases: `FAIL / 5/8`
- Application-adjudicated Decision Facts: `PASS / 8/8`
- Provider transport evidence: `8/8`
- Raw Schema v5: `8/8`
- Grounded Schema v4: `8/8`
- Writing Context Integrity v2: `8/8`
- Critical expected Decision Facts subset: `5/8`
- Semantic assertions: `41/42`
- Candidate presence: `8/8`
- Message ownership: `7/8`
- Constraint provenance: `8/8`
- Privacy / repeat / injection preservation: `8/8`
- PAIR-03 boundary: pre-guard `temporary_distance / explicit`; post-guard `none / none`
- PAIR-04 boundary: pre-guard and post-guard both `no_contact / explicit`
- V4-08 boundary: strict source `unknown / unknown`; Application post-guard `none / none`
- Provider semantic coverage: `7/8 available`; V4-08 ownership evidence `unavailable_from_source_diagnostic`
- Provider retest required: `true`
- Auxiliary v3 parity: `4/4`; auxiliary evidence only, not an oracle or gating source
- Empty soft-assertion denominators: `rate=null`, `evidence_status=unavailable`

Strict source failures are preserved and separately adjudicated rather than overwritten:

- `PAIR-02`: actual `not_applicable` remains unchanged; expected `replied` is recorded as `expectation_contract_defect` because sender is `user`.
- `V4-06`: actual `question` remains unchanged; expected `schedule_coordination` is `nonmaterial_taxonomy_equivalence` because the practical reason is active schedule coordination, the incoming profile supports both taxonomies, and Decision Policy is identical.
- `V4-08`: strict source remains `unknown / unknown`; Application post-guard is `none / none`. Ownership is not passed or attributed to an Application failure because the source diagnostic contains no provider semantic signal; Provider retest remains required.

## Separate Application unit evidence

The dedicated verifier supplies a semantic-only V4-08-equivalent v5 fixture with one incoming other-person message, no candidate, injection detection, privacy markers, repeated-consultation state, no boundary ownership signal, and raw `unknown / unknown` boundary. It passes eight bounded Application checks: canonical `MSG001` ownership and incoming reference, candidate nullability, absent-boundary normalization, privacy preservation, repeat preservation, Integrity v2, raw PII absence, and expected-data separation. Result: `8/8`.

This fixture is Application unit evidence only. It is not a C1 Provider replay success and does not establish PB-01 v5 Provider quality.

## Offline Pipeline evidence

- Fake Pipeline: `3/3` (candidate reply, wait without candidate, explicit no-contact)
- PB-01 raw output contains `writing_signals` and validates as v5.
- Grounded PB-01 output contains `writing_context`, contains no `writing_signals`, and validates as v4.
- PB-02 through PB-06 inputs are v3 and leak neither `writing_signals` nor `writing_context`.
- Decision, Report, and Decision Card output contracts remain valid.
- Network calls: `0`; only Fake repository operations are used.

## Automated verification

The required sequential validation set passes while preserving the replay `FAIL`:

- Dedicated R1-C1-R1 verifier: `PASS`
- Intentional oracle-contamination mutations rejected: `4/4`
- V4-08 absent-boundary mutation rejected: `1/1`
- Historical verifier compatibility: `9/9`
- Canonical Suite: `64/64`
- Decision Policy: `40/40`
- Typecheck / lint / production build: `PASS`
- JSON parse / correction scope `9/9` / cumulative scope `31/31` / C1 blob immutability / protected diff `0` / `git diff --check`: `PASS`
- OpenAI / DB / Supabase / holdout operations: `0 / 0 / 0 / 0`
- Acceptance synchronization exact scope `8/8`; immutable implementation snapshot `31/31`; final review correction `9/9`: `PASS`

Verifier PASS, replay FAIL, Human / ChatGPT review, and acceptance are recorded separately.

## Exact acceptance-sync manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r1/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R1_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs`
4. `scripts/verify-m2-eval-foundation.mjs`
5. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
6. `docs/CURRENT_FOCUS.md`
7. `docs/WBS.md`
8. `docs/CODEX_HANDOFF.md`

This exact `8/8` synchronization does not extend or rewrite the immutable `31/31` implementation snapshot or the historical `9/9` final review correction. Production implementation files remain content-fixed to accepted implementation commit `d8415e2ae165143d646c6f9573e24752d8b1a1c7`.

## Human / ChatGPT review

- [x] Confirm the Provider contract is semantic-only and contains zero forbidden bookkeeping keys.
- [x] Confirm Application grounding owns provenance, identifiers, ownership, nullability, and unresolved-state closure.
- [x] Confirm the negative evidence guard removes unsupported restrictive facts without creating a Decision.
- [x] Confirm expected/assertion data cannot influence input construction and all four mutation regressions fail.
- [x] Confirm PAIR-03 has the direct `temporary_distance / explicit` -> `none / none` evidence and PAIR-04 remains `no_contact / explicit` before and after the guard.
- [x] Confirm V4-08 strict source remains `unknown / unknown`, Application post-guard is `none / none`, and supported restrictive boundaries remain fail-closed.
- [x] Confirm PAIR-02 is an expectation-contract defect, V4-06 is a policy-equivalent taxonomy difference, and neither Production value was changed to fit expected data.
- [x] Confirm V4-08 ownership evidence is unavailable from the source diagnostic, is not attributed to Application, and requires Provider retest.
- [x] Confirm the semantic-only fixture is Application unit evidence rather than Provider replay evidence.
- [x] Confirm downstream PB-02 through PB-06 see only the v3 legacy view.
- [x] Confirm catalog v6 is inactive and active Service remains unchanged.
- [x] Accept the Application architecture and offline implementation while preserving Provider quality as not accepted.

M2-P4-I3-R1-C1-R1 is Human / ChatGPT accepted complete at implementation commit `d8415e2ae165143d646c6f9573e24752d8b1a1c7`. The Provider semantic-only architecture, Application-owned canonical bookkeeping, Application Decision Facts evidence guard, Writing Context Integrity v2, downstream v3 isolation, Fake Pipeline `3/3`, Application canonical fixtures `8/8`, and Application-adjudicated Decision Facts `8/8` are accepted. Strict source replay remains `FAIL / 5/8`, strict ownership and Provider semantic coverage remain `7/8`, V4-08 Provider ownership remains unavailable, and Provider retest remains required.

## Next candidate boundary

Provider retest is required before any Provider-quality claim, but `M2-P4-I3-R1-C1-R2 PB-01 v5 Bounded Provider Diagnostic` remains unauthorized. C2 Runtime activation, E1, final I3 acceptance, PR, merge to `main`, release, and Milestone 2 completion remain unauthorized, pending, or incomplete as stated.
