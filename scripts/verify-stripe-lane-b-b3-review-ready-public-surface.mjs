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

const baseline = "9762a47b4ca4a38ae18f5c1e2e69a1cbe08e5230";
const initialCandidate = "b1b695e0f444478928c31280062dea0ae5d7c14a";
const reviewCorrectionR1 = "5e429501d5d11b9aa1d2f9b7da0a9e268c177afb";
const expectedBranch = "codex/stripe-lane-b-b3-review-ready-public-surface";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const acceptedB2Status =
  "stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete";
const candidateStatus =
  "stripe_lane_b_b3_review_ready_website_public_surface_candidate_ready_pending_human_visual_chatgpt_review";

const updatedPaths = [
  "app/globals.css",
  "app/contact/page.tsx",
  "app/legal/ai-disclosure/page.tsx",
  "app/legal/page.tsx",
  "app/legal/privacy/page.tsx",
  "app/legal/refund/page.tsx",
  "app/legal/terms/page.tsx",
  "app/legal/tokushoho/page.tsx",
  "app/legal/unsupported-cases/page.tsx",
  "components/review/ReviewPurchaseConfirmation.tsx",
  "components/review/ReviewRequestConfirmation.tsx",
  "fixtures/review/purchase-confirmations.ts",
  "lib/legal/review-content.ts",
];
const newPaths = [
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];
const exactScope = [...updatedPaths, ...newPaths];
const correctionR1Scope = [
  "lib/legal/review-content.ts",
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];
const correctionR2Scope = [
  "app/globals.css",
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];

const routeFiles = [
  "app/legal/page.tsx",
  "app/legal/terms/page.tsx",
  "app/legal/privacy/page.tsx",
  "app/legal/tokushoho/page.tsx",
  "app/legal/refund/page.tsx",
  "app/legal/ai-disclosure/page.tsx",
  "app/legal/unsupported-cases/page.tsx",
  "app/contact/page.tsx",
  "app/review/request/confirmation/[fixtureId]/page.tsx",
  "app/review/purchase/confirmation/[fixtureId]/page.tsx",
];

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
  return normalizeText(
    runGit(["show", `${baseline}:${relativePath}`]).toString("utf8"),
  );
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

function changedPathsFrom(reference) {
  const tracked = git("diff", "--name-only", "--no-renames", reference, "--")
    .split(/\r?\n/gu)
    .map((value) => value.trim().replaceAll("\\", "/"))
    .filter(Boolean);
  const untracked = nulEntries(
    runGit(["ls-files", "--others", "--exclude-standard", "-z"]),
  );
  return sorted(new Set([...tracked, ...untracked]));
}

function changedPathsFromBaseline() {
  return changedPathsFrom(baseline);
}

function includesAll(source, snippets) {
  return snippets.every((snippet) => source.includes(snippet));
}

function sourceSlice(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`${label} markers are missing`);
  }
  return source.slice(start, end + endMarker.length);
}

