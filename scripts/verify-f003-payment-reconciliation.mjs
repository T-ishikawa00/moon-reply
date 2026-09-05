import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import Stripe from "stripe";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { hashOpaqueProductionCapability } from "../lib/assessment/production/capabilities.ts";
import {
  FakeCheckoutProviderV1, FakePaymentDeliveryRepository,
  FakeProductionFulfillmentDispatcherV1, FakeProductionGrantProcessorV1,
} from "../lib/payment/production/fakes.ts";
import { DeterministicFakeTransactionalEmailAdapterV1 } from "../lib/payment/production/transactional-email.ts";
import { StripeCheckoutProviderV1 } from "../lib/payment/production/stripe.ts";
import {
  paymentReconciliationFollowupPolicy, privateRecoverySchedulerPolicy,
  runProductionPaymentReconciliationFollowup, runProductionPaymentReconciliationSchedule,
  withPaymentReconciliationRpcDeadline,
} from "../lib/payment/production/recovery-schedulers.ts";
import { formatOperatorDiscordNotification } from "../lib/payment/production/operator-notification.ts";

registerHooks({ resolve(specifier, context, next) {
  return specifier === "server-only" ? { url: "data:text/javascript,export%20{}", shortCircuit: true } : next(specifier, context);
} });
const { ProductionPaymentDeliveryApplication } = await import("../lib/payment/production/application.ts");
// Every provider below is constructor-injected or has its SDK method replaced.
// Project environment files and runtime-service constructors are never loaded.
globalThis.fetch = async () => { throw new Error("F003_EXTERNAL_FETCH_PROHIBITED"); };
const now = "2026-09-06T01:00:00.000Z";
const id = "67000000-0000-4000-8000-000000000001";
const recorded = disposition => ({ disposition, purchaseIntentId: null, verifiedPaymentId: null, fulfillmentJobId: null });
let passed = 0;
async function check(name, run) { await run(); console.log(`PASS F003 ${++passed} ${name}`); }
function shortHarness(attemptCount, answer) {
  const finishes = [];
  return {
    finishes,
    run: () => runProductionPaymentReconciliationSchedule({
      repository: {
        async claimPaymentReconciliationBatch(input) {
          assert.equal(input.maximumAttempts, 6); assert.equal(input.limit, 4);
          return [{ paymentAttemptId: id, providerCheckoutSessionId: "cs_test_f003", attemptCount }];
        },
        async finishPaymentReconciliation(input) { finishes.push(input); },
      },
      now: () => now, reconcileAttempt: answer,
    }),
  };
}
function longHarness(answer, overrides = {}) {
  const finishes = [];
  return {
    finishes,
    run: () => runProductionPaymentReconciliationFollowup({
      repository: {
        async claimPaymentReconciliationFollowup() { return [{ paymentAttemptId: id, providerCheckoutSessionId: "cs_test_f003", attemptCount: 1 }]; },
        async finishPaymentReconciliationFollowup(input) { finishes.push(input); },
        ...overrides,
      },
      now: () => now, reconcileAttempt: answer,
    }),
  };
}

await check("short limit/backoff and original stop reason survive; precise provenance is separate", async () => {
  assert.equal(privateRecoverySchedulerPolicy.reconciliationMaximumAttempts, 6);
  assert.equal(privateRecoverySchedulerPolicy.reconciliationConcurrency, 2);
  const before = shortHarness(5, async () => recorded("pending")); await before.run();
  assert.equal(before.finishes[0].outcome, "retry");
  const last = shortHarness(6, async () => recorded("pending")); await last.run();
  assert.equal(last.finishes[0].outcome, "stop");
  assert.equal(last.finishes[0].errorCode, "PAYMENT_RECONCILIATION_RETRY_EXHAUSTED");
  assert.equal(last.finishes[0].stopCauseCode, "PAYMENT_RECONCILIATION_PENDING");
  for (const cause of ["PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE", "PAYMENT_RECONCILIATION_UNKNOWN", "PAYMENT_BINDING_INVALID"]) {
    const run = shortHarness(6, async () => { throw new M2RuntimeError(cause); }); await run.run();
    assert.equal(run.finishes[0].errorCode, "PAYMENT_RECONCILIATION_STOPPED"); assert.equal(run.finishes[0].stopCauseCode, cause);
  }
});

