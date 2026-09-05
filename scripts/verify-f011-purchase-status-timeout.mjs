import assert from "node:assert/strict";
import { PurchaseStatusPoller, DEFAULT_PURCHASE_STATUS_POLL_POLICY } from "../lib/payment/purchase-status-poller.ts";
import { getPurchaseReturnPresentation } from "../lib/payment/purchase-return-presentation.ts";

let externalCalls = 0;
globalThis.fetch = async () => { externalCalls += 1; throw new Error("F011_EXTERNAL_CALL_FORBIDDEN"); };
const preparing = { status: "preparing_assessment", paymentVerified: true, accountFallback: true };
const completed = { ...preparing, status: "completed", resultPath: "/account/results/123e4567-e89b-42d3-a456-426614174000" };
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

function harness(fetchStatus, policy = {}) {
  const tasks = new Map();
  let id = 0;
  let now = 0;
  const statuses = [], recovery = [], navigations = [], signals = [];
  const poller = new PurchaseStatusPoller({
    fetchStatus(signal) { signals.push(signal); return fetchStatus(signal, signals.length); },
    onStatus: (status) => statuses.push(status),
    onRecoveryState: (state) => recovery.push(state),
    onNavigate: (result) => navigations.push(result),
    policy: { ...DEFAULT_PURCHASE_STATUS_POLL_POLICY, ...policy },
    random: () => 0.5,
    setTimer(callback, delay) { tasks.set(++id, { callback, at: now + delay, delay }); return id; },
    clearTimer(handle) { tasks.delete(handle); },
  });
  return { poller, tasks, statuses, recovery, navigations, signals,
    get now() { return now; },
    async next(expectedDelay) {
      const next = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
      assert.ok(next, "pending status request must have a deadline or retry timer");
      if (expectedDelay !== undefined) assert.equal(next[1].delay, expectedDelay);
      tasks.delete(next[0]); now = next[1].at; next[1].callback(); await tick();
    },
  };
}
let passed = 0;
async function check(name, run) { await run(); console.log(`PASS F011 ${++passed} ${name}`); }

await check("pending request has a deadline and ignores late completion", async () => {
  const late = deferred();
  const h = harness(() => late.promise);
  const starting = h.poller.start();
  await h.poller.manualRefresh();
  assert.equal(h.signals.length, 1);
  assert.equal(h.tasks.size, 1, "pending fetch needs a deadline");
  await h.next(15_000);
  await starting;
  assert.equal(h.signals[0].aborted, true);
  assert.deepEqual(h.recovery.at(-1), { requestFailed: true, recoveryExhausted: false });
  late.resolve(completed); await tick();
  assert.deepEqual(h.statuses, []); assert.deepEqual(h.navigations, []);
  h.poller.stop(); assert.equal(h.tasks.size, 0);
});

await check("abort-aware fetches retry without live request overlap and recover once", async () => {
  let active = 0, maxActive = 0;
  const h = harness((signal, attempt) => {
    active += 1; maxActive = Math.max(maxActive, active);
    if (attempt === 2) { active -= 1; return Promise.resolve(completed); }
    return new Promise((_, reject) => signal.addEventListener("abort", () => {
      active -= 1; reject(new DOMException("cancelled", "AbortError"));
    }, { once: true }));
  });
  const starting = h.poller.start(); await h.next(15_000); await starting;
  await h.next(1_500);
  assert.equal(maxActive, 1); assert.equal(active, 0);
  assert.deepEqual(h.navigations, [completed.resultPath]);
  await h.poller.manualRefresh(); assert.equal(h.signals.length, 2);
  assert.equal(h.tasks.size, 0);
});

await check("persistent stalls exhaust the existing retry budget and expose recovery", async () => {
  const h = harness(() => new Promise(() => {}));
  const starting = h.poller.start();
  await h.next(15_000); await starting;
  while (h.tasks.size) await h.next();
  assert.equal(h.signals.length, 9);
  assert.equal(h.now, 271_500, "nine deadlines plus the existing backoff, with midpoint jitter");
  assert.ok(h.signals.every((signal) => signal.aborted));
  assert.deepEqual(h.recovery.at(-1), { requestFailed: true, recoveryExhausted: true });
  const ui = getPurchaseReturnPresentation({ status: preparing, ...h.recovery.at(-1), customerAuthEnabled: true });
  assert.equal(ui.showManualRefresh, true); assert.equal(ui.showAccountFallback, true);
  assert.equal(ui.showSupportFallback, true); assert.equal(ui.showCheckoutRestart, false);
  h.poller.stop();
});

await check("manual retry after exhaustion clears backoff and rejects stale responses", async () => {
  const stale = deferred();
  const h = harness((_, n) => n === 1 ? stale.promise : Promise.resolve(completed), { maximumTransientRetries: 0 });
  const starting = h.poller.start(); await h.next(); await starting;
  await h.poller.manualRefresh();
  stale.resolve(preparing); await tick();
  assert.deepEqual(h.statuses, [completed]); assert.deepEqual(h.navigations, [completed.resultPath]);
  assert.equal(h.tasks.size, 0);
});

await check("body-read stall is included in the request deadline", async () => {
  const body = deferred();
  const h = harness(async () => { await Promise.resolve({ ok: true }); return await body.promise; });
  const starting = h.poller.start(); await tick(); await h.next(15_000); await starting;
  body.reject(new Error("late body failure")); await tick();
  assert.equal(h.recovery.at(-1).requestFailed, true); h.poller.stop();
});

await check("unmount cancels timers and settles an uncooperative fetch without updates", async () => {
  const h = harness(() => new Promise(() => {}));
  let settled = false;
  const starting = h.poller.start().then(() => { settled = true; });
  h.poller.stop(); await tick();
  assert.equal(h.tasks.size, 0); assert.equal(h.signals[0].aborted, true); assert.equal(settled, true);
  await starting;
  assert.deepEqual(h.statuses, []); assert.deepEqual(h.recovery, []); assert.deepEqual(h.navigations, []);
});

await check("stop/start does not let the previous request release a new request fence", async () => {
  const old = deferred(), fresh = deferred();
  const h = harness((_, n) => n === 1 ? old.promise : fresh.promise);
  const starting = h.poller.start(); h.poller.stop(); const restarted = h.poller.start();
  await starting; old.resolve(completed); await tick(); await h.poller.manualRefresh();
  assert.equal(h.signals.length, 2); assert.deepEqual(h.navigations, []);
  fresh.resolve(completed); await restarted;
  assert.deepEqual(h.navigations, [completed.resultPath]); assert.equal(h.tasks.size, 0);
});

await check("unexpected AbortError is a bounded transient failure", async () => {
  const h = harness(async () => { throw new DOMException("transport aborted", "AbortError"); });
  await h.poller.start(); assert.equal(h.recovery.at(-1).requestFailed, true);
  assert.equal(h.tasks.size, 1); h.poller.stop();
});

await check("success and terminal status clear request deadlines", async () => {
  for (const status of [completed, { status: "confirmation_pending", paymentVerified: true, accountFallback: true }]) {
    const h = harness(async () => status); await h.poller.start();
    assert.equal(h.tasks.size, 0); assert.equal(h.signals[0].aborted, false);
    h.poller.stop();
  }
});

assert.equal(externalCalls, 0);
console.log(`F011 purchase status timeout: ${passed}/${passed} PASS; external calls=0`);
