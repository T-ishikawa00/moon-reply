# 月の返事 返金ポリシー（ドラフト）

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

> B2 Candidate status: `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`（`2026-08-13`）。Human + ChatGPT review / acceptance は `pending / pending`。受入済みpolicy方向を同期する内部ドラフトであり、返金実行または公開を承認しません。

---

Provider context on `2026-08-12`: Stripe Checkout is the Human + ChatGPT accepted strategic primary Web direction to investigate and prepare. This Product/strategy acceptance is not Provider selection. Stripe feasibility, account/contact, approval/activation, formal selection, refund capability, fee treatment, and completion semantics are not established. PAY.JP is paused fallback. This context does not change the accepted Provider-independent normal Product refund and Payment Integrity remediation principles below and does not authorize any refund operation.

## 1. 基本方針

本ポリシーは、税込980円の単発デジタル鑑定書について、現時点の返金・再提供方針案を整理するものです。「いかなる場合も返金しない」とするものではなく、法令上の権利を制限しません。

返金条件は、[[PAYMENT_PROVIDER_TBD]]の証拠、実装、利用者への表示、最新の公式一次情報およびCustomer-rights reviewを経て最終化します。専門家相談は任意です。[[CURRENT_SOURCE_REVIEW_REQUIRED]] [[PROVIDER_CONFIRMATION_REQUIRED]]

通常Product返金とPayment Integrity remediationは別概念です。正しく作成された初回Product charge 1件（税込980円）について、初期MVPの通常Product返金は0円または980円全額とし、Customer-facingな部分返金Product policyは設けない方向です。

重複成功charge、誤額、誤Customer、誤Requestその他のPayment Integrity Incidentでは、通常Product返金額を上限とせず、実際に影響した意図しない経済額を是正する必要があります。Moon ReplyのPayment Integrity欠陥により、利用者を正当な1購入980円を超える負担に残しません。意図しない超過額の返還は通常Productの部分返金ではなく、具体的な返金、取消、reversalその他の是正操作はProvider evidenceを確認するまで断定しません。[[PROVIDER_CONFIRMATION_REQUIRED]]

## 2. ケース別マトリクス

