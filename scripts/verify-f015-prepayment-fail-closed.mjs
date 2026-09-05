import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const state = { repositories: 0, intakes: 0, identities: 0, factories: 0, legacyPrepares: 0, answers: [], denyIdentity: false, externalCalls: 0 };
globalThis.__f015 = state;
globalThis.fetch = async () => { state.externalCalls += 1; throw new Error("F015_EXTERNAL_CALL_FORBIDDEN"); };
const moduleUrl = (source) => `data:text/javascript,${encodeURIComponent(source)}`;
const repository = moduleUrl(`
export class SupabaseProductionFulfillmentRepository { constructor() { globalThis.__f015.repositories++; } }
export class SupabaseAssessmentRepository { constructor() { globalThis.__f015.repositories++; } }
`);
const intake = moduleUrl(`
export class ProviderFreeIntakeApplication {
  async beginProviderFreePreparation() { globalThis.__f015.intakes++; return { status: "authentication_required" }; }
}`);
const identity = moduleUrl(`
export async function createCustomerIdentityAuthApplication() {
  return { async getFreshIdentity() {
    globalThis.__f015.identities++;
    if (globalThis.__f015.denyIdentity) throw new Error("F015_FRESH_IDENTITY_REJECTED");
    return { customerUserId: "c1000000-0000-4000-8000-000000000001" };
  } };
}`);
const runtime = moduleUrl(`
export function createProductionAssessmentApplication() {
  globalThis.__f015.factories++;
  return {
    async prepare() { globalThis.__f015.legacyPrepares++; return { status: "legacy_synthetic" }; },
    async answerClarification(...args) { globalThis.__f015.answers.push(args); return { status: "synthetic_answer" }; },
  };
}`);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: moduleUrl("export {};"), shortCircuit: true };
    if (context.parentURL?.endsWith("/production/service.ts")) {
      const replacement = {
        "./supabase-repository.ts": repository,
        "../runtime/supabase-repository.ts": repository,
        "./provider-free-intake.ts": intake,
        "../../customer-auth/service.ts": identity,
        "./application-runtime.ts": runtime,
      }[specifier];
      if (replacement) return { url: replacement, shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const resolved = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (!existsSync(resolved) && existsSync(`${resolved}.ts`)) return { url: pathToFileURL(`${resolved}.ts`).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("file:") && url.endsWith(".ts")) return {
      format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true },
      }).outputText,
    };
    return next(url, context);
  },
});

const service = await import("../lib/assessment/production/service.ts");
const { M2RuntimeError } = await import("../lib/assessment/runtime/errors.ts");
const { isProductionFulfillmentAvailable } = await import("../lib/assessment/production/environment-runtime.ts");
const defaultEnvironment = {
  NODE_ENV: "production",
  PAYMENT_ENVIRONMENT: "live",
  ASSESSMENT_PRODUCTION_PREPARATION_ENABLED: "true",
  ASSESSMENT_PRODUCTION_RUNTIME_ENABLED: "true",
  ASSESSMENT_PRODUCTION_EMERGENCY_STOP: "false",
  PREPAYMENT_COMPUTE_BUDGET_ENABLED: "true",
  PREPAYMENT_COMPUTE_WINDOW_SECONDS: "86400",
  PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS: "50",
  CUSTOMER_AUTH_ENABLED: "true",
  CUSTOMER_AUTH_EMERGENCY_STOP: "false",
  SUPABASE_URL: "https://f015.example.invalid",
  SUPABASE_SECRET_KEY: "synthetic-f015-not-a-credential",
};
const original = Object.fromEntries(Object.keys(defaultEnvironment).map((name) => [name, process.env[name]]));
function configure(overrides = {}) {
  for (const [name, value] of Object.entries({ ...defaultEnvironment, ...overrides })) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
}
const operations = () => ({ repositories: state.repositories, intakes: state.intakes, identities: state.identities,
  factories: state.factories, legacyPrepares: state.legacyPrepares, answers: state.answers.length, externalCalls: state.externalCalls });
