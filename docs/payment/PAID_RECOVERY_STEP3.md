# STEP 3 — Local paid fulfillment recovery

2026-09-09. Start: `codex/guidance-quality-final-v19-l5@8a1ad2b097f6dccdc21ed88b9dccb70cb046853d`.
This task is local implementation and fault verification. STEP 2 Human PASS is the current Human instruction. Prior Hard Gate failures, Human answers, mapping and evaluation evidence remain unchanged. V19-L5 Production adoption is not approved. No external observation was performed; deployed/runtime/remote financial state is UNKNOWN.

## Authority and completion

| Record | Authority |
| --- | --- |
| `production_purchase_intents` + `production_verified_payments` | Server-verified economic purchase. F003 reconciliation remains the entry owner when Stripe may be paid but the application has no verified evidence. Recovery does not infer payment. |
| `production_fulfillment_jobs` | Existing durable unfinished obligation and dispatch outbox, one per verified purchase. Recovery adds scheduling, ownership, review deadline, cumulative reservations and operator evidence here. No second purchase ledger or queue. |
| `production_purchases` / `production_assessment_grants` / `production_logical_assessments` | Same purchase, grant and logical assessment throughout retries. Independent job and generation leases fence workers. |
| `production_preparations` | Immutable consultation input and purchased runtime authority/hash. The active selector cannot overwrite an old purchase's contract. |
| `assessment_runs`, `assessment_stage_runs`, `assessment_reports` | Durable request/stage/checkpoint/report evidence. A report being present or labelled ready is insufficient authority to publish. |
| `production_customer_deliveries` | Canonical customer delivery. Unique logical assessment, matching report validation and live ownership/financial fence are mandatory. Enqueue success is not delivery. |
| `production_notification_outbox` | Independent email obligation. Account delivery survives email errors. Existing F004 immutable credential/payload/idempotency rules remain authoritative. |
| `production_payment_adjustment_ledger` | Recorded financial adjustment/uncertainty blocks delayed delivery. This task does not execute a refund or implement F014 financial ingestion. |

Delivery is complete only after the canonical transaction commits the verified projection, links the original grant/logical assessment, creates result access and notification outbox, and completes the grant. Email acceptance is separately tracked. A queue registration, a recovery row, a Discord alert or a manual-review disposition is never completion.

## Transitions and responsibility

| State / event | Owner and next action |
| --- | --- |
| Verified payment → pending job | Existing payment recording transaction creates the job. Existing dispatch scheduler reads the DB. |
| pending/retryable → processing | Worker acquires job lease, then logical assessment lease. Each provider call reserves durable cumulative budget before invocation. |
| Explicit temporary transport failure | Existing fast retries apply. Exhaustion schedules delayed recovery on the same job; exponential backoff and deterministic jitter are bounded. |
| Timeout or forced process termination | Saved report/checkpoint/request evidence is inspected first. The DB scanner recovers expired leases, independently of catch/finally and event retention. Unknown provider execution remains charged against the reservation. |
| Delayed recovery due | Scheduler reopens the same dispatch outbox atomically with durable recovery intent, then sends the event. Failed or ambiguous enqueue is recoverable from the DB. |
| Schema/config/contract/quality/integrity failure | Operator-required state retains reason, owner and next review deadline. It is not repeatedly sent to the provider. |
| Operator-reviewed artifact | Trusted operator application inspects the job, validates the supported local schemas, hashes the artifact with immutable input/authority identity and records the expected block reason before resuming. Budget is not reset. |
| Canonical complete → notification pending/failed | Scheduler rediscovers email-only work; worker reuses canonical delivery and the F004 payload. No assessment generation. |
| Cumulative count/cost/age limit | Automatic computation stops. Purchase, owner, next review and evidence remain. Financial/customer resolution requires the existing Human-operated support process. |

The event carries a recovery cycle in addition to the job ID. Job claim and exhaustion compare it with DB authority. Late events from an old cycle cannot reschedule or complete a newer owner. Legacy events without a cycle are cycle zero. The scheduler owns long-term recovery; Async Workloads owns short retry delivery only.

## Recovery and candidate acceptance

Priority: canonical delivery → verified completed report for this purchase → compatible durable checkpoint → bounded required generation/repair. No completed artifact requires a new AI invocation simply because notification or dispatch failed.

