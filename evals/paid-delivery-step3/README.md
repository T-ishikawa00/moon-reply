# STEP 3 local recovery evidence

Scope: local implementation on `codex/guidance-quality-final-v19-l5`, starting at `8a1ad2b097f6dccdc21ed88b9dccb70cb046853d`. STEP 2 Human PASS is the current instruction. Historical evaluation output, failures, answers and mappings were not changed. This directory contains only new STEP 3 evidence.

## Execution boundary

`verify-paid-recovery-local.mjs` runs isolated native PostgreSQL 17, the actual payment and fulfillment applications, Supabase repositories and migration RPCs. A loopback HTTP adapter executes SQL as `service_role`; it does not emulate recovery outcomes. External AI, Stripe, email and queue transports are synthetic. Clocks are controlled, and worker-kill cases terminate real child processes. No production reads, production writes, push, deploy, remote migration or real external API calls are authorized or performed.

`local-results.json` is written only after every integrated case passes and affected source hashes remain unchanged throughout the run. `sourceStartSha` identifies the checkout commit at execution start; source hashes identify the uncommitted implementation actually tested. A later commit binding may identify the commit containing those tested bytes without rewriting execution history.

## Required scenario mapping

| Requirement | Expected result and evidence |
| --- | --- |
| 1 Fast retry exhaustion | Eight actual worker attempts, durable delay, Provider recovery, same purchase delivered; cumulative reservations retained. |
| 2 Queue failure | Failed enqueue, real scheduler rediscovery, same purchase delivered. |
| 3 Worker kill | Real process termination during Provider work, lease reclamation and delivery. Additional 3b replays completed PB04 without repeating that Provider stage. |
| 4 Kill after report commit | Recover exact saved report, zero new generation and no extra run. |
| 5 Failed improvement | Earlier verified report survives later failed work and is delivered without regeneration. |
| 6 Schema/config | Permanent error blocks repeated compute; inspected artifact/config resume delivers. Additional 6b uses the actual worker-service configuration failure path. |
| 7 Old/new workers | Hold old PB06 across lease expiry, complete via new owner, release old worker; canonical run/hash remain unchanged. |
| 8 Email failure | Preserve Account/canonical result and recover notification only. Additional 8b covers permanent configuration, old cutover events and reviewed resume. |
| 9 Budget | Stop computation, retain same purchase, owner, reason and review deadline. Migration tests additionally exercise cumulative count/cost/concurrency ceilings. |
| 10 Material defect | Actual repair exhaustion cannot publish an unresolved candidate; durable operator responsibility remains. |
| 11 Contract compatibility | V17, V19-L5 decision-report and V19-L5 message-only purchases retain their own authority and reach delivery; message projection version and draft/opening text remain exact. Additional 11b recovers pre-upgrade V17 evidence without Provider calls; 11c rejects altered historical hashes. Validation-proof tests separately reject an unapproved policy version with a self-consistent digest and a corrupted digest. |
| 12 Financial resolution | Record synthetic legitimate financial resolution while actual worker is held at PB06; late completion cannot publish. |

Every applicable case checks purchase/grant/logical identity, no extra charge, canonical count at most one, input/authority identity and retained report evidence. Success is a committed canonical delivery, not an enqueued event or recovery status.

The adapter test exhaustively splits a Japanese UTF-8 JSON value at every byte boundary. Definitive SQL candidate-integrity errors retain their safe reason and require operator review; unknown database failures retain the transient failure path.

## Verification issues resolved during implementation

- The legacy background verifier's current RPC assertion expected v3 after the runtime moved to v4. Only the current assertion and new fencing expectations changed; historical SQL invariants remained intact.
- Migration ACL probes initially used the pre-legacy-reconstruction attestation signature. The final probe must exercise the actual signature under all tested roles.
- A V19 report mismatch correctly blocked delivery. Diagnosis found the local HTTP adapter decoded each incoming buffer chunk separately, corrupting split Japanese UTF-8 characters. Decode once after buffer concatenation; retain exact SQL report matching and add a split-character regression. No production candidate check is relaxed.
- Final review found that the old notification cutover could retry an operator-blocked email and that completed/email-blocked work escaped the old operator alert query. Worker claim, cutover dispatch and existing operator outbox integration are included in the final verification scope.

## Final result

STEP 3 — LOCAL RECOVERY IMPLEMENTATION COMPLETE

- Integrated actual application/RPC suite: **20/20 PASS**, final command `node scripts/run-remediation-offline.mjs --experimental-transform-types scripts/verify-paid-recovery-local.mjs`, wrapper exit 0, external network attempts 0. See [local-results.json](local-results.json) and [local-verification.log（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md).
- Execution started at `e0f7beb50698d50abb5bacb96bf773d96ebc1f1c` with the implementation still uncommitted. All 49 captured source hashes remained identical during the test. [source-commit-binding.json](source-commit-binding.json) verifies those raw bytes against the blobs committed in `5a674abedd54c4d4cbad57ce51df8e12a9f300d0`; the original execution SHA is not rewritten.
- Migrations 0033–0035: **16 functional cases × 2 installer modes**, **36 runtime permission probes × 2**, plus candidate permission checks within the functional suite. Exact upgrade, interrupted rollback, restricted-owner installation, RLS, budgets, financial serialization, notice recurrence/expiry and immutable sent/ambiguous notices passed. See [migration-verification.log（公開準備候補では詳細記録を非同梱）](../../docs/service-record/EVALUATION_EVIDENCE_SUMMARY.md).
- Typecheck and scoped ESLint passed; offline Production build passed **47/47**. Runtime schema equivalence **21**, actual SDK transport, worker graph, F004 **26/26**, F003 **11/11**, F011 **9/9**, background durability **21/21**, legacy paid quality **4/4** and operator notification **27/27** passed. Message projection server rendering passed using synthetic input with CSS excluded; no visual/Human quality acceptance is inferred.

The final wrapper run supersedes the earlier direct-run evidence as the final integration observation. Earlier diagnostic failures are explained above; no historical STEP 1/2 or Blind QA result was changed. STEP 4 independent integration review and STEP 5 Production application have not run. Live external state remains UNKNOWN. Local Technical PASS does not approve Production adoption of V19-L5, a customer SLA, compensation policy or Provider quality.
