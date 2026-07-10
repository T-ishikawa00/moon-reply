# INPUT_VALIDATION_SPEC.md

## Status

Internal implementation-planning draft.

This is not legal advice and does not authorize application-code changes in Task 18A.

---

## 0. Goal

Reduce accidental submission of direct identifiers and third-party personal information.

This is a warning and minimization system, not proof that input contains no personal information.

---

## 1. Prohibited Input Guidance

Warn users not to enter:

- legal full names
- postal addresses
- phone numbers
- email addresses inside consultation text
- workplace/school names
- social media handles
- account IDs
- passwords
- precise location
- third-party private information
- screenshots

The initial MVP must not provide screenshot upload.

---

## 2. Candidate Detection

Future client/server validation should consider warning on:

- Japanese phone-number patterns
- email-address patterns
- postal-code patterns
- URL patterns
- `@handle` patterns
- password/login terms
- long address-like strings
- explicit workplace/school labels

Detection patterns must be tested for false positives and bypasses before production use.

---

## 3. Enforcement Direction

Stage A:

- show clear warning
- ask user to revise input

Stage B:

- block obvious password/account credential submission

Do not automatically delete or alter the user’s text without showing what was detected.

Do not claim that regex detection guarantees anonymization.

The same approved policy should run server-side before storage and provider transmission; client-only checks are insufficient.

---

## 4. AI Payload Rule

Before sending to an AI provider:

- remove email field
- remove payment/provider identifiers
- remove internal tokens
- send nickname only if necessary
- prefer role labels such as `user` and `partner`

Direct-identifier exclusion must be verified on the actual server-side payload after the endpoint is designed.
