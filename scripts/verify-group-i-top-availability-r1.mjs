import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  isRc2NewPurchaseActivationReady,
  RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS,
  RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS,
} from "../lib/payment/production/activation-policy.ts";

const root = process.cwd();
const parent = "a128c581fdd89aabbf8e6d0c793520e195740193";
let passed = 0;

function text(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  ).trim();
}

function check(label, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${label}`);
}

function section(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing start: ${start}`);
  assert.notEqual(endIndex, -1, `missing end: ${end}`);
  return source.slice(startIndex, endIndex);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function assertAvailabilityBranch(source, enabledCopy, safeOffCopy) {
  assert.match(
    source,
    new RegExp(
      `\\{paymentEnabled\\s*\\? "${escapeRegExp(enabledCopy)}"\\s*: "${escapeRegExp(safeOffCopy)}"\\}`,
      "u",
    ),
  );
}

const home = text("app/page.tsx");
const environmentRuntime = text("lib/payment/production/environment-runtime.ts");
const hero = section(
  home,
  '<section className="lp-home-hero"',
  '<section className="lp-home-section',
);
const flow = section(home, '<section id="flow"', '<section className="lp-home-section lp-home-section--wash"');
const price = section(home, '<section id="price"', '<section id="boundaries"');
const final = section(home, '<section className="lp-final"', "</main>");

check("candidate starts from the exact Group I unblock parent", () => {
  assert.equal(git(["merge-base", parent, "HEAD"]), parent);
});

check("changes stay inside the Top availability scope", () => {
  const tracked = git(["diff", "--name-only", parent])
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean);
  assert.deepEqual([...new Set([...tracked, ...untracked])].sort(), [
    "app/page.tsx",
    "package.json",
    "scripts/verify-group-i-top-availability-r1.mjs",
  ]);
});

check("Top uses the existing runtime availability truth dynamically", () => {
  assert.match(
    home,
    /import \{ isCustomerPaymentFlowVisible \} from "@\/lib\/payment\/production\/environment";/u,
  );
  assert.match(home, /export const dynamic = "force-dynamic";/u);
  assert.match(home, /const paymentEnabled = isCustomerPaymentFlowVisible\(\);/u);
  assert.match(
    environmentRuntime,
    /export function isCustomerPaymentFlowVisible\(\) \{\s*return isRc2NewPurchaseActivationReady\(\s*enabled,\s*isPrepaymentComputePolicyConfigured\(\),\s*\);\s*\}/u,
  );
});

check("SAFE-OFF renders the existing unavailable truth in every status region", () => {
  assertAvailabilityBranch(
    hero,
    "18歳以上対象。相談入力と安全確認のあと、受け取り方法を確認して購入へ進みます。",
    "18歳以上対象。サービス準備中のため、現在は購入・生成・メール送信を利用できません。",
  );
  assertAvailabilityBranch(
    flow,
    "相談入力と安全確認のあと、購入・生成・メール配信までを順に進めます。",
    "現在利用できるのは提供準備中の依頼フォームと確認表示です。決済・生成・メール配信は動作しません。",
  );
  assertAvailabilityBranch(
    price,
    "相談入力と安全確認のあと、購入手続きへ進みます。",
    "提供準備中のため、現在は購入できません。",
  );
  assertAvailabilityBranch(
    final,
    "通常鑑定OKの場合だけ、購入と鑑定ノートの受け取りへ進みます。",
    "現在はサービス提供準備中で、購入・生成・送信はできません。",
  );
});

check("launch-enabled rendering replaces every unavailable status", () => {
  for (const [source, enabledCopy] of [
    [hero, "相談入力と安全確認のあと、受け取り方法を確認して購入へ進みます。"],
    [flow, "相談入力と安全確認のあと、購入・生成・メール配信までを順に進めます。"],
    [price, "相談入力と安全確認のあと、購入手続きへ進みます。"],
    [final, "通常鑑定OKの場合だけ、購入と鑑定ノートの受け取りへ進みます。"],
  ]) {
    assert.match(source, new RegExp(`paymentEnabled[\\s\\S]*?${enabledCopy}`, "u"));
  }
  assert.doesNotMatch(
    home.slice(0, home.indexOf("function RequestCta")),
    /現在は購入できません/u,
  );
});

check("launch predicate remains all-flags fail-closed", () => {
  const state = new Map();
  for (const name of RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS) state.set(name, true);
  for (const name of RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS) state.set(name, false);
  const enabled = (name) => state.get(name) === true;

  assert.equal(isRc2NewPurchaseActivationReady(enabled, true), true);
  assert.equal(isRc2NewPurchaseActivationReady(enabled, false), false);
  for (const name of RC2_NEW_PURCHASE_REQUIRED_ENABLED_FLAGS) {
    state.set(name, false);
    assert.equal(isRc2NewPurchaseActivationReady(enabled, true), false, name);
    state.set(name, true);
  }
  for (const name of RC2_NEW_PURCHASE_BLOCKING_STOP_FLAGS) {
    state.set(name, true);
    assert.equal(isRc2NewPurchaseActivationReady(enabled, true), false, name);
    state.set(name, false);
  }
});

check("Top CTA and Product truth remain unchanged", () => {
  assert.match(home, /href="\/request"[\s\S]*?button--primary/u);
  assert.equal((hero.match(/<RequestCta className="lp-home-hero__primary" \/>/gu) ?? []).length, 1);
  assert.equal((final.match(/<RequestCta \/>/gu) ?? []).length, 1);
  for (const literal of [
    "税込980円",
    "1相談・1鑑定ノート",
    "1相談 / 1鑑定ノート",
    "都度払い",
    "自動更新なし",
    "18歳以上対象",
  ]) {
    assert.ok(home.includes(literal), literal);
  }
});

check("Top introduces no new execution surface", () => {
  assert.doesNotMatch(home, /fetch\(|\/api\/|checkout|stripe|supabase|signIn|OAuth/u);
});

check("working diff has no whitespace errors", () => {
  git(["diff", "--check"]);
});

console.log(`GROUP_I_TOP_AVAILABILITY_R1: PASS (${passed}/${passed})`);
