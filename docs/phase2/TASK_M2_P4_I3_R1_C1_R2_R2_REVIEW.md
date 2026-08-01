# M2-P4-I3-R1-C1-R2-R2 Review

## Status

- Task: M2-P4-I3-R1-C1-R2-R2 Four-Case Bounded Provider Diagnostic
- Status: human_chatgpt_reviewed_fail_complete
- Authorization: M2-P4-I3-R1-C1-R2-R2-2026-08-02
- Confirmation: R2-R2-4-CALL-PROMPT-V6-SYNTHETIC-ONLY
- Baseline: fbb315f45e777fe2001e54657d7015ebbf7d3663
- Branch: test/m2-p4-i3-r1-c1-r2-r2-four-case-provider-diagnostic
- Commit A: 36e7d1967a502f0ed80aaccb12d44507f0058560
- Commit B: 2cb243486063ba9235f4f3ce65f051cf5fd38d6e
- Exact diagnostic snapshot: 17/17
- Exact review sync scope: 8/8
- Model / stage: gpt-5.6-luna / PB-01 v6 only
- Synthetic cases / authorized Provider calls: 4 / 4
- Actual / maximum Provider calls: 4 / 4
- Retry / repair / fallback: 0 / 0 / 0
- PB-02 through PB-06 / DB / Supabase / holdout / real-user data: 0 / 0 / 0 / 0 / 0
- Authorization consumed / rerun authorized: true / false
- Execution protocol accepted: true
- Diagnostic evidence valid: true
- Targeted repairs evidence accepted: true
- Provider product gate passed: false
- Provider quality established: false
- Full eight-case confirmation required: true
- Active Runtime changed: false
- C2 eligible / authorized: false / false
- Next candidate: M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision
- Next candidate authorized: false
- main: unchanged at 61e33a10e195fad17e253a6b9719217e1992f273

## Human / ChatGPT review

- [x] The bounded execution protocol is accepted.
- [x] The immutable diagnostic evidence is valid.
- [x] The three targeted-repair cases are accepted as 3 / 3 PASS.
- [x] Principal quoted ownership and ownership sequence control are PASS.
- [x] The frozen normal control and overall targeted verdict remain FAIL.
- [x] Decision Facts semantic completeness is FAIL.
- [x] Provider product quality is not established.
- [x] No rerun or C2 authorization is granted.

The final review status is human_chatgpt_reviewed_fail_complete. Review completion accepts the execution protocol and targeted-repair evidence; it does not rewrite the frozen verdict or accept Provider product quality.

## Immutable diagnostic snapshot

- Type: historical_commit_range
- Base commit: fbb315f45e777fe2001e54657d7015ebbf7d3663
- End commit: 2cb243486063ba9235f4f3ce65f051cf5fd38d6e
- Exact paths: 17/17
- Immutable snapshot: true
- Include working tree: false
- Execution commits: 36e7d1967a502f0ed80aaccb12d44507f0058560, 2cb243486063ba9235f4f3ce65f051cf5fd38d6e

Commit B is the immutable source of execution evidence. The review sync changes none of the nine execution artifacts outside its exact eight-path manifest.

## Execution result

- Overall targeted verdict: FAIL
- Cases passed: 3 / 4
- Targeted repair cases: 3 / 3 PASS
- Normal ownership regression control: 0 / 1 FAIL
- R2R2-01 known taxonomy: PASS
- R2R2-02 no-contact ownership: PASS
- R2R2-03 quoted ownership: PASS
- R2R2-04 normal control: FAIL
- Principal R2R2-03 quoted ownership: PASS
- Provider transport / exact returned model: 4/4 / 4/4
- Raw JSON / raw Schema v5: 4/4 / 4/4
- Grounded Schema v4: 4/4
- Writing Context Integrity v2 / contextual intake Integrity: 4/4 / 4/4
- Application Decision Facts: 3/4
- Provider semantic core: 4/4
- Message / boundary ownership: 4/4 / 4/4
- Candidate presence / relationship limits / privacy-repeat-injection: 4/4 / 4/4 / 4/4
- Provider output immutability / secret leakage: 4/4 / 0
- Usage input / cached / output / reasoning tokens: 26092 / 19068 / 5452 / 367
- Marker consumed: true
- Provider rerun: unauthorized and not performed
- Provider quality established: false
- Full eight-case confirmation required: true
- Active Runtime changed: false
- C2 eligible / authorized: false / false

