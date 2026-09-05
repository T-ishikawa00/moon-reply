import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DiscordOperatorWebhookClient,
  OperatorNotificationConfigurationError,
  deriveOperatorOrderReference,
  formatOperatorDiscordNotification,
} from "../lib/payment/production/operator-notification.ts";
import { runOperatorNotificationSchedule } from "../lib/payment/production/operator-notification-scheduler.ts";
import {
  isProductionOperatorNotificationScheduleEnabled,
  runConfiguredProductionOperatorNotificationSchedule,
} from "../lib/payment/production/operator-notification-runtime-service.ts";
import productionFulfillmentDispatchScheduled, {
  isPublishedProductionOperatorNotificationDeploy,
  runProductionFulfillmentDispatchScheduled,
} from "../netlify/functions/production-fulfillment-dispatch-scheduled.mts";

const root = process.cwd();
const acceptedAuthority = "67129271d1d6a2af4e519c7f211e68b9666339b9";
const migrationPath =
  "supabase/migrations/0022_operator_discord_notifications_r1.sql";
const webhookUrl = `https://discord.com/api/webhooks/${"1".repeat(17)}/${"A".repeat(64)}`;
const messageId = "2".repeat(17);
let passed = 0;
let fakeFetchCalls = 0;

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8" },
  ).replace(/\r?\n$/u, "");
}

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function fakeFetch(responseFactory) {
  return async (input, init) => {
    fakeFetchCalls += 1;
    return responseFactory(input, init);
  };
}

