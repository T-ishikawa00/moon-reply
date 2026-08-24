import assert from "node:assert/strict";
import { createHash, createHmac, X509Certificate } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { checkServerIdentity, rootCertificates } from "node:tls";
import { buildVerifiedIngressDatabaseConfiguration } from "../services/stripe-webhook-ingress/src/database.ts";
import {
  createStripeWebhookIngressHandler,
  ingressSecretAllowlist,
  maximumWebhookBytes,
  stripeWebhookPath,
} from "../services/stripe-webhook-ingress/src/stripe-webhook.ts";

const root = process.cwd();
const authority = "7b850ff9b2c2188691605797983202416ddc5d88";
const expectedBranch = "task/m2-b2-i1-public-ingress-authority-r1";
const reviewedHead = "f0376ac87e3fb7b11ab525b958142d1fd7ba488b";
const descendantRegression =
  process.env.M2_B2_I1_DESCENDANT_REGRESSION === "true";
const secret = "whsec_m2_b2_i1_synthetic_only";
let passed = 0;

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function gitRaw(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${name}`);
}

function signed(payload, timestamp = Math.floor(Date.now() / 1000)) {
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

function eventPayload(overrides = {}) {
  const purchaseReference = "50000000-0000-4000-8000-000000000002";
  return JSON.stringify({
    id: "evt_m2_b2_i1_valid",
    object: "event",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: {
        id: "cs_test_m2_b2_i1_valid",
        object: "checkout.session",
        livemode: false,
        client_reference_id: purchaseReference,
        metadata: { moon_purchase_reference: purchaseReference },
        payment_intent: "pi_m2_b2_i1_valid",
        mode: "payment",
        payment_status: "paid",
        amount_total: 980,
        currency: "jpy",
      },
    },
    ...overrides,
  });
}

function request(payload, options = {}) {
  const headers = new Headers(options.headers);
  if (options.signature !== undefined) {
    headers.set("stripe-signature", options.signature);
  }
  return new Request(`https://ingress.example.test${stripeWebhookPath}`, {
    method: options.method ?? "POST",
    headers,
    body: (options.method ?? "POST") === "POST" ? payload : undefined,
  });
}

function harness(options = {}) {
  const calls = [];
  const handler = createStripeWebhookIngressHandler({
    environment: {
      PAYMENT_ENVIRONMENT: options.paymentEnvironment ?? "test",
      STRIPE_WEBHOOK_ENABLED: "true",
      STRIPE_WEBHOOK_SECRET: secret,
    },
    recordEvidence: async (evidence) => {
      calls.push(evidence);
      if (options.databaseFailure) throw new Error("synthetic database failure");
      return { disposition: "verified" };
    },
  });
  return { handler, calls };
}

async function responseBody(response) {
  return JSON.parse(await response.text());
}

