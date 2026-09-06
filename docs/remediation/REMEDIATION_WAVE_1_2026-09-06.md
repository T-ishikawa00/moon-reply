# Remediation Wave 1 — local verification and rollout review

Date: 2026-09-06 JST

**Status: LOCAL TECHNICAL PASS. Human Accepted: pending. Production Authorized: no.**

この文書は、2026-09-06 Full Production AuditのF004・F011・F015をまとめたWave終了時のレビュー資料です。Production rolloutは実施していません。全Findingの解消やPaid Delivery Guaranteeの成立を意味しません。

## 1. Scope and local authority

HumanのRemediation Wave Operating Ruleに従い、各Findingを再確認し、最小修正、focused test、関連回帰、独立レビューを経て、Findingごとにlocal commitしました。F004は開始時点でcommit済みの修正を引き継いでいます。

| 項目 | 確認値 |
| --- | --- |
| Checkout / branch | `C:/projects/moon-reply` / `release/private-ready` |
| 今回の開始HEAD | `95b84e71508426f67ae3cd4e7e63961f9b0885e2` |
| Wave累積比較の基点 | `fd01f7fb96241c448f6cbe57a197752cf411e71e` |
| 最終implementation HEAD | `a495bfc16006bca940429f85941e7ec82cd40055` |
| `main` / cached `origin/main` | ともに `61e33a10e195fad17e253a6b9719217e1992f273`、変更なし |
| 開始時 / implementation完了時のworktree | clean / clean |
| Stash / active Git operation | 0 / 0 |
| 別worktree | `C:/tmp/mrexp-e98`、`C:/tmp/mrexp-ea4`は未操作 |
| Remote / Published / live configuration | 今回未照会、current stateはUNKNOWN |
| Push / deploy / remote migration / external write | すべて0 |

この文書だけの後続local commitはimplementation HEADを変更しません。将来のAuthorizationでは、文書commitを含む最終Git SHAと、そのimplementation差分ゼロを確認してください。

元のFinding一覧はCodexタスク `Audit Production Security & Delivery`（thread `01a0734d-3004-73a1-8325-a1cedb863097`）の2026-09-06最終監査レポートを参照しました。元の監査はファイル保存されていません。古いCURRENT_FOCUS、監査のProduction観測、F004文書のremote countsを現在の外部状態として再利用していません。

## 2. Finding commits and verification

| Finding | Local commit | 修正内容 |
| --- | --- | --- |
| F004 | `95b84e71508426f67ae3cd4e7e63961f9b0885e2` — `fix: make result notification retries idempotent` | 通知のcredential・暗号化payload・provider keyを固定。受理不明後も同じ内容を再利用。既存commitを維持し、Waveで再検証。 |
| F011 | `74d61599cda402641a8de39aee5eab62b2b79da5` — `fix: bound purchase status requests` | 状態照会全体に15秒期限。body読取を含めてabortし、既存backoff・retry上限・復旧案内へ接続。古い応答とstop/start競合を拒否。 |
| F015 | `a495bfc16006bca940429f85941e7ec82cd40055` — `fix: fail closed when production compute budget is unavailable` | `NODE_ENV=production`ではprepare・clarificationの両入口で既存Compute policy検証を必須化。budget/Auth不備は依存初期化前に503。 |

F011は修正前にpending fetchのdeadline timerが0であることを再現しました。修正後の連続stallは既存の8-retry budget、計9回で終了します。仮想時計・jitter中央値では271,500msで既存の手動確認・Account・feature-gated Support案内へ進みます。これはテスト条件の経過時間であり、background tabのtimer制限を含むCustomer SLAではありません。AbortSignalを無視するtransportの物理終了は保証しませんが、その遅延結果は採用しません。Payment状態、generation、Checkout再起動は変更していません。

F015は修正前にProductionでもbudget無効時に旧prepareへ到達することを再現しました。修正は `lib/assessment/production/service.ts` の条件2か所だけです。正常設定時は既存のprovider-free intakeとfresh identity付きclarificationを使用します。Production上のPayment `test` / `live`をともに検証。development/testの既存経路、preparation unavailableの404、既払いworkerの有効性は維持しています。Production識別は既存のNODE_ENV境界に従います。

## 3. Cumulative diff audit

Implementation range: `fd01f7f..a495bfc`。3 Finding commits、22 paths、1,903 insertions / 87 deletions。このレビュー文書は別の文書変更です。

