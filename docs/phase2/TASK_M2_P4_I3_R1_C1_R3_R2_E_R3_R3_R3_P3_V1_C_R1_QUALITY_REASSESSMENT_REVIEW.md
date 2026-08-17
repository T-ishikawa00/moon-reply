# M2-P4 V1-C R1-C1 Precise Repair Path Authority Correction — Review Packet

## Review disposition

- Status: `precise_repair_path_corrected_pending_human_chatgpt_review`.
- Exact parent / immutable V1-C R1 snapshot: `4a3d5b3f93d2b97ae8e97c0bac07b89576b48b40` (`fix: add bounded quality reassessment recovery`).
- Required previous immutable V1-C core: `e7ae51aa96bbb3d1e791ac957e26bb8918d10547`.
- V1-C core ChatGPT technical review: `PASS`; BLOCKER / MAJOR / MINOR `0 / 0 / 0`.
- V1-C R1 initial ChatGPT review: `NEEDS_CORRECTION`; BLOCKER / MAJOR / MINOR `0 / 1 / 0`; sole finding `repair_path_shape_does_not_prove_actual_product_path`.
- All other R1 recovery findings: `PASS`; the accepted recovery architecture is not reopened.
- V1-C Human acceptance: `HOLD`; overall: `in_progress_recovery_correction`.
- V1-A / V1-B: `accepted_complete`; accepted V1-B snapshot `e21c9b571426160703b1112c9057cc26c7738a0a`.
- V1-D: unauthorized.
- Exact scope: `13/13` — 13 UPDATE; NEW / DELETE / RENAME 0.
- Required commit subject: `fix: validate quality repair paths precisely`; exactly one direct correction commit.

## Precise repair-path correction

R1 correctly bounded reassessment, but its path classifier treated a recognized prefix as sufficient repair authority. That left nonexistent indexes and unknown descendants eligible for a Provider repair directive. R1-C1 changes only this authority decision.

`buildQualityReassessmentDirectiveV1()` now requires both a finite Product-owned path-shape allowlist and resolution against the actual current validated Decision Plan or grounded Report Content. A property is present even when its value is null, but a child below null is absent. Array indexes must be own indexes that currently exist. Unknown children, nonexistent indexes, malformed paths, non-Product authorities, and Application-owned Report paths reject the entire directive and preserve `M2_SEMANTIC_VALIDATION_FAILED`; no subset repair is attempted.

The current Decision Plan and grounded Report are used only as path-resolution authority. Resolved values, prior prose, draft text, Candidate data, and PB-06 detail never enter the directive.

## Preserved R1 recovery architecture

V14 rejected invalid Product correctly but immediately terminal-failed the request. V15 preserves that evaluator core while allowing exactly one Application-controlled recovery cycle:

1. attempt 1 runs PB-04, PB-05, Application grounding/schema/shape, PB-06, and SemanticDispositionV5;
2. PASS finalizes normally;
3. a repairable Product-quality failure creates a sanitized `QualityReassessmentDirectiveV1` and starts attempt 2 inside the same current run;
4. `report_only` reuses PB-04 and reruns PB-05/PB-06; `plan_and_report` reruns PB-04/PB-05/PB-06;
5. attempt-2 PASS is the only repaired Product eligible for Delivery; and
6. a second semantic/shape Product-quality failure becomes `M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED`, creates no Report, and has no attempt 3.

Provider transport, Provider schema, persistence, Runtime authority, source integrity, Clarification integrity, Application-owned report paths, and unknown paths remain fail-closed without Product-quality reassessment.

## Same-request and same-run invariant

Recovery creates no second assessment request, idempotency key, Purchase, Clarification, user action, Base, Candidate, or assessment run. Initial processing remains in the initial run. Clarification recovery remains in the existing `clarification_resume` run; it adds no third run and asks no second question.

This Task implements no Payment behavior. It only establishes the future same-Purchase/no-recharge execution foundation.

## Sanitized directive and repair ownership

The deterministic Application directive uses schema `m2-p4-quality-reassessment-directive-v1`, attempt number 2, source `pb06_semantic_findings|local_semantic_shape`, scope `report_only|plan_and_report`, and at most twelve sorted/deduplicated defects. Each defect has exactly:

- `findingCode`;
- `severity`;
- `jsonPath`; and
- `normalizedRepairRequirementCode`.

It never carries PB-06 `detail`, evaluator prose/reasoning, chain-of-thought, arbitrary instructions, raw Candidate, previous Report, previous PB-04 output, or new facts. Malformed, excessive, unrecognized, or non-owned defects do not trigger recovery.

