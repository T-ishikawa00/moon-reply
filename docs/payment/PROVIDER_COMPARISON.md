# PROVIDER_COMPARISON.md

## Status

Internal comparison-template draft.

This is not legal advice and does not record an approved or selected provider.

All unverified fields remain `TBD`.

PAY.JP、KOMOJU、STORESはTask 18C時点で、すべてNot sent、Not approved、Not selected、Not scoredである。

---

| Provider | Category status | Written inquiry status | One-shot digital content | Credit card | PayPay | Webhook | Test environment | Individual proprietor | Required public pages | Refund requirements | Chargeback handling | Settlement cycle | Fees | Freeze/termination risk | Implementation fit | Evidence | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PAY.JP | Inquiry required / not approved | Not sent / no written response | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | None recorded | Not selected |
| KOMOJU | Inquiry required / not approved | Not sent / no written response | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | None recorded | Not selected |
| STORES | Inquiry required / not approved | Not sent / no written response | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | None recorded | Not selected |
| Stripe | High category risk / not selected | No written category review | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | None recorded | Not selected |
| Square | Official restriction recheck required / not selected | No written category review | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | None recorded | Not selected |

---

## Task 18C Evidence and Score Status

| Provider | Inquiry draft | Evidence log ID | Approval | Selection | Score |
| --- | --- | --- | --- | --- | --- |
| PAY.JP | `PAYJP_INQUIRY_DRAFT.md` | PAYJP-001 / Not sent | Not approved | Not selected | Not scored / Evidence required |
| KOMOJU | `KOMOJU_INQUIRY_DRAFT.md` | KOMOJU-001 / Not sent | Not approved | Not selected | Not scored / Evidence required |
| STORES | `STORES_INQUIRY_DRAFT.md` | STORES-001 / Not sent | Not approved | Not selected | Not scored / Evidence required |

Supporting records:

- `PROVIDER_INQUIRY_EVIDENCE_LOG.md`
- `PROVIDER_DECISION_SCORECARD.md`
- `PAYMENT_PROVIDER_DECISION_GATE.md`

---

## Evidence Rule

- Do not invent fees, approval status, PayPay support, settlement details, or feature availability
- Record the official source or written provider response for every verified cell
- Record the checked date and applicable product/account conditions
- Treat conditional approval as conditional, not approved
- Human approval is required after written category evidence and before implementation
- Unknown is not a positive score
- No written category acceptance means the provider cannot be selected
- The highest score does not authorize implementation
