# Stripe Lane B Legal Draft Finalization Candidate (B2)

## Candidate control

- Candidate status: `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`
- Candidate date: `2026-08-13`
- Exact baseline: `83eee8753ca8e85591fa9131078834f18e5f1231`
- Branch: `codex/stripe-lane-b-legal-draft-finalization-candidate`
- Human + ChatGPT review: `in_progress / correction_required`
- Human + ChatGPT acceptance: `pending`
- Publication approval: `false`
- Payment implementation authority: `false`
- Production Payment authority: `false`

This Candidate is an internal legal-draft and specification-alignment package. It is not legal advice, is not accepted, is not approved for publication, and creates no Stripe, Provider, Payment, deployment, domain, DNS, account, KYC, or Production authority.

## Accepted predecessor authority

The controlling predecessor remains `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete`. B2 synchronizes, and does not reopen, these accepted decisions:

- `LB-DEC-AGE-001`
- `LB-DEC-ENTITY-001`
- `LB-DEC-DISCLOSURE-001`
- `LB-DEC-SUPPORT-001`
- `LB-DEC-REFUND-001`
- `LB-DEC-FULFILLMENT-001`
- `LB-DEC-DOMAIN-001`

Payment Charter v1 remains `human_chatgpt_accepted_complete`; this Candidate makes no normative Charter change.

## Initial Candidate formulation manifest

The initial formulation below is preserved as historical lineage. Its baseline is `83eee8753ca8e85591fa9131078834f18e5f1231`, and its Candidate commit is `db8ba66f2a07c2de7207f4ab9296c6334f106fe2`.

### Update — exactly 40

1. `README.md`
2. `docs/CODEX_HANDOFF.md`
3. `docs/CURRENT_FOCUS.md`
4. `docs/DECISIONS.md`
5. `docs/PRODUCT_SPEC.md`
6. `docs/ROADMAP.md`
7. `docs/WBS.md`
8. `docs/legal/AI_DISCLOSURE_DRAFT.md`
9. `docs/legal/COMPLIANCE_CHECKLIST.md`
10. `docs/legal/CONTACT_PAGE_DRAFT.md`
11. `docs/legal/LEGAL_COMPLIANCE_FOUNDATION.md`
12. `docs/legal/LEGAL_DRAFT_CONSISTENCY_MATRIX.md`
13. `docs/legal/LEGAL_DRAFT_PUBLICATION_GATE.md`
14. `docs/legal/LEGAL_PAGES_REQUIREMENTS.md`
15. `docs/legal/LEGAL_SOURCE_REGISTER.md`
16. `docs/legal/OPERATOR_DECISION_GUIDE.md`
17. `docs/legal/OPERATOR_DECISION_REGISTER.md`
18. `docs/legal/OPERATOR_DECISION_WORKSHEET.md`
19. `docs/legal/PRIVACY_POLICY_DRAFT.md`
20. `docs/legal/REFUND_POLICY_DRAFT.md`
21. `docs/legal/TERMS_OF_SERVICE_DRAFT.md`
22. `docs/legal/TOKUSHOHO_DRAFT.md`
23. `docs/legal/UNSUPPORTED_CASES_PUBLIC_DRAFT.md`
24. `docs/legal/WHAT_IS_DECIDED_AND_WHAT_IS_NEXT.md`
25. `docs/payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md`
26. `docs/payment/PAYMENT_CHARTER.md`
27. `docs/payment/PAYMENT_CONFIRMATION_SCREEN_SPEC.md`
28. `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`
29. `docs/payment/PAYMENT_PROVIDER_DECISION_GATE.md`
30. `docs/payment/PROVIDER_INQUIRY_EVIDENCE_LOG.md`
31. `docs/payment/PROVIDER_INQUIRY_PLAN.md`
32. `docs/payment/PROVIDER_INQUIRY_SUBMISSION_CHECKLIST.md`
33. `docs/payment/STRIPE_ACCOUNT_SITE_PAYPAY_READINESS_CHECKLIST.md`
34. `docs/payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md`
35. `docs/payment/STRIPE_FEASIBILITY_EVIDENCE_PREPARATION.md`
36. `docs/payment/STRIPE_LANE_B_HUMAN_DECISION_PACKAGE.md`
37. `docs/phase1/IMPLEMENTATION_PLAN.md`
38. `docs/phase1/IMPLEMENTATION_WBS.md`
39. `docs/phase1/ORDER_FORM_SPEC.md`
40. `docs/phase1/PAYMENT_FLOW.md`