Acceptance binds Purchase/Customer/Logical Assessment through the existing ownership and grant joins; exact input snapshot and purchased contract/model/schema; completed stage evidence and validation hashes; selected report hash; material finding disposition; and current recorded financial authority. The v17 and candidate v23/schema-v9 executors are explicit supported contracts. No generic all-generation executor is introduced. Production new-purchase selection remains V17.

The validation digest includes the explicit `paid-recovery-validation-v1` policy version. SQL verifies both the submitted proof contents against durable stage evidence and its SHA-256, then persists the proof/version in the new attestation. Canonical completion and legacy insertion paths recheck it; prior stage/report records are preserved.

The strict recovery path rejects unresolved material findings even where historical F007 quality exhaustion could have returned ready. It never rewrites historical outcomes. For pre-migration V17 reports without saved validation input, the actual pipeline reconstructs input using saved outputs and checks every original request/prompt/schema hash and exact completed report equality, with zero Provider calls. Original evidence remains unchanged. Missing or conflicting evidence requires review; old `ready` text alone is not sufficient. Correct earlier artifacts survive failed optional improvements.

Action-dependent reports/checkpoints require the stored action clock to remain in the same local day and within 1 hour. Otherwise they remain a temporal-review case instead of publishing stale relative-date advice. For pre-migration partial runs whose historic upper-bound cost cannot be reconstructed, upgrade conservatively consumes the USD 2 reservation ceiling; completed-report recovery still runs before the computation gate. This is not a claim that unknown historical Provider execution was free.

Provider schema normalization is the STEP 1C semantics-preserving transformation promoted to the actual runtime transport. Canonical schema/snapshot hashes remain unchanged. Local equivalence and execution-path checks are required; no new Blind QA or prompt iteration is authorized.

## Internal recommended settings

| Setting | Recommendation / basis |
| --- | --- |
| Existing worker window | 15 minutes; provider work budget 12 minutes; per-stage timeout180 seconds; lease16 minutes. Existing source limits retained. |
| Fast async retry ceiling | Existing8. This is no longer a lifetime obligation limit. |
| Recovery delay | 5 minutes exponential to60 minutes, plus0–60 seconds deterministic jitter. |
| Scanner | Existing every-minute fulfillment scheduler; bounded4 jobs per scan. Existing F003 reconciliation schedule stays separate. |
| Provider concurrency | 2 across paid work per environment, DB reservations serialized. Expired/unknown holds live at most16 minutes. |
| Lifetime computation | Maximum24 provider calls, conservative USD2 reservations, and24 hours from the original request. Recovering an already-valid report precedes computation limits. |
| Per-call budget | Maximum8192 output tokens; UTF-8 request byte bound plus4096 input overhead; existing repository LUNA price snapshot, no cached discount. This is an internal conservative reservation, not live-price verification. |
| Delay / operator notice | Existing15-minute pending-delivery incident and immediate actionable failure incidents. |
| Operator review | Due within1 hour of recovery entry, recorded on the job. Overdue work remains discoverable; customers can use existing purchase-linked support without payment identifiers. |

These are local implementation recommendations, not a newly published customer SLA or approval to activate settings. No countdown is displayed. Customer UI distinguishes processing, delayed next-processing wait, operator confirmation needed and available delivery. It does not claim that an operator has already begun review.

The existing runtime gates are retained: `PAYMENT_FULFILLMENT_PROCESSING_ENABLED`, `PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED` and `STRIPE_RECONCILIATION_SCHEDULED_ENABLED` require exact `true` when separately authorized for activation. Existing emergency stops remain authoritative. Operator notices use the existing `DISCORD_OPERATOR_NOTIFICATIONS_ENABLED`, pinned `DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM`, webhook configuration and emergency stop. No setting or secret was changed or inspected against Production. Numerical recovery limits are source/SQL policy constants, not newly required environment variables.

## Operator and financial boundary

Use the existing trusted server/credential boundary with `scripts/paid-recovery-operator.mjs` (`--experimental-transform-types`). `inspect` requires an explicit job and expected database origin; `resume` additionally requires the inspected reason, an operator evidence reference and confirmation that repaired configuration was validated. It loads no dotenv and never prints credentials. Resume runs the application/RPC; ordinary operations do not edit state through SQL.

