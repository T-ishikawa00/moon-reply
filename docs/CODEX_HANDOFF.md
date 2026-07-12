# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent. It must follow the current Human-approved milestone and the scope of the current task.

## Current Authority

- Task 18C-R1 is accepted by Human.
- Task 18C-R2 is accepted by Human at commit `24ca0f43f262f3fbe03d412460571ac9daf7956c`.
- Task 18C-R3 Roadmap Reset is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.
- Task M1-P1 is accepted by Human at commit `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`.
- Task M1-P1-R1 is accepted by Human at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`.
- Human explicitly authorized Task M1-I1 Route Shell and Review Navigation.
- Human approved the M1-I1 desktop visual direction.
- Task M1-I1-R1 User-facing Copy Cleanup is completed and awaiting Human review.
- `docs/ROADMAP.md` remains the authoritative high-level roadmap.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`: one report, not chat; JPY 980 one-shot; 18+; Safety before payment.

## Current Status

Task M1-I1-R1 public-copy cleanup is completed and awaiting Human review. M1-I1 is not yet finally accepted; mobile, `/request`, and `/review` Human review remain.

Implemented in this slice:

- refreshed vertical LP at `/` in the accepted section order;
- shared responsive site header and footer;
- shared `/review/**` shell with the accepted two-level review banner;
- static `/review` route/status inventory; and
- truthful navigation to implemented destinations only.

The existing `/request` form remains local-only. Its age choices, deterministic Safety rules, validation, and browser-local behavior are unchanged.

## Runtime and External Status

- No provider inquiry sent and no provider selected.
- No legal page published and no review site deployed.
- No fixture data or future route body implemented.
- No production database read/write connection.
- No payment/refund, OpenAI, email, API-route, server-action, analytics, PDF/image generation, copy/download/share, or deployment implementation.
- No package change.

## Current Restriction

M1-I2 through M1-I6 are not authorized. Do not implement request confirmation or Safety review routes, purchase confirmation, sample/report fixtures, save-report fixtures, legal/contact route bodies, or final QA scope before the corresponding Human gate.

## Next Gate

Human confirms the mobile LP, `/request`, `/review`, and M1-I1-R1 copy cleanup, then may finally accept M1-I1. Only after that may Human separately authorize M1-I2 Request Confirmation and Safety Review States.
