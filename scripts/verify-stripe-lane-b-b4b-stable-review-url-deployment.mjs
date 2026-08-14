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

const baseline = "025e28a82c0b773d21ececfd8064af045922079d";
const candidate = "9fd55ae07a84d8610905c4b89adbd21b47657528";
const expectedBranch =
  "codex/stripe-lane-b-b4b-private-netlify-review-deployment-evidence";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const historicalCandidateStatus =
  "stripe_lane_b_b4b_private_netlify_review_deployment_evidence_correction_candidate_pending_external_reqa_human_chatgpt_review";
const candidateDate = "2026-08-14";
const r1Status =
  "stripe_lane_b_b4b_remaining_review_wording_external_evidence_r1_source_correction_present_pending_deployment_reqa_human_chatgpt_review";
const r1Date = "2026-08-14";
const acceptedB3Status =
  "stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete";
const acceptedB4aStatus =
  "stripe_lane_b_b4a_netlify_primary_hosting_direction_human_chatgpt_accepted_complete";
const originalTechnicalQa = "PASS_20_of_20_on_deployed_b4a_sha";
const originalOverallQa = "FAIL_truthfulness_blockers_on_deployed_b4a_sha";
const correctedCandidateTechnicalQa =
  "PASS_26_of_26_on_corrected_candidate_sha";
const correctedCandidateOverallQa =
  "FAIL_one_remaining_source_truthfulness_blocker";

const controllerPath =
  "docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md";
const verifierPath =
  "scripts/verify-stripe-lane-b-b4b-stable-review-url-deployment.mjs";
const b4aControllerPath =
  "docs/payment/STRIPE_LANE_B_B4A_DEPLOYMENT_READINESS.md";
const b4aVerifierPath =
  "scripts/verify-stripe-lane-b-b4a-deployment-readiness.mjs";
const b3VerifierPath =
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs";
const authorityPath = "lib/legal/review-content.ts";

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

const codeUiPaths = [
  "app/legal/page.tsx",
  authorityPath,
  "app/request/page.tsx",
  "app/page.tsx",
  "app/review/page.tsx",
  "components/request/RequestForm.tsx",
];

const updatedPaths = [...documentationMirrors, ...codeUiPaths];
const newPaths = [controllerPath, verifierPath];
const exactScope = [...updatedPaths, ...newPaths];
const documentationPaths = [...documentationMirrors, controllerPath];

const r1CodeUiPaths = [
  authorityPath,
  "app/legal/page.tsx",
  "components/request/RequestForm.tsx",
];
const r1UpdatedPaths = [
  ...documentationMirrors,
  controllerPath,
  ...r1CodeUiPaths,
  verifierPath,
];
const r1DocumentationPaths = [...documentationMirrors, controllerPath];

const protectedFiles = [
  b3VerifierPath,
  b4aVerifierPath,
  b4aControllerPath,
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "next-env.d.ts",
];

const protectedPrefixes = [
  "app/api/",
  "lib/assessment/",
  "lib/purchase/",
  "lib/safety/",
  "supabase/",
];

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
  if (!fragment) return 0;
  return source.split(fragment).length - 1;
}

function replaceOnce(source, before, after, label) {
  if (countOccurrences(source, before) !== 1) {
    throw new Error(label + " source anchor is not unique");
  }
  return source.replace(before, after);
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

function withoutConstObject(source, objectName) {
  const startMarker = "\nexport const " + objectName + " = {";
  const start = source.indexOf(startMarker);
  if (start < 0) return source;
  const endMarker = "} as const;\n";
  const end = source.indexOf(endMarker, start);
  if (end < 0) return source;
  return source.slice(0, start) + source.slice(end + endMarker.length);
}

function maskCurrentOverlay(source) {
  return source.replace(
    /^> \*\*CURRENT[^\n]*\n>\n> [^\n]*\n/mu,
    "CURRENT_OVERLAY\n",
  );
}

function noTrailingWhitespace(source) {
  return source.split("\n").every((line) => !/[ \t]+$/u.test(line));
}

function addedTextFromPatch(patchText) {
  return patchText
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1))
    .join("\n");
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
    const relativePath = record.slice(3).replaceAll("\\", "/");
    let renameTarget = null;
    if (
      indexState === "R" ||
      indexState === "C" ||
      worktreeState === "R" ||
      worktreeState === "C"
    ) {
      index += 1;
      renameTarget = (raw[index] ?? "").replaceAll("\\", "/");
    }
    records.push({
      indexState,
      worktreeState,
      relativePath,
      renameTarget,
    });
  }
  return records;
}

if (path.resolve(process.cwd()) !== repositoryRoot) {
  throw new Error("Run from repository root: " + repositoryRoot);
}

let checkCount = 0;
const failures = [];
function check(label, condition) {
  checkCount += 1;
  if (condition) {
    console.log("PASS " + label);
  } else {
    failures.push(label);
    console.error("FAIL " + label);
  }
}

