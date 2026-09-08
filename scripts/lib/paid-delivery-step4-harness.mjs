import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { registerHooks } from "node:module";
import { createLocalPostgres } from "../remediation-local-postgres.mjs";
import { createOfflineRuntime } from "../remediation-offline-runtime.mjs";
import { createPaidRecoveryPostgrest, sqlLiteral } from "./paid-recovery-postgrest.mjs";

// Test loader only; Production modules retain their original import semantics.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,export%20{}", shortCircuit: true };
  try { return nextResolve(specifier, context); }
  catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/u.test(specifier)) {
      return nextResolve(specifier + ".ts", context);
    }
    throw error;
  }
} });
const { createPaidRecoveryApplication } = await import("./paid-recovery-application.mjs");
const { createPaidDeliveryStep4Fixture } = await import("./paid-delivery-step4-fixtures.mjs");
const { fixture, consultationFor } = await import("./paid-recovery-fixtures.mjs");
const { CustomerIdentityAuthApplicationV1 } = await import("../../lib/customer-auth/application.ts");
const { SupabaseCustomerIdentityRepositoryV1 } = await import("../../lib/customer-auth/supabase-repository.ts");
const { processProductionFulfillmentWorkloadEvent } = await import("../../lib/payment/production/async-workloads-worker.ts");
const { requestProductionFulfillmentDispatch } = await import("../../lib/payment/production/fulfillment-dispatch.ts");
const { runProductionFulfillmentDispatchSchedule } = await import("../../lib/payment/production/recovery-schedulers.ts");
export { sqlLiteral };

