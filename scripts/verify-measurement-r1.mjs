import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const {
  captureMeasurementAttribution,
  MEASUREMENT_ATTRIBUTION_TTL_SECONDS,
} = await import("../lib/measurement/attribution.ts");
const {
  openMeasurementAttributionCookie,
  sealMeasurementAttributionCookie,
} = await import("../lib/measurement/attribution-cookie.ts");
const { readMeasurementR1Config } = await import("../lib/measurement/config.ts");
const { Ga4ClientMeasurementAdapter } = await import("../lib/measurement/adapters.ts");
const { createMeasurementEvent } = await import("../lib/measurement/events.ts");
const { buildGa4PurchaseBody } = await import("../lib/measurement/ga4.ts");
const { runPurchaseMeasurementSchedule } = await import("../lib/measurement/purchase-job.ts");
const { runProductionFulfillmentDispatchScheduled } = await import(
  "../netlify/functions/production-fulfillment-dispatch-scheduled.mts"
);

const root = process.cwd();
let passed = 0;
let fakeGa4Sends = 0;
const externalOperations = {
  ga4: 0,
  stripe: 0,
  supabaseRemote: 0,
  provider: 0,
  deploy: 0,
};

function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

async function check(name, proof) {
  await proof();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function campaignUrl(pathname = "/") {
  return new URL(
    `https://example.test${pathname}?utm_source=google&utm_medium=cpc&utm_campaign=search_r1&utm_content=ad_1&gclid=AbC_123`,
  );
}

const now = new Date("2026-08-31T00:00:00.000Z");
const clientId = "123456789.987654321";
const secret = "measurement-r1-verifier-secret-value-32-bytes";

await check("strict attribution capture and Google Ads canonicalization", () => {
  const result = captureMeasurementAttribution({
    url: campaignUrl(), existing: null, now, clientId,
  });
  assert.equal(result.changed, true);
  assert.deepEqual(
    Object.keys(result.snapshot).sort(),
    ["clientId", "sessionId", "utmSource", "utmMedium", "utmCampaign", "utmContent", "gclid", "landingPath", "capturedAt", "expiresAt"].sort(),
  );
  assert.equal(result.snapshot.utmSource, "google");
  assert.equal(result.snapshot.utmMedium, "cpc");
  assert.equal(result.snapshot.landingPath, "/");
  assert.equal(
    Date.parse(result.snapshot.expiresAt) - Date.parse(result.snapshot.capturedAt),
    MEASUREMENT_ATTRIBUTION_TTL_SECONDS * 1000,
  );
});

await check("Google Organic is coarsened without storing referrer URL", () => {
  const result = captureMeasurementAttribution({
    url: new URL("https://example.test/"), existing: null, now, clientId,
    googleOrganic: true,
  });
  assert.equal(result.snapshot.utmSource, "google");
  assert.equal(result.snapshot.utmMedium, "organic");
  assert.doesNotMatch(JSON.stringify(result.snapshot), /referrer|google[.]com/u);
});

await check("direct visit preserves existing campaign without refresh", () => {
  const existing = captureMeasurementAttribution({ url: campaignUrl(), existing: null, now, clientId }).snapshot;
  const direct = captureMeasurementAttribution({
    url: new URL("https://example.test/request"),
    existing,
    now: new Date(now.getTime() + 86_400_000),
    clientId: "111.222",
  });
  assert.equal(direct.changed, false);
  assert.strictEqual(direct.snapshot, existing);
});

await check("invalid charset, duplicate fields, and secret paths reject", () => {
  for (const url of [
    new URL("https://example.test/?utm_source=goog%0Dle&utm_medium=cpc"),
    new URL("https://example.test/?utm_source=google&utm_source=other&utm_medium=cpc"),
    campaignUrl("/purchase/return/private-token"),
    new URL("https://example.test/?utm_source=%E6%97%A5%E6%9C%AC&utm_medium=cpc"),
  ]) {
    assert.throws(() => captureMeasurementAttribution({ url, existing: null, now, clientId }));
  }
});

await check("signed cookie accepts intact value and rejects tampering or expiry", async () => {
  const snapshot = captureMeasurementAttribution({ url: campaignUrl(), existing: null, now, clientId }).snapshot;
  const cookie = await sealMeasurementAttributionCookie(snapshot, secret);
  assert.deepEqual(await openMeasurementAttributionCookie(cookie, secret, now), snapshot);
  assert.equal(await openMeasurementAttributionCookie(`${cookie}x`, secret, now), null);
  assert.equal(
    await openMeasurementAttributionCookie(
      cookie,
      secret,
      new Date(now.getTime() + (MEASUREMENT_ATTRIBUTION_TTL_SECONDS + 1) * 1000),
    ),
    null,
  );
});

const validConfig = {
  MEASUREMENT_ENABLED: "true",
  MEASUREMENT_TRANSACTION_SECRET: secret,
  GA4_MEASUREMENT_ID: "G-ABC12345",
  GA4_API_SECRET: "test_ga4_api_secret_0000000000",
  MEASUREMENT_DESTINATION_ENV: "production",
  PAYMENT_PROVIDER_ENVIRONMENT: "live",
  NEXT_PUBLIC_APP_URL: "https://example.test",
};

await check("adapter activation is complete-config and environment fail-closed", () => {
  assert.ok(readMeasurementR1Config(validConfig));
  for (const override of [
    { GA4_API_SECRET: undefined },
    { GA4_MEASUREMENT_ID: "bad" },
    { MEASUREMENT_ENABLED: "TRUE" },
    { PAYMENT_PROVIDER_ENVIRONMENT: "test" },
    { MEASUREMENT_DESTINATION_ENV: "test" },
    { NEXT_PUBLIC_APP_URL: "http://example.test" },
  ]) assert.equal(readMeasurementR1Config({ ...validConfig, ...override }), null);
});

await check("explicit client funnel maps exactly and page_view stays suppressed", () => {
  const calls = [];
  const adapter = new Ga4ClientMeasurementAdapter((...args) => calls.push(args), 1788134400);
  adapter.dispatch(createMeasurementEvent("landing_view", {
    landingPath: "/", utmSource: "google", utmMedium: "cpc",
    utmCampaign: "search_r1", utmContent: "ad_1", gclid: "AbC_123",
  }));
  adapter.dispatch(createMeasurementEvent("sample_view", { sample: "public_sample" }));
  adapter.dispatch(createMeasurementEvent("request_start", { experience: "consultation_request" }));
  adapter.dispatch(createMeasurementEvent("request_complete", { outcome: "purchase_ready" }));
  adapter.dispatch(createMeasurementEvent("checkout_start", { provider: "stripe" }));
  adapter.dispatch(createMeasurementEvent("page_view", { page: "home" }));
  assert.deepEqual(calls.map((call) => call[1]), [
    "landing_view", "sample_view", "request_start", "request_complete", "begin_checkout",
  ]);
  assert.deepEqual(calls[4][2], {
    session_id: 1788134400,
    engagement_time_msec: 1,
    value: 980,
    currency: "JPY",
  });
});

const job = Object.freeze({
  id: "11111111-1111-4111-8111-111111111111",
  verifiedPaymentId: "22222222-2222-4222-8222-222222222222",
  environment: "live",
  transactionId: `mrp_${"A".repeat(43)}`,
  clientId,
  sessionId: 1788134400,
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "search_r1",
  utmContent: "ad_1",
  gclid: "AbC_123",
  landingPath: "/",
  value: 980,
  currency: "JPY",
  state: "processing",
  attemptCount: 1,
});

await check("GA4 MP body contains only anonymous campaign and canonical purchase", () => {
  const body = buildGa4PurchaseBody(job);
  assert.equal(body.client_id, clientId);
  assert.deepEqual(body.events.map((event) => event.name), ["campaign_details", "purchase"]);
  assert.equal(body.events[1].params.transaction_id, job.transactionId);
  assert.equal(body.events[1].params.value, 980);
  assert.equal(body.events[1].params.currency, "JPY");
  const serialized = JSON.stringify(body).toLowerCase();
  for (const forbidden of [
    "consultation", "intended_message", "email", "nickname", "phone",
    "oauth", "profile", "safety", "stripe", "verifiedpaymentid",
    "purchaseintent", "capability", "cs_test_", "pi_",
  ]) assert.doesNotMatch(serialized, new RegExp(forbidden, "u"));
});

await check("live claim excludes TEST and retry preserves persisted transaction ID", async () => {
  const attempts = [];
  const failed = [];
  const testJob = { ...job, id: "44444444-4444-4444-8444-444444444444", environment: "test" };
  const repository = {
    async claim(input) {
      assert.equal(input.environment, "live");
      return [testJob, job].filter((candidate) => candidate.environment === input.environment);
    },
    async complete() { assert.fail("unexpected completion"); },
    async fail(input) { failed.push(input); },
  };
  const transport = {
    async send(claimed) {
      fakeGa4Sends += 1;
      attempts.push(claimed.transactionId);
      return { status: 429 };
    },
  };
  const outcome = await runPurchaseMeasurementSchedule({
    repository, transport, environment: "live",
    ownerId: "33333333-3333-4333-8333-333333333333",
    now: () => now,
  });
  assert.equal(outcome.retryable, 1);
  await runPurchaseMeasurementSchedule({
    repository, transport, environment: "live",
    ownerId: "33333333-3333-4333-8333-333333333333",
    now: () => now,
  });
  assert.deepEqual(attempts, [job.transactionId, job.transactionId]);
  assert.equal(failed[0].retryable, true);
});

await check("measurement scheduler failure is fail-open for customer dispatch", async () => {
  const response = await runProductionFulfillmentDispatchScheduled(
    { deploy: { context: "production", published: false } },
    {
      isOperatorNotificationScheduleEnabled: () => false,
      isPurchaseMeasurementScheduleEnabled: () => true,
      runDispatchSchedule: async () => ({ processed: 1 }),
      runPurchaseMeasurementSchedule: async () => { throw new Error("fake GA failure"); },
      diagnosticLogger: () => undefined,
    },
  );
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.dispatch, { processed: 1 });
  assert.deepEqual(result.purchaseMeasurement, { failed: true });
});

