# 月の返事 PRODUCT_SPEC.md v0.5

## 0. このドキュメントの位置づけ

> **B2 accepted current overlay:** `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete` on `2026-08-13`; Human + ChatGPT review / acceptance `complete / complete`. `AGE-GATE-001` is `accepted_direction_legal_spec_alignment_human_chatgpt_accepted_complete` at the accepted B2 docs/spec/legal authority level only. Exact next work is Stripe Lane B Review-ready Website/Public Surface implementation (B3); B3 is not started by this Acceptance Sync and requires the next explicit Human instruction, while real Payment enforcement remains separately unauthorized.

このドキュメントは、AIを活用した恋愛メッセージ分析・判断支援デジタルレポート「月の返事」のプロダクト親仕様書である。ユーザー向け定義は「恋のメッセージ鑑定ノート」とする。

Status note: 現在の実行順序、完了定義、次タスクおよびHuman gateは `docs/ROADMAP.md` が優先する。Payment / Platform / Purchase / Entitlement / Monetizationの詳細正本は `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md` とする。旧Phase、価格仮説、Subscription案およびprovider候補は履歴であり、それ自体は実装・問い合わせ・デプロイを承認しない。

Stripe Feasibility Evidence Preparationは`2026-08-12`に`stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`としてHuman + ChatGPT accepted completeとなった。accepted lineageは`8a07cd46ea2370b14ff09a69fa05e4de88c0f50b` -> `ef0af57d9db1c071c9847257b4a87b4f4f6af633` -> `e2111fd88dffef4137ce3202f3805aef93c647cb`である。このplanning-level acceptanceはStripe feasibility、account/contact/submission、approval/activation、formal selection、Payment implementation、Production Paymentまたはlegal publicationを確立・承認しない。

現時点ではPaymentまたはネイティブアプリの実装は行わない。
以下の順番を長期方針とし、各Planning、実装、provider、productionおよびrelease gateは別個のHuman authorityを必要とする。

1. Phase A：Web / Human + ChatGPT accepted Stripe Checkout strategic direction / credit/debit cards・Apple Pay・Google Pay・PayPay / 税込980円都度払い
2. Phase B：実CustomerによるWeb有料Product検証
3. Phase C：iOS / Apple IAP / RevenueCat
4. Phase D：Android / Google Play Billing / RevenueCat
5. Phase E：再購入データ分析
6. Phase F：必要性が確認できた場合のみSubscription設計・実装

最重要ルール：

- 需要検証なしにコードを書かない
- 7日以上ラボにこもらない
- 自己採点だけで進めない
- Day5から集客を始める
- 単発税込¥980で実需要と再購入を検証するまでSubscriptionを実装しない
- Webで有料検証し、その後iOS、iOS購入系の安定後にAndroidへ進む
- 初期Customer-facing primary modelにコイン/ポイント制を採用しない
- 不安を煽って課金させない
- 危険相談は通常鑑定にしない
- AI利用は隠さない

---

## 1. プロダクト概要

### サービス名

月の返事

### 一言定義

月の返事は、返信待ち・追いメッセージ・曖昧な関係で不安になる夜に、利用者が入力した関係状況やメッセージをAIが整理・分析し、「このメッセージを送っていいか」「今は待つべきか」「この関係に時間を使っていいのか」の判断材料を、恋のメッセージ鑑定ノートとして返すサービスである。

### 表向きの訴求

送る前に読む、恋のメッセージ鑑定ノート。

### 深層価値

返事を待つ夜に、不安で暴走する前に、入力された状況と次の一手を整理する場所。

Human-approved emotional objective:

> 恋愛の不安に対して単に答えを出すだけではなく、利用者の気持ちを少し軽くし、ひとりで考え続ける状態から抜け、次の行動を自分で選べる状態をつくる。

判断の正確さだけでなく、不安を増幅しない、急がせない、責めない、相手の本心を断定しない、迷いを整理する、再判断の時期と条件を示す、利用者自身の決定余地を残すことをUX品質とする。

---

## 2. なぜこの企画にするのか

便利ツールではなく、すでに課金心理がある深い感情領域に寄せる。

狙う感情：

- 彼の気持ちが分からない
- 返信が来なくて不安
- 追いメッセージしたい
- でも重いと思われたくない
- 曖昧な関係を続けていいのか分からない
- 友達には何度も相談できない
- 電話占いは高い
- でも今夜どうすればいいか知りたい
- ChatGPTよりも「自分の恋を読まれた感じ」がほしい
- 不安を受け止めてほしいが、暴走は止めてほしい

狙う市場心理：

恋愛相談・占いコンテンツに支払う既存の課金心理 × メッセージ送信前の迷い × 夜の衝動

これは市場心理に関する観察であり、月の返事を占いサービスと定義するものではない。

---

## 3. 初期ターゲット

### メインターゲット

25〜34歳前後の女性。

年齢だけではなく、以下の「状態」で切る。

