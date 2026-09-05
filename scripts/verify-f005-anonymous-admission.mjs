import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Pure fixture RPC only. No project env file, persistence client, Provider or
// hosting API is loaded. Required settings below are synthetic, never inherited.
let externalCalls = 0;
globalThis.fetch = async () => { externalCalls++; throw new Error("F005_EXTERNAL_CALL_FORBIDDEN"); };
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{};", shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.endsWith(".ts")) return { format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true },
      }).outputText };
    return next(url, context);
  },
});
const settings = {
  ANONYMOUS_ADMISSION_IP_SOURCE: "netlify_context",
  ANONYMOUS_ADMISSION_WINDOW_SECONDS: "600",
  ANONYMOUS_ADMISSION_MAX_REQUESTS_PER_IP: "120",
  ANONYMOUS_ADMISSION_MAX_REQUESTS_GLOBAL: "1200",
  ANONYMOUS_ADMISSION_MAX_INTAKES_PER_IP: "30",
  ANONYMOUS_ADMISSION_MAX_INTAKES_GLOBAL: "300",
  EMAIL_VERIFICATION_SECRET_PEPPER: "f005-synthetic-pepper-for-offline-proof-only",
};
Object.assign(process.env, settings);
const policyModule = await import("../lib/assessment/production/anonymous-admission.ts");
const { readAnonymousAdmissionPolicy, canonicalizeAnonymousAdmissionIp, hashAnonymousAdmissionIp,
  readTrustedAnonymousAdmissionIdentity, requireAnonymousAdmissionReceipt } = policyModule;
const { beginAdmittedPrepaymentIntake, ANONYMOUS_ADMISSION_RPC_TIMEOUT_MS } =
  await import("../lib/assessment/production/anonymous-admission-runtime.ts");
const { SupabaseProductionFulfillmentRepository } = await import("../lib/assessment/production/supabase-repository.ts");
const { hashAccountOtpIdentity } = await import("../lib/customer-auth/account-otp-throttle.ts");
const intake = { disposition: "created", preparation_id: "00000000-0000-4000-8000-000000000001", execution_disposition: "awaiting_auth" };
const receipt = { admission_disposition: "admitted", retry_after_seconds: 0, intake };
const record = { preparationId: intake.preparation_id, requestId: "00000000-0000-4000-8000-000000000002",
  idempotencyKeyHash: "1".repeat(64), consultationSnapshotHash: "2".repeat(64), consultationSnapshot: { fixture: "short consultation" },
  assessmentInput: { currentSituation: "A short ordinary question", optionalMessage: null, relationship: "other", requestedTopics: ["feelings"] },
  safetyAuthority: { purchaseGateSatisfied: true, paymentAuthorityIssued: false }, executionCapabilityHash: "3".repeat(64), now: "2026-09-06T00:00:00.000Z" };
let calls = [], mode = "ok", reply = receipt;
const client = { rpc(name, args) {
  calls.push({ name, args });
  return { async abortSignal(signal) {
    assert.ok(signal instanceof AbortSignal);
    if (mode === "throw") throw new Error("sensitive infrastructure detail");
    if (mode === "missing") return { data: null, error: { message: "missing RPC" } };
    return { data: reply, error: null };
  } };
} };
const isSafe = (status, code) => (error) => error.httpStatus === status && error.safeCode === code && error.message === code;
let passed = 0;
async function check(name, run) { await run(); console.log(`PASS F005 ${++passed} ${name}`); }

