import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const safeRepositoryRoot = repositoryRoot.replaceAll("\\", "/");
const gitExecutable = process.platform === "win32" ? "git.exe" : "git";

const baseline = "3d3888f53293231506838195c478fa2e1a88417f";
const expectedBranch = "codex/stripe-first-customer-public-copy-alignment";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const acceptedStripeStatus =
  "stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete";

const paths = {
  home: "app/page.tsx",
  requestPage: "app/request/page.tsx",
  samplePage: "app/sample-report/page.tsx",
  requestForm: "components/request/RequestForm.tsx",
  publicSample: "components/report/PublicSampleReport.tsx",
  customerNote: "components/runtime/CustomerAssessmentNote.tsx",
  paymentConfirmation: "docs/payment/PAYMENT_CONFIRMATION_SCREEN_SPEC.md",
  paymentStrategy: "docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md",
  verifier: "scripts/verify-stripe-first-public-copy-alignment.mjs",
};

const exactScope = [
  paths.home,
  paths.requestPage,
  paths.samplePage,
  paths.requestForm,
  paths.publicSample,
  paths.customerNote,
  paths.paymentConfirmation,
  paths.paymentStrategy,
  paths.verifier,
];
const updatedPaths = exactScope.slice(0, 8);
const newPaths = exactScope.slice(8);

if (path.resolve(process.cwd()) !== repositoryRoot) {
  throw new Error(`Run from repository root: ${repositoryRoot}`);
}

function runGit(args) {
  const completed = spawnSync(
    gitExecutable,
    ["-c", `safe.directory=${safeRepositoryRoot}`, ...args],
    {
      cwd: repositoryRoot,
      encoding: null,
      maxBuffer: 128 * 1024 * 1024,
      windowsHide: true,
    },
  );

  if (completed.error || completed.status !== 0) {
    const stderr = completed.stderr?.toString("utf8").trim() ?? "";
    const stdout = completed.stdout?.toString("utf8").trim() ?? "";
    throw new Error(
      `git ${args.join(" ")} failed: ${stderr || stdout || completed.error}`,
    );
  }

  return completed.stdout;
}

function git(...args) {
  return runGit(args).toString("utf8").trim();
}

function gitSucceeds(...args) {
  const completed = spawnSync(
    gitExecutable,
    ["-c", `safe.directory=${safeRepositoryRoot}`, ...args],
    {
      cwd: repositoryRoot,
      encoding: null,
      maxBuffer: 128 * 1024 * 1024,
      windowsHide: true,
    },
  );
  return !completed.error && completed.status === 0;
}

function normalizeText(value) {
  return value.replace(/\r\n?/gu, "\n");
}

function readText(relativePath) {
  return normalizeText(
    readFileSync(path.join(repositoryRoot, relativePath), "utf8"),
  );
}

