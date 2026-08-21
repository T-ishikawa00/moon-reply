import assert from "node:assert/strict";
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
const providerPath = "lib/payment/production/resend-transactional-email.ts";
const servicePath = "lib/payment/production/service.ts";
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
  return git(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"));
}

function assertNoDiffFromAcceptedRelease(relativePaths) {
  try {
    git(["diff", "--quiet", acceptedRelease, "--", ...relativePaths]);
  } catch {
    assert.fail(`accepted authority drift: ${relativePaths.join(", ")}`);
  }
}

function textTrackedFiles(files) {
  const result = [];
  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
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
  const provider = readText(providerPath);
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
  assert.deepEqual(
    sources
      .filter(({ source }) => source.includes(providerSpecificKeyName))
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
  const provider = readText(providerPath);
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

await check("migrations 0002 through 0013 remain byte-identical", () => {
  assertNoDiffFromAcceptedRelease(["supabase/migrations"]);
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
  const working = readdirSync(path.join(root, "supabase/migrations"))
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => `supabase/migrations/${entry}`);
  assert.deepEqual(working, accepted.sort());
  assert.deepEqual(
    working.map((entry) => path.posix.basename(entry).slice(0, 4)),
    ["0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009", "0010", "0011", "0012", "0013"],
  );
});

await check("V17 and Q0 accepted authority remains unchanged", () => {
  assertNoDiffFromAcceptedRelease(protectedProductPaths);
});

await check("Step E changes no application route", () => {
  assertNoDiffFromAcceptedRelease(["app"]);
});

if (failures.length > 0) {
  console.error(`FAIL ${failures.length}/${checks + failures.length} checks`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${checks}/${checks} checks`);
}