R2R2-04 preserved the required Provider message order, grounded three-item ownership order, candidate separation, none / none boundary, Schema, and Integrity gates. Its latest direct message remained other_person / question / reasonable / not_replied. It failed the frozen Application Decision Facts gate because grounded practical_reason was none / false instead of schedule_coordination / true. The accepted classification is decision_policy_equivalent_but_semantically_incomplete; this is not an ownership regression. The frozen hard failures remain R2R2-04-APPLICATION-DECISION-FACTS and R2R2-04-NORMAL-OWNERSHIP-CONTROL.

## Review-time deterministic policy check

The check uses only the saved R2R2-04 grounded Decision Facts. The actual facts are passed to buildContextualDecisionPolicyV3. A temporary in-memory comparison copy changes only practical_reason to kind schedule_coordination, active true, and deadline unknown. Both policy results are deep-equal, select reply_now, and carry reason unanswered_meaningful_message.

Policy equality is PASS for this exact case. This establishes only that the practical_reason omission does not change Decision Policy here. The comparison copy is not actual evidence; diagnostic-results, Provider output, evaluator output, and frozen verdict remain unchanged.

## Objective

This is a targeted repair diagnostic, not a broad quality run. It checked whether inactive Prompt v6 corrected exactly three accepted R2 failures: known-taxonomy precedence, Decision Facts versus Writing Signals ownership agreement, and preservation of quoted untrusted-message existence and authorship. A fourth preserved case was a normal three-message ownership regression control.

Even a 4/4 PASS establishes only those targeted repairs and the selected control. Provider quality remains unestablished, full eight-case confirmation remains required, and C2 remains ineligible and unauthorized.

## Exact case isolation

The four AssessmentInput values are copied without wording changes from old R2-03, R2-04, R2-08, and R2-06, mapped in that order to R2R2-01 through R2R2-04. Each case file object contains only case_id, name, source_case_reference, synthetic_input, and focus_tags.

The Provider receives only current_situation, optional_message, relationship, and requested_topics derived from synthetic_input. Case IDs, names, source references, focus tags, quality expectations, assertions, acceptable sets, old Provider outputs, and verdicts never enter the Provider request.

## Frozen evaluation contract

Before any Provider call, the cases, diagnostic contract, quality contract, evaluator, runner, dedicated verifier, Prompt v6, and Provider/grounded Schemas are frozen in Commit A. Privacy markers and order-immaterial changed_fact_ids are evaluated as unordered sets. Provider message_signals remain source-order-sensitive, and grounded canonical ownership remains sequence-sensitive. Empty evidence is represented as rate null and evidence_status unavailable.

If an evaluator defect appears after execution, the diagnostic becomes evaluation_blocked_pending_human_chatgpt_review. Saved Provider output is not changed, no offline re-evaluation is performed, and no Provider rerun occurs.

## One-time execution boundary

The runner requires the exact branch, a clean worktree, HEAD equal to upstream, the exact Commit A SHA supplied by CLI, the exact confirmation phrase, unconsumed authorization, absence of the R2-R2-specific marker, exact four cases, Prompt v6/catalog v7, and unchanged Active Runtime catalog v4. It atomically creates the repo-local marker immediately before the first Provider call and disables SDK retry.

Calls are sequential, exact four unless a safe fatal stop occurs, and capped at four. Retry, repair, PB-07, fallback, PB-02 through PB-06, Service, full Pipeline, DB, Supabase, holdout, and real-user data are all zero. The authorization is consumed once execution begins and rerun remains unauthorized regardless of PASS or FAIL.

