import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createOfflineRuntime } from "./remediation-offline-runtime.mjs";

// Cumulative local regression only. No install, audit-network, migration apply
// outside disposable PG clusters, provider request, push or deployment command.
const tests = [
  "verify-f001-provider-deadline", "verify-f001-recovery-db",
  "verify-f003-payment-reconciliation", "verify-f003-payment-reconciliation-db",
  "verify-f004-result-notification", "verify-f004-notification-db",
  "verify-f005-anonymous-admission", "verify-f005-anonymous-admission-db",
  "verify-f006-global-unpaid-compute", "verify-f006-global-unpaid-compute-db", "verify-f006-global-unpaid-integration",
  "verify-f010-account-otp-throttle", "verify-f010-account-otp-throttle-db",
  "verify-f011-purchase-status-timeout", "verify-f012-browser-security",
  "verify-f013-dependencies", "verify-f015-prepayment-fail-closed",
  "verify-rc1-production-fulfillment-core", "verify-rc2-production-payment-delivery",
  "verify-rc2-resend-email-provider", "verify-m1-4-background-fulfillment-durability",
  "verify-m1-4-async-router-worker-graph", "verify-m2-b1-return-account-convergence",
  "verify-m2-c1-prepayment-compute-budget", "verify-m2-c1-lightweight-intake-fast-path",
  "verify-m1-4-clarification-contract", "verify-m2-e3-account-my-reports-result",
  "verify-m1-4-auth-entry-phase04", "verify-m1-4-purchase-eligibility-production-route",
  "verify-customer-ux-review-fix-r1", "verify-paid-quality-delivery-guarantee-r1",
  "verify-final-primary-product-function-r1", "verify-measurement-r1",
  "verify-final-pb04-schema-r1", "verify-operator-discord-notifications-r1",
  "verify-final-product-scope-r1", "verify-final-hosted-continuation-r1",
  "verify-m2-b2-i2-private-recovery-schedulers", "verify-m2-b2-i4-cutover-safety-controls",
  "verify-product-exploration-blockers-11-13-r1",
];
const requested = process.argv.slice(2);
for (const name of requested) assert.ok(tests.includes(name), `unknown offline verifier ${name}`);
const selected = requested.length ? requested : tests;
const directory = mkdtempSync(path.join(os.tmpdir(), "moon-reply-wave3-regression-"));
const results = [];
let next = 0;
async function worker() {
  while (next < selected.length) {
    const name = selected[next++];
    const offline = createOfflineRuntime();
    offline.env.NODE_ENV = "test";
    if (name === "verify-m2-b1-return-account-convergence") offline.env.M2_B1_DESCENDANT_REGRESSION = "true";
    const child = spawn(process.execPath, [`scripts/${name}.mjs`], {
      env: offline.env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => output += chunk);
    child.stderr.setEncoding("utf8").on("data", (chunk) => output += chunk);
    const timer = setTimeout(() => child.kill(), 180_000);
    const status = await new Promise((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
    clearTimeout(timer);
    offline.assertNoExternalAttempts();
    writeFileSync(path.join(directory, `${name}.log`), output);
    results.push({ name, status });
    console.log(`${status === 0 ? "PASS" : "FAIL"} ${name}`);
    if (status !== 0) console.log(output.slice(-4000));
  }
}
await Promise.all([worker(), worker(), worker()]);
writeFileSync(path.join(directory, "results.json"), JSON.stringify(results, null, 2));
console.log(`Wave3 cumulative local regression ${results.filter((r) => r.status === 0).length}/${results.length}; logs=${directory}; external attempts=0`);
assert.ok(results.every((r) => r.status === 0), "one or more cumulative regressions failed");
