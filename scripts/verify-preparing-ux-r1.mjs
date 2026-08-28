import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { PassThrough } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderToPipeableStream } from "react-dom/server";
import ts from "typescript";

const root = process.cwd();
const state = {
  foundationEnabled: true,
  prepaymentEnabled: true,
  identityFails: false,
  identityCalls: 0,
  serviceCalls: 0,
  serviceInputs: [],
  checkoutRenders: 0,
  serviceMode: "outcome",
  serviceOutcome: {
    status: "purchase_ready",
    preparationCapability: "p".repeat(43),
  },
  pendingPromise: null,
  resolvePending: null,
  cookies: new Map([
    ["auth-continuation", "k".repeat(43)],
    ["auth-session-csrf", "c".repeat(43)],
  ]),
  redirects: [],
};
globalThis.__moonReplyPreparingUxVerifier = state;
let networkCalls = 0;
globalThis.fetch = async () => {
  networkCalls += 1;
  throw new Error("UNEXPECTED_NETWORK_CALL");
};

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function dataModule(moduleSource) {
  return `data:text/javascript,${encodeURIComponent(moduleSource)}`;
}

const headersModule = dataModule(`
export async function cookies() {
  return { get(name) {
    const value = globalThis.__moonReplyPreparingUxVerifier.cookies.get(name);
    return value === undefined ? undefined : { value };
  } };
}
`);
const navigationModule = dataModule(`
export function redirect(path) {
  globalThis.__moonReplyPreparingUxVerifier.redirects.push(path);
  throw new Error("REDIRECT:" + path);
}
`);
const linkModule = dataModule("export default function Link({ children }) { return children; }");
const moonSealModule = dataModule("export function MoonSeal() { return \"MOON_SEAL\"; }");
const checkoutModule = dataModule(`
export function AuthenticatedCheckoutButton({ preparationCapability }) {
  globalThis.__moonReplyPreparingUxVerifier.checkoutRenders += 1;
  return preparationCapability ? "MOCK_AUTHENTICATED_CHECKOUT" : "MOCK_LEGACY_CHECKOUT";
}
`);
const policyModule = dataModule(`
export const isPrepaymentComputeBudgetEnabled = () =>
  globalThis.__moonReplyPreparingUxVerifier.prepaymentEnabled;
`);
const cookieConstantsModule = dataModule(`
export const AUTH_CONTINUATION_COOKIE = "auth-continuation";
export const AUTH_SESSION_CSRF_COOKIE = "auth-session-csrf";
`);
const authEnvironmentModule = dataModule(`
export const isCustomerAuthFoundationEnabled = () =>
  globalThis.__moonReplyPreparingUxVerifier.foundationEnabled;
`);
const authServiceModule = dataModule(`
export async function createCustomerIdentityAuthApplication() {
  return { async getFreshIdentity() {
    const state = globalThis.__moonReplyPreparingUxVerifier;
    state.identityCalls += 1;
    if (state.identityFails) throw new Error("CUSTOMER_AUTH_REQUIRED");
    return { customerUserId: "c1000000-0000-4000-8000-000000000001" };
  } };
}
`);
const runtimeErrorModule = dataModule(`
export class M2RuntimeError extends Error {
  constructor(safeCode, httpStatus = 500) {
    super(safeCode);
    this.safeCode = safeCode;
    this.httpStatus = httpStatus;
  }
}
`);
const assessmentServiceModule = dataModule(`
import { M2RuntimeError } from "@/lib/assessment/runtime/errors";
export async function continueAuthenticatedProductionPreparation(input) {
  const state = globalThis.__moonReplyPreparingUxVerifier;
  state.serviceCalls += 1;
  state.serviceInputs.push(input);
  if (state.serviceMode === "pending") return state.pendingPromise;
  if (state.serviceMode === "in_progress") {
    throw new M2RuntimeError("PRODUCTION_PREPARATION_IN_PROGRESS", 409);
  }
  if (state.serviceMode === "throw") throw new Error("SYNTHETIC_PREPARATION_FAILURE");
  return structuredClone(state.serviceOutcome);
}
`);