Primaryと独立reviewerの両方が累積差分を確認し、追加の実装修正blockerはありませんでした。

- F004の実装・0024・既存rollout文書は、F011/F015による変更なし。
- F011はbrowser pollerだけ、F015はprepayment入口だけに作用し、F004の通知workerへ新しいbudget条件を追加していません。
- `app/`、`components/`、Customer Auth、purchase authority、assessment runtime、prompt/schema、Payment core/service/activation/typesに累積差分なし。
- Next / Netlify / `.env.example` / lockfile / 全pre-0024 migrationsに差分なし。package manifestはverifier commands 4件の追加だけ。
- Product promise、Payment/Refund/Dispute semantics、ownership、Safety/Quality acceptance、retention policy、Provider/modelは変更していません。F004による通知payloadの追加保存は既存修正の範囲であり、保存期間や削除方針の変更はありません。

Verifierの変更もFindingに含めてcommitしています。

- B1：新しいdeadline timerを加えた正確なtimer列を検証。retry回数・backoff・terminal・navigation検証は維持。
- Lightweight intake：旧disabled laneのテストをdevelopmentに明示固定し、finallyで元の環境へ復元。Production拒否はreal policy/environmentを使うF015 verifierが検証。
- Email：F004のhistorical exact 5-file scopeを `fd01f7f..95b84e7` で保持。現在の保護対象ではF015の `service.ts` 以外を差分ゼロに固定。全対象のuntracked禁止、app/migration/integrity検査を維持。

## 4. Full relevant regression

最終implementation HEADで再実行しました。数値付き検証は **260/260 PASS**、別途lightweight intake PASS。失敗したままの必須検証はありません。

| Command | Result |
| --- | --- |
| `npm.cmd run verify:f004` | 26/26 |
| `npm.cmd run verify:f004:db` | 16/16、disposable local PostgreSQL 17、終了後cluster停止確認 |
| `npm.cmd run verify:f011` | 9/9 |
| `npm.cmd run verify:f015` | 8/8 |
| `npm.cmd run verify:rc1` | 19/19 |
| `npm.cmd run verify:rc2` | 55/55 |
| `npm.cmd run verify:rc2:email-provider` | 14/14 |
| `npm.cmd run verify:m1-4:background-fulfillment` | 21/21 |
| `npm.cmd run verify:m2-b1` with process-local `M2_B1_DESCENDANT_REGRESSION=true` | 15/15 |
| `npm.cmd run verify:m2-c1` | 8/8 |
| `npm.cmd run verify:m2-c1:lightweight-intake` | PASS、Production modeでも別途PASS |
| `npm.cmd run verify:m1-4:clarification-contract` | 7/7 |
| `npm.cmd run verify:m2-e3` | 43/43 |
| `npm.cmd run verify:customer-ux-review-fix-r1` | 4/4 |
| `npm.cmd run verify:paid-quality-delivery-guarantee-r1` | 4/4、現在のR2維持の証拠。F007のHuman判断を代替しない |
| `npm.cmd run verify:final-primary-product-function-r1` | 11/11 |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | PASS、warnings 0 |
| `npm.cmd run build` | PASS、47/47 static generation |
| Final `.next/static/**/*.js` server-only marker scan | matches 0 |
| `git diff --check` | PASS |

BuildはNext telemetryを無効化し、`.env.example`のenabled flagsをprocess-localでfalseに固定し、fetch/HTTP/HTTPS/TLSと外向きsocket接続を遮断して実行しました。遮断対象の通信試行記録は0。`.env.local`等の設定ファイルは変更していません。これはoffline build evidenceであり、Production activation/configの証明ではありません。

一時的なbuild用CJS guardがlint対象に入ったため、最初の最終lintはそのファイルのrequire規則で失敗しました。今回作成したguardだけを削除し、標準のfull lintを再実行してPASS。lint設定や検証境界は変更していません。既存のNode module-format performance warningは残ります。

## 5. Migration compatibility

新規migrationはF004の **0024のみ**。F011/F015はmigrationなし。対象は [0024_f004_notification_send_identity.sql](../../supabase/migrations/0024_f004_notification_send_identity.sql)。

Exact committed Git blob SHA-256:

`36d022d30da4532bdbe201d2d7c89c51c9cc47b94868f5179a971cf34f7a9b4e`

Local DB proofは通知関連のauthoritative definitionsに対してapply・ACL・lease・identity immutability・legacy compatibilityを検証しています。Remote DB全体のmigration/ACL一致の証明ではありません。

