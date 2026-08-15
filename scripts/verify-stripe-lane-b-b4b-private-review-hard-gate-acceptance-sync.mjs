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

const baseline = "ae20d3540a890f0a0b567695fd982b1d5a57d7f9";
const correction = "004c3fbf6efcc0914cccb1d8ff08b41de7f655a6";
const finalEvidenceSync = "bab2f3259add84e9e3a6abeacf0cf777b6a617b1";
const qaProbe = "68e16cebb1eccd0966e3a6e11aedef030cab87aa";
const acceptedB4a = "025e28a82c0b773d21ececfd8064af045922079d";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "chore/stripe-lane-b-b4b-private-review-hard-gate-acceptance-sync";
const currentStatus =
  "stripe_lane_b_b4b_private_review_hard_gate_human_chatgpt_accepted_complete";
const hardGateState =
  "human_chatgpt_accepted_complete_private_review_scope_only";
const acceptanceScope = "private_review_technical_scope_only";
const historicalVerifierBlob =
  "17f171570881d52d597c1c29989ca0a6e3a80713";
const technicalClosureVerifierBlob =
  "67d531673608f81d8436d6a618e15d8386ea9310";

const controllerPath =
  "docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md";
const authorityPath = "lib/legal/review-content.ts";
const legalPagePath = "app/legal/page.tsx";
const historicalVerifierPath =
  "scripts/verify-stripe-lane-b-b4b-stable-review-url-deployment.mjs";
const technicalClosureVerifierPath =
  "scripts/verify-stripe-lane-b-b4b-final-private-review-hard-gate-closure.mjs";
const verifierPath =
  "scripts/verify-stripe-lane-b-b4b-private-review-hard-gate-acceptance-sync.mjs";

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
  "> **CURRENT Stripe Lane B B4b Private Review Hard Gate acceptance:** `" +
  currentStatus +
  "`; Acceptance date `2026-08-15`; Technical Evidence Closure SHA `" +
  baseline +
  "`; `technicalEvidence = complete`.\n>\n" +
  "> ChatGPT final review `PASS / complete`; Human final review `PASS / complete`; B4b acceptance `complete`; Netlify Hard Gate `" +
  hardGateState +
  "`; acceptance scope `" +
  acceptanceScope +
  "`; Production B4a SHA `" +
  acceptedB4a +
  "` remains `unchanged / locked`; Paid Production Hosting `provisional`; Production readiness `not established`. This acceptance is limited to B4b Private Review technical evidence closure and the Netlify Private Review Hard Gate. Payment remains unimplemented; Production Runtime / Production Payment / Stripe approval or formal selection / additional Provider operations / public visibility / domain-DNS / legal publication / Public Launch remain unapproved or unauthorized. Exact next candidate is **Paid Production Readiness Planning** (`planning only / not started / no external authority created`). Historical B3/B4a/B4b snapshots remain unchanged. Detailed evidence: " +
  controllerPath +
  ".";

const expectedAcceptanceObject =
  '  finalPrivateReviewHardGateAcceptance: {\n' +
  '    acceptanceDate: "2026-08-15",\n' +
  "    technicalClosureSha:\n" +
  '      "' +
  baseline +
  '",\n' +
  '    technicalEvidence: "complete",\n' +
  '    chatgptFinalReview: "complete",\n' +
  '    chatgptFinalReviewOutcome: "PASS",\n' +
  '    humanFinalReview: "complete",\n' +
  '    humanFinalReviewOutcome: "PASS",\n' +
  '    b4bAcceptance: "complete",\n' +
  "    netlifyHardGate:\n" +
  '      "' +
  hardGateState +
  '",\n' +
  '    acceptanceScope: "' +
  acceptanceScope +
  '",\n' +
  '    paidProductionHosting: "provisional",\n' +
  '    productionReadiness: "not_established",\n' +
  "  },";

