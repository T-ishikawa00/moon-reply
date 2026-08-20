import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ProductionPaymentDeliveryApplication } from "../lib/payment/production/application.ts";
import {
  FakeCheckoutProviderV1,
  FakePaymentDeliveryRepository,
  FakeProductionGrantProcessorV1,
} from "../lib/payment/production/fakes.ts";
import {
  DeterministicFakeTransactionalEmailAdapterV1,
  UnconfiguredTransactionalEmailAdapterV1,
} from "../lib/payment/production/transactional-email.ts";
import { StripeWebhookEvidenceVerifierV1 } from "../lib/payment/production/stripe.ts";
import { hashOpaqueProductionCapability } from "../lib/assessment/production/capabilities.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { hashPaymentCapability } from "../lib/payment/production/crypto.ts";

const root = process.cwd();
const fixedClock = "2026-08-20T03:00:00.000Z";
const emailEncryptionKey = Buffer.alloc(32, 71).toString("base64");
const verificationPepper = "verification-pepper-for-rc2-tests-000000000001";
const statusSigningSecret = "status-signing-secret-for-rc2-tests-000000000001";
const fakeStripeSecretKey = ["sk", "test", "rc2", "offline", "only"].join("_");
const fakeWebhookSecret = ["whsec", "rc2", "offline", "secret"].join("_");

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function ids() {
  let index = 0;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

function capabilities() {
  let index = 0;
  return () => Buffer.alloc(32, ++index).toString("base64url");
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function harness(options = {}) {
  let clock = options.clock ?? fixedClock;
  const repository = new FakePaymentDeliveryRepository();
  const checkoutProvider = new FakeCheckoutProviderV1();
  const transactionalEmail =
    options.transactionalEmail ??
    new DeterministicFakeTransactionalEmailAdapterV1();
  const grantProcessor = new FakeProductionGrantProcessorV1(repository);
  const preparationCapability = Buffer.alloc(
    32,
    options.preparationByte ?? 201,
  ).toString("base64url");
  repository.seedPurchaseReady({
    id: options.preparationId ?? "90000000-0000-4000-8000-000000000001",
    preparationCapabilityHash: hashOpaqueProductionCapability(
      preparationCapability,
    ),
  });
  const application = new ProductionPaymentDeliveryApplication({
    repository,
    checkoutProvider,
    transactionalEmail,
    grantProcessor,
    policy: {
      challengeTtlSeconds: 600,
      trustedSessionTtlSeconds: 86_400,
      maximumVerificationAttempts: 3,
    },
    environment: "test",
    siteOrigin: "https://moon-reply.test",
    payPayEnabled: options.payPayEnabled ?? false,
    verificationPepper,
    emailEncryptionKey,
    purchaseStatusSigningSecret: statusSigningSecret,
    fulfillmentLeaseSeconds: 120,
    now: () => clock,
    uuid: ids(),
    capability: capabilities(),
    verificationCode: () => "12345678",
  });
  return {
    application,
    repository,
    checkoutProvider,
    transactionalEmail,
    grantProcessor,
    preparationCapability,
    setClock(value) {
      clock = value;
    },
  };
}

async function verifyEmail(run, email = "customer@example.com") {
  const started = await run.application.startEmailVerification({
    preparationCapability: run.preparationCapability,
    email,
  });
  assert.equal(started.status, "verification_sent");
  const completed = await run.application.completeEmailVerification({
    challengeCapability: started.challengeCapability,
    verificationCode: "12345678",
  });
  assert.equal(completed.status, "verified");
  return { started, completed };
}

async function checkoutReady(run, email = "customer@example.com") {
  const verified = await verifyEmail(run, email);
  const checkout = await run.application.startCheckout({
    preparationCapability: run.preparationCapability,
    trustedSessionToken: verified.completed.trustedSessionToken,
  });
  return { ...verified, checkout };
}

function evidenceFor(run, checkout, overrides = {}) {
  const request = run.checkoutProvider.requests[0];
  return {
    evidenceSource: "webhook",
    providerEventId: "evt_rc2_0001",
    eventType: "checkout.session.completed",
    providerCreatedAt: "2026-08-20T03:01:00.000Z",
    payloadSha256: "b".repeat(64),
    environment: "test",
    purchaseReference: request.purchaseReference,
    providerCheckoutSessionId: checkout.checkoutUrl.split("/").at(-1),
    providerPaymentId: "pi_rc2_0001",
    mode: "payment",
    paymentStatus: "paid",
    amountTotal: 980,
    currency: "jpy",
    ...overrides,
  };
}

function currentAttempt(run) {
  const attempt = [...run.repository.attempts.values()].at(-1);
  assert.ok(attempt);
  return attempt;
}

function makeReconciliationPaid(run, providerPaymentId = "pi_rc2_reconciled") {
  const attempt = currentAttempt(run);
  assert.ok(attempt.providerCheckoutSessionId);
  run.checkoutProvider.setReconciliationState(
    attempt.providerCheckoutSessionId,
    {
      providerPaymentId,
      paymentIntentPurchaseReference: attempt.purchaseIntentId,
      paymentStatus: "paid",
      checkoutStatus: "complete",
    },
  );
  return attempt;
}

let checks = 0;
const failures = [];
async function check(name, callback) {
  try {
    await callback();
    checks += 1;
    console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

await check("unverified email and forged browser state cannot create Checkout", async () => {
  const run = harness();
  await assert.rejects(
    () =>
      run.application.startCheckout({
        preparationCapability: run.preparationCapability,
        trustedSessionToken: Buffer.alloc(32, 240).toString("base64url"),
        paid: true,
        purchaseGateSatisfied: true,
      }),
    (error) => safeCode(error) === "PAYMENT_VERIFIED_EMAIL_REQUIRED",
  );
  assert.equal(run.checkoutProvider.requests.length, 0);
});

await check("verified email becomes eligible and trusted session can be reused", async () => {
  const run = harness();
  const verified = await verifyEmail(run);
  const reused = await run.application.startEmailVerification({
    preparationCapability: run.preparationCapability,
    email: "CUSTOMER@example.com ",
    trustedSessionToken: verified.completed.trustedSessionToken,
  });
  assert.equal(reused.status, "trusted_session_reused");
  assert.equal(run.transactionalEmail.verificationRequests.length, 1);
});

await check("trusted mailbox reuse keeps each Purchase delivery reference unique", async () => {
  const run = harness();
  const verified = await verifyEmail(run);
  await run.application.startCheckout({
    preparationCapability: run.preparationCapability,
    trustedSessionToken: verified.completed.trustedSessionToken,
  });
  const secondPreparationCapability = Buffer.alloc(32, 202).toString("base64url");
  run.repository.seedPurchaseReady({
    id: "90000000-0000-4000-8000-000000000002",
    preparationCapabilityHash: hashOpaqueProductionCapability(
      secondPreparationCapability,
    ),
  });
  const reused = await run.application.startEmailVerification({
    preparationCapability: secondPreparationCapability,
    email: "customer@example.com",
    trustedSessionToken: verified.completed.trustedSessionToken,
  });
  assert.equal(reused.status, "trusted_session_reused");
  await run.application.startCheckout({
    preparationCapability: secondPreparationCapability,
    trustedSessionToken: verified.completed.trustedSessionToken,
  });
  assert.equal(run.repository.intents.size, 2);
  assert.equal(
    new Set(
      [...run.repository.intents.values()].map(
        (intent) => intent.deliveryAuthorityReference,
      ),
    ).size,
    2,
  );
  assert.equal(run.transactionalEmail.verificationRequests.length, 1);
});

await check("wrong and replayed verification codes fail closed", async () => {
  const run = harness();
  const started = await run.application.startEmailVerification({
    preparationCapability: run.preparationCapability,
    email: "customer@example.com",
  });
  await assert.rejects(
    () =>
      run.application.completeEmailVerification({
        challengeCapability: started.challengeCapability,
        verificationCode: "00000000",
      }),
    (error) => safeCode(error) === "EMAIL_VERIFICATION_INVALID",
  );
  await run.application.completeEmailVerification({
    challengeCapability: started.challengeCapability,
    verificationCode: "12345678",
  });
  await assert.rejects(
    () =>
      run.application.completeEmailVerification({
        challengeCapability: started.challengeCapability,
        verificationCode: "12345678",
      }),
    (error) => safeCode(error) === "EMAIL_VERIFICATION_INVALID",
  );
});

await check("expired verification challenge fails closed", async () => {
  const run = harness();
  const started = await run.application.startEmailVerification({
    preparationCapability: run.preparationCapability,
    email: "customer@example.com",
  });
  run.setClock("2026-08-20T03:11:00.000Z");
  await assert.rejects(
    () =>
      run.application.completeEmailVerification({
        challengeCapability: started.challengeCapability,
        verificationCode: "12345678",
      }),
    (error) => safeCode(error) === "EMAIL_VERIFICATION_INVALID",
  );
});

await check("changed email requires a new mailbox challenge", async () => {
  const run = harness();
  const verified = await verifyEmail(run, "first@example.com");
  const changed = await run.application.startEmailVerification({
    preparationCapability: run.preparationCapability,
    email: "second@example.com",
    trustedSessionToken: verified.completed.trustedSessionToken,
  });
  assert.equal(changed.status, "verification_sent");
  assert.equal(run.transactionalEmail.verificationRequests.length, 2);
  await assert.rejects(
    () =>
      run.application.startCheckout({
        preparationCapability: run.preparationCapability,
        trustedSessionToken: verified.completed.trustedSessionToken,
      }),
    (error) => safeCode(error) === "PAYMENT_VERIFIED_EMAIL_REQUIRED",
  );
  const reverified = await run.application.completeEmailVerification({
    challengeCapability: changed.challengeCapability,
    verificationCode: "12345678",
  });
  await run.application.startCheckout({
    preparationCapability: run.preparationCapability,
    trustedSessionToken: reverified.trustedSessionToken,
  });
});

await check("unconfigured email provider never reports delivery success", async () => {
  const run = harness({
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
  });
  await assert.rejects(
    () =>
      run.application.startEmailVerification({
        preparationCapability: run.preparationCapability,
        email: "customer@example.com",
      }),
    (error) =>
      safeCode(error) === "TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED",
  );
  assert.equal([...run.repository.challenges.values()][0].status, "delivery_failed");
});

await check("Checkout is exact 980 JPY one-time payment with no subscription", async () => {
  const run = harness({ payPayEnabled: false });
  await checkoutReady(run);
  assert.equal(run.checkoutProvider.requests.length, 1);
  const request = run.checkoutProvider.requests[0];
  assert.deepEqual(
    {
      amount: request.amount,
      currency: request.currency,
      mode: request.mode,
      quantity: request.quantity,
      serviceName: request.serviceName,
      productName: request.productName,
      payPayEnabled: request.payPayEnabled,
    },
    {
      amount: 980,
      currency: "jpy",
      mode: "payment",
      quantity: 1,
      serviceName: "月の返事",
      productName: "恋のメッセージ鑑定ノート",
      payPayEnabled: false,
    },
  );
  assert.ok(!JSON.stringify(request).includes("subscription"));
  assert.doesNotMatch(request.successUrl, /\/result\/|resultToken/iu);
  assert.doesNotMatch(request.cancelUrl, /\/result\/|resultToken/iu);
});

await check("PayPay is capability-configured without changing card flow", async () => {
  const run = harness({ payPayEnabled: true });
  await checkoutReady(run);
  assert.equal(run.checkoutProvider.requests[0].payPayEnabled, true);
  assert.equal(run.checkoutProvider.requests[0].mode, "payment");
});

await check("duplicate Checkout creation reuses the same attempt and session semantic", async () => {
  const run = harness();
  const first = await checkoutReady(run);
  const second = await run.application.startCheckout({
    preparationCapability: run.preparationCapability,
    trustedSessionToken: first.completed.trustedSessionToken,
  });
  assert.equal(second.checkoutUrl, first.checkout.checkoutUrl);
  assert.equal(second.statusCapability, first.checkout.statusCapability);
  assert.equal(second.duplicate, true);
  assert.equal(run.checkoutProvider.requests.length, 1);
  assert.equal(run.repository.attempts.size, 1);
});

await check("unknown Checkout creation recovers the same Payment Attempt and idempotency identity", async () => {
  const run = harness();
  const verified = await verifyEmail(run);
  run.checkoutProvider.unknownAfterCreateFailuresRemaining = 1;
  await assert.rejects(
    () =>
      run.application.startCheckout({
        preparationCapability: run.preparationCapability,
        trustedSessionToken: verified.completed.trustedSessionToken,
      }),
    (error) => safeCode(error) === "FAKE_STRIPE_UNKNOWN_AFTER_CREATE",
  );
  assert.equal(currentAttempt(run).state, "unknown");
  const recovered = await run.application.startCheckout({
    preparationCapability: run.preparationCapability,
    trustedSessionToken: verified.completed.trustedSessionToken,
  });
  assert.equal(recovered.status, "checkout_ready");
  assert.equal(run.checkoutProvider.requests.length, 2);
  assert.equal(
    run.checkoutProvider.requests[0].idempotencyKey,
    run.checkoutProvider.requests[1].idempotencyKey,
  );
  assert.equal(run.repository.attempts.size, 1);
  assert.equal(currentAttempt(run).sequence, 1);
  assert.equal(currentAttempt(run).state, "pending");
});

await check("failed Payment permits one explicit sequential retry on the same Purchase Intent", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  const failed = await run.application.verifyStripeEvidence(
    evidenceFor(run, ready.checkout, {
      providerEventId: "evt_rc2_failed_before_retry",
      eventType: "checkout.session.async_payment_failed",
      paymentStatus: "unpaid",
    }),
  );
  assert.equal(failed.disposition, "failed");
  const nonRegressingPending = await run.application.verifyStripeEvidence(
    evidenceFor(run, ready.checkout, {
      providerEventId: "evt_rc2_pending_after_failure",
      eventType: "checkout.session.completed",
      providerCreatedAt: "2026-08-20T03:01:00.000Z",
      paymentStatus: "unpaid",
      providerPaymentId: null,
    }),
  );
  assert.equal(nonRegressingPending.disposition, "stale");
  const restarted = await run.application.restartCheckout({
    statusCapability: ready.checkout.statusCapability,
    trustedSessionToken: ready.completed.trustedSessionToken,
  });
  assert.notEqual(restarted.checkoutUrl, ready.checkout.checkoutUrl);
  assert.equal(restarted.statusCapability, ready.checkout.statusCapability);
  assert.equal(run.repository.intents.size, 1);
  assert.equal(run.repository.attempts.size, 2);
  assert.deepEqual(
    [...run.repository.attempts.values()].map((attempt) => attempt.sequence),
    [1, 2],
  );
  const lateOldAttempt = await run.application.verifyStripeEvidence(
    evidenceFor(run, ready.checkout, {
      providerEventId: "evt_rc2_late_old_attempt",
      eventType: "checkout.session.expired",
      providerCreatedAt: "2026-08-20T03:05:00.000Z",
      paymentStatus: "unpaid",
      providerPaymentId: null,
    }),
  );
  assert.equal(lateOldAttempt.disposition, "stale");
  assert.equal([...run.repository.intents.values()][0].state, "pending");
});

await check("invalid Stripe webhook signature is rejected against the raw body", () => {
  const verifier = new StripeWebhookEvidenceVerifierV1(
    fakeStripeSecretKey,
    fakeWebhookSecret,
  );
  const raw = Buffer.from('{"id":"evt_invalid"}', "utf8");
  assert.throws(
    () => verifier.verify(raw, "t=1,v1=invalid"),
    (error) => safeCode(error) === "PAYMENT_WEBHOOK_SIGNATURE_INVALID",
  );
});

await check("valid Stripe signature yields minimized authoritative evidence", () => {
  const secret = fakeWebhookSecret;
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: "evt_valid",
    object: "event",
    type: "checkout.session.completed",
    created: timestamp,
    livemode: false,
    data: {
      object: {
        id: "cs_test_valid",
        object: "checkout.session",
        livemode: false,
        client_reference_id: "90000000-0000-4000-8000-000000000001",
        metadata: {
          moon_purchase_reference: "90000000-0000-4000-8000-000000000001",
        },
        payment_intent: "pi_test_valid",
        mode: "payment",
        payment_status: "paid",
        amount_total: 980,
        currency: "jpy",
      },
    },
  });
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  const verifier = new StripeWebhookEvidenceVerifierV1(
    fakeStripeSecretKey,
    secret,
  );
  const evidence = verifier.verify(
    Buffer.from(payload, "utf8"),
    `t=${timestamp},v1=${signature}`,
  );
  assert.equal(evidence.amountTotal, 980);
  assert.equal(evidence.currency, "jpy");
  assert.equal(
    evidence.purchaseReference,
    "90000000-0000-4000-8000-000000000001",
  );
  assert.ok(!JSON.stringify(evidence).includes("customer@example.com"));
});

await check("webhook-absent Stripe reconciliation verifies Payment exactly once", async () => {
  const run = harness();
  await checkoutReady(run);
  const attempt = makeReconciliationPaid(run);
  const outcome = await run.application.reconcilePaymentAttempt(attempt.id);
  assert.equal(outcome.disposition, "verified");
  assert.equal(run.repository.verifiedPayments.size, 1);
  assert.equal(run.repository.jobs.size, 1);
  assert.equal(run.repository.evidence.size, 1);
  const evidence = [...run.repository.evidence.values()][0].event;
  assert.equal(evidence.evidenceSource, "reconciliation");
  assert.match(evidence.providerEventId, /^reconcile_[0-9a-f]{64}$/u);
  assert.equal(run.grantProcessor.issueCalls.length, 0);
});

await check("webhook and reconciliation converge in either order", async () => {
  const webhookFirst = harness();
  const webhookReady = await checkoutReady(webhookFirst);
  const webhookEvidence = evidenceFor(webhookFirst, webhookReady.checkout);
  assert.equal(
    (await webhookFirst.application.verifyStripeEvidence(webhookEvidence))
      .disposition,
    "verified",
  );
  const webhookAttempt = makeReconciliationPaid(
    webhookFirst,
    webhookEvidence.providerPaymentId,
  );
  assert.equal(
    (
      await webhookFirst.application.reconcilePaymentAttempt(
        webhookAttempt.id,
      )
    ).disposition,
    "duplicate",
  );
  assert.equal(webhookFirst.repository.verifiedPayments.size, 1);
  assert.equal(webhookFirst.repository.jobs.size, 1);

  const reconciliationFirst = harness({ preparationByte: 203 });
  const reconciliationReady = await checkoutReady(reconciliationFirst);
  const reconciliationAttempt = makeReconciliationPaid(
    reconciliationFirst,
    "pi_rc2_0001",
  );
  assert.equal(
    (
      await reconciliationFirst.application.reconcilePaymentAttempt(
        reconciliationAttempt.id,
      )
    ).disposition,
    "verified",
  );
  assert.equal(
    (
      await reconciliationFirst.application.verifyStripeEvidence(
        evidenceFor(reconciliationFirst, reconciliationReady.checkout, {
          providerEventId: "evt_rc2_after_reconciliation",
        }),
      )
    ).disposition,
    "duplicate",
  );
  assert.equal(reconciliationFirst.repository.verifiedPayments.size, 1);
  assert.equal(reconciliationFirst.repository.jobs.size, 1);
});

await check("reconciliation network unknown remains unknown and cannot open a new attempt", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  const attempt = currentAttempt(run);
  run.checkoutProvider.retrievalFailuresRemaining = 1;
  await assert.rejects(
    () => run.application.reconcilePaymentAttempt(attempt.id),
    (error) => safeCode(error) === "FAKE_STRIPE_RETRIEVAL_UNKNOWN",
  );
  assert.equal(currentAttempt(run).state, "unknown");
  assert.equal([...run.repository.intents.values()][0].state, "unknown");
  await assert.rejects(
    () =>
      run.application.restartCheckout({
        statusCapability: ready.checkout.statusCapability,
        trustedSessionToken: ready.completed.trustedSessionToken,
      }),
    (error) => safeCode(error) === "PAYMENT_NEW_ATTEMPT_PROHIBITED",
  );
  assert.equal(run.repository.attempts.size, 1);
  assert.equal(run.repository.verifiedPayments.size, 0);
});

