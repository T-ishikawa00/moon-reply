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

const correction = "004c3fbf6efcc0914cccb1d8ff08b41de7f655a6";
const correctionParent = "bab2f3259add84e9e3a6abeacf0cf777b6a617b1";
const qaProbe = "68e16cebb1eccd0966e3a6e11aedef030cab87aa";
const acceptedB4a = "025e28a82c0b773d21ececfd8064af045922079d";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "chore/stripe-lane-b-b4b-final-private-review-hard-gate-closure";
const currentStatus =
  "stripe_lane_b_b4b_private_review_hard_gate_technical_evidence_complete_pending_human_chatgpt_final_review_b4b_acceptance";
const authenticatedHttp = "PASS_13_of_13_authenticated_http_200";
const unauthenticatedHttp = "PASS_13_of_13_unauthenticated_http_401";
const runtimeAssetEvidence =
  "PASS_active_runtime_assets_read_and_hash_verified_in_netlify_function";
const rollbackEvidence =
  "PASS_private_branch_context_rollback_via_git_republication";
const removalEvidence =
  "PASS_deploy_removal_offline_via_deleted_probe_permalink";
const hardGateState =
  "technical_evidence_complete_pending_final_review_acceptance";

const controllerPath =
  "docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md";
const authorityPath = "lib/legal/review-content.ts";
const legalPagePath = "app/legal/page.tsx";
const probeRoutePath = "app/api/internal/runtime-asset-probe/route.ts";
const historicalVerifierPath =
  "scripts/verify-stripe-lane-b-b4b-stable-review-url-deployment.mjs";
const verifierPath =
  "scripts/verify-stripe-lane-b-b4b-final-private-review-hard-gate-closure.mjs";

const documentationMirrors = [
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

const updatedPaths = [
  ...documentationMirrors,
  controllerPath,
  authorityPath,
  legalPagePath,
];
const newPaths = [verifierPath];
const exactPaths = [...updatedPaths, ...newPaths];

const currentOverlay =
  "> **CURRENT Stripe Lane B B4b Private Review Hard Gate technical evidence closure:** `" +
  currentStatus +
  "`; Product parent / Runtime asset Correction `" +
  correction +
  "` (`next.config.ts` only); QA-only probe `" +
  qaProbe +
  "` is temporary evidence only and excluded from Product lineage. Authenticated HTTP `" +
  authenticatedHttp +
  "`; unauthenticated HTTP `" +
  unauthenticatedHttp +
  "`; `technicalEvidence = complete`.\n>\n" +
  "> Runtime contract assets `" +
  runtimeAssetEvidence +
  "`; private rollback/republication `" +
  rollbackEvidence +
  "`; deploy removal/offline `" +
  removalEvidence +
  "`; Private protection / route rendering / Safety fail-closed / Preview-Production separation `complete / complete / complete / complete`; Netlify Hard Gate `" +
  hardGateState +
  "`; ChatGPT final review / Human final review / B4b acceptance `pending / pending / pending`; Production B4a SHA `" +
  acceptedB4a +
  "` remains `unchanged / locked`; Paid Production Hosting `provisional`. This source records prior Human-supplied Private Review evidence and does not claim its own deployment, B4b acceptance, Netlify Hard Gate acceptance, Production readiness, public launch, or Paid Production approval. Future Provider operations remain separately authorized; raw Provider URLs/IDs remain prohibited; historical B3/B4a/B4b snapshots remain unchanged. Detailed evidence: " +
  controllerPath +
  ".";

function runGitBuffer(args) {
  const result = spawnSync(
    gitExecutable,
    ["-c", "safe.directory=" + safeRepositoryRoot, ...args],
    { cwd: repositoryRoot, encoding: null, windowsHide: true },
  );
  if (result.status !== 0) {
    throw new Error(
      "git " +
        args.join(" ") +
        " failed: " +
        Buffer.from(result.stderr ?? []).toString("utf8").trim(),
    );
  }
  return Buffer.from(result.stdout ?? []);
}

function git(...args) {
  return runGitBuffer(args).toString("utf8").trim();
}

function gitLines(...args) {
  const output = git(...args);
  return output ? output.split(/\r?\n/u).filter(Boolean) : [];
}

function gitSucceeds(...args) {
  const result = spawnSync(
    gitExecutable,
    ["-c", "safe.directory=" + safeRepositoryRoot, ...args],
    { cwd: repositoryRoot, encoding: "utf8", windowsHide: true },
  );
  return result.status === 0;
}

function readBuffer(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath));
}

