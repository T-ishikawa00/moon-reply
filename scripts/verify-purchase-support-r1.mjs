import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { PurchaseSupportAuthorityResolverV1 } from "../lib/support/purchase-authority.ts";
import { PurchaseSupportInquiryApplicationV1 } from "../lib/support/purchase-inquiry-application.ts";
import {
  purchaseSupportPayload,
  ResendTransactionalEmailAdapterV1,
} from "../lib/payment/production/resend-transactional-email-runtime.ts";
import { purchaseSupportInquiryCategories } from "../lib/support/types.ts";

const root = process.cwd();
const customerUserId = "11111111-1111-4111-8111-111111111111";
const foreignCustomerUserId = "22222222-2222-4222-8222-222222222222";
const purchaseIntentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const attemptId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const verifiedPaymentId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const preparationId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const fulfillmentJobId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const deliveryId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const purchasedAt = "2026-08-31T23:48:00.000Z";
let passed = 0;

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function assertRuntimeError(error, code, status) {
  assert.ok(error instanceof M2RuntimeError);
  assert.equal(error.safeCode, code);
  assert.equal(error.httpStatus, status);
  return true;
}

function intent(overrides = {}) {
  return {
    id: purchaseIntentId,
    preparationId,
    verifiedEmailAuthorityId: null,
    trustedEmailSessionId: null,
    customerOwnershipBindingId: "99999999-9999-4999-8999-999999999999",
    deliveryAuthorityReference: "delivery-authority-reference",
    emailCiphertext: "sensitive-email-ciphertext",
    expectedProductCode: "moon_reply_love_message_assessment_note_v1",
    expectedAmount: 980,
    currency: "jpy",
    purchaseKind: "one_time",
    environment: "live",
    provider: "stripe",
    state: "verified",
    currentPaymentAttemptId: attemptId,
    successfulPaymentId: verifiedPaymentId,
    statusCapabilityHash: "a".repeat(64),
    finalConfirmationAcceptedAt: purchasedAt,
    createdAt: purchasedAt,
    updatedAt: purchasedAt,
    ...overrides,
  };
}

function attempt(overrides = {}) {
  return {
    id: attemptId,
    purchaseIntentId,
    sequence: 1,
    state: "succeeded",
    providerIdempotencyKeyHash: "b".repeat(64),
    providerCheckoutSessionId: "cs_live_sensitive_session",
    providerPaymentId: "pi_sensitive_payment",
    providerCheckoutUrl: "https://checkout.stripe.example/sensitive",
    lastProviderEventCreatedAt: purchasedAt,
    createdAt: purchasedAt,
    updatedAt: purchasedAt,
    ...overrides,
  };
}

function job(state = "pending", overrides = {}) {
  return {
    id: fulfillmentJobId,
    purchaseIntentId,
    verifiedPaymentId,
    preparationId,
    deliveryAuthorityReference: "delivery-authority-reference",
    state,
    ownerId: null,
    leaseExpiresAt: null,
    attemptCount: 0,
    grantId: null,
    logicalAssessmentId: null,
    lastErrorCode: null,
    completedAt: state === "completed" ? purchasedAt : null,
    ...overrides,
  };
}

function repository(options = {}) {
  const selectedIntent = intent(options.intent);
  return {
    async findPurchaseIntentByReference(reference) {
      return reference === purchaseIntentId ? selectedIntent : null;
    },
    async findAuthenticatedPurchaseStatus(input) {
      if (
        input.customerUserId !== customerUserId ||
        input.statusCapabilityHash !== selectedIntent.statusCapabilityHash ||
        options.foreign
      ) {
        return null;
      }
      return {
        purchaseIntent: selectedIntent,
        fulfillmentJob:
          options.fulfillmentJob === undefined
            ? job("pending")
            : options.fulfillmentJob,
      };
    },
    async findPaymentAttemptById(id) {
      if (id !== attemptId) return null;
      return options.paymentAttempt ?? attempt();
    },
    async resolveAuthenticatedResultDeliveryId(input) {
      assert.equal(input.customerUserId, customerUserId);
      assert.equal(input.purchaseIntentId, purchaseIntentId);
      return options.deliveryId ?? null;
    },
  };
}