const branch = git("branch", "--show-current");
const head = git("rev-parse", "HEAD");
const main = git("rev-parse", "main");
const originMain = git("rev-parse", "origin/main");
const statusRecords = parseStatusRecords();
const candidateParents = git(
  "rev-list",
  "--parents",
  "-n",
  "1",
  candidate,
).split(/\s+/u);
const candidateAnchored =
  candidateParents.length === 2 &&
  candidateParents[0] === candidate &&
  candidateParents[1] === baseline &&
  Number(git("rev-list", "--count", baseline + ".." + candidate)) === 1;
const r1WorkingMode = head === candidate && statusRecords.length > 0;
const r1CommittedMode =
  head !== candidate &&
  git("rev-parse", head + "^") === candidate &&
  Number(git("rev-list", "--count", baseline + ".." + head)) === 2;

check("expected B4b branch", branch === expectedBranch);
check(
  "main and origin/main remain fixed",
  main === expectedMain && originMain === expectedMain,
);
check(
  "Candidate is the exact direct child of baseline",
  candidateAnchored,
);
check(
  "exact baseline to Candidate to optional one R1 lifecycle",
  r1WorkingMode || r1CommittedMode,
);
check(
  "R1 is the working correction or the exact clean direct child of Candidate",
  r1WorkingMode ? statusRecords.length > 0 : statusRecords.length === 0,
);
check(
  "no third commit exists after baseline",
  Number(git("rev-list", "--count", baseline + ".." + head)) <= 2,
);

const upstreamExists = gitSucceeds("rev-parse", "--verify", "@{upstream}");
const upstream = upstreamExists ? git("rev-parse", "@{upstream}") : null;
check(
  "upstream is Candidate before R1 push or equals HEAD after push",
  upstream === candidate || upstream === head,
);

const candidateChangeEntries = gitLines(
  "diff",
  "--name-status",
  "--find-renames",
  baseline,
  candidate,
  "--",
).map((line) => {
  const fields = line.split("\t");
  return {
    status: fields[0]?.[0] ?? "",
    path: (fields.at(-1) ?? "").replaceAll("\\", "/"),
    renamed: /^(?:R|C)/u.test(fields[0] ?? ""),
  };
});

let r1ChangeEntries;
if (r1WorkingMode) {
  r1ChangeEntries = statusRecords.map((record) => {
    const states = record.indexState + record.worktreeState;
    let status = "M";
    if (states === "??" || states.includes("A")) status = "A";
    else if (states.includes("D")) status = "D";
    else if (states.includes("R")) status = "R";
    else if (states.includes("C")) status = "C";
    return {
      status,
      path: record.relativePath,
      renamed:
        record.renameTarget !== null ||
        record.indexState === "R" ||
        record.worktreeState === "R",
    };
  });
} else {
  r1ChangeEntries = gitLines(
    "diff",
    "--name-status",
    "--find-renames",
    candidate,
    head,
    "--",
  ).map((line) => {
    const fields = line.split("\t");
    return {
      status: fields[0]?.[0] ?? "",
      path: (fields.at(-1) ?? "").replaceAll("\\", "/"),
      renamed: /^(?:R|C)/u.test(fields[0] ?? ""),
    };
  });
}

const candidatePaths = sorted(
  candidateChangeEntries.map((entry) => entry.path),
);
const candidateModifiedPaths = sorted(
  candidateChangeEntries
    .filter((entry) => entry.status === "M")
    .map((entry) => entry.path),
);
const candidateAddedPaths = sorted(
  candidateChangeEntries
    .filter((entry) => entry.status === "A")
    .map((entry) => entry.path),
);
const r1Paths = sorted(r1ChangeEntries.map((entry) => entry.path));
const r1ModifiedPaths = sorted(
  r1ChangeEntries
    .filter((entry) => entry.status === "M")
    .map((entry) => entry.path),
);

