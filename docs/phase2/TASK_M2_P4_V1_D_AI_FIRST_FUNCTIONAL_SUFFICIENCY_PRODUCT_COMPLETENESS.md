# M2-P4 V1-D — AI-First Functional Sufficiency / Selected Product Completeness

## 判定

- baseline: `a02f8bb14232c5bd306aed23737846c8ea305a5b`
- branch: `fix/m2-p4-v1-d-ai-first-sufficiency-product-completeness`
- status: `implemented_pending_human_chatgpt_review`
- Provider / DB / Supabase / Payment / deploy: `0 / 0 / 0 / 0 / 0`
- Human / ChatGPT review: `pending`
- R2-C: `remediation_required`
- `jpy980RuntimeReadiness`: `not_established`
- `globalQ0Completion`: `false`

## 問題と是正

actual V16 batchではPB-01/PB-01Cが相談固有の時系列、返信状態、普段のペース、実務期限、tradeoff、関係方向、tone/persona、Candidate分析を構造化できていた。一方、V2の共通field checklistが `user_goal_detail=other` やgeneric material concern不在を理由に、その意味理解を破棄して7件をroute mismatchへ落としていた。

V3はraw proseを再解析せず、trusted structured authorityのfunctional combinationから、選択されたprimary Product functionをgroundedかつ安全に提供できるかを判定する。Decision pathではincoming obligation、outbound waitのtiming/cadence、deadline/tradeoff等を相談ごとに使う。Draft/message pathではCandidate、writing direction、tone/register/persona、関係・観測factsを組み合わせる。単一signal、emotion単独、Candidate単独、requested topic単独はReady根拠にしない。

V1/V2は変更せず、V16のみV3へ接続する。Safety、Candidate/Base/Clarification provenance、sent/unsent、message_impact Candidate必須、unsupported certainty、factual integrity、one-question total、second clarification禁止、contact boundaryはhard gateのまま維持する。

## Product completeness

Application-owned checkerはProduct proseを解析せず、requested topics、Candidate、effective policy、final plan/reportを照合する。

- `message_impact` + valid Candidate: `report_content.message_temperature` 必須
- `draft_message` + policy `required_now|later_only`: draftとedit metadata必須
- `not_allowed` またはSafety/contact prohibition: null draftを許容

不足は既存V1-C one-shot reassessmentへ統合する。draft/metadata不足は `plan_and_report`、temperatureのみは `report_only`、attempt 2でも不足なら既存exhaustionでfail closedする。attempt 3と新Provider stageは追加しない。

## Offline acceptance

- actual PB-01/PB-01C evidenceのみからCases 1-8=`full_paid_ready_candidate`
- Case 9 initial=`needs_one_clarifying_answer`、target=`latest_contact_timing`
- frozen answer `{kind:"elapsed_bucket",value:"six_to_24_hours"}` 後はReady、clarification total=1、second=false
- sparse、emotion-only、Candidate-only、Candidateなしmessage_impact、one-answer後も不足するケースはReadyにしない
- actual Case 4 attempt 1はdraft/metadata/temperature欠落としてCustomer投影前にreassessmentへ送る
- fake corrected Case 4 attempt 2だけがReady、attempt 3なし
- Cases 5/6のCandidate文字列、Case 6の改行・emoji・関西personaを不変保持
- Provider calls=0、committed Provider evidenceはbyte-identical

## Protected boundary

V16 PB-01/PB-01C/PB-04/PB-05/PB-06、Prompt/catalog、`schema-catalog.ts`、historical evidence、controlled inputs、Provider runner/writer/transport、UI/CSS、Payment、Supabase、migrations、Production、main、`next-env.d.ts` は変更しない。今回のoffline evidenceはactual captured understandingを使う回帰証拠であり、Provider品質、Human Product acceptance、JPY980 Runtime readinessを確立しない。

## 検証

- consolidated verifier: `PASS 31/31`
- closest immutable predecessor verifier: `PASS 21/21` in one complete run
- isolated-clone setup: 2 non-completing invocations（missing local `main`; CRLF checkout）。いずれもProvider/client実行前に停止
- typecheck / zero-warning lint / build / `git diff --check`: `PASS`
- protected blobs / sensitive scan / `next-env.d.ts`: `PASS 248 / PASS / byte-identical`
- exact scope: `10 paths`（6 UPDATE + 4 NEW、DELETE/RENAME 0）

push後はHuman / ChatGPT reviewで停止する。Provider、PR、merge、rebase、Production操作は行わない。
