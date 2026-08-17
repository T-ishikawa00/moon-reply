# M2-P4 V1-D Step 1 — Offline Fixtures / Product Re-review Harness

## Disposition

- Status: Step 1 `accepted_complete`; V1-D Step 2A `in_progress_controlled_provider_executor`.
- Exact parent / accepted V1-C snapshot: `a436210bb035746c129fe071e6225b3799b9e5d8` (`fix: validate quality repair paths precisely`).
- V1-C: `accepted_complete`; ChatGPT review `PASS_complete`; Human review `PASS_complete`; Human acceptance `complete`; acceptance date `2026-08-17`.
- V1-C history is retained: core `e7ae51aa96bbb3d1e791ac957e26bb8918d10547` is `PASS 0/0/0`; R1 `4a3d5b3f93d2b97ae8e97c0bac07b89576b48b40` initially received `NEEDS_CORRECTION 0/1/0`; R1-C1 at `a436210b…` is `PASS 0/0/0`.
- V1-D Step 1 accepted snapshot is `41d90b69c18aec86995d1930f28be05d6ccfca8f`; ChatGPT/Human review is `PASS_complete`; Human acceptance is `complete`; acceptance date `2026-08-18`. Provider execution remains unauthorized and was not performed.

## Step 1 C1 correction

Step 1 snapshot `4c7577564421e2dbd264ffadb5ccab8d961c42eb` received ChatGPT review `NEEDS_CORRECTION`, BLOCKER 0 / MAJOR 2 / MINOR 0. The retained findings are `controlled_provider_execution_inputs_not_frozen` and `provider_attempt_ceiling_does_not_account_for_sdk_retries`. All other Step 1 results remain PASS and are not redesigned.

C1 freezes exactly nine consultation-specific synthetic `AssessmentInput` records, each case's clock/timezone and expected initial route, the `gpt-5.6-luna` model, and the single clarification case's exact `latest_contact_timing` answer. No names, real people, workplace/school/address/contact identifiers, or Human PII are included. Raw text to PB-01 extraction correctness and every Provider outcome remain unestablished.

`controlled_provider_review_packet=exact_inputs_and_execution_constraints_prepared`. C1 at `41d90b69…` is `PASS 0/0/0` and Step 1 overall is now accepted. Step 2A implements the controlled executor, but `provider_execution_authorized=false` and Provider execution remains zero.

## Step 1 boundary

This step adds evidence and review infrastructure only. It may establish fixture completeness, deterministic routing/evaluator/recovery behavior, harness correctness, exact-draft regression, R2-B shell structural preservation, and an exact controlled Provider input/constraint packet for later executor work.

It does not establish actual V15 prose quality or semantic fidelity, PB-06 Provider recall/precision, real repair success rate, Human emotional understanding from real output, `plausibly_worth_jpy980`, R2-C PASS, JPY980 Runtime readiness, or Global Q0 completion.

All reused historical output and all new Product copy are labeled `historical_reference_or_fake_fixture`. No artifact in this step is labeled `actual_v15_successor_output`.

## Canonical fixture matrix

The machine-readable matrix contains exactly 22 unique intentions. Each entry fixes provenance, consultation intention, requested topics, Candidate expectation, V1-A route, one-question lifecycle, Product/draft generation, evaluator/recovery expectation, Human review applicability, proof, and non-proof.

Current accepted authority overrides historical rendering convenience:

- `simple_business_reply_with_draft` is `needs_one_clarifying_answer`; its old rendered note is not paid-ready evidence.
- `nullable_optional_sections` is `not_full_product_candidate` because the requested message-impact scope lacks the required Candidate/current Product basis; its old rendered note is not a valid paid Product fixture.
- emotion intensity alone never establishes Product materiality.
- one answer can establish Ready only when it materially resolves the single target; otherwise the request routes to `not_full_product_candidate` with no second question.

## Deterministic Product-quality regression

Fake-only V15 runs retain the accepted V1-C recovery architecture:

1. unsupported inner-state assertion, material repetition, missing baseline emotional containment, generic reassurance closing, and repeated-Decision closing are blocking;
2. repairable defects trigger one sanitized `report_only` cycle;
3. attempt 1 is never delivered;
4. attempt-2 PASS is the only saved Report;
5. attempt-2 failure creates no Report and no attempt 3; and
6. report-only recovery preserves `decision_plan.recommended_message_draft.text` exactly.

