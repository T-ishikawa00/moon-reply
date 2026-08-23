import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const entry = "netlify/functions/production-fulfillment-background.mts";
const sourceExtensionCandidates = ["", ".ts", ".mts", ".tsx", ".js", ".mjs"];

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function importedSpecifiers(text) {
  const specifiers = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/gu,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

function resolveLocalImport(importer, specifier) {
  if (!specifier.startsWith(".")) return null;
  const unresolved = path.resolve(root, path.dirname(importer), specifier);
  for (const extension of sourceExtensionCandidates) {
    const candidate = `${unresolved}${extension}`;
    if (existsSync(candidate)) {
      return path.relative(root, candidate).replaceAll("\\", "/");
    }
  }
  throw new Error(`unresolved local import: ${importer} -> ${specifier}`);
}

const pending = [entry];
const visited = new Set();
const bareServerOnlyEdges = [];
const edges = [];

while (pending.length > 0) {
  const relativePath = pending.pop();
  if (visited.has(relativePath)) continue;
  visited.add(relativePath);
  const text = source(relativePath);
  for (const specifier of importedSpecifiers(text)) {
    if (specifier === "server-only") {
      bareServerOnlyEdges.push(`${relativePath} -> ${specifier}`);
    }
    const resolved = resolveLocalImport(relativePath, specifier);
    if (!resolved) continue;
    edges.push(`${relativePath} -> ${resolved}`);
    pending.push(resolved);
  }
}

assert.deepEqual(bareServerOnlyEdges, [], bareServerOnlyEdges.join("\n"));

for (const forbidden of [
  "lib/payment/production/service.ts",
  "lib/assessment/production/service.ts",
  "lib/payment/production/async-workloads.ts",
  "lib/measurement/server.ts",
]) {
  assert.equal(visited.has(forbidden), false, `worker reaches ${forbidden}`);
}

for (const required of [
  "lib/payment/production/worker-service.ts",
  "lib/payment/production/fulfillment-runtime.ts",
  "lib/payment/production/environment-runtime.ts",
  "lib/payment/production/supabase-repository.ts",
  "lib/payment/production/resend-transactional-email-runtime.ts",
  "lib/payment/production/result-notification.ts",
  "lib/assessment/production/worker-service.ts",
  "lib/assessment/production/application-runtime.ts",
  "lib/assessment/production/environment-runtime.ts",
  "lib/assessment/production/supabase-repository.ts",
  "lib/assessment/production/notification.ts",
  "lib/assessment/runtime/openai-transport.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/supabase-repository.ts",
]) {
  assert.equal(visited.has(required), true, `worker does not reach ${required}`);
}

assert.match(source("lib/payment/production/service.ts"), /^import "server-only";/u);
assert.match(source("lib/assessment/production/service.ts"), /^import "server-only";/u);
assert.match(source("lib/payment/production/environment.ts"), /^import "server-only";/u);
assert.match(source("lib/assessment/production/environment.ts"), /^import "server-only";/u);
assert.match(
  source("lib/payment/production/resend-transactional-email.ts"),
  /^import "server-only";/u,
);

assert.doesNotMatch(
  source("lib/payment/production/application.ts"),
  /measurement\/server\.ts/u,
);
assert.match(
  source("lib/payment/production/service.ts"),
  /trackVerifiedPaymentPurchase/u,
);
assert.match(
  source("lib/payment/production/service.ts"),
  /onVerifiedPaymentRecorded: trackVerifiedPaymentPurchase/u,
);
assert.match(
  source("lib/payment/production/application.ts"),
  /this\.options\.onVerifiedPaymentRecorded\?\.\(recorded\)/u,
);
assert.match(
  source(entry),
  /from "\.\.\/\.\.\/lib\/payment\/production\/worker-service\.ts"/u,
);
assert.doesNotMatch(source(entry), /production\/service\.ts/u);

for (const relativePath of visited) {
  assert.doesNotMatch(source(relativePath), /^["']use client["'];/mu, relativePath);
}

for (const browserRoot of ["app", "components"]) {
  const browserEntry = path.join(root, browserRoot);
  const stack = [browserEntry];
  while (stack.length > 0) {
    const absolutePath = stack.pop();
    const entries = readdirSync(absolutePath, { withFileTypes: true });
    for (const item of entries) {
      const child = path.join(absolutePath, item.name);
      if (item.isDirectory()) {
        stack.push(child);
        continue;
      }
      if (!/\.[cm]?[jt]sx?$/u.test(item.name)) continue;
      const text = readFileSync(child, "utf8");
      assert.doesNotMatch(
        text,
        /(?:worker-service|environment-runtime|fulfillment-runtime|resend-transactional-email-runtime|production\/supabase-repository|runtime\/openai-transport|runtime\/supabase-repository)/u,
        path.relative(root, child),
      );
    }
  }
}

console.log(
  `M1-4 ASYNC ROUTER WORKER GRAPH PASS modules=${visited.size} edges=${edges.length} server_only=0`,
);
console.log("REAL_PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 ASYNC_EVENTS_SENT=0");
