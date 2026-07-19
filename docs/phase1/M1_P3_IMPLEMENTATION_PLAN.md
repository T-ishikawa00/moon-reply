# M1-P3 Reading Note Visual Excellence Implementation Plan

## 1. Status

- Status: **Draft completed; Human and ChatGPT review pending**
- Authority: documentation and design planning only
- This document does **not** authorize application implementation, Figma production, package changes, runtime changes, Browser use, screenshots, pull requests, or merges.
- `M1-I8-R1`, `M1-I9-R1`, and `M1-I12` remain unauthorized until each named Human gate is passed separately.
- Milestone 1 remains incomplete. Milestone 2 remains unauthorized.

## 2. Objective

Convert the approved M1-P3 visual-excellence specification into four independently reviewable checkpoints. Each checkpoint must preserve the locked wording, judgment outcomes, safety behavior, price, age requirement, product facts, and current route behavior recorded in `M1_P3_CONTENT_LOCK_MATRIX.md`.

The implementation sequence is intentionally narrow:

1. remove technical ambiguity;
2. implement the core reading-note visual system;
3. align public and review previews;
4. complete responsive, accessibility, and regression QA.

No checkpoint may be treated as implicit authorization for the next checkpoint.

## 3. Governing documents

- `docs/phase1/M1_P3_READING_NOTE_VISUAL_EXCELLENCE_SPEC.md`
- `docs/phase1/M1_P3_CONTENT_LOCK_MATRIX.md`
- `docs/phase1/M1_P3_FIGMA_HANDOFF_SPEC.md`
- `docs/phase1/TASK_M1_P3_REVIEW.md`
- `docs/phase1/TASK_M1_I7_I11_INTEGRATED_REVIEW.md`
- `docs/phase1/TASK_M1_I7_REVIEW.md`

If implementation convenience conflicts with a content lock or an authorization boundary, the lock or boundary wins.

## 4. Global implementation rules

### 4.1 Locked behavior

- Do not change fixtures, judgment labels, safety states, route semantics, product facts, price, age requirement, AI disclosure, or unsupported-case policy.
- Do not change `lib/safety/**`.
- Do not introduce persistence, API routes, OpenAI calls, payment processing, email delivery, analytics, or new integrations.
- Do not add or change dependencies, lockfiles, build tooling, external fonts, or externally hosted design assets.
- Do not create a universal report renderer. Shared extraction is limited to stable visual primitives with clear consumers.
- Do not rename the product in application copy during these checkpoints. Residual `保存用鑑定書` cleanup belongs only to a separately authorized naming pass.

### 4.2 Verification ownership

- Codex: static inspection, typecheck, lint, production build, diff audit, content-lock verification, responsive-code inspection, and accessibility-code inspection.
- Human: visual review in an external Microsoft Edge session, including desktop and narrow viewport evidence.
- Codex must not use Browser tooling or screenshots for these checkpoints unless a later authorization explicitly changes that rule.

### 4.3 Stop conditions

Stop the checkpoint without broadening scope if any of the following occurs:

- a content-lock hash changes;
- a fixture or `lib/safety/**` change appears;
- a package or lockfile change appears;
- a required visual result would need new product behavior;
- the checkpoint cannot pass typecheck, lint, build, or `git diff --check` within its authorized files;
- Human review identifies a content or safety issue rather than a visual defect.

## 5. Checkpoint A — M1-I8-R1 Technical Preparation

### 5.1 Purpose

Create an explicit, mechanically checkable foundation for M1-I8-R1 before visual implementation begins. This checkpoint resolves known CSS ambiguity and introduces only the smallest reusable artifact primitives needed by more than one approved consumer.

### 5.2 Allowed files

- `app/globals.css`
- new narrowly scoped files under `components/artifact/**`
- existing `components/brand/**` files only when a neutral adapter is required
- existing report components only for mechanical primitive adoption with no visible redesign
- a new content-lock verification script under `scripts/**`
- `docs/phase1/TASK_M1_I8_R1_REVIEW.md`
- current-status documentation required to record the checkpoint result

The final authorization must replace this candidate list with an exact file manifest before mutation.

### 5.3 Prohibited files and changes