function resolveLocalModule(specifier, parentURL) {
  if (!parentURL?.startsWith("file:")) return null;
  const unresolved = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(fileURLToPath(parentURL)), specifier)
      : null;
  if (unresolved === null) return null;
  for (const candidate of [
    unresolved,
    `${unresolved}.ts`,
    `${unresolved}.tsx`,
    path.join(unresolved, "index.ts"),
    path.join(unresolved, "index.tsx"),
  ]) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const mocks = new Map([
      ["next/headers", headersModule],
      ["next/navigation", navigationModule],
      ["next/link", linkModule],
      ["@/components/brand/MoonSeal", moonSealModule],
      ["@/components/payment/AuthenticatedCheckoutButton", checkoutModule],
      ["@/lib/assessment/production/prepayment-compute-policy", policyModule],
      ["@/lib/assessment/production/service", assessmentServiceModule],
      ["@/lib/customer-auth/cookies", cookieConstantsModule],
      ["@/lib/customer-auth/environment", authEnvironmentModule],
      ["@/lib/customer-auth/service", authServiceModule],
      ["@/lib/assessment/runtime/errors", runtimeErrorModule],
    ]);
    const mocked = mocks.get(specifier);
    if (mocked) return { url: mocked, shortCircuit: true };
    const local = resolveLocalModule(specifier, context.parentURL);
    if (local) return { url: local, shortCircuit: true };
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

const pageSource = text("app/purchase/auth/continue/page.tsx");
const continuationSource = text(
  "components/request/AuthenticatedPreparationContinuation.tsx",
);
const serviceSource = text("lib/assessment/production/service.ts");
const applicationSource = text("lib/assessment/production/application.ts");
const migrationSource = text(
  "supabase/migrations/0020_m2_c1_prepayment_compute_budget.sql",
);
const callbackSource = text("app/api/auth/callback/route.ts");
const requestFormSource = text("components/request/RequestForm.tsx");
const cssSource = text("app/globals.css");

