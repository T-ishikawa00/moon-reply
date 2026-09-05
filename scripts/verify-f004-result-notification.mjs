import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (!existsSync(base) && existsSync(`${base}.ts`)) return { url: pathToFileURL(`${base}.ts`).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.endsWith(".ts")) return { format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true },
      }).outputText };
    return next(url, context);
  },
});

// A hard offline fence, including accidental SDK or repository initialization.
let externalCalls = 0;
globalThis.fetch = async () => { externalCalls += 1; throw new Error("F004_EXTERNAL_CALL_FORBIDDEN"); };
const { ProductionFulfillmentApplication } = await import("../lib/assessment/production/application.ts");
const { FakeProductionFulfillmentRepository } = await import("../lib/assessment/production/fakes.ts");
const { FakeAssessmentRepository } = await import("../lib/assessment/runtime/fakes.ts");
const { hashProductionSnapshot } = await import("../lib/assessment/production/capabilities.ts");
const { decodeAndVerifyProductionCanonicalProjection } = await import("../lib/assessment/production/canonical-delivery.ts");
const { VerifiedEmailResultNotificationAdapterV1 } = await import("../lib/payment/production/result-notification.ts");
const { ResendTransactionalEmailAdapterV1, createResendTransactionalEmailAdapterV1 } = await import("../lib/payment/production/resend-transactional-email-runtime.ts");
const { encryptDeliveryEmail } = await import("../lib/payment/production/crypto.ts");
const { decryptNotificationEnvelope, encryptNotificationEnvelope } = await import("../lib/payment/production/notification-envelope.ts");
const { CustomerIdentityAuthApplicationV1 } = await import("../lib/customer-auth/application.ts");
const { FakeCustomerAuthProviderV1, FakeCustomerIdentityRepositoryV1 } = await import("../lib/customer-auth/fakes.ts");
const { resolveCustomerAccountResult } = await import("../lib/customer-auth/account-result-resolution.ts");

const projection = JSON.parse(readFileSync(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-executions/2026-08-19-case5-polite-draft-v17-fcd54a0c/v17-customer-projections-v1.json", "utf8",
)).projections[0].projection;
const fixtureKey = Buffer.alloc(32, 41).toString("base64");
const start = "2026-09-06T00:00:00.000Z";
const catalog = { catalogVersion: "runtime-stage-catalog-v17.0.0", promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
  schemaSetVersion: "pipeline-schema-runtime-v6.0.0", stageTopologyVersion: "split-base-candidate-v1", definitions: [] };

