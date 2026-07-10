# 法務ドラフト公開前承認ゲート（ドラフト）

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

## 0. ゲート規則

- 以下の項目がすべて完了し、証拠が記録されるまで法務ドラフトを公開承認しない
- Task 18Bでは一つも完了扱いにしない
- `[ ]`を`[x]`へ変更する場合は、判断者、確認日、証拠および反映先を記録する
- 本ゲートの完了は、決済実装を自動的に承認するものではない
- 決済実装は引き続き禁止します（Payment implementation remains prohibited.）

## 1. Operator completion

- [ ] 法的氏名を実情報で確定
- [ ] 運営責任者を実情報で確定
- [ ] 住所の公開方法を確定
- [ ] 電話番号の公開方法を確定
- [ ] 問い合わせメールを確定し受信確認
- [ ] 問い合わせフォームを確定し動作確認
- [ ] 問い合わせ返信目安を確定

## 2. Provider decisions

- [ ] 決済事業者から書面によるカテゴリ確認を取得
- [ ] 決済事業者をHumanが承認
- [ ] AI providerを確定
- [ ] AI endpointを確定
- [ ] AI organization/projectのdata-control settingsを確認
- [ ] Supabase regionを確認
- [ ] Email providerを確定
- [ ] Analytics導入有無とproviderを確認

## 3. Commercial decisions

- [ ] 支払方法を確定
- [ ] 支払時期を確定
- [ ] 提供時間を確定
- [ ] 返金処理時間を確定
- [ ] `needs_review`の本番運用を承認
- [ ] 誤ったメールアドレスへの訂正・再送方法を確定
- [ ] 結果URLの失効・再発行方法を確定

## 4. Privacy decisions

- [ ] 相談本文の保存期間を確定
- [ ] 安全確認記録の保存期間を確定
- [ ] 鑑定結果の保存期間を確定
- [ ] 購入・会計記録の保存期間を確定
- [ ] AIログの保存期間を確定
- [ ] メール・問い合わせ記録の保存期間を確定
- [ ] 開示・訂正・削除手順を確定
- [ ] 国外処理・国外移転の文言を確認
- [ ] Cookie・analytics方針を確定
- [ ] 外部委託先およびデータフロー一覧を確定

## 5. Review evidence

- [ ] 公開直前に最新の公式情報を再確認
- [ ] 特定商取引法に基づく表示項目と表示方法を確認
- [ ] 消費者契約法に関係する免責・責任制限・返金文言を確認
- [ ] Privacyの国外処理、委託、第三者提供、保存・削除文言を専門家確認
- [ ] 利用規約の責任制限および変更条項を専門家確認
- [ ] 返金ポリシーの法令・provider整合を確認
- [ ] 決済事業者の契約・禁止業種・運用条件を確認
- [ ] J-PlatPatで`月の返事`を検索し、日付・区分・結果・証拠を記録
- [ ] 公式の相談先をsource・jurisdiction・用途・確認日とともに確認

## 6. Implementation consistency

- [ ] 最終確認画面と特定商取引法に基づく表記の価格・数量・支払・提供・返金条件が一致
- [ ] LPと禁止表現ポリシーが一致
- [ ] AI promptと禁止表現ポリシーが一致
- [ ] Safety gateがサーバー側で強制される
- [ ] `rejected`が決済へ到達しない
- [ ] `needs_review`が未承認のまま決済へ到達しない
- [ ] AI payloadにemail、payment ID、internal token等が含まれない
- [ ] マーケティング同意が任意で結果通知と分離される
- [ ] 法務ページのリンク切れがない
- [ ] すべての公開ページ・画面・メールに最終承認された文言が反映される

## 7. Publication decision

- [ ] Humanが公開対象ファイルと最終文言を明示的に承認
- [ ] 公開日を[[EFFECTIVE_DATE_TBD]]として確定
- [ ] 最終更新日を[[LAST_UPDATED_DATE_TBD]]として確定

Task 18B完了時点では、公開判断は`NOT APPROVED FOR PUBLICATION`のままです。
