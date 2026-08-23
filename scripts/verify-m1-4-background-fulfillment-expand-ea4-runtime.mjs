import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { registerHooks } from "node:module";

const EXPECTED_EA4 = "ea4acd5d3620fb546e5cf7bc0d1f7db414c54ebc";
const ea4Root = process.env.M1_4_EA4_ROOT;
const supabaseUrl = process.env.M1_4_LOCAL_SUPABASE_URL;
const supabaseSecretKey = process.env.M1_4_LOCAL_SUPABASE_SECRET_KEY;

if (!ea4Root || !supabaseUrl || !supabaseSecretKey) {
  throw new Error("M1_4_EXPAND_LOCAL_CONFIGURATION_REQUIRED");
}

const resolvedHead = execFileSync(
  "git.exe",
  ["-c", `safe.directory=${ea4Root.replaceAll("\\", "/")}`, "-C", ea4Root, "rev-parse", "HEAD"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
).trim();
assert.equal(resolvedHead, EXPECTED_EA4);
const ea4Status = execFileSync(
  "git.exe",
  [
    "-c",
    `safe.directory=${ea4Root.replaceAll("\\", "/")}`,
    "-C",
    ea4Root,
    "status",
    "--porcelain=v1",
    "-z",
  ],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
assert.equal(ea4Status, "");
for (const relativePath of [
  "lib/payment/production/application.ts",
  "lib/payment/production/supabase-repository.ts",
  "lib/assessment/production/supabase-repository.ts",
]) {
  const expectedBlob = execFileSync(
    "git.exe",
    [
      "-c",
      `safe.directory=${ea4Root.replaceAll("\\", "/")}`,
      "-C",
      ea4Root,
      "rev-parse",
      `HEAD:${relativePath}`,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
  const worktreeBlob = execFileSync(
    "git.exe",
    [
      "-c",
      `safe.directory=${ea4Root.replaceAll("\\", "/")}`,
      "-C",
      ea4Root,
      "hash-object",
      `--path=${relativePath}`,
      path.join(ea4Root, relativePath),
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
  assert.equal(worktreeBlob, expectedBlob);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const repositoryModule = await import(
  pathToFileURL(
    path.join(ea4Root, "lib/payment/production/supabase-repository.ts"),
  ).href
);
const applicationModule = await import(
  pathToFileURL(
    path.join(ea4Root, "lib/payment/production/application.ts"),
  ).href
);
const lifecycleRepositoryModule = await import(
  pathToFileURL(
    path.join(ea4Root, "lib/assessment/production/supabase-repository.ts"),
  ).href
);

const { SupabasePaymentDeliveryRepository } = repositoryModule;
const { ProductionPaymentDeliveryApplication } = applicationModule;
const { SupabaseProductionFulfillmentRepository: Ea4LifecycleRepository } =
  lifecycleRepositoryModule;
const { SupabasePaymentDeliveryRepository: CurrentPaymentRepository } =
  await import("../lib/payment/production/supabase-repository.ts");
const { SupabaseProductionFulfillmentRepository: CurrentLifecycleRepository } =
  await import("../lib/assessment/production/supabase-repository.ts");
const repository = new SupabasePaymentDeliveryRepository(
  supabaseUrl,
  supabaseSecretKey,
);

let mode = "success";
let processorCalls = 0;
const grantProcessor = {
  async issueProductionAssessmentGrant() {
    processorCalls += 1;
    if (mode === "failure") throw new Error("SYNTHETIC_GRANT_FAILURE");
    return {
      schemaVersion: "rc1-assessment-grant-handle-v1",
      grantId: "47000000-0000-4000-8000-000000000007",
      logicalAssessmentId: "57000000-0000-4000-8000-000000000007",
    };
  },
  async fulfillProductionAssessmentGrant() {
    processorCalls += 1;
    if (mode === "failure") throw new Error("SYNTHETIC_FULFILLMENT_FAILURE");
    return { resultToken: "synthetic-local-result-token" };
  },
  async processResultNotification() {},
};

let nextOwner = 1;
const application = new ProductionPaymentDeliveryApplication({
  repository,
  checkoutProvider: {},
  transactionalEmail: {},
  grantProcessor,
  policy: {
    challengeTtlSeconds: 600,
    trustedSessionTtlSeconds: 86_400,
    maximumVerificationAttempts: 3,
  },
  environment: "test",
  siteOrigin: "https://moon-reply.test",
  payPayEnabled: false,
  verificationPepper: "synthetic-expand-verification-pepper-0001",
  emailEncryptionKey: Buffer.alloc(32, 41).toString("base64"),
  purchaseStatusSigningSecret: "synthetic-expand-status-secret-0000001",
  fulfillmentLeaseSeconds: 120,
  now: () => "2026-08-23T00:10:00.000Z",
  uuid: () =>
    `fa000000-0000-4000-8000-${String(nextOwner++).padStart(12, "0")}`,
  capability: () => Buffer.alloc(32, 42).toString("base64url"),
  verificationCode: () => "12345678",
});

const success = await application.processFulfillmentJobById(
  "e1000000-0000-4000-8000-000000000007",
);
assert.deepEqual(success, { status: "completed" });
assert.equal(processorCalls, 1);
const completed = await repository.claimFulfillmentJobById({
  jobId: "e1000000-0000-4000-8000-000000000007",
  ownerId: "fb000000-0000-4000-8000-000000000007",
  leaseExpiresAt: "2026-08-23T00:12:00.000Z",
  now: "2026-08-23T00:10:00.000Z",
});
assert.equal(completed.disposition, "completed");
assert.equal(completed.job.state, "completed");
assert.equal(completed.job.ownerId, null);
assert.equal(completed.job.leaseExpiresAt, null);
console.log("PASS exact ea4 application completes through preserved v1 on DB0016");

const callsBeforeActive = processorCalls;
const active = await application.processFulfillmentJobById(
  "e1000000-0000-4000-8000-000000000009",
);
assert.deepEqual(active, { status: "in_progress" });
assert.equal(processorCalls, callsBeforeActive);
const { data: activeRow, error: activeError } = await repository.client
  .from("production_fulfillment_jobs")
  .select("state,owner_id,lease_expires_at,dispatch_marker")
  .eq("id", "e1000000-0000-4000-8000-000000000009")
  .single();
assert.ifError(activeError);
assert.equal(activeRow.state, "processing");
assert.equal(activeRow.owner_id, "a9000000-0000-4000-8000-000000000009");
assert.equal(activeRow.lease_expires_at, "2026-08-23T00:30:00+00:00");
assert.equal(activeRow.dispatch_marker, null);
console.log("PASS exact ea4 application observes active legacy worker without stealing");

mode = "failure";
const failed = await application.processFulfillmentJobById(
  "e1000000-0000-4000-8000-000000000008",
);
assert.deepEqual(failed, { status: "temporary_problem", retryable: true });
const { data: failedRow, error: failedError } = await repository.client
  .from("production_fulfillment_jobs")
  .select("state,owner_id,lease_expires_at,dispatch_marker,dispatch_completed_at")
  .eq("id", "e1000000-0000-4000-8000-000000000008")
  .single();
assert.ifError(failedError);
assert.equal(failedRow.state, "retryable");
assert.equal(failedRow.owner_id, null);
assert.equal(failedRow.lease_expires_at, null);
assert.equal(failedRow.dispatch_marker, null);
assert.equal(failedRow.dispatch_completed_at, null);
console.log("PASS exact ea4 application fails through preserved v1 without v2 payloads");

const ea4Lifecycle = new Ea4LifecycleRepository(
  supabaseUrl,
  supabaseSecretKey,
);
const ea4LifecycleOwner = "f1000000-0000-4000-8000-000000000011";
const ea4LifecycleClaim = await ea4Lifecycle.claimFulfillment({
  grantId: "41000000-0000-4000-8000-000000000011",
  ownerId: ea4LifecycleOwner,
  now: "2026-08-23T00:10:00.000Z",
});
assert.equal(ea4LifecycleClaim.disposition, "acquired");
assert.equal(ea4LifecycleClaim.ownerId, ea4LifecycleOwner);
assert.equal("leaseExpiresAt" in ea4LifecycleClaim, false);
await ea4Lifecycle.failFulfillment({
  logicalAssessmentId: "51000000-0000-4000-8000-000000000011",
  ownerId: ea4LifecycleOwner,
  errorCode: "SYNTHETIC_EA4_LIFECYCLE_FAILURE",
  now: "2026-08-23T00:10:01.000Z",
});
await ea4Lifecycle.markGenerationStarted({
  logicalAssessmentId: "51000000-0000-4000-8000-000000000001",
  ownerId: "a1000000-0000-4000-8000-000000000001",
  now: "2026-08-23T00:10:01.000Z",
});
await ea4Lifecycle.failFulfillment({
  logicalAssessmentId: "51000000-0000-4000-8000-000000000001",
  ownerId: "a1000000-0000-4000-8000-000000000001",
  errorCode: "SYNTHETIC_EA4_LEGACY_OWNER_FAILURE",
  now: "2026-08-23T00:10:02.000Z",
});
await ea4Lifecycle.completeNotification({
  notificationId: "91000000-0000-4000-8000-000000000005",
  ownerId: "a1000000-0000-4000-8000-000000000005",
  providerMessageReference: "synthetic-ea4-notification-reference",
  now: "2026-08-23T00:10:02.000Z",
});
await ea4Lifecycle.failNotification({
  notificationId: "91000000-0000-4000-8000-000000000006",
  ownerId: "a1000000-0000-4000-8000-000000000006",
  errorCode: "SYNTHETIC_EA4_NOTIFICATION_FAILURE",
  now: "2026-08-23T00:10:02.000Z",
});
console.log("PASS exact ea4 assessment repository preserves v1 lifecycle and payloads");

const currentRepository = new CurrentPaymentRepository(
  supabaseUrl,
  supabaseSecretKey,
);
const dispatchMarker =
  "rc2-dispatch:e1000000-0000-4000-8000-000000000010";
const dispatch = await currentRepository.claimFulfillmentDispatch({
  jobId: "e1000000-0000-4000-8000-000000000010",
  dispatchMarker,
  ownerId: "fc000000-0000-4000-8000-000000000010",
  leaseExpiresAt: "2026-08-23T00:11:00.000Z",
  now: "2026-08-23T00:10:00.000Z",
});
assert.equal(dispatch.disposition, "acquired");
await currentRepository.completeFulfillmentDispatch({
  jobId: "e1000000-0000-4000-8000-000000000010",
  dispatchMarker,
  ownerId: "fc000000-0000-4000-8000-000000000010",
  now: "2026-08-23T00:10:01.000Z",
});
const currentClaim = await currentRepository.claimFulfillmentJobById({
  jobId: "e1000000-0000-4000-8000-000000000010",
  ownerId: "fd000000-0000-4000-8000-000000000010",
  leaseExpiresAt: "2026-08-23T00:12:00.000Z",
  now: "2026-08-23T00:10:02.000Z",
});
assert.equal(currentClaim.disposition, "acquired");
await currentRepository.failFulfillmentJob({
  jobId: "e1000000-0000-4000-8000-000000000010",
  ownerId: "fd000000-0000-4000-8000-000000000010",
  errorCode: "SYNTHETIC_CURRENT_RUNTIME_FAILURE",
  now: "2026-08-23T00:10:03.000Z",
});
const redispatch = await currentRepository.claimFulfillmentDispatch({
  jobId: "e1000000-0000-4000-8000-000000000010",
  dispatchMarker,
  ownerId: "fc000000-0000-4000-8000-000000000099",
  leaseExpiresAt: "2026-08-23T00:12:00.000Z",
  now: "2026-08-23T00:10:04.000Z",
});
assert.equal(redispatch.disposition, "dispatched");
const { data: currentRow, error: currentError } = await currentRepository.client
  .from("production_fulfillment_jobs")
  .select("state,owner_id,lease_expires_at,dispatch_marker,dispatch_completed_at")
  .eq("id", "e1000000-0000-4000-8000-000000000010")
  .single();
assert.ifError(currentError);
assert.equal(currentRow.state, "retryable");
assert.equal(currentRow.owner_id, null);
assert.equal(currentRow.lease_expires_at, null);
assert.equal(currentRow.dispatch_marker, dispatchMarker);
assert.notEqual(currentRow.dispatch_completed_at, null);
console.log("PASS current runtime uses v2 dispatch/job fencing on DB0016");

const currentLifecycle = new CurrentLifecycleRepository(
  supabaseUrl,
  supabaseSecretKey,
);
const lifecycleOwner = "fe000000-0000-4000-8000-000000000011";
const lifecycleClaim = await currentLifecycle.claimFulfillment({
  grantId: "41000000-0000-4000-8000-000000000011",
  ownerId: lifecycleOwner,
  leaseExpiresAt: "2026-08-23T00:13:00.000Z",
  now: "2026-08-23T00:10:00.000Z",
});
assert.equal(lifecycleClaim.disposition, "acquired");
assert.equal(lifecycleClaim.ownerId, lifecycleOwner);
assert.equal(lifecycleClaim.leaseExpiresAt, "2026-08-23T00:13:00+00:00");
await currentLifecycle.markGenerationStarted({
  logicalAssessmentId: "51000000-0000-4000-8000-000000000011",
  ownerId: lifecycleOwner,
  now: "2026-08-23T00:10:01.000Z",
});
await currentLifecycle.failFulfillment({
  logicalAssessmentId: "51000000-0000-4000-8000-000000000011",
  ownerId: lifecycleOwner,
  errorCode: "SYNTHETIC_CURRENT_LIFECYCLE_FAILURE",
  now: "2026-08-23T00:10:02.000Z",
});

const notificationOwner = "ff000000-0000-4000-8000-000000000007";
const notificationClaim = await currentLifecycle.claimNotification({
  notificationId: "97000000-0000-4000-8000-000000000007",
  ownerId: notificationOwner,
  leaseExpiresAt: "2026-08-23T00:13:00.000Z",
  now: "2026-08-23T00:10:00.000Z",
});
assert.equal(notificationClaim?.disposition, "acquired");
await currentLifecycle.completeNotification({
  notificationId: "97000000-0000-4000-8000-000000000007",
  ownerId: notificationOwner,
  providerMessageReference: "synthetic-local-notification-reference",
  now: "2026-08-23T00:10:01.000Z",
});
console.log("PASS current assessment lifecycle uses v2 logical and notification fencing");

console.log("M1-4 EXPAND EA4/CURRENT RUNTIME PASS 6/6");
console.log("REAL_PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 STRIPE_OPERATIONS=0");