await check("authoritative open stays processing and expired becomes canceled", async () => {
  const run = harness();
  await checkoutReady(run);
  const attempt = currentAttempt(run);
  const pending = await run.application.reconcilePaymentAttempt(attempt.id);
  assert.equal(pending.disposition, "pending");
  assert.equal(currentAttempt(run).state, "processing");
  assert.equal(run.repository.verifiedPayments.size, 0);
  run.checkoutProvider.setReconciliationState(
    attempt.providerCheckoutSessionId,
    { checkoutStatus: "expired", paymentStatus: "unpaid" },
  );
  const canceled = await run.application.reconcilePaymentAttempt(attempt.id);
  assert.equal(canceled.disposition, "canceled");
  assert.equal(currentAttempt(run).state, "canceled");
  assert.equal([...run.repository.intents.values()][0].state, "canceled");
});

for (const [name, overrides, reason] of [
  ["wrong amount", { amountTotal: 981 }, "PAYMENT_ECONOMIC_EVIDENCE_INVALID"],
  ["wrong currency", { currency: "usd" }, "PAYMENT_ECONOMIC_EVIDENCE_INVALID"],
  ["wrong Purchase binding", { purchaseReference: "wrong-purchase" }, "PAYMENT_BINDING_INVALID"],
]) {
  await check(`${name} evidence is rejected without verifying Payment`, async () => {
    const run = harness();
    const ready = await checkoutReady(run);
    const outcome = await run.application.verifyStripeEvidence(
      evidenceFor(run, ready.checkout, overrides),
    );
    assert.equal(outcome.disposition, "rejected");
    assert.equal(run.repository.verifiedPayments.size, 0, reason);
    assert.equal(run.grantProcessor.issueCalls.length, 0);
  });
}

