# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P5-R1 Review

## Status

`evaluator_disposition_v12_precision_corrected_pending_human_chatgpt_review`

This Package is an offline-only precision correction to the accepted Package D architecture. It does not establish Provider quality, activate v12, change Active Runtime v4, wire `service.ts`, reconstruct rejected Product output, authorize a rerun, or establish JPY980 readiness.

## Technical result

- Exact baseline: `88e4262e3b0a4f92da4d24cf6c351885f3ea2c74`
- Exact correction scope: 11/11 updated files; no added or deleted paths
- PB-06 v4: category-correct finding detail responsibility, proposition-aware negation, severity-based FACT_FIDELITY, and exact current/future separation
- PB-06 v4 SHA-256 UTF-8 LF: `3a9e0a2f18e401455b11a0d3ff5d40f1b82560fec01d425859a7822bd709ad6b`
- Semantic disposition: `m2-p4-semantic-disposition-v5`
- Deterministic evaluator: `m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-evaluator-v2`
- Inactive Catalog: `runtime-stage-catalog-v12.0.0` / `prompt-bundle-runtime-v12.0.0` / `pipeline-schema-runtime-v5.0.0` / `split-base-candidate-v1`
- PB-06 integrity: actual Prompt SHA = v12 Catalog `prompt_sha256` = v12 loader expected `promptHash`; the two integrity metadata values are the only Catalog/loader changes
- v12 Pipeline: Grounding v4 → change-condition Grounding v3 → PB-05 schema validation → PB-06 v4 → semantic disposition v5
- v11 Pipeline: Grounding v3 and semantic disposition v4 remain selected
- Active Service: unchanged; it still loads Product Quality Runtime v4

## Materiality corrections

The prior deterministic evaluator recursively searched every string for certainty fragments. That logic incorrectly rejected user-owned verification such as `木曜15時に確実に参加できるか確認する`. Evaluator v2 scans only customer-facing assertion paths, classifies the asserted proposition, and records the exact matched path. It now recognizes when `とは限りません`, `とは言えません`, `とは断定できません`, or `とは分かりません` governs and denies the matched proposition. `相手は必ず返信します。`, guaranteed relationship outcomes, and asserted hidden states remain blocking.

PB-06 finding details now distinguish factual, assertion, policy, and Safety defects—which require the relevant supplied or absent authority—from Product and editorial defects—which require a concrete defect and actual downstream Product impact rather than an artificial absent-authority explanation. Exact scalar/string paths remain mandatory.

Semantic disposition v5 no longer blocks a minor `FACT_FIDELITY` finding merely because of its code. Major or critical factual corruption remains blocking. `TEMPLATE_GENERICITY` and `REPETITION` are nonblocking by default. Material personality drift in the final draft remains blocking.

A future reassessment direction is not treated as a current-direction contradiction merely because it differs from the current Decision. This exception is limited to `decision_plan.change_conditions[i].resulting_direction` and the exact Application-grounded `report_content.change_condition_commentary[i]` for the same index. A finding at the parent `decision_plan.change_conditions[i]` remains blocking because the whole object may contain an invalid condition, unsupported chronology, non-observable trigger, Safety defect, or another material inconsistency. Current actions and future branches that violate Safety or enduring contact constraints are not ignored.

## Frozen E-R3 successor adjudication

Frozen Evidence Commit B remains read-only and its original machine verdict remains `FAIL`.

- E-R3-01: the context-free `UNSUPPORTED_CERTAINTY` false positive is removed; the accepted draft remains unchanged.
- E-R3-02: the accepted no-followup boundary is preserved.
- E-R3-03: the accepted Safety stop boundary is preserved.
- E-R3-04: the historical boundary and accepted draft remain preserved; this Package does not rewrite the frozen output.
- E-R3-05: minor `FACT_FIDELITY` is no longer a code-only root block. Historical `final_result` remains null and no accepted Product is reconstructed.
- E-R3-06: the exact `change_conditions[i].resulting_direction` temporal exception remains valid as a general rule, but the Frozen `ACTION_CONSISTENCY` finding targets the parent `change_conditions[i]` path. It therefore remains blocking alongside `ASSUMPTION_AS_FACT`. Historical `final_result` remains null and no accepted Product is reconstructed.

Successor result remains `FAIL`, with four historical accepted cases passing successor adjudication, two E-R3-06 blocking roots, and two derived Product-outcome absences. This is the correct fail-closed result; it is not new Provider evidence.

## Offline evidence

- Required named fixtures: 17/17 PASS
- Total synthetic semantic/evaluator fixtures: 19/19 PASS
- Negated or uncertainty-preserving certainty fixtures: 4/4 PASS
- Clear external guarantee regressions: 4/4 PASS
- Evaluator v2 self-tests: 12/12 PASS
- Frozen E-R3 successor cases: 6/6 matched expected adjudication
- v12 and v11 loaders: PASS
- Provider / DB / Supabase: 0 / 0 / 0
- Runner rerun / retry / repair / fallback: 0 / 0 / 0 / 0

## Plain-language summary

1. 「未来条件の例外」を狭くした理由は、現在方針と違ってよいのが将来の `resulting_direction` だけだからです。条件オブジェクト全体には、不正な条件、時系列、観測不能なトリガー、Safety違反が含まれ得るため、丸ごと無視してはいけません。
2. 「相手は必ずしも返信するとは限らない」は返信保証ではありません。「とは限らない」が同じ命題を明示的に否定しており、確実性の単語が含まれるだけで保証にはならないためです。
3. 「相手は必ず返信します」「返信は確実に来ます」のような本当の返信保証や、復縁保証、相手の本心の断定は引き続き止まります。
4. v12のアーキテクチャ、Pipeline、Schema、Service、Active Runtimeは変更していません。変更したのはPB-06契約と、それに対応するinactive v12 Catalog／loaderのSHA整合値だけです。v12は引き続きinactiveです。
5. LUNA/Provider は実際に動かしていません。Provider / DB / Supabase は 0 / 0 / 0 で、新しいProvider品質は確認していません。
6. 次は Human / ChatGPT による最終Package D reviewです。Runtime activation、Provider rerun、Package E/F、R4、C2 は別承認です。

## Authority boundary

Provider rerun, Active Runtime activation, `service.ts` wiring, Package E/F, R4, C2, PR, and main merge remain unauthorized. Final JPY980 readiness is not established.
