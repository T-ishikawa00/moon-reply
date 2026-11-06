# 最終版の構成と責任境界

対象は最終公開版 `38985ccf0c01f31af01ddf5d61ce1dca5d7ea763` のソース構成です。記述は実装と当時の設計資料をたどるためのもので、終了後の外部環境が動作していることを示しません。[package.json](../../package.json) と [netlify.toml](../../netlify.toml) は当時の依存と実行設定を示します。

| 領域 | 最終ソース上の責任 | 主な境界・根拠 |
| --- | --- | --- |
| 画面・API | Next.js／React／TypeScriptでトップ、見本、相談、認証、決済復帰、結果、Accountを表示し、サーバーAPIで入力を扱う | [app](../../app/)、[相談準備](../../app/api/consultations/prepare/route.ts)。ブラウザ状態だけで購入資格や入金を確定しない |
| 本人確認・所有 | Supabase AuthのGoogle／メールOTPと、サーバー側のCustomer所有関係 | [customer-auth](../../lib/customer-auth/)、[Identity Authority](../auth/CUSTOMER_IDENTITY_AUTHORITY_V1.md)。メールアドレスやCookieは正準Customer IDではない |
| 相談・適格性 | 相談入力の準備、追加確認、安全判定、購入可能状態の確定 | [assessment production](../../lib/assessment/production/)、[安全方針](../safety/CRISIS_AND_UNSUPPORTED_CASES_POLICY.md)。危険・未確定状態は決済へ通さない設計 |
| 決済 | サーバーが税込980円・JPYのCheckoutを作り、Stripe署名付きイベントと照合証拠から決済を確認 | [payment production](../../lib/payment/production/)、[独立Webhook入口](../../services/stripe-webhook-ingress/)。Checkout復帰URLは入金証拠ではない |
| 状態保存・復旧 | Supabase Postgresの購入・支払イベント・生成・納品・通知状態と、バックグラウンド処理による再開 | [migrations](../../supabase/migrations/)、[paid-recovery](../../lib/payment/production/paid-recovery.ts)、[Netlify functions](../../netlify/functions/)。当時のlocal PG試験は現行DB状態の証明ではない |
| AI生成 | サーバー側OpenAI呼出しで段階別の判断、レポート、検証を処理 | [transport](../../lib/assessment/runtime/openai-transport.ts)、[guardrails](../ai/AI_PROMPT_GUARDRAILS.md)。`store: false` はリクエスト設定であり、Provider側の保持がゼロという証明ではない |
| 通知・再訪 | Resendによる結果通知、Account履歴、限定された結果アクセス | [通知実装](../../lib/payment/production/result-notification.ts)、[Account](../../app/account/page.tsx)。通知配送とレポート確定は別の状態 |
| 計測 | GA4イベントと流入情報の取得・送信 | [measurement](../../lib/measurement/)、[送信adapter](../../lib/measurement/adapters.ts)。過去監査には個人情報混入・同意境界の指摘がある |

## 情報の行き先

相談内容と処理中のsnapshot・レポートは当時のSupabase側の保存対象でした。必要な相談情報は生成のためOpenAIへ送られる実装です。Resendは通知先と結果への案内、Stripeは購入と決済、GA4は設定された計測イベントを扱います。外部送信の実際の契約・保持・設定はソースだけでは確定できません。実顧客データや本番資格情報を使った再接続は、この保存作業の対象外です。

支払確定、購入者の所有、生成済み結果、通知の状態は別々の証拠で扱います。障害後の復旧は [PAID_RECOVERY_STEP3](../payment/PAID_RECOVERY_STEP3.md) と [PAID_DELIVERY_STEP4](../payment/PAID_DELIVERY_STEP4.md) の時点別の契約・検証に従います。仕様案やlocal PASSを、当時の本番設定や全件保証へ拡張しません。
