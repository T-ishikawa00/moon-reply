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

const baseline = "40fcd2dea5328f690451b46ef0613655f1c9fd04";
const expectedBranch =
  "codex/stripe-lane-b-b4a-netlify-primary-hosting-direction";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const acceptedB3Status =
  "stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete";
const candidateStatus =
  "stripe_lane_b_b4a_netlify_primary_hosting_direction_candidate_ready_pending_human_chatgpt_review";
const candidateDate = "2026-08-14";
const exactCurrentWork =
  "Human + ChatGPT review of Stripe Lane B B4a Netlify Primary Hosting Direction Candidate";
const conditionalSuccessor =
  "Stripe Lane B stable review URL deployment (B4b)";
const controllerPath =
  "docs/payment/STRIPE_LANE_B_B4A_DEPLOYMENT_READINESS.md";
const b3VerifierPath =
  "scripts/verify-stripe-lane-b-b3-review-ready-public-surface.mjs";

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
  "README.md",
  "app/legal/page.tsx",
  "lib/legal/review-content.ts",
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
const newPaths = [
  controllerPath,
  "scripts/verify-stripe-lane-b-b4a-deployment-readiness.mjs",
];
const exactScope = [...updatedPaths, ...newPaths];
const codeUiPaths = ["app/legal/page.tsx", "lib/legal/review-content.ts"];
const protectedFiles = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "next-env.d.ts",
  b3VerifierPath,
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

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function includesAll(source, fragments) {
  return fragments.every((fragment) => source.includes(fragment));
}

function includesInOrder(source, fragments) {
  let cursor = 0;
  for (const fragment of fragments) {
    const index = source.indexOf(fragment, cursor);
    if (index === -1) return false;
    cursor = index + fragment.length;
  }
  return true;
}

function countOccurrences(source, fragment) {
  return source.split(fragment).length - 1;
}

function pathFromNameStatus(entry) {
  return (entry.split("\t").at(-1) ?? "").replaceAll("\\", "/");
}

function changedNameStatusesBetween(from, to) {
  return gitLines(
    "diff",
    "--name-status",
    "--no-renames",
    from,
    to,
    "--",
  );
}

function workingNameStatuses() {
  const tracked = gitLines(
    "diff",
    "--name-status",
    "--no-renames",
    "HEAD",
    "--",
  );
  const untracked = runGitBuffer([
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
  ])
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((relativePath) => "A\t" + relativePath.replaceAll("\\", "/"));
  return [...tracked, ...untracked];
}

function addedTextFromPatch(patchText) {
  return patchText
    .split(/\r?\n/u)
    .filter((line) => /^\+(?!\+\+)/u.test(line))
    .map((line) => line.slice(1))
    .join("\n");
}

function noTrailingWhitespace(source) {
  return source.split("\n").every((line) => !/[ \t]+$/u.test(line));
}

let checkCount = 0;
const failures = [];

function check(label, condition) {
  checkCount += 1;
  if (condition) {
    console.log("PASS " + label);
    return;
  }
  failures.push(label);
  console.error("FAIL " + label);
}

const head = git("rev-parse", "HEAD");
const commitsAfterBaseline = Number(
  git("rev-list", "--count", baseline + "..HEAD"),
);
const headParents = git("rev-list", "--parents", "-n", "1", "HEAD").split(
  /\s+/u,
);
const workingStatuses = workingNameStatuses();
const workingMode = head === baseline;
const committedMode =
  head !== baseline &&
  commitsAfterBaseline === 1 &&
  headParents.length === 2 &&
  headParents[1] === baseline;
const candidateStatuses = workingMode
  ? workingStatuses
  : changedNameStatusesBetween(baseline, head);
const candidatePaths = candidateStatuses.map(pathFromNameStatus);

check("expected B4a branch", git("branch", "--show-current") === expectedBranch);
check(
  "main and origin/main remain fixed",
  git("rev-parse", "main") === expectedMain &&
    git("rev-parse", "origin/main") === expectedMain,
);
check(
  "exact baseline to working Candidate or one Candidate commit lineage",
  (workingMode && commitsAfterBaseline === 0) || committedMode,
);
check(
  "committed Candidate mode has a clean working tree",
  !committedMode || workingStatuses.length === 0,
);
check(
  "baseline is the exact merge base",
  git("merge-base", baseline, "HEAD") === baseline,
);