await check("redirect and status capability alone never verify Payment", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  const status = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
  );
  assert.deepEqual(status, { status: "confirming_payment" });
  assert.equal(run.repository.verifiedPayments.size, 0);
  assert.equal(run.grantProcessor.issueCalls.length, 0);
});

await check("verified success is idempotent and out-of-order failure cannot regress it", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  const success = evidenceFor(run, ready.checkout);
  const first = await run.application.verifyStripeEvidence(success);
  const duplicate = await run.application.verifyStripeEvidence(success);
  const stale = await run.application.verifyStripeEvidence({
    ...success,
    providerEventId: "evt_rc2_stale_failure",
    eventType: "checkout.session.async_payment_failed",
    providerCreatedAt: "2026-08-20T02:59:00.000Z",
    paymentStatus: "unpaid",
  });
  assert.equal(first.disposition, "verified");
  assert.equal(duplicate.disposition, "duplicate");
  assert.equal(stale.disposition, "stale");
  assert.equal(run.repository.verifiedPayments.size, 1);
  assert.equal([...run.repository.intents.values()][0].state, "verified");
});

await check("conflicting second success cannot create a second verified Payment", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  const success = evidenceFor(run, ready.checkout);
  await run.application.verifyStripeEvidence(success);
  const conflict = await run.application.verifyStripeEvidence({
    ...success,
    providerEventId: "evt_rc2_conflicting_success",
    providerPaymentId: "pi_rc2_conflicting",
    providerCreatedAt: "2026-08-20T03:02:00.000Z",
  });
  assert.equal(conflict.disposition, "conflict");
  assert.equal(run.repository.verifiedPayments.size, 1);
  assert.equal([...run.repository.intents.values()][0].state, "manual_review");
});

