# M2-P4-I3-R1-C1-R3-R2-E-R3-R2 Offline Authority, Constraint, and Review Integrity Review

## 1. Status

Status is `implementation_pending_human_chatgpt_review` on `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r2-authority-integrity`.

- Exact baseline: `e8db575adc9636032997c8e3d43f8a56e38fae15`
- Exact mutation scope: `25/25`
- Human / ChatGPT review: pending
- Implementation acceptance: not established

Automated evidence can establish offline implementation integrity. It cannot accept the implementation, establish Provider quality, authorize a Provider rerun, or advance R4/C2.

## 2. Frozen authority

E-R3 Commit A `e96774e093b48966f3f9c2679ac778c1aacb8e23`, Commit B `e8db575adc9636032997c8e3d43f8a56e38fae15`, all 37 saved Provider request/output pairs, response IDs, usage, hashes, evaluator, original Product Review, and original machine verdict remain immutable. The frozen verdict remains `FAIL / 1 of 6`.

The old aborted package commit `b909bf3ad259bea0251cf2f81e7a40d9262ce211` remains preserved. Catalog v10, all v10 Prompts, Base Schema v1, Candidate Schema v1, Decision Plan v2 Schema, Report Content v2 Schema, Validation Result Schema, Grounding v2, Semantic Disposition v4, migrations 0004/0005, `service.ts`, `application.ts`, Active Catalog v4, Active Service, and main remain unchanged.

## 3. Exact scope

The remediation contract fixes the mutation manifest at exactly `25/25`: three existing Runtime files, three rolling documents, ten new Runtime/contract assets, six new offline evidence assets, one offline runner, one dedicated verifier, and this review. Scope expansion is prohibited.

## 4. Inactive v11 identity

- Catalog: `runtime-stage-catalog-v11.0.0`
- Prompt bundle: `prompt-bundle-runtime-v11.0.0`
- Schema set: `pipeline-schema-runtime-v5.0.0`
- Topology: `split-base-candidate-v1`
- Stage order: `PB-01`, `PB-01C`, `PB-02`, `PB-03`, `PB-04`, `PB-05`, `PB-06` (`7/7`)

PB-02 and PB-03 are deep-equal to v10. PB-01C Prompt v2 and Candidate Schema v1 are unchanged. PB-04/PB-05/PB-06 retain their v10 output Schemas. The v11 loader verifies hashes, AJV compilation, OpenAI Structured Output projection, predecessor identity, and Stage order. The loader is inactive; Active Service still selects the existing Catalog v4 loader.

## 5. Base Schema v2

Base Structured Intake v2 preserves the v1 fields and adds required `decision_facts.user_contact_constraint`. Legal combinations are `none/none/[]`, `unknown/unknown/[]`, and explicit `no_followup_message` or `business_only` with one or more valid `Fxxx` references. PB-01 v3 may establish an explicit constraint only from explicit user wording; referenced facts must exist, Candidate data cannot contribute, and other-person no-contact remains boundary authority.

## 6. Application-owned action context

For v11 only, the Pipeline constructs `action_context` from the trusted `runContext.startedAt` and an explicitly supplied IANA timezone. No implicit machine-local timezone is used. The deterministic horizon is `current_local_day_remaining`, with Application-owned start/end instants and Japanese display label `今夜`; missing timezone fails closed before any Stage call.

This authority governs the current action window and its wording. It does not establish another person's deadline, predicted reply timing, hidden feelings, future events, or fabricated exact times. PB-04, PB-05, and PB-06 receive the same immutable projection.

## 7. Contact constraint policy

The Application converts Base v2's source-grounded constraint plus the existing structured follow-up exception into a separate `contact_constraint_policy`; it is not merged into Base, CandidateEnvelope, or Decision Policy. Explicit `no_followup_message` with exception `none` disallows outbound contact now and after mere time passage and requires any future contact to have an independently authorized exception. Explicit permitted exceptions are evaluated separately. `business_only` remains bounded to business contact and rejects structured personal-invitation escalation.

The deterministic integrity check runs after PB-04 Schema/Policy validation and before PB-05. It fails closed with `M2_PLAN_CONSTRAINT_INTEGRITY_FAILED` when structured decision, draft, metadata, change-direction, or business-only invariants are violated.

## 8. Candidate Grounding v2

