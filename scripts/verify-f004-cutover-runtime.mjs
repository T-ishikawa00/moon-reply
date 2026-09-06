import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

// The published application is executed from immutable local Git objects.
// No worktree, environment file, connection, SDK client or Provider is created.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const published = "63520234267af67f319f1eb7b7999498239a3909";
const git = args => execFileSync("git.exe", ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, ...args],
  { cwd: root, encoding: "utf8", windowsHide: true, timeout: 10_000, maxBuffer: 8 * 1024 * 1024 }).trimEnd();
assert.equal(git(["rev-parse", `${published}^{commit}`]), published);
const oldFiles = new Set(git(["ls-tree", "-r", "--name-only", published]).split(/\r?\n/u));
const loadedOldFiles = new Set();
const oldSource = relative => git(["show", `${published}:${relative}`]);
const relativeFile = url => path.relative(root, fileURLToPath(url)).replaceAll("\\", "/");
const oldUrl = relative => `${pathToFileURL(path.join(root, relative)).href}?git=${published}`;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const parent = new URL(context.parentURL);
      const resolved = new URL(specifier, parent);
      if (parent.searchParams.get("git") === published) {
        const relative = relativeFile(resolved);
        const target = [relative, `${relative}.ts`, `${relative}/index.ts`].find(file => oldFiles.has(file));
        assert.ok(target, "Every old relative dependency must exist at the exact published commit");
        return { url: oldUrl(target), shortCircuit: true };
      }
      const filename = fileURLToPath(resolved);
      if (!existsSync(filename) && existsSync(`${filename}.ts`)) {
        return { url: pathToFileURL(`${filename}.ts`).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.startsWith("file:")) return next(url, context);
    const parsed = new URL(url);
    const historical = parsed.searchParams.get("git") === published;
    const filename = fileURLToPath(parsed);
    if (filename.endsWith(".ts")) {
      const relative = relativeFile(parsed);
      const source = historical ? oldSource(relative) : readFileSync(filename, "utf8");
      if (historical) loadedOldFiles.add(relative);
      return { format: "module", shortCircuit: true, source: ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true },
      }).outputText };
    }
    if (historical && filename.endsWith(".json")) {
      const relative = relativeFile(parsed);
      loadedOldFiles.add(relative);
      return { format: "json", shortCircuit: true, source: oldSource(relative) };
    }
    return next(url, context);
  },
});

let externalCalls = 0;
globalThis.fetch = async () => { externalCalls++; throw new Error("F004_CUTOVER_EXTERNAL_CALL_FORBIDDEN"); };
const { ProductionFulfillmentApplication: OldApplication } = await import(oldUrl("lib/assessment/production/application.ts"));
const { SupabaseProductionFulfillmentRepository: OldRepository } = await import(oldUrl("lib/assessment/production/supabase-repository.ts"));
const { processProductionFulfillmentWorkloadEvent: oldWorkload } = await import(oldUrl("lib/payment/production/async-workloads-worker.ts"));
const { ProductionFulfillmentApplication } = await import("../lib/assessment/production/application.ts");
const { FakeProductionFulfillmentRepository } = await import("../lib/assessment/production/fakes.ts");
const { FakeAssessmentRepository } = await import("../lib/assessment/runtime/fakes.ts");
const { hashProductionSnapshot } = await import("../lib/assessment/production/capabilities.ts");
const { VerifiedEmailResultNotificationAdapterV1 } = await import("../lib/payment/production/result-notification.ts");
const { ResendTransactionalEmailAdapterV1 } = await import("../lib/payment/production/resend-transactional-email-runtime.ts");
const { encryptDeliveryEmail } = await import("../lib/payment/production/crypto.ts");
const { runNotificationCutoverRecovery } = await import("../lib/payment/production/notification-cutover-recovery.ts");
const { ProductionPaymentDeliveryApplication } = await import("../lib/payment/production/application.ts");
const { SupabasePaymentDeliveryRepository } = await import("../lib/payment/production/supabase-repository.ts");