async function withProcessEnvironment(values, proof) {
  const before = new Map(
    Object.keys(values).map((name) => [name, process.env[name]]),
  );
  try {
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    return await proof();
  } finally {
    for (const [name, value] of before) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

async function runDeployContextProof(context, dispatchEnabled = false) {
  const calls = {
    operatorEnableGateEvaluations: 0,
    operatorLaneRuns: 0,
    discordSecretReads: 0,
    databaseScans: 0,
    discordFetches: 0,
    customerDispatchRuns: 0,
  };
  const diagnostics = [];
  const response = await withProcessEnvironment(
    {
      PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED:
        dispatchEnabled ? "true" : "false",
      DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
      DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
    },
    () => runProductionFulfillmentDispatchScheduled(context, {
      isOperatorNotificationScheduleEnabled() {
        calls.operatorEnableGateEvaluations += 1;
        return true;
      },
      async runDispatchSchedule() {
        calls.customerDispatchRuns += 1;
        return { customerDispatch: true };
      },
      async runOperatorNotificationSchedule() {
        calls.operatorLaneRuns += 1;
        calls.discordSecretReads += 1;
        calls.databaseScans += 1;
        calls.discordFetches += 1;
        return { operatorNotifications: true };
      },
      diagnosticLogger(event) {
        diagnostics.push(event);
      },
    }),
  );
  return { calls, diagnostics, response };
}

function assertNoOperatorSideEffects(calls) {
  assert.equal(calls.operatorEnableGateEvaluations, 0);
  assert.equal(calls.operatorLaneRuns, 0);
  assert.equal(calls.discordSecretReads, 0);
  assert.equal(calls.databaseScans, 0);
  assert.equal(calls.discordFetches, 0);
}

const newPurchase = {
  notificationType: "new_purchase",
  purchaseIntentId: "11111111-2222-4333-8444-555555555555",
  paymentState: "verified",
  amount: 980,
  currency: "jpy",
  eventOccurredAt: "2026-08-30T01:02:03.000Z",
};
const deliveryComplete = {
  ...newPurchase,
  notificationType: "delivery_complete",
  deliveryState: "complete",
  elapsedSeconds: 69,
};
const actionRequired = {
  ...newPurchase,
  notificationType: "action_required",
  incidentCode: "delivery_pending_15m",
  deliveryState: "pending",
  fulfillmentState: "retryable",
  elapsedSeconds: 900,
};

await check("authority and diff stay inside Operator Discord R1", () => {
  const reviewedImplementation = "d2a6aa57d8618f166251ae38f2bbc7c60f884e6b";
  const wave3Base = "3a13bd1d06a658becd07f05dae8ef6328b285ac8";
  assert.equal(git(["merge-base", "HEAD", acceptedAuthority]), acceptedAuthority);
  assert.equal(git(["merge-base", "HEAD", reviewedImplementation]), reviewedImplementation);
  assert.equal(git(["merge-base", "HEAD", wave3Base]), wave3Base);
  const allowed = new Set([
    ".env.example",
    "lib/payment/production/operator-notification-runtime-service.ts",
    "lib/payment/production/operator-notification-scheduler.ts",
    "lib/payment/production/operator-notification-supabase-repository.ts",
    "lib/payment/production/operator-notification.ts",
    "netlify/functions/production-fulfillment-dispatch-scheduled.mts",
    "package.json",
    "scripts/verify-operator-discord-notifications-r1.mjs",
    migrationPath,
  ]);
  // Preserve the original exact historical manifest. Later authorized waves
  // are not changes to the accepted R1 implementation.
  const trackedChanged = git(["diff", "--name-only", acceptedAuthority, reviewedImplementation])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"));
  assert.deepEqual(trackedChanged.sort(), [...allowed].sort());
  for (const protectedPath of [
    "lib/payment/production/application.ts",
    "lib/assessment/production/application.ts",
    "lib/assessment/production/notification.ts",
    "services/stripe-webhook-ingress",
  ]) {
    assert.equal(
      git(["diff", "--name-only", acceptedAuthority, reviewedImplementation, "--", protectedPath]),
      "",
      protectedPath,
    );
  }
  assert.equal(git(["diff", "--name-only", wave3Base, "--", migrationPath,
    "lib/payment/production/operator-notification-runtime-service.ts",
    "lib/payment/production/operator-notification-scheduler.ts",
    "netlify/functions/production-fulfillment-dispatch-scheduled.mts"]), "");
  assert.deepEqual(git(["diff", "--name-only", wave3Base, "--", "lib/payment/production/operator-notification*"]).split(/\r?\n/u).filter(Boolean), [
    "lib/payment/production/operator-notification-supabase-repository.ts",
    "lib/payment/production/operator-notification.ts",
  ]);
});

await check("configuration is exact-true, default-off, and has an emergency stop", () => {
  const example = text(".env.example");
  assert.match(example, /^DISCORD_OPERATOR_NOTIFICATIONS_ENABLED=false$/mu);
  assert.match(
    example,
    /^DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP=false$/mu,
  );
  assert.match(
    example,
    /^DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM=$/mu,
  );
  assert.match(example, /^DISCORD_OPERATOR_WEBHOOK_URL=$/mu);
  assert.equal(isProductionOperatorNotificationScheduleEnabled({}), false);
  assert.equal(
    isProductionOperatorNotificationScheduleEnabled({
      DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "TRUE",
    }),
    false,
  );
  assert.equal(
    isProductionOperatorNotificationScheduleEnabled({
      DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
      DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "true",
    }),
    false,
  );
  assert.equal(
    isProductionOperatorNotificationScheduleEnabled({
      DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
      DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
    }),
    true,
  );
});

await check("production published deploy can evaluate and enter the operator gate", async () => {
  const context = {
    deploy: { context: "production", published: true },
  };
  assert.equal(isPublishedProductionOperatorNotificationDeploy(context), true);
  const { calls, diagnostics, response } = await runDeployContextProof(context);
  assert.equal(calls.operatorEnableGateEvaluations, 1);
  assert.equal(calls.operatorLaneRuns, 1);
  assert.equal(calls.discordSecretReads, 1);
  assert.equal(calls.databaseScans, 1);
  assert.equal(calls.discordFetches, 1);
  assert.deepEqual(diagnostics, [{
    diagnostic: "operator_discord_r1",
    reason_code: "OPERATOR_ENTER_RUNTIME",
    deploy_present: true,
    deploy_context: "production",
    published: true,
    production_guard_pass: true,
    enabled_parse_result: true,
    emergency_stop_parse_result: false,
  }]);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    dispatch: { customerDispatch: true },
    operatorNotifications: { operatorNotifications: true },
    purchaseMeasurement: { disabled: true },
  });
});

await check("production context enters the operator gate when published is false", async () => {
  const context = {
    deploy: { context: "production", published: false },
  };
  assert.equal(isPublishedProductionOperatorNotificationDeploy(context), true);
  const { calls, diagnostics, response } = await runDeployContextProof(context);
  assert.equal(calls.operatorEnableGateEvaluations, 1);
  assert.equal(calls.operatorLaneRuns, 1);
  assert.equal(calls.discordSecretReads, 1);
  assert.equal(calls.databaseScans, 1);
  assert.equal(calls.discordFetches, 1);
  assert.equal(diagnostics[0]?.reason_code, "OPERATOR_ENTER_RUNTIME");
  assert.equal(diagnostics[0]?.published, false);
  assert.equal(diagnostics[0]?.production_guard_pass, true);
  assert.equal(response.status, 200);
  assert.equal(
    isPublishedProductionOperatorNotificationDeploy({
      deploy: { context: "production" },
    }),
    true,
  );
});

