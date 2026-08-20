import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  isRc2NewPurchaseActivationReady,
  RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS,
  RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS,
} from "../lib/payment/production/activation-policy.ts";

const root = process.cwd();
const acceptedAuthority = "dcccf1c780619e9716b72764d2f2f7f93a961543";
const accepted0010Blob = "8b5bd5b02ca7756299049cf6215af299ace69e3c";
const accepted0011Blob = "70dc2c62631de6f1a81e5257eb076f45c4078565";
const migration0010 =
  "supabase/migrations/0010_rc1_production_fulfillment_core.sql";
const migration0011 =
  "supabase/migrations/0011_rc2_production_payment_delivery.sql";
const migration0012 =
  "supabase/migrations/0012_rc2_activation_database_hardening.sql";

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: options.encoding ?? "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    },
  );
}

function gitText(args) {
  return git(args).trim();
}

function readText(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    readFileSync(path.join(root, relativePath)),
  );
}

function parseExampleEnvironment(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/u)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

function trackedFiles() {
  return git(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"));
}

function assertNoDiffFromAuthority(relativePaths) {
  try {
    git(["diff", "--quiet", acceptedAuthority, "--", ...relativePaths]);
  } catch {
    assert.fail(`protected authority drift: ${relativePaths.join(", ")}`);
  }
}

function textTrackedFiles(files) {
  const result = [];
  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
    if (!existsSync(absolutePath) || statSync(absolutePath).size > 4_000_000) {
      continue;
    }
    const bytes = readFileSync(absolutePath);
    if (bytes.includes(0)) continue;
    try {
      result.push({ relativePath, source: new TextDecoder("utf-8", { fatal: true }).decode(bytes) });
    } catch {
      // Non-UTF-8 tracked assets are outside the text-secret scan.
    }
  }
  return result;
}

let checks = 0;
const failures = [];