function harness({ providerMode = "success", failOnceAt } = {}) {
  let instant = start;
  let generationCalls = 0;
  let authorityReads = 0;
  let authorityMode = "valid";
  const runtime = new FakeAssessmentRepository();
  const repo = new FakeProductionFulfillmentRepository(runtime, { failOnceAt });
  const notificationId = randomUUID();
  const deliveryId = randomUUID();
  const delivery = { id: deliveryId, logicalAssessmentId: randomUUID(), runtimeRunId: randomUUID(),
    projection: structuredClone(projection), projectionHash: hashProductionSnapshot(projection),
    deliveryAuthorityReference: "synthetic-verified-delivery-reference", createdAt: start };
  repo.deliveries.set(deliveryId, delivery);
  runtime.reports.set(delivery.runtimeRunId, { id: "existing-synthetic-report" });
  repo.notifications.set(notificationId, { id: notificationId, deliveryId,
    deliveryAuthorityReference: delivery.deliveryAuthorityReference, status: "pending", attemptCount: 0, ownerId: null });
  const initialDelivery = structuredClone(delivery);
  const client = {
    requests: [], accepted: new Map(), mode: providerMode, beforeSend: null,
    async send(payload, options) {
      this.requests.push(structuredClone({ payload, options }));
      if (this.beforeSend) await this.beforeSend();
      if (this.mode === "reject") return { data: null, error: { name: "validation_error", statusCode: 422 } };
      if (this.mode === "conflict") return { data: null, error: { name: "invalid_idempotent_request", statusCode: 409 } };
      if (this.mode === "concurrent") return { data: null, error: { name: "concurrent_idempotent_requests", statusCode: 409 } };
      if (this.mode === "server_error") return { data: null, error: { name: "internal_server_error", statusCode: 500 } };
      if (this.mode === "malformed") return { data: { id: "" }, error: null };
      const key = options.idempotencyKey;
      const previous = this.accepted.get(key);
      if (previous) assert.equal(JSON.stringify(payload), JSON.stringify(previous));
      this.accepted.set(key, structuredClone(payload));
      if (this.mode === "response_lost" && this.requests.length === 1) return {
        data: null, error: { name: "application_error", statusCode: null },
      };
      if (this.mode === "throw" && this.requests.length === 1) throw new Error("synthetic timeout");
      return { data: { id: "synthetic-provider-message" }, error: null };
    },
  };
  const emailRepo = { async resolveDeliveryEmailCiphertext() {
    authorityReads += 1;
    if (authorityMode === "missing") return null;
    if (authorityMode === "corrupt") return "invalid-ciphertext";
    return encryptDeliveryEmail(authorityMode === "changed" ? "changed@example.com" : "customer@example.com", fixtureKey);
  } };
  const adapter = (origin = "https://moon-reply.example", name = "月の返事", key = fixtureKey) =>
    new VerifiedEmailResultNotificationAdapterV1(emailRepo,
      new ResendTransactionalEmailAdapterV1(client, { fromAddress: "no-reply@example.com", fromName: name }), key, origin);
  const application = () => new ProductionFulfillmentApplication({ runtimeRepository: runtime,
    lifecycleRepository: repo, catalog, model: "gpt-5.6-luna", now: () => instant,
    fulfillmentLeaseSeconds: 60,
    transport: { async invoke() { generationCalls += 1; throw new Error("GENERATION_FORBIDDEN"); } },
  });
  const token = () => new URL(client.requests[0].payload.text.match(/https:\/\/\S+/u)[0]).pathname.split("/").at(-1);
  return { runtime, repo, notificationId, deliveryId, client, adapter, application, token,
    authority(mode) { authorityMode = mode; }, advance(ms) { instant = new Date(Date.parse(instant) + ms).toISOString(); },
    now: () => instant, reads: () => authorityReads,
    async run(selectedAdapter = adapter()) { return application().processNotification(notificationId, selectedAdapter); },
    async assertUnchanged() {
      assert.equal(generationCalls, 0); assert.equal(runtime.reports.size, 1);
      assert.equal(repo.deliveries.size, 1); assert.deepEqual(repo.deliveries.get(deliveryId), initialDelivery);
      assert.equal(repo.generationStartedTransitions, 0); assert.equal(externalCalls, 0);
    },
    async assertStable() {
      assert.equal(repo.credentials.size, 1);
      assert.equal(repo.notificationIdentities.size, 1);
      for (const request of client.requests) assert.deepEqual(request, client.requests[0]);
      const resolved = await application().resolveResult(token());
      assert.equal(resolved.deliveryId, deliveryId);
      assert.deepEqual(resolved.projection, projection);
      assert.equal([...repo.credentials.values()][0].revokedAt, null);
      await this.assertUnchanged();
    },
  };
}

let passed = 0;
async function check(name, run) {
  try { await run(); passed += 1; console.log(`[PASS] ${name}`); }
  catch { console.error(`[FAIL] ${name}`); process.exitCode = 1; throw new Error("F004_SYNTHETIC_CHECK_FAILED"); }
}
const rejects = (run, code) => assert.rejects(run, error => !code || error.safeCode === code);
const lastError = h => h.repo.notificationIdentities.get(h.notificationId).lastErrorCode;

await check("TEST-1 normal send resolves the canonical URL and stores only encrypted payload/hash", async () => {
  const h = harness(); assert.deepEqual(await h.run(), { status: "sent", duplicate: false });
  await h.assertStable();
  const ciphertext = h.repo.notifications.get(h.notificationId).payloadCiphertext;
  assert.ok(ciphertext.startsWith("v1.")); assert.ok(!ciphertext.includes(h.token()));
  assert.ok(!ciphertext.includes("customer@example.com"));
  const prepared = decryptNotificationEnvelope(h.notificationId, ciphertext, fixtureKey);
  assert.deepEqual(prepared.payload, h.client.requests[0].payload);
  assert.equal(prepared.messageIdempotencyKey, `result-notification:${h.notificationId}`);
});

