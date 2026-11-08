# 安全なローカル閲覧

2026-11-07 JST。終了済みサービスのソースと架空画面を理解するための手順です。最終公開ソースは `38985ccf0c01f31af01ddf5d61ce1dca5d7ea763`。今回の整備では商品コードを変更していません。外部サービスや本番データを再接続しません。

## 最短の起動・停止

対象リポジトリのルートディレクトリでPowerShellを開いて実行します。

```powershell
Set-Location .
node scripts/view-service-record-local.mjs
```

補助が既存の `buildOffline()` で毎回ビルドし、`127.0.0.1:3100` のサーバーと専用Chromeを起動します。開始ページは `http://127.0.0.1:3100/sample-report`。**起動した専用Chrome内で閲覧**してください。通常のログイン済みブラウザで同じURLを開く手順には、ここで設定するブラウザ側の遮断が適用されません。

停止は専用Chromeを閉じるか、起動ターミナルで `Ctrl+C`。サーバーは補助の終了処理で停止します。今回の検証終了後にサーバーは残していません。本文のURLは起動中のサービスを示しません。

自動再確認は次の一コマンドです。架空入力だけを使い、画面確認後にブラウザとサーバーを終了します。

```powershell
node scripts/view-service-record-local.mjs --verify
```

今回実行して成功したのはこの `--verify` による専用Chromeのheadless検証です。通常閲覧は同じ補助の表示モードで、Humanの目視受入は別です。従来の `preview-sample-request-conversion-r1.mjs --lan`、LAN IP、通常の `npm run dev` は今回の閲覧入口に使いません。

## 前提と依存

検証環境はWindows、Node `v24.14.0`、npm `11.9.0`、既存インストールのGoogle Chrome、既存Playwrightライブラリです。これらは検証した組み合わせで、全OS・全Node版の対応保証ではありません。Next.js等の当時の依存は [package.json](../../package.json) と固定された [package-lock.json](../../package-lock.json) に従います。

Playwrightの既定探索先は、検証環境に設定された既存runtimeです。別の既存インストールを使う場合は `--playwright=<Playwrightのモジュールディレクトリ絶対パス>` を指定できます。補助はブラウザや依存を自動取得しません。Google Chromeがなければ起動前に停止します。新しいアカウントや有料サービスは不要です。

依存のない隔離worktreeでは、固定lockfileからの `npm ci --offline --ignore-scripts --no-audit --no-fund` を先に試しました。キャッシュ不足 `ENOTCACHED` で失敗したため、今回だけ公開npm registryから固定依存578 packagesを取得しました。親の本番環境変数を渡さず、空のnpm userconfig、`--ignore-scripts --no-audit --no-fund` を使用。lockfileの取得先は全件npm公式registryで、lifecycle対象はesbuild/unrs-resolverでしたが実行していません。依存取得時の通信と、後述の閲覧時の通信遮断は別です。lockfile・依存バージョンは変更していません。

本番 `.env*`、認証token、過去の `.next`、顧客原本、DB dump、バックアップ、通常ブラウザのCookieを持ち込まないでください。補助は起動時にルートの実dotenvファイルを拒否します。`.env.example` は説明用に参照し、コピーして実Providerの値を設定する必要はありません。

## 通信とデータの境界

- サーバーとビルドは既存 [remediation-offline-runtime.mjs](../../scripts/remediation-offline-runtime.mjs) を再利用。OS実行用の環境変数だけを引き継ぎ、Provider・計測・販売・認証の設定を無効化し、dotenvの読み取りとNodeの外部接続を遮断します。
- 専用Chromeは新規一時プロファイルを使い、サーバーと同じ消去済み環境で起動。HTTP要求は上記の同一originだけを許可し、Service Worker・WebSocket・追加タブ・downloadを制限します。ブラウザのネイティブ通信にも、外部向けDNS拒否と到達不能なloopback proxyを設定します。
- OS全体のfirewall・DNS・通常ブラウザ設定は変更しません。LAN待受、トンネル、公開previewはありません。専用ChromeのTCP接続イベントをnetlogから集計し、生のnetlogは読取成否にかかわらず削除します。結果は `.local-review/viewing-result.json` に保存し、このディレクトリはGit対象外です。
- 検証用の架空入力は保存用実顧客データではありません。実メール・実相談を入れず、実認証・Checkout・生成・メール・復旧処理へ進めません。停止済み外部サービスを再作成しません。

