import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import toml from "toml";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { requestProductionFulfillmentDispatch } from "../lib/payment/production/fulfillment-dispatch.ts";
import {
  privateRecoverySchedulerPolicy,
  runProductionFulfillmentDispatchSchedule,
  runProductionPaymentReconciliationSchedule,
} from "../lib/payment/production/recovery-schedulers.ts";

const root = process.cwd();
let passed = 0;

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${name}`);
}

function dispatchHarness(options = {}) {
  let current = Date.parse("2026-08-24T00:00:00.000Z");
  let uuidCounter = 0;
  let sendCount = 0;
  let acceptedCount = 0;
  let failBeforeAcceptance = options.failBeforeAcceptance ?? 0;
  let failCompletion = options.failCompletion ?? 0;
  const dispatch = {
    marker: null,
    ownerId: null,
    leaseExpiresAt: null,
    retryAfter: options.retryAfter ?? null,
    completedAt: null,
  };
  const job = { state: options.jobState ?? "pending" };
  const repository = {
    async claimFulfillmentDispatch(input) {
      if (["completed", "manual_review"].includes(job.state)) {
        return { disposition: "terminal" };
      }
      if (dispatch.marker && dispatch.marker !== input.dispatchMarker) {
        job.state = "manual_review";
        return { disposition: "terminal" };
      }
      if (dispatch.completedAt) return { disposition: "dispatched" };
      if (
        dispatch.ownerId &&
        Date.parse(dispatch.leaseExpiresAt) > Date.parse(input.now)
      ) {
        return { disposition: "in_progress" };
      }
      if (dispatch.ownerId && dispatch.retryAfter === null) {
        job.state = "manual_review";
        dispatch.ownerId = null;
        dispatch.leaseExpiresAt = null;
        return { disposition: "terminal" };
      }
      if (
        dispatch.retryAfter &&
        Date.parse(dispatch.retryAfter) > Date.parse(input.now)
      ) {
        return { disposition: "retry_later" };
      }
      if (
        dispatch.marker &&
        dispatch.ownerId === null &&
        dispatch.retryAfter === null
      ) {
        job.state = "manual_review";
        return { disposition: "terminal" };
      }
      dispatch.marker = input.dispatchMarker;
      dispatch.ownerId = input.ownerId;
      dispatch.leaseExpiresAt = input.leaseExpiresAt;
      dispatch.retryAfter = null;
      return { disposition: "acquired" };
    },
    async completeFulfillmentDispatch(input) {
      if (failCompletion > 0) {
        failCompletion -= 1;
        throw new M2RuntimeError("SYNTHETIC_COMPLETE_FAILED", 503);
      }
      assert.equal(dispatch.ownerId, input.ownerId);
      dispatch.ownerId = null;
      dispatch.leaseExpiresAt = null;
      dispatch.completedAt = input.now;
      acceptedCount += 1;
    },
    async failFulfillmentDispatch(input) {
      assert.equal(dispatch.ownerId, input.ownerId);
      dispatch.ownerId = null;
      dispatch.leaseExpiresAt = null;
      dispatch.retryAfter = input.retryAfter;
    },
  };
  const dispatcher = {
    async enqueue() {
      sendCount += 1;
      await Promise.resolve();
      if (failBeforeAcceptance > 0) {
        failBeforeAcceptance -= 1;
        throw new M2RuntimeError("SYNTHETIC_ROUTER_REJECTED", 503);
      }
      return { eventId: `event-${sendCount}` };
    },
  };
  const request = () =>
    requestProductionFulfillmentDispatch({
      repository,
      dispatcher,
      jobId: "71000000-0000-4000-8000-000000000001",
      now: () => new Date(current).toISOString(),
      uuid: () =>
        `72000000-0000-4000-8000-${String(++uuidCounter).padStart(12, "0")}`,
    });
  return {
    request,
    advance(seconds) {
      current += seconds * 1_000;
    },
    state() {
      return { sendCount, acceptedCount, dispatch: { ...dispatch }, ...job };
    },
  };
}

function recorded(disposition) {
  return {
    disposition,
    purchaseIntentId: null,
    verifiedPaymentId: null,
    fulfillmentJobId: null,
  };
}

await check("accepted migration lineage and pending SHAs", async () => {
  const migration17 = execFileSync(
    "git",
    ["cat-file", "blob", "HEAD:supabase/migrations/0017_m2_a1_null_fence_integrity.sql"],
    { cwd: root },
  );
  const migration18 = execFileSync(
    "git",
    ["cat-file", "blob", "HEAD:supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql"],
    { cwd: root },
  );
  assert.equal(
    createHash("sha256").update(migration17).digest("hex"),
    "b5c2534dbc8bdb97e6fa77612143b8bf9ec78c2955908ceab3d360bab30f9380",
  );
  assert.equal(
    createHash("sha256").update(migration18).digest("hex"),
    "1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010",
  );
});

await check("0019 is reconciliation-only durable authority", async () => {
  const migration = await readFile(
    path.join(root, "supabase/migrations/0019_m2_b2_private_payment_reconciliation.sql"),
    "utf8",
  );
  assert.match(migration, /reconciliation_owner_id uuid/u);
  assert.match(migration, /for update of attempt skip locked/u);
  assert.match(migration, /reconciliation_attempt_count < p_max_attempts/u);
  assert.match(migration, /provider_checkout_session_id is not null/u);
  assert.match(migration, /current_payment_attempt_id = attempt\.id/u);
  assert.match(migration, /security invoker[\s\S]+set search_path = ''/u);
  assert.match(migration, /to service_role/u);
  assert.match(migration, /m2_b2_stripe_ingress/u);
  assert.doesNotMatch(
    migration,
    /alter table public\.production_fulfillment_jobs/u,
  );
});

await check("fulfillment due query binds the direct intent FK and preserves fences", async () => {
  const repository = await readFile(
    path.join(root, "lib/payment/production/supabase-repository.ts"),
    "utf8",
  );
  const methodStart = repository.indexOf(
    "async listDueFulfillmentDispatchJobIds(",
  );
  const methodEnd = repository.indexOf(
    "async claimPaymentReconciliationBatch(",
    methodStart,
  );
  assert.ok(methodStart >= 0);
  assert.ok(methodEnd > methodStart);
  const method = repository.slice(methodStart, methodEnd);
  assert.doesNotMatch(
    method,
    /production_purchase_intents!inner\(state\)/u,
  );
  assert.match(
    method,
    /production_purchase_intents!production_fulfillment_job_intent_fk!inner\(state\)/u,
  );
  assert.doesNotMatch(
    method,
    /production_fulfillment_job_preparation_binding_fk/u,
  );
  assert.doesNotMatch(
    method,
    /production_fulfillment_job_delivery_binding_fk/u,
  );
  assert.match(method, /\.in\("state", \["pending", "retryable"\]\)/u);
  assert.match(
    method,
    /\.eq\("production_purchase_intents\.state", "verified"\)/u,
  );
  assert.match(method, /\.is\("dispatch_completed_at", null\)/u);
  assert.match(
    method,
    /dispatch_retry_after\.is\.null,dispatch_retry_after\.lte\.\$\{input\.now\}/u,
  );
  assert.match(
    method,
    /dispatch_owner_id\.is\.null,dispatch_lease_expires_at\.lte\.\$\{input\.now\}/u,
  );
  assert.match(
    method,
    /\.order\("dispatch_retry_after", \{ ascending: true, nullsFirst: true \}\)/u,
  );
  assert.match(method, /\.order\("created_at", \{ ascending: true \}\)/u);
  assert.match(method, /\.order\("id", \{ ascending: true \}\)/u);
  assert.match(method, /\.limit\(input\.limit\)/u);
});

await check("Netlify schedule topology and background asset block", async () => {
  const config = toml.parse(await readFile(path.join(root, "netlify.toml"), "utf8"));
  assert.deepEqual(
    config.functions["production-fulfillment-background"].included_files,
    ["ai/prompts/**", "ai/schemas/**", "lib/assessment/runtime/contracts/**"],
  );
  assert.equal(
    config.functions["production-fulfillment-dispatch-scheduled"].schedule,
    "* * * * *",
  );
  assert.equal(
    config.functions["production-payment-reconciliation-scheduled"].schedule,
    "*/5 * * * *",
  );
});

await check("dispatch one/two/no eligible batches are bounded", async () => {
  for (const ids of [[], ["a"], ["a", "b"]]) {
    const calls = [];
    const outcome = await runProductionFulfillmentDispatchSchedule({
      repository: {
        async listDueFulfillmentDispatchJobIds({ limit }) {
          assert.equal(limit, privateRecoverySchedulerPolicy.dispatchBatchLimit);
          return ids;
        },
      },
      dispatchJob: async (id) => {
        calls.push(id);
        return "accepted";
      },
    });
    assert.deepEqual(calls, ids);
    assert.equal(outcome.accepted, ids.length);
  }
});

await check("two dispatch schedulers and status poll send once", async () => {
  const harness = dispatchHarness();
  const outcomes = await Promise.all([
    harness.request(),
    harness.request(),
    harness.request(),
  ]);
  assert.equal(outcomes.filter((value) => value === "accepted").length, 1);
  assert.deepEqual(harness.state(), {
    sendCount: 1,
    acceptedCount: 1,
    dispatch: {
      marker: "rc2-dispatch:71000000-0000-4000-8000-000000000001",
      ownerId: null,
      leaseExpiresAt: null,
      retryAfter: null,
      completedAt: "2026-08-24T00:00:00.000Z",
    },
    state: "pending",
  });
});

await check("active retry and terminal dispatch fences skip safely", async () => {
  const terminal = dispatchHarness({ jobState: "manual_review" });
  assert.equal(await terminal.request(), "skipped");
  assert.equal(terminal.state().sendCount, 0);
  const retry = dispatchHarness({ retryAfter: "2026-08-24T00:01:00.000Z" });
  await assert.rejects(retry.request(), /PAYMENT_FULFILLMENT_DISPATCH_RETRYABLE/u);
  assert.equal(retry.state().sendCount, 0);
});

await check("router failure retries only before acceptance", async () => {
  const harness = dispatchHarness({ failBeforeAcceptance: 1 });
  await assert.rejects(harness.request(), /SYNTHETIC_ROUTER_REJECTED/u);
  await assert.rejects(harness.request(), /PAYMENT_FULFILLMENT_DISPATCH_RETRYABLE/u);
  harness.advance(31);
  assert.equal(await harness.request(), "accepted");
  assert.equal(harness.state().sendCount, 2);
  assert.equal(harness.state().acceptedCount, 1);
});

await check("ambiguous router acceptance never resends", async () => {
  const harness = dispatchHarness({ failCompletion: 1 });
  await assert.rejects(harness.request(), /SYNTHETIC_COMPLETE_FAILED/u);
  harness.advance(31);
  assert.equal(await harness.request(), "skipped");
  assert.equal(harness.state().sendCount, 1);
  assert.equal(harness.state().state, "manual_review");
});

await check("reconciliation is bounded to four reads and concurrency two", async () => {
  const claims = Array.from({ length: 4 }, (_, index) => ({
    paymentAttemptId: `73000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    providerCheckoutSessionId: `cs_test_i2_${index + 1}`,
    attemptCount: 1,
  }));
  const finishes = [];
  let active = 0;
  let maximumActive = 0;
  const result = await runProductionPaymentReconciliationSchedule({
    environment: "test",
    repository: {
      async claimPaymentReconciliationBatch(input) {
        assert.equal(input.limit, 4);
        assert.equal(input.maximumAttempts, 6);
        return claims;
      },
      async finishPaymentReconciliation(input) {
        finishes.push(input);
      },
    },
    reconcileAttempt: async (id) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return recorded(id.endsWith("1") ? "verified" : "pending");
    },
    uuid: () => "74000000-0000-4000-8000-000000000001",
    now: () => "2026-08-24T00:10:00.000Z",
  });
  assert.equal(maximumActive, 2);
  assert.equal(result.stripeReads, 4);
  assert.equal(finishes.length, 4);
  assert.equal(finishes.filter((entry) => entry.outcome === "settled").length, 1);
  assert.equal(finishes.filter((entry) => entry.outcome === "retry").length, 3);
});