await check("deploy preview blocks the operator lane", async () => {
  const context = {
    deploy: { context: "deploy-preview", published: true },
  };
  assert.equal(isPublishedProductionOperatorNotificationDeploy(context), false);
  const { calls, diagnostics, response } = await runDeployContextProof(context);
  assertNoOperatorSideEffects(calls);
  assert.equal(calls.customerDispatchRuns, 0);
  assert.equal(diagnostics[0]?.reason_code, "OPERATOR_SKIP_NON_PRODUCTION");
  assert.equal(diagnostics[0]?.deploy_context, "deploy-preview");
  assert.deepEqual(await response.json(), { disabled: true });
});

await check("branch deploy blocks operator work without blocking customer dispatch", async () => {
  const context = {
    deploy: { context: "branch-deploy", published: true },
  };
  assert.equal(isPublishedProductionOperatorNotificationDeploy(context), false);
  const { calls, diagnostics, response } = await runDeployContextProof(context, true);
  assertNoOperatorSideEffects(calls);
  assert.equal(calls.customerDispatchRuns, 1);
  assert.equal(diagnostics[0]?.reason_code, "OPERATOR_SKIP_NON_PRODUCTION");
  assert.deepEqual(await response.json(), {
    dispatch: { customerDispatch: true },
    operatorNotifications: { disabled: true },
    purchaseMeasurement: { disabled: true },
  });
  const failedDispatch = await withProcessEnvironment(
    { PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED: "true" },
    () => runProductionFulfillmentDispatchScheduled(context, {
      isOperatorNotificationScheduleEnabled() {
        throw new Error("OPERATOR_ENABLE_GATE_FORBIDDEN");
      },
      async runDispatchSchedule() {
        throw new Error("CUSTOMER_DISPATCH_FAILURE");
      },
      async runOperatorNotificationSchedule() {
        throw new Error("OPERATOR_LANE_FORBIDDEN");
      },
    }),
  );
  assert.equal(failedDispatch.status, 500);
  assert.deepEqual(await failedDispatch.json(), {
    dispatch: { failed: true },
    operatorNotifications: { disabled: true },
    purchaseMeasurement: { disabled: true },
  });
});

await check("preview, dev, and unknown contexts block the operator lane", async () => {
  for (const deployContext of ["preview-server", "dev-server", "future-context"]) {
    const context = {
      deploy: { context: deployContext, published: true },
    };
    assert.equal(isPublishedProductionOperatorNotificationDeploy(context), false);
    const { calls, diagnostics, response } = await runDeployContextProof(context);
    assertNoOperatorSideEffects(calls);
    assert.equal(calls.customerDispatchRuns, 0);
    assert.equal(diagnostics[0]?.reason_code, "OPERATOR_SKIP_NON_PRODUCTION");
    assert.deepEqual(await response.json(), { disabled: true });
  }
});

await check("unavailable runtime context fails closed", async () => {
  assert.equal(isPublishedProductionOperatorNotificationDeploy(undefined), false);
  const { calls, diagnostics, response } = await runDeployContextProof(undefined);
  assertNoOperatorSideEffects(calls);
  assert.equal(calls.customerDispatchRuns, 0);
  assert.equal(
    diagnostics[0]?.reason_code,
    "OPERATOR_SKIP_CONTEXT_UNAVAILABLE",
  );
  assert.equal(diagnostics[0]?.deploy_present, false);
  assert.deepEqual(await response.json(), { disabled: true });
});

await check("activation gate logs exact boolean-only disabled reasons", async () => {
  for (const testCase of [
    {
      enabled: "false",
      emergencyStop: "false",
      reasonCode: "OPERATOR_SKIP_DISABLED",
    },
    {
      enabled: "true",
      emergencyStop: "true",
      reasonCode: "OPERATOR_SKIP_EMERGENCY_STOP",
    },
  ]) {
    const diagnostics = [];
    let operatorRuns = 0;
    const response = await withProcessEnvironment(
      {
        PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED: "false",
        DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: testCase.enabled,
        DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP:
          testCase.emergencyStop,
      },
      () => runProductionFulfillmentDispatchScheduled(
        { deploy: { context: "production", published: true } },
        {
          async runOperatorNotificationSchedule() {
            operatorRuns += 1;
            throw new Error("OPERATOR_LANE_FORBIDDEN");
          },
          diagnosticLogger(event) {
            diagnostics.push(event);
          },
        },
      ),
    );
    assert.equal(operatorRuns, 0);
    assert.deepEqual(await response.json(), { disabled: true });
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].reason_code, testCase.reasonCode);
    assert.equal(
      diagnostics[0].enabled_parse_result,
      testCase.enabled === "true",
    );
    assert.equal(
      diagnostics[0].emergency_stop_parse_result,
      testCase.emergencyStop === "true",
    );
  }
});