function emailRequest(overrides = {}) {
  return {
    customerEmail: "verified.customer@example.com",
    authority: {
      purchaseIntentId,
      purchasedAt,
      productName: "恋のメッセージ鑑定ノート",
      amount: 980,
      currency: "jpy",
      moonPurchaseReference: purchaseIntentId,
      paymentState: {
        purchase: "verified",
        attempt: "succeeded",
        verified: true,
      },
      fulfillmentState: "pending",
      deliveryState: "pending",
    },
    category: "missing_delivery",
    customerMessage: "確認をお願いします。",
    messageIdempotencyKey: `purchase-support:${"1".repeat(64)}`,
    ...overrides,
  };
}

await check("processing purchase resolves from active ownership authority", async () => {
  const snapshot = await new PurchaseSupportAuthorityResolverV1(
    repository(),
  ).resolveOwnedPurchase({ customerUserId, purchaseIntentId });
  assert.deepEqual(snapshot, {
    purchaseIntentId,
    purchasedAt,
    productName: "恋のメッセージ鑑定ノート",
    amount: 980,
    currency: "jpy",
    moonPurchaseReference: purchaseIntentId,
    paymentState: {
      purchase: "verified",
      attempt: "succeeded",
      verified: true,
    },
    fulfillmentState: "pending",
    deliveryState: "pending",
  });
});

await check("completed purchase resolves completed fulfillment and delivery", async () => {
  let delivered = false;
  const result = await new PurchaseSupportInquiryApplicationV1({
    authority: new PurchaseSupportAuthorityResolverV1(
      repository({ fulfillmentJob: job("completed"), deliveryId }),
    ),
    operatorEmail: {
      async send(request) {
        assert.equal(request.authority.fulfillmentState, "completed");
        assert.equal(request.authority.deliveryState, "completed");
        assert.equal(request.authority.paymentState.verified, true);
        delivered = true;
        return { providerMessageReference: "email_completed" };
      },
    },
  }).submit({
    customerUserId,
    customerEmail: "verified.customer@example.com",
    purchaseIntentId,
    category: "other",
    customerMessage: null,
    idempotencyKey: "client-key-completed-1",
  });
  assert.deepEqual(result, { status: "accepted" });
  assert.equal(delivered, true);
});

await check("foreign Customer selector gets the common ownership 404", async () => {
  const authority = new PurchaseSupportAuthorityResolverV1(
    repository({ foreign: true }),
  );
  let emailCalls = 0;
  const application = new PurchaseSupportInquiryApplicationV1({
    authority,
    operatorEmail: {
      async send() {
        emailCalls += 1;
        return { providerMessageReference: "email_should_not_send" };
      },
    },
  });
  await assert.rejects(
    () =>
      application.submit({
        customerUserId: foreignCustomerUserId,
        customerEmail: "foreign@example.com",
        purchaseIntentId,
        category: "missing_delivery",
        customerMessage: "",
        idempotencyKey: "client-key-1234567890",
      }),
    (error) =>
      assertRuntimeError(error, "PURCHASE_SUPPORT_PURCHASE_NOT_FOUND", 404),
  );
  assert.equal(emailCalls, 0);
});

await check("payment and fulfillment association mismatches fail closed", async () => {
  const wrongPurchase = "77777777-7777-4777-8777-777777777777";
  await assert.rejects(
    () =>
      new PurchaseSupportAuthorityResolverV1(
        repository({ paymentAttempt: attempt({ purchaseIntentId: wrongPurchase }) }),
      ).resolveOwnedPurchase({ customerUserId, purchaseIntentId }),
    (error) =>
      assertRuntimeError(
        error,
        "PURCHASE_SUPPORT_AUTHORITY_INTEGRITY_FAILED",
        503,
      ),
  );
  await assert.rejects(
    () =>
      new PurchaseSupportAuthorityResolverV1(
        repository({
          fulfillmentJob: job("pending", {
            verifiedPaymentId: "88888888-8888-4888-8888-888888888888",
          }),
        }),
      ).resolveOwnedPurchase({ customerUserId, purchaseIntentId }),
    (error) =>
      assertRuntimeError(
        error,
        "PURCHASE_SUPPORT_AUTHORITY_INTEGRITY_FAILED",
        503,
      ),
  );
});