await check("transient errors back off and permanent invalid sessions stop", async () => {
  const claims = [
    {
      paymentAttemptId: "75000000-0000-4000-8000-000000000001",
      providerCheckoutSessionId: "cs_test_transient",
      attemptCount: 2,
    },
    {
      paymentAttemptId: "75000000-0000-4000-8000-000000000002",
      providerCheckoutSessionId: "cs_test_invalid",
      attemptCount: 1,
    },
  ];
  const finishes = [];
  await runProductionPaymentReconciliationSchedule({
    environment: "test",
    repository: {
      async claimPaymentReconciliationBatch() {
        return claims;
      },
      async finishPaymentReconciliation(input) {
        finishes.push(input);
      },
    },
    reconcileAttempt: async (id) => {
      throw new M2RuntimeError(
        id.endsWith("1")
          ? "PAYMENT_RECONCILIATION_UNKNOWN"
          : "PAYMENT_RECONCILIATION_SESSION_INVALID",
        503,
      );
    },
    uuid: () => "76000000-0000-4000-8000-000000000001",
    now: () => "2026-08-24T00:10:00.000Z",
  });
  assert.equal(finishes[0].outcome, "retry");
  assert.ok(Date.parse(finishes[0].retryAfter) > Date.parse(finishes[0].now));
  assert.equal(finishes[1].outcome, "stop");
  assert.equal(finishes[1].retryAfter, null);
});

