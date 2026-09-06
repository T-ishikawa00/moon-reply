# Remediation Wave 3 — Local Reliability / Abuse Protection Review

Date: 2026-09-06. Scope: F001 / F003 / F005 / F006. 本文はlocal実装・検証の記録です。Human Acceptance、Production Authorization、Production closureを意味しません。

## 1. Git authority and commits

- Checkout: `C:\projects\moon-reply`, branch: `release/private-ready`。
- 開始HEAD: `3a13bd1d06a658becd07f05dae8ef6328b285ac8`。開始時clean、stash 0。
- 最終実装HEAD: `864aa1467303a9ef927a0847119f8966eeea1e0d`。この記録と累積verifierは別のreview commitに含め、最終commit SHAはtask最終回答に記録します。
- `main` / cached `origin/main`: `61e33a10e195fad17e253a6b9719217e1992f273`。remote freshnessは確認していません。
- Wave 1/2の全local commitsを保持。別worktree、`C:\tmp\mrexp-e98`、global AGENTS/Codex設定は変更していません。

| Finding | Local commit | 内容 |
| --- | --- | --- |
| F001 | `09f3d487a2bde91b8c57e2fc4740cf7ea8546b36` | Provider deadline、SDK retry責任、保存済みcompleted report回収 |
| F003 | `33f25aab60de17680d9345c03199ab93d69929f8` | stopped attemptの永続追跡、低頻度照合、既存operator通知への接続 |
| F005 | `d8758b2ddba1615918060d845136659da52dad9e` | 匿名受付の個別/global durable admission |
| F006 | `f3d295d146113c4689c37518684a83535d9268a6` | Customer予算とglobal quota/concurrencyのatomic予約 |
| F003 corrective review | `864aa1467303a9ef927a0847119f8966eeea1e0d` | test/live混在時のSQL claim environment fence |

F003の追加commitは累積レビューで見つかった環境選択不足の修正だけです。既存commitや0026–0029を改変せず、0030で短期・長期claimの環境を限定しました。Finding間のruntime変更は混ぜていません。F001に含めた共通offline/isolated PostgreSQL helperは、Providerを呼ばない実DB fault injectionを成立させるための検証基盤です。

## 2. F001 — deadline and completed artifact recovery

Current sourceではOpenAI SDKの既定timeout/retryに依存し、generation marker後のlease expiryは完成済みreportがあっても不明結果として停止する経路がありました。

1 invocationの上限を180秒、SDK内部retryを0に固定しました。既存pipelineが再試行を決め、各呼び出しが予算を消費します。worker入口からmonotonic clockで12分のProvider共通deadlineを持ち、nested scopeは残り時間を延長できません。timeout時はsafe errorを返し、AbortSignalを送り、遅れて返った結果を採用しません。

