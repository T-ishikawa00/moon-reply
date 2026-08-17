# M2-P4 V1-D Step 2A C1 — Quality Exhaustion Disposition Correction

## 判定

- 実装状態: `implemented_pending_human_chatgpt_review`
- V1-D Step 2A: `authorized / in_progress_controlled_provider_executor`
- Provider execution: `unauthorized / 0`
- DB / Supabase / Payment / Production / deploy / migration apply: `0`
- Step 2A initial review: `NEEDS_CORRECTION 0/1/0`
- Finding: `quality_reassessment_exhaustion_safe_code_misclassified`
- C1: `quality_exhaustion_disposition_corrected_pending_human_chatgpt_review`

本Stepは、固定済み9 synthetic casesを実V15オーケストレーションへ流すためのreview-only executorを実装する。実Provider出力、Product品質、JPY980価値は証明しない。

## Authority

- V1-D Step 1 overall: `accepted_complete`
- accepted snapshot: `41d90b69c18aec86995d1930f28be05d6ccfca8f`
- acceptance date: `2026-08-18`
- ChatGPT / Human review: `PASS_complete`
- Step 1 initial snapshot `4c7577564421e2dbd264ffadb5ccab8d961c42eb` の `NEEDS_CORRECTION 0/2/0` は履歴として維持する。
- C1: `PASS 0/0/0`
- Step 2A snapshot: `9c7a11df63d4013dcc6843c245fbd6fa00106c81`

## C1 evidence classification

Review evidenceのterminal dispositionは、`M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED`だけを`quality_reassessment_exhausted`へ分類する。`M2_SEMANTIC_VALIDATION_FAILED`とその他のsafe Runtime errorは`technical_failure`へ分類する。Runtime PipelineとRuntime error semanticsは変更しない。

executor-level fake V15 regressionsは、(1) repairable finding後のattempt 2 Product-quality failureがexhaustionとなりattempt 3・final Report・customer projectionを作らないこと、(2) `decision_plan.actions_to_take[999]`がnonrepairable semantic failureとなりreassessmentを開始せずattempt 2・final Report・customer projectionを作らないこと、を別々に証明する。

## 実装経路

`controlled-provider-inputs-v1.json` → 認可ゲート → V15 `AssessmentApplication` → caseごとの `FakeAssessmentRepository` → 12/108 budget wrapper → `ReviewOnlyOpenAiResponsesTransport` → V1-A routing / V1-B / V1-C → Ready時のみ `CustomerAssessmentExperienceProjectionV2` → sanitized evidence。

`service.ts`、`SupabaseAssessmentRepository`、Production route、Paymentは使わない。V1-A/B/C、ProductSemanticShape、SemanticDisposition、quality reassessmentを迂回しない。

## Transportと予算

review-only transportはOpenAI Responses APIをProduction相当のrequest semanticsで使用し、意図的な差分を `maxRetries: 0` と安全なobserver hookだけに限定する。Application Stage invocationはcaseごと12、9件合計108をtransport呼出し前に検査する。Application invocation ledgerとProvider HTTP attempt ledgerは別物として記録する。

この実装経路に限り、`maxRetries: 0`、単一transport経路、事前budget enforcementが成立するため、将来認可実行時のhard HTTP attempt ceilingは108である。Step 2A中の実attemptは0。

## Clarification

`one_clarification_answer_becomes_ready`だけを対象とする。固定入力hashとfixture IDからreview-only opaque identifierを決定的に作る。initial route、`latest_contact_timing` target、固定answerを検証し、回答は1回だけ送る。second question/answer、入力変更、暗黙の再試行は行わない。

## 実行認可ゲート

実行には、次の全条件が必要である。

1. `--execute-provider-review`
2. `M2_V1D_PROVIDER_EXECUTION_AUTHORIZED=I_HAVE_EXPLICIT_HUMAN_AUTHORIZATION`
3. `M2_V1D_AUTHORIZED_SNAPSHOT` と実HEADの一致
4. `M2_V1D_AUTHORIZED_INPUT_SHA256` と固定入力bytes hashの一致
5. 非空の `M2_V1D_HUMAN_AUTHORIZATION_REFERENCE`
6. `OPENAI_API_KEY`
7. clean worktree
8. `--case=<fixture_id>` または `--all-nine-cases`
9. 安全な `--output-dir=<path>`

1つでも欠ければ、OpenAI client構築前に非0で停止する。`--validate-only` は秘密値、client、network、evidence directoryを作らず、固定入力、V15 identity、case selection、出力pathを検証する。

## Evidence境界

将来の証跡はatomicなappend-only journalから組み立てる。raw Provider response/request ID、Provider URL、header、raw SDK error、secret、Human PII、chain-of-thoughtを保存しない。unknown SDK errorは `M2_STAGE_PROVIDER_FAILED` のみとする。synthetic Stage JSON、usage、latency、hash、safe code、attempt numberは保存可能で、attempt 1/2は別record、attempt 3は拒否する。

Ready resultだけをcustomer projectionへ通す。Human review sheetはfixture IDと `actual_v15_successor_output` provenanceだけを自動入力し、全Product判断を `pending_human_review` とする。

## 未確立

- actual V15 Provider prose quality / semantic fidelity
- PB-06 recall / precision
- real reassessment success rate
- Human emotional understanding
- `plausibly_worth_jpy980`
- R2-C PASS
- `jpy980RuntimeReadiness`
- `globalQ0Completion`

Provider executionは別の明示的Human決定があるまでunauthorizedである。