await check("disabled runtime stops before secret, database, and transport access", async () => {
  let repositoryCreations = 0;
  let transportCreations = 0;
  const environment = {
    DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "false",
    get DISCORD_OPERATOR_WEBHOOK_URL() {
      throw new Error("SECRET_READ_FORBIDDEN");
    },
    get SUPABASE_SECRET_KEY() {
      throw new Error("SECRET_READ_FORBIDDEN");
    },
  };
  assert.deepEqual(
    await runConfiguredProductionOperatorNotificationSchedule({
      environment,
      createRepository() {
        repositoryCreations += 1;
        throw new Error("DATABASE_CLIENT_FORBIDDEN");
      },
      createTransport() {
        transportCreations += 1;
        throw new Error("TRANSPORT_FORBIDDEN");
      },
    }),
    { disabled: true },
  );
  assert.equal(repositoryCreations, 0);
  assert.equal(transportCreations, 0);
});

await check("ACTIVE_FROM requires canonical UTC and stops before client creation", async () => {
  let clientCreations = 0;
  const diagnostics = [];
  await assert.rejects(
    () =>
      runConfiguredProductionOperatorNotificationSchedule({
        environment: {
          DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
          DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
          DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM: "2026-08-30 00:00:00Z",
          DISCORD_OPERATOR_WEBHOOK_URL: webhookUrl,
          PAYMENT_PROVIDER_ENVIRONMENT: "test",
          SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_SECRET_KEY: "fake",
        },
        createRepository() {
          clientCreations += 1;
          throw new Error("CLIENT_CREATION_FORBIDDEN");
        },
        diagnosticLogger(event) {
          diagnostics.push(event);
        },
      }),
    (error) =>
      error?.safeCode === "OPERATOR_NOTIFICATION_CONFIGURATION_INVALID",
  );
  assert.equal(clientCreations, 0);
  assert.deepEqual(diagnostics, [
    {
      diagnostic: "operator_discord_r1",
      reason_code: "OPERATOR_RUNTIME_CONFIGURATION",
      active_from_present: true,
      active_from_parse_valid: false,
      webhook_secret_present: true,
    },
    {
      diagnostic: "operator_discord_r1",
      reason_code: "OPERATOR_SKIP_ACTIVE_FROM_INVALID",
      active_from_present: true,
      active_from_parse_valid: false,
      webhook_secret_present: true,
    },
  ]);
});

await check("missing ACTIVE_FROM and webhook stop with safe reason codes", async () => {
  for (const testCase of [
    {
      activeFrom: undefined,
      webhook: webhookUrl,
      reasonCode: "OPERATOR_SKIP_ACTIVE_FROM_MISSING",
    },
    {
      activeFrom: "2026-08-30T00:00:00.000Z",
      webhook: undefined,
      reasonCode: "OPERATOR_SKIP_WEBHOOK_MISSING",
    },
  ]) {
    const diagnostics = [];
    let repositoryCreations = 0;
    await assert.rejects(
      () => runConfiguredProductionOperatorNotificationSchedule({
        environment: {
          DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
          DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
          DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM: testCase.activeFrom,
          DISCORD_OPERATOR_WEBHOOK_URL: testCase.webhook,
          PAYMENT_PROVIDER_ENVIRONMENT: "test",
          SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_SECRET_KEY: "test-only-not-a-real-secret",
        },
        createRepository() {
          repositoryCreations += 1;
          throw new Error("REPOSITORY_CREATION_FORBIDDEN");
        },
        diagnosticLogger(event) {
          diagnostics.push(event);
        },
      }),
      (error) =>
        error?.safeCode === "OPERATOR_NOTIFICATION_CONFIGURATION_INVALID",
    );
    assert.equal(repositoryCreations, 0);
    assert.equal(diagnostics.at(-1)?.reason_code, testCase.reasonCode);
  }
});

await check("operator configuration failure is fail-open for customer dispatch", async () => {
  const response = await withProcessEnvironment(
    {
      PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED: "false",
      DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
      DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
      DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM: undefined,
      DISCORD_OPERATOR_WEBHOOK_URL: undefined,
      PAYMENT_PROVIDER_ENVIRONMENT: undefined,
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
    },
    () => productionFulfillmentDispatchScheduled(undefined, {
      deploy: { context: "production", published: true },
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    dispatch: { disabled: true },
    operatorNotifications: { failed: true },
    purchaseMeasurement: { disabled: true },
  });
});

await check("operator rejection cannot fail a successful customer dispatch", async () => {
  const response = await withProcessEnvironment(
    { PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED: "true" },
    () => runProductionFulfillmentDispatchScheduled(
      { deploy: { context: "production", published: false } },
      {
        isOperatorNotificationScheduleEnabled: () => true,
        runDispatchSchedule: async () => ({ customerDispatch: true }),
        runOperatorNotificationSchedule: async () => {
          throw new Error("SAFE_TEST_OPERATOR_FAILURE");
        },
        diagnosticLogger() {},
      },
    ),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    dispatch: { customerDispatch: true },
    operatorNotifications: { failed: true },
    purchaseMeasurement: { disabled: true },
  });
});