## Hard gates

- R2R2-01 requires work hierarchy user_is_junior, social_role work_contact, communication_context work, no_private_contact_at_work without a custom duplicate, one incoming other-person message, no restrictive other-person/system boundary, grounded none/none, and non-null candidate profiles.
- R2R2-02 requires other-person ownership across Decision Facts, message signals, incoming profile, no-contact boundary ownership, and grounded canonical ownership, with null candidate profiles and grounded no_contact/explicit.
- R2R2-03 requires one other-person quoted_history message and one canonical grounded ownership item, retained injection detection, email and account_identifier category markers without raw values, repeated_without_material_change, empty changed facts, no restrictive boundary, and grounded none/none. This is the principal gate.
- R2R2-04 requires Provider source order sent_by_user then incoming, no Provider unsent_candidate, one Application-added unsent_candidate in third position, non-null candidate profiles, no candidate-as-incoming evidence, none/none boundary, and identical Decision Policy for question versus schedule_coordination.

All four also require exact returned model gpt-5.6-luna, raw JSON and Schema v5, grounded Schema v4, Writing Context Integrity v2, contextual intake Integrity, Application Decision Facts, zero forbidden bookkeeping, zero probability/confidence fields, zero fixture/oracle references, zero raw PII copied into writing_signals, zero secret leakage, zero expected-data injection, and zero Provider-output mutation.

## Exact mutation manifest

1. evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-cases-v1.json
2. evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-contract-v1.json
3. evals/runtime/m2-p4-i3-r1-c1-r2-r2/quality-contract-v1.json
4. evals/runtime/m2-p4-i3-r1-c1-r2-r2/authorization-v1.json
5. evals/runtime/m2-p4-i3-r1-c1-r2-r2/capabilities-v1.json
6. evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-results-v1.json
7. evals/runtime/m2-p4-i3-r1-c1-r2-r2/diagnostic-summary-v1.md
8. scripts/lib/m2-p4-i3-r1-c1-r2-r2-provider-evaluator-v1.mjs
9. scripts/run-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs
10. scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs
11. docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md
12. scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs
13. scripts/verify-m2-eval-foundation.mjs
14. scripts/verify-m2-p3-runtime-vertical-slice.mjs
15. docs/CURRENT_FOCUS.md
16. docs/WBS.md
17. docs/CODEX_HANDOFF.md

During execution from Commit A through Commit B, only authorization, capabilities, results, summary, this review, CURRENT_FOCUS, WBS, and CODEX_HANDOFF changed. Cases, contracts, evaluator, runner, dedicated verifier, Prompt, and Schemas remained frozen.

## Exact review sync manifest

1. evals/runtime/m2-p4-i3-r1-c1-r2-r2/capabilities-v1.json
2. docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_REVIEW.md
3. scripts/verify-m2-p4-i3-r1-c1-r2-r2-provider-diagnostic.mjs
4. scripts/verify-m2-eval-foundation.mjs
5. scripts/verify-m2-p3-runtime-vertical-slice.mjs
6. docs/CURRENT_FOCUS.md
7. docs/WBS.md
8. docs/CODEX_HANDOFF.md

The review sync is exact 8/8. It adds Provider calls 0 and changes no authorization, results, summary, cases, contracts, quality contract, evaluator, runner, Prompt v6, catalog v7, Schema, or Production code. Active Runtime and main remain unchanged.

## Review boundary

Commit A records the prepared one-time package. Commit B records only actual evidence and its exact eight-path post-run synchronization. Human / ChatGPT review is complete with the targeted verdict fixed at FAIL. No Prompt or Schema repair, Provider rerun, Runtime activation, C2, E1, PR, main merge, release, or successor implementation is authorized. The next candidate is M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision, and it remains unauthorized.
