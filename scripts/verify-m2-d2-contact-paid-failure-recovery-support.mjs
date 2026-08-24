import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CustomerSupportApplicationV1 } from "../lib/support/application.ts";
import {
  customerSupportCategories,
} from "../lib/support/types.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";

const root = process.cwd();
const readText = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");

let passed = 0;
async function verify(label, assertion) {
  await assertion();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${label}`);
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

const recorded = [];
const application = new CustomerSupportApplicationV1({
  repository: {
    async createCase(input) {
      recorded.push(structuredClone(input));
      return {
        caseId: input.caseId,
        category: input.category,
        status: "open",
        createdAt: input.now,
        disposition: "created",
      };
    },
  },
  uuid: (() => {
    let value = 0;
    return () =>
      `d2f00000-0000-4000-8000-${String(++value).padStart(12, "0")}`;
  })(),
  now: () => "2026-08-24T00:00:00.000Z",
});

const customerA = "d2100000-0000-4000-8000-000000000001";
const purchaseA = "d2500000-0000-4000-8000-000000000001";
const idempotencyKey = "d2-verifier-key-00000001";

await verify("six-category contract is exact and only paid categories require purchase", () => {
  assert.deepEqual(
    customerSupportCategories.map(({ value, purchaseRequired }) => ({
      value,
      purchaseRequired,
    })),
    [
      { value: "result_delivery", purchaseRequired: true },
      { value: "payment_charge", purchaseRequired: true },
      { value: "refund_cancellation", purchaseRequired: true },
      { value: "account_login", purchaseRequired: false },
      { value: "privacy_data", purchaseRequired: false },
      { value: "other", purchaseRequired: false },
    ],
  );
});

await verify("paid case normalizes note and sends only hashed idempotency authority", async () => {
  const outcome = await application.createCase({
    customerUserId: customerA,
    purchaseIntentId: purchaseA,
    category: "result_delivery",
    customerNote: "  結果を開けません。\r\n確認をお願いします。  ",
    idempotencyKey,
  });
  assert.equal(outcome.status, "open");
  assert.equal(recorded[0].customerNote, "結果を開けません。\n確認をお願いします。");
  assert.match(recorded[0].idempotencyKeyHash, /^[0-9a-f]{64}$/u);
  assert.match(recorded[0].caseInputSha256, /^[0-9a-f]{64}$/u);
  assert.notEqual(recorded[0].idempotencyKeyHash, idempotencyKey);
  assert.equal(JSON.stringify(recorded[0]).includes(idempotencyKey), false);
});

await verify("non-purchase category allows null purchase", async () => {
  const outcome = await application.createCase({
    customerUserId: customerA,
    purchaseIntentId: null,
    category: "account_login",
    customerNote: null,
    idempotencyKey: "d2-verifier-key-00000002",
  });
  assert.equal(outcome.category, "account_login");
  assert.equal(recorded.at(-1).purchaseIntentId, null);
});

await verify("invalid category and purchase/category mismatches fail before repository", async () => {
  const before = recorded.length;
  for (const input of [
    { category: "invalid", purchaseIntentId: null },
    { category: "payment_charge", purchaseIntentId: null },
    { category: "privacy_data", purchaseIntentId: purchaseA },
  ]) {
    await assert.rejects(
      application.createCase({
        customerUserId: customerA,
        customerNote: null,
        idempotencyKey: "d2-verifier-key-00000003",
        ...input,
      }),
      (error) => safeCode(error) === "CUSTOMER_SUPPORT_REQUEST_INVALID",
    );
  }
  assert.equal(recorded.length, before);
});

await verify("note is bounded and rejects unsafe control characters", async () => {
  const before = recorded.length;
  for (const customerNote of ["x".repeat(1_001), "unsafe\u0000note"]) {
    await assert.rejects(
      application.createCase({
        customerUserId: customerA,
        purchaseIntentId: null,
        category: "other",
        customerNote,
        idempotencyKey: "d2-verifier-key-00000004",
      }),
      (error) => safeCode(error) === "CUSTOMER_SUPPORT_REQUEST_INVALID",
    );
  }
  assert.equal(recorded.length, before);
});

const migration = readText("supabase/migrations/0021_m2_d2_customer_support_cases.sql");
const createRpc = migration.slice(
  migration.indexOf("create function public.create_production_customer_support_case_v1"),
  migration.indexOf("create function public.resolve_production_support_case_context_v1"),
);
const contextRpc = migration.slice(
  migration.indexOf("create function public.resolve_production_support_case_context_v1"),
  migration.indexOf("create function public.transition_production_support_case_v1"),
);

await verify("0021 is append-only with exactly two support tables and three RPCs", () => {
  assert.equal((migration.match(/create table public\./gu) ?? []).length, 2);
  assert.equal((migration.match(/create function public\./gu) ?? []).length, 3);
  for (const table of [
    "production_customer_support_cases",
    "production_customer_support_case_events",
  ]) assert.match(migration, new RegExp(`create table public\\.${table}\\b`, "u"));
  for (const rpc of [
    "create_production_customer_support_case_v1",
    "resolve_production_support_case_context_v1",
    "transition_production_support_case_v1",
  ]) assert.match(migration, new RegExp(`create function public\\.${rpc}\\b`, "u"));
});

await verify("all 0021 RPCs are SECURITY INVOKER with empty search path", () => {
  assert.equal((migration.match(/security invoker/gu) ?? []).length, 3);
  assert.equal((migration.match(/set search_path = ''/gu) ?? []).length, 3);
  assert.equal((migration.match(/security definer/gu) ?? []).length, 0);
});

await verify("new tables use RLS and closed direct customer/ingress ACL", () => {
  assert.equal((migration.match(/enable row level security/gu) ?? []).length, 2);
  assert.match(migration, /revoke all privileges on table[\s\S]+from public, anon, authenticated, service_role, m2_b2_stripe_ingress/u);
  assert.match(migration, /grant select, insert, update on table[\s\S]+production_customer_support_cases[\s\S]+to service_role/u);
  assert.match(migration, /grant select, insert on table[\s\S]+production_customer_support_case_events[\s\S]+to service_role/u);
});

await verify("new RPC EXECUTE is service-role only and ingress gets zero authority", () => {
  assert.equal((migration.match(/grant execute on function public\./gu) ?? []).length, 3);
  assert.equal((migration.match(/to service_role;/gu) ?? []).length, 5);
  assert.equal((migration.match(/from public, anon, authenticated, service_role, m2_b2_stripe_ingress;/gu) ?? []).length, 4);
});

await verify("paid-order creation validates exact active ownership before mutation", () => {
  assert.match(createRpc, /production_customer_ownership_bindings/u);
  assert.match(createRpc, /binding\.customer_user_id = p_customer_user_id/u);
  assert.match(createRpc, /binding\.state = 'active'/u);
  assert.ok(createRpc.indexOf("M2_D2_SUPPORT_PURCHASE_NOT_OWNED") < createRpc.indexOf("insert into public.production_customer_support_cases"));
});

await verify("support creation never mutates payment, fulfillment or provider state", () => {
  assert.doesNotMatch(createRpc, /(?:insert into|update|delete from) public\.(?:production_purchase_intents|production_payment_attempts|production_verified_payments|production_stripe_event_ledger|production_fulfillment_jobs|production_logical_assessments|production_customer_deliveries|production_notification_outbox)/u);
  assert.doesNotMatch(createRpc, /(?:insert into|update|delete from) public\.production_payment_adjustment_ledger/u);
});

await verify("idempotency and active purchase/category dedupe are lock-protected", () => {
  assert.equal((createRpc.match(/pg_advisory_xact_lock/gu) ?? []).length, 2);
  assert.match(migration, /unique \(customer_user_id, idempotency_key_hash\)/u);
  assert.match(migration, /production_customer_support_active_purchase_category_idx/u);
  assert.match(createRpc, /M2_D2_SUPPORT_IDEMPOTENCY_CONFLICT/u);
  assert.match(createRpc, /'disposition', 'active_case'/u);
});

await verify("support events are append-only for application authority", () => {
  assert.match(migration, /grant select, insert on table[\s\S]+production_customer_support_case_events[\s\S]+to service_role/u);
  assert.doesNotMatch(migration, /grant [^;]*(?:update|delete)[^;]*production_customer_support_case_events/iu);
});

await verify("operator context is bounded and contains no customer/provider content", () => {
  for (const field of [
    "payment_verified", "fulfillment_state", "fulfillment_manual_review",
    "delivery_completed", "result_available", "notification_state",
    "reconciliation_due", "reconciliation_stopped",
  ]) assert.ok(contextRpc.includes(`'${field}'`), field);
  assert.doesNotMatch(contextRpc, /consultation|raw_situation|result_json|experience_projection_json|token|capability|email|provider_checkout|provider_payment|stripe_event/iu);
});

const route = readText("app/api/support/cases/route.ts");
const service = readText("lib/support/service.ts");
const environment = readText("lib/support/environment.ts");
const envExample = readText(".env.example");
const activationPolicy = readText("lib/payment/production/activation-policy.ts");

await verify("support mutation route is node-only, same-origin, strict JSON and no-store", () => {
  assert.match(route, /runtime = "nodejs"/u);
  assert.match(route, /enforceSameOrigin\(request\)/u);
  assert.match(route, /readStrictJsonRequest\(request, 8_192\)/u);
  assert.match(route, /Cache-Control[\s\S]+no-store/u);
  assert.match(route, /Object\.keys\(value\)\.length !== 4/u);
});

await verify("source-controlled support default is exactly one literal false declaration", () => {
  const declarations = envExample.match(/^CUSTOMER_SUPPORT_CASES_ENABLED=.*$/gmu) ?? [];
  assert.deepEqual(declarations, ["CUSTOMER_SUPPORT_CASES_ENABLED=false"]);
});

await verify("feature flag enables only exact true and is independent of activation readiness", () => {
  assert.match(environment, /process\.env\.CUSTOMER_SUPPORT_CASES_ENABLED === "true"/u);
  const requiredFlags = activationPolicy.match(
    /RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS = Object\.freeze\(\[([\s\S]*?)\]\s+as const\);/u,
  )?.[1];
  assert.ok(requiredFlags, "new-purchase required flag authority must remain explicit");
  assert.doesNotMatch(requiredFlags, /CUSTOMER_SUPPORT_CASES_ENABLED/u);
  assert.doesNotMatch(activationPolicy, /CUSTOMER_SUPPORT_CASES_ENABLED/u);
  for (const independentAuthority of [
    "CUSTOMER_AUTH_ENABLED",
    "PAYMENT_PRODUCTION_ENABLED",
    "PAYMENT_FULFILLMENT_PROCESSING_ENABLED",
  ]) {
    assert.match(requiredFlags, new RegExp(`"${independentAuthority}"`, "u"));
  }
});

await verify("fresh server identity is the only CustomerUserId source", () => {
  assert.match(service, /getFreshIdentity\(\)/u);
  assert.match(service, /customerUserId: identity\.customerUserId/u);
  assert.doesNotMatch(route, /customerUserId/u);
  assert.doesNotMatch(route, /stripe|paymentIntent|checkoutSession|resultToken|capability|otp/iu);
});

await verify("creation response exposes only safe case metadata", () => {
  for (const field of ["caseReference", "category", "status", "createdAt"]) {
    assert.ok(route.includes(field), field);
  }
  assert.match(route, /data: \{\s*caseReference: outcome\.caseId,\s*category: outcome\.category,\s*status: outcome\.status,\s*createdAt: outcome\.createdAt,\s*\}/u);
  assert.doesNotMatch(route, /customerNote: outcome|paymentState: outcome|fulfillmentState: outcome|customerUserId: outcome/u);
});

const contact = readText("app/contact/page.tsx");
const form = readText("components/support/CustomerSupportForm.tsx");
const account = readText("app/account/page.tsx");
const customerSource = `${contact}\n${form}\n${account}`;

await verify("disabled contact remains truthful and enabled contact has all six labels", () => {
  assert.match(contact, /お問い合わせ窓口は現在準備中です/u);
  assert.match(contact, /現在、お問い合わせを受け付けられません/u);
  assert.match(contact, /CUSTOMER_AUTH_REQUIRED/u);
  for (const { label } of customerSupportCategories) {
    assert.ok(readText("lib/support/types.ts").includes(label), label);
  }
  assert.match(contact, /CustomerSupportForm/u);
});

await verify("customer form never asks for payment/result/auth bearer data", () => {
  assert.doesNotMatch(form, /name=["'](?:stripe|checkout|paymentIntent|resultToken|authToken|otp|capability)/iu);
  for (const warning of ["カード番号", "パスワード", "OTP", "ログインコード", "結果URL", "相談本文"]) {
    assert.ok(form.includes(warning), warning);
  }
  assert.doesNotMatch(customerSource, /manual_review|RPC|Async Workloads|lease|provider ambiguity/iu);
});

await verify("optional note is plain, attachment-free, bounded and never logged", () => {
  assert.match(form, /<textarea/u);
  assert.match(form, /maxLength=\{1_000\}/u);
  assert.doesNotMatch(form, /type="file"|contentEditable|dangerouslySetInnerHTML/u);
  assert.doesNotMatch(`${route}\n${service}\n${readText("lib/support/supabase-repository.ts")}`, /console\.(?:log|info|warn|error)/u);
});

await verify("account support entry passes only non-secret selector and server revalidates it", () => {
  assert.match(account, /この購入について問い合わせる/u);
  assert.match(account, /\/contact\?purchase=/u);
  assert.match(contact, /purchase\.purchaseIntentId === query\.purchase/u);
  assert.match(createRpc, /binding\.customer_user_id = p_customer_user_id/u);
  assert.doesNotMatch(account, /resultToken|checkoutSession|paymentIntent|capability|statusCapability/iu);
});

await verify("refund request is a review case, never an automatic refund", () => {
  assert.match(customerSource, /返金や再処理を自動で実行するものではありません/u);
  assert.match(form, /返金、決済、鑑定ノート生成、メール再送は自動では実行されません/u);
  assert.doesNotMatch(`${route}\n${service}\n${createRpc}`, /refunds\.create|stripe\.refund|createRefund/iu);
});

await verify("unauthenticated/Auth-failure fallback remains explicit without invented contact", () => {
  assert.match(contact, /外部受付方法は現在準備中です/u);
  assert.doesNotMatch(contact, /mailto:|@(?:[a-z0-9-]+\.)+[a-z]{2,}|電話.{0,20}\d/iu);
  assert.match(contact, /決済情報を本文に記載して送る方法は案内しません/u);
});

await verify("D1 legal pages defer availability truth to Contact", () => {
  for (const file of [
    "app/legal/privacy/page.tsx",
    "app/legal/refund/page.tsx",
    "app/legal/tokushoho/page.tsx",
    "app/legal/unsupported-cases/page.tsx",
  ]) assert.match(readText(file), /お問い合わせページ/u, file);
});

await verify("customer copy promises no ETA, repayment or automatic state mutation", () => {
  assert.doesNotMatch(customerSource, /24時間以内|営業日以内|必ず.{0,20}(解決|返金|返信)|もう一度.{0,8}(支払|購入)/u);
  assert.doesNotMatch(customerSource, /新しいCheckout|再課金|支払い直/u);
});

await verify("External Beta readiness remains a separate closed checklist", () => {
  const evidence = readText("docs/m2/M2_D2_CONTACT_PAID_FAILURE_RECOVERY_SUPPORT.md");
  for (const required of [
    "D2 source review PASS and remote 0021 apply",
    "CUSTOMER_SUPPORT_CASES_ENABLED=true",
    "actual monitored operator procedure/channel",
    "unauthenticated/Auth-failure fallback",
    "current refund/cancellation operating procedure",
    "D1 seller/contact disclosures reconciled",
  ]) assert.ok(evidence.includes(required), required);
  assert.match(evidence, /No Production environment value was set/u);
});

console.log(`M2-D2 contact and paid-failure recovery verification PASS (${passed}/${passed}).`);
