# 資料と証拠の索引

ここでは証拠を「今回直接確認したソース」「保存済み実行証跡」「Human確認」「未確認」に分けます。文書の `Current` や `Active` は作成時点の見出しであり、終了後の運用状態ではありません。

| 対象 | 根拠と確認区分 | 読み取り上の限界 |
| --- | --- | --- |
| 製品の定義と判断支援の目的 | [SERVICE_POSITIONING](../SERVICE_POSITIONING.md)、[PRODUCT_SPEC](../PRODUCT_SPEC.md)、[GUIDANCE_QUALITY_R1](../product/GUIDANCE_QUALITY_R1.md) は時点別の方針・受入記録 | 古い支払・公開状況の文言は最終版へ持ち越さない |
| 画面・相談導線 | [app](../../app/)、[RequestForm](../../components/request/RequestForm.tsx) は最終SHAのソース。[2026-09-19の見本・導線証跡](../../evals/sample-request-conversion-r1/README.md)、静的review（参照原本はPrivate保全・候補には非同梱） は保存済み実行証跡 | 画像と静的reviewは当時の架空データ・画面証跡。現在の本番画面ではない |
| 認証と所有 | [Identity Authority](../auth/CUSTOMER_IDENTITY_AUTHORITY_V1.md) は設計判断、[Foundation evidence](../auth/CUSTOMER_IDENTITY_AUTH_FOUNDATION_R1_EVIDENCE.md) は当時の検証、[customer-auth](../../lib/customer-auth/) は最終ソース | 設計文書の初期 `pending` 表示を最終実装の不存在と読まない。現在のSupabase設定は未確認 |
| 決済と納品 | [Payment Charter](../payment/PAYMENT_CHARTER.md)、[決済実装](../../lib/payment/production/)、[独立Webhook入口](../../services/stripe-webhook-ingress/)、[DB migrations](../../supabase/migrations/) は設計・最終ソース。[Paid Delivery Step4](../payment/PAID_DELIVERY_STEP4.md) と [Step4試験](../../evals/paid-delivery-step4/README.md) は当時の試験 | Stripe登録先、当時の全取引、終了後の実行状態をソースだけで証明しない |
| 支払後復旧 | [Paid Recovery Step3](../payment/PAID_RECOVERY_STEP3.md) と [20件のlocal試験](../../evals/paid-delivery-step3/README.md) は2026年9月の保存済み実行証跡 | 隔離PGとmockを含むlocal結果。Production障害の全件保証ではない |
| 開発経緯 | [CURRENT_FOCUS](../CURRENT_FOCUS.md)、[CODEX_HANDOFF](../CODEX_HANDOFF.md)、Git履歴は日時・SHA付きの開発記録 | 各時点の承認と現在の実行権限は別 |
| 最終公開版 | Published deploy `6aae891544ea520008d5015b`、公開2026-09-19 22:10:19 JST、commit `38985ccf0c01f31af01ddf5d61ce1dca5d7ea763`。ローカルT08内 `evidence/netlify-site-whitelist.json`（観測2026-10-02）を今回照合 | 保存済みreadbackであり、今回終了済みの配信環境へアクセスしていない。原証跡はGitへ追加しない |
| 終了・有料実績 | 2026-10-24の終了実行資料、決済1件・980円・納品完了、旧Gmail OAuth失効確認はHuman提供・確認情報。要約は [STATUS](STATUS.md) | 実行原本・顧客原本・取引識別子はGit外保管。Codexが再実行・再検証したとは扱わない |
| 既知事項 | 2026-10-02のT08コード監査（ローカル未追跡 `docs/research/CODEX_BATCH_20261002/T08/20261002_161415_JST/`）と [KNOWN_LIMITATIONS](KNOWN_LIMITATIONS.md) | T08成果は最終公開SHAに含まれない。現行ライブ監査ではない |

## 開発の主な節目

1. 2026年8月：WebのStripe中心方針、価格・安全・認証の判断、Private Review。8月時点の「決済未実装」は、その段階に限定された記録です。
2. 2026年9月：顧客認証、購入・納品、AI回答品質、支払後復旧を段階的に実装・検証。Human受入とlocal技術PASSは各記録の対象範囲で読む必要があります。
3. 2026年9月19日：WAIT／SEND見本と相談入口の改修を含む最終公開SHA `38985ccf...`。
4. 2026年10月24日：運営終了と主要インフラ撤去をHumanが報告。現在の提供サービスとして扱いません。

Humanは製品方針、価格、安全、受入、運営を判断し、AIエージェントは指定範囲の資料・実装・検証を支援しました。特定タスクでのモデル分担やGitHubのコミット数・言語比率は、全開発期間の作業分担や個人の手書き量の証明には使いません。
