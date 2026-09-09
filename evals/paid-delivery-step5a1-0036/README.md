# STEP 5A-1 — B1 + B2 / 0036 local verification

1. **0036の変更**

   `finalize_purchase_ready_assessment_v1` に、既存V17/V6と追加V23/V9の正確な組み合わせを許可した。署名、処理本体の残り、owner、ACL、security invoker、空のsearch_path、ロックを維持。`assessment_clarifications_target` に `original_message` を追加した。旧6対象、質問の不変制約、回答fingerprint、1回答制約は維持。既存行の更新、0033–0035の書き換え、0037追加は0。

   0036 SHA256: `575837c57dd71a555964f9395f1917e6ce6aa71d50da216ad663e8ed75756724`。

2. **Production factoryのV19-L5接続**

   引数なしの `createProductionAssessmentApplication()` が、認証済みの新規準備にV19-L5 / prompt bundle v23 / schemaSet v9を選択する。synthetic authorizationはfalse。匿名の直接prepare、fake purchase authority、別Customer、別continuationは拒否する。既存のCustomer認証、支払前compute、payment RPC、ownershipを通す。

   OpenAI transportとSDKは実装本体を使用し、fetch境界だけをfakeにした。全wire schemaについてSTEP 1 normalizationとの一致、意味グラフ一致、nested `$defs` = 0、不正ref = 0をassertした。

3. **original_message / continuationの接続**

   元入力がある場合と、原文不足で1問を出す場合を実DBで確認。回答後は新しいapplication instanceが初回runの保存済み証跡を再検証し、元入力を変更せず、正規化回答・fingerprint・受付時刻・effective inputを購入authorityへ固定する。原文は既存入力と同じ2,000 code points上限。確認回答中にPB-04以降は呼ばない。

   original_messageと既存material concernの双方で、report保存後のcanonical commit障害を注入し、別factoryの実Recovery scheduler/workerが同じreportを回収した。追加Provider呼び出し0、入力・契約・authority hash変更0。既存6対象のcanonical回答形式と時刻固定は別途roundtrip検証した。

   実装中に見つかったPB-01 skip行の不整合は、保持済み初回PB-01を参照する形で修正した。新たなDB変更は不要。保存済み回答と公開回答の構造差・日時再正規化も修正した。根因、STEP 3で未検証だった経路、test fixtureの修正理由は [findings.json](findings.json) に記録した。prompt・品質・Safety仕様の変更は0。

4. **新規V19-L5購入結果**

   正式factoryで新規V19-L5購入8件が、v23/v9を保存し、V19 executorでcompletedへ到達した。V17へのfallbackは0。各購入でPurchase・Grant/Logical Assessmentを維持し、canonical report・delivery・通知が各1件。再処理による追加Charge・追加通知は0。

5. **既存V17購入結果**

   旧V17購入1件をworker kill後に新factoryで回収した。同じV17/v6 authorityとexecutorを維持してcompletedへ到達し、同じfactoryで続けて作った新規購入はV19-L5/v23/v9になった。過去購入のsilent upgradeは0。旧購入作成だけは歴史状態のsynthetic fixtureであり、そのRecoveryは引数なしの実factoryを通した。

6. **migration 0036 Gate結果**

   既存正式entrypoint `scripts/verify-remediation-migration-privileges.mjs` が0032–0036を登録し、要求範囲0033–0036をPASSした。Release Gate 40ケース、機能95検証、authority runtime 120検証。0036単独分は機能16・role probe 8。実行121.8秒。

   file hash、order、fresh DB、0035からupgrade、transaction途中失敗と再試行、直接接続のnon-superuser installer、object owner、service_role RPC、table/column ACL、RLS、GRANT/REVOKE、unexpected anon/authenticated権限、required RPC signatureを確認。0036をinventoryから除くfixtureは期待どおりFAILした。

   rollback限界も実PGで確認した。original_message行の保存後は旧target CHECKを再検証できないため、データを消して戻すdown migrationは行わずforward fixを前提とする。installerとruntimeの既存extension権限はlocal fixtureで検証しており、現在のremote権限は未観測。

   正式Gate証跡（参照原本はPrivate保全・候補には非同梱） / guarded log（参照原本はPrivate保全・候補には非同梱）

