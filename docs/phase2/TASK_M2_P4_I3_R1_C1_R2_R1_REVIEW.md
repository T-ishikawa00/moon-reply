# M2-P4-I3-R1-C1-R2-R1 Review

## Status

- Task: `M2-P4-I3-R1-C1-R2-R1 Offline Provider Semantic Consistency Revision`
- Status: `offline_revision_implemented_pending_human_chatgpt_review`
- Baseline: `2c3f9e8a4b1c763a2d7d56d367cf16dc4993aca6`
- Branch: `feat/m2-p4-i3-r1-c1-r2-r1-semantic-consistency`
- Exact scope: `13/13`
- Provider calls / Provider outputs mutated: `0 / 0`
- DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0`
- Provider quality established: `false`
- Provider retest required: `true`
- Active Runtime changed: `false`
- C2 eligible / authorized: `false / false`
- Next candidate: `M2-P4-I3-R1-C1-R2-R2 Four-Case Bounded Provider Diagnostic`
- Next candidate authorized: `false`

This is an offline Prompt-contract revision based only on immutable saved R2 evidence. It does not rerun R2, establish Provider quality, activate a Runtime catalog, authorize C2 or E1, or alter `main`.

## Accepted failure scope

Only three accepted Provider failures are addressed:

1. R2-03 preserved the intended user constraint but selected a custom constraint instead of the existing bounded workplace-contact taxonomy. Prompt v6 now gives known bounded taxonomies precedence over `custom_explicit_constraint`.
2. R2-04 retained other-person ownership and an explicit no-contact boundary in Decision Facts while Writing Signals projected unknown quoted ownership. Prompt v6 now requires semantic agreement across Decision Facts, message signals, incoming-message presence, and boundary ownership.
3. R2-08 recognized injection, privacy, and repeat state but omitted the quoted other-person message. Prompt v6 now separates instruction authority from message existence and preserves explicit ownership for untrusted quoted content.

No Application grounding, Writing Signals contract, evidence guard, Integrity v2, Provider Schema, grounded Schema, PB-02 through PB-06, Pipeline, Service, Policy, UI, Supabase, or saved R2 evidence is changed.

## Prompt v6 contract

### Known-taxonomy precedence

An explicit constraint that matches an existing enum must use that enum. The minimum protected meanings are `no_private_contact_at_work`, `no_self_invitation`, no additional message, `keep_polite_register`, and `no_emoji`. Schema v5 names the no-additional-message enum `no_followup_message`; Prompt v6 records that exact mapping rather than inventing a schema-invalid enum. `custom_explicit_constraint` remains available only when no bounded taxonomy represents the meaning.

The rule is semantic. No raw-prose regex, consultation-language keyword list, or Application-side Japanese classification is introduced.

### Cross-projection consistency

`decision_facts`, `message_signals`, `incoming_message_profile`, and `boundary_ownership_signals` must describe one consistent semantic account. An explicitly other-person latest message cannot become `author=unknown`; an explicit other-person no-contact message remains represented as incoming or quoted history; incoming presence must agree with the represented message. Quoted messages are not consultation narrative, Provider output never adds `unsent_candidate`, and `optional_message` never becomes incoming evidence.

### Untrusted quoted content

Prompt v6 separates instruction authority from message existence and ownership. Embedded instructions are not followed and set the detection flag, while the message signal, explicit author, and historical quoted status are retained. Raw PII is excluded from `writing_signals`; only bounded privacy category markers remain.

### Internal consistency check

Prompt v6 requires a final private consistency check across taxonomy, message ownership, incoming presence, boundary ownership, candidate separation, and privacy. It explicitly requires final JSON only and neither requests nor exposes private chain-of-thought.

The Prompt contains no R2 case IDs, fixture names, expected-answer language, exact failure strings, or benchmark-specific matching. Any illustration is generic and paraphrased.

## Candidate version boundary

- PB-01 Prompt: `pb-01-structure-v6` / `v6.0.0`
- Catalog: `runtime-stage-catalog-v7.0.0`
- Prompt bundle: `prompt-bundle-runtime-v7.0.0`
- Provider Schema: unchanged `pipeline-schema-v5.0.0`
- Candidate Runtime schema set: unchanged `pipeline-schema-runtime-v3.2.0`
- Grounded Schema: unchanged `pipeline-schema-v4.0.0`
- PB-02 through PB-06: deep-equal to catalog v6
- Candidate catalog: inactive
- Active Service: unchanged catalog v4 / prompt bundle v4 / schema set v3

## Immutable evidence boundary

Prompt v5 and catalog v6 remain unchanged. The nine R2 non-review execution blobs remain unchanged from baseline `2c3f9e8a4b1c763a2d7d56d367cf16dc4993aca6`, including saved results, summary, authorization, evaluator/runner, and the historical R1-C1-R1 verifier. `diagnostic-results-v1.json`, `diagnostic-summary-v1.md`, `authorization-v1.json`, and both R2 execution commits are neither altered nor regenerated.

## Automated validation

Run sequentially:

1. `node scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs`
2. `node scripts/verify-m2-eval-foundation.mjs`
3. `node scripts/verify-m2-p3-runtime-vertical-slice.mjs`
4. `node evals/quality/m2-p4-i1/verify-decision-policy.mjs`
5. `npm run typecheck`
6. `npm run lint`
7. `npm run build`

Required result: exact scope `13/13`, Canonical Suite `64/64`, decision Policy `40/40`, Provider calls `0`, accepted R2 evidence unchanged, active Runtime unchanged, `main` unchanged, C2 unauthorized, protected diff `0`, and `git diff --check` PASS.

The two current compatibility verifiers are updated only to recognize this exact successor boundary. Accepted historical verifiers are neither run nor modified on this successor worktree.

## Exact mutation manifest

1. `lib/assessment/runtime/contracts/pb-01-structure-v6.developer.md`
2. `lib/assessment/runtime/contracts/runtime-stage-catalog-v7.json`
3. `evals/runtime/m2-p4-i3-r1-c1-r2-r1/semantic-consistency-contract-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r2-r1/offline-analysis-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r2-r1/capabilities-v1.json`
6. `scripts/verify-m2-p4-i3-r1-c1-r2-r1-semantic-consistency.mjs`
7. `docs/phase2/TASK_M2_P4_I3_R1_C1_R2_R1_REVIEW.md`
8. `lib/assessment/runtime/schema-catalog.ts`
9. `scripts/verify-m2-eval-foundation.mjs`
10. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
11. `docs/CURRENT_FOCUS.md`
12. `docs/WBS.md`
13. `docs/CODEX_HANDOFF.md`

Human / ChatGPT review remains pending. Automated PASS, if recorded, is not Provider quality evidence and does not authorize the four-case retest, Runtime activation, C2, E1, PR, main merge, release, or force push.