await check("only explicit Stripe transport/API/rate-limit errors become retryable", async () => {
  const provider = new StripeCheckoutProviderV1("sk_test_f003_offline", { maxNetworkRetries: 0, timeout: 5000 });
  for (const Type of [Stripe.errors.StripeConnectionError, Stripe.errors.StripeAPIError, Stripe.errors.StripeRateLimitError]) {
    provider.stripe.checkout.sessions.retrieve = async () => { throw new Type({ message: "synthetic" }); };
    await assert.rejects(() => provider.inspectCheckoutSession({ providerCheckoutSessionId: "cs_test_f003", observedAt: now }),
      e => e.safeCode === "PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE");
  }
  for (const error of [new Stripe.errors.StripeAuthenticationError({ message: "synthetic" }), new Error("synthetic unknown")]) {
    provider.stripe.checkout.sessions.retrieve = async () => { throw error; };
    await assert.rejects(() => provider.inspectCheckoutSession({ providerCheckoutSessionId: "cs_test_f003", observedAt: now }), e => e === error);
  }
  provider.stripe.checkout.sessions.retrieve = async () => { throw new Stripe.errors.StripeInvalidRequestError({ message: "synthetic", code: "resource_missing" }); };
  await assert.rejects(() => provider.inspectCheckoutSession({ providerCheckoutSessionId: "cs_test_f003", observedAt: now }), e => e.safeCode === "PAYMENT_RECONCILIATION_SESSION_INVALID");
});

await check("long lane retries pending/transport only; unknown and integrity errors stay blocked", async () => {
  for (const disposition of ["pending", "duplicate"]) {
    const run = longHarness(async () => recorded(disposition)); assert.equal((await run.run()).retried, 1);
  }
  for (const disposition of ["rejected", "stale", "conflict"]) {
    const run = longHarness(async () => recorded(disposition)); assert.equal((await run.run()).blocked, 1);
  }
  for (const code of ["PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE", "PAYMENT_RECONCILIATION_UNKNOWN", "PAYMENT_BINDING_INVALID", "PAYMENT_ECONOMIC_EVIDENCE_INVALID", "PAYMENT_RECONCILIATION_SESSION_INVALID"]) {
    const run = longHarness(async () => { throw new M2RuntimeError(code); }); await run.run();
    assert.equal(run.finishes[0].outcome, code === "PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE" ? "retry" : "blocked");
  }
});

await check("one read maximum and finish conflict cannot cause another provider read", async () => {
  assert.equal(paymentReconciliationFollowupPolicy.batchLimit, 1); assert.equal(paymentReconciliationFollowupPolicy.concurrency, 1);
  let reads = 0;
  const run = longHarness(async () => { reads++; return recorded("pending"); }, { async finishPaymentReconciliationFollowup() { throw Error("synthetic fence"); } });
  assert.equal((await run.run()).finishConflicts, 1); assert.equal(reads, 1);
  const bad = longHarness(async () => { reads++; return recorded("pending"); }, { async claimPaymentReconciliationFollowup() { return [{}, {}]; } });
  await assert.rejects(bad.run, /BATCH_INVALID/u); assert.equal(reads, 1);
});

await check("low remaining scheduler time defers before claim and abort-ignoring RPC still times out", async () => {
  const result = await runProductionPaymentReconciliationFollowup({
    repository: { async claimPaymentReconciliationFollowup() { throw Error("must not claim"); },
      async finishPaymentReconciliationFollowup() { throw Error("must not finish"); } },
    async reconcileAttempt() { throw Error("must not read provider"); }, canStart: () => false,
  });
  assert.equal(result.deferred, true); assert.equal(result.stripeReads, 0); assert.equal(result.claimed, 0);
  let signal;
  const started = performance.now();
  await assert.rejects(() => withPaymentReconciliationRpcDeadline(s => { signal = s; return new Promise(() => {}); }, 10),
    e => e.safeCode === "PAYMENT_RECONCILIATION_DATABASE_TIMEOUT");
  assert.equal(signal.aborted, true); assert.ok(performance.now() - started < 1000);
  assert.equal(await withPaymentReconciliationRpcDeadline(async () => "ok", 10), "ok");
});

