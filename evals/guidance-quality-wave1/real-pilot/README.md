# Human-authorized real model pilot

2026-09-07。Humanが本Taskで8session / USD $2 hard cap / 72 HTTPを承認。Production rolloutではない。既存5459a811のV17/V18、固定GQ05/24/13/GQ29-P3を使う。元の未承認planは準備当時の証拠として保持し、この実行だけを後継Human指示で承認する。

## Isolation and execution

Production source/prompt/schemaの変更0。既存AssessmentApplication.submitと両catalog loaderを再利用し、FakeAssessmentRepositoryをlocalメモリ保存として使う。生成には実API transportだけを使い、fixture出力・期待値・評価ラベル・目標例を渡さない。ProductionのDB/quota/Customer/Stripe/Resend/Discord/設定を使わない。

runディレクトリは固定 `../runs/2026-09-07-authorized-pilot8/`。既存なら実行拒否。削除しない永続lockをwx作成し、再起動・同時実行・同じ承認の再利用を拒否する。全実行共通のhash-chain journalを使い、stage単位で予約→dispatch→usage保存→終了を記録する。

実行前にclean HEAD、5459a811 ancestry、runtime/Production/凍結入力のdiff 0、catalog/hash/modelを確認する。全4caseのA/B mappingを乱数で一度だけ固定し、internalへ保存してから開始。実行順をA/B割当に流用しない。mappingはHuman評価完了まで表示・開示しない。

利用するkeyは既存localのGUIDANCE_PILOT_OPENAI_API_KEY、OPENAI_API_KEY、またはrepo .env.localのOPENAI_API_KEYだけ。値を表示・記録せず、他の認証情報を探さない。送信先はhttps://api.openai.com/v1/responsesへのPOSTのみ、redirect拒否。maxRetries=0、同時呼出し0、180秒timeout、model=gpt-5.6-luna、low、service_tier=default。Production費用DBの代わりに評価専用ledgerだけを使用する。

## Money and stop

送信bodyのUTF-8 byte数＋4096をinput見積上限とし、固定stage cap内か確認する。予約はinput cap×$0.25/M＋output cap×$1.20/M。通貨は整数nano-USDで計算し、全予約合計が$2を超える前に拒否。全72試行の予約上限は$1.5290112。成功時も予約を返却しない。

全byte書込みとfsyncが完了するまで送信しない。IO失敗はledgerを恒久STOPにして次の予約を拒否する。timeout/unknownも予約・試行数を保持。usageは受信後すぐ別のimmutableファイルへ保存し、後続検証失敗でruntime側usage=0になっても実課金記録を失わない。

実usageはinput/cached/cache-write/output/reasoningを保持。cache-write内訳が返らなければ、usageベースの費用を下限/保守的上限で報告し、invoice確定額と偽らない。reasoningをoutputへ二重加算しない。usageの和・内訳・cap・送信前input見積と矛盾すればSTOP。

schemaはPB04の既存Fact ID canonicalizationを保って検証。原文なしなのに意味保存済み等の既存draft-source矛盾、および存在しない理由Fact IDはpilotを停止する。PB06は既存V7のtemporal/neutral-commentary除外後、重大な事実・所有者/文面意味・根拠のない確定・現行行動/接触境界のblocking findingを観測したら停止。style/不足のfindingは既存一回修復まで。severityだけの一括拒否、Production classifier/F007/F008の変更はない。

HTTP失敗・timeout・incomplete・model/契約/tier不一致・schema-invalid・material integrity/Safety・予算台帳不整合の後は呼出しを追加しない。clarificationは結果として保存し、回答しない。未生成結果を編集例や旧候補で納品済みにしない。

## Evidence and Human review

- `internal/manifest.json`、sealed mapping、reservations.jsonl：実行版・匿名割当・予約の内部正本。Human評価前に開かない/表示しない。
- `internal/<session>/call-*`：stage入力hash、実入力、実レスポンスのProduct text/usage、検証とfinding。秘密・認証header・非公開の推論過程なし。
- `internal/<session>/session.json`：入口・初回方向/候補・PB06が実際に見たPlan/Report組・修復directive・最終可否・usage・費用・失敗。初回と修復後を上書きしない。
- `blind-review.html`：実Customer componentを使うA/B表示。詳細は開いて提示。未成立は未成立。4問のHuman入力とJSON download。回答はブラウザ内へそのまま保存し、自動採点・補正しない。
- `blind-review.md`：同じ描画本文をテキスト化した確認用。HTMLが主なHuman比較画面。
- `technical-summary.json`：version/匿名対応を含めない集計。技術結果とHuman品質評価は別。

Humanが評価結果を返すまではmapping開示・勝敗判定を行わない。取得した出力にケース別の実質的な問題が見つかれば再実行せず報告する。

## Local verification before API

`node evals/guidance-quality-wave1/real-pilot/verify.mjs` はネットワークを拒否し、実API 0で予算/短い書込み/IO停止/再起動/lock/HTTP500/timeout/usage/契約/初回と修復の保存/匿名表示を検証する。SDKのHTTP500にもfetch stubで1回だけと確認。16/16 PASS。scoped lint、typecheck PASS。独立read-only reviewの指摘を反映済み。

実行はHumanがこのTaskで承認した一度だけ。このコマンドの記録を新たな再実行許可として扱わない:

```text
node evals/guidance-quality-wave1/real-pilot/runner.mjs --execute-human-authorized-pilot8
```

実行結果は別artifact/後継記録に保持する。Technical completion ≠ Human quality acceptance ≠ Production authorization。
