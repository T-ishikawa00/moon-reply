import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  FINAL_PRODUCT_RECOVERY_CATALOG_CACHE_IDENTITY,
  finalProductRecoveryCatalogCacheKey,
  loadM2P4FinalProductRecoveryRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";
import { ImmutableRuntimeCache } from "../lib/assessment/runtime/immutable-runtime-cache.ts";

const root = process.cwd();
const expectedCatalogSha256 =
  "a8c84656f337fc1e98b8e055fb90d4b6d2cb1cf9189da1b5083af23d41db6527";
let checks = 0;

async function check(name, run) {
  await run();
  checks += 1;
  console.log(`[PASS] ${name}`);
}

function sha256Json(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertDeepFrozen(value) {
  if (typeof value !== "object" || value === null) return;
  assert.equal(Object.isFrozen(value), true);
  for (const nested of Object.values(value)) assertDeepFrozen(nested);
}

const diagnostics = [];
const timings = [];
const catalogs = [];
for (let index = 0; index < 3; index += 1) {
  const startedAt = performance.now();
  catalogs.push(
    await loadM2P4FinalProductRecoveryRuntimeStageCatalog({
      observe: (diagnostic) => diagnostics.push(diagnostic),
    }),
  );
  timings.push(Math.max(0, performance.now() - startedAt));
}

await check("cold initialization preserves the exact authority catalog", () => {
  assert.equal(sha256Json(catalogs[0]), expectedCatalogSha256);
  assert.deepEqual(
    [
      catalogs[0].catalogVersion,
      catalogs[0].promptBundleVersion,
      catalogs[0].schemaSetVersion,
      catalogs[0].stageTopologyVersion,
    ],
    [
      "runtime-stage-catalog-v17.0.0",
      "prompt-bundle-runtime-v17.0.0",
      "pipeline-schema-runtime-v6.0.0",
      "split-base-candidate-v1",
    ],
  );
  assert.deepEqual(
    catalogs[0].definitions.map((definition) => definition.stageId),
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  );
  assertDeepFrozen(catalogs[0]);
});

await check("warm initialization reuses one immutable catalog", () => {
  assert.strictEqual(catalogs[1], catalogs[0]);
  assert.strictEqual(catalogs[2], catalogs[0]);
  assert.deepEqual(
    diagnostics.map((diagnostic) => diagnostic.classification),
    [
      "CATALOG_INIT_START",
      "CATALOG_INIT_DONE",
      "CATALOG_CACHE_HIT",
      "CATALOG_CACHE_HIT",
    ],
  );
  assert.equal(
    diagnostics.every(
      (diagnostic) =>
        diagnostic.cacheKey === finalProductRecoveryCatalogCacheKey(),
    ),
    true,
  );
});

await check("version keys cannot reuse a different catalog entry", async () => {
  const cache = new ImmutableRuntimeCache();
  let initializations = 0;
  const authorityKey =
    "catalog-v17|prompt-v17|schema-v6|topology-v1|baseline-a";
  const changedAuthorityKeys = [
    "catalog-v18|prompt-v17|schema-v6|topology-v1|baseline-a",
    "catalog-v17|prompt-v18|schema-v6|topology-v1|baseline-a",
    "catalog-v17|prompt-v17|schema-v7|topology-v1|baseline-a",
    "catalog-v17|prompt-v17|schema-v6|topology-v2|baseline-a",
    "catalog-v17|prompt-v17|schema-v6|topology-v1|baseline-b",
  ];
  const first = cache.getOrInitialize(authorityKey, async () => {
    initializations += 1;
    return { version: "v17" };
  });
  const warm = cache.getOrInitialize(authorityKey, async () => {
    initializations += 1;
    return { version: "wrong" };
  });
  const changed = changedAuthorityKeys.map((cacheKey) =>
    cache.getOrInitialize(cacheKey, async () => {
      initializations += 1;
      return { cacheKey };
    }),
  );
  assert.equal(first.cacheHit, false);
  assert.equal(warm.cacheHit, false);
  assert.equal(changed.every((lookup) => lookup.cacheHit === false), true);
  assert.deepEqual(
    [first.cacheState, warm.cacheState, ...changed.map((lookup) => lookup.cacheState)],
    ["miss", "pending", ...changed.map(() => "miss")],
  );
  const firstValue = await first.value;
  assert.strictEqual(await warm.value, firstValue);
  for (const lookup of changed) {
    assert.notStrictEqual(await lookup.value, firstValue);
  }
  const ready = cache.getOrInitialize(
    authorityKey,
    async () => ({ version: "wrong" }),
  );
  assert.equal(ready.cacheHit, true);
  assert.equal(ready.cacheState, "ready");
  assert.strictEqual(await ready.value, firstValue);
  assert.equal(initializations, 1 + changedAuthorityKeys.length);
});

await check("failed initialization is fail-closed and does not poison retry", async () => {
  const cache = new ImmutableRuntimeCache();
  let attempts = 0;
  const failed = cache.getOrInitialize("catalog-v17", async () => {
    attempts += 1;
    throw new Error("synthetic initialization failure");
  });
  await assert.rejects(failed.value, /synthetic initialization failure/u);
  const retry = cache.getOrInitialize("catalog-v17", async () => {
    attempts += 1;
    return { valid: true };
  });
  assert.equal(retry.cacheHit, false);
  assert.deepEqual(await retry.value, { valid: true });
  assert.equal(attempts, 2);
});

await check("concurrent initialization is single-flight", async () => {
  const cache = new ImmutableRuntimeCache();
  let initializations = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const initialize = async () => {
    initializations += 1;
    await gate;
    return { valid: true };
  };
  const first = cache.getOrInitialize("catalog-v17", initialize);
  const second = cache.getOrInitialize("catalog-v17", initialize);
  const third = cache.getOrInitialize("catalog-v17", initialize);
  assert.deepEqual(
    [first.cacheState, second.cacheState, third.cacheState],
    ["miss", "pending", "pending"],
  );
  release();
  const values = await Promise.all([first.value, second.value, third.value]);
  assert.strictEqual(values[0], values[1]);
  assert.strictEqual(values[1], values[2]);
  assert.equal(initializations, 1);
});

await check("production cache contains runtime metadata only", () => {
  assert.match(
    FINAL_PRODUCT_RECOVERY_CATALOG_CACHE_IDENTITY,
    /runtime-stage-catalog-v17\.0\.0\|prompt-bundle-runtime-v17\.0\.0\|pipeline-schema-runtime-v6\.0\.0\|split-base-candidate-v1\|baseline-[0-9a-f]{40}/u,
  );
  assert.equal(
    finalProductRecoveryCatalogCacheKey(),
    FINAL_PRODUCT_RECOVERY_CATALOG_CACHE_IDENTITY,
  );
  const catalogSource = readFileSync(
    path.join(root, "lib/assessment/runtime/schema-catalog.ts"),
    "utf8",
  );
  const cacheIdentitySource = catalogSource.slice(
    catalogSource.indexOf(
      "export const FINAL_PRODUCT_RECOVERY_CATALOG_CACHE_IDENTITY",
    ),
    catalogSource.indexOf(
      "type FinalProductRecoveryRuntimeStageCatalog",
    ),
  );
  assert.doesNotMatch(
    cacheIdentitySource,
    /process\.cwd|path\.resolve|repositoryRoot|root-/u,
  );
  assert.match(
    catalogSource,
    /finalProductRecoveryCatalogCache\.getOrInitialize\([\s\S]*?initializeM2P4FinalProductRecoveryRuntimeStageCatalog\(\)/u,
  );
  assert.doesNotMatch(
    catalogSource.slice(catalogSource.indexOf("const finalProductRecoveryCatalogCache")),
    /consultation|customerId|email|session|capability|purchase|assessmentBody|providerOutput/u,
  );
});

await check("safe hosted timing classifications are wired", () => {
  const applicationSource = readFileSync(
    path.join(root, "lib/assessment/production/application-runtime.ts"),
    "utf8",
  );
  const routeSource = readFileSync(
    path.join(root, "app/api/consultations/prepare/route.ts"),
    "utf8",
  );
  for (const classification of [
    "APPLICATION_RUNTIME_INIT_START",
    "APPLICATION_RUNTIME_INIT_DONE",
    "CATALOG_INIT_START",
    "CATALOG_INIT_DONE",
    "CATALOG_CACHE_HIT",
    "PREPARATION_RUN_START",
    "PREPARATION_RUN_DONE",
  ]) {
    assert.equal(
      applicationSource.includes(classification) || routeSource.includes(classification),
      true,
      classification,
    );
  }
  assert.match(routeSource, /correlationId,[\s\S]*?attempt,[\s\S]*?observe: logPreparationRuntime/u);
  assert.match(routeSource, /console\.info\("M2_PREPARATION_RUNTIME_SERVER", diagnostic\)/u);
});

console.log(
  `Preparation latency optimization verifier: PASS ${checks}/${checks}; ` +
    `timings_ms=${timings.map((value) => value.toFixed(3)).join(",")}`,
);
