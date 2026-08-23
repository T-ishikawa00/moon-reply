# M2-A1 NULL Lease / Completion Fence Integrity Hardening

Status: `technical_implementation_and_local_proof_complete`

Accepted base: `codex/m2-0-authority-critical-db-baseline@90c4a585a951c1de073f041b0a656e21742133da`

Task branch: `task/m2-a1-null-fence-integrity-r1`

Production authority: `release/private-ready@0befd512219eb2897fb1edf969ad37d7e8c56b0d`

Remote apply authority: `false`

release/private-ready integration authority: `false`

This is the append-only M2-A1 successor authorized after Human/ChatGPT acceptance of M2-0. It creates no new Milestone or Gate and does not integrate the M2-0 branch alone.

## Implementation boundary

Migration: `supabase/migrations/0017_m2_a1_null_fence_integrity.sql`

Only these current v2 RPC bodies change:

1. `claim_production_fulfillment_v2(uuid,uuid,timestamptz,timestamptz)`
2. `complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)`
3. `claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz)`

The claim RPCs reject NULL owner, NULL requested lease, and non-future requested lease before row locking or mutation. Completion rejects NULL caller owner, NULL stored owner, NULL stored lease, owner mismatch through `IS DISTINCT FROM`, expiry, invalid status, and a missing generation boundary immediately after locking and before report/grant reads or any delivery side effect.

Migration `0016` is unchanged. Legacy v1 definitions/signatures, current v2 signatures, the two historical NOT VALID expand constraints, valid reclaim behavior, post-provider ambiguity handling, notification retry semantics, and Async Workloads retry ownership remain unchanged.

## Proof package

- Static/current verifier: `scripts/verify-m2-a1-null-fence-integrity.mjs`
- Sequential rollback-only DB proof: `supabase/tests/m2_a1_null_fence_integrity_r1.sql`
- Two-session fixture: `supabase/tests/m2_a1_null_fence_concurrency_setup_r1.sql`
- Concurrent claim workload: `supabase/tests/m2_a1_null_fence_concurrent_claim_r1.sql`
- Concurrent completion workload: `supabase/tests/m2_a1_null_fence_concurrent_completion_r1.sql`
- Concurrency assertions: `supabase/tests/m2_a1_null_fence_concurrency_verify_r1.sql`

The dynamic stored-NULL-owner completion case is explicitly a test-only corruption fixture. The exact validated `production_logical_assessments_owner` CHECK and the historical NOT VALID lease-owner CHECK make `generating + owner_id NULL + non-NULL lease` catalog-infeasible for a new write. The proof temporarily removes both CHECKs inside an exception subtransaction; the expected RPC error rolls the DDL and row mutation back, and the proof separately asserts that the validated and NOT VALID constraints retain their exact states. This is fault-injection evidence, not a claim that the canonical catalog naturally admits that row.

Both non-target heartbeat RPCs are regression-tested with a NULL requested lease. Although their `UPDATE ... RETURNING` statement can calculate a NULL return value, the immediately following lease-conflict exception rolls the whole RPC statement back. Full-row snapshots remain identical. They are therefore not silently added to the migration target set.

The active migration lineage is `0002..0017`. Archived `0001` is not copied into the active lineage. Cross-version proof separately seeds exact legacy state after `0002..0015`, then applies exact `0016` followed by `0017`.

## Local proof results

A fresh disposable local Supabase stack applied exact active migrations `0002..0015`, loaded the legacy expand seed, and then applied exact `0016` and this successor `0017`. Local migration history was exact `0002..0017`. All values were fixed synthetic data. The stack had no remote link and sent no real/external Provider, Stripe, webhook, Async Workloads, email, Purchase, or deploy operation. Purchase-related activity was limited to disposable synthetic local SQL fixtures and RPC regression calls.

### NULL/fence and atomicity matrix

