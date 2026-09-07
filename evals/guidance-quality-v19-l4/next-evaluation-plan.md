# V19-L4 次の実モデル評価案

状態: **PROPOSED / NOT AUTHORIZED / NOT RUN**。2026-09-08 の local 計画。実 API・外部閲覧・secret 探索・Production 操作は今回 0。過去の一度限りの実行承認、残予算、途中 run は再利用しない。

まず GQ29-P3 の固定上流による L3/L4 局所比較を行い、その結果を確認してから別承認で既定 12 ケースの Blind QA へ進む。どちらも自動実行しない。Local Technical PASS は実モデル品質、Human Acceptance、Production Authorization を意味しない。

## 1. 再利用する資産と実行前に残る接続

| 資産 | 再利用する部分 | そのまま実行できない理由 |
| --- | --- | --- |
| [L3 targeted adapter](../guidance-quality-v19-l3/targeted/adapter.mjs) | `loadFixedUpstream()`、既存 Application/Fake による request capture、上流・Plan・PB05 input の hash/deep equality | `captureStageRequest()` は catalog 20/21・schemaSet v6・attempt 1 に限定。L4 catalog 22/schemaSet v8、PB05 patch attempt 2、PB06 verification を許可しない |
| [L3 targeted runner](../guidance-quality-v19-l3/targeted/runner.mjs) | 条件ごとの quality-stop、全体の infrastructure-stop、receipt 保存 | 旧 L2/L3、最大 4 HTTP、旧 exact HEAD、修復 0 の消費済み profile。旧 CLI/lock/run を再実行しない |
| [共有 transport](../guidance-quality-wave1/real-pilot/transport.mjs) | request/response 保存、model/schema identity、usage 検証、retry 0 | stage ごとに単一 definition を照合する。L4 の PB05 attempt 2 は通常 Report ではなく `reportFactRepair` の別 prompt/schema。実呼出し前の限定的な definition 選択が必要 |
| [共有 ledger](../guidance-quality-wave1/real-pilot/budget.mjs) | 呼出し前 reservation、永続 journal、actual usage、未知結果の予約維持、上限拒否 | 新 manifest の条件別回数・合計・単価と整合させる。別 budget engine は作らない |
| [fresh profile](../guidance-quality-v19-l3/fresh-pilot/runner.mjs) / [Blind UI](../guidance-quality-v19-l3/fresh-pilot/review.mjs) | full Application 経路、匿名 completed/clarification/stopped/not_started、従来の 4 問 | 旧 4 ケース・旧 exact identity・旧 cap に固定。新しい入力 manifest、mapping、run と候補 profile が必要 |

L4 の候補 identity は [local catalog](../../lib/assessment/runtime/v19-l4-stage-catalog.ts) / [identity 定義](../../lib/assessment/runtime/v19-l4-runtime-identity.ts) に従い、実行承認 packet に最終 commit と全 definition hash を固定する。本計画は作業中の hash や HEAD を実行承認済みと扱わない。

PB05 初回は通常 Report contract、patch は PB05 内の `reportFactRepair` contract、PB06 は `validation-result-v19-l4-v1` を明示選択する。初回の `report_fact_repair_verification` は null、修復後は Application の merged Report に binding された verification object が必要。既存 validator を避けたり、schema を取り替えて一致したように扱ったりしない。

**現行の initial-material-stop を黙って通過させない。** L4 の適格な Report fact に限り一度の patch と検証へ進む新 profile は、範囲を示した別の Human 承認が必要。共有 classifier の code/severity 一括許容、raw finding の削除、旧 STOP の解除で実現しない。

## 2. 先行評価: GQ29-P3 fixed upstream / L3 vs L4

目的は、同じ Base/Candidate/Decision Plan からの事実説明と、対象を限定した修復・独立検証の成立を見ること。入口や PB04 を含む full-path の実モデル比較ではない。

