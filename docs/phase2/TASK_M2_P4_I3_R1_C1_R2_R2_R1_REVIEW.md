# M2-P4-I3-R1-C1-R2-R2-R1 Review

## Status

- Task: `M2-P4-I3-R1-C1-R2-R2-R1 Offline Practical Reason Consistency Revision`
- Status: `human_chatgpt_accepted_complete`
- Human / ChatGPT review result: `OFFLINE PRACTICAL REASON REVISION ACCEPTED COMPLETE`
- Offline practical-reason revision accepted: `true`
- Accepted implementation commit: `b65af5303d0f1514742b794a00ce35f5c4a99bf4`
- Immutable implementation snapshot: `33a91f00be9f71fa533c9635d30425dc23914d81..b65af5303d0f1514742b794a00ce35f5c4a99bf4` (`13/13` exact paths; working tree excluded)
- Baseline: `33a91f00be9f71fa533c9635d30425dc23914d81`
- Branch: `feat/m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency`
- Exact scope: `13/13`
- Acceptance synchronization exact scope: `8/8`
- Targeted repairs preserved: `3/3`
- Ownership sequence preserved: `true`
- Provider calls / Provider outputs mutated: `0 / 0`
- DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0`
- Provider quality established: `false`
- Final eight-case confirmation required: `true`
- Final eight-case confirmation authorized: `false`
- Active Runtime changed: `false`
- C2 eligible / authorized: `false / false`
- Next candidate: `M2-P4-I3-R1-C1-R3 Final Eight-Case PB-01 Provider Confirmation`
- Next candidate authorized: `false`

This accepted slice is an offline Prompt-contract revision based only on immutable saved R2-R2 evidence. It does not rerun any Provider case, establish Provider quality, activate a Runtime catalog, authorize C2 or E1, or alter `main`.

## Accepted findings

- Prompt v7 `practical_reason` consistency: accepted
- Concrete current-situation schedule evidence requirement: accepted
- `question` / `schedule_coordination` taxonomy equivalence: accepted when the practical function is preserved
- `optional_message` cannot manufacture an incoming practical reason: accepted
- Targeted repairs preserved: `3/3`
- Ownership sequence preserved: `true`
- Prompt v6 unchanged: confirmed
- Catalog v7 unchanged: confirmed
- R2-R2 evidence unchanged: confirmed
- Provider calls / Provider outputs mutated: `0 / 0`
- Candidate catalog v8 inactive: `true`
- Active Runtime changed: `false`

This acceptance does not establish Provider quality, an eight-case PASS, Runtime activation eligibility, or C2 eligibility.

## Objective and accepted evidence boundary

The accepted R2-R2 record remains unchanged. The three targeted repairs remain `3/3 PASS`, principal quoted ownership and ownership sequence remain successful, and the frozen four-case result remains historical evidence rather than a result rewritten by this task.

The saved control recognized an incoming other-person question and preserved ownership. Its latest direct message was typed as `other_person / question / reasonable / not_replied`; the incoming profile contained a question and an answer obligation; the candidate intent contained `confirm_schedule`. The same output nevertheless projected `practical_reason` as `none / false`. That omission is semantically incomplete even though the review-time actual and comparison Decision Policies were deep-equal at `reply_now / unanswered_meaningful_message`.

Prompt v7 addresses only this semantic inconsistency. It does not change Application grounding, the Writing Signals contract, the Decision Facts evidence guard, Integrity v2, Decision Policy, Pipeline, Service, UI, Supabase, or accepted diagnostic evidence.

## Prompt v7 contract

### Evidence-backed schedule coordination

When the latest other-person message explicitly asks about a date, day of the week, time, availability, rescheduling, meeting timing, or another concrete schedule choice and requires a schedule-related response, Prompt v7 requires `practical_reason.kind=schedule_coordination` and `practical_reason.active=true`.

The latest message kind may remain either `question` or `schedule_coordination` when semantically supported. The taxonomy difference is allowed only while the concrete scheduling function remains represented.

### Cross-projection agreement

The existing consistency account now expressly covers:

1. `decision_facts.latest_direct_message`
2. `decision_facts.practical_reason`
3. `writing_signals.message_signals`
4. `writing_signals.incoming_message_profile`
5. `writing_signals.candidate_communicative_intent`
6. `writing_signals.boundary_ownership_signals`

An incoming schedule question with a reasonable response expectation cannot coexist with `practical_reason none / false`. An incoming `confirm_schedule` requirement must agree with `schedule_coordination / true`. A candidate's schedule content alone cannot manufacture an incoming practical reason. PB-01 remains extraction-only and does not select or change Decision Policy.

### No over-inference

Prompt v7 requires current-situation evidence of an actual scheduling question, concrete choice, obligation, change, or coordination need. An invitation, romantic relationship, wish to send a message, vague future meeting, or candidate-only date is insufficient by itself. `optional_message` cannot create the incoming practical reason.

The rule is semantic. Prompt v7 adds no raw consultation-prose regex, language-specific Application classification, diagnostic case ID, fixture/oracle content, or benchmark wording. The final internal checklist is updated without requesting or exposing private chain-of-thought.

## Candidate version boundary

- PB-01 Prompt: `pb-01-structure-v7` / `v7.0.0`
- Catalog: `runtime-stage-catalog-v8.0.0`
- Prompt bundle: `prompt-bundle-runtime-v8.0.0`
- Provider Schema: unchanged `pipeline-schema-v5.0.0`
- Candidate Runtime schema set: unchanged `pipeline-schema-runtime-v3.2.0`
- Grounded Schema: unchanged `pipeline-schema-v4.0.0`
- PB-02 through PB-06: deep-equal to catalog v7
- Candidate catalog: inactive
- Active Service: unchanged catalog v4 / prompt bundle v4 / schema set v3

## Immutable evidence boundary

Prompt v6 and catalog v7 remain unchanged. The nine R2-R2 execution artifacts and the three non-overlapping review records remain unchanged from baseline `33a91f00be9f71fa533c9635d30425dc23914d81`. Saved Provider outputs, diagnostic results, authorization, summary, evaluator, runner, prior verifier, capability record, and review document are neither altered nor regenerated.

Provider calls are `0`. Provider outputs mutated are `0`. The Application, Policy, Pipeline, Service, UI, Supabase, active catalog v4, accepted diagnostic evidence, and `main` remain unchanged.

## Automated validation

Validated sequentially:

1. `node scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs`
2. `node scripts/verify-m2-eval-foundation.mjs`
3. `node scripts/verify-m2-p3-runtime-vertical-slice.mjs`
4. `node evals/quality/m2-p4-i1/verify-decision-policy.mjs`
5. `npm run typecheck`
6. `npm run lint`
7. `npm run build`

The required implementation gates cover acceptance sync `8/8`, immutable implementation scope `13/13`, non-sync implementation blobs unchanged, Canonical Suite `64/64`, Policy `40/40`, Prompt v6/v7 and catalog v7/v8 immutability, R2-R2 evidence immutability, PB-02 through PB-06 parity, zero Provider calls/output mutations, active Runtime and `main` immutability, C2 non-authorization, protected Production diff `0`, and `git diff --check`.

Verified result: acceptance sync `8/8`, immutable implementation scope `13/13`, non-sync implementation blobs unchanged `5/5`, Prompt v6/v7 unchanged, catalog v7/v8 unchanged, R2-R2 execution/review evidence unchanged `9/9` and `3/3`, Provider calls / outputs mutated `0 / 0`, Canonical Suite `64/64`, decision Policy `40/40`, active Runtime unchanged, C2 unauthorized, protected diff `0`, and `git diff --check` PASS.

These automated results support only the accepted offline revision boundary. They do not establish Provider quality, an eight-case PASS, Runtime activation eligibility, or C2 eligibility, and they do not authorize the final eight-case Provider confirmation.

## Immutable implementation manifest

1. `lib/assessment/runtime/contracts/pb-01-structure-v7.developer.md`
2. `lib/assessment/runtime/contracts/runtime-stage-catalog-v8.json`
3. `evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/practical-reason-consistency-contract-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/offline-analysis-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/capabilities-v1.json`
6. `scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs`
7. `docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_R1_REVIEW.md`
8. `lib/assessment/runtime/schema-catalog.ts`
9. `scripts/verify-m2-eval-foundation.mjs`
10. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
11. `docs/CURRENT_FOCUS.md`
12. `docs/WBS.md`
13. `docs/CODEX_HANDOFF.md`

## Exact acceptance-sync manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r2-r2-r1/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R2_R1_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-c1-r2-r2-r1-practical-reason-consistency.mjs`
4. `scripts/verify-m2-eval-foundation.mjs`
5. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
6. `docs/CURRENT_FOCUS.md`
7. `docs/WBS.md`
8. `docs/CODEX_HANDOFF.md`

The other five implementation paths remain content-identical to accepted implementation commit `b65af5303d0f1514742b794a00ce35f5c4a99bf4`. This `8/8` synchronization does not extend or rewrite the immutable `13/13` implementation snapshot.

## Acceptance statement

Human / ChatGPT accepted complete. This acceptance establishes only the offline practical-reason Prompt-contract revision, inactive candidate catalog construction, and immutable evidence preservation. It does not establish Provider quality, an eight-case PASS, Runtime activation eligibility, C2 eligibility, final I3 acceptance, merge to `main`, or Milestone 2 completion.

Automated PASS does not authorize the final eight-case Provider confirmation, Runtime activation, C2, E1, PR, main merge, release, or force push. `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`.
