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
> この文書は月の返事の内部検討用ドラフトです。運営者情報、利用する外部事業者、保存期間、提供条件等が未確定であり、公開前に最新の公式情報、実際のサービス仕様、決済事業者の条件および必要に応じた専門家確認を反映する必要があります。

---

## 1. 基本方針

本ポリシーは、税込980円の単発デジタル鑑定書について、現時点の返金・再提供方針案を整理するものです。「いかなる場合も返金しない」とするものではなく、法令上の権利を制限しません。

返金条件は、[[PAYMENT_PROVIDER_TBD]]の仕様、実装、利用者への表示および専門家確認を経て最終化します。[[PROFESSIONAL_REVIEW_REQUIRED]] [[PROVIDER_CONFIRMATION_REQUIRED]]

## 2. ケース別マトリクス

| ケース | 現時点の方針案 | 最終確認 |
| --- | --- | --- |
| 決済前 | 料金は発生しません。 | 実装確認：[[OPERATOR_DECISION_REQUIRED]] |
| 決済後・生成開始前のユーザーキャンセル | 返金可否は未決定です。 | [[OPERATOR_DECISION_REQUIRED]] [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 正常に鑑定書を提供済み | 鑑定内容への不満または満足度のみを理由とする返金は、原則対象外とする方向です。 | [[PROFESSIONAL_REVIEW_REQUIRED]] |
| AI生成失敗 | 全額返金の候補とします。 | [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 結果保存失敗 | 再生成または全額返金の候補とします。 | [[OPERATOR_DECISION_REQUIRED]] |
| 重複決済 | 重複分を返金する方向です。 | [[PROVIDER_CONFIRMATION_REQUIRED]] |
| `rejected`相談を誤って決済 | 生成を停止し、全額返金の候補とします。 | サーバー実装必須：[[OPERATOR_DECISION_REQUIRED]] |
| `needs_review`相談を誤って決済 | 生成を停止し、全額返金の候補とします。 | サーバー実装必須：[[OPERATOR_DECISION_REQUIRED]] |
| サービス障害 | 再提供または返金の候補とします。 | [[OPERATOR_DECISION_REQUIRED]] |
| メールアドレス入力間違い | 本人確認後の訂正および再送を優先する方向です。 | [[OPERATOR_DECISION_REQUIRED]] |
| 結果URL紛失 | 本人確認後の再発行を候補とします。 | セキュリティ設計：[[OPERATOR_DECISION_REQUIRED]] |
| 鑑定内容への不満のみ | 原則として返金対象外とする方向です。 | [[PROFESSIONAL_REVIEW_REQUIRED]] |
| チャージバック | 決済事業者の手続および適用法令に従います。 | [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 法令上返金が必要な場合 | 適用法令に従います。 | [[PROFESSIONAL_REVIEW_REQUIRED]] |

## 3. 返金申請

返金申請窓口は次のとおりです。

- メールアドレス：[[SUPPORT_EMAIL_TBD]]
- 問い合わせフォーム：[[CONTACT_FORM_URL_TBD]]
- 返信目安：[[SUPPORT_RESPONSE_TIME_TBD]]

申請時に求める情報は、対象の決済または結果を特定するために必要な最小限とします。パスワード、カード番号または鑑定本文全文の再提出を求めない方向です。

本人確認方法、購入特定情報および誤メール対応は未決定です。[[OPERATOR_DECISION_REQUIRED]]

## 4. 返金方法および処理時間

1. 返金は元の支払方法へ行うことを原則とする方向ですが、[[PAYMENT_PROVIDER_TBD]]の仕様に従って最終化します。
2. 返金処理時間は[[REFUND_PROCESSING_TIME_TBD]]です。
3. 決済事業者の処理時間、手数料、返金可能期間および表示方法は未確認です。[[PROVIDER_CONFIRMATION_REQUIRED]]
4. 返金申請を受け付けた時点と、利用者の支払手段に反映される時点が異なる可能性があるため、確定した日数は記載しません。

## 5. 安全判定に関する返金

通常鑑定対象外の相談は決済前に停止する設計です。サービス側の検知漏れ、ルーティング不備その他の不具合で決済された場合は、通常の恋愛鑑定書およびメッセージ案の生成を停止し、全額返金の候補として扱います。

安全判定の運用、監査記録および返金自動化は未実装です。[[OPERATOR_DECISION_REQUIRED]]

## 6. 最終化条件

- 返金対象ケースおよび例外を運営者が承認する
- [[PAYMENT_PROVIDER_TBD]]の返金・チャージバック・手数料条件を確認する
- 利用規約、特定商取引法に基づく表記および最終確認画面と一致させる
- 消費者契約法その他の適用法令に関する専門家確認を行う

これらが完了するまで、本ポリシーを公開用の確定文面として扱いません。