| Area | Invalid cases | Error/disposition | Before/after and side effects |
| --- | --- | --- | --- |
| Logical claim | NULL owner, NULL requested lease, equal/expired requested lease | `PRODUCTION_FULFILLMENT_LEASE_INVALID` | Full logical row and request snapshot identical; delivery/credential/outbox counts identical; attempt delta `0` |
| Logical claim valid | non-NULL owner + future lease | `acquired` | `pending -> generating`; exact owner/lease; attempt `0 -> 1`; no completion side effect |
| Completion | NULL caller owner, stored NULL lease, mismatched owner, expired/equal lease | `PRODUCTION_FULFILLMENT_STATE_CONFLICT` | Full logical/grant snapshots identical; delivery/credential/outbox deltas `0/0/0` |
| Completion stored NULL owner | isolated test-only corrupt-row injection | `PRODUCTION_FULFILLMENT_STATE_CONFLICT` | Explicit RPC guard stopped immediately after the logical row lock and before report/grant reads or any side-effect insert; exception subtransaction restored both CHECKs and the row |
| Completion valid | exact owner + live lease + canonical run/report | completed | logical/grant completed; delivery/customer-handoff credential/outbox counts `1/1/1` |
| Completion replay | second RPC call after success | `PRODUCTION_FULFILLMENT_STATE_CONFLICT` | completed logical/grant and side-effect counts stayed exact `1/1/1` |
| Notification claim | NULL owner, NULL requested lease, equal/expired requested lease | `PRODUCTION_NOTIFICATION_LEASE_INVALID` | Full outbox row identical; attempt delta `0` |
| Notification valid/reclaim | pending valid claim; expired processing reclaim | `acquired`; `reclaimed` | attempt `0 -> 1 -> 2`; exact new owner/future lease; no duplicate notification row |
| Heartbeat regressions | NULL requested lease for logical and notification | `*_LEASE_CONFLICT` | The attempted NULL `UPDATE ... RETURNING` rolled back with the exception; both full-row snapshots stayed identical |

Mismatched/expired logical failure and notification completion/failure remained closed with unchanged full rows. The M2-0 rejected NULL job lease, NULL dispatch lease, NULL customer user, NULL returned model, and invalid generation-boundary owner/time/fence cases all re-ran and failed closed with zero persistent side effects.

### Concurrency

Two independent PostgreSQL clients ran each workload once. Logical claim,
pending notification claim, notification reclaim, and completion were four
separate `pgbench` transaction rounds, so an unrelated row lock could not
serialize a later race:

- Logical claim: client outcomes `acquired 1 / in_progress 1`; logical attempt count `1`; one owner/live lease.
- Notification claim: client outcomes `acquired 1 / in_progress 1`; notification attempt count `1`; one owner/live lease.
- Notification reclaim: an expired processing row produced `reclaimed 1 / in_progress 1`; attempt count increased exactly once (`3 -> 4`), the winning owner/live lease was retained, and every non-fence/non-attempt field remained equal to the baseline snapshot.
- Logical completion: client outcomes `completed 1 / P0001 conflict 1`; delivery/customer-handoff credential/outbox counts exact `1/1/1`.

The Customer Auth DB proof also passed its rollback, expiry/replay/CSRF, binding, Payment-to-Grant, mixed-lane, Customer isolation, detach, ACL, and RLS categories. Its independent two-client binding probe returned `created 1 / existing 1`, retained one active binding, and consumed the continuation once.

### Cross-version and existing verification

- M1 expand compatibility after `0017`: PASS A-H, including exact legacy v1 definitions/payloads/ACL, active legacy worker no-steal, legacy completion/failure, legacy notification completion/failure, v2 fencing, dispatch/job retry authority, pre-provider reclaim, post-provider ambiguity quarantine, and legacy observation of completion.
- Exact historical EA4 application + DB0016: PASS `6/6` on a separate pre-0017 proof point.
- M2-0 historical verifier: PASS `10/10` in an isolated exact accepted-branch checkout; it remains intentionally non-applicable on this successor branch.
- M2-A1 verifier: PASS `12/12`, including byte-normalized proof that target bodies are predecessor-identical outside the three guards.
- Background fulfillment durability: PASS `21/21`.
- RC-1: PASS `19/19`.
- RC-2: PASS `48/48`.
- Clarification contract: PASS `7/7`.
- Clarification Product Intent: PASS `18/18`.
- Async router/worker graph: PASS (`103` modules, `350` edges).
- Generated Async router/background artifact smoke: PASS.
- Background runtime asset loader/package: PASS (`readers 1`, `configured 97`, `required 81`, `missing 0`).
- TypeScript typecheck, ESLint with zero warnings, Next production build, and `git diff --check`: PASS.

The historical Customer Auth static verifier passed its first 31 checks and then stopped at its expected candidate-SHA immutability assertion because accepted email-verification/repository files changed after that historical candidate. It was not weakened. The current disposable Customer Auth DB proof above is the applicable database regression.

## Historical verifier applicability

