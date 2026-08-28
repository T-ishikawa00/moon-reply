import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const entry = "app/api/consultations/prepare/route.ts";
const extensions = ["", ".ts", ".tsx", ".mts", ".js", ".mjs"];

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function normalize(relativePath) {
  return relativePath.replaceAll("\\", "/");
}

function resolveSourceFile(importer, specifier) {
  let unresolved;
  if (specifier.startsWith("@/")) {
    unresolved = path.join(root, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    unresolved = path.resolve(root, path.dirname(importer), specifier);
  } else {
    return null;
  }
  for (const extension of extensions) {
    for (const candidate of [
      `${unresolved}${extension}`,
      path.join(unresolved, `index${extension}`),
    ]) {
      if (existsSync(candidate) && !path.extname(candidate).match(/^$/u)) {
        return normalize(path.relative(root, candidate));
      }
    }
  }
  throw new Error(`unresolved local import: ${importer} -> ${specifier}`);
}

function staticSpecifiers(relativePath) {
  const ast = ts.createSourceFile(
    relativePath,
    source(relativePath),
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers = [];
  for (const statement of ast.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      (!statement.importClause ||
        (!statement.importClause.isTypeOnly &&
          (statement.importClause.name ||
            !statement.importClause.namedBindings ||
            ts.isNamespaceImport(statement.importClause.namedBindings) ||
            statement.importClause.namedBindings.elements.some(
              (element) => !element.isTypeOnly,
            ))))
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      !statement.isTypeOnly &&
      (!statement.exportClause ||
        ts.isNamespaceExport(statement.exportClause) ||
        statement.exportClause.elements.some((element) => !element.isTypeOnly))
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }
  return specifiers;
}

function dynamicSpecifiers(relativePath) {
  const ast = ts.createSourceFile(
    relativePath,
    source(relativePath),
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return specifiers;
}

const pending = [entry];
const eagerModules = new Set();
const eagerBareImports = new Set();
const lazyEdges = [];
while (pending.length > 0) {
  const relativePath = pending.pop();
  if (eagerModules.has(relativePath)) continue;
  eagerModules.add(relativePath);
  for (const specifier of staticSpecifiers(relativePath)) {
    const resolved = resolveSourceFile(relativePath, specifier);
    if (resolved) pending.push(resolved);
    else eagerBareImports.add(specifier);
  }
  for (const specifier of dynamicSpecifiers(relativePath)) {
    lazyEdges.push(`${relativePath} -> ${specifier}`);
  }
}

assert.deepEqual(lazyEdges.sort(), [
  "lib/assessment/production/service.ts -> ./application-runtime.ts",
  "lib/assessment/production/worker-service.ts -> ./application-runtime.ts",
]);

for (const forbidden of [
  "lib/assessment/production/application-runtime.ts",
  "lib/assessment/production/application.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/openai-transport.ts",
]) {
  assert.equal(eagerModules.has(forbidden), false, `pre-auth eagerly reaches ${forbidden}`);
}
for (const forbidden of ["ajv", "openai", "node:fs", "node:fs/promises"]) {
  assert.equal(
    [...eagerBareImports].some(
      (specifier) => specifier === forbidden || specifier.startsWith(`${forbidden}/`),
    ),
    false,
    `pre-auth eagerly imports ${forbidden}`,
  );
}
for (const required of [
  "lib/assessment/production/provider-free-intake.ts",
  "lib/assessment/production/consultation.ts",
  "lib/assessment/production/capabilities.ts",
  "lib/assessment/production/supabase-repository.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "lib/assessment/runtime/jpy980-product-scope-validation-v1.ts",
  "lib/purchase/prepayment-safety-gate-v1.ts",
]) {
  assert.equal(eagerModules.has(required), true, `pre-auth does not reach ${required}`);
}

const serviceSource = source("lib/assessment/production/service.ts");
const workerSource = source("lib/assessment/production/worker-service.ts");
const runtimeSource = source("lib/assessment/production/application-runtime.ts");
const applicationSource = source("lib/assessment/production/application.ts");
const requestFormSource = source("components/request/RequestForm.tsx");
const continuationRouteSource = source("app/api/auth/continuations/route.ts");
const googleStartRouteSource = source("app/api/auth/google/start/route.ts");
const emailRequestRouteSource = source("app/api/auth/email-otp/request/route.ts");
const authApplicationSource = source("lib/customer-auth/application.ts");
const productionRepositorySource = source("lib/assessment/production/supabase-repository.ts");

assert.match(serviceSource, /await import\(\s*"\.\/application-runtime\.ts"\s*\)/u);
assert.match(workerSource, /await import\(\s*"\.\/application-runtime\.ts"\s*\)/u);
assert.match(runtimeSource, /import\("\.\.\/runtime\/schema-catalog\.ts"\)/u);
assert.match(runtimeSource, /import\("\.\.\/runtime\/openai-transport\.ts"\)/u);
assert.match(runtimeSource, /import\("\.\/application\.ts"\)/u);
assert.match(applicationSource, /this\.providerFreeIntake\.beginProviderFreePreparation/u);

const prepareStart = serviceSource.indexOf("export async function prepareProductionConsultation");
const prepareEnd = serviceSource.indexOf("export async function answerProductionClarification", prepareStart);
const prepareSlice = serviceSource.slice(prepareStart, prepareEnd);
assert.match(prepareSlice, /readPrepaymentComputePolicy\(\)/u);
assert.match(prepareSlice, /return begun/u);
assert.match(prepareSlice, /createApplication\(\)\)\.prepare/u);
assert.doesNotMatch(prepareSlice, /getFreshIdentity|bindAuthenticatedPrepayment|executeAuthenticatedPrepayment/u);

assert.match(requestFormSource, /onClick=\{\(\) => selectCustomerAuthMethod\("google"\)\}/u);
assert.match(requestFormSource, /onClick=\{\(\) => selectCustomerAuthMethod\("email_otp"\)\}/u);
const methodSelectionStart = requestFormSource.indexOf("function selectCustomerAuthMethod");
const methodSelectionEnd = requestFormSource.indexOf("function switchToOrganization", methodSelectionStart);
const methodSelectionSlice = requestFormSource.slice(methodSelectionStart, methodSelectionEnd);
assert.match(methodSelectionSlice, /if \(method === "google"\)[\s\S]*?runPhaseFour\(method\)/u);
const purchaseStart = requestFormSource.indexOf("async function prepareProductionPurchase");
const purchaseEnd = requestFormSource.indexOf("async function submitProductClarification", purchaseStart);
const purchaseSlice = requestFormSource.slice(purchaseStart, purchaseEnd);
assert.match(purchaseSlice, /outcome\.status === "authentication_required"[\s\S]*?beginCustomerAuth\(outcome\.preparationCapability, authMethod\)/u);
const beginAuthStart = requestFormSource.indexOf("async function beginCustomerAuth");
const beginAuthEnd = requestFormSource.indexOf("async function submitCustomerAuthEmailOtp", beginAuthStart);
const beginAuthSlice = requestFormSource.slice(beginAuthStart, beginAuthEnd);
assert.match(beginAuthSlice, /if \(flowKind === "email_otp"\)[\s\S]*?validateEmail\(form\)/u);
assert.match(beginAuthSlice, /if \(flowKind === "google"\)[\s\S]*?fetch\("\/api\/auth\/google\/start"/u);
assert.match(beginAuthSlice, /fetch\("\/api\/auth\/email-otp\/request"/u);
assert.match(continuationRouteSource, /requireCustomerAuthMethod\(body\.flowKind\)/u);
assert.match(googleStartRouteSource, /requireCustomerAuthMethod\("google"\)/u);
assert.match(emailRequestRouteSource, /requireCustomerAuthMethod\("email_otp"\)/u);
assert.match(authApplicationSource, /createContinuation[\s\S]*?flowKind: input\.flowKind/u);
assert.match(authApplicationSource, /startGoogle[\s\S]*?flowKind: "google"/u);
assert.match(authApplicationSource, /requestEmailOtp[\s\S]*?flowKind: "email_otp"/u);

const continueStart = serviceSource.indexOf(
  "export async function continueAuthenticatedProductionPreparation",
);
const continueEnd = serviceSource.indexOf(
  "export async function processProductionNotification",
  continueStart,
);
const continueSlice = serviceSource.slice(continueStart, continueEnd);
assert.match(continueSlice, /input: \{\s*continuationToken: unknown;\s*\}/u);
assert.ok(continueSlice.indexOf("getFreshIdentity()") < continueSlice.indexOf("createApplication()"));
assert.ok(
  continueSlice.indexOf("createApplication()") <
    continueSlice.indexOf("executeAuthenticatedPrepaymentFromContinuation"),
);

const postAuthStart = applicationSource.indexOf(
  "async executeAuthenticatedPrepaymentFromContinuation",
);
const postAuthEnd = applicationSource.indexOf("async prepare", postAuthStart);
const postAuthSlice = applicationSource.slice(postAuthStart, postAuthEnd);
assert.ok(
  postAuthSlice.indexOf("resolvePrepaymentContinuation") <
    postAuthSlice.indexOf("return this.executeAuthenticatedPrepayment"),
);
assert.match(postAuthSlice, /customerUserId: input\.customerUserId/u);
assert.match(postAuthSlice, /continuationTokenHash: input\.continuationTokenHash/u);
assert.match(
  productionRepositorySource,
  /resolvePrepaymentContinuation[\s\S]*?p_customer_user_id: input\.customerUserId[\s\S]*?p_continuation_token_hash: input\.continuationTokenHash/u,
);

const emailVerifyStart = authApplicationSource.indexOf("async verifyEmailOtp");
const emailVerifyEnd = authApplicationSource.indexOf("async completeGoogleCallback", emailVerifyStart);
const emailVerifySlice = authApplicationSource.slice(emailVerifyStart, emailVerifyEnd);
assert.ok(emailVerifySlice.indexOf('flowKind: "email_otp"') < emailVerifySlice.indexOf("bindIdentity"));
const googleCallbackStart = authApplicationSource.indexOf("async completeGoogleCallback");
const googleCallbackEnd = authApplicationSource.indexOf("async getFreshIdentity", googleCallbackStart);
const googleCallbackSlice = authApplicationSource.slice(googleCallbackStart, googleCallbackEnd);
assert.ok(googleCallbackSlice.indexOf('flowKind: "google"') < googleCallbackSlice.indexOf("exchangeGoogleCallback"));
assert.ok(googleCallbackSlice.indexOf("exchangeGoogleCallback") < googleCallbackSlice.indexOf("bindIdentity"));

const verifierState = {
  c1Enabled: true,
  policyReads: 0,
  durableIntakes: 0,
  activeIdentityReads: 0,
  fullFactories: 0,
  fullPrepares: 0,
  postAuthExecutions: 0,
  postAuthInput: null,
  c1ResolutionGuard: false,
  forbiddenResolutions: [],
};
globalThis.__moonReplyC1FastPathVerifier = verifierState;

function dataModule(moduleSource) {
  return `data:text/javascript,${encodeURIComponent(moduleSource)}`;
}

const emptyModule = dataModule("export {};");
const environmentModule = dataModule(`
export const isProductionPreparationAvailable = () => true;
export const isProductionResultAccessAvailable = () => false;
export const readProductionResultEnvironment = () => ({ supabaseUrl: "local", supabaseSecretKey: "local" });
`);
const environmentRuntimeModule = dataModule(`
export const isProductionFulfillmentAvailable = () => true;
export const readProductionAssessmentEnvironment = () => ({ supabaseUrl: "local", supabaseSecretKey: "local" });
export const readProductionPersistenceEnvironment = () => ({ supabaseUrl: "local", supabaseSecretKey: "local" });
`);
const productionRepositoryModule = dataModule(`
const state = globalThis.__moonReplyC1FastPathVerifier;
export class SupabaseProductionFulfillmentRepository {
  async beginPrepaymentIntake(record) {
    state.durableIntakes += 1;
    return {
      disposition: "created",
      executionDisposition: "awaiting_auth",
      preparation: {
        id: record.preparationId,
        requestId: record.requestId,
        idempotencyKeyHash: record.idempotencyKeyHash,
        consultationSnapshotHash: record.consultationSnapshotHash,
        consultationSnapshot: record.consultationSnapshot,
        assessmentInput: record.assessmentInput,
        safetyAuthority: record.safetyAuthority,
        status: "preparing",
        stopReason: null,
        clarificationId: null,
        clarificationCapabilityHash: null,
        clarificationQuestion: null,
        clarificationAnswerFingerprint: null,
        purchaseCapabilityHash: null,
        purchaseReadyAuthority: null,
        purchaseReadyAuthorityHash: null,
        lastErrorCode: null,
        createdAt: record.now,
        updatedAt: record.now,
      },
      request: {},
    };
  }
  async rotateClarificationCapability() {}
  async rotatePurchaseCapability() {}
}
`);
const assessmentRepositoryModule = dataModule(`
export class SupabaseAssessmentRepository {
  async findClarificationById() { return null; }
}
`);
const policyModule = dataModule(`
const state = globalThis.__moonReplyC1FastPathVerifier;
export const isPrepaymentComputeBudgetEnabled = () => state.c1Enabled;
export function readPrepaymentComputePolicy() {
  state.policyReads += 1;
  return { policyVersion: "prepayment-compute-policy-v1", windowSeconds: 3600, maximumProviderInvocations: 3 };
}
`);
const authEnvironmentModule = dataModule("export const isCustomerAuthFoundationEnabled = () => true;");
const authServiceModule = dataModule(`
const state = globalThis.__moonReplyC1FastPathVerifier;
export async function createCustomerIdentityAuthApplication() {
  return { async getFreshIdentity() {
    state.activeIdentityReads += 1;
    return { customerUserId: "c1000000-0000-4000-8000-000000000001", verifiedEmail: "local@example.test", verifiedEmailSource: "google" };
  } };
}
`);
const fullRuntimeModule = dataModule(`
const state = globalThis.__moonReplyC1FastPathVerifier;
export async function createProductionAssessmentApplication() {
  state.fullFactories += 1;
  return {
    async prepare() { state.fullPrepares += 1; return { status: "safety_blocked" }; },
    async executeAuthenticatedPrepaymentFromContinuation(input) {
      state.postAuthExecutions += 1;
      state.postAuthInput = input;
      return { status: "safety_blocked" };
    },
  };
}
`);

function resolveHookFile(specifier, parentURL) {
  if (!parentURL?.startsWith("file:")) return null;
  const importer = normalize(path.relative(root, fileURLToPath(parentURL)));
  const resolved = resolveSourceFile(importer, specifier);
  return resolved ? pathToFileURL(path.join(root, resolved)).href : null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? "";
    if (specifier === "server-only") return { url: emptyModule, shortCircuit: true };
    if (parent.endsWith("/production/service.ts") || parent.endsWith("\\production\\service.ts")) {
      if (specifier === "./environment.ts") return { url: environmentModule, shortCircuit: true };
      if (specifier === "./environment-runtime.ts") return { url: environmentRuntimeModule, shortCircuit: true };
      if (specifier === "./supabase-repository.ts") return { url: productionRepositoryModule, shortCircuit: true };
      if (specifier === "../runtime/supabase-repository.ts") return { url: assessmentRepositoryModule, shortCircuit: true };
      if (specifier === "./prepayment-compute-policy.ts") return { url: policyModule, shortCircuit: true };
      if (specifier === "../../customer-auth/environment.ts") return { url: authEnvironmentModule, shortCircuit: true };
      if (specifier === "../../customer-auth/service.ts") return { url: authServiceModule, shortCircuit: true };
      if (specifier === "./application-runtime.ts") return { url: fullRuntimeModule, shortCircuit: true };
    }
    if (parent.endsWith("/production/worker-service.ts") || parent.endsWith("\\production\\worker-service.ts")) {
      if (specifier === "./environment-runtime.ts") return { url: environmentRuntimeModule, shortCircuit: true };
      if (specifier === "./supabase-repository.ts") return { url: productionRepositoryModule, shortCircuit: true };
      if (specifier === "./application-runtime.ts") return { url: fullRuntimeModule, shortCircuit: true };
    }
    const local = resolveHookFile(specifier, context.parentURL);
    if (local) {
      const relative = normalize(path.relative(root, fileURLToPath(local)));
      if (
        verifierState.c1ResolutionGuard &&
        [
          "lib/assessment/production/application-runtime.ts",
          "lib/assessment/production/application.ts",
          "lib/assessment/runtime/pipeline.ts",
          "lib/assessment/runtime/schema-catalog.ts",
          "lib/assessment/runtime/openai-transport.ts",
        ].includes(relative)
      ) {
        verifierState.forbiddenResolutions.push(relative);
        throw new Error(`C1 resolved forbidden runtime module: ${relative}`);
      }
      return { url: local, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && /\.(?:ts|tsx)$/u.test(url)) {
      const filename = fileURLToPath(url);
      const transpiled = ts.transpileModule(readFileSync(filename, "utf8"), {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          verbatimModuleSyntax: true,
        },
        fileName: filename,
      });
      return { format: "module", source: transpiled.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { ProviderFreeIntakeApplication } = await import(
  "../lib/assessment/production/provider-free-intake.ts"
);
const { FakeProductionFulfillmentRepository } = await import(
  "../lib/assessment/production/fakes.ts"
);
const { FakeAssessmentRepository } = await import(
  "../lib/assessment/runtime/fakes.ts"
);
const { M2RuntimeError } = await import("../lib/assessment/runtime/errors.ts");

const controlled = JSON.parse(
  source("evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-inputs-v1.json"),
);
const safetyCases = JSON.parse(
  source("evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json"),
);
const selected = controlled.cases.find((candidate) => candidate.fixture_id === "ordinary_reply_waiting");
assert.ok(selected);

function consultation(overrides = {}) {
  return {
    ...structuredClone(safetyCases.base_input),
    currentSituation: selected.assessment_input.currentSituation,
    optionalMessage: selected.assessment_input.optionalMessage,
    relationship: selected.assessment_input.relationship,
    requestedTopics: selected.assessment_input.requestedTopics,
    consultationSchemaVersion: "rc1-production-consultation-v1",
    privacyAcknowledged: true,
    ...structuredClone(overrides),
  };
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function coreHarness({ authority = true } = {}) {
  const runtimeRepository = new FakeAssessmentRepository();
  const lifecycleRepository = new FakeProductionFulfillmentRepository(runtimeRepository);
  const computeAuthority = authority
    ? {
        beginCalls: 0,
        async beginPrepaymentIntake(record) {
          this.beginCalls += 1;
          const begun = await lifecycleRepository.beginPreparation(record);
          return { ...begun, executionDisposition: "awaiting_auth" };
        },
      }
    : undefined;
  let capabilityIndex = 0;
  const application = new ProviderFreeIntakeApplication({
    runtimeRepository,
    lifecycleRepository,
    prepaymentComputeAuthority: computeAuthority,
    now: () => "2026-08-28T00:00:00.000Z",
    uuid: () => crypto.randomUUID(),
    capability: () => Buffer.alloc(32, (capabilityIndex += 1)).toString("base64url"),
  });
  return { application, runtimeRepository, lifecycleRepository, computeAuthority };
}

const fresh = coreHarness();
const freshInput = consultation();
const freshKey = crypto.randomUUID();
const first = await fresh.application.beginProviderFreePreparation(freshInput, freshKey);
assert.equal(first.status, "authentication_required");
assert.equal(fresh.lifecycleRepository.preparations.size, 1);
assert.equal(fresh.computeAuthority.beginCalls, 1);
assert.notEqual(first.status, "purchase_ready");
await fresh.application.beginProviderFreePreparation(freshInput, freshKey);
assert.equal(fresh.lifecycleRepository.preparations.size, 1);
assert.equal(fresh.computeAuthority.beginCalls, 2);
await assert.rejects(
  () => fresh.application.beginProviderFreePreparation(
    consultation({ currentSituation: `${freshInput.currentSituation}\nchanged snapshot` }),
    freshKey,
  ),
  (error) => safeCode(error) === "PRODUCTION_IDEMPOTENCY_CONFLICT",
);
assert.equal(fresh.lifecycleRepository.preparations.size, 1);

const safety = coreHarness();
const blocked = await safety.application.beginProviderFreePreparation(
  consultation({
    contactBoundaryState: "urgent_safety",
    requestedAssistanceGoal: "urgent_safety_help",
    currentSituation: "今すぐ自分を傷つけたい気持ちがあります。",
  }),
  crypto.randomUUID(),
);
assert.deepEqual(blocked, { status: "safety_blocked" });
assert.equal(safety.lifecycleRepository.preparations.size, 0);
assert.equal(safety.computeAuthority.beginCalls, 0);

const unavailable = coreHarness({ authority: false });
await assert.rejects(
  () => unavailable.application.beginProviderFreePreparation(freshInput, crypto.randomUUID()),
  (error) => safeCode(error) === "PREPAYMENT_COMPUTE_AUTHORIZATION_REQUIRED",
);

verifierState.c1ResolutionGuard = true;
const service = await import("../lib/assessment/production/service.ts");
const serviceFresh = await service.prepareProductionConsultation(consultation(), crypto.randomUUID());
verifierState.c1ResolutionGuard = false;
assert.equal(serviceFresh.status, "authentication_required");
assert.equal(verifierState.durableIntakes, 1);
assert.equal(verifierState.policyReads, 1);
assert.equal(verifierState.activeIdentityReads, 0, "active session bypassed explicit auth selection");
assert.equal(verifierState.fullFactories, 0);
assert.equal(verifierState.fullPrepares, 0);
assert.deepEqual(verifierState.forbiddenResolutions, []);

verifierState.c1Enabled = false;
await service.prepareProductionConsultation(consultation(), crypto.randomUUID());
assert.equal(verifierState.fullFactories, 1);
assert.equal(verifierState.fullPrepares, 1);

verifierState.c1Enabled = true;
await service.continueAuthenticatedProductionPreparation({ continuationToken: "k".repeat(43) });
assert.equal(verifierState.activeIdentityReads, 1);
assert.equal(verifierState.fullFactories, 2);
assert.equal(verifierState.postAuthExecutions, 1);
assert.equal(
  verifierState.postAuthInput.customerUserId,
  "c1000000-0000-4000-8000-000000000001",
);

console.log(
  `M2_C1_LIGHTWEIGHT_INTAKE_FAST_PATH=PASS eager_modules=${eagerModules.size} durable_logical=1 provider=0 pb=0`,
);
console.log("REAL_PROVIDER_CALLS=0 REMOTE_OPERATIONS=0 OAUTH_EXECUTIONS=0 PAYMENT_OPERATIONS=0");
