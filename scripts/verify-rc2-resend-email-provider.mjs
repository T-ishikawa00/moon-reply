import assert from "node:assert/strict";
import { assertF013LockDelta } from "./verify-f013-dependencies.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import {
  RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS,
  RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS,
} from "../lib/payment/production/activation-policy.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return {
        url: "data:text/javascript,export%20{}",
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".ts")) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          verbatimModuleSyntax: true,
        },
        fileName: fileURLToPath(url),
      });
      return {
        format: "module",
        source: transpiled.outputText,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

const root = process.cwd();
const acceptedRelease = "243e8655098ba9e0972e0e1efd68f83fbc2ded30";
// F004 changes only notification delivery; subsequent accepted work is not RC2 drift.
const f004Base = "fd01f7fb96241c448f6cbe57a197752cf411e71e";
const f004Head = "95b84e71508426f67ae3cd4e7e63961f9b0885e2";
const wave2Base = "195e9ef99724fd7420610f1fc3b0e60389639d39";
const f004Migration = "supabase/migrations/0024_f004_notification_send_identity.sql";
const f010Migration = "supabase/migrations/0025_f010_account_otp_throttle.sql";
const providerPath = "lib/payment/production/resend-transactional-email.ts";
const servicePath = "lib/payment/production/service.ts";

function readProviderSources() {
  return [
    providerPath,
    "lib/payment/production/resend-transactional-email-runtime.ts",
  ]
    .map(readText)
    .join("\n");
}
const protectedProductPaths = [
  "components/runtime/CustomerAssessmentNote.tsx",
  "components/request/RequestForm.tsx",
  "lib/assessment",
  "schemas/m2",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d",
  "scripts/verify-m2-p4-q0-final-reassessment-semantics.mjs",
];

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
  return git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"));
}

function assertNoDiffFromAcceptedRelease(relativePaths, revision = acceptedRelease) {
  try {
    git(["diff", "--quiet", revision, "--", ...relativePaths]);
  } catch {
    assert.fail(`accepted authority drift: ${relativePaths.join(", ")}`);
  }
}

function textTrackedFiles(files) {
  const result = [];
  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
    if (!statSafe(absolutePath)) continue;
    if (statSync(absolutePath).size > 4_000_000) continue;
    const bytes = readFileSync(absolutePath);
    if (bytes.includes(0)) continue;
    try {
      result.push({
        relativePath,
        source: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      });
    } catch {
      // Non-UTF-8 tracked assets are outside this source/config scan.
    }
  }
  return result;
}

function statSafe(absolutePath) {
  try {
    return statSync(absolutePath);
  } catch {
    return null;
  }
}

