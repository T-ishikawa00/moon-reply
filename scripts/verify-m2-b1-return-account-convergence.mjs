import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CUSTOMER_PURCHASE_STATUS_POLICY,
  decodeCustomerPurchaseStatusResponse,
  parseCustomerResultPath,
} from "../lib/payment/purchase-status-contract.ts";
import {
  DEFAULT_PURCHASE_STATUS_POLL_POLICY,
  PurchaseStatusPoller,
  purchaseStatusBackoffDelay,
} from "../lib/payment/purchase-status-poller.ts";
import { getPurchaseReturnPresentation } from "../lib/payment/purchase-return-presentation.ts";

const root = process.cwd();
const base = "1b4863985fb1bd32e769ddfac884a27b236472cb";
const expectedBranch = "task/m2-b1-return-account-convergence-r1";
const validLegacyPath = `/result/${"A".repeat(43)}`;
const validAccountPath =
  "/account/results/123e4567-e89b-42d3-a456-426614174000";
let passed = 0;

function git(args, encoding = "utf8") {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding, maxBuffer: 128 * 1024 * 1024 },
  );
}

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

async function check(name, callback) {
  await callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function changedPathsFromBase() {
  const tracked = git(["diff", "--name-only", base, "--"])
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((entry) =>
    entry.replaceAll("\\", "/"),
  );
}

class FakeScheduler {
  nextId = 1;
  tasks = new Map();
  delays = [];

  setTimer = (callback, delayMs) => {
    const id = this.nextId++;
    this.tasks.set(id, callback);
    this.delays.push(delayMs);
    return id;
  };

  clearTimer = (handle) => {
    this.tasks.delete(handle);
  };

  async runNext() {
    const next = this.tasks.entries().next();
    assert.equal(next.done, false, "expected a scheduled poll");
    const [id, callback] = next.value;
    this.tasks.delete(id);
    callback();
    await new Promise((resolve) => setImmediate(resolve));
  }
}

function confirming(accountFallback = true) {
  return {
    status: "confirming_payment",
    paymentVerified: false,
    accountFallback,
  };
}

function preparing(accountFallback = true) {
  return {
    status: "preparing_assessment",
    paymentVerified: true,
    accountFallback,
  };
}

function temporaryProblem(accountFallback = true) {
  return {
    status: "temporary_problem",
    paymentVerified: true,
    accountFallback,
    retryable: true,
  };
}

function completed(resultPath = validAccountPath) {
  return {
    status: "completed",
    paymentVerified: true,
    accountFallback: resultPath.startsWith("/account/"),
    resultPath,
  };
}

await check("exact M2-B1 authority, branch, and bounded path manifest", () => {
  assert.equal(git(["branch", "--show-current"]).trim(), expectedBranch);
  assert.equal(git(["merge-base", base, "HEAD"]).trim(), base);
  assert.equal(git(["rev-parse", "release/private-ready"]).trim(), base);
  assert.equal(git(["rev-parse", "origin/release/private-ready"]).trim(), base);
  assert.equal(git(["stash", "list"]).trim(), "");
  const allowed = new Set([
    "app/globals.css",
    "app/purchase/return/[statusCapability]/page.tsx",
    "components/payment/PurchaseReturnStatus.tsx",
    "docs/CODEX_HANDOFF.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/m2/M2_B1_RETURN_ACCOUNT_CONVERGENCE.md",
    "docs/m2/M2_MASTER_BACKLOG.md",
    "lib/payment/production/application.ts",
    "lib/payment/production/types.ts",
    "lib/payment/purchase-return-presentation.ts",
    "lib/payment/purchase-status-contract.ts",
    "lib/payment/purchase-status-poller.ts",
    "package.json",
    "scripts/verify-m1-4-background-fulfillment-durability.mjs",
    "scripts/verify-m2-b1-return-account-convergence.mjs",
    "scripts/verify-rc2-production-payment-delivery.mjs",
  ]);
  const changed = changedPathsFromBase();
  assert.deepEqual(
    changed.filter((entry) => !allowed.has(entry)),
    [],
    "out-of-manifest path changed",
  );
});

await check("M2-A1 closure is current without rewriting protected history", () => {
  for (const doc of [
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
  ]) {
    const source = text(doc);
    assert.match(source, /M2-A1-REMOTE-CLOSURE-M2-B1-START:BEGIN/u);
    assert.match(source, /0002\.\.0017/u);
    assert.match(
      source,
      /b5c2534dbc8bdb97e6fa77612143b8bf9ec78c2955908ceab3d360bab30f9380/u,
    );
  }
  assert.match(text("docs/m2/M2_MASTER_BACKLOG.md"), /CONFIRMED_REMOTE_CLOSED/u);
  for (const protectedPath of [
    "supabase/migrations/0017_m2_a1_null_fence_integrity.sql",
    "netlify.toml",
    "scripts/verify-m1-4-background-runtime-assets.mjs",
    "scripts/verify-m1-4-async-router-artifacts.mjs",
  ]) {
    assert.equal(
      git(["diff", "--name-only", base, "--", protectedPath]).trim(),
      "",
      `${protectedPath} changed`,
    );
  }
});

await check("result paths allow only canonical legacy or Account destinations", () => {
  assert.equal(parseCustomerResultPath(validLegacyPath), validLegacyPath);
  assert.equal(parseCustomerResultPath(validAccountPath), validAccountPath);
  for (const rejected of [
    "https://example.test/result/" + "A".repeat(43),
    "//example.test/result/" + "A".repeat(43),
    `${validLegacyPath}?next=/account`,
    `${validLegacyPath}#fragment`,
    "/result/../account",
    `/result/${"A".repeat(42)}`,
    "/account/results/not-a-uuid",
    "/account/results/123e4567-e89b-72d3-a456-426614174000",
    `${validAccountPath}?next=/result`,
    `${validAccountPath}#fragment`,
    "/account/results/../request",
  ]) {
    assert.equal(parseCustomerResultPath(rejected), null, rejected);
  }
});

await check("server response decoder is exact and fails closed", () => {
  assert.deepEqual(
    decodeCustomerPurchaseStatusResponse({ data: completed(validAccountPath) }),
    completed(validAccountPath),
  );
  assert.deepEqual(
    decodeCustomerPurchaseStatusResponse({ data: completed(validLegacyPath) }),
    completed(validLegacyPath),
  );
  assert.deepEqual(
    decodeCustomerPurchaseStatusResponse({ data: confirming(false) }),
    confirming(false),
  );
  for (const rejected of [
    { data: { status: "completed", resultPath: validAccountPath } },
    {
      data: {
        ...completed(validAccountPath),
        resultPath: "https://example.test/result",
      },
    },
    { data: { status: "confirmation_pending", accountFallback: true } },
    { data: { ...preparing(), paymentVerified: false } },
    { data: { ...temporaryProblem(), retryable: false } },
    { data: confirming(), extra: true },
    { data: confirming(), extraEnvelope: true },
  ]) {
    assert.equal(decodeCustomerPurchaseStatusResponse(rejected), null);
  }
});

await check("terminal and recoverable policy matrix is explicit", () => {
  assert.deepEqual(CUSTOMER_PURCHASE_STATUS_POLICY.confirming_payment, {
    automaticPolling: true,
    terminal: false,
    customerActionRequired: false,
    resultDestination: false,
    accountFallbackWhenAuthenticated: true,
  });
  assert.equal(
    CUSTOMER_PURCHASE_STATUS_POLICY.preparing_assessment.automaticPolling,
    true,
  );
  assert.equal(
    CUSTOMER_PURCHASE_STATUS_POLICY.temporary_problem.automaticPolling,
    true,
  );
  for (const terminal of [
    "payment_not_completed",
    "confirmation_pending",
    "completed_check_verified_email",
    "completed",
  ]) {
    assert.equal(CUSTOMER_PURCHASE_STATUS_POLICY[terminal].terminal, true);
    assert.equal(
      CUSTOMER_PURCHASE_STATUS_POLICY[terminal].automaticPolling,
      false,
    );
  }
  assert.equal(
    CUSTOMER_PURCHASE_STATUS_POLICY.completed.resultDestination,
    true,
  );
});

await check("paymentVerified wording comes only from the durable server field", () => {
  const unverified = getPurchaseReturnPresentation({
    status: {
      status: "confirmation_pending",
      paymentVerified: false,
      accountFallback: true,
    },
    requestFailed: false,
    recoveryExhausted: false,
    customerAuthEnabled: true,
  });
  assert.equal(unverified.assurance, null);
  assert.doesNotMatch(unverified.body, /お支払いは確認済み|追加のお支払いは必要ありません/u);
  assert.equal(unverified.showCheckoutRestart, false);
  assert.equal(unverified.showAccountFallback, true);

  const verified = getPurchaseReturnPresentation({
    status: {
      status: "confirmation_pending",
      paymentVerified: true,
      accountFallback: true,
    },
    requestFailed: false,
    recoveryExhausted: false,
    customerAuthEnabled: true,
  });
  assert.match(verified.assurance, /追加のお支払いは必要ありません/u);
  assert.equal(verified.showCheckoutRestart, false);
  assert.equal(verified.showAccountFallback, true);
});

await check("backoff is exponential, jittered, and capped", () => {
  const policy = DEFAULT_PURCHASE_STATUS_POLL_POLICY;
  const low = purchaseStatusBackoffDelay(1, policy, 0);
  const high = purchaseStatusBackoffDelay(1, policy, 1);
  assert.ok(low < policy.backoffBaseMs);
  assert.ok(high > policy.backoffBaseMs);
  assert.ok(purchaseStatusBackoffDelay(2, policy, 0.5) > low);
  assert.equal(
    purchaseStatusBackoffDelay(100, policy, 1),
    policy.maximumDelayMs,
  );
});

await check("preparing converges to completed and redirects exactly once", async () => {
  const scheduler = new FakeScheduler();
  const queue = [preparing(), completed()];
  const navigations = [];
  const poller = new PurchaseStatusPoller({
    fetchStatus: async () => queue.shift(),
    onStatus() {},
    onRecoveryState() {},
    onNavigate: (resultPath) => navigations.push(resultPath),
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    random: () => 0.5,
  });
  await poller.start();
  assert.equal(scheduler.tasks.size, 1);
  await scheduler.runNext();
  assert.deepEqual(navigations, [validAccountPath]);
  await poller.manualRefresh();
  assert.deepEqual(navigations, [validAccountPath]);
  assert.equal(scheduler.tasks.size, 0);
});

await check("one transient failure retries and recovers without request overlap", async () => {
  const scheduler = new FakeScheduler();
  let calls = 0;
  let activeRequests = 0;
  let maximumActiveRequests = 0;
  const navigations = [];
  const recovery = [];
  const poller = new PurchaseStatusPoller({
    async fetchStatus() {
      calls += 1;
      activeRequests += 1;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      try {
        if (calls === 1) throw new Error("TRANSIENT");
        if (calls === 2) return preparing();
        return completed();
      } finally {
        activeRequests -= 1;
      }
    },
    onStatus() {},
    onRecoveryState: (state) => recovery.push(state),
    onNavigate: (resultPath) => navigations.push(resultPath),
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    random: () => 0.5,
  });
  await poller.start();
  assert.equal(recovery.at(-1).requestFailed, true);
  await scheduler.runNext();
  await scheduler.runNext();
  assert.equal(maximumActiveRequests, 1);
  assert.equal(calls, 3);
  assert.deepEqual(navigations, [validAccountPath]);
});

await check("multiple transient failures back off then exhaust safely", async () => {
  const scheduler = new FakeScheduler();
  const recovery = [];
  let activeRequests = 0;
  let maximumActiveRequests = 0;
  const poller = new PurchaseStatusPoller({
    async fetchStatus() {
      activeRequests += 1;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      activeRequests -= 1;
      throw new Error("TRANSIENT");
    },
    onStatus() {},
    onRecoveryState: (state) => recovery.push(state),
    onNavigate() {},
    policy: {
      ...DEFAULT_PURCHASE_STATUS_POLL_POLICY,
      maximumTransientRetries: 2,
      maximumAutomaticRequests: 20,
    },
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    random: () => 0.5,
  });
  await poller.start();
  await scheduler.runNext();
  await scheduler.runNext();
  assert.deepEqual(scheduler.delays, [1_500, 3_000]);
  assert.equal(scheduler.tasks.size, 0);
  assert.equal(recovery.at(-1).requestFailed, true);
  assert.equal(recovery.at(-1).recoveryExhausted, true);
  assert.equal(maximumActiveRequests, 1);
});

await check("temporary_problem budget ends in manual recovery without Checkout", async () => {
  const scheduler = new FakeScheduler();
  const recovery = [];
  const queue = [temporaryProblem(), temporaryProblem(), temporaryProblem(), completed()];
  const navigations = [];
  const poller = new PurchaseStatusPoller({
    fetchStatus: async () => queue.shift(),
    onStatus() {},
    onRecoveryState: (state) => recovery.push(state),
    onNavigate: (resultPath) => navigations.push(resultPath),
    policy: {
      ...DEFAULT_PURCHASE_STATUS_POLL_POLICY,
      maximumTemporaryProblemRetries: 2,
      maximumAutomaticRequests: 20,
    },
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    random: () => 0.5,
  });
  await poller.start();
  await scheduler.runNext();
  await scheduler.runNext();
  assert.equal(recovery.at(-1).recoveryExhausted, true);
  assert.equal(scheduler.tasks.size, 0);
  await poller.manualRefresh();
  assert.deepEqual(navigations, [validAccountPath]);
  assert.doesNotMatch(text("lib/payment/purchase-status-poller.ts"), /checkout/iu);
});

await check("terminal states never schedule polling", async () => {
  const terminalStatuses = [
    {
      status: "payment_not_completed",
      paymentVerified: false,
      accountFallback: true,
    },
    {
      status: "confirmation_pending",
      paymentVerified: false,
      accountFallback: true,
    },
    {
      status: "confirmation_pending",
      paymentVerified: true,
      accountFallback: true,
    },
    {
      status: "completed_check_verified_email",
      paymentVerified: true,
      accountFallback: false,
    },
  ];
  for (const status of terminalStatuses) {
    const scheduler = new FakeScheduler();
    const poller = new PurchaseStatusPoller({
      fetchStatus: async () => status,
      onStatus() {},
      onRecoveryState() {},
      onNavigate() {},
      setTimer: scheduler.setTimer,
      clearTimer: scheduler.clearTimer,
    });
    await poller.start();
    assert.equal(scheduler.tasks.size, 0, status.status);
  }
  const paymentNotCompleted = getPurchaseReturnPresentation({
    status: terminalStatuses[0],
    requestFailed: false,
    recoveryExhausted: false,
    customerAuthEnabled: true,
  });
  assert.equal(paymentNotCompleted.showCheckoutRestart, true);
});

await check("component unmount aborts and suppresses every later update", async () => {
  let resolveFetch;
  const deferred = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  const scheduler = new FakeScheduler();
  const statuses = [];
  const recovery = [];
  const navigations = [];
  const poller = new PurchaseStatusPoller({
    fetchStatus: async () => deferred,
    onStatus: (status) => statuses.push(status),
    onRecoveryState: (state) => recovery.push(state),
    onNavigate: (resultPath) => navigations.push(resultPath),
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
  });
  const starting = poller.start();
  poller.stop();
  resolveFetch(preparing());
  await starting;
  assert.deepEqual(statuses, []);
  assert.deepEqual(recovery, []);
  assert.deepEqual(navigations, []);
  assert.equal(scheduler.tasks.size, 0);
});

await check("an in-flight request cannot overlap a manual refresh", async () => {
  let resolveFetch;
  let calls = 0;
  let activeRequests = 0;
  let maximumActiveRequests = 0;
  const deferred = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  const scheduler = new FakeScheduler();
  const poller = new PurchaseStatusPoller({
    async fetchStatus() {
      calls += 1;
      activeRequests += 1;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      const result = await deferred;
      activeRequests -= 1;
      return result;
    },
    onStatus() {},
    onRecoveryState() {},
    onNavigate() {},
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
  });
  const starting = poller.start();
  await poller.manualRefresh();
  assert.equal(calls, 1);
  resolveFetch(preparing());
  await starting;
  assert.equal(maximumActiveRequests, 1);
  poller.stop();
});

await check("Payment, webhook, DB0017, Async, and Netlify boundaries remain intact", () => {
  const component = text("components/payment/PurchaseReturnStatus.tsx");
  const statusRoute = text("app/api/payments/status/route.ts");
  const application = text("lib/payment/production/application.ts");
  assert.match(component, /onClick=\{\(\) => void restartCheckout\(\)\}/u);
  assert.doesNotMatch(statusRoute, /processProductionFulfillmentJobById/u);
  assert.match(application, /requestFulfillmentDispatch/u);
  assert.match(application, /successfulPaymentId !== null/u);
  assert.equal(
    git(["diff", "--name-only", base, "--", "app/api/payments/stripe/webhook/route.ts"]).trim(),
    "",
  );
  assert.equal(
    git(["merge-base", "1b8b61b32b1f284f843593777d8f0520ce13281b", "HEAD"]).trim() ===
      "1b8b61b32b1f284f843593777d8f0520ce13281b",
    false,
    "UX candidate must not be merged or cherry-picked",
  );
});

console.log(`M2-B1 RETURN / ACCOUNT CONVERGENCE: PASS (${passed}/${passed})`);
