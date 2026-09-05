import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { buildOffline, createOfflineRuntime } from "./remediation-offline-runtime.mjs";

if (process.argv.includes("--build")) await buildOffline();
const offline = createOfflineRuntime();
const port = await new Promise((resolve, reject) => {
  const listener = net.createServer(); listener.once("error", reject);
  listener.listen(0, "127.0.0.1", () => {
    const value = listener.address().port;
    listener.close((error) => error ? reject(error) : resolve(value));
  });
});
const origin = `http://127.0.0.1:${port}`;
// NEXT_PUBLIC_APP_URL is compiled into the build. Requests use that canonical
// Origin header while transport remains the random-port loopback server.
const canonicalOrigin = offline.env.NEXT_PUBLIC_APP_URL;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: offline.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
});
let serverOutput = "";
server.stdout.on("data", (chunk) => serverOutput += chunk);
server.stderr.on("data", (chunk) => serverOutput += chunk);
let passed = 0;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(server.exitCode, null, "local Next server exited before readiness");
    try {
      if ((await fetch(origin, { redirect: "manual", signal: AbortSignal.timeout(1_000) })).status === 200) { ready = true; break; }
    } catch { /* only the isolated loopback server is polled */ }
    await delay(100);
  }
  assert.ok(ready, "isolated Next server must become ready");
  const routes = [
    ["/", 200], ["/login", 200], ["/request", 200], ["/account", 200],
    // The disabled Account result renders its scoped error boundary in a 200
    // streamed response; this is header evidence, not an owned-result success.
    ["/result/invalid", 404], ["/account/results/invalid", 200],
    ["/review", 200], ["/review/account", 200], ["/review/result/result-normal-001", 200],
    ["/purchase/auth/continue", 307], ["/purchase/return/invalid", 200],
    ["/api/auth/account/google/start", 404, "POST"],
    ["/api/auth/google/start", 404, "POST"],
    ["/api/payments/checkout", 400, "POST"],
  ];
  const manifest = JSON.parse(readFileSync(".next/routes-manifest.json", "utf8"));
  const globalRule = manifest.headers.find((rule) => rule.source === "/:path*");
  assert.ok(globalRule, "built artifact must contain the global header rule");
  const expected = Object.fromEntries(globalRule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(expected["x-frame-options"], "DENY");
  assert.equal(expected["content-security-policy"], "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  assert.equal(expected["x-content-type-options"], "nosniff");
  for (const [pathname, status, method = "GET"] of routes) {
    const response = await fetch(`${origin}${pathname}`, { method, redirect: "manual", signal: AbortSignal.timeout(10_000),
      ...(method === "POST" ? { headers: { origin: canonicalOrigin, "content-type": "application/json", "sec-fetch-site": "same-origin" }, body: "{}" } : {}),
    });
    assert.equal(response.status, status, `${pathname}: bounded disabled/synthetic response`);
    for (const key of ["content-security-policy", "content-security-policy-report-only", "x-frame-options", "x-content-type-options", "permissions-policy"]) {
      assert.equal(response.headers.get(key), expected[key], `${pathname}: ${key}`);
    }
    if (pathname.startsWith("/account") || pathname.startsWith("/result/")) {
      assert.equal(response.headers.get("referrer-policy"), "no-referrer", pathname);
      assert.match(response.headers.get("cache-control"), /private.*no-store/, pathname);
      assert.match(response.headers.get("x-robots-tag"), /noindex.*nofollow.*noarchive/, pathname);
      // Next composes the App Router Vary value after config headers. The
      // source verifier separately requires the existing Cookie rule unchanged.
      if (pathname.startsWith("/account")) assert.deepEqual(
        response.headers.get("vary").toLowerCase().split(/,\s*/u).sort(),
        ["rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch", "accept-encoding"].sort(), pathname,
      );
    } else if (!pathname.startsWith("/api/")) {
      assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin", pathname);
    }
    assert.equal(response.headers.get("strict-transport-security"), null, "HSTS remains hosting-owned");
    await response.arrayBuffer();
    console.log(`PASS F012 built ${++passed} ${pathname} (${response.status})`);
  }
  offline.assertNoExternalAttempts();
  assert.doesNotMatch(serverOutput, /OFFLINE_VERIFICATION_EXTERNAL_NETWORK_BLOCKED/);
  console.log(`F012 built headers: ${passed}/${routes.length} PASS; Auth/Stripe/GA4/external calls=0`);
} finally {
  if (server.exitCode === null) {
    const ended = new Promise((resolve) => server.once("exit", resolve));
    server.kill(); await ended;
  }
  offline.assertNoExternalAttempts();
}
