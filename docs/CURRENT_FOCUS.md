# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Milestone 1 post-M1-P2 authorization gate — M1-P2 accepted by Human; M1-I7 implementation unauthorized

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
- Task M1-I6 implementation and automated validation completed under explicit authorization; Human did not accept M1-I6, and it is formally closed as superseded by M1-P2
- Task M1-P2 Experience & Visual Direction Revision accepted by Human; this acceptance did not authorize M1-I7

## Current Task

Task M1-P2, accepted by Human, documents the Human-directed revision of product experience and visual direction across:

- M1-I7 Brand Foundation;
- M1-I8 Reading Note Product Redesign;
- M1-I9 LP Redesign;
- M1-I10 Request Sheet Redesign;
- M1-I11 Legal Review Redesign; and
- M1-I12 Responsive, Accessibility and Final QA.

The controlling plan is `docs/phase1/M1_P2_EXPERIENCE_REVISION_PLAN.md`. Repository-wide inspection found no existing use of M1-P2 or M1-I7 through M1-I12, so the proposed IDs do not conflict.

M1-P2 is an accepted planning task. Its acceptance is not implementation authorization. Every proposed slice requires separate explicit Human authorization and separate Human acceptance.

## Current Human Decisions

- Task M1-P2 Experience & Visual Direction Revision is accepted.
- M1-I6 was not accepted by Human and is formally closed as superseded by M1-P2.
- Its implementation and evidence remain historical records. Its known defects are carried into M1-I7 through M1-I12 and final M1-I12 QA.
- This is not M1-I6 acceptance. No further M1-I6 Human Visual QA or disposition gate is required.
- Milestone 1 is not complete.
- The contemplated fine-grained M1-I6-R1 corrections are part of the carried defect inventory and must not be patched opportunistically.
- The reading note, LP, request sheet, legal review screens, and global brand UI are to be redesigned as one Milestone 1 experience.
- The Reading Note uses the approved 14-part structure; the save-oriented note is a distinct decision aid, not a shortened Web-note duplicate.
- The Request Sheet centers one large current-situation free-text field, relationship and what-to-know chips, 18+, Safety, one acknowledgement, privacy guidance, and post-Safety email timing; visible fields and step composition may change only within M1-I10.
- The LP follows the approved ten-part sequence with the Reading Note as primary value proof. Legal Review uses a user document, publication-readiness, and collapsed review-metadata hierarchy.
- Product specification, JPY 980 price, 18+ policy, Safety/classification meaning, fixed judgment, core scenario facts, and runtime boundaries remain fixed.
- Safety fixtures, classification meaning, fail-closed behavior, fixed judgment, and core scenario facts remain fixed. Presentation fixtures/schemas may change only inside the separately authorized relevant slice, require Human review, and must not activate runtime behavior.
- A fixed/sticky mobile CTA remains `rejected for Milestone 1`; non-fixed CTA behavior is controlling.
- Milestone 2 and all later milestones remain unauthorized.

## Runtime Boundary

- Current M1 data remains deterministic fixture/mock or browser-memory-only data.
- No form state is persisted or transmitted.
- No real AI, DB/Supabase runtime, payment, email, analytics, API, server action, active contact, external asset, file generation, clipboard, share, print, upload, OCR, or deployment may be added.
- Existing `lib/safety` classification and vocabulary, Safety fixtures, price, fixed judgment, core scenario facts, legal substance, unresolved Decision states, and publication-gate meaning remain unchanged.
- Legal/contact content remains review-only and contact remains inactive.

## Current Restrictions

- Until a later slice is explicitly authorized, do not change `app`, `components`, `lib`, `fixtures`, `supabase`, packages, UI, CSS, product copy, Safety, runtime integrations, or deployment.
- Browser use, the Codex in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browser control, and screenshot acquisition are prohibited.
- CodeX/agents must not claim visual evidence. Human performs screen review manually in ordinary external Microsoft Edge.
- M1-I6 has no remaining Visual QA or disposition gate. Its incomplete cross-width, keyboard/focus, and final contrast checks are carried into the relevant redesign slices and final M1-I12 QA.
- Do not mark M1-I6 or Milestone 1 accepted and do not start Milestone 2.

## Next Gate

M1-P2 is accepted. The next gate is a separate explicit Human authorization decision for M1-I7 Brand Foundation. M1-I7 is not yet authorized or implemented; M1-I8 through M1-I12 remain proposals, M1-I6 remains formally closed as superseded without acceptance, Milestone 1 remains incomplete, and Milestone 2 remains unauthorized.