await check("application sends only normalized validated support content", async () => {
  const sent = [];
  const application = new PurchaseSupportInquiryApplicationV1({
    authority: new PurchaseSupportAuthorityResolverV1(repository()),
    operatorEmail: {
      async send(request) {
        sent.push(request);
        return { providerMessageReference: "email_valid_1" };
      },
    },
  });
  const result = await application.submit({
    customerUserId,
    customerEmail: "verified.customer@example.com",
    purchaseIntentId,
    category: "refund_request",
    customerMessage: "  返金条件を確認したいです。\r\nお願いします。  ",
    idempotencyKey: "client-key-1234567890",
  });
  assert.deepEqual(result, { status: "accepted" });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].customerMessage, "返金条件を確認したいです。\nお願いします。");
  assert.equal(sent[0].customerEmail, "verified.customer@example.com");
  assert.match(sent[0].messageIdempotencyKey, /^purchase-support:[0-9a-f]{64}$/u);
});

await check("plain text length and control-character boundaries reject", async () => {
  let authorityCalls = 0;
  const application = new PurchaseSupportInquiryApplicationV1({
    authority: {
      async resolveOwnedPurchase() {
        authorityCalls += 1;
        return null;
      },
    },
    operatorEmail: { async send() { throw new Error("must not send"); } },
  });
  for (const customerMessage of ["x".repeat(1_001), "unsafe\tcontrol"]) {
    await assert.rejects(
      () =>
        application.submit({
          customerUserId,
          customerEmail: "verified.customer@example.com",
          purchaseIntentId,
          category: "other",
          customerMessage,
          idempotencyKey: "client-key-1234567890",
        }),
      (error) =>
        assertRuntimeError(error, "PURCHASE_SUPPORT_REQUEST_INVALID", 400),
    );
  }
  assert.equal(authorityCalls, 0);
});