check(
  "exact 33-path Candidate mutation manifest",
  isDeepStrictEqual(candidatePaths, sorted(exactScope)),
);
check(
  "Candidate classification is exactly 31 modified and 2 added",
  isDeepStrictEqual(candidateModifiedPaths, sorted(updatedPaths)) &&
    isDeepStrictEqual(candidateAddedPaths, sorted(newPaths)),
);
check(
  "Candidate delete, rename, and copy counts are zero",
  candidateChangeEntries.every(
    (entry) =>
      !entry.renamed &&
      entry.status !== "D" &&
      entry.status !== "R" &&
      entry.status !== "C",
  ),
);
check(
  "all Candidate update paths existed and both new paths were absent at baseline",
  updatedPaths.every(
    (relativePath) =>
      existsAt(baseline, relativePath) &&
      existsSync(path.join(repositoryRoot, relativePath)),
  ) &&
    newPaths.every(
      (relativePath) =>
        !existsAt(baseline, relativePath) &&
        existsSync(path.join(repositoryRoot, relativePath)),
    ),
);
check(
  "Candidate type counts are docs 26, code/UI 6, verifier 1",
  documentationPaths.length === 26 &&
    codeUiPaths.length === 6 &&
    newPaths.filter((relativePath) => relativePath.startsWith("scripts/"))
      .length === 1,
);
check(
  "exact 30-path R1 mutation manifest",
  isDeepStrictEqual(r1Paths, sorted(r1UpdatedPaths)),
);
check(
  "R1 classification is exactly 30 modified and zero added/deleted/renamed",
  isDeepStrictEqual(r1ModifiedPaths, sorted(r1UpdatedPaths)) &&
    r1ChangeEntries.length === 30 &&
    r1ChangeEntries.every(
      (entry) => entry.status === "M" && !entry.renamed,
    ),
);
check(
  "all R1 paths existed at Candidate and remain present",
  r1UpdatedPaths.every(
    (relativePath) =>
      existsAt(candidate, relativePath) &&
      existsSync(path.join(repositoryRoot, relativePath)),
  ),
);
check(
  "R1 type counts are docs 26, code/UI 3, verifier 1",
  r1DocumentationPaths.length === 26 &&
    r1CodeUiPaths.length === 3 &&
    r1UpdatedPaths.filter((relativePath) =>
      relativePath.startsWith("scripts/"),
    ).length === 1,
);

check(
  "B3 verifier, B4a verifier/controller, package, lock, config, and next-env preserve Candidate and baseline",
  protectedFiles.every(
    (relativePath) =>
      readTextAt(candidate, relativePath) ===
        readTextAt(baseline, relativePath) &&
      readText(relativePath) === readTextAt(candidate, relativePath) &&
      gitSucceeds("diff", "--quiet", candidate, "--", relativePath),
  ),
);
check(
  "Candidate and R1 change no API, Runtime, purchase, Safety, or Supabase path",
  candidatePaths.every(
    (relativePath) =>
      !protectedPrefixes.some((prefix) => relativePath.startsWith(prefix)),
  ) &&
    r1Paths.every(
      (relativePath) =>
        !protectedPrefixes.some((prefix) => relativePath.startsWith(prefix)),
    ) &&
    protectedPrefixes.every((prefix) =>
      gitSucceeds("diff", "--quiet", candidate, "--", prefix),
    ),
);

const baselineAuthority = readTextAt(baseline, authorityPath);
const candidateAuthority = readTextAt(candidate, authorityPath);
const currentAuthority = readText(authorityPath);
const baselineB3Object = extractConstObject(
  baselineAuthority,
  "stripeLaneBReviewAuthority",
);
const currentB3Object = extractConstObject(
  currentAuthority,
  "stripeLaneBReviewAuthority",
);
const candidateB3Object = extractConstObject(
  candidateAuthority,
  "stripeLaneBReviewAuthority",
);
const baselineB4aObject = extractConstObject(
  baselineAuthority,
  "stripeLaneB4aDeploymentReadinessAuthority",
);
const currentB4aObject = extractConstObject(
  currentAuthority,
  "stripeLaneB4aDeploymentReadinessAuthority",
);
const candidateB4aObject = extractConstObject(
  candidateAuthority,
  "stripeLaneB4aDeploymentReadinessAuthority",
);
const candidateB4bObject = extractConstObject(
  candidateAuthority,
  "stripeLaneB4bStableReviewDeploymentAuthority",
);
const currentB4bObject = extractConstObject(
  currentAuthority,
  "stripeLaneB4bStableReviewDeploymentAuthority",
);