function readText(relativePath) {
  return readBuffer(relativePath).toString("utf8").replaceAll("\r\n", "\n");
}

function readBufferAt(revision, relativePath) {
  return runGitBuffer(["show", revision + ":" + relativePath]);
}

function readTextAt(revision, relativePath) {
  return readBufferAt(revision, relativePath)
    .toString("utf8")
    .replaceAll("\r\n", "\n");
}

function existsAt(revision, relativePath) {
  return gitSucceeds("cat-file", "-e", revision + ":" + relativePath);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function includesAll(source, fragments) {
  return fragments.every((fragment) => source.includes(fragment));
}

function countOccurrences(source, fragment) {
  return fragment ? source.split(fragment).length - 1 : 0;
}

function maskCurrentOverlay(source) {
  return source.replace(
    /^> \*\*CURRENT[^\n]*\n>\n> [^\n]*\n/mu,
    "CURRENT_OVERLAY\n",
  );
}

function extractConstObject(source, objectName) {
  const startMarker = "export const " + objectName + " = {";
  const start = source.indexOf(startMarker);
  if (start < 0) return "";
  const endMarker = "} as const;";
  const end = source.indexOf(endMarker, start);
  if (end < 0) return "";
  return source.slice(start, end + endMarker.length);
}

function extractPropertyObject(source, propertyName) {
  const startMarker = "  " + propertyName + ": {";
  const start = source.indexOf(startMarker);
  if (start < 0) return "";
  const endMarker = "\n  },";
  const end = source.indexOf(endMarker, start);
  if (end < 0) return "";
  return source.slice(start, end + endMarker.length);
}

function parseStatusRecords() {
  const raw = runGitBuffer([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ])
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  const records = [];
  for (let index = 0; index < raw.length; index += 1) {
    const record = raw[index];
    const indexState = record[0] ?? "";
    const worktreeState = record[1] ?? "";
    const relativePath = record.slice(3);
    const renamed = indexState === "R" || worktreeState === "R";
    const originalPath = renamed ? raw[++index] : null;
    records.push({ indexState, worktreeState, relativePath, originalPath });
  }
  return records;
}

function parseNameStatus(lines) {
  return lines.map((line) => {
    const parts = line.split("\t");
    const statusToken = parts[0] ?? "";
    const status = statusToken[0] ?? "";
    return {
      status,
      relativePath: status === "R" || status === "C" ? parts[2] : parts[1],
      originalPath: status === "R" || status === "C" ? parts[1] : null,
    };
  });
}

function addedTextFromPatch(patchText) {
  return patchText
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1))
    .join("\n");
}

let checkCount = 0;
const failures = [];

function check(label, condition) {
  checkCount += 1;
  if (!condition) failures.push(label);
}

const branch = git("symbolic-ref", "--quiet", "--short", "HEAD");
const head = git("rev-parse", "HEAD");
const statusRecords = parseStatusRecords();
const workingMode = head === correction && statusRecords.length > 0;
const committedMode =
  head !== correction &&
  gitSucceeds("rev-parse", head + "^") &&
  git("rev-parse", head + "^") === correction &&
  statusRecords.length === 0;