await check("fifth pending observation retries and sixth stops without checkout creation", async () => {
  const finishes = [];
  await runProductionPaymentReconciliationSchedule({
    environment: "test",
    repository: {
      async claimPaymentReconciliationBatch() {
        return [{
          paymentAttemptId: "77000000-0000-4000-8000-000000000001",
          providerCheckoutSessionId: "cs_test_budget",
          attemptCount: 5,
        }];
      },
      async finishPaymentReconciliation(input) {
        finishes.push(input);
      },
    },
    reconcileAttempt: async () => recorded("pending"),
    uuid: () => "78000000-0000-4000-8000-000000000001",
    now: () => "2026-08-24T00:10:00.000Z",
  });
  await runProductionPaymentReconciliationSchedule({
    environment: "test",
    repository: {
      async claimPaymentReconciliationBatch() {
        return [{
          paymentAttemptId: "77000000-0000-4000-8000-000000000001",
          providerCheckoutSessionId: "cs_test_budget",
          attemptCount: 6,
        }];
      },
      async finishPaymentReconciliation(input) {
        finishes.push(input);
      },
    },
    reconcileAttempt: async () => recorded("pending"),
    uuid: () => "78000000-0000-4000-8000-000000000002",
    now: () => "2026-08-24T00:25:00.000Z",
  });
  assert.equal(finishes[0].outcome, "retry");
  assert.equal(finishes[1].outcome, "stop");
  const service = await readFile(
    path.join(
      root,
      "lib/payment/production/reconciliation-scheduler-runtime-service.ts",
    ),
    "utf8",
  );
  assert.doesNotMatch(service, /createCheckoutSession|enqueueProduction/u);
});

