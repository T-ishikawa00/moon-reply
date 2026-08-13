# 特定商取引法に基づく表記（ドラフト）

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

> B2 Candidate status: `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`（`2026-08-13`）。Human + ChatGPT review / acceptance は `pending / pending` であり、本表は公開できません。

---

この表は公開前の項目設計です。運営者の実情報、決済条件および提供条件が未確定であるため、現状のまま公開してはいけません。

分類は、A＝受入済みProduct/法務事実、B＝受入済み方向、C＝Provider evidence待ち、D＝runtime/実装待ち、E＝Human/private value、F＝publication dateです。B2は証拠のあるAまたはBだけを固定し、C〜Fを推測で埋めません。

| 項目 | 区分 | 記載内容 |
| --- | --- | --- |
| 販売事業者 | B/E | 初期MVPは適用される個人・個人事業主ルートを採る方向です。実値は[[OPERATOR_LEGAL_NAME_TBD]]。法令および実際のStripe要件が許す場合の候補文言は`請求があった場合には遅滞なく開示します`です。 |
| 屋号 | E | [[OPERATOR_TRADE_NAME_TBD]] |
| 運営責任者 | C/E | [[RESPONSIBLE_PERSON_TBD]]。StripeのHead of Operations要件と実際の値を別途確認します。 |
| 所在地 | B/C/D/E | [[OPERATOR_ADDRESS_DISCLOSURE_TBD]]。request-based disclosureは法令および実際のStripe要件が許す場合に限り、購入判断前に遅滞なく実情報を提供できる運用を要します。 |
| 電話番号 | B/C/D/E | [[OPERATOR_PHONE_DISCLOSURE_TBD]]。request-based disclosureは法令および実際のStripe要件が許す場合に限り、購入判断前に遅滞なく実際に連絡可能な情報を提供できる運用を要します。 |
| メールアドレス | B/D/E | 一つの運用可能な事業用メールボックス：[[SUPPORT_EMAIL_TBD]] |
| 問い合わせ方法 | B/D | 一つのカテゴリ分けされたフォーム：[[CONTACT_FORM_URL_TBD]] |
| 問い合わせ返信目安 | D/E | [[SUPPORT_RESPONSE_TIME_TBD]] |
| 販売価格 | A | 1鑑定につき税込980円 |
| 商品数量 | A | 1相談につき1鑑定書 |
| 商品代金以外の必要料金 | A/C | Moon ReplyのProduct価格を超えるサービス上の追加料金は設けません。インターネット接続等の通信費は利用者負担です。Provider固有の必要料金は証拠確認前に断定しません。 |
| 支払方法 | C | [[PAYMENT_METHODS_TBD]] [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 支払時期 | C | [[PAYMENT_TIMING_TBD]] [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 決済事業者 | C | [[PAYMENT_PROVIDER_TBD]] [[PROVIDER_CONFIRMATION_REQUIRED]] |
| 提供時期 | D | [[DELIVERY_TIMING_TBD]]。production-like measurement、保守的な運用bufferおよびHuman承認前に具体値を記載しません。 |
| 提供方法 | A/D | protected result pageと、適用される確認済み配信・回復用メールアドレスへの通知を予定します。実装確認：[[OPERATOR_DECISION_REQUIRED]] |
| キャンセル・返金 | A/C/D | `REFUND_POLICY_DRAFT.md`を参照。通常Product返金とPayment Integrity remediationを区別し、最終実行方法は[[CURRENT_SOURCE_REVIEW_REQUIRED]] [[PROVIDER_CONFIRMATION_REQUIRED]]。 |
| 動作環境 | D | 対応ブラウザ、JavaScript、Cookieその他の必要条件：[[OPERATOR_DECISION_REQUIRED]] |
| 申込み有効期限 | C/D | 現時点で申込み期間の制限は採用していません。将来制限を採用する場合は、実装およびProvider条件と一致する内容を表示します。 |
| 表現・商品上の注意 | A | AIを活用して、利用者が入力した恋愛関係の状況およびメッセージを整理・分析し、判断材料、文面案および短期的な行動案を鑑定ノート形式で提供するデジタルレポートです。エンターテインメントおよび情報提供目的であり、占術・超自然的手法は使用しません。相手の本心、返信、復縁、未来または関係改善を保証せず、医療・心理・法律上の助言ではありません。 |
| 対象年齢 | A/D | 18歳以上。必須boolean自己申告 `私は18歳以上です` を使用し、年齢適格性だけのために年齢層、DOBまたは本人確認書類を収集しません。server enforcementは別実装です。 |
| 最終更新日 | F | [[LAST_UPDATED_DATE_TBD]] |

## Request-based disclosure operation boundary

- CustomerはPaymentおよび購入判断の前に販売事業者情報を請求できなければなりません。
- 販売事業者情報の開示請求だけを理由として、ログイン、購入完了またはPurchase IDを要求しません。
- request、response、開示内容および開示日時を監査可能にする必要があります。
- 架空情報、placeholderまたは機能しない請求経路を実情報として表示しません。
- 省略可能な項目は法令と実際のStripe要件の双方で条件を満たす項目に限り、すべての項目を非公開にできるとは扱いません。

## 公開前の必須確認

- 事業者名、責任者、所在地、電話番号、メールアドレスについて、公開表示または適法かつ実際に機能する請求時開示のいずれか必要な方法で実情報を完成させる
- 販売事業者名、住所または電話番号等を省略できると断定せず、採用する表示方法を最新の消費者庁公式情報、実情報、provider要件およびHuman判断に基づいて決定する。専門家相談は任意
- バーチャルオフィスその他の住所が利用可能と断定しない
- 決済事業者のカテゴリ確認、支払方法、支払時期および返金条件を書面で確認する
- Providerまたは第三者による業種区分は未確定であり、サービス名称ではなく実際の機能と表示を提示して確認する
- 最終確認画面と本表の価格、数量、支払、提供および返金条件を一致させる

B2 Candidateでは、受入済みA/B項目をdecision resolvedとできますが、C〜Fおよびpublication gateは未完了です。本表は公開可能または法令適合確認済みとして扱いません。
