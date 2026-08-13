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
> この文書は月の返事の内部検討用ドラフトです。運営者情報、利用する外部事業者、保存期間、提供条件等が未確定であり、公開前に最新の公式一次情報、実際のサービス仕様、決済事業者の条件および必要に応じた任意の専門家相談を反映する必要があります。

> B2 Candidate status: `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`（`2026-08-13`）。Human + ChatGPT review / acceptance は `pending / pending`。以下のCurrent B2 authorityがTask 18Bのhistorical matrixより優先します。

---

## 0. Current Review Authority（2026-08-13）

- Payment Charter v1は`human_chatgpt_accepted_complete`としてHuman + ChatGPT accepted complete。受入日は`2026-08-12`、Payment implementation authorityは`false`
- Delivery/Recovery Email Verificationは`accepted_required_control_with_trusted_session_reuse`
- 最新の公式一次情報、実際のProduct/Provider挙動、最終公開文言、Customer-rightsおよび該当するHuman/operator判断のreviewは必須
- materialな未解決法的義務はblockerとして維持
- 専門家相談は任意であり、未実施それ自体はPayment Charter受入、公開、Paid LaunchまたはProduction Paymentのblockerではない
- 以下のTask 18BおよびM1-I5時点の表現はhistorical evidenceとして維持し、現在のreview authorityまたはdownstream UI実装完了を意味しない
- Stripe Lane B Human Decision Packageは`stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete`であり、`LB-DEC-AGE-001`、`LB-DEC-ENTITY-001`、`LB-DEC-DISCLOSURE-001`、`LB-DEC-SUPPORT-001`、`LB-DEC-REFUND-001`、`LB-DEC-FULFILLMENT-001`、`LB-DEC-DOMAIN-001`はaccepted
- B2は上記をdraft/specへ同期したCandidateであり、statusは`stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`。Human + ChatGPT review / acceptanceは`pending / pending`

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

Task 18B時点の`Future implementation`表記は成立時点の履歴です。M1-I1からM1-I5でLP、Request Form、Payment Confirmation Screen、Result Pageおよび法務・問い合わせ審査表示が段階的に実装されましたが、いずれもreview-onlyです。Emailとproductionの契約・決済・AI・保存・配信処理は未実装です。

## 1.1 M1-I5 review-screen implementation status

- `/legal`, `/legal/terms`, `/legal/privacy`, `/legal/tokushoho`, `/legal/refund`, `/legal/ai-disclosure`, `/legal/unsupported-cases`, `/contact`は審査用表示として実装済み
- 全ページが`審査用ドラフト表示`、`公開承認前・運営者情報未完了`、`法的助言ではありません`を共有
- 固定事実は通常表示し、未確定値はraw placeholder、空欄、架空値にせず、Human承認済みの日本語statusとreview-only Decision IDで表示
- 施行日と最終更新日は未確定のまま表示し、実装日を代用しない
- `/contact`には受付form、メール、外部送信、active contactを設けない
- Purchase Confirmation Screenからのlinkは審査表示であり、同意を記録しない
- publication gateのcheckboxと`OPERATOR_DECISION_REGISTER.md`のDecision stateは変更しない
- この実装statusは法務文書の公開承認、専門家確認、運営者・provider決定、販売開始を意味しない

## 1.3 Current B2 decision consistency

| Decision | Current Candidate value | Evidence/implementation/publication state |
| --- | --- | --- |
| `LB-DEC-AGE-001` | 必須boolean自己申告 `私は18歳以上です`。年齢適格性だけのための年齢層、DOB、本人確認書類は収集しない | `AGE-GATE-001 = accepted_direction_legal_spec_alignment_candidate_complete`; Production server enforcementは未実装 |
| `LB-DEC-ENTITY-001` | applicableな個人・個人事業主route | actual legal name/address/phone等はHuman/private input待ち |
| `LB-DEC-DISCLOSURE-001` | 法令と実際のStripe要件が許す項目で`請求があった場合には遅滞なく開示します`を候補とする | Payment前request、no login/purchase/Purchase ID、実経路・logsがpublication前に必要 |
| `LB-DEC-SUPPORT-001` | 1 operating business mailbox + 1 categorized form、6 functional categories | mailbox/form/SLA/backendは未実装・未確定 |
| `LB-DEC-REFUND-001` | 通常JPY 980 Product refundとuncapped Payment Integrity remediationを分離 | Provider mechanics、fees、duration、dispute semanticsは未確定 |
| `LB-DEC-FULFILLMENT-001` | verified email、server Payment success、protected result page、same-Purchase recovery、no recharge、不能時全額返金 | delivery timingとProduction実装は未確定 |
| `LB-DEC-DOMAIN-001` | intended final production domainをStripe Account/Site review前に用意する順序 | domain、DNS、deployment、URLは未承認・未取得 |