check("expected closure branch", branch === expectedBranch);
check(
  "working change is on Correction or committed closure is its exact direct child",
  workingMode || committedMode,
);
check(
  "main and origin/main remain fixed",
  git("rev-parse", "main") === expectedMain &&
    git("rev-parse", "origin/main") === expectedMain,
);
check(
  "Production B4a refs remain fixed",
  git("rev-parse", "codex/stripe-lane-b-b4a-netlify-primary-hosting-direction") ===
    acceptedB4a &&
    git(
      "rev-parse",
      "origin/codex/stripe-lane-b-b4a-netlify-primary-hosting-direction",
    ) === acceptedB4a,
);
check(
  "Correction is the exact direct child of Final Evidence Sync",
  git("rev-parse", correction + "^") === correctionParent &&
    git("rev-list", "--count", correctionParent + ".." + correction) === "1",
);
check(
  "QA probe is the exact direct child of Correction",
  git("rev-parse", qaProbe + "^") === correction &&
    git("rev-list", "--count", correction + ".." + qaProbe) === "1",
);
check(
  "QA probe is not an ancestor of closure state",
  !gitSucceeds("merge-base", "--is-ancestor", qaProbe, head),
);
check(
  "Correction is the merge base of Product Correction and QA probe",
  git("merge-base", correction, qaProbe) === correction,
);
check(
  "probe route exists only at QA probe",
  existsAt(qaProbe, probeRoutePath) &&
    !existsAt(correction, probeRoutePath) &&
    !existsSync(path.join(repositoryRoot, probeRoutePath)),
);

const correctionEntries = parseNameStatus(
  gitLines(
    "diff",
    "--name-status",
    "--find-renames",
    correctionParent,
    correction,
    "--",
  ),
);
check(
  "Final Evidence Sync to Correction changes next.config.ts only",
  isDeepStrictEqual(correctionEntries, [
    { status: "M", relativePath: "next.config.ts", originalPath: null },
  ]),
);

const expectedNextConfig =
  'import type { NextConfig } from "next";\n\n' +
  "const nextConfig: NextConfig = {\n" +
  "  outputFileTracingIncludes: {\n" +
  '    "/api/internal/assessments": [\n' +
  '      "./ai/schemas/safety-assessment.schema.json",\n' +
  '      "./ai/schemas/decision-plan.schema.json",\n' +
  '      "./ai/schemas/report-content.schema.json",\n' +
  '      "./ai/schemas/validation-result.schema.json",\n' +
  "    ],\n" +
  "  },\n" +
  "};\n\n" +
  "export default nextConfig;\n";
const nextConfig = readText("next.config.ts");
check(
  "Correction next.config has exact route-scoped four-asset semantics",
  nextConfig === expectedNextConfig &&
    nextConfig === readTextAt(correction, "next.config.ts") &&
    countOccurrences(nextConfig, '"/api/internal/assessments"') === 1 &&
    !nextConfig.includes("*") &&
    !nextConfig.includes("netlify"),
);

let changeEntries = parseNameStatus(
  gitLines(
    "diff",
    "--name-status",
    "--find-renames",
    correction,
    ...(committedMode ? [head] : []),
    "--",
  ),
);
if (workingMode) {
  for (const record of statusRecords) {
    if (
      record.indexState === "?" &&
      record.worktreeState === "?" &&
      !changeEntries.some(
        (entry) => entry.relativePath === record.relativePath,
      )
    ) {
      changeEntries.push({
        status: "A",
        relativePath: record.relativePath,
        originalPath: null,
      });
    }
  }
}
changeEntries = changeEntries.sort((left, right) =>
  left.relativePath.localeCompare(right.relativePath),
);
const expectedEntries = [
  ...updatedPaths.map((relativePath) => ({
    status: "M",
    relativePath,
    originalPath: null,
  })),
  ...newPaths.map((relativePath) => ({
    status: "A",
    relativePath,
    originalPath: null,
  })),
].sort((left, right) => left.relativePath.localeCompare(right.relativePath));

check(
  "exact closure manifest is 28 UPDATE and 1 NEW",
  isDeepStrictEqual(changeEntries, expectedEntries),
);
check(
  "closure manifest is exactly 29 paths with no delete or rename",
  changeEntries.length === 29 &&
    changeEntries.filter((entry) => entry.status === "M").length === 28 &&
    changeEntries.filter((entry) => entry.status === "A").length === 1 &&
    changeEntries.every(
      (entry) => entry.status !== "D" && entry.originalPath === null,
    ),
);
check(
  "closure type counts are docs 26, code/UI 2, verifier 1, config/runtime 0",
  exactPaths.filter(
    (relativePath) =>
      relativePath === "README.md" || relativePath.startsWith("docs/"),
  ).length === 26 &&
    [authorityPath, legalPagePath].filter((relativePath) =>
      exactPaths.includes(relativePath),
    ).length === 2 &&
    exactPaths.filter((relativePath) => relativePath.startsWith("scripts/"))
      .length === 1 &&
    exactPaths.every(
      (relativePath) =>
        relativePath !== "next.config.ts" &&
        !relativePath.startsWith("app/api/") &&
        !relativePath.startsWith("lib/assessment/"),
    ),
);
check(
  "working status is exact scope or committed state is clean",
  workingMode
    ? isDeepStrictEqual(
        sorted(statusRecords.map((record) => record.relativePath)),
        sorted(exactPaths),
      )
    : statusRecords.length === 0,
);

