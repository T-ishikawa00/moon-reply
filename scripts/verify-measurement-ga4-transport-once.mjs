import assert from "node:assert/strict";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import { Ga4ClientMeasurementAdapter } from "../lib/measurement/adapters.ts";
import { createMeasurementEvent } from "../lib/measurement/events.ts";
import {
  buildGa4PurchaseBody,
  Ga4MeasurementProtocolTransport,
} from "../lib/measurement/ga4.ts";

const TEST_MEASUREMENT_ID_KEY = "GA4_TEST_MEASUREMENT_ID";
const TEST_API_SECRET_KEY = "GA4_TEST_API_SECRET";
const PRODUCTION_MEASUREMENT_ID_DENY_KEY =
  "GA4_PRODUCTION_MEASUREMENT_ID_DENY";
const EXECUTE_CONFIRMATION = "TEST_GA4_ONE_SHOT";
const LANDING_CONFIRMATION = "LANDING_VIEW_CONFIRMED_IN_TEST_GA4";
const PURCHASE_CONFIRMATION = "PURCHASE_CONFIRMED_IN_TEST_GA4";
const measurementIdPattern = /^G-[A-Z0-9]{6,20}$/u;
const apiSecretPattern = /^[A-Za-z0-9_-]{16,100}$/u;
const transactionIdPattern = /^mrp_[A-Za-z0-9_-]{43}$/u;

const operationCounts = {
  validation: 0,
  clientPage: 0,
  purchase: 0,
  stripe: 0,
  supabase: 0,
  customer: 0,
  productionGa4: 0,
};

class SafeVerifierError extends Error {
  constructor(code) {
    super(code);
    this.name = "SafeVerifierError";
    this.code = code;
  }
}

function fail(code) {
  throw new SafeVerifierError(code);
}

function exactMode(argv) {
  if (argv.length === 0 || (argv.length === 1 && argv[0] === "--offline")) {
    return "offline";
  }
  if (
    argv.length === 2 &&
    argv[0] === "--execute" &&
    argv[1] === EXECUTE_CONFIRMATION
  ) {
    return "execute";
  }
  fail("GA4_TRANSPORT_ARGUMENTS_INVALID");
}

function requiredEnvironmentValue(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.length === 0) {
    fail(`${name}_MISSING`);
  }
  return value;
}

function readTestDestination() {
  const measurementId = requiredEnvironmentValue(TEST_MEASUREMENT_ID_KEY);
  const apiSecret = requiredEnvironmentValue(TEST_API_SECRET_KEY);
  const productionMeasurementId = requiredEnvironmentValue(
    PRODUCTION_MEASUREMENT_ID_DENY_KEY,
  );
  if (!measurementIdPattern.test(measurementId)) {
    fail("GA4_TEST_MEASUREMENT_ID_INVALID");
  }
  if (!apiSecretPattern.test(apiSecret)) {
    fail("GA4_TEST_API_SECRET_INVALID");
  }
  if (!measurementIdPattern.test(productionMeasurementId)) {
    fail("GA4_PRODUCTION_MEASUREMENT_ID_DENY_INVALID");
  }
  if (measurementId === productionMeasurementId) {
    fail("GA4_TEST_PRODUCTION_DESTINATION_COLLISION");
  }
  return Object.freeze({ measurementId, apiSecret, productionMeasurementId });
}

function syntheticClientId() {
  return `${randomInt(100_000_000, 1_000_000_000)}.${randomInt(
    100_000_000,
    1_000_000_000,
  )}`;
}

