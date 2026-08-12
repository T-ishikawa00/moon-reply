# LEGAL_SOURCE_REGISTER.md

## Status

Internal research register.

Planning draft.

This is not legal advice.

Every source must be rechecked before public launch.

No professional legal review has been completed; professional consultation is optional and is not a Paid Launch prerequisite. No payment-provider approval or trademark clearance is recorded by this register.

Stripe Feasibility Evidence Preparation Candidate status is `stripe_feasibility_evidence_preparation_candidate_ready_pending_human_chatgpt_review` as of `2026-08-12`; Human + ChatGPT review remains pending. The source refresh below creates no Stripe contact, submission, account, approval, activation, PayPay enablement, formal Provider selection, or legal-publication authority.

---

## Japanese Consumer / Commerce Sources

### 特定商取引法ガイド

Authority:

- 消費者庁 / 特定商取引法ガイド

URL:

- https://www.no-trouble.caa.go.jp/what/mailorder/

Use for:

- 通信販売の表示事項
- 最終確認画面
- 返品・解除条件
- 電子メール広告
- 事業者情報

Research note:

- Source URL checked on 2026-07-10
- Recheck the current statute, regulations, and official guidance before launch

### 消費者契約法

Authority:

- 消費者庁

URL:

- https://www.caa.go.jp/policies/policy/consumer_system/consumer_contract_act/

Use for:

- 不当勧誘
- 不安を利用した購入誘導
- 免責条項
- 消費者契約の取消し・無効

Research note:

- Source URL checked on 2026-07-10
- Final interpretation and contract wording require review against current official primary sources, actual Product behavior, and Customer-facing wording; optional professional consultation may be used as escalation

### 個人情報保護法・ガイドライン

Authority:

- 個人情報保護委員会

URL:

- https://www.ppc.go.jp/personalinfo/legal/

Use for:

- 個人情報
- 委託先
- 国外移転
- 安全管理
- 削除・開示対応

Research note:

- Source URL checked on 2026-07-10
- Recheck the applicable law, guidelines, Q&A, and provider processing facts before launch

---

## AI Provider Sources

### OpenAI enterprise privacy

URL:

- https://openai.com/enterprise-privacy/

Research note:

- Source URL checked on 2026-07-10
- This source alone does not establish the exact retention behavior of a future 月の返事 API configuration

### OpenAI business terms

URL:

- https://openai.com/policies/business-terms/

Research note:

- Source URL checked on 2026-07-10
- On that date, the URL redirected to the OpenAI Services Agreement
- Recheck the controlling agreement for the exact product and account before launch

### OpenAI API data controls

URL:

- https://platform.openai.com/docs/models/default-usage-policies-by-endpoint

Use for:

- Endpoint-specific storage behavior
- Abuse-monitoring and application-state distinctions
- Account/project data-control settings
- Retention verification after the exact endpoint is selected

Rules:

- Do not state a fixed retention period until current API documentation and account settings are verified
- Do not state that data is never retained
- Do not send email addresses or unnecessary direct identifiers to the AI provider
- Verify the exact product/API endpoint before launch

---

## Payment Sources

### Stripe restricted businesses

URL:

- https://stripe.com/jp/legal/restricted-businesses
- https://support.stripe.com/questions/restricted-business-list-and-considerations?locale=ja-JP
- https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs?locale=ja-JP

Current official evidence checked on `2026-08-12`:

- Stripe's Japan jurisdiction-specific prohibited-business list includes the literal category `サイキックサービス / 占い師`.
- Separately, Stripe's general restricted/prohibited-business guidance says some listed businesses may be supportable only after additional detailed review and explicit approval, while some categories are never eligible.
- Stripe independently reviews each account and relevant information during activation; that review determines whether the business is supported.
- Stripe prohibits false, manipulated, inaccurate, or misleading information about identity, entity, or business nature.
- These bounded source facts do not establish Moon Reply feasibility, account approval, activation, category acceptance, or Live Payment eligibility.
- The listing is a serious feasibility risk, but the listing alone establishes neither automatic approval nor automatic impossibility.
- Moon Reply's truthful non-divination positioning is not Stripe approval. The accurate real Product must be reviewed, wording or positioning cannot guarantee approval, and this register does not claim that Moon Reply qualifies for an exception.
- Only actual exception/approval evidence from Stripe is authoritative. Actual account/business/site/activation review or other authoritative Stripe evidence is required before formal selection.
- Eligibility may later be modified or revoked under Provider terms.

