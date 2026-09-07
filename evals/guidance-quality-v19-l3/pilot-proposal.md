# GQ29-P3のみのPB05局所比較案 — 未承認・未実行

今回の追加APIは0。元のFresh runはSTOPPED_INCOMPLETE（完成3・追加確認3・停止1・未実施1）のまま。残枠・旧budget・旧mappingを再利用しない。4ケース全面再生成を次の既定手順にしない。

## 最小の診断対象

GQ29-P3の保存された正確なPB01〜PB04・Application authorityを両条件で同一に固定する。生成へ渡すのは、そのPB05が本来受け取る入力だけ。旧PB05、旧finding、Human評価、正解ラベル、編集上の修復例、case IDは渡さない。

比較は評価済みL2のPB05 v10と後継L3のPB05 v11を各1回。PB06は両方とも同一v9を使い、各々の新しいPB05回答だけを検証する。別runの**2条件×1 sample、最大4 HTTP（PB05各1＋PB06各1）**。これは保存上流を使うstage単位の診断であり、新規の入口からの8-session pilotでも、未実施枠の補完でもない。再試行・修復・追加sample・clarification answerは0。

PB05のraw出力を直接PB06へ渡さない。両条件とも現行Applicationの`groundReportContentV3`、`groundChangeConditionCommentaryV4`、schema・意味形状・選択依頼充足・source/customer integrity検査を同じ順で再利用する（[現行処理](../../lib/assessment/runtime/pipeline.ts:1529)）。raw PB05とApplication補完後のPB06入力は分けて保存する。このlocal処理はHTTP回数を増やさず、Application所有のnull/空欄を理由に比較条件が変わることを防ぐ。

同一gpt-5.6-luna / low / Standardを前提とする提案。Provider/modelの変更は含まない。新しい匿名割当・manifest・run・予算台帳を作り、旧runの完成数に加算しない。runnerのtransport・予約台帳・STOP判定は再利用し、新しい多世代executorやRecovery engineを作らない。

## 費用上限の提案

直前pilotの2026-09-07公式価格確認snapshotを使用した計画値。現在単価の再照会は今回未実施。実行の別承認前に公開価格を再確認し、変更時は再計算する。

| stage | 回数 | input上限/call | output上限/call（reasoning含む） | worst-case予約/call |
| --- | ---: | ---: | ---: | ---: |
| PB05 | 2 | 64,000 | 8,192 | $0.0258304 |
| PB06 | 2 | 96,000 | 4,096 | $0.0289152 |

全inputをcache-write込み$0.25/M、outputを$1.20/Mで予約する保守計算。4呼出し最大予約は **$0.1094912**。提案する新規runのHARD CAPは **USD $0.15**。実際のinputはschema・common/stage instruction・固定authority・直前生成内容を含むrequest全体を既存の保守的推定方式で数え、各stage上限超過ならHTTP前に停止する。

call前にその最大予約額が残予算内か確認する。actual usageを保存し、timeout/unknownでも予約返却しない。HTTP retryは0。初回material Safety/fact/source/meaning integrity、raw PB06 ACTION_CONSISTENCY major/critical、schema/incomplete/identity/accounting/HTTP/timeoutでrun全体STOP。修復で通過させない。

## 事前に固定する判断

- 送信済み・未返信だけから、到達・既読・理解へ強めない。
- 原文の正確な事実だけで理由・3日間の方針・具体的な行動を維持できる。
- 到達不明を理由に不要な追加確認や回答放棄へ変えない。
- 時間条件の分離と明確な境界は維持する。
- 改善を短さ・send率で採点しない。比較後のHuman品質受入は別に記録する。

この2条件診断で新PB05による局所改善が確認されても、4ケース全体の回帰やProduction品質を実証したことにはならない。次の評価拡張は結果を見たHumanの別判断とし、ここでは提案しない。