await check("webhook race disposition settles without dispatch coupling", async () => {
  const finishes = [];
  const result = await runProductionPaymentReconciliationSchedule({
    environment: "test",
    repository: {
      async claimPaymentReconciliationBatch() {
        return [{
          paymentAttemptId: "79000000-0000-4000-8000-000000000001",
          providerCheckoutSessionId: "cs_test_webhook_won",
          attemptCount: 1,
        }];
      },
      async finishPaymentReconciliation(input) {
        finishes.push(input);
      },
    },
    reconcileAttempt: async () => recorded("duplicate"),
    uuid: () => "7a000000-0000-4000-8000-000000000001",
    now: () => "2026-08-24T00:10:00.000Z",
  });
  assert.equal(result.stripeReads, 1);
  assert.equal(finishes[0].outcome, "settled");
  const application = await readFile(
    path.join(root, "lib/payment/production/application.ts"),
    "utf8",
  );
  const scheduler = await readFile(
    path.join(
      root,
      "lib/payment/production/reconciliation-scheduler-runtime-service.ts",
    ),
    "utf8",
  );
  assert.match(application, /dispatchFulfillment = true/u);
  assert.match(scheduler, /dispatchFulfillment: false/u);
});

await check("scheduler secret and responsibility domains are separated", async () => {
  const dispatch = await readFile(
    path.join(
      root,
      "lib/payment/production/dispatch-scheduler-runtime-service.ts",
    ),
    "utf8",
  );
  const reconciliation = await readFile(
    path.join(
      root,
      "lib/payment/production/reconciliation-scheduler-runtime-service.ts",
    ),
    "utf8",
  );
  assert.doesNotMatch(dispatch, /stripe|provider|openai|reconcil/iu);
  assert.doesNotMatch(reconciliation, /async-workloads|enqueueProduction/u);
  assert.match(reconciliation, /maxNetworkRetries: 0/u);
  assert.match(reconciliation, /timeout: 5_000/u);
  for (const wrapper of [
    "lib/payment/production/dispatch-scheduler-service.ts",
    "lib/payment/production/reconciliation-scheduler-service.ts",
  ]) {
    assert.match(await readFile(path.join(root, wrapper), "utf8"), /^import "server-only";/u);
  }
});

