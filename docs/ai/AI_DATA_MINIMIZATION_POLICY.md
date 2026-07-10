# AI_DATA_MINIMIZATION_POLICY.md

## Status

Internal data-design draft.

This is not legal advice and is not approved for publication.

No AI-provider integration is authorized by Task 18A.

---

## 0. Principle

Send only the minimum content required to generate the reading.

---

## 1. Never Send to AI Provider

- email address
- payment identifiers
- provider customer IDs
- purchase IDs
- entitlement IDs
- credit ledger data
- request token
- result token
- service role keys
- IP address
- user agent
- internal moderation notes not needed for generation

These fields must not be placed in prompts, model input, tool arguments, metadata, filenames, or other provider-bound content unless a later, documented review explicitly changes the rule.

---

## 2. Candidate AI Input

- age range
- relationship type
- relationship status
- message context after identifier warnings
- intended message
- recent context
- main anxiety
- desired outcome
- main question
- send-tonight state
- server-generated safety classification
- non-identifying nickname only if necessary

Candidate status does not authorize collection or transmission. Each field must still pass necessity review before implementation.

---

## 3. Separation

Contact/delivery data and AI-generation data must be separated in server logic.

Email is used for:

- result delivery
- support
- purchase linkage where necessary

Email is not needed for:

- judgment generation
- full reading generation

Payment, entitlement, delivery, and AI-generation records must be linked internally without copying their direct identifiers into the provider payload.

---

## 4. Provider Claims

Do not publish fixed provider retention, training, or deletion statements until:

- current official provider documentation is checked
- exact API endpoint is selected
- account data-control settings are confirmed
- professional privacy review is completed if needed

Provider terms, endpoint behavior, and account controls must be rechecked before launch and after material provider changes.