await check("three fixed mobile formats expose no raw identifier or PII", () => {
  const operatorId = "3".repeat(17);
  const a = formatOperatorDiscordNotification(newPurchase);
  const b = formatOperatorDiscordNotification(deliveryComplete);
  const c = formatOperatorDiscordNotification(actionRequired, operatorId);
  assert.match(a.content, /💰 NEW PURCHASE/u);
  assert.match(a.content, /¥980/u);
  assert.match(a.content, /Payment: verified/u);
  assert.match(a.content, /2026-08-30 10:02:03 JST/u);
  assert.match(b.content, /✅ DELIVERY COMPLETE/u);
  assert.match(b.content, /Payment → Delivery:/u);
  assert.match(c.content, /🚨 ACTION REQUIRED/u);
  assert.match(c.content, /Do not charge the Customer again/u);
  assert.match(c.content, /Do not retry blindly/u);
  assert.match(c.content, /Do not refund blindly/u);
  assert.match(c.content, /Stripe \/ DB authoritative state/u);
  assert.doesNotMatch(
    [a.content, b.content, c.content].join("\n"),
    new RegExp(newPurchase.purchaseIntentId, "u"),
  );
  assert.deepEqual(a.allowed_mentions, { parse: [] });
  assert.deepEqual(b.allowed_mentions, { parse: [] });
  assert.deepEqual(c.allowed_mentions, { parse: [], users: [operatorId] });
  assert.match(c.content, new RegExp(`<@${operatorId}>`, "u"));
  assert.equal(deriveOperatorOrderReference(newPurchase.purchaseIntentId).length, 20);
  for (const forbidden of [
    "consultation",
    "candidate",
    "email",
    "oauth",
    "report body",
    "provider_payment_id",
  ]) {
    assert.doesNotMatch(
      [a.content, b.content, c.content].join("\n").toLowerCase(),
      new RegExp(forbidden, "u"),
    );
  }
});

await check("C1, C2, and C3 are narrow validated incidents", () => {
  const manual = formatOperatorDiscordNotification({
    ...actionRequired,
    paymentState: "manual_review",
    incidentCode: "manual_review",
    fulfillmentState: "manual_review",
  });
  const exhausted = formatOperatorDiscordNotification({
    ...actionRequired,
    incidentCode: "payment_fulfillment_retry_exhausted",
    fulfillmentState: "retry_exhausted",
  });
  assert.match(manual.content, /Payment state requires operator review/u);
  assert.match(manual.content, /Payment: manual_review/u);
  assert.match(exhausted.content, /retry_exhausted/u);
  assert.throws(() =>
    formatOperatorDiscordNotification({
      ...actionRequired,
      elapsedSeconds: 899,
    }),
  );
  assert.throws(() =>
    formatOperatorDiscordNotification({
      ...actionRequired,
      incidentCode: "manual_review",
      fulfillmentState: "pending",
    }),
  );
  assert.throws(() =>
    formatOperatorDiscordNotification({
      ...actionRequired,
      paymentState: "manual_review",
    }),
  );
});

await check("webhook URL is Discord-only and errors never expose its token", () => {
  new DiscordOperatorWebhookClient(webhookUrl, fakeFetch(() => new Response()), 1_000);
  for (const invalid of [
    "http://discord.com/api/webhooks/1/token",
    `https://discord.com.evil.example/api/webhooks/${"1".repeat(17)}/${"A".repeat(64)}`,
    `${webhookUrl}?leak=true`,
    `${webhookUrl}#fragment`,
  ]) {
    assert.throws(
      () => new DiscordOperatorWebhookClient(invalid),
      (error) =>
        error instanceof OperatorNotificationConfigurationError &&
        error.message === "DISCORD_OPERATOR_WEBHOOK_URL_INVALID" &&
        !error.message.includes(invalid),
    );
  }
});

