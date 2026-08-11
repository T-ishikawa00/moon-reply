# Stripe Feasibility and Web Payment Strategy Pivot Candidate

## 1. Status and authority

- Candidate formulation date: 2026-08-12
- Candidate status: stripe_feasibility_and_web_payment_strategy_pivot_candidate_ready_pending_human_chatgpt_review
- Human working direction recorded: yes
- Human + ChatGPT integrated Candidate acceptance: pending
- Stripe feasibility: not established
- Stripe approval: absent
- Stripe formal selection: incomplete
- PayPay eligibility: not established
- Payment implementation authorization: false
- Production Payment authorization: false
- Stripe/PAY.JP/RevenueCat account or Provider/API operations: 0
- DB/Supabase/Runtime/LUNA operations: 0
- PR/main merge/release: unauthorized

The next action is Human + ChatGPT integrated review of Stripe Feasibility and Web Payment Strategy Pivot Candidate.

The following states are intentionally separate:

Human desired strategic direction
!= this Candidate
!= Candidate acceptance
!= Stripe feasibility evidence
!= Stripe account approval or activation
!= formal Provider selection
!= Payment implementation authorization
!= Production Payment authorization.

Payment Charter v1 remains human_chatgpt_accepted_complete and authoritative for Provider-independent Payment Integrity. This Candidate does not reopen or change its normative invariants.

## 2. Truthful Product positioning

Canonical official definition:

AIを活用した恋愛メッセージ分析・判断支援デジタルレポート

Customer-facing Product name:

恋のメッセージ鑑定ノート

Moon Reply:

- analyzes Customer-provided relationship context and message text;
- organizes known facts, unknowns, possible interpretations, rationale, action, reassessment, and message drafts;
- uses AI;
- does not use tarot;
- does not use astrology;
- does not use birth date divination;
- does not use numerology;
- does not use psychic or spiritual methods;
- does not conduct supernatural prediction;
- does not claim another person's true feelings;
- does not guarantee replies, reconciliation, future events, or outcomes;
- is not a matching, introduction, or intermediary service;
- is not a human fortune-teller service;
- is not a medical, counseling, legal, or investigation service.

Moon, night, letter, paper, navy, ivory, and pale-gold atmosphere may remain as visual and editorial expression. These are not analytical methods or supernatural claims.

Provider-facing and legal wording must disclose the Customer-facing 鑑定ノート terminology and must never disguise the actual service.

## 3. Existing self-classification defect

The 2026-08-12 audit found an integrity defect in the baseline:

- docs/SAFETY_POLICY.md self-defined Moon Reply as fortune-telling.
- docs/legal/LEGAL_COMPLIANCE_FOUNDATION.md self-defined Moon Reply as fortune-telling.

That wording conflicted with the accepted Task 18C-R2 positioning criterion that no current controlling document self-defines the service as AI fortune-telling. This Candidate task corrects those two current documents. Historical Phase 0 and immutable Task review records are not rewritten.

## 4. Stripe current risk and evidence boundary

Bounded official-source facts checked on 2026-08-12:

- Stripe's Japan-specific prohibited-business list includes Psychic services and fortune tellers.
- Stripe's prohibited/restricted-business FAQ says Stripe may be able to support some listed businesses only with explicit prior approval, while some categories are never eligible.
- Stripe independently reviews each account and relevant information during activation; that review determines whether the business is supported.
- Stripe prohibits false, manipulated, inaccurate, or misleading information about identity, entity, or business nature.
- Moon Reply has no Stripe feasibility, account, activation, category, or Live Payment evidence.
- The listing is a serious feasibility risk. It permits neither an inference of automatic approval nor a conclusion of automatic impossibility solely from the listing.
- Moon Reply must present the accurate real Product for review. Alignment with a truthful non-divination Product definition is not Stripe approval, and wording or positioning never guarantees approval.
- This Candidate does not claim that Moon Reply qualifies for an exception. Only actual exception/approval evidence from Stripe is authoritative.
- Actual account, business, site, and activation review, or other authoritative Stripe evidence, is required before formal selection.
- Eligibility may later be modified or revoked under Provider terms.

Official sources:

- https://stripe.com/jp/legal/restricted-businesses
- https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs?locale=ja-JP

Wording changes do not guarantee approval. 鑑定ノート must not be hidden or disguised.

## 5. Desired initial Web payment methods

The desired initial methods are:

- credit/debit cards;
- Apple Pay;
- Google Pay;
- PayPay.

PayPay is a deliberate Product decision. The Human working direction accepts its materially higher variable transaction cost as a conversion and revenue tradeoff. Exact rates, taxes, settlement, and account-specific pricing are not frozen by this Candidate. No monthly fixed-cost justification is assumed without current account evidence. Actual availability remains account-, category-, method-, and evidence-gated.

Stripe's official documentation checked on 2026-08-12 labels PayPay `Public Preview`. It describes PayPay as Japan/Japanese-yen, Customer-initiated and Customer-authenticated, single-use/non-recurring, and supported by Checkout in payment mode; Checkout subscription mode is not supported. Stripe-wide restrictions apply, and PayPay may impose additional category restrictions at its discretion.

Official source: https://docs.stripe.com/payments/paypay

`Public Preview` does not remove PayPay from the desired initial methods. PayPay remains desired, unverified, not enabled, and not approved. No PayPay fee rate is frozen.

PayPay's Preview/GA status, supported integration surface, method restrictions, and Moon Reply eligibility must be rechecked:

1. before Stripe formal Provider selection;
2. before PayPay implementation authorization; and
3. before Paid Launch.

## 6. Method availability and Launch decision

No desired method may be silently treated as available. No unavailable method may be silently removed from the planned launch set.

If cards, Apple Pay, Google Pay, or PayPay are unavailable under actual Stripe evidence, the project must return to explicit Human launch review. In particular:

PayPay unavailable
!= automatic approval to launch without PayPay.

A later Human decision may be to:

- launch with the evidenced available methods;
- delay launch;
- modify the Product or payment strategy;
- reactivate the PAY.JP fallback.

This Candidate does not make that future decision.

## 7. Desired Checkout Product identity

Candidate customer-visible Checkout label:

月の返事｜恋のメッセージ鑑定ノート

Candidate adjacent description:

AIによる恋愛メッセージ分析・判断支援デジタルレポート 1件／税込980円／単発購入

Exact Stripe Product, Price, and Checkout field values, length limits, and rendering remain Provider-evidence- and implementation-gated. The Customer must be able to recognize Moon Reply, one assessment note, JPY 980, a one-time purchase, and no automatic renewal.

No Stripe Product or Price is created by this Candidate.

## 8. Statement descriptor and charge recognition

- Customer card statements and payment communications must use a recognizable Moon Reply-related descriptor.
- The descriptor must minimize unrecognized-charge disputes.
- Exact Latin, Kana, and Kanji values remain unresolved until actual Stripe account requirements and display tests are available.
- This Candidate does not invent or assert an accepted statement descriptor.

## 9. Initial no-login and Stripe Customer boundary

The initial Web MVP remains no-login. This Candidate does not require Stripe Customer creation for every purchase, Moon Reply account creation, password login, Google login, Apple login, or My Page.

Preferred conceptual boundary:

- verified delivery/recovery email;
- valid trusted session where applicable;
- opaque Moon Reply internal Customer identifier;
- Request ID;
- Purchase Intent ID;
- Provider transaction identity;
- Moon Reply Purchase ID.

An email address must not become the long-term Provider-independent Customer ID. Stripe Customer creation remains a future evidence and design decision. If a Stripe Customer is later used, it is not Product authority and must not replace Moon Reply Purchase or Assessment Grant authority.

No schema or implementation is authorized.

## 10. RevenueCat future role

RevenueCat is not required for the initial Web Payment path.

Desired initial path:

Stripe Checkout
-> Moon Reply authoritative verification
-> Moon Reply Purchase
-> Assessment Grant
-> Logical Assessment
-> Report

Future desired cross-platform direction:

Stripe Checkout / Apple IAP / Google Play Billing
-> RevenueCat normalization where evidenced and applicable
-> Moon Reply Purchase
-> Assessment Grant

RevenueCat documentation checked on 2026-08-12 supports importing Stripe Checkout one-time purchases using a Checkout Session ID and App User ID.