### New — exactly 1

41. `docs/legal/STRIPE_LANE_B_LEGAL_DRAFT_FINALIZATION_CANDIDATE.md`

Counts: `update = 40 / new = 1 / delete = 0 / rename = 0 / total = 41 / code_or_ui = 0`.

## Human + ChatGPT Review Correction R1

Human + ChatGPT review found that the initial 41-path formulation did not contain the complete current docs/spec authority scope. A repository-wide tracked-file authority audit identified 21 Category A current docs/spec paths requiring alignment and four current code/UI implementation paths requiring explicit B3 deferral.

R1 corrects current documentation, specification, legal-draft, planning, metrics, QA, architecture, and commercial Safety authority only. It does not modify code/UI, start B3, change Payment Charter principles, establish Provider facts, or grant publication, deployment, Payment implementation, or Production Payment authority.

### Review Correction R1 — Update exactly 22

1. `docs/ai/AI_PROMPT_GUARDRAILS.md`
2. `docs/ai/DATA_RETENTION_POLICY.md`
3. `docs/legal/LEGAL_DRAFT_PUBLICATION_GATE.md`
4. `docs/legal/OPERATOR_DECISION_GUIDE.md`
5. `docs/legal/OPERATOR_DECISION_REGISTER.md`
6. `docs/legal/OPERATOR_DECISION_WORKSHEET.md`
7. `docs/legal/TERMS_OF_SERVICE_DRAFT.md`
8. `docs/legal/UNSUPPORTED_CASES_PUBLIC_DRAFT.md`
9. `docs/legal/WHAT_IS_DECIDED_AND_WHAT_IS_NEXT.md`
10. `docs/phase1/AUTOMATION_ARCHITECTURE.md`
11. `docs/phase1/DATA_MODEL_DRAFT.md`
12. `docs/phase1/DELIVERY_WORKFLOW.md`
13. `docs/phase1/IMPLEMENTATION_PLAN.md`
14. `docs/phase1/IMPLEMENTATION_WBS.md`
15. `docs/phase1/INTEGRATION_STAGING_PLAN.md`
16. `docs/phase1/LP_STRUCTURE.md`
17. `docs/phase1/METRICS_TEMPLATE.md`
18. `docs/phase1/ORDER_FORM_SPEC.md`
19. `docs/phase1/QUALITY_CHECKLIST.md`
20. `docs/phase1/ROUTE_STRUCTURE.md`
21. `docs/safety/CRISIS_AND_UNSUPPORTED_CASES_POLICY.md`
22. `docs/legal/STRIPE_LANE_B_LEGAL_DRAFT_FINALIZATION_CANDIDATE.md`

Counts: `update = 22 / new = 0 / delete = 0 / rename = 0 / total = 22 / code_or_ui = 0`.

Eleven of the 21 authority-doc paths were outside the initial formulation manifest. The effective unique B2 docs/spec authority scope from the initial baseline through R1 is therefore the original 41 paths plus 11 newly added authority-doc paths, for `52` unique paths. This extends the effective B2 authority scope without rewriting or pretending the initial formulation did not occur.

R1 leaves Human + ChatGPT acceptance `pending`. A correction commit or push does not mark B2 accepted.

## Resolved Candidate facts

- Product: `月の返事 単発鑑定ノート`
- Product form: AI-assisted relationship-message analysis and decision-support digital report; `鑑定ノート` is a Customer-facing report-format and brand term
- Divination method: no tarot, astrology, birth-date, psychic, spiritual, supernatural, or external-investigation method
- Quantity: one consultation / one assessment note
- Price: JPY 980 tax-inclusive
- Purchase type: one-time; no subscription or automatic renewal
- Moon Reply service surcharge beyond Product price: none; Customer communication charges may remain Customer-borne
- Eligibility control: required boolean self-attestation labelled `私は18歳以上です`
- Eligibility data minimization: no age band, date of birth, or identity document solely for age eligibility
- Initial entity direction: applicable individual / sole-proprietor route; actual identity remains private Human input
- Contact model: one operating business mailbox plus one categorized contact form
- Delivery direction: protected result page plus notification to the applicable verified delivery/recovery email
- Provider-independent refund and fulfillment directions below are accepted policy directions, not implemented capabilities

## Age alignment state

`AGE-GATE-001 = accepted_direction_legal_spec_alignment_candidate_complete`