| Pairing | 判定 |
| --- | --- |
| Old DB + old runtime | 既存状態。F004の欠陥が残る。 |
| New DB + old runtime | Schema-compatible。ただし旧unversioned通知はunsafe。migration自体にdrain機能はない。 |
| New DB + Wave runtime | 意図した組合せ。下記のhold/drain、key継続、routing検証が必要。 |
| Old DB + Wave runtime | 不可。v3/prepare/send RPCが存在せず通知処理がfail-closed。 |
| New DB + old-runtime rollback | 旧通知送信を停止したままにする場合だけ条件付き。schemaを戻してはいけない。 |

詳細は既存 [F004 verification and rollout conditions](../payment/F004_REMEDIATION_R11_VERIFICATION_ROLLOUT.md) を維持します。同文書の過去のremote countsは再測定が必要です。

## 6. Proposed rollout order — not executed or authorized

1. HumanがこのWaveのAcceptanceと別のProduction Authorizationを判断する。最終source SHA、current Published SHA、remote migration predecessors、NODE_ENV、Compute/Auth設定、暗号鍵の継続性をaction-timeで確認する。
2. 旧notification workerへの新規invocation/routingを止める承認済みholdを確立し、queueを保持する。dispatch scheduler停止だけでは、accepted eventsや旧deployment originへのretryを止めた証拠にならない。
3. 旧workerのactive invocations=0、新規旧origin routing=0、旧workerのlive lease=0を確認する。lease期限切れだけをprocess終了と扱わない。実際のhold/drain手段・最大待機時間はUNKNOWNであり、確認不能ならmigration前にSTOP。
4. Hold下で通知状態とlegacy attempted rowsをcount-onlyで再確認する。別途承認された操作として0024だけをapplyし、schema/constraints/RPC/EXECUTE権限をread backする。既存行、lease、credential、queueは手動で修復しない。
5. New DBに対してWaveの最終sourceを一度rolloutする。holdとkeyを維持し、旧deployment originへのroutingを再開しない。既存Ingress source/configを変更する必要はない。
6. 次節の承認済みsmoke範囲でsource/DB pairing、Account、Return、prepayment設定、server-only exclusionを確認する。
7. 保持したeventsが新runtimeだけへ向かうことを確認してholdを解除し、自然処理をcount/safe codeで観測する。手動resend、scheduler Run now、再生成、新規決済を暗黙に含めない。

設定変更はdeploy-versionedである点に注意し、設定保存だけでPublished runtimeが変わったと判断しません。既払いのWebhook/reconciliation/fulfillment/Accountを一括停止する措置へ置き換えません。

## 7. Rollback plan — not executed or authorized

- F011だけの不具合なら、prior client pollerへ戻すsource rollbackを候補とし、F004/F015を維持する新しいreviewed artifactを使用する。旧pollerのhang欠陥が再発するため、復旧導線を再検証する。
- F015で503が出た場合、まず欠落/不正なCompute/Auth設定を安全な属性だけで確認する。budget条件の削除や匿名Provider fallbackを障害復旧の初手にしない。設定修復・追加deployには別の外部操作承認が必要。
- F004を含む全体rollbackでは、holdを再確立して新旧workerをdrainする。0024、暗号化payload、credential、旧v2 guardを保持する。旧workerの通常送信再開は禁止。新payloadを読めない旧runtimeへ無条件に戻さない。
- Queue削除/再作成、DB down migration、lease reset、token再発行、暗号鍵rotation、Customerへの再課金はrollbackに含めない。
- 実際に使えるplatform hold/routing手段が未確認のため、現時点でproduction rollbackの実行可能性を認定していない。

## 8. Production smoke plan — separate authorization required