check(
  "exact 29-path Candidate mutation manifest",
  candidateStatuses.length === 29 &&
    isDeepStrictEqual(sorted(candidatePaths), sorted(exactScope)),
);
check(
  "classification is exactly 27 updates and 2 additions",
  candidateStatuses.filter((entry) => /^M\t/u.test(entry)).length === 27 &&
    candidateStatuses.filter((entry) => /^A\t/u.test(entry)).length === 2 &&
    candidateStatuses.every((entry) => /^(?:M|A)\t/u.test(entry)),
);
check(
  "all update paths existed and both new paths were absent at baseline",
  updatedPaths.every(
    (relativePath) =>
      existsSync(path.join(repositoryRoot, relativePath)) &&
      gitSucceeds("cat-file", "-e", baseline + ":" + relativePath),
  ) &&
    newPaths.every(
      (relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)) &&
        !gitSucceeds("cat-file", "-e", baseline + ":" + relativePath),
    ),
);
check(
  "type counts are docs 26, code/UI 2, config 0, verifier 1",
  documentationMirrors.length + 1 === 26 &&
    codeUiPaths.length === 2 &&
    newPaths.filter((relativePath) => relativePath.startsWith("scripts/"))
      .length === 1 &&
    exactScope.every(
      (relativePath) =>
        ![
          "package.json",
          "package-lock.json",
          "next.config.ts",
          "netlify.toml",
          "vercel.json",
        ].includes(relativePath),
    ),
);
check(
  "package, lockfile, Next config, next-env, and B3 verifier are baseline-identical",
  protectedFiles.every((relativePath) =>
    gitSucceeds("diff", "--quiet", baseline, "--", relativePath),
  ) &&
    readBufferAt("HEAD", b3VerifierPath).equals(
      readBufferAt(baseline, b3VerifierPath),
    ),
);
check(
  "no API, runtime, purchase, Safety, Supabase, or environment path changed",
  candidatePaths.every(
    (relativePath) =>
      !protectedPrefixes.some((prefix) => relativePath.startsWith(prefix)) &&
      !/(?:^|\/)\.env(?:\.|$)/u.test(relativePath),
  ),
);

const baselineAuthority = readTextAt(
  baseline,
  "lib/legal/review-content.ts",
);
const currentAuthority = readText("lib/legal/review-content.ts");
const b3ObjectPattern =
  /export const stripeLaneBReviewAuthority = \{[\s\S]*?\n\} as const;/u;
const baselineB3Object = baselineAuthority.match(b3ObjectPattern)?.[0] ?? "";
const currentB3Object = currentAuthority.match(b3ObjectPattern)?.[0] ?? "";

check(
  "accepted B3 machine authority remains unchanged",
  baselineB3Object.length > 0 && currentB3Object === baselineB3Object,
);
check(
  "accepted B3 status exists in the predecessor",
  baselineAuthority.includes(acceptedB3Status) &&
    readTextAt(baseline, b3VerifierPath).includes(acceptedB3Status),
);
check(
  "accepted B3 verifier remains byte-identical",
  readBuffer(b3VerifierPath).equals(readBufferAt(baseline, b3VerifierPath)),
);

const controller = readText(controllerPath);
check(
  "controller freezes status, date, baseline, pending review, and unproven evidence",
  includesAll(controller, [
    candidateStatus,
    candidateDate,
    baseline,
    acceptedB3Status,
    "accepted_at_conversation_decision_level",
    "Repository B4a Candidate review | `pending`",
    "Repository B4a Candidate acceptance | `pending`",
    "Netlify Hard Gate | `not_proven`",
    "B4b evidence | `not_acquired`",
  ]),
);
check(
  "Hosting Hard Gate and priorities retain exact order",
  includesInOrder(controller, [
    "The actual moon-reply repository must build and run correctly in the selected Hosting environment.",
    "1. low fixed cost / low unexpected-billing risk",
    "2. operational simplicity",
    "3. easy rollback / emergency removal",
    "4. commercial production suitability",
    "5. future scalability",
    "6. low unnecessary vendor lock-in",
  ]),
);
check(
  "Netlify first-review direction and static A boundary are exact",
  includesAll(controller, [
    "First B4b review deployment attempt | `Netlify`",
    "Initial review/prelaunch plan | `Netlify Free`",
    "Static Hosting compatibility audit | `A`",
    "Product-code mutation for basic support | `not_currently_required`",
    "Package/dependency mutation for basic support | `not_currently_required`",
    "Actual Netlify build/runtime compatibility | `unproven`",
    "not actual Provider compatibility proof",
  ]),
);
check(
  "Netlify Production remains provisional with complete evidence gates",
  includesAll(controller, [
    "`paid_production_hosting_direction = provisional`",
    "actual Provider build evidence",
    "actual Preview/runtime behavior evidence",
    "runtime asset inclusion evidence",
    "actual Function execution duration",
    "assessment p50",
    "assessment p95",
    "relevant maximum assessment duration",
    "assessment failure rate",
    "timeout suitability",
    "production secrets model",
    "rollback and republication evidence",
    "logging and observability evidence",
    "expected operating cost",
    "current commercial plan and terms recheck",
  ]),
);
check(
  "Netlify Free remains review-only and paid plan unresolved",
  includesAll(controller, [
    "prelaunch review",
    "compatibility evidence",
    "external browser QA",
    "separately authorized provider-subdomain review evidence",
    "SLA requirements",
    "production reliability requirements",
    "sustained Customer traffic",
    "final commercial Production operation",
    "Free-plan credit exhaustion and site suspension",
    "`paid_production_plan = unresolved`",
  ]),
);

