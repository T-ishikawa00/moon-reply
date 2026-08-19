# M2-P4 V1-D Step 2B C1 — Sent-message Draft Boundary

## 判定

- Step 2A: `accepted_complete` at `2a458ec16e26e5089cdf455319622e60e8c9d3d1`
- Step 2A ChatGPT technical review: `PASS 0/0/0`
- Step 2A Human acceptance: `complete`
- Case 1 original execution: `technical_PASS_product_remediation_required`
- Step 2B C1 snapshot: `d1a604a74edb06344e0b465c63aa21f45f64169a`
- Step 2B C1 initial ChatGPT review: `NEEDS_CORRECTION 0/1/0`
- Step 2B C1 initial finding: `required_now_generated_draft_route_is_unreachable`
- Step 2B C1-R1: `accepted_complete` at `8a4f30a49dd03cbd8c429fb9eaeb2387fa03c184`
- Step 2B C1-R1 ChatGPT review: `PASS_complete`（BLOCKER 0 / MAJOR 0 / MINOR 0）
- Step 2B C1-R1 Human review / acceptance: `PASS_complete / complete`
- Step 2B C1-R1 acceptance date: `2026-08-18`
- remaining 8 Provider cases: `HOLD`
- Provider execution in C1-R1: `0`
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

V16では、Candidate absent、`requested_topics` に `draft_message` がなく、かつ既存effective Decision Policyの `message_draft_policy` が `required_now` ではないとき、PB-04が `source_status=generated_without_candidate` のdraftを返した場合に `M2_GENERATED_DRAFT_AUTHORITY_VIOLATION` でPB-05前にfail closedする。これはcase ID、fixture ID、文言、keyword、regex、quote parserに依存しない一般則である。

`generated_without_candidate` は、明示的な `draft_message` request、またはeffective Decision Policyが `required_now` を要求する場合に許可される。guardはPB-04 plan validationが使う同一policyを受け取り、内部で再計算しない。Candidate-backed draft behavior、`message_impact` のCandidate必須境界、`not_allowed` / pause behaviorも維持する。

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
7. Candidateなし、`draft_message` requestなしでも、effective policyが `required_now` の `reply_now` routeはPB-05/PB-06へ進み、Readyかつnon-null Customer draftとなる。
8. direct authority matrixで `required_now` の `reply_now` / `send_now`、explicit draft、Candidate-backedを許可し、`later_only` Case 1とpause/not-allowedを拒否する。

Actual PB-06 Provider recallは次の明示認可されたreal runまで未確立である。

## 検証

- initial Step 2B C1 dedicated verifier: historical `PASS 22/22`
- corrected Step 2B C1-R1 verifier: `PASS 23/23`
- immutable original Step 2B C1 verifier: `PASS 22/22`（isolated `d1a604a...` snapshotで完全実行1回）
- typecheck / zero-warning lint / build / `git diff --check`: `PASS`
- exact C1-R1 scope: `PASS 11/11`（11 UPDATE + 0 NEW、DELETE/RENAME 0）
- protected blob / sensitive / `next-env.d.ts` / fixed input / Case 1 evidence 18 files: `PASS`

## Protected / operations

固定input packet、Case 1 evidence 18 files、review transport、sanitizer/journal、authorization semantics、schemas/decoders、Safety/clarification/ProductSemanticShape、DB/Supabase/migrations、Payment、Production、CSS、`next-env.d.ts`、mainを変更しない。

Provider / DB / Supabase / migration apply / Payment / deploy operations are `0 / 0 / 0 / 0 / 0 / 0` in this correction task. Push後はHuman/ChatGPT reviewで停止し、Case 1再実行と残り8 casesは行わない。

## Step 2B C2 provenance successor

C1-R1受入れ後、V16 runnerがV15 result filename/schema/provenanceを生成する `v16_execution_would_be_persisted_as_v15_evidence` をProvider実行前のBLOCKERとして発見した。C2はProduct挙動を変更せず、検証済みV16 catalog/prompt/schema/topologyとmodelをevidence authorityとしてauthorization record、journal、summary、result-familyへ伝播する。

Future V16 evidenceは `actual_v16_successor_output`、`v16-route-results-v1.json`、`v16-stage-attempt-results-v1.json`、`v16-customer-projections-v1.json`、`v16-quality-reassessment-results-v1.json` と対応するV16 schema identityを使う。current writerがsupportするlive identityはV16 exactのみであり、V17等は `M2_V1D_REVIEW_EVIDENCE_RUNTIME_IDENTITY_UNSUPPORTED` で書込み前にfail closedする。Historical Case 1のV15 evidence 18 files、Human review sheet、Product review artifactは変更しない。

C2 statusは `implemented_pending_human_chatgpt_review`、専用verifierは `PASS 21/21`、immutable accepted C1-R1 verifierは `PASS 23/23 executed_once` である。Provider executionは `0`、Case 1 V16 rerunは `unauthorized`、remaining 8 casesは `HOLD`、actual V16 Provider qualityは `unestablished` である。
