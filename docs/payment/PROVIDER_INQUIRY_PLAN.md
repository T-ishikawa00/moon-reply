# PROVIDER_INQUIRY_PLAN.md

## Status

Internal inquiry-preparation draft.

This is not legal advice, a submitted inquiry, or evidence of provider approval.

Task 18A did not authorize sending an inquiry or implementing a payment provider.

Task 18C prepares drafts, evidence logging, scoring rules, and a decision gate only. It does not authorize sending an inquiry, selecting a provider, or implementing payment.

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

Priority is for inquiry sequencing only; it is not a provider recommendation or approval.

---

## 2. Honest Product Description

Use:

`恋愛メッセージに関するAI鑑定ノートサービスです。18歳以上の利用者を対象に、返信待ち、追いメッセージ、曖昧な関係等について、AIを活用し、占い・エンタメ・感情整理目的のデジタル鑑定書を1相談につき税込980円の単発決済で提供する予定です。サブスクリプション、コイン、ポイント、回数券、自動更新はありません。医療、診断、心理カウンセリング、法律相談、相手の本心断定、復縁・返信・未来・関係改善の保証は行いません。自傷、他害、DV、待ち伏せ、脅迫、監視、不正ログイン、個人情報晒し、未成年に関する不適切な相談等は決済前の安全チェックで通常鑑定を停止し、鑑定書やメッセージ案を生成しません。`

Do not disguise the service category.

Do not omit the AI, fortune-telling/entertainment, digital-delivery, or safety-gate characteristics to obtain approval.

---

## 3. Questions

Ask each provider:

1. Is this service category accepted?
2. Is AI-generated fortune-telling/entertainment digital content accepted?
3. Is a one-shot JPY 980 digital delivery product accepted?
4. Can an individual sole proprietor apply?
5. What public pages are required before review?
6. Is 特商法 disclosure required before application?
7. What refund-policy wording is required?
8. Is pre-payment for digital generation accepted?
9. Are credit card and PayPay available?
10. Are future subscriptions or ticket bundles subject to re-review?
11. What webhook events are available?
12. What are webhook retry and signature-verification rules?
13. What happens to unsettled funds if the category is later rejected?
14. Are reserves or additional chargeback controls applied?
15. What wording or business practices are prohibited?

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
3. Send only in Task 18D after explicit approval.
4. Preserve the exact sent text, timestamp, channel, reference, and complete response.
5. Update the evidence log and provider comparison without optimistic assumptions.
6. Score only after evidence exists.
7. Human selects a provider only after the decision gate passes.
8. Start sandbox implementation only under a separate authorized task.
