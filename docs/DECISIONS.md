# DECISIONS.md

## Adopted Decisions

Items explicitly labeled Human working direction record that direction only. They are not Stripe strategy Candidate acceptance, feasibility evidence, Provider approval/activation, formal selection, or implementation authority.

- Service name: 月の返事
- Repository name: moon-reply
- Initial monetization: 1鑑定 ¥980 one-time payment
- No coin/point system in MVP
- Web validation before native app
- Long-term platform order: Web -> real paid Web validation -> iOS -> Android
- Human working direction, not an accepted final Provider selection: Stripe Checkout is the desired strategic primary Web direction; the Candidate remains pending Human + ChatGPT integrated review
- Desired initial Web methods: cards + Apple Pay + Google Pay + PayPay at the same JPY 980 tax-inclusive one-time price; no method is treated as available without actual evidence
- RevenueCat is not required for the initial Web path; future Stripe / Apple IAP / Google Play Billing purchase synchronization remains desired and unresolved
- PAY.JP is preserved as a paused fallback Provider direction; its evidence is retained, but its readiness plan does not control current next work
- External payment facts remain separate from the provider-independent Moon Reply purchase and entitlement/assessment-grant authority
- Subscription remains a future coexistence candidate only after repeat-purchase evidence; one-time purchase is not automatically removed
- Payment Charter v1 is Human + ChatGPT accepted complete as of `2026-08-12` with status `human_chatgpt_accepted_complete`; Candidate commits `7aeb9ecbc5a786b895f9280112f13b0629730429` and `b6f38586fadd2a17034810dbb139465af5eade2f` remain historical lineage, and implementation authority remains `false`
- Delivery/Recovery Email Verification is `accepted_required_control_with_trusted_session_reuse`: first or untrusted-session purchase requires server-authoritative mailbox-control evidence bound to the current purchase authority/Purchase Intent; a valid trusted session bound to the unchanged verified email may be reused; email change or invalid/unavailable trusted state requires reverification
- The trusted delivery/recovery session is neither Payment authority nor Safety authority, cannot be client-self-asserted, and does not introduce login, an account, a profile, or My Page
- Next formal Payment work: Human + ChatGPT integrated review of Stripe Feasibility and Web Payment Strategy Pivot Candidate; Stripe feasibility/account/approval/activation/formal selection remain absent or incomplete, and Provider operations/Payment implementation remain unauthorized
- Professional/specialist review is optional, not a mandatory Paid Launch or Production Payment gate; current official-source and actual Product/Provider/public-wording review remains required, and material unresolved legal obligations remain blockers
- AI use must be disclosed
- Dangerous consultations must not receive normal romance鑑定
- Input UX: 鑑定依頼シート, not rigid multi-field form

## Rejected / Deferred

- Stripe formal selection before authoritative feasibility/account/business/site/method evidence
- Coin/point system
- Native app first
- High-priced subscription first
- Subscription implementation before repeat-purchase evidence
- Silent removal of PayPay or another desired method when actual Stripe evidence shows it unavailable; that outcome requires explicit Human launch review
- RevenueCat as a mandatory dependency for the initial Web Payment path
- Simultaneous Web/iOS/Android implementation or Store release
- Generic AI chat app

Canonical detail: `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`.