function buildSyntheticEvidence() {
  const clientId = syntheticClientId();
  const sessionId = Math.floor(Date.now() / 1_000);
  const transactionId = `mrp_${randomBytes(32).toString("base64url")}`;
  assert.match(transactionId, transactionIdPattern);

  const clientCalls = [];
  const clientAdapter = new Ga4ClientMeasurementAdapter(
    (...args) => clientCalls.push(args),
    sessionId,
  );
  const clientResult = clientAdapter.dispatch(
    createMeasurementEvent("landing_view", {
      landingPath: "/",
      utmSource: "measurement_transport_test",
      utmMedium: "synthetic",
      utmCampaign: "measurement_r1",
      utmContent: null,
      gclid: null,
    }),
  );
  assert.deepEqual(clientResult, { status: "sent" });
  assert.equal(clientCalls.length, 1);
  assert.equal(clientCalls[0][0], "event");
  assert.equal(clientCalls[0][1], "landing_view");

  const job = Object.freeze({
    id: randomUUID(),
    verifiedPaymentId: randomUUID(),
    environment: "test",
    transactionId,
    clientId,
    sessionId,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    gclid: null,
    landingPath: "/",
    value: 980,
    currency: "JPY",
    state: "processing",
    attemptCount: 1,
  });
  const purchaseBody = buildGa4PurchaseBody(job);
  assert.deepEqual(Object.keys(purchaseBody).sort(), ["client_id", "events"]);
  assert.equal(purchaseBody.events.length, 1);
  assert.equal(purchaseBody.events[0].name, "purchase");
  assert.deepEqual(purchaseBody.events[0].params, {
    transaction_id: transactionId,
    value: 980,
    currency: "JPY",
    session_id: sessionId,
    engagement_time_msec: 1,
  });

  const serialized = JSON.stringify({ clientCalls, purchaseBody }).toLowerCase();
  for (const forbidden of [
    "consultation",
    "intended_message",
    "email",
    "nickname",
    "phone",
    "oauth",
    "profile",
    "safety",
    "stripe",
    "verifiedpaymentid",
    "purchaseintent",
    "cs_test_",
    "pi_",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, "u"));
  }

  return Object.freeze({
    clientCall: Object.freeze(clientCalls[0]),
    clientId,
    job,
    purchaseBody,
    sessionId,
    transactionId,
  });
}

function assertExactGa4Url(url, destination, expectedPath) {
  if (
    url.protocol !== "https:" ||
    url.hostname !== "www.google-analytics.com" ||
    url.port !== "" ||
    url.username !== "" ||
    url.password !== "" ||
    url.hash !== "" ||
    url.pathname !== expectedPath
  ) {
    fail("GA4_TRANSPORT_DESTINATION_REJECTED");
  }
  const keys = [...url.searchParams.keys()].sort();
  if (
    keys.length !== 2 ||
    keys[0] !== "api_secret" ||
    keys[1] !== "measurement_id" ||
    url.searchParams.get("measurement_id") !== destination.measurementId ||
    url.searchParams.get("api_secret") !== destination.apiSecret
  ) {
    fail("GA4_TRANSPORT_CREDENTIAL_BINDING_REJECTED");
  }
  if (url.searchParams.get("measurement_id") === destination.productionMeasurementId) {
    operationCounts.productionGa4 += 1;
    fail("GA4_PRODUCTION_DESTINATION_REJECTED");
  }
}

function parseJsonBody(init) {
  if (
    init?.method !== "POST" ||
    typeof init.body !== "string" ||
    init.headers?.["content-type"] !== "application/json"
  ) {
    fail("GA4_TRANSPORT_REQUEST_SHAPE_REJECTED");
  }
  try {
    return JSON.parse(init.body);
  } catch {
    fail("GA4_TRANSPORT_BODY_INVALID");
  }
}

function createGuardedFetch(destination, purchaseBody) {
  return async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const body = parseJsonBody(init);
    if (url.pathname === "/debug/mp/collect") {
      assertExactGa4Url(url, destination, "/debug/mp/collect");
      if (operationCounts.validation !== 0) {
        fail("GA4_VALIDATION_RETRY_REJECTED");
      }
      assert.deepEqual(body, {
        ...purchaseBody,
        validation_behavior: "ENFORCE_RECOMMENDATIONS",
      });
      operationCounts.validation += 1;
    } else if (url.pathname === "/mp/collect") {
      assertExactGa4Url(url, destination, "/mp/collect");
      if (operationCounts.purchase !== 0) {
        fail("GA4_PURCHASE_RETRY_REJECTED");
      }
      assert.deepEqual(body, purchaseBody);
      operationCounts.purchase += 1;
    } else {
      fail("GA4_TRANSPORT_PATH_REJECTED");
    }
    return fetch(input, init);
  };
}

function ga4Endpoint(pathname, destination) {
  const endpoint = new URL(`https://www.google-analytics.com${pathname}`);
  endpoint.searchParams.set("measurement_id", destination.measurementId);
  endpoint.searchParams.set("api_secret", destination.apiSecret);
  return endpoint;
}