Netlify background functionの15分制約に対し、Providerに12分、その後の保存・完了処理に3分の余白を残す候補です。既存16分leaseは維持しました。180秒は一つのstageが全体期限を消費しないための上限です。p95、Customer SLA、全DB処理のhard deadlineは実測・保証していません。AbortSignalはProvider側の物理停止・費用停止を証明しません。実効SDK設定はinstalled sourceとmock fetchで確認し、制約は[Netlify background functions](https://docs.netlify.com/build/functions/background-functions/)と[OpenAI SDK configuration](https://github.com/openai/openai-node/blob/main/docs/configuration.md)を参照しました。

0026のclaim v3は、同じrequest/Grant/Logical Assessment、現行contract、completed ready run、保存済みreport、失効した非NULL leaseを満たす場合だけ回収ownerを更新します。旧v2はそのまま残ります。回収時もinput hash、contract、ownership、validation evidenceを検証し、canonical commitのowner/live lease/grant/一意制約を通します。generation markerは消去しません。再生成0・canonical最大1を実DBとapplication fakeで確認しました。

report保存前の強制終了、保存済み証拠不整合、過去のmanual review、不明Provider結果は自動再生成しません。F008の未完成・別評価candidate採用は追加していません。

## 3. F003 — stopped reconciliation

既存短期上限6回、batch 4、concurrency 2、lease 24秒、Stripe read 5秒・SDK retry 0を維持します。停止原因を短期の回数・停止日時とともに残し、独立followup tableと未解決viewで追跡します。旧履歴の曖昧なSTOPPED、最終read中のcrash、configuration/integrity不整合はblocked監視として残します。

短期停止の理由が検証済みpending、または明示的なProvider一時障害と証明できるものは自動継続照合します。全instance・両Stripe環境でglobalに最大1 claim/5分とし、各claimで1 readだけ行います。attemptごとの初回待機は1時間、その後1/2/4/8/16/24時間に最大300秒のdeterministic jitterを加えます。次回時刻はread前にDBへ保存し、crash後の即時再試行loopを防ぎます。各回は同じCheckout Sessionを照会し、既存server verificationとatomic verified payment/job作成へ戻します。新規Checkout、再課金、UNKNOWNからの推測的paid/failed変換はありません。

長期claim/finishと新版short finish RPCは5秒で打ち切ります。30秒scheduled functionの開始から12秒を超えた場合は長期laneのclaimを開始せず、次回へ持ち越します。claim後にProvider readが12秒を超えて始まる可能性はあります。旧短期経路・reconcilePaymentAttempt内のDB待ちを含むhard deadlineは保証していません。短期処理の遅延で長期処理が先送りされても未解決viewから消えません。Netlifyの時間制約は[function configuration](https://docs.netlify.com/build/functions/configuration/)を参照しています。

既存operator outboxに`payment_reconciliation_stopped`を追加。支払い未検証・delivery不明・fulfillment未許可を明示し、Customer本文/email、Provider IDは通知へ追加しません。既存の送信ambiguity fenceとcutover gateを保持します。通知を実送信した証拠ではありません。

累積レビューで、旧短期claimと追加長期claimがStripe環境を選別しない不足を確認しました。0030はconfigured Stripe environmentをSQL claim条件に渡し、非対象環境のclaim・停止・materialize・cleanupを0にします。JSでclaim後に捨てる方式は使いません。金融evidence evaluatorや確定終了条件は変更していません。既存RPCと旧migrationは保持します。

## 4. F005 — anonymous admission

F010と同様にdurable RPC、keyed hash、DB expiryを利用しますが、相談受付専用table・HMAC domain・counterを使用します。任意cookie/UUIDやHTTP転送headerをrate identityにしません。信頼するIP取得元はNetlify実行contextの`globalThis.Netlify.context.ip`のみです。IPv4/IPv6を検証・正規化し、既存安定pepperでHMAC化します。DBに生IPや相談対象identityは追加保存しません。[Netlify Functions API](https://docs.netlify.com/build/functions/api/)とinstalled runtime sourceのcontext実装を確認しました。

0028はglobalとIPごとのrequest枠、new intake枠を分け、既存idempotency lock・intake transactionより前に予約します。正常replayはrequest枠だけを消費し、既存capability rotationを維持。新規keyはintake枠も消費します。counterと永続intake作成をatomicにし、未知の応答を無料とみなすrefundはありません。global rowは固定、個別hash rowもglobal request枠で増加を制限し、失効後はbounded lazy cleanupします。既存相談・購入データのretentionは変更しません。

取得元/pepper/config/RPCの不足・障害は503、上限超過は429。旧匿名Provider経路へfallbackしません。Account、既払いfulfillment、照合はこのadmissionを通りません。共有IPや正常replay用にrequest枠とnew intake枠を分けていますが、同じIPでの濫用は通常Customerの受付も一時拒否し得ます。

ProductionのNext/Netlify adapterが実際にこのcontextを提供すること、同じDBへ迂回書込できる旧app/ingressが残らないことはrelease条件です。raw Function invocationそのものの負荷上限や全基盤のDDoS保護を保証する仕組みではありません。

## 5. F006 — unpaid compute quota and concurrency

0029の一つのRPCで、既存Customer C1予算、global invocation unit、global同時実行slotを同じtransactionに予約します。Customer functionの既存bodyは不変です。wrapperで実在するexecuting authorityを明示的に検証し、SQL NULLで所有権検証を通過しないようにしています。quota/slot/Customerいずれかの拒否で部分debitは残りません。予算サービス不明・応答喪失時はProviderを開始しません。

global quotaは固定windowの呼出回数です。厳密な円建て費用上限ではありません。F001によりSDK内部retryは0で、pipelineの各未購入Provider stageが1 unitを予約します。既存Customer別予算を省略・緩和しません。

応答が確実に返った場合はslotだけを解放し、unitは返しません。timeout・response lost・crashはunitとslotを保持し、slotはDB clockによる240秒lease expiryで再利用可能になります。180秒Provider上限に60秒の余白を加えた値です。cleanup障害は検証済みの応答を破棄せず、expiryに委ねます。slotに記録中のinvocationの再claimは追加許可せず、再割当slotへの古いreleaseは拒否します。slot記録を解放した後の同ID再claimは新debitを必要とし、恒久的なinvocation履歴や無料replay権限は設けていません。

Paidはこの未購入quota/slot/configを使いません。application内の論理分離を検証しました。OpenAI accountの物理容量、Provider側の停止、上限超過の実費、Paid向けの外部予約capacityはUNKNOWNです。lease expiryは外部計算終了の証明ではありません。

global拒否はtechnical errorとして保持します。Safety hookの外側で起きた予算拒否をSafety評価失敗へ変換しない最小修正を加え、実際のProvider/Safety failureに対する既存fallbackとQuality acceptanceは保持しました。

## 6. Configuration candidates — unapplied

下記は未測定の推奨候補です。`.env.example`には必須項目名と空値だけを追加し、Productionには設定していません。Customer利用率・購入率・実費に基づく最適値や約束ではありません。

| Setting | 候補 | 根拠・限界 |
| --- | --- | --- |
| `ANONYMOUS_ADMISSION_IP_SOURCE` | `netlify_context` | runtime所有contextのみを許可。release時の実adapter確認が必要 |
| `ANONYMOUS_ADMISSION_WINDOW_SECONDS` | 600 | F010と同じ10分の短いsecurity window。bucketは別 |
| `ANONYMOUS_ADMISSION_MAX_REQUESTS_PER_IP` | 120 | new intake 30に対し4倍のrequest枠で共有IP/replayに余白 |
| `ANONYMOUS_ADMISSION_MAX_REQUESTS_GLOBAL` | 1200 | 全体のcounter/write予約回数を有限化 |
| `ANONYMOUS_ADMISSION_MAX_INTAKES_PER_IP` | 30 | 一つの共有IPを即座に1人扱いで閉じず、新UUID増幅を制限 |
| `ANONYMOUS_ADMISSION_MAX_INTAKES_GLOBAL` | 300 | IP分散時にも新規intake数を有限化 |
| `PREPAYMENT_GLOBAL_COMPUTE_WINDOW_SECONDS` | 86400 | 既存C1 policyの1日単位と比較可能な候補 |
| `PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS` | 100 | Customer側を10 units/dayと仮定した場合の10人分に相当する初期候補。現在のProduction設定やCustomer数の保証ではない |
| `PREPAYMENT_GLOBAL_COMPUTE_MAX_CONCURRENT` | 2 | 未購入側の同時実行を少数に制限。外部Paid capacityの保証ではない |

F005/F006はいずれも有効window内のpolicy変更でquotaがリセットされない設計です。変更はwindow expiryとの整合を確認する必要があります。値の不足・不正はfail closedです。新しいProvider、model、有料基盤は導入していません。

## 7. Migrations and compatibility

| Migration | 内容 |
| --- | --- |
| `0026_f001_completed_fulfillment_recovery.sql` | claim v3追加。旧claim v2/canonical authorityを保持 |
| `0027_f003_payment_reconciliation_followup.sql` | followup table/view/clock/RPC、operator incident追加 |
| `0028_f005_anonymous_admission.sql` | admission counter、HMAC key、atomic intake wrapper |
| `0029_f006_global_unpaid_compute.sql` | global quota、固定32 slots、Customer同時claim/release RPC |
| `0030_f003_reconciliation_environment_fence.sql` | 短期・長期claimの環境限定版追加 |

0024/0025を含む旧migrationはbyte変更なし。0027は既存operator functionに新incidentを混入させない限定条件を加え、新版を追加します。既存incident/rows/APIは互換です。大きなSQL差分の多くはexpand-firstのために維持した既存function bodyです。

Old app + expanded schemaは動作互換ですが、新防御を利用しない旧appが残ればF005/F006は完全には有効化されません。New app + old schemaはmissing RPCでfail closedになり、無制限実行へ戻りません。rollbackで旧appへ戻すと新防御を失うため、それを安全なProduction rollbackと自動判断していません。remote migration applyは0です。

隔離PostgreSQL 17、loopback、synthetic dataで実migration chain、RLS/ACL、並行connection、transaction rollback、backend terminationを検証しています。remote catalog parity、Production既存データ、実DB負荷はUNKNOWNです。顧客データの削除・保持方針変更はありません。

## 8. Cumulative verification and changed files

最終実装と同じsourceで、**累積40/40 verifier PASS**。`node scripts/verify-remediation-wave3.mjs`が各verifierを独立したoffline childで実行します。以下の数は各verifier内の検証単位であり、Production trafficや実Provider試行数ではありません。

| 検証 | 結果と区分 |
| --- | --- |
| F001 deadline / SDK | 12/12。installed SDKにmock fetch、retry/timeout/deadlineの挙動 |
| F001 recovery DB | 13/13。actual migrations、report/canonical commit前後でSQL backend強制終了4回、並行claim/canonical fence |
| F003 core / DB | 11/11 + 17/17。fake payment application、actual migrations through0030、旧RPC互換、test/live混在と独立connections |
| F005 admission / DB | 15/15 + 20/20。fake adapter、実SQL競合・共有IP・再送・global上限・障害・full chain互換 |
| F006 core / integration / DB | 8/8 + 10/10 + 12/12。fake pipeline/SDKと実SQL、Customer/global同時debit、未知応答、backend強制終了1回、Paid分離 |
| Wave 1 F004 / DB | 26/26 + 16/16 |
| Wave 1 F011 / F015 | 9/9 + 8/8 |
| Wave 2 F010 / DB | 12/12 + 9/9。Google/OTP invariant維持 |
| Wave 2 F012 source / F013 dependencies | 13/13 + 12/12。CSP配置、exact dependency delta、offline advisory再現 |
| RC1 / RC2 / Resend | 25/25 + 55/55 + 14/14。fake applicationによる再生成0/一意canonical、Payment/通知回帰 |
| Background durability / worker graph | 21/21 + PASS。120 modules / 408 edges / server-only混入0 |
| M2-B1 / C1 / lightweight intake | 15/15 + 8/8 + PASS。B1は既存のprocess-local descendant regression指定 |
| I2 / I4 | 16/16 + 9/9。旧SQL proofを未変更でdisposable DBに実行、cutover gate、ingressの実build/zip/import |
| Clarification / E3 | 7/7 + 43/43 |
| Auth entry / purchase eligibility / Customer UX | 11/11 + 9/9 + 4/4 |
| Paid Quality R2 / primary product | 4/4 + 11/11。現行policy維持でありF007 acceptanceではない |
| Measurement / PB04 schema / operator notification | 14/14 + 8/8 + 27/27。GA4/Discordはfake、実送信0 |
| Product scope / hosted continuation / product exploration | PASS + 7 cases PASS + PASS。Safety/通常相談/Google ownership/支払い後status回帰 |
| Typecheck / lint | PASS / PASS、lint warnings 0 |
| Production Next build / built HTTP headers | PASS、static generation 47/47、HTTP 14/14。localhostのみ |
| Background asset packaging | PASS、catalog v17/stages7、configured97 / required81 / missing0 |
| Scheduled packaging | 2 functions、zip/syntax/import/schedule PASS、外部API呼出0 |
| Client bundle scan | F005/F006 RPC・config・pepper等のserver marker matches0 |
| Cumulative source diff / migration blobs / dependency scripts | Primary＋独立reviewer確認。helperでruntime19 filesと全migration blobを固定ref照合、package/lifecycle変更0 |
| `git diff --check` | PASS |

実行ログ: `C:\Users\PUBLIC_USER\AppData\Local\Temp\moon-reply-wave3-regression-UWUECA\results.json`と同directoryの40 logs。Build/lint/typecheck/packaging logsはlocal `.tmp/wave3-*.log`。公開registry audit JSONは`C:\Users\PUBLIC_USER\AppData\Local\Temp\moon-reply-wave3-npm-audit-IjDqyP`。これらはlocal temporary evidenceであり、再現手順はcommit済みverifierです。

新DB suitesは各Findingのmigration時点に加え、F003/I2でactual 0002–0030 chainを適用しています。canonical/grant/payment evidence/C1の既存functionとingress ACLを保持。単なるfake DB互換の推定ではありません。Productionへの適用・catalog確認は行っていません。

強制終了の実kill対象は隔離SQL backendです。application中断・旧worker競合はfake applicationとpersisted stateのfault injectionを組み合わせています。実Netlify workerのkill、実Providerの遅延・費用測定は実施していません。

全test/build childはOS実行に必要な環境だけをallowlist継承し、credentials/endpoints/Node preloadsを引き継ぎません。dotenv読込も遮断し、非loopback networkを拒否します。APIはfake/mockです。新しいDB proofは使い捨てclusterにのみapplyし、終了時停止します。公開npm registryのmetadata照会は下記auditとして別集計します。

E3/Resend等のstale verifierは、古い履歴assertionを削除せず、Wave 3のliteral runtime manifestと固定commit blob、旧migration不変、新migrationの完全一致を追加しています。worker graphは既に廃止された同期measurement hookのassertionを、既存0023 triggerとscheduled pathの現行境界へ更新しました。Safety・identity・canonical・Paid・F013 lock invariantは維持しています。

I2は既存Docker cluster依存を使い捨てPostgreSQLへ変更しました。I4は既に6回だったretry上限への古い5回assertと0019までのinventoryを、既存historical hash＋追加migrationのliteral blob allowlistへ更新しました。ingress buildの出力先だけを所有temporary directoryへ固定し、既存distは移動・削除しません。初回fixtureのtest/live変更は既存immutable triggerに拒否されたため、fixtureを最初から正しいmodeでINSERTするよう訂正しました。安全Invariantをtestのために緩和した修正はありません。既存Node module-format performance warningは残ります。

実装commit範囲 `3a13bd1..864aa14` は44 files、4,236 additions / 155 deletions。累積verification/documentationの5 filesを合わせ、Wave 3全体の変更対象は49 filesです。

```text
.env.example
docs/remediation/REMEDIATION_WAVE_3_2026-09-06.md
lib/assessment/production/anonymous-admission-runtime.ts
lib/assessment/production/anonymous-admission.ts
lib/assessment/production/application-runtime.ts
lib/assessment/production/application.ts
lib/assessment/production/fakes.ts
lib/assessment/production/global-unpaid-compute-runtime.ts
lib/assessment/production/global-unpaid-compute.ts
lib/assessment/production/supabase-repository.ts
lib/assessment/runtime/openai-transport.ts
lib/assessment/runtime/pipeline.ts
lib/assessment/runtime/provider-deadline.ts
lib/payment/production/operator-notification-supabase-repository.ts
lib/payment/production/operator-notification.ts
lib/payment/production/reconciliation-scheduler-runtime-service.ts
lib/payment/production/recovery-schedulers.ts
lib/payment/production/stripe.ts
lib/payment/production/supabase-repository.ts
lib/payment/production/worker-service.ts
scripts/remediation-local-postgres.mjs
scripts/remediation-offline-runtime.mjs
scripts/remediation-wave3-evidence.mjs
scripts/run-remediation-offline.mjs
scripts/verify-f001-provider-deadline.mjs
scripts/verify-f001-recovery-db.mjs
scripts/verify-f003-payment-reconciliation-db.mjs
scripts/verify-f003-payment-reconciliation.mjs
scripts/verify-f005-anonymous-admission-db.mjs
scripts/verify-f005-anonymous-admission.mjs
scripts/verify-f006-global-unpaid-compute-db.mjs
scripts/verify-f006-global-unpaid-compute.mjs
scripts/verify-f006-global-unpaid-integration.mjs
scripts/verify-m1-4-async-router-worker-graph.mjs
scripts/verify-m1-4-background-fulfillment-durability.mjs
scripts/verify-m2-b2-i2-private-recovery-schedulers.mjs
scripts/verify-m2-b2-i4-cutover-safety-controls.mjs
scripts/verify-m2-c1-prepayment-compute-budget.mjs
scripts/verify-m2-e3-account-my-reports-result.mjs
scripts/verify-operator-discord-notifications-r1.mjs
scripts/verify-product-exploration-blockers-11-13-r1.mjs
scripts/verify-rc1-production-fulfillment-core.mjs
scripts/verify-rc2-resend-email-provider.mjs
scripts/verify-remediation-wave3.mjs
supabase/migrations/0026_f001_completed_fulfillment_recovery.sql
supabase/migrations/0027_f003_payment_reconciliation_followup.sql
supabase/migrations/0028_f005_anonymous_admission.sql
supabase/migrations/0029_f006_global_unpaid_compute.sql
supabase/migrations/0030_f003_reconciliation_environment_fence.sql
```

## 9. Dependency audit and cumulative risks

Wave 3のpackage.json / package-lock.json / package scripts / lifecycle / dependency versionsはWave 2から変更なし。2026-09-06にProduction credentialsを継承しない環境で公開npm registryへaudit metadataだけを再照会しました。

- Production dependencies: **0 vulnerabilities**。
- 全dependency tree: **2 high entries**（`toml` / `@netlify/zip-it-and-ship-it`、dev tooling）。Wave 2と同じ残存範囲。
- browserslist / fast-uriのWave 2 minimal patchとexact lock integrityは維持。tomlはDeferred candidateのまま。Risk Accepted / 完全Closedではありません。
- registryの自動fix候補はmajor version変更を含むため実施していません。install/update/lifecycle実行0。

累積の主要な残余リスクは、外部Providerがabortを無視した後の物理計算、旧appとの混在、新required config不足による拒否、共有IPでの一時拒否、DB outage、未解決の曖昧なPaid義務、Production未観測のCSP/ingressです。これらをlocal PASSで解消済みとは扱いません。

## 10. All Finding registry and release conditions

| Finding | Local disposition | Production released |
| --- | --- | --- |
| F001 | Local fixed / verified。現行completed runのみ回収。不明結果は停止維持 | No |
| F002 | Blocked by decision / 未実装。Paid obligation / Human Rescue対象外 | No |
| F003 | Partial。追跡と証明できる一時障害の継続照合はlocal verified。原因不明の旧停止はblocked監視、全停止paymentの自動解消は未成立 | No |
| F004 | Wave 1 local verified `95b84e7`。hold/drain未確定 | No |
| F005 | 2026-09-06継続修正 `ad9b867bdb307add23d04f14cef67265625503e2` でLOCAL TECHNICAL PASS。0031によるIP拒否とglobal枠の分離を再検証。旧Local fixed判定の不足と根拠は下記。trusted context・全ingressの実環境確認は未実施 | No |
| F006 | Local fixed / verified。未購入invocation/論理slotのみ。外部実費・物理容量UNKNOWN | No |
| F007 | Blocked by decision。現行Quality R2を維持、acceptance変更なし | No |
| F008 | Blocked by decision。過去candidate採用方針対象外 | No |
| F009 | OPEN / architecture対象外。多世代executor未実装 | No |
| F010 | Wave 2 local verified `6ab35e7`。0025未apply、安定pepper必要 | No |
| F011 | Wave 1 local verified `74d6159` | No |
| F012 | Partial。最小frame/header防御local verified、resource CSPはReport-Only | No |
| F013 | Partial。browserslist/fast-uri fixed、toml Deferred candidate | No |
| F014 | Blocked by decision。Refund/Dispute金融状態の変更なし | No |
| F015 | Wave 1 local verified `a495bfc` | No |

### F005 local corrective verification — 2026-09-06

開始authorityはCurrent Gitの`release/private-ready@1d76fbac123aa71957a7c698be6de1e1537e4f4e`、worktree clean、stash 0。会話履歴や過去のProduction観測を再現根拠にしていません。修正commitは`ad9b867bdb307add23d04f14cef67265625503e2`。この継続記録はFinding Registryだけの後続更新です。

**未達Invariant:** 同じIPがrequest上限に達した後の追加拒否は、他IPのglobal request枠を消費してはならない。別IPに個別枠とglobal枠が残る場合、新規受付と正常replayが継続できる必要があります。0028はIP判定より前にglobalを加算していたため、有限の数値調整では拒否リクエストによるglobal枯渇を防げませんでした。

旧Local fixed判定は不十分でした。fake 15/15はSQL内の消費順序を検証せず、旧DB 20/20は各上限を個別に確認していました。並行replay caseでは24 requestsのうちIP側12件拒否でもglobal=24を期待値にしており、IP上限到達後の大量拒否と別IPの継続性を検証していませんでした。旧記録のPASS件数は歴史的な実行結果として保持し、今回の修正を含む閉鎖根拠には使用しません。

追加migration `0031_f005_anonymous_admission_isolation.sql`は同じv2 RPCのglobal加算をIP policy/request判定の後へ移すだけです。0028を含む既存migration、RPC signature/ACL、global上限確認の位置、lock順序、window/counter、旧v1 authorityを保持します。正常replay、idempotency conflict、intake上限拒否、内部失敗の予約消費とrollback境界は変更しません。Product仕様、Safety、Payment、Quality、retention、envは変更していません。

| Local verification | Result |
| --- | --- |
| 修正前のred test | 推奨値600秒 / IP request120 / global request1200 / IP intake30 / global intake300で、期待global120に対し実測1200となりFAIL。隔離PostgreSQLで再現 |
| 旧0028の再現を残す回帰 | actual 0002–0030 chain、同一IP1440回でIP120 / global1200、別IPは`request_limited`。synthetic transactionをrollback |
| 修正後の推奨値 | 同一IP1440新規key試行で30 admitted / 90 intake-limited / 1320 request-limited。IP/globalはrequest120・intake30。別IP新規受付とreplay成功後global122・intake31 |
| Focused fake / PostgreSQL | 15/15 + 23/23 PASS。独立connection競合、IP policy不一致の非消費、global上限後のbucket非増加、既存replay/conflict/失敗/expiryも維持 |
| Actual 0002–0031 chain | PASS。既存bucketの全値、他function定義、function owner/ACL/config、table owner/ACL/RLSを0031前後で照合。旧intake不変、service ACL下の新規/replay成功 |
| Relevant cumulative regression | 40/40 verifiers PASS。初回38/40、0030固定inventoryだけで失敗したE3/Resendの2本をexact0031追加後に再実行して2/2。Auth/OTP、Paid/通知、C1/F006、Safety/Quality、I2/I4等の既存回帰を維持 |
| typecheck / lint / local build / diff | 全てPASS。lint warnings0、Next static generation47/47、外部network attempts0。独立diff reviewもblocker0 |

集中1440回のcaseは一つのlocal transactionです。並行性は別caseの独立connectionsで検証しており、実trafficの負荷試験とは扱いません。local PostgreSQLの2つの使い捨てclusterは停止済みです。上限に達した既存bucketは修正適用だけではresetされません。生のFunction invocation負荷や共有IP・window境界の公平性を新たに保証しません。

再現entry pointは`node scripts/verify-remediation-wave3.mjs`。今回のログは`C:\Users\PUBLIC_USER\AppData\Local\Temp\moon-reply-wave3-regression-W8hwBc`（40本初回）と`C:\Users\PUBLIC_USER\AppData\Local\Temp\moon-reply-wave3-regression-K6Swur`（2本再検証）。一時ログがなくてもcommit済みverifierからlocalで再現できます。

F005修正commitの変更は、0031、`verify-f005-anonymous-admission-db.mjs`、`remediation-wave3-evidence.mjs`、`verify-m2-b2-i4-cutover-safety-controls.mjs`、`verify-m2-e3-account-my-reports-result.mjs`、`verify-rc2-resend-email-provider.mjs`の6 filesです。4つの周辺verifier/evidence変更は0031のexact inventory/blob追加に限定し、旧固定refと旧blob検証を残しています。

累積registryはLocal verified 7件（F001/F004/F005/F006/F010/F011/F015）、Partial 3件（F003/F012/F013）、decision待ち4件（F002/F007/F008/F014）、OPEN architecture 1件（F009）。F005以外の判定は変更していません。Production rollout/readiness確認へは進まず、Production/external状態は今回UNKNOWNです。push / deploy / external operation / remote apply / Provider実行 / env変更 = **0**。`C:\tmp\mrexp-e98`へのアクセス・変更は行っていません。

累積リリース前に必要な条件は、expand schema成立、新config値の判断、安定pepperの全instance共有、Netlify trusted IPと既存ingressの確認、旧worker/appの混在解消、F004 hold/drain、F012 resource CSP/最終edge headers/HSTS確認、F013 toml残存判断です。F003でblocked監視に残る旧UNKNOWNの処置はF002等のHuman判断と分離します。

これはrelease条件の一覧です。Production rolloutの実行、hold/drain実行、remote apply、外部設定変更を行っていません。詳細なProduction rollout手順・承認は別段階です。

worktreeはreview commit後にcleanであることを最終確認します。実装終了時の未commit対象はこの文書と累積verifierの5 filesだけです。stash 0、main/cached origin-mainと保護対象worktreeの登録HEADは開始時のままです。push / deploy / publish / remote migration / Production DB write / 外部設定変更 / Provider生成 / email・Discord実送信 = **0**。

**Technical PASS ≠ Human Accepted ≠ Production Authorized.**
