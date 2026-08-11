# DECISIONS.md

## Adopted Decisions

- Service name: 月の返事
- Repository name: moon-reply
- Initial monetization: 1鑑定 ¥980 one-time payment
- No coin/point system in MVP
- Web validation before native app
- Long-term platform order: Web -> real paid Web validation -> iOS -> Android
- Primary Web payment direction: PAY.JP, subject to written provider evidence, formal evidence-gate selection, and separate implementation authorization
- Initial Web methods direction: supported cards + Apple Pay at the same JPY 980 tax-inclusive price
- Mobile payment direction: Apple IAP + RevenueCat on iOS; Google Play Billing + RevenueCat on Android
- External payment facts remain separate from the provider-independent Moon Reply purchase and entitlement/assessment-grant authority
- Subscription remains a future coexistence candidate only after repeat-purchase evidence; one-time purchase is not automatically removed
- Payment Charter v1 is Human + ChatGPT accepted complete as of `2026-08-12` with status `human_chatgpt_accepted_complete`; Candidate commits `7aeb9ecbc5a786b895f9280112f13b0629730429` and `b6f38586fadd2a17034810dbb139465af5eade2f` remain historical lineage, and implementation authority remains `false`
- Delivery/Recovery Email Verification is `accepted_required_control_with_trusted_session_reuse`: first or untrusted-session purchase requires server-authoritative mailbox-control evidence bound to the current purchase authority/Purchase Intent; a valid trusted session bound to the unchanged verified email may be reused; email change or invalid/unavailable trusted state requires reverification
- The trusted delivery/recovery session is neither Payment authority nor Safety authority, cannot be client-self-asserted, and does not introduce login, an account, a profile, or My Page
- Next formal Payment work: Post-Charter PAY.JP inquiry accuracy refresh and Human send-readiness review; no inquiry send or Payment implementation is authorized
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
