# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Stage 3 implementation review

## Current Task

Review Stage 3 implementation: Supabase Data Foundation.

Stage 3 should include only:

- Supabase package
- `.env.example`
- Supabase helper files
- Database migration
- Data foundation tables
- RLS enabled without public policies
- No backend product flow integrations

## Source Materials

- `README.md`
- `.env.example`
- `lib/supabase/env.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/types.ts`
- `supabase/migrations/0001_stage3_data_foundation.sql`
- `docs/phase1/STAGE3_DATA_FOUNDATION_SCOPE.md`
- `docs/phase1/DATA_MODEL_DRAFT.md`
- `docs/phase1/ACCEPTANCE_CRITERIA.md`

## Do Not Do

Until Stage 3 is accepted:

- Do not start Stage 4
- Do not wire `/request` to DB persistence
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

- Supabase package is added
- `.env.example` exists without real secrets
- Supabase helpers exist and do not break build without env vars
- Migration defines Stage 3 data foundation tables
- RLS is enabled without public policies
- No fake data is inserted
- No OpenAI/payment/email/API route integration exists
- Build/typecheck/lint pass
- Stage 3 can be reviewed by Human

## Next Task

After Human accepts Stage 3:

Stage 4 implementation: Safety Screening foundation.