The CLI does not acquire privileges or create temporary roles. Production invocation requires separate Human authorization and existing operator credential provisioning. A resume cannot clear financial evidence or reset cumulative budgets. Catalog/schema validation does not prove an external credential or Provider service is healthy; that remains a separate operational check.

Operator-blocked notifications are gated both at worker claim and at the old notification cutover dispatch. The existing operator outbox receives a distinct recovery-cycle event for a new block and an event when its recorded review deadline is reached. Claim and send-start checks suppress obsolete events after resume or resolution; sent notification identity is never reset. This covers completed canonical deliveries whose email is blocked as well as undelivered purchases. The operational owner remains `fulfillment-operations`, with the concrete reason and deadline available through `inspect`.

Recorded adjustments and canonical insertion lock the same verified-payment row. A pending/unknown/failed adjustment is not silently classified financially healthy. When adjustment evidence commits first, the delayed worker cannot publish; when canonical delivery commits first, later financial handling sees an already-delivered purchase and remains a separate Human decision. No automatic refund is added. External refunds missing from the application ledger are UNKNOWN, not a proven synchronized state. F014 ingestion/remediation and customer compensation choices remain outside this task.

## Local verification and rollout boundary

Verification entry points: `scripts/verify-paid-recovery-local.mjs` (actual application + Supabase repositories + SQL/RPC, fake external providers only), `scripts/verify-paid-recovery-migration.mjs` (upgrade, rollback, installer and runtime authority), and relevant existing regressions. The local SQL HTTP adapter is a test transport, not a production database replacement. It executes real PostgreSQL operations under `service_role`.

`scripts/verify-paid-recovery-transport.mjs` intercepts the actual SDK transport locally, verifies STEP1C semantic equivalence and transmitted normalized schema/output cap, permanent400 vs retryable429, retry0, pre-call reservation and delayed customer presentation. It does not call OpenAI. The legacy background verifier's current RPC-name assertion is updated fromv3 tov4 with additional job-owner/candidate-hash checks; its historical0016/0026 invariants and prior evidence are unchanged.

STEP 3 — LOCAL RECOVERY IMPLEMENTATION COMPLETE

The final offline-wrapper run passed 20/20 integrated cases, including all 12 required scenarios. Cases 1–8 and 11 reached canonical delivery; 9, 10 and 12 stopped computation/publication and retained the required operator/financial responsibility. V17, V19-L5 decision-report and message-only purchases all reached delivery. The 49 affected backend/test source hashes stayed identical during execution and are bound to implementation commit `5a674abedd54c4d4cbad57ce51df8e12a9f300d0` in [the source binding](../../evals/paid-delivery-step3/source-commit-binding.json). [Scenario evidence](../../evals/paid-delivery-step3/local-results.json) and [verification record](../../evals/paid-delivery-step3/README.md) retain the actual execution-start SHA rather than relabeling it as the later commit.

Migrations 0033–0035 passed exact upgrade/rollback and ACL/RLS checks: 16 functional cases and 36 runtime permission probes in each of the superuser-reference and restricted-owner installer modes. Typecheck, scoped lint, guarded build (47/47), runtime schema equivalence (21), actual SDK transport, worker graph, and the relevant F003/F004/F011/background/paid-quality/operator-notification regressions passed. Customer message projection also passed a synthetic server-render check; this is not visual or Human quality acceptance.

Local commits: `e0f7beb` adds the durable scheduling/budget authority; `5a674ab` connects validated delivery, operator followup and local fault verification. The subsequent documentation/evidence commit records this result. Baseline migrations through 0032 and old evaluation evidence remain unchanged.

STEP 4 independent integrated fault review and STEP 5 Production application remain separate and unexecuted. Production selection remains V17. Remote financial completeness, live Provider behavior/pricing, deployed migrations/configuration and actual email/Discord delivery are UNKNOWN. Provider-side duplicate execution is not guaranteed zero; new charges, duplicate grants and multiple canonical deliveries are prevented by the local authority path tested here. Human decisions on activation, operational ownership, compensation and customer SLA remain outstanding. No push/deploy/remote migration, Production connection, real Stripe/OpenAI/email/Discord operation, secret mutation or external privilege escalation was performed.
