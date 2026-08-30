import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const parent = "e8e0d6c91f9894ee11858daaa3c2f528c39d6a54";
let passed = 0;

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  ).trim();
}

function check(label, assertion) {
  assertion();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${label}`);
}

const page = read("app/legal/tokushoho/page.tsx");
const footer = read("components/layout/SiteFooter.tsx");
const noticeMatch = page.match(
  /<CustomerNotice title="販売事業者情報について">([\s\S]*?)<\/CustomerNotice>/u,
);
assert.ok(noticeMatch);
const disclosureNotice = noticeMatch[1];

check("branch is based on the integrated Paid Quality release", () => {
  assert.equal(git(["merge-base", parent, "HEAD"]), parent);
  const ahead = Number(git(["rev-list", "--count", `${parent}..HEAD`]));
  assert.ok(ahead === 0 || ahead === 1);
  if (ahead === 1) assert.equal(git(["rev-parse", "HEAD^"]), parent);
});

check("change scope is the Tokushoho page and focused verifier only", () => {
  const tracked = git(["diff", "--name-only", parent])
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean);
  assert.deepEqual([...new Set([...tracked, ...untracked])].sort(), [
    "app/legal/tokushoho/page.tsx",
    "package.json",
    "scripts/verify-tokushoho-disclosure-cta-final.mjs",
  ]);
});

check("disclosure-on-request legal copy remains exact", () => {
  assert.ok(
    disclosureNotice.includes(
      "販売業者の氏名（名称）、住所および電話番号は、請求があった場合、遅滞なく開示します。",
    ),
  );
  assert.ok(
    disclosureNotice.includes(
      "開示をご希望の場合は、サイト内のお問い合わせ窓口からご連絡ください。",
    ),
  );
});

check("large disclosure CTA is absent", () => {
  assert.equal(page.includes("販売事業者情報の開示を請求する"), false);
  assert.equal(disclosureNotice.includes("legal-document-action"), false);
});

check("disclosure block contains no direct Contact link", () => {
  assert.doesNotMatch(disclosureNotice, /<Link|href="\/contact"/u);
  assert.match(disclosureNotice, /お問い合わせ窓口/u);
});

check("normal Contact navigation remains available", () => {
  assert.match(footer, /\{ href: "\/contact", label: "お問い合わせ" \}/u);
});

check("other sales, refund, and disclosure truth remains", () => {
  for (const copy of [
    "現在確定している販売条件",
    "AI利用と商品の性質",
    "取消し・返金",
    "提供方法",
    "提供時期",
  ]) {
    assert.ok(page.includes(copy), copy);
  }
  assert.match(page, /href="\/legal\/refund"/u);
});

console.log(`Tokushoho disclosure CTA final PASS (${passed}/${passed}).`);
