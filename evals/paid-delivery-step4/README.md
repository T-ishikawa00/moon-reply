# STEP 4 — Integrated Failure E2E: final report

2026-09-09. **20/20 PASS. Ready for STEP 5 production release planning only.**

The tested application source is based on `c1edf32a8fa3e4f086d833a3842a49c620de9507`, branch `codex/guidance-quality-final-v19-l5`. The final application run kept all source bytes unchanged. Exact source hashes and independent verification are in [final-verification.json](final-verification.json), [application-results.json](application-results.json) and [migration-verification.json](migration-verification.json). Final local commit identity is reported in the task response; these files retain their actual execution HEAD and hashes.

## 1. Mandatory scenario matrix

Provider counts below mean actual paid PB-04/PB-05/PB-06 boundary invocations, including failed requests and repair. Prepayment calls are retained separately in each ledger. Reserved USD is conservative durable budget accounting, not real cost or billing. S20 counts are additions during post-upgrade recovery. All rows have additional charge count 0. Delivery and notification counts are per original purchase.

| ID | Scenario | Result | Final state | Provider | Repair | Canonical delivery | Accepted notification | Reserved USD |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| [S01](S01.json) | Normal V19-L5 happy path | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S02](S02.json) | Provider temporary failure | PASS | completed | 5 | 0 | 1 | 1 | 0.51364 |
| [S03](S03.json) | Eight fast retries exhausted | PASS | completed | 5 | 0 | 1 | 1 | 0.51364 |
| [S04](S04.json) | Queue dispatch loss | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S05](S05.json) | Worker hard kill | PASS | completed | 3 | 0 | 1 | 1 | 0.415035 |
| [S06](S06.json) | Valid report persisted then crash | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S07](S07.json) | Unknown Provider outcome | PASS | completed | 4 | 0 | 1 | 1 | 0.421082 |
| [S08](S08.json) | Repairable V19-L5 fact defect | PASS | completed | 5 | 1 | 1 | 1 | 0.516871 |
| [S09](S09.json) | Unrepairable material defect | PASS | manual_review | 5 | 1 | 0 | 0 | 0.516871 |
| S10（参照原本はPrivate保全・候補には非同梱） | Schema/config compatibility recovery | PASS | completed | 4 | 0 | 1 | 1 | 0.415035 |
| [S11](S11.json) | Cumulative AI budget exhausted | PASS | manual_review | 20 | 0 | 0 | 0 | 1.9721 |
| [S12](S12.json) | Old V17 purchase after V19 selector switch | PASS | completed | 4 | 0 | 1 | 1 | 0.376705 |
| [S13](S13.json) | New V19-L5 purchase | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S14](S14.json) | Old and new worker completion race | PASS | completed | 4 | 0 | 1 | 1 | 0.429603 |
| [S15](S15.json) | Notification failure preserves Account result | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S16](S16.json) | Financial resolution and late worker race | PASS | manual_review | 3 | 0 | 0 | 0 | 0.31643 |
| [S17](S17.json) | Browser abandonment | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S18](S18.json) | Scheduler outage and restart | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S19](S19.json) | Concurrent schedulers and workers | PASS | completed | 3 | 0 | 1 | 1 | 0.31643 |
| [S20](migration-verification.json) | Migration upgrade compatibility | PASS | completed | 0 | 0 | 1 | 1 | 0.000702 retained |

S19 also includes three separate paid purchases: at most two active Provider reservations, the third reaches no Provider before capacity returns, then all three deliver once. S09, S11 and S16 intentionally retain a reason, owner and review deadline in `manual_review`; they are not falsely labelled delivered. All recoverable scenarios reach delivery.

## 2. Invariants A–L

- Additional economic charge 0; original Purchase, verified payment, Grant and Logical Assessment remain authoritative.
- Canonical customer-visible report and delivery at most 1 per purchase. Internal run/report records are not counted as additional customer delivery.
- A saved valid report survives restart unchanged, becomes the canonical report and causes no additional generation. Notification retries retain the canonical run/hash, payload and idempotency key; accepted notification count stays 1.
- Material defect publication 0; financial-blocked late publication 0. The existing financial ledger is not overwritten.
- Cumulative reservations and cost never decrease or reset. S11 reaches the real $2 guard after 20 failed paid calls, retains $1.9721 and stops the next call; application restart and replay of the same payment cannot replace the exhausted job.
- Queue disappearance, worker death and scheduler absence do not remove the DB obligation. Every processing owner has a finite lease; operator-required records have owner/reason/deadline. Public state and owned Account access agree with durable state. Another customer cannot resolve the result.
- Purchased V17 and V19-L5 authority hashes and runtime contracts remain distinct.