- 返信待ちで不安になる
- 既読無視・未読無視に振り回される
- 追いメッセージしていいか迷う
- 曖昧な関係が続いている
- 復縁未満の不安を抱えている
- マッチングアプリで会った相手の温度感が分からない
- 相手に将来の意思があるのか分からない
- この関係に時間を使い続けていいのか悩む
- 占い・恋愛相談・電話占いに課金抵抗が少ない
- 夜に恋愛不安が強くなる
- 友達に何度も同じ話をしづらい

18〜22歳の軽い恋愛不安ではなく、恋愛に将来・時間・結婚・焦り・自己価値が絡み始める層を狙う。

---

## 4. 初期スコープ

### MVPで扱うもの

返信待ち不安 × 送信前メッセージ分析 × 判断支援

入口：

「このメッセージ、送っていい？」

鑑定内で扱うこと：

- 今夜送るべきか
- 待つべきか
- 軽く送るならどんな文面か
- 長文/追いメッセージ/問い詰めは危険か
- 相手の気持ちの可能性
- この関係で消耗していないか
- これ以上時間を使っていい相手か
- 3日以内にどう動くべきか

### MVPでやらないこと

- 仕事相談
- 家族相談
- 愚痴全般
- 汎用メンタル相談
- 占い総合アプリ
- 汎用AIチャット
- 片思い/復縁/曖昧な関係の全モード展開
- ネイティブアプリ化
- 高額サブスク
- コイン/ポイント課金
- 複雑な相手別ノートUI
- 週間レポート
- 過剰演出
- 画像アップロードまたはLINEスクリーンショット入力
- OCR、画像AI解析、画像保存、画像内個人情報の自動マスキング
- 初回の完全鑑定無料、広告視聴による完全鑑定無料、広告表示
- 無料回数券、無料coin/point、初回無料を繰り返す仕組み

---

## 5. 世界観・ブランド

### 世界観

返事が来ない夜に、ひとりで開く恋の鑑定ノート。
夜の秘密のノート。

### モチーフ

- 月
- 夜
- 手紙
- 星
- 静かな窓辺
- 鑑定書
- ノート
- 封筒
- 淡い光

### 色味

- 深いネイビー
- 月光のような淡いゴールド
- くすみパープル
- 温かいアイボリー
- 白すぎない紙色

### 避ける方向

- 派手な量産型占いアプリ
- 魔法陣っぽい強すぎるスピ感
- 病みすぎたUI
- ChatGPTっぽい無機質な画面
- 安っぽい恋愛診断感
- ギャグ寄り
- 煽り広告風

---

## 6. コア体験

チャットではなく、1入力 → 1鑑定書。

初期MVPの有料成果物は、同じ将来の構造化結果を基にしつつ、表示目的の異なる二層に分ける。

- `月の返事 鑑定ノート`: 理由、文面案、3日間の行動、注意点を縦に深く読むWeb版
- `保存用鑑定書`: 結論、再判断の目安、条件、文面案等を後で短時間に見返す保存版

保存用鑑定書はWeb版のスクリーンショットでも、Web全文を小さく押し込んだものでもない。A4一枚/複数枚、PDF/画像、download方法等は未決定であり、M1-I4で承認され得るのはfixture previewまでとする。

チャット型にしない理由：

- ChatGPTと比較されやすい
- 無限会話でAPIコスト・依存リスクが上がる
- 個別レポートの特別感が出にくい
- 単発課金の価値が弱く見える
- 鑑定書/手紙として保存価値が出せる
- 結果を画像・HTML・PDF的に見せやすい

基本フロー：

1. 夜に不安になる
2. アプリ/LPを開く
3. 今の状況をそのまま書く
4. 送ろうとしているメッセージを貼る
5. 関係性や知りたいことを軽く選ぶ
6. 入力内容の整理・分析が始まる
7. 「今夜の返事」という鑑定書が届く
8. 送る/待つ/軽く送る/送らないの判定が出る
9. 送るなら文面候補が出る
10. 保存して後から見返せる
11. 将来的には相手別ノートに蓄積される

---

## 7. 入力UX：鑑定依頼シート

ユーザーに細かいフォームを埋めさせない。
不安な夜に、事務手続きをさせない。

採用する入力UXは、自由入力中心の「鑑定依頼シート」。

初期有料Web MVPの入力はテキストのみとする。情報設計は少なくとも `現在の状況`、`実際のやり取り`、`送ろうとしている文面` の3領域を扱う。1ページか複数ステップかはM1-I2開始前のHuman gateとして未決定のまま残す。

LINE等の会話は必要部分のコピー貼付を積極的に案内する。入力欄付近では、名前を「相手」「自分」「Aさん」等へ置換し、実名、電話番号、住所、勤務先等を削除するよう案内する。画像/file inputは初期MVPに追加しない。

### ユーザーに見せる入力

#### 1. 大きな自由入力欄

表示文言例：

> 今の状況を、そのまま書いてください。
> まとまっていなくても大丈夫です。返事が来ないこと、相手との関係、送ろうとしている言葉、不安な気持ちをそのまま置いてください。

#### 2. 送ろうとしているメッセージ欄

表示文言例：

> 送ろうとしている文面があれば貼ってください。

#### 3. 関係性チップ

- 曖昧な関係
- 片思い
- 交際中
- 復縁したい
- マッチングアプリ
- 連絡待ち
- その他