await check("schema converges both canonical payment paths into one durable job", () => {
  const migration = text("supabase/migrations/0023_launch_measurement_r1.sql");
  const ingress = text("supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql");
  const application = text("lib/payment/production/application.ts");
  const repository = text("lib/payment/production/supabase-repository.ts");
  assert.match(migration, /after insert on public\.production_verified_payments/u);
  assert.match(migration, /verified_payment_id uuid not null unique/u);
  assert.match(migration, /transaction_id text not null unique/u);
  assert.match(migration, /extensions\.gen_random_bytes\(32\)/u);
  assert.match(migration, /production_purchase_intent_measurement_immutability_r1/u);
  assert.match(migration, /MEASUREMENT_ATTRIBUTION_IMMUTABLE/u);
  assert.match(migration, /production_purchase_measurement_job_immutability_r1/u);
  assert.match(migration, /MEASUREMENT_JOB_IMMUTABLE/u);
  assert.match(ingress, /record_rc2_stripe_evidence_v2/u);
  assert.match(application, /repository\.recordStripeEvidence/u);
  assert.match(repository, /record_rc2_stripe_evidence_v2/u);
  assert.doesNotMatch(text("lib/payment/production/service.ts"), /trackVerifiedPaymentPurchase/u);
  assert.doesNotMatch(text("lib/measurement/server.ts"), /deriveMeasurementTransactionId|trackVerifiedPaymentPurchase/u);
  const jobTable = migration.slice(
    migration.indexOf("create table public.production_purchase_measurement_jobs"),
    migration.indexOf("alter table public.production_purchase_measurement_jobs enable row level security"),
  ).toLowerCase();
  for (const forbiddenColumn of [
    "consultation", "intended_message", "email", "nickname", "phone",
    "oauth", "profile", "safety", "provider_checkout", "provider_payment",
  ]) assert.doesNotMatch(jobTable, new RegExp(forbiddenColumn, "u"));

  const jobImmutability = migration.slice(
    migration.indexOf("create function public.protect_production_purchase_measurement_job_immutability_r1"),
    migration.indexOf("alter table public.production_purchase_measurement_jobs enable row level security"),
  );
  for (const immutableColumn of [
    "id", "verified_payment_id", "purchase_intent_id", "environment",
    "transaction_id", "measurement_client_id", "measurement_session_id",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid",
    "landing_path", "attribution_captured_at", "value", "currency", "created_at",
  ]) assert.match(jobImmutability, new RegExp(`new[.]${immutableColumn} is distinct from old[.]${immutableColumn}`, "u"));
  for (const lifecycleColumn of [
    "state", "owner_id", "lease_expires_at", "attempt_count", "retry_after",
    "last_error_code", "sent_at", "updated_at",
  ]) assert.doesNotMatch(jobImmutability, new RegExp(`new[.]${lifecycleColumn} is distinct from old[.]${lifecycleColumn}`, "u"));

  const lifecycleFunctions = migration.slice(
    migration.indexOf("create function public.claim_production_purchase_measurement_batch_r1"),
    migration.indexOf("revoke all on table public.production_purchase_measurement_jobs"),
  );
  for (const immutableColumn of [
    "verified_payment_id", "purchase_intent_id", "environment", "transaction_id",
    "measurement_client_id", "measurement_session_id", "utm_source", "utm_medium",
    "utm_campaign", "utm_content", "gclid", "landing_path",
    "attribution_captured_at", "value", "currency", "created_at",
  ]) assert.doesNotMatch(lifecycleFunctions, new RegExp(`set[^;]*\\b${immutableColumn}\\s*=`, "su"));
});