await check("operator mail is structured, escaped, fixed-header, and secret-minimal", () => {
  const customerMessage = "<script>alert('message')</script>";
  const payload = purchaseSupportPayload(
    "月の返事 <sender@example.com>",
    "operator@example.com",
    emailRequest({ customerMessage }),
  );
  assert.equal(payload.to, "operator@example.com");
  assert.equal(payload.subject, "月の返事｜購入に関するお問い合わせ");
  assert.doesNotMatch(payload.subject, /script|message/u);
  for (const required of [
    "verified.customer@example.com",
    "2026年9月1日 08:48（日本時間）",
    "恋のメッセージ鑑定ノート",
    "¥980",
    purchaseIntentId,
    "purchase=verified; attempt=succeeded; verified=yes",
    "pending",
    "支払ったのに鑑定が届かない",
    customerMessage,
  ]) {
    assert.match(payload.text, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
  assert.match(payload.html, /&lt;script&gt;alert\(&#39;message&#39;\)&lt;\/script&gt;/u);
  assert.doesNotMatch(
    JSON.stringify(payload),
    /cs_live_sensitive_session|pi_sensitive_payment|sensitive-email-ciphertext|delivery-authority-reference/u,
  );
});

await check("Resend failure or missing provider ID never becomes accepted", async () => {
  for (const response of [
    { data: null, error: new Error("offline") },
    { data: null, error: null },
  ]) {
    const adapter = new ResendTransactionalEmailAdapterV1(
      { async send() { return response; } },
      {
        fromAddress: "sender@example.com",
        fromName: "月の返事",
      },
    );
    const application = new PurchaseSupportInquiryApplicationV1({
      authority: new PurchaseSupportAuthorityResolverV1(repository()),
      operatorEmail: {
        send: (request) => adapter.sendPurchaseSupport("operator@example.com", request),
      },
    });
    await assert.rejects(
      () => application.submit({
        customerUserId,
        customerEmail: "verified.customer@example.com",
        purchaseIntentId,
        category: "missing_delivery",
        customerMessage: null,
        idempotencyKey: "client-key-provider-failure",
      }),
      (error) =>
        assertRuntimeError(error, "PURCHASE_SUPPORT_EMAIL_DELIVERY_FAILED", 503),
    );
  }
});

await check("Account and Contact expose the exact purchase-linked Customer flow", () => {
  const account = text("app/account/AccountNoteGallery.tsx");
  const accountPage = text("app/account/page.tsx");
  const contact = text("app/contact/page.tsx");
  const form = text("components/support/PurchaseLinkedSupportForm.tsx");
  assert.match(account, /history\.map/u);
  assert.match(account, /\/contact\?purchase=/u);
  assert.match(account, /この購入について問い合わせる/u);
  assert.match(accountPage, /isPurchaseSupportEmailEnabled/u);
  assert.match(contact, /resolveCustomerAccountPage/u);
  assert.match(contact, /item\.purchaseIntentId === purchaseSelector/u);
  assert.match(contact, /year: "numeric"/u);
  assert.match(form, /購入日時：\{purchaseDateLabel\}/u);
  assert.match(form, /恋のメッセージ鑑定ノート/u);
  assert.match(form, /¥980/u);
  assert.match(form, /maxLength=\{1_000\}/u);
  assert.match(form, />お問い合わせを受け付けました<\/h2>/u);
  assert.doesNotMatch(form, /受付メールを送信しました/u);
  assert.deepEqual(
    purchaseSupportInquiryCategories.map(({ label }) => label),
    [
      "支払ったのに鑑定が届かない",
      "返金を希望する",
      "二重請求の疑い",
      "その他",
    ],
  );
});

await check("POST boundary uses fresh identity, owned authority, rate limit, and safe response", () => {
  const route = text("app/api/support/purchase-inquiries/route.ts");
  const service = text("lib/support/service.ts");
  const authority = text("lib/support/purchase-authority.ts");
  assert.match(route, /enforceSameOrigin\(request\)/u);
  assert.match(route, /readStrictJsonRequest\(request, 8_192\)/u);
  assert.match(route, /data: \{ status: "accepted" \}/u);
  assert.doesNotMatch(route, /customerEmail|providerMessageReference/u);
  assert.match(service, /getFreshIdentity\(\)/u);
  assert.match(service, /identity\.verifiedEmail/u);
  assert.match(service, /identity\.customerUserId/u);
  assert.match(service, /enforceCustomerAuthRateLimit/u);
  assert.match(authority, /findAuthenticatedPurchaseStatus/u);
  assert.match(authority, /resolveAuthenticatedResultDeliveryId/u);
  assert.doesNotMatch(
    [route, service, authority].join("\n"),
    /processAuthenticatedPurchaseStatus|create_customer_support_case_v1|refund|completeFulfillment|dispatchFulfillment/u,
  );
});

await check("Preparing copy is exact and polling behavior is untouched", () => {
  const presentation = text("lib/payment/purchase-return-presentation.ts");
  assert.match(
    presentation,
    /通常は数分で完成します。内容によっては5〜10分ほどかかる場合があります。/u,
  );
  assert.match(presentation, /この画面を閉じても/u);
  assert.match(presentation, /完成したら確認済みのメールにもお知らせします/u);
  assert.match(presentation, /追加のお支払いは必要ありません/u);
  assert.doesNotMatch(presentation, /countdown|estimated|ETA|polling/u);
});

console.log(
  `PURCHASE_SUPPORT_R1=PASS checks=${passed} provider_calls=0 network_calls=0 database_writes=0 stripe_writes=0`,
);
