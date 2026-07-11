# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent. It must follow the current Human-approved milestone and the scope of the current task.

## Current Authority

- Task 18C-R1 is accepted by Human.
- Task 18C-R2 is accepted by Human at commit `24ca0f43f262f3fbe03d412460571ac9daf7956c`.
- Task 18C-R3 Roadmap Reset is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.
- Task M1-P1 planning/specification is completed in the repository and awaiting Human review.
- Task M1-P1-R1 UI/UX documentation alignment is completed in the repository and awaiting Human review with Task M1-P1.
- `docs/ROADMAP.md` is the authoritative high-level roadmap.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`: one report, not chat; JPY 980 one-shot; 18+; safety before payment.

R1 further fixes the emotional objective (reduce anxiety and restore agency), vertical LP with a separate `/request`, text-only input with conversation paste/anonymization, image-upload deferral, no initial free-complete/ad-supported path, complete recommendations for every approved send/light-send/wait/do-not-send label, separate Web鑑定ノート/保存用鑑定書 presentations, the planned `/review/save-report/result-normal-001`, the two-level review banner, and The Pattern inspiration-without-imitation boundary.

## Current Status

Completed foundations include the Next.js/static LP, request-form UI, Supabase schema foundation, deterministic local safety foundation, legal/compliance foundation, legal-page drafts, provider-inquiry preparation, age-policy alignment, and service-positioning alignment.

Runtime and external status:

- No provider inquiry sent.
- No provider response received.
- No provider approved or selected.
- No legal page published.
- No review site deployed.
- No production database-write connection.
- No payment, OpenAI, email, API-route, or server-action implementation.

## Current Restriction

Task M1-P1 and Task M1-P1-R1 are documentation-only. They do not authorize routes, pages, components, fixtures, UI changes, image assets, file upload/OCR, PDF/image generation, download/copy/share, free/ad behavior, legal publication, operator data, deployment, inquiry submission, provider selection, persistence, payment/refunds, AI, email, package changes, or other implementation.

Milestone 1 implementation has not started. `needs_review` and `rejected` are specified as purchase-blocking states for the initial MVP, but no production enforcement is claimed by this planning task.

## Next After Human Acceptance

After Human accepts Task M1-P1 and Task M1-P1-R1 together, the next possible task is M1-I1 Route Shell and Review Navigation only, subject to separate explicit Human authorization.

M1-I2 through M1-I6, operator-information completion, deployment, provider inquiry, DB writes, OpenAI, email, and payment remain unauthorized.
