# M2-P4 V1-D Step 2B C2 — V16 Controlled Evidence Provenance

## 判定

- C1-R1: `accepted_complete`
- accepted snapshot: `8a4f30a49dd03cbd8c429fb9eaeb2387fa03c184`
- ChatGPT review: `PASS_complete`（BLOCKER 0 / MAJOR 0 / MINOR 0）
- Human review / acceptance: `PASS_complete / complete`
- acceptance date: `2026-08-18`
- C2 status: `implemented_pending_human_chatgpt_review`
- finding severity: `BLOCKER_FOR_PROVIDER_EXECUTION`
- finding: `v16_execution_would_be_persisted_as_v15_evidence`
- Provider execution: `unauthorized / 0`
- Case 1 V16 rerun: `unauthorized`
- remaining 8 cases: `HOLD`

## 問題

controlled runnerはV16 catalog/prompt bundleを選択していたが、evidence writerは新規出力を `actual_v15_successor_output`、`v15-*` result filename、`m2-p4-v1-d-v15-*` schema identityとして固定していた。この状態でV16 Providerを実行すると、内容と証拠由来が矛盾するため実行BLOCKERである。

Historical Case 1 run `ecef2470e34d1a9fe82c0fc5683735d6aa5394f0` は実際のV15 evidenceである。その18 files、Human review sheet、`case1-actual-product-review-v1.json` のV15 provenanceは正しく、変更しない。

## Runtime identity authority

runnerはvalidate-only / execute-provider-reviewの双方で、authorization record生成およびProvider client構築より前に次をload/validateする。

- catalog: `runtime-stage-catalog-v16.0.0`
- prompt bundle: `prompt-bundle-runtime-v16.0.0`
- schema set: `pipeline-schema-runtime-v6.0.0`
- topology: `split-base-candidate-v1`
- model: `gpt-5.6-luna`

この検証済みidentityをauthorization recordとevidence journalへ明示的に渡す。fixture ID、case ID、directory、Prompt prose、Stage output、customer textからversionを推論しない。

current writerがsupportするlive review identityはexact V16のみである。V17等のunsupported identityは `M2_V1D_REVIEW_EVIDENCE_RUNTIME_IDENTITY_UNSUPPORTED` でfinal evidence claim生成前にfail closedする。

## Future authorization record

既存fieldを保持したまま、次をmachine-readableに追加する。

- `runtime_catalog_version`
- `prompt_bundle_version`
- `schema_set_version`
- `stage_topology_version`

値は検証済みidentityから取得する。committed artifact自体はProvider authorityを付与しない。Human authorization referenceは従来どおりhashのみを保持し、input SHA、snapshot、case IDs、budget、`maxRetries=0`、synthetic-only、no Supabase/Payment/Productionを維持する。

## Future V16 evidence

新規V16 executionのresult familyは次のとおり。

| File | Schema |
| --- | --- |
| `v16-route-results-v1.json` | `m2-p4-v1-d-v16-route-results-v1` |
| `v16-stage-attempt-results-v1.json` | `m2-p4-v1-d-v16-stage-attempt-results-v1` |
| `v16-customer-projections-v1.json` | `m2-p4-v1-d-v16-customer-projections-v1` |
| `v16-quality-reassessment-results-v1.json` | `m2-p4-v1-d-v16-quality-reassessment-results-v1` |

Customer projectionとHuman review recordのprovenanceは `actual_v16_successor_output` とする。Human reviewはfixture/provenanceだけを事実として自動設定し、Product judgmentとJPY980 valueをすべて `pending_human_review` に保つ。

`authorization-record-v1.json`、Provider ledgers、Human sheet、summary、execution journalのfilenameはversion-neutralのままにする。summary/journal本文はexact Runtime identityを表示する。

## Offline regression

C2 verifierはlive Providerを使わず、以下を証明する。

1. exact parent / branch / main / scopeを固定する。
2. Historical V15 Case 1 evidence 18/18をblob比較する。
3. authorization recordがexact V16 identityを持つ。
4. fake Ready bundleがV16 result filename/schema/provenanceだけを生成する。
5. Human judgmentsがすべてpendingである。
6. fake V16 outputにV15 result filename/provenanceがない。
7. summary/journalがexact V16 identityを表示する。
8. unsupported identityが書込み前にfail closedする。
9. validate-onlyとmissing/wrong authorization gateがProvider clientを構築しない。
10. validate-only / execute-provider-review双方がwrong Runtime identityをProvider前に拒否する。

## 検証結果

- C2 dedicated verifier: `PASS 21/21`
- immutable accepted C1-R1 verifier: `PASS 23/23 executed_once`
- typecheck / zero-warning lint / build / `git diff --check`: `PASS`
- protected blob / sensitive scan: `PASS`
- Historical Case 1 evidence: `PASS 18/18 byte_identical`
- exact scope: `PASS 15/15`（13 UPDATE + 2 NEW、DELETE/RENAME 0）
- Provider / DB / Supabase / migration apply / Payment / deploy: `0 / 0 / 0 / 0 / 0 / 0`

## Protected / evidence ceiling

Product behavior、generated-draft authority、pipeline、V15/V16 Prompt/catalog、schema catalog、controlled inputs、UI/CSS、projections、Decision Policy、Effective Decision Policy、Application/service、Production transport、Fake repository、Runtime schemas、migrations、Supabase、Payment、Production、main、`next-env.d.ts` は変更しない。

actual V16 Provider quality、PB-06 recall/precision、R2-C PASS、JPY980 readiness、Global Q0は未確立である。Provider / DB / Supabase / migration apply / Payment / deployは `0 / 0 / 0 / 0 / 0 / 0`。push後はHuman/ChatGPT reviewで停止し、Case 1または残り8 casesを実行しない。
