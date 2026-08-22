import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");
const migration = read(
  "supabase/migrations/0016_m1_4_background_fulfillment_durability.sql",
);
const fixture = read(
  "supabase/tests/m1_4_background_fulfillment_durability_r1.sql",
);
const paymentApplication = read("lib/payment/production/application.ts");
const lifecycleApplication = read("lib/assessment/production/application.ts");
const lifecycleRepository = read(
  "lib/assessment/production/supabase-repository.ts",
);
const asyncAdapter = read("lib/payment/production/async-workloads.ts");
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

check("0016 is one append-only transaction without apply-time row rewrite", () => {
  assert.equal((migration.match(/^begin;$/gmu) ?? []).length, 1);
  assert.equal((migration.match(/^commit;$/gmu) ?? []).length, 1);
  assert.doesNotMatch(migration, /\b(?:drop\s+table|truncate|delete\s+from)\b/iu);
  assert.match(migration, /production_logical_assessments_lease_owner[\s\S]*?not valid/iu);
  assert.match(migration, /production_notification_outbox_lease_owner[\s\S]*?not valid/iu);
});

check("logical ownership is a bounded fenced lease", () => {
  assert.match(migration, /claim_production_fulfillment_v2/iu);
  assert.match(migration, /heartbeat_production_fulfillment_v1/iu);
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
    "claim_rc2_fulfillment_dispatch_v1",
    "complete_rc2_fulfillment_dispatch_v1",
    "fail_rc2_fulfillment_dispatch_v1",
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
  assert.match(asyncAdapter, /AWL_API_KEY_P100/u);
  assert.match(asyncAdapter, /process\.env\.DEPLOY_URL \?\? process\.env\.URL/u);
  assert.match(asyncAdapter, /baseUrl: readAsyncWorkloadsBaseUrl\(\)/u);
  assert.doesNotMatch(asyncAdapter, /console\.|apiKey.*message/iu);
  assert.match(workload, /asyncWorkloadFn/u);
  assert.match(workload, /processProductionFulfillmentJobById/u);
  assert.match(workload, /maxRetries: 8/u);
  assert.match(workload, /ErrorRetryAfterDelay/u);
  assert.match(
    workload,
    /ErrorDoNotRetry\("PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS"\)/u,
  );
});

check("duplicate work cannot steal active jobs or amplify Provider execution", () => {
  assert.match(migration, /job\.state = 'processing' and job\.lease_expires_at > p_now/u);
  assert.match(migration, /'disposition', 'in_progress'/u);
  assert.match(migration, /attempt_count = attempt_count \+ 1/u);
  assert.match(workload, /outcome\.status === "in_progress"/u);
});

check("notification delivery remains independently leased and retryable", () => {
  assert.match(migration, /claim_production_notification_v2/u);
  assert.match(migration, /heartbeat_production_notification_v1/u);
  assert.match(workload, /outcome\.notificationPending/u);
  assert.match(workload, /outcome\.notificationManualReview/u);
  assert.match(workload, /PRODUCTION_NOTIFICATION_MANUAL_REVIEW/u);
  assert.match(
    paymentApplication,
    /The durable RC-1 outbox and Async Workloads retry this independently/u,
  );
});

check("disposable proof is synthetic, rollback-only, and provider-free", () => {
  assert.match(fixture, /create temp table pg_temp\./u);
  assert.match(fixture, /^rollback;$/mu);
  assert.doesNotMatch(fixture, /https?:\/\//iu);
  assert.doesNotMatch(fixture, /openai|provider raw|customer@example/iu);
});

console.log(`M1-4 BACKGROUND FULFILLMENT DURABILITY PASS ${passed}/${passed}`);
console.log("PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 MIGRATIONS_APPLIED_REMOTE=0");