await check("branch and append-only migration lineage", async () => {
  if (descendantRegression) {
    assert.equal(
      git("merge-base", "--is-ancestor", reviewedHead, "HEAD"),
      "",
    );
  } else {
    assert.equal(git("branch", "--show-current"), expectedBranch);
  }
  const allowed = new Set([
    "docs/CODEX_HANDOFF.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/m2/M2_B2_I1_PUBLIC_INGRESS_AUTHORITY.md",
    "docs/m2/M2_MASTER_BACKLOG.md",
    "lib/payment/production/service.ts",
    "lib/payment/production/stripe-session.ts",
    "lib/payment/production/stripe-webhook.ts",
    "lib/payment/production/stripe.ts",
    "package.json",
    "scripts/verify-m2-b2-i1-public-ingress-authority.mjs",
    "scripts/verify-rc2-production-payment-delivery.mjs",
    "services/stripe-webhook-ingress/netlify.toml",
    "services/stripe-webhook-ingress/package-lock.json",
    "services/stripe-webhook-ingress/package.json",
    "services/stripe-webhook-ingress/scripts/build.mjs",
    "services/stripe-webhook-ingress/src/database.ts",
    "services/stripe-webhook-ingress/src/stripe-webhook.ts",
    "services/stripe-webhook-ingress/tsconfig.json",
    "supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql",
    "supabase/tests/m2_b2_i1_ingress_concurrency_setup_r1.sql",
    "supabase/tests/m2_b2_i1_ingress_concurrency_verify_r1.sql",
    "supabase/tests/m2_b2_i1_ingress_concurrency_worker_r1.sql",
    "supabase/tests/m2_b2_i1_future_function_privilege_r1.sql",
    "supabase/tests/m2_b2_i1_ingress_privilege_preflight_r1.sql",
    "supabase/tests/m2_b2_i1_webhook_ingress_authority_r1.sql",
    "tsconfig.json",
  ]);
  const comparisonHead = descendantRegression ? reviewedHead : "HEAD";
  const committed = git("diff", "--name-only", authority, comparisonHead)
    .split(/\r?\n/u)
    .filter(Boolean);
  const working = (descendantRegression
    ? ""
    : gitRaw("status", "--porcelain=v1", "--untracked-files=all"))
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.slice(3).replaceAll("\\", "/"));
  const changed = [...new Set([...committed, ...working])].sort();
  assert.deepEqual(
    changed.filter((entry) => !allowed.has(entry)),
    [],
    "out-of-manifest path changed",
  );
  assert.deepEqual(
    [...allowed].filter((entry) => !changed.includes(entry)),
    [],
    "required path absent",
  );
  const changedExistingMigrations = git(
    "diff",
    "--name-only",
    authority,
    comparisonHead,
    "--",
    "supabase/migrations/0002_*.sql",
    "supabase/migrations/0003_*.sql",
    "supabase/migrations/0004_*.sql",
    "supabase/migrations/0005_*.sql",
    "supabase/migrations/0006_*.sql",
    "supabase/migrations/0007_*.sql",
    "supabase/migrations/0008_*.sql",
    "supabase/migrations/0009_*.sql",
    "supabase/migrations/0010_*.sql",
    "supabase/migrations/0011_*.sql",
    "supabase/migrations/0012_*.sql",
    "supabase/migrations/0013_*.sql",
    "supabase/migrations/0014_*.sql",
    "supabase/migrations/0015_*.sql",
    "supabase/migrations/0016_*.sql",
    "supabase/migrations/0017_*.sql",
  );
  assert.equal(changedExistingMigrations, "");
});

await check("accepted DB0017 artifact remains immutable", async () => {
  const db0017 = execFileSync(
    "git",
    [
      "cat-file",
      "blob",
      "HEAD:supabase/migrations/0017_m2_a1_null_fence_integrity.sql",
    ],
    { cwd: root },
  );
  assert.equal(
    createHash("sha256").update(db0017).digest("hex"),
    "b5c2534dbc8bdb97e6fa77612143b8bf9ec78c2955908ceab3d360bab30f9380",
  );
});