`verify:m2-0` is intentionally historical. It pins branch `codex/m2-0-authority-critical-db-baseline` and requires migrations unchanged from Production authority, so it is non-applicable on a successor branch that adds `0017`. It remains unmodified and must be executed only in an isolated exact `90c4a585...` checkout when historical M2-0 package verification is required.

`verify:customer-auth-foundation` is likewise candidate-SHA pinned and is non-applicable to current integrated source. Current Customer Auth regression authority is the disposable local execution of `supabase/tests/customer_identity_auth_foundation_r1.sql`; the historical verifier is not weakened to manufacture a PASS.

## Remote apply preparation

No command in this section is authorized for current execution. It is an action-time plan only.

### Exact artifact

- Filename: `0017_m2_a1_null_fence_integrity.sql`
- Git-blob SHA-256: `b5c2534dbc8bdb97e6fa77612143b8bf9ec78c2955908ceab3d360bab30f9380`
- Transaction boundary: one explicit `begin` / `commit`
- DDL class: three `CREATE OR REPLACE FUNCTION` statements plus comments; no table, constraint, policy, owner, ACL, or signature change

### Expected affected RPCs

- `claim_production_fulfillment_v2(uuid,uuid,timestamptz,timestamptz)`
- `complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)`
- `claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz)`

Only these three `pg_proc.prosrc` hashes are expected to change.

### Expected unchanged RPCs

All legacy v1 functions and every non-target v2 function are unchanged, including fulfillment/notification heartbeat, mark, failure and completion counterparts; fulfillment job/dispatch claim/heartbeat/complete/fail; recovery; quarantine; customer identity; and assessment finalization. Their signatures, returns, owner, ACL, `SECURITY INVOKER`, and search path must remain equal to the action-time pre-state.

### Pre-apply checks

1. Obtain fresh action-time Human authority for exactly one linked dry-run/apply sequence. Current authority is false.
2. Confirm task commit, reviewed migration Git-blob SHA-256, clean task worktree, stash 0, and the named target authority/ref manifest.
3. Use credential-safe read-only commands to prove remote migration history is exact `0002..0016`, with `0017` absent. Stop on ambiguity or drift; do not repair history.
4. Read the remote catalog and compare the old three target signatures/body hashes with the accepted M2-0 catalog evidence.
5. Capture fresh hashes and metadata for all unchanged v1/v2 RPCs: identity arguments, result type, owner, ACL, security mode, search path, and body. Mismatch count must be 0.
6. Confirm no unexpected in-flight operational condition requires a separate rollout hold. Do not send Provider, Stripe, webhook, Async Workloads, Purchase, email, or deploy traffic as a precheck.
7. Run the exact authorized dry-run count. Any unexpected migration, parse error, or ambiguous output is a stop, not retry authority.

### Post-apply checks

1. Use read-only migration history to prove exact `0002..0017` with one new applied version.
2. Re-read the three target definitions and compare their body hashes to the committed `0017` definitions.
3. Prove every expected unchanged RPC hash and metadata field remains identical to pre-apply capture; unexpected drift count must be 0.
4. Confirm the two NOT VALID expand constraints retain their pre-state and all table/policy/ACL identities are unchanged.
5. Exercise only a separately authorized synthetic production smoke protocol. Local proof is not authority for remote customer-data writes, Provider calls, Payment, webhook resend, Async events, or email.
6. Record normalized counts and states only. Never record credentials, project refs, URLs, customer rows, tokens, or secret values.

### Forward-fix / rollback plan

If apply fails before commit, confirm transaction rollback with read-only migration history and catalog identity. Do not retry without new action-time authority.

After commit, rollback is append-only **Forward-fix** only. Never edit/delete `0017`, repair migration history, or restore the vulnerable `0016` bodies. Prepare a new successor migration from the captured post-state, obtain separate Human review and remote-write authority, then use a newly bounded dry-run/apply sequence. Runtime remains compatible during this process because signatures and caller payloads do not change; if safety is uncertain, suspend the affected worker path operationally under separate authority rather than mutating history.

## Authority ceiling

- Remote Supabase reads/writes in this task: `0/0`
- Real/external Stripe/webhook/Purchase operations: `0/0/0`
- Async events: `0`
- Provider/OpenAI real calls: `0`
- Email sends: `0`
- Deploy/publish/Netlify configuration changes: `0/0/0`
- UX candidate changes/integration: `0/0`
- `release/private-ready` integration: `0`
- `main` change: `0`