Candidate Grounding v2 begins from accepted Grounding v1 and operates only on structured fields. Concrete practical requirements remove contradictory `none` and `unknown` values without reordering or invention. `confirm_schedule` ensures `asks_for_reply` and `proposes_meeting`; `answer_question` ensures `asks_for_reply`; invitation presence ensures `proposes_meeting`. These ordinary signals never manufacture `reply_demand`, coercion, threat, or pressure. Raw Provider output and input objects remain immutable.

Candidate fixtures pass `7/7`.

## 9. Decision Plan v2 enforcement boundary

Production enforcement uses structured `selected_decision`, draft policy/timing, `message_draft_edit_metadata.communicative_intent_delta`, `change_conditions[*].resulting_direction`, `contact_constraint_policy`, and `action_context.action_horizon`.

Decision Plan v2 lacks a structured outbound-contact action kind in `actions_to_take`, a structured aftercare action kind, a change-condition trigger taxonomy, and a reassessment trigger kind. Those four limitations are recorded in the remediation contract and Runtime module. This task does not modify Decision Plan v2 Schema and does not add raw Japanese substring matching. Fixtures express violations through enforceable structured paths and fail closed.

## 10. PB-04 / PB-05 / PB-06 v3

PB-04 receives the exact Base, Candidate, user-supplied optional message, Decision Policy, contact policy, action context, and requested-topic authorities. PB-05 receives Base, Candidate, Decision Plan, contact policy, and action context. PB-06 receives all existing v10 authorities plus contact policy and action context.

PB-06 does not emit `FACT_FIDELITY` solely for the exact structured action-horizon label and does not apply a broad lexical waiver. Invented external deadlines or exact times, promised reply timing, predicted events, constraint reversal, boundary violations, and fabricated facts remain blocking. Internal Candidate-label omission alone is nonblocking only when material final-draft meaning is preserved.

## 11. Offline fixtures and parity

The deterministic offline suite passes `28/28`:

- Temporal authority: `6/6`
- Contact constraint: `5/5`
- Candidate Grounding: `7/7`
- Runtime: `5/5`
- Evidence review: `5/5`

The v11 ready flow completes, no-contact stops after PB-03, explicit nofollow violation fails closed after PB-04 validation, and absent timezone fails before Stage execution. v9 and v10 parity are `PASS / PASS`; neither predecessor requires the new timezone option.

## 12. Independent frozen-evidence audit

The new offline runner independently recomputes the E-R3 Commit B evidence without importing the frozen evaluator as sole authority:

- Request hashes: `37/37`
- Raw-output hashes: `37/37`
- Raw-output hashes after processing: `37/37`
- Response IDs present and unique: `37/37`
- Forbidden Provider-input keys: `0`
- Case Stage counts: `6/6` matching
- Provider / DB / Supabase operations: `0 / 0 / 0`

The audit records actual `final_result` presence, `safe_error_code`, PB-06 blocking findings, and intermediate Plan/Report presence for every case. It preserves the frozen machine verdict rather than replacing it.

## 13. Corrected Product Review

The corrected projection is `evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r2/product-review-corrected-v1.md`. When `final_result` is null, generated Plan/Report content is labelled `棄却された中間生成物`; it is never represented as an accepted or final output. Accepted draft/report presence is projected only from an actual non-null final result. The original E-R3 Product Review remains unchanged.

## 14. Automated validation

Required automated validation covers the offline runner write/check pair, dedicated authority-integrity verifier, Decision Policy `40/40`, typecheck, zero-warning lint, build, `git diff --check`, and exact status inspection. The dedicated verifier also enforces exact scope `25/25`, frozen/protected asset preservation, v11 identity/order, independent evidence hashes, all `28/28` fixtures, v9/v10 parity, zero external operations, unchanged main, and unauthorized R4.

Automated PASS is implementation evidence only. It is not Human / ChatGPT acceptance and does not change the capability boundary.

## 15. Capability boundary

- Provider quality established: `false`
- Provider rerun ready: `false`
- Provider rerun authorized: `false`
- Active Runtime activated: `false`
- Migration applied: `false`
- R4 ready / authorized: `false / false`
- C2 authorized: `false`
- PR / main merge / force push authorized: `false / false / false`

Provider / retry / repair / fallback / DB / Supabase operations are all zero. Human / ChatGPT review is pending. No Provider rerun, Runtime activation, R4, C2, PR, main integration, or release action is authorized by this package.