check(
  "all 25 CURRENT mirrors change only the exact top overlay",
  documentationMirrors.length === 25 &&
    documentationMirrors.every((relativePath) => {
      const current = readText(relativePath);
      const baseline = readTextAt(correction, relativePath);
      return (
        countOccurrences(current, currentOverlay) === 1 &&
        maskCurrentOverlay(current) === maskCurrentOverlay(baseline)
      );
    }),
);

const controller = readText(controllerPath);
const historicalControllerMarker =
  "<!-- B4B_FINAL_R1_HISTORICAL_CONTROLLER_START -->";
const historicalControllerIndex = controller.indexOf(historicalControllerMarker);
const embeddedHistoricalController =
  historicalControllerIndex < 0
    ? ""
    : controller
        .slice(historicalControllerIndex + historicalControllerMarker.length)
        .replace(/^\n\n/u, "");
check(
  "controller embeds the sealed Final R1 controller byte-identically",
  historicalControllerIndex >= 0 &&
    embeddedHistoricalController === readTextAt(correction, controllerPath),
);
check(
  "controller records exact CURRENT closure evidence and boundaries",
  includesAll(controller, [
    currentStatus,
    correction,
    correctionParent,
    qaProbe,
    "next.config.ts only",
    "temporary Private QA evidence only / excluded from Product lineage",
    authenticatedHttp,
    unauthenticatedHttp,
    runtimeAssetEvidence,
    rollbackEvidence,
    removalEvidence,
    "Overall technicalEvidence | complete",
    hardGateState,
    "ChatGPT final review | pending",
    "Human final review | pending",
    "B4b acceptance | pending",
    "Paid Production Hosting | provisional",
    "Closure commit Provider deployment state | not claimed",
    "actual assessment processing duration",
    "logging / observability",
    "current commercial plan / terms",
  ]),
);
check(
  "controller records the exact closure manifest and counts",
  exactPaths.every((relativePath) => controller.includes(relativePath)) &&
    includesAll(controller, [
      "#### UPDATE — exactly 28",
      "#### NEW — exactly 1",
      "| update | 28 |",
      "| new | 1 |",
      "| delete | 0 |",
      "| rename | 0 |",
      "| total | 29 |",
      "| docs | 26 |",
      "| code/UI | 2 |",
      "| verifier | 1 |",
      "| config/runtime | 0 |",
      "| Provider operation by closure | 0 |",
      "| Deployment operation by closure | 0 |",
      "| Publish-to-Production operation | 0 |",
    ]),
);

const authority = readText(authorityPath);
const baselineAuthority = readTextAt(correction, authorityPath);
check(
  "B2/B3 and B4a machine authorities remain byte-identical",
  extractConstObject(authority, "stripeLaneBReviewAuthority") ===
    extractConstObject(baselineAuthority, "stripeLaneBReviewAuthority") &&
    extractConstObject(authority, "stripeLaneB4aDeploymentReadinessAuthority") ===
      extractConstObject(
        baselineAuthority,
        "stripeLaneB4aDeploymentReadinessAuthority",
      ),
);
check(
  "historical B4b machine evidence objects remain byte-identical",
  [
    "originalDeployedB4aEvidence",
    "correctedCandidateEvidence",
    "r1CommitTimeSnapshot",
    "latestExternallyVerifiedArtifact",
    "remainingHardGateEvidence",
  ].every(
    (propertyName) =>
      extractPropertyObject(authority, propertyName) ===
      extractPropertyObject(baselineAuthority, propertyName),
  ),
);
check(
  "machine authority records exact closure object and pending review state",
  includesAll(authority, [
    currentStatus,
    "finalPrivateReviewHardGateClosureEvidence",
    correction,
    correctionParent,
    "next.config.ts_only",
    "probeExcludedFromProduct: true",
    qaProbe,
    "temporary_private_qa_evidence_only",
    "productAncestor: false",
    authenticatedHttp,
    unauthenticatedHttp,
    runtimeAssetEvidence,
    rollbackEvidence,
    removalEvidence,
    'overall: "complete"',
    'technicalEvidence: "complete"',
    'chatgptFinalReview: "pending"',
    'humanFinalReview: "pending"',
    'b4bAcceptance: "pending"',
    hardGateState,
    'paidProductionHosting: "provisional"',
    'closureCommitDeploymentState: "not_claimed"',
  ]),
);