check(
  "accepted B3 machine object remains byte-identical across baseline, Candidate, and R1",
  baselineB3Object.length > 0 &&
    baselineB3Object === candidateB3Object &&
    candidateB3Object === currentB3Object,
);
check(
  "accepted B4a machine object remains byte-identical across baseline, Candidate, and R1",
  baselineB4aObject.length > 0 &&
    baselineB4aObject === candidateB4aObject &&
    candidateB4aObject === currentB4aObject,
);
check(
  "B4b object is the only authority-file mutation",
  candidateB4bObject.length > 0 &&
  currentB4bObject.length > 0 &&
    withoutConstObject(
      candidateAuthority,
      "stripeLaneB4bStableReviewDeploymentAuthority",
    ) === baselineAuthority &&
    withoutConstObject(
      currentAuthority,
      "stripeLaneB4bStableReviewDeploymentAuthority",
    ) === baselineAuthority,
);
check(
  "immutable Candidate B4b authority retains exact pending deployment and re-QA state",
  includesAll(candidateB4bObject, [
    historicalCandidateStatus,
    'candidateDate: "' + candidateDate + '"',
    'predecessorAcceptedB4aSha:',
    'deployedGitSha: "' + baseline + '"',
    originalTechnicalQa,
    originalOverallQa,
    'correctedCandidateDeployment: "not_performed"',
    'correctedCandidateExternalReQa: "pending"',
  ]),
);
check(
  "R1 B4b machine authority separates original B4a, corrected Candidate, and R1 state",
  includesAll(currentB4bObject, [
    r1Status,
    'r1Date: "' + r1Date + '"',
    "stripeLaneB4aDeploymentReadinessAuthority.acceptedStatus",
    'predecessorAcceptedB4aSha:',
    '"' + baseline + '"',
    'provider: "Netlify"',
    "originalDeployedB4aEvidence",
    'gitSha: "' + baseline + '"',
    'providerBuild: "success"',
    'privateDeployment: "success"',
    'observedBuildDuration: "approximately_43_seconds"',
    'observedNodeRuntime: "24.19.0"',
    'productionVisibility: "private"',
    'deployPreviewVisibility: "private"',
    'autoPublishing: "locked"',
    "providerUrlExists: true",
    "providerProjectIdentifierExists: true",
    "providerDeployIdentifierExists: true",
    originalTechnicalQa,
    originalOverallQa,
    "correctedCandidateEvidence",
    'gitSha: "' + candidate + '"',
    'privateBranchDeployment: "success"',
    'privateProtection: "maintained"',
    'productionDeploy: "unchanged_locked"',
    "publishToProductionOperations: 0",
    "publicVisibilityChanges: 0",
    "environmentSecretOperations: 0",
    correctedCandidateTechnicalQa,
    correctedCandidateOverallQa,
    'requestRobots: "PASS_noindex_nofollow_exactly_once_each"',
    'requestSafetyStop: "PASS_expected_fail_closed"',
    'remainingSourceTruthfulnessBlockerCountAtCandidateReQa: 1',
    "r1State",
    'sourceCorrection: "present"',
    'privateDeployment: "not_performed"',
    'externalReQa: "pending"',
    'chatgptReview: "pending"',
    'humanReview: "pending"',
    'b4bAcceptance: "pending"',
    'netlifyHardGate: "not_passed"',
    'paidProductionHostingDirection: "provisional"',
    "legalPublicationApproved: false",
    "paymentImplemented: false",
    "productionPaymentAuthorized: false",
    "productionAssessmentRuntimeEnabled: false",
    "productionPurchaseEligibilityRuntimeEnabled: false",
    'domainSelection: "none"',
    "additionalProviderOperationsAuthorized: false",
    "publicVisibilityAuthorized: false",
    "domainDnsAuthorized: false",
  ]),
);
check(
  "accepted predecessor statuses remain present",
  currentB3Object.includes(acceptedB3Status) &&
    currentB4aObject.includes(acceptedB4aStatus),
);