Project boundary:

- Stripe Checkout is the Human + ChatGPT accepted strategic primary Web direction to investigate and prepare; strategy acceptance is not feasibility, approval, activation, or formal selection.
- No Stripe account, contact, approval, activation, or formal selection is recorded.
- 鑑定ノート, AI use, actual service behavior, and non-guarantees must not be hidden or disguised.
- `STRIPE-FEAS-001` preliminary evidence, `STRIPE-ACCOUNT-001` account/Live evidence, and `STRIPE-PAYPAY-001` PayPay evidence are separate lanes. No lane has external evidence or an outcome.

### Stripe PayPay

URL:

- https://docs.stripe.com/payments/paypay/accept-a-payment?locale=ja-JP
- https://support.stripe.com/questions/accepting-paypay-payments-for-japan-based-stripe-accounts?locale=ja-JP

Current official evidence checked on `2026-08-12`:

- Stripe documentation describes PayPay as a Japan payment method and the support guidance says a Japan Stripe account may accept it only after PayPay onboarding review approval.
- The support guidance requires Japanese Product, image, and price presentation, a checkout path or explanatory document, completed Tokushoho information, and matching applicable account/business facts.
- When selecting goods type, the support guidance lists examples for `デジタルコンテンツ` and instructs other products or services to use `一般`.
- This register does not select Moon Reply's PayPay goods type. `goods_type_selection = unresolved_pending_actual_onboarding_evidence_and_human_review`; final confirmation requires the actual onboarding UI and current Product facts.
- The support guidance describes external partner review as approximately two weeks. This is a planning estimate, not an SLA or release deadline, and incomplete information or further review may extend it.
- Prior project records that labeled PayPay `Public Preview` are historical source snapshots. Current official surfaces are not sufficiently consistent for this project to freeze either Preview or GA as the controlling lifecycle label.
- `lifecycle_label = not_frozen_recheck_required`. Recheck before Stripe formal Provider selection, before PayPay implementation authorization, immediately before PayPay onboarding/enablement, and before Paid Launch.
- PayPay remains desired, unverified, not enabled, and not approved. Stripe account support does not establish PayPay support.
- Exact rates, taxes, settlement, and account-specific pricing are not frozen by this source register.

### Stripe Japan onboarding, business-address verification, and Commerce Disclosure

URL:

- https://support.stripe.com/questions/business-website-for-account-activation-faq?locale=ja-JP
- https://support.stripe.com/questions/getting-started-with-stripe-a-guide-for-users-in-japan?locale=ja-JP
- https://support.stripe.com/questions/verifying-your-business-address?locale=ja-JP
- https://support.stripe.com/questions/how-to-create-and-display-a-commerce-disclosure-page?locale=ja-JP

Current official evidence checked on `2026-08-12`:

- Stripe's activation guidance requires an applicable business website, social profile, or application URL and sufficient Product/business information for review. Moon Reply has no stable public/review URL recorded by this Candidate.
- Stripe's Japan onboarding guidance requires business and representative/KYC information, including applicable address, identity-document, website, and payout-bank facts.
- Stripe may request additional business-address verification documents when the submitted address cannot be verified automatically.
- Separately, Stripe's Commerce Disclosure guidance says a sole proprietor may, subject to the page requirements, use an equivalent request-based disclosure statement such as `請求があった場合には速やかに開示いたします` instead of immediately displaying formal name, address, and phone information publicly.
- Stripe's Commerce Disclosure guidance requires a completed disclosure page and notes final-confirmation requirements, but it does not guarantee legal compliance. Moon Reply's Tokushoho review display remains incomplete and not publication-ready.

Project boundary:

