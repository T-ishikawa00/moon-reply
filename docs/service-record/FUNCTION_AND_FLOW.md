# 当時の機能と利用者フロー

対象は最終公開版 `38985ccf0c01f31af01ddf5d61ce1dca5d7ea763` のソースです。以下はコード上の流れであり、終了後に通しの実購入を再実行した記録ではありません。

| 段階 | 利用者に見えた操作・画面 | サーバー側の役割と根拠 |
| --- | --- | --- |
| 入口・見本 | トップ `/`、架空レポートの `/sample-report` でWAIT／SENDを切り替え、相談入口へ進む | [トップ](../../app/page.tsx)、[見本](../../app/sample-report/page.tsx)、[当時の画面検証](../../evals/sample-request-conversion-r1/README.md) |
| 相談 | `/request` で成人確認と関係状況・メッセージなどを入力し、確認する | [フォーム](../../components/request/RequestForm.tsx)、[準備API](../../app/api/consultations/prepare/route.ts) が匿名の相談準備を扱う |
| 認証・所有 | 画面上の安全確認後、本番ではAI Providerを呼ばずに相談準備を保存。GoogleまたはメールOTPでログインし、準備と本人の所有関係を結ぶ | [Production service](../../lib/assessment/production/service.ts)、[Provider-free intake](../../lib/assessment/production/provider-free-intake.ts)、[認証実装](../../lib/customer-auth/application.ts)。正準IDはSupabase Authの `auth.users.id`（[Identity Authority](../auth/CUSTOMER_IDENTITY_AUTHORITY_V1.md)） |
| 購入前判断 | 認証後にサーバーの適格性判定と必要な追加質問へ進む。危険・不適格な相談は通常鑑定へ進めない | [追加確認API](../../app/api/consultations/clarifications/route.ts)、[購入適格性API](../../app/api/consultations/purchase-eligibility/route.ts)、[安全方針](../safety/CRISIS_AND_UNSUPPORTED_CASES_POLICY.md)。画面内の事前確認と、Providerを伴う判定を区別する |
| 決済 | 税込980円を都度払い。外部Checkoutから戻る | [購入API](../../app/api/payments/checkout/route.ts)、[商品定数](../../lib/payment/production/constants.ts)、[戻り画面](../../app/purchase/return/[statusCapability]/page.tsx) |
| 支払確認 | 戻り画面で進捗を確認する。戻りURL自体は入金の証明にしない | [署名付きWebhook](../../lib/payment/production/stripe-webhook.ts)、[支払状態API](../../app/api/payments/status/route.ts)、決済記録と照合処理 |
| 生成・納品 | 判定と理由、行動案、メッセージ案を含むレポートを受け取る | [生成アプリケーション](../../lib/assessment/production/application.ts)、[復旧経路](../../lib/payment/production/paid-recovery.ts)、[結果ページ](../../app/result/[token]/page.tsx) |
| 再訪・通知 | Accountの履歴、限定された結果アクセス、通知メールで再確認する | [Account結果](../../app/account/results/[deliveryId]/page.tsx)、[通知](../../lib/payment/production/result-notification.ts)。通知の成功と結果の確定は別状態 |

AIは入力された情報から事実・可能性・不明点を分け、送る、軽く送る、待つ、送らないといった判断の理由と次の行動を提示する設計です。相手の本心や将来の出来事を断定せず、医療・心理・法律上の助言も提供しません。[SERVICE_POSITIONING](../SERVICE_POSITIONING.md) と [AI guardrails](../ai/AI_PROMPT_GUARDRAILS.md) は設計上の境界であり、全実出力の品質を保証するものではありません。

ローカルで確認できるのは、架空fixtureと安全に構成した画面・一部のmock/loopback検証までです。旧Review routeには過去版fixtureも含まれ、最終版の実回答例として扱いません。実Providerをつないだ一連の購入・認証・メール受信はこの保存作業で再現しません。範囲は [LOCAL_VIEWING](LOCAL_VIEWING.md) と [EVIDENCE_INDEX](EVIDENCE_INDEX.md) に記録します。