`report_content.relationship_summary` and `report_content.change_condition_commentary` remain Application-owned and excluded. Repairability requires the recognized code, a statically allowed PB-04/PB-05-owned shape, and successful resolution against the actual current Product. A finding code or recognized prefix alone is insufficient.

## Prompt and exact-draft authority

PB-04 v5 and PB-05 v6 are self-contained successors carrying their complete accepted predecessor responsibilities plus bounded attempt-2 behavior. With a null directive, normal behavior equals the predecessor contract.

PB-04 attempt 2 rebuilds a Plan from original trusted authorities and never receives the previous Plan. It cannot override Decision Policy, Effective Policy, Safety, Candidate integrity, ContactConstraintPolicy, ActionContext, or Clarification authority. PB-05 attempt 2 rebuilds the Report from scratch and never receives the previous Report or raw evaluator detail.

For `report_only`, the same Decision Plan object is reused and `recommended_message_draft.text` remains byte-exact. For `plan_and_report`, only PB-04 may regenerate the draft under existing authority. PB-05 and PB-06 never own or rewrite it. Customer output never mentions reassessment or a previous failure.

## Attempt persistence and accounting

Migration `0009` adds/backfills/not-nulls `assessment_stage_runs.attempt_number`; historical rows are 1 and allowed values are 1/2. Uniqueness becomes `(run_id, stage_id, attempt_number)` and `(run_id, sequence_number, attempt_number)`. Attempt 2 is permitted only for non-skipped PB-04/PB-05/PB-06 rows whose parent run uses V15. PB-01/PB-01C/PB-02/PB-03 and every skipped row remain attempt 1.

Every Stage request hash includes the attempt number. Attempt-1 and attempt-2 usage accumulates in the same Pipeline totals. Success finalizes once; an exhausted or technical failure records the accumulated totals through the existing fail-run path once.

Migration `0009` is not applied. It changes no Product table, Payment table, Customer field, request lifecycle state, run kind, Clarification behavior, Report schema, or RPC business behavior.

## V15 identity and historical parity

- Catalog / Prompt bundle: `runtime-stage-catalog-v15.0.0` / `prompt-bundle-runtime-v15.0.0`.
- Schema set / topology: unchanged `pipeline-schema-runtime-v6.0.0` / `split-base-candidate-v1`.
- Baseline: `e7ae51aa96bbb3d1e791ac957e26bb8918d10547`.
- Stage count: seven; no new Provider Stage.
- PB-01, PB-01C, PB-02, PB-03, and PB-06 are V14-identical.
- Only PB-04 and PB-05 Prompt identities change; their Decision/Report schemas are unchanged.
- V14 catalog, PB-06 Prompt, SemanticDispositionV5, ProductSemanticShapeV1, Decision Policy, Effective Authority, V1-A routing/lifecycle, Candidate Grounding V2, and migrations `0006`/`0007`/`0008` remain immutable.

## Offline evidence and ceiling

Thirty bounded fake-only cases retain all R1 coverage and add actual-property, existing-index, nested-property, null-parent, Application-owned, and recognized-root/nonexistent-path regressions. The end-to-end `decision_plan.actions_to_take[999]` case produces `M2_SEMANTIC_VALIDATION_FAILED`, zero attempt-2 PB-04/PB-05/PB-06 rows, and zero Reports.

The corrected dedicated verifier is fixed at `50/50`. It also runs immutable R1 at `4a3d5b3f…` (`46/46`) and the immutable V1-C core verifier at `e7ae51aa…` (`49/49`), which runs immutable V1-B (`38/38`) and the complete accepted upstream/Decision Policy chain.

This establishes offline plumbing, bounded retry, persistence, authority, and parity only. It does not establish real Provider repair success, evaluator recall/precision, actual Product quality, Human understanding, `plausibly_worth_jpy980`, Provider semantic fidelity, production reliability, Payment recovery readiness, R2-C PASS, or Global Q0 completion.

Provider / DB / Supabase / migration apply / Payment / deploy are `0 / 0 / 0 / 0 / 0 / 0`. Production Runtime, Payment, PR, main integration, and V1-D remain unauthorized. R2-C remains `remediation_required`; `experienceProductJudgment=pending_remediation`; `jpy980RuntimeReadiness=not_established`; `globalQ0Completion=false`.

## Human / ChatGPT review request

Review the static allowlist plus actual-current-Product resolver, whole-directive fail-closed behavior, value non-disclosure, and recognized-root end-to-end regression. R1 recovery lifecycle, attempt budget, exact draft, Prompt authority, and V14 parity remain regression scope. Do not mark V1-C accepted until this correction receives both Human and ChatGPT review.
