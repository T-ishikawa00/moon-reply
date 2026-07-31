# M2-P4-I3-R1-B Review

## Status

- Task: `M2-P4-I3-R1-B PB-01 v4 Writing Context Extraction and Grounding`
- Status: `implementation_pending_human_chatgpt_review`
- Baseline: `2381312ced5fc726dfa245632c25da6bb68a376f`
- Review correction required: `true`
- Review correction base: `0ccf59114fe4079e0a5513fef3faf1b9fade11e7`
- Branch: `feat/m2-p4-i3-r1-b-writing-context`
- Review correction scope: `9/9`
- Exact mutation scope: `22/22`
- Provider diagnostic: `not_started`
- Achieved score: `null`

This slice is offline-integrated only. It does not constitute Human / ChatGPT acceptance, active Runtime activation, final I3 acceptance, a `main` merge, or Milestone 2 completion.

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

Automated PASS does not establish Human / ChatGPT acceptance.

## Review focus

1. Confirm the PB-01 v4 Prompt does not infer Decision, certainty, relationship authority, consent, age, reconciliation intent, or reciprocal interest.
2. Confirm the field-specific provenance matrix prevents candidate wording from becoming incoming-message, ordinary conversation, explicit-constraint, usual-pattern, repeat-state, timing, or detailed user-goal evidence.
3. Confirm candidate style, communicative intent, and the single unsent-candidate ownership item exist only when `optional_message` exists and use exact `input:optional_message` provenance.
4. Confirm incoming profile target identity, owner/status, and exact source-ref equality fail closed, while relationship chip-only evidence stays `writing_only` and decision- or safety-material effects require current-situation evidence.
5. Confirm downstream PB-02 through PB-06 inputs never receive `writing_context`, remain exact v3 legacy views, and preserve full request-input and final-output parity.
6. Confirm catalog v5 remains inactive and R1-C remains unauthorized.

## Next candidate boundary

`M2-P4-I3-R1-C PB-01 v4 Provider Diagnostic and Runtime Activation` is not authorized. No R1-C, provider execution, active Service switch, E1, or holdout work may begin from this implementation or review.