7. **relevant integration regression**

   ソース固定後の9グループを実PG / application / RPC経路でPASSした。実行187秒。検証中のsource hash変更0、現在のソースとの不一致0。Recoveryをmock completedにする処理はない。

   | グループ | 結果・主な証明 |
   | --- | --- |
   | auth | 匿名・synthetic・ownership拒否、Customer/global cap。無効な応答ありはslot解放、応答不明は期限付きslot保持。使用済みunitsはいずれも1、Purchase 0。 |
   | happy | 新規v23/v9、Purchase/report/delivery/通知各1、重複処理追加0。 |
   | narrow-repair | narrow repair 1、post-repair verification 1、正常納品。 |
   | schema-corrected | incompatible configでmanual review、無意味な同一再試行なし、修正確認後に同じ購入で納品。 |
   | old-v17-recovery-new-v19 | killした旧V17をV17で回収、その後の新規はV19。 |
   | old-new-worker-race | 旧workerをPB-06で保持、新ownerが納品。late ownerのcanonical上書き0。 |
   | original-provided | 正式な原文付き入力を保存し、同じ原文で納品。 |
   | original-clarification-restart | 別instanceで回答、同じ購入、保存reportのRecovery追加Provider 0。 |
   | generic-clarification-restart | 既存質問形式の回答を固定、既存stage別consumption契約を維持して納品・回収。 |

   総計9購入 / 9 canonical納品 / 9 accepted通知 / Checkout 9、追加Charge 0。通知件数は記録だけでなくassertしている。Providerの実通信・実決済・実通知は0。

   最終統合証跡（参照原本はPrivate保全・候補には非同梱）
   SHA256: `003109694ace32fd715d994f8364846f15d6a12fbf3da19cd695b28f5b37cad5`。

   typecheck、source lint（warning 0）、offline build（47ページ）、公開clarification contract 8/8、worker graph（155 modules / 619 edges / server-only 0）もPASS。[既存V19回帰289 assertions + 新規8グループ](runtime/d4862a7f-2c59-4dd9-b26a-f48712951f07/result.json) はoffline contract regressionであり、新しい品質審査ではない。既存artifact由来の全体lint 59 warningsは既知事項として分離し、全体lintは再実行していない。

8. **changed files / commits**

   - `f21d9bc88a13927f28be51dcc22fe040601b889b` — 0036と正式Gate登録、5ファイル。
   - `0f169df63f6e7dce8f459885741faad7f29d13f0` — Production接続・durable clarification・関連回帰、21ファイル。
   - 本資料と新規証跡は、上記source commitに続くevidence-only local commitで保存する。

   変更26 source/test/migrationファイルの完全一覧・SHA256・Git blobは [verification.json](verification.json) の `changedFiles` にある。既存artifact 4,801件、0033–0035、別worktreeは保持した。[保持確認](preflight.json)

9. **final candidate SHA**

   検証済みsource candidate: `0f169df63f6e7dce8f459885741faad7f29d13f0`。
   Branch: `codex/guidance-quality-final-v19-l5`。
   Worktree: `C:\projects\moon-reply`。

   証跡に記録された開始HEADは `7a7e8a0a04c98a831f36466b962a2e730b792977` で、その時点のworking sourceをハッシュで固定して検証した。現在の643 integration対象、484 build対象、14 migration gate対象のハッシュ一致を確認し、変更sourceのGit blobとも改行正規化後に一致する。資料だけを加えた最終HEADは最終返信で報告する。

10. **remaining release blockers**

    Local B1/B2の未解消blockerは0。STEP 5A release gateを再実行できる。現在のremote構成・権限・デプロイ状態と、実外部Providerの挙動は今回再確認しておらずUNKNOWN。Production反映の承認・実施とは別の判定である。

    Production変更・push・deploy・remote migration = 0。env file変更、実API、charge、refund、email/Discord送信 = 0。

**B1 + B2 RELEASE BLOCKERS RESOLVED**

**READY TO RE-RUN STEP 5A RELEASE GATE**