async function validatePurchase(destination, evidence, guardedFetch) {
  const response = await guardedFetch(
    ga4Endpoint("/debug/mp/collect", destination),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...evidence.purchaseBody,
        validation_behavior: "ENFORCE_RECOMMENDATIONS",
      }),
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) fail("GA4_VALIDATION_HTTP_REJECTED");
  let result;
  try {
    result = await response.json();
  } catch {
    fail("GA4_VALIDATION_RESPONSE_INVALID");
  }
  if (!Array.isArray(result?.validationMessages)) {
    fail("GA4_VALIDATION_RESPONSE_INVALID");
  }
  console.log(`VALIDATION_MESSAGES=${result.validationMessages.length}`);
  if (result.validationMessages.length !== 0) {
    result.validationMessages.forEach((message, index) => {
      const code = String(message?.validationCode ?? "UNKNOWN")
        .replace(/[^A-Z0-9_]/gu, "_")
        .slice(0, 80);
      const field = String(message?.fieldPath ?? "UNKNOWN")
        .replace(/[^A-Za-z0-9_.[\]-]/gu, "_")
        .slice(0, 120);
      console.log(`VALIDATION_MESSAGE_${index + 1}=${code}:${field}`);
    });
    console.log("FIX REQUIRED");
    return false;
  }
  console.log("PHASE_1_STRICT_VALIDATION=PASS");
  return true;
}

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function clientHarnessHtml(destination, evidence, origin, nonce) {
  const measurementId = serializeForInlineScript(destination.measurementId);
  const clientId = serializeForInlineScript(evidence.clientId);
  const clientCall = serializeForInlineScript(evidence.clientCall);
  const pageLocation = serializeForInlineScript(`${origin}/_measurement`);
  const pageReferrer = serializeForInlineScript(origin);
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Measurement R1 Test Transport</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(destination.measurementId)}"></script>
  <script nonce="${nonce}">
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", ${measurementId}, {
      client_id: ${clientId},
      session_id: ${evidence.sessionId},
      send_page_view: false,
      debug_mode: true,
      ignore_referrer: true,
      page_location: ${pageLocation},
      page_referrer: ${pageReferrer},
      page_title: "measurement_r1_transport_test",
      cookie_update: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    gtag(...${clientCall});
    document.documentElement.dataset.measurementEvent = "landing_view_sent_once";
  </script>
</head>
<body><p>landing_view queued once for the Test GA4 property. Do not reload.</p></body>
</html>`;
  if (
    html.includes(destination.apiSecret) ||
    html.includes(destination.productionMeasurementId)
  ) {
    fail("CLIENT_HARNESS_SECRET_OR_PRODUCTION_ID_EXPOSURE");
  }
  return html;
}

async function serveClientHarnessOnce(destination, evidence) {
  if (!stdin.isTTY || !stdout.isTTY) fail("GA4_TRANSPORT_INTERACTIVE_TTY_REQUIRED");
  let resolveServed;
  let rejectServed;
  const served = new Promise((resolve, reject) => {
    resolveServed = resolve;
    rejectServed = reject;
  });
  let primaryRequestServed = false;
  const nonce = randomBytes(18).toString("base64");
  const server = createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/") {
      response.writeHead(404, { "cache-control": "no-store" });
      response.end("Not found");
      return;
    }
    if (primaryRequestServed || operationCounts.clientPage !== 0) {
      response.writeHead(410, { "cache-control": "no-store" });
      response.end("One-shot page already served");
      return;
    }
    primaryRequestServed = true;
    operationCounts.clientPage += 1;
    const address = server.address();
    if (!address || typeof address === "string") {
      response.writeHead(500, { "cache-control": "no-store" });
      response.end("Unavailable");
      rejectServed(new SafeVerifierError("CLIENT_HARNESS_ADDRESS_INVALID"));
      return;
    }
    const origin = `http://127.0.0.1:${address.port}`;
    const html = clientHarnessHtml(destination, evidence, origin, nonce);
    const policy = [
      "default-src 'none'",
      `script-src 'nonce-${nonce}' https://www.googletagmanager.com`,
      "connect-src https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
      "img-src data: https://www.google-analytics.com https://*.google-analytics.com",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; ");
    response.writeHead(200, {
      "cache-control": "no-store, max-age=0",
      connection: "close",
      "content-security-policy": policy,
      "content-type": "text/html; charset=utf-8",
      "permissions-policy": "camera=(), geolocation=(), microphone=()",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    });
    response.end(html, () => {
      resolveServed();
      server.close();
    });
  });
  server.on("error", () => rejectServed(new SafeVerifierError("CLIENT_HARNESS_FAILED")));
  await new Promise((resolve, reject) => {
    server.listen({ host: "127.0.0.1", port: 0 }, resolve);
    server.once("error", reject);
  });
  const address = server.address();
  if (!address || typeof address === "string") fail("CLIENT_HARNESS_ADDRESS_INVALID");
  console.log(`PHASE_2_LOCAL_URL=http://127.0.0.1:${address.port}/`);
  console.log("PHASE_2_ACTION=OPEN_ONCE_AND_DO_NOT_RELOAD");
  await served;
  console.log("PHASE_2_LOCAL_PAGE_SERVED=ONCE");
}