for (const failure of ["missing", "corrupt"]) await check(`TEST-2 ${failure} authority fails before send and safely retries`, async () => {
  const h = harness(); h.authority(failure); await rejects(() => h.run());
  assert.equal(h.client.requests.length, 0); assert.equal(h.repo.credentials.size, 0);
  h.authority("valid"); await h.run(); await h.assertStable();
});

await check("TEST-2 local URL validation fails before credential activation or provider send", async () => {
  const h = harness(); await rejects(() => h.run(h.adapter("http://unsafe.example")));
  assert.equal(h.client.requests.length, 0); assert.equal(h.repo.credentials.size, 0);
  assert.equal(lastError(h), "PRODUCTION_NOTIFICATION_SEND_NOT_ATTEMPTED");
  await h.run(); await h.assertStable();
});

for (const providerMode of ["response_lost", "throw"]) await check(`TEST-3 accepted then ${providerMode}: exact payload survives application restart/config drift`, async () => {
  const h = harness({ providerMode }); await rejects(() => h.run());
  assert.equal(lastError(h), "PRODUCTION_NOTIFICATION_SEND_OUTCOME_UNKNOWN");
  await h.assertStable(); h.authority("changed");
  await h.run(h.adapter("https://changed.example", "変更済み名称"));
  assert.equal(h.reads(), 1); assert.equal(h.client.requests.length, 2);
  assert.equal(h.client.accepted.size, 1); await h.assertStable();
});

await check("TEST-4 provider accepted then completeNotification fails: retry reuses exact payload", async () => {
  const h = harness({ failOnceAt: "completeNotification" }); await rejects(() => h.run());
  assert.equal(lastError(h), "PRODUCTION_NOTIFICATION_ACK_OUTCOME_UNKNOWN");
  await h.assertStable(); await h.run(); assert.equal(h.client.requests.length, 2); await h.assertStable();
});

await check("TEST-4 DB complete commits but response is lost: next claim is duplicate without another send", async () => {
  const h = harness(); const original = h.repo.completeNotification.bind(h.repo);
  h.repo.completeNotification = async input => { await original(input); throw new Error("lost DB response"); };
  await rejects(() => h.run()); assert.deepEqual(await h.run(), { status: "sent", duplicate: true });
  assert.equal(h.client.requests.length, 1); await h.assertStable();
});

await check("TEST-5 overlapping workers have one live owner, one credential and one send identity", async () => {
  const h = harness(); let release; let entered;
  const wait = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { entered = resolve; });
  h.client.beforeSend = async () => { entered(); await wait; };
  const first = h.run(); await started;
  await rejects(() => h.run(), "PRODUCTION_NOTIFICATION_NOT_AVAILABLE");
  release(); await first; assert.equal(h.client.requests.length, 1); await h.assertStable();
});

await check("TEST-5 expired lease takeover keeps the first URL valid and rejects stale completion", async () => {
  const h = harness(); let release; let entered;
  const wait = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { entered = resolve; });
  h.client.beforeSend = async () => { if (h.client.requests.length === 1) { entered(); await wait; } };
  const first = h.run().then(() => "unexpected", () => "fenced"); await started;
  h.advance(61000); await h.run(); release(); assert.equal(await first, "fenced");
  assert.equal(h.client.accepted.size, 1); await h.assertStable();
});

await check("TEST-5 stale owner cannot install or activate an alternate credential", async () => {
  const h = harness(); const first = h.adapter(); let entered; let release;
  const started = new Promise(resolve => { entered = resolve; });
  const wait = new Promise(resolve => { release = resolve; });
  const prepare = first.prepare.bind(first);
  first.prepare = async input => { const candidate = await prepare(input); entered(); await wait; return candidate; };
  const old = h.run(first).then(() => "unexpected", () => "fenced"); await started;
  h.advance(61000); await h.run(); release(); assert.equal(await old, "fenced");
  assert.equal(h.client.requests.length, 1); await h.assertStable();
});

await check("TEST-6 existing legacy sent notification exits without preparing or issuing credential", async () => {
  const h = harness(); h.repo.notifications.get(h.notificationId).status = "sent";
  assert.deepEqual(await h.run(), { status: "sent", duplicate: true });
  assert.equal(h.repo.credentials.size, 0); assert.equal(h.reads(), 0); assert.equal(h.client.requests.length, 0);
  await h.assertUnchanged();
});

