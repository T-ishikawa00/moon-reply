# M2-P4-I3-R1-C1-R1 Review

## Status

- Task: `M2-P4-I3-R1-C1-R1 Offline Diagnostic Postmortem and Grounding Responsibility Revision`
- Status: `implementation_pending_human_chatgpt_review`
- Baseline: `bdc98af2c7c59a1d7ececa2077906c8fbb839ac9`
- Uncontaminated replay correction baseline: `715fd906ad94ecc18b55dd13b16784c26bf12129`
- Branch: `feat/m2-p4-i3-r1-c1-r1-grounding-responsibility`
- Exact correction scope: `8/8`
- Cumulative implementation scope: `31/31`
- Source diagnostic: `human_chatgpt_reviewed_fail_complete`
- New Provider calls: `0`
- DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0`
- Active Runtime changed: `false`
- C2 authorized: `false`
- Final I3 acceptance: `pending`
- Milestone 2: `incomplete`
- `main`: unchanged at `61e33a10e195fad17e253a6b9719217e1992f273`

This offline successor implementation has completed the uncontaminated replay correction and is awaiting Human / ChatGPT review. The correction verifier passes, but the replay verdict is honestly `FAIL` at `5/8`; neither result is acceptance. No Production implementation was changed to fit expected data. This correction does not authorize another Provider diagnostic, R1-C1-R2, C2 Runtime activation, E1, a Service switch, PR, merge, force push, release, or deployment.

## Postmortem conclusion

C1 proved that Provider transport and both raw and grounded Schema validation could succeed while the v4 writing-context contract still failed Integrity `0/8`. The defect was architectural: PB-01 was required to construct Application-owned bookkeeping such as source references, evidence state, identifiers, sequence, ownership, nullability, and unresolved-state closure. That allocation made structurally valid Provider output fragile and obscured which layer owned correction.

The saved evidence also exposed two decision-material distinctions. PAIR-03 incorrectly promoted a user-owned constraint into an other-person `temporary_distance` boundary; PAIR-04 carried an explicit other-person `no_contact` boundary that had to remain restrictive while cadence became `not_applicable`. The correction therefore separates semantic classification from canonical grounding and adds a negative evidence guard. It does not derive a Decision from Writing Context.

## Corrected responsibility boundary

1. Provider raw output is Structured Intake v5 (`pipeline-schema-v5.0.0`). It preserves the v3 intake and Decision Facts responsibilities and adds semantic-only `writing_signals`; it does not emit `writing_context` or canonical bookkeeping.
2. Application grounding converts those signals into Structured Intake v4 (`pipeline-schema-v4.0.0`) with `WritingContextV1`, canonical provenance, IDs, ownership, nullability, unresolved state, and a restrictive Decision Facts evidence guard.
3. PB-02 through PB-06 receive only the Structured Intake v3 legacy view (`pipeline-schema-v3.0.0`), with neither `writing_signals` nor `writing_context`.

Candidate catalog v6 uses `runtime-stage-catalog-v6.0.0`, prompt bundle `prompt-bundle-runtime-v6.0.0`, and candidate Runtime schema set `pipeline-schema-runtime-v3.2.0`. It is inactive. Active Service remains on catalog v4, prompt bundle v4, and schema set v3.

## Immutable, uncontaminated replay evidence

The replay reads only the saved C1 evidence at baseline `bdc98af2c7c59a1d7ececa2077906c8fbb839ac9`. The four evidence blobs, diagnostic marker, C1 runner, and evaluator v1 remain unchanged. Production Prompt v5, Structured Intake v5 Schema, Writing Signals, grounding v5, writing-signals grounding, Decision Facts evidence guard, Integrity v2, Pipeline, schema catalog, catalog v6, Provider runner, Service, Policy, UI, and Supabase are unchanged by this correction.

Input construction authority is limited to the saved C1 raw typed projection, synthetic `AssessmentInput`, deterministic schema-version conversion, and Application-owned request fields. `expected_decision_fact_subset`, `expected_writing_context_subset`, `expected_source_ownership`, hard/soft/forbidden assertions, and acceptable value sets are evaluation-only. They cannot alter raw v5 input. Extracted `message_signals` come only from saved `writing_context.message_ownership`, excluding `unsent_candidate`.

- Input construction audit: `8/8`
- Expected/assertion data injected into replay input: `0`
- Replay verdict / passing cases: `FAIL / 5/8`
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
- Auxiliary v3 parity: `4/4`; auxiliary evidence only, not an oracle or gating source
- Empty soft-assertion denominators: `rate=null`, `evidence_status=unavailable`

The actual replay failures are preserved rather than corrected in the evaluator:

- `PAIR-02`: `/latest_direct_message/user_reply_state` is actual `not_applicable`, expected `replied`.
- `V4-06`: `/latest_direct_message/kind` is actual `question`, expected `schedule_coordination`.
- `V4-08`: `/boundary_state/kind` and `/boundary_state/status` are actual `unknown / unknown`, expected `none / none`; expected ownership is also absent.

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
- Intentional contamination/boundary mutations rejected: `4/4`
- Historical verifier compatibility: `9/9`
- Canonical Suite: `64/64`
- Decision Policy: `40/40`
- Typecheck / lint / production build: `PASS`
- JSON parse / correction scope `8/8` / cumulative scope `31/31` / C1 blob immutability / protected diff `0` / `git diff --check`: `PASS`
- OpenAI / DB / Supabase / holdout operations: `0 / 0 / 0 / 0`

Verifier PASS, replay FAIL, Human / ChatGPT review, and acceptance are recorded separately.

## Human / ChatGPT review

- [ ] Confirm the Provider contract is semantic-only and contains zero forbidden bookkeeping keys.
- [ ] Confirm Application grounding owns provenance, identifiers, ownership, nullability, and unresolved-state closure.
- [ ] Confirm the negative evidence guard removes unsupported restrictive facts without creating a Decision.
- [ ] Confirm expected/assertion data cannot influence input construction and all four mutation regressions fail.
- [ ] Confirm PAIR-03 has the direct `temporary_distance / explicit` -> `none / none` evidence and PAIR-04 remains `no_contact / explicit` before and after the guard.
- [ ] Confirm the `PAIR-02`, `V4-06`, and `V4-08` failures remain visible and no Production correction was started.
- [ ] Confirm downstream PB-02 through PB-06 see only the v3 legacy view.
- [ ] Confirm catalog v6 is inactive and active Service remains unchanged.
- [ ] Accept or reject this implementation.

## Next candidate boundary

The next candidate is `M2-P4-I3-R1-C1-R2 PB-01 v5 Bounded Provider Diagnostic`; it is not authorized. C2 Runtime activation, E1, final I3 acceptance, PR, merge to `main`, release, and Milestone 2 completion remain unauthorized, pending, or incomplete as stated.