// Default-new-purchase selector only. Production's constructor catalog remains
// V17; immutable purchased authority selects the V17 or V19 paid executor.
export async function createStep4Run(rest, options = {}) {
  assert.match(rest.url, /^http:\/\/127\.0\.0\.1:\d+$/u);
  const contract = options.contract ?? "v19";
  assert.ok(["v17", "v19"].includes(contract));
  const selectedFixture = options.fixture ?? (contract === "v19" ? createPaidDeliveryStep4Fixture({ mode: options.mode ?? "clean" }) : null);
  const consultation = options.consultation ?? (selectedFixture
    ? consultationFor(fixture("polite_thank_you_with_draft"), selectedFixture.request) : undefined);
  const run = await createPaidRecoveryApplication(rest, { now: options.now ?? "2026-09-09T00:00:00.000Z",
    transport: options.transport ?? selectedFixture?.transport, consultation, localCandidate: contract === "v19" });
  run.contract = contract;
  run.fixture = selectedFixture;
  run.consultation = consultation;
  run.queueEvents = [];
  run.workerEvents = [];
  run.customerObservations = [];
  run.providerInvocations = [];
  run.notificationInvocations = [];
  const sendResult = run.email.sendAssessmentResult.bind(run.email);
  run.email.sendAssessmentResult = async request => {
    const row = { idempotencyKey: request.messageIdempotencyKey,
      payloadHash: createHash("sha256").update(JSON.stringify(request)).digest("hex"), status: "started" };
    run.notificationInvocations.push(row);
    try { const result = await sendResult(request); row.status = "accepted"; return result; }
    catch (error) { row.status = "failed"; row.errorCode = error.safeCode ?? error.name; throw error; }
  };
  const invoke = run.transport.invoke.bind(run.transport);
  run.transport.invoke = async request => {
    const row = { ordinal: run.providerInvocations.length + 1, stageId: request.stageId, schemaVersion: request.schemaVersion,
      repair: request.schemaVersion === "report-fact-repair-v1", revalidation: request.stageId === "PB-06" && request.input.report_fact_repair_context != null,
      requestHash: createHash("sha256").update(JSON.stringify(request.input)).digest("hex"), status: "started" };
    run.providerInvocations.push(row);
    try { const output = await invoke(request); row.status = "completed"; return output; }
    catch (error) { row.status = "failed"; row.errorCode = error.safeCode ?? error.name; throw error; }
  };
  const enqueue = run.dispatcher.enqueue.bind(run.dispatcher);
  run.dispatcher.enqueue = async (jobId, recoveryCycle = 0) => {
    const accepted = await enqueue(jobId);
    run.queueEvents.push({ jobId, recoveryCycle, eventName: "production.fulfillment.job.v1", eventData: { jobId, recoveryCycle }, eventId: accepted.eventId });
    return accepted;
  };
  run.customerRepository = new SupabaseCustomerIdentityRepositoryV1(rest.url, "synthetic-local-service-role");
  run.seedVerifiedPurchase = async ({ db = options.db, customerUserId = randomUUID() } = {}) => {
    assert.ok(db, "Synthetic auth.users bootstrap requires the owned local database");
    const prepared = await run.assessment.prepare(consultation ?? consultationFor(fixture("polite_thank_you_with_draft")), randomUUID(), contract === "v19");
    assert.equal(prepared.status, "purchase_ready");
    // Only the external Auth identity is synthetic. Continuation, binding,
    // ownership, Checkout admission and payment verification all use real RPCs.
    db.sql(`insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values(${sqlLiteral(customerUserId)},'synthetic@example.com',${sqlLiteral(run.now())},${sqlLiteral(run.now())},${sqlLiteral(run.now())});`);
    const auth = new CustomerIdentityAuthApplicationV1({ repository: run.customerRepository,
      provider: { async verifyEmailOtp() { return { customerUserId, verifiedEmail: "synthetic@example.com", verifiedEmailSource: "supabase_email_otp", authProviders: ["email"] }; } },
      environment: { continuationTtlSeconds: 600, emailHashPepper: "synthetic-step4-email-hash-pepper", emailEncryptionKey: Buffer.alloc(32,71).toString("base64"), emailKeyVersion: "v1" }, now: run.now });
    const csrfToken = Buffer.alloc(32,19).toString("base64url");
    const continuation = await auth.createContinuation({ preparationCapability: prepared.preparationCapability, csrfToken, flowKind: "email_otp" });
    const ownership = await auth.verifyEmailOtp({ ...continuation, email: "synthetic@example.com", otp: "12345678" });
    const checkout = await run.payment.startAuthenticatedCheckout({ preparationCapability: prepared.preparationCapability, customerUserId });
    assert.equal(checkout.status, "checkout_ready");
    const request = run.checkoutProvider.requests.at(-1);
    const evidence = { evidenceSource: "webhook", providerEventId: `evt_step4_${randomUUID().replaceAll("-", "")}`, eventType: "checkout.session.completed",
      providerCreatedAt: run.now(), payloadSha256: "b".repeat(64), environment: "test", purchaseReference: request.purchaseReference,
      providerCheckoutSessionId: checkout.checkoutUrl.split("/").at(-1), providerPaymentId: `pi_step4_${randomUUID().replaceAll("-", "")}`,
      mode: "payment", paymentStatus: "paid", amountTotal: 980, currency: "jpy" };
    const recorded = await run.payment.verifyStripeEvidence(evidence, false);
    assert.equal(recorded.disposition, "verified");
    const purchase = { ...recorded, jobId: recorded.fulfillmentJobId, purchaseIntentId: request.purchaseReference,
      statusCapability: checkout.statusCapability, customerUserId, prepared, ownership, checkout, evidence };
    assert.equal(typeof purchase.statusCapability, "string");
    run.purchase = purchase;
    return purchase;
  };
  return run;
}

export async function consumeStep4Event(run, event, { attempt = 0 } = {}) {
  assert.ok(event?.eventData || event?.jobId, "Consume a real captured queue event");
  const eventData = event.eventData ?? { jobId: event.jobId, recoveryCycle: event.recoveryCycle ?? 0 };
  let workerOutcome = null, exhaustedOutcome = null, eventError = null;
  try {
    await processProductionFulfillmentWorkloadEvent({ eventData, attempt }, {
      async processJob(jobId, cycle) { workerOutcome = await run.payment.processFulfillmentJobById(jobId, cycle); return workerOutcome; },
      async quarantineAfterRetryExhaustion(jobId, cycle) { exhaustedOutcome = await run.payment.quarantineFulfillmentJobAfterAsyncRetryExhaustion(jobId, cycle); return exhaustedOutcome; },
    });
  } catch (error) { eventError = { name: error.name, message: error.message }; }
  const result = { eventData: structuredClone(eventData), attempt, workerOutcome, outcome: workerOutcome, exhaustedOutcome, eventError };
  run.workerEvents.push(result);
  return result;
}