- `lib/fixtures/**`
- `lib/safety/**`
- `package.json` and all lockfiles
- route behavior, request flow, purchase flow, API routes, persistence, integrations, and runtime configuration
- product copy, judgment copy, safety copy, price, age requirement, or disclosure wording
- external fonts and externally hosted assets
- full report redesign or public-sample redesign

### 5.4 Dependencies

- Human and ChatGPT acceptance of the five M1-P3 draft documents
- explicit Human authorization of Checkpoint A with an exact mutation manifest
- clean branch based on the accepted documentation commit
- current content-lock matrix verified against source

### 5.5 Implementation sequence

1. Add a deterministic content-lock verifier for the recorded scalar values and source slices.
2. Resolve undefined CSS token references `--violet-600`, `--ink-400`, and `--moon-700` by mapping them to approved existing palette values; do not invent a parallel palette.
3. Give paper-grain pseudo-elements an explicit positioned and isolated containing block.
4. Reorder responsive rules broad-to-narrow without changing intended rendering.
5. Inventory obsolete LP/report selectors and remove only selectors proven to have no current consumer.
6. Establish an artifact-style boundary for paper surface, rule, metadata, stamp, and section-label primitives.
7. Add only small presentation adapters required to connect existing explicit compositions to those primitives; do not introduce a schema renderer.
8. Prepare the formal-name alignment map from residual `保存用鑑定書` copy to `保存用判断カード`, but defer the actual customer-facing copy change to the authorized visual checkpoint.
9. Document the deliberate dynamic allowance for `--swatch-color` and provide a defensive fallback.
10. Run automated checks and prepare the checkpoint review artifact, including a no-visual-change or explicitly bounded-delta audit.

### 5.6 Automated checks

- content-lock verifier passes with zero drift
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- changed-file audit matches the exact authorized manifest
- no package, fixture, safety, route, or non-approved runtime diff
- targeted search confirms no unresolved use of the three undefined tokens

### 5.7 Human checks

- confirm that this is technical preparation, not visual acceptance
- confirm no wording, behavior, or hierarchy has been substantively changed
- confirm the proposed primitives are narrow and do not form a universal renderer

### 5.8 Rollback strategy

Revert the single checkpoint commit. Because fixtures, safety, packages, routes, and data behavior are prohibited, rollback must restore the previous CSS/component structure without data migration or compatibility work.

### 5.9 Expected commit

`refactor: prepare M1-I8-R1 reading note visual system`

### 5.10 Next authorization gate

Human accepts Checkpoint A and separately authorizes **Checkpoint B / M1-I8-R1 Visual Excellence** with its exact file manifest. Acceptance of A alone does not authorize B.

## 6. Checkpoint B — M1-I8-R1 Visual Excellence

### 6.1 Purpose

Implement the approved reading-note visual hierarchy for the canonical Web report, save report, public full sample, report shell, comparison navigation, error/loading states, and review boundary while preserving all locked content and behavior.

### 6.2 Allowed files

- `components/report/**`
- approved shared primitives under `components/artifact/**`
- approved `components/brand/**` primitives
- `components/review/ReviewBanner.tsx` only for wrapper compatibility
- canonical review report, review save-report, and public sample page files under `app/**`, including their existing error/loading files
- `app/globals.css`
- `docs/phase1/TASK_M1_I8_R1_REVIEW.md`
- current-status documentation required to record the checkpoint result

The authorization must enumerate the exact route and component files before implementation.

### 6.3 Prohibited files and changes

- all fixture and safety files
- request, purchase, legal, and public-route behavior
- package and lockfiles
- new dependencies, external fonts, externally hosted assets, or new integrations
- copy editing, judgment changes, and naming cleanup
- Browser tooling, screenshots, or agent-authored visual acceptance claims

### 6.4 Dependencies

- accepted Checkpoint A
- explicit Human authorization of Checkpoint B
- passing content-lock verifier
- approved archetype, typography, spacing, and responsive rules from the M1-P3 specification

### 6.5 Implementation sequence