## 3. Actual defects found/fixed

Production technical defects found: **0**. Unresolved data-integrity defects found: **0**. Production source and migrations changed: **0**.

Test-only corrections strengthened evidence: valid legacy fixture insertion with active constraints/triggers, immutable saved-report hashes, notification success counts across owners, actual external fake completion before unknown-outcome worker kill, child-worker invocation telemetry, separation of prepayment calls from paid calls, duplicate-payment budget retention and cross-purchase concurrency. Development runs passed the scenarios but their source-freeze guards rejected them while instrumentation was edited. They are retained as development logs, not final PASS authority. No Product, quality candidate, recovery policy or scope was changed.

## 4. Migration verification

Actual PostgreSQL: fresh setup; valid pre-0033 rows; non-superuser installer; each 0033/0034/0035 partial failure before commit, rollback and safe retry; runtime/service role; RLS/GRANT. Existing authority regression: 32 functional checks and 72 runtime permission probes, all PASS. Post-upgrade application recovery retains the old V17 report, stage records, financial rows and cumulative budget, then delivers with Provider additions 0 and notification acceptance 1. Replaying the worker adds neither delivery nor notification.

Rollback before commit is verified. No destructive down migration after committed data is implemented or claimed. Application rollback must retain additive schema, immutable evidence and unfinished obligations; operational rollout/rollback planning belongs to STEP 5.

## 5. Contract/version behavior

New-purchase test selection is V19-L5 (prompt bundle v23, schema set v9). The Production constructor catalog stays V17. Recovery selects the executor from the immutable purchased authority; the same new application instance recovers old V17 without silent upgrade or identity spoofing. S10 uses the actual production OpenAI transport and SDK with fake HTTP: permanent schema/config rejection stops repeated requests; reviewed compatible configuration resumes. All transmitted local schemas have nested `$defs` count 0, resolved references and preserved semantic graphs.

## 6. Financial and notification behavior

S16 inserts only a synthetic local existing financial block and holds the late worker. Customer publication stays 0 and the financial state remains unchanged; there is no actual refund or F014 expansion. S15 exposes the completed report through Account while email fails, then retries notification alone with AI regeneration 0 and unchanged canonical report/payload/key.

## 7. Remaining UNKNOWN external facts

Actual OpenAI service/schema acceptance and availability, hosted Netlify scheduler/router/queue behavior and latency, real Resend delivery, deployed flags/secrets, remote schema parity and live financial synchronization are UNKNOWN. The controlled scheduler clock crosses the due marker; this is not a hosted timing/SLA claim. Unrelated hosted operator and measurement lanes are not part of the application runner; existing operator/notification migration regressions run separately. No real external E2E was required to establish these local invariants.

## 8. Changes and verification

See [change-manifest.json](change-manifest.json) for the complete added-file list, [source-commit-binding.json](source-commit-binding.json) for tested byte hashes paired with Git blobs and [implementation/evidence guide](../../docs/payment/PAID_DELIVERY_STEP4.md) for the test boundary. New STEP4 runners, fixtures, instrumentation, docs and evidence only. Local commits are permitted; no push.

- Final application log（参照原本はPrivate保全・候補には非同梱）: S01–S19 PASS; offline wrapper PASS, external attempts 0.
- Migration log（参照原本はPrivate保全・候補には非同梱）: S20 PASS; offline wrapper PASS, external attempts 0.
- Independent audit（参照原本はPrivate保全・候補には非同梱）: 20 scenarios, A–L evidence, source binding and all 4,801 protected untracked files PASS.
- Lint（参照原本はPrivate保全・候補には非同梱）: zero errors/warnings. Typecheck（参照原本はPrivate保全・候補には非同梱）: PASS under offline wrapper.

`integration-initial.log`, `integration-instrumentation.log` and `integration-count-audit.log` are rejected development-source snapshots. Focused-run artifacts and historical wrapper metadata are supporting development records only.

## 9. Workspace preservation

Start HEAD and branch are in [preflight.json](preflight.json). All 4,801 pre-existing untracked files retain their SHA256. `C:/tmp/mrexp-e98`, `C:/tmp/mrexp-ea4` and their recorded HEADs remain unchanged. No old checkout/reset, stash operation or unrelated edit occurred. Final HEAD and tracked-clean worktree status are reported after the local commit.

## 10. STEP 5 readiness

Ready for production release planning. This result does not authorize Production connection, migration, secret/config changes, deployment, provider calls, customer notification, refund or activation.

Production changes / push / deploy / remote migration / actual external sends = **0**.

STEP 4 — INTEGRATED FAILURE E2E PASS
READY FOR PRODUCTION RELEASE PLANNING