await check("private definer wrapper and credential-free role", async () => {
  const migration = await readFile(
    path.join(root, "supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql"),
    "utf8",
  );
  assert.match(migration, /create schema private_payment_ingress/u);
  assert.match(migration, /security definer\s+set search_path = ''/u);
  assert.match(migration, /'webhook'/u);
  assert.match(migration, /password null/u);
  assert.match(migration, /nobypassrls/u);
  assert.match(migration, /connection limit 4/u);
  assert.match(migration, /grant execute[\s\S]+to m2_b2_stripe_ingress/u);
  assert.match(migration, /from public, anon, authenticated, service_role/u);
  assert.match(
    migration,
    /alter default privileges for role postgres\s+revoke execute on functions from public/u,
  );
  assert.doesNotMatch(migration, /whsec_|postgres(?:ql)?:\/\//u);
});

await check("reusable catalog privilege preflight is branch independent", async () => {
  const preflight = await readFile(
    path.join(
      root,
      "supabase/tests/m2_b2_i1_ingress_privilege_preflight_r1.sql",
    ),
    "utf8",
  );
  assert.match(preflight, /PRIVILEGE_TARGET_EXECUTE_MISSING/u);
  assert.match(preflight, /PRIVILEGE_NON_TARGET_EXECUTE/u);
  assert.match(preflight, /PRIVILEGE_APPLICATION_RELATION_AUTHORITY/u);
  assert.match(preflight, /PRIVILEGE_SCHEMA_CREATE/u);
  assert.match(preflight, /PRIVILEGE_PUBLIC_EXECUTE_DEFAULT/u);
  assert.doesNotMatch(preflight, /expectedBranch|git rev-parse|3fc5d207/u);
});

await check("exact ingress secret allowlist", async () => {
  assert.deepEqual([...ingressSecretAllowlist], [
    "PAYMENT_ENVIRONMENT",
    "STRIPE_WEBHOOK_ENABLED",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_INGRESS_DATABASE_URL",
    "STRIPE_INGRESS_DATABASE_CA_PEM",
  ]);
});

await check("verify-full TLS configuration is explicit and fail closed", async () => {
  const now = Date.now();
  const caPem = rootCertificates.find((pem) => {
    const certificate = new X509Certificate(pem);
    return (
      certificate.ca &&
      Date.parse(certificate.validFrom) <= now &&
      Date.parse(certificate.validTo) >= now
    );
  });
  assert.ok(caPem, "current CA fixture unavailable");
  const url =
    "postgresql://fixture_user:fixture_password@db.example.invalid:5432/fixture_db";
  const configuration = buildVerifiedIngressDatabaseConfiguration(
    url,
    caPem,
    now,
  );
  assert.equal(configuration.connectionString, url);
  assert.equal(configuration.ssl.ca, caPem.trim());
  assert.equal(configuration.ssl.rejectUnauthorized, true);
  assert.equal(configuration.ssl.servername, "aws-0-test.pooler.supabase.com");
  assert.equal(configuration.ssl.checkServerIdentity, checkServerIdentity);

  for (const invalidUrl of [
    url.replace("verify-full", "require"),
    url.replace("verify-full", "disable"),
    url.replace("?sslmode=verify-full", ""),
    `${url}&sslmode=verify-full`,
  ]) {
    assert.throws(
      () => buildVerifiedIngressDatabaseConfiguration(invalidUrl, caPem, now),
      /INGRESS_DATABASE_CONFIGURATION_INVALID/u,
    );
  }
  for (const invalidCa of [
    undefined,
    "",
    "-----BEGIN CERTIFICATE-----invalid-----END CERTIFICATE-----",
    caPem.replaceAll("\n", "\\n"),
  ]) {
    assert.throws(
      () => buildVerifiedIngressDatabaseConfiguration(url, invalidCa, now),
      /INGRESS_DATABASE_CA_INVALID/u,
    );
  }
  assert.throws(
    () =>
      buildVerifiedIngressDatabaseConfiguration(
        url,
        caPem,
        Date.parse(new X509Certificate(caPem).validTo) + 1,
      ),
    /INGRESS_DATABASE_CA_INVALID/u,
  );

  const hostnameError = configuration.ssl.checkServerIdentity(
    "wrong.pooler.supabase.com",
    {
      subject: { CN: "aws-0-test.pooler.supabase.com" },
      subjectaltname: "DNS:aws-0-test.pooler.supabase.com",
    },
  );
  assert.equal(hostnameError?.code, "ERR_TLS_CERT_ALTNAME_INVALID");
});

await check("pooler connection is bounded and leak-safe", async () => {
  const source = await readFile(
    path.join(root, "services/stripe-webhook-ingress/src/database.ts"),
    "utf8",
  );
  assert.match(source, /\.pooler\.supabase\.com/u);
  assert.match(source, /url\.port !== "6543"/u);
  assert.match(source, /m2_b2_stripe_ingress\./u);
  assert.match(source, /url\.pathname !== "\/postgres"/u);
  assert.match(source, /sslmode.*verify-full/u);
  assert.match(source, /rejectUnauthorized: true/u);
  assert.match(source, /servername: url\.hostname/u);
  assert.match(source, /checkServerIdentity/u);
  assert.doesNotMatch(source, /rejectUnauthorized:\s*false/u);
  assert.doesNotMatch(source, /ssl:\s*"require"/u);
  assert.match(source, /max: 1/u);
  assert.match(source, /connect_timeout: 5/u);
  assert.match(source, /prepare: false/u);
  assert.match(source, /statement_timeout = '5s'/u);
  assert.match(source, /lock_timeout = '2s'/u);
  assert.match(source, /finally[\s\S]+sql\.end\(\{ timeout: 1 \}\)/u);
  assert.doesNotMatch(source, /retry|backoff/iu);
});

await check("valid raw body commits before 2xx", async () => {
  const payload = eventPayload();
  const run = harness();
  const response = await run.handler(
    request(payload, { signature: signed(payload) }),
  );
  assert.equal(response.status, 200);
  assert.equal(run.calls.length, 1);
  assert.equal((await responseBody(response)).disposition, "verified");
});

await check("missing, wrong, and expired signatures fail closed", async () => {
  const payload = eventPayload();
  for (const signature of [undefined, "t=1,v1=wrong", signed(payload, 1)]) {
    const run = harness();
    const response = await run.handler(request(payload, { signature }));
    assert.equal(response.status, 400);
    assert.equal(run.calls.length, 0);
    assert.equal(
      (await responseBody(response)).error.code,
      "PAYMENT_WEBHOOK_SIGNATURE_INVALID",
    );
  }
});

await check("whitespace, key order, and encoding mutation invalidate signature", async () => {
  const payload = eventPayload();
  const mutations = [
    `${payload}\n`,
    JSON.stringify(JSON.parse(payload), Object.keys(JSON.parse(payload)).reverse()),
    payload.replace("jpy", "jp\\u0079"),
  ];
  for (const mutated of mutations) {
    const run = harness();
    const response = await run.handler(
      request(mutated, { signature: signed(payload) }),
    );
    assert.equal(response.status, 400);
    assert.equal(run.calls.length, 0);
  }
});

await check("oversize and non-POST requests never read durable authority", async () => {
  const run = harness();
  const oversized = await run.handler(
    request("{}", {
      signature: signed("{}"),
      headers: { "content-length": String(maximumWebhookBytes + 1) },
    }),
  );
  assert.equal(oversized.status, 413);
  const nonPost = await run.handler(
    request("", { method: "GET", signature: "unused" }),
  );
  assert.equal(nonPost.status, 405);
  assert.equal(run.calls.length, 0);
});

await check("valid unsupported event remains 2xx ignored without DB", async () => {
  const payload = eventPayload({ type: "customer.created" });
  const run = harness();
  const response = await run.handler(
    request(payload, { signature: signed(payload) }),
  );
  assert.equal(response.status, 200);
  assert.equal((await responseBody(response)).disposition, "ignored");
  assert.equal(run.calls.length, 0);
});

await check("environment mismatch and DB failure never acknowledge", async () => {
  const payload = eventPayload();
  const wrongEnvironment = harness({ paymentEnvironment: "live" });
  assert.equal(
    (await wrongEnvironment.handler(
      request(payload, { signature: signed(payload) }),
    )).status,
    400,
  );
  assert.equal(wrongEnvironment.calls.length, 0);
  const failedCommit = harness({ databaseFailure: true });
  assert.equal(
    (await failedCommit.handler(
      request(payload, { signature: signed(payload) }),
    )).status,
    500,
  );
  assert.equal(failedCommit.calls.length, 1);
});

await check("function package is path-only and has no static surface", async () => {
  const source = await readFile(
    path.join(root, "services/stripe-webhook-ingress/src/stripe-webhook.ts"),
    "utf8",
  );
  assert.match(source, /path: stripeWebhookPath/u);
  assert.match(source, /method: "POST"/u);
  assert.equal((source.match(/request\.arrayBuffer\(\)/gu) ?? []).length, 1);
  const publicDir = path.join(root, "services/stripe-webhook-ingress/dist/public");
  assert.equal((await readdir(publicDir)).length, 0);
});

await check("built artifact contains no forbidden app surface or secret name", async () => {
  const artifact = path.join(
    root,
    "services/stripe-webhook-ingress/dist/functions/stripe-webhook.mjs",
  );
  assert.ok((await stat(artifact)).size > 0);
  const bundle = await readFile(artifact, "utf8");
  for (const forbidden of [
    "STRIPE_SECRET_KEY",
    "SUPABASE_SECRET_KEY",
    "service_role",
    "OPENAI_API_KEY",
    "RESEND_API_KEY",
    "NETLIFY_ASYNC_WORKLOADS",
    "/account",
    "/review",
    "/request",
    "/result",
    "createCheckoutSession",
    "enqueueProductionFulfillmentJob",
    "rejectUnauthorized: false",
    'ssl: "require"',
  ]) {
    assert.equal(bundle.includes(forbidden), false, forbidden);
  }
});

console.log(`M2-B2-I1 PUBLIC INGRESS AUTHORITY PASS ${passed}/${passed}`);