1. Implement the artifact shell, cover identity, and metadata hierarchy.
2. Implement the decision/answer archetype with the judgment as the dominant reading anchor.
3. Apply letter/narrative, evidence/interpretation, action/time, and limits/closing archetypes to the existing report sections.
4. Align save-report presentation to the same visual grammar without making it a pixel-identical Web report.
5. Align the public full sample as the approved shorter edited artifact without expanding it to fourteen chapters.
6. Align comparison navigation, error/loading presentation, and review boundaries while keeping them subordinate to the artifact.
7. Apply desktop, 390px, 768px, and 320px rules from the specification.
8. Verify focus, landmarks, heading order, contrast, overflow, and reduced-motion behavior.
9. Run automated checks and submit the review artifact for Human visual validation.

### 6.6 Automated checks

- content-lock verifier passes before and after implementation
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- exact changed-file audit
- semantic heading/landmark inspection
- narrow-width code inspection at 390px, 768px, and 320px breakpoints
- no fixture, safety, package, lockfile, external-font, or external-asset diff

### 6.7 Human checks

In external Microsoft Edge, Human verifies:

- canonical Web report at desktop and 390px
- save report at 768px and 320px
- public full sample at desktop and 390px
- judgment dominance and scan order
- typography, density, paper texture, dividers, metadata, and whitespace
- long Japanese text wrapping and absence of horizontal overflow
- focus visibility and keyboard reading order
- error/loading state coherence where reachable

### 6.8 Rollback strategy

Revert the Checkpoint B commit. Shared primitives introduced in A remain intact; no fixture, safety, data, or route migration is permitted.

### 6.9 Expected commit

`feat: implement M1-I8-R1 reading note visual excellence`

### 6.10 Next authorization gate

Human accepts M1-I8-R1 visual evidence and separately authorizes **Checkpoint C / M1-I9-R1 Preview Alignment**. M1-I9-R1 remains unauthorized until that decision is recorded.

## 7. Checkpoint C — M1-I9-R1 Preview Alignment

### 7.1 Purpose

Align the landing-page product preview, public-case comparison, and artifact entry links to the accepted reading-note visual grammar without changing their content or purpose.

### 7.2 Allowed files

- `app/page.tsx`
- existing LP-specific presentation components only if the exact authorization identifies them
- approved shared primitives under `components/artifact/**`
- approved existing primitives under `components/brand/**`
- `app/globals.css`
- `docs/phase1/TASK_M1_I9_R1_REVIEW.md`
- current-status documentation required to record the checkpoint result

The authorization must provide the exact manifest and identify every permitted route file.

### 7.3 Prohibited files and changes

- `lib/fixtures/**` and `lib/safety/**`
- request and purchase flows
- package and lockfiles
- sample-case copy, fixed judgment copy, price, age, product facts, disclosure, or unsupported-case rules
- new routes, integrations, persistence, or runtime changes
- collapsing previews and canonical artifacts into one universal renderer

### 7.4 Dependencies

- accepted M1-I8-R1 visual implementation
- explicit Human authorization of M1-I9-R1
- accepted current content-lock hashes
- final Human decision on which shared primitives are stable across canonical and preview consumers

### 7.5 Implementation sequence

1. Align the LP product-preview shell and fixed `result-normal-001` judgment hierarchy while retaining its conversion-oriented context.
2. Align the separate wait/send/distance public-case comparison without presenting those cases as formats of one result.
3. Align links into the public full sample and request flow without changing destinations, CTA behavior, or fixed/sticky policy.
4. Preserve the semantic distinction between LP excerpt, public case comparison, public full sample, canonical Web report, and save report.
5. Verify desktop and 390px behavior plus content-lock stability.
6. Submit Human comparison evidence for desktop and 390px.

### 7.6 Automated checks

- content-lock verifier passes
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- exact file-manifest audit
- no fixture, safety, package, lockfile, font, asset, or route-expansion diff
- static comparison of component consumers to prevent accidental universal-renderer coupling

### 7.7 Human checks

In external Microsoft Edge, Human compares:

- LP product preview versus canonical Web report at desktop and 390px
- public wait/send/distance comparison at desktop and 390px
- preview labels, artifact-entry links, and case-boundary clarity
- faithful hierarchy without misleading the public sample as a purchased result
- overflow, focus, and long-text behavior

### 7.8 Rollback strategy

Revert the Checkpoint C commit. The accepted M1-I8-R1 canonical report remains unchanged and independently deployable.

