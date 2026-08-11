# PROVIDER_DECISION_SCORECARD.md

> **INTERNAL DECISION SUPPORT**
>
> **NOT SCORED**
>
> **NO PROVIDER IS APPROVED OR SELECTED**

## 0. Hard gate

No authoritative category/application acceptance evidence = provider cannot be selected.

Acceptance evidence must address the honestly described 月の返事 service, including Customer-facing 鑑定ノート wording and AI use, through the provider's applicable approval/review route. For Stripe, this requires actual account/business/site/category/Live Payment and method-specific evidence, not only restricted-business or feature documentation. For PAY.JP if reactivated, this means production-use application/review evidence and applicable PAY.JP/card-company conditions. A generic marketing page, feature page, blank application form, optional support clarification, verbal statement, or silence is not category approval.

Conditional acceptance is not unconditional acceptance. Every condition must be recorded in `PROVIDER_INQUIRY_EVIDENCE_LOG.md` and reflected in the comparison before scoring.

---

## 1. Weighted factors

| Factor | Weight | Evidence required before scoring |
| --- | ---: | --- |
| Authoritative category/application acceptance | 30 | Provider-specific approval/review evidence that matches the actual service description and records all conditions |
| Account freeze/termination risk | 15 | Contract/restriction terms and written clarification of reserve, freeze, termination and unsettled funds |
| Webhook and idempotency support | 15 | Current official documentation for events, signatures, retries and duplicate handling |
| Test/sandbox environment | 10 | Current official documentation or account evidence for a usable test process |
| Payment-method fit | 10 | Written or official account/category evidence for each intended payment method |
| Fees and settlement | 10 | Applicable fee schedule, settlement cycle and withholding/adjustment conditions |
| Individual/sole-proprietor eligibility | 5 | Applicable application requirements or written provider confirmation |
| Documentation/support quality | 5 | Current documentation coverage and evidenced support response quality |
| **Total** | **100** | — |

## 2. Scoring rules

- Scoring starts only after evidence exists.
- Unknown is not a positive score and must not be converted into an optimistic assumption.
- Each score must cite the evidence location and checked date.
- Authoritative category/application acceptance is both a weighted factor and a mandatory gate.
- A conditional acceptance must list every condition and score only the service that complies with those conditions.
- Human makes the final provider decision.
- The highest score does not automatically authorize selection or implementation.
- Selection does not authorize sandbox implementation; that requires a separate task.

## 3. Initial provider status

| Provider | Evidence-route status | Category/application status | Score | Evidence | Selection status |
| --- | --- | --- | --- | --- | --- |
| Stripe | STRIPE-FEAS-001 and STRIPE-ACCOUNT-001 Not started | Feasibility not established; account/approval/activation absent | Not scored | Actual truthful account/business/site/category/Live Payment and cards/Apple Pay/Google Pay/PayPay evidence required | Candidate pending review / not selected |
| PAY.JP | Production-use application Not submitted | Not approved | Not scored | PAYJP-APP-001; authoritative application/review evidence required | Not selected |
| KOMOJU | Not sent | Not approved | Not scored | Evidence required | Not selected |
| STORES | Not sent | Not approved | Not scored | Evidence required | Not selected |

## 4. Evidence-based scoring worksheet

Use one row per provider and factor only after evidence exists.

The Human desired Stripe direction and accepted PayPay conversion/cost tradeoff are not scores. Neither Stripe nor PAY.JP is scored by this Candidate task.

| Provider | Factor | Raw assessment | Weight | Weighted score | Evidence location | Checked date | Conditions/notes |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| [[PROVIDER_TBD]] | [[FACTOR_TBD]] | [[NOT_SCORED]] | [[WEIGHT_TBD]] | [[NOT_SCORED]] | [[EVIDENCE_REQUIRED]] | [[DATE_TBD]] | [[CONDITIONS_TBD]] |
