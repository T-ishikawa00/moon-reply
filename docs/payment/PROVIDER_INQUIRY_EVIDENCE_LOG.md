# PROVIDER_INQUIRY_EVIDENCE_LOG.md

> **INTERNAL EVIDENCE REGISTER**
>
> **NO INQUIRY HAS BEEN SENT**
>
> **NO APPROVAL OR SELECTION IS RECORDED**

## Status rules

- `Not sent` means the inquiry has not been transmitted through any channel.
- A sent date, channel, reference ID or response date must never be guessed.
- Category approval may be recorded only when a written response clearly addresses the accurately described 月の返事 service.
- Conditional responses must preserve every stated condition.
- The exact sent text must be preserved by immutable file, commit hash, PDF, screenshot or equivalent evidence location.

| Inquiry ID | Provider | Status | Sent date | Channel | Exact draft version | Reference ID | Response date | Category decision | Conditions | Evidence location | Next action | Human decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PAYJP-001 | PAY.JP | Not sent | — | — | `PAYJP_INQUIRY_DRAFT.md` / Task 18C initial draft | — | — | No response / not approved | Unknown | None recorded | Human review and explicit send approval | Pending; sending not approved |
| KOMOJU-001 | KOMOJU | Not sent | — | — | `KOMOJU_INQUIRY_DRAFT.md` / Task 18C initial draft | — | — | No response / not approved | Unknown | None recorded | Human review and explicit send approval | Pending; sending not approved |
| STORES-001 | STORES | Not sent | — | — | `STORES_INQUIRY_DRAFT.md` / Task 18C initial draft | — | — | No response / not approved | Unknown | None recorded | Human review and explicit send approval | Pending; sending not approved |

## Evidence handling procedure

1. Before sending, Human approves the provider, destination channel, exact subject, exact body and real operator information.
2. Save the exact sent text and identify its commit hash or immutable copy.
3. After sending, record the actual timestamp, channel and provider-issued reference only from evidence.
4. Preserve the provider's complete response, including disclaimers, attachments, links and conditions.
5. Store evidence in an approved non-public location and record only its path or reference here; do not commit secrets or unnecessary personal information.
6. Extract provider facts into `PROVIDER_COMPARISON.md` with source and checked date.
7. Score only after sufficient evidence exists, then submit the selection to Human under `PAYMENT_PROVIDER_DECISION_GATE.md`.