function stripFixtureMetadata(source) {
  return source.replace(
    /<details className="request-review-metadata">[\s\S]*?<\/details>/gu,
    "__COLLAPSED_REVIEW_METADATA__",
  );
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
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

const commitsAfterBaseline = Number(
  git("rev-list", "--count", `${baseline}..HEAD`),
);
const currentHead = git("rev-parse", "HEAD");
const headParents = git("rev-list", "--parents", "-n", "1", "HEAD").split(
  /\s+/u,
);
const initialCandidateParents = git(
  "rev-list",
  "--parents",
  "-n",
  "1",
  initialCandidate,
).split(/\s+/u);
const initialCandidateAnchored =
  initialCandidateParents.length === 2 &&
  initialCandidateParents[0] === initialCandidate &&
  initialCandidateParents[1] === baseline;
const reviewCorrectionR1Parents = git(
  "rev-list",
  "--parents",
  "-n",
  "1",
  reviewCorrectionR1,
).split(/\s+/u);
const reviewCorrectionR1Anchored =
  reviewCorrectionR1Parents.length === 2 &&
  reviewCorrectionR1Parents[0] === reviewCorrectionR1 &&
  reviewCorrectionR1Parents[1] === initialCandidate;
const baselineState =
  commitsAfterBaseline === 0 && currentHead === baseline;
const initialCandidateState =
  commitsAfterBaseline === 1 && currentHead === initialCandidate;
const correctionR1State =
  commitsAfterBaseline === 2 &&
  currentHead === reviewCorrectionR1;
const correctionR2State =
  commitsAfterBaseline === 3 &&
  currentHead !== reviewCorrectionR1 &&
  headParents.length === 2 &&
  headParents[1] === reviewCorrectionR1;
const exactLineage =
  initialCandidateAnchored &&
  reviewCorrectionR1Anchored &&
  git("merge-base", baseline, "HEAD") === baseline &&
  commitsAfterBaseline <= 3 &&
  (baselineState ||
    initialCandidateState ||
    correctionR1State ||
    correctionR2State);

check("Initial B3 Candidate parent is the exact baseline", initialCandidateAnchored);
check(
  "exact baseline to Initial Candidate to R1 to optional R2 lineage",
  exactLineage,
);
check("expected B3 branch", git("branch", "--show-current") === expectedBranch);
check(
  "main and origin/main remain fixed",
  git("rev-parse", "main") === expectedMain &&
    git("rev-parse", "origin/main") === expectedMain,
);

const changedPaths = changedPathsFromBaseline();
check(
  "exact 14-path mutation manifest",
  isDeepStrictEqual(changedPaths, sorted(exactScope)),
);
check(
  "update/new classification is exactly 13/1",
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

const correctionR1Paths = git(
  "diff",
  "--name-only",
  "--no-renames",
  initialCandidate,
  reviewCorrectionR1,
  "--",
)
  .split(/\r?\n/gu)
  .map((value) => value.trim().replaceAll("\\", "/"))
  .filter(Boolean);
const correctionR1NameStatuses = git(
  "diff",
  "--name-status",
  "--no-renames",
  initialCandidate,
  reviewCorrectionR1,
  "--",
)
  .split(/\r?\n/gu)
  .filter(Boolean);
check(
  "Review Correction R1 scope is exactly two updates",
  isDeepStrictEqual(sorted(correctionR1Paths), sorted(correctionR1Scope)) &&
    correctionR1NameStatuses.length === 2 &&
    correctionR1NameStatuses.every((entry) => /^M\t/u.test(entry)),
);

const correctionR2Paths = changedPathsFrom(reviewCorrectionR1);
const correctionR2NameStatuses = git(
  "diff",
  "--name-status",
  "--no-renames",
  reviewCorrectionR1,
  "--",
)
  .split(/\r?\n/gu)
  .filter(Boolean);
check(
  "Human Visual QA Correction R2 scope is exactly two updates",
  isDeepStrictEqual(correctionR2Paths, sorted(correctionR2Scope)) &&
    correctionR2NameStatuses.length === 2 &&
    correctionR2NameStatuses.every((entry) => /^M\t/u.test(entry)),
);

const changedNameStatuses = git(
  "diff",
  "--name-status",
  "--no-renames",
  baseline,
  "--",
)
  .split(/\r?\n/gu)
  .filter(Boolean);
check(
  "no delete or rename",
  changedNameStatuses.every((entry) => /^(?:M|A)\t/u.test(entry)),
);
check(
  "next-env.d.ts remains baseline-identical",
  readText("next-env.d.ts") === readBaselineText("next-env.d.ts"),
);
check("baseline Candidate diff check", git("diff", "--check", baseline, "--") === "");
check("working diff check", git("diff", "--check") === "");
check("staged diff check", git("diff", "--cached", "--check") === "");

const globalStyles = readText("app/globals.css");
const authority = readText("lib/legal/review-content.ts");
const legalHub = readText("app/legal/page.tsx");
const terms = readText("app/legal/terms/page.tsx");
const privacy = readText("app/legal/privacy/page.tsx");
const tokushoho = readText("app/legal/tokushoho/page.tsx");
const refund = readText("app/legal/refund/page.tsx");
const aiDisclosure = readText("app/legal/ai-disclosure/page.tsx");
const unsupported = readText("app/legal/unsupported-cases/page.tsx");
const contact = readText("app/contact/page.tsx");
const requestConfirmation = readText(
  "components/review/ReviewRequestConfirmation.tsx",
);
const purchaseConfirmation = readText(
  "components/review/ReviewPurchaseConfirmation.tsx",
);
const purchaseFixture = readText("fixtures/review/purchase-confirmations.ts");

const nightFactLabelRule = sourceSlice(
  globalStyles,
  ".legal-content-section--night .legal-fact-rows dt {",
  "}",
  "night FactRows label rule",
);
const nightFactValueRule = sourceSlice(
  globalStyles,
  ".legal-content-section--night .legal-fact-rows dd {",
  "}",
  "night FactRows value rule",
);
check(
  "night FactRows use explicit high-contrast label and value tokens",
  nightFactLabelRule.includes("color: var(--moon-300)") &&
    nightFactValueRule.includes("color: var(--paper-50)") &&
    !nightFactValueRule.includes("var(--ink-600)"),
);

const paperLegalInformationSelectors = [
  ".legal-document-nav > div > p",
  ".legal-document-nav a small",
  ".legal-content-section > h2::before",
  ".legal-fact-rows dt",
  ".legal-decision-row > details dt",
  ".legal-section-list__heading > span",
  ".legal-category-list li > span",
];
const paperLegalInformationRules = paperLegalInformationSelectors.map(
  (selector) =>
    sourceSlice(
      globalStyles,
      `${selector} {`,
      "}",
      `${selector} paper information rule`,
    ),
);
check(
  "small legal informational text uses the high-contrast paper token",
  paperLegalInformationRules.every(
    (rule) =>
      rule.includes("color: var(--focus-ring-paper)") &&
      !rule.includes("color: var(--moon-600)"),
  ),
);

const legalPageHeadingRule = sourceSlice(
  globalStyles,
  ".legal-page-header h1 {",
  "}",
  "legal page heading rule",
);
const purchaseHeadingRule = sourceSlice(
  globalStyles,
  ".purchase-sheet__header h1 {",
  "}",
  "purchase heading rule",
);
const phraseWrapping = [
  "word-break: normal;",
  "word-break: auto-phrase;",
  "text-wrap: balance;",
];
check(
  "legal page heading uses bounded phrase-aware wrapping",
  includesAll(legalPageHeadingRule, phraseWrapping),
);
check(
  "purchase heading uses bounded phrase-aware wrapping",
  includesAll(purchaseHeadingRule, phraseWrapping),
);

const privacyInventorySummary = sourceSlice(
  authority,
  'name: "プライバシー 審査表示"',
  "  },",
  "Privacy inventory summary",
);
check(
  "Privacy inventory summary reflects internal review processing and unimplemented Production external processing",
  !authority.includes("現在の非送信挙動") &&
    includesAll(privacyInventorySummary, [
      "内部レビュー処理",
      "行われる場合がある",
      "本番の外部処理",
      "未稼働",
    ]),
);

check(
  "B2 accepted authority and B3 pending Candidate status are exact",
  includesAll(authority, [
    acceptedB2Status,
    candidateStatus,
    'candidateDate: "2026-08-13"',
    'humanVisualQa: "pending"',
    'chatgptReview: "pending"',
    'humanAcceptance: "pending"',
    "legalPublicationApproved: false",
    "stripeApprovalEstablished: false",
    "paymentImplemented: false",
  ]),
);
check(
  "review hub separates authority, publication, Stripe, and Payment states",
  includesAll(legalHub, [
    "B2 文書・仕様・法務方針",
    "Human + ChatGPT受入済み",
    "B3 画面実装",
    "レビュー候補",
    "法務公開",
    "未承認",
    "Stripe承認・正式選定",
    "Payment実装",
    "未実装",
    "専門家相談は必要に応じた任意のエスカレーション",
  ]),
);

check(
  "all ten review routes have source and fixed review IDs",
  routeFiles.every((relativePath) =>
    existsSync(path.join(repositoryRoot, relativePath)),
  ) &&
    readText("app/review/request/confirmation/[fixtureId]/page.tsx").includes(
      '"normal-001": "request-normal-001"',
    ) &&
    purchaseFixture.includes('"normal-001": normalPurchaseConfirmation'),
);

const ordinaryCustomerSources = [
  legalHub,
  terms,
  privacy,
  tokushoho,
  refund,
  aiDisclosure,
  unsupported,
  contact,
  stripFixtureMetadata(requestConfirmation),
  stripFixtureMetadata(purchaseConfirmation),
  authority,
].join("\n");
const renderedPageSources = [
  legalHub,
  terms,
  privacy,
  tokushoho,
  refund,
  aiDisclosure,
  unsupported,
  contact,
  stripFixtureMetadata(requestConfirmation),
  stripFixtureMetadata(purchaseConfirmation),
].join("\n");
check(
  "machine authority status strings are not rendered as ordinary copy",
  !renderedPageSources.includes(acceptedB2Status) &&
    !renderedPageSources.includes(candidateStatus),
);
check(
  "ordinary Customer-facing copy does not expose legacy Safety enums",
  !/(?:normal_allowed|needs_review|rejected)/u.test(ordinaryCustomerSources),
);
check(
  "ordinary copy does not expose purchase-authority implementation terms",
  !/(?:purchaseGateSatisfied|server-owned Purchase authority|Candidate status strings)/u.test(
    ordinaryCustomerSources,
  ),
);
check(
  "age eligibility uses the required boolean confirmation",
  [authority, privacy, requestConfirmation, purchaseConfirmation, purchaseFixture].every(
    (source) => source.includes("私は18歳以上です"),
  ) && terms.includes("termsReviewSections"),
);
check(
  "age-band eligibility is absent",
  !/(?:年齢層入力|年齢層を自己申告|18[〜～-]24|25[〜～-]29)/u.test(
    ordinaryCustomerSources,
  ),
);

check(
  "Customer-facing Safety semantics are complete",
  includesAll(authority, [
    "通常の有料鑑定を安全に提供できることが確認されない相談は決済へ進めず",
    "追加情報や確認が必要な場合",
    "待つこと、今は送らないこと",
  ]) &&
    includesAll(unsupported, [
      "危険、緊急、通常鑑定で扱えない内容、無効・矛盾・不明な入力、技術的なエラー",
      "鑑定ノートやメッセージ案も生成しません",
      "自動的に利用不可とは扱いません",
      "Payment Integrity",
    ]),
);

const categoryBlock = sourceSlice(
  authority,
  "export const plannedContactCategories = [",
  "] as const;",
  "planned contact categories",
);
const actualCategories = [
  ...categoryBlock.matchAll(/^\s*"([^"]+)",$/gmu),
].map((match) => match[1]);
const expectedCategories = [
  "結果URL・配信・未着",
  "通常の取消・返金",
  "Payment Integrity・意図しない請求",
  "プライバシー・削除・開示",
  "販売事業者情報の開示請求",
  "その他",
];
check(
  "contact has exactly the accepted six categories",
  isDeepStrictEqual(actualCategories, expectedCategories) &&
    contact.includes("plannedContactCategories.map"),
);
check(
  "contact remains non-operational and seller disclosure blocks publication",
  includesAll(contact, [
    "一つの運用可能な事業用メールボックス",
    "一つのカテゴリ分けされた問い合わせフォーム",
    "実在する受付経路がないため、法務公開を止める項目です",
    "このページから開示請求はできません",
  ]) &&
    !/(?:<form\b|mailto:|onSubmit=|action=)/u.test(contact),
);

check(
  "fixed Product facts show JPY980, one-time purchase, and no renewal",
  includesAll(authority, ["税込980円", "一度きりの購入・自動更新なし"]) &&
    includesAll(purchaseConfirmation, [
      "purchase.product.price",
      "purchase.product.purchaseType",
      "purchase.product.renewal",
    ]),
);
check(
  "Terms align fulfillment, recovery, rights, and non-retroactivity",
  includesAll(authority, [
    "確認済みの配信・回復用メールアドレス",
    "同じ購入の範囲で限定的に復旧し、再課金しません",
    "安全かつ有効な履行が不可能な場合は税込980円を全額返金",
    "正当な返金請求",
    "法令上の権利や重大な商品・サービス上の不具合への救済を排除しません",
    "全面免責や一切返金しない条項は設けません",
    "合理的根拠なく遡って適用しない",
  ]),
);
check(
  "Privacy states internal review truth and unresolved providers",
  includesAll(privacy, [
    "同一オリジンの内部評価先へ送信され",
    "本番データの保存",
    "外部AI事業者での処理",
    "決済処理",
    "メール送信",
    "本番問い合わせ受付",
    "AI処理",
    "決済処理",
    "メール処理",
    "委託・第三者・国外処理",
    "Cookie・analytics",
    "保存期間",
  ]),
);
check(
  "Tokushoho separates fixed, unresolved, and conditional disclosure",
  includesAll(tokushoho, [
    "固定済みの表示項目",
    "未確定の開示項目",
    "法令と実際のStripe要件の双方が許す場合に限り",
    "現在は事業用メール、問い合わせフォーム、受付処理がなく",
  ]) &&
    includesAll(authority, [
      "販売事業者の法的名称",
      "問い合わせフォームURL",
      "決済事業者による返金実行方法",
    ]),
);
check(
  "ordinary refund policy has the required fulfillment boundary",
  includesAll(authority, [
    "鑑定ノートの生成開始前",
    "システム上の記録から客観的に確認",
    "同じ購入の範囲で限定的に復旧し、再課金しません",
    "安全かつ有効な履行が不可能なら税込980円を全額返金",
  ]),
);
check(
  "Payment Integrity corrects actual error without a JPY980 cap",
  includesAll(refund, [
    "重複、誤額、誤った利用者・相談、安全確認のすり抜け",
    "実際の経済的な誤り",
    "是正額を税込980円で打ち切りません",
    "返金・取消・請求是正の実行機能はありません",
  ]) &&
    aiDisclosure.includes("980円を上限とせず是正") &&
    unsupported.includes("980円を上限とせず是正"),
);

check(
  "request confirmation shows adult, facts, email, eligibility, and corrections",
  includesAll(requestConfirmation, [
    "成人確認",
    "私は18歳以上です",
    "今の状況",
    "今の関係",
    "今夜知りたいこと",
    "配信・回復用メール",
    "通常の有料鑑定へ進む条件",
    "相談を修正",
    "文面を修正",
    "安全確認を修正",
    "メールを修正",
    "実際の購入",
  ]),
);

const purchaseLegalLinks = sourceSlice(
  purchaseConfirmation,
  '<section className="purchase-sheet__legal"',
  "</section>",
  "purchase legal links",
);
const expectedLegalLinks = [
  "/legal/terms",
  "/legal/privacy",
  "/legal/tokushoho",
  "/legal/refund",
  "/contact",
  "/legal/ai-disclosure",
  "/legal/unsupported-cases",
];
const actualLegalLinks = [
  ...purchaseLegalLinks.matchAll(/href="([^"]+)"/gu),
].map((match) => match[1]);
check(
  "final confirmation links all seven required review pages",
  isDeepStrictEqual(actualLegalLinks, expectedLegalLinks),
);
check(
  "final confirmation shows all review-only future facts",
  includesAll(purchaseConfirmation, [
    "成人確認",
    "配信・回復用メール",
    "メール確認状態",
    "安全上の利用資格",
    "支払方法",
    "支払時期",
    "提供方法",
    "提供時期",
    "通常の取消・返金",
    "Payment Integrity",
    "成人確認・相談・メールを修正",
  ]) &&
    includesAll(purchaseFixture, [
      'verificationStatus: "未実装（審査用表示）"',
      'paymentMethod: "未確定・未接続"',
      'paymentTiming: "未確定・未接続"',
      'deliveryTiming: "未確定・本番相当の計測待ち"',
      "保護された結果ページと、確認済みの配信・回復用メールへの通知（予定）",
    ]),
);
check(
  "purchase action remains a native disabled button",
  /<button[\s\S]*?type="button"[\s\S]*?disabled[\s\S]*?aria-disabled="true"[\s\S]*?>/u.test(
    purchaseConfirmation,
  ),
);
check(
  "legacy fixture metadata remains collapsed and review-only",
  requestConfirmation.includes(
    '<details className="request-review-metadata">',
  ) &&
    purchaseConfirmation.includes(
      '<details className="request-review-metadata">',
    ) &&
    requestConfirmation.includes('value="normal_allowed"') &&
    purchaseConfirmation.includes("purchase.safetyState"),
);

