# Task M2-P4-I1-A Review — Typed Decision Facts & Pure Policy Reference

## Status

- Task type: executable contract/reference implementation.
- Main baseline: `3ae93c0d3d9af3e1eccc0b5e53d9b2bca5b93c42`.
- Branch: `feat/m2-p4-i1-a-typed-decision-policy`.
- Implementation and automated validation: complete.
- Accepted implementation commit: `27752471caa644b569a08a4587ddf677195c203a`.
- Human / ChatGPT acceptance: accepted and complete.
- Milestone 2: incomplete.

## Authorized Scope

The authorized mutation manifest is exactly eight files:

1. `evals/quality/m2-p4-i1/decision-facts.schema.json`
2. `evals/quality/m2-p4-i1/decision-facts-fixtures-v1.json`
3. `evals/quality/m2-p4-i1/decision-policy-v2.mjs`
4. `evals/quality/m2-p4-i1/verify-decision-policy.mjs`
5. `docs/phase2/TASK_M2_P4_I1_A_REVIEW.md`
6. `docs/CURRENT_FOCUS.md`
7. `docs/WBS.md`
8. `docs/CODEX_HANDOFF.md`

No ninth path is authorized.

## Purpose and Contract Decision

The current Structured Intake contract does not carry the complete typed decision-material facts needed to replace raw consultation-prose classification safely. Therefore this slice does not modify or activate `lib/assessment/runtime/policy.ts`. It first proves an application-owned typed facts contract and a pure deterministic reference policy against all existing decision cases.

The Draft 2020-12 facts Schema:

- rejects additional properties at every data-object boundary;
- requires relationship, selected-request, latest-direct-message, contact, boundary, practical-reason, and information-completeness facts;
- permits bounded nullable contact counts/timing where those facts are not material;
- requires `information_state.complete_for_decision=true`; and
- contains no confidence, probability, or romantic-interest score.

## Pure Policy Order

`selectDecisionPolicy(facts)` uses only the typed facts and applies this order:

1. explicit boundary or repeated unanswered contact -> `pause_additional_contact`;
2. unanswered meaningful incoming direct message -> `reply_now`;
3. clear low-pressure practical reason -> `send_now`; and
4. otherwise -> `wait_and_reassess`.

Each result contains exactly one allowed decision, the other three decisions with reason codes, draft policy, later-draft mode, follow-up exception, pause reason, resume policy, and top-level reason codes.

The implementation has no case-ID lookup, fixture-identity switch, raw consultation text, Japanese-body keyword/regex classification, model input, network access, DB access, or environment access.

## Human-Owned Evaluation Projection

`decision-facts-fixtures-v1.json` is an evaluation-only Human-owned projection:

- `REPLY-001` through `REPLY-010`: 10;
- `SEND-001` through `SEND-010`: 10;
- `WAIT-001` through `WAIT-010`: 10;
- `PAUSE-001` through `PAUSE-010`: 10; and
- total: 40, each exactly once in stable development-index order.

Each fixture stores only `case_id`, `source_file`, the verifier-only expected decision, and typed facts. It does not duplicate full consultation prose or reference drafts, is not model input, is not imported by runtime, and does not pass the oracle to the policy.

## Automated Evidence

The dedicated verifier:

- parses the Schema, fixtures, and four development decision files;
- proves exact ID/order/source/oracle correspondence;
- performs strict deterministic Schema-equivalent validation;
- passes only `entry.facts` into the pure policy;
- proves one allowed decision, the other three disallowed decisions, draft semantics, follow-up semantics, and pause/resume semantics; and
- rejects case-specific matching, non-built-in dependencies, network/DB/environment access, and holdout use.

Recorded result:

```text
M2_P4_I1_TYPED_POLICY: PASS
total: 40/40
reply_now: 10/10
send_now: 10/10
wait_and_reassess: 10/10
pause_additional_contact: 10/10
allowed_set_violations: 0
forbidden_decisions: 0
case_specific_matching: 0
openai_calls: 0
db_operations: 0
holdout_use: 0
```

Required regression validation passed for the M2 evaluation foundation, the M2-P3 Runtime Vertical Slice, both new JSON files, protected-asset diff `0`, the exact eight-file scope, and `git diff --check`.

## Final Disposition

M2-P4-I1-A only is Human / ChatGPT accepted and complete at accepted implementation commit `27752471caa644b569a08a4587ddf677195c203a`. The typed facts contract, pure deterministic reference policy, Human-owned 40-case projection, exact decision result 40/40, each category 10/10, allowed-set violations `0`, forbidden decisions `0`, case-specific matching `0`, OpenAI calls `0`, and DB operations `0` are accepted.

## Boundaries and Acceptance Meaning

- Live runtime: unchanged.
- Current `lib/assessment/runtime/policy.ts`: unchanged.
- PB-01 Prompt assets: unchanged.
- Historical `ai/schemas/**` assets: unchanged.
- OpenAI calls: `0`.
- DB operations: `0`.
- Holdout use: `0`.
- Frozen G5 sample: unchanged.
- Existing development cases and their oracles: unchanged.

Acceptance proves the reference policy. Actual app behavior is not changed yet, and provider/model quality is not proven. The exact 40/40 offline decision proof does not establish runtime extraction/integration, Human G5 scoring, holdout quality, production readiness, or Milestone 2 completion.

The next candidate is `M2-P4-I1-B Runtime Extraction/Integration Design`. I1-B remains unauthorized and not started; runtime integration and all API, DB, Prompt, and Schema work remain not started. No new implementation authority is active.