async function withEnvironment(values, callback) {
  const before = new Map();
  for (const name of Object.keys(values)) before.set(name, process.env[name]);
  try {
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    return await callback();
  } finally {
    for (const [name, value] of before) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

class RecordingResendEmailClient {
  requests = [];
  response = { data: { id: "provider-message-1" }, error: null };
  thrown = null;

  async send(payload, options) {
    this.requests.push(structuredClone({ payload, options }));
    if (this.thrown) throw this.thrown;
    return structuredClone(this.response);
  }
}

const [providerModule, serviceModule, transactionalEmailModule, errorsModule] =
  await Promise.all([
    import("../lib/payment/production/resend-transactional-email.ts"),
    import("../lib/payment/production/service.ts"),
    import("../lib/payment/production/transactional-email.ts"),
    import("../lib/assessment/runtime/errors.ts"),
  ]);

const {
  createResendTransactionalEmailAdapterV1,
  ResendTransactionalEmailAdapterV1,
} = providerModule;
const { createTransactionalEmailAdapter } = serviceModule;
const { UnconfiguredTransactionalEmailAdapterV1 } = transactionalEmailModule;
const { M2RuntimeError } = errorsModule;

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
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

await check("Resend SDK is exactly stable 6.20.0 in manifest and lock", () => {
  const manifest = JSON.parse(readText("package.json"));
  const lock = JSON.parse(readText("package-lock.json"));
  assert.equal(manifest.dependencies.resend, "6.20.0");
  assert.equal(lock.packages[""].dependencies.resend, "6.20.0");
  assert.equal(lock.packages["node_modules/resend"].version, "6.20.0");
  assert.doesNotMatch(manifest.dependencies.resend, /canary|preview|alpha|beta|rc/u);
});

await check("Resend adapter and SDK import are server-confined", () => {
  const provider = readProviderSources();
  const service = readText(servicePath);
  assert.match(provider, /^import "server-only";/u);
  assert.match(service, /^import "server-only";/u);
  assert.match(provider, /import \{ Resend \} from "resend";/u);
  const browserSources = textTrackedFiles(
    trackedFiles().filter(
      (entry) =>
        (entry.startsWith("app/") || entry.startsWith("components/")) &&
        /\.[cm]?[jt]sx?$/u.test(entry),
    ),
  );
  assert.deepEqual(
    browserSources
      .filter(({ source }) =>
        /(?:from\s+["']resend["']|resend-transactional-email)/u.test(source),
      )
      .map(({ relativePath }) => relativePath),
    [],
  );
});

await check("generic server-only environment contract contains no embedded key", () => {
  const example = parseExampleEnvironment(readText(".env.example"));
  assert.equal(example.get("TRANSACTIONAL_EMAIL_PROVIDER"), "unconfigured");
  assert.equal(example.get("EMAIL_API_KEY"), "");
  assert.equal(example.get("EMAIL_FROM_ADDRESS"), "");
  assert.equal(example.get("EMAIL_FROM_NAME"), "");
  assert.equal(example.has("EMAIL_PROVIDER"), false);
  const sources = textTrackedFiles(trackedFiles());
  const providerSpecificKeyName = ["RESEND", "API", "KEY"].join("_");
  const ingressVerifierPath = "scripts/verify-m2-b2-i1-public-ingress-authority.mjs";
  // This pre-F004 security test prohibits the name in the built ingress bundle.
  // Permit that exact immutable denylist literal, never a runtime/config occurrence.
  assertNoDiffFromAcceptedRelease([ingressVerifierPath], f004Base);
  const ingressVerifier = readText(ingressVerifierPath);
  assert.match(ingressVerifier, /for \(const forbidden of \[[\s\S]*?\]\) \{\s*assert\.equal\(bundle\.includes\(forbidden\), false, forbidden\);/u);
  assert.equal(ingressVerifier.split(providerSpecificKeyName).length - 1, 1);
  assert.deepEqual(
    sources
      .filter(({ relativePath, source }) =>
        (relativePath === ingressVerifierPath
          ? source.replace(`"${providerSpecificKeyName}"`, "\"forbidden-provider-name\"")
          : source
        ).includes(providerSpecificKeyName),
      )
      .map(({ relativePath }) => relativePath),
    [],
  );
  assert.deepEqual(
    sources
      .filter(({ source }) => /\bre_[A-Za-z0-9]{16,}\b/u.test(source))
      .map(({ relativePath }) => relativePath),
    [],
  );
});

await check("service selects only exact resend and preserves activation gating", async () => {
  const base = {
    EMAIL_VERIFICATION_ENABLED: "true",
    EMAIL_VERIFICATION_EMERGENCY_STOP: "false",
    EMAIL_API_KEY: ["offline", "test", "not", "a", "credential"].join("_"),
    EMAIL_FROM_ADDRESS: "no-reply@example.com",
    EMAIL_FROM_NAME: "月の返事",
  };
  await withEnvironment(
    { ...base, TRANSACTIONAL_EMAIL_PROVIDER: "resend" },
    () => {
      assert.ok(
        createTransactionalEmailAdapter() instanceof
          ResendTransactionalEmailAdapterV1,
      );
    },
  );
  await withEnvironment(
    { ...base, TRANSACTIONAL_EMAIL_PROVIDER: "unconfigured" },
    () => {
      assert.ok(
        createTransactionalEmailAdapter() instanceof
          UnconfiguredTransactionalEmailAdapterV1,
      );
    },
  );
  await withEnvironment(
    { ...base, TRANSACTIONAL_EMAIL_PROVIDER: "RESEND" },
    () => {
      assert.throws(
        () => createTransactionalEmailAdapter(),
        (error) =>
          safeCode(error) === "TRANSACTIONAL_EMAIL_PROVIDER_UNSUPPORTED",
      );
    },
  );
  await withEnvironment(
    {
      ...base,
      EMAIL_VERIFICATION_ENABLED: "false",
      TRANSACTIONAL_EMAIL_PROVIDER: "resend",
    },
    () => {
      assert.ok(
        createTransactionalEmailAdapter() instanceof
          UnconfiguredTransactionalEmailAdapterV1,
      );
    },
  );
});

await check("missing or unsafe provider configuration fails closed", async () => {
  const base = {
    apiKey: ["offline", "test", "only"].join("_"),
    fromAddress: "no-reply@example.com",
    fromName: "月の返事",
  };
  for (const configuration of [
    { ...base, apiKey: "" },
    { ...base, fromAddress: "not-an-email" },
    { ...base, fromName: "" },
    { ...base, fromName: "月の返事\r\nBcc: attacker@example.com" },
    { ...base, fromName: "月の返事: Bcc" },
    { ...base, fromName: "長".repeat(81) },
  ]) {
    assert.throws(
      () => createResendTransactionalEmailAdapterV1(configuration),
      (error) => safeCode(error) === "PAYMENT_CONFIGURATION_INVALID",
    );
  }
  await withEnvironment(
    {
      EMAIL_VERIFICATION_ENABLED: "true",
      EMAIL_VERIFICATION_EMERGENCY_STOP: "false",
      TRANSACTIONAL_EMAIL_PROVIDER: "resend",
      EMAIL_API_KEY: "",
      EMAIL_FROM_ADDRESS: "no-reply@example.com",
      EMAIL_FROM_NAME: "月の返事",
    },
    () => {
      assert.throws(
        () => createTransactionalEmailAdapter(),
        (error) => safeCode(error) === "PAYMENT_CONFIGURATION_INVALID",
      );
    },
  );
});

await check("verification email is minimal separated Japanese content", async () => {
  const client = new RecordingResendEmailClient();
  client.response = {
    data: { id: "provider-message-verification-1" },
    error: null,
  };
  const adapter = new ResendTransactionalEmailAdapterV1(client, {
    fromAddress: "NO-REPLY@example.com",
    fromName: "月の返事",
  });
  const sent = await adapter.sendMailboxVerification({
    recipientEmail: "Customer@Example.com",
    verificationCode: "12345678",
    expiresAt: "2026-08-21T03:34:00.000Z",
    messageIdempotencyKey: "email-challenge:verification-1",
  });
  assert.deepEqual(sent, {
    providerMessageReference: "provider-message-verification-1",
  });
  assert.deepEqual(Object.keys(sent), ["providerMessageReference"]);
  assert.equal(client.requests.length, 1);
  const { payload, options } = client.requests[0];
  assert.equal(payload.from, "月の返事 <no-reply@example.com>");
  assert.equal(payload.to, "customer@example.com");
  assert.equal(payload.subject, "月の返事｜メールアドレス確認コード");
  assert.match(payload.text, /12345678/u);
  assert.match(payload.html, /12345678/u);
  assert.match(payload.text, /有効期限/u);
  assert.match(payload.text, /共有しない/u);
  assert.doesNotMatch(`${payload.subject}${payload.text}${payload.html}`, /相談|鑑定|候補|判断|関係/u);
  assert.equal(options.idempotencyKey, "email-challenge:verification-1");
});

await check("result email contains only readiness and protected access guidance", async () => {
  const client = new RecordingResendEmailClient();
  client.response = { data: { id: "provider-message-result-1" }, error: null };
  const adapter = new ResendTransactionalEmailAdapterV1(client, {
    fromAddress: "no-reply@example.com",
    fromName: "月の返事",
  });
  const token = Buffer.alloc(32, 91).toString("base64url");
  const resultUrl = `https://moon-reply.example/result/${token}`;
  const sent = await adapter.sendAssessmentResult({
    recipientEmail: "customer@example.com",
    resultUrl,
    messageIdempotencyKey: "result-notification:notification-1",
  });
  assert.deepEqual(sent, { providerMessageReference: "provider-message-result-1" });
  assert.equal(client.requests.length, 1);
  const { payload, options } = client.requests[0];
  assert.deepEqual(Object.keys(payload).sort(), [
    "from",
    "html",
    "subject",
    "text",
    "to",
  ]);
  assert.equal(payload.subject, "月の返事｜鑑定ノートができました");
  assert.match(payload.text, /鑑定ノートのご用意ができました/u);
  assert.match(payload.text, /アクセスできない場合は、購入状況画面から再度お試しください。/u);
  assert.doesNotMatch(`${payload.subject}${payload.text}${payload.html}`, /有効期限|期限切れ/u);
  assert.match(payload.text, new RegExp(resultUrl.replaceAll("/", "\\/"), "u"));
  assert.match(payload.html, new RegExp(resultUrl.replaceAll("/", "\\/"), "u"));
  assert.doesNotMatch(`${payload.subject}${payload.text}${payload.html}`, /12345678|相談|候補|判断|関係/u);
  assert.equal(options.idempotencyKey, "result-notification:notification-1");
});

await check("existing durable identity is forwarded without a second identity", async () => {
  const client = new RecordingResendEmailClient();
  const adapter = new ResendTransactionalEmailAdapterV1(client, {
    fromAddress: "no-reply@example.com",
    fromName: "月の返事",
  });
  const request = {
    recipientEmail: "customer@example.com",
    verificationCode: "87654321",
    expiresAt: "2026-08-21T04:00:00.000Z",
    messageIdempotencyKey: "email-challenge:same-logical-message",
  };
  await adapter.sendMailboxVerification(request);
  await adapter.sendMailboxVerification(request);
  assert.equal(client.requests.length, 2);
  assert.deepEqual(
    client.requests.map(({ options }) => options.idempotencyKey),
    [request.messageIdempotencyKey, request.messageIdempotencyKey],
  );
});

await check("provider errors and unknown results map safely with no hidden retry", async () => {
  const verificationClient = new RecordingResendEmailClient();
  verificationClient.response = {
    data: null,
    error: { name: "provider-private-error", message: "must not escape" },
  };
  const verificationAdapter = new ResendTransactionalEmailAdapterV1(
    verificationClient,
    { fromAddress: "no-reply@example.com", fromName: "月の返事" },
  );
  await assert.rejects(
    () =>
      verificationAdapter.sendMailboxVerification({
        recipientEmail: "customer@example.com",
        verificationCode: "12345678",
        expiresAt: "2026-08-21T04:00:00.000Z",
        messageIdempotencyKey: "email-challenge:error-1",
      }),
    (error) =>
      safeCode(error) === "EMAIL_VERIFICATION_DELIVERY_FAILED" &&
      error.message === "EMAIL_VERIFICATION_DELIVERY_FAILED",
  );
  assert.equal(verificationClient.requests.length, 1);

  const resultClient = new RecordingResendEmailClient();
  resultClient.thrown = new Error("provider transport detail");
  const resultAdapter = new ResendTransactionalEmailAdapterV1(resultClient, {
    fromAddress: "no-reply@example.com",
    fromName: "月の返事",
  });
  const token = Buffer.alloc(32, 92).toString("base64url");
  await assert.rejects(
    () =>
      resultAdapter.sendAssessmentResult({
        recipientEmail: "customer@example.com",
        resultUrl: `https://moon-reply.example/result/${token}`,
        messageIdempotencyKey: "result-notification:error-1",
      }),
    (error) =>
      safeCode(error) === "RESULT_EMAIL_DELIVERY_FAILED" &&
      error.message === "RESULT_EMAIL_DELIVERY_FAILED",
  );
  assert.equal(resultClient.requests.length, 1);

  const invalidIdClient = new RecordingResendEmailClient();
  invalidIdClient.response = { data: { id: "" }, error: null };
  const invalidIdAdapter = new ResendTransactionalEmailAdapterV1(
    invalidIdClient,
    { fromAddress: "no-reply@example.com", fromName: "月の返事" },
  );
  await assert.rejects(
    () =>
      invalidIdAdapter.sendMailboxVerification({
        recipientEmail: "customer@example.com",
        verificationCode: "12345678",
        expiresAt: "2026-08-21T04:00:00.000Z",
        messageIdempotencyKey: "email-challenge:invalid-id",
      }),
    (error) => safeCode(error) === "EMAIL_VERIFICATION_DELIVERY_FAILED",
  );
  assert.equal(invalidIdClient.requests.length, 1);
});

await check("templates and adapter contain no recipient payload logger", () => {
  const provider = readProviderSources();
  const service = readText(servicePath);
  assert.doesNotMatch(provider, /\bconsole\.|\blogger\b|\blog\s*\(/u);
  assert.doesNotMatch(service, /\bconsole\.|\blogger\b|\blog\s*\(/u);
  assert.match(provider, /response\.data\?\.id/u);
  assert.doesNotMatch(provider, /return\s+response\b/u);
});

await check("all production activation defaults remain false", () => {
  const example = parseExampleEnvironment(readText(".env.example"));
  for (const name of [
    "M2_INTERNAL_RUNTIME_ENABLED",
    ...RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS,
    ...RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS,
    "STRIPE_PAYPAY_ENABLED",
  ]) {
    assert.equal(example.get(name), "false", name);
  }
});

await check("F004/F010 migration boundaries remain exact; dependencies change only within F013", () => {
  const accepted = git([
    "ls-tree",
    "-r",
    "--name-only",
    acceptedRelease,
    "--",
    "supabase/migrations",
  ])
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean);
  assertNoDiffFromAcceptedRelease(accepted);
  const baseline = git([
    "ls-tree", "-r", "--name-only", f004Base, "--", "supabase/migrations",
  ]).trim().split(/\r?\n/u).filter(Boolean);
  assertNoDiffFromAcceptedRelease(baseline, f004Base);
  const historicalF004 = git([
    "ls-tree", "-r", "--name-only", f004Head, "--", "supabase/migrations",
  ]).trim().split(/\r?\n/u).filter(Boolean);
  assert.deepEqual(historicalF004, [...baseline, f004Migration].sort());
  const wave2Migrations = git([
    "ls-tree", "-r", "--name-only", wave2Base, "--", "supabase/migrations",
  ]).trim().split(/\r?\n/u).filter(Boolean);
  assert.deepEqual(wave2Migrations, historicalF004);
  for (const migration of wave2Migrations) {
    assert.equal(git(["hash-object", migration]).trim(), git(["rev-parse", `${wave2Base}:${migration}`]).trim(), migration);
  }
  const f013Base = "fcffe9a0a0424c308f70130e95a7f8cb69173779";
  assert.equal(git(["rev-parse", `${f013Base}:package-lock.json`]).trim(), git(["rev-parse", `${wave2Base}:package-lock.json`]).trim());
  assertF013LockDelta({ root });
  const working = readdirSync(path.join(root, "supabase/migrations"))
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => `supabase/migrations/${entry}`);
  assert.deepEqual(working, [
    ...wave2Migrations,
    f010Migration,
  ]);
  assert.deepEqual(
    working.map((entry) => path.posix.basename(entry).slice(0, 4)),
    Array.from({ length: 24 }, (_, index) => String(index + 2).padStart(4, "0")),
  );
  const customerIdentity = readText(
    "supabase/migrations/0014_customer_identity_authority_v1.sql",
  );
  assert.match(customerIdentity, /^begin;/u);
  assert.match(customerIdentity, /commit;\s*$/u);
});

await check("F004 historical scope and current protected source remain exact except F015 preparation gate", () => {
  assert.equal(git(["merge-base", "HEAD", f004Base]).trim(), f004Base);
  assert.equal(git(["merge-base", "HEAD", f004Head]).trim(), f004Head);
  assert.equal(git(["merge-base", "HEAD", wave2Base]).trim(), wave2Base);
  const drift = git([
    "diff",
    "--name-only",
    f004Base,
    f004Head,
    "--",
    ...protectedProductPaths,
  ]).trim().split(/\r?\n/u).filter(Boolean);
  const untracked = git([
    "ls-files", "--others", "--exclude-standard", "--", ...protectedProductPaths,
  ]).trim().split(/\r?\n/u).filter(Boolean);
  assert.deepEqual(untracked, []);
  assert.deepEqual(drift, [
    "lib/assessment/production/application.ts",
    "lib/assessment/production/fakes.ts",
    "lib/assessment/production/notification.ts",
    "lib/assessment/production/supabase-repository.ts",
    "lib/assessment/production/types.ts",
  ]);
  assert.equal(git([
    "diff", "--name-only", f004Head, "--", ...protectedProductPaths,
    ":(exclude)lib/assessment/production/service.ts",
  ]).trim(), "");
  assert.match(readText("components/request/RequestForm.tsx"), /customerAuthEnabled/u);
  assert.match(
    readText("lib/assessment/production/supabase-repository.ts"),
    /issue_rc2_production_assessment_grant_v2/u,
  );
});

await check("F004 routes stay historically unchanged; F010 adds only two Account OTP admissions", () => {
  assert.equal(git(["diff", "--name-only", f004Base, f004Head, "--", "app"]).trim(), "");
  assert.equal(git(["diff", "--name-only", f004Head, wave2Base, "--", "app"]).trim(), "");
  const allowedRoutes = [
    "app/api/auth/account/email-otp/request/route.ts",
    "app/api/auth/account/email-otp/verify/route.ts",
  ];
  const trackedChanges = git([
    "diff",
    "--name-only",
    wave2Base,
    "--",
    "app",
  ]).trim().split(/\r?\n/u).filter(Boolean);
  const untrackedChanges = git([
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    "app",
  ]).trim().split(/\r?\n/u).filter(Boolean);
  assert.deepEqual(untrackedChanges, []);
  assert.deepEqual(trackedChanges.sort(), allowedRoutes);
  for (const [index, route] of allowedRoutes.entries()) {
    const purpose = index === 0 ? "request" : "verify";
    const importLine = 'import { enforceAccountOtpThrottle } from "@/lib/customer-auth/account-otp-throttle-runtime";\n';
    const admissionLine = `    await enforceAccountOtpThrottle("${purpose}", body.email);\n`;
    const source = readText(route).replaceAll("\r\n", "\n");
    assert.equal(source.split(importLine).length - 1, 1, route);
    assert.equal(source.split(admissionLine).length - 1, 1, route);
    assert.equal(
      source.replace(importLine, "").replace(admissionLine, "").trimEnd(),
      git(["show", `${wave2Base}:${route}`]).trimEnd(),
      `${route}: only the durable throttle import and awaited admission may change`,
    );
    assert.ok(
      source.indexOf(admissionLine) < source.indexOf("await (await createCustomerAccountAuthApplication())"),
      `${route}: durable admission must precede Provider creation/call`,
    );
  }
});

if (failures.length > 0) {
  console.error(`FAIL ${failures.length}/${checks + failures.length} checks`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${checks}/${checks} checks`);
}
