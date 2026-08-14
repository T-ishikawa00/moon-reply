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
const reviewCorrectionR2 = "4d718eb7fb4ab0cb7e74afefa5728fee3f6991a0";
const reviewCorrectionR3 = "2a12842316585d518cbc0fcf221c2211f9703e22";
const expectedBranch = "codex/stripe-lane-b-b3-review-ready-public-surface";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const acceptedB2Status =
  "stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete";
const historicalCandidateStatus =
  "stripe_lane_b_b3_review_ready_website_public_surface_candidate_ready_pending_human_visual_chatgpt_review";
const acceptedB3Status =
  "stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete";
const acceptanceDate = "2026-08-14";
const exactNextWork = "Stripe Lane B deployment readiness (B4a)";

const updatedPaths = [
  "app/globals.css",
  "app/layout.tsx",
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
const initialCandidateScope = [
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
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];
const correctionR1Scope = [
  "lib/legal/review-content.ts",
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];
const correctionR2Scope = [
  "app/globals.css",
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];
const correctionR3Scope = [
  "app/layout.tsx",
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];

const acceptanceDocs = [
  "README.md",
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/DECISIONS.md",
  "docs/PRODUCT_SPEC.md",
  "docs/ROADMAP.md",
  "docs/WBS.md",
  "docs/legal/LEGAL_DRAFT_PUBLICATION_GATE.md",
  "docs/legal/LEGAL_SOURCE_REGISTER.md",
  "docs/legal/OPERATOR_DECISION_GUIDE.md",
  "docs/legal/WHAT_IS_DECIDED_AND_WHAT_IS_NEXT.md",
  "docs/payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md",
  "docs/payment/PAYMENT_CHARTER.md",
  "docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md",
  "docs/payment/PAYMENT_PROVIDER_DECISION_GATE.md",
  "docs/payment/PROVIDER_INQUIRY_EVIDENCE_LOG.md",
  "docs/payment/PROVIDER_INQUIRY_PLAN.md",
  "docs/payment/PROVIDER_INQUIRY_SUBMISSION_CHECKLIST.md",
  "docs/payment/STRIPE_ACCOUNT_SITE_PAYPAY_READINESS_CHECKLIST.md",
  "docs/payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md",
  "docs/payment/STRIPE_FEASIBILITY_EVIDENCE_PREPARATION.md",
  "docs/payment/STRIPE_LANE_B_HUMAN_DECISION_PACKAGE.md",
  "docs/phase1/IMPLEMENTATION_PLAN.md",
  "docs/phase1/IMPLEMENTATION_WBS.md",
  "docs/phase1/PAYMENT_FLOW.md",
];
const acceptanceCodeUiPaths = [
  "app/legal/page.tsx",
  "app/legal/terms/page.tsx",
  "lib/legal/review-content.ts",
];
const acceptanceVerifierPaths = [
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];
const acceptanceScope = [
  ...acceptanceDocs,
  ...acceptanceCodeUiPaths,
  ...acceptanceVerifierPaths,
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

function readTextAt(reference, relativePath) {
  return normalizeText(
    runGit(["show", `${reference}:${relativePath}`]).toString("utf8"),
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

function changedPathsBetween(fromReference, toReference) {
  return git(
    "diff",
    "--name-only",
    "--no-renames",
    fromReference,
    toReference,
    "--",
  )
    .split(/\r?\n/gu)
    .map((value) => value.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function changedNameStatusesBetween(fromReference, toReference) {
  return git(
    "diff",
    "--name-status",
    "--no-renames",
    fromReference,
    toReference,
    "--",
  )
    .split(/\r?\n/gu)
    .filter(Boolean);
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
const reviewCorrectionR2Parents = git(
  "rev-list",
  "--parents",
  "-n",
  "1",
  reviewCorrectionR2,
).split(/\s+/u);
const reviewCorrectionR2Anchored =
  reviewCorrectionR2Parents.length === 2 &&
  reviewCorrectionR2Parents[0] === reviewCorrectionR2 &&
  reviewCorrectionR2Parents[1] === reviewCorrectionR1;
const reviewCorrectionR3Parents = git(
  "rev-list",
  "--parents",
  "-n",
  "1",
  reviewCorrectionR3,
).split(/\s+/u);
const reviewCorrectionR3Anchored =
  reviewCorrectionR3Parents.length === 2 &&
  reviewCorrectionR3Parents[0] === reviewCorrectionR3 &&
  reviewCorrectionR3Parents[1] === reviewCorrectionR2;
const acceptanceWorkingState =
  commitsAfterBaseline === 4 && currentHead === reviewCorrectionR3;
const acceptanceCommitState =
  commitsAfterBaseline === 5 &&
  currentHead !== reviewCorrectionR3 &&
  headParents.length === 2 &&
  headParents[1] === reviewCorrectionR3;
const exactLineage =
  initialCandidateAnchored &&
  reviewCorrectionR1Anchored &&
  reviewCorrectionR2Anchored &&
  reviewCorrectionR3Anchored &&
  git("merge-base", baseline, "HEAD") === baseline &&
  (acceptanceWorkingState || acceptanceCommitState);

check("Initial B3 Candidate parent is the exact baseline", initialCandidateAnchored);
check(
  "exact baseline to Initial Candidate to R1 to R2 to R3 to authorized Acceptance Sync lineage",
  exactLineage,
);
check(
  "Acceptance Sync is the authorized fifth commit after baseline or its exact pre-commit working state",
  acceptanceWorkingState || acceptanceCommitState,
);
check("expected B3 branch", git("branch", "--show-current") === expectedBranch);
check(
  "main and origin/main remain fixed",
  git("rev-parse", "main") === expectedMain &&
    git("rev-parse", "origin/main") === expectedMain,
);

const initialCandidatePaths = changedPathsBetween(baseline, initialCandidate);
const initialCandidateNameStatuses = changedNameStatusesBetween(
  baseline,
  initialCandidate,
);
check(
  "Initial Candidate scope is frozen at exactly twelve updates and one added verifier",
  isDeepStrictEqual(sorted(initialCandidatePaths), sorted(initialCandidateScope)) &&
    initialCandidateNameStatuses.length === 13 &&
    initialCandidateNameStatuses.filter((entry) => /^M\t/u.test(entry)).length ===
      12 &&
    initialCandidateNameStatuses.filter((entry) => /^A\t/u.test(entry)).length ===
      1,
);

const historicalB3Paths = changedPathsBetween(baseline, reviewCorrectionR3);
const historicalB3NameStatuses = changedNameStatusesBetween(
  baseline,
  reviewCorrectionR3,
);
check(
  "Baseline to R3 mutation manifest is frozen at exactly fifteen paths",
  isDeepStrictEqual(sorted(historicalB3Paths), sorted(exactScope)),
);
check(
  "Baseline to R3 classification is exactly fourteen modified and one added verifier",
  updatedPaths.every(
    (relativePath) =>
      existsSync(path.join(repositoryRoot, relativePath)) &&
      gitSucceeds("cat-file", "-e", `${baseline}:${relativePath}`),
  ) &&
    newPaths.every(
      (relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)) &&
        !gitSucceeds("cat-file", "-e", `${baseline}:${relativePath}`),
    ) &&
    historicalB3NameStatuses.length === 15 &&
    historicalB3NameStatuses.filter((entry) => /^M\t/u.test(entry)).length ===
      14 &&
    historicalB3NameStatuses.filter((entry) => /^A\t/u.test(entry)).length ===
      1,
);

const correctionR1Paths = changedPathsBetween(
  initialCandidate,
  reviewCorrectionR1,
);
const correctionR1NameStatuses = changedNameStatusesBetween(
  initialCandidate,
  reviewCorrectionR1,
);
check(
  "Review Correction R1 scope is exactly two updates",
  isDeepStrictEqual(sorted(correctionR1Paths), sorted(correctionR1Scope)) &&
    correctionR1NameStatuses.length === 2 &&
    correctionR1NameStatuses.every((entry) => /^M\t/u.test(entry)),
);

const correctionR2Paths = changedPathsBetween(
  reviewCorrectionR1,
  reviewCorrectionR2,
);
const correctionR2NameStatuses = changedNameStatusesBetween(
  reviewCorrectionR1,
  reviewCorrectionR2,
);
check(
  "Human Visual QA Correction R2 scope is exactly two updates",
  isDeepStrictEqual(sorted(correctionR2Paths), sorted(correctionR2Scope)) &&
    correctionR2NameStatuses.length === 2 &&
    correctionR2NameStatuses.every((entry) => /^M\t/u.test(entry)),
);

const correctionR3Paths = changedPathsBetween(
  reviewCorrectionR2,
  reviewCorrectionR3,
);
const correctionR3NameStatuses = changedNameStatusesBetween(
  reviewCorrectionR2,
  reviewCorrectionR3,
);
check(
  "Human Visual QA Correction R3 scope is exactly two updates",
  isDeepStrictEqual(sorted(correctionR3Paths), sorted(correctionR3Scope)) &&
    correctionR3NameStatuses.length === 2 &&
    correctionR3NameStatuses.every((entry) => /^M\t/u.test(entry)),
);

const acceptancePaths = changedPathsFrom(reviewCorrectionR3);
const acceptanceNameStatuses = git(
  "diff",
  "--name-status",
  "--no-renames",
  reviewCorrectionR3,
  "--",
)
  .split(/\r?\n/gu)
  .filter(Boolean);
check(
  "Acceptance Sync scope is exactly twenty-nine modified paths",
  isDeepStrictEqual(acceptancePaths, sorted(acceptanceScope)) &&
    acceptanceNameStatuses.length === 29 &&
    acceptanceNameStatuses.every((entry) => /^M\t/u.test(entry)),
);

const cumulativePaths = changedPathsFromBaseline();
const cumulativeNameStatuses = git(
  "diff",
  "--name-status",
  "--no-renames",
  baseline,
  "--",
)
  .split(/\r?\n/gu)
  .filter(Boolean);
check(
  "Baseline to Acceptance Sync cumulative manifest is exactly forty unique paths",
  cumulativePaths.length === 40 &&
    isDeepStrictEqual(
      cumulativePaths,
      sorted(new Set([...exactScope, ...acceptanceScope])),
    ),
);
check(
  "Baseline to Acceptance Sync classification is exactly thirty-nine modified and one added verifier",
  cumulativeNameStatuses.length === 40 &&
    cumulativeNameStatuses.filter((entry) => /^M\t/u.test(entry)).length === 39 &&
    cumulativeNameStatuses.filter((entry) => /^A\t/u.test(entry)).length === 1 &&
    cumulativeNameStatuses.every((entry) => /^(?:M|A)\t/u.test(entry)),
);
check(
  "next-env.d.ts remains HEAD-identical",
  readText("next-env.d.ts") === readTextAt("HEAD", "next-env.d.ts"),
);
check("baseline cumulative diff check", git("diff", "--check", baseline, "--") === "");
check("working diff check", git("diff", "--check") === "");
check("staged diff check", git("diff", "--cached", "--check") === "");

const globalStyles = readText("app/globals.css");
const rootLayout = readText("app/layout.tsx");
const authority = readText("lib/legal/review-content.ts");
const historicalR3Authority = readTextAt(
  reviewCorrectionR3,
  "lib/legal/review-content.ts",
);
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
const currentFocus = readText("docs/CURRENT_FOCUS.md");
const codeHandoff = readText("docs/CODEX_HANDOFF.md");
const acceptanceDocSources = acceptanceDocs.map((relativePath) => ({
  relativePath,
  source: readText(relativePath),
}));
const publicationGate = readText(
  "docs/legal/LEGAL_DRAFT_PUBLICATION_GATE.md",
);
const historicalR3PublicationGate = readTextAt(
  reviewCorrectionR3,
  "docs/legal/LEGAL_DRAFT_PUBLICATION_GATE.md",
);
const laneReadiness = readText(
  "docs/payment/STRIPE_ACCOUNT_SITE_PAYPAY_READINESS_CHECKLIST.md",
);
const payjpReadiness = readText(
  "docs/payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md",
);
const implementationPlan = readText("docs/phase1/IMPLEMENTATION_PLAN.md");

const globalSmoothScrollRule = sourceSlice(
  globalStyles,
  "html {",
  "}",
  "global HTML smooth-scroll rule",
);
check(
  "global smooth scrolling has the matching root HTML declaration",
  globalSmoothScrollRule.includes("scroll-behavior: smooth;") &&
    rootLayout.includes('<html lang="ja" data-scroll-behavior="smooth">'),
);

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
  "R3 snapshot preserves the exact historical pending Candidate authority",
  includesAll(historicalR3Authority, [
    acceptedB2Status,
    historicalCandidateStatus,
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
  "CURRENT machine authority is the exact accepted B3 state and preserves false boundaries",
  includesAll(authority, [
    acceptedB2Status,
    acceptedB3Status,
    `acceptanceDate: "${acceptanceDate}"`,
    'humanVisualQa: "complete"',
    'humanVisualQaOutcome: "PASS"',
    'chatgptReview: "complete"',
    'chatgptReviewOutcome: "PASS"',
    'humanAcceptance: "complete"',
    'b3Acceptance: "complete"',
    `nextWork: "${exactNextWork}"`,
    'nextWorkScope: "planning/readiness only"',
    "legalPublicationApproved: false",
    "stripeApprovalEstablished: false",
    "paymentImplemented: false",
    "productionPaymentAuthorized: false",
  ]) &&
    !authority.includes(historicalCandidateStatus),
);
check(
  "all twenty-five CURRENT documentation mirrors carry the exact accepted status, date, review states, and B4a next work",
  acceptanceDocSources.every(({ source }) =>
    includesAll(source, [
      acceptedB3Status,
      acceptanceDate,
      exactNextWork,
      "planning/readiness only",
    ]) &&
      /Human Visual QA[^\n]{0,80}PASS \/ complete/u.test(source) &&
      /ChatGPT review[^\n]{0,80}PASS \/ complete/u.test(source) &&
      /Human acceptance \/ B3 acceptance[^\n]{0,80}complete \/ complete/u.test(
        source,
      ),
  ),
);
check(
  "CURRENT acceptance evidence preserves final Human review and Work browser QA",
  [currentFocus, codeHandoff].every((source) =>
    includesAll(source, [
      "AI disclosure",
      "Tokushoho review",
      "purchase-confirmation review",
      "10/10",
      "approximately 390px",
      "actual client-side navigation",
      "console warnings/errors",
      "missing-data-scroll-behavior",
      "horizontal overflow",
      "clipping",
      "R2 contrast",
      "Japanese phrase wrapping",
      "Contact six categories",
      "ordinary refund / Payment Integrity separation",
      "native disabled purchase button",
    ]),
  ),
);
const currentPublicationChecklist = publicationGate
  .split("\n")
  .filter((line) => /^- \[[ x~]\]/u.test(line));
const historicalR3PublicationChecklist = historicalR3PublicationGate
  .split("\n")
  .filter((line) => /^- \[[ x~]\]/u.test(line));
check(
  "B3 acceptance changes zero publication checklist states and remains NOT APPROVED FOR PUBLICATION",
  publicationGate.includes("NOT APPROVED FOR PUBLICATION") &&
    isDeepStrictEqual(
      currentPublicationChecklist,
      historicalR3PublicationChecklist,
    ),
);
check(
  "Lane A, Lane B, and Lane C four-field states remain exact and Lane B remains blocked",
  countMatches(
    laneReadiness,
    /^preparation_status: preparation_human_approved$/gmu,
  ) === 1 &&
    countMatches(
      laneReadiness,
      /^preparation_status: preparation_blocked$/gmu,
    ) === 2 &&
    countMatches(
      laneReadiness,
      /^external_action_authority: external_action_not_authorized$/gmu,
    ) === 3 &&
    countMatches(laneReadiness, /^acquisition_status: not_submitted$/gmu) ===
      3 &&
    countMatches(laneReadiness, /^outcome: null$/gmu) === 3 &&
    includesAll(laneReadiness, [
      "overall_gate_b: BLOCKED",
      "overall_gate_c: BLOCKED",
      "Lane B and Lane C remain blocked",
      "The sequence changes no lane four-field value.",
    ]),
);
check(
  "Stripe, PayPay, and PAY.JP evidence states remain unresolved and unapproved",
  includesAll(laneReadiness, [
    "Stripe account/contact/submission: `absent / none / none`",
    "Stripe account/site readiness and PayPay onboarding remain blocked, unverified, not enabled, and not approved",
    "desired_initial_method: true",
    "moon_reply_eligibility: unverified",
    "method_state: not_enabled",
    "approval_state: not_approved",
  ]) &&
    includesAll(currentFocus, [
      "Stripe feasibility is not established",
      "Stripe account, contact, approval, and activation are absent",
      "formal selection is incomplete",
      "every desired method is unverified",
    ]) &&
    includesAll(payjpReadiness, [
      "paused_fallback_provider_direction",
      "Not submitted",
      "Not approved",
      "Not selected",
    ]),
);
check(
  "B4a is exact planning-only next work with complete purpose and no B4b or external-action authority",
  includesAll(implementationPlan, [
    exactNextWork,
    "planning/readiness only",
    "hosting compatibility",
    "hosting cost/operating model",
    "stable review URL plan",
    "indexing/privacy posture",
    "contact receipt validation plan",
    "device/browser coverage",
    "rollback/removal procedure",
    "domain decision sequencing",
    "no domain purchase, DNS mutation, deployment, publication, Stripe submission, Provider activation, or Production Payment",
    "B4b implementation deploys only the payment-free review site and requires separate Human external-action authority",
  ]),
);
check(
  "review hub renders accepted B3 while separating publication, Stripe, Payment, and operations",
  includesAll(legalHub, [
    "B2 文書・仕様・法務方針",
    "Human + ChatGPT受入済み",
    "B3 画面実装",
    "受入済み（2026-08-14）",
    "Human Visual QA",
    "PASS・complete",
    "ChatGPT review",
    "Human acceptance / B3 acceptance",
    exactNextWork,
    "planning/readiness only",
    "法務公開",
    "未承認",
    "Stripe feasibility・承認・正式選定",
    "未確立・未承認・未選定",
    "Payment実装",
    "未実装",
    "Production Payment",
    "Contact・メール・販売事業者情報開示",
    "運用未解決",
  ]),
);
check(
  "Terms identifies the accepted B3 review implementation without activating contract, publication, Provider, or Payment authority",
  includesAll(terms, [
    "受入済みB3レビュー実装",
    "現在拘束力のある利用条件でも、法務公開済みの規約でもありません",
    "このページは現在の利用契約条件ではありません",
    "同意記録、決済はありません",
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
    !renderedPageSources.includes(historicalCandidateStatus) &&
    !renderedPageSources.includes(acceptedB3Status),
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
const acceptanceNonVerifierPatch = normalizeText(
  runGit([
    "diff",
    "--no-ext-diff",
    "--unified=0",
    reviewCorrectionR3,
    "--",
    ...acceptanceDocs,
    ...acceptanceCodeUiPaths,
  ]).toString("utf8"),
);
const acceptanceAddedText = acceptanceNonVerifierPatch
  .split("\n")
  .filter((line) => /^\+(?!\+\+)/u.test(line))
  .map((line) => line.slice(1))
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
  "Acceptance Sync introduces zero secret, actual email, phone, or postal-code literals",
  !/(?:sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/u.test(
    acceptanceAddedText,
  ) &&
    !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu.test(acceptanceAddedText) &&
    !/(?:\+81[- ]?\d{1,4}[- ]?\d{1,4}[- ]?\d{3,4}|0\d{1,4}-\d{1,4}-\d{3,4})/u.test(
      acceptanceAddedText,
    ) &&
    !/〒\s*\d{3}-\d{4}/u.test(acceptanceAddedText),
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