const expectedCurrentReviewState =
  "  currentReviewState: {\n" +
  "    latestExternallyVerifiedProductArtifact:\n" +
  '      "Product_Correction_' +
  correction +
  '",\n' +
  '    qaProbeRole: "temporary_evidence_only_excluded_from_product",\n' +
  '    technicalEvidence: "complete",\n' +
  "    evidenceSyncRole:\n" +
  '      "records_human_chatgpt_accepted_private_review_technical_scope_without_production_authority",\n' +
  '    chatgptFinalReview: "complete",\n' +
  '    chatgptFinalReviewOutcome: "PASS",\n' +
  '    humanFinalReview: "complete",\n' +
  '    humanFinalReviewOutcome: "PASS",\n' +
  '    b4bAcceptance: "complete",\n' +
  "    netlifyHardGate:\n" +
  '      "' +
  hardGateState +
  '",\n' +
  '    paidProductionHosting: "provisional",\n' +
  '    productionReadiness: "not_established",\n' +
  '    closureCommitDeploymentState: "not_claimed",\n' +
  '    currentWork: "Paid Production Readiness Planning",\n' +
  "    currentWorkState:\n" +
  '      "planning_only_not_started_no_external_authority_created",\n' +
  "  },";

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

function extractObjectProperty(source, propertyName) {
  const startMarker = "  " + propertyName + ": {";
  const start = source.indexOf(startMarker);
  if (start < 0) return "";
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) {
      const commaEnd = source[index + 1] === "," ? index + 2 : index + 1;
      return source.slice(start, commaEnd);
    }
  }
  return "";
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
    records.push({
      indexState,
      worktreeState,
      relativePath,
      originalPath,
    });
  }
  return records;
}