- 固定 synthetic input は既存 [pilot-inputs.json](../guidance-quality-wave1/pilot-inputs.json) の GQ-29-P3 のみ。PB01〜04、frozen application time、元の PB05 input は既存 adapter の固定上流を使用する。
- 両条件の初回 PB05 input が元 input と deep-equal、Decision Plan hash が一致することを local capture で確認する。新 PB05 は各条件 1 回生成し、旧 PB05/PB06 出力を再利用しない。
- PB06 へ渡す新 Report は、既存 Application の grounding/source/selected-request 検証を通ったものに限る。capture が前処理で停止したら、その local disposition を記録し、空の PB06 request/output を代入しない。
- generation input に過去の Human 回答・勝敗・expected direction・目標文・編集上の修復例・case 評価ラベルを渡さない。修復時に渡せるものは、この新評価内の実 finding、対象 Report、固定された正当な事実 authority と候補契約上の修復 context のみ。
- model は `gpt-5.6-luna`、reasoning `low`、Standard (`service_tier=default`) を比較案として維持する。別 model で補完しない。

| 条件 | stage | 最大 HTTP | 実行条件 |
| --- | --- | ---: | --- |
| L3 | PB05 初回 | 1 | 固定上流・identity・予算 preflight 通過 |
| L3 | PB06 初回 | 1 | schema/source 検証済みの新 PB05 がある。停止境界を越えて無理に呼ばない |
| L4 | PB05 初回 | 1 | 同じ固定上流・identity・予算 preflight 通過 |
| L4 | PB06 初回 | 1 | 同上。新候補の初回 verification は null |
| L4 のみ | PB05 fact patch | 1 | 別 Human 承認済みで、Application がこの Report fact を狭い修復対象として適格と判定した場合のみ |
| L4 のみ | PB06 post-repair verification | 1 | patch の binding/適用/非対象不変検証が通過し、merged Report が成立した場合のみ |
| 合計 | 2 条件 | **最大 6** | 初回 4 ＋必要な場合だけ追加 2 |

HTTP retry、clarification answer、追加 sample、attempt 3 は各 0。PB01〜04 の実生成/再計画は 0。patch が不要なら 4 呼出し以内で終了し、余った枠を使わない。L3 へ修復を移植しない。L4 でも修復は一度だけで、無効 patch や未解消 finding から二度目の patch に進まない。

条件ごとの quality-stop は独立とし、一方が停止しても、インフラと残予算が正常なら他方の当初承認された評価だけを行える。停止した条件を再開しない。初回の問題、修復適格性、試行回数、修復後の問題を別々に記録し、最終的に成立しても初回失敗は残す。

### 停止と修復の境界

- schema 不正、不完全なモデル出力、Safety・境界侵害、対象外の source/meaning/action 問題、修復不適格、patch binding/非対象不変違反、独立 verification の fail/unknown/欠落/不一致は、その条件を停止する。重大な問題を「表現の好み」へ再分類して継続しない。
- 対象となる Report fact に修復可能性があっても、未承認 profile では停止する。承認済み profile でも対象 path・事実 authority・Plan 不変などの適格条件を満たす場合にだけ追加 2 呼出しへ進む。finding code や severity だけでは適格にしない。
- HTTP failure/timeout、model/version/input identity 不一致、予算不足、accounting/journal 不整合、artifact/manifest 改変は **全条件を即停止**。timeout/結果不明の予約を戻さず、retry/別 model/旧出力/編集例で補完しない。

### 保存と局所 acceptance

新しい独立 run に、固定上流 hash、初回 PB05/PB06 の raw receipt、通常の grounding 結果、全 finding、修復適格性の根拠、patch、merged Report、非対象不変検証、独立 verification、最終 disposition、usage/費用/STOP を保存する。旧 run の output・STOP・receipt・ledger・mapping は不変。旧 A/B と新条件を結び付けて公開しない。

拡大評価へ進むには、まず local で以下を満たし、その後この限定実モデル結果を Human が確認する。

1. 両条件の固定 input/Plan 一致、旧契約不変、実 API 0 の fake capture/contract テストが成立する。
2. L4 の初回/patch の definition を attempt と修復 mode に基づいて明示選択し、誤った contract を dispatch 前に拒否する。
3. L3 最大 2、L4 最大 4、全体最大 6 HTTP を強制し、余分な stage/修復/自動 retry を拒否する。
4. 修復しない正常経路、適格な一箇所の修復、Plan/非対象変更、別 fact、誤った source、stale hash、verification fail/unknown を fake で確認する。報告文の短さや send 比率は合格条件にしない。
5. 独立検証後も同じ fact/source 問題が残れば不成立。material finding が残る回答や失敗した途中 Report を Customer-facing の完成回答として表示しない。

## 3. 金額案と事前予約