const implementationSources = updatedPaths
  .map((relativePath) => readText(relativePath))
  .join("\n");
const operationGroups = {
  provider: [
    /from\s+["']stripe["']/giu,
    /@stripe\//giu,
    /new\s+Stripe\s*\(/gu,
    /checkout\.sessions/gu,
    /paymentIntents/gu,
  ],
  payment: [
    /refunds\.create\s*\(/gu,
    /createPayment\s*\(/gu,
    /capturePayment\s*\(/gu,
  ],
  contact: [/<form\b/gu, /mailto:/giu, /onSubmit=/gu, /action=/gu],
  email: [/sendMail\s*\(/gu, /nodemailer/giu, /resend\.emails/giu],
  backend: [/export\s+async\s+function\s+POST\b/gu, /["']use server["']/gu],
  database: [/supabase/giu, /createClient\s*\(/gu, /\.insert\s*\(/gu],
  runtime: [/openai\.responses/giu, /chat\.completions/giu, /process\.env/gu],
};
const operationCounts = Object.fromEntries(
  Object.entries(operationGroups).map(([name, patterns]) => [
    name,
    patterns.reduce(
      (total, pattern) => total + countMatches(implementationSources, pattern),
      0,
    ),
  ]),
);
check(
  "Provider/Payment/contact/email/backend/DB/Runtime operation counts remain zero",
  Object.values(operationCounts).every((count) => count === 0),
);
check(
  "no secret-shaped value or actual email literal is introduced",
  !/(?:sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/u.test(
    implementationSources,
  ) &&
    !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(implementationSources),
);

check(
  "legal and review noindex/nofollow layouts remain baseline-identical",
  readText("app/legal/layout.tsx") === readBaselineText("app/legal/layout.tsx") &&
    readText("app/review/layout.tsx") === readBaselineText("app/review/layout.tsx") &&
    includesAll(readText("app/legal/layout.tsx"), [
      "index: false",
      "follow: false",
    ]) &&
    includesAll(readText("app/review/layout.tsx"), [
      "index: false",
      "follow: false",
    ]) &&
    includesAll(contact, ["index: false", "follow: false"]),
);
check(
  "explicitly excluded fixtures and historical verifiers are unchanged",
  readText("fixtures/review/requests.ts") ===
      readBaselineText("fixtures/review/requests.ts") &&
    readText("scripts/verify-m1-content-locks.mjs") ===
      readBaselineText("scripts/verify-m1-content-locks.mjs") &&
    readText("scripts/verify-m1-safety-policy.mjs") ===
      readBaselineText("scripts/verify-m1-safety-policy.mjs"),
);

if (failures.length > 0) {
  console.error(
    `FAIL Stripe Lane B B3 review-ready public surface: ${failures.length}/${checkCount} checks failed`,
  );
  for (const label of failures) console.error(` - ${label}`);
  process.exit(1);
}

console.log(
  `PASS Stripe Lane B B3 review-ready public surface: ${checkCount}/${checkCount} checks passed`,
);
console.log(`PASS operation counts ${JSON.stringify(operationCounts)}`);