#### 4. 知りたいことチップ

- 送っていいか
- 待つべきか
- 相手の気持ち
- この関係を続けていいか
- 文面が重くないか
- 今後どう動くべきか

#### 5. 個人情報入力禁止の注意

表示文言例：

> 実名、住所、電話番号、勤務先、SNS IDなど、個人を特定できる情報は入力しないでください。相手の名前も仮名やイニシャルで入力してください。

### 裏側でAIが構造化する項目

- 相手との関係
- 最後の連絡状況
- 返信待ち期間
- 追いメッセージ回数
- 相手の温度感
- ユーザーの感情
- 送ろうとしている文面の重さ
- 判定に必要な材料
- 危険フラグ
- 不足情報
- 推奨判定

---

## 8. 鑑定書構成

鑑定書は以下の構成を基本にする。

1. 今夜の結論
2. 今の関係の整理
3. 相手側にあり得る受け止め方
4. あなたが不安になっている核心
5. この文面がどう伝わる可能性があるか
6. 今夜の推奨アクション
   - 送っていい
   - 軽く送るならあり
   - 今夜は待つ
   - 今日は送らない方がいい
7. 送る場合の文面案
8. 3日間の行動プラン
9. この分析の限界と注意点

重要なのは、ただ優しいだけではなく、判定を下すこと。

判定だけで終了してはならない。`送っていい`、`軽く送るならあり`、`今夜は待つ`、`今日は送らない方がいい`の全正常ラベルで、今回の判断、判断理由、再判断の目安、方針を変える条件、待っている間の行動、連絡がない場合の次の選択肢、後で送る場合の文面案、断定できないことを含める。根拠なく `明日18時` 等の精密な時刻を断定しない。

ChatGPTとの差別化：

- ChatGPT：両論併記しがち
- 月の返事：今夜は送る/待つ/軽く送る/送らないを出す

---

## 9. AI人格・文体

AI感は前面に出しすぎない。
ただし、AI利用は隠さない。

人格：

優しく状況を読み解きながら、衝動的・危険な行動は止める分析者。

特徴：

- 不安を否定しない
- 不安を煽らない
- 相手の気持ちは断言しない
- 複数の可能性として読む
- 追いメッセージ・長文・問い詰めは冷静に止める
- 月・夜・手紙のブランドらしい余韻を出す
- でも現実的
- 最後は具体的な文面や行動に落とす

NG文体：

> 彼はあなたを愛しています。今すぐ連絡しましょう。

目指す文体：

> 入力内容から見ると、相手の気持ちが完全に離れたと決めつける材料は不足しています。ただ、今夜の不安のまま長文を送ると、確認したい気持ちよりも重さが先に伝わる可能性があります。送るなら、気持ちを確かめる文ではなく、軽く温度を見る一言に留める方が安全です。返信の有無は保証できません。

---

## 10. AI構成

MVP段階ではローカルLLMは使わない。

採用方針：

OpenAI API + 独自プロンプト + 鑑定書テンプレ + 判定ロジック + 安全フィルター

ローカルLLMを使わない理由：

- 初期検証が遅れる
- 日本語の情緒表現が弱くなりやすい
- GPU/運用コストが重い
- 今はモデル研究ではなく課金検証が先
- 差別化はモデルではなく、体験・テンプレ・記憶・世界観で作るべき

AI処理フロー：

1. 入力
2. 安全判定
3. 相談内容の構造化
4. 事実・推論・不足情報の分離
5. 判定エンジン
6. 鑑定書生成
7. 出力チェック
8. 保存用要約生成
9. 表示/納品

判定と文章生成は分ける。

- 判定パート：低temperature、構造化出力、安定性重視
- 鑑定書生成パート：情緒・世界観・言葉の質を重視

---

## 11. 月・夜のブランドレイヤー

「月の返事」という名前と視覚世界を支えるブランド演出として、月、夜、手紙、ノート、月明かりのモチーフを使用できる。

注意：

- 月齢、月相、星座その他の天体情報を分析入力、判定根拠または未来予測に使用しない
- 月を擬人化した表現は詩的な締めに限り、隠れた事実や未来を教える存在として扱わない
- タロット、占星術、生年月日、数秘術、霊感その他の占術・超自然的手法を使用しない
- 実質的な分析根拠は利用者が入力した情報だけとする

---

## 12. 課金方針

### 初期Web

単発鑑定：¥980固定

- 1相談 = 1鑑定書
- 税込980円
- 単発
- 自動更新なし
- 追加課金で引き延ばさない
- コインなし
- ポイントなし

初期の売り方：

恋愛相談・占いコンテンツに支払う既存市場の価格感と比べて手に取りやすい、単発のメッセージ分析レポートとして検証する。これは価格比較上の市場観察であり、サービス分類を定義しない。

### 無料枠

初期MVPでは、初回の完全鑑定無料、広告視聴による完全鑑定無料、広告表示、無料回数券、無料coin/point、初回無料を繰り返す仕組みを採用しない。