料金は [L3 targeted の保存 snapshot](../guidance-quality-v19-l3/targeted/verified-pricing.json)（記録日時 `2026-09-07T14:59:17Z`）だけを計算前提に使った。**今回、現行の公式価格・model 仕様を確認していない。以下は過去単価による未承認の概算であり、現行料金の断定ではない。** 実行前に公式公開単価/仕様を別途 read-only 確認し、取得日時と会計実装の一致を Human 承認 packet に添える。認証情報や Production dashboard は調べない。

保存単価は USD / 100 万 token: input $0.20、cached input $0.02、cache write $0.25、output $1.20。予約では全 input を高い $0.25 とし、cache 割引を当てにしない。output cap は reasoning を含み、二重課金しない。USD のみで計算し、円換算しない。

| stage / contract | 1 呼出しの input 上限案 | output + reasoning 上限 | 1 呼出しの予約額 |
| --- | ---: | ---: | ---: |
| PB05 通常 / PB05 patch | 64,000 | 8,192 | $0.0258304 |
| PB06 初回 / post-repair | 96,000 | 4,096 | $0.0289152 |

既存 targeted cap を据え置く案。新しい patch/verification input が収まることは未確認。`JSON.stringify(complete Responses body)` の UTF-8 byte 数 + 4,096 を既存 transport と同じ保守的な input ceiling として実呼出し前に検査する。tokenizer による実測ではない。新 prompt/schema、修復前後 Report、事実/context、先行 stage 最大出力を含めて確認し、超過時は truncation や上限の無断引上げで通さない。

- 初回 4 呼出しを全て行う場合の予約額: **$0.1094912**。
- 適格な L4 patch/verification まで全 6 呼出しの保守的な最大予約額: **$0.1642368**（input 上限合計 480,000、output 上限合計 36,864）。
- 先行評価の提案 hard cap: **USD $0.20 / 全 2 条件共通 / 未承認**。実費は新しい token usage 取得前には分からない。上記予約額は平均や請求実績ではない。

全呼出し前に stage 全 cap 分を既存永続 ledger へ予約し、`累積予約 + 次の予約 <= 承認額` を満たしてから dispatch する。成功後も予約を返さず、actual usage を別記録する。timeout/unknown outcome は予約を残す。cache-write usage が欠ける場合は既存 `accountUsage()` の下限/上限を残し、下限を請求確定額と呼ばない。料金が変わった場合はこの計算と既存固定係数の整合を再検証し、不一致のまま実行しない。

## 4. 先行評価後の 12-case Expanded Blind QA

[R1 評価計画](../guidance-quality-r1/evaluation-plan.md)で既に選んだ下記 12 件をそのまま使う。期待値は [凍結 cases.json](../guidance-quality-r1/cases.json) が正本。**V17 baseline 対 V19-L4 を各ケース 1 回、最大 24 sessions** とする提案であり、targeted L3/L4 とは別の実験・予算・Human 承認。

| case | 診断目的 / 維持する判定 |
| --- | --- |
| GQ-01 / GQ-02 | お礼の送信可否。事実・希望が同じ質問の言い換えで方向性を反転しない |
| GQ-03 / GQ-04 | 受信した質問への自然な返信。同調で待機/返信へ固定しない |
| GQ-05 / GQ-06 | 初回の誘いと明確に断られた再勧誘の区別。GQ05 の Human accepted clarification を自動的に失敗としない。GQ06 の確認の必要性と拒否の尊重を個別に見る |
| GQ-07 / GQ-08 | 明日の仮約束と期限のない相談の区別。予定確認と返信催促を混同しない |
| GQ-11 | 未返信中の連投。好意や勇気づけで追送を正当化しない |
| GQ-13 | 相手の境界と相談者の気遣いを両方扱う。判断説明だけにせず、温かさを維持する |
| GQ-17 | 原文なしの添削。原文だけを一つ尋ねる必要な確認を維持する |
| GQ-24 | 目の前のお礼への任意返信に答える。別の相談へ逸れず、返信義務・好意の断定を作らない |

GQ29-P3 はこの 12 件へ追加せず、先行評価の prerequisite として別記録にする。3 日間の依頼充足、送信/到達/既読/理解の区別、生活に落とせる具体的な次の一歩、同じ抽象条件の反復を重点確認する。先行評価の固定上流の成功だけで、12 ケースの full-path 成功とは扱わない。

