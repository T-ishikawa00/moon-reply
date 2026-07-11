# TASK18C_R3_ROADMAP_RESET_REVIEW.md

## Status

Awaiting Human review.

## Base

Task 18C-R2 accepted.

Base commit: `24ca0f43f262f3fbe03d412460571ac9daf7956c`

## Problem Corrected

The controlling documents did not describe one coherent route from the completed foundations to a paid public Web MVP:

- `docs/ROADMAP.md` still controlled through the obsolete semi-manual JPY 980 validation, semi-manual Web delivery, and automated Web phases.
- `docs/phase1/IMPLEMENTATION_PLAN.md` still named Stage 1 bootstrap/static LP as the first next implementation even though Stages 1–4.5 and Tasks 18B–18C-R2 were complete.
- `docs/phase1/IMPLEMENTATION_WBS.md` displayed completed bootstrap, request-form, and Supabase foundation work as incomplete and placed payment before a coherent review-site/provider-evidence sequence.
- `docs/WBS.md` left Human acceptance of Tasks 18C-R1 and 18C-R2 unchecked and did not expose the approved Milestone 1–9 dependency chain.

The reset makes `docs/ROADMAP.md` authoritative, preserves historical records as non-controlling context, and aligns the implementation plan, WBS files, acceptance criteria, current focus, and handoff.

## Authoritative Completion Definition

The initial paid Web MVP completes only after the first verified real unknown-customer purchase. Payment, the internal purchase record, exactly one generation, exactly one result token, successful result access, email delivery, support traceability, protection of personal information, and absence of unhandled failure must be confirmed.

## Approved Delivery Sequence

1. Milestone 1: Reviewable Web MVP
2. Milestone 2: Operator Information and Publication Readiness
3. Milestone 3: Review Site Deployment
4. Milestone 4: Payment Provider Inquiry and Selection
5. Milestone 5: Core Backend, Safety, AI and Email
6. Milestone 6: Approved Provider Sandbox Payment
7. Milestone 7: E2E, Safety and Failure Operations
8. Milestone 8: Production Application and Soft Launch
9. Milestone 9: First Real Purchase Verification

## Completed Foundations

- JPY 980 one-shot product concept
- Next.js, TypeScript, and Tailwind foundation
- static LP
- request-form UI and client-side validation
- required 18-or-older age-group selection
- deterministic local safety foundation
- Supabase schema foundation
- legal/compliance foundation and legal-page drafts
- provider-inquiry preparation
- canonical service positioning

No production runtime integration is inferred from these foundations.

## Intentionally Not Started

- Reviewable Web MVP implementation
- Operator-information completion
- Deployment
- Provider inquiry
- Provider selection
- DB write connection
- OpenAI
- email
- payment
- production launch

## Files Updated

- `docs/ROADMAP.md`
- `docs/WBS.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/PRODUCT_SPEC.md`
- `docs/DEVELOPMENT_FLOW.md`
- `docs/VALIDATION_PLAN.md`
- `docs/payment/PROVIDER_INQUIRY_PLAN.md`
- `docs/phase1/IMPLEMENTATION_PLAN.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/ACCEPTANCE_CRITERIA.md`
- `docs/phase1/TASK18C_R2_POSITIONING_REVIEW.md`
- `docs/phase1/TASK18C_R3_ROADMAP_RESET_REVIEW.md`

## Repository Search Classification

| Occurrence | Classification | Treatment |
| --- | --- | --- |
| Old semi-manual phases in `docs/ROADMAP.md` | Current controlling and must update | Replaced by Milestones 1–9 |
| Stage 1 as first implementation and immediate Task 18D in `IMPLEMENTATION_PLAN.md` | Current controlling and must update | Removed as current authority |
| Unchecked completed P1/P2/P3 work in `IMPLEMENTATION_WBS.md` | Current controlling and must update | Corrected to completed foundation status |
| Unchecked R1/R2 Human acceptance and stale Phase 1 setup in `docs/WBS.md` | Current controlling and must update | Corrected or annotated |
| Semi-manual terms in `DEVELOPMENT_FLOW.md`, `PRODUCT_SPEC.md`, and `VALIDATION_PLAN.md` | Valid historical record | Retained and explicitly annotated as non-controlling |
| Immediate Task 18D inquiry references in `PRODUCT_SPEC.md` and `PROVIDER_INQUIRY_PLAN.md` | Current controlling and must update | Replaced by Milestone 4 after Human acceptance of Milestones 1–3 |
| Provider inquiry drafts and descriptive provider references | Descriptive reference, not sequencing authority | Retained without changing inquiry-body content |

## Validation

- Controlling-document consistency and stale-sequencing searches performed.
- Historical occurrences were classified instead of mass-deleted.
- Only the documentation files listed above changed.
- `package.json` and `package-lock.json` remained unchanged.
- `app/**`, `components/**`, `lib/**`, and `supabase/**` remained unchanged.
- No application build, browser, or HTTP validation is claimed because runtime behavior did not change.
- No inquiry was sent, no provider was selected, and no implementation or deployment started.

## Next

After Human acceptance:

Milestone 1 planning/specification for the payment-free Reviewable Web MVP.

No implementation is authorized by this Roadmap Reset commit.
