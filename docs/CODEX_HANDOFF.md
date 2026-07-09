# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent.

## Current Development Rule

Stage 2 has been implemented and is awaiting Human review.

CodeX must not start Stage 3 until Stage 2 is accepted by Human.

Current allowed scope before Stage 2 acceptance:

- Review Stage 2 implementation
- Fix Stage 2 defects only
- Validate build, request form UI, LP CTA, and documentation status

Current forbidden scope before Stage 2 acceptance:

- Stage 3 implementation
- Database implementation
- Supabase integration
- OpenAI API integration
- Payment API integration
- Email API integration
- API route implementation
- Authentication or login
- User accounts
- Subscription system
- Coin/point system
- My page, history, result page, or feedback form

## Current Task Status

Stage 2 implementation has been completed and is awaiting Human review.

Implemented:

- `/request` page
- Self-hosted request form UI
- Client-side validation
- Safety screening question UI
- Consent checkbox UI
- Local-only confirmation state
- LP CTA updated to `/request`
- Stage 1 acceptance record

Not implemented:

- Database
- Supabase
- API routes
- OpenAI API
- Payment API
- Email API
- Login
- User accounts
- Result page
- Feedback form
- Subscription
- Coin/point system

Next step after Human approval:

Stage 3 only: Supabase Data Foundation.

CodeX must not start Stage 3 until Stage 2 is accepted.
