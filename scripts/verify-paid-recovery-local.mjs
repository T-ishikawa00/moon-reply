import assert from "node:assert/strict";
import { execFileSync, fork } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { createLocalPostgres } from "./remediation-local-postgres.mjs";
import { createPaidRecoveryPostgrest, readPaidRecoveryJsonBody, sqlLiteral as lit } from "./lib/paid-recovery-postgrest.mjs";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,export%20{}", shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { createPaidRecoveryApplication } = await import("./lib/paid-recovery-application.mjs");
const { M2RuntimeError } = await import("../lib/assessment/runtime/errors.ts");
const { runProductionFulfillmentDispatchSchedule } = await import("../lib/payment/production/recovery-schedulers.ts");
const { requestProductionFulfillmentDispatch } = await import("../lib/payment/production/fulfillment-dispatch.ts");
const { PaidRecoveryOperatorApplication } = await import("../lib/payment/production/paid-recovery-operator.ts");
const { enqueueReviewedNotificationRecovery } = await import("../lib/payment/production/paid-recovery.ts");
const { runNotificationCutoverRecovery } = await import("../lib/payment/production/notification-cutover-recovery.ts");
const { AssessmentPipeline } = await import("../lib/assessment/runtime/pipeline.ts");
const { validateRecoveryCandidate } = await import("../lib/assessment/production/recovery-candidate.ts");
const { createPaidRecoveryTransport, SupabasePaidProviderBudgetRepository } = await import("../lib/assessment/production/paid-recovery-transport.ts");
const { createPaidRecoveryV19Fixture, createPaidRecoveryV19MessageFixture } = await import("./lib/paid-recovery-v19-fixture.mjs");
const { fixture, consultationFor } = await import("./lib/paid-recovery-fixtures.mjs");
const db = await createLocalPostgres("paid-recovery-application");
const sourceStartSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true }).trim();
function captureSourceHashes() {
  const files = [...new Set([
    ...execFileSync("git", ["diff", "--name-only", "HEAD", "--", "lib", "netlify", "supabase", "scripts"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/u),
    ...execFileSync("git", ["ls-files", "--others", "--exclude-standard", "--", "lib", "netlify", "supabase", "scripts"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/u),
  ].filter(Boolean))].sort();
  return Object.fromEntries(files.map(file => [file, createHash("sha256").update(readFileSync(file)).digest("hex")]));
}
const sourceStartHashes = captureSourceHashes();
let rest;
let passed = 0;
const results = [];
const failures = [];
async function check(name, callback) {
  if (process.argv[2] && !name.includes(process.argv[2])) return;
  try {
    // Each scenario owns an empty synthetic application fixture; abandoned
    // reservations from another test must not consume this scenario's slots.
    const fixtureTables = db.sql("select string_agg(format('%I.%I',schemaname,tablename),',') from pg_tables where schemaname='public';");
    db.sql(`truncate ${fixtureTables} cascade;`);
    const evidence = await callback(); results.push({ scenario: name, outcome: "PASS", ...evidence });
    console.log(`PASS paid recovery ${++passed} ${name}`);
  } catch (error) { failures.push({ scenario: name, error: error.stack, databaseError: rest?.failures.at(-1) });
    console.error(`FAIL paid recovery ${name}: ${error.message}`); }
}
function snapshot(jobId) {
  return JSON.parse(db.sql(`select jsonb_build_object('job',j.id,'intent',j.purchase_intent_id,
    'verifiedPayment',j.verified_payment_id,'grant',j.grant_id,'logical',j.logical_assessment_id,
    'state',j.state,'reason',j.recovery_reason_code,'cycle',j.recovery_cycle_count,
    'inputHash',p.consultation_snapshot_sha256,'authorityHash',p.purchase_ready_authority_sha256,
    'attempts',j.attempt_count,'calls',j.provider_call_count,'cost',j.provider_reserved_cost_usd,
    'deliveries',(select count(*) from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
    'canonicalRun',(select runtime_run_id from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
    'canonicalHash',(select projection_sha256 from public.production_customer_deliveries where logical_assessment_id=j.logical_assessment_id),
    'reports',(select count(*) from public.assessment_reports a join public.assessment_runs r on r.id=a.run_id where r.request_id=p.assessment_request_id),
    'runs',(select count(*) from public.assessment_runs where request_id=p.assessment_request_id),
    'grants',(select count(*) from public.production_assessment_grants where preparation_id=p.id),
    'purchases',(select count(*) from public.production_purchases where preparation_id=p.id),
    'notifications',(select coalesce(jsonb_agg(n.status),'[]') from public.production_notification_outbox n where n.delivery_authority_reference=j.delivery_authority_reference))
    from public.production_fulfillment_jobs j join public.production_preparations p on p.id=j.preparation_id where j.id=${lit(jobId)};`));
}
function invariant(before, after, run, delivered = true) {
  for (const key of ["job", "intent", "verifiedPayment", "inputHash", "authorityHash"])
    assert.equal(after[key], before[key], `unchanged ${key}`);
  if (before.grant) assert.equal(after.grant, before.grant);
  if (before.logical) assert.equal(after.logical, before.logical);
  if (before.canonicalRun) assert.equal(after.canonicalRun, before.canonicalRun);
  if (before.canonicalHash) assert.equal(after.canonicalHash, before.canonicalHash);
  assert.equal(run.checkoutProvider.requests.length, 1, "no new Checkout/Charge request");
  assert.ok(after.deliveries <= 1); assert.ok(after.grants <= 1); assert.ok(after.purchases <= 1);
  if (delivered) { assert.equal(after.state, "completed"); assert.equal(after.deliveries, 1); }
}
async function seed() { const run = await createPaidRecoveryApplication(rest); const purchase = await run.seedVerifiedPurchase();
  assert.ok(purchase.fulfillmentJobId); return { run, purchase, jobId: purchase.fulfillmentJobId }; }
async function processCurrent(run, jobId) { const state = await run.recoveryRepository.inspect(jobId);
  return run.payment.processFulfillmentJobById(jobId, Number(state.recovery_cycle)); }
async function recover(run, jobId, advance = 1000) {
  run.advance(advance); await run.recoveryRepository.refresh({ environment: "test", now: run.now(), limit: 4 });
  run.advance(2);
  const due = await run.recoveryRepository.listDue({ environment: "test", now: run.now(), limit: 100 });
  if (due.includes(jobId)) await requestProductionFulfillmentDispatch({ repository: run.paymentRepository,
    dispatcher: run.dispatcher, jobId, now: run.now, uuid: randomUUID });
  return processCurrent(run, jobId);
}
async function killWorker(run, jobId, pauseAt) {
  const state = await run.recoveryRepository.inspect(jobId);
  const config = { url: rest.url, now: run.now(), jobId, cycle: Number(state.recovery_cycle), pauseAt };
  const child = fork("scripts/lib/paid-recovery-worker.mjs", [Buffer.from(JSON.stringify(config)).toString("base64url")], {
    execArgv: ["--experimental-transform-types"], windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: { SystemRoot: process.env.SystemRoot, WINDIR: process.env.SystemRoot, PATH: process.env.SystemRoot + "\\System32" },
  });
  let errorText = ""; child.stderr.on("data", chunk => errorText += chunk);
  const boundary = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { child.kill(); reject(new Error(`Worker boundary timeout: ${errorText}`)); }, 20000);
    child.on("message", message => {
      if (message.boundary === "provider" && ["provider", "checkpoint"].includes(pauseAt)) { clearTimeout(timeout); resolve(); }
      if (message.boundary === "completed") { clearTimeout(timeout); reject(new Error(`Worker completed before kill: ${message.status}`)); }
    });
    child.on("error", reject);
    if (pauseAt === "report") rest.fault.after = async call => {
      if (call.name === "finalize_completed_assessment") { clearTimeout(timeout); rest.fault.after = null; resolve(); await new Promise(r => setTimeout(r, 150)); }
    };
  });
  await boundary;
  const exit = new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
  child.kill(); const stopped = await exit; rest.fault.after = null;
  assert.ok(stopped.signal || stopped.code !== 0, "actual worker process forcibly stopped");
  return stopped;
}
async function configurationWorker(run, jobId) {
  const state = await run.recoveryRepository.inspect(jobId);
  const config = { url: rest.url, now: run.now(), jobId, cycle: Number(state.recovery_cycle), pauseAt: "configuration" };
  const child = fork("scripts/lib/paid-recovery-worker.mjs", [Buffer.from(JSON.stringify(config)).toString("base64url")], {
    execArgv: ["--experimental-transform-types"], windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: { SystemRoot: process.env.SystemRoot, WINDIR: process.env.SystemRoot, PATH: process.env.SystemRoot + "\\System32" },
  });
  let stderr = ""; child.stderr.on("data", chunk => stderr += chunk);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Error(`Configuration worker timeout: ${stderr}`)); }, 20000);
    let status;
    child.on("message", message => { if (message.boundary === "configuration-result") status = message.status; });
    child.on("exit", code => { clearTimeout(timer); if (code === 0 && status) resolve(status); else reject(new Error(stderr)); });
    child.on("error", reject);
  });
}
function holdProviderStage(run, stageId = "PB-06") {
  const original = run.transport.invoke.bind(run.transport);
  let release, reached;
  const gate = new Promise(resolve => release = resolve), boundary = new Promise(resolve => reached = resolve);
  run.transport.invoke = async request => {
    if (request.stageId === stageId) { reached(); await gate; }
    return original(request);
  };
  return { release, boundary };
}
try {
  const applied = db.applyThrough(35);
  assert.equal(applied.at(-1).slice(0, 4), "0035", "all recovery migrations required");
  // Platform bootstrap prerequisite, separate from application migrations.
  db.sql("grant usage on schema extensions to service_role;");
  rest = await createPaidRecoveryPostgrest(db);
  await check("adapter preserves every split of multibyte UTF8 report JSON", async () => {
    const expected = { statement: "返信の必要性やタイミングについて、相手側で判断が保留されているのかもしれない。" };
    const bytes = Buffer.from(JSON.stringify(expected));
    for (let split = 0; split <= bytes.length; split++) {
      assert.deepEqual(await readPaidRecoveryJsonBody([bytes.subarray(0,split),bytes.subarray(split)]), expected);
    }
    return { splitBoundariesVerified: bytes.length + 1 };
  });
  await check("baseline actual applications and canonical RPC", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    assert.equal((await processCurrent(run, jobId)).status, "completed");
    const after = snapshot(jobId); invariant(before, after, run); return { final: after };
  });
  await check("1 fast retry exhausted then same purchase delivered", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    run.transport.failure = new M2RuntimeError("M2_STAGE_PROVIDER_RETRYABLE", 503);
    for (let attempt = 0; attempt < 8; attempt++) await processCurrent(run, jobId);
    assert.equal(snapshot(jobId).attempts, 8, "all eight fast worker attempts executed");
    await run.payment.quarantineFulfillmentJobAfterAsyncRetryExhaustion(jobId, snapshot(jobId).cycle);
    const waiting = await run.recoveryRepository.inspect(jobId);
    assert.ok(waiting.next_attempt_at); assert.ok(waiting.owner); assert.ok(waiting.review_due_at);
    const failed = snapshot(jobId); run.transport.failure = null;
    assert.equal((await recover(run, jobId)).status, "completed");
    const after = snapshot(jobId); invariant(before, after, run); invariant(failed, after, run); return { final: after };
  });
  await check("2 queue registration fails then real scheduler redispatch delivers", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId); run.dispatcher.failuresRemaining = 1;
    await assert.rejects(run.payment.dispatchFulfillmentJob(jobId));
    assert.equal(snapshot(jobId).deliveries, 0); run.advance(31);
    const dispatched = await runProductionFulfillmentDispatchSchedule({ repository: {
      listDueFulfillmentDispatchJobIds: input => run.recoveryRepository.listDue({ ...input, environment: "test" }),
    }, now: run.now,
      dispatchJob: selectedJob => requestProductionFulfillmentDispatch({ repository: run.paymentRepository,
        dispatcher: run.dispatcher, jobId: selectedJob, now: run.now, uuid: randomUUID }) });
    assert.ok(dispatched.accepted >= 1); assert.ok(run.dispatcher.jobIds.includes(jobId));
    assert.equal((await processCurrent(run, jobId)).status, "completed");
    const after = snapshot(jobId); invariant(before, after, run); return { final: after };
  });
  await check("3 force-killed worker reclaimed and delivered", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    const killed = await killWorker(run, jobId, "provider");
    const abandoned = snapshot(jobId); assert.ok(abandoned.logical); assert.equal(abandoned.deliveries, 0);
    assert.equal((await recover(run, jobId)).status, "completed");
    const after = snapshot(jobId); invariant(before, after, run); invariant(abandoned, after, run); return { killed, final: after };
  });
  await check("4 force-killed after report commit recovers with zero regeneration", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    const killed = await killWorker(run, jobId, "report"); const saved = snapshot(jobId);
    assert.equal(saved.reports, 1); assert.equal(saved.deliveries, 0);
    const providerBefore = run.transport.calls.length;
    assert.equal((await recover(run, jobId)).status, "completed");
    assert.equal(run.transport.calls.length, providerBefore);
    const after = snapshot(jobId); assert.equal(after.runs, saved.runs); invariant(before, after, run); return { killed, final: after };
  });
  await check("3b completed paid stage checkpoint survives kill without repeating that provider stage", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    await killWorker(run, jobId, "checkpoint"); const abandoned = snapshot(jobId); assert.equal(abandoned.calls, 2);
    const paid04 = run.transport.calls.filter(stage => stage === "PB-04").length;
    assert.equal((await recover(run, jobId)).status, "completed");
    assert.equal(run.transport.calls.filter(stage => stage === "PB-04").length, paid04);
    const after = snapshot(jobId); assert.equal(after.calls, 4); invariant(before, after, run); return { final: after };
  });
  await check("6 permanent configuration error stops until inspected artifact resume", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    run.transport.failure = new M2RuntimeError("M2_RUNTIME_CONFIGURATION_INVALID", 503);
    assert.equal((await processCurrent(run, jobId)).status, "manual_review");
    const stopped = await run.recoveryRepository.inspect(jobId); assert.equal(stopped.next_attempt_at, null);
    const calls = run.transport.calls.length; await recover(run, jobId); assert.equal(run.transport.calls.length, calls);
    run.transport.failure = null;
    const operator = new PaidRecoveryOperatorApplication(run.recoveryRepository, run.now);
    await assert.rejects(operator.resume({ jobId, expectedReasonCode: "wrong-reason",
      operatorReference: "synthetic-reviewed-config", configurationValidated: true }));
    await operator.resume({ jobId, expectedReasonCode: stopped.reason_code,
      operatorReference: "synthetic-reviewed-config", configurationValidated: true });
    assert.equal((await recover(run, jobId, 2)).status, "completed");
    const after = snapshot(jobId); invariant(before, after, run); return { final: after };
  });
  await check("5 later improvement attempt failure retains verified earlier report for delivery", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    await killWorker(run, jobId, "report");
    const binding = JSON.parse(db.sql(`select jsonb_build_object('preparation',j.preparation_id,'owner',l.owner_id,
      'requestKey',q.idempotency_key,'run',(select a.run_id from public.assessment_reports a join public.assessment_runs r on r.id=a.run_id where r.request_id=q.id limit 1))
      from public.production_fulfillment_jobs j join public.production_logical_assessments l on l.id=j.logical_assessment_id
      join public.production_preparations p on p.id=j.preparation_id join public.assessment_requests q on q.id=p.assessment_request_id where j.id=${lit(jobId)};`));
    const preparation = await run.lifecycleRepository.getPreparationById(binding.preparation);
    const request = await run.runtimeRepository.findByIdempotencyKey(binding.requestKey);
    const candidate = await run.runtimeRepository.getRecoveryCandidate(binding.run);
    const verified = await validateRecoveryCandidate(candidate, preparation.purchaseReadyAuthority, request.id, run.now());
    const saved = snapshot(jobId);
    // An independently interrupted older workflow may have attempted a newer
    // improvement. Exercise that failed attempt through the real pipeline;
    // Recovery itself must select the verified report without doing this work.
    run.advance(1);
    const failedTransport = createPaidRecoveryTransport({ transport: { async invoke() {
      throw new M2RuntimeError("M2_STAGE_PROVIDER_RETRYABLE", 503);
    } }, repository: new SupabasePaidProviderBudgetRepository(rest.url, "synthetic-local-service-role"),
    logicalAssessmentId: saved.logical, ownerId: binding.owner, now: run.now });
    const later = new AssessmentPipeline({ repository: run.runtimeRepository, transport: failedTransport,
      definitions: run.catalog.definitions, timeZone: "Asia/Tokyo", strictMaterialDelivery: true,
      beforeProviderInvocation: async () => run.lifecycleRepository.markGenerationStarted({ logicalAssessmentId: saved.logical,
        ownerId: binding.owner, now: run.now() }) });
    await assert.rejects(later.fulfillPrepared(request, preparation.purchaseReadyAuthority, { requestId: request.id,
      runId: randomUUID(), model: "gpt-5.6-luna", promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
      schemaSetVersion: "pipeline-schema-runtime-v6.0.0", startedAt: run.now() }));
    assert.equal(snapshot(jobId).reports, 1);
    const retained = await run.runtimeRepository.getRecoveryCandidate(binding.run);
    assert.equal((await validateRecoveryCandidate(retained, preparation.purchaseReadyAuthority, request.id, run.now())).attestation.reportHash,
      verified.attestation.reportHash);
    const calls = run.transport.calls.length;
    assert.equal((await recover(run, jobId)).status, "completed"); assert.equal(run.transport.calls.length, calls);
    const after = snapshot(jobId); invariant(before, after, run); invariant(saved, after, run); return { final: after };
  });
  await check("7 late old worker cannot overwrite recovered new worker canonical delivery", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    const held = holdProviderStage(run), oldWork = processCurrent(run, jobId);
    await held.boundary; run.advance(1000);
    const newRun = await createPaidRecoveryApplication(rest, { now: run.now() });
    let outcome;
    try { outcome = await recover(newRun, jobId, 0); }
    finally { held.release(); }
    const newCanonical = snapshot(jobId); assert.equal(outcome.status, "completed");
    const oldOutcome = await oldWork;
    const after = snapshot(jobId); invariant(before, after, run); invariant(newCanonical, after, run);
    assert.notEqual(oldOutcome.status, "completed"); return { oldStatus: oldOutcome.status, newStatus: outcome.status, final: after };
  });
  await check("6b actual worker missing config durably blocks then inspected resume delivers", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    const calls = run.transport.calls.length; assert.equal(await configurationWorker(run, jobId), "manual_review");
    const stopped = await run.recoveryRepository.inspect(jobId); assert.equal(stopped.state, "manual_review");
    assert.equal(stopped.reason_code, "PAYMENT_CONFIGURATION_INVALID"); assert.equal(run.transport.calls.length, calls);
    await new PaidRecoveryOperatorApplication(run.recoveryRepository, run.now).resume({ jobId,
      expectedReasonCode: stopped.reason_code, operatorReference: "synthetic-reviewed-worker-config", configurationValidated: true });
    assert.equal((await recover(run, jobId, 2)).status, "completed");
    const after = snapshot(jobId); invariant(before, after, run); return { final: after };
  });
  await check("8 email rejection preserves Account result and retries notification only", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId); run.email.resultFailuresRemaining = 1;
    const first = await processCurrent(run, jobId); assert.equal(first.status, "completed"); assert.equal(first.notificationPending, true);
    const saved = snapshot(jobId); assert.equal(saved.deliveries, 1); const calls = run.transport.calls.length;
    run.advance(5); assert.equal((await processCurrent(run, jobId)).status, "completed");
    assert.equal(run.transport.calls.length, calls); const after = snapshot(jobId); assert.deepEqual(after.notifications, ["sent"]);
    invariant(before, after, run); return { final: after };
  });
  await check("8b permanent email config blocks notification until reviewed config resume", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    const prepare = run.email.prepareAssessmentResult.bind(run.email);
    run.email.prepareAssessmentResult = () => { throw new M2RuntimeError("TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED", 503); };
    assert.equal((await processCurrent(run, jobId)).status, "completed");
    const saved = snapshot(jobId); assert.equal(saved.deliveries, 1); const calls = run.transport.calls.length;
    const stopped = await run.recoveryRepository.inspect(jobId); assert.ok(stopped.reason_code); assert.equal(stopped.next_attempt_at, null);
    const due = await run.recoveryRepository.listDue({ environment: "test", now: run.now(), limit: 4 });
    assert.ok(!due.includes(jobId), "no repeated queue event while email config is blocked");
    let enqueues = 0, preparations = 0;
    const cutover = () => runNotificationCutoverRecovery({
      claim: signal => run.paymentRepository.claimNotificationCutoverRecovery({ environment: "test", signal }),
      enqueue: id => enqueueReviewedNotificationRecovery({ repository: run.recoveryRepository, jobId: id,
        enqueue: async () => { enqueues++; } }),
    });
    assert.ok(["idle", "deferred"].includes((await cutover()).status));
    assert.equal(enqueues, 0, "cutover cannot dispatch a blocked notification");
    // A previously reserved cutover event must also pass the application fence.
    assert.equal((await runNotificationCutoverRecovery({ claim: async () => ({ jobId }),
      enqueue: id => enqueueReviewedNotificationRecovery({ repository: run.recoveryRepository, jobId: id,
        enqueue: async () => { enqueues++; } }),
    })).status, "deferred");
    run.email.prepareAssessmentResult = (...args) => { preparations++; return prepare(...args); };
    assert.equal((await processCurrent(run, jobId)).status, "manual_review");
    assert.equal(preparations, 0); assert.equal(enqueues, 0);
    assert.equal(snapshot(jobId).canonicalHash, saved.canonicalHash);
    run.email.prepareAssessmentResult = prepare;
    await new PaidRecoveryOperatorApplication(run.recoveryRepository, run.now).resume({ jobId,
      expectedReasonCode: stopped.reason_code, operatorReference: "synthetic-reviewed-email-config", configurationValidated: true });
    assert.equal((await recover(run, jobId, 2)).status, "completed");
    assert.equal(run.transport.calls.length, calls); const after = snapshot(jobId);
    assert.deepEqual(after.notifications, ["sent"]); invariant(before, after, run); invariant(saved, after, run); return { final: after };
  });
  await check("9 accumulated execution age stops compute while retaining owner and next review", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    run.transport.failure = new M2RuntimeError("M2_STAGE_PROVIDER_RETRYABLE", 503);
    await processCurrent(run, jobId); const consumed = snapshot(jobId); assert.ok(consumed.calls > 0);
    await run.payment.quarantineFulfillmentJobAfterAsyncRetryExhaustion(jobId, consumed.cycle);
    run.transport.failure = null;
    await recover(run, jobId, 86401);
    const after = snapshot(jobId); assert.equal(after.deliveries, 0); assert.equal(after.calls, consumed.calls);
    assert.equal(after.cost, consumed.cost); invariant(before, after, run, false);
    const state = await run.recoveryRepository.inspect(jobId); assert.ok(state.owner); assert.ok(state.review_due_at);
    assert.equal(state.state, "manual_review"); return { final: after };
  });
  await check("10 unrepaired material candidate never becomes customer delivery", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    run.transport.stageOutputs["PB-06"].semantic_checks = [{ finding_code: "FACT_FIDELITY", severity: "major",
      json_path: "report_content.short_letter[0]", evidence_refs: ["input:current_situation"],
      detail: "SYNTHETIC LOCAL MATERIAL FINDING: the report asserts an unsupported material fact." }];
    await processCurrent(run, jobId); const blocked = snapshot(jobId);
    assert.equal(blocked.deliveries, 0); assert.equal(blocked.state, "manual_review");
    const state = await run.recoveryRepository.inspect(jobId); assert.ok(state.owner); assert.ok(state.review_due_at);
    const calls = run.transport.calls.length; await recover(run, jobId); assert.equal(run.transport.calls.length, calls);
    const after = snapshot(jobId); invariant(before, after, run, false); return { final: after };
  });
  await check("11 old V17 purchase and new candidate purchase retain independent contracts", async () => {
    const { run: oldRun, jobId: oldJob } = await seed(); const oldBefore = snapshot(oldJob);
    oldRun.transport.failure = new M2RuntimeError("M2_STAGE_PROVIDER_RETRYABLE", 503);
    await processCurrent(oldRun, oldJob);
    await oldRun.payment.quarantineFulfillmentJobAfterAsyncRetryExhaustion(oldJob, snapshot(oldJob).cycle);
    const v19 = createPaidRecoveryV19Fixture();
    oldRun.advance(30);
    const newRun = await createPaidRecoveryApplication(rest, { transport: v19.transport, localCandidate: true,
      now: oldRun.now(), consultation: consultationFor(fixture("polite_thank_you_with_draft"), v19.request) });
    const newPurchase = await newRun.seedVerifiedPurchase(); const newJob = newPurchase.fulfillmentJobId;
    const newBefore = snapshot(newJob);
    rest.fault.before = ({ name, payload }) => {
      if (name !== "attest_paid_recovery_candidate_v1") return;
      const persisted = JSON.parse(db.sql(`select report_json from public.assessment_reports where run_id=${lit(payload.p_runtime_run_id)};`));
      const diffs = [];
      const compare = (a,b,path) => {
        if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
          if (a !== b) diffs.push({ path, persisted:a, submitted:b });
          return;
        }
        for (const key of new Set([...Object.keys(a),...Object.keys(b)])) compare(a[key],b[key],`${path}.${key}`);
      };
      compare(persisted,payload.p_report_json,"report");
      assert.deepEqual(diffs, [], "Persisted V19 report bytes must equal submitted candidate evidence");
    };
    assert.equal((await processCurrent(newRun, newJob)).status, "completed");
    rest.fault.before = null;
    const messageFixture = createPaidRecoveryV19MessageFixture();
    const messageRun = await createPaidRecoveryApplication(rest, { transport: messageFixture.transport, localCandidate: true,
      now: newRun.now(), consultation: consultationFor(fixture("polite_thank_you_with_draft"), messageFixture.request) });
    const messagePurchase = await messageRun.seedVerifiedPurchase(), messageJob = messagePurchase.fulfillmentJobId;
    const messageBefore = snapshot(messageJob);
    assert.equal((await processCurrent(messageRun, messageJob)).status, "completed");
    const messageAfter = snapshot(messageJob); invariant(messageBefore, messageAfter, messageRun);
    const messageProjection = JSON.parse(db.sql(`select experience_projection_json from public.production_customer_deliveries where logical_assessment_id=${lit(messageAfter.logical)};`));
    assert.equal(messageProjection.projectionSchemaVersion, "v19-l5-message-projection-v1");
    const messageReport = JSON.parse(db.sql(`select report_json from public.assessment_reports where run_id=${lit(messageAfter.canonicalRun)};`));
    assert.equal(messageReport.result.answerMode, "message_only");
    assert.equal(messageProjection.draft, messageReport.result.messageResult.plan.revised_text);
    assert.equal(messageProjection.opening, messageReport.result.messageResult.content.opening);
    assert.ok(messageProjection.draft.trim().length > 0);
    oldRun.transport.failure = null;
    assert.equal((await recover(oldRun, oldJob)).status, "completed");
    const oldAfter = snapshot(oldJob), newAfter = snapshot(newJob);
    invariant(oldBefore, oldAfter, oldRun); invariant(newBefore, newAfter, newRun);
    const identities = JSON.parse(db.sql(`select jsonb_object_agg(j.id,p.purchase_ready_authority_json->'runtimeIdentity'->>'promptBundleVersion')
      from public.production_fulfillment_jobs j join public.production_preparations p on p.id=j.preparation_id
      where j.id in (${lit(oldJob)},${lit(newJob)});`));
    assert.equal(identities[oldJob], "prompt-bundle-runtime-v17.0.0");
    assert.equal(identities[newJob], "prompt-bundle-runtime-v23.0.0");
    return { legacy: oldAfter, candidate: newAfter, messageOnly: messageAfter, messageProjectionSchema: messageProjection.projectionSchemaVersion };
  });
  await check("11b pre-upgrade V17 report with no stored validation input recovers without provider", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    await killWorker(run, jobId, "report"); const saved = snapshot(jobId);
    // Synthetic historical storage shape: before 0034 this column did not
    // exist. Preserve report, request/prompt/schema hashes and all outputs.
    db.sql(`update public.assessment_stage_runs set input_json=null;`);
    const calls = run.transport.calls.length;
    assert.equal((await recover(run, jobId)).status, "completed"); assert.equal(run.transport.calls.length, calls);
    const after = snapshot(jobId); assert.equal(after.runs, saved.runs); invariant(before, after, run); return { final: after };
  });
  await check("11c altered historical request hash blocks adoption of legacy report", async () => {
    const { run, jobId } = await seed(); const before = snapshot(jobId);
    await killWorker(run, jobId, "report");
    db.sql(`update public.assessment_stage_runs set input_json=null;
      update public.assessment_stage_runs set request_hash=${lit("a".repeat(64))} where stage_id='PB-06';`);
    const calls = run.transport.calls.length; await recover(run, jobId); assert.equal(run.transport.calls.length, calls);
    const after = snapshot(jobId); assert.equal(after.deliveries, 0); assert.equal(after.reports, 1);
    assert.equal(after.state, "manual_review"); invariant(before, after, run, false); return { final: after };
  });
  await check("validation policy proof and digest mismatch cannot publish an unchanged report", async () => {
    const variants = [];
    for (const tamper of ["policyVersion", "validationHash"]) {
      const { run, jobId } = await seed(); const before = snapshot(jobId);
      let observed = false;
      rest.fault.before = ({ name, payload }) => {
        if (name !== "attest_paid_recovery_candidate_v1") return;
        observed = true;
        const persisted = JSON.parse(db.sql(`select report_json from public.assessment_reports where run_id=${lit(payload.p_runtime_run_id)};`));
        assert.deepEqual(payload.p_report_json, persisted, "tamper test keeps the actual completed report unchanged");
        if (tamper === "policyVersion") {
          const proof = JSON.parse(payload.p_validation_proof); proof.policyVersion = "synthetic-unaccepted-policy";
          payload.p_validation_proof = JSON.stringify(proof);
          // A self-consistent digest must not make an unsupported policy valid.
          payload.p_validation_hash = createHash("sha256").update(payload.p_validation_proof).digest("hex");
        } else payload.p_validation_hash = "0".repeat(64);
      };
      try { assert.equal((await processCurrent(run, jobId)).status, "manual_review"); }
      finally { rest.fault.before = null; }
      assert.ok(observed);
      assert.match(rest.failures.at(-1).message, /PRODUCTION_RECOVERY_VALIDATION_EVIDENCE_REQUIRED/u);
      const after = snapshot(jobId); invariant(before, after, run, false);
      assert.equal(after.deliveries, 0); assert.equal(after.reports, 1); assert.equal(after.purchases, 1); assert.equal(after.grants, 1);
      const calls = run.transport.calls.length;
      assert.equal((await recover(run, jobId)).status, "manual_review");
      assert.equal(run.transport.calls.length, calls, "rejected proof cannot cause automatic provider retries");
      variants.push({ tamper, final: after });
    }
    return { variants };
  });
  await check("12 financial resolution blocks a delayed worker", async () => {
    const { run, jobId, purchase } = await seed(); const before = snapshot(jobId);
    const held = holdProviderStage(run), lateWork = processCurrent(run, jobId);
    await held.boundary; const saved = snapshot(jobId); assert.equal(saved.deliveries, 0); assert.ok(saved.logical);
    db.sql(`insert into public.production_payment_adjustment_ledger(id,verified_payment_id,adjustment_kind,state,amount,currency,reason_code,created_at,updated_at)
      values(${lit(randomUUID())},${lit(purchase.verifiedPaymentId)},'ordinary_refund','succeeded',980,'jpy','synthetic_financial_resolution',${lit(run.now())},${lit(run.now())});`);
    held.release(); assert.notEqual((await lateWork).status, "completed");
    assert.equal((await recover(run, jobId)).status, "manual_review");
    const after = snapshot(jobId); assert.equal(after.deliveries, 0);
    invariant(before, after, run, false); invariant(saved, after, run, false);
    const state = await run.recoveryRepository.inspect(jobId); assert.equal(state.financial_review_required, true); return { final: after };
  });
  console.log(JSON.stringify({ passed, failed: failures.length, results, failures }, null, 2));
  assert.ok(passed + failures.length > 0, "scenario filter must select a test");
  assert.equal(failures.length, 0, "Every implemented local fault scenario must pass");
  if (!process.argv[2]) {
    const sourceHashes = captureSourceHashes();
    assert.deepEqual(sourceHashes, sourceStartHashes, "source bytes must stay unchanged during integrated suite");
    mkdirSync("evals/paid-delivery-step3", { recursive: true });
    writeFileSync("evals/paid-delivery-step3/local-results.json", JSON.stringify({ schemaVersion: "paid-recovery-local-results-v1",
      sourceStartSha, sourceStableDuringRun: true, command: "node --experimental-transform-types scripts/verify-paid-recovery-local.mjs",
      passed, failed: 0, results, sourceHashes, externalOperations: { productionRead: 0, productionWrite: 0, push: 0,
        deploy: 0, remoteMigration: 0, openAiCalls: 0, stripeCalls: 0, realEmail: 0, realDiscord: 0 },
      scope: "isolated PG17, actual application and RPC; external provider transports are synthetic" }, null, 2) + "\n");
  }
} catch (error) {
  if (rest?.failures.length) console.error(JSON.stringify(rest.failures.at(-1)));
  throw error;
} finally {
  if (rest) await rest.stop();
  db.stop();
}