export async function createStep4Harness({ through = 35, label = "paid-delivery-step4" } = {}) {
  const db = await createLocalPostgres(label);
  let rest;
  try {
    db.applyThrough(through);
    db.sql("grant usage on schema extensions to service_role;");
    rest = await createPaidRecoveryPostgrest(db);
  } catch (error) { await db.stop(); throw error; }
  const harness = { db, rest,
    async reset() {
      const relations = db.sql("select string_agg(format('%I.%I',schemaname,tablename),',') from pg_tables where schemaname='public';");
      db.sql(`truncate ${relations},auth.users cascade;`);
      rest.calls.length = 0; rest.failures.length = 0; rest.fault.before = null; rest.fault.after = null;
    },
    createRun: options => createStep4Run(rest, { ...options, db }),
    consume: consumeStep4Event,
    async dispatch(run, jobId) {
      const previous = run.queueEvents.length;
      const disposition = await requestProductionFulfillmentDispatch({ repository: run.paymentRepository, dispatcher: run.dispatcher, jobId, now: run.now, uuid: randomUUID });
      run.lastDispatch = { disposition, events: run.queueEvents.slice(previous) };
      return run.lastDispatch.events.at(-1) ?? null;
    },
    async scheduler(run, { advanceSeconds = 0, settleSeconds = 2, batchLimit = 4 } = {}) {
      run.advance(advanceSeconds);
      const refreshed = await run.recoveryRepository.refresh({ environment: "test", now: run.now(), limit: batchLimit });
      run.advance(settleSeconds);
      const previous = run.queueEvents.length;
      const dispatched = await runProductionFulfillmentDispatchSchedule({
        repository: { listDueFulfillmentDispatchJobIds: ({ now, limit }) => run.recoveryRepository.listDue({ environment: "test", now, limit }) },
        dispatchJob: async jobId => { await harness.dispatch(run, jobId); return run.lastDispatch.disposition; }, now: run.now, batchLimit,
      });
      run.lastScheduler = { refreshed, dispatched, events: run.queueEvents.slice(previous) };
      return run.lastScheduler.events;
    },
    async surfaces(run, purchase = run.purchase) {
      run.customerObservations.push({ kind: "purchase_status", at: run.now(), jobId: purchase.jobId });
      const publicStatus = await run.payment.processAuthenticatedPurchaseStatus(purchase.statusCapability, purchase.customerUserId);
      const history = await run.customerRepository.listAccountHistory(purchase.customerUserId);
      const item = history.find(row => row.purchaseIntentId === purchase.purchaseIntentId) ?? null;
      const result = item?.deliveryId ? await run.customerRepository.resolveOwnedResult({ customerUserId: purchase.customerUserId, deliveryId: item.deliveryId }) : null;
      return { publicStatus, account: { history, available: result !== null, deliveryId: result?.deliveryId ?? null,
        projectionSchemaVersion: result?.projection?.projectionSchemaVersion ?? null } };
    },
    async snapshot(run, purchase = run.purchase, { observeCustomer = false } = {}) {
      const jobId = typeof purchase === "string" ? purchase : purchase.jobId;
      const state = JSON.parse(db.sql(`select jsonb_build_object('jobId',j.id,'purchaseIntentId',j.purchase_intent_id,'verifiedPaymentId',j.verified_payment_id,
        'grantId',j.grant_id,'logicalAssessmentId',j.logical_assessment_id,'state',j.state,'reasonCode',j.recovery_reason_code,
        'recoveryCycle',j.recovery_cycle_count,'nextAttemptAt',j.recovery_next_attempt_at,'owner',j.recovery_owner,'reviewDueAt',j.recovery_review_due_at,
        'inputHash',p.consultation_snapshot_sha256,'authorityHash',p.purchase_ready_authority_sha256,'authorityVersion',p.purchase_ready_authority_json->'runtimeIdentity'->>'promptBundleVersion',
        'attempts',j.attempt_count,'providerCalls',j.provider_call_count,'reservedCostUsd',j.provider_reserved_cost_usd,'providerReservations',j.provider_reservations,'leaseExpiresAt',j.lease_expires_at,'processingOwner',j.owner_id,
        'logicalState',(select jsonb_build_object('status',l.status,'owner',l.owner_id,'leaseExpiresAt',l.lease_expires_at) from public.production_logical_assessments l where l.id=j.logical_assessment_id),
        'deliveryCount',(select count(*) from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
        'canonicalRunId',(select runtime_run_id from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
        'canonicalHash',(select projection_sha256 from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
        'reportCount',(select count(*) from public.assessment_reports a join public.assessment_runs r on r.id=a.run_id where r.request_id=p.assessment_request_id),
        'runCount',(select count(*) from public.assessment_runs where request_id=p.assessment_request_id),
        'grantCount',(select count(*) from public.production_assessment_grants where preparation_id=p.id),
        'purchaseCount',(select count(*) from public.production_purchases where preparation_id=p.id),
        'notifications',(select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'status',n.status)),'[]') from public.production_notification_outbox n where n.delivery_authority_reference=j.delivery_authority_reference))
        from public.production_fulfillment_jobs j join public.production_preparations p on p.id=j.preparation_id where j.id=${sqlLiteral(jobId)};`));
      const stages = JSON.parse(db.sql(`select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'runId',s.run_id,'stageId',s.stage_id,'attemptNumber',s.attempt_number,'status',s.status,'requestHash',s.request_hash)),'[]')
        from public.assessment_stage_runs s join public.assessment_runs r on r.id=s.run_id join public.production_preparations p on p.assessment_request_id=r.request_id join public.production_fulfillment_jobs j on j.preparation_id=p.id where j.id=${sqlLiteral(jobId)};`));
      const runtimeRunContracts = JSON.parse(db.sql(`select coalesce(jsonb_agg(jsonb_build_object('runId',r.id,'status',r.status,'model',r.requested_model,'promptBundleVersion',r.prompt_bundle_version,'schemaSetVersion',r.schema_set_version,'stageTopologyVersion',r.stage_topology_version)),'[]')
        from public.assessment_runs r join public.production_preparations p on p.assessment_request_id=r.request_id join public.production_fulfillment_jobs j on j.preparation_id=p.id where j.id=${sqlLiteral(jobId)};`));
      const reportArtifacts = JSON.parse(db.sql(`select coalesce(jsonb_agg(jsonb_build_object('runId',a.run_id,'sha256',encode(extensions.digest(convert_to(a.report_json::text,'UTF8'),'sha256'),'hex')) order by a.run_id),'[]')
        from public.assessment_reports a join public.assessment_runs r on r.id=a.run_id join public.production_preparations p on p.assessment_request_id=r.request_id join public.production_fulfillment_jobs j on j.preparation_id=p.id where j.id=${sqlLiteral(jobId)};`));
      const accountHistory = typeof purchase === "string" ? [] : await run.customerRepository.listAccountHistory(purchase.customerUserId);
      const accountItem = accountHistory.find(row => row.purchaseIntentId === state.purchaseIntentId);
      const accountResult = accountItem?.deliveryId ? await run.customerRepository.resolveOwnedResult({ customerUserId: purchase.customerUserId, deliveryId: accountItem.deliveryId }) : null;
      const surfaces = observeCustomer && typeof purchase !== "string" ? await harness.surfaces(run, purchase) : {};
      return { ...state, job: state.jobId, intent: state.purchaseIntentId, verifiedPayment: state.verifiedPaymentId,
        grant: state.grantId, logical: state.logicalAssessmentId, cycle: state.recoveryCycle, calls: state.providerCalls, cost: state.reservedCostUsd,
        deliveries: state.deliveryCount, reports: state.reportCount, runs: state.runCount, grants: state.grantCount, purchases: state.purchaseCount,
        canonicalRun: state.canonicalRunId, contract: state.authorityVersion, reviewOwner: state.owner, reason: state.reasonCode,
        notificationRows: state.notifications, notifications: state.notifications.map(row => row.status),
        stages, runtimeRunContracts, reportArtifacts, providerInvocations: structuredClone(run.providerInvocations),
        repairCount: run.providerInvocations.filter(row => row.repair).length,
        revalidationCount: run.providerInvocations.filter(row => row.revalidation).length,
        checkoutCount: run.checkoutProvider.requests.length, queueEventCount: run.queueEvents.length,
        accountAvailable: accountResult !== null, accountDeliveryId: accountResult?.deliveryId ?? null,
        customerStatusObservations: run.customerObservations.length, publicStatus: null, ...surfaces };
    },
    async killWorker(run, jobId, { pauseAt = "provider", event = run.queueEvents.findLast(row => row.eventData.jobId === jobId) } = {}) {
      assert.ok(event, "Dispatch the durable job before starting a worker");
      assert.ok(["provider", "checkpoint", "report"].includes(pauseAt));
      const config = { url: rest.url, now: run.now(), contract: run.contract, mode: run.fixture?.mode ?? "clean", event, pauseAt };
      const workerOffline = createOfflineRuntime();
      const child = fork("scripts/lib/paid-delivery-step4-worker.mjs", [Buffer.from(JSON.stringify(config)).toString("base64url")], {
        execArgv: ["--experimental-transform-types"], windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"],
        env: { ...workerOffline.env, NODE_ENV: "test" },
      });
      let stderr = "", providerInvocations = []; child.stderr.setEncoding("utf8").on("data", chunk => stderr += chunk);
      const stopped = new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
      const boundary = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { child.kill(); reject(new Error(`STEP4_WORKER_BOUNDARY_TIMEOUT: ${stderr}`)); }, 30000);
        child.once("error", error => { clearTimeout(timer); reject(error); });
        child.on("message", message => {
          if (message.boundary === "provider_ledger") providerInvocations = message.invocations;
          if (message.boundary === "provider") { clearTimeout(timer); resolve(message); }
          if (message.boundary === "completed") { clearTimeout(timer); reject(new Error(`STEP4_WORKER_COMPLETED_BEFORE_KILL: ${JSON.stringify(message.result)}`)); }
        });
        if (pauseAt === "report") rest.fault.after = async call => {
          if (call.name === "finalize_completed_assessment") { clearTimeout(timer); resolve({ boundary: "report_committed", pid: child.pid }); await new Promise(resolveDelay => setTimeout(resolveDelay,150)); }
        };
      });
      child.kill(); const exit = await stopped; rest.fault.after = null;
      workerOffline.assertNoExternalAttempts();
      assert.ok(exit.signal || exit.code !== 0, "Actual child worker forcibly stopped");
      return { boundary, exit, providerInvocations };
    },
    async stop() { await rest.stop(); await db.stop(); },
  };
  return harness;
}

export function assertStep4Identity(before, after, { delivered = false } = {}) {
  for (const key of ["jobId", "purchaseIntentId", "verifiedPaymentId", "inputHash", "authorityHash", "authorityVersion"]) assert.equal(after[key], before[key], key);
  for (const key of ["grantId", "logicalAssessmentId", "canonicalRunId", "canonicalHash"]) if (before[key]) assert.equal(after[key], before[key], key);
  for (const key of ["purchaseCount", "grantCount", "deliveryCount"]) assert.ok(after[key] <= 1, key);
  assert.equal(after.checkoutCount, before.checkoutCount, "no additional checkout");
  if (delivered) { assert.equal(after.state,"completed"); assert.equal(after.deliveryCount,1); assert.equal(after.accountAvailable,true); assert.equal(after.publicStatus.status,"completed"); }
}