const candidateController = readTextAt(candidate, controllerPath);
const controller = readText(controllerPath);
check(
  "immutable Candidate controller records exact Candidate-time pending state",
  includesAll(candidateController, [
    historicalCandidateStatus,
    candidateDate,
    acceptedB4aStatus,
    baseline,
    "Corrected Candidate deployment | not_performed",
    "Corrected Candidate external re-QA | pending",
  ]),
);
check(
  "R1 controller records exact current status, Candidate, and predecessor",
  includesAll(controller, [
    r1Status,
    r1Date,
    historicalCandidateStatus,
    acceptedB4aStatus,
    baseline,
    candidate,
    "R1 source correction | present",
    "R1 Private deployment | not_performed",
    "R1 external re-QA | pending",
    "ChatGPT R1 review | pending",
    "Human R1 review | pending",
    "B4b acceptance | pending",
  ]),
);
check(
  "controller records bounded Private Netlify evidence",
  includesAll(controller, [
    "Provider | Netlify",
    "GitHub repository access | limited to moon-reply",
    "Provider build | SUCCESS",
    "Private deployment | Published / successful",
    "approximately 43 seconds",
    "24.19.0",
    "Production visibility | Private",
    "Deploy Preview visibility | Private",
    "Auto publishing | locked",
    "provider_url_exists | true",
    "provider_project_identifier_exists | true",
    "provider_deploy_identifier_exists | true",
  ]),
);
check(
  "controller preserves original B4a technical PASS and overall FAIL",
  includesAll(controller, [
    originalTechnicalQa,
    originalOverallQa,
    "The 20/20 technical result applies only to the deployed accepted B4a SHA.",
  ]),
);
check(
  "controller records corrected Candidate build, deployment, re-QA, robots, and blocker evidence",
  includesAll(controller, [
    "Corrected Candidate SHA | " + candidate,
    "Corrected Candidate Provider build | success",
    "Corrected Candidate Private Branch Deploy | success",
    "Private protection | maintained",
    "Production Deploy | unchanged / locked",
    "Publish-to-Production operation | 0",
    "Public visibility change | 0",
    "env/secrets operation | 0",
    correctedCandidateTechnicalQa,
    correctedCandidateOverallQa,
    "/request actual HTML robots | PASS",
    "/request safety-stop | PASS_expected_fail_closed",
    "Remaining blocker at Candidate re-QA | RequestMemo local-only source wording — exactly 1",
  ]),
);
check(
  "controller records complete /request fail-closed evidence",
  includesAll(controller, [
    "same-origin purchase eligibility request occurred",
    "Production eligibility did not complete",
    "next-stage transition = 0",
    "purchase/payment = 0",
    "AI generation = 0",
    "persistence/save = 0",
    "email sending = 0",
    "console warning/error = 0/0",
    "expected fail-closed behavior",
  ]),
);
check(
  "Hard Gate remains open with remaining review and Production evidence",
  includesAll(controller, [
    "Netlify Hard Gate | not_passed",
    "Paid Production Hosting direction | provisional",
    "separately authorized R1 SHA build/private deployment",
    "R1 external re-QA",
    "RequestMemo blocker absence verification",
    "rendered 13-route regression QA",
    "actual /request HTML robots re-verification",
    "/request safety-stop re-verification",
    "runtime contract asset inclusion proof",
    "Preview/Production separation evidence",
    "rollback/republication proof",
    "removal/offline proof",
    "actual assessment duration",
    "p50",
    "p95",
    "relevant maximum duration",
    "failure rate",
    "timeout suitability",
    "Production secrets model",
    "logging and observability",
    "expected operating cost",
    "current commercial plan and terms evidence",
  ]),
);
check(
  "controller preserves legal, domain, Stripe, Payment, and Runtime boundaries",
  includesAll(controller, [
    "Legal publication approved | false",
    "Public visibility | not authorized",
    "Final domain selection | none",
    "DNS mutation | not authorized",
    "Stripe approval | not established",
    "Formal Stripe selection | incomplete",
    "Payment implemented | false",
    "Production Payment authorized | false",
    "Production assessment runtime enabled | false",
    "Production purchase eligibility runtime enabled | false",
  ]),
);
check(
  "controller separates completed bounded operations from future authority",
  includesAll(controller, [
    "completed bounded historical operations",
    "Corrected Candidate build/Private Branch Deploy/visibility protection/external re-QA",
    "R1 source correction | present in repository",
    "R1 build/private deployment/external re-QA | not performed; separately authorized future operations",
    "Additional Provider operation | not authorized",
    "Unlock auto publishing | not authorized",
    "Change project visibility | not authorized",
    "Future external operations remain separately authorized.",
  ]),
);
check(
  "controller preserves exact Candidate manifest and counts",
  exactScope.every((relativePath) => controller.includes(relativePath)) &&
    includesAll(controller, [
      "| update | 31 |",
      "| new | 2 |",
      "| delete | 0 |",
      "| rename | 0 |",
      "| total | 33 |",
      "| docs | 26 |",
      "| code/UI | 6 |",
      "| verifier | 1 |",
      "| config | 0 |",
      "| package/dependency/lockfile | 0 |",
      "| runtime-behavior mutation | 0 |",
    ]),
);
check(
  "controller records exact R1 manifest and counts",
  r1UpdatedPaths.every((relativePath) => controller.includes(relativePath)) &&
    includesAll(controller, [
      "## 11A. Exact R1 mutation manifest",
      "### UPDATE — exactly 30",
      "| update | 30 |",
      "| new | 0 |",
      "| delete | 0 |",
      "| rename | 0 |",
      "| total | 30 |",
      "| docs | 26 |",
      "| code/UI | 3 |",
      "| verifier | 1 |",
      "| config/package/dependency/lockfile/runtime | 0 |",
    ]),
);

const mirrorSources = documentationMirrors.map(readText);
const candidateMirrorSources = documentationMirrors.map((relativePath) =>
  readTextAt(candidate, relativePath),
);
check(
  "all 25 R1 documentation mirrors change only their top CURRENT overlay",
  mirrorSources.every(
    (source, index) =>
      maskCurrentOverlay(source) ===
      maskCurrentOverlay(candidateMirrorSources[index]),
  ),
);
check(
  "all 25 immutable Candidate mirrors retain pending deployment and external re-QA",
  candidateMirrorSources.every((source) =>
    includesAll(source, [
      historicalCandidateStatus,
      candidateDate,
      baseline,
      originalTechnicalQa,
      originalOverallQa,
      "not_performed / pending",
    ]),
  ),
);
check(
  "all 25 CURRENT overlays record corrected Candidate evidence and exact R1 boundary",
  mirrorSources.every((source) =>
    includesAll(source, [
      r1Status,
      r1Date,
      baseline,
      originalTechnicalQa,
      originalOverallQa,
      candidate,
      correctedCandidateTechnicalQa,
      correctedCandidateOverallQa,
      "PASS_expected_fail_closed",
      "present / not_performed / pending",
      "Netlify Hard Gate `not_passed`",
      "Paid Production Hosting `provisional`",
      controllerPath,
      "Future Provider operations remain separately authorized",
      "historical B3/B4a/B4b Candidate blocks remain unchanged",
    ]),
  ),
);

const requestPage = readText("app/request/page.tsx");
const baselineRequestPage = readTextAt(baseline, "app/request/page.tsx");
const requestMetadataNeedle =
  '    "月の返事の鑑定依頼シートです。関係性やメッセージを入力し、AIによる整理・分析を次の行動の判断材料にする「恋のメッセージ鑑定ノート」の依頼内容を確認します。",\n};';