function readBaselineText(relativePath) {
  return normalizeText(runGit(["show", `${baseline}:${relativePath}`]).toString("utf8"));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function nulEntries(buffer) {
  return buffer
    .toString("utf8")
    .split("\0")
    .map((value) => value.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function changedPathsFromBaseline() {
  const tracked = git(
    "diff",
    "--name-only",
    "--no-renames",
    baseline,
    "--",
  )
    .split(/\r?\n/gu)
    .map((value) => value.trim().replaceAll("\\", "/"))
    .filter(Boolean);
  const untracked = nulEntries(
    runGit(["ls-files", "--others", "--exclude-standard", "-z"]),
  );
  return sorted(new Set([...tracked, ...untracked]));
}

function countOccurrences(source, value) {
  return source.split(value).length - 1;
}

function includesAll(source, snippets) {
  return snippets.every((snippet) => source.includes(snippet));
}

function ordered(source, snippets) {
  let cursor = -1;
  for (const snippet of snippets) {
    cursor = source.indexOf(snippet, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

function sourceSlice(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`${label} markers are missing`);
  }
  return source.slice(start, end + endMarker.length);
}

function maskRange(source, startMarker, endMarker, label, replacement = null) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`${label} markers are missing`);
  }
  const token = replacement ?? `__${label}__`;
  return source.slice(0, start) + token + source.slice(end + endMarker.length);
}

function replaceOnce(source, before, after, label) {
  if (countOccurrences(source, before) !== 1) {
    throw new Error(`${label} expected exactly one baseline occurrence`);
  }
  return source.replace(before, after);
}

const failures = [];
let checkCount = 0;

function check(label, condition) {
  checkCount += 1;
  if (condition) {
    console.log(`PASS ${label}`);
    return;
  }
  failures.push(label);
  console.error(`FAIL ${label}`);
}

const changedPaths = changedPathsFromBaseline();
const commitsAfterBaseline = Number(
  git("rev-list", "--count", `${baseline}..HEAD`),
);
const exactDirectBaseline =
  git("merge-base", baseline, "HEAD") === baseline &&
  ((commitsAfterBaseline === 0 && git("rev-parse", "HEAD") === baseline) ||
    (commitsAfterBaseline === 1 && git("rev-parse", "HEAD^") === baseline));

check("exact direct baseline", exactDirectBaseline);
check("expected implementation branch", git("branch", "--show-current") === expectedBranch);
check(
  "main and origin/main remain fixed",
  git("rev-parse", "main") === expectedMain &&
    git("rev-parse", "origin/main") === expectedMain,
);
check(
  "exact mutation manifest 9/9",
  isDeepStrictEqual(changedPaths, sorted(exactScope)),
);
check(
  "update/new classification 8/1",
  updatedPaths.every(
    (relativePath) =>
      existsSync(path.join(repositoryRoot, relativePath)) &&
      gitSucceeds("cat-file", "-e", `${baseline}:${relativePath}`),
  ) &&
    newPaths.every(
      (relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)) &&
        !gitSucceeds("cat-file", "-e", `${baseline}:${relativePath}`),
    ),
);

const home = readText(paths.home);
const requestPage = readText(paths.requestPage);
const samplePage = readText(paths.samplePage);
const requestForm = readText(paths.requestForm);
const publicSample = readText(paths.publicSample);
const customerNote = readText(paths.customerNote);
const paymentConfirmation = readText(paths.paymentConfirmation);
const paymentStrategy = readText(paths.paymentStrategy);

const customerSources = [
  home,
  requestPage,
  samplePage,
  requestForm,
  publicSample,
  customerNote,
];
check(
  "customer surfaces preserve Service and Product identity",
  customerSources.every((source) =>
    includesAll(source, ["月の返事", "恋のメッセージ鑑定ノート"]),
  ),
);
check(
  "customer surfaces explain AI decision support",
  customerSources.every((source) => includesAll(source, ["AI", "判断材料"])),
);

const heroStart = '<p className="lp-home-hero__lead">';
const hero = sourceSlice(home, heroStart, "</p>", "Hero lead");
check(
  "Hero uses supplied message and context",
  includesAll(hero, ["入力された", "文面", "状況"]),
);
check(
  "Hero explains AI organization and analysis",
  includesAll(hero, ["AI", "整理・分析"]),
);
check("Hero states decision-support purpose", hero.includes("判断材料"));
check(
  "Hero rejects true-feelings and future assertion",
  includesAll(hero, ["本心", "未来", "断定するものではありません"]),
);
check(
  "Home change is confined to the existing Hero lead",
  maskRange(home, heroStart, "</p>", "HERO_LEAD") ===
    maskRange(
      readBaselineText(paths.home),
      heroStart,
      "</p>",
      "HERO_LEAD",
    ),
);

const metadataStart = "export const metadata: Metadata = {";
const requestMetadata = sourceSlice(
  requestPage,
  metadataStart,
  "};",
  "Request metadata",
);
const requestIntro = sourceSlice(
  requestPage,
  '<section className="request-page__intro"',
  "</section>",
  "Request intro",
);
check(
  "Request metadata aligns Product function",
  includesAll(requestMetadata, [
    "鑑定依頼シート",
    "月の返事",
    "関係性",
    "メッセージ",
    "AI",
    "整理・分析",
    "判断材料",
    "恋のメッセージ鑑定ノート",
  ]),
);
check(
  "Request intro explains intended Product once before review boundary",
  countOccurrences(requestIntro, "AIが整理・分析") === 1 &&
    includesAll(requestIntro, [
      "入力された関係性・状況・メッセージ",
      "判断材料",
      "相手の本心や未来を断定するものではありません",
    ]) &&
    requestIntro.indexOf("恋のメッセージ鑑定ノートでは") <
      requestIntro.indexOf('className="request-page__boundary"'),
);
check(
  "Request local-review boundary remains explicit",
  includesAll(requestIntro, [
    "現在は審査用のローカル確認です",
    "入力内容は外部へ送信・保存されず",
    "決済、AI生成、メール送信も行われません",
    "再読み込みすると入力は失われます",
  ]),
);