| 対象 | 確認方法・成功条件 |
| --- | --- |
| Artifact / runtime | exact source SHA、Production mode、0024 pairing、server-only markersのclient不在。keyはpresence/継続性だけを確認し値を出さない。 |
| F011 | 承認済み同一PurchaseのReturn表示に対し、browser側でstatus通信stallを注入。deadline→backoff→既存Recovery導線、late response無視、unmount cleanup、完了navigation1回を確認。新規Checkoutやgenerationの再起動をしない。 |
| F015 正常設定 | enabled budgetのwindow/maximum、Auth gateを属性で確認。承認されたSynthetic intakeではauthentication_requiredへ進みProvider 0。通常clarificationのfresh ownership・budget claimを確認。実Auth/Providerを伴う場合はその操作範囲を明示して別承認を得る。 |
| F015 異常設定 | Production configを故意に無効化しない。Production artifactを使う隔離環境で、budget disabled/unset/malformed、Auth停止の503を確認する。 |
| F004 | count-only状態確認、sent duplicateの無送信、同じcredential/payload/keyの継続、Accountからのowned canonical resultを確認。受理不明/DB ack loss注入は隔離環境で行う。実メール送信は別途明示承認なしに行わない。 |
| 自然処理 | pending/failed/processing/sent、attempted legacy、paid-undelivered、旧origin routingを個別集計。Current値は今回UNKNOWN。 |

Status APIは既存のbounded dispatchを伴い得るため、純粋なread-only smokeとは扱いません。F011のbrowser abortはserver-side処理終了を証明しません。Customer本文・email・token・ciphertext・provider詳細をログや報告へ出しません。

## 9. Remaining Finding registry

Wave 1終了時は3件がLOCAL TECHNICAL PASSで、Production未反映、残り12件はOPENでした。下表はF005の継続追記を除き当時の記録を保持します。Waves 1–3の最新累積状態は[Wave 3 registry](REMEDIATION_WAVE_3_2026-09-06.md#10-all-finding-registry-and-release-conditions)を参照してください。

| Finding | Severity | 状態 / 次の扱い |
| --- | --- | --- |
| F001 Provider期限 / crash後の完成report回収 | High | OPEN。次の技術Wave候補。deadline・checkpoint回収をcurrent sourceで再確認し、fencingを維持する限定修正を検討。 |
| F002 retry終了後のPaid obligation | High | OPEN / HUMAN DECISION。長期復旧状態・救済責任・期限などのProduct/運用契約が必要。 |
| F003 reconciliation停止後の長期照合 | High | OPEN。停止状態と通知欠落を再確認。新しい照合方針や外部運用は明示決定が必要。 |
| F004 result email idempotency | High | LOCAL TECHNICAL PASS `95b84e7`。rollout/key/legacy運用の条件が残る。 |
| F005 匿名受付の永続書込濫用 | High | Wave 1時点OPEN。2026-09-06継続修正 `ad9b867bdb307add23d04f14cef67265625503e2` でLOCAL TECHNICAL PASS。IP拒否後のglobal消費を0031で修正、fake 15/15・local PostgreSQL 23/23。保持方針不変、Production未反映。詳細はWave 3 registry。 |
| F006 全体Compute / 複数identity / SDK retry | High | OPEN。全体上限・Paid容量・retry費用を検討。新しい利用制限やProvider構成はHuman decisionと分離。 |
| F007 Quality materiality / Integrity境界 | High* | OPEN / HUMAN DECISION。現行R2を維持。監査の提案Invariantとの相違であり、過去のAcceptance違反とは断定しない。 |
| F008 以前の候補の保存・再採用 | Medium | OPEN / HUMAN DECISION。採用可能性がQuality境界と結合するため、候補選択契約を先に確定。 |
| F009 旧Paid contractのexecutor共存 | Medium | OPEN。将来version変更の互換設計。現在の非互換発生は未確認。 |
| F010 OTP試行制限のattempt交換回避 | Medium | OPEN。identity規則を維持するdurable limiter候補。閾値・上流設定は未確定。 |
| F011 status fetch hang | Medium | LOCAL TECHNICAL PASS `74d6159`。15秒期限と既存Recovery導線を検証。 |
| F012 CSP / frame防御 | Medium | OPEN。OAuth/Stripe/GA4/Nextとの互換性を確認する限定security wave候補。 |
| F013 dependency advisories | Medium | OPEN。advisoryを最新状態で再確認し、到達性と最小更新範囲を確定。今回dependency変更なし。 |
| F014 Refund / Dispute / Chargeback収束 | Medium | OPEN / HUMAN DECISION。金融状態とCustomer権利のsemanticsを確定してから実装。 |
| F015 budget無効時の旧匿名Provider経路 | Medium | LOCAL TECHNICAL PASS `a495bfc`。Productionの両入口をfail-closed化。 |

Provider key-retentionや実配信のexactly-once、F004 hold/drain手段、current live queue/DB/configはUNKNOWNです。今回のlocal証拠はこれらを解消していません。

**Technical PASS ≠ Human Accepted ≠ Production Authorized.**