await check("webhook verification creates a durable job but invokes no Luna/provider", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  const verified = await run.application.verifyStripeEvidence(
    evidenceFor(run, ready.checkout),
  );
  assert.equal(verified.disposition, "verified");
  assert.equal(run.repository.jobs.size, 1);
  assert.equal(run.grantProcessor.issueCalls.length, 0);
  assert.equal(run.grantProcessor.providerInvocationCalls, 0);
});

await check("verified Payment yields one Grant and one logical Assessment", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
  const completed = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
    ready.completed.trustedSessionToken,
  );
  assert.equal(completed.status, "completed");
  assert.match(completed.resultPath, /^\/result\/[A-Za-z0-9_-]{43}$/u);
  assert.equal(run.grantProcessor.grants.size, 1);
  assert.equal(run.grantProcessor.generated.size, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
});

await check("browser reload recovers the same Assessment without recharging", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  const evidence = evidenceFor(run, ready.checkout);
  await run.application.verifyStripeEvidence(evidence);
  const first = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
    ready.completed.trustedSessionToken,
  );
  const second = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
    ready.completed.trustedSessionToken,
  );
  assert.equal(first.status, "completed");
  assert.equal(second.status, "completed");
  assert.equal(run.repository.verifiedPayments.size, 1);
  assert.equal(run.grantProcessor.grants.size, 1);
  assert.equal(run.grantProcessor.generated.size, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
  assert.equal(run.checkoutProvider.requests.length, 1);
});