const resultStart = pageSource.indexOf("async function AuthenticatedPreparationResult");
const pageStart = pageSource.indexOf("export default async function");
assert.ok(resultStart >= 0, "authenticated preparation result boundary missing");
assert.ok(pageStart > resultStart, "page boundary missing or out of order");
const resultSlice = pageSource.slice(resultStart, pageStart);
const pageSlice = pageSource.slice(pageStart);
assert.match(resultSlice, /await continueAuthenticatedProductionPreparation/u);
assert.doesNotMatch(pageSlice, /await continueAuthenticatedProductionPreparation/u);
assert.match(pageSlice, /<Suspense fallback=\{<PreparingScreen \/>\}>/u);
assert.match(pageSlice, /<AuthenticatedPreparationResult/u);
assert.doesNotMatch(
  pageSource,
  /"use client"|useEffect|fetch\(|setInterval|setTimeout|localStorage|EventSource|WebSocket|<progress|aria-valuenow/u,
);
assert.doesNotMatch(pageSource, /\d+%|あと\d+秒|PB-0[1-6]/u);
assert.match(pageSource, /outcome\.status === "purchase_ready"[\s\S]*?<PurchaseConfirmation>/u);
assert.match(pageSource, /if \(outcome === null\) return <FailedScreen \/>/u);
assert.match(
  resultSlice,
  /error instanceof M2RuntimeError[\s\S]*?PRODUCTION_PREPARATION_IN_PROGRESS[\s\S]*?if \(inProgress\) return <InProgressScreen \/>/u,
);
assert.match(
  pageSource,
  /action="\/purchase\/auth\/continue"[\s\S]*?method="get"/u,
);

for (const status of [
  "purchase_ready",
  "not_full_product_candidate",
  "safety_blocked",
  "authentication_required",
  "needs_one_clarifying_answer",
]) {
  assert.match(continuationSource, new RegExp(status, "u"));
}
assert.match(continuationSource, /<AuthenticatedCheckoutButton/u);
assert.match(continuationSource, /\/api\/consultations\/clarifications/u);

const continueStart = serviceSource.indexOf(
  "export async function continueAuthenticatedProductionPreparation",
);
const continueEnd = serviceSource.indexOf(
  "export async function processProductionNotification",
  continueStart,
);
const continueSlice = serviceSource.slice(continueStart, continueEnd);
assert.ok(continueSlice.indexOf("getFreshIdentity()") < continueSlice.indexOf("createApplication()"));
assert.match(continueSlice, /hashCustomerAuthContinuation\(input\.continuationToken\)/u);
const executionStart = applicationSource.indexOf("async executeAuthenticatedPrepayment(input");
const executionEnd = applicationSource.indexOf(
  "async executeAuthenticatedPrepaymentFromContinuation",
  executionStart,
);
const executionSlice = applicationSource.slice(executionStart, executionEnd);
assert.match(executionSlice, /claimPrepaymentExecution/u);
assert.match(executionSlice, /claim\.disposition === "in_progress"[\s\S]*?PRODUCTION_PREPARATION_IN_PROGRESS/u);
assert.match(executionSlice, /claim\.disposition === "completed"[\s\S]*?replayPreparation/u);
assert.match(
  applicationSource,
  /resolvePrepaymentContinuation\(\{[\s\S]*?customerUserId: input\.customerUserId[\s\S]*?if \(!preparationId\) return null/u,
);
assert.match(
  migrationSource,
  /continuation\.continuation_token_hash = p_continuation_token_hash[\s\S]*?continuation\.state = 'consumed'[\s\S]*?binding\.state = 'active'[\s\S]*?binding\.customer_user_id = p_customer_user_id/u,
);
assert.match(
  migrationSource,
  /where preparation_id = p_preparation_id for update[\s\S]*?binding\.customer_user_id <> p_customer_user_id[\s\S]*?state = 'executing'[\s\S]*?return 'in_progress'/u,
);

assert.match(
  callbackSource,
  /await application\.completeGoogleCallback[\s\S]*?redirect\(siteOrigin, "\/purchase\/auth\/continue"\)/u,
);
const emailVerifyStart = requestFormSource.indexOf(
  "async function submitCustomerAuthEmailOtp()",
);
const emailVerifyEnd = requestFormSource.indexOf(
  "async function prepareProductionPurchase(",
  emailVerifyStart,
);
assert.ok(emailVerifyStart >= 0, "email OTP verification flow missing");
assert.ok(emailVerifyEnd > emailVerifyStart, "email OTP verification boundary missing");
const emailVerifySlice = requestFormSource.slice(emailVerifyStart, emailVerifyEnd);
assert.match(
  emailVerifySlice,
  /await fetch\("\/api\/auth\/email-otp\/verify"[\s\S]*?data\?\.status !== "customer_bound"[\s\S]*?router\.push\("\/purchase\/auth\/continue"\)/u,
);
assert.match(cssSource, /\.authenticated-preparing__moon[\s\S]*?var\(--moon-600\)/u);
assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)[^{]*\{ \.authenticated-preparing__moon \{ animation: none; \} \}/u);

const { default: Page } = await import(
  "../app/purchase/auth/continue/page.tsx"
);

function reset(overrides = {}) {
  Object.assign(state, {
    foundationEnabled: true,
    prepaymentEnabled: true,
    identityFails: false,
    identityCalls: 0,
    serviceCalls: 0,
    serviceInputs: [],
    checkoutRenders: 0,
    serviceMode: "outcome",
    serviceOutcome: {
      status: "purchase_ready",
      preparationCapability: "p".repeat(43),
    },
    pendingPromise: null,
    resolvePending: null,
    cookies: new Map([
      ["auth-continuation", "k".repeat(43)],
      ["auth-session-csrf", "c".repeat(43)],
    ]),
    redirects: [],
    ...overrides,
  });
}

function renderStream(element) {
  let html = "";
  let renderError = null;
  let firstChunkResolve;
  let firstChunkReject;
  const firstChunk = new Promise((resolve, reject) => {
    firstChunkResolve = resolve;
    firstChunkReject = reject;
  });
  const completed = new Promise((resolve, reject) => {
    const output = new PassThrough();
    output.setEncoding("utf8");
    output.on("data", (chunk) => {
      html += chunk;
      firstChunkResolve(html);
    });
    output.on("end", () => {
      if (renderError) reject(renderError);
      else resolve(html);
    });
    output.on("error", reject);
    const stream = renderToPipeableStream(element, {
      onShellReady() {
        stream.pipe(output);
      },
      onShellError(error) {
        firstChunkReject(error);
        reject(error);
      },
      onError(error) {
        renderError ??= error;
      },
    });
  });
  return { firstChunk, completed };
}

async function renderComplete() {
  const element = await Page();
  return renderStream(element).completed;
}

reset({ serviceMode: "pending" });
state.pendingPromise = new Promise((resolve) => {
  state.resolvePending = resolve;
});
const pendingElement = await Page();
assert.equal(state.identityCalls, 1);
assert.equal(state.serviceCalls, 0, "PB started before the page returned");
const pendingRender = renderStream(pendingElement);
const shell = await pendingRender.firstChunk;
assert.match(shell, /鑑定の準備をしています/u);
assert.match(shell, /準備ができると、このまま次へ進みます/u);
assert.doesNotMatch(shell, /税込980円|MOCK_(?:AUTHENTICATED|LEGACY)_CHECKOUT/u);
assert.equal(state.serviceCalls, 1);
assert.equal(state.checkoutRenders, 0);
state.resolvePending({
  status: "purchase_ready",
  preparationCapability: "p".repeat(43),
});
const completedPurchase = await pendingRender.completed;
assert.match(completedPurchase, /税込980円/u);
assert.match(completedPurchase, /MOCK_AUTHENTICATED_CHECKOUT/u);
assert.equal(state.checkoutRenders, 1);

for (const { outcome, expectedCopy } of [
  {
    outcome: {
      status: "needs_one_clarifying_answer",
      clarificationCapability: "q".repeat(43),
      target: "material_relationship_or_communication_concern",
      question: "確認です",
      maximumQuestionsTotal: 1,
    },
    expectedCopy: "この回答で鑑定を続ける",
  },
  {
    outcome: { status: "safety_blocked" },
    expectedCopy: "お支払いへ進まずに受付を終了しました",
  },
  {
    outcome: { status: "not_full_product_candidate" },
    expectedCopy: "お支払いへ進まずに受付を終了しました",
  },
  {
    outcome: { status: "authentication_required" },
    expectedCopy: "ご本人確認を完了できませんでした",
  },
]) {
  reset({ serviceOutcome: outcome });
  const html = await renderComplete();
  assert.match(html, new RegExp(expectedCopy, "u"));
  assert.doesNotMatch(html, /税込980円|MOCK_(?:AUTHENTICATED|LEGACY)_CHECKOUT/u);
  assert.equal(state.checkoutRenders, 0);
}

reset({
  serviceOutcome: {
    status: "needs_one_clarifying_answer",
    clarificationCapability: "q".repeat(43),
    target: "material_relationship_or_communication_concern",
    question: "確認です",
    maximumQuestionsTotal: 1,
  },
});
await renderComplete();
await renderComplete();
assert.equal(state.serviceCalls, 2, "each render should reach server authority once");
assert.deepEqual(state.serviceInputs, [
  { continuationToken: "k".repeat(43) },
  { continuationToken: "k".repeat(43) },
]);
assert.equal(state.checkoutRenders, 0);

for (const failure of [
  { serviceOutcome: null },
  { serviceMode: "throw" },
]) {
  reset(failure);
  const html = await renderComplete();
  assert.match(html, /準備状況を確認できませんでした/u);
  assert.match(html, /料金は発生していません/u);
  assert.match(html, /action="\/purchase\/auth\/continue"/u);
  assert.match(html, /method="get"/u);
  assert.match(html, /もう一度確認する/u);
  assert.doesNotMatch(html, /税込980円|MOCK_(?:AUTHENTICATED|LEGACY)_CHECKOUT/u);
  assert.equal(state.checkoutRenders, 0);
}

reset({ serviceMode: "in_progress" });
const inProgress = await renderComplete();
assert.match(inProgress, /鑑定の準備を続けています/u);
assert.match(inProgress, /少し時間を置いてから、準備状況を確認してください/u);
assert.match(inProgress, /action="\/purchase\/auth\/continue"/u);
assert.match(inProgress, /method="get"/u);
assert.match(inProgress, /準備状況を確認する/u);
assert.doesNotMatch(inProgress, /税込980円|MOCK_(?:AUTHENTICATED|LEGACY)_CHECKOUT/u);
assert.equal(state.checkoutRenders, 0);

reset({ prepaymentEnabled: false });
const legacy = await renderComplete();
assert.match(legacy, /税込980円/u);
assert.match(legacy, /MOCK_LEGACY_CHECKOUT/u);
assert.equal(state.serviceCalls, 0);
assert.equal(state.checkoutRenders, 1);

reset({ identityFails: true });
await assert.rejects(() => Page(), /REDIRECT:\/account/u);
assert.equal(state.serviceCalls, 0);

reset({ cookies: new Map() });
await assert.rejects(() => Page(), /REDIRECT:\/account/u);
assert.equal(state.identityCalls, 0);
assert.equal(state.serviceCalls, 0);

assert.equal(networkCalls, 0);
console.log(
  "PREPARING_UX_R1=PASS initial_shell_before_pb=1 purchase=1 clarification=1 safety=1 unsupported=1 auth_failure=1 safe_failure=2 in_progress=1 repeated_render=1 legacy=1",
);
console.log("REAL_PROVIDER_CALLS=0 NETWORK_CALLS=0 REMOTE_OPERATIONS=0 OAUTH_EXECUTIONS=0 PAYMENT_OPERATIONS=0");