This means the accepted Human direction is aligned in this B2 Candidate's current drafts and specifications. It does not mean Candidate acceptance, Production server enforcement, Lane B readiness, Payment authorization, identity verification, or Provider approval.

The future real paid flow must require server-authoritative adult confirmation. The current RequestForm and prepayment gate already follow the accepted direction and are not modified by B2.

## Request-based disclosure boundary

For legally eligible fields, the preferred Candidate direction is request-based disclosure where current law and actual Stripe requirements permit. The Candidate wording is:

`請求があった場合には遅滞なく開示します`

The Customer must be able to request the applicable seller information before Payment and before the purchase decision. Completed purchase, Purchase ID, and login must not be required solely for that request. A functioning request/response mechanism and auditable logs must exist before publication, and actual legally required information must be supplied without delay. This direction does not mean every field may be omitted, that Stripe has approved the approach, or that the wording is finally compliant.

## Contact categories

The categorized form uses exactly these six functional categories:

1. result URL / non-delivery / delivery
2. ordinary cancellation / refund
3. Payment Integrity
4. Privacy / deletion / disclosure
5. seller-information disclosure request
6. other

No mailbox, form URL, SLA, or backend is invented by this Candidate.

## Refund and Payment Integrity boundary

- Before Payment: no charge; the Customer may stop.
- After successful Payment and objectively before `generation_started`: full JPY 980 ordinary refund if the future system can establish the ordering authoritatively.
- After generation starts and valid fulfillment succeeds: dissatisfaction alone is not ordinarily sufficient; applicable statutory rights and serious Product-defect remedies remain unaffected.
- Product or technical fulfillment failure: bounded same-Purchase recovery, no recharge, and full JPY 980 ordinary refund if secure and valid fulfillment remains impossible.
- Wrong Customer-entered email: verify ownership, correct, invalidate the prior result credential where necessary, securely reissue, evaluate any Privacy incident, and treat a secure-fulfillment failure as full-refund candidacy.
- Duplicate charge, wrong amount, wrong Customer, wrong Request, Safety bypass, or another unintended economic charge is Payment Integrity remediation, not an ordinary Product refund. Correct the actual unintended economic error with no JPY 980 remediation cap.

Provider refund objects, fees, processing duration, disputes, chargebacks, reversal semantics, and final-completion evidence remain unresolved. No refund operation or state machine is implemented by B2.

## Fulfillment boundary

The accepted future paid-flow skeleton requires an applicable verified delivery/recovery email before real Payment, server-authoritative Payment success before generation, a protected result page, verified-email notification, same-Purchase recovery, no recharge, and a full JPY 980 ordinary refund if secure and valid fulfillment remains impossible. Delayed output must not be delivered after a refund has been finalized.

No concrete delivery duration is stated. Publication requires production-like measurement, a conservative operational buffer, and Human approval.

## Mandatory remaining placeholders

### Human or private value

- `[[OPERATOR_LEGAL_NAME_TBD]]`
- `[[OPERATOR_TRADE_NAME_TBD]]`
- `[[RESPONSIBLE_PERSON_TBD]]`
- `[[OPERATOR_ADDRESS_DISCLOSURE_TBD]]`
- `[[OPERATOR_PHONE_DISCLOSURE_TBD]]`
- `[[SUPPORT_EMAIL_TBD]]`
- `[[CONTACT_FORM_URL_TBD]]`
- `[[SUPPORT_RESPONSE_TIME_TBD]]`
- `[[GOVERNING_COURT_TBD]]`

### Provider evidence or contract/data-flow evidence

- `[[PAYMENT_PROVIDER_TBD]]`
- `[[PAYMENT_METHODS_TBD]]`
- `[[PAYMENT_TIMING_TBD]]`
- `[[REFUND_PROCESSING_TIME_TBD]]`
- `[[AI_PROVIDER_TBD]]`
- `[[AI_ENDPOINT_TBD]]`
- `[[DATA_HOSTING_REGION_TBD]]`
- `[[EMAIL_PROVIDER_TBD]]`
- `[[ANALYTICS_PROVIDER_TBD]]`

### Runtime or implementation measurement

- `[[DELIVERY_TIMING_TBD]]`
- `[[DATA_RETENTION_PERIOD_TBD]]`

### Publication date

- `[[EFFECTIVE_DATE_TBD]]`
- `[[LAST_UPDATED_DATE_TBD]]`

### Review and evidence control markers

