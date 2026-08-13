# DATA_MODEL_DRAFT.md

## 0. Purpose

This document defines the draft data model for the Phase 1 automated public MVP.

The data model must support:

- no-login one-shot diagnosis
- safety screening
- payment verification
- purchase history
- credit tracking
- entitlement state
- AI generation logs
- result delivery
- feedback
- future Web / iOS / Android payment provider sync

This is not an implementation.

---

## 1. Core Tables

Core tables:

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

Future optional table:

- profiles

---

## 2. reading_requests

Purpose:

Stores the user's diagnosis request.

Former name:

- diagnosis_requests

Fields:

- id
- request_token
- email
- nickname
- adult_confirmed
- relationship_type
- relationship_status
- last_partner_message
- last_user_message
- intended_message
- reply_wait_duration
- recent_context
- main_anxiety
- desired_outcome
- main_question
- send_tonight
- consent_ai
- consent_not_medical
- consent_no_guarantee
- consent_privacy
- status
- created_at
- updated_at

Status examples:

- draft
- submitted
- payment_pending
- paid
- generating
- completed
- failed
- refunded

`adult_confirmed` is the current eligibility-direction boolean corresponding to the required self-attestation `私は18歳以上です`. No age band, date of birth, or identity document is required solely for age eligibility. The exact production audit/status storage shape remains a later implementation decision, but future server-owned Purchase authority must require accepted adult confirmation.

The archived Stage 3 schema and generated compatibility types may retain `age_range` and `safety_rejected` as historical fields. They are not requirements for this current data model and cannot establish Purchase authority. This documentation correction does not modify an actual schema or migration.

---

## 3. safety_checks

Purpose:

Stores safety screening result.

Fields:

- id
- reading_request_id
- self_harm_flag
- harm_others_flag
- dv_abuse_flag
- stalking_flag
- threat_flag
- minor_flag
- surveillance_flag
- doxxing_flag
- result
- reason
- created_at

Current authority rules:

- `safety_checks.result` records semantic Safety evidence and reasons; it is not Purchase authority.
- Clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error conditions remain fail closed for real Payment.
- Waiting, not sending now, a temporary pause, or boundary-respecting support is not automatically disqualifying when separate assistance eligibility remains valid.
- A separate current server-owned purchase-eligibility record must establish `purchaseGateSatisfied=true`, bind the evaluated input/evidence, and be invalidated by material input mutation before real Payment can be reached.
- Browser, client, or localStorage state cannot write or assert Purchase authority.

Historical `normal_allowed`, `needs_review`, and `rejected` values may remain only in explicitly historical schema, fixture, or regression compatibility evidence. Exact production table and field names remain undecided by this draft.

---

## 4. readings

Purpose:

Stores generated judgment and diagnosis result.

Former name:

- diagnosis_results

Fields:

- id
- reading_request_id
- result_token
- judgment_label
- full_reading_markdown
- saveable_card_copy
- send_message_suggestion
- three_day_policy
- emotional_tags
- generation_status
- created_at
- updated_at

Generation status examples:

- pending
- generated
- failed
- blocked

---

## 5. purchases

Purpose:

Stores purchase records from any provider.

Providers may include:

- PAY.JP
- KOMOJU
- STORES
- Square
- Stripe
- Apple
- Google
- RevenueCat

Fields:

- id
- reading_request_id
- provider
- provider_purchase_id
- provider_customer_id
- amount_jpy
- currency
- product_type
- product_code
- status
- purchased_at
- refunded_at
- revoked_at
- created_at
- updated_at

Status examples:

- pending
- paid
- failed
- refunded
- revoked

---

## 6. credit_ledger

Purpose:

Stores every credit increase/decrease event.

Fields:

- id
- entitlement_id
- reading_request_id
- purchase_id
- reason
- delta
- balance_after
- idempotency_key
- created_at

Reason examples:

- purchase_grant
- reading_consumed
- generation_failed_compensation
- refund_reversal
- admin_adjustment

Rules:

- Do not change credits without ledger entry
- Use idempotency_key to avoid duplicate credit operations

---

## 7. entitlements

Purpose:

Stores current usable credit state.

Fields:

- id
- email
- available_credits
- active_plan
- status
- last_credit_ledger_id
- created_at
- updated_at

Status examples:

- active
- suspended
- revoked

Notes:

- In no-login MVP, email can be used as the temporary entitlement key
- Future account system may migrate this to user_id/profile_id

---

## 8. provider_events

Purpose:

Stores webhook/provider event history.

Fields:

- id
- provider
- provider_event_id
- event_type
- related_purchase_id
- related_reading_request_id
- processing_status
- payload_json
- error_message
- received_at
- processed_at
- created_at

Processing status examples:

- received
- processed
- duplicate
- failed

Rules:

- provider_event_id must be used for duplicate event protection
- Do not process the same provider event twice

---

## 9. ai_generation_logs

Purpose:

Stores AI generation metadata and cost tracking.

Fields:

- id
- reading_request_id
- reading_id
- generation_type
- model
- prompt_version
- input_tokens
- output_tokens
- estimated_cost_jpy
- status
- error_message
- created_at

Generation type examples:

- safety_assist
- judgment
- full_reading

Status examples:

- started
- completed
- failed
- blocked

---

## 10. email_deliveries

Purpose:

Tracks result email sending.

Fields:

- id
- reading_id
- recipient_email
- subject
- status
- provider_message_id
- sent_at
- error_message
- created_at

Status examples:

- pending
- sent
- failed

---

## 11. feedback

Purpose:

Stores user feedback after reading result.

Fields:

- id
- reading_id
- satisfaction_score
- judgment_agreement_score
- save_intent
- repeat_intent
- price_value
- chatgpt_enough
- free_comment
- created_at

---

## 12. profiles

Status:

- Future optional table

Purpose:

Used later if login/user accounts are introduced.

Not required for current no-login MVP.

---

## 13. Privacy Notes

Do not store:

- legal full name unless absolutely necessary
- phone number
- address
- workplace
- partner's full name
- raw LINE screenshots
- unnecessary personal identifiers

Use:

- nickname
- free text context
- email
- unguessable request/result tokens