無料体験の中心は、LP上の短い抜粋、`/sample-report`の架空サンプル、Web鑑定ノート/保存用鑑定書の見本、入力例、利用の流れとする。将来の無料プレビュー実験は、実購入データを得た後に別途判断する。

### Subscriptionは実データ取得後に設計

Subscriptionは長期候補として保持するが、価格、月間回数、同梱機能および更新条件は未決定とする。税込980円都度払いとの併売を基本候補とし、Subscription導入時に都度払いを自動的に廃止しない。

判断材料は、30日/60日再購入率、Customerあたり平均購入回数、平均相談間隔、repeat customer比率、heavy user頻度とする。有料Customer 30〜50人程度、または累計50〜100鑑定程度は検討開始のheuristicであり、Hard Gate、Release Gateまたは実装条件ではない。

過去に記録された月額¥980〜1,500、月額¥3,980〜4,980、回数・機能bundleは未検証の歴史的仮説であり、現行の価格・商品決定ではない。

#### Historical / unvalidated subscription hypotheses

旧月額¥980〜1,500案：

- 月3〜5回鑑定
- 相手別ノート1人
- 3日後フォロー
- 過去ログ保存
- 同じ相手との流れを追える
- 保存無制限
- 広告なし

旧月額¥3,980〜4,980案の成立仮説：

- 相手別ノートが使われている
- 保存率が高い
- 単発リピートがある
- 深層鑑定に追加需要がある
- 3日後/7日後フォローが使われている
- 低額サブスクの継続率が良い

---

## 13. コイン/ポイント制は採用しない

初期MVPでは、コイン制・ポイント制は採用しない。

理由：

- 悪質占いサイトに類似して見える
- 価格が分かりにくくなる
- 資金決済法上の前払式支払手段の論点が出る可能性がある
- 決済審査で不利になる可能性がある
- 初期検証のデータが汚れる
- 不安を利用した継続消費に見えやすい
- 「あと少しで分かる」型の引き延ばしに見えやすい

内部では1購入に対応する`assessment_grant`を概念上利用できるが、Customer-facingにはcoin/pointとして表示しない。将来の回数券・前払いbundleは未決定であり、Payment Charter、法務およびprovider審査なしに推測しない。

---

## 14. 決済方針

### Web/PWA段階

Human + ChatGPT accepted Product/strategy directionではStripe CheckoutをWebのstrategic primaryとして調査・準備する。statusは`stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`である。ただし、この受理はStripe feasibility、account、contact、approval/activation、formal selectionまたはimplementation authorityを確立しない。Payment Charter v1受入は完了しており、Provider-independent原則は変更しない。

Stripe-first Customer-facing / Public-copy Alignmentは`2026-08-12`にHuman + ChatGPT accepted completeとなり、statusは`stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete`である。accepted lineageはbaseline `3d3888f53293231506838195c478fa2e1a88417f`、initial implementation `0bdbdc87b9de5b28707a7f5ce25f12d7b6333c95`、Human Visual QA correction `48d21e7ee7d672575eae6fd957e637b37da2a52f`であり、Human Visual QAとAutomated QAはPASSである。この受入はProduct/UI/content alignmentに限定され、Provider、Payment implementation、Production Paymentまたはlegal publication authorityではない。

初期Web決済方法の方向：

- 対応クレジット/デビットカード
- Apple Pay
- Google Pay
- PayPay
- すべて税込980円

いずれのdesired methodもactual Stripe account/category/method evidenceなしに利用可能と扱わない。PayPayはdesired / unverified / not enabled / not approvedであり、controlling lifecycle labelは`not_frozen_recheck_required`、goods typeは`unresolved_pending_actual_onboarding_evidence_and_human_review`である。unavailableの場合はPayPayなしLaunchの自動承認ではなくHuman launch reviewへ戻す。RevenueCatは初期Web fulfillmentに必須ではなくunconfiguredだが、将来のStripe / Apple IAP / Google Play Billing購入同期に利用する方向を未解決のまま保持する。PAY.JPは`paused_fallback_provider_direction`であり、evidenceは削除しない。

Product authorityは`External economic rail -> authoritative verification -> Moon Reply Purchase -> Assessment Grant -> Logical Assessment -> Report`とする。StripeまたはRevenueCatはMoon Reply Purchase、GrantまたはLogical Assessmentのauthorityを置換しない。

申請時は偽装しない。

説明文の方向性：

> 利用者が入力した恋愛関係の状況とメッセージをAIが整理・分析し、文面の受け取られ方として考えられる可能性、送る・待つ・修正するといった判断材料、メッセージ案および短期的な行動案を、デジタルレポートとして提供するサービス。ユーザー向けに「鑑定ノート」「鑑定書」という名称を使用するが、タロット、占星術、生年月日、霊感その他の占術・超自然的手法は使用せず、相手の本心や未来の出来事を断定・保証しない。

### Accepted Stripe feasibility evidence preparationとMilestone 4でやること

