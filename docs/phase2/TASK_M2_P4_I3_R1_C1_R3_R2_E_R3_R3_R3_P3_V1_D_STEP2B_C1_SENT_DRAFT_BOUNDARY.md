# M2-P4 V1-D Step 2B C1 — Sent-message Draft Boundary

## 判定

- Step 2A: `accepted_complete` at `2a458ec16e26e5089cdf455319622e60e8c9d3d1`
- Step 2A ChatGPT technical review: `PASS 0/0/0`
- Step 2A Human acceptance: `complete`
- Case 1 original execution: `technical_PASS_product_remediation_required`
- Step 2B C1: `implemented_pending_human_chatgpt_review`
- remaining 8 Provider cases: `HOLD`
- Provider execution in this correction task: `0`
- actual V16 Provider quality: `unestablished`
- Case 1 V16 rerun: `unauthorized`
- R2-C / JPY980 Runtime readiness / Global Q0: `remediation_required / not_established / false`

## 発見事実

実Provider evidence commit `ecef2470e34d1a9fe82c0fc5683735d6aa5394f0`、execution `2026-08-18-case1-ordinary-reply-waiting-2a458ec1` は技術的に `PASS` した一方、Product判定は `remediation_required` である。

- BLOCKER: `sent_message_replayed_as_new_draft`
- MAJOR: `future_reassessment_uses_current_decision_label`
- observed PB-06 `semantic_checks=[]`
- actual Provider semantic false negative: `at least 1 observed case`

1件からPB-06のrecall/precisionを一般化しない。生成済みHuman review sheetはHistorical evidenceとして変更せず、ChatGPT Product判定は `case1-actual-product-review-v1.json` に分離する。

## Application-owned draft authority

V16では、Candidate absent、かつ `requested_topics` に `draft_message` がないとき、PB-04が `source_status=generated_without_candidate` のdraftを返した場合に `M2_GENERATED_DRAFT_AUTHORITY_VIOLATION` でPB-05前にfail closedする。これはcase ID、fixture ID、文言、keyword、regex、quote parserに依存しない一般則である。

`generated_without_candidate` は全面禁止しない。明示的な `draft_message` requestでは既存Policyが許す範囲で使用できる。Candidate-backed draft behaviorと `message_impact` のCandidate必須境界も維持する。

## V16 Prompt / Runtime identity

- catalog: `runtime-stage-catalog-v16.0.0`
- prompt bundle: `prompt-bundle-runtime-v16.0.0`
- schema set: `pipeline-schema-runtime-v6.0.0`
- topology: `split-base-candidate-v1`
- PB-01 / PB-01C / PB-02 / PB-03: exact V15
- PB-04: sent-message / draft-authority successor
- PB-05: draft-context source-fidelity successor
- PB-06: sent/unsent semantic-quality successor

V15 Prompt/catalogはHistorical evidenceとして不変である。新Provider Stage、Report schema、schema fieldは追加しない。Production Runtime/Supabase identity supportは `unestablished/deferred` であり、本taskでmigrationを作成・適用しない。

PB-04はBase内の明示済みsent messageをhistorical observed eventとして扱い、Candidateやunsent draft sourceへ昇格させない。PB-05はnull draftならnull contextとし、`generated_without_candidate` をCandidate preservationやoriginal wording adjustmentと表現しない。PB-06はsent/unsent ownership confusionとmetadata/report contradictionを既存 `MESSAGE_POLICY_CONSISTENCY` または `FACT_FIDELITY` でblocking adjudicationする。PB-06はEvaluator専用でrewrite/retry authorityを増やさない。

## Controlled review executor

controlled executorのcandidate identityをV16へ更新する。固定9-case packet `controlled-provider-inputs-v1.json` とSHA-256 `ab1d7b896086da002015a0a6d5cf1c1fb6eac3ffdc48e8410b44a892c1f9a20d`、`maxRetries=0`、authorization gate、sanitizer、journalの意味は変えない。実Providerは呼ばない。

Historical `FakeAssessmentRepository` はV15 attempt-2 identityを固定しているため、V16 review-only executor内に限定compatibility adapterを置く。adapterは内部のhistorical assertion評価時だけV15互換として扱い、persisted run identity、Stage Prompt、Stage hash、evidenceはV16のまま保持する。`fakes.ts` とProduction repositoryは変更しない。

## Future reassessment UX

`CustomerAssessmentNote` の「今の答え」は既存 `decisionLabels` を維持する。future conditionのresult lineだけを別のfuture-facing labelsへ分離し、`wait_and_reassess` は `その時点で状況を見直す` と表示する。`resultingDirection` authorityとCSSは変更しない。

## 回帰契約

専用verifierは次を証明する。

1. Case 1 authorityで違反draftがPB-05前にsafe failureとなり、PB-05/PB-06/Report/projectionが0。
2. null draft/null contextならReadyとなり、final draft/contextはnullのまま、Evidence→Decision→Action→Uncertainty→Emotional containment chainを保持。
3. 明示的 `draft_message` requestではCandidateなしのauthorized generated draftが可能。
4. Candidate-backed behaviorと `M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED` を維持。
5. sent-message replayとdraft-context contradictionのfake PB-06 blocking findingが既存V1-C bounded recovery/fail-closed wiringで強制される。
6. current labelsとfuture labelsのUI authorityが分離される。

Actual PB-06 Provider recallは次の明示認可されたreal runまで未確立である。

## 検証

- Step 2B C1 dedicated verifier: `PASS 22/22`
- immutable accepted Step 2A C1 verifier: `PASS 55/55`（isolated accepted snapshotで1回のみ）
- typecheck / zero-warning lint / build / `git diff --check`: `PASS`
- exact scope: `PASS 23/23`（15 UPDATE + 8 NEW、DELETE/RENAME 0）
- protected blob / sensitive / `next-env.d.ts` / fixed input / Case 1 evidence 18 files: `PASS`

## Protected / operations

固定input packet、Case 1 evidence 18 files、review transport、sanitizer/journal、authorization semantics、schemas/decoders、Safety/clarification/ProductSemanticShape、DB/Supabase/migrations、Payment、Production、CSS、`next-env.d.ts`、mainを変更しない。

Provider / DB / Supabase / migration apply / Payment / deploy operations are `0 / 0 / 0 / 0 / 0 / 0` in this correction task. Push後はHuman/ChatGPT reviewで停止し、Case 1再実行と残り8 casesは行わない。