const requestMetadataReplacement =
  '    "月の返事の鑑定依頼シートです。関係性やメッセージを入力し、AIによる整理・分析を次の行動の判断材料にする「恋のメッセージ鑑定ノート」の依頼内容を確認します。",\n' +
  "  robots: {\n" +
  "    index: false,\n" +
  "    follow: false,\n" +
  "    googleBot: {\n" +
  "      index: false,\n" +
  "      follow: false,\n" +
  "    },\n" +
  "  },\n" +
  "};";
const requestBoundaryNeedle =
  "            現在は審査用のローカル確認です。入力内容は外部へ送信・保存されず、\n" +
  "            決済、AI生成、メール送信も行われません。再読み込みすると入力は失われます。";
const requestBoundaryReplacement =
  "            現在は公開前の審査モードで、有料販売は開始していません。入力後、このサイト内で\n" +
  "            利用可否を確認する通信が行われることがありますが、本番用の確認は完了せず、\n" +
  "            購入手続きには進みません。決済、外部AIによる生成、入力内容の継続保存、\n" +
  "            メール送信は行われません。再読み込みすると入力は失われます。";
let expectedRequestPage = replaceOnce(
  baselineRequestPage,
  requestMetadataNeedle,
  requestMetadataReplacement,
  "request metadata",
);
expectedRequestPage = replaceOnce(
  expectedRequestPage,
  requestBoundaryNeedle,
  requestBoundaryReplacement,
  "request review boundary",
);
check(
  "/request changes only metadata and visible review boundary",
  requestPage === expectedRequestPage,
);
const requestMetadata = requestPage.slice(
  requestPage.indexOf("export const metadata"),
  requestPage.indexOf("};") + 2,
);
check(
  "/request route metadata has complete robots and googleBot protection",
  requestMetadata.includes("robots: {") &&
    requestMetadata.includes("googleBot: {") &&
    countOccurrences(requestMetadata, "index: false") === 2 &&
    countOccurrences(requestMetadata, "follow: false") === 2,
);
check(
  "/request no longer claims local-only and preserves required review meaning",
  !requestPage.includes("現在は審査用のローカル確認です") &&
    includesAll(requestPage, [
      "現在は公開前の審査モード",
      "有料販売は開始していません",
      "このサイト内で",
      "利用可否を確認する通信",
      "本番用の確認は完了せず",
      "購入手続きには進みません",
      "決済",
      "外部AIによる生成",
      "入力内容の継続保存",
      "メール送信は行われません",
      "再読み込みすると入力は失われます",
    ]),
);

const homePage = readText("app/page.tsx");
const baselineHomePage = readTextAt(baseline, "app/page.tsx");
let expectedHomePage = replaceOnce(
  baselineHomePage,
  "現在利用できるのはローカルの依頼フォームと確認表示です。決済・生成・メール配信は動作しません。",
  "現在利用できるのは公開前の審査用依頼フォームと確認表示です。決済・生成・メール配信は動作しません。",
  "home flow status",
);
expectedHomePage = replaceOnce(
  expectedHomePage,
  "現在はローカル確認のみで、購入・生成・送信はできません。",
  "現在は公開前の審査モードで、購入・生成・送信はできません。",
  "home final status",
);
check(
  "top page changes only the two known local-only assertions",
  homePage === expectedHomePage,
);
check(
  "top page preserves disabled Product boundaries",
  includesAll(homePage, [
    "公開前の審査用依頼フォーム",
    "決済・生成・メール配信は動作しません",
    "公開前の審査モード",
    "購入・生成・送信はできません",
  ]) &&
    !homePage.includes("ローカルの依頼フォーム") &&
    !homePage.includes("現在はローカル確認のみ"),
);

const reviewPage = readText("app/review/page.tsx");
const expectedReviewPage = replaceOnce(
  readTextAt(baseline, "app/review/page.tsx"),
  "ここで確認できるのは表示とローカル UI です。",
  "ここで確認できるのは公開前の審査用UIと表示です。",
  "review hub boundary",
);
check(
  "review hub changes only its local-only assertion",
  reviewPage === expectedReviewPage,
);
check(
  "review hub preserves inactive-operation boundaries",
  includesAll(reviewPage, [
    "公開前の審査用UIと表示",
    "決済",
    "外部送信",
    "AI生成",
    "メール配信",
    "データ保存",
    "ファイル生成",
    "動作しません",
  ]) && !reviewPage.includes("表示とローカル UI"),
);
check(
  "all non-R1 Candidate code/UI paths remain Candidate-identical",
  ["app/request/page.tsx", "app/page.tsx", "app/review/page.tsx"].every(
    (relativePath) =>
      readText(relativePath) === readTextAt(candidate, relativePath),
  ),
);

