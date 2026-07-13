# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Task M1-I6 Responsive, Accessibility and Visual QA Hardening — implemented and automatically validated, awaiting Human Visual QA and final acceptance

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
- Tasks M1-I5 and M1-I5-R1 accepted by Human at commit `7a232b8feef446200cde5425cb3a98eb683b4391`
- Task M1-I6 explicitly authorized by Human

## Current Task

Task M1-I6 hardens the accepted Milestone 1 review experience without adding product scope. Implemented corrections are:

- balanced, strict Japanese heading wrapping and narrower mobile heading scales;
- original local crescent icon at `app/icon.svg`;
- centralized `/review/**` `noindex, nofollow` metadata;
- customer-facing `none` localization to `なし`;
- a less developer-oriented public sample with `sample ID` moved into collapsed review metadata;
- separate public/review comparison labels and customer-readable LP example links; and
- an accurate M1-I6 Human Visual QA gate on `/review`.

The Human decision for a fixed mobile CTA is `rejected for Milestone 1`. Existing non-fixed CTAs and destinations are preserved.

## Automated QA Status

- Typecheck, lint, and production build passed.
- The build generated 28 static/SSG pages, including `/icon.svg`.
- All 30 documented primary and fail-closed URLs returned HTTP 200 and exactly one `h1`.
- All 25 distinct rendered active internal link targets returned HTTP 200.
- All 19 audited `/review/**` URLs rendered the review banner and `noindex, nofollow`.
- Eight legal/contact routes retained their review boundary, one `aria-current="page"`, visible `現在`, and `noindex, nofollow`.
- All five explicit unknown/non-allowlisted routes passed negative-content fail-closed assertions.
- Human visual, complete keyboard, and final visual-contrast checks remain pending.

## Runtime Boundary

- Current M1 data remains deterministic fixture/mock or browser-memory-only data.
- No form state is persisted or transmitted.
- No DB, Supabase, AI, payment, email, analytics, API, server action, external asset, file generation, clipboard, share, print, upload, OCR, or deployment behavior was added.
- Existing `lib/safety` classification and vocabulary, fixtures, price, judgment, legal substance, Decision states, and publication-gate checkboxes remain unchanged.
- Legal/contact content remains review-only and contact remains inactive.

## Deferred Work

- Human final Visual QA at approximately 320px, 390px, 768px/tablet, and desktop.
- Complete keyboard-only walkthrough and final device/browser focus and contrast review.
- Operator/provider/commercial/privacy completion, active contact, legal acceptance, payment, AI, email, DB/API integration, deployment, and publication.
- Milestone 2 and all later milestones remain unauthorized.

## Next Gate

Human visually reviews representative M1 routes and either accepts Task M1-I6 or requests a bounded correction. Milestone 1 remains incomplete until Human acceptance. Acceptance of M1-I6 does not automatically authorize Milestone 2.