### 7.9 Expected commit

`feat: align M1-I9-R1 reading note previews`

### 7.10 Next authorization gate

Human accepts M1-I9-R1 comparison evidence and separately authorizes **Checkpoint D / M1-I12 Final QA**. M1-I12 remains unauthorized until that decision is recorded.

## 8. Checkpoint D — M1-I12 Final Responsive and Accessibility QA

### 8.1 Purpose

Correct only evidenced visual, responsive, accessibility, and cross-artifact defects after M1-I8-R1 and M1-I9-R1 acceptance. This is a closure checkpoint, not a feature lane.

### 8.2 Allowed files

- only existing `app/**` and `components/**` files directly tied to a documented defect
- `app/globals.css` when the defect is a shared style issue
- relevant error/loading files when Human evidence identifies a defect
- `docs/phase1/TASK_M1_I12_REVIEW.md`
- current-status documentation required to record final QA and Milestone 1 state

The final authorization must list each defect, evidence reference, and exact file before mutation.

### 8.3 Prohibited files and changes

- fixtures, safety logic, product facts, legal wording, price, age requirement, judgment output, or route behavior
- packages, lockfiles, build tooling, runtime configuration, APIs, persistence, or integrations
- speculative polish without documented evidence
- new feature work, new sample cases, or universal renderer work
- Milestone 2 work

### 8.4 Dependencies

- accepted M1-I8-R1 and M1-I9-R1
- explicit Human authorization of M1-I12
- Human defect list from external Edge review
- clean content-lock verification baseline

### 8.5 Implementation sequence

1. Convert each Human observation into a reproducible defect with viewport, route, expected result, and exact owner file.
2. Reject observations that require content, behavior, or unauthorized feature changes and route them to a separate decision.
3. Fix defects one class at a time: overflow/layout, typography, focus/keyboard, contrast, error/loading coherence.
4. Check link integrity and run the full authorized-route regression set without expanding product behavior.
5. Re-run content locks and full automated validation after each defect class.
6. Prepare the Milestone 1 acceptance package, final Human verification checklist, and closure record without declaring Milestone 1 complete before Human decision.

### 8.6 Automated checks

- content-lock verifier passes
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- exact defect-to-file manifest audit
- no fixture, safety, package, lockfile, runtime, font, asset, or integration diff
- semantic structure, focus styles, reduced motion, and horizontal-overflow code audit
- link-integrity audit and full authorized-route regression evidence

### 8.7 Human checks

In external Microsoft Edge, Human rechecks only the documented defects plus a compact regression set:

- canonical Web report: desktop and 390px
- save report: 768px and 320px
- LP sample and both review previews
- link integrity and the full authorized-route regression set
- keyboard focus order and visibility
- long Japanese strings, zoom, and horizontal overflow
- error/loading states included in the defect manifest

Human, not Codex, records final visual acceptance.

### 8.8 Rollback strategy

Revert the single Checkpoint D commit or the individual defect commit if the final authorization permits one commit per defect class. No data migration, fixture compatibility, or safety rollback may be necessary because those areas are prohibited.

### 8.9 Expected commit

`fix: complete M1-I12 final responsive and accessibility QA`

### 8.10 Next authorization gate

Human accepts M1-I12 evidence and decides whether Milestone 1 is complete. Milestone 2 remains unauthorized unless a separate explicit authorization record is created after that decision.

## 9. Required authorization record for every checkpoint

Before implementation, the checkpoint record must contain all of the following:

- checkpoint ID and exact title
- accepted base commit
- exact branch
- exact allowed-file manifest
- explicit prohibited-file and prohibited-behavior list
- content-lock baseline hashes
- automated verification commands
- Human visual-verification owner and viewport matrix
- expected commit message
- rollback instruction
- explicit statement that the following checkpoint remains unauthorized

An incomplete record is a hard stop.

## 10. Completion definition for this plan

This plan is complete when Human and ChatGPT have reviewed it together with the visual specification, content-lock matrix, Figma handoff specification, and M1-P3 review record. Completion of this document is not implementation acceptance and does not change the authorization status of M1-I8-R1, M1-I9-R1, M1-I12, Milestone 1, or Milestone 2.
