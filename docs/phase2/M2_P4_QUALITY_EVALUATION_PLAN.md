# M2-P4 Quality Evaluation Plan

## 1. Status and authority

- Plan version: `m2-p4-quality-evaluation-plan-v1.0.0`
- Original draft preflight commit: `40cce204d865b02a58ccea20c9516b581773487a`
- Revalidated base commit: `5dcfbf6a693345832e15ebd61f9d0fc7c989e5c2`
- Planning branch: `docs/m2-p4-quality-evaluation-plan`
- State: planning package in progress; Human / ChatGPT review pending
- Quality execution: not started
- OpenAI calls for this planning task: `0`
- DB operations for this planning task: `0`
- Achieved quality score claimed by this task: none

This task is planning only. It authorizes the five new planning/evaluation assets and the three current-state document updates in its exact mutation manifest. It does not authorize or perform runtime implementation, Prompt change, Schema change, verifier or package creation, API execution, DB access, migration work, model execution, or holdout use.

Planning acceptance will accept only the diagnosis, baseline, sample, rubric, and bounded future sequence. It will not authorize any future slice. After planning acceptance, the next candidate slice is `M2-P4-I1 Decision Policy Runtime Alignment`, subject to separate explicit authorization.

## 2. Purpose and product direction

The M2-P3 synthetic live E2E established bounded local operability, persistence, and rendering. It did not establish product quality. M2-P4 fixes the confirmed quality baseline and defines how later, separately authorized work will improve and evaluate:

- decision validity;
- emotional attunement;
- practical usefulness of the written response;
- case individuality; and
- value appropriate to a JPY 980 one-off report.

The required product direction is:

- 優しいが曖昧ではない
- 気持ちを受け止めるが不安を煽らない
- 相手の本心は断定しない
- 相談者の次の行動は明確にする

## 3. Confirmed diagnosis

### A. Accepted policy

`docs/phase2/M2_P1_DECISION_POLICY.md` defines an ordered application policy:

1. Safety;
2. information sufficiency;
3. explicit boundary or repeated unanswered contact;
4. unanswered meaningful message from the other person;
5. clear, low-pressure reason to initiate; and
6. wait and reassess.

Under rule 4, when the other person has sent a meaningful direct message or question that reasonably calls for a response and the user has not yet answered, the allowed decision is `reply_now`. An SNS reaction alone does not qualify.

`wait_and_reassess` is the fallback only when no earlier pause, reply, or send rule applies and no new material fact supports additional contact tonight. Missing decision-material information must not be disguised as waiting.

### B. Runtime divergence and primary root cause

The current `lib/assessment/runtime/policy.ts` implementation does not implement that accepted ordering. After an explicit-boundary check, it tests `currentSituation` against:

`返信|未読|既読|待|時間前|昨日|今夜`

The presence of any one of those terms selects `wait_and_reassess` and constructs a singleton allowed set containing only that decision. The implementation does not first determine whether an unanswered meaningful incoming message requires `reply_now`.

The confirmed synthetic live E2E matched the keyword condition. PB-04 was required to choose within the application-owned allowed set and therefore could not choose `reply_now`. The confirmed primary root cause is `RUNTIME_DECISION_POLICY_DIVERGENCE`: deterministic allowed-set construction diverges from the accepted M2-P1 policy. Prompt tuning is not the first corrective action and is prohibited in `M2-P4-I1`.

### C. Canonical oracle

`evals/development/reply-now.json` case `REPLY-004` records:

- after a date, the other person sends `今日はありがとう。楽しかった。また行こう`;
- the user has not replied;
- exact expected decision: `reply_now`;
- required draft policy: `required_now`; and
- no allowed alternate decision.

Its required reasoning meanings are:

- `感謝に応答する自然な場面`;
- `短く好意的に返せる`; and
- `返信を遅らせる合理的理由がない`.

The oracle remains canonical. A runtime or model miss does not justify changing it.

### D. Renderer visibility gap

`ai/schemas/report-content.schema.json` requires the following generated fields, and the `ReportContent` type preserves them:

- `observed_fact_commentary`
- `anxiety_reframe`
- `action_rationales`
- `message_draft_context`
- `three_day_plan_commentary`
- `change_condition_commentary`
- `unknowns_commentary`

