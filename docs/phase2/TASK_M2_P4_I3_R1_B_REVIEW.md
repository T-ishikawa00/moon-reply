# M2-P4-I3-R1-B Review

## Status

- Task: `M2-P4-I3-R1-B PB-01 v4 Writing Context Extraction and Grounding`
- Status: `human_chatgpt_accepted_complete`
- Accepted implementation commit: `4a1237ac647bff79229d7181d978d5613c2c3b87`
- Implementation commits: `0ccf59114fe4079e0a5513fef3faf1b9fade11e7`, `4a1237ac647bff79229d7181d978d5613c2c3b87`
- Immutable implementation snapshot: `2381312ced5fc726dfa245632c25da6bb68a376f..4a1237ac647bff79229d7181d978d5613c2c3b87` (`22/22` exact paths; working tree excluded)
- Baseline: `2381312ced5fc726dfa245632c25da6bb68a376f`
- Review correction required: `false`
- Review correction status: `resolved`
- Review correction: `0ccf59114fe4079e0a5513fef3faf1b9fade11e7..4a1237ac647bff79229d7181d978d5613c2c3b87` (`9/9`; provenance ownership `7/7`; valid `20/20`; invalid `20/20`; downstream parity `15/15`; no scope expansion; no force push)
- Branch: `feat/m2-p4-i3-r1-b-writing-context`
- Exact mutation scope: `22/22`
- Provider diagnostic: `not_started`
- Achieved score: `null`
- Final I3 acceptance: `pending`
- Milestone 2: `incomplete`
- `main`: unchanged at `61e33a10e195fad17e253a6b9719217e1992f273`

This exact offline-integrated implementation and its review correction are Human / ChatGPT accepted complete. Acceptance does not activate Runtime, start Provider execution, establish final I3 acceptance, merge to `main`, or complete Milestone 2.

## Implemented boundary

- PB-01 v4 preserves the v3 intake and Decision Facts responsibilities and adds typed `writing_context` extraction.
- `groundStructuredIntakeV4` reuses v3 Decision Facts grounding, then canonicalizes only writing-context facts owned by the Application.
- `validateWritingContextIntegrityV1` enforces field-specific provenance ownership: candidate material is exact `input:optional_message`; incoming/profile, explicit constraints, communication patterns, and repeat state cannot inherit candidate provenance; resolved user goals require `input:current_situation` because requested-topic values do not encode an exact communication goal; channel/timing permits the matching-app relationship exception only for a matching-app channel; and language/expression is bounded to current-situation or candidate evidence.
- Incoming profiles must target an existing `other_person` / `incoming` ownership item with exact source-ref equality. A present candidate has exactly one `user` / `unsent_candidate` item and cannot be an incoming-profile target.
- `buildStructuredIntakeLegacyViewV3` removes `writing_context`, restores the v3 schema version, and preserves all other grounded intake fields.
- Inactive candidate catalog `runtime-stage-catalog-v5.0.0` uses prompt bundle `prompt-bundle-runtime-v5.0.0` and transitional schema set `pipeline-schema-runtime-v3.1.0`.
- PB-02 through PB-06 are deep-equal to catalog v4 and receive only the v3 legacy view.
- Candidate and current Fake Pipeline results are compared across the complete PB-02 through PB-06 request inputs for all three cases. Each downstream intake is deep-equal, v3, free of `writing_context`, and preserves Decision Facts; PB-04 additionally proves aggregate Safety, eligibility, and decision-policy input equality. Final eligibility, Decision, Runtime Report, and Decision Card are deep-equal.

## Runtime protection

Active Service remains unchanged on:

- `runtime-stage-catalog-v4.json`
- `prompt-bundle-runtime-v4.0.0`
- `pipeline-schema-runtime-v3.0.0`

There is no `service.ts` mutation, live OpenAI call, real DB operation, Supabase operation, migration, holdout use, real-user data, paid execution, PR, merge, or release.

## Exact acceptance-sync manifest

This acceptance synchronization changes exactly eight existing paths:

1. `evals/runtime/m2-p4-i3-r1-b-capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_B_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-b-writing-context.mjs`
4. `scripts/verify-m2-eval-foundation.mjs`
5. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
6. `docs/CURRENT_FOCUS.md`
7. `docs/WBS.md`
8. `docs/CODEX_HANDOFF.md`

It does not extend the immutable `22/22` implementation snapshot. PB-01 v4 Prompt, catalog v5, grounding, Integrity, legacy view, grounding cases, Runtime contract, Pipeline, schema catalog, R1-A assets, Service, active catalog v4, Policy, Safety, UI, and every other historical verifier remain content-fixed to accepted implementation commit `4a1237ac647bff79229d7181d978d5613c2c3b87`; canonical LF comparison excludes checkout-only CRLF normalization.

## Fixture evidence

- Synthetic valid grounding cases: `20`
- Synthetic invalid grounding cases: `20` (existing `16` preserved; provenance-ownership correction `4` added)
- Fake Pipeline parity cases: `3`
- Full downstream input parity: `5 stages x 3 cases`
- Runtime case-ID / fixture / oracle lookup authority: none
- Full UUID, DB record, raw PII, real-person, development-set, and holdout material: none

## Automated verification

The required sequential verification set completed locally:

- Dedicated R1-B verifier: `PASS` (review correction `9/9`, cumulative scope `22/22`, `20/20` valid, `20/20` invalid, Fake Pipeline `3/3`, full downstream input parity `15/15`)
- Historical verifier compatibility: `PASS` (`7/7`)
- Canonical Suite: `PASS` (`64/64`)
- Decision Policy: `PASS` (`40/40`)
- Typecheck / lint / production build: `PASS`
- JSON parse / exact scope `22/22` / protected diff `0` / `git diff --check`: `PASS`
- Acceptance synchronization exact scope `8/8`; immutable implementation snapshot `22/22`; review correction `9/9`: `PASS`

Automated PASS is recorded separately from the Human / ChatGPT acceptance decision.

## Human / ChatGPT review result

- [x] The PB-01 v4 Prompt does not infer Decision, certainty, relationship authority, consent, age, reconciliation intent, or reciprocal interest.
- [x] The field-specific provenance matrix prevents candidate wording from becoming incoming-message, ordinary-conversation, explicit-constraint, usual-pattern, repeat-state, timing, or detailed user-goal evidence.
- [x] Candidate style, communicative intent, and the single unsent-candidate ownership item exist only when `optional_message` exists and use exact `input:optional_message` provenance.
- [x] Incoming profile target identity, owner/status, and exact source-ref equality fail closed; relationship chip-only evidence stays `writing_only`, while decision- or safety-material effects require current-situation evidence.
- [x] Downstream PB-02 through PB-06 inputs never receive `writing_context`, remain exact v3 legacy views, and preserve full request-input and final-output parity.
- [x] Catalog v5 remains inactive and active Service remains on catalog v4.
- [x] C1 Provider diagnostic and C2 Runtime activation remain unauthorized.

R1-B is Human / ChatGPT accepted complete at implementation commit `4a1237ac647bff79229d7181d978d5613c2c3b87`. Its immutable snapshot is exactly 22 paths, its review correction is resolved in exactly nine paths, provenance ownership is `7/7`, valid and invalid grounding are `20/20` each, Fake Pipeline is `3/3`, PB-02 through PB-06 downstream input parity is `15/15`, leakage is `0`, Canonical Suite is `64/64`, and Decision Policy is `40/40`.

## Next candidate boundary

The next candidates are split into `M2-P4-I3-R1-C1 PB-01 v4 Bounded Provider Diagnostic` and `M2-P4-I3-R1-C2 PB-01 v4 Runtime Activation`. Neither is authorized. Provider diagnostic, active Service switch, E1, holdout work, final I3 acceptance, and Milestone 2 completion remain not started, pending, or incomplete as stated; the legacy combined R1-C task grants no authority.
