# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent.

## Current Development Rule

Stage 3 has been implemented and is awaiting Human review.

CodeX must not start Stage 4 until Stage 3 is accepted by Human.

Current allowed scope before Stage 3 acceptance:

- Review Stage 3 Supabase Data Foundation implementation
- Fix Stage 3 defects only
- Validate build, typecheck, lint, migration presence, and repository status

Current forbidden scope before Stage 3 acceptance:

- Stage 4 implementation
- Request form DB persistence
- API routes
- OpenAI integration
- payment integration
- email integration
- result page
- feedback form
- login
- user accounts
- subscription
- coin/point system
- fake sales/customer data

## Current Task Status

Stage 3 implementation has been completed and is awaiting Human review.

Implemented:

- Supabase package
- `.env.example`
- Supabase helper files
- Stage 3 data foundation migration
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
- RLS enabled without public policies

Not implemented:

- Request form persistence
- API routes
- OpenAI API
- Payment API
- Email API
- Result page
- Feedback form
- Login
- User accounts
- Subscription
- Coin/point system
- Fake sales/customer data

Next step after Human approval:

Stage 4 only: Safety Screening foundation.

CodeX must not start Stage 4 until Stage 3 is accepted.