function parseNameStatus(lines) {
  return lines.map((line) => {
    const parts = line.split("\t");
    const status = parts[0]?.[0] ?? "";
    if (status === "R" || status === "C") {
      return {
        status,
        originalPath: parts[1] ?? null,
        relativePath: parts[2] ?? "",
      };
    }
    return {
      status,
      originalPath: null,
      relativePath: parts[1] ?? "",
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
const workingMode = head === baseline && statusRecords.length > 0;
const committedMode =
  head !== baseline &&
  gitSucceeds("rev-parse", head + "^") &&
  git("rev-parse", head + "^") === baseline &&
  git("rev-list", "--count", baseline + ".." + head) === "1" &&
  statusRecords.length === 0;

check("expected acceptance branch", branch === expectedBranch);
check(
  "acceptance sync is a working change on baseline or its exact clean direct child",
  workingMode || committedMode,
);
check(
  "technical closure baseline is the exact direct child of Product Correction",
  git("rev-parse", baseline + "^") === correction &&
    git("rev-list", "--count", correction + ".." + baseline) === "1",
);
check(
  "Product Correction is the exact direct child of Final Evidence Sync",
  git("rev-parse", correction + "^") === finalEvidenceSync &&
    git("rev-list", "--count", finalEvidenceSync + ".." + correction) === "1",
);
check(
  "QA probe is the exact direct child of Product Correction",
  git("rev-parse", qaProbe + "^") === correction &&
    git("rev-list", "--count", correction + ".." + qaProbe) === "1",
);
check(
  "QA probe is not an ancestor of acceptance state",
  !gitSucceeds("merge-base", "--is-ancestor", qaProbe, head),
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

let changeEntries = parseNameStatus(
  gitLines(
    "diff",
    "--name-status",
    "--find-renames",
    baseline,
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
  "exact acceptance manifest is 28 UPDATE and 1 NEW",
  isDeepStrictEqual(changeEntries, expectedEntries),
);
check(
  "acceptance manifest is exactly 29 paths with no delete or rename",
  changeEntries.length === 29 &&
    changeEntries.filter((entry) => entry.status === "M").length === 28 &&
    changeEntries.filter((entry) => entry.status === "A").length === 1 &&
    changeEntries.every(
      (entry) => entry.status !== "D" && entry.originalPath === null,
    ),
);
check(
  "type counts are docs 26, code/UI 2, verifier 1, config/runtime 0",
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
        relativePath !== "next-env.d.ts" &&
        relativePath !== "package.json" &&
        relativePath !== "package-lock.json" &&
        !relativePath.startsWith("app/api/"),
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
  "all 25 CURRENT mirrors contain the exact acceptance overlay",
  documentationMirrors.length === 25 &&
    documentationMirrors.every(
      (relativePath) =>
        countOccurrences(readText(relativePath), currentOverlay) === 1,
    ),
);
check(
  "all 25 CURRENT mirrors differ from baseline only in the top overlay",
  documentationMirrors.every(
    (relativePath) =>
      maskCurrentOverlay(readText(relativePath)) ===
      maskCurrentOverlay(readTextAt(baseline, relativePath)),
  ),
);

const controller = readText(controllerPath);
const baselineController = readTextAt(baseline, controllerPath);
const technicalClosureMarker =
  "<!-- B4B_TECHNICAL_CLOSURE_HISTORICAL_CONTROLLER_START -->";
const technicalClosureIndex = controller.indexOf(technicalClosureMarker);
const currentController =
  technicalClosureIndex < 0 ? "" : controller.slice(0, technicalClosureIndex);
const embeddedTechnicalClosure =
  technicalClosureIndex < 0
    ? ""
    : controller
        .slice(technicalClosureIndex + technicalClosureMarker.length)
        .replace(/^\n\n/u, "");
check(
  "controller preserves the technical closure controller byte-identically",
  countOccurrences(controller, technicalClosureMarker) === 1 &&
    embeddedTechnicalClosure === baselineController,
);
check(
  "controller records exact CURRENT acceptance state",
  includesAll(currentController, [
    currentStatus,
    "| Acceptance date | 2026-08-15 |",
    "| Technical Evidence Closure SHA | " + baseline + " |",
    "| Technical evidence | complete |",
    "| ChatGPT final review | PASS / complete |",
    "| Human final review | PASS / complete |",
    "| B4b acceptance | complete |",
    "| Netlify Hard Gate | " + hardGateState + " |",
    "| Acceptance scope | " + acceptanceScope + " |",
    "| Paid Production Hosting | provisional |",
    "| Production readiness | not established |",
  ]),
);
check(
  "controller preserves all non-Production authority boundaries",
  includesAll(currentController, [
    acceptedB4a,
    "unchanged / locked",
    "Legal publication and Public Launch are not approved",
    "Payment is not implemented",
    "Production Payment",
    "Production Runtime",
    "Stripe approval/formal selection",
    "additional Provider operations",
    "public visibility",
    "domain/DNS",
    "Paid Production Readiness Planning",
    "planning only / not started / no external authority created",
  ]),
);
const finalR1Marker = "<!-- B4B_FINAL_R1_HISTORICAL_CONTROLLER_START -->";
check(
  "historical Final R1 controller remains byte-identical",
  baselineController.includes(finalR1Marker) &&
    controller.slice(controller.indexOf(finalR1Marker)) ===
      baselineController.slice(baselineController.indexOf(finalR1Marker)),
);

const authority = readText(authorityPath);
const baselineAuthority = readTextAt(baseline, authorityPath);
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
  "all historical B4b machine evidence objects remain byte-identical",
  [
    "originalDeployedB4aEvidence",
    "correctedCandidateEvidence",
    "r1CommitTimeSnapshot",
    "latestExternallyVerifiedArtifact",
    "remainingHardGateEvidence",
    "finalPrivateReviewHardGateClosureEvidence",
  ].every(
    (propertyName) =>
      extractObjectProperty(authority, propertyName) ===
      extractObjectProperty(baselineAuthority, propertyName),
  ),
);
check(
  "machine authority contains the exact Acceptance object",
  extractObjectProperty(
    authority,
    "finalPrivateReviewHardGateAcceptance",
  ) === expectedAcceptanceObject,
);
check(
  "machine authority contains the exact CURRENT review state",
  extractObjectProperty(authority, "currentReviewState") ===
    expectedCurrentReviewState,
);
check(
  "machine authority advances currentStatus only to canonical acceptance state",
  authority.includes('  currentStatus:\n    "' + currentStatus + '",') &&
    countOccurrences(authority, currentStatus) === 1,
);
check(
  "machine authority preserves all prohibited authority flags",
  includesAll(authority, [
    "legalPublicationApproved: false",
    "publicProductLaunchAuthorized: false",
    "paymentImplemented: false",
    "productionPaymentAuthorized: false",
    "productionAssessmentRuntimeEnabled: false",
    "productionPurchaseEligibilityRuntimeEnabled: false",
    "stripeApprovalEstablished: false",
    'formalStripeSelection: "incomplete"',
    "additionalProviderOperationsAuthorized: false",
    "publicVisibilityAuthorized: false",
    "domainDnsAuthorized: false",
  ]),
);

const legalPage = readText(legalPagePath);
check(
  "/legal presents the accepted Private Review technical truth",
  includesAll(legalPage, [
    "B4b Private Review technical evidence closure",
    "technical evidence complete",
    "ChatGPT final review",
    "Human final review",
    "B4b acceptance",
    "PASS / complete",
    "Private Review scopeでaccepted complete",
    "Paid Production Hosting",
    "provisional",
    "Production readiness",
    "not established",
    baseline,
  ]),
);
check(
  "/legal presents all unapproved Production and public boundaries",
  includesAll(legalPage, [
    "ProductionはB4a SHAのまま unchanged / locked",
    "Production Runtime未承認",
    "Production Payment未承認",
    "Stripe未承認・未正式選定",
    "public visibility未承認",
    "domain/DNS未承認",
    "法務公開未承認",
    "Public Launch未承認",
    "Paymentは未実装",
  ]),
);
check(
  "/legal removes superseded pending review claims",
  [
    "technical evidence complete・未受入",
    "ChatGPT pending・Human pending・B4b pending",
    "final review / acceptance pending",
    "B4bとNetlify Hard Gateは未受入",
  ].every((fragment) => !legalPage.includes(fragment)),
);
check(
  "/legal states Paid Production planning is not started",
  includesAll(legalPage, [
    "Paid Production Readiness Planning",
    "planning only / not started / no external authority created",
    "まだ開始していません",
  ]),
);

const protectedFiles = [
  "next.config.ts",
  "next-env.d.ts",
  "package.json",
  "package-lock.json",
  historicalVerifierPath,
  technicalClosureVerifierPath,
];
check(
  "protected config/package/next-env/verifier files equal technical closure baseline",
  protectedFiles.every(
    (relativePath) =>
      existsSync(path.join(repositoryRoot, relativePath)) &&
      git("hash-object", "--path=" + relativePath, relativePath) ===
        git("rev-parse", baseline + ":" + relativePath) &&
      (committedMode
        ? gitSucceeds("diff", "--quiet", baseline, head, "--", relativePath)
        : gitSucceeds("diff", "--quiet", baseline, "--", relativePath)),
  ),
);
check(
  "sealed historical B4b verifier blob remains exact",
  git("hash-object", "--path=" + historicalVerifierPath, historicalVerifierPath) ===
    historicalVerifierBlob &&
    git("rev-parse", baseline + ":" + historicalVerifierPath) ===
      historicalVerifierBlob,
);
check(
  "technical closure verifier blob remains exact",
  git(
    "hash-object",
    "--path=" + technicalClosureVerifierPath,
    technicalClosureVerifierPath,
  ) === technicalClosureVerifierBlob &&
    git("rev-parse", baseline + ":" + technicalClosureVerifierPath) ===
      technicalClosureVerifierBlob,
);

const protectedPrefixes = [
  "app/api/",
  "lib/assessment/",
  "lib/runtime/",
  "lib/safety/",
  "lib/purchase/",
  "lib/payment/",
  "lib/supabase/",
  "supabase/",
];
check(
  "acceptance changes no API, Runtime, Safety, purchase, Payment, or Supabase path",
  changeEntries.every(
    (entry) =>
      !protectedPrefixes.some((prefix) =>
        entry.relativePath.startsWith(prefix),
      ),
  ),
);
check(
  "Product/runtime/package/lock/config delta is zero",
  changeEntries.every(
    (entry) =>
      ![
        "next.config.ts",
        "next-env.d.ts",
        "package.json",
        "package-lock.json",
      ].includes(entry.relativePath) &&
      !entry.relativePath.startsWith("components/") &&
      !entry.relativePath.startsWith("lib/assessment/") &&
      !entry.relativePath.startsWith("app/api/"),
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
        baseline,
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
          baseline,
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
  "raw Provider URL scan is zero",
  sensitiveCounts.providerUrls === 0,
);
check(
  "Provider ID scan is zero",
  sensitiveCounts.providerIdentifiers === 0,
);
check("secret scan is zero", sensitiveCounts.secrets === 0);
check("Human PII scan is zero", sensitiveCounts.humanPii === 0);

const addedOperationalCode = [authorityPath, legalPagePath]
  .map((relativePath) =>
    addedTextFromPatch(
      git(
        "diff",
        "--no-ext-diff",
        "--unified=0",
        baseline,
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
  "operational Product code addition is zero",
  operationalPatterns.every(
    (pattern) => Array.from(addedOperationalCode.matchAll(pattern)).length === 0,
  ),
);

const productionClaimSurfaces = [
  currentOverlay,
  currentController,
  expectedAcceptanceObject,
  expectedCurrentReviewState,
  legalPage,
].join("\n");
check(
  "Production-ready and adjacent overclaim count is zero",
  [
    /Production ready/giu,
    /Production approved/giu,
    /Paid Production approved/giu,
    /Public launch approved/giu,
    /Payment ready/giu,
    /Stripe approved/giu,
  ].every(
    (pattern) =>
      Array.from(productionClaimSurfaces.matchAll(pattern)).length === 0,
  ),
);
check(
  "acceptance verifier does not pin its own committed SHA",
  !committedMode || !readText(verifierPath).includes(head),
);
check("stash remains empty", git("stash", "list", "--format=%H") === "");
check(
  "all exact-scope files have no trailing whitespace",
  exactPaths.every((relativePath) =>
    readText(relativePath)
      .split("\n")
      .every((line) => !/[ \t]+$/u.test(line)),
  ),
);
check("working diff check passes", gitSucceeds("diff", "--check"));
check("staged diff check passes", gitSucceeds("diff", "--cached", "--check"));
check(
  "baseline-to-acceptance cumulative diff check passes",
  committedMode
    ? gitSucceeds("diff", "--check", baseline, head, "--")
    : gitSucceeds("diff", "--check", baseline, "--"),
);

if (failures.length > 0) {
  console.error(
    "FAIL Stripe Lane B B4b Private Review Hard Gate Acceptance Sync: " +
      failures.length +
      "/" +
      checkCount +
      " checks failed",
  );
  for (const label of failures) console.error(" - " + label);
  process.exit(1);
}

console.log(
  "PASS Stripe Lane B B4b Private Review Hard Gate Acceptance Sync: " +
    checkCount +
    "/" +
    checkCount +
    " checks passed",
);
console.log(
  "PASS mode " +
    (workingMode ? "working-acceptance-sync" : "committed-acceptance-sync"),
);
console.log(
  "PASS manifest " +
    JSON.stringify({ update: 28, new: 1, delete: 0, rename: 0, total: 29 }),
);
console.log(
  "PASS blobs " +
    JSON.stringify({
      historicalVerifier: historicalVerifierBlob,
      technicalClosureVerifier: technicalClosureVerifierBlob,
    }),
);
console.log("PASS sensitive scans " + JSON.stringify(sensitiveCounts));