const preB4bGates = [
  "- [ ] exact accepted SHA fixed",
  "- [ ] exact deployment mutation scope reviewed",
  "- [ ] Netlify account/site operation separately authorized",
  "- [ ] legal publication not inferred",
  "- [ ] Production Payment remains false",
  "- [ ] no Production Provider secrets unless separately authorized",
  "- [ ] no domain or DNS authority implied",
];
const b4bEvidenceGates = [
  "- [ ] exact accepted SHA Provider build succeeds",
  "- [ ] intended review routes return HTTP 200",
  "- [ ] client-side navigation works",
  "- [ ] console warning count is 0",
  "- [ ] console error count is 0",
  "- [ ] runtime contract assets are included",
  "- [ ] Node.js version is resolved or pinned where required",
  "- [ ] noindex/nofollow is preserved",
  "- [ ] Payment remains disabled",
  "- [ ] Production AI operation remains disabled",
  "- [ ] Production email operation remains disabled",
  "- [ ] Production Contact operation remains disabled",
  "- [ ] Preview and Production environments remain separated",
  "- [ ] rollback/republication path is proven",
  "- [ ] removal/offline procedure is proven",
  "- [ ] external URL browser QA is completed",
];
check(
  "pre-B4b proof gates are complete and unchecked",
  includesAll(controller, preB4bGates),
);
check(
  "B4b evidence gates are complete and remain not acquired",
  includesAll(controller, [
    ...b4bEvidenceGates,
    "All B4b evidence remains `not_acquired`",
  ]),
);
check(
  "Production runtime blocker and six-stage measurement gate remain explicit",
  includesAll(controller, [
    "Production assessment runtime is intentionally disabled.",
    "Production purchase-eligibility runtime is intentionally disabled.",
    "Payment is not implemented.",
    "Email verification and sending are not implemented.",
    "Contact operation is not implemented.",
    "Production API enablement",
    "authentication and authorization",
    "rate limiting",
    "idempotency",
    "AI spend protection",
    "Supabase/runtime integrity",
    "seller-information disclosure operation",
    "p50",
    "p95",
    "relevant maximum duration",
    "failure rate",
    "async/background architecture",
    "architectural restructuring",
  ]),
);
check(
  "Cloudflare and Vercel fallback states remain exact and unrejected",
  includesAll(controller, [
    "`low_cost_infrastructure_fallback_pending_runtime_proof`",
    "static compatibility: `B`",
    "Product-code mutation: `not_currently_proven_necessary`",
    "OpenNext/Wrangler/workerd deployment configuration: `required`",
    "bundle/filesystem/CPU/memory/runtime proof: `unresolved`",
    "`@opennextjs/cloudflare`",
    "`wrangler`",
    "`paid_simplicity_fallback`",
    "non-commercial Hobby assumption for paid Moon Reply Production: `prohibited`",
    "commercial plan/pricing/terms recheck before use: `required`",
  ]) &&
    countOccurrences(controller, "rejected: `false`") === 2,
);
check(
  "domain and legal publication boundaries remain exact",
  includesAll(controller, [
    "`domain_selection = none`",
    "`LB-DEC-DOMAIN-001`",
    "intended final production domain must be selected before Stripe Account/Site review",
    "technical review",
    "browser QA",
    "`legalPublicationApproved = false`",
    "`NOT APPROVED FOR PUBLICATION`",
    "A review deployment does not equal a public Product launch.",
  ]),
);
check(
  "Payment, Stripe, PayPay, and PAY.JP states remain exact",
  includesAll(controller, [
    "Payment implementation | `false`",
    "Production Payment | `false`",
    "Stripe feasibility | `not established`",
    "Stripe account/contact/submission | `absent / none / none`",
    "Stripe approval/activation | `absent / absent`",
    "Formal Stripe selection | `incomplete`",
    "PayPay | `desired / unverified / not enabled / not approved`",
    "PAY.JP | `paused_fallback_provider_direction / not submitted / not approved / not selected`",
  ]),
);
check(
  "Lane A, B, and C four-field states remain exact",
  countOccurrences(
    controller,
    "preparation status: `preparation_human_approved`",
  ) === 1 &&
    countOccurrences(
      controller,
      "preparation status: `preparation_blocked`",
    ) === 2 &&
    countOccurrences(
      controller,
      "external action authority: `external_action_not_authorized`",
    ) === 3 &&
    countOccurrences(
      controller,
      "acquisition status: `not_submitted`",
    ) === 3 &&
    countOccurrences(controller, "outcome: `null`") === 3,
);
check(
  "Candidate review and conditional B4b successor remain separated",
  includesAll(controller, [
    exactCurrentWork,
    conditionalSuccessor,
    "`separately_authorized_external_work`",
    "Do not switch current work to B4b while Candidate review and acceptance remain pending.",
    "B4a Candidate formulation and commit/push do not authorize that successor.",
  ]),
);

