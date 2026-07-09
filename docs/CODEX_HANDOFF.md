# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent.

## Current Development Rule

Stage 2 has been accepted.

Stage 3 data foundation planning has been revised and is awaiting Human review before implementation.

Current allowed scope before this revision is accepted:

- Review Stage 3 data foundation planning documents
- Fix documentation defects only
- Validate build, typecheck, lint, and repository status

Current forbidden scope before Stage 3 implementation approval:

- Supabase implementation
- package.json changes
- database migrations
- API routes
- OpenAI integration
- payment integration
- email integration
- login
- user accounts
- result page
- feedback form
- subscription
- coin/point system

## Current Task Status

Stage 2 has been accepted.

Stage 3 data foundation planning has been revised before implementation.

Key decisions:

- Do not assume Stripe as the default payment provider
- Payment provider must be selected after category/rules review
- RevenueCat may be used later as an app purchase helper
- RevenueCat is not the business source of truth
- External providers are proof sources
- Own DB is the business source of truth

Planned Stage 3 data foundation tables:

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

Next step after Human approval:

Stage 3 only: Supabase Data Foundation.

CodeX must not start Stage 3 implementation until this revision is accepted.

Forbidden before approval:

- Supabase implementation
- package.json changes
- database migrations
- API routes
- OpenAI integration
- payment integration
- email integration
- login
- user accounts
- result page
- feedback form
- subscription
- coin/point system