新 QA では相談 input から PB01→適格性/必要時 PB01C→Safety→PB04→PB05→PB06→許可された一度の処理→最終表示を新規に通す。旧 session・旧 mapping・旧生成回答・今回の targeted Report を新 QA の sample に混ぜない。必要な確認で終了した session に clarification answer を追加しない。A/B をケースごとに新しく固定し、Human 完了まで対応表を内部に保持する。公開 URL/本文に version/hash/mapping を出さない。

Human UI は従来の 4 問を維持する: 月の返事としてどちらが良いか、一言の理由、A/B それぞれの重大問題、980 円で受け取るならどちらか。completed/clarification/stopped/not_started を区別し、停止は「回答未成立」、未成立 Report は非公開とする。clarification ペア、回答と clarification の体験差、完成回答同士の品質比較を混ぜない。Human 回答は自動補正しない。

評価は既存 6 軸、質問の言い換えへの安定性、重要な一事実への感度を使う。主行動「一通 send/reply → その後 wait」は send/reply と分類する。send 率、50:50、文字数だけの短文化、リピート誘導を成功指標にしない。Known Open、初回失敗、必要修復数、最終不成立を品質選好とは別に残す。

### 拡大枠の費用・回数は承認前にさらに絞る

既存 8-session profile の cap は PB01 42,000/8,192、PB02 24,000/3,072、PB03 24,000/2,048、PB04 最大 2 × 48,000/8,192、PB05 最大 2 × 64,000/8,192、PB06 最大 2 × 96,000/4,096。PB01C は旧 4 ケースでは 0 だったため、旧 profile を件数だけ 24 にして実行できない。

この既存 9 呼出しの上限だけなら 24 sessions で 216 HTTP、歴史単価の最大予約額 **$4.5990336**。GQ01/02 の提示された未送信文など、凍結 input adapter で PB01C 対象となるものを確認する必要がある。既送信文・受信引用・GQ17 の欠落原文を架空の Candidate にしない。

予算策定用の保守的な外枠として、各 session に PB01C 最大 1 回、cap 42,000/8,192（PB01 と同量を仮置き、未検証）を加えた場合、**最大 240 HTTP、$5.0869632**。拡大 QA の提案 hard cap は **USD $6.00 / 全 24 sessions 共通 / 未承認**。必要な場合だけ実際の stage を呼び、仮の外枠を埋めない。

これは新 PB01C cap や PB04 再計画を許可する実行 manifest ではない。L4 の Report-only 修復に不要な PB04 再生成を認めず、baseline の既存経路との差を明示する。承認 packet では凍結入力、候補 topology、条件別の実際の最大 stage 数、PB01C 本文 byte ceiling、L4 の patch/verification を検証し、この外枠以内へ絞った正確な表を確定する。収まらなければ実行しない。

R1 の旧「24 × 12 = 288 HTTP」は過去の広い設計上限であり、追加枠として併用しない。targeted の最大 6 HTTP/$0.20 と拡大 QA の提案 240 HTTP/$6.00 は別承認・別 ledger とし、一方の残額を他方へ移さない。現行公式価格を確認する前に両予算を確定額として承認済みにしない。

## 5. 次の承認前に必要なもの

現時点は **NOT READY FOR REAL API EXECUTION**。候補の local checks と次評価の計画があっても、以下が未完なら実 API を行わない。

- 最終 candidate HEAD/catalog/hash、固定入力/上流、許される patch path/eligibility、独立 verification、STOP disposition を固定した短い Human 承認 packet。
- 既存 runner/adapter/transport を再利用する新しい限定 profile。PB05 per-attempt contract/PB06 vL4、条件別 stage cap、初回 material-stop と限定修復の承認差分を fake で検証した証拠。
- 新 request 全体の byte ceiling と最大出力、予約・usage 会計、timeout/不整合/上限直前拒否、repair 1 回のみ、retry/sample 0、条件停止と全体停止の検証。
- 実行前の公式 model/単価/仕様の read-only 確認と、料金係数が一致する再計算。新規 run/lock/ledger と、旧 evidence を変更しないことの確認。
- 先行評価への範囲・金額・限定修復の **別 Human 承認**。12-case QA は先行評価確認後に、さらに別の範囲・金額承認。

今回作成したのは本計画だけ。新 runner、run directory、mapping、ledger、実モデル出力は作成していない。実 API・Production・push/deploy は 0。
