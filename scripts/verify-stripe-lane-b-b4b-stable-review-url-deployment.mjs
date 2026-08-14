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
const expectedBranch =
  "codex/stripe-lane-b-b4b-private-netlify-review-deployment-evidence";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const candidateStatus =
  "stripe_lane_b_b4b_private_netlify_review_deployment_evidence_correction_candidate_pending_external_reqa_human_chatgpt_review";
const candidateDate = "2026-08-14";
const acceptedB3Status =
  "stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete";
const acceptedB4aStatus =
  "stripe_lane_b_b4a_netlify_primary_hosting_direction_human_chatgpt_accepted_complete";
const technicalQa = "PASS_20_of_20_on_deployed_b4a_sha";
const overallQa = "FAIL_truthfulness_blockers_on_deployed_b4a_sha";

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
const workingMode = head === baseline;
const committedMode =
  head !== baseline &&
  git("rev-parse", head + "^") === baseline &&
  Number(git("rev-list", "--count", baseline + ".." + head)) === 1;

check("expected B4b branch", branch === expectedBranch);
check(
  "main and origin/main remain fixed",
  main === expectedMain && originMain === expectedMain,
);
check(
  "exact baseline to one Candidate commit lifecycle",
  workingMode || committedMode,
);
check(
  "committed mode is clean and working mode has Candidate changes",
  committedMode ? statusRecords.length === 0 : statusRecords.length > 0,
);

const upstreamExists = gitSucceeds("rev-parse", "--verify", "@{upstream}");
check(
  "upstream is absent before push or equals HEAD after push",
  !upstreamExists || git("rev-parse", "@{upstream}") === head,
);

