# M2-0 Authority / Critical Risk / Current DB Baseline

Status: `technical_execution_complete_pending_human_chatgpt_acceptance`

Execution date: `2026-08-23`

Base authority and current Production source: `release/private-ready@0befd512219eb2897fb1edf969ad37d7e8c56b0d`

Task branch: `codex/m2-0-authority-critical-db-baseline`

This is the first execution task in the existing M2. It does not create a milestone or gate and does not reopen M1.

## M1 True E2E closure record

The following current operational state is recorded from the Human's completed real operation and the read-only authority/catalog checks. M1 remains closed.

| Required fact | Current record | Evidence status |
| --- | --- | --- |
| Production SHA | `0befd512219eb2897fb1edf969ad37d7e8c56b0d` | `CONFIRMED_LIVE` plus exact Git authority/ref check |
| Remote DB | exact migration pairs `0002..0016` | `CONFIRMED_LIVE` by read-only remote catalog |
| Payment | Stripe Sandbox payment completed | `CONFIRMED_LIVE`, Human operational authority |
| Webhook | `checkout.session.completed` returned `200` and payment was verified | `CONFIRMED_LIVE`, Human operational authority |
| Router/runtime | Async Workloads accepted the path | `CONFIRMED_LIVE`, `CONFIRMED_SOURCE` |
| Fulfillment | Background Fulfillment executed | `CONFIRMED_LIVE`, `CONFIRMED_SOURCE` |
| AI | AI result generation completed | `CONFIRMED_LIVE`, Human operational authority |
| Account | Account result became completed/readable | `CONFIRMED_LIVE`, `HUMAN_VISUAL` |
| Email | completed email arrived | `CONFIRMED_LIVE`, Human operational authority |
| Human outcome | Human result read completed | `CONFIRMED_LIVE`, `HUMAN_VISUAL` |

This record closes the missing current overlay. It does not rewrite older documentation that correctly recorded earlier pre-activation states, and it does not imply External Private Beta or Public Launch readiness.

## Canonical artifacts

- Master backlog and immediate execution queue: `docs/m2/M2_MASTER_BACKLOG.md`
- Remote catalog evidence: `docs/m2/M2_0_REMOTE_SUPABASE_CATALOG_EVIDENCE.md`
- Disposable local exploit proof: `docs/m2/M2_0_LOCAL_NULL_FENCING_PROOF.md`
- Next security baseline/checklist: `docs/m2/M2_0_NEXT_SECURITY_BASELINE.md`
- UX selective-port plan: `docs/m2/M2_0_UX_SELECTIVE_PORT_MAP.md`

The current operational overlays are updated only in `docs/CURRENT_FOCUS.md`, `docs/WBS.md`, and `docs/CODEX_HANDOFF.md`. All historical blocks beneath them are retained.

## Remote catalog conclusion

- Read-only remote history is exact `0002..0016` and matches local migration lineage.
- All 24 public tables have RLS enabled, FORCE RLS false, and zero policies. Service-role authority is therefore not constrained by RLS; RPC predicates and table constraints are security-critical.
- All targeted functions are SECURITY INVOKER, owner `postgres`, and EXECUTE is limited to `postgres` and `service_role` in the inspected ACL.
- Legacy v1 and current v2 coexist. Current repository runtime callers use v2; later v1 revocation requires a zero-use inventory and separate remote-write authority.
- Only `production_logical_assessments_lease_owner` and `production_notification_outbox_lease_owner` are NOT VALID. Every other cataloged constraint is validated.
- Targeted remote function bodies/signatures/returns/owner/ACL match authority source. Mismatch count `0`; repair/apply count `0`.

## Local exploit conclusion

Confirmed:

1. `claim_production_fulfillment_v2` accepts a NULL requested lease and mutates the logical assessment to generating with a NULL lease.
2. `complete_production_fulfillment_v2` accepts a NULL caller owner and creates the complete delivery/credential/notification side effects.
3. The same completion accepts a stored NULL lease and creates the same side effects.
4. `claim_production_notification_v2` accepts a NULL requested lease, moves the row to processing, and consumes an attempt.

Rejected as independent blockers because they failed closed with zero side effects:

- fulfillment job and dispatch NULL lease;
- customer ownership NULL customer user ID;
- model completion NULL returned model;
- mismatched non-NULL owner and expired lease for the other completion/failure/notification/job/dispatch paths;
- invalid `mark_production_generation_started_v2` owner/time/fence cases.

Two concurrent logical claims produced one acquired and one in-progress result, not a double claim. Exact valid owner/live-fence controls succeeded.

## Next security conclusion

Current exact lock is Next `16.3.0`, React/React DOM `19.2.7`, Netlify Async Workloads `0.0.92`, and Netlify bundler `15.4.0`; the repository does not pin an exact Netlify Node runtime version. The official 2026-08-26 critical patch version is not yet published. M2-0 changes no dependency. The separate post-publication task must exact-pin the stable patch and run the full App Router, Route Handler, Proxy/Auth, webhook, Account/Result, Async Workloads, build, audit, and protected-runtime-asset checklist.

## UX candidate conclusion

The reference candidate was not integrated. It contains useful A Return, B Purchase Trust, C latency, D review, and F state-contract work, but it also deletes `netlify.toml` and the background runtime-assets verifier. Neither candidate commit may be cherry-picked. Any later port must be manual and ordered F+A, B, D, then independent C, while rejecting all E runtime-asset regressions.

## Exact first implementation task recommendation

Recommend a separate **M2-A1 — NULL Lease / Completion Fence Integrity Hardening** task from the then-current accepted authority.

Minimum bounded scope:

- append one successor migration only after explicit implementation authorization;
- update current v2 logical claim to reject `p_owner_id IS NULL`, `p_lease_expires_at IS NULL`, and non-future lease before mutation;
- update current v2 logical completion to reject `p_owner_id IS NULL`, stored `owner_id IS NULL`, stored `lease_expires_at IS NULL`, mismatch using null-safe comparison, and expired lease before any insert/update;
- update current v2 notification claim to reject NULL owner/lease before mutation;
- retain v1 functions and expand compatibility in this first task;
- prove invalid cases have zero rows/side effects, valid live-fence cases succeed once, and concurrent calls have one winner;
- prepare remote dry-run/apply evidence but do not apply remotely without exact Human action-time confirmation.

No migration is created in M2-0.

## Operation count / authority ceiling

- Remote Supabase reads: catalog/migration metadata only.
- Remote Supabase writes/migration apply: `0`.
- Stripe writes/webhook resend/Purchase: `0`.
- Async event: `0`.
- Provider/OpenAI real call: `0`.
- Deploy/publish/Netlify configuration: `0`.
- UX integration/merge/cherry-pick/selective port: `0`.
- `release/private-ready` integration: `0`.
- `main` change: `0`.

