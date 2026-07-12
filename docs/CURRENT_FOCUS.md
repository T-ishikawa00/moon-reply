# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Task M1-I3 Final Purchase Confirmation Without Payment — implemented and automatically validated, awaiting Human visual review

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
- Task M1-I3 explicitly authorized by Human
- Human selected a three-step request flow and a unified required acknowledgement

## Current Task

Task M1-I3 implements:

- the production-shaped review route `/review/purchase/confirmation/normal-001`;
- a typed purchase fixture that references accepted `request-normal-001` rather than duplicating request data;
- product, 税込980円, quantity, one-shot/no-renewal, request summary, delivery plan, AI use, non-guarantee, refund draft boundary, and legal/contact preparation status;
- a native disabled control labeled `購入機能は現在準備中です`;
- review metadata fixed to `normal_allowed`, `not_started`, `unselected`, and `unresolved`;
- correction links to the real `/request#step-1`, `#step-2`, and `#step-3` destinations; and
- fail-closed handling for unknown and non-normal purchase fixture IDs without fallback.

## Runtime Boundary

- The M1-I3 purchase display is deterministic, local fixture rendering only. It creates no transaction, result, email, or saved data.
- No request submission, persistence, localStorage, sessionStorage, cookie, database read/write, API route, server action, payment, refund execution, OpenAI, email, analytics, file/image upload, OCR, or deployment work is added.
- Existing age choices and deterministic Safety severity remain unchanged.
- The payment provider remains unselected. Payment method, payment timing, exact delivery timing, and transaction-specific conditions remain unresolved.
- Refund conditions are presented only as a preparation boundary; no refund checkbox or acceptance record exists.
- Marketing/newsletter consent is absent.

## Deferred Work

- Mobile heading polish and favicon remain deferred to M1-I6.
- M1-I4 report/sample pages, M1-I5 legal bodies, and M1-I6 final QA remain unauthorized.
- Human visual inspection remains required; the task explicitly prohibited CodeX from using the in-app browser.

## Next Gate

Human reviews and accepts M1-I3. M1-I4 and all later slices remain unauthorized until separately gated.