const requestForm = readText("components/request/RequestForm.tsx");
const candidateRequestForm = readTextAt(
  candidate,
  "components/request/RequestForm.tsx",
);
const baselineRequestForm = readTextAt(
  baseline,
  "components/request/RequestForm.tsx",
);
const requestFormNeedle =
  "              <strong>現在はローカル確認だけです。</strong>\n" +
  "              <span>\n" +
  "                送信、永続保存、メール配信、決済、AI生成は行われません。最終操作時にも、現在の相談入力と利用確認をサーバーで再確認します。\n" +
  "              </span>";
const requestFormReplacement =
  "              <strong>現在は公開前の審査モードで、有料販売は開始していません。</strong>\n" +
  "              <span>\n" +
  "                最終操作時には、このサイト内で現在の相談入力と利用可否を再確認しますが、本番用の確認は完了せず、購入手続きには進みません。決済、外部AIによる生成、永続保存、メール送信は行われません。\n" +
  "              </span>";
const expectedCandidateRequestForm = replaceOnce(
  baselineRequestForm,
  requestFormNeedle,
  requestFormReplacement,
  "RequestForm Phase 4 boundary",
);
check(
  "immutable Candidate RequestForm changes only Phase 4 review-boundary copy",
  candidateRequestForm === expectedCandidateRequestForm,
);
const requestMemoOldPhrase =
  "入力内容をローカルで並べ直した表示です。AI処理、外部送信、保存は行っていません。";
const requestMemoNewPhrase =
  "入力内容をこの画面上で並べ直した表示です。AI処理、外部送信、保存は行っていません。";
const expectedR1RequestForm = replaceOnce(
  candidateRequestForm,
  requestMemoOldPhrase,
  requestMemoNewPhrase,
  "RequestMemo remaining local-only wording",
);
check(
  "Candidate RequestMemo retains exactly one historical old phrase",
  countOccurrences(candidateRequestForm, requestMemoOldPhrase) === 1 &&
    countOccurrences(candidateRequestForm, requestMemoNewPhrase) === 0,
);
check(
  "R1 RequestForm changes only the exact RequestMemo wording",
  requestForm === expectedR1RequestForm,
);
check(
  "R1 RequestMemo old phrase is zero and new phrase is exactly one",
  countOccurrences(requestForm, requestMemoOldPhrase) === 0 &&
    countOccurrences(requestForm, requestMemoNewPhrase) === 1,
);
check(
  "RequestForm Phase 4 records truthful fail-closed prelaunch meaning",
  !requestForm.includes("現在はローカル確認だけです") &&
    includesAll(requestForm, [
      "現在は公開前の審査モード",
      "有料販売は開始していません",
      "このサイト内で現在の相談入力と利用可否を再確認",
      "本番用の確認は完了せず",
      "購入手続きには進みません",
      "決済",
      "外部AIによる生成",
      "永続保存",
      "メール送信は行われません",
    ]),
);

const legalPage = readText("app/legal/page.tsx");
check(
  "/legal no longer claims corrected Candidate build, deployment, or re-QA is absent",
  !includesAll(legalPage, ["実build／配備は未実施"]) &&
    !legalPage.includes("Netlifyの実build・配備は行われておらず") &&
    !legalPage.includes(
      "Netlify account/site・Provider URL作成・実build・deployment",
    ) &&
    !legalPage.includes("未実施のB4b") &&
    !legalPage.includes("訂正済みCandidate配備・外部再QA") &&
    !legalPage.includes("訂正Candidateの配備・再QA・受入は未完了") &&
    !legalPage.includes("未実施・pending"),
);
check(
  "/legal truthfully presents original B4a, corrected Candidate, R1, and authority boundaries",
  includesAll(legalPage, [
    "stripeLaneB4bStableReviewDeploymentAuthority",
    "currentStatus",
    "Original deployed B4a SHA",
    "Original B4a technical / overall QA",
    "20/20 PASS",
    "Corrected Candidate SHA",
    "Corrected Candidate build・Private Branch Deploy",
    "success・success",
    "Private protection・Production Deploy",
    "maintained・unchanged / locked",
    "Corrected Candidate rendered technical re-QA",
    "26/26 PASS",
    "Corrected Candidate overall re-QA",
    "FAIL・RequestMemo source blocker 1件",
    "/request robots・safety-stop",
    "PASS・PASS_expected_fail_closed",
    "R1 source correction・Private deployment・external re-QA",
    "present・not_performed・pending",
    "ChatGPT pending・Human pending・B4b pending",
    "not passed・provisional",
    "R1のPrivate配備・外部再QA、追加Provider操作",
    "法務公開",
    "未承認",
    "Payment実装",
    "Production Payment",
    "Production Runtime",
  ]),
);

const diffArgs = [
  "diff",
  "--no-ext-diff",
  "--unified=0",
  candidate,
];
if (r1CommittedMode) diffArgs.push(head);
diffArgs.push("--", ...r1UpdatedPaths);
const r1Patch = git(...diffArgs);
const r1AddedText = addedTextFromPatch(r1Patch);