Official source: https://www.revenuecat.com/docs/web/integrations/stripe/track-external-purchases

Candidate identity direction:

- a future RevenueCat App User ID should be an opaque Moon Reply internal identifier;
- raw email must not be used as the App User ID;
- exact identity and account migration remain unresolved;
- PayPay-specific RevenueCat synchronization compatibility remains unresolved;
- PayPay-to-RevenueCat synchronization is not required for initial Web fulfillment because the Moon Reply Purchase Ledger remains Product authority.

No RevenueCat configuration is created by this Candidate.

## 11. Provider-independent architecture

Conceptual Provider scope must be capable of representing:

- stripe;
- payjp;
- app_store;
- google_play.

RevenueCat is a verification, normalization, and management layer where used. It is neither the underlying economic rail nor Moon Reply Product authority. This is a conceptual map, not a literal database enum or schema.

Payment Charter invariants remain unchanged:

- Safety before Payment;
- purchaseGateSatisfied=true;
- server-authoritative Payment success;
- one intended purchase and at most one legitimate economic charge;
- unknown != failed;
- idempotent callbacks;
- one Purchase, one Grant, and one Logical Assessment;
- no recharge after successful Payment;
- reconciliation;
- refund and Payment Integrity remediation separation;
- kill switch;
- secret ownership;
- privacy;
- separate Production authorization.

## 12. PAY.JP fallback

PAY.JP is preserved as paused_fallback_provider_direction.

PAY.JP readiness evidence, application requirements, evidence lanes, and historical PAY.JP decisions remain preserved. docs/payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md is reclassified from active readiness to paused fallback readiness. Its operator, address, opening-notification, and security blockers are not current Stripe-track blockers.

Possible future PAY.JP reactivation triggers include:

- Stripe determines that the accurately described Product is prohibited or unsupported;
- Stripe Live Payment activation cannot be obtained;
- actual Stripe payment-method availability materially fails the Product requirement and Human chooses fallback;
- material Stripe operational or financial risk causes a Human strategy change;
- Human explicitly reactivates PAY.JP.

Reactivation requires current-source re-review and separate authority. GMO virtual-office contracting and PAY.JP-driven opening-notification preparation remain on hold, not permanently rejected.

## 13. Fixed-cost rationale

Product Owner rationale:

- individual developer;
- limited business capital;
- desire to minimize pre-revenue fixed costs;
- preference for variable transaction costs over unnecessary monthly fixed costs;
- desire to preserve conversion through PayPay;
- desire to avoid premature virtual-office and PAY.JP-specific preparation while Stripe feasibility remains open.

This does not mean zero total cost. Legal, Privacy, Security, domain, email, infrastructure, Provider fees, and operational costs remain.

### 13.1 Stripe private KYC/business address and public Tokushoho disclosure

Bounded official-source facts checked on 2026-08-12:

- Stripe's Japan onboarding guidance requires business address information and representative information, including the representative's address.
- Stripe may request additional business-address verification documents when it cannot verify the submitted address automatically.
- Separately, Stripe's Commerce Disclosure guidance says a sole proprietor may, subject to the page requirements, use an equivalent request-based disclosure statement such as `請求があった場合には速やかに開示いたします` instead of immediately displaying formal name, address, and phone information publicly.

Official sources:

- https://support.stripe.com/questions/getting-started-with-stripe-a-guide-for-users-in-japan
- https://support.stripe.com/questions/verifying-your-business-address?locale=ja-JP
- https://support.stripe.com/questions/how-to-create-and-display-a-commerce-disclosure-page?locale=ja-JP

The controlling boundary is:

`Stripe private KYC/business-address disclosure != Customer-facing public Tokushoho disclosure`

The public-disclosure option does not remove Stripe's requirement for truthful private facts or any applicable legal obligation. The exact Human address-disclosure choice remains unresolved. Virtual-office need, suitability, and acceptance remain unresolved; GMO is on hold, not rejected. This Candidate does not conclude that a virtual office is unnecessary, and no unverified virtual-office address may be used as the Stripe KYC/business address. Operator, address, and phone handling require later current-source review, actual Stripe evidence, applicable legal/publication review, and explicit Human review.