const projection = JSON.parse(readFileSync(path.join(root,
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-executions/2026-08-19-case5-polite-draft-v17-fcd54a0c/v17-customer-projections-v1.json"), "utf8")).projections[0].projection;
const start = "2026-09-06T00:00:00.000Z";
const fixtureKey = Buffer.alloc(32, 41).toString("base64");
const catalog = { catalogVersion: "runtime-stage-catalog-v17.0.0", promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
  schemaSetVersion: "pipeline-schema-runtime-v6.0.0", stageTopologyVersion: "split-base-candidate-v1", definitions: [] };

function harness({ responseLost = false, seededBeforeCutover = true } = {}) {
  let instant = start;
  const counts = { oldClaims: 0, oldMutations: 0, oldTokens: 0, oldSends: 0, newTokens: 0, generation: 0 };
  const runtime = new FakeAssessmentRepository();
  const repo = new FakeProductionFulfillmentRepository(runtime);
  const notificationId = randomUUID(), deliveryId = randomUUID(), jobId = randomUUID();
  const delivery = { id: deliveryId, logicalAssessmentId: randomUUID(), runtimeRunId: randomUUID(),
    projection: structuredClone(projection), projectionHash: hashProductionSnapshot(projection),
    deliveryAuthorityReference: `synthetic-cutover-${jobId}`, createdAt: start };
  repo.deliveries.set(deliveryId, structuredClone(delivery));
  runtime.reports.set(delivery.runtimeRunId, { id: "synthetic-preserved-completed-report" });
  const seed = () => repo.notifications.set(notificationId, { id: notificationId, deliveryId,
    deliveryAuthorityReference: delivery.deliveryAuthorityReference, status: "pending", attemptCount: 0, ownerId: null });
  if (seededBeforeCutover) seed();
  const oldRepo = Object.create(OldRepository.prototype);
  oldRepo.client = {
    async rpc(name, args) {
      // This seam supplies the SQL fence's public return contract. Actual SQL,
      // migration atomicity and old cached-function races have separate PG tests.
      assert.equal(name, "claim_production_notification_v2");
      assert.equal(args.p_notification_id, notificationId);
      counts.oldClaims++;
      const row = repo.notifications.get(notificationId);
      return { data: row ? { disposition: row.status === "sent" ? "sent" : "in_progress", id: row.id } : null, error: null };
    },
    from() { counts.oldMutations++; throw new Error("OLD_MUTATION_FORBIDDEN"); },
  };
  const transport = { async invoke() { counts.generation++; throw new Error("GENERATION_FORBIDDEN"); } };
  const options = { runtimeRepository: runtime, catalog, model: "gpt-5.6-luna", now: () => instant, fulfillmentLeaseSeconds: 60, transport };
  const oldApp = new OldApplication({ ...options, lifecycleRepository: oldRepo,
    capability() { counts.oldTokens++; return "old-token-must-not-be-created"; } });
  const current = () => new ProductionFulfillmentApplication({ ...options, lifecycleRepository: repo,
    capability() { counts.newTokens++; return randomBytes(32).toString("base64url"); } });
  const client = {
    requests: [], accepted: new Map(), beforeSend: null,
    async send(payload, sendOptions) {
      this.requests.push(structuredClone({ payload, options: sendOptions }));
      if (this.beforeSend) await this.beforeSend();
      const prior = this.accepted.get(sendOptions.idempotencyKey);
      if (prior) assert.deepEqual(payload, prior);
      this.accepted.set(sendOptions.idempotencyKey, structuredClone(payload));
      if (responseLost && this.requests.length === 1) return { data: null, error: { name: "application_error", statusCode: null } };
      return { data: { id: "synthetic-cutover-message" }, error: null };
    },
  };
  const adapter = (origin = "https://moon-reply.example") => new VerifiedEmailResultNotificationAdapterV1(
    { async resolveDeliveryEmailCiphertext() { return encryptDeliveryEmail("cutover@example.test", fixtureKey); } },
    new ResendTransactionalEmailAdapterV1(client, { fromAddress: "sender@example.test", fromName: "Synthetic" }), fixtureKey, origin);
  const runOld = () => oldApp.processNotification(notificationId,
    { async send() { counts.oldSends++; throw new Error("OLD_SEND_FORBIDDEN"); } });
  const snapshot = () => structuredClone({ notifications: [...repo.notifications], deliveries: [...repo.deliveries],
    credentials: [...repo.credentials], identities: [...repo.notificationIdentities], reports: [...runtime.reports] });
  const assertCanonical = () => {
    assert.equal(repo.notifications.size, 1); assert.equal(repo.notifications.get(notificationId).id, notificationId);
    assert.equal(repo.deliveries.size, 1); assert.deepEqual(repo.deliveries.get(deliveryId), delivery);
    assert.deepEqual([...runtime.reports], [[delivery.runtimeRunId, { id: "synthetic-preserved-completed-report" }]]);
    assert.equal(counts.generation, 0); assert.equal(repo.generationStartedTransitions, 0);
    assert.equal(counts.oldMutations, 0); assert.equal(counts.oldTokens, 0); assert.equal(counts.oldSends, 0);
    assert.equal(externalCalls, 0);
  };
  return { counts, repo, jobId, notificationId, client, seed, snapshot, runOld, assertCanonical,
    advance(milliseconds) { instant = new Date(Date.parse(instant) + milliseconds).toISOString(); },
    run(origin) { return current().processNotification(notificationId, adapter(origin)); },
    async oldEvent(attempt) {
      return oldWorkload({ attempt, eventData: { jobId } }, {
        async processJob(selected) {
          assert.equal(selected, jobId);
          await assert.rejects(runOld, error => error.safeCode === "PRODUCTION_NOTIFICATION_NOT_AVAILABLE");
          return { status: "completed", resultToken: null, notificationPending: true, notificationManualReview: false };
        },
        async quarantineAfterRetryExhaustion(selected) { assert.equal(selected, jobId); return { disposition: "completed" }; },
      });
    },
    async assertStable() {
      assert.equal(repo.credentials.size, 1); assert.equal(repo.notificationIdentities.size, 1);
      assert.equal(counts.newTokens, 1); assert.equal(client.accepted.size, 1);
      for (const request of client.requests) assert.deepEqual(request, client.requests[0]);
      const url = client.requests[0].payload.text.match(/https:\/\/\S+/u)[0];
      const token = new URL(url).pathname.split("/").at(-1);
      const resolved = await current().resolveResult(token);
      assert.equal(resolved.deliveryId, deliveryId); assert.deepEqual(resolved.projection, projection);
      assert.equal([...repo.credentials.values()][0].revokedAt, null);
      assertCanonical();
    },
  };
}

let passed = 0;
async function check(name, run) { await run(); console.log(`PASS F004 cutover runtime ${++passed} ${name}`); }

await check("the actual published application, repository and worker are loaded from fixed Git objects", () => {
  for (const file of ["lib/assessment/production/application.ts", "lib/assessment/production/supabase-repository.ts",
    "lib/payment/production/async-workloads-worker.ts"]) assert.ok(loadedOldFiles.has(file));
  assert.notEqual(OldApplication, ProductionFulfillmentApplication);
  assert.ok(oldSource("lib/assessment/production/supabase-repository.ts").includes('"claim_production_notification_v2"'));
});

for (const seededBeforeCutover of [true, false]) await check(
  `old published worker preserves ${seededBeforeCutover ? "pre-cutover" : "post-cutover"} pending through all nine attempts`, async () => {
    const h = harness({ seededBeforeCutover }); if (!seededBeforeCutover) h.seed();
    const before = h.snapshot();
    for (let attempt = 0; attempt <= 8; attempt++) {
      await assert.rejects(() => h.oldEvent(attempt), error => error.message === (attempt === 8
        ? "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED" : "PRODUCTION_NOTIFICATION_RETRYABLE_FAILURE"));
      h.advance(60_000); assert.deepEqual(h.snapshot(), before);
    }
    assert.equal(h.counts.oldClaims, 9); assert.equal(h.client.requests.length, 0); h.assertCanonical();
    assert.deepEqual(await h.run(), { status: "sent", duplicate: false }); await h.assertStable();
  });

await check("new runtime independently recovers the same pending row after the old event is exhausted", async () => {
  const h = harness(); await assert.rejects(() => h.oldEvent(8));
  const before = h.snapshot(); let claims = 0, enqueues = 0, paidClaims = 0, notifications = 0, unrelatedCalls = 0;
  const forbidden = () => { unrelatedCalls++; throw new Error("UNRELATED_PAID_OR_PROVIDER_OPERATION_FORBIDDEN"); };
  const paymentApp = new ProductionPaymentDeliveryApplication({
    repository: {
      async claimFulfillmentJobById(input) {
        paidClaims++; assert.equal(input.jobId, h.jobId);
        return { disposition: "completed", job: { id: h.jobId,
          deliveryAuthorityReference: h.repo.notifications.get(h.notificationId).deliveryAuthorityReference } };
      },
      completeFulfillmentJob: forbidden, failFulfillmentJob: forbidden,
    },
    grantProcessor: {
      issueProductionAssessmentGrant: forbidden, fulfillProductionAssessmentGrant: forbidden,
      recoverCompletedAssessmentGrant: forbidden,
      async processResultNotification(authority) {
        notifications++; assert.equal(authority, h.repo.notifications.get(h.notificationId).deliveryAuthorityReference);
        return h.run();
      },
    },
    checkoutProvider: { createCheckoutSession: forbidden }, transactionalEmail: { sendVerification: forbidden },
    fulfillmentDispatcher: { enqueue: forbidden }, policy: { challengeTtlSeconds: 60, trustedSessionTtlSeconds: 60, maximumVerificationAttempts: 1 },
    environment: "test", siteOrigin: "https://moon-reply.example", payPayEnabled: false,
    verificationPepper: "synthetic-cutover-pepper", emailEncryptionKey: fixtureKey,
    purchaseStatusSigningSecret: "synthetic-cutover-signing-secret", fulfillmentLeaseSeconds: 60, now: () => start,
  });
  const result = await runNotificationCutoverRecovery({
    async claim() { claims++; return { jobId: h.jobId }; },
    async enqueue(jobId) {
      enqueues++; assert.equal(jobId, h.jobId); assert.deepEqual(h.snapshot(), before);
      assert.deepEqual(await paymentApp.processFulfillmentJobById(jobId), {
        status: "completed", notificationPending: false, notificationManualReview: false,
      });
    },
  });
  assert.equal(result.status, "enqueued"); assert.equal(claims, 1); assert.equal(enqueues, 1);
  assert.equal(paidClaims, 1); assert.equal(notifications, 1); assert.equal(unrelatedCalls, 0); await h.assertStable();
});

await check("old and new overlapping workers have only one send and preserve the canonical URL", async () => {
  const h = harness(); let release, entered;
  const waiting = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { entered = resolve; });
  h.client.beforeSend = async () => { entered(); await waiting; };
  const current = h.run(); await started;
  await assert.rejects(h.runOld, error => error.safeCode === "PRODUCTION_NOTIFICATION_NOT_AVAILABLE");
  await assert.rejects(() => h.run(), error => error.safeCode === "PRODUCTION_NOTIFICATION_NOT_AVAILABLE");
  release(); await current; assert.equal(h.client.requests.length, 1); await h.assertStable();
  assert.deepEqual(await h.runOld(), { status: "sent", duplicate: true }); await h.assertStable();
});

await check("unknown send outcome survives restart and old-worker interference without identity rotation", async () => {
  const h = harness({ responseLost: true }); await assert.rejects(() => h.run());
  assert.equal(h.repo.notificationIdentities.get(h.notificationId).lastErrorCode, "PRODUCTION_NOTIFICATION_SEND_OUTCOME_UNKNOWN");
  const before = h.snapshot(); await assert.rejects(h.runOld, error => error.safeCode === "PRODUCTION_NOTIFICATION_NOT_AVAILABLE");
  assert.deepEqual(h.snapshot(), before); await h.assertStable();
  await h.run("https://changed.example"); assert.equal(h.client.requests.length, 2); await h.assertStable();
});

await check("completed acknowledgement response loss causes no second send", async () => {
  const h = harness(); const complete = h.repo.completeNotification.bind(h.repo);
  h.repo.completeNotification = async input => { await complete(input); throw new Error("synthetic acknowledgement lost"); };
  await assert.rejects(() => h.run()); assert.deepEqual(await h.run(), { status: "sent", duplicate: true });
  assert.equal(h.client.requests.length, 1); await h.assertStable();
});

await check("idle recovery performs one read and no enqueue", async () => {
  let claims = 0, enqueues = 0;
  const result = await runNotificationCutoverRecovery({ async claim() { claims++; return null; },
    async enqueue() { enqueues++; } });
  assert.equal(result.status, "idle"); assert.equal(claims, 1); assert.equal(enqueues, 0);
});

for (const failingAt of ["claim", "enqueue"]) await check(`recovery ${failingAt} ambiguity defers without inline retry`, async () => {
  const h = harness(); const before = h.snapshot();
  let claims = 0, enqueues = 0;
  const result = await runNotificationCutoverRecovery({
    async claim(signal) { assert.ok(signal instanceof AbortSignal); claims++; if (failingAt === "claim") throw new Error("synthetic database failure"); return { jobId: h.jobId }; },
    async enqueue() { enqueues++; throw new Error("synthetic router outcome unknown"); },
  });
  assert.deepEqual(result, { status: "deferred" }); assert.equal(claims, 1); assert.equal(enqueues, failingAt === "claim" ? 0 : 1);
  assert.deepEqual(h.snapshot(), before); assert.equal(h.client.requests.length, 0); h.assertCanonical();
});

await check("router acceptance with lost response preserves pending and duplicate events converge on one send", async () => {
  const h = harness(); const before = h.snapshot(); const acceptedEvents = [];
  const first = await runNotificationCutoverRecovery({ async claim() { return { jobId: h.jobId }; },
    async enqueue(jobId) { acceptedEvents.push(jobId); throw new Error("accepted response lost"); } });
  assert.deepEqual(first, { status: "deferred" }); assert.deepEqual(h.snapshot(), before);
  assert.equal(h.client.requests.length, 0); assert.equal(h.counts.newTokens, 0);
  // The real SQL verifier proves reservation expiry. Here only the subsequent
  // duplicate router delivery and current sender's convergence are exercised.
  h.advance(301_000);
  const second = await runNotificationCutoverRecovery({ async claim() { return { jobId: h.jobId }; },
    async enqueue(jobId) { acceptedEvents.push(jobId); } });
  assert.deepEqual(second, { status: "enqueued" }); assert.deepEqual(h.snapshot(), before);
  assert.deepEqual(acceptedEvents, [h.jobId, h.jobId]);
  const outcomes = await Promise.allSettled(acceptedEvents.map(() => h.run()));
  assert.equal(outcomes.filter(outcome => outcome.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter(outcome => outcome.status === "rejected" && outcome.reason.safeCode === "PRODUCTION_NOTIFICATION_NOT_AVAILABLE").length, 1);
  assert.equal(h.client.requests.length, 1); await h.assertStable();
});

for (const hungAt of ["claim", "enqueue"]) await check(`hung recovery ${hungAt} is bounded and leaves canonical pending intact`, async () => {
  const h = harness(); const before = h.snapshot(); let signalSeen, claims = 0, enqueues = 0;
  const never = () => new Promise(() => {});
  const result = await runNotificationCutoverRecovery({
    async claim(signal) { signalSeen = signal; claims++; return hungAt === "claim" ? never() : { jobId: h.jobId }; },
    async enqueue() { enqueues++; return never(); },
  });
  assert.deepEqual(result, { status: "deferred" }); assert.equal(claims, 1);
  assert.equal(enqueues, hungAt === "claim" ? 0 : 1);
  if (hungAt === "claim") assert.equal(signalSeen.aborted, true);
  assert.deepEqual(h.snapshot(), before); assert.equal(h.client.requests.length, 0); h.assertCanonical();
});

await check("actual Supabase repository maps the environment-bound RPC and exact AbortSignal without constructing a client", async () => {
  for (const environment of ["test", "live"]) {
    const repository = Object.create(SupabasePaymentDeliveryRepository.prototype);
    const controller = new AbortController(); const jobId = randomUUID(); let rpcCalls = 0, signalCalls = 0;
    repository.client = { rpc(name, args) {
      rpcCalls++; assert.equal(name, "claim_production_notification_cutover_recovery_v1");
      assert.deepEqual(args, { p_environment: environment });
      return { async abortSignal(signal) { signalCalls++; assert.equal(signal, controller.signal); return { data: { fulfillment_job_id: jobId }, error: null }; } };
    } };
    assert.deepEqual(await repository.claimNotificationCutoverRecovery({ environment, signal: controller.signal }), { jobId });
    assert.equal(rpcCalls, 1); assert.equal(signalCalls, 1);
  }
});

await check("Supabase recovery idle, missing RPC and malformed response fail closed before enqueue", async () => {
  const valid = randomUUID();
  for (const response of [
    { data: null, error: null },
    { data: null, error: { code: "PGRST202", message: "synthetic missing migration" } },
    ...[{}, [], "invalid", { fulfillment_job_id: null }, { fulfillment_job_id: "not-a-uuid" },
      { fulfillment_job_id: [valid] }].map(data => ({ data, error: null })),
  ]) {
    const repository = Object.create(SupabasePaymentDeliveryRepository.prototype); let rpcCalls = 0, enqueues = 0;
    repository.client = { rpc() { rpcCalls++; return { async abortSignal() { return response; } }; } };
    const result = await runNotificationCutoverRecovery({
      claim: signal => repository.claimNotificationCutoverRecovery({ environment: "test", signal }),
      async enqueue() { enqueues++; },
    });
    assert.deepEqual(result, { status: response.data === null && response.error === null ? "idle" : "deferred" });
    assert.equal(rpcCalls, 1); assert.equal(enqueues, 0);
  }
});

assert.equal(externalCalls, 0);
console.log(`PASS F004 cutover runtime ${passed}/${passed}; external calls=0; old sends=0; notification loss=0; token regeneration=0; canonical changes=0`);
// Accepted-send uniqueness is proved against the local idempotent fake contract.
// Provider key retention and arbitrary-duration exactly-once delivery are not established here.