let changeEntries;
if (workingMode) {
  changeEntries = statusRecords.map((record) => ({
    status:
      record.indexState === "?" && record.worktreeState === "?"
        ? "A"
        : record.indexState === "A"
          ? "A"
          : "M",
    path: record.relativePath,
    renamed:
      record.renameTarget !== null ||
      record.indexState === "R" ||
      record.worktreeState === "R",
  }));
} else {
  changeEntries = gitLines(
    "diff",
    "--name-status",
    "--find-renames",
    baseline,
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

const candidatePaths = sorted(changeEntries.map((entry) => entry.path));
const modifiedPaths = sorted(
  changeEntries
    .filter((entry) => entry.status === "M")
    .map((entry) => entry.path),
);
const addedPaths = sorted(
  changeEntries
    .filter((entry) => entry.status === "A")
    .map((entry) => entry.path),
);

check(
  "exact 33-path Candidate mutation manifest",
  isDeepStrictEqual(candidatePaths, sorted(exactScope)),
);
check(
  "classification is exactly 31 modified and 2 added",
  isDeepStrictEqual(modifiedPaths, sorted(updatedPaths)) &&
    isDeepStrictEqual(addedPaths, sorted(newPaths)),
);
check(
  "delete, rename, and copy counts are zero",
  changeEntries.every(
    (entry) =>
      !entry.renamed &&
      entry.status !== "D" &&
      entry.status !== "R" &&
      entry.status !== "C",
  ),
);
check(
  "all update paths existed and both new paths were absent at baseline",
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
  "type counts are docs 26, code/UI 6, verifier 1",
  documentationPaths.length === 26 &&
    codeUiPaths.length === 6 &&
    newPaths.filter((relativePath) => relativePath.startsWith("scripts/"))
      .length === 1,
);

check(
  "B3 verifier, B4a verifier/controller, package, lock, config, and next-env are baseline-identical",
  protectedFiles.every(
    (relativePath) =>
      readText(relativePath) === readTextAt(baseline, relativePath) &&
      gitSucceeds("diff", "--quiet", baseline, "--", relativePath),
  ),
);
check(
  "Candidate changes no API, Runtime, purchase, Safety, or Supabase path",
  candidatePaths.every(
    (relativePath) =>
      !protectedPrefixes.some((prefix) => relativePath.startsWith(prefix)),
  ) &&
    protectedPrefixes.every((prefix) =>
      gitSucceeds("diff", "--quiet", baseline, "--", prefix),
    ),
);

const baselineAuthority = readTextAt(baseline, authorityPath);
const currentAuthority = readText(authorityPath);
const baselineB3Object = extractConstObject(
  baselineAuthority,
  "stripeLaneBReviewAuthority",
);
const currentB3Object = extractConstObject(
  currentAuthority,
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
const currentB4bObject = extractConstObject(
  currentAuthority,
  "stripeLaneB4bStableReviewDeploymentAuthority",
);

check(
  "accepted B3 machine object remains byte-identical",
  baselineB3Object.length > 0 && baselineB3Object === currentB3Object,
);
check(
  "accepted B4a machine object remains byte-identical",
  baselineB4aObject.length > 0 && baselineB4aObject === currentB4aObject,
);
check(
  "B4b object is the only authority-file addition",
  currentB4bObject.length > 0 &&
    withoutConstObject(
      currentAuthority,
      "stripeLaneB4bStableReviewDeploymentAuthority",
    ) === baselineAuthority,
);
check(
  "B4b machine authority records exact evidence and pending states",
  includesAll(currentB4bObject, [
    candidateStatus,
    'candidateDate: "' + candidateDate + '"',
    "stripeLaneB4aDeploymentReadinessAuthority.acceptedStatus",
    'predecessorAcceptedB4aSha:',
    '"' + baseline + '"',
    'provider: "Netlify"',
    'deployedGitSha: "' + baseline + '"',
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
    technicalQa,
    overallQa,
    'correctedCandidateDeployment: "not_performed"',
    'correctedCandidateExternalReQa: "pending"',
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
  baselineB3Object.includes(acceptedB3Status) &&
    baselineB4aObject.includes(acceptedB4aStatus),
);

const controller = readText(controllerPath);
check(
  "controller records exact Candidate and predecessor",
  includesAll(controller, [
    candidateStatus,
    candidateDate,
    acceptedB4aStatus,
    baseline,
    "B4b repository Candidate | pending review",
    "ChatGPT Candidate review | pending",
    "Human Candidate review | pending",
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
  "controller records technical PASS and overall FAIL without transfer to Candidate",
  includesAll(controller, [
    technicalQa,
    overallQa,
    "The 20/20 technical result applies only to the deployed accepted B4a SHA.",
    "Corrected Candidate deployment | not_performed",
    "Corrected Candidate external re-QA | pending",
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
    "corrected Candidate SHA build/private deployment",
    "actual /request HTML robots verification",
    "/ and /review re-QA",
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
    "Additional Provider operation | not authorized",
    "Corrected Candidate build/deployment | not authorized by this Candidate",
    "Unlock auto publishing | not authorized",
    "Change project visibility | not authorized",
    "Future external operations remain separately authorized.",
  ]),
);
check(
  "controller records exact manifest and counts",
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

const mirrorSources = documentationMirrors.map(readText);
const baselineMirrorSources = documentationMirrors.map((relativePath) =>
  readTextAt(baseline, relativePath),
);
check(
  "all 25 documentation mirrors change only their top CURRENT overlay",
  mirrorSources.every(
    (source, index) =>
      maskCurrentOverlay(source) ===
      maskCurrentOverlay(baselineMirrorSources[index]),
  ),
);
check(
  "all 25 CURRENT overlays record the exact B4b Candidate boundary",
  mirrorSources.every((source) =>
    includesAll(source, [
      candidateStatus,
      candidateDate,
      baseline,
      technicalQa,
      overallQa,
      "not_performed / pending",
      "Netlify Hard Gate: not_passed",
      "Paid Production Hosting: provisional",
      controllerPath,
      "Additional Provider operations",
      "accepted B3/B4a historical evidence remains unchanged",
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

const requestForm = readText("components/request/RequestForm.tsx");
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
const expectedRequestForm = replaceOnce(
  baselineRequestForm,
  requestFormNeedle,
  requestFormReplacement,
  "RequestForm Phase 4 boundary",
);
check(
  "RequestForm changes only Phase 4 review-boundary copy",
  requestForm === expectedRequestForm,
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
  "/legal no longer claims build, deployment, project, or B4b work absent",
  !includesAll(legalPage, ["実build／配備は未実施"]) &&
    !legalPage.includes("Netlifyの実build・配備は行われておらず") &&
    !legalPage.includes(
      "Netlify account/site・Provider URL作成・実build・deployment",
    ) &&
    !legalPage.includes("未実施のB4b"),
);
check(
  "/legal truthfully presents bounded evidence, FAIL, pending re-QA, and no future authority",
  includesAll(legalPage, [
    "stripeLaneB4bStableReviewDeploymentAuthority",
    "Human実行済みの限定証拠",
    "Provider build・Private deployment",
    "SUCCESS・Published / successful",
    "Private / Private・locked",
    "20/20 PASS",
    "総合外部QA",
    "FAIL",
    "訂正済みCandidate配備・外部再QA",
    "未実施・pending",
    "ChatGPT pending・Human pending・B4b pending",
    "not passed・provisional",
    "追加Provider操作・public visibility・domain/DNSは未承認",
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
  baseline,
];
if (committedMode) diffArgs.push(head);
diffArgs.push("--", ...exactScope);
const candidatePatch = git(...diffArgs);
let candidateAddedText = addedTextFromPatch(candidatePatch);
if (workingMode) {
  candidateAddedText +=
    "\n" + newPaths.map((relativePath) => readText(relativePath)).join("\n");
}

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
      total + Array.from(candidateAddedText.matchAll(pattern)).length,
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
  baseline,
];
if (committedMode) codeDiffArgs.push(head);
codeDiffArgs.push("--", ...codeUiPaths);
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
  provider: candidatePaths.filter((relativePath) =>
    relativePath.startsWith("integrations/"),
  ).length,
  deployment: candidatePaths.filter((relativePath) =>
    [
      "netlify.toml",
      "vercel.json",
      "wrangler.toml",
      "wrangler.json",
      "open-next.config.ts",
    ].includes(relativePath),
  ).length,
  domainDns: candidatePaths.filter((relativePath) =>
    /(?:domain|dns)/iu.test(relativePath),
  ).length,
  payment: candidatePaths.filter((relativePath) =>
    relativePath.startsWith("app/api/payment/"),
  ).length,
  databaseSupabase: candidatePaths.filter((relativePath) =>
    relativePath.startsWith("supabase/"),
  ).length,
  runtime: candidatePaths.filter(
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
  exactScope.every((relativePath) =>
    noTrailingWhitespace(readText(relativePath)),
  ),
);
check("working diff check", gitSucceeds("diff", "--check"));
check("staged diff check", gitSucceeds("diff", "--cached", "--check"));
check(
  "baseline cumulative diff check",
  gitSucceeds("diff", "--check", baseline, "--"),
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
console.log("PASS mode " + (workingMode ? "working-candidate" : "committed-candidate"));
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