const legalPage = readText(legalPagePath);
check(
  "/legal presents the CURRENT technical closure truthfully",
  includesAll(legalPage, [
    "B4b Private Review technical evidence closure",
    "Product runtime Correction SHA",
    correction,
    "next.config.ts only",
    "QA-only probe evidence",
    qaProbe,
    "temporary evidence only",
    "Product lineageから除外",
    "Authenticated HTTP",
    "Unauthenticated HTTP",
    "Runtime contract asset inclusion",
    "Private rollback / republication",
    "Deploy removal / offline",
    "Technical evidence",
    "complete",
    "ChatGPT pending・Human pending・B4b pending",
    "technical evidence complete・final review / acceptance pending",
    "provisional",
    "自身のdeploymentやacceptanceを主張しません",
  ]),
);
check(
  "/legal removes superseded CURRENT gap claims and exposes no probe endpoint",
  [
    "partial_rendered_pages_confirmed_exact_numeric_http_status_unconfirmed",
    "not_fully_proven",
    "not_executed_not_proven",
    "not passed・provisional",
    probeRoutePath,
    "/api/internal/runtime-asset-probe",
  ].every((fragment) => !legalPage.includes(fragment)),
);
check(
  "/legal preserves non-acceptance and non-Production boundaries",
  includesAll(legalPage, [
    "B4bとNetlify Hard Gateは未受入",
    "Paid Production Hostingはprovisional",
    "ProductionはB4a SHAのままunchanged / locked",
    "追加Provider操作",
    "法務公開",
    "Payment実装",
    "Production Payment",
    "Production Runtime",
  ]) &&
    !legalPage.includes("B4b accepted") &&
    !legalPage.includes("B4b受入済み") &&
    !legalPage.includes("Production ready"),
);

const protectedFiles = [
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "next-env.d.ts",
  historicalVerifierPath,
  "docs/payment/STRIPE_LANE_B_B4A_DEPLOYMENT_READINESS.md",
  "scripts/verify-stripe-lane-b-b4a-deployment-readiness.mjs",
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs",
];
check(
  "Correction Product/config/package/next-env and sealed verifiers remain unchanged",
  protectedFiles.every(
    (relativePath) =>
      git("hash-object", "--path=" + relativePath, relativePath) ===
        git("rev-parse", correction + ":" + relativePath) &&
      gitSucceeds("diff", "--quiet", correction, "--", relativePath),
  ),
);

const protectedPrefixes = [
  "app/api/",
  "lib/assessment/",
  "lib/safety/",
  "lib/purchase/",
  "lib/supabase/",
  "supabase/",
];
check(
  "closure changes no API, Runtime, Safety, purchase, Payment, or Supabase path",
  changeEntries.every(
    (entry) =>
      !protectedPrefixes.some((prefix) =>
        entry.relativePath.startsWith(prefix),
      ) && !entry.relativePath.startsWith("app/api/payment/"),
  ),
);

let addedText = "";
for (const relativePath of updatedPaths) {
  addedText +=
    "\n" +
    addedTextFromPatch(
      git(
        "diff",
        "--no-ext-diff",
        "--unified=0",
        correction,
        ...(committedMode ? [head] : []),
        "--",
        relativePath,
      ),
    );
}
addedText +=
  "\n" +
  (committedMode
    ? addedTextFromPatch(
        git(
          "diff",
          "--no-ext-diff",
          "--unified=0",
          correction,
          head,
          "--",
          verifierPath,
        ),
      )
    : readText(verifierPath));

