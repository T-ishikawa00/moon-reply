import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { ErrorDoNotRetry, ErrorRetryAfterDelay } = await import(
  "@netlify/async-workloads"
);
const { ProductionPaymentDeliveryApplication } = await import(
  "../lib/payment/production/application.ts"
);
const {
  FakeCheckoutProviderV1,
  FakePaymentDeliveryRepository,
  FakeProductionFulfillmentDispatcherV1,
  FakeProductionGrantProcessorV1,
} = await import("../lib/payment/production/fakes.ts");
const { UnconfiguredTransactionalEmailAdapterV1 } = await import(
  "../lib/payment/production/transactional-email.ts"
);
const { hashPaymentCapability } = await import(
  "../lib/payment/production/crypto.ts"
);
const {
  processProductionFulfillmentWorkloadEvent,
  PRODUCTION_FULFILLMENT_MAX_RETRIES,
} = await import("../lib/payment/production/async-workloads-worker.ts");

const root = process.cwd();
const read = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");
const migration = read(
  "supabase/migrations/0016_m1_4_background_fulfillment_durability.sql",
);
const fixture = read(
  "supabase/tests/m1_4_background_fulfillment_durability_r1.sql",
);
const expandLegacySeed = read(
  "supabase/tests/m1_4_background_fulfillment_expand_legacy_seed_r1.sql",
);
const expandCompatibility = read(
  "supabase/tests/m1_4_background_fulfillment_expand_compatibility_r1.sql",
);
const ea4RuntimeVerifier = read(
  "scripts/verify-m1-4-background-fulfillment-expand-ea4-runtime.mjs",
);
const paymentApplication = read("lib/payment/production/application.ts");
const paymentRepository = read("lib/payment/production/supabase-repository.ts");
const lifecycleApplication = read("lib/assessment/production/application.ts");
const lifecycleRepository = read(
  "lib/assessment/production/supabase-repository.ts",
);
const asyncAdapter = read("lib/payment/production/async-workloads.ts");
const workloadLogic = read(
  "lib/payment/production/async-workloads-worker.ts",
);
const workloadPath =
  "netlify/functions/production-fulfillment-background.mts";
const workload = read(workloadPath);
const statusRoute = read("app/api/payments/status/route.ts");
const statusUi = read("components/payment/PurchaseReturnStatus.tsx");