await check("checkout binds only signed server cookie and Stripe remains attribution-free", () => {
  const route = text("app/api/payments/checkout/route.ts");
  const stripe = text("lib/payment/production/stripe.ts");
  assert.match(route, /openMeasurementAttributionCookie/u);
  assert.match(route, /measurementAttribution/u);
  assert.doesNotMatch(route, /body\.measurementAttribution/u);
  assert.doesNotMatch(stripe, /utm_|gclid|measurementAttribution/u);
});

await check("automatic page view and client API secret exposure are blocked", () => {
  const bootstrap = text("components/measurement/MeasurementBootstrap.tsx");
  const layout = text("app/layout.tsx");
  assert.match(bootstrap, /send_page_view: false/u);
  assert.match(bootstrap, /cookie_expires: MEASUREMENT_ATTRIBUTION_TTL_SECONDS/u);
  assert.match(bootstrap, /page_location: `\$\{props[.]siteOrigin\}[/]_measurement`/u);
  assert.doesNotMatch(bootstrap, /window[.]location|document[.]referrer/u);
  assert.doesNotMatch(bootstrap, /GA4_API_SECRET|apiSecret/u);
  assert.doesNotMatch(layout, /GA4_API_SECRET|apiSecret/u);
});

await check("browser gtag queue preserves the native command arguments object", () => {
  const bootstrap = text("components/measurement/MeasurementBootstrap.tsx");
  assert.match(bootstrap, /window[.]gtag = function gtag[(][)]/u);
  assert.match(bootstrap, /window[.]dataLayer[?][.]push[(]arguments[)][;]/u);
  assert.doesNotMatch(bootstrap, /dataLayer[?][.]push[(]args[)]/u);
});

assert.deepEqual(externalOperations, {
  ga4: 0, stripe: 0, supabaseRemote: 0, provider: 0, deploy: 0,
});
console.log(`MEASUREMENT_R1_CHECKS=${passed}`);
console.log(`FAKE_GA4_SENDS=${fakeGa4Sends}`);
console.log("EXTERNAL_GA4_SENDS=0");
console.log("STRIPE_CALLS=0");
console.log("SUPABASE_REMOTE_CALLS=0");
console.log("PROVIDER_CALLS=0");
console.log("DEPLOY_OPERATIONS=0");