| ケース | 現時点の方針案 | 最終確認 |
| --- | --- | --- |
| 決済前 | 料金は発生しません。 | 実装確認：[[OPERATOR_DECISION_REQUIRED]] |
| 決済成功後、客観的に`generation_started`より前のユーザーキャンセル | 将来のシステムがキャンセル申出を`generation_started`より前とauthoritatively確定できる場合、税込980円の通常Product全額返金とします。このstate machineは未実装です。 | 実装・source・Provider確認：[[CURRENT_SOURCE_REVIEW_REQUIRED]] [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 正常に鑑定書を提供済み | 鑑定内容への不満または満足度のみを理由とする返金は、原則対象外とする方向です。 | [[CURRENT_SOURCE_REVIEW_REQUIRED]] |
| AI生成失敗 | 同一Purchaseで限定復旧し、再課金しません。安全かつ有効な履行が不可能なら税込980円を全額返金します。 | 実装・Provider確認：[[PROVIDER_CONFIRMATION_REQUIRED]] |
| 結果保存・配信失敗 | 同一Purchaseで限定復旧し、再課金しません。安全かつ有効な履行が不可能なら税込980円を全額返金します。 | 実装確認：[[OPERATOR_DECISION_REQUIRED]] |
| 重複成功charge | 超過した意図しない実経済額を是正する方向です。通常Productの部分返金とは扱いません。 | [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 誤額・誤Customer・誤Request | 実際に影響した意図しない経済額を是正し、正当な1購入980円を超える負担に利用者を残しません。 | [[OPERATOR_DECISION_REQUIRED]] [[PROVIDER_CONFIRMATION_REQUIRED]] |
| Safety対象外相談を誤って決済 | 生成を停止し、Payment Integrity incidentとして実際の意図しない経済的chargeを是正します。通常の税込980円charge 1件なら980円の是正となり得ますが、remediation上限は設けません。 | サーバー実装・Provider確認必須：[[OPERATOR_DECISION_REQUIRED]] [[PROVIDER_CONFIRMATION_REQUIRED]] |
| サービス障害 | 同一Purchaseで限定復旧し、再課金しません。安全かつ有効な履行が不可能なら税込980円を全額返金します。 | [[OPERATOR_DECISION_REQUIRED]] |
| メールアドレス入力間違い | 所有確認、訂正、必要に応じた旧credential失効、安全な再発行およびPrivacy incident評価を行います。安全な履行が不可能なら全額返金候補です。 | [[OPERATOR_DECISION_REQUIRED]] |
| 結果URL紛失 | 所有確認後、安全な同一Purchase再発行を行う方向です。 | セキュリティ設計：[[OPERATOR_DECISION_REQUIRED]] |
| 鑑定内容への不満のみ | 原則として返金対象外とする方向です。 | [[CURRENT_SOURCE_REVIEW_REQUIRED]] |
| チャージバック | 決済事業者の手続および適用法令に従います。 | [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 法令上返金が必要な場合 | 適用法令に従います。 | [[CURRENT_SOURCE_REVIEW_REQUIRED]] |

## 3. 返金申請

返金申請窓口は次のとおりです。

- メールアドレス：[[SUPPORT_EMAIL_TBD]]
- 問い合わせフォーム：[[CONTACT_FORM_URL_TBD]]
- 返信目安：[[SUPPORT_RESPONSE_TIME_TBD]]

申請時に求める情報は、対象の決済または結果を特定するために必要な最小限とします。パスワード、カード番号または鑑定本文全文の再提出を求めない方向です。

本人確認方法、購入特定情報および誤メール対応は未決定です。[[OPERATOR_DECISION_REQUIRED]]

## 4. 返金方法および処理時間

Moon Replyの返金判断authorityは、受入済みpolicyの下でserver/operator controlledとします。選定Providerがmerchant-initiated refund executionを提供する場合、Moon Reply起点の返金commandはserver-sideとし、browser/clientに権限を与えません。本文書はそのpolicy受入または実装権限を意味しません。

Provider/Store起点のrefund、reversal、disputeその他の外部金融変更はMoon Replyの返金command外で発生し得ます。これらはauthenticatedまたはauthoritatively verifiedな証拠に基づき、正規化・reconciliationする必要があります。Browser/client stateは返金authorityではなく、重複処理はidempotentでなければなりません。Stripe、PAY.JP、Apple、GoogleおよびRevenueCatの具体的な返金mechanics、fee、期限、object関係およびfinal completion semanticsはevidence-gatedであり、本ドラフトでは推測しません。

1. 返金は元の支払方法へ行うことを原則とする方向ですが、[[PAYMENT_PROVIDER_TBD]]の仕様に従って最終化します。
2. 返金処理時間は[[REFUND_PROCESSING_TIME_TBD]]です。
3. 決済事業者の処理時間、手数料、返金可能期間および表示方法は未確認です。[[PROVIDER_CONFIRMATION_REQUIRED]]
4. 返金申請を受け付けた時点と、利用者の支払手段に反映される時点が異なる可能性があるため、確定した日数は記載しません。

## 5. 安全判定に関する返金

通常鑑定対象外の相談は決済前に停止する設計です。サービス側の検知漏れ、routing不備その他の不具合で決済された場合は、通常の恋愛鑑定書およびメッセージ案の生成を停止し、通常取消ではなくPayment Integrity incidentとして実際の意図しない経済的chargeを是正します。通常の税込980円charge 1件なら980円の是正となり得ますが、Payment Integrity remediationに税込980円の上限は設けません。

安全判定の運用、監査記録および返金自動化は未実装です。[[OPERATOR_DECISION_REQUIRED]]

## 6. 最終化条件

- 返金対象ケースおよび例外を運営者が承認する
- [[PAYMENT_PROVIDER_TBD]]の返金・チャージバック・手数料条件を確認する
- 利用規約、特定商取引法に基づく表記および最終確認画面と一致させる
- 消費者契約法その他の適用法令について最新の公式一次情報、実際のProduct/Provider挙動および最終公開文言を確認する。専門家相談は任意であり、未実施それ自体は公開・Paid Launchのblockerではない
- 返金が確定した後に遅延して完成した鑑定書を自動配信しない実装を確認する

これらが完了するまで、本ポリシーを公開用の確定文面として扱いません。