let passed = 0;
function check(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

async function checkRuntime(name, callback) {
  await callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function ids() {
  let index = 100;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

function runtimeHarness() {
  let clock = "2026-08-23T00:00:00.000Z";
  const repository = new FakePaymentDeliveryRepository();
  const grantProcessor = new FakeProductionGrantProcessorV1(repository);
  const fulfillmentDispatcher = new FakeProductionFulfillmentDispatcherV1();
  const statusCapability = Buffer.alloc(32, 143).toString("base64url");
  const purchaseIntentId = "91000000-0000-4000-8000-000000000001";
  const jobId = "92000000-0000-4000-8000-000000000001";
  repository.intents.set(purchaseIntentId, {
    id: purchaseIntentId,
    preparationId: "93000000-0000-4000-8000-000000000001",
    verifiedEmailAuthorityId: null,
    trustedEmailSessionId: null,
    customerOwnershipBindingId: null,
    deliveryAuthorityReference: `purchase-delivery:${purchaseIntentId}`,
    emailCiphertext: "synthetic-offline-ciphertext",
    expectedProductCode: "moon-reply-assessment-note-v1",
    expectedAmount: 980,
    currency: "jpy",
    purchaseKind: "one_time",
    environment: "test",
    provider: "stripe",
    state: "verified",
    currentPaymentAttemptId: null,
    successfulPaymentId: "94000000-0000-4000-8000-000000000001",
    statusCapabilityHash: hashPaymentCapability(
      statusCapability,
      "purchase-status",
    ),
    finalConfirmationAcceptedAt: clock,
    createdAt: clock,
    updatedAt: clock,
  });
  repository.jobs.set(jobId, {
    id: jobId,
    purchaseIntentId,
    verifiedPaymentId: "94000000-0000-4000-8000-000000000001",
    preparationId: "93000000-0000-4000-8000-000000000001",
    deliveryAuthorityReference: `purchase-delivery:${purchaseIntentId}`,
    state: "pending",
    ownerId: null,
    leaseExpiresAt: null,
    attemptCount: 0,
    grantId: null,
    logicalAssessmentId: null,
    lastErrorCode: null,
    completedAt: null,
  });
  const application = new ProductionPaymentDeliveryApplication({
    repository,
    checkoutProvider: new FakeCheckoutProviderV1(),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor,
    fulfillmentDispatcher,
    policy: {
      challengeTtlSeconds: 600,
      trustedSessionTtlSeconds: 86_400,
      maximumVerificationAttempts: 3,
    },
    environment: "test",
    siteOrigin: "https://moon-reply.test",
    payPayEnabled: false,
    verificationPepper: "offline-verification-pepper-000000000001",
    emailEncryptionKey: Buffer.alloc(32, 71).toString("base64"),
    purchaseStatusSigningSecret: "offline-status-secret-000000000000001",
    fulfillmentLeaseSeconds: 120,
    now: () => clock,
    uuid: ids(),
    capability: () => Buffer.alloc(32, 99).toString("base64url"),
    verificationCode: () => "12345678",
  });
  const dependencies = {
    processJob: (id) => application.processFulfillmentJobById(id),
    quarantineAfterRetryExhaustion: (id) =>
      application.quarantineFulfillmentJobAfterAsyncRetryExhaustion(id),
  };
  return {
    application,
    dependencies,
    fulfillmentDispatcher,
    grantProcessor,
    jobId,
    repository,
    statusCapability,
    setClock(value) {
      clock = value;
    },
  };
}

function workloadEvent(run, attempt) {
  return { attempt, eventData: { jobId: run.jobId } };
}

check("0016 is one append-only transaction without apply-time row rewrite", () => {
  assert.equal((migration.match(/^begin;$/gmu) ?? []).length, 1);
  assert.equal((migration.match(/^commit;$/gmu) ?? []).length, 1);
  assert.doesNotMatch(migration, /\b(?:drop\s+table|truncate|delete\s+from)\b/iu);
  assert.match(migration, /production_logical_assessments_lease_owner[\s\S]*?not valid/iu);
  assert.match(migration, /production_notification_outbox_lease_owner[\s\S]*?not valid/iu);
  assert.match(migration, /lease_expires_at is null[\s\S]*?status = 'generating'/iu);
  assert.match(migration, /lease_expires_at is null[\s\S]*?status = 'processing'/iu);
});

check("0016 preserves legacy v1 functions and isolates the new runtime on v2", () => {
  for (const name of [
    "claim_production_fulfillment_v1",
    "mark_production_generation_started_v1",
    "complete_production_fulfillment_v1",
    "fail_production_fulfillment_v1",
    "claim_rc2_fulfillment_job_v1",
    "claim_rc2_fulfillment_job_by_id_v1",
    "complete_rc2_fulfillment_job_v1",
    "fail_rc2_fulfillment_job_v1",
    "claim_production_notification_v1",
    "complete_production_notification_v1",
    "fail_production_notification_v1",
  ]) {
    assert.doesNotMatch(
      migration,
      new RegExp(`create(?: or replace)? function public\\.${name}`, "u"),
    );
  }
  assert.doesNotMatch(
    lifecycleRepository,
    /(?:claim|mark|complete|fail)_production_(?:fulfillment|generation_started|notification)_v1/u,
  );
  assert.doesNotMatch(
    paymentRepository,
    /(?:claim|complete|fail)_rc2_fulfillment_(?:dispatch|job(?:_by_id)?)_v1/u,
  );
  assert.doesNotMatch(
    paymentRepository,
    /quarantine_rc2_fulfillment_job_after_async_retries_v1/u,
  );
});

check("logical ownership is a bounded fenced lease", () => {
  assert.match(migration, /claim_production_fulfillment_v2/iu);
  assert.match(migration, /heartbeat_production_fulfillment_v2/iu);
  assert.match(migration, /lease_expires_at > p_now/iu);
  assert.match(migration, /lease_expires_at <= p_now/iu);
  assert.match(migration, /locked\.owner_id <> p_owner_id/iu);
  assert.match(lifecycleRepository, /claim_production_fulfillment_v2/u);
  assert.match(lifecycleApplication, /fulfillmentLeaseSeconds/u);
});

check("pre-provider crash is recoverable but post-provider ambiguity is not rerun", () => {
  assert.match(migration, /PRODUCTION_WORKER_CRASH_BEFORE_PROVIDER/gu);
  assert.match(migration, /PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS/gu);
  assert.match(
    migration,
    /logical_request_id is distinct from locked_run\.request_id/u,
  );
  assert.match(migration, /recovery_state = 'manual_review'/u);
  assert.match(migration, /'automatic_rerun', false/u);
  assert.match(lifecycleApplication, /PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS/u);
  assert.doesNotMatch(migration, /attempt_number\s*=/iu);
});

check("PB-04/PB-05 completed plus PB-06 processing is a first-class fixture", () => {
  assert.match(fixture, /PB-04'[\s\S]*?'completed'/u);
  assert.match(fixture, /PB-05'[\s\S]*?'completed'/u);
  assert.match(fixture, /PB-06'[\s\S]*?'processing'/u);
  assert.match(fixture, /PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS/u);
  assert.match(fixture, /attempt_after <> 1/u);
});

check("dispatch has idempotency, cooldown, lease, and fencing", () => {
  for (const name of [
    "claim_rc2_fulfillment_dispatch_v2",
    "complete_rc2_fulfillment_dispatch_v2",
    "fail_rc2_fulfillment_dispatch_v2",
  ]) {
    assert.match(migration, new RegExp(name, "u"));
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${name}`, "u"),
    );
  }
  assert.match(migration, /dispatch_owner_id uuid/u);
  assert.match(migration, /dispatch_lease_expires_at timestamptz/u);
  assert.match(migration, /dispatch_retry_after timestamptz/u);
  assert.match(migration, /dispatch_attempt_count integer not null default 0/u);
  assert.match(paymentApplication, /claimFulfillmentDispatch/u);
  assert.match(paymentApplication, /completeFulfillmentDispatch/u);
  const jobFailure = migration.slice(
    migration.indexOf("create function public.fail_rc2_fulfillment_job_v2"),
    migration.indexOf(
      "create function public.quarantine_rc2_fulfillment_job_after_async_retries_v2",
    ),
  );
  assert.doesNotMatch(jobFailure, /dispatch_completed_at|dispatch_retry_after/u);
  assert.match(
    migration,
    /quarantine_rc2_fulfillment_job_after_async_retries_v2/u,
  );
  assert.match(
    migration,
    /PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED/u,
  );
});

check("status is observation plus bounded dispatch, never the AI executor", () => {
  const statusMethod = paymentApplication.slice(
    paymentApplication.indexOf("async processPurchaseStatus("),
    paymentApplication.indexOf("async processAuthenticatedPurchaseStatus("),
  );
  assert.match(statusMethod, /requestFulfillmentDispatch/u);
  assert.match(statusMethod, /recoverCompletedProductionAssessmentGrant/u);
  assert.doesNotMatch(statusMethod, /processClaimedFulfillmentJob/u);
  assert.doesNotMatch(statusMethod, /\.fulfillProductionAssessmentGrant/u);
  assert.doesNotMatch(statusRoute, /processProductionFulfillmentJobById/u);
  assert.match(statusUi, /この画面を閉じても大丈夫です/u);
  assert.match(statusUi, /confirmation_pending/u);
});

check("same-site Async Workloads payload is a job-only claim check", () => {
  assert.match(workloadPath, /-background\.mts$/u);
  assert.match(
    asyncAdapter,
    /new AsyncWorkloadsClient<ProductionFulfillmentJobEvent>\(\)/u,
  );
  assert.doesNotMatch(asyncAdapter, /AWL_API_KEY|DEPLOY_URL|process\.env\.URL/u);
  assert.doesNotMatch(asyncAdapter, /baseUrl\s*:|apiKey\s*:/u);
  assert.match(workload, /asyncWorkloadFn/u);
  assert.match(workload, /payment\/production\/worker-service\.ts/u);
  assert.doesNotMatch(workload, /payment\/production\/service\.ts/u);
  assert.match(workloadLogic, /event\.attempt >= PRODUCTION_FULFILLMENT_MAX_RETRIES/u);
  assert.match(workloadLogic, /ErrorRetryAfterDelay/u);
  assert.match(
    workloadLogic,
    /ErrorDoNotRetry\("PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS"\)/u,
  );
});

check("duplicate work cannot steal active jobs or amplify Provider execution", () => {
  assert.match(migration, /job\.state = 'processing' and job\.lease_expires_at > p_now/u);
  assert.match(migration, /'disposition', 'in_progress'/u);
  assert.match(migration, /attempt_count = attempt_count \+ 1/u);
  assert.match(workloadLogic, /outcome\.status === "in_progress"/u);
});

check("notification delivery remains independently leased and retryable", () => {
  assert.match(migration, /claim_production_notification_v2/u);
  assert.match(migration, /heartbeat_production_notification_v2/u);
  assert.match(workloadLogic, /outcome\.notificationPending/u);
  assert.match(workloadLogic, /outcome\.notificationManualReview/u);
  assert.match(workloadLogic, /PRODUCTION_NOTIFICATION_MANUAL_REVIEW/u);
  assert.match(
    paymentApplication,
    /The durable RC-1 outbox and Async Workloads retry this independently/u,
  );
});

await checkRuntime("Scenario A: accepted Event A survives unlimited status observation", async () => {
  const run = runtimeHarness();
  const first = await run.application.processPurchaseStatus(run.statusCapability);
  assert.deepEqual(first, { status: "preparing_assessment" });
  for (let index = 0; index < 8; index += 1) {
    assert.deepEqual(
      await run.application.processPurchaseStatus(run.statusCapability),
      { status: "preparing_assessment" },
    );
  }
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 0);
});

await checkRuntime("Scenario B: Event A alone owns temporary-failure retry", async () => {
  const run = runtimeHarness();
  await run.application.processPurchaseStatus(run.statusCapability);
  run.grantProcessor.fulfillmentFailuresRemaining = 1;
  await assert.rejects(
    () =>
      processProductionFulfillmentWorkloadEvent(
        workloadEvent(run, 0),
        run.dependencies,
      ),
    /PRODUCTION_FULFILLMENT_RETRYABLE_FAILURE/u,
  );
  assert.equal(run.repository.jobs.get(run.jobId).state, "retryable");
  assert.equal(run.repository.dispatches.get(run.jobId).completedAt !== null, true);
  assert.deepEqual(
    await run.application.processPurchaseStatus(run.statusCapability),
    { status: "preparing_assessment" },
  );
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  await processProductionFulfillmentWorkloadEvent(
    workloadEvent(run, 1),
    run.dependencies,
  );
  assert.equal(run.repository.jobs.get(run.jobId).state, "completed");
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
});

await checkRuntime("Scenario C: duplicate invocation cannot steal an active worker", async () => {
  const run = runtimeHarness();
  await run.application.processPurchaseStatus(run.statusCapability);
  const claimed = await run.repository.claimFulfillmentJobById({
    jobId: run.jobId,
    ownerId: "95000000-0000-4000-8000-000000000001",
    leaseExpiresAt: "2026-08-23T00:02:00.000Z",
    now: "2026-08-23T00:00:00.000Z",
  });
  assert.equal(claimed.disposition, "acquired");
  await assert.rejects(
    () =>
      processProductionFulfillmentWorkloadEvent(
        workloadEvent(run, 0),
        run.dependencies,
      ),
    (error) => error instanceof ErrorRetryAfterDelay,
  );
  assert.equal(run.grantProcessor.providerInvocationCalls, 0);
  assert.equal(run.repository.jobs.get(run.jobId).attemptCount, 1);
});

await checkRuntime("Scenario C2: active worker makes status observation-only", async () => {
  const run = runtimeHarness();
  const claimed = await run.repository.claimFulfillmentJobById({
    jobId: run.jobId,
    ownerId: "95000000-0000-4000-8000-000000000003",
    leaseExpiresAt: "2026-08-23T00:02:00.000Z",
    now: "2026-08-23T00:00:00.000Z",
  });
  assert.equal(claimed.disposition, "acquired");
  assert.deepEqual(
    await run.application.processPurchaseStatus(run.statusCapability),
    { status: "preparing_assessment" },
  );
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 0);
  assert.equal(run.grantProcessor.providerInvocationCalls, 0);
  assert.equal(run.repository.jobs.get(run.jobId).attemptCount, 1);
});

await checkRuntime("Scenario C3: direct worker failure cannot create Event B", async () => {
  const run = runtimeHarness();
  const ownerId = "95000000-0000-4000-8000-000000000004";
  const claimed = await run.repository.claimFulfillmentJobById({
    jobId: run.jobId,
    ownerId,
    leaseExpiresAt: "2026-08-23T00:02:00.000Z",
    now: "2026-08-23T00:00:00.000Z",
  });
  assert.equal(claimed.disposition, "acquired");
  await run.repository.failFulfillmentJob({
    jobId: run.jobId,
    ownerId,
    errorCode: "SYNTHETIC_DIRECT_WORKER_FAILURE",
    now: "2026-08-23T00:00:01.000Z",
  });
  assert.deepEqual(
    await run.application.processPurchaseStatus(run.statusCapability),
    { status: "preparing_assessment" },
  );
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 0);
  assert.equal(run.repository.jobs.get(run.jobId).state, "manual_review");
  assert.equal(
    run.repository.jobs.get(run.jobId).lastErrorCode,
    "PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS",
  );
});

await checkRuntime("Scenario D: retry exhaustion becomes confirmation pending", async () => {
  const run = runtimeHarness();
  await run.application.processPurchaseStatus(run.statusCapability);
  await assert.rejects(
    () =>
      processProductionFulfillmentWorkloadEvent(
        workloadEvent(run, PRODUCTION_FULFILLMENT_MAX_RETRIES),
        run.dependencies,
      ),
    (error) =>
      error instanceof ErrorDoNotRetry &&
      error.message === "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED",
  );
  const job = run.repository.jobs.get(run.jobId);
  assert.equal(job.state, "manual_review");
  assert.equal(
    job.lastErrorCode,
    "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED",
  );
  assert.deepEqual(
    await run.application.processPurchaseStatus(run.statusCapability),
    { status: "confirmation_pending", paymentVerified: true },
  );
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 0);
});

await checkRuntime("Scenario D2: retry exhaustion preserves an active fence", async () => {
  const run = runtimeHarness();
  await run.application.processPurchaseStatus(run.statusCapability);
  const ownerId = "95000000-0000-4000-8000-000000000002";
  const claimed = await run.repository.claimFulfillmentJobById({
    jobId: run.jobId,
    ownerId,
    leaseExpiresAt: "2026-08-23T00:02:00.000Z",
    now: "2026-08-23T00:00:00.000Z",
  });
  assert.equal(claimed.disposition, "acquired");
  await assert.rejects(
    () =>
      processProductionFulfillmentWorkloadEvent(
        workloadEvent(run, PRODUCTION_FULFILLMENT_MAX_RETRIES),
        run.dependencies,
      ),
    (error) =>
      error instanceof ErrorDoNotRetry &&
      error.message === "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED",
  );
  const activeJob = run.repository.jobs.get(run.jobId);
  assert.equal(activeJob.state, "processing");
  assert.equal(activeJob.ownerId, ownerId);
  assert.equal(
    activeJob.lastErrorCode,
    "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED",
  );
  assert.deepEqual(
    await run.application.processPurchaseStatus(run.statusCapability),
    { status: "confirmation_pending", paymentVerified: true },
  );
  await run.repository.failFulfillmentJob({
    jobId: run.jobId,
    ownerId,
    errorCode: "FAKE_ACTIVE_WORKER_FAILURE",
    now: "2026-08-23T00:00:30.000Z",
  });
  const failedJob = run.repository.jobs.get(run.jobId);
  assert.equal(failedJob.state, "manual_review");
  assert.equal(
    failedJob.lastErrorCode,
    "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED",
  );
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 0);
});

await checkRuntime("Scenario E: completed Event A is never dispatched again", async () => {
  const run = runtimeHarness();
  await run.application.processPurchaseStatus(run.statusCapability);
  await processProductionFulfillmentWorkloadEvent(
    workloadEvent(run, 0),
    run.dependencies,
  );
  for (let index = 0; index < 4; index += 1) {
    assert.deepEqual(
      await run.application.processPurchaseStatus(run.statusCapability),
      { status: "completed_check_verified_email" },
    );
  }
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
});

await checkRuntime("accepted-router persistence ambiguity cannot create Event B", async () => {
  const run = runtimeHarness();
  run.repository.dispatchCompletionFailuresRemaining = 1;
  assert.deepEqual(
    await run.application.processPurchaseStatus(run.statusCapability),
    { status: "temporary_problem", retryable: true },
  );
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  assert.equal(run.fulfillmentDispatcher.attempts.length, 1);
  run.setClock("2026-08-23T00:01:00.000Z");
  await run.application.processPurchaseStatus(run.statusCapability);
  assert.deepEqual(
    await run.application.processPurchaseStatus(run.statusCapability),
    { status: "confirmation_pending", paymentVerified: true },
  );
  const job = run.repository.jobs.get(run.jobId);
  assert.equal(job.state, "manual_review");
  assert.equal(
    job.lastErrorCode,
    "PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS",
  );
  assert.equal(run.fulfillmentDispatcher.jobIds.length, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 0);
});

check("disposable proof is synthetic, rollback-only, and provider-free", () => {
  assert.match(fixture, /create temp table pg_temp\./u);
  assert.match(fixture, /^rollback;$/mu);
  assert.doesNotMatch(fixture, /https?:\/\//iu);
  assert.doesNotMatch(fixture, /openai|provider raw|customer@example/iu);
});

check("expand proof executes exact legacy and v2 contracts across A-H", () => {
  assert.match(expandLegacySeed, /after 0002-0015 and before 0016/u);
  assert.match(expandLegacySeed, /legacy_function_defs/u);
  assert.match(expandCompatibility, /PASS A\/H/u);
  assert.match(expandCompatibility, /PASS B/u);
  assert.match(expandCompatibility, /PASS C/u);
  assert.match(expandCompatibility, /PASS D/u);
  assert.match(expandCompatibility, /PASS E/u);
  assert.match(expandCompatibility, /PASS F/u);
  assert.match(expandCompatibility, /PASS G/u);
  assert.match(expandCompatibility, /^rollback;$/mu);
  assert.match(
    ea4RuntimeVerifier,
    /ea4acd5d3620fb546e5cf7bc0d1f7db414c54ebc/u,
  );
  assert.match(ea4RuntimeVerifier, /M1_4_LOCAL_SUPABASE_SECRET_KEY/u);
  assert.doesNotMatch(ea4RuntimeVerifier, /OPENAI_API_KEY|AWL_API_KEY/u);
});

console.log(`M1-4 BACKGROUND FULFILLMENT DURABILITY PASS ${passed}/${passed}`);
console.log("REAL_PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 MIGRATIONS_APPLIED_REMOTE=0");