- Payment Charter v1は`2026-08-12`に`human_chatgpt_accepted_complete`。Candidate commitsはhistorical lineageであり、Payment implementation authorityは`false`
- Stripe-first strategyは`2026-08-12`にProduct/strategy levelでHuman + ChatGPT accepted complete。Provider selectionまたはapprovalではない
- Stripe-first Customer-facing / Public-copy Alignmentは`stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete`。Product/UI/content implementation、Human Visual QA、Automated QAはaccepted/PASS
- Stripe feasibility evidence preparationは`stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`として`2026-08-12`にaccepted complete。Lane Aは`preparation_human_approved / external_action_not_authorized / not_submitted / null`、Lane B/Cは`preparation_blocked / external_action_not_authorized / not_submitted / null`
- `STRIPE-FEAS-001`、`STRIPE-ACCOUNT-001`、`STRIPE-PAYPAY-001`は別Lane。actual Stripe account/contact/business/site/category/Live Paymentおよびpayment-method evidence acquisitionは別途承認かつevidence-gated
- Stripe account/contactは本Acceptance Sync taskでは作成・実施しない。generic marketing pageやsilenceをapprovalと扱わない
- cards、Apple Pay、Google Pay、PayPayのavailability、Checkout、test/live、webhook、refund、descriptor、Customer linkage、fees/settlementはevidence-gated
- `AGE-GATE-001`は専用`私は18歳以上です` self-attestationを採用し、eligibility目的だけの年齢層、DOBまたは本人確認書類を収集しないHuman方向性が`2026-08-13`にaccepted。accepted B2 docs/spec/legal authorityではRequestFormの既存整合を維持し、ORDER_FORM_SPEC、PAYMENT_CONFIRMATION_SCREEN_SPEC、Terms、Privacyへ同期したため、semantic stateは`accepted_direction_legal_spec_alignment_human_chatgpt_accepted_complete`。Human + ChatGPT review / acceptanceはcomplete、Production server enforcementは未実装で、Lane B/C blockerとして残る
- PAY.JP readiness evidenceはpaused fallbackとして保存し、GMO/開業届/PAY.JP申請準備をcurrent next workにしない
- stable review URLs/public legal conditionsが必要なProvider/site reviewより前にそれらを整える。formal evidence-gate selectionと別のimplementation authorization前にSDK/API実装へ進まない。Production QAはProduction Paymentを承認せず、Soft Launchには別個のProduction Payment authorizationが必要

---

## 15. iOS / Android時の課金方針

Web有料Product検証後のiOS方向はApple In-App Purchase + RevenueCatとする。初期iOSでもSubscriptionを必須とせず、税込980円のone-time / consumable-style assessment purchaseから開始可能とする。正確なStore product type、価格tier、account linkage、restorationおよびrecoveryは将来の設計事項とする。

iOSの購入検証、RevenueCat、Moon Reply account linkage、entitlement / assessment grant、restorationおよびrecoveryが安定した後、AndroidをGoogle Play Billing + RevenueCatで展開する。共有実装が可能でもStore releaseをずらしてriskを分離できる。

Webはdesired Stripe Checkout方向、iOSはApple IAP + RevenueCat、AndroidはGoogle Play Billing + RevenueCatを将来方向とし、最終的なProduct権限の正本はMoon Reply backend上でprovider-independentに正規化する。RevenueCatは初期Webに必須ではなく、将来同期のexact identity/account migration/PayPay compatibilityは未解決である。

過去の月額4,000円級Premium機能案は未検証の歴史的仮説であり、現行のSubscription価格、回数または機能決定ではない。

Historical / unvalidated Premium案：

- 1日1回まで通常鑑定
- 月4回の深層鑑定書
- 相手別ノート最大5人
- 過去ログからの関係変化分析
- 3日後/7日後フォロー
- 送った/送らなかった記録
- 今週の関係変化の振り返り
- 入力履歴に基づく週間分析メッセージ
- 保存用鑑定書画像/PDF
- 広告なし
- 優先生成

やってはいけないこと：

- 無制限チャット
- 無限鑑定
- 依存を増やす通知
- 「課金しないと彼が離れる」訴求
- ポイント消費
- 追加鑑定への引き延ばし
- 未来保証
- 復縁保証
- 相手の本心断定
- 人間鑑定士と誤認させる表現

---

## 16. 安全設計

このアプリは、医療・カウンセリング・診断ではない。

位置づけ：

AI恋愛メッセージ分析・状況整理・判断支援・エンターテインメントおよび情報提供。

避ける表現：

- うつが治る
- 精神疾患を改善
- カウンセリング
- 診断
- 必ず復縁できます
- 彼はあなたを愛しています
- 課金しないと彼が離れます
- 相手を操作できます
- 監視できます

危険入力は通常鑑定にしない。

検知対象：

- 自傷
- 他害
- DV
- モラハラ
- 束縛
- 恐怖を感じる関係
- ストーカー行為
- 監視願望
- 脅迫
- 個人情報晒し
- 未成年絡みの危険な関係
- 違法行為
- 相手を操作したい
- 相手を監視したい
- 相手の家に行く/待ち伏せする
- 「死にたい」「消えたい」等の危険表現

DV・モラハラ関係を「まだ縁があります」と後押ししない。
危険な関係では、安全側に分岐する。

---

## 17. 法務・倫理方針

月の返事は、

AIを活用した恋愛メッセージ分析・判断支援デジタルレポート