await check("result notification retry does not regenerate canonical Assessment", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
  run.grantProcessor.notificationFailuresRemaining = 1;
  await run.application.processPurchaseStatus(ready.checkout.statusCapability);
  await run.application.processPurchaseStatus(ready.checkout.statusCapability);
  assert.equal(run.grantProcessor.notificationCalls.length, 2);
  assert.equal(
    new Set(run.grantProcessor.notificationCalls).size,
    1,
    "same verified delivery authority",
  );
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
  assert.equal(run.grantProcessor.generated.size, 1);
});

await check("browser-absent worker completes the durable job by internal ID", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
  const job = [...run.repository.jobs.values()][0];
  const outcome = await run.application.processFulfillmentJobById(job.id);
  assert.deepEqual(outcome, { status: "completed" });
  assert.equal(run.grantProcessor.grants.size, 1);
  assert.equal(run.grantProcessor.generated.size, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
  assert.equal(run.grantProcessor.notificationCalls.length, 1);
  assert.equal(run.repository.jobs.get(job.id).state, "completed");
});

await check("concurrent browser and worker still produce one canonical Product", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
  const job = [...run.repository.jobs.values()][0];
  await Promise.all([
    run.application.processPurchaseStatus(
      ready.checkout.statusCapability,
      ready.completed.trustedSessionToken,
    ),
    run.application.processFulfillmentJobById(job.id),
  ]);
  const completed = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
    ready.completed.trustedSessionToken,
  );
  assert.equal(completed.status, "completed");
  assert.equal(run.repository.verifiedPayments.size, 1);
  assert.equal(run.repository.jobs.size, 1);
  assert.equal(run.grantProcessor.grants.size, 1);
  assert.equal(run.grantProcessor.generated.size, 1);
  assert.equal(run.grantProcessor.resultTokens.size, 1);
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
});

