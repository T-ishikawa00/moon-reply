# PROVIDER_INQUIRY_PLAN.md

## Status

Internal provider-evidence planning document.

This is not legal advice, a submitted inquiry/application, or evidence of provider approval.

Task 18A did not authorize a Provider account, application submission, inquiry, or Payment implementation.

Task 18C prepared historical drafts, evidence logging, scoring rules, and a decision gate only. It did not authorize an account, application submission, inquiry, provider selection, or Payment implementation.

The `2026-08-10` product strategy names PAY.JP as the primary Web direction and cards plus Apple Pay as the intended initial methods. Current PAY.JP guidance checked on `2026-08-12` provides no pre-application screening: the PAY.JP primary path is production-application readiness, explicit Human submission authorization, production-use application, and preservation of review evidence. The PAY.JP inquiry draft is an unsent historical artifact that may be adapted only for a specific support clarification; it is not a preapproval path. PayPay, Google Pay, and multiple simultaneous Web providers are not initial requirements.

---

## 0. Rule

No real payment SDK implementation before provider-specific authoritative approval/review evidence, Human formal selection, and separate implementation authorization.

No provider is currently approved.

No PAY.JP production-use application has been submitted. No inquiry has been sent. PAY.JP, KOMOJU, and STORES remain Not approved, Not selected, and Not scored.

---

## 1. Provider-specific evidence routes

1. PAY.JP: `PAYJP_PRODUCTION_APPLICATION_READINESS.md` -> Human submit authorization -> production-use application -> PAY.JP/card-company review evidence.
2. KOMOJU: fallback only; verify its current provider-specific official review/inquiry route before use.
3. STORES or another Japan-friendly provider: fallback only; verify its current provider-specific evidence route before use.
4. Additional providers: only after separate review and authorization.

Stripe is not the default option.

Square and other providers require current official restriction review.

PAY.JP is the strategic primary direction. The remaining order is contingency sequencing only. No generic inquiry model may be forced onto every provider. None of these positions is provider approval, formal evidence-gate selection, or implementation authorization.

---

## 2. Honest Product Description

Use:

`利用者が、恋愛関係の状況、返信状況、送信予定のメッセージ等を入力し、AIがその内容を整理・分析したうえで、文面が相手に与えうる印象、送る・待つ・修正するといった判断材料、メッセージ案および短期的な行動案を、デジタルレポートとして提供するサービスです。18歳以上を対象とし、1相談につき税込980円の単発決済です。ユーザー向けの商品表現として「恋のメッセージ鑑定ノート」「鑑定ノート」「鑑定書」を使用します。タロット、占星術、生年月日、数秘術、霊感その他の超自然的な占術は使用せず、相手の本心や未来の出来事を断定・保証しません。サブスクリプション、コイン、ポイント、回数券、自動更新はありません。医療、診断、心理カウンセリング、法律相談または調査は行いません。自傷、他害、DV、待ち伏せ、脅迫、監視、不正ログイン、個人情報晒し、未成年に関する不適切な相談等は決済前の安全チェックで通常鑑定を停止し、鑑定書やメッセージ案を生成しません。`

Do not disguise the service category.

Do not omit the AI use, user-facing `鑑定` terminology, actual analysis flow, digital delivery, methods not used, non-guarantee, or safety-gate characteristics to obtain approval.

Do not claim this wording settles the provider category. Submit the complete functional description through the provider's authoritative review route. For PAY.JP that means the production-use application, not a pre-screening inquiry.

---

## 3. Facts that provider evidence must resolve

Resolve the following through each provider's verified evidence route. For PAY.JP, use actual application/review evidence; support may be contacted only for a specific clarification and its answer must not be treated as category approval.

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

## 4. Evidence log

For every application, review, inquiry, or response, record as applicable:

- provider
- submission/inquiry date
- channel
- exact description and application facts submitted/sent
- response date
- responder/contact reference
- accepted/rejected/conditional
- required changes
- documents required
- evidence file/link
- next review date

Do not mark a provider approved without authoritative evidence from its applicable approval/review route.

Verbal guidance, marketing copy, a blank application form, or an optional support clarification alone is not sufficient evidence of category approval.

---

## 5. Evidence and historical inquiry artifacts

- PAY.JP controlling readiness: `PAYJP_PRODUCTION_APPLICATION_READINESS.md`
- PAY.JP historical/optional support template: `PAYJP_INQUIRY_DRAFT.md`
- KOMOJU: `KOMOJU_INQUIRY_DRAFT.md`
- STORES: `STORES_INQUIRY_DRAFT.md`
- Other providers: `GENERIC_PROVIDER_INQUIRY_TEMPLATE.md`
- Before/after send checks: `PROVIDER_INQUIRY_SUBMISSION_CHECKLIST.md`
- Inquiry and response evidence: `PROVIDER_INQUIRY_EVIDENCE_LOG.md`
- Provider facts: `PROVIDER_COMPARISON.md`
- Evidence-based score: `PROVIDER_DECISION_SCORECARD.md`
- Selection gate: `PAYMENT_PROVIDER_DECISION_GATE.md`

## 6. Required workflow

### PAY.JP primary path

1. Complete the bounded readiness plan without creating an account or claiming implementation readiness.
2. Human supplies truthful operator/application facts, final intended URLs, and route-specific documents.
3. Review legal/publication and security-declaration readiness; recheck current PAY.JP requirements and actual application fields.
4. Human explicitly authorizes the exact production-use application submission.
5. Submit only under that future authorization and preserve the exact application/reference/review evidence.
6. Resolve every additional-information request and attached condition from evidence.
7. Human formally selects PAY.JP only after authoritative acceptance evidence passes the decision gate.
8. Start Payment implementation only under a separate authorized task.

### Contingency-provider path

1. Verify the provider's own current official review, application, or inquiry route.
2. Obtain explicit Human authorization before any external submission or contact.
3. Preserve exact evidence and update the comparison without optimistic assumptions.
4. Score and select only after provider-specific authoritative evidence exists.