const mirrorSources = documentationMirrors.map(readText);
check(
  "all 25 documentation mirrors preserve B3 and carry the concise B4a overlay",
  mirrorSources.every((source) =>
    includesAll(source, [
      acceptedB3Status,
      candidateStatus,
      candidateDate,
      "accepted at conversation/decision level",
      "repository Candidate review / acceptance pending / pending",
      "Netlify Free",
      "Hard Gate: not proven",
      "paid Production direction: provisional",
      controllerPath,
      exactCurrentWork,
      conditionalSuccessor,
      "separately authorized external work",
      "Accepted B3 authority remains unchanged",
      "no Netlify/site/deploy/domain/DNS/legal-publication/Stripe/Payment/Production-runtime authority is created",
    ]),
  ),
);
check(
  "separate B4a machine authority preserves Candidate and external-action boundaries",
  includesAll(currentAuthority, [
    "export const stripeLaneB4aDeploymentReadinessAuthority",
    candidateStatus,
    'candidateDate: "2026-08-14"',
    'baseline: "' + baseline + '"',
    'hostingDirectionState: "accepted_at_conversation_decision_level"',
    'repositoryCandidateReview: "pending"',
    'repositoryCandidateAcceptance: "pending"',
    'reviewDeploymentProvider: "Netlify"',
    'initialReviewPlan: "Netlify Free"',
    'staticHostingCompatibility: "A"',
    'netlifyBuildRuntimeCompatibility: "unproven"',
    'hardGate: "not_proven"',
    'paidProductionHostingDirection: "provisional"',
    '"low_cost_infrastructure_fallback_pending_runtime_proof"',
    'vercelFallback: "paid_simplicity_fallback"',
    'domainSelection: "none"',
    "legalPublicationApproved: false",
    "deploymentAuthorized: false",
    "b4bExternalWorkAuthorized: false",
    "productionAssessmentRuntimeEnabled: false",
    "productionPurchaseEligibilityRuntimeEnabled: false",
    "paymentImplemented: false",
    "productionPaymentAuthorized: false",
    exactCurrentWork,
    conditionalSuccessor,
    'conditionalSuccessorAuthority: "separately_authorized_external_work"',
  ]),
);

