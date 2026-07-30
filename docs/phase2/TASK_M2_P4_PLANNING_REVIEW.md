# Task M2-P4 Planning Review

## Review identity

- Task: `M2-P4 Quality Evaluation Planning Package`
- Original draft preflight commit: `40cce204d865b02a58ccea20c9516b581773487a`
- Revalidated base commit: `5dcfbf6a693345832e15ebd61f9d0fc7c989e5c2`
- Branch: `docs/m2-p4-quality-evaluation-plan`
- Task type: planning only
- Package state: prepared for Human / ChatGPT review
- Human / ChatGPT acceptance: pending
- Quality execution: not started
- OpenAI calls for this task: `0`
- DB operations for this task: `0`
- Achieved quality score: none claimed

## Exact review manifest

New:

1. `docs/phase2/M2_P4_QUALITY_EVALUATION_PLAN.md`
2. `docs/phase2/TASK_M2_P4_PLANNING_REVIEW.md`
3. `evals/quality/m2-p4-baseline-001.json`
4. `evals/quality/m2-p4-product-rubric-v1.json`
5. `evals/quality/m2-p4-representative-sample-v1.json`

Updated:

6. `docs/CURRENT_FOCUS.md`
7. `docs/WBS.md`
8. `docs/CODEX_HANDOFF.md`

Every other path must remain unchanged.

## Revalidation after historical-boundary correction

- The initial verifier failure was a structural successor-boundary defect in the M2-P3 historical verifier, not a failure of the M2-P4 planning content.
- The M2-P3 historical-boundary correction is anchored at commit `5dcfbf6a693345832e15ebd61f9d0fc7c989e5c2`.
- No waiver was used.
- The restored package was revalidated against that base commit without redesigning its planning content.
- Human / ChatGPT planning acceptance remains pending.

## Review finding 1 — primary root cause

The accepted policy in `docs/phase2/M2_P1_DECISION_POLICY.md` gives `reply_now` priority when the other person sent a meaningful direct message that reasonably calls for a response and the user has not replied.

The current implementation in `lib/assessment/runtime/policy.ts` instead selects `wait_and_reassess` whenever `currentSituation` contains any of `返信`, `未読`, `既読`, `待`, `時間前`, `昨日`, or `今夜`, after only the explicit-boundary check. It then exposes that decision as a singleton allowed set.

The confirmed live case matched that keyword condition. PB-04 could not select `reply_now` because application policy did not allow it. The planning package therefore records `RUNTIME_DECISION_POLICY_DIVERGENCE` as the confirmed primary root cause and places deterministic policy alignment before Prompt tuning.

Reviewer decision:

- [ ] accept the root-cause diagnosis;
- [ ] request a planning correction; or
- [ ] reject the diagnosis with a concrete conflicting Repo fact.

## Review finding 2 — Baseline-001

`M2P4-LIVE-001` records:

- source code commit `66ab02c566d61d0c563e26e3d2c5fb23f6500d45`;
- matching-app context and two meetings;
- incoming message `今日は楽しかった。また都合が合えば行こう`;
- user not yet replied;
- exact Human-approved synthetic reproduction input at `evals/quality/m2-p4-baseline-001.json#/synthetic_reproduction_input`;
- proposed reply text included in that fixture;
- requested topics are decision timing and draft message;
- observed decision `wait_and_reassess`;
- expected decision `reply_now`; and
- the nine fixed quality-defect codes.

The exact fixture makes the same case reproducible in a separately authorized E1. It is a Human-provided synthetic case, not a raw DB export or a claim that the exact input was retrieved from the DB. The baseline contains no full DB UUID, no run/request prefix, no raw DB content, no raw provider payload, and no secret.

Reviewer decision:

- [ ] accept `M2P4-LIVE-001` as the fixed M2-P4 quality baseline; or
- [ ] request a bounded baseline correction.

## Review finding 3 — diagnostic sample boundary

The exact ordered sample is:

1. `M2P4-LIVE-001`
2. `REPLY-004`
3. `REPLY-002`
4. `REPLY-003`
5. `SEND-002`
6. `SEND-004`
7. `WAIT-001`
8. `WAIT-003`
9. `PAUSE-001`
10. `PAUSE-004`
11. `INFO-001`
12. `SAFETY-001`

This is a ten-ready-case plus two-control diagnostic sample. It is not the formal G5 Human review sample.

Reviewer decision:

- [ ] accept the fixed diagnostic sample;
- [ ] confirm `evals/development/human-review-sample-v1.json` remains the immutable formal 20-case G5 sample; and
- [ ] confirm holdout remains external, unused, and untouched.

## Review finding 4 — rubric and future gate

The rubric has eleven unique hard-fail codes and eleven unique five-point product axes. Hard fails are non-compensable. The future representative-run gate requires:

- exact ready-case decision `10/10`;
- hard fails `0`;
- required drafts present;
- per-ready-case `emotional_attunement >= 4`;
- per-ready-case `selected_request_fulfillment >= 4`;
- overall product-axis average `>= 4.2`;
- `jpy_980_value >= 4` on at least `9/10` ready cases;
- exact `INFO-001 -> needs_more_information`;
- exact `SAFETY-001 -> safety_blocked`; and
- holdout use `0`.

Reviewer decision:

- [ ] accept the hard-fail catalog;
- [ ] accept the five-point axes and scoring rules; and
- [ ] accept the future representative-run gate without treating it as achieved.

## Review finding 5 — renderer disposition gate

The current report-content Schema requires seven fields that `RuntimeAssessmentNote` does not directly render:

- `observed_fact_commentary`
- `anxiety_reframe`
- `action_rationales`
- `message_draft_context`
- `three_day_plan_commentary`
- `change_condition_commentary`
- `unknowns_commentary`

`M2-P4-I2` must decide, field by field, whether to display, integrate, or deprecate each field through a versioned successor Schema. This planning package makes no renderer or Schema change.

Reviewer decision:

- [ ] accept the visibility-gap diagnosis and the future disposition gate.

## Review finding 6 — I1 anti-overfit and typed decision-material facts

Future `M2-P4-I1` must not classify decisions directly from raw consultation prose by keyword or regular-expression matching. Case-ID branches, exact fixture-phrase matching, embedded oracle wording, and a lookup table fitted only to the 40 decision cases are prohibited.

I1 must explicitly define or identify application-owned typed decision-material facts covering relationship stage, latest meaningful direct sender, exact incoming/outgoing message state, whether the user already replied, unanswered user-message count, elapsed time and usual cadence, explicit boundary, practical deadline or promised information, the user's immediate goal, and whether the signal is only an SNS reaction.

At I1 start, the current validated Structured Intake contract must be checked for deterministic and stable sufficiency. If it cannot provide the required facts, I1 must stop and return a bounded proposal for a versioned successor decision-fact contract; no heuristic workaround and no unauthorized Prompt or Schema change are allowed.

The I1 execution boundary is OpenAI API calls `0`, DB operations `0`, migration operations `0`, Prompt modifications `0`, and holdout use `0`. Its acceptance target is exact decision `40/40`, each category `10/10`, allowed-set violations `0`, forbidden decisions `0`, case-specific matching `0`, and relevant counterfactual or contrast-direction regressions `0`.

Reviewer decision:

- [ ] accept the anti-overfit prohibitions;
- [ ] accept the typed decision-material-fact requirement and current-contract stop rule; and
- [ ] accept the zero-call/zero-DB execution boundary and exact decision targets.

## Unauthorised future sequence

Planning acceptance does not authorize:

- `M2-P4-I1 Decision Policy Runtime Alignment`;
- `M2-P4-I2 Report Information Architecture and Intent Fulfillment`;
- `M2-P4-I3 PB-04 / PB-05 / PB-06 Product Quality Revision`;
- `M2-P4-E1` 12-case diagnostic execution; or
- `M2-P4-E2` 70-case regression and frozen 20-case Human review.

After planning acceptance, `M2-P4-I1` is the next candidate for separate authorization. It must align deterministic allowed-set construction to the accepted M2-P1 policy through typed decision-material facts, satisfy Review finding 6, and make no Prompt change.

## Prohibited-scope confirmation

- [x] Runtime implementation is outside this planning package.
- [x] Prompt change is outside this planning package.
- [x] Schema change is outside this planning package.
- [x] API execution is outside this planning package.
- [x] DB query/write and migration work are outside this planning package.
- [x] New verifier, package, or code is outside this planning package.
- [x] Frozen G5 sample mutation is outside this planning package.
- [x] Holdout use or mutation is outside this planning package.
- [x] PR creation and merge to `main` are outside this planning package.

## Required repository validation

Run sequentially before commit:

1. `node scripts/verify-m2-eval-foundation.mjs`
2. `node scripts/verify-m2-p3-runtime-vertical-slice.mjs`
3. parse all three new JSON files with `JSON.parse`
4. assert exact sample IDs/count, baseline decisions, uniqueness, and frozen-sample/holdout preservation
5. `git diff --check`
6. `git diff --name-only`
7. `git status --short`

Automated PASS is repository evidence only. It does not substitute for the pending Human / ChatGPT review and does not authorize quality execution.

## Final review disposition

- [ ] Accept the M2-P4 planning package only.
- [ ] Request bounded corrections within the same eight-file manifest.
- [ ] Reject and preserve M2-P3 as the last accepted state.

Until one option is explicitly selected, M2-P4 planning acceptance remains pending, quality execution remains not started, and no API or Prompt modification is authorized.
