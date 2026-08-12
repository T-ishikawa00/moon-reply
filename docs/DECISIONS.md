# DECISIONS.md

## Adopted Decisions

Items explicitly labeled Human working direction in historical records retain that historical meaning. The current Stripe-first strategy is accepted at the Product/strategy level, and its Customer-facing / Public-copy Alignment is separately accepted at the Product/UI/content level. Neither acceptance is feasibility evidence, Provider approval/activation, formal selection, Payment implementation authority, Production Payment authority, or legal-publication approval.

- Service name: 月の返事
- Repository name: moon-reply
- Initial monetization: 1鑑定 ¥980 one-time payment
- No coin/point system in MVP
- Web validation before native app
- Long-term platform order: Web -> real paid Web validation -> iOS -> Android
- Human + ChatGPT accepted Product/strategy direction on `2026-08-12`, not a final Provider selection: Stripe Checkout is the strategic primary Web direction to investigate and prepare; status `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`
- Human + ChatGPT accepted the Customer-facing / Public-copy Alignment on `2026-08-12` with status `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete`; accepted lineage `3d3888f53293231506838195c478fa2e1a88417f` -> `0bdbdc87b9de5b28707a7f5ce25f12d7b6333c95` -> `48d21e7ee7d672575eae6fd957e637b37da2a52f`; Human Visual QA and Automated QA PASS
- Desired initial Web methods: credit/debit cards + Apple Pay + Google Pay + PayPay at the same JPY 980 tax-inclusive one-time price; no method is treated as available without actual evidence
- RevenueCat is not required for the initial Web path; future Stripe / Apple IAP / Google Play Billing purchase synchronization remains desired and unresolved
- PAY.JP is preserved as a paused fallback Provider direction; its evidence is retained, but its readiness plan does not control current next work
- External payment facts remain separate from the provider-independent Moon Reply purchase and entitlement/assessment-grant authority
- Human address/privacy direction: truthful private home/business-address disclosure to Stripe KYC, banks, tax/public authorities, and other legitimately required non-public counterparties is acceptable; routine public home-address display to general Customers is not desired as the default; a legally valid request-based or otherwise non-routine-public method is preferred where current law and actual Provider requirements allow
- Exact Tokushoho disclosure implementation remains unresolved and current-source/evidence-gated; private KYC disclosure is not Customer-facing public disclosure; virtual-office use is not currently required by Human preference, while GMO remains on hold, not rejected, and reconsideration remains available if evidence supports it
- Subscription remains a future coexistence candidate only after repeat-purchase evidence; one-time purchase is not automatically removed
- Payment Charter v1 is Human + ChatGPT accepted complete as of `2026-08-12` with status `human_chatgpt_accepted_complete`; Candidate commits `7aeb9ecbc5a786b895f9280112f13b0629730429` and `b6f38586fadd2a17034810dbb139465af5eade2f` remain historical lineage, and implementation authority remains `false`
- Delivery/Recovery Email Verification is `accepted_required_control_with_trusted_session_reuse`: first or untrusted-session purchase requires server-authoritative mailbox-control evidence bound to the current purchase authority/Purchase Intent; a valid trusted session bound to the unchanged verified email may be reused; email change or invalid/unavailable trusted state requires reverification
- The trusted delivery/recovery session is neither Payment authority nor Safety authority, cannot be client-self-asserted, and does not introduce login, an account, a profile, or My Page
- Stripe Feasibility Evidence Preparation: `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete` on `2026-08-12`; Lane A remains `preparation_human_approved / external_action_not_authorized / not_submitted / null` and is preserved inactive. Stripe Sales is `not_used_by_human_direction`, which is not a Stripe Provider outcome
- Stripe Lane B Human Decision Package: `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete` on `2026-08-13`; historical Candidate formulation commit `223a2746f72ae8faa90b4df198f998a8132f2f3a`; all seven decisions accepted: dedicated 18+ self-attestation, individual/sole-proprietor route, request-based disclosure preference where permitted, one business mailbox plus categorized form, accepted refund/Payment Integrity policy direction, accepted fulfillment wording skeleton without a concrete duration, and intended final production domain before Stripe Account/Site review
- `AGE-GATE-001` Human direction is accepted and downstream specification/legal alignment remains pending. Lane B remains blocked until downstream Legal/Site/KYC/domain requirements are completed. Current next work: **Stripe Lane B Legal Draft Finalization Candidate (B2)**. Actual Stripe contact/submission, Provider operations, evidence acquisition, formal selection, Payment implementation, legal publication, domain purchase, and deployment remain unauthorized
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
