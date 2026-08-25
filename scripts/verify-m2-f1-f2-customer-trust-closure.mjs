import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { getPurchaseReturnPresentation } from "../lib/payment/purchase-return-presentation.ts";

const root = process.cwd();
const authority = "60c4f6f6b592463c65815e7df87f19a56cf67751";
const expectedBranch = "task/m2-f1-f2-customer-trust-closure-r1";
let passed = 0;

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

function text(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function diff(paths) {
  return git(["diff", "--name-only", authority, "--", ...paths]);
}

function check(label, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${label}`);
}

function status(name, paymentVerified, accountFallback = true) {
  if (name === "temporary_problem") {
    return { status: name, paymentVerified: true, accountFallback, retryable: true };
  }
  if (name === "completed") {
    return {
      status: name,
      paymentVerified: true,
      accountFallback,
      resultPath: "/account/results/123e4567-e89b-42d3-a456-426614174000",
    };
  }
  return { status: name, paymentVerified, accountFallback };
}

function present(customerStatus, overrides = {}) {
  return getPurchaseReturnPresentation({
    status: customerStatus,
    requestFailed: false,
    recoveryExhausted: false,
    customerAuthEnabled: true,
    ...overrides,
  });
}

check("exact E3-integrated authority and bounded task branch", () => {
  assert.equal(git(["merge-base", authority, "HEAD"]), authority);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", "main"]), "61e33a10e195fad17e253a6b9719217e1992f273");
});

check("F1/F2 adds no migration, lockfile, dependency, or Next.js change", () => {
  assert.equal(diff(["supabase/migrations", "package-lock.json", "next.config.ts"]), "");
  const packageDiff = git(["diff", authority, "--", "package.json"]);
  assert.doesNotMatch(packageDiff, /^[+-]\s*"(?:dependencies|devDependencies)"/mu);
  assert.equal(JSON.parse(text("package.json")).dependencies.next, "^16.3.0");
});

check("purchase panel centralizes exact economic trust facts", () => {
  const source = text("components/payment/PurchasePaymentPanel.tsx");
  for (const literal of [
    "currentCustomerLegalFacts.price",
    "currentCustomerLegalFacts.quantity",
    "currentCustomerLegalFacts.purchaseType",
    "currentCustomerLegalFacts.renewal",
    "currentCustomerLegalFacts.paymentProvider",
    "AIを使用",
    "相手の本心、返信、復縁、未来、関係改善を保証しません",
  ]) {
    assert.ok(source.includes(literal), literal);
  }
});

check("one visually dominant Checkout action has the accepted customer wording", () => {
  const source = text("components/payment/PurchasePaymentPanel.tsx");
  assert.equal((source.match(/<button\b/gu) ?? []).length, 1);
  assert.match(source, /className="button button--primary request-checkout-button"/u);
  assert.match(source, /"お支払いに進む"/u);
  assert.match(source, /次の画面でStripeの決済ページが開きます/u);
});

check("both purchase-ready lanes use the same decision panel", () => {
  assert.match(text("components/request/RequestForm.tsx"), /<PurchasePaymentPanel/u);
  assert.match(text("components/payment/AuthenticatedCheckoutButton.tsx"), /<PurchasePaymentPanel/u);
  assert.match(text("app/purchase/auth/continue/page.tsx"), /<AuthenticatedCheckoutButton/u);
  assert.match(text("components/request/AuthenticatedPreparationContinuation.tsx"), /<AuthenticatedCheckoutButton/u);
});

check("both final decision surfaces keep current legal and refund links", () => {
  for (const file of [
    "components/request/RequestForm.tsx",
    "app/purchase/auth/continue/page.tsx",
  ]) {
    const source = text(file);
    for (const href of [
      "/legal/terms",
      "/legal/privacy",
      "/legal/refund",
      "/legal/tokushoho",
      "/legal/ai-disclosure",
    ]) {
      assert.ok(source.includes(`href=\"${href}\"`), `${file}:${href}`);
    }
  }
});

check("Checkout and status server authority files remain byte-unchanged", () => {
  assert.equal(
    diff([
      "app/api/payments/checkout/route.ts",
      "app/api/payments/status/route.ts",
      "lib/payment/purchase-status-contract.ts",
      "lib/payment/purchase-status-poller.ts",
      "lib/payment/production",
    ]),
    "",
  );
});