const requestProductSpanStart =
  "          <span>\n            恋のメッセージ鑑定ノートでは";
let requestPageOutsideCopy = maskRange(
  requestPage,
  requestProductSpanStart,
  "          </span>\n",
  "REQUEST_PRODUCT_EXPLANATION",
  "",
);
requestPageOutsideCopy = maskRange(
  requestPageOutsideCopy,
  metadataStart,
  "};",
  "REQUEST_METADATA",
);
const requestBaselineOutsideCopy = maskRange(
  readBaselineText(paths.requestPage),
  metadataStart,
  "};",
  "REQUEST_METADATA",
);
check(
  "Request change is confined to metadata and one intro explanation",
  requestPageOutsideCopy === requestBaselineOutsideCopy,
);

const sampleMetadata = sourceSlice(
  samplePage,
  metadataStart,
  "};",
  "Sample metadata",
);
check(
  "Sample metadata distinguishes Product from fixed fictional sample",
  includesAll(sampleMetadata, [
    "月の返事",
    "恋のメッセージ鑑定ノート",
    "固定された架空の全文見本",
    "AI",
    "整理・分析",
    "判断材料",
    "実在事例でもAI生成実績でもありません",
  ]),
);
check(
  "Sample page change is metadata-only",
  maskRange(samplePage, metadataStart, "};", "SAMPLE_METADATA") ===
    maskRange(
      readBaselineText(paths.samplePage),
      metadataStart,
      "};",
      "SAMPLE_METADATA",
    ),
);

const localConfirmation = sourceSlice(
  requestForm,
  "function LocalPurchaseConfirmation({",
  "export function RequestForm()",
  "LocalPurchaseConfirmation",
);
check(
  "LIVE confirmation preserves Safety-specific presentation rows",
  ordered(localConfirmation, [
    "presentation.scopeLabel",
    "presentation.heading",
    "presentation.description",
    "presentation.draftAvailability",
    "form.relationship",
    'form.whatToKnow.join("、")',
    "form.email",
  ]),
);
check(
  "LIVE confirmation identifies Service and Product",
  includesAll(localConfirmation, [
    'label="サービス" value="月の返事"',
    'label="商品" value="恋のメッセージ鑑定ノート"',
  ]),
);
check(
  "LIVE confirmation explains AI decision-support function",
  includesAll(localConfirmation, [
    'label="商品の役割"',
    "入力された状況・文面",
    "AIが整理・分析",
    "判断材料",
  ]),
);
check(
  "LIVE confirmation shows quantity, price, and purchase type",
  includesAll(localConfirmation, [
    'label="数量" value="1相談 / 1鑑定ノート"',
    'value="税込980円"',
    'label="購入形式" value="都度払い"',
    'label="自動更新" value="なし"',
  ]),
);
check(
  "LIVE confirmation shows non-guarantee boundary",
  includesAll(localConfirmation, [
    'label="結果について"',
    "相手の本心、返信、復縁、将来の結果を断定・保証しません",
  ]),
);
check(
  "LIVE confirmation binds delivery/recovery email",
  includesAll(localConfirmation, [
    'label="受け取り・復旧メール"',
    "value={form.email}",
  ]),
);
check(
  "LIVE confirmation remains non-payment review UI",
  includesAll(localConfirmation, [
    "決済機能は現在準備中です",
    "この画面では料金は発生しません",
    "disabled aria-disabled=\"true\"",
    "購入機能は現在準備中です",
  ]) && !/(?:Stripe|Checkout)/u.test(localConfirmation),
);
check(
  "LIVE confirmation uses the bounded 13-row information structure",
  countOccurrences(localConfirmation, "<MemoRow") === 13,
);
check(
  "RequestForm change is confined to LocalPurchaseConfirmation",
  maskRange(
    requestForm,
    "function LocalPurchaseConfirmation({",
    "export function RequestForm()",
    "LOCAL_PURCHASE_CONFIRMATION",
  ) ===
    maskRange(
      readBaselineText(paths.requestForm),
      "function LocalPurchaseConfirmation({",
      "export function RequestForm()",
      "LOCAL_PURCHASE_CONFIRMATION",
    ),
);

