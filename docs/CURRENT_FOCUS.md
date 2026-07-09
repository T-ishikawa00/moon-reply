# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Stage 3 data foundation planning

## Current Task

Review Stage 3 data foundation revision before Supabase implementation.

Stage 2 has been accepted.

Stage 3 should create the Supabase-backed data foundation only.

The DB design must support:

- no-login one-shot diagnosis
- safety screening
- purchase history
- credit ledger
- entitlement state
- provider event deduplication
- AI generation logs
- email delivery logs
- feedback

## Source Materials

- `docs/phase1/STAGE2_ACCEPTANCE_REVIEW.md`
- `docs/phase1/STAGE3_DATA_FOUNDATION_SCOPE.md`
- `docs/phase1/DATA_MODEL_DRAFT.md`
- `docs/phase1/PAYMENT_PROVIDER_RISK_NOTE.md`
- `docs/phase1/PROVIDER_SYNC_AND_SOURCE_OF_TRUTH.md`
- `docs/phase1/IMPLEMENTATION_PLAN.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/ACCEPTANCE_CRITERIA.md`

## Do Not Do

Until Stage 3 implementation is explicitly approved:

- Do not implement Supabase yet
- Do not create database migrations yet
- Do not change package.json
- Do not add Supabase packages
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

- Stage 2 acceptance is recorded
- Stage 3 data foundation scope is clear
- Data model supports purchases/credits/entitlements/provider events/AI logs
- Stripe is not assumed as default provider
- RevenueCat is treated as helper, not source of truth
- Next task can start Stage 3 Supabase implementation
- No implementation files are added

## Next Task

After Human accepts this revision:

Stage 3 implementation: Supabase Data Foundation.