await check("valid Discord response proves sent with exactly one fake POST", async () => {
  const requests = [];
  const client = new DiscordOperatorWebhookClient(
    webhookUrl,
    fakeFetch(async (input, init) => {
      requests.push({ input: String(input), init });
      return new Response(JSON.stringify({ id: messageId }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }),
    1_000,
  );
  const result = await client.send(formatOperatorDiscordNotification(newPurchase));
  assert.deepEqual(result, {
    outcome: "sent",
    providerMessageReference: messageId,
  });
  assert.equal(requests.length, 1);
  assert.match(requests[0].input, /\?wait=true$/u);
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.redirect, "error");
});

await check("429 is the only retryable HTTP class and Retry-After is bounded", async () => {
  const client = new DiscordOperatorWebhookClient(
    webhookUrl,
    fakeFetch(() =>
      Promise.resolve(
        new Response("", { status: 429, headers: { "retry-after": "9999" } }),
      ),
    ),
    1_000,
  );
  assert.deepEqual(
    await client.send(formatOperatorDiscordNotification(newPurchase)),
    {
      outcome: "retryable",
      errorCode: "DISCORD_RATE_LIMITED",
      retryAfterSeconds: 900,
    },
  );
});

await check("definitive 4xx is terminal while 408, 5xx, and invalid success are ambiguous", async () => {
  for (const [status, expected] of [
    [400, "terminal_failure"],
    [401, "terminal_failure"],
    [403, "terminal_failure"],
    [408, "ambiguous"],
    [500, "ambiguous"],
    [503, "ambiguous"],
    [204, "ambiguous"],
  ]) {
    const client = new DiscordOperatorWebhookClient(
      webhookUrl,
      fakeFetch(() => Promise.resolve(new Response("", { status }))),
      1_000,
    );
    assert.equal(
      (await client.send(formatOperatorDiscordNotification(newPurchase))).outcome,
      expected,
      String(status),
    );
  }
});

await check("network and timeout outcomes are ambiguous without hidden retry", async () => {
  let networkAttempts = 0;
  const network = new DiscordOperatorWebhookClient(
    webhookUrl,
    async () => {
      fakeFetchCalls += 1;
      networkAttempts += 1;
      throw new Error("secret raw provider error");
    },
    1_000,
  );
  assert.deepEqual(
    await network.send(formatOperatorDiscordNotification(newPurchase)),
    {
      outcome: "ambiguous",
      errorCode: "DISCORD_NETWORK_AMBIGUOUS",
    },
  );
  assert.equal(networkAttempts, 1);

  let timeoutAttempts = 0;
  const timeout = new DiscordOperatorWebhookClient(
    webhookUrl,
    async (_input, init) => {
      fakeFetchCalls += 1;
      timeoutAttempts += 1;
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    },
    1_000,
  );
  assert.deepEqual(
    await timeout.send(formatOperatorDiscordNotification(newPurchase)),
    {
      outcome: "ambiguous",
      errorCode: "DISCORD_TIMEOUT_AMBIGUOUS",
    },
  );
  assert.equal(timeoutAttempts, 1);
});

await check("scheduler is bounded, fenced before POST, and keeps failures local", async () => {
  const calls = [];
  const claims = [
    { notificationId: "n1", notification: newPurchase },
    { notificationId: "n2", notification: deliveryComplete },
    { notificationId: "n3", notification: actionRequired },
    { notificationId: "n4", notification: actionRequired },
  ];
  const repository = {
    async claimBatch(input) {
      calls.push(["claim", input]);
      return claims;
    },
    async beginSend(input) {
      calls.push(["begin", input.notificationId]);
      return input.notificationId === "n4" ? "superseded" : "ready";
    },
    async complete(input) {
      calls.push(["complete", input.notificationId]);
    },
    async finish(input) {
      calls.push(["finish", input.notificationId, input.outcome]);
    },
  };
  const outcomes = [
    { outcome: "sent", providerMessageReference: messageId },
    {
      outcome: "retryable",
      errorCode: "DISCORD_RATE_LIMITED",
      retryAfterSeconds: 5,
    },
    { outcome: "ambiguous", errorCode: "DISCORD_SERVER_AMBIGUOUS" },
  ];
  let sends = 0;
  const result = await runOperatorNotificationSchedule({
    repository,
    transport: {
      async send() {
        sends += 1;
        calls.push(["send", sends]);
        return outcomes.shift();
      },
    },
    ownerId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    environment: "test",
    activeFrom: "2026-08-30T00:00:00.000Z",
    now: () => new Date("2026-08-30T01:30:00.000Z"),
  });
  assert.deepEqual(result, {
    claimed: 4,
    sent: 1,
    retryable: 1,
    ambiguous: 1,
    terminalFailures: 0,
    superseded: 1,
    processingFailures: 0,
  });
  assert.equal(sends, 3);
  assert.deepEqual(
    calls.filter(([name]) => name === "begin").map(([, id]) => id),
    ["n1", "n2", "n3", "n4"],
  );
  assert.deepEqual(
    calls.filter(([name]) => name === "complete").map(([, id]) => id),
    ["n1"],
  );
  assert.deepEqual(
    calls.filter(([name]) => name === "finish").map((entry) => entry.slice(1)),
    [
      ["n2", "retryable"],
      ["n3", "ambiguous"],
    ],
  );
});

await check("migration is dedicated, cutoff-bound, and ambiguity-safe", () => {
  const migration = text(migrationPath);
  assert.match(
    migration,
    /create table public\.production_operator_notification_outbox/u,
  );
  assert.match(
    migration,
    /create table public\.production_operator_notification_cutovers/u,
  );
  assert.match(migration, /event_key text not null unique/u);
  assert.match(migration, /'new_purchase'/u);
  assert.match(migration, /'delivery_complete'/u);
  assert.match(migration, /'action_required'/u);
  assert.match(migration, /interval '15 minutes'/u);
  assert.match(migration, /p_active_from/u);
  assert.match(migration, /OPERATOR_NOTIFICATION_ACTIVE_FROM_CONFLICT/u);
  assert.match(migration, /on conflict \(environment\) do nothing/u);
  assert.match(
    migration,
    /case when verified\.id is null then 'manual_review' else 'verified' end/u,
  );
  assert.match(migration, /or incident_code = 'manual_review'/u);
  assert.match(
    migration,
    /operator_outbox\.source_occurred_at >= p_active_from/u,
  );
  assert.match(migration, /send_started_at/u);
  assert.match(migration, /'ambiguous'/u);
  assert.match(migration, /for update skip locked/u);
  assert.match(migration, /delivery_pending_15m/u);
  assert.match(migration, /PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED/u);
  assert.doesNotMatch(migration, /payment_fulfillment_terminal/u);
  for (const returnedField of [
    "notification_id uuid",
    "payment_state text",
    "delivery_state text",
    "fulfillment_state text",
    "event_occurred_at timestamptz",
    "elapsed_seconds bigint",
  ]) {
    assert.match(migration, new RegExp(returnedField, "u"));
  }
  assert.match(
    migration,
    /begin_production_operator_notification_send_v1/u,
  );
  assert.match(migration, /complete_production_operator_notification_v1/u);
  assert.match(migration, /finish_production_operator_notification_v1/u);
  assert.match(migration, /enable row level security/u);
  assert.match(migration, /revoke all/u);
  assert.match(
    migration,
    /grant select, insert on table public\.production_operator_notification_cutovers/u,
  );
  assert.doesNotMatch(
    migration,
    /webhook_url|consultation|candidate_message|experience_projection_json|email_ciphertext|oauth/iu,
  );
});

await check("existing per-minute scheduler is reused and no scheduler is added", () => {
  const netlify = text("netlify.toml");
  assert.equal(
    (netlify.match(/schedule\s*=\s*"\* \* \* \* \*"/gu) ?? []).length,
    1,
  );
  assert.match(
    netlify,
    /\[functions\."production-fulfillment-dispatch-scheduled"\]/u,
  );
  const scheduled = text(
    "netlify/functions/production-fulfillment-dispatch-scheduled.mts",
  );
  assert.match(scheduled, /Promise\.allSettled/u);
  assert.match(scheduled, /operatorNotifications/u);
  assert.match(scheduled, /deployContext !== "production"/u);
  assert.match(scheduled, /context\?\.deploy\?\.published === true/u);
  assert.match(scheduled, /OPERATOR_SKIP_CONTEXT_UNAVAILABLE/u);
  assert.doesNotMatch(scheduled, /OPERATOR_SKIP_NOT_PUBLISHED/u);
  assert.match(scheduled, /dispatch\.status === "rejected" \? 500 : 200/u);
});

await check("transport initialization failure is reason-coded before claim", async () => {
  const diagnostics = [];
  let claimRuns = 0;
  await assert.rejects(
    () => runConfiguredProductionOperatorNotificationSchedule({
      environment: {
        DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
        DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
        DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM: "2026-08-30T00:00:00.000Z",
        DISCORD_OPERATOR_WEBHOOK_URL: webhookUrl,
        PAYMENT_PROVIDER_ENVIRONMENT: "test",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SECRET_KEY: "test-only-not-a-real-secret",
      },
      createRepository() {
        return {
          async claimBatch() {
            claimRuns += 1;
            return [];
          },
          async beginSend() { return "superseded"; },
          async complete() {},
          async finish() {},
        };
      },
      createTransport() {
        throw new Error("SAFE_TEST_TRANSPORT_FAILURE");
      },
      diagnosticLogger(event) {
        diagnostics.push(event);
      },
    }),
    /SAFE_TEST_TRANSPORT_FAILURE/u,
  );
  assert.equal(claimRuns, 0);
  assert.equal(
    diagnostics.at(-1)?.reason_code,
    "OPERATOR_SKIP_TRANSPORT_INITIALIZATION_FAILED",
  );
});

await check("claim RPC failure is reason-coded without exposing the error", async () => {
  const diagnostics = [];
  let transportSends = 0;
  await assert.rejects(
    () => runConfiguredProductionOperatorNotificationSchedule({
      environment: {
        DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
        DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
        DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM: "2026-08-30T00:00:00.000Z",
        DISCORD_OPERATOR_WEBHOOK_URL: webhookUrl,
        PAYMENT_PROVIDER_ENVIRONMENT: "test",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SECRET_KEY: "test-only-not-a-real-secret",
      },
      createRepository() {
        return {
          async claimBatch() {
            throw new Error("FORBIDDEN_RAW_DATABASE_ERROR");
          },
          async beginSend() { return "superseded"; },
          async complete() {},
          async finish() {},
        };
      },
      createTransport() {
        return {
          async send() {
            transportSends += 1;
            throw new Error("SEND_FORBIDDEN");
          },
        };
      },
      diagnosticLogger(event) {
        diagnostics.push(event);
      },
    }),
    /FORBIDDEN_RAW_DATABASE_ERROR/u,
  );
  assert.equal(transportSends, 0);
  assert.deepEqual(
    diagnostics.slice(-2).map((event) => event.reason_code),
    ["OPERATOR_CLAIM_START", "OPERATOR_CLAIM_FAILED"],
  );
  assert.equal(
    diagnostics.at(-1)?.claim_failure_code,
    "UNEXPECTED_CLAIM_FAILURE",
  );
  assert.doesNotMatch(JSON.stringify(diagnostics), /FORBIDDEN_RAW_DATABASE_ERROR/u);
});

await check("runtime activation uses ACTIVE_FROM and injected clients only after enable", async () => {
  const seen = { repository: null, transport: null, claim: null };
  const diagnostics = [];
  const result = await runConfiguredProductionOperatorNotificationSchedule({
    environment: {
      DISCORD_OPERATOR_NOTIFICATIONS_ENABLED: "true",
      DISCORD_OPERATOR_NOTIFICATIONS_EMERGENCY_STOP: "false",
      DISCORD_OPERATOR_NOTIFICATIONS_ACTIVE_FROM: "2026-08-30T00:00:00.000Z",
      DISCORD_OPERATOR_WEBHOOK_URL: webhookUrl,
      PAYMENT_PROVIDER_ENVIRONMENT: "test",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "test-only-not-a-real-secret",
    },
    uuid: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    now: () => new Date("2026-08-30T02:00:00.000Z"),
    createRepository(url, secret) {
      seen.repository = [url, secret];
      return {
        async claimBatch(input) {
          seen.claim = input;
          return [];
        },
        async beginSend() {
          return "superseded";
        },
        async complete() {},
        async finish() {},
      };
    },
    createTransport(url) {
      seen.transport = url;
      return { async send() { throw new Error("NO_CLAIMS"); } };
    },
    diagnosticLogger(event) {
      diagnostics.push(event);
    },
  });
  assert.deepEqual(result, {
    claimed: 0,
    sent: 0,
    retryable: 0,
    ambiguous: 0,
    terminalFailures: 0,
    superseded: 0,
    processingFailures: 0,
  });
  assert.deepEqual(seen.repository, [
    "https://example.supabase.co",
    "test-only-not-a-real-secret",
  ]);
  assert.equal(seen.transport, webhookUrl);
  assert.equal(seen.claim.environment, "test");
  assert.equal(seen.claim.activeFrom, "2026-08-30T00:00:00.000Z");
  assert.equal(seen.claim.limit, 4);
  assert.deepEqual(
    diagnostics.map((event) => event.reason_code),
    [
      "OPERATOR_RUNTIME_CONFIGURATION",
      "OPERATOR_REPOSITORY_READY",
      "OPERATOR_CLAIM_START",
      "OPERATOR_CLAIM_OK",
    ],
  );
  assert.equal(diagnostics.at(-1)?.claimed_row_count, 0);
  assert.equal(diagnostics.at(-1)?.cutover_confirmed, true);
  const serialized = JSON.stringify(diagnostics);
  for (const forbidden of [
    "2026-08-30T00:00:00.000Z",
    webhookUrl,
    "test-only-not-a-real-secret",
    "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, "u"));
  }
});

console.log(
  `OPERATOR DISCORD R1 PASS checks=${passed} fake_fetch_calls=${fakeFetchCalls}`,
);
console.log(
  "DISCORD_EXTERNAL_POSTS=0 PRODUCTION_DB_WRITES=0 PRODUCTION_SECRET_WRITES=0 STRIPE_CALLS=0",
);
