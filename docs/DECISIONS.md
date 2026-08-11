# DECISIONS.md

## Adopted Decisions

- Service name: 月の返事
- Repository name: moon-reply
- Initial monetization: 1鑑定 ¥980 one-time payment
- No coin/point system in MVP
- Web validation before native app
- Long-term platform order: Web -> real paid Web validation -> iOS -> Android
- Primary Web payment direction: PAY.JP, subject to written provider evidence, an accepted Payment Charter, and separate implementation authorization
- Initial Web methods direction: supported cards + Apple Pay at the same JPY 980 tax-inclusive price
- Mobile payment direction: Apple IAP + RevenueCat on iOS; Google Play Billing + RevenueCat on Android
- External payment facts remain separate from the provider-independent Moon Reply purchase and entitlement/assessment-grant authority
- Subscription remains a future coexistence candidate only after repeat-purchase evidence; one-time purchase is not automatically removed
- Payment Charter v1 Candidate formulated with status `payment_charter_v1_candidate_ready_pending_human_chatgpt_review`; it is not accepted and grants no implementation authority
- Next formal Payment work: Human + ChatGPT integrated review of Payment Charter v1 Candidate; no Payment implementation is authorized
- Professional/specialist review is optional, not a mandatory Paid Launch or Production Payment gate; current official-source and actual Product/Provider/public-wording review remains required, and material unresolved legal obligations remain blockers
- AI use must be disclosed
- Dangerous consultations must not receive normal romance鑑定
- Input UX: 鑑定依頼シート, not rigid multi-field form

## Rejected / Deferred

- Stripe/Square as primary payment providers
- Coin/point system
- Native app first
- High-priced subscription first
- Subscription implementation before repeat-purchase evidence
- Web PayPay, Google Pay, or multiple simultaneous Payment Providers in the initial release
- RevenueCat Billing on Web solely to force provider uniformity
- Simultaneous Web/iOS/Android implementation or Store release
- Generic AI chat app

Canonical detail: `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`.
