# WHAT_IS_DECIDED_AND_WHAT_IS_NEXT.md

## この文書の目的

月の返事について、

- すでに決まったこと
- これから運営者が決めること
- 外部の回答が必要なこと
- current-source/evidence reviewが必要なこと

を分かりやすく整理する。

この文書は内部検討用であり、法的助言、公開承認、決済事業者の承認または実装承認ではない。

---

## すでに決まったこと

### 対象・価格・販売方法

- 初期MVPは18歳以上のみを対象とする
- 価格は1件あたり税込980円とする
- 1購入 = 1相談 = 1鑑定書とする
- 単発販売のみとする
- サブスクリプション、コイン、ポイント、回数券、自動更新は行わない

### サービスの位置づけ

- 公式定義を「AIを活用した恋愛メッセージ分析・判断支援デジタルレポート」とする
- ユーザー向け定義を「恋のメッセージ鑑定ノート」とし、`鑑定`はレポート形式とブランドを表す
- エンターテインメントおよび情報提供、感情の整理、メッセージ分析ならびに意思決定の支援を目的とする
- タロット、占星術、生年月日、数秘術、霊感その他の占術・超自然的手法または外部調査を使用しない
- 相手の本心、返信、復縁、未来または関係改善を保証しない
- 医療、心理または法律サービスとして提供しない
- AI利用と結果の不確実性を明示する

### Safetyと入力情報

- Safety screeningは決済前に行う
- `rejected`は決済へ進めない
- `needs_review`も初期MVPでは決済へ進めない
- 通常鑑定対象外ケースには鑑定書やメッセージ案を生成しない
- スクリーンショットは受け付けない
- 実名、住所、電話番号、相手のフルネーム等の入力を禁止する
- AI payloadからemail、決済ID、内部token等を除外する

### 同意・販売表現・決済事業者

- 結果通知とマーケティング同意を分離する
- 不安を煽る販売、結果保証、架空レビュー、架空実績を禁止する
- 決済事業者は、実際の事業内容をtruthfully開示し、provider-specific authoritative approval/review evidenceを取得した後にHumanが正式選定する
- Stripe CheckoutはHuman desired strategic primary Web directionだが、Candidate review pendingであり、feasibility、account、approval/activation、formal selectionおよびmethod eligibilityを確立しない
- desired initial methodsはcards、Apple Pay、Google Pay、PayPay。いずれもunverifiedで、PayPay unavailableはPayPayなしLaunchの自動承認ではない
- RevenueCatはinitial Webに必須ではなく、future synchronizationはdesired / unresolved。PAY.JPはpaused fallback
- Providerまたは第三者の業種区分は未確定であり、文言変更だけで承認・免除を得られるとは扱わない

Product、価格、Safetyおよびtruthful positioningのaccepted内部方針は維持する。Stripeに関する箇条書きはHuman working directionの記録であり、Candidate acceptance、feasibility、approval/activation、formal selectionまたはimplementation authorityではない。

---

## 運営者が決めること

- 個人、個人事業主、法人のどの運営形態にするか
- 「月の返事」を屋号として使うか、別屋号または屋号なしにするか
- 住所・電話番号をどの適法な方法で表示するか
- 問い合わせをメール、フォームまたは両方で受けるか
- 問い合わせの返信目安を2営業日、3営業日、5営業日等のどれにするか
- Analyticsを利用するか
- Cookieをどの範囲で利用し、どのように説明・選択可能にするか
- 結果ページを何日利用可能にするか
- 結果URLの失効・再発行と誤メール訂正をどう扱うか
- 初期MVPでマーケティングメールを行うか
- 鑑定書の共有を私的利用のみ、一部共有可、全文共有可のどこまで許可するか

判断は `OPERATOR_DECISION_GUIDE.md` を読み、`OPERATOR_DECISION_WORKSHEET.md` に回答して記録する。個人情報はこの段階で推測または仮入力しない。

---

## 外部から証拠を得ること

- 決済事業者固有の正式な審査経路によるauthoritative category/application acceptance、条件および追加対応
- Stripeの場合、actual account/business/site/category/Live Payment outcome、accurate submitted descriptionおよびconditions
- cards、Apple Pay、Google Pay、PayPayのaccount/category/method-specific eligibilityと追加条件
- Webhookイベント、署名検証、再送仕様および冪等性に必要な実装証拠
- 手数料、入金サイクル、返金、チャージバック、保留金、契約終了時の未精算金条件
- 単発デジタルコンテンツの決済・納品条件
- AI providerの契約、endpoint、data controls、処理地域および保持条件
- Supabaseの実project regionと利用機能
- Email providerの送信方式、処理地域、保持・削除条件
- Safety gateとAI payloadが設計どおりに動くことを示す実装・試験証拠

公式サイトの一般的なマーケティング説明、blank application form、generic support answer、optional clarificationだけでは、月の返事のカテゴリ承認の証拠にならない。

---

## Current-source / Evidence Reviewが必要なこと

- 特定商取引法上の住所・電話番号の表示方法
- 個人、個人事業主または法人という運営形態に関する法務・税務上の整理
- AI、決済、データ保管、メールに伴う国外処理・国外移転の文言
- 利用規約の免責、責任制限、変更およびサービス終了条項
- 返金・キャンセル文言とprovider条件・法令の整合
- 相談本文、鑑定結果、購入記録、AIログ等の保存期間
- 開示、訂正、削除請求、本人確認および保存例外の手順
- AI生成物の権利帰属と利用許諾
- 準拠法・管轄裁判所の最終文言

これらは最新の公式一次情報、実際のProduct/Provider挙動、最終公開文言およびCustomer-rightsとの整合確認が必要な事項である。ApplicableなHuman/operator判断も完了させ、materialな未解決法的義務はblockerとして残す。内部reviewは法的適合性を保証しない。

専門家相談は`2026-08-11` Human decisionにより任意であり、Payment Charter受入、公開、Paid LaunchまたはProduction Paymentの必須条件ではない。現時点で専門家reviewは実施・完了していない。

---

## 次の順番

現在の実行順序は `docs/ROADMAP.md` が制御する。法務・provider準備文書の旧Task順序は、現行Milestoneを上書きしない。

1. Task M1-P1で決済なしのReviewable Web MVPを仕様化し、Humanが受け入れる
2. Milestone 1の実装sliceを一つずつ実装・検証・Human受入れする
3. Milestone 2で運営者情報と公開条件を完成する
4. Milestone 3で決済なしの審査用サイトをデプロイする
5. Human + ChatGPTがStripe strategy Candidateをintegrated reviewし、acceptまたはreviseする
6. 別権限でtruthful public-copy alignmentを行い、Stripe feasibility evidence acquisitionをHumanが承認する
7. actual Stripe evidenceでcategory/Live Payment/cards/Apple Pay/Google Pay/PayPayを確認する
8. desired method不足時は明示的Human launch reviewへ戻し、authoritative evidenceに基づいてHumanがproviderを正式選定する
9. 別個のimplementation authorization後に選定済みproviderのsandbox/test実装へ進む

Operator identity、住所・電話表示、support email、Tokushoho publication、opening notificationおよびvirtual officeは未解決のまま維持する。PAY.JP固有の準備はcurrent next workではなくpaused fallbackであり、Stripeも法務・公開義務を除去しない。Provider-specific Payment implementation must not begin before Human formal selection and separate implementation authorization.
