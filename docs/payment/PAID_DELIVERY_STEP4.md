# STEP 4 — Integrated failure E2E

2026-09-09. Local verification only, starting at `c1edf32a8fa3e4f086d833a3842a49c620de9507` on `codex/guidance-quality-final-v19-l5`. STEP 2 V19-L5 Human PASS is retained. This verification does not re-evaluate product adoption or authorize activation.

## System and evidence

The application runner uses real isolated PostgreSQL, service-role SQL/RPC execution through the local PostgREST transport, authenticated Checkout admission and verified-payment recording, Purchase/Grant/Logical Assessment creation, durable dispatch, the Async Workloads event consumer, paid V19-L5 execution, narrow repair and post-verification, canonical completion, owned Account result access, result notification and recovery scheduling. Recovery completion and state transitions are never mocked. Controlled adapters replace external Auth identity, Stripe, AI, queue acceptance and email. The clock and hard-killed child workers are test instrumentation.

New-purchase V19 selection uses the existing local candidate selector. The application's constructor catalog remains V17, exactly as in the current implementation. S12 recovers an immutable V17 purchase through a new application instance whose new-purchase selector is V19. The purchased contract selects the executor; the test does not spoof runtime identity or silently upgrade the old purchase. V19-L5 is prompt bundle v23 / schema set v9; V17 retains prompt bundle v17.

The V19 fake outputs embed the previously authored L5 repair fixture and its provenance hashes. S08 exercises its accepted narrow repair contract; S09 leaves the post-repair fact check failed. These are deterministic integration inputs, not new Blind QA or another quality candidate. S10 runs the actual OpenAI SDK and production transport with only HTTP fetch replaced: invalid schema/configuration is a permanent block; reviewed compatible configuration resumes the same purchase. Actual transmitted schemas have no nested `$defs`, resolve all local references and retain the normalized semantic graph.

Per-scenario before/after snapshots, immutable identities, provider reservations and invocation ledgers, repair counts, recovery transitions, notification acceptance, canonical counts and A–L assertions are in `evals/paid-delivery-step4/S01.json` through `S19.json`. S20 is `migration-verification.json`. `application-results.json` binds the exact source bytes observed before and after the final application run. `final-verification.json` independently checks all 20 results, current source hashes, migration hashes and preservation of the pre-existing untracked artifacts and other worktrees.

## Execution

```powershell
node scripts/run-paid-delivery-step4-offline.mjs scripts/verify-paid-delivery-step4.mjs
node scripts/run-paid-delivery-step4-offline.mjs scripts/verify-paid-delivery-step4-migration.mjs
node scripts/verify-paid-delivery-step4-evidence.mjs
```

The offline wrapper removes inherited service settings, prevents dotenv secrets from loading and blocks non-loopback network access. A successful wrapper asserts zero attempted external connections. No real OpenAI, Stripe, Resend or Discord operation is required to prove these local state transitions.

## Boundaries and migration limits

The recovery scanner's one-second due marker is crossed using the controlled clock. A hosted deployment may dispatch on its next cron tick; this test does not establish wall-clock latency or a public SLA. Existing policy remains fast retry 8, delayed retry 5–60 minutes plus at most 60 seconds jitter, active Provider reservations 2, cumulative calls 24 / reserved AI cost $2, recovery horizon 24 hours, lease 16 minutes, delay detection 15 minutes and operator review deadline 1 hour. Reserved cost is conservative local budget accounting, not an actual provider invoice.

S19 includes both same-purchase worker/scheduler competition and three separate purchased obligations competing for the two active Provider reservations. The third is denied before reaching the Provider boundary and is subsequently rediscovered and delivered.

S20 imports valid existing rows using the actual pre-0033 schema and foreign keys, preserves the V17 report and stage evidence, then applies 0033–0035 as a non-superuser installer. Each migration is deliberately failed before commit, rolled back and retried. Fresh installation, upgrade, service-role grants, RLS and ACL restrictions are also exercised. The upgraded real application recovers the old report with zero additional Provider calls. Transaction rollback before commit is verified. There is no verified destructive down migration after commit: application rollback must retain the additive schema and durable obligations. Production migration execution and operational rollback remain STEP 5 planning matters.

Financial resolution in S16 is a synthetic local entry in the existing delivery-blocking ledger. It prevents the late worker's customer publication and is not overwritten. No refund, financial ingestion expansion or F014 implementation is included. In S15 Account delivery remains available while email fails; only notification retries, retaining the original report, payload and idempotency key.

Hosted scheduler execution, Netlify queue/router acceptance, real provider schema acceptance and availability, real email delivery, deployed secrets/configuration and live financial synchronization remain UNKNOWN. The test invokes the recovery scheduler application; it does not run unrelated hosted measurement/operator lanes. Existing notification/operator migration regressions are verified separately in S20. No Production read or write, push, deploy, remote migration or customer-data operation is performed.

## Defects and changes

No Production implementation defect has been established in STEP 4. Changes are confined to test runners, fixtures, local instrumentation and STEP 4 evidence/documentation. The development integration runs reached PASS for S01–S19 but failed the source-freeze guard because test assertions and invocation telemetry were being strengthened during execution; they are not final release evidence. The final frozen run is the authority.

Test-only corrections cover fixture import ordering/trigger-generated rows, notification success counting across owners, saved-report hash and selected-run equality, actual fake Provider execution before unknown-outcome kill, child-worker invocation telemetry distinct from conservative budget reservations, payment-event replay after budget exhaustion and the cross-purchase concurrency limit. They do not change Product, V19 quality or Recovery policy. Final disposition and scenario matrix are recorded in `evals/paid-delivery-step4/README.md` after evidence verification.
