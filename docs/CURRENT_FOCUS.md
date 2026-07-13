# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Task M1-I5-R1 Legal Navigation Active-state Polish — implemented and automatically validated, awaiting final Human acceptance

## Completed Through

- Stage 1 project foundation and static LP
- Stage 2 request-form UI
- Stage 3 Supabase schema foundation
- Stage 4 deterministic safety foundation
- Legal/compliance foundation and legal-page drafts
- Provider-inquiry preparation
- 18+ policy and service-positioning alignment
- Task 18C-R3 Roadmap Reset accepted by Human
- Task M1-P1 accepted by Human at commit `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`
- Task M1-P1-R1 accepted by Human at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`
- Task M1-I1 accepted by Human at commit `dd031183dd347493fd5619f1b0d8bb355fc93560`
- Task M1-I2 accepted by Human at commit `de332b9f7911cb09ca2e3f7b26ef24c692dc2ae1`
- Task M1-I3 accepted by Human at commit `5cec9ea7ae0525a125ac8c3a8d90b48cefc4df25`
- Task M1-I4 accepted by Human at commit `620792e61b002190aff100fd145e986b5ae4c89b`
- Task M1-I5 explicitly authorized by Human
- Human approved the incomplete-field presentation rule used by M1-I5
- Human accepted the overall M1-I5 page structure and direction at commit `6d8001c5c6068a9493e68791f0468e5b5766f038`
- Human explicitly authorized only the M1-I5-R1 legal-navigation active-state correction

## Current Task

Task M1-I5-R1 changes only the shared `LegalNavigation` current-page treatment from a nearly black filled card to a warm pale-gold card with dark text, a stronger gold boundary and inset-left accent, and a compact dark `現在` badge. `aria-current="page"`, visible text, keyboard focus, touch size, and narrow-screen wrapping remain part of the current-state treatment.

The underlying M1-I5 review-only representations remain available at:

- `/legal`
- `/legal/terms`
- `/legal/privacy`
- `/legal/tokushoho`
- `/legal/refund`
- `/legal/ai-disclosure`
- `/legal/unsupported-cases`
- `/contact`

All eight routes share the required draft/publication/legal-advice boundary, legal navigation, related review links, responsive status cards, and structured unresolved-decision treatment. Fixed facts are rendered normally; unresolved operator, provider, commercial, privacy, date, and professional-review facts are withheld and replaced by approved Japanese status categories and review-only Decision IDs.

## Runtime Boundary

- Legal/contact content is deterministic static review content with no customer fixture.
- Every legal route and `/contact` has `noindex, nofollow` metadata.
- `/contact` has no form, input, textarea, submit control, server action, `mailto:`, support email, or external submission link.
- Current M1 form data is not persisted or transmitted; legal pages add no DB, Supabase, AI, payment, email, analytics, API, or external behavior.
- Existing `lib/safety` classification and vocabulary remain unchanged.
- Publication-gate checkboxes and OP decision states remain unchanged.

## Deferred Work

- Human final Visual QA must inspect the corrected navigation at approximately 320px, 390px, tablet, and desktop layouts.
- Mobile heading polish and favicon remain deferred to M1-I6.
- M1-I6 responsive/accessibility/Visual QA hardening remains unauthorized.
- Operator/provider/commercial/privacy completion, active contact, legal acceptance, payment, AI, email, DB/API integration, deployment, and publication remain outside M1-I5.

## Next Gate

Human visually confirms and accepts or requests another correction to Task M1-I5 after M1-I5-R1. M1-I6 does not begin without separate authorization.
