# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Stage 2 implementation review

## Current Task

Review Stage 2 implementation: Self-hosted Request Form UI.

Stage 2 should include only:

- `/request` page
- Request form UI
- Client-side validation
- Safety screening question UI
- Consent checkbox UI
- Local-only confirmation state
- No backend/API integrations

## Source Materials

- `README.md`
- `app/page.tsx`
- `app/request/page.tsx`
- `components/request/RequestForm.tsx`
- `docs/phase1/ORDER_FORM_SPEC.md`
- `docs/phase1/ACCEPTANCE_CRITERIA.md`
- `docs/phase1/STAGE1_ACCEPTANCE_REVIEW.md`

## Do Not Do

Until Stage 2 is accepted:

- Do not start Stage 3
- Do not create database
- Do not add Supabase
- Do not create API routes
- Do not connect OpenAI API
- Do not connect payment API
- Do not connect email API
- Do not create login
- Do not create user accounts
- Do not create result page
- Do not create feedback form
- Do not create subscription
- Do not create coin/point system

## Acceptance Criteria

- `/request` renders
- Form contains all required fields
- Safety screening fields exist
- Consent checkboxes exist
- Required fields validate
- Submit is local-only
- No data is persisted
- No payment/AI generation happens
- Build/typecheck/lint pass
- Stage 2 can be reviewed by Human

## Next Task

After Human accepts Stage 2:

Stage 3 implementation: Supabase Data Foundation.