await check("TEST-7 email failure preserves fresh Account ownership recovery and rejects other Customers", async () => {
  const h = harness({ providerMode: "response_lost" }); await rejects(() => h.run());
  const repo = new FakeCustomerIdentityRepositoryV1(); const provider = new FakeCustomerAuthProviderV1();
  const owner = randomUUID(); provider.currentIdentity = { customerUserId: owner,
    verifiedEmail: "customer@example.com", verifiedEmailSource: "supabase_email_otp" };
  repo.bindings.set("synthetic-preparation", { id: randomUUID(), preparationId: "synthetic-preparation",
    customerUserId: owner, state: "active" });
  const delivery = h.repo.deliveries.get(h.deliveryId);
  repo.seedResult(owner, { deliveryId: h.deliveryId,
    projection: decodeAndVerifyProductionCanonicalProjection(delivery.projection, delivery.projectionHash) });
  const app = new CustomerIdentityAuthApplicationV1({ repository: repo, provider, environment: {} });
  const resolve = () => resolveCustomerAccountResult({ authEnabled: true, deliveryId: h.deliveryId,
    getSessionState: () => provider.getFreshSessionState(), resolveOwnedResult: id => app.resolveOwnedResult(id) });
  assert.equal((await resolve()).state, "result");
  assert.deepEqual((await resolve()).result.projection, projection);
  provider.currentIdentity.customerUserId = randomUUID(); assert.equal((await resolve()).state, "not_found");
  provider.currentIdentity = null; assert.equal((await resolve()).state, "auth_required");
  await h.assertStable();
});

await check("credential/payload installation commits but response is lost: retry reads durable identity", async () => {
  const h = harness(); const prepare = h.repo.prepareNotificationEmail.bind(h.repo); let first = true;
  h.repo.prepareNotificationEmail = async input => {
    const value = await prepare(input); if (first) { first = false; throw new Error("lost prepare ack"); } return value;
  };
  await rejects(() => h.run()); const ciphertext = h.repo.notifications.get(h.notificationId).payloadCiphertext;
  assert.equal(h.client.requests.length, 0); await h.run();
  assert.equal(h.repo.notifications.get(h.notificationId).payloadCiphertext, ciphertext); await h.assertStable();
});

await check("prepare transaction failure activates no credential and sends nothing", async () => {
  const h = harness({ failOnceAt: "prepareNotificationEmail" }); await rejects(() => h.run());
  assert.equal(h.repo.credentials.size, 0); assert.equal(h.client.requests.length, 0);
  await h.run(); await h.assertStable();
});

await check("explicit provider rejection is distinct and retries the original payload", async () => {
  const h = harness({ providerMode: "reject" }); await rejects(() => h.run());
  assert.equal(lastError(h), "PRODUCTION_NOTIFICATION_SEND_REJECTED");
  h.client.mode = "success"; await h.run(); await h.assertStable();
});

for (const providerMode of ["concurrent", "server_error", "malformed"]) await check(`SDK ${providerMode} remains ambiguous`, async () => {
  const h = harness({ providerMode }); await rejects(() => h.run());
  assert.equal(lastError(h), "PRODUCTION_NOTIFICATION_SEND_OUTCOME_UNKNOWN");
  h.client.mode = "success"; await h.run(); await h.assertStable();
});

await check("provider payload conflict stops automated resend without rotating the URL", async () => {
  const h = harness({ providerMode: "conflict" }); await rejects(() => h.run());
  await rejects(() => h.run(), "PRODUCTION_NOTIFICATION_MANUAL_REVIEW");
  assert.equal(h.client.requests.length, 1); await h.assertStable();
});

await check("attempted legacy rows require review and cannot invent a new payload under the old key", async () => {
  const h = harness(); const row = h.repo.notifications.get(h.notificationId); row.status = "failed"; row.attemptCount = 1;
  await rejects(() => h.run(), "PRODUCTION_NOTIFICATION_MANUAL_REVIEW");
  assert.equal(h.repo.credentials.size, 0); assert.equal(h.client.requests.length, 0); await h.assertUnchanged();
});

await check("F004 adds no one-hour or eight-attempt recovery cutoff; identity stays fixed", async () => {
  const h = harness({ providerMode: "response_lost" }); await rejects(() => h.run()); h.advance(7200000);
  await h.run(); assert.equal(h.client.requests.length, 2); await h.assertStable();
  const retried = harness({ providerMode: "reject" });
  for (let i = 0; i < 8; i += 1) await rejects(() => retried.run());
  retried.client.mode = "success";
  await retried.run();
  assert.equal(retried.client.requests.length, 9); await retried.assertStable();
});