const actualUrlPatterns = [
  /https?:\/\/[^\s)]+/giu,
  /\b[A-Za-z0-9-]+\.netlify\.app\b/giu,
];
const providerIdentifierPatterns = [
  /(?:site|project|deploy|account|team|installation)[ _-]?(?:id|identifier)\s*[:=]\s*["']?[A-Za-z0-9_-]{6,}/giu,
];
const secretPatterns = [
  /sk_(?:live|test|proj)_[A-Za-z0-9_-]{8,}/gu,
  /AKIA[0-9A-Z]{16}/gu,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/gu,
];
const piiPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu,
  /(?:\+81[- ]?\d{1,4}[- ]?\d{1,4}[- ]?\d{3,4}|0\d{1,4}-\d{1,4}-\d{3,4})/gu,
  /〒\s*\d{3}-\d{4}/gu,
];

function countMatches(patterns) {
  return patterns.reduce(
    (total, pattern) =>
      total + Array.from(r1AddedText.matchAll(pattern)).length,
    0,
  );
}

const actualUrlCount = countMatches(actualUrlPatterns);
const providerIdentifierCount = countMatches(providerIdentifierPatterns);
const secretCount = countMatches(secretPatterns);
const humanPiiCount = countMatches(piiPatterns);

check("raw Provider URL scan count is zero", actualUrlCount === 0);
check(
  "Provider identifier value scan count is zero",
  providerIdentifierCount === 0,
);
check("actual secret scan count is zero", secretCount === 0);
check("actual Human PII scan count is zero", humanPiiCount === 0);

const codeDiffArgs = [
  "diff",
  "--no-ext-diff",
  "--unified=0",
  candidate,
];
if (r1CommittedMode) codeDiffArgs.push(head);
codeDiffArgs.push("--", ...r1CodeUiPaths);
const addedCode = addedTextFromPatch(git(...codeDiffArgs));
const operationalCodePatterns = [
  /\bfetch\s*\(/gu,
  /\bcreateClient\s*\(/gu,
  /\bnew\s+Stripe\s*\(/gu,
  /\bopenai\.(?:responses|chat)\b/giu,
  /\bprocess\.env\b/gu,
  /\bexport\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE)\b/gu,
  /["']use server["']/gu,
];
const operationalCodeCount = operationalCodePatterns.reduce(
  (total, pattern) =>
    total + Array.from(addedCode.matchAll(pattern)).length,
  0,
);

const operationCounts = {
  provider: r1Paths.filter((relativePath) =>
    relativePath.startsWith("integrations/"),
  ).length,
  deployment: r1Paths.filter((relativePath) =>
    [
      "netlify.toml",
      "vercel.json",
      "wrangler.toml",
      "wrangler.json",
      "open-next.config.ts",
    ].includes(relativePath),
  ).length,
  domainDns: r1Paths.filter((relativePath) =>
    /(?:domain|dns)/iu.test(relativePath),
  ).length,
  payment: r1Paths.filter((relativePath) =>
    relativePath.startsWith("app/api/payment/"),
  ).length,
  databaseSupabase: r1Paths.filter((relativePath) =>
    relativePath.startsWith("supabase/"),
  ).length,
  runtime: r1Paths.filter(
    (relativePath) =>
      relativePath.startsWith("app/api/") ||
      relativePath.startsWith("lib/assessment/"),
  ).length,
  operationalCode: operationalCodeCount,
};

check(
  "Provider/deployment/domain/Payment/DB/Runtime operation counts remain zero",
  Object.values(operationCounts).every((count) => count === 0),
);
check(
  "all exact-scope files have no trailing whitespace",
  r1UpdatedPaths.every((relativePath) =>
    noTrailingWhitespace(readText(relativePath)),
  ),
);
check("working diff check", gitSucceeds("diff", "--check"));
check("staged diff check", gitSucceeds("diff", "--cached", "--check"));
check(
  "baseline cumulative diff check",
  gitSucceeds("diff", "--check", baseline, "--"),
);
check(
  "Candidate to R1 cumulative diff check",
  gitSucceeds("diff", "--check", candidate, "--"),
);

if (failures.length > 0) {
  console.error(
    "FAIL Stripe Lane B B4b stable review URL deployment: " +
      failures.length +
      "/" +
      checkCount +
      " checks failed",
  );
  for (const label of failures) console.error(" - " + label);
  process.exit(1);
}

console.log(
  "PASS Stripe Lane B B4b stable review URL deployment: " +
    checkCount +
    "/" +
    checkCount +
    " checks passed",
);
console.log("PASS mode " + (r1WorkingMode ? "working-r1" : "committed-r1"));
console.log("PASS operation counts " + JSON.stringify(operationCounts));
console.log(
  "PASS sensitive scans " +
    JSON.stringify({
      providerUrls: actualUrlCount,
      providerIdentifiers: providerIdentifierCount,
      actualSecrets: secretCount,
      actualHumanPii: humanPiiCount,
    }),
);
