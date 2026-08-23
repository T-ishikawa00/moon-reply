# Purchase Trust UX and latency design note

Status: local implementation note for `task/m2-purchase-trust-ux-r1`. This note does not authorize deployment, Provider execution, migration, payment retry, or Production activation.

## Implemented truth contract

- The purchase CTA states `税込 980円`, `1相談 / 1鑑定ノート`, `都度払い・自動更新なし`, then explains that Stripe opens next. Legal links remain available after the primary action.
- `confirming_payment` and pre-verification `confirmation_pending` say only that payment evidence is being checked. They do not claim successful payment.
- `preparing_assessment`, `temporary_problem`, post-verification `confirmation_pending`, and completed states may say that payment is verified and no additional payment is required.
- The progress UI exposes named states (`完了`, `現在`, `次`) in text. It has no fabricated percentage, ETA, or animated progress claim.
- Closing the status page is described as safe only after payment verification. Account-storage copy is conditional on the Customer Auth foundation being enabled.
- Both legacy result paths and authenticated account result paths are decoded, so a completed authenticated purchase can redirect to its canonical result.

## Google redirect latency measurement

The client records monotonic durations for:

- T0: exact Google method click.
- T1: continuation request start/end.
- T2: Google-start request start/end.
- T3: validated authorization URL received.
- T4: `window.location.assign` start.

The server records only bounded phase names and durations for continuation creation, continuation validation, and OAuth URL generation. Records contain no email, user ID, continuation ID, capability, token, OAuth URL, consultation text, raw error, or secret. The measurement is diagnostic only and does not change request ordering, security validation, or redirect behavior.

## Future latency objective — design only

Product objective: make the first useful, truthful customer value visible in roughly 10 seconds where the runtime can support it. This objective is **not achieved or claimed by this change**.

Candidates requiring a separate architecture and acceptance decision:

1. Produce a small, schema-bound early artifact such as `今夜の答え` before the full note, while preserving one canonical assessment and provenance.
2. Stream durable, independently validated sections only after their state is committed; never stream speculative completion or a fake percentage.
3. Split Provider work into resumable stage outputs with explicit idempotency, fencing, and post-Provider ambiguity handling.
4. Cache only preparation assets that contain no customer input and whose checksums are pinned to the deployed runtime catalog.
5. Measure click-to-first-truthful-value separately from click-to-complete-result, then set an SLO only after representative dogfood evidence exists.

Any early-result or streaming implementation must retain current Payment, Grant, logical-assessment, Provider-call, canonical-delivery, notification, and recovery invariants. It requires separate authorization and must not be inferred from this note.
