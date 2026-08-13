# DATA_RETENTION_POLICY.md

## Status

Planning draft.

No retention period is approved yet.

This is not legal advice and is not approved for publication.

---

## 1. Data Categories

Retention decisions are required for:

- reading_requests
- safety_checks
- readings
- purchases
- credit_ledger
- entitlements
- provider_events
- ai_generation_logs
- email_deliveries
- feedback
- support requests

---

## 2. Decision Factors

- delivery and re-access needs
- refund and chargeback periods
- tax/accounting requirements
- incident investigation
- user deletion requests
- safety minimization
- AI quality evaluation
- provider obligations

Any conflict between minimization and mandatory retention must be documented with its source and approved owner.

---

## 3. Candidate Direction

Possible direction for later approval:

- reading result: user-access period TBD
- consultation free text: shorter retention than purchase records
- AI generation logs: metadata-focused; raw prompt retention minimized
- purchase/accounting records: retained as legally/operationally required
- semantic Safety, urgent, unsupported-assistance, clarification, and other fail-closed records: minimum retention necessary, with no period treated as approved by this draft
- provider raw payloads: redact or minimize unnecessary personal data

No candidate period may be presented as final until approved.

Do not copy an external provider's candidate or default retention period into a public policy without verifying the exact service, endpoint, account configuration, current terms, and applicable exceptions.

---

## 4. Deletion Workflow Requirements

Future implementation should support:

- deletion request intake
- identity/email ownership verification
- deletion scope calculation
- legal/financial retention exceptions
- result-token revocation
- provider deletion request where applicable
- audit record without retaining deleted consultation content

Deletion workflow evidence, exception handling, and operator responsibility must be approved before public launch.
