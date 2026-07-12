# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Task M1-I2 Request Confirmation and Safety Review States — implemented and validated, awaiting Human review

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
- Task M1-I2 explicitly authorized by Human
- Human selected a three-step request flow and a unified required acknowledgement

## Current Task

Task M1-I2 implements:

- the three-step public request flow at `/request`;
- current-step validation with in-memory value preservation;
- one visible five-item acknowledgement list followed by exactly one required checkbox;
- local confirmation available only to `normal_allowed`;
- deterministic stop states for `needs_review`, `rejected`, contradictory Safety selection, invalid age, missing consent, and unknown/error;
- typed fictional `.invalid` fixtures;
- all required `/review/request/**` routes; and
- a production-shaped, payment-free local request confirmation.

## Runtime Boundary

- State is browser-memory-only. Refresh may reset it.
- No request submission, persistence, localStorage, sessionStorage, cookie, URL-query persistence, database read/write, API route, server action, payment, refund, OpenAI, email, analytics, file/image upload, OCR, or deployment work is added.
- Existing age choices and deterministic Safety severity remain unchanged.
- Refund conditions, delivery-completion treatment, and transaction-specific acceptance are not defined here.
- Marketing/newsletter consent is absent. Any future consent remains separate, optional, and unchecked.

## Deferred Work

- Mobile heading polish and favicon remain deferred to M1-I6.
- Human visual inspection remains required; CodeX browser validation is not part of this task.

## Next Gate

Human reviews and accepts M1-I2. M1-I3 purchase confirmation and all later slices remain unauthorized.