The positive consultation-specific emotional closing adds a distinct stopping function without being required to introduce a new factual proposition. A grounded alternative tradeoff fixture explains concrete benefits and costs; the non-applicable fixture omits a manufactured comparison.

No keyword classifier, embedding model, or fixture-ID Runtime branch is added.

## Private Product review harness

`/review/runtime/v15` is a development-only, fixture-only surface:

- production and missing `M2_INTERNAL_RUNTIME_ENABLED=true` both return `notFound()`;
- metadata is `noindex` / `nofollow`;
- the visible label is `V1-D オフライン確認 / 実Provider出力ではありません`;
- fixed synthetic/historical reference data is decoded by `decodeCustomerAssessmentExperienceProjectionV2()`;
- the real `CustomerAssessmentNote` and its existing CSS render the note; and
- Provider, DB, Supabase, Payment, network, and actual-user-data paths are absent.

`CustomerAssessmentNote.tsx`, `CustomerAssessmentNote.module.css`, both customer projections, and the historical V12 fixture module remain byte-identical. This establishes R2-B shell structural regression only, not formal R2-C visual/accessibility PASS.

## Human review and later Provider plan

The Human Product review sheet defines all required judgments but contains no PASS and no actual output records. Provider-dependent values remain `pending_actual_v15_provider_output`.

The controlled plan selects exactly nine synthetic cases and binds them one-to-one to `controlled-provider-inputs-v1.json`. It locks every complete `AssessmentInput`, V15 identity, `gpt-5.6-luna`, clock/timezone, expected route, one-reassessment budget, and evidence outputs. The clarification case contains one exact answer payload and no second answer.

The future execution flow is exact frozen inputs → V15 `AssessmentApplication` → `FakeAssessmentRepository` → review-only real Provider transport → V15 PB-01 through PB-06 → optional one quality reassessment → offline evidence capture. The normal `service.ts` / `SupabaseAssessmentRepository` path is prohibited. Step 2A implements this executor without executing it.

The budget is a maximum of 12 Application Stage invocations per case and 108 total. Step 2A's dedicated review transport explicitly sets `maxRetries=0`, the runner has no alternate real Provider path, and budget checks occur before transport invocation. Thus the future authorized hard HTTP-attempt ceiling for this review-only executor is 108. V15 quality reassessment is an Application action, not an SDK retry. Actual HTTP attempts remain zero; `provider_execution_authorized=false` and separate explicit Human authority remains required.

## Evidence and operations

- C1 exact scope: `11/11` — 10 UPDATE + 1 NEW; DELETE / RENAME 0.
- Corrected dedicated verifier: fixed `50/50`.
- Immutable Step 1 verifier: `45/45`, executed once; its recursive V1-C R1-C1/upstream/Decision Policy chain is not redundantly rerun.
- Typecheck, zero-warning lint, build, `git diff --check`, exact scope, sensitive scan, and protected-blob checks: PASS.
- OpenAI Provider / DB / Supabase / migration apply / Payment / deploy: `0 / 0 / 0 / 0 / 0 / 0`.

R2-C remains `remediation_required`; `experienceProductJudgment=pending_remediation`; `jpy980RuntimeReadiness=not_established`; `globalQ0Completion=false`. Production Runtime, Payment, PR, and main integration remain unauthorized.

## Human / ChatGPT review request

Step 1 review is complete. For Step 2A, review the authorization fail-closed behavior, exact input hash binding, V15 Application/local repository path, explicit `maxRetries=0`, 12/108 pre-transport budget, separate ledgers, clarification single-answer behavior, Ready-only projection, and evidence sanitizer/journal. The accepted 22-case matrix and Product shell remain unchanged. Do not infer actual V15 Product quality or JPY980 value.

## Step 2A executor status

Step 2A is `implemented_pending_human_chatgpt_review`. The runner refuses execution unless the explicit CLI flag, deliberate authorization env, exact HEAD, exact input SHA-256, Human authorization reference, API key presence, clean worktree, explicit case selection, and safe output directory all pass. `--validate-only` constructs no OpenAI client and performs no network call.

Evidence writing is sanitized and atomic. Raw Provider response/request IDs, URLs, headers, raw SDK errors, secrets, Human PII, and chain-of-thought are prohibited. Ready outputs alone are projected; Human Product review fields remain `pending_human_review`. No actual `actual_v15_successor_output` exists in Step 2A.