The current `components/runtime/RuntimeAssessmentNote.tsx` does not directly render those seven fields. It renders other content and decision-plan data, including the decision summary, relationship summary, possible interpretations, message temperature, action lists, draft text when present, three-day plan actions, closing lines, and review timing.

`M2-P4-I2` must make an explicit, field-by-field disposition decision:

| Disposition | Meaning |
| --- | --- |
| display | Render the field as a distinct user-visible element where it adds unique value. |
| integrate | Merge its meaning into another visible section with traceable coverage and no material loss. |
| deprecate in successor Schema | Remove it only through a separately reviewed, versioned successor Schema while preserving historical v1 assets. |

This planning package does not select those dispositions and does not change the renderer or Schema.

## 4. Baseline-001

`evals/quality/m2-p4-baseline-001.json` fixes the confirmed baseline:

- ID: `M2P4-LIVE-001`;
- source code commit: `66ab02c566d61d0c563e26e3d2c5fb23f6500d45`;
- exact synthetic reproduction input: `evals/quality/m2-p4-baseline-001.json#/synthetic_reproduction_input`;
- context: matching app, met twice;
- incoming message: `今日は楽しかった。また都合が合えば行こう`;
- user reply state: not replied;
- proposed reply: included in the synthetic reproduction fixture;
- selected requests: decide send or wait, and draft message;
- observed decision: `wait_and_reassess`; and
- expected decision: `reply_now`.

The fixed defect inventory is:

- `WRONG_DECISION`
- `EMOTIONAL_ATTUNEMENT_WEAK`
- `REQUESTED_DRAFT_UNFULFILLED`
- `EVIDENCE_TO_DECISION_WEAK`
- `IRRELEVANT_CHASE_WARNING`
- `REPETITIVE_GENERIC_REASONING`
- `ACTION_PLAN_LOW_INFORMATION_GAIN`
- `BRAND_VOICE_TOO_CLINICAL`
- `JPY_980_VALUE_INSUFFICIENT`

Baseline-001 contains the exact Human-approved synthetic reproduction input so a separately authorized E1 can rerun the same case. The fixture is a Human-provided synthetic case, not a raw DB export or a claim that the exact input was retrieved from the DB. It contains no full DB UUID, run/request prefix, raw DB content, raw provider payload, secret, or achieved rubric score.

## 5. Representative diagnostic sample

`evals/quality/m2-p4-representative-sample-v1.json` fixes this exact ordered 12-case sample:

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

The sample contains ten ready cases and two control cases. It is diagnostic only and has not been executed by this task.

It does not replace or mutate `evals/development/human-review-sample-v1.json`. The frozen 20-case sample remains the formal G5 Human product-quality sample. Holdout remains external, unused, and untouched.

## 6. Product quality rubric

`evals/quality/m2-p4-product-rubric-v1.json` is the machine-readable rubric. Hard fails are non-compensable and are evaluated before axis averaging:

- `WRONG_DECISION`
- `SELECTED_REQUEST_UNFULFILLED`
- `REQUIRED_DRAFT_MISSING`
- `FACT_HALLUCINATION`
- `ASSUMPTION_AS_FACT`
- `UNSUPPORTED_CERTAINTY`
- `SAFETY_REGRESSION`
- `DECISION_ACTION_CONTRADICTION`
- `DECISION_PLAN_CONTRADICTION`
- `IRRELEVANT_SAFETY_OR_CHASE_WARNING`
- `MATERIAL_INPUT_IGNORED`

Each ready case receives a five-point score on:

- `emotional_attunement`
- `evidence_specificity`
- `decision_reasonableness`
- `selected_request_fulfillment`
- `draft_usefulness`
- `actionability`
- `individuality`
- `non_redundancy`
- `readability`
- `brand_fit`
- `jpy_980_value`

For a decision that correctly prohibits or defers a draft, `draft_usefulness` evaluates the correctness and explanation of that absence or timing. INFO and SAFETY controls are exact-disposition controls and do not receive product-axis scores.

### Future representative-run acceptance

A future, separately authorized representative run passes only when:

- exact expected decision is `10/10` across the ten ready cases;
- hard fails are `0`;
- a required draft is present whenever applicable;
- `emotional_attunement >= 4` for every ready case;
- `selected_request_fulfillment >= 4` for every ready case;
- the overall product-axis average is at least `4.2`;
- `jpy_980_value >= 4` for at least `9/10` ready cases;
- `INFO-001` is exactly `needs_more_information`;
- `SAFETY-001` is exactly `safety_blocked`; and
- holdout use is `0`.

This planning task claims no achieved score and no acceptance-gate pass.

## 7. Future improvement and evaluation sequence

The following slices are documented but not authorized:

### M2-P4-I1 — Decision Policy Runtime Alignment

- align runtime allowed-set construction to the accepted M2-P1 policy;
- remove keyword-only forced waiting; and
- remain unauthorized and not started until separately approved.

Prohibited implementation approaches:

- do not classify the decision directly from raw consultation prose, including `currentSituation`, by simple keyword or regular-expression matching;
- do not branch on case ID;
- do not match exact fixture phrases;
- do not embed oracle wording; and
- do not build a lookup table fitted only to the 40 decision cases.

I1 must explicitly define or identify application-owned typed decision-material facts. At minimum, those facts must represent:

- relationship stage;
- latest meaningful direct sender;
- exact incoming and outgoing message state;
- whether the user already replied;
- unanswered user-message count;
- elapsed time and usual cadence;
- explicit boundary;
- practical deadline or promised information;
- the user's immediate goal; and
- whether the signal is only an SNS reaction.

At I1 start, the implementer must verify whether the current validated Structured Intake contract can provide those facts deterministically and stably. If it cannot, I1 must stop: it must not fill the gap heuristically, must not change Prompt or Schema without authority, and must return a bounded design proposal for a versioned successor decision-fact contract to Human / ChatGPT.

I1 execution boundary:

- OpenAI API calls: `0`;
- DB operations: `0`;
- migration operations: `0`;
- Prompt modifications: `0`; and
- holdout use: `0`.

I1 acceptance target:

- exact decision across all 40 decision cases: `40/40`;
- exact decision in each category: `10/10`;
- allowed-set violations: `0`;
- forbidden decisions: `0`;
- case-specific matching: `0`; and
- relevant counterfactual or contrast-direction regressions: `0`.

### M2-P4-I2 — Report Information Architecture and Intent Fulfillment

- decide the disposition of every currently generated but hidden report field;
- ensure every selected user request is visibly fulfilled;
- ensure `reply_now` and `send_now` show the usable draft and its adjustment reason; and
- reduce repeated chapter meanings.

### M2-P4-I3 — PB-04 / PB-05 / PB-06 Product Quality Revision

- strengthen fact-to-recommendation connection;
- improve emotional attunement;
- improve case-specific message editing;
- improve action and change-condition quality;
- detect genericity, repetition, and request-fulfillment failures; and
- create only versioned successor assets while preserving historical v1 assets.

### M2-P4-E1 — Separately authorized 12-case diagnostic execution

- execute only the fixed 12-case diagnostic sample under a separately approved run contract;
- record exact versions and results;
- use no holdout; and
- treat diagnostic results as revision evidence, not formal G5 replacement evidence.

### M2-P4-E2 — 70-case development regression and existing frozen 20-case Human review

- run the full existing 70-case development regression;
- conduct Human product-quality review on the existing immutable 20-case G5 sample; and
- preserve the external holdout boundary.

Dependencies are ordered `I1 -> I2 -> I3 -> E1 -> E2`. A later slice does not self-authorize when an earlier slice or this planning package is accepted.

## 8. Evidence and execution boundaries

Any future execution must separately fix its Git SHA, dataset/sample versions, Prompt/Schema/policy versions, model and provider configuration, attempt policy, cost ceiling, and evidence-retention boundary. This document supplies none of that execution authority.

For this planning task:

- OpenAI calls: `0`;
- DB operations: `0`;
- Prompt modifications: `0`;
- Schema modifications: `0`;
- runtime code modifications: `0`;
- holdout use: `0`; and
- quality execution: not started.

## 9. Exact mutation manifest

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

No verifier, package, application code, Prompt, Schema, frozen G5 sample, or holdout file is in scope.
