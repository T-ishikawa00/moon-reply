import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.endsWith(".ts")
    ) {
      const parentPath = fileURLToPath(context.parentURL);
      const candidate = path.resolve(path.dirname(parentPath), `${specifier}.ts`);
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
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
const read = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");
let passed = 0;

function check(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

async function checkAsync(name, callback) {
  await callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

const requestForm = read("components/request/RequestForm.tsx");
const paymentPanel = read("components/payment/PurchasePaymentPanel.tsx");
const statusUi = read("components/payment/PurchaseReturnStatus.tsx");
const paymentApplication = read("lib/payment/production/application.ts");
const authApplication = read("lib/customer-auth/application.ts");
const continuationRoute = read("app/api/auth/continuations/route.ts");
const googleRoute = read("app/api/auth/google/start/route.ts");
const latencySource = read("lib/customer-auth/latency-measurement.ts");

const {
  createCustomerAuthServerLatencyMeasurement,
  readCustomerAuthServerTiming,
  startGoogleAuthRedirectLatencyMeasurement,
} = await import("../lib/customer-auth/latency-measurement.ts");

check("purchase CTA exposes exact price, unit, recurrence, and Stripe handoff", () => {
  for (const exact of [
    "税込 980円",
    "1相談 / 1鑑定ノート",
    "都度払い・自動更新なし",
    "お支払いに進む",
    "決済画面を準備しています…",
    "次の画面でStripeの安全な決済ページが開きます。",
    "決済内容を確認してからお支払いいただけます。",
  ]) {
    assert.ok(paymentPanel.includes(exact), exact);
  }
  assert.doesNotMatch(paymentPanel, /定期購入|月額|無料/u);
});

check("purchase CTA precedes legal links in the actual confirmation surface", () => {
  const confirmation = requestForm.slice(
    requestForm.indexOf("function LocalPurchaseConfirmation("),
    requestForm.indexOf("export function RequestForm("),
  );
  const panelIndex = confirmation.indexOf("<PurchasePaymentPanel");
  const legalIndex = confirmation.indexOf("<nav className=\"request-purchase-links\"");
  assert.ok(panelIndex > 0);
  assert.ok(legalIndex > panelIndex);
});

check("payment verification truth is explicit for every confirmation-pending branch", () => {
  assert.equal(
    (paymentApplication.match(
      /status: "confirmation_pending", paymentVerified: false/g,
    ) ?? []).length,
    2,
  );
  assert.equal(
    (paymentApplication.match(
      /status: "confirmation_pending", paymentVerified: true/g,
    ) ?? []).length,
    5,
  );
  assert.match(statusUi, /typeof data\.paymentVerified === "boolean"/u);
  assert.doesNotMatch(
    statusUi,
    /data\.status === "confirmation_pending"[\s\S]{0,160}return \{ status: data\.status \};/u,
  );
});

check("post-purchase copy distinguishes unverified, verified, delayed, and completed", () => {
  for (const exact of [
    "決済情報を確認しています",
    "この段階で追加のお支払い操作はしないでください。",
    "お支払いを確認しました",
    "追加のお支払いは必要ありません。",
    "鑑定ノートを作成しています",
    "今夜の答えをまとめています。",
    "お支払いは確認済みです。",
    "鑑定ノートの作成に少し時間がかかっています。",
    "お申し込みは保存されています。",
    "この画面を閉じても大丈夫です。",
    "鑑定ノートはアカウントに保存されます。",
    "完成したらメールでもお知らせします。",
  ]) {
    assert.ok(statusUi.includes(exact), exact);
  }
  assert.match(statusUi, /aria-live="polite"/u);
  assert.match(statusUi, /aria-atomic="true"/u);
  assert.match(statusUi, /完了/u);
  assert.match(statusUi, /現在/u);
  assert.match(statusUi, /次/u);
  assert.doesNotMatch(statusUi, /\d+%|progressbar|setInterval/u);
});

check("completed status accepts only canonical legacy or authenticated result paths", () => {
  assert.match(statusUi, /legacyResultPathPattern\.test\(data\.resultPath\)/u);
  assert.match(
    statusUi,
    /authenticatedResultPathPattern\.test\(data\.resultPath\)/u,
  );
  assert.match(statusUi, /window\.location\.replace\(next\.resultPath\)/u);
});

check("Google click is T0 and all T1-T4 markers surround their actual operations", () => {
  const selectStart = requestForm.indexOf("function selectCustomerAuthMethod(");
  const selectEnd = requestForm.indexOf("function switchToOrganization(");
  const selectSource = requestForm.slice(selectStart, selectEnd);
  assert.ok(
    selectSource.indexOf("startGoogleAuthRedirectLatencyMeasurement()") <
      selectSource.indexOf("void runPhaseFour(method)"),
  );

  const beginStart = requestForm.indexOf("async function beginCustomerAuth(");
  const beginEnd = requestForm.indexOf("async function submitCustomerAuthEmailOtp(");
  const beginSource = requestForm.slice(beginStart, beginEnd);
  for (const marker of [
    "markContinuationStart",
    "markContinuationEnd",
    "markGoogleStart",
    "markGoogleEnd",
    "markAuthorizationUrlReceived",
    "markLocationAssignStart",
  ]) {
    assert.ok(beginSource.includes(marker), marker);
  }
  assert.ok(
    beginSource.indexOf("markContinuationStart") <
      beginSource.indexOf('fetch("/api/auth/continuations"'),
  );
  assert.ok(
    beginSource.indexOf("markGoogleStart") <
      beginSource.indexOf('fetch("/api/auth/google/start"'),
  );
  assert.ok(
    beginSource.indexOf("markLocationAssignStart") <
      beginSource.indexOf("window.location.assign"),
  );
});

check("client T0-T4 durations and server phase parsing are exact and one-shot", () => {
  let nowMs = 0;
  const records = [];
  const measurement = startGoogleAuthRedirectLatencyMeasurement({
    now: () => nowMs,
    report: (record) => records.push(record),
  });
  nowMs = 40;
  measurement.markContinuationStart();
  nowMs = 140;
  measurement.markContinuationEnd(
    "auth_route_total;dur=130, auth_continuation_create;dur=60.4",
  );
  nowMs = 150;
  measurement.markGoogleStart();
  nowMs = 350;
  measurement.markGoogleEnd(
    "auth_continuation_validation;dur=20, auth_oauth_url_generation;dur=150.2",
  );
  nowMs = 360;
  measurement.markAuthorizationUrlReceived();
  nowMs = 362;
  measurement.markLocationAssignStart();
  measurement.markFailed();
  assert.equal(records.length, 1);
  assert.deepEqual(records[0], {
    schema_version: "customer-auth-google-redirect-latency-v1",
    scope: "client",
    outcome: "redirect_ready",
    failed_at: null,
    t0_to_t1_start_ms: 40,
    t1_continuation_round_trip_ms: 100,
    t1_continuation_create_server_ms: 60,
    t2_google_start_round_trip_ms: 200,
    t2_continuation_validation_server_ms: 20,
    t2_oauth_url_generation_server_ms: 150,
    t3_to_t4_handoff_ms: 2,
    t0_to_t4_total_ms: 362,
  });
  assert.deepEqual(
    readCustomerAuthServerTiming(
      "unknown;dur=4, auth_continuation_create;dur=300001, auth_oauth_url_generation;dur=18.8",
    ),
    { oauth_url_generation: 19 },
  );
});

check("client failure records the safe bounded phase without raw error", () => {
  let nowMs = 5;
  const records = [];
  const measurement = startGoogleAuthRedirectLatencyMeasurement({
    now: () => nowMs,
    report: (record) => records.push(record),
  });
  nowMs = 15;
  measurement.markContinuationStart();
  nowMs = 25;
  measurement.markFailed();
  assert.deepEqual(records[0], {
    schema_version: "customer-auth-google-redirect-latency-v1",
    scope: "client",
    outcome: "failed",
    failed_at: "continuation_request",
    t0_to_t1_start_ms: 10,
    t1_continuation_round_trip_ms: null,
    t1_continuation_create_server_ms: null,
    t2_google_start_round_trip_ms: null,
    t2_continuation_validation_server_ms: null,
    t2_oauth_url_generation_server_ms: null,
    t3_to_t4_handoff_ms: null,
    t0_to_t4_total_ms: 20,
  });
  assert.doesNotMatch(JSON.stringify(records[0]), /error|message|stack|token|email/iu);
});

await checkAsync("server measurement returns safe Server-Timing and a bounded record", async () => {
  let nowMs = 100;
  const records = [];
  const latency = createCustomerAuthServerLatencyMeasurement({
    route: "google_start",
    now: () => nowMs,
    report: (record) => records.push(record),
  });
  latency.observe({
    phase: "continuation_validation",
    durationMs: 17.7,
    outcome: "success",
  });
  latency.observe({
    phase: "oauth_url_generation",
    durationMs: 88.2,
    outcome: "success",
  });
  latency.observe({
    phase: "continuation_create",
    durationMs: 400_000,
    outcome: "failure",
  });
  nowMs = 240;
  const response = latency.finish(new Response(null, { status: 204 }), "success");
  assert.equal(
    response.headers.get("Server-Timing"),
    "auth_route_total;dur=140, auth_continuation_validation;dur=18, auth_oauth_url_generation;dur=88",
  );
  assert.deepEqual(records[0], {
    schema_version: "customer-auth-google-redirect-latency-v1",
    scope: "server",
    route: "google_start",
    outcome: "success",
    route_total_ms: 140,
    continuation_create_ms: null,
    continuation_validation_ms: 18,
    oauth_url_generation_ms: 88,
  });
});

check("server phase observers preserve continuation validation before OAuth URL generation", () => {
  const startGoogle = authApplication.slice(
    authApplication.indexOf("async startGoogle("),
    authApplication.indexOf("async requestEmailOtp("),
  );
  assert.ok(
    startGoogle.indexOf("await this.validateContinuation") <
      startGoogle.indexOf('this.measureLatency("oauth_url_generation"'),
  );
  assert.match(authApplication, /"continuation_create"/u);
  assert.match(authApplication, /"continuation_validation"/u);
  assert.match(continuationRoute, /latencyObserver: latency\.observe/u);
  assert.match(googleRoute, /latencyObserver: latency\.observe/u);
});

check("instrumentation retains Customer Auth request security and omits sensitive fields", () => {
  for (const source of [continuationRoute, googleRoute]) {
    assert.match(source, /enforceCustomerAuthSameOrigin/u);
    assert.match(source, /enforceCustomerAuthRateLimit/u);
    assert.match(source, /readStrictJsonRequest/u);
  }
  assert.match(continuationRoute, /equalCustomerAuthSecret/u);
  assert.match(googleRoute, /readAuthContinuationCookie/u);
  assert.doesNotMatch(
    latencySource,
    /recipientEmail|consultationText|preparationCapability|continuationToken|csrfToken|customerUserId|accessToken|refreshToken|rawError|authorizationUrl:/u,
  );
});

check("design note labels the 10-second objective and streaming candidates as unimplemented", () => {
  const note = read("docs/payment/PURCHASE_TRUST_AND_LATENCY_DESIGN_NOTE.md");
  assert.match(note, /roughly 10 seconds/u);
  assert.match(note, /not achieved or claimed/u);
  assert.match(note, /separate authorization/u);
  assert.match(note, /stream durable/iu);
});

console.log(
  `M2 PURCHASE TRUST UX PASS ${passed}/${passed}; REAL_PROVIDER_CALLS=0 REMOTE_OPERATIONS=0`,
);