await check("required integer policy is explicit, bounded and internally consistent", () => {
  const p = readAnonymousAdmissionPolicy(settings);
  assert.deepEqual(p, { windowSeconds: 600, maximumRequestsPerIp: 120, maximumRequestsGlobal: 1200, maximumIntakesPerIp: 30, maximumIntakesGlobal: 300 });
  for (const name of Object.keys(settings).filter((name) => name.startsWith("ANONYMOUS_ADMISSION_"))) {
    for (const value of [undefined, "", "0", "-1", "1.5", " 600", "600 ", "600x", "9999999999999999999"]) {
      assert.throws(() => readAnonymousAdmissionPolicy({ ...settings, [name]: value }), isSafe(503, "ANONYMOUS_ADMISSION_UNCONFIGURED"));
    }
  }
  for (const override of [{ ANONYMOUS_ADMISSION_IP_SOURCE: "x-forwarded-for" },
    { ANONYMOUS_ADMISSION_WINDOW_SECONDS: "3601" }, { ANONYMOUS_ADMISSION_MAX_REQUESTS_GLOBAL: "119" },
    { ANONYMOUS_ADMISSION_MAX_INTAKES_PER_IP: "121" }, { ANONYMOUS_ADMISSION_MAX_INTAKES_GLOBAL: "29" }]) {
    assert.throws(() => readAnonymousAdmissionPolicy({ ...settings, ...override }), isSafe(503, "ANONYMOUS_ADMISSION_UNCONFIGURED"));
  }
});
await check("canonical IPv4, compressed IPv6 and mapped IPv4 share stable identities", () => {
  assert.equal(canonicalizeAnonymousAdmissionIp("2001:0DB8:0000:0000:0000:0000:0000:0001"), "2001:db8::1");
  for (const value of ["192.0.2.1", "::ffff:192.0.2.1", "0:0:0:0:0:FFFF:C000:201"]) {
    assert.equal(canonicalizeAnonymousAdmissionIp(value), "192.0.2.1");
    assert.equal(hashAnonymousAdmissionIp(value, settings.EMAIL_VERIFICATION_SECRET_PEPPER), hashAnonymousAdmissionIp("192.0.2.1", settings.EMAIL_VERIFICATION_SECRET_PEPPER));
  }
});
await check("ports, forwarded lists, zones, whitespace, hostnames and missing IP fail closed", () => {
  for (const value of [null, undefined, 123, "", "customer.example.test", "192.0.2.1:80", "192.0.2.1,198.51.100.1",
    " 192.0.2.1", "192.0.2.1 ", "[2001:db8::1]", "fe80::1%eth0", "999.1.1.1"]) {
    assert.throws(() => canonicalizeAnonymousAdmissionIp(value), isSafe(503, "ANONYMOUS_ADMISSION_UNAVAILABLE"));
  }
});
await check("HMAC hides IP, separates identities and OTP domain, requires a strong existing pepper", () => {
  const a = hashAnonymousAdmissionIp("192.0.2.1", settings.EMAIL_VERIFICATION_SECRET_PEPPER);
  assert.match(a, /^[0-9a-f]{64}$/u);
  assert.notEqual(a, hashAnonymousAdmissionIp("192.0.2.2", settings.EMAIL_VERIFICATION_SECRET_PEPPER));
  assert.notEqual(a, hashAnonymousAdmissionIp("192.0.2.1", "another-synthetic-secret".repeat(2)));
  assert.notEqual(a, hashAccountOtpIdentity("fixture@example.test", settings.EMAIL_VERIFICATION_SECRET_PEPPER));
  assert.throws(() => hashAnonymousAdmissionIp("192.0.2.1", "too-short"), isSafe(503, "ANONYMOUS_ADMISSION_UNCONFIGURED"));
});
await check("missing platform context is rejected before RPC even with spoofed forwarded headers", async () => {
  const request = new Request("https://fixture.example.test/api/consultations/prepare", { headers: {
    "x-forwarded-for": "192.0.2.1", "x-real-ip": "192.0.2.1", "x-nf-client-connection-ip": "192.0.2.1", cookie: "attempt=changed",
  } });
  assert.equal(request.headers.get("x-forwarded-for"), "192.0.2.1");
  for (const context of [undefined, { context: null }, { context: {} }, { context: { ip: "invalid" } }]) {
    globalThis.Netlify = context;
    const before = calls.length;
    await assert.rejects(() => beginAdmittedPrepaymentIntake(client, record), isSafe(503, "ANONYMOUS_ADMISSION_UNAVAILABLE"));
    assert.equal(calls.length, before);
  }
});
await check("cookie, UUID and body changes cannot choose admission identity; different trusted IP can", async () => {
  globalThis.Netlify = { context: { ip: "192.0.2.1" } };
  assert.deepEqual(await beginAdmittedPrepaymentIntake(client, record), intake);
  const first = calls.at(-1);
  await beginAdmittedPrepaymentIntake(client, { ...record, idempotencyKeyHash: "4".repeat(64), consultationSnapshot: { fixture: "different" } });
  assert.equal(calls.at(-1).args.p_ip_identity_hash, first.args.p_ip_identity_hash);
  globalThis.Netlify.context.ip = "192.0.2.2";
  await beginAdmittedPrepaymentIntake(client, record);
  assert.notEqual(calls.at(-1).args.p_ip_identity_hash, first.args.p_ip_identity_hash);
  assert.equal(first.name, "begin_production_prepayment_intake_v2");
  assert.equal(Object.keys(first.args).length, 18);
  assert.equal(first.args.p_maximum_requests_per_ip, 120);
  assert.equal(first.args.p_maximum_intakes_global, 300);
  assert.equal(first.args.p_current_situation, record.assessmentInput.currentSituation);
  assert.equal(JSON.stringify(first.args).includes("192.0.2.1"), false);
});
await check("request and intake exhaustion return bounded 429 without fallback or another RPC", async () => {
  for (const disposition of ["request_limited", "intake_limited"]) {
    reply = { admission_disposition: disposition, retry_after_seconds: 600, intake: null };
    const before = calls.length;
    await assert.rejects(() => beginAdmittedPrepaymentIntake(client, record), isSafe(429, "ANONYMOUS_ADMISSION_LIMITED"));
    assert.equal(calls.length, before + 1);
  }
  reply = receipt;
});
await check("same-key changed-body conflict retains existing 409 contract", () => {
  assert.throws(() => requireAnonymousAdmissionReceipt({ admission_disposition: "idempotency_conflict", retry_after_seconds: 0, intake: null }, 600),
    isSafe(409, "PRODUCTION_IDEMPOTENCY_CONFLICT"));
});
await check("existing successful replay receipt preserves all execution states", () => {
  for (const state of ["awaiting_auth", "executing", "awaiting_clarification", "completed", "failed"]) {
    const existing = { ...intake, disposition: "existing", execution_disposition: state };
    assert.deepEqual(requireAnonymousAdmissionReceipt({ ...receipt, intake: existing }, 600), existing);
  }
});
await check("missing RPC, thrown errors and unsafe receipts are sanitized fail closed", async () => {
  for (const next of ["missing", "throw"]) {
    mode = next;
    await assert.rejects(() => beginAdmittedPrepaymentIntake(client, record), isSafe(503, "ANONYMOUS_ADMISSION_UNAVAILABLE"));
  }
  mode = "ok";
  for (const value of [null, {}, [], { ...receipt, unknown: true }, { ...receipt, retry_after_seconds: 1 },
    { ...receipt, intake: { ...intake, preparation_id: "bad" } }, { ...receipt, intake: { ...intake, execution_disposition: "bad" } },
    { admission_disposition: "request_limited", retry_after_seconds: 601, intake: null },
    { admission_disposition: "request_limited", retry_after_seconds: 0, intake: null },
    { admission_disposition: "configuration_mismatch", retry_after_seconds: 0, intake: null },
    { admission_disposition: "unavailable", retry_after_seconds: 0, intake: null }]) {
    reply = value;
    await assert.rejects(() => beginAdmittedPrepaymentIntake(client, record), isSafe(503, "ANONYMOUS_ADMISSION_UNAVAILABLE"));
  }
  reply = receipt;
});
await check("database deadline bounds a never-resolving transport with no blind refund or retry", async () => {
  const originalTimeout = globalThis.setTimeout, originalClear = globalThis.clearTimeout;
  let requested, fire, capturedSignal, cleared, invocations = 0;
  const timer = {};
  globalThis.setTimeout = (callback, milliseconds) => { requested = milliseconds; fire = callback; return timer; };
  globalThis.clearTimeout = (value) => { cleared = value; };
  try {
    const pending = beginAdmittedPrepaymentIntake({ rpc() {
      invocations++;
      return { abortSignal(signal) { capturedSignal = signal; return new Promise(() => {}); } };
    } }, record);
    fire();
    await assert.rejects(pending, isSafe(503, "ANONYMOUS_ADMISSION_UNAVAILABLE"));
    assert.equal(requested, ANONYMOUS_ADMISSION_RPC_TIMEOUT_MS);
    assert.equal(requested, 5000);
    assert.equal(capturedSignal.aborted, true);
    assert.equal(cleared, timer);
    assert.equal(invocations, 1);
  } finally { globalThis.setTimeout = originalTimeout; globalThis.clearTimeout = originalClear; }
});
await check("policy failure and pepper failure perform zero RPC calls", async () => {
  for (const key of ["ANONYMOUS_ADMISSION_IP_SOURCE", "EMAIL_VERIFICATION_SECRET_PEPPER"]) {
    delete process.env[key]; const before = calls.length;
    await assert.rejects(() => beginAdmittedPrepaymentIntake(client, record), isSafe(503, "ANONYMOUS_ADMISSION_UNCONFIGURED"));
    assert.equal(calls.length, before); process.env[key] = settings[key];
  }
  assert.match(readTrustedAnonymousAdmissionIdentity(), /^[0-9a-f]{64}$/u);
});
await check("real repository method admits before hydration and propagates denial with no legacy write", async () => {
  // Bypass only infrastructure construction/row reads; execute the real method
  // and the real runtime helper. No Supabase client or network is constructed.
  const repository = Object.create(SupabaseProductionFulfillmentRepository.prototype);
  repository.client = client;
  let reads = 0;
  const preparation = { id: intake.preparation_id, requestId: record.requestId };
  repository.getPreparationById = async (id) => { reads++; assert.equal(id, preparation.id); return preparation; };
  repository.getRequest = async (id) => { reads++; assert.equal(id, record.requestId); return record.assessmentInput; };
  assert.deepEqual(await repository.beginPrepaymentIntake(record), {
    disposition: "created", executionDisposition: "awaiting_auth", preparation, request: record.assessmentInput,
  });
  assert.equal(calls.at(-1).name, "begin_production_prepayment_intake_v2");
  assert.equal(reads, 2);
  reply = { admission_disposition: "request_limited", retry_after_seconds: 600, intake: null };
  const before = calls.length;
  await assert.rejects(() => repository.beginPrepaymentIntake(record), isSafe(429, "ANONYMOUS_ADMISSION_LIMITED"));
  assert.equal(reads, 2); assert.equal(calls.length, before + 1);
  reply = receipt;
});
await check("new security counter contract stores no raw identity or Customer content", () => {
  const migration = readFileSync("supabase/migrations/0028_f005_anonymous_admission.sql", "utf8");
  const columns = migration.slice(migration.indexOf("create table"), migration.indexOf("create index"));
  assert.doesNotMatch(columns, /\b(?:email|cookie|current_situation|consultation|raw_ip|user_id)\b/u);
  assert.match(migration, /security definer set search_path = '' set lock_timeout = '2s'/u);
  assert.match(migration, /clock_timestamp\(\)/u);
  assert.doesNotMatch(migration, /(?:alter|drop|delete from|update) (?:table )?public\.(?:account_otp|production_prepayment_compute|production_payment|production_notification)/u);
  assert.equal(externalCalls, 0);
});
await check("shared native helpers are unreachable from every browser client entry", () => {
  const root = process.cwd(), files = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (/\.[cm]?[jt]sx?$/u.test(entry.name)) files.push(child);
    }
  };
  for (const directory of ["app", "components", "lib"]) walk(path.join(root, directory));
  const pending = files.filter((file) => /^["']use client["'];/mu.test(readFileSync(file, "utf8")));
  assert.ok(pending.length > 0);
  const visited = new Set();
  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    assert.doesNotMatch(file.replaceAll("\\", "/"), /\/anonymous-admission(?:-runtime)?\.ts$/u);
    const javascript = ts.transpileModule(readFileSync(file, "utf8"), {
      fileName: file, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.Preserve },
    }).outputText;
    const ast = ts.createSourceFile(file, javascript, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const imports = [];
    const visit = (node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(ast);
    for (const specifier of imports) {
      if ((!specifier.startsWith(".") && !specifier.startsWith("@/")) || /\.(?:css|svg|png|jpg)$/u.test(specifier)) continue;
      const base = specifier.startsWith("@/") ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
      const resolved = [base, ...[".ts", ".tsx", ".mts", ".js", ".mjs"].flatMap((extension) => [`${base}${extension}`, path.join(base, `index${extension}`)])]
        .find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
      assert.ok(resolved, `unresolved browser import ${file} -> ${specifier}`);
      pending.push(resolved);
    }
  }
  assert.ok(visited.size > 0);
});
console.log(`F005 anonymous admission: ${passed}/${passed} PASS; external calls=${externalCalls}`);
