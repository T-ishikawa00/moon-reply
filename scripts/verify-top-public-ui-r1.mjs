import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const authority = "2bf5e75d5f3da7510ae69ce41b404a9bc4b3335a";
let passed = 0;

function text(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function git(args) {
  return execFileSync("git", ["-c", "safe.directory=C:/projects/moon-reply", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
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

const home = text("app/page.tsx");
const header = text("components/layout/SiteHeader.tsx");
const footer = text("components/layout/SiteFooter.tsx");
const css = text("app/globals.css");
const legal = text("lib/legal/current-content.ts");
const hero = section(
  home,
  '<section className="lp-home-hero"',
  '<section className="lp-home-section',
);

check("candidate starts from the exact accepted release authority", () => {
  assert.equal(git(["merge-base", authority, "HEAD"]), authority);
});

check("changes stay inside the focused Public UI scope", () => {
  const tracked = git(["diff", "--name-only", authority])
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean);
  const changed = [...new Set([...tracked, ...untracked])].sort();
  assert.deepEqual(changed, [
    "app/globals.css",
    "app/page.tsx",
    "package.json",
    "scripts/verify-top-public-ui-r1.mjs",
  ]);
});

check("one Hero primary action leads to the existing request route", () => {
  assert.equal((hero.match(/<RequestCta className="lp-home-hero__primary" \/>/gu) ?? []).length, 1);
  assert.match(home, /<Link[\s\S]*?href="\/request"[\s\S]*?button--primary/u);
  assert.ok(existsSync(path.join(root, "app/request/page.tsx")));
});

check("Hero sample path is visibly secondary and uses the public sample", () => {
  assert.match(
    hero,
    /href="\/sample-report"[\s\S]*?className="lp-home-hero__sample text-link text-link--night"/u,
  );
  assert.doesNotMatch(hero, /href="\/sample-report"[\s\S]{0,120}button--secondary/u);
  assert.ok(existsSync(path.join(root, "app/sample-report/page.tsx")));
});

check("first view states what the Product does without supernatural claims", () => {
  for (const literal of [
    "送るか、待つか。",
    "今夜の答えを、一冊の鑑定ノートに。",
    "入力された文面と状況をAIが整理・分析",
    "判断材料",
    "実際に送れる文面",
    "数日間の方針",
    "相手の本心や未来を断定するものではありません",
  ]) {
    assert.ok(hero.includes(literal), literal);
  }
  assert.doesNotMatch(hero, /タロット|占星術|霊感|未来予知/u);
});

check("first view exposes the complete one-time JPY980 offer", () => {
  assert.match(hero, /<span>税込<\/span>[\s\S]*?<strong>980<\/strong>[\s\S]*?<span>円<\/span>/u);
  for (const literal of ["1相談につき1鑑定ノート", "都度払い・自動更新なし", "18歳以上対象"] ) {
    assert.ok(hero.includes(literal), literal);
  }
});

check("Homepage remains aligned with canonical Product facts", () => {
  for (const literal of [
    "恋のメッセージ鑑定ノート",
    "税込980円",
    "1相談 / 1鑑定ノート",
    "都度払い",
    "自動更新なし",
    "18歳以上",
  ]) {
    assert.ok(legal.includes(literal), `legal: ${literal}`);
    assert.ok(home.includes(literal), `home: ${literal}`);
  }
});

check("Header keeps returning-user navigation and a muted sample path", () => {
  assert.match(header, /<CustomerSessionNav \/>/u);
  assert.match(header, /href="\/request" className="site-nav__cta"/u);
  assert.match(header, /href="\/sample-report"[\s\S]*?className="site-nav__link site-nav__sample"/u);
  assert.match(css, /\.site-nav__link \{ color: var\(--paper-300\); \}/u);
  assert.match(css, /\.site-nav__sample \{[^}]*border-left:/u);
});

check("all public navigation targets already exist", () => {
  for (const route of ["request", "sample-report", "login", "account"]) {
    assert.ok(existsSync(path.join(root, `app/${route}/page.tsx`)), route);
  }
  for (const anchor of ["note", "flow", "price", "boundaries", "faq"]) {
    assert.ok(home.includes(`id="${anchor}"`), anchor);
    assert.ok(`${header}\n${footer}`.includes(`/#${anchor}`), anchor);
  }
  assert.ok(!existsSync(path.join(root, "app/faq/page.tsx")));
  assert.ok(!existsSync(path.join(root, "app/guide/page.tsx")));
});

check("section order leads from offer to delivery, flow, proof, price, and FAQ", () => {
  const positions = [
    home.indexOf('id="answers-title"'),
    home.indexOf('id="flow"'),
    home.indexOf('id="note"'),
    home.indexOf("lp-home-section--sample"),
    home.indexOf('id="price"'),
    home.indexOf('id="faq"'),
  ];
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

check("public Top does not advertise review-only routes or an unproved fixed chapter count", () => {
  assert.doesNotMatch(home, /href="\/review\//u);
  assert.doesNotMatch(home, /14部構成/u);
  assert.match(home, /固定された架空ケース/u);
  assert.match(home, /購入者事例、レビュー、AI生成実績ではありません/u);
});

check("safe-off customer truth remains visible", () => {
  assert.match(hero, /現在は購入・生成・メール送信を利用できません/u);
  assert.match(home, /決済・生成・メール配信は動作しません/u);
  assert.doesNotMatch(hero, /今すぐ購入|決済へ進む|数分で納品/u);
});

check("Homepage introduces no Checkout, API, Provider, or Auth execution", () => {
  assert.doesNotMatch(home, /fetch\(|\/api\/|checkout|stripe|supabase|signIn|OAuth/u);
  assert.doesNotMatch(header, /fetch\(|\/api\/|checkout|stripe|supabase/u);
});

check("heading and labelled-region semantics remain intact", () => {
  assert.equal((home.match(/<h1/gu) ?? []).length, 1);
  assert.match(hero, /aria-labelledby="lp-hero-title"/u);
  assert.match(hero, /<h1 id="lp-hero-title">/u);
  assert.match(hero, /aria-label="商品条件"/u);
});

check("Primary CTA is stronger than sample in desktop and mobile CSS", () => {
  assert.match(css, /\.lp-home-hero__primary \{[\s\S]*?min-height: 3\.5rem/u);
  assert.match(css, /\.lp-home-hero__sample \{[\s\S]*?font-size: 0\.86rem/u);
  assert.match(
    css,
    /@media \(max-width: 640px\)[\s\S]*?\.lp-home-hero__actions,[\s\S]*?\.lp-home-hero__primary \{[\s\S]*?width: 100%/u,
  );
});

check("mobile wrapping, tap targets, focus, and reduced motion stay protected", () => {
  assert.match(css, /\.site-nav__link,[\s\S]*?\.site-nav__cta \{[^}]*min-height: 2\.75rem/u);
  assert.match(css, /:focus-visible \{[\s\S]*?outline: 3px solid/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.button:hover,[\s\S]*?transform: none/u);
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?\.lp-home-hero__offer \{[\s\S]*?grid-template-columns: auto minmax\(0, 1fr\)/u);
});

check("working diff has no whitespace errors", () => {
  git(["diff", "--check"]);
});

console.log(`TOP_PUBLIC_UI_R1: PASS (${passed}/${passed})`);
