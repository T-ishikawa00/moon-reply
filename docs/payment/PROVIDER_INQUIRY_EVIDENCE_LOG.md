# PROVIDER_INQUIRY_EVIDENCE_LOG.md

> **INTERNAL EVIDENCE REGISTER**
>
> **NO INQUIRY HAS BEEN SENT**
>
> **NO PAY.JP PRODUCTION-USE APPLICATION HAS BEEN SUBMITTED**
>
> **NO APPROVAL OR SELECTION IS RECORDED**

## Status rules

- `Not sent` means the inquiry has not been transmitted through any channel.
- `Not submitted` means no production-use application has been submitted.
- A submission/sent date, channel, reference ID, response date, outcome, or condition must never be guessed.
- Approval may be recorded only from authoritative provider/application review evidence that addresses the accurately described 月の返事 service.
- Conditional responses must preserve every stated condition.
- Exact submitted/sent content must be preserved by immutable file, commit hash, PDF, screenshot or equivalent evidence location.

## PAY.JP production-application evidence lane

| Application ID | Provider | Status | Submitted date | Exact application facts | Reference ID | Review requests/responses | Outcome | Conditions | Evidence location | Next action | Human decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PAYJP-APP-001 | PAY.JP | Not submitted | — | None submitted | — | None | Not approved | Unknown | None recorded | Complete readiness planning and Human readiness review | Submission not authorized; selection pending |

No PAY.JP account, date, reference ID, outcome, or condition exists in this repository. Future sensitive evidence must remain in an approved non-public location.

## Historical/optional inquiry evidence lane

| Inquiry ID | Provider | Status | Sent date | Channel | Exact draft version | Reference ID | Response date | Category decision | Conditions | Evidence location | Next action | Human decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PAYJP-001 | PAY.JP | Not sent / historical | — | — | `PAYJP_INQUIRY_DRAFT.md` / Task 18C initial draft | — | — | No response / not approved | Unknown | None recorded | Optional support clarification only if a specific need arises | Not required before application; sending not authorized |
| KOMOJU-001 | KOMOJU | Not sent | — | — | `KOMOJU_INQUIRY_DRAFT.md` / Task 18C initial draft | — | — | No response / not approved | Unknown | None recorded | Human review and explicit send approval | Pending; sending not approved |
| STORES-001 | STORES | Not sent | — | — | `STORES_INQUIRY_DRAFT.md` / Task 18C initial draft | — | — | No response / not approved | Unknown | None recorded | Human review and explicit send approval | Pending; sending not approved |

## Evidence handling procedure

1. Before any external submission/contact, Human approves the provider, applicable route, exact content and real operator information.
2. Save the exact submitted/sent content and identify its commit hash or immutable copy.
3. After submission/contact, record the actual timestamp, channel and provider-issued reference only from evidence.
4. Preserve the provider's complete application/review record or response, including disclaimers, attachments, links and conditions.
5. Store evidence in an approved non-public location and record only its path or reference here; do not commit secrets or unnecessary personal information.
6. Extract provider facts into `PROVIDER_COMPARISON.md` with source and checked date.
7. Score only after sufficient authoritative evidence exists, then submit the selection to Human under `PAYMENT_PROVIDER_DECISION_GATE.md`.
