# 月の返事（Moon Reply）

**月の返事は2026年10月に運営を終了したサービスです。** この作業ツリーは採用向けの公開準備候補です。リモートリポジトリはPrivateのままで、外部公開は実施していません。最終公開版のコード、開発履歴、設計・検証資料を保存しています。現在利用できるサービスや再開予定の製品を案内するものではありません。終了と保存範囲は [STATUS](docs/service-record/STATUS.md) に記録しています。

月の返事は、返信待ちや送信前の迷いについて、利用者が入力した恋愛関係の状況とメッセージをAIで整理し、次の行動を自分で選ぶための判断材料を返すデジタルレポートでした。ユーザー向け名称は「恋のメッセージ鑑定ノート」です。占術や超自然的な予測は使わず、相手の本心、返信、関係の進展を保証しません。位置付けは [SERVICE_POSITIONING](docs/SERVICE_POSITIONING.md)、品質方針は [GUIDANCE_QUALITY_R1](docs/product/GUIDANCE_QUALITY_R1.md) を参照してください。

## 最終公開版と現在の保存版

最終公開版のソース基準は **`38985ccf0c01f31af01ddf5d61ce1dca5d7ea763`** です。2026年9月19日の公開revisionとの一致は当時の公開記録で確認されました。現在の公開状態を示すものではありません。このREADMEと `docs/service-record/` は、同SHAの後に追加する保存・閲覧用の説明であり、商品ロジックや当時の公開物を変更するものではありません。SHAを基準に参照してください。ローカルのブランチ名やポインタは同じ版を指すとは限りません。

2026年11月7日のGitHub読み取りでは、リポジトリはPrivate、既定ブランチは `main`、Archiveは未実施でした。反映後の状態や現在の外部サービス設定はこの記録だけでは確認できません。詳細は [STATUS](docs/service-record/STATUS.md) を参照してください。

## 当時の機能と操作

利用者はトップと架空のWAIT／SEND見本を見て、`/request` に相談内容を入力し、画面上の安全確認へ進みました。本番経路では、AI Providerを呼ばずに相談準備を保存し、GoogleまたはメールOTPで認証して所有者を紐付けた後、サーバーで適格性を判定し、必要な追加確認を行います。購入可能な場合に税込980円の都度払いでStripe Checkoutへ進む構成でした。決済は署名付きWebhookなどのサーバー側証拠で確認し、AIによる分析・レポート生成を経て、結果ページ、Account、通知メールから受け取る設計・実装です。支払後の中断に備えた永続的な復旧経路も含みます。画面と処理の対応は [FUNCTION_AND_FLOW](docs/service-record/FUNCTION_AND_FLOW.md) にまとめています。

## 構成

最終ソースにはNext.js、React、TypeScriptの画面とAPI、Supabaseの認証・Postgres、Stripeの決済、OpenAIの生成、Resendの通知、Netlifyの配信・バックグラウンド処理があります。役割とデータ境界は [ARCHITECTURE](docs/service-record/ARCHITECTURE.md) を参照してください。依存バージョンは最終版の [package.json](package.json) に記録されており、現在推奨される版を意味しません。

## 開発と運用の記録

2026年8月にStripeを中心とするWeb決済方針とPrivate Reviewを進め、9月には認証、購入、納品、回答品質、障害復旧を段階的に実装・検証しました。9月19日にWAIT／SEND見本から相談入口への導線を改善した版が最終公開版となりました。運営終了と主要インフラの撤去は2026年10月24日のHuman実行報告によります。確認された有料決済実績は**全期間1件、980円、納品完了**です。市場需要や継続売上を示す数値ではありません。根拠の種類と所在は [EVIDENCE_INDEX](docs/service-record/EVIDENCE_INDEX.md) に分けています。

企画、仕様・価格・安全方針、受入と運営の判断はHumanが担当しました。CodexなどのAIエージェントは、Humanが指定した範囲で設計資料、コード、検証スクリプト、文書の作成を支援しました。個々の変更の技術検証とHuman受入は、それぞれの時点の記録に従います。

## ローカル閲覧と資料

外部サービスや実顧客データを使わずに確認できる範囲と、そのために検証した起動・停止手順は [LOCAL_VIEWING](docs/service-record/LOCAL_VIEWING.md) を参照してください。見本とReview画面には架空fixtureや旧版の表示も含まれます。ローカル画面の表示は、実認証、実課金、実AI、実メール、完全な購入から納品までの再現を証明しません。 採用向けの評価集計は [EVALUATION_EVIDENCE_SUMMARY](docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md) を参照してください。実行payloadと内部対応表は公開準備候補に含めていません。

設計の入口は [PRODUCT_SPEC](docs/PRODUCT_SPEC.md)、[PAYMENT_CHARTER](docs/payment/PAYMENT_CHARTER.md)、[CUSTOMER_IDENTITY_AUTHORITY_V1](docs/auth/CUSTOMER_IDENTITY_AUTHORITY_V1.md)、[SAFETY_POLICY](docs/SAFETY_POLICY.md) です。これらには過去時点の計画や、後続実装に置き換わった記述も残ります。[EVIDENCE_INDEX](docs/service-record/EVIDENCE_INDEX.md) から時点別の実装・試験へ進み、[KNOWN_LIMITATIONS](docs/service-record/KNOWN_LIMITATIONS.md) で未検証事項を確認してください。顧客原本、取引原本、認証情報、非公開バックアップはこの案内に含めません。

公開準備の履歴・原証拠・保留条件は[公開準備候補R1の範囲](docs/PUBLICATION_PREPARATION_R1.md)を参照してください。

## 公開準備 R2

作者・committerメールの公開承認等の最新確認と、リモート適用の範囲は[公開準備R2](docs/PUBLICATION_PREPARATION_R2.md)に記録しています。R1の本人確認待ちは、この更新を反映して解消しています。GitHubへの適用・Public化は別工程です。