であり、

- 医療ではない
- カウンセリングではない
- 診断ではない
- 法律助言ではない
- 投資助言ではない
- 確実な未来予測ではない
- 相手の本心を保証するものではない

LP公開前に以下を用意する。

- AI利用の明記
- 医療/診断/カウンセリングではない明記
- 特商法表記
- 返金条件
- プライバシーポリシー
- 実名入力禁止ガイド
- 海外API送信可能性
- AI学習利用の扱い
- 問い合わせ先
- PR投稿時のPR表記ルール

AI利用説明例：

> 月の返事では、利用者が入力した関係状況とメッセージをAIが整理・分析し、判断材料、文面案および短期的な行動案を鑑定ノート形式のデジタルレポートとして提供します。エンターテインメントおよび情報提供目的であり、医療・カウンセリング・診断・法律相談ではありません。相手の本心や将来の出来事を断定・保証せず、占術や超自然的な手法は使用しません。

---

## 18. 禁止表現リスト

### 絶対禁止

- 彼はあなたを愛しています
- 必ず復縁できます
- 今すぐ送れば戻ってきます
- 課金しないと彼が離れます
- 今見ないと手遅れです
- この鑑定で悪い未来を避けられます
- 続きの鑑定を受けないと流れが切れます
- 相手を操作できます
- 監視すれば分かります
- 診断します
- 治療します
- カウンセリングします

### 回避訴求型コピー禁止

定義：

鑑定を受ければ恋愛上の重大な不利益を回避できるかのように見せる表現。

適用範囲：

- LP
- 広告
- X投稿
- アプリ内コピー
- Push通知
- 鑑定文
- メール
- サブスク訴求

禁止例：

- 鑑定しないと彼の気持ちは離れます
- 今すぐ見ないと手遅れになります
- このままだと復縁の可能性が消えます
- 課金すれば悪い流れを止められます
- 続きの鑑定を受けないと未来が悪くなります

代替表現：

- 送る前に、言葉の温度を見直す
- 不安なまま送る前に、今夜の流れを読む
- この関係にどう向き合うかを整理する
- 送る/待つ/距離を見る、次の一手を考える
- 返事を待つ夜に、心を少し整える

---

## 19. 返金ポリシー

Accepted Charter direction（Payment implementation authorityは`false`）：

既存draft仮説は「デジタル鑑定書という商品の性質上、納品後の返金は原則不可」。Accepted Payment Charter v1は、正しく作成された初回Product charge 1件（`JPY 980`）について、通常Product返金を`JPY 0`または`full JPY 980`とし、Customer-facingな部分返金Product policyを初期MVPでは設けないProduct原則を受け入れた。これはrefund実装、Provider操作またはProduction Payment権限ではない。

この通常Product返金方針は、P0 Payment Integrity Incidentの経済額是正を制限しない。重複成功charge、誤額、誤Customer、誤Requestその他の不正な経済chargeでは、実際に影響した意図しない経済額を是正し、Moon ReplyのPayment Integrity欠陥によってCustomerを正当な1購入`JPY 980`を超える負担に残さない。誤額取引の是正は、通常価格が`JPY 980`であることを理由に`JPY 980`へ上限設定しない。意図しない超過額の返還は、通常Productの部分返金を提供することとは別概念であり、具体的なProvider操作はevidence-gatedのまま決定しない。

以下はaccepted Charter原則に沿う通常Product full-refund候補として保持する。個別の最終判断、操作、Provider確認方法、期限、fee扱いおよびCustomer通知は、provider evidence、current-source/customer-rights reviewおよび別個のimplementation authorizationを経て確定する。Provider事実または実装済みpolicyとして扱わない。

- 例外的に決済成功後のSafety再判定で通常鑑定を提供できない場合
- サービス側都合で納品できない場合
- 明らかな提供不能
- その他、運営側が返金すべきと判断した場合

Payment Integrity remediation候補は別に保持する。

- 重複成功charge
- 誤額
- 誤Customer
- 誤Request
- 無効なpurchase authorityまたはSafety authority bypassによるcharge

内部draft方向（publication-readyではない）：

> デジタル鑑定書という商品の性質上、正常提供後の満足度のみを理由とする通常Product返金は原則対象外とする方向です。ただし、決済後の提供不能は通常Productの全額返金候補です。重複・誤額・誤Customer・誤Request等のPayment Integrity Incidentは、通常Product返金とは別に、実際に影響した意図しない経済額を是正する対象です。具体的な方法・条件・時期は、Provider evidence、current-source/Customer-rights review、actual Product behaviorおよびoperator decisionと整合後に確定します。

Safetyとserver-owned purchase eligibilityは決済前に実施し、現在のeligible resultかつ`purchaseGateSatisfied=true`の場合のみ将来の購入フローへ進める。clarification、unsafe、urgent、unsupported professional assistance、年齢/同意不備、矛盾入力、unknown/errorはfail closedとする。旧M1の`normal_allowed` / `needs_review` / `rejected`はhistorical fixture vocabularyであり、現在のpurchase authorityではない。

Accepted conceptual flowは次のとおり。