## 14. Downstream public-copy alignment

A separately authorized implementation and content task is required before Stripe account or site review. Audited downstream surfaces include:

- app/page.tsx;
- app/layout.tsx;
- app/request/page.tsx;
- app/sample-report/page.tsx;
- components/layout/SiteHeader.tsx;
- components/request/RequestForm.tsx;
- components/review/ReviewPurchaseConfirmation.tsx;
- components/report/PublicSampleReport.tsx;
- components/report/ReviewWebReport.tsx;
- components/runtime/CustomerAssessmentNote.tsx;
- fixtures/review/purchase-confirmations.ts;
- lib/legal/review-content.ts;
- relevant email copy sources;
- relevant metadata and SEO copy sources.

Required direction:

- preserve 月の返事;
- preserve 恋のメッセージ鑑定ノート;
- preserve the moon, night, and letter visual atmosphere;
- add sufficiently proximate AI analysis and decision-support explanation where currently weak;
- preserve non-guarantee;
- preserve the truth that no supernatural method is used;
- never present a fake Stripe approval badge or logo.

These code and UI paths are intentionally unchanged in this documentation-only task.

## 15. Stripe feasibility evidence required before formal selection

Future evidence must cover:

- actual Stripe account and business-profile review;
- the accurate service description submitted;
- actual site and public wording reviewed;
- Stripe category and Live Payment outcome;
- cards eligibility;
- Apple Pay eligibility;
- Google Pay eligibility;
- PayPay eligibility;
- method-specific conditions;
- Checkout, Product, and Price behavior;
- test/live separation;
- webhook authentication, retries, and ordering;
- PaymentIntent, Checkout Session, Charge, and refund relationships;
- refund, dispute, and chargeback behavior;
- statement descriptor behavior;
- Customer, Purchase, and Request linkage;
- fee, settlement, reserve, and hold conditions;
- RevenueCat import and identity behavior where later used.

No generic marketing page and no silence is Provider approval. This task does not create the evidence.

## 16. Unresolved decisions

The following remain unresolved:

- exact Stripe evidence-acquisition method;
- whether Stripe support or sales is contacted before account activation;
- actual Stripe business category;
- actual Stripe private KYC/business-address requirements and accepted evidence;
- exact Customer-facing Tokushoho operator/address/phone disclosure method;
- virtual-office need, suitability, Provider acceptance, and Human decision;
- exact enabled payment-method set;
- exact Launch decision if PayPay is unavailable;
- exact Checkout field limits and rendering;
- exact statement descriptors;
- Stripe Customer creation policy;
- internal Customer identity implementation;
- Stripe webhook and refund mechanics;
- exact fees and settlement;
- RevenueCat App User ID implementation;
- PayPay-to-RevenueCat synchronization compatibility;
- account migration for future iOS and Android;
- PAY.JP fallback reactivation execution;
- downstream public-copy implementation scope.

No resolution is invented here.

## 17. Authorization matrix

| Item | State |
| --- | --- |
| Payment Charter v1 | Human + ChatGPT accepted complete; human_chatgpt_accepted_complete |
| Stripe strategic primary direction | Human working direction; Candidate pending review |
| Stripe feasibility | Not established |
| Stripe account | Absent |
| Stripe contact | None |
| Stripe approval/activation | Absent |
| Stripe formal selection | Incomplete |
| Cards eligibility | Unverified |
| Apple Pay eligibility | Unverified |
| Google Pay eligibility | Unverified |
| PayPay eligibility | Unverified |
| PayPay lifecycle / enablement | Desired; Public Preview; not enabled; not approved |
| Stripe private KYC vs public Tokushoho | Separate evidence domains; exact disclosure and address decisions unresolved |
| Virtual office / GMO | Unresolved; GMO on hold, not rejected |
| PAY.JP | Paused fallback; not approved; not selected |
| RevenueCat initial Web use | Not required; unconfigured |
| RevenueCat future synchronization | Desired; unresolved |
| Payment implementation | Unauthorized; authorization false |
| DB/migration | Unauthorized |
| Runtime/LUNA | Unauthorized |
| Production Payment | Unauthorized |
| PR/main merge/release | Unauthorized |