- `Stripe private KYC/business-address disclosure != Customer-facing public Tokushoho disclosure`.
- The public-disclosure option does not remove truthful private facts required by Stripe or any applicable legal obligation.
- Human accepts truthful private home/business-address disclosure to Stripe KYC, banks, tax/public authorities, and other legitimately required non-public counterparties. Routine public display of the Human's home address to general Customers is not desired as the default; where current law and actual Provider requirements allow, a legally valid request-based or otherwise non-routine-public disclosure method is preferred.
- Exact Tokushoho disclosure implementation remains unresolved and current-source/evidence-gated. Stripe does not guarantee that request-based disclosure is always sufficient and does not remove operator, address, phone, or publication obligations.
- Virtual-office use is not currently required by Human preference. GMO remains on hold, not rejected; virtual-office use may be reconsidered if actual legal, Provider, postal, privacy, or operational evidence makes it useful or necessary.
- No unverified virtual-office address may be used as the Stripe KYC/business address.
- Operator, address, and phone handling requires later current-source review, actual Stripe evidence, applicable legal/publication review, and explicit Human review.
- Git may store private-KYC field names, readiness/status, checked date, redacted outcome, and an opaque non-public evidence reference only; actual Human PII, identity evidence, bank values, Stripe credentials, and complete sensitive application evidence remain outside Git.

### RevenueCat Stripe external-purchase tracking

URL:

- https://www.revenuecat.com/docs/web/integrations/stripe/track-external-purchases

Current official evidence checked on `2026-08-12`:

- RevenueCat documentation supports importing Stripe Checkout one-time purchases using a Checkout Session ID and App User ID.
- This does not establish Moon Reply integration readiness, configuration, identity migration, or PayPay-specific compatibility.
- RevenueCat is not required for initial Web fulfillment. Future synchronization is desired and unresolved.
- A future App User ID should use an opaque Moon Reply internal identifier, not raw email.

### PAY.JP

URL:

- https://help.pay.jp/ja/articles/5000820-申請前に事前審査をしてもらうことはできますか
- https://help.pay.jp/ja/articles/3438184-利用開始までどのような流れになりますか
- https://help.pay.jp/ja/articles/3438268-サイト未オープンの場合でも申請可能ですか
- https://help.pay.jp/ja/articles/3438177-個人-個人事業主-でも利用できますか-必要な書類はありますか
- https://help.pay.jp/ja/articles/8610808-セキュリティ対策実施状況のご申告-の回答方法を教えてください

Status:

- Paused fallback Provider direction
- Production-use application evidence required
- Application Not submitted
- Not approved / not selected

Current official evidence checked on `2026-08-12`:

- PAY.JP does not provide pre-application screening. Sending service materials to support in advance does not produce an approval/rejection decision.
- Formal review uses the information submitted through the production-use application after account registration.
- Account registration and email verification precede console access; test API keys are available after email verification. This records only the official flow and does not authorize account creation, key access, API use, or implementation.
- An unopened site may be used for application, but the service, Terms, Privacy, and Tokushoho URLs must be final/confirmed. Demo, sample, test-only, or unsettled URLs are not sufficient; required content must be present by Payment launch.
- Corporate and individual applications are permitted. An individual/sole-proprietor route requires `開業届` or a currently accepted equivalent described in the official guidance.
- New production applications require completion of the security-measures declaration. Applicable credit-card security measures are required, including EMV 3-D Secure before service launch.

Project evidence boundary:

- Moon Reply has not created a PAY.JP account or submitted an application under this task.
- No actual operator document, final URL, security declaration, implementation-compliance evidence, application outcome, or approval is recorded.
- The preserved fallback-readiness plan is `../payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md`; it does not control current next work.

### KOMOJU

Status:

- Inquiry candidate
- Not approved yet

### STORES / Square / Other Providers

Status:

- Secondary inquiry candidates
- Not approved yet

---

## Trademark

### J-PlatPat

URL:

- https://www.j-platpat.inpit.go.jp/

Required action:

- Search `月の返事` before public launch
- Record search date, classes, results, and screenshots/references
- Do not claim trademark clearance until actually performed

Current status:

- No trademark search is recorded by Task 18A
- No trademark clearance is claimed

---

## Optional Professional Consultation

Professional consultation may be considered as an optional escalation for:

- Privacy policy foreign-transfer / processor wording
- Terms limitation-of-liability wording
- Refund policy wording
- 特商法 operator disclosure method
- Final payment-provider category classification

It is not a mandatory Charter acceptance, publication, Paid Launch, or Production Payment condition. Current official primary sources, actual Product/Provider behavior, final public wording, applicable Human/operator decisions, and preserved evidence remain required. Material unresolved legal obligations remain blockers, and internal review does not guarantee legal compliance.

Do not add unofficial blogs as controlling sources.

They may be listed only as secondary notes if clearly labeled, but primary official sources should control.