const sampleIntroStart =
  "            <p>\n              この全文見本は";
const sampleIntro = sourceSlice(
  publicSample,
  sampleIntroStart,
  "            </p>",
  "Public sample intro",
);
check(
  "Public sample remains fixed and fictional",
  includesAll(sampleIntro, [
    "固定架空ケース",
    "実在の相談者・購入者の事例でも、AI生成実績でもありません",
  ]),
);
check(
  "Public sample distinguishes structure/tone from actual Product",
  includesAll(sampleIntro, [
    "構成と文章の雰囲気だけ",
    "月の返事",
    "恋のメッセージ鑑定ノート",
    "入力された関係性やメッセージ",
    "AIが整理・分析",
    "判断材料",
  ]),
);
check(
  "Public sample change is confined to the existing intro paragraph",
  maskRange(
    publicSample,
    sampleIntroStart,
    "            </p>",
    "PUBLIC_SAMPLE_INTRO",
  ) ===
    maskRange(
      readBaselineText(paths.publicSample),
      sampleIntroStart,
      "            </p>",
      "PUBLIC_SAMPLE_INTRO",
    ),
);

const footerStart = '<footer className={styles.fixedLimitation}>';
const customerFooter = sourceSlice(
  customerNote,
  footerStart,
  "</footer>",
  "Customer note footer",
);
check(
  "Runtime note header uses exact Product name",
  customerNote.includes(
    '<p className={styles.documentType}>恋のメッセージ鑑定ノート</p>',
  ),
);
check(
  "Runtime note owns fixed AI/non-guarantee footer copy",
  includesAll(customerFooter, [
    "この鑑定ノートは、入力された情報をAIが整理・分析した判断材料です",
    "相手の本心や返信、復縁、将来の結果を断定・保証するものではありません",
  ]),
);
check(
  "Runtime note always renders renderer-owned footer",
  !/\{fixedLimitation\s*\?\s*\(\s*<footer/gu.test(customerNote),
);
check(
  "Runtime note preserves conditional fixedLimitation",
  customerNote.includes("const fixedLimitation = selectExactText(") &&
    customerFooter.includes(
      "{fixedLimitation ? <p>{fixedLimitation}</p> : null}",
    ),
);

let baselineCustomerMasked = maskRange(
  readBaselineText(paths.customerNote),
  '<p className={styles.documentType}>',
  "</p>",
  "CUSTOMER_NOTE_DOCUMENT_TYPE",
);
baselineCustomerMasked = maskRange(
  baselineCustomerMasked,
  "{fixedLimitation ? (",
  ") : null}",
  "CUSTOMER_NOTE_FOOTER",
);
let currentCustomerMasked = maskRange(
  customerNote,
  '<p className={styles.documentType}>',
  "</p>",
  "CUSTOMER_NOTE_DOCUMENT_TYPE",
);
currentCustomerMasked = maskRange(
  currentCustomerMasked,
  footerStart,
  "</footer>",
  "CUSTOMER_NOTE_FOOTER",
);
check(
  "Runtime renderer change is confined to header and footer copy",
  currentCustomerMasked === baselineCustomerMasked,
);

const baselinePaymentConfirmation = readBaselineText(paths.paymentConfirmation);
const expectedPaymentConfirmation = replaceOnce(
  baselinePaymentConfirmation,
  "- Product: 月の返事 単発鑑定ノート",
  "- Service: 月の返事\n- Product: 恋のメッセージ鑑定ノート",
  "Payment confirmation Product identity",
);
check(
  "Payment confirmation separates Service and Product identity",
  includesAll(paymentConfirmation, [
    "- Service: 月の返事",
    "- Product: 恋のメッセージ鑑定ノート",
    "- Product description: AIによる恋愛メッセージ分析・判断支援デジタルレポート",
  ]) && !paymentConfirmation.includes("Product: 月の返事 単発鑑定ノート"),
);
check(
  "Payment confirmation remains unimplemented and unauthorized",
  includesAll(paymentConfirmation, [
    "This is a specification, not an implemented screen.",
    "do not authorize screen implementation, checkout, a Provider SDK/API, or a payment action",
  ]),
);
check(
  "Payment confirmation change is identity-only",
  paymentConfirmation === expectedPaymentConfirmation,
);

const baselinePaymentStrategy = readBaselineText(paths.paymentStrategy);
const staleStrategyLine =
  "- `docs/payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md`: current Stripe transition Candidate; acceptance pending.";
const acceptedStrategyLine =
  `- \`docs/payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md\`: Stripe transition Candidate source; accepted status is \`${acceptedStripeStatus}\`.`;
const expectedPaymentStrategy = replaceOnce(
  baselinePaymentStrategy,
  staleStrategyLine,
  acceptedStrategyLine,
  "Stripe strategy related-document status",
);
check(
  "Stripe-first strategy uses accepted exact status",
  countOccurrences(paymentStrategy, acceptedStripeStatus) >= 2 &&
    !paymentStrategy.includes("acceptance pending"),
);
check(
  "Payment implementation remains unauthorized",
  includesAll(paymentStrategy, [
    "Payment implementation authorized: `false`",
    "Provider SDK / API / checkout / webhook | Unauthorized and unimplemented",
    "Purchase/entitlement DB or migration work | Unauthorized",
    "Runtime / LUNA activation change | Unauthorized",
  ]),
);
check(
  "Stripe evidence/selection and fallback boundaries remain intact",
  includesAll(paymentStrategy, [
    "Stripe feasibility / account / contact / approval / activation | Not established / absent / none / absent / absent",
    "Stripe formal selection | Incomplete",
    "PayPay lifecycle / enablement | Desired; `Public Preview`; Not enabled; Not approved; recheck-gated",
    "PAY.JP | Paused fallback; Not approved; Not selected",
  ]),
);
check(
  "Strategy change is the bounded stale-status correction only",
  paymentStrategy === expectedPaymentStrategy,
);

const forbiddenChangedPaths = changedPaths.filter((relativePath) => {
  if (relativePath.endsWith(".css")) return true;
  if (relativePath.startsWith("fixtures/")) return true;
  if (relativePath.startsWith("supabase/")) return true;
  if (relativePath.startsWith("lib/assessment/runtime/")) return true;
  if (relativePath.startsWith("app/api/")) return true;
  if (/^(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/u.test(relativePath)) {
    return true;
  }
  if (/^(?:app|components|lib|docs)\/legal\//u.test(relativePath)) return true;
  if (/(?:prompt|luna)/iu.test(relativePath)) return true;
  if (/(?:email.*template|template.*email)/iu.test(relativePath)) return true;
  if (relativePath === "scripts/verify-m1-content-locks.mjs") return true;
  if (
    !relativePath.startsWith("docs/") &&
    /(?:payment|checkout|provider|supabase|migration)/iu.test(relativePath)
  ) {
    return true;
  }
  return false;
});
check("hard-exclusion path set remains empty", forbiddenChangedPaths.length === 0);
check(
  "historical verifier remains byte-semantically unchanged",
  readText("scripts/verify-m1-content-locks.mjs") ===
    readBaselineText("scripts/verify-m1-content-locks.mjs"),
);
check(
  "Safety verifier remains byte-semantically unchanged",
  readText("scripts/verify-m1-safety-policy.mjs") ===
    readBaselineText("scripts/verify-m1-safety-policy.mjs"),
);

if (failures.length > 0) {
  console.error(`FAIL Stripe-first public-copy alignment: ${failures.length}/${checkCount} checks failed`);
  for (const label of failures) console.error(` - ${label}`);
  process.exit(1);
}

console.log(`PASS Stripe-first public-copy alignment: ${checkCount}/${checkCount} checks passed`);
