# V19-L5 Final Improvement Batch — Local Technical PASS

Implementation authority: `9c0fe90166b6ef3d8ccd8874afb7ad51b92dbffe`.
Predecessor authority: `9d6212dc9f47b4c6afcb0af262bc047ca786182a`.

Product V19-L5 / catalog and bundle v23.0.0 / schemaSet v9.0.0.
PB01 v6.0.0, PB04 v8.0.0, PB05 v13.0.0, PB06 v11.0.0.
The L4 narrow patch contract and PB06 post-repair schema remain unchanged.
`candidate-identity.json` freezes the implementation commit and 223 source-file hashes. Evaluation preparation/evidence is separate from that implementation commit.

## Authorized changes

- **Editing intent:** semantic PB01 intent distinguishes editing, composition and a contact decision, including mixed requests. Existing text plus editing-only intent produces a message answer with no artificial send/wait decision or timing. Missing original produces exactly `整えたい文章をそのまま教えてください`. Supplying that original reuses the retained Base, records its new provenance, analyzes Candidate/Safety again and consumes the one-question budget. Explicitly excluded decisions stay excluded for composition as well.
- **Ordinary guidance:** grounded appreciation, ordinary incoming reply and first-invitation purpose can replace default waiting when structured contact authority permits. Unspecified timing, style, recipient feelings and user emotion remain unknown. Positive ordinary requests can receive kind acknowledgment of their communication purpose; no invented anxiety is required to satisfy emotional containment. Pending contact, repeated contact and explicit boundaries keep their existing constraints.
- **Narrow fact repair:** only the two existing L4 Report leaf types are eligible, with a single known-evidence material fact defect. PB04 runs once. PB05 patch and PB06 verification run at most once more. All six checks, exact target/Fact IDs/hash, unchanged Plan/draft/other Report content and absence of remaining/new material defects are required. Message-only does not expand the repair scope. Minor editorial findings on existing message explanation leaves can be retained; draft, meaning, Safety, unknown-path and material findings cannot use that allowance.

This is an explicitly selected local candidate application and Customer preview. The Production application, Decision enum, DB/clarification contracts, Paid snapshot, selectors and V17/V18/V19-L1–L4 source were not edited. No Provider or database is constructed by the candidate application.

## Frozen final QA dispositions

| Case | Purpose | Disposition |
|---|---|---|
| GQ-01 | 会った後のお礼 | ANSWER_EXPECTED |
| GQ-05 | 初回の軽い誘い | ANSWER_EXPECTED |
| GQ-03 | 相手からの自然な返信 | ANSWER_EXPECTED |
| GQ-09 | 未返信・追送前 | ANSWER_EXPECTED |
| GQ-07 | 期限のある予定確認 | ANSWER_EXPECTED |
| GQ-11 | 未返信のまま複数回送信済み | ANSWER_EXPECTED |
| GQ-13 | 明示的な境界 | ANSWER_EXPECTED |
| GQ-29 | 「送った」だけが事実で未返信 | ANSWER_EXPECTED |
| GQ-16 | 原文あり添削 | ANSWER_EXPECTED |
| GQ-17 | 原文なし添削 | CLARIFICATION_EXPECTED |
| GQ-29-P3 | 明示的な3日間方針 | ANSWER_EXPECTED |
| GQ-15 | 情報少なめの普通のお礼 | ANSWER_EXPECTED |

The expectations were frozen before candidate outputs. The historical Human answers, including GQ-15 both unacceptable with no issues selected, remain unchanged. These new dispositions never retroactively modify that review.

## Local verification

- `verify-intent.mjs`: 289 assertions; all 12 cases with 24 retained PB01 structural seeds, source validation and intent/policy boundaries; full candidate application editing, clarification/resume, composition, mixed request and rejection cases.
- `verify-repair.mjs`: 59 checks / 59 authored fake scenarios, both authorized paths with and without a nonnull original/draft, full three-day Plan unchanged, all six verification checks, residual/new defects, wrong targets/hashes/Fact IDs, Safety, technical failures and no attempt 3.
- `verify-review.mjs`: 12 cases / 24 anonymous slots, message completion and original question rendered; stopped/internal content withheld. Desktop 1440px and mobile 390px had no overflow or browser errors.
- Final runner fake tests: all 24 SESSION STOPs can finish the batch; wrong model, timeout, invalid receipt binding and wrong displayed consultation are GLOBAL STOP; unknown-outcome reservation is retained; inspection cannot mutate the source response; pricing is probed against actual reservation/accounting functions; missing authorization dispatches zero calls.
- TypeScript, changed-file ESLint, build (47 static pages) and diff whitespace checks passed. All 1,346 preserved predecessor/evaluation files match their original hashes.

These are offline contract and integration tests. The retained outputs are structural test data only. New intent labels, revised outputs and PB06 verdicts in tests are authored fakes; they do not establish real-model detection, repair quality or Human preference.

## One final Expanded Blind QA

`final-qa/inputs.json` contains only the same 12 inputs. `final-qa/preview/blind-review.html` is the empty review UI. `final-qa/adapter.mjs` captures the exact next request without network access. `final-qa/runner.mjs` is callable only with injected transport and receipt inspection; it has no key read, Provider constructor or automatic execution entrypoint.

V17 × 12 and V19-L5 × 12, one fresh session per arm/case. Same model, reasoning and service tier. No old output reuse, preference input, extra sample, clarification answer or retry. A/B mapping is independently randomized into a separate sealed internal artifact, and Human answers are frozen before reveal. Minor tone alone is not a new failure gate. Quality failure stops its session; comparison/accounting/input/model/mapping failures stop the batch.

The conservative reference maximum is **208 HTTP / $4.8983904 reserved**. The one recommended hard cap is **USD $6**. This is a reference calculation, not a current-price assertion. Immediately before execution, official pricing must be refreshed and agree with the actual ledger functions, including cache reads/writes and output reasoning counted once. A mismatch stops before HTTP. Reservation precedes dispatch and is never released, including timeout/unknown outcome.

Remaining prerequisites are a fresh Human authorization for exactly one final batch, current official pricing/accounting verification and the one-shot execution manifest/source guard. The runner requires the candidate identity hash, implementation commit, plan/catalog hashes and exact pricing in live authorization; the one-shot live lock does not exist yet. No targeted or mini pilot follows this batch. The final QA uses the eight frozen acceptance criteria; win rate alone cannot authorize Production.

F007 overall, F008, real-model narrow repair success rate and Production readiness remain OPEN. Production remains on V17; deployment/live external state was not inspected or changed.

New real API calls 0. Production changes 0. Push/deploy 0.

**READY FOR FINAL BLIND QA**
