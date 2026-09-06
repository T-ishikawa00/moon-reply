# Remediation Wave 2 — Security Hardening Local Batch

Date: 2026-09-06 JST

**Local implementation / regression: PASS. F013 toml: Deferred / Risk Accepted candidate. Human Accepted: pending. Production Authorized: no.**

対象はF010・F012・F013のみ。F001/F003、F002/F007/F008/F009、F005/F006、F014には進んでいません。Wave 1の修正は保持しています。Production rollout手順の新規作成、F004 hold/drainの決定・実行は今回の対象外です。

## 1. Authority and Git state

| Item | Value |
| --- | --- |
| Checkout / branch | `C:/projects/moon-reply` / `release/private-ready` |
| Remeasured starting HEAD / cumulative base | `195e9ef99724fd7420610f1fc3b0e60389639d39` |
| Starting worktree / stash / active Git operation | clean / 0 / 0 |
| Final implementation HEAD / review時HEAD | `6a049b08c16b08fde7f82bb165aed0fc4e6577d7` |
| Implementation完了・文書作成時worktree | source/test/lock変更は全commit済み。この文書だけが未追跡 |
| `main` / cached `origin/main` | `61e33a10e195fad17e253a6b9719217e1992f273` |
| Protected worktree | `C:/tmp/mrexp-e98` 未操作。他のworktreeも未操作 |
| Remote refs / deployed source / live DB or configuration | 今回未照会。current stateはUNKNOWN |
| Push / deploy / remote migration apply / Production or external application write | すべて0 |

Dependency調査に必要な公開advisory・npm registry照会、audit、package downloadを実施しました。Productionサービスへの書込、email/Discord実送信、Production負荷試験はありません。設定ファイル・secretの変更はありません。

この文書だけの後続local commitはimplementation差分を追加しません。最終文書commitのSHAは完了報告で示します。

## 2. Finding status and commits

| Finding | Local disposition | Commit |
| --- | --- | --- |
| F010 Account OTP limiter bypass | Fixed — local technical verification | `6ab35e74dd94d2e67d4bcd92e103c569bba03332` — `fix: make account OTP throttling durable per identity` |
| F012 Browser Security Headers / CSP / frame | Fixed for minimum safe configuration; resource CSP enforcement remains release-time follow-up | `fcffe9a0a0424c308f70130e95a7f8cb69173779` — `fix: add frame protection and staged browser security headers` |
| F013 Dependency advisories | browserslist / fast-uri Fixed locally; toml Deferred / Risk Accepted candidate | `6a049b08c16b08fde7f82bb165aed0fc4e6577d7` — `fix: patch reachable dependency advisories with minimal updates` |

Risk Accepted candidateはHumanによるRisk Acceptanceを意味しません。上記のFixedもProductionへの反映・監査FindingのProduction closureを意味しません。

## 3. F010 — durable target-identity throttle

Current sourceで、Account OTP verifyのbucketがattempt cookieのsecretだけで分かれ、process-local Mapに依存することを再確認しました。cookieを交換・新規生成すると対象emailが同じでもbucketが変わります。

修正は既存Account OTP request/verify routeへのimportとawait admissionの追加、server-only throttle、expand migrationです。Google、session、fresh identity、Supabase OTP security、購入Authの規則を変更していません。

| Property | Implementation |
| --- | --- |
| Identity | 既存Authと同じtrim / NFKC / lowercase email正規化後、HMAC-SHA256 |
| Key | 既存`EMAIL_VERIFICATION_SECRET_PEPPER`、最低32 UTF-8 bytes。専用domain `moon-reply:account-otp-throttle:v1:`で他用途と分離 |
| Durable storage | `account_otp_throttle_buckets`。hash / purpose / timestamps / countのみ |
| Request maximum | 対象identityごとに5回 / fixed 600 seconds |
| Verification maximum | 対象identityごとに10回 / fixed 600 seconds |
| Window | DB clock。拒否で延長せず、期限到達後の最初の試行から次window |
| Success / provider error | 成功時は既存attempt cookieをclear。共有counterは成功でもresetしない。Provider失敗もadmitted slotを消費 |
| Cleanup | 600秒で論理失効。後続throttle trafficで期限切れ行を最大100件ずつlazy delete。trafficがなければ物理削除時刻は保証しない |
| Concurrency | atomic UPSERT。対象counterのlockを先に取得し、cleanupは`FOR UPDATE SKIP LOCKED` |
| Access | RLS有効。raw tableのPUBLIC/anon/authenticated/service_role権限なし。service_roleだけにSECURITY DEFINER RPCのEXECUTEを許可 |
| Failure | RPCに5秒abort期限。設定欠落、missing migration、DB error、不正receiptは503でAuth呼出し前に停止。Map fallbackなし |

