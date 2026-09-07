# V19-L2 (numeric catalog v20) — local verification / fresh pilot preparation

V19-L1からPB06時間軸評価だけを改訂した候補。実API 0、Production変更0。[実装記録](../../docs/product/GUIDANCE_QUALITY_V19_L2.md)を参照。

```text
node evals/guidance-quality-v19-l2/verify-offline.mjs
node evals/guidance-quality-v19-l2/preflight.mjs
node evals/guidance-quality-r1/gq24-action-consistency/verify.mjs
node evals/guidance-quality-wave1/verify-ab.mjs
node evals/guidance-quality-wave1/verify-runtime.mjs
node scripts/verify-paid-quality-delivery-guarantee-r1.mjs
npm run typecheck -- --incremental false
npm run build
```

新候補は`loadV19L2StageCatalog()`で明示選択する。既存executorを再利用し、Production selectorやPaid契約は変更しない。candidate stage hashは[catalog-identity.json](catalog-identity.json)。7つの意味fixtureを複製せず内容一致で継承し、`REPLY_NOW_AND_DO_NOT_REPLY_NOW`を1件追加した[8 fixtures](fixtures.json)を使う。

`verification-results.json`は保存出力のfake再生・人手で用意したfindingの拒否・契約接続の記録。元のGQ24 findingはclassifier不変なのでblockingを維持する。空findingを与える対照は実PB06の再生成・修復・合格ではない。実モデルによる新PB06評価は未検証。

GQ05の追加確認を失敗と扱わない。GQ13の受け止めと境界、GQ29-P3の具体的な待機方針は保存本文・projectionの同一性で検証する。これは新しい温かさや読みやすさを実モデルで確認したという意味ではない。明確な拒否・追送・本物の同時点相反は引き続き拒否対象。F007の既知問題を解消したとは扱わない。

[fresh pilot plan](pilot-plan.json)は`NOT_AUTHORIZED_NOT_RUN`。preflightは固定input/hash/候補identity/既存cap/サイズだけを確認し、API/key/live runnerを使用しない。前回の一度限りのCLIは再実行しない。旧runはdiagnostic-only/incomplete、新runへ出力・session・mapping・Human回答を混ぜない。

source lintは既存のESLint設定を使い、Git管理sourceと今回追加sourceを対象にする。未知の一時ファイル・global設定・ignoreを変更しない。全体lintの過去の一時ファイル警告をsource PASSで解消済みと扱わない。

今回の結果は契約/再生/routing **34 PASS＋既存制約の再現1件**。同じ時点・同じ一通のreply/no-replyを手作業で置き、PB06 majorを2回与えると、L1/L2とも矛盾を残したままreadyになる既存F007制約がある。これは品質PASSではなく、Product期待はFAILのまま。criticalなら両方fail-closed。次のpilotは既存transportで初回major/critical findingをSTOPするため修復消尽へ進まず、この問題を自動許容しない。詳細と全検証結果は[実装記録](../../docs/product/GUIDANCE_QUALITY_V19_L2.md)に記載した。
