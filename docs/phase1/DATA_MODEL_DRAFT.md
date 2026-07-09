# DATA_MODEL_DRAFT.md

## 0. Purpose

This document defines the draft data model for the Phase 1 automated public MVP.

This is not an implementation.

---

## 1. Tables

Draft tables:

- diagnosis_requests
- safety_checks
- payments
- diagnosis_results
- email_deliveries
- feedback

---

## 2. diagnosis_requests

Purpose:

Stores the user's diagnosis request.

Fields:

- id
- request_token
- email
- nickname
- age_range
- relationship_type
- relationship_status
- last_partner_message
- last_user_message
- intended_message
- reply_wait_duration
- recent_context
- main_anxiety
- desired_outcome
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
- safety_rejected
- payment_pending
- paid
- generating
- completed
- failed
- refunded

---

## 3. safety_checks

Purpose:

Stores safety screening result.

Fields:

- id
- diagnosis_request_id
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

Result examples:

- normal_allowed
- needs_review
- rejected

---

## 4. payments

Purpose:

Stores payment status.

Fields:

- id
- diagnosis_request_id
- provider
- provider_payment_id
- amount_jpy
- currency
- status
- paid_at
- refunded_at
- created_at
- updated_at

Status examples:

- pending
- paid
- failed
- refunded

---

## 5. diagnosis_results

Purpose:

Stores generated judgment and diagnosis.

Fields:

- id
- diagnosis_request_id
- result_token
- judgment_label
- full_diagnosis_markdown
- saveable_card_copy
- send_message_suggestion
- three_day_policy
- emotional_tags
- generation_model
- generation_status
- created_at
- updated_at

Generation status examples:

- pending
- generated
- failed
- blocked

---

## 6. email_deliveries

Purpose:

Tracks result email sending.

Fields:

- id
- diagnosis_result_id
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

## 7. feedback

Purpose:

Stores user feedback after reading result.

Fields:

- id
- diagnosis_result_id
- satisfaction_score
- judgment_agreement_score
- save_intent
- repeat_intent
- price_value
- chatgpt_enough
- free_comment
- created_at

---

## 8. Privacy Notes

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
- unguessable tokens