- `[[CURRENT_SOURCE_REVIEW_REQUIRED]]`
- `[[HUMAN_DECISION_TBD]]`
- `[[OPERATOR_DECISION_REQUIRED]]`
- `[[PROVIDER_CONFIRMATION_REQUIRED]]`

Actual domain and deployment values, request-based-disclosure operation, result-token lifecycle, email recovery, deletion procedure, Provider data-flow classification, and application-period restrictions also remain unresolved. A placeholder does not remain solely because B2 omitted an accepted decision.

## Official-source boundary

Official primary sources were checked on `2026-08-13` for bounded Candidate facts:

- Consumer Affairs Agency mail-order rules, advertising disclosures, request-based-disclosure Q&A, final-confirmation guidelines, and Consumer Contract Act materials
- Personal Information Protection Commission General Guidelines and foreign-third-party-provision guidelines
- Stripe Japan Commerce Disclosure guidance

The sources support only the recorded conditional facts. They do not establish Moon Reply legal compliance, Stripe approval, Provider eligibility, or final publication wording. Every material source and the actual Product/Provider operation must be rechecked before publication. Professional consultation is optional escalation, not an automatic mandatory gate.

## Publication and no-PII boundary

This Candidate remains **NOT APPROVED FOR PUBLICATION**. No publication checklist item is completed merely because a policy decision is accepted.

Actual Human legal name, home/business address, phone, date of birth, identity document, bank information, opening-notification status, Provider account data, credentials, secrets, and complete KYC evidence must not be stored in this Candidate. Git may contain field names, readiness states, redacted outcomes, and opaque evidence references only.

## Deferred B3 code/UI paths

B2 does not mutate these paths:

- `lib/legal/review-content.ts`
- `app/legal/page.tsx`
- `app/legal/terms/page.tsx`
- `app/legal/privacy/page.tsx`
- `app/legal/tokushoho/page.tsx`
- `app/legal/refund/page.tsx`
- `app/legal/ai-disclosure/page.tsx`
- `app/legal/unsupported-cases/page.tsx`
- `app/contact/page.tsx`
- `components/review/ReviewPurchaseConfirmation.tsx`
- `components/review/ReviewRequestConfirmation.tsx`
- `fixtures/review/purchase-confirmations.ts`
- `fixtures/review/requests.ts`

RequestForm age UI is already aligned and is not a B2 or B3 age-change target. Real Payment enforcement requires later and separate authorization.

### Formal B3-deferred current implementation drift

The following four paths are current implementation, are not historical, and are not fixture/regression/compatibility evidence. They are formally classified as `b3_deferred_current_implementation_alignment_required`:

1. `app/legal/refund/page.tsx`
2. `app/legal/unsupported-cases/page.tsx`
3. `app/legal/privacy/page.tsx`
4. `lib/legal/review-content.ts`

These paths remain stale relative to the corrected B2 docs/spec/legal-draft authority. Their temporary B2-to-B3 deferral does not block later acceptance of the B2 docs/spec/legal-draft package itself, but each path is a hard blocker for B3 completion, legal publication, review-ready/public-site acceptance, Paid Launch, and Production Payment.

Later B2 acceptance, if separately granted, means only `docs/spec/legal-draft authority accepted`. It does not mean current legal UI is aligned, the public site is review-ready, legal pages are publishable, or B3 is complete. B3 remains inactive during R1 and may align these four paths only after separate B2 acceptance and explicit implementation authority.

## Preserved lane and Provider states

- Lane A: `preparation_human_approved / external_action_not_authorized / not_submitted / null`, preserved inactive
- Lane B: `preparation_blocked / external_action_not_authorized / not_submitted / null`
- Lane C: `preparation_blocked / external_action_not_authorized / not_submitted / null`
- Stripe: feasibility not established; account/contact/submission absent; approval/activation absent; formal selection incomplete
- PayPay: desired, unverified, not enabled, not approved; lifecycle label not frozen
- PAY.JP: `paused_fallback_provider_direction`; Not submitted, Not approved, Not selected
- Payment implementation: `false`
- Production Payment: `false`
- Legal publication: `false`

## Human + ChatGPT review gate

The exact next work after the R1 correction commit is:

**Human + ChatGPT review of Stripe Lane B Legal Draft Finalization Candidate (B2) after Review Correction R1**

B2 acceptance remains pending. B3 may begin only after separate Human + ChatGPT acceptance of B2. This Candidate must not be marked accepted by its correction commit or push.