```text
consultation
  -> Safety / purchase eligibility
  -> delivery/recovery email
  -> mailbox verification if no valid trusted session
  -> server-authoritative verified-email binding
  -> final JPY 980 purchase confirmation
  -> Payment
  -> authoritative verification
  -> one Purchase / one Grant / one Logical Assessment
  -> fulfillment
  -> result delivery/recovery
```

still-valid trusted sessionがunchanged verified emailへbindされているrepeat purchaseではmailbox再検証を省略できる。Safety eligibilityとfinal purchase confirmationは毎回必須である。email変更、valid trusted session不在、expired/revoked/invalidated/unavailable state、別browser/device、sensitive recoveryまたは既存bindingを安全に確認できない場合は再検証する。

trusted stateはserver-verifiableであり、browser/client/localStorageだけで`verified=true`相当をassertできない。trusted sessionはPayment authorityでもSafety authorityでもない。初期MVPはno-loginを維持し、mandatory account、password/Google/Apple login、profileまたはMy Pageを導入しない。mailbox controlはlegal identityを証明しない。OTP/Magic Link、Provider、session/cookie/token実装、lifetime、refreshおよびrevocationは未解決であり、実装を承認しない。

将来、決済成功後にSafety再判定、AI出力Safety、継続失敗またはシステム障害で提供不能となる例外に備え、下流Milestoneでは次の状態列を設計する。

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> refund_required
  -> operator_attention_required
  -> refunded