check("E1 measurement producers and contract remain unchanged", () => {
  assert.equal(
    diff([
      "lib/measurement/auth-latency.ts",
      "lib/measurement/browser-auth-latency.ts",
      "app/api/auth/google/start/route.ts",
      "app/api/auth/callback/route.ts",
    ]),
    "",
  );
  const requestDiff = git([
    "diff",
    "--unified=0",
    authority,
    "--",
    "components/request/RequestForm.tsx",
  ]);
  assert.doesNotMatch(
    requestDiff,
    /^[+-].*(?:auth_latency|GoogleAuthClientTiming|beginGoogleAuthClientTiming|trackClientMeasurement|googleAuthClientTimingRef)/mu,
  );
});

check("E2 standalone Auth and navigation remain byte-unchanged", () => {
  assert.equal(
    diff([
      "app/login",
      "app/api/account/session",
      "app/api/auth/account",
      "app/api/auth/logout",
      "components/layout/CustomerSessionNav.tsx",
      "components/layout/SiteHeader.tsx",
      "lib/customer-auth/account-attempt.ts",
      "lib/customer-auth/account-application.ts",
    ]),
    "",
  );
});

check("E3 Account and authenticated result authority remain byte-unchanged", () => {
  assert.equal(
    diff([
      "app/account",
      "lib/customer-auth/account-history.ts",
      "lib/customer-auth/account-page-resolution.ts",
      "lib/customer-auth/account-result-resolution.ts",
      "lib/customer-auth/supabase-repository.ts",
    ]),
    "",
  );
});

check("D2 Support authority and C1 compute authority remain byte-unchanged", () => {
  assert.equal(
    diff([
      "app/api/support",
      "components/support",
      "lib/support",
      "lib/assessment/production/prepayment-compute.ts",
      "lib/assessment/production/prepayment-compute-policy.ts",
      "supabase/migrations/0020_m2_c1_prepayment_compute_budget.sql",
      "supabase/migrations/0021_m2_d2_customer_support_cases.sql",
    ]),
    "",
  );
});

check("unverified payment states never claim durable payment", () => {
  for (const customerStatus of [
    status("confirming_payment", false),
    status("confirmation_pending", false),
    status("payment_not_completed", false),
  ]) {
    const view = present(customerStatus);
    assert.equal(view.assurance, null);
    assert.doesNotMatch(`${view.eyebrow}\n${view.heading}\n${view.body}`, /お支払い確認済み|追加のお支払いは必要ありません/u);
    assert.deepEqual(view.progress, ["current", "next", "next"]);
  }
});

check("every durably verified state forbids Checkout and states no repayment", () => {
  for (const customerStatus of [
    status("preparing_assessment", true),
    status("temporary_problem", true),
    status("confirmation_pending", true),
    status("completed_check_verified_email", true, false),
    status("completed", true),
  ]) {
    const view = present(customerStatus, {
      requestFailed: customerStatus.status === "temporary_problem",
      recoveryExhausted: customerStatus.status === "temporary_problem",
    });
    assert.match(view.assurance ?? "", /追加のお支払いは必要ありません/u);
    assert.equal(view.showCheckoutRestart, false);
    assert.equal(view.progress[0], "complete");
  }
});

check("normal verified preparation is distinct and honestly current", () => {
  const view = present(status("preparing_assessment", true));
  assert.equal(view.heading, "鑑定ノートを準備しています");
  assert.equal(view.detailHeading, "鑑定ノートを準備中です");
  assert.deepEqual(view.progress, ["complete", "current", "next"]);
  assert.equal(view.showAccountFallback, false);
  assert.equal(view.showSupportFallback, false);
});

check("verified recovery exposes Account and Support seams but no Checkout", () => {
  const view = present(status("temporary_problem", true), {
    requestFailed: true,
    recoveryExhausted: true,
  });
  assert.equal(view.showManualRefresh, true);
  assert.equal(view.showAccountFallback, true);
  assert.equal(view.showSupportFallback, true);
  assert.equal(view.showCheckoutRestart, false);
});

check("unpaid terminal state alone permits same-purchase Checkout restart", () => {
  const view = present(status("payment_not_completed", false));
  assert.equal(view.showCheckoutRestart, true);
  assert.match(view.body, /同じお申し込み/u);
  assert.doesNotMatch(view.body, /お支払い確認済み/u);
});