今回の最終検証では、ビルド／サーバーの外部通信試行0、商品閲覧のブラウザ遮断試行0、意図的な遮断自己試験1件でした。専用Chromeのnetlogで非loopback TCP接続イベント0、外部TCP成功観測0を確認しました。これは専用プロセス・設定・観測範囲での結果であり、OS全体のパケットキャプチャやすべての通信経路の形式的証明ではありません。

## 画面対応表

すべて専用Chrome内で同じoriginのパスを開きます。

| パス | 今回の確認 | 版・限界 |
| --- | --- | --- |
| `/` | HTTP 200、本文表示 | 最終公開ソース＋Provider無効の安全設定表示。販売停止表示は公開当時の運用状態とは別 |
| `/sample-report` | WAIT→SEND→WAIT、SEND見出し、相談CTA、1440px／390px表示、390pxで横overflowなし | 最終公開版UI。明示された架空編集見本で、実AI納品結果ではない |
| `/request` | 成人確認、未入力のvalidation、選択肢・架空文入力、鑑定前確認への遷移、戻った後の入力保持 | 最終版UIのローカル範囲。認証／購入までのE2Eは再現しない |
| `/review/account` | HTTP 200、架空の完了・準備中・空状態を含む画面 | ソース内のsynthetic history。実ログイン・実納品履歴の証拠ではない |
| `/review/purchase/confirmation/normal-001` | HTTP 200、固定の購入前確認 | 既存の旧版架空fixture。実Checkoutを開始しない |
| `/review/purchase/trust/preparing` | HTTP 200、準備中fixture | 固定状態。実非同期処理は動かさない |
| `/review/purchase/trust/payment-not-completed` | HTTP 200、決済未完了fixture | 固定状態。実決済を発生させない |
| `/review/purchase/trust/temporary-problem` | HTTP 200、一時問題fixture | 固定状態。実障害／復旧試験ではない |
| `/review/result/result-normal-001` | HTTP 200、既存の14部構成fixture | 初期の固定架空結果。V19-L5の生成・納品結果と同一視しない |
| `/review/error/unavailable-report` | HTTP 200、表示不可fixture | 固定状態。実顧客の障害ではない |

`/review` の索引本文にはMilestone 1時点の古い状態表示があります。V12/V15等のruntimeページも今回の最終版再現としては検証していません。認証・AI・決済・通知・復旧は [機能とフロー](FUNCTION_AND_FLOW.md)、[構成](ARCHITECTURE.md)、[証拠索引](EVIDENCE_INDEX.md) と既存の歴史証跡から理解してください。

## 保存済み画面と後片付け

前回整備の記録では、2026-09-19のChromeによる架空UI資料19枚を目視確認し、明らかな実メール・顧客識別情報・token・管理情報は観察されませんでした。画像は本候補に同梱していません。目視確認は画素全体のOCR機密検査ではありません。確認範囲と評価記録の扱いは [評価集計サマリー](./EVALUATION_EVIDENCE_SUMMARY.md) を参照してください。READMEには古いLAN URL・起動中との記述が残るため、歴史資料として参照し、今回の起動手順には用いません。元の履歴資料は変更していません。

新しい確認画像3枚と検証JSONは `.local-review/` に生成します。提出フォルダーにも安全確認後の代表画像と集計結果を収めます。これらは画面・技術確認で、実機スマートフォン試験やHuman受入を示しません。サーバー終了と3100番待受なしを確認してから作業終了とします。元worktree・未追跡資料・既存バックアップの削除や移動はありません。
