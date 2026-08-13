# LEGAL_COMPLIANCE_FOUNDATION.md

## 0. Purpose

Defines the internal compliance position for 月の返事.

This is an internal planning draft.

This document is:

- internal
- provisional
- not legal advice
- not a public legal page
- subject to current-source and Provider-evidence review, with optional professional escalation

It must not be represented as legally complete or approved for publication.

B2 accepted status is `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete` on `2026-08-13`; Human + ChatGPT review / acceptance is `complete / complete`. The seven accepted Lane B Human decisions are aligned as accepted docs/spec/legal authority only. Payment implementation, Production Payment, Provider selection, and legal publication remain `false` or unresolved.

---

## 1. Product Classification

月の返事 is designed as:

- an AI-assisted relationship-message analysis and decision-support digital report
- Customer-facing 恋のメッセージ鑑定ノート that organizes known facts, unknowns, interpretations, rationale, action, reassessment, and message drafts
- one-shot digital content delivery using AI

Moon, night, letter, paper, navy, ivory, and pale-gold presentation is visual/editorial atmosphere only. The service uses no tarot, astrology, birth-date divination, numerology, psychic/spiritual method, supernatural prediction, or external investigation.

It is not designed as:

- medical diagnosis
- treatment
- psychotherapy
- licensed psychological counseling
- legal advice
- investigation of another person
- guarantee of reconciliation or reply
- surveillance service
- matching, introduction, or intermediary service
- human fortune-teller service

The service must not claim knowledge of another person's true feelings or guarantee the future, a reply, reconciliation, or relationship improvement.

---

## 2. Initial MVP Commercial Model

- Users: 18 years or older
- Price: JPY 980 including tax
- One purchase = one request = one reading
- No subscription
- No coins
- No prepaid points
- No bundled tickets
- No automatic renewal
- No free trial with automatic billing

Age eligibility policy for the initial MVP:

- The initial MVP is for users aged 18 or older
- A dedicated `私は18歳以上です` checkbox records required boolean self-attestation
- No age band, date of birth, or identity document is collected solely for age eligibility
- The future production server flow must require adult confirmation as part of server-owned Purchase authority before Payment
- B2 aligns documents/specifications only and does not implement the production control

This is required self-attestation, not strict identity verification. The current RequestForm and prepayment gate already follow this direction and are not changed by B2.

---

## 3. Core Consumer Protection Rules

- Do not exploit romantic anxiety
- Do not state that purchase is necessary to avoid harm
- Do not claim guaranteed outcomes
- Do not create artificial urgency
- Do not conceal AI use
- Do not conceal material purchase conditions
- Do not use fake testimonials
- Do not use fake user counts
- Do not use fake satisfaction metrics
- Do not extend one purchase through repeated upselling
- Do not pressure users into additional readings

No landing page, advertisement, email, payment screen, prompt, or generated reading may use fear-based selling or fabricated social proof.

---

## 4. Payment Order

Required order:

1. Request form and adult self-attestation
2. Safety screening
3. Unsupported/dangerous case termination
4. Applicable verified delivery/recovery email binding
5. Purchase summary
6. Final confirmation and correction opportunity
7. Server-owned Purchase authority
8. Payment
9. Server-authoritative Payment success
10. Reading generation
11. Protected result-page delivery and verified-email notification

Dangerous or unsupported cases must not be charged.

Rejected cases must not receive an ordinary reading. Needs-review cases must not reach real payment until approved production handling exists.

Product or technical fulfillment failure uses bounded same-Purchase recovery without recharge and a full JPY 980 ordinary refund if secure and valid fulfillment remains impossible. Duplicate charge, wrong amount, wrong Customer, wrong Request, Safety bypass, and another unintended economic charge are Payment Integrity remediation rather than ordinary Product refund; the actual economic error must be corrected without a JPY 980 remediation cap. These state machines and Provider operations are not implemented by B2.

---

## 5. Required Public Disclosures

Before public paid launch, prepare and review:

- Terms of Service
- Privacy Policy
- 特定商取引法に基づく表記
- Refund Policy
- AI Use / Disclaimer
- Unsupported Cases / Safety Policy
- Contact Method
- Final Payment Confirmation Screen

The Contact model is one operating business mailbox plus one categorized form using exactly result delivery, ordinary refund, Payment Integrity, Privacy, seller-information disclosure, and other. Seller-information disclosure must be requestable before Payment without login, completed purchase, or Purchase ID solely for that request.

B2 does not create publication-ready versions of these pages.

---

## 6. Personal Data Position

Collect only what is necessary.

Do not request:

- legal full name
- postal address
- phone number
- workplace name
- partner’s full name
- account passwords
- social media login credentials
- precise location
- screenshots containing third-party information

Screenshot upload is not part of the initial MVP.

AI payload must exclude:

- email address
- internal entitlement data
- payment identifiers
- provider customer identifiers
- unnecessary request/result tokens

Users must be warned not to enter their own or a third party's direct identifiers in consultation text.

---

## 7. Current-Source Legal and Evidence Review Gate

A future Payment implementation authorization must not be granted until review evidence includes:

- provider-specific authoritative category/application approval and review evidence
- compliance docs review
- final confirmation screen requirements are approved
- refund policy direction is approved
- operator disclosure approach is decided

Uncertain legal questions must remain unresolved and marked for current-source review. Material unresolved legal obligations remain blockers. Professional consultation is optional, not a Paid Launch or Production Payment prerequisite, and no professional review has been completed by Task 18A. Internal review does not guarantee legal compliance.

---

## 8. Email Consent

- Result-delivery and service-operation emails must be distinguished from marketing emails
- Marketing email consent must be optional and separate
- Marketing consent must not be required to purchase or receive a reading
- Consent evidence and unsubscribe requirements must be reviewed before marketing email is enabled

---

## 9. Payment Provider Position

- A provider must be selected only after truthful disclosure and provider-specific authoritative approval/review evidence
- Stripe Checkout is the Human + ChatGPT accepted strategic primary Web direction to investigate and prepare; this strategy acceptance does not establish Stripe feasibility/account/contact/approval/activation/formal selection or credit/debit-card/Apple Pay/Google Pay/PayPay eligibility
- The Customer-facing 鑑定ノート wording, AI use, actual analysis flow, methods not used, and non-guarantees must be disclosed without disguising the service
- Stripe's Japan-specific restricted-business risk requires actual account/business/site/category/Live Payment and method-specific authoritative evidence before formal selection
- PAY.JP is preserved as a paused fallback; its readiness evidence and application route remain recorded, but PAY.JP-specific operator/opening-notification/security blockers do not control current Stripe-track work
- PAY.JP reactivation requires current-source re-review and separate Human authority
- No provider SDK, checkout, webhook, or production payment flow is authorized by Task 18A

---

## 10. Source and Provider Review Rule

- Laws, official guidance, contract terms, and provider restrictions must be rechecked immediately before public launch
- External-provider retention and processing conditions must not be published as fixed facts before the exact service, endpoint, account settings, and current terms are verified
- Unknowns must remain `TBD` or be marked for current-source/Provider confirmation; optional professional consultation does not replace that evidence