async function requireHumanConfirmation(prompt, expected) {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await readline.question(`${prompt}\n> `);
    return answer.trim() === expected;
  } finally {
    readline.close();
  }
}

function printOperationCounts() {
  console.log(`GA4_VALIDATION_CALLS=${operationCounts.validation}`);
  console.log(`GA4_CLIENT_PAGE_SERVES=${operationCounts.clientPage}`);
  console.log(`GA4_PURCHASE_CALLS=${operationCounts.purchase}`);
  console.log(`PRODUCTION_GA4_CALLS=${operationCounts.productionGa4}`);
  console.log(`STRIPE_CALLS=${operationCounts.stripe}`);
  console.log(`SUPABASE_CALLS=${operationCounts.supabase}`);
  console.log(`CUSTOMER_CALLS=${operationCounts.customer}`);
  console.log("SECRET_LOGGING=0");
}

function printOfflinePreflight(evidence) {
  console.log("MODE=offline");
  console.log("DESTINATION_ENV=test");
  console.log("TEST_ID_DISTINCT_FROM_PRODUCTION=true");
  console.log("CLIENT_EVENT=landing_view");
  console.log("PURCHASE_EVENT=purchase");
  console.log(`PURCHASE_TRANSACTION_ID=${evidence.transactionId}`);
  console.log("PURCHASE_VALUE=980");
  console.log("PURCHASE_CURRENCY=JPY");
  printOperationCounts();
  console.log("OFFLINE_PREFLIGHT=PASS");
}

async function executeOneShot(destination, evidence) {
  if (!stdin.isTTY || !stdout.isTTY) fail("GA4_TRANSPORT_INTERACTIVE_TTY_REQUIRED");
  console.log("MODE=execute-test-only");
  console.log("DESTINATION_ENV=test");
  console.log("TEST_ID_DISTINCT_FROM_PRODUCTION=true");
  console.log(`PURCHASE_TRANSACTION_ID=${evidence.transactionId}`);
  const guardedFetch = createGuardedFetch(destination, evidence.purchaseBody);
  const validationPassed = await validatePurchase(
    destination,
    evidence,
    guardedFetch,
  );
  if (!validationPassed) {
    printOperationCounts();
    process.exitCode = 1;
    return;
  }

  await serveClientHarnessOnce(destination, evidence);
  const landingConfirmed = await requireHumanConfirmation(
    `After Test GA4 DebugView shows landing_view, type ${LANDING_CONFIRMATION}`,
    LANDING_CONFIRMATION,
  );
  if (!landingConfirmed) {
    console.log("PHASE_2_HUMAN_CONFIRMATION=NOT_CONFIRMED");
    printOperationCounts();
    console.log("STOP");
    process.exitCode = 1;
    return;
  }
  console.log("PHASE_2_HUMAN_CONFIRMATION=PASS");

  const transport = new Ga4MeasurementProtocolTransport(
    destination.measurementId,
    destination.apiSecret,
    guardedFetch,
  );
  const response = await transport.send(evidence.job);
  console.log(`PURCHASE_HTTP_STATUS=${response.status}`);
  if (response.status < 200 || response.status >= 300) {
    printOperationCounts();
    console.log("FIX REQUIRED");
    process.exitCode = 1;
    return;
  }
  const purchaseConfirmed = await requireHumanConfirmation(
    `After Test GA4 Realtime shows purchase, type ${PURCHASE_CONFIRMATION}`,
    PURCHASE_CONFIRMATION,
  );
  if (!purchaseConfirmed) {
    console.log("PHASE_3_HUMAN_CONFIRMATION=NOT_CONFIRMED");
    printOperationCounts();
    console.log("STOP");
    process.exitCode = 1;
    return;
  }
  console.log("PHASE_3_HUMAN_CONFIRMATION=PASS");
  printOperationCounts();
  console.log("GA4_TRANSPORT_TEST=PASS");
}

async function main() {
  const mode = exactMode(process.argv.slice(2));
  const destination = readTestDestination();
  const evidence = buildSyntheticEvidence();
  if (mode === "offline") {
    printOfflinePreflight(evidence);
    return;
  }
  await executeOneShot(destination, evidence);
}

try {
  await main();
} catch (error) {
  const code =
    error instanceof SafeVerifierError ? error.code : "GA4_TRANSPORT_UNEXPECTED_FAILURE";
  console.error(`ERROR_CODE=${code}`);
  printOperationCounts();
  console.error("STOP");
  process.exitCode = 1;
}
