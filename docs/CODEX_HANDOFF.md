# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent. It must follow the current Human-approved milestone and the scope of the current task.

## Current Authority

- Task 18C-R1 is accepted by Human.
- Task 18C-R2 is accepted by Human at commit `24ca0f43f262f3fbe03d412460571ac9daf7956c`.
- Task 18C-R3 Roadmap Reset is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.
- Task M1-P1 is accepted by Human at commit `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`.
- Task M1-P1-R1 is accepted by Human at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`.
- Task M1-I1 is accepted by Human at commit `dd031183dd347493fd5619f1b0d8bb355fc93560`.
- Human explicitly authorized Task M1-I2 Request Confirmation and Safety Review States.
- Human selected a three-step request flow and a unified required acknowledgement.
- `docs/ROADMAP.md` remains the authoritative high-level roadmap.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`: one report, not chat; JPY 980 one-shot; 18+; Safety before payment.

## Current Status

Task M1-I2 is implemented and validated, awaiting Human review.

Implemented in this slice:

- three-step `/request` flow;
- browser-memory-only navigation and validation;
- visible five-item acknowledgement list with one required checkbox;
- `normal_allowed`-only request confirmation;
- deterministic stop states and typed fictional fixtures;
- seven request-state review routes and one normal confirmation route; and
- `/review` inventory updated to label M1-I2 as implemented.

## Runtime and External Status

- No provider inquiry sent and no provider selected.
- No legal page published and no review site deployed.
- No production database read/write connection.
- No payment/refund, OpenAI, email, API-route, server-action, analytics, PDF/image generation, copy/download/share, file/image/OCR, or deployment implementation.
- No package change.
- Refund conditions and transaction-specific acceptance remain unresolved and are not represented as M1-I2 consent.

## Current Restriction

M1-I3 through M1-I6 are not authorized. Do not implement purchase confirmation, payment controls, sample/report fixtures, save-report fixtures, legal/contact route bodies, or final QA scope before the corresponding Human gate. Mobile heading polish and favicon remain deferred to M1-I6.

## Next Gate

Human reviews and accepts Task M1-I2. Only after separate authorization may M1-I3 Purchase Confirmation begin.
