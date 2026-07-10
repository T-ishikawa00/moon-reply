# 法務文書整合性表（ドラフト）

> **DRAFT**
>
> **NOT LEGAL ADVICE**
>
> **NOT APPROVED FOR PUBLICATION**
>
> **REQUIRES OPERATOR COMPLETION**
>
> **REQUIRES FINAL SOURCE REVIEW**
>
> この文書は月の返事の内部検討用ドラフトです。運営者情報、利用する外部事業者、保存期間、提供条件等が未確定であり、公開前に最新の公式情報、実際のサービス仕様、決済事業者の条件および必要に応じた専門家確認を反映する必要があります。

---

## 1. 目的

利用規約、Privacy、特商法表記、返金、AI説明、安全説明、問い合わせおよび将来の画面・メールで、重要な条件が食い違うことを防ぎます。

対象文書・画面：

- Terms
- Privacy
- Tokushoho
- Refund
- AI Disclosure
- Unsupported Cases
- Contact
- Payment Confirmation Screen
- LP
- Request Form
- Result Page
- Email

Payment Confirmation Screen、LP、Request Form、Result PageおよびEmailへのTask 18B文面反映は未実装であり、以下では`Future implementation`と記載します。

## 2. 整合性マトリクス

| 項目 | 基準値またはplaceholder | 同期が必要なドラフト・仕様 | 未実装画面・配信面 | 現在の状態 |
| --- | --- | --- | --- | --- |
| サービス名 | 月の返事 | Terms / Privacy / Tokushoho / Refund / AI Disclosure / Unsupported Cases / Contact | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 固定 |
| 商品定義 | AIを活用した占い・エンタメ・感情整理目的の恋愛メッセージ鑑定書 | Terms / Tokushoho / AI Disclosure | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 内部基準のみ |
| 税込価格 | 税込980円 | Terms / Tokushoho / Refund | Payment Confirmation Screen / LP / Request Form / Email: Future implementation | 固定 |
| 数量 | 1購入 = 1相談 = 1鑑定書 | Terms / Tokushoho / Refund | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 固定 |
| 18歳以上 | 初期MVPは18歳以上のみ | Terms / Privacy / Tokushoho / Unsupported Cases | Payment Confirmation Screen / LP / Request Form: Future implementation | 内部基準のみ |
| AI利用 | AI利用を明示 | Terms / Privacy / AI Disclosure | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | provider未定 |
| 非保証 | 本心・返信・復縁・未来・関係改善を保証しない | Terms / Tokushoho / AI Disclosure | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 固定 |
| 医療等ではない | 医療・心理・法律・調査サービスではない | Terms / Tokushoho / AI Disclosure / Unsupported Cases / Contact | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 固定 |
| 決済前安全チェック | 安全チェック後に決済 | Terms / Refund / Unsupported Cases | Payment Confirmation Screen / LP / Request Form: Future implementation | server-side未実装 |
| `rejected`処理 | 決済不可・通常鑑定およびメッセージ案を生成しない | Terms / Refund / Unsupported Cases | Payment Confirmation Screen / Request Form / Result Page / Email: Future implementation | server-side未実装 |
| `needs_review`処理 | 本番処理承認まで決済不可 | Terms / Refund / Unsupported Cases | Payment Confirmation Screen / Request Form / Result Page / Email: Future implementation | [[OPERATOR_DECISION_REQUIRED]] |
| 支払方法 | [[PAYMENT_METHODS_TBD]] | Terms / Privacy / Tokushoho / Refund | Payment Confirmation Screen / LP / Request Form / Email: Future implementation | [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 支払時期 | [[PAYMENT_TIMING_TBD]] | Terms / Privacy / Tokushoho / Refund | Payment Confirmation Screen / LP / Request Form / Email: Future implementation | [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 提供時期 | [[DELIVERY_TIMING_TBD]] | Terms / Tokushoho / Refund / Contact | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | [[OPERATOR_DECISION_REQUIRED]] |
| 提供方法 | Web結果ページおよび結果通知メールを予定 | Terms / Privacy / Tokushoho / Contact | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 実装確認待ち |
| 返金条件 | REFUND_POLICY_DRAFT.mdのケース別方針 | Terms / Tokushoho / Refund / Unsupported Cases / Contact | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 専門家・provider確認待ち |
| 結果通知メール | 契約履行・結果通知として送信予定 | Terms / Privacy / Contact | Payment Confirmation Screen / Request Form / Result Page / Email: Future implementation | [[EMAIL_PROVIDER_TBD]] |
| マーケティング同意 | 任意・購入条件とせず結果通知と分離 | Terms / Privacy / Contact | Payment Confirmation Screen / LP / Request Form / Email: Future implementation | [[OPERATOR_DECISION_REQUIRED]] |
| 問い合わせ先 | [[SUPPORT_EMAIL_TBD]] / [[CONTACT_FORM_URL_TBD]] / [[SUPPORT_RESPONSE_TIME_TBD]] | Terms / Privacy / Tokushoho / Refund / AI Disclosure / Unsupported Cases / Contact | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 未決定 |
| 取得情報 | Privacy第2条の予定項目、実装後に最終確認 | Privacy / Terms / Contact | Request Form / Result Page / Email: Future implementation | 実装確認待ち |
| AI送信情報 | 必要最小限。email、payment ID、internal token等を除外 | Terms / Privacy / AI Disclosure | Request Form / Result Page / Email: Future implementation | server-side payload未実装 |
| 保存期間 | [[DATA_RETENTION_PERIOD_TBD]] | Privacy / Refund / Contact | Result Page / Email: Future implementation | 全期間未承認 |
| 決済プロバイダ | [[PAYMENT_PROVIDER_TBD]] | Terms / Privacy / Tokushoho / Refund | Payment Confirmation Screen / LP / Request Form / Email: Future implementation | 未選定・未承認 |
| AI provider | [[AI_PROVIDER_TBD]] | Terms / Privacy / AI Disclosure | LP / Request Form / Result Page / Email: Future implementation | 未選定 |
| Email provider | [[EMAIL_PROVIDER_TBD]] | Privacy / Contact | Request Form / Result Page / Email: Future implementation | 未選定 |
| 住所・電話公開方法 | [[OPERATOR_ADDRESS_DISCLOSURE_TBD]] / [[OPERATOR_PHONE_DISCLOSURE_TBD]] | Tokushoho / Terms / Contact | LP / Email: Future implementation | 専門家・運営者判断待ち |
| 利用規約更新日 | [[EFFECTIVE_DATE_TBD]] / [[LAST_UPDATED_DATE_TBD]] | Terms | Payment Confirmation Screen / LP / Request Form: Future implementation | 未決定 |
| プライバシーポリシー更新日 | [[EFFECTIVE_DATE_TBD]] / [[LAST_UPDATED_DATE_TBD]] | Privacy | Payment Confirmation Screen / LP / Request Form: Future implementation | 未決定 |

## 3. 更新ルール

- 基準値またはplaceholderを変更した場合、同じ行に記載した全ドラフト・仕様・画面・メールを確認する
- providerまたはoperatorの未決定事項を一つの文書だけで確定しない
- Future implementationの画面・配信面は、実装時に本表と照合する
- LP、AI prompt、鑑定結果およびEmailは`docs/legal/PROHIBITED_EXPRESSIONS.md`を共通の禁止表現source of truthとする
- 公開前にリンク、日付、価格、数量、支払、提供、返金および問い合わせ先を実画面で照合する
