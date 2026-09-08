import assert from "node:assert/strict";
import { assertStep4Identity, sqlLiteral } from "./paid-delivery-step4-harness.mjs";

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

async function within(promise, label) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`STEP4_CONCURRENCY_BOUNDARY_TIMEOUT_${label}`)), 30000);
    })]);
  } finally { clearTimeout(timer); }
}

// Independent synthetic fixture. Lifecycle, reserve/complete RPCs, dispatch,
// workload consumption and recovery scheduler remain their actual applications.
export async function verifyStep4ProviderConcurrency(h) {
  await h.reset();
  const runs = [], purchases = [], before = [], events = [];
  for (let index = 0; index < 3; index++) {
    const run = await h.createRun({ contract: "v19", mode: "clean" });
    const purchase = await run.seedVerifiedPurchase();
    runs.push(run); purchases.push(purchase);
    const snapshot = await h.snapshot(run, purchase);
    assert.equal(snapshot.contract, "prompt-bundle-runtime-v23.0.0");
    assert.equal(snapshot.customerStatusObservations, 0);
    before.push(snapshot);
    const event = await h.dispatch(run, purchase.jobId);
    assert.ok(event); events.push(event);
  }
  const released = deferred(), entered = [deferred(), deferred()];
  const providerLedger = [], reservationSamples = [];
  function sample(label) {
    const now = new Date(Math.max(...runs.map(run => Date.parse(run.now())))).toISOString();
    const active = Number(h.db.sql(`select count(*) from public.production_fulfillment_jobs j
      join public.production_purchase_intents i on i.id=j.purchase_intent_id
      cross join lateral jsonb_array_elements(j.provider_reservations) r
      where i.environment='test' and r->>'finished_at' is null
        and (r->>'lease_expires_at')::timestamptz>${sqlLiteral(now)}::timestamptz;`));
    reservationSamples.push({ label, at: now, activeReservations: active });
    assert.ok(active <= 2, "At most two actual paid reservations can be active");
    return active;
  }
  for (const [index, run] of runs.entries()) {
    const invoke = run.transport.invoke.bind(run.transport);
    run.transport.invoke = async request => {
      providerLedger.push({ purchaseIndex: index + 1, stageId: request.stageId, schemaVersion: request.schemaVersion,
        phase: "provider_started", at: run.now() });
      sample(`provider_started_${index + 1}_${request.stageId}`);
      if (index < 2 && request.stageId === "PB-04") {
        entered[index].resolve();
        await released.promise;
      }
      const result = await invoke(request);
      providerLedger.push({ purchaseIndex: index + 1, stageId: request.stageId, phase: "provider_completed", at: run.now() });
      return result;
    };
  }
  const firstWork = h.consume(runs[0], events[0]);
  let secondWork;
  let thirdDenied, deniedState, deniedReason, firstCompleted, secondCompleted;
  try {
    await within(entered[0].promise, "FIRST");
    assert.equal(sample("first_held"), 1);
    secondWork = h.consume(runs[1], events[1]);
    await within(entered[1].promise, "SECOND");
    assert.equal(sample("two_held"), 2);
    thirdDenied = await within(h.consume(runs[2], events[2]), "THIRD_DENIED");
    deniedState = await h.snapshot(runs[2], purchases[2]);
    deniedReason = h.db.sql(`select last_error_code from public.production_fulfillment_jobs where id=${sqlLiteral(purchases[2].jobId)};`);
    assert.equal(thirdDenied.outcome.status, "temporary_problem");
    assert.equal(deniedReason, "PAID_RECOVERY_CONCURRENCY_LIMITED");
    assert.equal(deniedState.calls, 0, "Denied reservation cannot consume Provider budget or start Provider");
    assert.equal(providerLedger.filter(row => row.purchaseIndex === 3).length, 0, "Third paid Provider boundary was never reached");
    assert.equal(deniedState.deliveries, 0);
    assert.equal(sample("third_denied_two_still_held"), 2);
  } finally {
    released.resolve();
    [firstCompleted, secondCompleted] = await Promise.all([firstWork, secondWork]);
  }
  assert.equal(firstCompleted.outcome.status, "completed");
  assert.equal(secondCompleted.outcome.status, "completed");
  assert.equal(sample("first_two_completed"), 0);
  // The lost short retry event is handled by the actual durable scheduler.
  // The same third purchase, Grant and Logical Assessment remain authoritative.
  const recoveryEvents = await h.scheduler(runs[2], { advanceSeconds: 1000 });
  const recoveryEvent = recoveryEvents.find(event => event.jobId === purchases[2].jobId);
  assert.ok(recoveryEvent, "Scheduler must register the existing third job");
  const thirdCompleted = await h.consume(runs[2], recoveryEvent);
  assert.equal(thirdCompleted.outcome.status, "completed");
  const after = [];
  for (const [index, run] of runs.entries()) {
    const snapshot = await h.snapshot(run, purchases[index], { observeCustomer: true });
    assertStep4Identity(before[index], snapshot, { delivered: true });
    assert.equal(snapshot.checkoutCount, 1);
    assert.equal(snapshot.calls, 3);
    assert.equal(snapshot.notifications.length, 1);
    assert.equal(snapshot.notifications[0], "sent");
    after.push(snapshot);
  }
  assertStep4Identity(deniedState, after[2], { delivered: true });
  assert.equal(sample("all_completed"), 0);
  return { status: "PASS", scope: "actual three V19 paid applications and RPC; external AI, payment, email and queue adapters fake",
    before, after, thirdDenied: { outcome: thirdDenied, state: deniedState, reason: deniedReason },
    recoveryEvent, thirdCompleted, providerLedger, reservationSamples,
    maximumObservedActiveReservations: Math.max(...reservationSamples.map(row => row.activeReservations)),
    thirdProviderInvocationsBeforeRelease: 0,
    externalOperations: { openAiCalls: 0, stripeCalls: 0, realEmail: 0, productionRead: 0, productionWrite: 0 } };
}