既存cookie/IP-independent global/process limiterは補助として残ります。durable throttleはIP変更でも対象identityを共有します。requestとverifyは別budgetで、再送による検証budgetの補充はありません。

平文email、OTP、IP、cookie、Auth user ID、Purchase/Session情報を新tableへ保存しません。keyed hashは匿名化保証ではなく、アクセス制限されたsecurity counterの識別子です。全instanceで同じpepperの継続が必要です。pepper変更はbucketの連続性を失わせるため、安易なrotationを復旧策にしません。

Fixed windowの境界近くでは隣接するwindowの試行が短時間に集中し得ます。target単位の拒否は、攻撃対象になったCustomerのOTPもwindow満了まで拒否します。Googleはこの新throttleの依存外です。Supabase自身のOTP制限を緩める変更はありません。実Customer trafficでの拒否率・上流設定は今回未観測です。

## 4. F012 — staged browser policy

Current source/configではresult/accountのprivacy headersのみで、共通CSP/frame防御はありませんでした。`next.config.ts`の先頭に全path共通ruleを追加し、その後に既存result/account ruleを完全保持しました。

| Mode | Policy / reason |
| --- | --- |
| Enforced | `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`。既存flowに不要な埋込・plugin・外部baseを拒否 |
| Other headers | `X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin` |
| Permissions | camera / microphone / geolocation / browsing-topicsを無効化。既存draft copyのClipboardは維持 |
| Resource CSP | Report-Only。inline Next runtimeやGA4を含む完全なenforce値のProduction観測がないため |
| Development | Report-Onlyだけにunsafe-evalとws:/wss:を追加。Production/testには含めない |
| Reporting | 新しいreport sinkなし。URLやCustomer識別子を含み得るCSP reportを外部送信しない |
| HSTS | app/Netlify sourceに追加しない。hosting edgeのcurrent HSTS値・最終header compositionはUNKNOWN |

Source inventoryとReport-Only値：

| Directive | Sources / evidence |
| --- | --- |
| default-src | `'self'` |
| script-src | `'self' 'unsafe-inline' https://www.googletagmanager.com`。Next hydration、homepage JSON-LD、`MeasurementBootstrap`のgtag script |
| connect-src | `'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com`。browser API fetchは同origin。GA4のsignal/ad personalizationは既存false |
| img-src | `'self' data: https://*.google-analytics.com https://www.googletagmanager.com`。現在のapp画像はlocal/inline |
| style-src | `'self' 'unsafe-inline'`。compiled CSSとreview inline style |
| font-src | `'self'`。system/local fonts。Google Fontsなし |
| frame-src | `'none'`。現在のAuth/Checkoutはiframeなし |
| form-action | `'self'`。フォームは同origin APIへ送信 |
| frame-ancestors | `'none'`をEnforcedで指定 |

Google Authは同origin APIから得たURLへのtop-level navigation、Stripeも検証済み`checkout.stripe.com` URLへのtop-level navigationです。現在のsourceにはGoogle GSI、Stripe.js、embedded Checkoutがありません。Supabase Auth SDKはserver-onlyです。これらを理由にGoogle/Supabase/Stripeのresource wildcardを追加していません。