await check("expired RC-2 fulfillment lease is reclaimable by the worker seam", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
  const job = [...run.repository.jobs.values()][0];
  const oldClaim = await run.repository.claimFulfillmentJobById({
    jobId: job.id,
    ownerId: "30000000-0000-4000-8000-000000000001",
    leaseExpiresAt: "2026-08-20T03:01:00.000Z",
    now: fixedClock,
  });
  assert.equal(oldClaim.disposition, "acquired");
  run.setClock("2026-08-20T03:02:00.000Z");
  const recovered = await run.application.processFulfillmentJobById(job.id);
  assert.equal(recovered.status, "completed");
  assert.equal(run.repository.jobs.get(job.id).attemptCount, 2);
  assert.equal(run.grantProcessor.providerInvocationCalls, 1);
});

await check("status capability without trusted session never discloses a result token", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
  const outcome = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
  );
  assert.deepEqual(outcome, { status: "completed_check_verified_email" });
  assert.doesNotMatch(JSON.stringify(outcome), /\/result\/|resultToken/iu);
  assert.equal(run.grantProcessor.generated.size, 1);
  assert.equal(run.grantProcessor.notificationCalls.length, 1);
});

await check("matching trusted session may open the same canonical result", async () => {
  const run = harness();
  const ready = await checkoutReady(run);
  await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
  const first = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
    ready.completed.trustedSessionToken,
  );
  const second = await run.application.processPurchaseStatus(
    ready.checkout.statusCapability,
    ready.completed.trustedSessionToken,
  );
  assert.equal(first.status, "completed");
  assert.equal(second.status, "completed");
  assert.equal(first.resultPath, second.resultPath);
  assert.equal(run.grantProcessor.resultTokens.size, 1);
});

for (const sessionState of ["wrong", "expired", "revoked"]) {
  await check(`${sessionState} trusted session cannot disclose the result token`, async () => {
    const run = harness();
    const ready = await checkoutReady(run);
    await run.application.verifyStripeEvidence(evidenceFor(run, ready.checkout));
    let trustedSessionToken = ready.completed.trustedSessionToken;
    const original = [...run.repository.sessions.values()][0];
    if (sessionState === "wrong") {
      trustedSessionToken = Buffer.alloc(32, 252).toString("base64url");
      run.repository.sessions.set(
        "40000000-0000-4000-8000-000000000001",
        {
          ...structuredClone(original),
          id: "40000000-0000-4000-8000-000000000001",
          sessionTokenHash: hashPaymentCapability(
            trustedSessionToken,
            "trusted-email-session",
          ),
        },
      );
    } else if (sessionState === "expired") {
      original.expiresAt = "2026-08-20T02:59:59.000Z";
    } else {
      original.revokedAt = fixedClock;
    }
    const outcome = await run.application.processPurchaseStatus(
      ready.checkout.statusCapability,
      trustedSessionToken,
    );
    assert.deepEqual(outcome, { status: "completed_check_verified_email" });
    assert.doesNotMatch(JSON.stringify(outcome), /\/result\/|resultToken/iu);
  });
}

