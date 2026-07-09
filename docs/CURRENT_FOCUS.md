# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Stage 4 implementation review

## Current Task

Review Stage 4 implementation: Safety Screening foundation.

Stage 4 should include only:

- Stage 3 acceptance record
- Deterministic safety screening types
- Safety rule definitions
- Safety classifier
- User-facing safety messages
- Request form local safety classification UI
- Rejected-level safety blocking in local confirmation
- No DB/API/OpenAI/payment/email integrations

## Source Materials

- `docs/phase1/STAGE3_ACCEPTANCE_REVIEW.md`
- `lib/safety/types.ts`
- `lib/safety/rules.ts`
- `lib/safety/classify.ts`
- `lib/safety/messages.ts`
- `components/request/RequestForm.tsx`
- `docs/phase1/ACCEPTANCE_CRITERIA.md`

## Do Not Do

Until Stage 4 is accepted:

- Do not start Stage 5
- Do not wire `/request` to DB persistence
- Do not insert `safety_checks`
- Do not create API routes
- Do not connect OpenAI API
- Do not connect payment API
- Do not connect email API
- Do not create result page
- Do not create feedback form
- Do not create login
- Do not create user accounts
- Do not create subscription
- Do not create coin/point system
- Do not insert fake sales/customer data

## Acceptance Criteria

- Safety classifier is deterministic
- Safety classifier has no DB/API/network dependency
- Reject-level flags classify as rejected
- DV/abuse/fear classifies as needs_review
- Contradictory safety selection blocks local confirmation
- High-risk free text is detected conservatively
- Request form shows safety classification
- Rejected-level issues do not show normal local confirmation
- Needs-review issues show warning
- Build/typecheck/lint pass
- Stage 4 can be reviewed by Human

## Next Task

After Human accepts Stage 4:

Stage 5 planning: Payment provider review and payment flow preparation.

Note: Stage 5 should be planning/review first, not real payment implementation, unless Human explicitly approves.
