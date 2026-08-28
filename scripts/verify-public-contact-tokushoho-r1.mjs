import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const parentCandidate = "24fe00744dfc3b20c88be1e5a63afb89e06bd748";
const release = "3c3ab59aabb6765164b988444d52210260c8b2cf";
const publicEmail = "t.ishi1323@gmail.com";
let passed = 0;

function text(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function git(args) {
  return execFileSync(
    "git",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  ).trim();
}

function check(label, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${label}`);
}

const contact = text("app/contact/page.tsx");
const tokushoho = text("app/legal/tokushoho/page.tsx");
const footer = text("components/layout/SiteFooter.tsx");
const sample = text("components/report/PublicSampleReport.tsx");
const legalFacts = text("lib/legal/current-content.ts");

check("candidate extends the exact Public Surface candidate and release", () => {
  assert.equal(git(["merge-base", parentCandidate, "HEAD"]), parentCandidate);
  assert.equal(git(["rev-parse", `${parentCandidate}^`]), release);
});

check("change scope stays within the two Public routes and focused verifier", () => {
  const tracked = git(["diff", "--name-only", parentCandidate])
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean);
  assert.deepEqual([...new Set([...tracked, ...untracked])].sort(), [
    "app/contact/page.tsx",
    "app/legal/tokushoho/page.tsx",
    "package.json",
    "scripts/verify-public-contact-tokushoho-r1.mjs",
  ]);
});

check("Contact publishes the exact Human-approved email and mailto", () => {
  assert.ok(contact.includes(`const publicContactEmail = "${publicEmail}";`));
  assert.match(contact, /href=\{`mailto:\$\{publicContactEmail\}`\}/u);
  assert.match(contact, /\{publicContactEmail\}/u);
});

check("Contact is public and independent from Support, Auth, and purchase state", () => {
  assert.doesNotMatch(
    contact,
    /CustomerSupportForm|CUSTOMER_SUPPORT_CASES_ENABLED|isCustomerSupportCasesEnabled|isCustomerAuthFoundationEnabled|createCustomerIdentityAuthApplication|searchParams|purchaseIntentId/u,
  );
  assert.match(contact, /export default function ContactPage\(\)/u);
});

check("Contact covers the six authorized inquiry purposes", () => {
  for (const copy of [
    "鑑定ノートについて",
    "決済・返金について",
    "メール通知について",
    "プライバシーについて",
    "特定商取引法に基づく販売事業者情報の開示請求",
    "その他サービスについて",
  ]) {
    assert.ok(contact.includes(copy), copy);
  }
});

check("Contact no longer presents the unusable prelaunch states", () => {
  for (const copy of [
    "お問い合わせ窓口は現在準備中です",
    "このページからメッセージを送信することはできません",
    "外部受付方法は現在準備中です",
    "現在、お問い合わせを受け付けられません",
  ]) {
    assert.ok(!contact.includes(copy), copy);
  }
  assert.match(contact, /カード番号、パスワード、ログインコードなどの秘密情報/u);
});

check("Tokushoho contains disclosure-on-request copy and a Contact path", () => {
  assert.ok(
    tokushoho.includes(
      "販売業者の氏名（名称）、住所および電話番号は、請求があった場合、遅滞なく開示します。",
    ),
  );
  assert.match(tokushoho, /href="\/contact"/u);
  assert.match(tokushoho, /販売事業者情報の開示を請求する/u);
});

check("no Human name, street address, or phone number was added to Tokushoho", () => {
  assert.ok(!tokushoho.includes(publicEmail));
  assert.doesNotMatch(tokushoho, /〒\s*\d{3}-?\d{4}/u);
  assert.doesNotMatch(tokushoho, /0\d{1,4}-\d{1,4}-\d{3,4}/u);
});

check("price, renewal, delivery, and refund truth remain present", () => {
  for (const copy of [
    "販売価格",
    "購入形態",
    "支払時期",
    "提供方法",
    "提供時期",
    "取消し・返金",
  ]) {
    assert.ok(tokushoho.includes(copy), copy);
  }
  for (const copy of [
    "税込980円",
    "1相談 / 1鑑定ノート",
    "都度払い",
    "自動更新なし",
  ]) {
    assert.ok(legalFacts.includes(copy), copy);
  }
});

check("existing Footer and Public sample fixes remain intact", () => {
  assert.match(footer, /<span>2026<\/span>/u);
  assert.doesNotMatch(footer, /サービス準備中/u);
  assert.doesNotMatch(sample, /審査メタデータを表示|ReportComparisonNavigation|sample ID/u);
});

console.log(`PASS public Contact + Tokushoho R1 verifier (${passed}/${passed})`);