check("completed and email-recovery states are visibly complete", () => {
  for (const customerStatus of [
    status("completed_check_verified_email", true, false),
    status("completed", true),
  ]) {
    const view = present(customerStatus);
    assert.deepEqual(view.progress, ["complete", "complete", "complete"]);
    assert.match(view.heading, /完成|開いています/u);
  }
});

check("Return component exposes only bounded safe actions", () => {
  const source = text("components/payment/PurchaseReturnStatus.tsx");
  for (const literal of [
    "同じお申し込みを確認する",
    "私の鑑定ノートを確認する",
    "同じお申し込みで決済を再開する",
    "お問い合わせへ進む",
  ]) {
    assert.ok(source.includes(literal), literal);
  }
  assert.match(source, /presentation\.showSupportFallback && supportEnabled/u);
  assert.match(text("app/purchase/return/[statusCapability]/page.tsx"), /isCustomerSupportCasesEnabled/u);
});

check("Return customer copy contains no internal recovery vocabulary", () => {
  const source = `${text("components/payment/PurchaseReturnStatus.tsx")}\n${text("lib/payment/purchase-return-presentation.ts")}`;
  assert.doesNotMatch(source, /manual_review|reconciliation|lease|Provider|Async Workloads|RPC|scheduler/u);
  assert.doesNotMatch(source, /safeCode|error\.message|statusCapability[^\n]*[<{]/u);
});

check("Return progress contains no fabricated percentage, ETA, or queue position", () => {
  const source = `${text("components/payment/PurchaseReturnStatus.tsx")}\n${text("lib/payment/purchase-return-presentation.ts")}`;
  assert.doesNotMatch(source, /\d+\s*%|あと\s*\d+|\d+\s*秒|待ち人数|キュー/u);
  assert.match(source, /"complete" \| "current" \| "next"/u);
});

check("Checkout preparation failure retains one safe same-attempt action", () => {
  const source = text("components/payment/AuthenticatedCheckoutButton.tsx");
  assert.match(source, /料金は発生していません/u);
  assert.match(source, /同じお申し込みのまま、もう一度お試しください/u);
  assert.match(source, /checkoutDisabled=\{busy\}/u);
});

check("fixed review route covers Checkout and every strict Return disposition", () => {
  const source = `${text("components/review/ReviewCustomerTrustClosure.tsx")}\n${text("app/review/purchase/trust/[fixtureId]/page.tsx")}`;
  for (const literal of [
    "checkout",
    "confirming_payment",
    "payment_not_completed",
    "preparing_assessment",
    "temporary_problem",
    "confirmation_pending",
    "completed_check_verified_email",
    "completed",
  ]) {
    assert.ok(source.includes(literal), literal);
  }
  assert.match(source, /外部通信は行いません/u);
});

check("accessibility semantics and mobile action stacking are explicit", () => {
  const component = `${text("components/payment/PurchasePaymentPanel.tsx")}\n${text("components/payment/PurchaseReturnStatus.tsx")}`;
  const css = text("app/globals.css");
  assert.match(component, /aria-labelledby="request-payment-title"/u);
  assert.match(component, /aria-live="polite"/u);
  assert.match(component, /aria-current=\{state === "current" \? "step"/u);
  assert.match(component, /aria-label="お申し込みの現在地"/u);
  assert.match(css, /\.purchase-return-actions \{[^}]*flex-wrap: wrap/u);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.purchase-return-actions \{ align-items: stretch; flex-direction: column; \}/u);
});

check("canonical evidence preserves exact candidate-only disposition", () => {
  const source = text("docs/m2/M2_F1_F2_CUSTOMER_TRUST_CLOSURE.md");
  assert.match(source, /M2-F1: `SOURCE CANDIDATE — PENDING HUMAN\/CHATGPT REVIEW`/u);
  assert.match(source, /M2-F2: `SOURCE CANDIDATE — PENDING HUMAN\/CHATGPT REVIEW`/u);
  assert.match(source, /PROD-01: `CUSTOMER TRUST SOURCE CANDIDATE`/u);
  assert.match(source, /UX-01: `POST-PAYMENT TRUST SOURCE CANDIDATE`/u);
  assert.match(source, /PURCHASE\/RETURN SLICE FURTHER ADDRESSED — NOT CLOSED/u);
});

console.log(`M2-F1/F2 Customer Trust Closure verification: ${passed}/${passed} checks passed.`);