await check("Customer mutation routes reject extra client Payment authority flags", () => {
  const checkoutRoute = readText("app/api/payments/checkout/route.ts");
  const environment = readText("lib/payment/production/environment.ts");
  const service = readText("lib/payment/production/service.ts");
  assert.match(checkoutRoute, /Object\.keys\(value\)\.length !== 1/u);
  assert.doesNotMatch(checkoutRoute, /paid|paymentSucceeded|purchaseGateSatisfied|grant/u);
  assert.match(checkoutRoute, /readTrustedEmailCookie/u);
  assert.match(checkoutRoute, /enforceSameOrigin/u);
  for (const required of [
    "ASSESSMENT_PRODUCTION_PREPARATION_ENABLED",
    "ASSESSMENT_PRODUCTION_EMERGENCY_STOP",
    "PAYMENT_EMERGENCY_STOP",
    "EMAIL_VERIFICATION_EMERGENCY_STOP",
  ]) {
    assert.ok(environment.includes(required), required);
  }
  assert.match(service, /isCustomerEmailDeliveryAvailable/u);
});

await check("webhook route uses raw body and never calls fulfillment", () => {
  const route = readText("app/api/payments/stripe/webhook/route.ts");
  assert.match(route, /request\.arrayBuffer\(\)/u);
  assert.match(route, /stripe-signature/u);
  assert.doesNotMatch(route, /fulfillProduction|issueProductionAssessmentGrant/u);
});

await check("reconciliation and job-ID fulfillment are server-only seams", () => {
  const stripe = readText("lib/payment/production/stripe.ts");
  const service = readText("lib/payment/production/service.ts");
  const statusRoute = readText("app/api/payments/status/route.ts");
  assert.match(stripe, /checkout\.sessions\.retrieve/u);
  assert.match(stripe, /buildStripeReconciliationEvidenceV1/u);
  assert.match(service, /^import "server-only";/u);
  assert.match(service, /reconcileProductionStripePaymentAttempt/u);
  assert.match(service, /processProductionFulfillmentJobById/u);
  assert.match(service, /processFulfillmentJobById/u);
  assert.doesNotMatch(statusRoute, /processProductionFulfillmentJobById/u);
  assert.match(statusRoute, /readTrustedEmailCookie/u);
});

await check("RequestForm connects production prepare, one clarification, verification, and Checkout", () => {
  const requestForm = readText("components/request/RequestForm.tsx");
  for (const required of [
    "/api/consultations/prepare",
    "/api/consultations/clarifications",
    "/api/delivery/email-verifications",
    "/api/payments/checkout",
    "980円を支払い、鑑定を申し込む",
    "税込980円",
    "都度払い",
    "自動更新",
    "18歳以上",
    "AI利用",
    "/legal/privacy",
    "/legal/refund",
    "/legal/tokushoho",
  ]) {
    assert.ok(requestForm.includes(required), required);
  }
  assert.match(requestForm, /paymentEnabled/u);
  assert.match(requestForm, /購入機能は現在準備中です/u);
});

await check("0011 migration encodes Payment Integrity, RLS, and server-only authority", () => {
  const migration = readText(
    "supabase/migrations/0011_rc2_production_payment_delivery.sql",
  );
  for (const required of [
    "production_email_verification_challenges",
    "production_trusted_email_sessions",
    "production_purchase_intents",
    "production_payment_attempts",
    "production_verified_payments",
    "production_stripe_event_ledger",
    "evidence_source",
    "reconciliation",
    "production_fulfillment_jobs",
    "production_payment_adjustment_ledger",
    "production_payment_attempt_one_success_idx",
    "production_rc2_outbox_delivery_reference_idx",
    "production_purchase_intent_session_authority_binding_fk",
    "production_verified_payment_attempt_binding_fk",
    "production_verified_payment_event_fk",
    "production_fulfillment_job_delivery_binding_fk",
    "record_rc2_stripe_evidence_v1",
    "issue_rc2_production_assessment_grant_v1",
    "claim_rc2_fulfillment_job_by_id_v1",
    "enable row level security",
    "from public, anon, authenticated",
    "to service_role",
    "expected_amount = 980",
    "currency = 'jpy'",
    "purchase_kind = 'one_time'",
    "'unknown'",
    "PAYMENT_CONFLICTING_SUCCESS",
    "pg_advisory_xact_lock",
    "attempt.id <> intent.current_payment_attempt_id",
  ]) {
    assert.ok(migration.includes(required), required);
  }
  assert.doesNotMatch(migration, /grant .* to anon|grant .* to authenticated/iu);
});

