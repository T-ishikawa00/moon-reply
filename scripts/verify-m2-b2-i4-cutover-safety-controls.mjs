import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";
import { zipFunctions } from "@netlify/zip-it-and-ship-it";
import toml from "toml";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { runConfiguredProductionFulfillmentDispatchSchedule } from "../lib/payment/production/dispatch-scheduler-runtime-service.ts";
import { runConfiguredProductionPaymentReconciliationSchedule } from "../lib/payment/production/reconciliation-scheduler-runtime-service.ts";
import {
  runProductionFulfillmentDispatchSchedule,
  runProductionPaymentReconciliationSchedule,
} from "../lib/payment/production/recovery-schedulers.ts";

const root = process.cwd();
const ingressRoot = path.join(root, "services", "stripe-webhook-ingress");
const artifactRoot = path.join(root, ".netlify", "m2-b2-i4-ingress-artifact");
const ingressDistRoot = path.join(ingressRoot, "dist");
const ingressDistBackup = path.join(artifactRoot, "dist-before-i4-proof");
const baseAuthority = "680398b243f69f80cab6392cc6155ed0be789120";
const dispatchFlag = "PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED";
const reconciliationFlag = "STRIPE_RECONCILIATION_SCHEDULED_ENABLED";
const controlledEnvironmentNames = [
  dispatchFlag,
  "PAYMENT_FULFILLMENT_PROCESSING_ENABLED",
  "PAYMENT_FULFILLMENT_EMERGENCY_STOP",
  reconciliationFlag,
  "STRIPE_RECONCILIATION_ENABLED",
  "PAYMENT_EMERGENCY_STOP",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "PAYMENT_PROVIDER_ENVIRONMENT",
  "STRIPE_PAYPAY_ENABLED",
  "AWL_API_KEY",
  "AWL_API_KEY_P100",
];
let passed = 0;

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${name}`);
}

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

async function withEnvironment(values, proof) {
  const before = new Map(
    controlledEnvironmentNames.map((name) => [
      name,
      Object.hasOwn(process.env, name) ? process.env[name] : undefined,
    ]),
  );
  try {
    for (const name of controlledEnvironmentNames) delete process.env[name];
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    return await proof();
  } finally {
    for (const [name, value] of before) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

async function expectUnavailable(run, code) {
  await assert.rejects(
    run,
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === code &&
      error.httpStatus === 503,
  );
}

function filesBelow(absolutePath) {
  const result = [];
  const pending = [absolutePath];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const item of readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, item.name);
      if (item.isDirectory()) pending.push(child);
      else result.push(child);
    }
  }
  return result;
}

function extractZipArchive(archive, destinationRoot) {
  const bytes = readFileSync(archive);
  let end = -1;
  for (
    let index = bytes.length - 22;
    index >= Math.max(0, bytes.length - 65_557);
    index -= 1
  ) {
    if (bytes.readUInt32LE(index) === 0x06054b50) {
      end = index;
      break;
    }
  }
  assert.notEqual(end, -1, "ZIP end record missing");
  const entries = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  const allowedRoot = `${path.resolve(destinationRoot)}${path.sep}`;
  for (let index = 0; index < entries; index += 1) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50);
    const method = bytes.readUInt16LE(cursor + 10);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const uncompressedSize = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const name = bytes
      .subarray(cursor + 46, cursor + 46 + nameLength)
      .toString("utf8");
    const destination = path.resolve(destinationRoot, name);
    assert.equal(
      destination === path.resolve(destinationRoot) ||
        destination.startsWith(allowedRoot),
      true,
      `ZIP entry escaped artifact root: ${name}`,
    );
    if (name.endsWith("/")) {
      mkdirSync(destination, { recursive: true });
    } else {
      assert.equal(bytes.readUInt32LE(localOffset), 0x04034b50);
      const localNameLength = bytes.readUInt16LE(localOffset + 26);
      const localExtraLength = bytes.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
      const content =
        method === 0
          ? compressed
          : method === 8
            ? inflateRawSync(compressed)
            : null;
      assert.ok(content, `unsupported ZIP compression method: ${method}`);
      assert.equal(content.length, uncompressedSize, `ZIP size mismatch: ${name}`);
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, content);
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
}

await check("dedicated flags are exact-true and default false", async () => {
  const example = text(".env.example");
  for (const flag of [dispatchFlag, reconciliationFlag]) {
    assert.equal(
      example.match(new RegExp(`^${flag}=false$`, "gmu"))?.length,
      1,
      flag,
    );
  }
  const environment = text("lib/payment/production/environment-runtime.ts");
  assert.match(environment, /process\.env\[name\] === "true"/u);
  assert.match(environment, new RegExp(`enabled\\("${dispatchFlag}"\\)`, "u"));
  assert.match(
    environment,
    new RegExp(`enabled\\("${reconciliationFlag}"\\)`, "u"),
  );
  const purchaseActivation = text("lib/payment/production/activation-policy.ts");
  assert.doesNotMatch(purchaseActivation, new RegExp(dispatchFlag, "u"));
  assert.doesNotMatch(purchaseActivation, new RegExp(reconciliationFlag, "u"));
});

await check("disabled schedules stop before credentials and external work", async () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("I4_EXTERNAL_FETCH_FORBIDDEN");
  };
  try {
    for (const value of [undefined, "", "false", "TRUE", "1", " true ", "yes"]) {
      const dispatch = await withEnvironment(
        {
          [dispatchFlag]: value,
          PAYMENT_FULFILLMENT_PROCESSING_ENABLED: "true",
          PAYMENT_FULFILLMENT_EMERGENCY_STOP: "false",
        },
        () => runConfiguredProductionFulfillmentDispatchSchedule(),
      );
      assert.deepEqual(dispatch, { disabled: true });
      const reconciliation = await withEnvironment(
        {
          [reconciliationFlag]: value,
          STRIPE_RECONCILIATION_ENABLED: "true",
          PAYMENT_EMERGENCY_STOP: "false",
        },
        () => runConfiguredProductionPaymentReconciliationSchedule(),
      );
      assert.deepEqual(reconciliation, { disabled: true });
    }
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await check("dedicated flags remain subordinate to broad authority", async () => {
  await withEnvironment(
    {
      [dispatchFlag]: "true",
      PAYMENT_FULFILLMENT_PROCESSING_ENABLED: "false",
      PAYMENT_FULFILLMENT_EMERGENCY_STOP: "false",
    },
    () =>
      expectUnavailable(
        runConfiguredProductionFulfillmentDispatchSchedule,
        "PAYMENT_FULFILLMENT_UNAVAILABLE",
      ),
  );
  await withEnvironment(
    {
      [dispatchFlag]: "true",
      PAYMENT_FULFILLMENT_PROCESSING_ENABLED: "true",
      PAYMENT_FULFILLMENT_EMERGENCY_STOP: "true",
    },
    () =>
      expectUnavailable(
        runConfiguredProductionFulfillmentDispatchSchedule,
        "PAYMENT_FULFILLMENT_UNAVAILABLE",
      ),
  );
  await withEnvironment(
    {
      [reconciliationFlag]: "true",
      STRIPE_RECONCILIATION_ENABLED: "false",
      PAYMENT_EMERGENCY_STOP: "false",
    },
    () =>
      expectUnavailable(
        runConfiguredProductionPaymentReconciliationSchedule,
        "PAYMENT_RECONCILIATION_UNAVAILABLE",
      ),
  );
  await withEnvironment(
    {
      [reconciliationFlag]: "true",
      STRIPE_RECONCILIATION_ENABLED: "true",
      PAYMENT_EMERGENCY_STOP: "true",
    },
    () =>
      expectUnavailable(
        runConfiguredProductionPaymentReconciliationSchedule,
        "PAYMENT_RECONCILIATION_UNAVAILABLE",
      ),
  );
});

await check("exact-true configured schedules reach the credential boundary", async () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("I4_EXTERNAL_FETCH_FORBIDDEN");
  };
  try {
    await withEnvironment(
      {
        [dispatchFlag]: "true",
        PAYMENT_FULFILLMENT_PROCESSING_ENABLED: "true",
        PAYMENT_FULFILLMENT_EMERGENCY_STOP: "false",
      },
      () =>
        expectUnavailable(
          runConfiguredProductionFulfillmentDispatchSchedule,
          "PAYMENT_CONFIGURATION_INVALID",
        ),
    );
    await withEnvironment(
      {
        [reconciliationFlag]: "true",
        STRIPE_RECONCILIATION_ENABLED: "true",
        PAYMENT_EMERGENCY_STOP: "false",
      },
      () =>
        expectUnavailable(
          runConfiguredProductionPaymentReconciliationSchedule,
          "PAYMENT_CONFIGURATION_INVALID",
        ),
    );
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await check("enabled core scheduler behavior remains bounded", async () => {
  const dispatched = [];
  const dispatch = await runProductionFulfillmentDispatchSchedule({
    repository: {
      async listDueFulfillmentDispatchJobIds({ limit }) {
        assert.equal(limit, 4);
        return ["job-1"];
      },
    },
    async dispatchJob(jobId) {
      dispatched.push(jobId);
      return "accepted";
    },
  });
  assert.deepEqual(dispatched, ["job-1"]);
  assert.equal(dispatch.accepted, 1);

  const finishes = [];
  const reconciliation = await runProductionPaymentReconciliationSchedule({
    repository: {
      async claimPaymentReconciliationBatch(input) {
        assert.equal(input.limit, 4);
        assert.equal(input.maximumAttempts, 5);
        return [{
          paymentAttemptId: "81000000-0000-4000-8000-000000000001",
          providerCheckoutSessionId: "cs_test_i4",
          attemptCount: 1,
        }];
      },
      async finishPaymentReconciliation(input) {
        finishes.push(input);
      },
    },
    async reconcileAttempt() {
      return {
        disposition: "verified",
        purchaseIntentId: null,
        verifiedPaymentId: null,
        fulfillmentJobId: null,
      };
    },
    uuid: () => "82000000-0000-4000-8000-000000000001",
    now: () => "2026-08-24T12:00:00.000Z",
  });
  assert.equal(reconciliation.stripeReads, 1);
  assert.equal(finishes.length, 1);
  assert.equal(finishes[0].outcome, "settled");
});

await check("gate order and schedule artifacts remain exact", async () => {
  const dispatch = text(
    "lib/payment/production/dispatch-scheduler-runtime-service.ts",
  );
  const reconciliation = text(
    "lib/payment/production/reconciliation-scheduler-runtime-service.ts",
  );
  assert.ok(
    dispatch.indexOf("isProductionFulfillmentDispatchScheduleEnabled()") <
      dispatch.indexOf("isPaidFulfillmentProcessingAvailable()"),
  );
  assert.ok(
    dispatch.indexOf("isPaidFulfillmentProcessingAvailable()") <
      dispatch.indexOf("readProductionSchedulerDatabaseEnvironment()"),
  );
  assert.ok(
    reconciliation.indexOf("isProductionPaymentReconciliationScheduleEnabled()") <
      reconciliation.indexOf("isStripeReconciliationAvailable()"),
  );
  assert.ok(
    reconciliation.indexOf("isStripeReconciliationAvailable()") <
      reconciliation.indexOf("readProductionSchedulerDatabaseEnvironment()"),
  );
  assert.ok(
    reconciliation.indexOf("readProductionSchedulerDatabaseEnvironment()") <
      reconciliation.indexOf("readStripeCheckoutEnvironment()"),
  );
  const config = toml.parse(text("netlify.toml"));
  assert.equal(
    config.functions["production-fulfillment-dispatch-scheduled"].schedule,
    "* * * * *",
  );
  assert.equal(
    config.functions["production-payment-reconciliation-scheduled"].schedule,
    "*/5 * * * *",
  );
  assert.deepEqual(
    config.functions["production-fulfillment-background"].included_files,
    ["ai/prompts/**", "ai/schemas/**", "lib/assessment/runtime/contracts/**"],
  );
});

await check("migration inventory and accepted identities remain exact", async () => {
  const migrationRoot = path.join(root, "supabase", "migrations");
  const expectedMigrations = [
    "0002_m2_p3_runtime_vertical_slice.sql",
    "0003_m2_p3_atomic_finalization.sql",
    "0004_m2_p4_candidate_source_isolation.sql",
    "0005_m2_p4_directional_guidance_runtime.sql",
    "0006_m2_p4_jpy980_clarification_lifecycle.sql",
    "0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
    "0008_m2_p4_jpy980_semantic_quality_runtime_identity.sql",
    "0009_m2_p4_jpy980_quality_reassessment.sql",
    "0010_rc1_production_fulfillment_core.sql",
    "0011_rc2_production_payment_delivery.sql",
    "0012_rc2_activation_database_hardening.sql",
    "0013_rc2_service_role_acl_hardening.sql",
    "0014_customer_identity_authority_v1.sql",
    "0015_m1_4_skipped_stage_constraint_alignment.sql",
    "0016_m1_4_background_fulfillment_durability.sql",
    "0017_m2_a1_null_fence_integrity.sql",
    "0018_m2_b2_webhook_ingress_authority.sql",
    "0019_m2_b2_private_payment_reconciliation.sql",
  ];
  assert.deepEqual(
    readdirSync(migrationRoot).filter((name) => name.endsWith(".sql")).sort(),
    expectedMigrations,
  );
  execFileSync(
    "git.exe",
    ["diff", "--quiet", baseAuthority, "--", "supabase/migrations"],
    { cwd: root },
  );
  assert.equal(
    execFileSync(
      "git.exe",
      [
        "ls-files",
        "--others",
        "--exclude-standard",
        "--",
        "supabase/migrations",
      ],
      { cwd: root, encoding: "utf8" },
    ).trim(),
    "",
  );
  for (const [file, expected] of [
    [
      "supabase/migrations/0017_m2_a1_null_fence_integrity.sql",
      "b5c2534dbc8bdb97e6fa77612143b8bf9ec78c2955908ceab3d360bab30f9380",
    ],
    [
      "supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql",
      "1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010",
    ],
    [
      "supabase/migrations/0019_m2_b2_private_payment_reconciliation.sql",
      "b4e5ef6b06ef6e70c0904e7b1692c2863861c73738454d499ac3b730a082456c",
    ],
  ]) {
    const blob = execFileSync(
      "git.exe",
      ["cat-file", "blob", `HEAD:${file}`],
      { cwd: root },
    );
    assert.equal(
      createHash("sha256").update(blob).digest("hex"),
      expected,
      file,
    );
    execFileSync("git.exe", ["diff", "--quiet", "HEAD", "--", file], {
      cwd: root,
    });
  }
});

await check("ingress Node 22 source pin and package contract are exact", async () => {
  assert.match(
    readFileSync(path.join(ingressRoot, ".node-version"), "utf8"),
    /^22\r?\n$/u,
  );
  assert.equal(existsSync(path.join(ingressRoot, ".nvmrc")), false);
  const packageJson = JSON.parse(
    readFileSync(path.join(ingressRoot, "package.json"), "utf8"),
  );
  assert.equal(packageJson.dependencies.postgres, "3.4.9");
  assert.equal(packageJson.dependencies.stripe, "22.5.0");
  const config = toml.parse(
    readFileSync(path.join(ingressRoot, "netlify.toml"), "utf8"),
  );
  assert.equal(config.build.command, "npm run build");
  assert.equal(config.build.publish, "dist/public");
  assert.equal(config.build.functions, "dist/functions");
  const build = readFileSync(
    path.join(ingressRoot, "scripts", "build.mjs"),
    "utf8",
  );
  assert.match(build, /target: "node22"/u);
  assert.match(build, /packages: "external"/u);
});

await check("actual ingress package imports with exact dependencies", async () => {
  assert.equal(existsSync(artifactRoot), false, "refusing to overwrite artifact proof");
  const hadExistingDist = existsSync(ingressDistRoot);
  try {
    mkdirSync(artifactRoot, { recursive: true });
    if (hadExistingDist) renameSync(ingressDistRoot, ingressDistBackup);
    const buildScript = path.join(ingressRoot, "scripts", "build.mjs");
    await import(`${pathToFileURL(buildScript).href}?i4=${Date.now()}`);
    const publicFiles = filesBelow(path.join(ingressRoot, "dist", "public"));
    assert.deepEqual(publicFiles, []);
    const builtFunction = path.join(
      ingressRoot,
      "dist",
      "functions",
      "stripe-webhook.mjs",
    );
    const builtSource = readFileSync(builtFunction, "utf8");
    assert.match(builtSource, /\/api\/payments\/stripe\/webhook/u);
    for (const forbidden of [
      "STRIPE_SECRET_KEY",
      "SUPABASE_SECRET_KEY",
      "OPENAI_API_KEY",
      "EMAIL_API_KEY",
      "AWL_API_KEY",
      "CUSTOMER_AUTH_ENABLED",
      "production-fulfillment",
      "/account",
      "/review",
    ]) {
      assert.equal(builtSource.includes(forbidden), false, forbidden);
    }

    const packaged = await zipFunctions(
      { user: { functions: [builtFunction] } },
      artifactRoot,
      {
        archiveFormat: "zip",
        basePath: ingressRoot,
        parallelLimit: 1,
        repositoryRoot: root,
      },
    );
    assert.equal(packaged.length, 1);
    const archive = path.join(artifactRoot, "stripe-webhook.zip");
    assert.equal(existsSync(archive), true);
    const extracted = path.join(artifactRoot, "extracted");
    mkdirSync(extracted, { recursive: true });
    extractZipArchive(archive, extracted);
    const extractedFiles = filesBelow(extracted);
    const entryMatches = extractedFiles.filter(
      (file) => path.basename(file) === "stripe-webhook.mjs",
    );
    assert.equal(entryMatches.length, 1);
    for (const [name, version] of [
      ["postgres", "3.4.9"],
      ["stripe", "22.5.0"],
    ]) {
      const packageMatches = extractedFiles.filter((file) =>
        file
          .replaceAll("\\", "/")
          .endsWith(`/node_modules/${name}/package.json`),
      );
      assert.equal(packageMatches.length, 1, `${name} packaged`);
      assert.equal(
        JSON.parse(readFileSync(packageMatches[0], "utf8")).version,
        version,
      );
    }
    let fetchCalls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      fetchCalls += 1;
      throw new Error("I4_INGRESS_IMPORT_FETCH_FORBIDDEN");
    };
    try {
      const loaded = await import(
        `${pathToFileURL(entryMatches[0]).href}?i4-artifact=${Date.now()}`
      );
      assert.equal(typeof loaded.default, "function");
      assert.equal(fetchCalls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    rmSync(ingressDistRoot, { recursive: true, force: true });
    if (hadExistingDist && existsSync(ingressDistBackup)) {
      renameSync(ingressDistBackup, ingressDistRoot);
    }
    rmSync(artifactRoot, { recursive: true, force: true });
  }
});

console.log(`M2-B2-I4 CUTOVER SAFETY CONTROLS PASS ${passed}/${passed}`);
console.log(
  "SUPABASE_CLIENTS=0 STRIPE_READS=0 ASYNC_EVENTS=0 PROVIDER_CALLS=0 EMAILS=0 REMOTE_WRITES=0",
);