const legalPage = readText("app/legal/page.tsx");
check(
  "legal review UI presents accepted B3 and pending B4a without Production approval",
  includesAll(legalPage, [
    "B3 画面実装",
    "受入済み（2026-08-14）",
    "B4a Hosting方向",
    "Candidate審査待ち",
    "Netlifyを最初の将来B4bレビュー配備先として選定",
    "実build／配備は未実施",
    "未証明・Paid Productionはprovisional",
    "B4a受入後のB4b・別途external work承認が必要",
    "法務公開",
    "未承認",
    "Stripe feasibility・承認・正式選定",
    "Payment実装",
    "Production Payment",
    "Netlifyの実build・配備は行われておらず、B4bには別途承認が必要です。",
  ]),
);
check(
  "controller records exact manifest, counts, no-secret rule, and stop conditions",
  exactScope.every((relativePath) =>
    controller.includes("`" + relativePath + "`"),
  ) &&
    includesAll(controller, [
      "| update | 27 |",
      "| new | 2 |",
      "| delete | 0 |",
      "| rename | 0 |",
      "| total | 29 |",
      "| docs | 26 |",
      "| code/UI | 2 |",
      "| config | 0 |",
      "| verifier | 1 |",
      "| package/dependency/lockfile | 0 |",
      "actual Human PII",
      "actual Provider account/site identifiers",
      "actual deployment URLs",
      "Any required thirtieth mutation path is an immediate stop condition.",
      "accepted B3 authority or its canonical verifier must change",
      "required automated verification fails",
    ]),
);

const trackedPatch = workingMode
  ? git("diff", "--no-ext-diff", "--unified=0", "HEAD", "--")
  : git("diff", "--no-ext-diff", "--unified=0", baseline, "HEAD", "--");
let candidateAddedText = addedTextFromPatch(trackedPatch);
if (workingMode) {
  candidateAddedText +=
    "\n" +
    newPaths
      .filter(
        (relativePath) =>
          !gitSucceeds("cat-file", "-e", "HEAD:" + relativePath),
      )
      .map(readText)
      .join("\n");
}

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
const providerIdentifierPatterns = [
  /(?:netlify[_ -]?)?(?:site|account|project)[_-]?id\s*[:=]\s*["']?[A-Za-z0-9_-]{6,}/giu,
];
const deploymentUrlPatterns = [
  /https?:\/\//giu,
  /\b[A-Za-z0-9-]+\.netlify\.app\b/giu,
  /\b[A-Za-z0-9-]+\.pages\.dev\b/giu,
  /\b[A-Za-z0-9-]+\.vercel\.app\b/giu,
];
const countMatches = (patterns) =>
  patterns.reduce(
    (total, pattern) =>
      total + Array.from(candidateAddedText.matchAll(pattern)).length,
    0,
  );
const secretCount = countMatches(secretPatterns);
const piiCount = countMatches(piiPatterns);
const providerIdentifierCount = countMatches(providerIdentifierPatterns);
const deploymentUrlCount = countMatches(deploymentUrlPatterns);

check("actual secret scan count is zero", secretCount === 0);
check("actual Human PII scan count is zero", piiCount === 0);
check(
  "actual Provider identifier scan count is zero",
  providerIdentifierCount === 0,
);
check("actual deployment URL scan count is zero", deploymentUrlCount === 0);

const codePatch = workingMode
  ? git(
      "diff",
      "--no-ext-diff",
      "--unified=0",
      "HEAD",
      "--",
      ...codeUiPaths,
    )
  : git(
      "diff",
      "--no-ext-diff",
      "--unified=0",
      baseline,
      "HEAD",
      "--",
      ...codeUiPaths,
    );
const addedCode = addedTextFromPatch(codePatch);
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
  runtimeLuna: candidatePaths.filter(
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
  exactScope.every((relativePath) => noTrailingWhitespace(readText(relativePath))),
);
check("working diff check", gitSucceeds("diff", "--check"));
check("staged diff check", gitSucceeds("diff", "--cached", "--check"));
check(
  "baseline cumulative diff check",
  workingMode || gitSucceeds("diff", "--check", baseline, "HEAD", "--"),
);

if (failures.length > 0) {
  console.error(
    "FAIL Stripe Lane B B4a deployment readiness: " +
      failures.length +
      "/" +
      checkCount +
      " checks failed",
  );
  for (const label of failures) console.error(" - " + label);
  process.exit(1);
}

console.log(
  "PASS Stripe Lane B B4a deployment readiness: " +
    checkCount +
    "/" +
    checkCount +
    " checks passed",
);
console.log(
  "PASS mode " + (workingMode ? "working-candidate" : "committed-candidate"),
);
console.log("PASS operation counts " + JSON.stringify(operationCounts));
console.log(
  "PASS sensitive scans " +
    JSON.stringify({
      actualSecrets: secretCount,
      actualHumanPii: piiCount,
      providerIdentifiers: providerIdentifierCount,
      deploymentUrls: deploymentUrlCount,
    }),
);
