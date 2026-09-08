import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fixture, consultationFor, case5Outputs, ScriptedTransport } from "./paid-recovery-fixtures.mjs";
import { ProductionFulfillmentApplication } from "../../lib/assessment/production/application.ts";
import { SupabaseProductionFulfillmentRepository } from "../../lib/assessment/production/supabase-repository.ts";
import { SupabaseAssessmentRepository } from "../../lib/assessment/runtime/supabase-repository.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { ProductionPaymentDeliveryApplication } from "../../lib/payment/production/application.ts";
import { SupabasePaymentDeliveryRepository } from "../../lib/payment/production/supabase-repository.ts";
import { FakeProductionFulfillmentDispatcherV1 } from "../../lib/payment/production/fakes.ts";
import { DeterministicFakeTransactionalEmailAdapterV1 } from "../../lib/payment/production/transactional-email.ts";
import { VerifiedEmailResultNotificationAdapterV1 } from "../../lib/payment/production/result-notification.ts";
import { SupabasePaidRecoveryRepository } from "../../lib/payment/production/paid-recovery-supabase-repository.ts";
import { createPaidRecoveryTransport, SupabasePaidProviderBudgetRepository } from "../../lib/assessment/production/paid-recovery-transport.ts";

// Every repository and both applications are real. Fakes represent only external
// providers (AI, Stripe, queue acceptance, email). No fake grants/completion.
export async function createPaidRecoveryApplication(rest, options = {}) {
  const selected = fixture("polite_thank_you_with_draft");
  let clock = Date.parse(options.now ?? selected.fixed_clock);
  const now = () => new Date(clock).toISOString();
  const runtimeRepository = new SupabaseAssessmentRepository(rest.url, "synthetic-local-service-role");
  const lifecycleRepository = new SupabaseProductionFulfillmentRepository(rest.url, "synthetic-local-service-role");
  const paymentRepository = new SupabasePaymentDeliveryRepository(rest.url, "synthetic-local-service-role");
  const recoveryRepository = new SupabasePaidRecoveryRepository(rest.url, "synthetic-local-service-role");
  const transport = options.transport ?? new ScriptedTransport(case5Outputs());
  const originalInvoke = transport.invoke.bind(transport);
  transport.failure = null;
  transport.invoke = async request => {
    if (transport.failure && ["PB-03", "PB-04", "PB-05", "PB-06"].includes(request.stageId)) throw transport.failure;
    return originalInvoke(request);
  };
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const assessment = new ProductionFulfillmentApplication({ runtimeRepository, lifecycleRepository, transport,
    catalog, model: "gpt-5.6-luna", now, timeZone: selected.timezone, allowSyntheticPurchaseAuthority: true,
    paidTransportFactory: ({ logicalAssessmentId, ownerId }) => createPaidRecoveryTransport({
      transport, repository: new SupabasePaidProviderBudgetRepository(rest.url, "synthetic-local-service-role"),
      logicalAssessmentId, ownerId, now,
    }),
  });
  const checkoutProvider = { requests: [], async createCheckoutSession(request) {
    this.requests.push(request); const id = `cs_test_local_${randomUUID().replaceAll("-", "")}`;
    return { providerCheckoutSessionId: id, checkoutUrl: `https://checkout.stripe.com/c/pay/${id}` };
  }, async retrieveCheckoutSession() { throw new Error("UNCONFIGURED_LOCAL_STRIPE_READ"); } };
  const dispatcher = new FakeProductionFulfillmentDispatcherV1();
  const email = new DeterministicFakeTransactionalEmailAdapterV1();
  const key = Buffer.alloc(32, 71).toString("base64");
  const grantProcessor = {
    issueProductionAssessmentGrant: authority => assessment.issueAssessmentGrant(authority),
    fulfillProductionAssessmentGrant: grant => assessment.fulfillAssessmentGrant(grant),
    recoverCompletedProductionAssessmentGrant: grant => assessment.recoverCompletedAssessmentGrant(grant),
    async processResultNotification(reference) {
      const notification = await lifecycleRepository.findNotificationIdByDeliveryAuthorityReference(reference);
      assert.ok(notification);
      await assessment.processNotification(notification,
        new VerifiedEmailResultNotificationAdapterV1(paymentRepository, email, key, "https://moon-reply.test"));
    },
  };
  const payment = new ProductionPaymentDeliveryApplication({ repository: paymentRepository, checkoutProvider,
    recoveryRepository,
    transactionalEmail: email, grantProcessor, fulfillmentDispatcher: dispatcher,
    policy: { challengeTtlSeconds: 600, trustedSessionTtlSeconds: 86400, maximumVerificationAttempts: 3 },
    environment: "test", siteOrigin: "https://moon-reply.test", payPayEnabled: false,
    verificationPepper: "synthetic-local-verification-pepper-0001", emailEncryptionKey: key,
    purchaseStatusSigningSecret: "synthetic-local-status-signing-secret-0001", fulfillmentLeaseSeconds: 960,
    now, verificationCode: () => "12345678" });
  return { assessment, payment, runtimeRepository, lifecycleRepository, paymentRepository, recoveryRepository, transport, checkoutProvider, catalog,
    dispatcher, email, now, advance(seconds) { clock += seconds * 1000; },
    async seedVerifiedPurchase() {
      const prepared = await assessment.prepare(options.consultation ?? consultationFor(selected), randomUUID(), options.localCandidate ?? false);
      assert.equal(prepared.status, "purchase_ready");
      const started = await payment.startEmailVerification({ preparationCapability: prepared.preparationCapability, email: "synthetic@example.com" });
      assert.equal(started.status, "verification_sent");
      const verified = await payment.completeEmailVerification({ challengeCapability: started.challengeCapability, verificationCode: "12345678" });
      assert.equal(verified.status, "verified");
      const checkout = await payment.startCheckout({ preparationCapability: prepared.preparationCapability, trustedSessionToken: verified.trustedSessionToken });
      const request = checkoutProvider.requests.at(-1);
      assert.equal(checkout.status, "checkout_ready");
      const evidence = { evidenceSource: "webhook", providerEventId: `evt_local_${randomUUID().replaceAll("-", "")}`,
        eventType: "checkout.session.completed", providerCreatedAt: now(), payloadSha256: "b".repeat(64),
        environment: "test", purchaseReference: request.purchaseReference,
        providerCheckoutSessionId: checkout.checkoutUrl.split("/").at(-1), providerPaymentId: `pi_local_${randomUUID().replaceAll("-", "")}`,
        mode: "payment", paymentStatus: "paid", amountTotal: 980, currency: "jpy" };
      const recorded = await payment.verifyStripeEvidence(evidence, false);
      assert.equal(recorded.disposition, "verified");
      return { ...recorded, purchaseIntentId: request.purchaseReference, checkout, trustedSessionToken: verified.trustedSessionToken };
    },
  };
}