await check("webhook absence + short exhaustion + later read converges to one verified payment/job", async () => {
  let sequence = 0, clock = now;
  const uuid = () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
  const capability = () => Buffer.alloc(32, ++sequence).toString("base64url");
  const repository = new FakePaymentDeliveryRepository();
  const checkoutProvider = new FakeCheckoutProviderV1();
  const email = new DeterministicFakeTransactionalEmailAdapterV1();
  const dispatcher = new FakeProductionFulfillmentDispatcherV1();
  const grants = new FakeProductionGrantProcessorV1(repository);
  const preparationCapability = Buffer.alloc(32, 201).toString("base64url");
  repository.seedPurchaseReady({ id: "90000000-0000-4000-8000-000000000001", preparationCapabilityHash: hashOpaqueProductionCapability(preparationCapability) });
  const application = new ProductionPaymentDeliveryApplication({
    repository, checkoutProvider, transactionalEmail: email, grantProcessor: grants, fulfillmentDispatcher: dispatcher,
    policy: { challengeTtlSeconds: 600, trustedSessionTtlSeconds: 86400, maximumVerificationAttempts: 3 },
    environment: "test", siteOrigin: "https://f003.invalid", payPayEnabled: false,
    verificationPepper: "f003-synthetic-verification-pepper-0000000001", emailEncryptionKey: Buffer.alloc(32, 71).toString("base64"),
    purchaseStatusSigningSecret: "f003-synthetic-status-secret-00000000001", fulfillmentLeaseSeconds: 120,
    now: () => clock, uuid, capability, verificationCode: () => "12345678",
  });
  const begun = await application.startEmailVerification({ preparationCapability, email: "f003@example.test" });
  const verified = await application.completeEmailVerification({ challengeCapability: begun.challengeCapability, verificationCode: "12345678" });
  await application.startCheckout({ preparationCapability, trustedSessionToken: verified.trustedSessionToken });
  const attempt = [...repository.attempts.values()][0];
  const creationCount = checkoutProvider.requests.length;
  const emailCount = email.verificationRequests.length + email.resultRequests.length;
  const reconcile = () => application.reconcilePaymentAttempt(attempt.id, { dispatchFulfillment: false });
  const exhausted = shortHarness(6, reconcile); assert.equal((await exhausted.run()).stopped, 1);
  assert.equal(repository.verifiedPayments.size, 0); assert.equal(repository.jobs.size, 0);
  clock = "2026-09-06T02:00:00.000Z";
  checkoutProvider.setReconciliationState(attempt.providerCheckoutSessionId, {
    providerPaymentId: "pi_f003_late", paymentIntentPurchaseReference: attempt.purchaseIntentId, paymentStatus: "paid", checkoutStatus: "complete",
  });
  const recovered = longHarness(reconcile); assert.equal((await recovered.run()).settled, 1);
  const duplicate = longHarness(reconcile); assert.equal((await duplicate.run()).settled, 1);
  assert.equal(repository.verifiedPayments.size, 1); assert.equal(repository.jobs.size, 1);
  assert.equal(checkoutProvider.requests.length, creationCount); assert.equal(email.verificationRequests.length + email.resultRequests.length, emailCount);
  assert.equal(grants.issueCalls.length, 0); assert.equal(grants.providerInvocationCalls, 0); assert.equal(dispatcher.jobIds.length, 0);
});

await check("operator alert is unverified, privacy-safe, and does not imply fulfillment/payment authority", () => {
  const notice = { notificationType: "action_required", incidentCode: "payment_reconciliation_stopped", purchaseIntentId: id,
    paymentState: "unverified", amount: 980, currency: "jpy", deliveryState: "unknown", fulfillmentState: "not_authorized", eventOccurredAt: now, elapsedSeconds: 3600 };
  const payload = formatOperatorDiscordNotification(notice);
  assert.match(payload.content, /Payment: unverified/u); assert.match(payload.content, /not proof of payment/u);
  assert.doesNotMatch(payload.content, /67000000|@example|cs_test|pi_f003|Paid order/u); assert.deepEqual(payload.allowed_mentions, { parse: [] });
  assert.throws(() => formatOperatorDiscordNotification({ ...notice, paymentState: "verified" }), /PAYLOAD_INVALID/u);
  assert.throws(() => formatOperatorDiscordNotification({ ...notice, incidentCode: "manual_review" }), /PAYLOAD_INVALID/u);
});

await check("expand migration preserves legacy operator query except exact new-incident isolation", () => {
  const original = readFileSync("supabase/migrations/0022_operator_discord_notifications_r1.sql", "utf8").replaceAll("\r\n", "\n");
  const migration = readFileSync("supabase/migrations/0027_f003_payment_reconciliation_followup.sql", "utf8").replaceAll("\r\n", "\n");
  const extract = text => text.match(/create(?: or replace)? function public\.claim_production_operator_notification_batch_v1\([\s\S]*?\$function\$;/u)[0];
  const restored = extract(migration).replace("create or replace function", "create function")
    .replace("    and operator_outbox.incident_code <> 'payment_reconciliation_stopped'\n", "")
    .replace("      and operator_outbox.incident_code is distinct from 'payment_reconciliation_stopped'\n", "");
  assert.equal(restored, extract(original));
  assert.doesNotMatch(migration, /create(?: or replace)? function public\.(?:record_rc2_stripe_evidence|reserve_rc2_payment_attempt|claim_rc2_payment_reconciliation_batch_v1|finish_rc2_payment_reconciliation_v1)/u);
  assert.doesNotMatch(migration, /(?:delete from|truncate|drop table)|update public\.production_(?:purchase_intents|payment_attempts|verified_payments|fulfillment_jobs)\b/iu);
  const runtime = readFileSync("lib/payment/production/reconciliation-scheduler-runtime-service.ts", "utf8");
  assert.match(runtime, /timeout: 5_000/u); assert.match(runtime, /maxNetworkRetries: 0/u); assert.match(runtime, /dispatchFulfillment: false/u);
});
console.log(`F003 reconciliation: ${passed}/${passed} PASS; external operations=0`);