厳格nonce CSPは、Nextのdynamic rendering/cache設計に影響します。今回は新しいnonce処理やCustomer flow変更を導入せず、resource enforceの判断をrelease-time follow-upに残しました。Report-Onlyはscript/resourceの攻撃を阻止する証拠ではありません。[Next CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy)、[GA4 CSP guidance](https://developers.google.com/tag-platform/security/guides/csp)。

Account/Resultの`private, no-store`・`no-referrer`・`noindex, nofollow, noarchive`を実HTTPで確認しました。Accountのsource上の`Vary: Cookie`も維持しています。ただしNext 16.3.3のApp Page runtimeはVaryをRSC関連値で上書きするため、local HTTPではCookieが含まれません。変更していない`app-page-runtime.js`のsetter、AppPage moduleの`getVaryHeader`、built SSR chunkで原因を確認しました。F012直前とのNext lock/Proxy/Account source差分は0です。baseline HTTPを別buildして比較した証拠ではなく、source比較とframework実装に基づく既存制約の判定です。今回の変更によるprivacy弱体化は認められません。

Built HTTP smokeはdisabled Auth/Payment設定と架空selectorによるheader検証です。`/account/results/invalid`の200はstreamed error boundaryで、owned result取得成功を意味しません。Google/Stripeのactive flowは既存synthetic regressionとsourceで確認し、実Googleログイン・Stripe決済・GA4送信は実行していません。Netlify edgeを経たheader合成と実browserのCSP違反確認は後続のrelease-time検証です。[Netlify header scope](https://docs.netlify.com/manage/routing/headers/)。

## 5. F013 — advisory reachability and minimal remediation

Current lockの3 packagesと、その親packageをdependency tree・source・公開advisoryで再確認しました。auditのseverityだけではProduction exploitabilityを判定していません。

| Package | Tree / actual reachability | Remediation |
| --- | --- | --- |
| browserslist 4.28.5 | dev transitive。eslint-config-next → react-hooks/Babel compilation targets。Customer由来のquery/custom statsを渡す経路は未検出 | 4.28.9へpatch更新。advisoryのpatchは4.28.7以降 |
| fast-uri 3.1.5 | runtime transitive。Ajv 8.20.0 → `ajv/dist/runtime/uri.js`。`validation.ts`が固定local schemaをcompile。package自体には到達するが、Customer入力をURI authority policyへ渡す経路やremote schema loadingは未検出 | 3.1.7へpatch更新。npm auditにまだ含まれない9月2日の追加修正も含む |
| toml 3.0.0 | direct dev + zisi 15.4.0 transitive。local verifiersは固定`netlify.toml`をparse。zisiはRust `Cargo.toml`のbuild時parse。app/lib/function runtimeの直接importなし、Rust functionなし | Deferred / Risk Accepted candidate。3.xにpatch/minor修正なし。prototype pollutionは4.1.2、recursionは4.2.0で修正 |

Sources: [browserslist custom stats advisory](https://github.com/browserslist/browserslist/security/advisories/GHSA-73wf-gq98-2v4g)、[fast-uri 3.1.7 security release](https://github.com/fastify/fast-uri/releases/tag/v3.1.7)、[toml prototype pollution advisory](https://github.com/advisories/GHSA-v5mp-jgw5-2x6j)、[toml recursion advisory](https://github.com/advisories/GHSA-82x6-q7mm-w9cf)。

`toml`のdirect dependencyだけを4.xにしても、zisiの`^3.0.0`は残ります。調査時の新しいzisi 15.5.0も同じ制約です。完全解消にはparent range外のoverrideやtoolchainの互換検証が必要です。今回の安全なpatch/minor updateに収めるため保留しました。npm auditの提案するzisi major downgradeは採用していません。未信頼repository/configをこのtoolchainで処理する場合は現在の到達性評価を再検討する必要があります。

Actual local update: `npm.cmd update browserslist fast-uri --ignore-scripts --no-audit --no-fund`。追加install lifecycleは実行していません。package.jsonのdirect dependency / major versions / overrideは変更なしです。

| Changed lock entry | Before → after |
| --- | --- |
| browserslist | 4.28.5 → 4.28.9 |
| fast-uri | 3.1.5 → 3.1.7 |
| baseline-browser-mapping | 2.10.42 → 2.11.21 |
| caniuse-lite | 1.0.30001803 → 1.0.30001810 |
| electron-to-chromium | 1.5.389 → 1.5.422 |
| node-releases | 2.0.50 → 2.0.54 |
| update-browserslist-db | 1.2.3 → 1.3.2 |

後半5件は新browserslistの要求するbrowser data/tool dependenciesです。全7件をparent semver範囲内で固定し、それ以外のlock entryはbaselineから完全一致させるverifierを追加しました。Nextのvendored browserslist copyを更新したとは主張しません。

| Audit | Before | After |
| --- | --- | --- |
| `npm audit --json` | High 4 package entries | High 2 package entries: toml / @netlify/zip-it-and-ship-it |
| `npm audit --omit=dev --json` | High 1: fast-uri | 0 |
| Other severities | Critical / Moderate / Low = 0 | Critical / Moderate / Low = 0 |

High 2は2つの独立したProduction exploitを意味せず、tomlとその親への伝播を含むnpmのpackage-level集計です。全dependency auditはcleanではありません。Production dependency auditが0であることも、一般的な脆弱性不存在やProduction安全性の証明ではありません。

Lockfile LF-normalized SHA-256: `ed4490445b405237a7e4d27137ef4d468932311837da0e790ef19ab4d773c242`。Registry tarball integrity、installed versions、parent ranges、root scripts、変更packageのscripts/lifecycleを検証しました。URI authority injection / bracket / IDN、Ajv local reference、browserslist custom stats / bounded cacheのoffline regressionもPASSです。

6 packageのscriptsは不変。baseline-browser-mappingのmaintenance scriptsだけが`update-data-file / check-data-changes`から`update-timeline / check-timeline-changes`へ変わっています。7件ともinstall/preinstall/postinstall/prepare/prepublish hooksはありません。package.jsonは今回のverifier command追加だけです。

`npm ls browserslist fast-uri toml --all --json`はexit 0。expanded `npm ls --all --json`もexit 0でinvalid/missingなしですが、既存のoptional-platform extras `@img/sharp-wasm32@0.35.3`と依存`@emnapi/runtime@1.11.2`が表示されます。両者は変更していないroot lock entriesと現在のhidden lockに存在し、installed file日時は今回より前の8月19〜20日です。更新前のhidden lockとの比較証拠はありません。今回のupdate由来ではないと判定し、削除していません。

## 6. Migration compatibility

Wave 2の新規migrationは[0025_f010_account_otp_throttle.sql](../../supabase/migrations/0025_f010_account_otp_throttle.sql)だけです。0002〜0024はGit blob単位で変更なし。0025は独立table/index/functionを追加し、既存Auth/Payment objectの変更やbackfillはありません。

0025 committed Git blob SHA-256: `94a640a1b67f10921b87f8452ec000e98ef69317d953bf1d2e4a32202464c9b3`。

| Pairing | Local assessment |
| --- | --- |
| Old app + old DB | 既存挙動。F010 bypassが残る |
| Old app + expanded DB | 既存API/schemaと互換。新table/RPCを利用しない |
| Wave 2 app + expanded DB | 意図した組合せ。instance共通のpepperと既存admin credentialが必要 |
| Wave 2 app + old DB | Account OTPはmissing RPCにより503。Google/sessionは新依存を持たない |

Disposable local PostgreSQL 17で0025 apply、ACL、DB clock expiry、30 independent connections、cleanup lock orderingを検証しました。既存object sentinelは不変です。全remote catalog/trigger/migration状態のparity検証ではありません。remote applyは0。将来の実行時はexpandをappより先に成立させる必要がありますが、ここではrollout手順を作成・承認していません。

## 7. Cumulative diff and regression

Implementation range: `195e9ef..6a049b0`。3 Finding commits、17 files、1,235 insertions / 53 deletions。このレビュー文書は別の文書変更です。

```text
app/api/auth/account/email-otp/request/route.ts
app/api/auth/account/email-otp/verify/route.ts
lib/customer-auth/account-otp-throttle-runtime.ts
lib/customer-auth/account-otp-throttle.ts
next.config.ts
package-lock.json
package.json
scripts/remediation-offline-runtime.mjs
scripts/verify-f010-account-otp-throttle-db.mjs
scripts/verify-f010-account-otp-throttle.mjs
scripts/verify-f012-browser-security.mjs
scripts/verify-f012-built-headers.mjs
scripts/verify-f013-dependencies.mjs
scripts/verify-m1-4-background-runtime-assets.mjs
scripts/verify-m2-e3-account-my-reports-result.mjs
scripts/verify-rc2-resend-email-provider.mjs
supabase/migrations/0025_f010_account_otp_throttle.sql
```

Primaryが全Findingの差分・相互影響をレビューし、独立reviewerもF010/F012のcross-effectとclient除外を確認しました。新規実装blockerはありません。Customer UI、Google/session/identity rules、Payment/Refund/Dispute semantics、Safety/Quality acceptance、Customer retention policy、Provider/model、Netlify設定、既存migrationsに変更なしです。F013は主要libraryを更新せず、指定7 lock entriesだけを変更しています。

最終implementationと同じsource/dependenciesで、数値付き検証は**362/362 PASS**。別途lightweight intake、background asset proof、2 scheduled function packagingもPASSです。失敗したままの必須技術検証はありません。全dependency auditには前述のDeferred 2 high entriesが残ります。

| Command | Result |
| --- | --- |
| `verify:f004` / `verify:f004:db` | 26/26 + 16/16 |
| `verify:f011` / `verify:f015` | 9/9 + 8/8 |
| `verify:f010` / `verify:f010:db` | 12/12 + 9/9 |
| `verify:f012` / built HTTP smoke | 13/13 + 14/14 |
| `verify:f013` | 12/12 |
| `verify:rc1` / `verify:rc2` | 19/19 + 55/55 |
| `verify:rc2:email-provider` | 14/14 |
| `verify:m1-4:background-fulfillment` | 21/21 |
| `verify:m2-b1` with process-local `M2_B1_DESCENDANT_REGRESSION=true` | 15/15 |
| `verify:m2-c1` / `verify:m2-c1:lightweight-intake` | 8/8 + PASS |
| `verify:m1-4:clarification-contract` | 7/7 |
| `verify:m2-e3` | 43/43 |
| `verify:m1-4:auth-entry-phase04` / `verify:m1-4:purchase-eligibility` | 11/11 + 9/9 |
| `verify:customer-ux-review-fix-r1` | 4/4 |
| `verify:paid-quality-delivery-guarantee-r1` | 4/4。現行R2の維持。F007のHuman判断を代替しない |
| `verify:final-primary-product-function-r1` | 11/11 |
| `verify:measurement-r1` | 14/14。fake GA4 sends 2、external 0 |
| `verify:final-pb04-schema-r1` | 8/8 |
| `verify:m1-4:background-runtime-assets` | PASS。configured 97 / required 81 / missing 0、catalog v17 / stages 7、archiveとentry hash不変 |
| `verify:m2-b2:scheduled-artifacts` | PASS。2 functionsのzip/syntax/import/schedule、server-only混入0 |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | PASS、warnings 0 |
| `npm.cmd run verify:f012:build` | Production Next build PASS、47/47 static generation、built headers 14/14 |
| Final client bundle server-marker scan | F010 RPC/domain/pepper/admin-key名のmatches 0 |
| `git diff --check` | PASS |

Build / HTTP smokeは`.env.example`のenabled flagsをprocess-local falseにし、Next telemetryを無効化して実行しました。外向きfetch/HTTP/HTTPS/TLS/socketを拒否するguardは一時directoryに作成し、実通信はloopbackのlocal Nextだけです。外部通信の試行記録は0。`.env.local`等の設定ファイルは変更していません。local PostgreSQLも毎回別のtemporary cluster、loopback限定・synthetic dataで、終了時停止を確認しています。

Stale verifier修正は各Findingに含めています。E3/ResendはF004のhistorical境界・pre-0025 migrationの全blob・Google/その他Authを保持し、F010の2 import / 2 admission行だけを認識します。F013では旧lock完全不変assertを、historical lock hashと全7 packageのexact successor delta検証に置き換えました。

Background asset verifierは最初、bundle内部loaderを直接exportし、esbuildのlazy initializerを飛ばして`omittedKeywords`未初期化で失敗しました。実bundleのProduction factoryは`init_schema_catalog()`を含むdynamic importを通ることを確認しました。verifierをその正確な式の抽出・検証・実行へ修正し、再検証はPASSです。runtime/schema source、esbuild・zisi version/integrityは変更していません。archive/entry hashとasset検証は維持・追加しています。

F012 smoke作成時のHTTP status/canonical Origin仮定とVary assertionは、実source/buildの挙動に合わせて訂正しました。アプリのstatus/Origin/反応を変更してtestに合わせる修正はありません。既存のNode module-format performance warningは残ります。

## 8. New dependencies and remaining risks

- F010は新しいDB RPCと全instance共通の安定したpepperに依存します。旧DBとの組合せではAccount OTPが503になります。対象identityが攻撃されると通常Customerも10分window内で拒否され得ます。
- Fixed window counterは600秒で論理失効しますが、physical purgeは後続trafficに依存します。保存対象はhashとsecurity counterだけです。
- F012のresource CSPはReport-Onlyで、完全なscript/resource防御は未成立です。実browserのCSP違反、Netlifyでの最終header合成・HSTSはrelease-time follow-upです。
- Nextによる既存Vary上書き制約を記録しました。private/no-store等の実HTTP検証はPASSしています。
- F013のtoml advisoryは残っています。browser data更新は対応browser判定に影響し得るため、lint/build/既存UI契約を再検証しました。主要library・Product semanticsの変更はありません。

## 9. Remaining Finding registry

Wave 2時点の対象外Findingは[Wave 1 registry](REMEDIATION_WAVE_1_2026-09-06.md#9-remaining-finding-registry)から引き継いだ記録です。下表はF005の継続追記を除き当時の状態を保持します。Waves 1–3の最新累積状態は[Wave 3 registry](REMEDIATION_WAVE_3_2026-09-06.md#10-all-finding-registry-and-release-conditions)を参照してください。元監査はCodex thread `01a0734d-3004-73a1-8325-a1cedb863097`の2026-09-06 reportです。

| Finding | Current disposition |
| --- | --- |
| F001 Provider期限 / crash後のreport回収 | OPEN、Wave 2対象外 |
| F002 retry終了後のPaid obligation | OPEN / HUMAN DECISION、対象外 |
| F003 reconciliation停止後の長期照合 | OPEN、対象外 |
| F004 result email idempotency | Wave 1 LOCAL TECHNICAL PASS `95b84e7`。hold/drain・rollout条件は保留 |
| F005 匿名受付の永続書込濫用 | Wave 2時点OPEN。2026-09-06継続修正 `ad9b867bdb307add23d04f14cef67265625503e2` でLOCAL TECHNICAL PASS。IP拒否後のglobal消費を0031で修正、fake 15/15・local PostgreSQL 23/23。Production未反映。詳細はWave 3 registry。 |
| F006 全体Compute / 複数identity / SDK retry | OPEN、対象外 |
| F007 Quality materiality / Integrity | OPEN / HUMAN DECISION、現行R2維持 |
| F008 以前の候補の保存・再採用 | OPEN / HUMAN DECISION、対象外 |
| F009 旧Paid contract executor共存 | OPEN、対象外 |
| F010 Account OTP limiter bypass | Wave 2 Fixed locally。0025未apply、Production未反映 |
| F011 status fetch hang | Wave 1 LOCAL TECHNICAL PASS `74d6159` |
| F012 Browser CSP / frame protection | Wave 2 minimum configuration Fixed locally。resource enforcement / edge validation follow-up |
| F013 dependency advisories | browserslist / fast-uri Fixed locally。toml Deferred / Risk Accepted candidate。F013全体のclosure未成立 |
| F014 Refund / Dispute / Chargeback収束 | OPEN / HUMAN DECISION、対象外 |
| F015 disabled budget匿名Provider経路 | Wave 1 LOCAL TECHNICAL PASS `a495bfc` |

**Technical PASS ≠ Human Accepted ≠ Production Authorized.**