let passed = 0;
async function check(name, run) { await run(); console.log(`PASS F015 ${++passed} ${name}`); }
async function rejectsBoth(code, httpStatus = 503) {
  const before = operations();
  for (const action of [
    () => service.prepareProductionConsultation({}, "synthetic-idempotency-key"),
    () => service.answerProductionClarification("synthetic-capability", "synthetic-answer"),
  ]) await assert.rejects(action, (error) => error instanceof M2RuntimeError && error.safeCode === code && error.httpStatus === httpStatus);
  assert.deepEqual(operations(), before, "rejection must precede repository, identity and full runtime construction");
}
try {
  await check("Production disabled, absent and malformed flags reject both entrances", async () => {
    for (const paymentEnvironment of ["live", "test"]) {
      for (const enabled of [undefined, "", "false", "TRUE", " true ", "1"]) {
        configure({ PAYMENT_ENVIRONMENT: paymentEnvironment, PREPAYMENT_COMPUTE_BUDGET_ENABLED: enabled });
        await rejectsBoth("PREPAYMENT_COMPUTE_BUDGET_DISABLED");
        assert.equal(isProductionFulfillmentAvailable(), true, "prepayment config must not stop paid workers");
      }
    }
  });
  await check("enabled but invalid policy fails closed before any dependency is used", async () => {
    for (const [name, invalidValues] of [
      ["PREPAYMENT_COMPUTE_WINDOW_SECONDS", [undefined, "", "0", "59", "2678401", "1e3", " 86400"]],
      ["PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS", [undefined, "", "0", "1001", "1.5", "NaN", "-1"]],
    ]) for (const value of invalidValues) {
      configure({ [name]: value }); await rejectsBoth("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID");
    }
  });
  await check("disabled or emergency-stopped Auth cannot enable either entrance", async () => {
    for (const override of [{ CUSTOMER_AUTH_ENABLED: undefined }, { CUSTOMER_AUTH_ENABLED: "false" }, { CUSTOMER_AUTH_EMERGENCY_STOP: "true" }]) {
      configure(override); await rejectsBoth("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID");
    }
  });
  await check("preparation unavailable retains the existing 404 gate", async () => {
    for (const override of [{ ASSESSMENT_PRODUCTION_PREPARATION_ENABLED: "false" }, { ASSESSMENT_PRODUCTION_EMERGENCY_STOP: "true" }]) {
      configure(override); await rejectsBoth("PRODUCTION_PREPARATION_UNAVAILABLE", 404);
    }
  });
  await check("valid Production preparation uses only provider-free intake", async () => {
    configure(); const before = operations();
    assert.deepEqual(await service.prepareProductionConsultation({}, "synthetic"), { status: "authentication_required" });
    assert.deepEqual(operations(), { ...before, repositories: before.repositories + 2, intakes: before.intakes + 1 });
  });
  await check("valid Production clarification passes fresh identity and the exact configured policy", async () => {
    configure(); const before = operations();
    await service.answerProductionClarification("capability", "answer");
    assert.deepEqual(state.answers.at(-1), ["capability", "answer", {
      customerUserId: "c1000000-0000-4000-8000-000000000001",
      policy: { policyVersion: "m2-c1-prepayment-compute-v1", windowSeconds: 86400, maximumProviderInvocations: 50 },
    }]);
    assert.deepEqual(operations(), { ...before, identities: before.identities + 1, factories: before.factories + 1, answers: before.answers + 1 });
  });
  await check("fresh identity rejection never invokes the full clarification runtime", async () => {
    configure(); state.denyIdentity = true; const before = operations();
    await assert.rejects(() => service.answerProductionClarification("capability", "answer"), /F015_FRESH_IDENTITY_REJECTED/u);
    assert.deepEqual(operations(), { ...before, identities: before.identities + 1 }); state.denyIdentity = false;
  });
  await check("development and test preserve the existing disabled-budget synthetic lane", async () => {
    for (const mode of ["development", "test"]) {
      configure({ NODE_ENV: mode, PREPAYMENT_COMPUTE_BUDGET_ENABLED: "false" }); const before = operations();
      assert.deepEqual(await service.prepareProductionConsultation({}, "synthetic"), { status: "legacy_synthetic" });
      await service.answerProductionClarification("capability", "answer");
      assert.deepEqual(state.answers.at(-1), ["capability", "answer"]);
      assert.deepEqual(operations(), { ...before, factories: before.factories + 2, legacyPrepares: before.legacyPrepares + 1, answers: before.answers + 1 });
    }
  });
  assert.equal(state.externalCalls, 0);
  console.log(`F015 prepayment fail-closed: ${passed}/${passed} PASS; external calls=0`);
} finally {
  for (const [name, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
}