async function check(name, callback) {
  try {
    await callback();
    checks += 1;
    console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

await check("accepted RC-2 routes and server seams exist", () => {
  for (const relativePath of [
    "app/api/consultations/prepare/route.ts",
    "app/api/consultations/clarifications/route.ts",
    "app/api/delivery/email-verifications/route.ts",
    "app/api/delivery/email-verifications/verify/route.ts",
    "app/api/payments/checkout/route.ts",
    "app/api/payments/status/route.ts",
    "app/api/payments/stripe/webhook/route.ts",
    "lib/payment/production/application.ts",
    "lib/payment/production/service.ts",
    "lib/payment/production/supabase-repository.ts",
    "lib/payment/production/transactional-email.ts",
  ]) {
    assert.equal(existsSync(path.join(root, relativePath)), true, relativePath);
  }
});

await check("activation environment names are declared without example secrets", () => {
  const example = parseExampleEnvironment(readText(".env.example"));
  const requiredNames = [
    "NEXT_PUBLIC_APP_URL",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "ASSESSMENT_PRODUCTION_PREPARATION_ENABLED",
    "ASSESSMENT_PRODUCTION_RUNTIME_ENABLED",
    "ASSESSMENT_PRODUCTION_RESULT_ACCESS_ENABLED",
    "ASSESSMENT_PRODUCTION_EMERGENCY_STOP",
    "PAYMENT_PRODUCTION_ENABLED",
    "PAYMENT_EMERGENCY_STOP",
    "PAYMENT_FULFILLMENT_PROCESSING_ENABLED",
    "PAYMENT_FULFILLMENT_EMERGENCY_STOP",
    "PAYMENT_PROVIDER_ENVIRONMENT",
    "STRIPE_WEBHOOK_ENABLED",
    "STRIPE_RECONCILIATION_ENABLED",
    "STRIPE_PAYPAY_ENABLED",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "EMAIL_VERIFICATION_ENABLED",
    "EMAIL_VERIFICATION_EMERGENCY_STOP",
    "TRANSACTIONAL_EMAIL_PROVIDER",
    "EMAIL_VERIFICATION_SECRET_PEPPER",
    "EMAIL_ADDRESS_ENCRYPTION_KEY",
    "PURCHASE_STATUS_SIGNING_SECRET",
    "EMAIL_VERIFICATION_CHALLENGE_TTL_SECONDS",
    "TRUSTED_EMAIL_SESSION_TTL_SECONDS",
    "EMAIL_VERIFICATION_MAX_ATTEMPTS",
    "PAYMENT_FULFILLMENT_LEASE_SECONDS",
    "PAYMENT_ROUTE_RATE_LIMIT_MODE",
    "PAYMENT_ROUTE_RATE_LIMIT_MAX_REQUESTS",
    "PAYMENT_ROUTE_RATE_LIMIT_WINDOW_SECONDS",
  ];
  for (const name of requiredNames) assert.equal(example.has(name), true, name);
  for (const name of [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "OPENAI_API_KEY",
    "EMAIL_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "EMAIL_VERIFICATION_SECRET_PEPPER",
    "EMAIL_ADDRESS_ENCRYPTION_KEY",
    "PURCHASE_STATUS_SIGNING_SECRET",
  ]) {
    assert.equal(example.get(name), "", name);
  }
});

await check("all activation defaults remain fail-closed and PayPay remains off", () => {
  const example = parseExampleEnvironment(readText(".env.example"));
  for (const name of [
    "M2_INTERNAL_RUNTIME_ENABLED",
    ...RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS,
    "STRIPE_PAYPAY_ENABLED",
  ]) {
    assert.equal(example.get(name), "false", name);
  }
  assert.equal(example.get("PAYMENT_PROVIDER_ENVIRONMENT"), "");
  assert.equal(example.get("TRANSACTIONAL_EMAIL_PROVIDER"), "unconfigured");
});

await check("new purchase visibility is an all-flags fail-closed policy", () => {
  const state = new Map();
  for (const name of RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS) {
    state.set(name, true);
  }
  for (const name of RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS) {
    state.set(name, false);
  }
  const enabled = (name) => state.get(name) === true;
  assert.equal(isRc2NewPurchaseActivationReady(enabled), true);
  for (const name of RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS) {
    state.set(name, false);
    assert.equal(isRc2NewPurchaseActivationReady(enabled), false, name);
    state.set(name, true);
  }
  for (const name of RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS) {
    state.set(name, true);
    assert.equal(isRc2NewPurchaseActivationReady(enabled), false, name);
    state.set(name, false);
  }
  const environment = readText("lib/payment/production/environment.ts");
  for (const functionName of [
    "isCustomerPaymentFlowVisible",
    "isEmailVerificationAvailable",
    "isCheckoutAvailable",
  ]) {
    assert.match(
      environment,
      new RegExp(`export function ${functionName}\\(\\) \\{[\\s\\S]*?isRc2NewPurchaseActivationReady\\(enabled\\)`, "u"),
      functionName,
    );
  }
});

await check("payment environment accepts only test/live and rejects key mismatch", () => {
  const environment = readText("lib/payment/production/environment.ts");
  const stripe = readText("lib/payment/production/stripe.ts");
  assert.match(environment, /configured !== "test" && configured !== "live"/u);
  assert.match(environment, /configuredEnvironment !== keyEnvironment/u);
  assert.match(stripe, /secretKey\.startsWith\("sk_test_"\)/u);
  assert.match(stripe, /secretKey\.startsWith\("sk_live_"\)/u);
  assert.match(stripe, /STRIPE_CONFIGURATION_INVALID/u);
});

await check("Stripe SDK remains server-confined and exact JPY 980 one-time", () => {
  const packageJson = JSON.parse(readText("package.json"));
  const lock = JSON.parse(readText("package-lock.json"));
  assert.equal(packageJson.dependencies.stripe, "^22.5.0");
  assert.equal(lock.packages["node_modules/stripe"].version, "22.5.0");
  const importers = textTrackedFiles(trackedFiles())
    .filter(({ source }) => /from ["'][^"']*stripe\.ts["']/u.test(source))
    .map(({ relativePath }) => relativePath)
    .sort();
  assert.deepEqual(importers, [
    "lib/payment/production/environment.ts",
    "lib/payment/production/fakes.ts",
    "lib/payment/production/service.ts",
    "scripts/verify-rc2-production-payment-delivery.mjs",
  ]);
  for (const relativePath of importers) {
    assert.doesNotMatch(readText(relativePath), /^["']use client["'];/mu, relativePath);
  }
  assert.match(readText("lib/payment/production/environment.ts"), /^import "server-only";/u);
  assert.match(readText("lib/payment/production/service.ts"), /^import "server-only";/u);
  const constants = readText("lib/payment/production/constants.ts");
  const application = readText("lib/payment/production/application.ts");
  const stripe = readText("lib/payment/production/stripe.ts");
  assert.match(constants, /amount: 980/u);
  assert.match(constants, /currency: "jpy"/u);
  assert.match(constants, /purchaseKind: "one_time"/u);
  assert.match(application, /mode: "payment"/u);
  assert.match(application, /quantity: 1/u);
  assert.match(application, /url\.origin !== value/u);
  assert.match(application, /environment === "live" && url\.protocol !== "https:"/u);
  assert.match(stripe, /idempotencyKey: request\.idempotencyKey/u);
  const metadataBlocks = [...stripe.matchAll(/metadata:\s*\{([^}]*)\}/gs)].map(
    (match) => match[1],
  );
  assert.equal(metadataBlocks.length, 2);
  for (const block of metadataBlocks) {
    assert.match(block, /moon_purchase_reference/u);
    assert.doesNotMatch(block, /consultation|message|email|token|secret|result|assessment/iu);
  }
});

await check("webhook uses raw signature and a separate required secret", () => {
  const route = readText("app/api/payments/stripe/webhook/route.ts");
  const environment = readText("lib/payment/production/environment.ts");
  const stripe = readText("lib/payment/production/stripe.ts");
  assert.match(route, /request\.arrayBuffer\(\)/u);
  assert.match(route, /stripe-signature/u);
  assert.match(environment, /webhookSecret: required\("STRIPE_WEBHOOK_SECRET"\)/u);
  assert.match(stripe, /webhooks\.constructEvent/u);
  assert.match(stripe, /session\.livemode !== event\.livemode/u);
  assert.doesNotMatch(route, /fulfillProduction|issueProductionAssessmentGrant/u);
});

await check("reconciliation and paid fulfillment remain server-only recovery seams", () => {
  const service = readText("lib/payment/production/service.ts");
  const stripe = readText("lib/payment/production/stripe.ts");
  assert.match(service, /^import "server-only";/u);
  assert.match(stripe, /checkout\.sessions\.retrieve/u);
  assert.match(service, /isStripeReconciliationAvailable/u);
  assert.match(service, /processProductionFulfillmentJobById/u);
  assert.match(service, /isPaidFulfillmentProcessingAvailable/u);
});

await check("email verification secrets and bounded Human policy fail closed", () => {
  const environment = readText("lib/payment/production/environment.ts");
  const service = readText("lib/payment/production/service.ts");
  const email = readText("lib/payment/production/transactional-email.ts");
  for (const name of [
    "EMAIL_VERIFICATION_SECRET_PEPPER",
    "EMAIL_ADDRESS_ENCRYPTION_KEY",
    "PURCHASE_STATUS_SIGNING_SECRET",
    "EMAIL_VERIFICATION_CHALLENGE_TTL_SECONDS",
    "TRUSTED_EMAIL_SESSION_TTL_SECONDS",
    "EMAIL_VERIFICATION_MAX_ATTEMPTS",
    "PAYMENT_FULFILLMENT_LEASE_SECONDS",
  ]) {
    assert.ok(environment.includes(`"${name}"`), name);
  }
  assert.match(service, /TRANSACTIONAL_EMAIL_PROVIDER_UNSUPPORTED/u);
  assert.match(email, /TRANSACTIONAL_EMAIL_PROVIDER_UNCONFIGURED/u);
});

await check("0010 and 0011 are immutable and 0012 is append-only hardening", () => {
  assert.equal(gitText(["rev-parse", `${acceptedAuthority}:${migration0010}`]), accepted0010Blob);
  assert.equal(gitText(["rev-parse", `${acceptedAuthority}:${migration0011}`]), accepted0011Blob);
  assertNoDiffFromAuthority([migration0010, migration0011]);
  assert.equal(existsSync(path.join(root, migration0012)), true);
});

await check("migration order and 0010 through 0012 dependencies are structurally intact", () => {
  const migrations = trackedFiles()
    .filter((entry) => entry.startsWith("supabase/migrations/") && entry.endsWith(".sql"))
    .map((entry) => path.posix.basename(entry))
    .sort();
  assert.deepEqual(migrations, [
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
  ]);
  const rc1 = readText(migration0010);
  const rc2 = readText(migration0011);
  const stepB = readText(migration0012);
  for (const table of [
    "production_preparations",
    "production_purchases",
    "production_assessment_grants",
    "production_logical_assessments",
    "production_notification_outbox",
  ]) {
    assert.ok(rc1.includes(`public.${table}`), `0010 ${table}`);
    assert.ok(rc2.includes(`public.${table}`), `0011 ${table}`);
  }
  for (const required of [
    "create extension if not exists pgcrypto with schema extensions",
    "expected_amount = 980",
    "currency = 'jpy'",
    "purchase_kind = 'one_time'",
    "production_payment_attempt_one_success_idx",
    "record_rc2_stripe_evidence_v1",
    "issue_rc2_production_assessment_grant_v1",
    "claim_rc2_fulfillment_job_by_id_v1",
    "enable row level security",
    "from public, anon, authenticated",
    "to service_role",
    "PAYMENT_CONFLICTING_SUCCESS",
  ]) {
    assert.ok(rc2.includes(required), required);
  }
  assert.doesNotMatch(rc2, /grant .* to anon|grant .* to authenticated/iu);
  for (const required of [
    "assessment_requests",
    "assessment_clarifications",
    "rc2_checkout_session_matches_environment_v1",
    "enforce_rc2_payment_attempt_environment_v1",
    "production_verified_payment_environment_session_binding",
    "PAYMENT_ENVIRONMENT_MISMATCH",
  ]) {
    assert.ok(stepB.includes(required), `0012 ${required}`);
  }
  assert.doesNotMatch(stepB, /security definer/iu);
});

await check("no public API route can mint a Grant or run fulfillment", () => {
  const routes = trackedFiles().filter(
    (entry) => entry.startsWith("app/api/") && entry.endsWith("/route.ts"),
  );
  assert.ok(routes.length > 0);
  const source = routes.map(readText).join("\n");
  assert.doesNotMatch(
    source,
    /issueProductionAssessmentGrant|issue_rc2_production_assessment_grant_v1|processProductionFulfillmentJobById|fulfillProductionAssessmentGrant/u,
  );
});

await check("tracked files contain no deployable env file or credential signature", () => {
  const files = trackedFiles();
  const trackedEnvFiles = files.filter((entry) => {
    const basename = path.posix.basename(entry);
    return basename.startsWith(".env") && basename !== ".env.example";
  });
  assert.deepEqual(trackedEnvFiles, []);
  const ignore = readText(".gitignore");
  assert.match(ignore, /^\.env\*$/mu);
  assert.match(ignore, /^!\.env\.example$/mu);
  const signatures = [
    new RegExp(["s", "k_(?:test|live)_[A-Za-z0-9]{16,}"].join(""), "u"),
    new RegExp(["w", "hsec_[A-Za-z0-9]{16,}"].join(""), "u"),
    new RegExp(["s", "k-(?:proj|org)-[A-Za-z0-9_-]{16,}"].join(""), "u"),
    new RegExp(["s", "b_secret_[A-Za-z0-9_-]{16,}"].join(""), "u"),
    /AKIA[0-9A-Z]{16}/u,
    /gh[pousr]_[A-Za-z0-9]{20,}/u,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/u,
    new RegExp(["-----BEGIN ", "(?:RSA |EC |OPENSSH )?", "PRIVATE KEY-----"].join(""), "u"),
  ];
  const findings = [];
  for (const { relativePath, source } of textTrackedFiles(files)) {
    if (signatures.some((signature) => signature.test(source))) findings.push(relativePath);
  }
  assert.deepEqual(findings, []);
});

await check("V17 Q0 and accepted customer runtime surfaces are unchanged", () => {
  assertNoDiffFromAuthority([
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/request/RequestForm.tsx",
    "lib/assessment",
    "schemas/m2",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d",
    "scripts/verify-m2-p4-q0-final-reassessment-semantics.mjs",
  ]);
});

await check("activation runbook preserves the no-operation boundary", () => {
  const runbook = readText("docs/payment/RC2_PRODUCTION_ACTIVATION_RUNBOOK.md");
  for (const required of [
    "PAYMENT_PROVIDER_ENVIRONMENT=test",
    "STRIPE_PAYPAY_ENABLED=false",
    "PAYMENT_PRODUCTION_ENABLED=false",
    "STRIPE_WEBHOOK_ENABLED=false",
    "STRIPE_RECONCILIATION_ENABLED=false",
    "EMAIL_VERIFICATION_ENABLED=false",
    "PAYMENT_FULFILLMENT_PROCESSING_ENABLED=false",
    "LOCAL_POSTGRES_COMPATIBILITY_NOT_EXECUTED",
    "REMOTE_SUPABASE_STATE = UNRESOLVED",
    "PRIVATE RELEASE READY = false",
    "Public Launch = false",
  ]) {
    assert.ok(runbook.includes(required), required);
  }
});

if (failures.length > 0) {
  console.error(`\nRC-2 Production Activation Preflight: FAIL ${failures.length}/${checks + failures.length}`);
  process.exitCode = 1;
} else {
  console.log(`\nRC-2 Production Activation Preflight: PASS ${checks}/${checks}`);
  console.log(
    "External operations: StripeAPI=0 Charge=0 Payment=0 WebhookRegistration=0 Email=0 OpenAI=0 SupabaseRemoteWrite=0 MigrationApply=0 MigrationRepair=0 Deploy=0 DNS=0 LegalPublication=0 PublicLaunch=0",
  );
}