```

提供不能時に通常レポートを出さないことは維持する。Accepted Charterはno-recharge、同一Logical Assessmentのbounded fulfillment recoveryおよびindefinite processing禁止を定める。経済的Purchaseが有効なままで、他の正当なrefund/reversalがない場合はdeliveredまたはservice-failure full-refund terminal handlingへ収束させる。一方、Customer-requested refund、法令上必要なrefund/cancellation、Provider/Store reversal、dispute/chargeback resolution等の正当に適用される別のreconciled terminal outcomeを排除せず、いずれも別のPayment、Purchase、GrantまたはLogical Assessmentを作らない。自動返金、Provider API、手数料、期限、反映日数、具体的状態名および操作はProvider evidenceと将来のimplementation/production-readiness判断まで断定しない。post-payment / pre-fulfillment Customer cancellation policyもPaid Launch前の未解決事項として維持する。

---

## 20. 完成形の理想

最終的には、恋愛不安に特化した、自分専用のAI鑑定ノートに育てる。

ユーザーは相手ごとにノートを持つ。

例：

- Aさん：曖昧な関係
- Bさん：元彼
- Cさん：片思い
- Dさん：マッチングアプリの相手

蓄積されるもの：

- 過去の相談
- 鑑定結果
- 送った/送らなかったメッセージ
- その後の反応
- 感情の推移
- 関係の変化
- 3日後のフォロー
- 今週の恋の流れ
- 月ごとの変化

完成形の価値：

あなたの恋を覚えている鑑定ノート。

---

## 21. 開発フェーズ

現在の長期Product正本は次の順序とする。

1. Phase A：Web / accepted Stripe Checkout strategic direction / credit/debit cards・Apple Pay・Google Pay・PayPay / 税込980円都度払い
2. Phase B：実CustomerによるWeb有料Product検証
3. Phase C：iOS / Apple IAP / RevenueCat
4. Phase D：Android / Google Play Billing / RevenueCat
5. Phase E：再購入データ分析
6. Phase F：必要性が確認できた場合のみSubscription設計・実装

以下の旧Phase 0〜5は成立時点の履歴であり、現在のPlatform順序、Payment authority、次タスクまたは実装権限を決めない。

### Historical Phase 0：AI鑑定品質ラボ

目的：

コードを書く前に、鑑定書そのものが課金に値するかを確認する。

期間：

7日間で強制終了。

やること：

- 実在の返信待ち/追いメッセージ系相談を匿名化して10〜15件集める
- 危険系ケースを3〜5件作る
- 4判定の基準表を作る
- AIに鑑定書を生成させる
- 自分が編集長として採点する
- ゴールド鑑定書3本を作る
- 禁止表現リストを作る
- 鑑定書画像テンプレを作る
- 25〜34歳女性5人に外部評価してもらう

### Historical Phase 1：半自動有料検証

目的：

見知らぬ人が¥980払うかを検証する。

期間：

14日間。

やること：

- LP作成
- PAY.JP/KOMOJU/STORES等で決済準備
- 鑑定依頼シートで相談受付
- AIで鑑定書生成
- 自分が品質チェック
- メール or 専用URLで納品
- フィードバック回収

価格：

¥980固定。

納品SLA：

以下は旧Phase 1半自動検証案の履歴であり、現行M1の提供時期を確定しない。現行M1 reviewではprovider、支払方法、支払時期、提供時期を未決定として表示する。

- 21:00〜24:00受付：原則1時間以内
- それ以外：翌日12:00まで

### Historical Phase 2：自動Web MVP

Phase 1でGo条件を満たした場合のみ進む。

作るもの：

- LP
- 鑑定依頼シート
- 決済
- AI鑑定書生成
- 鑑定書表示
- 鑑定結果保存
- 安全フィルター
- partner_idを持つDB設計
- 相手別ノートの最小DB構造
- 最低限の管理ログ

### Historical Phase 3：相手別ノートと低額サブスク

単発課金とリピート需要が見えたら追加。

月額¥980〜1,500の価値：

- 前回の相談を覚えている
- 同じ相手との流れを追える
- 3日後フォローがある
- 過去ログが恋愛ノートとして育つ
- 先週より関係がどう動いたか読める
- 保存件数が増える
- 広告なし

### Historical Phase 4：ネイティブアプリ

Webで単発課金・低額サブスク・相手別ノートの利用が見えてから検討。
iOSでは月額サブスクは基本的にApp StoreのIAPを使う。

### Historical Phase 5：月額4,000円級プレミアム

将来的な理想。
相手別ノート・深層鑑定・関係変化レポート・3日後/7日後フォローが実際に使われてから検討する。

---

## 22. Go/No-Go基準

以下は旧検証案のhistorical metricsである。現在のWeb release、iOS着手、Android着手またはSubscription検討のHard Gateではない。現行heuristicとauthorityは`docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`を参照する。

### Go

- LPセッション300以上
- 有料購入10件以上
- 返金要求1件以下
- 「保存したい」「また使いたい」発言3件以上
- 14日以内リピート、または明確なリピート意向2件以上
- 外部評価で刺さる文言が確認できる
- 危険相談で安全分岐できる

### 延長

- 購入3〜9件
- 反応はあるがCVRが弱い
- LPや訴求に改善余地が明確

7日だけ延長。

### No-Go

- セッション300以上で購入0〜2件
- 外部評価が悪い
- ChatGPTで十分と言われる
- 保存したい/また使いたいが出ない
- 危険ケースの処理が不安定

### チャネルNo-Go

LPに人を集められない場合は、商品ではなく集客の問題として別管理する。

---

## 23. 直近の次アクション

Stripe-first Web Payment Strategyは`2026-08-12`にHuman + ChatGPT accepted completeとなり、statusは`stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`である。Customer-facing / Public-copy Alignmentも同日に`stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete`となり、accepted lineageは`3d3888f53293231506838195c478fa2e1a88417f` -> `0bdbdc87b9de5b28707a7f5ce25f12d7b6333c95` -> `48d21e7ee7d672575eae6fd957e637b37da2a52f`、Human Visual QA / Automated QAは`PASS / PASS`である。Stripe Feasibility Evidence Preparationも同日、status `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`でHuman + ChatGPT accepted completeとなった。accepted lineageは`8a07cd46ea2370b14ff09a69fa05e4de88c0f50b` -> `ef0af57d9db1c071c9847257b4a87b4f4f6af633` -> `e2111fd88dffef4137ce3202f3805aef93c647cb`である。Lane Aは`preparation_human_approved / external_action_not_authorized / not_submitted / null`、Lane B/Cはblocked / no external authority / not submitted / `null`である。actual Stripe account/contact/business/site/category/Live Paymentおよびpayment-method evidence acquisitionは別途承認かつevidence-gatedである。Stripe feasibilityはnot established、account/contact/submission/approval/activationはabsent/none、formal selectionはincomplete、desired method eligibilityはunverifiedである。

Payment Charter v1 statusは`human_chatgpt_accepted_complete`、Delivery/Recovery Email Verificationは`accepted_required_control_with_trusted_session_reuse`、Payment implementation authorityは`false`である。Stripe/PAY.JP/RevenueCat account、contact、API、configuration、Provider call、DB/Supabase/migrationまたはRuntime/LUNA変更を承認しない。PAY.JPはpaused fallbackであり、RevenueCat initial Web useはnot required / unconfigured、future synchronizationはdesired / unresolvedである。

---

## 24. CodeX共有用注意

現時点ではPayment実装禁止。実装権限の最新境界は`docs/CURRENT_FOCUS.md`と`docs/CODEX_HANDOFF.md`が優先する。

`2026-08-13`のHuman workflow decisionによりStripe Sales routeは`not_used_by_human_direction`であり、これはStripe Provider outcomeではない。Lane Aは`preparation_human_approved / external_action_not_authorized / not_submitted / null`のままpreserved inactiveとする。Stripe Lane B Human Decision Packageはstatus `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete`でHuman + ChatGPT accepted completeとなり、7件のpolicy decisionはすべてacceptedである。B2 accepted authorityは`stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete`であり、現在の正式なPayment作業は**Stripe Lane B Review-ready Website/Public Surface implementation (B3)**である。Lane B/Cはdownstream requirements未完了のためblockedのままで、external actionは一切承認されない。authoritative Stripe evidence、Human formal selectionおよび別個のimplementation authorizationなしに、以下へ進まない。

- Stripe/PAY.JP SDK/API/checkout/webhook
- RevenueCat
- Apple IAP / Google Play Billing
- DB/Supabase/migration
- Runtime/LUNA activation変更
- 認証、Subscription、coin/point
- Provider call、PR、main merge、release

過去のPhase Go条件、automated PASS、技術的実装可能性またはStrategy合意はimplementation authorizationではない。