const sensitivePatterns = {
  providerUrls: [
    /https?:\/\/[^\s)]+/giu,
    /\b[A-Za-z0-9-]+\.netlify\.app\b/giu,
  ],
  providerIdentifiers: [
    /(?:site|project|deploy|account|team|installation)[ _-]?(?:id|identifier)\s*[:=]\s*["']?[A-Za-z0-9_-]{6,}/giu,
  ],
  secrets: [
    /sk_(?:live|test|proj)_[A-Za-z0-9_-]{8,}/gu,
    /AKIA[0-9A-Z]{16}/gu,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
    /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/gu,
  ],
  humanPii: [
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu,
    /(?:\+81[- ]?\d{1,4}[- ]?\d{1,4}[- ]?\d{3,4}|0\d{1,4}-\d{1,4}-\d{3,4})/gu,
    /〒\s*\d{3}-\d{4}/gu,
  ],
};

function countMatches(patterns) {
  return patterns.reduce(
    (total, pattern) =>
      total + Array.from(addedText.matchAll(pattern)).length,
    0,
  );
}

const sensitiveCounts = Object.fromEntries(
  Object.entries(sensitivePatterns).map(([label, patterns]) => [
    label,
    countMatches(patterns),
  ]),
);
check(
  "raw Provider URL/ID, secret, and Human PII scans are zero",
  Object.values(sensitiveCounts).every((count) => count === 0),
);

const addedOperationalCode = [authorityPath, legalPagePath]
  .map((relativePath) =>
    addedTextFromPatch(
      git(
        "diff",
        "--no-ext-diff",
        "--unified=0",
        correction,
        ...(committedMode ? [head] : []),
        "--",
        relativePath,
      ),
    ),
  )
  .join("\n");
const operationalPatterns = [
  /\bfetch\s*\(/gu,
  /\bcreateClient\s*\(/gu,
  /\bnew\s+Stripe\s*\(/gu,
  /\bopenai\.(?:responses|chat)\b/giu,
  /\bprocess\.env\b/gu,
  /\bexport\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE)\b/gu,
  /["']use server["']/gu,
];
check(
  "closure adds no operational Product code",
  operationalPatterns.every(
    (pattern) => Array.from(addedOperationalCode.matchAll(pattern)).length === 0,
  ),
);

check(
  "CURRENT surfaces make no positive B4b/Hard Gate/Production acceptance claim",
  ![currentOverlay, controller.slice(0, historicalControllerIndex), authority, legalPage]
    .join("\n")
    .match(
      /B4b accepted|B4b受入済み|netlifyHardGate\s*[:=]\s*["'](?:passed|accepted)["']|Production[- ]?ready\s*[:=]\s*(?:true|complete|approved)/giu,
    ),
);
check(
  "closure verifier does not pin its own committed SHA",
  !committedMode || !readText(verifierPath).includes(head),
);
check(
  "stash remains empty",
  git("stash", "list", "--format=%H") === "",
);
check(
  "all exact-scope files have no trailing whitespace",
  exactPaths.every((relativePath) =>
    readText(relativePath)
      .split("\n")
      .every((line) => !/[ \t]+$/u.test(line)),
  ),
);
check("working diff check", gitSucceeds("diff", "--check"));
check("staged diff check", gitSucceeds("diff", "--cached", "--check"));
check(
  "Correction to closure cumulative diff check",
  committedMode
    ? gitSucceeds("diff", "--check", correction, head, "--")
    : gitSucceeds("diff", "--check", correction, "--"),
);

if (failures.length > 0) {
  console.error(
    "FAIL Stripe Lane B B4b Final Private Review Hard Gate technical evidence closure: " +
      failures.length +
      "/" +
      checkCount +
      " checks failed",
  );
  for (const label of failures) console.error(" - " + label);
  process.exit(1);
}

console.log(
  "PASS Stripe Lane B B4b Final Private Review Hard Gate technical evidence closure: " +
    checkCount +
    "/" +
    checkCount +
    " checks passed",
);
console.log("PASS mode " + (workingMode ? "working-closure" : "committed-closure"));
console.log(
  "PASS manifest " +
    JSON.stringify({ update: 28, new: 1, delete: 0, rename: 0, total: 29 }),
);
console.log("PASS sensitive scans " + JSON.stringify(sensitiveCounts));