await check("fresh local DB reconciliation and privilege proof", async () => {
  const database = await createLocalPostgres("i2-reconciliation");
  try {
    database.applyThrough(30);
    const sql = await readFile(
      path.join(root, "supabase/tests/m2_b2_i2_private_reconciliation_r1.sql"),
      "utf8",
    );
    assert.match(database.sql(sql), /PASS M2-B2-I2 private reconciliation DB proof/u);
    const privilegeSql = await readFile(
      path.join(root, "supabase/tests/m2_b2_i1_ingress_privilege_preflight_r1.sql"),
      "utf8",
    );
    assert.match(database.sql(privilegeSql), /M2-B2-I1 INGRESS PRIVILEGE PREFLIGHT PASS/u);
  } finally {
    database.stop();
  }
});

await check("no real external action in I2 verifier", async () => {
  const sources = await Promise.all(
    [
      "lib/payment/production/dispatch-scheduler-runtime-service.ts",
      "lib/payment/production/reconciliation-scheduler-runtime-service.ts",
      "lib/payment/production/async-workloads-runtime.ts",
      "lib/payment/production/stripe-environment-runtime.ts",
      "netlify/functions/production-fulfillment-dispatch-scheduled.mts",
      "netlify/functions/production-payment-reconciliation-scheduled.mts",
    ].map((file) => readFile(path.join(root, file), "utf8")),
  );
  const source = sources.join("\n");
  assert.doesNotMatch(source, /stripe\.com\/v1|api\.stripe\.com|fetch\(/u);
  assert.doesNotMatch(source, /db push|netlify deploy|netlify api/u);
});

const migration19 = await readFile(
  path.join(root, "supabase/migrations/0019_m2_b2_private_payment_reconciliation.sql"),
);
console.log(
  `PASS M2-B2-I2 private recovery schedulers ${passed}/${passed}`,
);
console.log(
  `M2_B2_I2_0019_SHA256=${createHash("sha256").update(migration19).digest("hex")}`,
);