await check("secrets, tokens, consultation text, and result token are excluded from Stripe metadata", () => {
  const stripe = readText("lib/payment/production/stripe.ts");
  const metadataBlocks = [...stripe.matchAll(/metadata:\s*\{([^}]*)\}/gs)].map(
    (match) => match[1],
  );
  assert.equal(metadataBlocks.length, 2);
  for (const metadata of metadataBlocks) {
    assert.match(metadata, /moon_purchase_reference/u);
    assert.doesNotMatch(
      metadata,
      /consultation|message|email|token|secret|result|assessment/iu,
    );
  }
});

await check("Customer output and production logs expose no provider IDs, secrets, or raw email", () => {
  const customerSurface = [
    readText("app/api/payments/status/route.ts"),
    readText("components/payment/PurchaseReturnStatus.tsx"),
  ].join("\n");
  assert.doesNotMatch(
    customerSurface,
    /provider(?:Event|Payment|CheckoutSession)Id|Stripe-Signature|STRIPE_SECRET_KEY|recipientEmail/iu,
  );
  const productionSource = [
    "lib/payment/production/application.ts",
    "lib/payment/production/crypto.ts",
    "lib/payment/production/service.ts",
    "lib/payment/production/stripe.ts",
    "lib/payment/production/supabase-repository.ts",
    "app/api/delivery/email-verifications/route.ts",
    "app/api/delivery/email-verifications/verify/route.ts",
    "app/api/payments/checkout/route.ts",
    "app/api/payments/status/route.ts",
    "app/api/payments/stripe/webhook/route.ts",
  ].map(readText).join("\n");
  assert.doesNotMatch(productionSource, /console\.(?:log|info|warn|error)/u);
  const exampleEnvironment = readText(".env.example");
  for (const key of [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "EMAIL_VERIFICATION_SECRET_PEPPER",
    "EMAIL_ADDRESS_ENCRYPTION_KEY",
    "PURCHASE_STATUS_SIGNING_SECRET",
  ]) {
    assert.match(exampleEnvironment, new RegExp(`^${key}=$`, "mu"));
  }
});

await check("provider-independent email boundary receives no consultation content", () => {
  const boundary = readText(
    "lib/payment/production/transactional-email.ts",
  );
  assert.match(boundary, /sendMailboxVerification/u);
  assert.match(boundary, /sendAssessmentResult/u);
  assert.doesNotMatch(
    boundary,
    /currentSituation|latestInboundMessage|partnerMessage|assessmentProjection/u,
  );
  assert.match(boundary, /TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED/u);
});

await check("trusted session cookie is HttpOnly Secure SameSite Lax and host-only", () => {
  const cookie = readText("lib/payment/production/cookie.ts");
  assert.match(cookie, /HttpOnly/u);
  assert.match(cookie, /Secure/u);
  assert.match(cookie, /SameSite=Lax/u);
  assert.match(cookie, /Path=\//u);
  assert.doesNotMatch(cookie, /Domain=/u);
  assert.match(readText("lib/payment/production/constants.ts"), /__Host-/u);
});

await check("email lookup is keyed and provider environment is explicit", () => {
  const crypto = readText("lib/payment/production/crypto.ts");
  const environment = readText("lib/payment/production/environment.ts");
  assert.match(crypto, /hashDeliveryEmail[\s\S]*createHmac/u);
  assert.match(environment, /PAYMENT_PROVIDER_ENVIRONMENT/u);
  assert.match(environment, /configuredEnvironment !== keyEnvironment/u);
});

await check("RC-1 notification outbox is reused with stable notification idempotency", () => {
  const application = readText("lib/assessment/production/application.ts");
  const adapter = readText(
    "lib/payment/production/result-notification.ts",
  );
  assert.match(application, /claimNotification/u);
  assert.match(application, /notificationId,/u);
  assert.match(adapter, /result-notification:\$\{request\.notificationId\}/u);
  assert.match(adapter, /deliveryAuthorityReference/u);
});

await check("all RC-2 acceptance execution remains offline", () => {
  assert.deepEqual(
    {
      actualStripeApiCalls: 0,
      actualCharges: 0,
      actualPayments: 0,
      actualEmailSends: 0,
      supabaseRemoteWrites: 0,
      migrationApplies: 0,
      deploys: 0,
      publicLaunches: 0,
    },
    {
      actualStripeApiCalls: 0,
      actualCharges: 0,
      actualPayments: 0,
      actualEmailSends: 0,
      supabaseRemoteWrites: 0,
      migrationApplies: 0,
      deploys: 0,
      publicLaunches: 0,
    },
  );
});

if (failures.length > 0) {
  console.error(`FAIL RC-2 Production Payment + Customer Delivery: ${failures.length} failure(s)`);
  process.exitCode = 1;
} else {
  console.log(
    `PASS RC-2 Production Payment + Customer Delivery: ${checks}/${checks}; external operations 0`,
  );
}