Task 18B historical matrix内の年齢層、専用checkbox禁止、専門家確認待ち、返金候補等の記録はtask-time evidenceに限り、Current B2 authorityとして使用しません。専門家相談は任意escalationです。

## 1.2 Current Accepted Delivery/Recovery Email Rule（2026-08-12）

以下はTask 18B時点のhistorical matrixより新しいcurrent Product/Privacy authorityである。Request flow、Payment Confirmation、Result delivery、およびEmail/recoveryは、実装時に同じverified-email bindingを使用しなければならない。この記録はUI、session、Payment、DBまたは配信実装を承認しない。

| Rule | Accepted value | 同期が必要な面 | 実装状態 |
| --- | --- | --- | --- |
| First / untrusted-session purchase | 実決済開始前にserver-authoritativeなmailbox control evidenceを取得し、verified delivery/recovery emailをcurrent purchase authority / Purchase Intentへbind | Request flow / Payment Confirmation / Payment boundary / Result delivery / Email recovery | 未実装 |
| Trusted repeat purchase | still-valid trusted sessionが同じunchanged verified emailへbindされている場合、購入ごとのmailbox再検証は不要。Safety eligibilityとfinal purchase confirmationは毎回必須 | Request flow / Payment Confirmation / Payment boundary | 未実装 |
| Reverification | email変更、valid trusted session不在、expired/revoked/invalidated/unavailable state、別browser/device、sensitive recovery、または既存bindingを安全に確認できない場合に再検証 | Request flow / Payment Confirmation / Result delivery / Email recovery | 未実装 |
| Security / authority | trusted stateはserver-verifiable。browser/client/localStorageだけで`verified=true`相当をassertできない。trusted sessionはPayment authorityでもSafety authorityでもない | 全対象面 | 未実装 |
| No-login / identity | mandatory account、password/Google/Apple login、profile、My Pageを導入しない。mailbox controlはlegal identityを証明しない | Request flow / Payment Confirmation / Result delivery / Email recovery | no-login方針を維持、実装未承認 |

OTP/Magic Link、verification Provider、session/cookie/token実装、lifetime、refresh、revocation、future account migrationは未解決であり、本表で決定しない。

## 2. 整合性マトリクス（Task 18B時点の履歴）

| 項目 | 基準値またはplaceholder | 同期が必要なドラフト・仕様 | Task 18B時点の未実装画面・配信面 | 現在の状態 |
| --- | --- | --- | --- | --- |
| サービス名 | 月の返事 | Terms / Privacy / Tokushoho / Refund / AI Disclosure / Unsupported Cases / Contact | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 固定 |
| 商品定義 | AIを活用した恋愛メッセージ分析・判断支援デジタルレポート。利用者向け名称は恋のメッセージ鑑定ノート | Terms / Tokushoho / AI Disclosure | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | Human approved internal positioning。provider分類ではない |
| 分析方法 | 利用者入力のみを根拠とし、占術・超自然的手法・外部調査を使用しない | Terms / Privacy / AI Disclosure | LP / Request Form / Result Page / Email: Future implementation | 固定 |
| 税込価格 | 税込980円 | Terms / Tokushoho / Refund | Payment Confirmation Screen / LP / Request Form / Email: Future implementation | 固定 |
| 数量 | 1購入 = 1相談 = 1鑑定書 | Terms / Tokushoho / Refund | Payment Confirmation Screen / LP / Request Form / Result Page / Email: Future implementation | 固定 |
| 18歳以上（Task 18B historical snapshot） | 必須の年齢層選択。18歳以上の許可値のみ、`回答しない`なし、専用チェックボックスなし。公開フローではserver-side再検証 | Terms / Privacy / Tokushoho / Unsupported Cases | Payment Confirmation Screen / LP: Future implementation。Request Form: local UI implemented、server-side未実装 | HISTORICAL ONLY。B2では必須boolean自己申告 `私は18歳以上です` に置換済み。Production server enforcementは未実装 |
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
- Providerまたは第三者による業種区分は未確定であり、実際の機能と表示を提示して判断を求める
- Future implementationの画面・配信面は、実装時に本表と照合する
- LP、AI prompt、鑑定結果およびEmailは`docs/legal/PROHIBITED_EXPRESSIONS.md`を共通の禁止表現source of truthとする
- 公開前にリンク、日付、価格、数量、支払、提供、返金および問い合わせ先を実画面で照合する
