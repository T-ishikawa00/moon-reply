# PROVIDER_INQUIRY_PLAN.md

## Status

Internal inquiry-preparation draft.

This is not legal advice, a submitted inquiry, or evidence of provider approval.

Task 18A did not authorize sending an inquiry or implementing a payment provider.

Task 18C prepares drafts, evidence logging, scoring rules, and a decision gate only. It does not authorize sending an inquiry, selecting a provider, or implementing payment.

The `2026-08-10` product strategy now names PAY.JP as the primary Web direction and cards plus Apple Pay as the intended initial methods. Existing drafts remain unsent historical preparation and must not be sent without a post-Charter accuracy refresh and explicit Human send authorization. PayPay, Google Pay, and multiple simultaneous Web providers are not initial requirements.

---

## 0. Rule

No real payment SDK implementation before written category review.

No provider is currently approved.

No inquiry has been sent. PAY.JP, KOMOJU, and STORES remain Not sent, Not approved, Not selected, and Not scored.

---

## 1. Inquiry Priority

1. PAY.JP
2. KOMOJU
3. STORES or other Japan-friendly provider
4. Additional providers after review

Stripe is not the default option.

Square and other providers require current official restriction review.

PAY.JP is now the strategic primary direction. The remaining order is contingency inquiry sequencing only. None of these positions is provider approval, formal evidence-gate selection, or implementation authorization.

---

## 2. Honest Product Description

Use:

`利用者が、恋愛関係の状況、返信状況、送信予定のメッセージ等を入力し、AIがその内容を整理・分析したうえで、文面が相手に与えうる印象、送る・待つ・修正するといった判断材料、メッセージ案および短期的な行動案を、デジタルレポートとして提供するサービスです。18歳以上を対象とし、1相談につき税込980円の単発決済です。ユーザー向けの商品表現として「恋のメッセージ鑑定ノート」「鑑定ノート」「鑑定書」を使用します。タロット、占星術、生年月日、数秘術、霊感その他の超自然的な占術は使用せず、相手の本心や未来の出来事を断定・保証しません。サブスクリプション、コイン、ポイント、回数券、自動更新はありません。医療、診断、心理カウンセリング、法律相談または調査は行いません。自傷、他害、DV、待ち伏せ、脅迫、監視、不正ログイン、個人情報晒し、未成年に関する不適切な相談等は決済前の安全チェックで通常鑑定を停止し、鑑定書やメッセージ案を生成しません。`

Do not disguise the service category.

Do not omit the AI use, user-facing `鑑定` terminology, actual analysis flow, digital delivery, methods not used, non-guarantee, or safety-gate characteristics to obtain approval.

Do not claim this wording settles the provider category. Ask each provider to determine its applicable business or product category from the complete functional description.

---

## 3. Questions

Ask each provider:

1. Is this service category accepted?
2. Which business/product category does the provider apply to the disclosed functions and user-facing terminology?
3. Is a one-shot JPY 980 digital delivery product accepted?
4. Can an individual sole proprietor apply?
5. What public pages are required before review?
6. Is 特商法 disclosure required before application?
7. What refund-policy wording is required?
8. Is pre-payment for digital generation accepted?
9. Are supported credit/debit cards and Apple Pay available for this service, account type, and intended flow?
10. Are future subscriptions or ticket bundles subject to re-review?
11. What webhook events are available?
12. What are webhook retry and signature-verification rules?
13. What happens to unsettled funds if the category is later rejected?
14. Are reserves or additional chargeback controls applied?
15. What wording or business practices are prohibited?
16. Is sole-proprietor registration required, or can an individual apply?
17. Is a completed public site required before review?
18. Are there fees, reserves, fund holds, or digital-content-specific requirements?

---

## 4. Evidence Log

For every response, record:

- provider
- inquiry date
- channel
- exact description sent
- response date
- responder/contact reference
- accepted/rejected/conditional
- required changes
- documents required
- evidence file/link
- next review date

Do not mark a provider approved without written evidence.

Verbal guidance, marketing copy, or an application form alone is not sufficient evidence of category approval.

---

## 5. Task 18C inquiry artifacts

- PAY.JP: `PAYJP_INQUIRY_DRAFT.md`
- KOMOJU: `KOMOJU_INQUIRY_DRAFT.md`
- STORES: `STORES_INQUIRY_DRAFT.md`
- Other providers: `GENERIC_PROVIDER_INQUIRY_TEMPLATE.md`
- Before/after send checks: `PROVIDER_INQUIRY_SUBMISSION_CHECKLIST.md`
- Inquiry and response evidence: `PROVIDER_INQUIRY_EVIDENCE_LOG.md`
- Provider facts: `PROVIDER_COMPARISON.md`
- Evidence-based score: `PROVIDER_DECISION_SCORECARD.md`
- Selection gate: `PAYMENT_PROVIDER_DECISION_GATE.md`

## 6. Required workflow

1. Verify the provider's current official inquiry channel and restricted-business information.
2. Human completes real operator contact information and approves the exact message.
3. Send only in Milestone 4, after Human acceptance of Milestones 1–3 and explicit approval of the exact inquiry.
4. Preserve the exact sent text, timestamp, channel, reference, and complete response.
5. Update the evidence log and provider comparison without optimistic assumptions.
6. Score only after evidence exists.
7. Human selects a provider only after the decision gate passes.
8. Start sandbox implementation only under a separate authorized task.
