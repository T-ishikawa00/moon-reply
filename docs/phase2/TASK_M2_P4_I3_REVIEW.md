# TASK M2-P4-I3 Review

## Status

- Task: `M2-P4-I3 PB-04 / PB-05 / PB-06 Product Quality Revision`
- Baseline: `61e33a10e195fad17e253a6b9719217e1992f273`
- Branch: `feat/m2-p4-i3-product-quality-revision`
- Status: implementation complete; Human / ChatGPT review pending
- M2-P4-I2: Human / ChatGPT accepted and complete at `410714875903ae61b5bcdc6cce90030f5679b3b3`
- Provider-backed quality result: not run
- Achieved quality score: none
- M2-P4-E1: not started
- Milestone 2: incomplete

## Authorization and product position

I3 is explicitly authorized as a product-quality successor for PB-04, PB-05, and PB-06. It moves the generated result from a correct but rigid analysis report toward a calm, attentive adult consultation partner. The principal usage context is a night when an adult user is carrying a relationship concern alone and wants to feel understood, understand the reason, and be able to act. Output must not name or stereotype the target age or gender.

Moon Reply does not promise the right answer in love, another person's inner state, or a future outcome. It receives the user's concern, organizes the present situation, and helps choose one concrete step for tonight. The quality contract is machine-readable at `evals/runtime/m2-p4-i3-quality-contract-v1.json` and targets `分かってもらえた`, `納得できた`, and `動けそう`, with case-specific detail appropriate to a JPY 980 one-time purchase.

## Exact mutation scope

Exactly 19 literal paths are authorized:

1. `lib/assessment/runtime/contracts/pb-04-decision-plan-v3.developer.md`
2. `lib/assessment/runtime/contracts/pb-05-report-writer-v3.developer.md`
3. `lib/assessment/runtime/contracts/pb-06-semantic-validator-v2.developer.md`
4. `lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json`
5. `evals/runtime/m2-p4-i3-quality-contract-v1.json`
6. `evals/runtime/m2-p4-i3-capabilities-v1.json`
7. `scripts/verify-m2-p4-i3-product-quality.mjs`
8. `docs/phase2/TASK_M2_P4_I3_REVIEW.md`
9. `lib/assessment/runtime/schema-catalog.ts`
10. `lib/assessment/runtime/service.ts`
11. `lib/assessment/runtime/pipeline.ts`
12. `scripts/verify-m2-eval-foundation.mjs`
13. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
14. `scripts/verify-m2-p4-i1-b-runtime-integration.mjs`
15. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`
16. `scripts/verify-m2-p4-i2-report-ia.mjs`
17. `docs/CURRENT_FOCUS.md`
18. `docs/WBS.md`
19. `docs/CODEX_HANDOFF.md`

Wildcard, prefix authorization, future-path auto-authorization, or mutation of the accepted I1-C 27-path and I2 16-path historical snapshots is prohibited.

## PB-04 Decision Plan v3

PB-04 keeps the existing decision-plan Schema and application-owned allowed decision. It receives `user_supplied_optional_message` and `requested_topics` only under runtime v4. The optional message remains an unsent draft source and is not converted into a quotation, fact, or timeline event.

For `reply_now` and `send_now`, PB-04 produces one current-use, copy-ready draft. When the user supplied a candidate, it preserves meaning and natural vocabulary while making the smallest useful edit; it does not invent affection, closeness, invitations, questions, emoji, or nicknames. Actions cover a case-specific before-send check, the sending action, and an after-send step. Wait/pause plans state what not to send, what to do instead, and the observable next-review condition. The three-day plan has exactly three distinct roles and no invented romantic deadline or future prediction.

## PB-05 Report Writer v3

PB-05 keeps the existing report-content Schema and does not change the decision plan. Its field-by-field contract separates emotional reception, current reasoning, facts, distinct possibilities, anxiety reframing, outgoing-message temperature, action rationale, draft-edit rationale, three-day roles, future conditions, concise unknowns, and a settling close.

The voice is calm adult polite Japanese: kind but not vague, close without overfamiliarity, and explicit about tonight's action. It avoids business-report tone, repetitive AI disclaimers, unsupported reassurance, occult language, and reusable filler. The optional candidate and selected topics are used to make the report case-specific.

## PB-06 Semantic Validator v2

PB-06 keeps the existing validation-result Schema and the existing fourteen finding codes. Critical/major remains the fail-closed correctness boundary for material fact, Safety, allowed-decision, reasoning, draft, action, three-day, certainty, and review-condition failures. A required draft that is unusable, a materially changed candidate, an unanswered concrete question, a materially unfulfilled selected request, or an empty paid-value section may also be major.

`TEMPLATE_GENERICITY`, `BRAND_TONE`, and `REPETITION` default to minor. Slight stiffness, brevity, genericity, or one additional caveat does not stop an otherwise valid normal consultation. `REQUIRED_SECTION_MEANING` is major only for material omission and minor when meaning exists but warmth or specificity is weak. Exact temporal future-condition false positives remain nonblocking, while a real major finding still blocks.

PB-06 reports findings only. It does not repair, retry, regenerate, invoke fallback, or add PB-07.

## Runtime catalog and input boundary

`runtime-stage-catalog-v4.json` activates `prompt-bundle-runtime-v4.0.0` while retaining `pipeline-schema-runtime-v3.0.0`. PB-01 v3, historical PB-02 v1, and PB-03 v3 are unchanged. PB-04 advances to v3, PB-05 to v3, and PB-06 to v2. All six output Schema paths and LF UTF-8 SHA-256 values remain identical to catalog v3.

`loadM2P4ProductQualityRuntimeStageCatalog()` loads and validates v4; historical v1/v2/v3 loaders remain available. The service uses v4 and retains `gpt-5.6-luna`. Only v4 inputs for PB-04/PB-05/PB-06 receive the raw optional candidate and selected topics. v1/v2/v3 Stage inputs and historical request hashes are unchanged. The optional message body is not emitted into documentation, console output, error output, verifier output, or DB inspection reports.

Pipeline order, persistence, atomic finalization, contextual grounding, Safety, eligibility, Policy, semantic disposition, major/critical fail-closed behavior, temporal false-positive handling, and the absence of retry/Repair/fallback remain unchanged.

## Validation and execution boundary

The dedicated verifier checks exact scope `19/19`, protected historical assets, I1-C `27/27`, I2 `16/16`, catalog hashes and Structured Output compatibility, product contracts, v4-only input fields, Fake-only success and failure cases, temporal handling, Safety preservation, and typed Policy parity `40/40`.

All task-time execution is local and synthetic through Fake repository/transport paths. OpenAI calls, DB operations, migrations, holdout use, real-user data, and paid execution are all `0`. Provider-backed prose quality has not been evaluated, no rubric score has been achieved, and E1 is not started. Automated PASS does not constitute Human / ChatGPT acceptance or provider-backed quality evidence.

## Next gate

After implementation review and acceptance, the next candidate sequence is one separately Human-authorized synthetic live smoke, Human review of the generated prose, SELECT-only DB consistency verification, an I3-R1 correction only if needed, and then E1's fixed 12-case diagnostic. None of those actions is authorized by this implementation task.
