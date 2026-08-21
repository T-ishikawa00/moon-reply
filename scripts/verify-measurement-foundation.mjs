import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
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
      return { format: "module", source: transpiled.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const root = process.cwd();
const acceptedAuthFoundationRelease =
  "fb90b89de51b91753bbdf25278f4a0e4960a5c6e";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
let passed = 0;

function git(args, encoding = "utf8") {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding, maxBuffer: 256 * 1024 * 1024 },
  );
}

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function files() {
  return git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .filter((entry) => existsSync(path.join(root, entry)))
    .map((entry) => entry.replaceAll("\\", "/"));
}

function check(name, fn) {
  fn();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

async function checkAsync(name, fn) {
  await fn();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

function assertUnchangedFromAccepted(paths) {
  try {
    git(["diff", "--quiet", acceptedAuthFoundationRelease, "--", ...paths]);
  } catch {
    assert.fail(`accepted authority changed: ${paths.join(", ")}`);
  }
}

function occurrences(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function checkoutMethod(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start !== -1 && end > start);
  return source.slice(start, end);
}

function assertCheckoutStartBoundary(method, responseShapeMarker) {
  const request = method.indexOf('fetch("/api/payments/checkout"');
  const responseAccepted = method.indexOf("if (!response.ok)");
  const responseShape = method.indexOf(responseShapeMarker);
  const parsed = method.indexOf("new URL(");
  const origin = method.indexOf(
    'checkoutUrl.origin !== "https://checkout.stripe.com"',
  );
  const username = method.indexOf('checkoutUrl.username !== ""');
  const password = method.indexOf('checkoutUrl.password !== ""');
  const track = method.indexOf(
    'trackClientMeasurement("checkout_start", { provider: "stripe" })',
  );
  const redirect = method.indexOf(
    "window.location.assign(checkoutUrl.toString())",
  );
  const failure = method.indexOf("} catch {");
  assert.ok(
    request !== -1 &&
      responseAccepted > request &&
      responseShape > responseAccepted &&
      parsed > responseShape &&
      origin > parsed &&
      username > parsed &&
      password > parsed &&
      track > Math.max(origin, username, password) &&
      redirect > track &&
      failure > redirect,
  );
  assert.equal(
    occurrences(
      method,
      /trackClientMeasurement\("checkout_start", \{ provider: "stripe" \}\)/gu,
    ),
    1,
  );
}

const allFiles = files();
const eventSource = text("lib/measurement/events.ts");
const clientSource = text("lib/measurement/client.ts");
const serverSource = text("lib/measurement/server.ts");
const adapterSource = text("lib/measurement/adapters.ts");
const measurementSource = [eventSource, clientSource, serverSource, adapterSource]
  .join("\n");
const requestSource = text("components/request/RequestForm.tsx");
const authenticatedCheckoutSource = text(
  "components/payment/AuthenticatedCheckoutButton.tsx",
);
const pageViewSource = text(
  "components/measurement/MeasurementPageView.tsx",
);
const sampleViewSource = text(
  "components/measurement/SampleViewMeasurement.tsx",
);
const paymentApplication = text("lib/payment/production/application.ts");
const emailOtpVerifyRoute = text("app/api/auth/email-otp/verify/route.ts");
const googleCallbackRoute = text("app/api/auth/callback/route.ts");
const envExample = text(".env.example");
const packageJson = JSON.parse(text("package.json"));
const measurementDoc = text(
  "docs/measurement/MEASUREMENT_FOUNDATION_V1.md",
);

const eventsModule = await import(
  pathToFileURL(path.join(root, "lib/measurement/events.ts")).href
);
const serverModule = await import(
  pathToFileURL(path.join(root, "lib/measurement/server.ts")).href
);
const adaptersModule = await import(
  pathToFileURL(path.join(root, "lib/measurement/adapters.ts")).href
);

check("exact V1 event names are locked", () => {
  assert.deepEqual([...eventsModule.MEASUREMENT_EVENT_NAMES], [
    "page_view",
    "sample_view",
    "request_start",
    "request_complete",
    "auth_start",
    "auth_complete",
    "checkout_start",
    "purchase",
  ]);
});

check("typed payload map covers every exact event", () => {
  for (const name of eventsModule.MEASUREMENT_EVENT_NAMES) {
    assert.match(eventSource, new RegExp(`^\\s*${name}: Readonly<`, "mu"));
  }
  assert.match(eventSource, /MeasurementPayloadByName\[CurrentName\]/u);
  assert.match(eventSource, /Name extends MeasurementEventName/u);
});

check("runtime payload allowlist accepts only exact reviewed shapes", () => {
  const transactionId = serverModule.deriveMeasurementTransactionId(
    "10000000-0000-4000-8000-000000000001",
    "measurement-verifier-secret-000000000000000001",
  );
  const fixtures = [
    ["page_view", { page: "home" }, ["page"]],
    ["sample_view", { sample: "public_sample" }, ["sample"]],
    ["request_start", { experience: "consultation_request" }, ["experience"]],
    ["request_complete", { outcome: "purchase_ready" }, ["outcome"]],
    ["auth_start", { method: "google" }, ["method"]],
    ["auth_complete", { method: "email_otp" }, ["method"]],
    ["checkout_start", { provider: "stripe" }, ["provider"]],
    [
      "purchase",
      { transactionId, value: 980, currency: "JPY" },
      ["currency", "transactionId", "value"],
    ],
  ];
  for (const [name, payload, expectedKeys] of fixtures) {
    const event = eventsModule.createMeasurementEvent(name, payload);
    assert.equal(event.name, name);
    assert.deepEqual(Object.keys(event.payload).sort(), expectedKeys);
    assert.equal(Object.isFrozen(event), true);
    assert.equal(Object.isFrozen(event.payload), true);
    assert.throws(() =>
      eventsModule.createMeasurementEvent(name, {
        ...payload,
        email: "forbidden@example.invalid",
      }),
    );
  }
});

check("sensitive Customer and capability fields are absent from payload types", () => {
  assert.doesNotMatch(
    eventSource,
    /consultationText|partnerMessage|draftMessage|nickname|relationshipDetails|requestedTopics|\bemail\s*:|googleEmail|customerUserId|CustomerUserId|auth\.users|preparationCapability|statusCapability|resultToken|resultUrl|deliveryId|purchaseIntentId|verifiedPaymentId|paymentIntentId|checkoutSessionId|stripeEventId|verificationCode|\botp\s*:|accessToken|refreshToken/u,
  );
});

check("purchase economics are fixed at JPY 980", () => {
  assert.equal(eventsModule.MEASUREMENT_PURCHASE_VALUE, 980);
  assert.equal(eventsModule.MEASUREMENT_PURCHASE_CURRENCY, "JPY");
  const transactionId = serverModule.deriveMeasurementTransactionId(
    "10000000-0000-4000-8000-000000000001",
    "measurement-verifier-secret-000000000000000001",
  );
  assert.throws(() =>
    eventsModule.createMeasurementEvent("purchase", {
      transactionId,
      value: 981,
      currency: "JPY",
    }),
  );
  assert.throws(() =>
    eventsModule.createMeasurementEvent("purchase", {
      transactionId,
      value: 980,
      currency: "USD",
    }),
  );
});

check("transaction identity is deterministic opaque dedicated-secret HMAC", () => {
  const paymentId = "10000000-0000-4000-8000-000000000001";
  const secretA = "measurement-verifier-secret-000000000000000001";
  const secretB = "measurement-verifier-secret-000000000000000002";
  const first = serverModule.deriveMeasurementTransactionId(paymentId, secretA);
  const retry = serverModule.deriveMeasurementTransactionId(paymentId, secretA);
  const changedSecret = serverModule.deriveMeasurementTransactionId(
    paymentId,
    secretB,
  );
  assert.equal(first, retry);
  assert.notEqual(first, changedSecret);
  assert.match(first, /^mrp_[A-Za-z0-9_-]{43}$/u);
  assert.equal(first.includes(paymentId), false);
  assert.match(serverSource, /createHmac\(\s*"sha256"/u);
  assert.match(serverSource, /moon-reply:measurement:purchase:v1:/u);
  assert.match(serverSource, /MEASUREMENT_TRANSACTION_SECRET/u);
  assert.doesNotMatch(
    serverSource,
    /PURCHASE_STATUS_SIGNING_SECRET|EMAIL_VERIFICATION_SECRET|CUSTOMER_AUTH_EMAIL|STRIPE_SECRET|SUPABASE_SECRET/u,
  );
});

check("client API cannot dispatch auth_complete or purchase", () => {
  assert.match(clientSource, /"auth_complete" \| "purchase"/u);
  assert.doesNotMatch(clientSource, /createMeasurementEvent\("purchase"/u);
  const clientCallSites = allFiles
    .filter((entry) => /^(app|components)\/.*\.tsx?$/u.test(entry))
    .map((entry) => text(entry))
    .join("\n");
  assert.doesNotMatch(
    clientCallSites,
    /trackClientMeasurement\(\s*"(?:auth_complete|purchase)"/u,
  );
});

check("page_view follows App Router navigation without exposing path data", () => {
  assert.match(pageViewSource, /usePathname\(\)/u);
  assert.match(pageViewSource, /lastMeasuredPathname/u);
  assert.match(pageViewSource, /trackClientMeasurement\("page_view"/u);
  assert.match(pageViewSource, /page:\s*measurementPageArea\(pathname\)/u);
  assert.doesNotMatch(pageViewSource, /payload:\s*\{[^}]*pathname/su);
  for (const dynamicArea of [
    "account_result",
    "purchase_auth",
    "purchase_return",
    "legacy_result",
  ]) {
    assert.match(pageViewSource, new RegExp(`return "${dynamicArea}"`, "u"));
  }
});

check("sample_view is one guarded actual sample-page occurrence", () => {
  assert.match(text("app/sample-report/page.tsx"), /<SampleViewMeasurement \/>/u);
  assert.match(sampleViewSource, /useRef\(false\)/u);
  assert.match(sampleViewSource, /measured\.current = true/u);
  assert.match(sampleViewSource, /trackClientMeasurement\("sample_view"/u);
});

check("request_start is first meaningful form change, never page load", () => {
  assert.match(requestSource, /onChangeCapture=\{measureRequestStart\}/u);
  assert.match(requestSource, /requestStartedMeasured\.current/u);
  assert.equal(
    occurrences(requestSource, /trackClientMeasurement\("request_start"/gu),
    1,
  );
  assert.doesNotMatch(pageViewSource + sampleViewSource, /"request_start"/u);
});

check("request_complete follows decoded purchase_ready only", () => {
  assert.equal(occurrences(requestSource, /measureRequestComplete\(\);/gu), 2);
  assert.match(
    requestSource,
    /if \(outcome\.status === "purchase_ready"\) \{\s*measureRequestComplete\(\);/u,
  );
  assert.match(
    requestSource,
    /if \(!outcome \|\| outcome\.status !== "purchase_ready"\)[\s\S]*?throw new Error\("PRODUCT_CLARIFICATION_INVALID"\);[\s\S]*?measureRequestComplete\(\);/u,
  );
  assert.match(requestSource, /requestCompletedMeasured\.current/u);
});

check("auth_start follows accepted provider start, not button click", () => {
  const googleSuccess = requestSource.indexOf(
    'data?.status !== "redirect_ready"',
  );
  const googleTrack = requestSource.indexOf(
    'trackClientMeasurement("auth_start", { method: "google" })',
  );
  const emailAccepted = requestSource.indexOf('data?.status !== "accepted"');
  const emailTrack = requestSource.indexOf(
    'trackClientMeasurement("auth_start", { method: "email_otp" })',
  );
  assert.ok(googleSuccess !== -1 && googleTrack > googleSuccess);
  assert.ok(emailAccepted !== -1 && emailTrack > emailAccepted);
  assert.ok(
    requestSource.indexOf('authorizationUrl.protocol !== "https:"') <
      googleTrack,
  );
});

check("auth_complete follows successful server binding", () => {
  assert.ok(
    emailOtpVerifyRoute.indexOf("await application.verifyEmailOtp") <
      emailOtpVerifyRoute.indexOf('trackServerAuthComplete("email_otp")'),
  );
  assert.ok(
    googleCallbackRoute.indexOf("await application.completeGoogleCallback") <
      googleCallbackRoute.indexOf('trackServerAuthComplete("google")'),
  );
  assert.doesNotMatch(requestSource, /"auth_complete"/u);
});

check("legacy checkout_start follows its accepted Stripe URL", () => {
  const method = checkoutMethod(
    requestSource,
    "async function startStripeCheckout()",
    "async function handleEmailSubmit",
  );
  assertCheckoutStartBoundary(method, 'data?.status !== "checkout_ready"');
});

check("authenticated checkout_start follows its accepted Stripe URL", () => {
  const method = checkoutMethod(
    authenticatedCheckoutSource,
    "async function startCheckout()",
    "\n  return (",
  );
  assertCheckoutStartBoundary(method, '!("checkoutUrl" in payload.data)');
  const button = authenticatedCheckoutSource.slice(
    authenticatedCheckoutSource.indexOf("\n  return ("),
  );
  assert.doesNotMatch(button, /checkout_start/u);
});

check("checkout_start has exactly the two reviewed client call sites", () => {
  const callSiteFiles = allFiles
    .filter((entry) => /^(app|components)\/.*\.tsx?$/u.test(entry))
    .filter((entry) =>
      text(entry).includes(
        'trackClientMeasurement("checkout_start", { provider: "stripe" })',
      ),
    );
  assert.deepEqual(callSiteFiles.sort(), [
    "components/payment/AuthenticatedCheckoutButton.tsx",
    "components/request/RequestForm.tsx",
  ]);
  assert.equal(
    callSiteFiles.reduce(
      (total, entry) =>
        total +
        occurrences(
          text(entry),
          /trackClientMeasurement\("checkout_start", \{ provider: "stripe" \}\)/gu,
        ),
      0,
    ),
    2,
  );
});

check("server-authoritative measurement module is server-only", () => {
  assert.match(serverSource, /^import "server-only";\r?\n/u);
  assert.doesNotMatch(
    requestSource + authenticatedCheckoutSource + clientSource,
    /measurement\/server/u,
  );
});

check("purchase construction follows durable repository authority", () => {
  const methodStart = paymentApplication.indexOf("async verifyStripeEvidence(");
  const methodEnd = paymentApplication.indexOf(
    "async reconcilePaymentAttempt(",
    methodStart,
  );
  assert.ok(methodStart !== -1 && methodEnd > methodStart);
  const method = paymentApplication.slice(methodStart, methodEnd);
  const durable = method.indexOf(
    "await this.options.repository.recordStripeEvidence",
  );
  const measurement = method.indexOf("trackVerifiedPaymentPurchase(recorded)");
  const returned = method.indexOf("return recorded");
  assert.ok(durable !== -1 && measurement > durable && returned > measurement);
  assert.doesNotMatch(method, /await trackVerifiedPaymentPurchase/u);
  assert.equal(
    occurrences(
      [
        ...allFiles
          .filter((entry) => /^(app|components|lib)\/.*\.tsx?$/u.test(entry))
          .map((entry) => text(entry)),
      ].join("\n"),
      /trackVerifiedPaymentPurchase\(/gu,
    ),
    2,
  );
});

check("purchase is limited to verified and idempotent duplicate records", () => {
  assert.match(serverSource, /\["verified", "duplicate"\]/u);
  assert.match(serverSource, /recorded\.verifiedPaymentId === null/u);
  const previousEnabled = process.env.MEASUREMENT_ENABLED;
  try {
    process.env.MEASUREMENT_ENABLED = "true";
    for (const disposition of [
      "pending",
      "failed",
      "canceled",
      "rejected",
      "stale",
      "conflict",
    ]) {
      assert.equal(
        serverModule.trackVerifiedPaymentPurchase({
          disposition,
          verifiedPaymentId: null,
        }).status,
        "not_applicable",
      );
    }
  } finally {
    if (previousEnabled === undefined) delete process.env.MEASUREMENT_ENABLED;
    else process.env.MEASUREMENT_ENABLED = previousEnabled;
  }
});

check("disabled operation needs no transaction secret", () => {
  const previousEnabled = process.env.MEASUREMENT_ENABLED;
  const previousSecret = process.env.MEASUREMENT_TRANSACTION_SECRET;
  try {
    process.env.MEASUREMENT_ENABLED = "false";
    delete process.env.MEASUREMENT_TRANSACTION_SECRET;
    assert.equal(
      serverModule.trackVerifiedPaymentPurchase({
        disposition: "verified",
        verifiedPaymentId: "10000000-0000-4000-8000-000000000001",
      }).status,
      "disabled",
    );
    assert.equal(serverModule.trackServerAuthComplete("google").status, "disabled");
  } finally {
    if (previousEnabled === undefined) delete process.env.MEASUREMENT_ENABLED;
    else process.env.MEASUREMENT_ENABLED = previousEnabled;
    if (previousSecret === undefined) {
      delete process.env.MEASUREMENT_TRANSACTION_SECRET;
    } else {
      process.env.MEASUREMENT_TRANSACTION_SECRET = previousSecret;
    }
  }
});

check("missing secret and adapter failure cannot escape into Payment", () => {
  const previousEnabled = process.env.MEASUREMENT_ENABLED;
  const previousSecret = process.env.MEASUREMENT_TRANSACTION_SECRET;
  const originalDispatch = adaptersModule.disabledMeasurementAdapter.dispatch;
  try {
    process.env.MEASUREMENT_ENABLED = "true";
    delete process.env.MEASUREMENT_TRANSACTION_SECRET;
    assert.equal(
      serverModule.trackVerifiedPaymentPurchase({
        disposition: "verified",
        verifiedPaymentId: "10000000-0000-4000-8000-000000000001",
      }).status,
      "unavailable",
    );
    process.env.MEASUREMENT_TRANSACTION_SECRET =
      "measurement-verifier-secret-000000000000000001";
    adaptersModule.disabledMeasurementAdapter.dispatch = () => {
      throw new Error("SYNTHETIC_MEASUREMENT_FAILURE");
    };
    assert.equal(
      serverModule.trackVerifiedPaymentPurchase({
        disposition: "verified",
        verifiedPaymentId: "10000000-0000-4000-8000-000000000001",
      }).status,
      "unavailable",
    );
    assert.equal(serverModule.trackServerAuthComplete("google").status, "unavailable");
  } finally {
    adaptersModule.disabledMeasurementAdapter.dispatch = originalDispatch;
    if (previousEnabled === undefined) delete process.env.MEASUREMENT_ENABLED;
    else process.env.MEASUREMENT_ENABLED = previousEnabled;
    if (previousSecret === undefined) {
      delete process.env.MEASUREMENT_TRANSACTION_SECRET;
    } else {
      process.env.MEASUREMENT_TRANSACTION_SECRET = previousSecret;
    }
  }
  assert.match(serverSource, /try \{[\s\S]*?catch \{/u);
});

check("default mode is explicitly disabled and server-only", () => {
  assert.match(envExample, /^MEASUREMENT_ENABLED=false$/mu);
  assert.match(envExample, /^MEASUREMENT_TRANSACTION_SECRET=$/mu);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_MEASUREMENT/u);
  assert.match(serverSource, /process\.env\.MEASUREMENT_ENABLED === "true"/u);
});

check("only the disabled in-process adapter exists", () => {
  assert.match(adapterSource, /class DisabledMeasurementAdapter/u);
  assert.equal(occurrences(adapterSource, /class \w+MeasurementAdapter/gu), 1);
  assert.match(adapterSource, /status: "disabled"/u);
  assert.doesNotMatch(
    measurementSource,
    /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|node:https|node:http|https?:\/\//u,
  );
});

check("measurement has no browser storage, cookie, script, or beacon", () => {
  assert.doesNotMatch(
    measurementSource + pageViewSource + sampleViewSource,
    /document\.cookie|cookies\s*\(|localStorage|sessionStorage|indexedDB|<script|createElement\(\s*["']script|new Image\s*\(|navigator\.sendBeacon/u,
  );
});

check("no analytics or advertising vendor runtime is integrated", () => {
  const productionSource = allFiles
    .filter((entry) => /^(app|components|lib)\/.*\.tsx?$/u.test(entry))
    .map((entry) => text(entry))
    .join("\n");
  assert.doesNotMatch(
    productionSource,
    /\bgtag\b|\bdataLayer\b|\bfbq\b|googletagmanager|google-analytics|connect\.facebook\.net|analytics\.twitter\.com|connect\.facebook\.com\/en_US\/fbevents/u,
  );
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  for (const dependency of Object.keys(dependencies)) {
    assert.doesNotMatch(
      dependency,
      /analytics|segment|mixpanel|amplitude|gtag|gtm|facebook-pixel|meta-pixel|twitter-pixel/iu,
    );
  }
});

check("accepted migrations 0002 through 0014 are byte/identity unchanged", () => {
  const migrationPattern =
    /^supabase\/migrations\/(?:000[2-9]|001[0-4])_[^/]+\.sql$/u;
  const accepted = git([
    "ls-tree",
    "-r",
    "--name-only",
    acceptedAuthFoundationRelease,
    "--",
    "supabase/migrations",
  ])
    .split(/\r?\n/u)
    .filter((entry) => migrationPattern.test(entry));
  const current = allFiles.filter((entry) => migrationPattern.test(entry));
  assert.deepEqual(current.sort(), accepted.sort());
  assertUnchangedFromAccepted(accepted);
});

check("accepted Customer Auth foundation authority remains unchanged", () => {
  const protectedPaths = [
    "proxy.ts",
    "lib/customer-auth/application.ts",
    "lib/customer-auth/cookies.ts",
    "lib/customer-auth/cutover.ts",
    "lib/customer-auth/environment.ts",
    "lib/customer-auth/service.ts",
    "lib/customer-auth/supabase-provider.ts",
    "lib/customer-auth/supabase-repository.ts",
    "lib/customer-auth/types.ts",
    "lib/supabase",
    "scripts/prove-customer-auth-local.mjs",
    "docs/auth",
  ];
  assertUnchangedFromAccepted(protectedPaths);
  const authVerifier = text("scripts/verify-customer-auth-foundation.mjs");
  assert.match(authVerifier, new RegExp(acceptedAuthFoundationRelease, "u"));
  assert.match(authVerifier, /trackVerifiedPaymentPurchase\(recorded\)/u);
  assert.match(authVerifier, /measurementSeam > durableRecord/u);
});

check("Auth route changes are post-success measurement seams only", () => {
  const diff = git([
    "diff",
    "--unified=0",
    acceptedAuthFoundationRelease,
    "--",
    "app/api/auth/callback/route.ts",
    "app/api/auth/email-otp/verify/route.ts",
  ]);
  const mutations = diff
    .split(/\r?\n/u)
    .filter((line) => /^[+-](?![+-])/u.test(line));
  assert.equal(mutations.some((line) => line.startsWith("-")), false);
  assert.equal(mutations.length, 4);
  assert.equal(
    mutations.filter((line) => line.includes("trackServerAuthComplete")).length,
    4,
  );
});

check("release and main authority refs are untouched locally", () => {
  assert.equal(
    git(["rev-parse", "refs/heads/release/private-ready"]).trim(),
    acceptedAuthFoundationRelease,
  );
  assert.equal(git(["rev-parse", "refs/heads/main"]).trim(), expectedMain);
});

check("measurement verifier is registered", () => {
  assert.equal(
    packageJson.scripts["verify:measurement-foundation"],
    "node scripts/verify-measurement-foundation.mjs",
  );
});

check("documentation fixes semantics, mapping, consent, and non-claims", () => {
  for (const name of eventsModule.MEASUREMENT_EVENT_NAMES) {
    assert.equal(measurementDoc.includes(`\`${name}\``), true);
  }
  for (const provider of ["GA4", "Google Ads", "Meta", "X"]) {
    assert.match(measurementDoc, new RegExp(provider, "u"));
  }
  assert.match(measurementDoc, /not connected|接続/u);
  assert.match(measurementDoc, /consent|Consent|同意/u);
  assert.match(measurementDoc, /no legal-compliance claim|法的適合/u);
  assert.match(
    measurementDoc,
    /External purchase adapters may \*\*not\*\* be activated until delivery, retry, and idempotency semantics are separately reviewed/u,
  );
});

check("top status documents record one governed review state and next action", () => {
  for (const relativePath of [
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
  ]) {
    const source = text(relativePath);
    assert.match(source, /MEASUREMENT-FOUNDATION-V1:BEGIN/u);
    const pending =
      /implemented_pending_human_chatgpt_review/u.test(source) &&
      /Human\/ChatGPT review Measurement Foundation V1/u.test(source);
    const accepted =
      /Measurement Foundation V1 accepted_complete/u.test(source) &&
      /Begin Production External Connection \/ Private Dogfood Activation/u.test(
        source,
      );
    assert.notEqual(pending, accepted);
    assert.equal(pending || accepted, true);
    if (accepted) {
      assert.match(source, /eba46539dcd54194d35eae2424be8a60589b452c/u);
    }
  }
});

check("no database or external-provider implementation was added", () => {
  const measurementFiles = allFiles.filter(
    (entry) =>
      entry.startsWith("lib/measurement/") ||
      entry.startsWith("components/measurement/"),
  );
  assert.equal(
    measurementFiles.some((entry) =>
      /migration|supabase|stripe-sdk|google|meta|twitter|provider/iu.test(entry),
    ),
    false,
  );
  assert.doesNotMatch(
    measurementSource,
    /createClient|createServerClient|Stripe\s*\(|googleapis|facebook|twitter|supabase/u,
  );
});

await checkAsync("all event constructors remain synchronous no-op seams", async () => {
  assert.doesNotMatch(clientSource + serverSource + adapterSource, /\basync\b|\bawait\b/u);
});

console.log(`Measurement Foundation V1 verification passed: ${passed}/${passed}`);
