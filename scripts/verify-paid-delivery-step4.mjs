import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createStep4Harness, sqlLiteral as lit } from "./lib/paid-delivery-step4-harness.mjs";
import { createStep4SDKBoundary } from "./lib/paid-delivery-step4-sdk-boundary.mjs";
import { verifyStep4ProviderConcurrency } from "./lib/paid-delivery-step4-concurrency.mjs";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { PaidRecoveryOperatorApplication } from "../lib/payment/production/paid-recovery-operator.ts";

// All state transitions are real application/repository/RPC calls. Only
// external boundaries, clock and deliberately terminated worker processes vary.
const directory = "evals/paid-delivery-step4";
mkdirSync(directory, { recursive: true });
const filter = process.argv[2];
const git = (...args) => execFileSync("git", args, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }).trim();
function sourceHashes() {
  const names = [...new Set([...git("ls-files", "lib", "scripts", "supabase/migrations", "netlify").split(/\r?\n/u),
    ...git("ls-files", "--others", "--exclude-standard", "--", "lib", "scripts", "supabase/migrations", "netlify").split(/\r?\n/u)])].filter(Boolean).sort();
  return Object.fromEntries(names.map(path => [path, createHash("sha256").update(readFileSync(path)).digest("hex")]));
}
const startHead = git("rev-parse", "HEAD"), sourceBefore = sourceHashes();
const h = await createStep4Harness();
const results = [];
async function mark(c, label, { observeCustomer = false, run = c.run } = {}) {
  const snapshot = await h.snapshot(run, c.purchase, { observeCustomer });
  // No access credential is required as test evidence.
  if (snapshot.publicStatus) snapshot.publicStatus = { status: snapshot.publicStatus.status,
    paymentVerified: snapshot.publicStatus.paymentVerified, accountFallback: snapshot.publicStatus.accountFallback };
  if (snapshot.account) snapshot.account = { available: snapshot.account.available, deliveryId: snapshot.account.deliveryId };
  const row = { label, at: run.now(), ...snapshot }; c.transitions.push(row); return row;
}
async function start(c, options = {}) {
  c.run = await h.createRun(options); c.runs.push(c.run);
  c.purchase = await c.run.seedVerifiedPurchase();
  return mark(c, "verified_payment_browser_not_required");
}
async function event(c) {
  const e = await h.dispatch(c.run, c.purchase.jobId);
  assert.ok(e, "durable dispatch must yield a captured queue event"); return e;
}
async function consume(c, e, attempt = 0, run = c.run) {
  const outcome = await h.consume(run, e, { attempt });
  c.events.push(outcome); return outcome;
}
async function due(c, seconds = 1000, run = c.run) {
  const state = await run.recoveryRepository.inspect(c.purchase.jobId);
  const untilDue = state.next_attempt_at ? Math.ceil((Date.parse(state.next_attempt_at) - Date.parse(run.now())) / 1000) + 1 : 0;
  const events = await h.scheduler(run, { advanceSeconds: Math.max(seconds, untilDue) });
  c.scheduler.push({ at: run.now(), events, result: run.lastScheduler.dispatched });
  assert.ok(events.some(e => e.jobId === c.purchase.jobId), "scheduler must rediscover this same durable purchase");
  return events.find(e => e.jobId === c.purchase.jobId);
}
async function delivered(c, e = null, run = c.run) {
  if (e) assert.equal((await consume(c, e, 0, run)).workerOutcome?.status, "completed");
  const s = await mark(c, "delivered", { observeCustomer: true, run });
  assert.equal(s.state, "completed"); assert.equal(s.deliveryCount, 1);
  assert.equal(s.accountAvailable, true); assert.equal(s.publicStatus.status, "completed");
  assert.deepEqual(s.notifications, ["sent"]);
  return s;
}
function failProvider(c, code = "M2_STAGE_PROVIDER_RETRYABLE") {
  c.run.transport.failure = new M2RuntimeError(code, 503);
}
function hold(c, run, stage = "PB-06") {
  const invoke = run.transport.invoke.bind(run.transport);
  let release, reached;
  const gate = new Promise(resolve => release = resolve), boundary = new Promise(resolve => reached = resolve);
  run.transport.invoke = async request => { if (request.stageId === stage) { reached(); await gate; } return invoke(request); };
  c.releaseGates ??= []; c.releaseGates.push(release);
  return { release, boundary };
}
async function invariants(c) {
  const rows = c.transitions, first = rows[0], last = rows.at(-1);
  assert.ok(first && last);
  let grant = null, logical = null, canonical = null;
  for (const row of rows) {
    for (const key of ["jobId", "purchaseIntentId", "verifiedPaymentId", "inputHash", "authorityHash", "authorityVersion"])
      assert.equal(row[key], first[key], `immutable ${key}`);
    if (grant) assert.equal(row.grantId, grant); if (logical) assert.equal(row.logicalAssessmentId, logical);
    grant ??= row.grantId; logical ??= row.logicalAssessmentId;
    if (canonical) assert.equal(row.canonicalHash, canonical); canonical ??= row.canonicalHash;
    for (const key of ["deliveryCount", "purchaseCount", "grantCount"]) assert.ok(row[key] <= 1, key);
    if (row.state === "processing") assert.ok(row.processingOwner && row.leaseExpiresAt, "no unbounded processing lease");
    if (row.logicalState?.owner) assert.ok(row.logicalState.leaseExpiresAt, "logical owner always has a bounded lease");
    for (const reservation of row.providerReservations) assert.ok(reservation.lease_expires_at, "unknown Provider reservation has expiry");
    if (row.state === "manual_review") assert.ok(row.owner && row.reasonCode && row.reviewDueAt, "durable operator responsibility");
    if (row.nextAttemptAt) assert.ok(row.owner && row.reviewDueAt);
    if (row.publicStatus) {
      if (row.deliveryCount === 1) assert.equal(row.publicStatus.status, "completed");
      else if (row.state === "manual_review") assert.equal(row.publicStatus.status, "confirmation_pending");
      else if (row.nextAttemptAt && row.state !== "processing") assert.equal(row.publicStatus.status, "delayed_assessment");
    }
    for (const run of row.runtimeRunContracts) assert.equal(run.promptBundleVersion, row.authorityVersion, "purchased contract selects executor");
  }
  for (let i = 1; i < rows.length; i++) {
    assert.ok(rows[i].providerCalls >= rows[i-1].providerCalls, "cumulative calls never reset");
    assert.ok(rows[i].reservedCostUsd >= rows[i-1].reservedCostUsd, "cumulative reservations never reset");
  }
  const additionalCharges = c.runs.reduce((n, run) => n + run.checkoutProvider.requests.length, 0) - 1;
  assert.equal(additionalCharges, 0);
  const notifications = c.runs.flatMap(run => run.notificationInvocations);
  assert.ok(notifications.filter(row => row.status === "accepted").length <= 1, "one accepted notification across worker owners");
  assert.ok(new Set(notifications.map(row => row.idempotencyKey)).size <= 1, "same immutable notification key");
  assert.ok(new Set(notifications.map(row => row.payloadHash)).size <= 1, "same immutable notification payload");
  if (last.deliveryCount) assert.equal(notifications.filter(row => row.status === "accepted").length, 1);
  const proof = last.logicalAssessmentId ? JSON.parse(h.db.sql(`select jsonb_build_object('policy',validated_candidate_evidence->>'validation_policy_version',
    'reportHash',validated_candidate_report_hash,'validationHash',validated_candidate_validation_hash,'validation',validated_candidate_evidence->'output')
    from public.production_logical_assessments where id=${lit(last.logicalAssessmentId)};`)) : null;
  if (last.deliveryCount) {
    assert.equal(proof.policy, "paid-recovery-validation-v1");
    assert.ok(proof.reportHash && proof.validationHash);
    assert.equal(last.accountDeliveryId, last.account.deliveryId);
    const alien = await c.run.customerRepository.resolveOwnedResult({ customerUserId: randomUUID(), deliveryId: last.accountDeliveryId });
    assert.equal(alien, null, "canonical result remains customer-owned");
  }
  if (c.nonDeliverable) assert.equal(last.deliveryCount, 0);
  if (c.reuseAfter) {
    const saved = rows.find(row => row.label === c.reuseAfter); assert.ok(saved);
    assert.equal(last.providerCalls, saved.providerCalls, "completed artifact means zero new Provider invocation");
    assert.equal(last.reportCount, saved.reportCount);
    assert.deepEqual(last.reportArtifacts, saved.reportArtifacts, "saved reports are immutable");
    assert.ok(saved.reportArtifacts.some(row => row.runId === last.canonicalRunId), "canonical selects the existing completed report");
  }
  return { A: { additionalCharges }, B: { purchaseIntentId: first.purchaseIntentId, unchanged: true },
    C: { grantId: grant, logicalAssessmentId: logical, unchanged: true }, D: { canonicalCustomerReportCount: last.deliveryCount },
    E: { customerDeliveryCount: last.deliveryCount, notificationInvocations: notifications }, F: { reuseCheckpoint: c.reuseAfter ?? null, unnecessaryRegeneration: 0 },
    G: { blockedMaterialPublications: 0, selectedValidationProof: proof }, H: { financialBlockedPublications: 0, financialFixture: c.financial ?? null },
    I: { reservationsMonotone: true, providerCalls: last.providerCalls, reservedCostUsd: last.reservedCostUsd },
    J: { durableJobId: last.jobId, schedulerObservations: c.scheduler.length },
    K: { publicStatus: last.publicStatus, accountAvailable: last.accountAvailable }, L: { purchasedContract: last.authorityVersion, runtimeContracts: last.runtimeRunContracts } };
}
async function scenario(id, title, injectedFault, callback) {
  if (filter && filter !== id) return;
  await h.reset();
  const c = { id, title, injectedFault, runs: [], transitions: [], events: [], scheduler: [] };
  try {
    await callback(c); c.invariants = await invariants(c);
    if (id === "S19") c.providerConcurrency = await verifyStep4ProviderConcurrency(h);
    c.status = "PASS";
  } catch (error) {
    c.status = "FAIL"; c.failure = { message: error.message, stack: error.stack, databaseError: h.rest.failures.at(-1) ?? null };
    if (c.run && c.purchase) { try { await mark(c, "failure_snapshot"); } catch { /* preserve original failure */ } }
  } finally {
    for (const release of c.releaseGates ?? []) release();
    await Promise.allSettled(c.pendingWorkers ?? []);
  }
  const { runs, run, purchase, releaseGates, pendingWorkers, ...evidence } = c;
  void releaseGates; void pendingWorkers; void run; void purchase;
  evidence.providerInvocationLedger = runs.map(r => ({ contractDefault: r.contract, invocations: r.providerInvocations }));
  if (c.kill) evidence.providerInvocationLedger.push({ contractDefault: "purchased worker contract", invocations: c.kill.providerInvocations });
  if (c.sdkEvidence) evidence.providerInvocationLedger.push({ contractDefault: "actual SDK rejected HTTP requests",
    invocations: c.sdkEvidence.wireRequests.filter(row => row.httpStatus >= 400).map(row => ({ stageId: row.stageId,
      schemaVersion: row.schemaVersion, status: "failed", httpStatus: row.httpStatus, requestHash: createHash("sha256").update(JSON.stringify(row.body)).digest("hex") })) });
  const paidInvocations = evidence.providerInvocationLedger.flatMap(r => r.invocations).filter(row => ["PB-04","PB-05","PB-06"].includes(row.stageId));
  evidence.providerInvocationCount = paidInvocations.length;
  evidence.providerInvocationScope = "Paid PB-04/PB-05/PB-06, including repair. Prepayment PB-01/PB-01C/PB-02/PB-03 remain separately visible in the ledger.";
  evidence.repairCount = paidInvocations.filter(row => row.repair).length;
  evidence.notificationCount = c.invariants?.E.notificationInvocations.filter(row => row.status === "accepted").length ?? 0;
  evidence.additionalChargeCount = c.invariants?.A.additionalCharges ?? null;
  evidence.queueEvents = runs.flatMap(r => r.queueEvents);
  evidence.actualWorkerEvents = runs.flatMap(r => r.workerEvents);
  evidence.startHead = startHead;
  writeFileSync(`${directory}/${id}.json`, JSON.stringify(evidence, null, 2) + "\n");
  results.push({ scenarioId: id, title, status: c.status, finalState: c.transitions.at(-1)?.state,
    invariantEvidence: `${id}.json`, ...(c.failure ? { failure: c.failure.message } : {}) });
  console.log(`${c.status} STEP4 ${id} ${title}${c.failure ? ": " + c.failure.message : ""}`);
}
try {
  await scenario("S01", "Normal V19-L5 happy path", "none", async c => { await start(c); await delivered(c, await event(c)); });
  await scenario("S02", "Provider temporary failure", "temporary Provider failure; restore after delayed rediscovery", async c => {
    await start(c); const e = await event(c); failProvider(c);
    await consume(c,e); await consume(c,e,1); await mark(c,"temporary_failures");
    c.run.transport.failure = null; await delivered(c,await due(c));
  });
  await scenario("S03", "Eight fast retries exhausted", "eight worker attempts then Async Workloads exhaustion", async c => {
    await start(c); const e=await event(c); failProvider(c);
    for(let attempt=0;attempt<8;attempt++) await consume(c,e,attempt);
    await consume(c,e,8); const wait=await mark(c,"durable_recovery_wait",{observeCustomer:true});
    assert.equal(wait.attempts,8); assert.ok(wait.nextAttemptAt);
    c.run.transport.failure=null; await delivered(c,await due(c));
  });
  await scenario("S04", "Queue dispatch loss", "queue publish rejects; no accepted event", async c => {
    await start(c); c.run.dispatcher.failuresRemaining=1;
    await assert.rejects(h.dispatch(c.run,c.purchase.jobId));
    assert.equal(c.run.queueEvents.length,0); await mark(c,"queue_publish_failed");
    await delivered(c,await due(c,31));
  });
  await scenario("S05", "Worker hard kill", "SIGTERM during paid PB04; no catch/finally recovery", async c => {
    await start(c); const e=await event(c); c.kill=await h.killWorker(c.run,c.purchase.jobId,{pauseAt:"provider",event:e});
    await mark(c,"abandoned_worker_lease"); await delivered(c,await due(c));
  });
  await scenario("S06", "Valid report persisted then crash", "SIGTERM after actual report RPC commit before canonical delivery", async c => {
    await start(c); const e=await event(c); c.kill=await h.killWorker(c.run,c.purchase.jobId,{pauseAt:"report",event:e});
    const saved=await mark(c,"saved_valid_report"); assert.equal(saved.reportCount,1); assert.equal(saved.deliveryCount,0);
    c.reuseAfter="saved_valid_report"; await delivered(c,await due(c));
  });
  await scenario("S07", "Unknown Provider outcome", "PB04 checkpoint saved; worker killed during PB05 request", async c => {
    await start(c); const e=await event(c); c.kill=await h.killWorker(c.run,c.purchase.jobId,{pauseAt:"checkpoint",event:e});
    const unknown=await mark(c,"unknown_provider_outcome");
    assert.equal(c.kill.boundary.externalFakeReturned,true);
    assert.equal(c.kill.boundary.applicationReceivedResult,false);
    assert.ok(unknown.stages.some(s=>s.stageId==="PB-05"&&s.status==="processing"),"executed external result has no completed stage checkpoint");
    await consume(c,e,1); const active=await mark(c,"live_lease_defers_duplicate"); assert.equal(active.providerCalls,unknown.providerCalls);
    const after=await delivered(c,await due(c));
    assert.equal(after.providerCalls-unknown.providerCalls,2,"reuse PB04; only PB05/PB06 necessary");
  });
  await scenario("S08", "Repairable V19-L5 fact defect", "eligible narrow fact finding; exact patch then bound post-verification", async c => {
    await start(c,{mode:"repairable"}); const after=await delivered(c,await event(c));
    assert.equal(after.repairCount,1); assert.equal(after.revalidationCount,1);
    assert.equal(after.stages.filter(s=>s.stageId==="PB-06"&&s.status==="completed").length,2);
  });
  await scenario("S09", "Unrepairable material defect", "post-repair fact integrity remains failed", async c => {
    c.nonDeliverable=true; await start(c,{mode:"unrepairable"}); const e=await event(c); await consume(c,e);
    const stopped=await mark(c,"material_blocked",{observeCustomer:true}); assert.equal(stopped.state,"manual_review");
    assert.equal(stopped.repairCount,1); const calls=stopped.providerCalls;
    assert.equal((await h.scheduler(c.run,{advanceSeconds:7200})).length,0); await consume(c,e,1);
    const after=await mark(c,"operator_obligation_retained",{observeCustomer:true}); assert.equal(after.providerCalls,calls);
  });
  await scenario("S10", "Schema/config compatibility recovery", "actual SDK fake HTTP400 invalid_json_schema then compatible config", async c => {
    await start(c); const invoke=c.run.transport.invoke.bind(c.run.transport);
    const sdk=createStep4SDKBoundary({invoke},{configurationValid:false}); c.run.transport.invoke=sdk.transport.invoke.bind(sdk.transport);
    const e=await event(c); await consume(c,e); const stopped=await mark(c,"schema_operator_block",{observeCustomer:true});
    assert.equal(stopped.state,"manual_review"); const n=sdk.wireRequests.length;
    await consume(c,e,1); assert.equal(sdk.wireRequests.length,n); assert.equal((await h.scheduler(c.run,{advanceSeconds:900})).length,0);
    sdk.setConfigurationValid(true);
    const inspected=await c.run.recoveryRepository.inspect(c.purchase.jobId);
    await new PaidRecoveryOperatorApplication(c.run.recoveryRepository,c.run.now).resume({jobId:c.purchase.jobId,
      expectedReasonCode:inspected.reason_code,operatorReference:"STEP4-S10-reviewed-compatible-artifact",configurationValidated:true});
    await delivered(c,await due(c,2)); c.sdkEvidence={metrics:sdk.metrics(),wireRequests:sdk.wireRequests};
  });
  await scenario("S11", "Cumulative AI budget exhausted", "persistent transient failures consume real pre-call budget reservations", async c => {
    c.nonDeliverable=true; await start(c); let e=await event(c); failProvider(c);
    for(let round=0;round<32;round++) {
      await consume(c,e); const row=await mark(c,`budget_attempt_${round}`);
      if(row.state==="manual_review") break;
      e=await due(c,1000);
    }
    const stopped=await mark(c,"budget_exhausted",{observeCustomer:true});
    assert.equal(stopped.state,"manual_review"); assert.equal(stopped.reasonCode,"PAID_RECOVERY_BUDGET_EXHAUSTED");
    assert.ok(stopped.providerCalls>1 && stopped.reservedCostUsd>0);
    c.run.transport.failure=null; const restarted=await h.createRun({now:c.run.now()}); c.runs.push(restarted);
    const duplicatePayment=await restarted.payment.verifyStripeEvidence(c.purchase.evidence,false);
    assert.equal(duplicatePayment.fulfillmentJobId,c.purchase.jobId,"payment replay cannot replace the exhausted job");
    c.paymentReplayEvidence=duplicatePayment;
    await consume(c,e,0,restarted); const after=await mark(c,"restart_does_not_reset_budget",{observeCustomer:true,run:restarted});
    assert.equal(after.providerCalls,stopped.providerCalls); assert.equal(after.reservedCostUsd,stopped.reservedCostUsd);
  });
  await scenario("S12", "Old V17 purchase after V19 selector switch", "V17 work interrupted; default new-purchase selector becomes V19", async c => {
    await start(c,{contract:"v17"}); const e=await event(c);
    c.kill=await h.killWorker(c.run,c.purchase.jobId,{pauseAt:"checkpoint",event:e}); await mark(c,"v17_checkpoint_before_switch");
    c.run.advance(1000); const old=c.run, next=await h.createRun({contract:"v19",now:old.now()}); c.runs.push(next);
    const v19Invoke=next.transport.invoke.bind(next.transport), oldInvoke=old.transport.invoke.bind(old.transport);
    const v17Hashes=new Set(old.catalog.definitions.map(d=>d.promptHash));
    next.transport.invoke=q=>v17Hashes.has(q.promptHash)?oldInvoke(q):v19Invoke(q);
    c.selectorEvidence={defaultNewPurchases:"v19",constructorCatalog:"v17 unchanged",selection:"immutable purchase authority",identitySpoofed:false};
    await delivered(c,await due(c,2,next),next);
  });
  await scenario("S13", "New V19-L5 purchase", "new selector must not fall back to V17", async c => {
    await start(c,{contract:"v19"}); const after=await delivered(c,await event(c));
    assert.equal(after.authorityVersion,"prompt-bundle-runtime-v23.0.0");
    assert.ok(after.runtimeRunContracts.every(r=>r.schemaSetVersion==="pipeline-schema-runtime-v9.0.0"));
  });
  await scenario("S14", "Old and new worker completion race", "hold old PB06 beyond lease; new owner completes first", async c => {
    await start(c); const e=await event(c), old=c.run, gate=hold(c,old), oldWork=consume(c,e); c.pendingWorkers=[oldWork];
    await gate.boundary; await mark(c,"old_worker_held"); old.advance(1000);
    const next=await h.createRun({now:old.now()}); c.runs.push(next);
    const saved=await delivered(c,await due(c,2,next),next);
    gate.release(); await oldWork; const after=await mark(c,"late_old_completion_fenced",{observeCustomer:true,run:next});
    assert.equal(after.canonicalHash,saved.canonicalHash); assert.equal(after.canonicalRunId,saved.canonicalRunId);
  });
  await scenario("S15", "Notification failure preserves Account result", "email rejects after canonical commit", async c => {
    await start(c); c.run.email.resultFailuresRemaining=1; const e=await event(c); await consume(c,e);
    const saved=await mark(c,"account_available_email_failed",{observeCustomer:true});
    assert.equal(saved.accountAvailable,true); assert.equal(saved.publicStatus.status,"completed"); c.reuseAfter="account_available_email_failed";
    c.run.advance(5); await consume(c,e,1); await delivered(c);
  });
  await scenario("S16", "Financial resolution and late worker race", "record legitimate financial delivery block while PB06 is in flight", async c => {
    c.nonDeliverable=true; await start(c); const e=await event(c), gate=hold(c,c.run), work=consume(c,e); c.pendingWorkers=[work];
    await gate.boundary; const before=await mark(c,"before_financial_resolution"); c.financial={id:randomUUID(),state:"succeeded",kind:"ordinary_refund"};
    h.db.sql(`insert into public.production_payment_adjustment_ledger(id,verified_payment_id,adjustment_kind,state,amount,currency,reason_code,created_at,updated_at)
      values(${lit(c.financial.id)},${lit(before.verifiedPaymentId)},'ordinary_refund','succeeded',980,'jpy','STEP4_SYNTHETIC_FINANCIAL_RESOLUTION',${lit(c.run.now())},${lit(c.run.now())});`);
    gate.release(); await work; await mark(c,"financial_late_worker_blocked",{observeCustomer:true});
    assert.equal(h.db.sql(`select state from public.production_payment_adjustment_ledger where id=${lit(c.financial.id)};`),"succeeded");
  });
  await scenario("S17", "Browser abandonment", "no success page/status/session/storage activity after verified payment", async c => {
    await start(c); assert.equal(c.run.customerObservations.length,0);
    const e=await due(c,1); await consume(c,e); assert.equal(c.run.customerObservations.length,0);
    c.browserEvidence={statusCallsBeforeBackendDelivery:0,browserProcessRequired:false,sessionStorageRequired:false}; await delivered(c);
  });
  await scenario("S18", "Scheduler outage and restart", "scheduler absent for two controlled hours after lost dispatch", async c => {
    await start(c); c.run.dispatcher.failuresRemaining=1; await assert.rejects(h.dispatch(c.run,c.purchase.jobId));
    const before=await mark(c,"scheduler_offline"); c.run.advance(7200); const retained=await mark(c,"two_hours_no_scheduler");
    assert.equal(retained.providerCalls,before.providerCalls); assert.equal(retained.jobId,before.jobId);
    await delivered(c,await due(c,1));
  });
  await scenario("S19", "Concurrent schedulers and workers", "four scans and two duplicate worker deliveries compete", async c => {
    await start(c); const scans=await Promise.all(Array.from({length:4},()=>h.scheduler(c.run,{settleSeconds:0})));
    c.scheduler.push({scans}); assert.equal(c.run.queueEvents.length,1,"one dispatch owner");
    const e=c.run.queueEvents[0], gate=hold(c,c.run,"PB-04"), first=consume(c,e); c.pendingWorkers=[first];
    await gate.boundary; const second=await consume(c,e); assert.equal(second.workerOutcome.status,"in_progress");
    await mark(c,"single_live_owner"); gate.release(); await first; const after=await delivered(c);
    assert.equal(after.providerCalls,3); assert.equal(after.runtimeRunContracts.filter(r=>r.status==="completed").length,1);
  });
  const sourceAfter=sourceHashes();
  assert.deepEqual(sourceAfter,sourceBefore,"source must remain frozen during STEP4 integration");
  const result={schemaVersion:"paid-delivery-step4-application-results-v1",startHead,sourceStableDuringRun:true,sourceHashes:sourceBefore,
    scope:"isolated PostgreSQL, actual applications/repos/RPC/worker event and scheduler; external boundaries controlled fakes",results,
    passed:results.filter(r=>r.status==="PASS").length,failed:results.filter(r=>r.status!=="PASS").length};
  writeFileSync(`${directory}/${filter ? `application-results-${filter}` : "application-results"}.json`,JSON.stringify(result,null,2)+"\n");
  assert.ok(results.length>0); assert.equal(result.failed,0,"all selected integrated scenarios must pass");
} finally { await h.stop(); }