await check("envelope tamper, notification substitution and changed key fail closed before send", async () => {
  const h = harness({ providerMode: "response_lost" }); await rejects(() => h.run());
  const cipher = h.repo.notifications.get(h.notificationId).payloadCiphertext;
  assert.throws(() => decryptNotificationEnvelope(randomUUID(), cipher, fixtureKey));
  const parts = cipher.split("."); parts[2] = Buffer.alloc(16).toString("base64url");
  assert.throws(() => decryptNotificationEnvelope(h.notificationId, parts.join("."), fixtureKey));
  await rejects(() => h.run(h.adapter(undefined, undefined, Buffer.alloc(32, 42).toString("base64"))));
  assert.equal(lastError(h), "PRODUCTION_NOTIFICATION_SEND_NOT_ATTEMPTED");
  assert.equal(h.client.requests.length, 1); assert.ok(h.repo.notificationIdentities.get(h.notificationId).firstSendStartedAt);
  await h.run(); await h.assertStable();
});

await check("new encryption operations use fresh IVs; retries reuse authenticated ciphertext", async () => {
  const h = harness(); await h.run();
  const saved = h.repo.notifications.get(h.notificationId).payloadCiphertext;
  const prepared = decryptNotificationEnvelope(h.notificationId, saved, fixtureKey);
  const ivs = new Set([saved.split(".")[1]]);
  for (let i = 0; i < 128; i += 1) {
    const ciphertext = encryptNotificationEnvelope(h.notificationId, prepared, fixtureKey);
    const iv = ciphertext.split(".")[1];
    assert.equal(ivs.has(iv), false); ivs.add(iv);
    assert.deepEqual(decryptNotificationEnvelope(h.notificationId, ciphertext, fixtureKey), prepared);
  }
  assert.equal(h.repo.notifications.get(h.notificationId).payloadCiphertext, saved);
  await h.assertStable();
});

await check("production SDK errors cannot log recipient, result token, body or provider detail", async () => {
  const originalFetch = globalThis.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalError = console.error;
  const recordedLogs = [];
  let syntheticRequests = 0;
  try {
    process.env.NODE_ENV = "production";
    console.error = (...parts) => recordedLogs.push(parts);
    globalThis.fetch = async () => {
      syntheticRequests += 1;
      return new Response(JSON.stringify({ name: "validation_error", statusCode: 422,
        message: "SYNTHETIC_PRIVATE_PROVIDER_DETAIL" }), { status: 422 });
    };
    const adapter = createResendTransactionalEmailAdapterV1({ apiKey: "offline-synthetic-not-a-key",
      fromAddress: "sender@example.com", fromName: "月の返事" });
    await assert.rejects(adapter.sendAssessmentResult({ recipientEmail: "customer@example.com",
      resultUrl: `https://moon-reply.example/result/${Buffer.alloc(32, 44).toString("base64url")}`,
      messageIdempotencyKey: "result-notification:synthetic-log-test" }),
    error => error.safeCode === "RESULT_EMAIL_DELIVERY_FAILED" && error.outcome === "rejected" &&
      error.message === "RESULT_EMAIL_DELIVERY_FAILED");
    assert.equal(syntheticRequests, 1); assert.equal(recordedLogs.length, 0);
  } finally {
    globalThis.fetch = originalFetch; console.error = originalError;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

await check("explicit credential revocation remains effective and never reissues on retry", async () => {
  const h = harness({ providerMode: "response_lost" }); await rejects(() => h.run());
  await h.repo.revokeResultCredential([...h.repo.credentials.keys()][0], h.now());
  await rejects(() => h.run(), "PRODUCTION_NOTIFICATION_MANUAL_REVIEW");
  await rejects(() => h.application().resolveResult(h.token()), "PRODUCTION_RESULT_NOT_FOUND");
  assert.equal(h.repo.credentials.size, 1); assert.equal(h.client.requests.length, 1); await h.assertUnchanged();
});

assert.equal(externalCalls, 0);
console.log(`F004 result notification: ${passed}/${passed} PASS; external calls=0; assessment regeneration=0; canonical duplication=0`);
