import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R1";
const acceptanceParent = "6196ab58d8d93a650d050a0fa6e1e7d4c2b44bc2";
const correctionBaseline = "a5b2defa1bb765d46076a28ca9827d494fcbe433";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedStatus =
  "reassuring_assessment_experience_doctrine_human_chatgpt_accepted_complete_r2_a_authorized";
const expectedBranch =
  "chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-doctrine-acceptance";
const correctionBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-reassurance-doctrine-correction";
const doctrineSourceBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-reassurance-experience";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1";
const productDoctrinePath = `${packageRoot}/product-doctrine-v1.json`;
const productDoctrineMarkdownPath = `${packageRoot}/product-doctrine-v1.md`;
const implementationPackagesPath = `${packageRoot}/implementation-packages-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R1_REVIEW.md";
const rollingDocumentPaths = [
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-doctrine-acceptance.mjs";
const r1DoctrineVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-reassurance-doctrine.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";
const updatedPaths = [
  ...rollingDocumentPaths,
  reviewDocumentPath,
  productDoctrineMarkdownPath,
  productDoctrinePath,
  implementationPackagesPath,
  capabilitiesPath,
];
const exactScope = [...updatedPaths, verifierPath];
const expectedR2AUnauthorizedScope = [
  "customer_assessment_note_ui_changes",
  "css_changes",
  "prompt_changes",
  "pb_05_changes",
  "evaluator_or_semantic_disposition_changes",
  "safety_ux_changes",
  "purchase_or_payment_changes",
  "runtime_activation",
  "provider_execution",
  "db_supabase_or_migration_changes",
  "main_changes",
];

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", ...options },
  ).trim();
}

function gitObjectExists(revisionPath) {
  return (
    spawnSync(
      "git.exe",
      [
        "-c",
        "safe.directory=C:/projects/moon-reply",
        "cat-file",
        "-e",
        revisionPath,
      ],
      { cwd: root, stdio: "ignore" },
    ).status === 0
  );
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath));
}

function readText(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(read(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function readParentJson(relativePath) {
  return JSON.parse(git(["show", `${acceptanceParent}:${relativePath}`]));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function markedBlock(text, marker) {
  const start = `<!-- ${marker}:BEGIN -->`;
  const end = `<!-- ${marker}:END -->`;
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);
  assert.ok(startIndex >= 0 && endIndex > startIndex, marker);
  return text.slice(startIndex, endIndex + end.length);
}

function markdownSection(text, startHeading, endHeading) {
  const startIndex = text.indexOf(startHeading);
  const endIndex = text.indexOf(endHeading);
  assert.ok(startIndex >= 0 && endIndex > startIndex, startHeading);
  return text.slice(startIndex, endIndex);
}

let r1DoctrineVerifierSummary = "not_run";
let packageBVerifierSummary = "not_run";
let packageAR1VerifierSummary = "not_run";

function runR1DoctrineVerifierAtAcceptedParent() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-doctrine-r1-accepted-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--shared", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
    );
    const safeDirectory = `safe.directory=${cloneRoot.replaceAll("\\", "/")}`;
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "true"],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    execFileSync(
      "git.exe",
      [
        "-c",
        safeDirectory,
        "checkout",
        "--quiet",
        "-B",
        correctionBranch,
        acceptanceParent,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    for (const [refName, revision] of [
      [`refs/heads/${doctrineSourceBranch}`, correctionBaseline],
      ["refs/heads/main", expectedMain],
      [`refs/remotes/origin/${doctrineSourceBranch}`, correctionBaseline],
      ["refs/remotes/origin/main", expectedMain],
    ]) {
      execFileSync(
        "git.exe",
        ["-c", safeDirectory, "update-ref", refName, revision],
        { cwd: cloneRoot, stdio: "pipe" },
      );
    }

    const p1Contract = readJson(p1SourceContractPath);
    for (const authority of p1Contract.authority_manifest) {
      copyFileSync(
        path.join(root, authority.path),
        path.join(cloneRoot, authority.path),
      );
    }
    copyFileSync(
      path.join(root, p1Contract.frozen_state.authorization_path),
      path.join(cloneRoot, p1Contract.frozen_state.authorization_path),
    );
    const markerName = path.basename(p1Contract.frozen_state.marker_path);
    const markerSource = path.join(root, ".git", markerName);
    assert.equal(existsSync(markerSource), true, markerName);
    copyFileSync(markerSource, path.join(cloneRoot, ".git", markerName));

    const output = execFileSync(
      process.execPath,
      [path.join(cloneRoot, r1DoctrineVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.match(output, /Reassurance doctrine verifier: PASS 19\/19/u);
    assert.match(output, /Package B verifier: PASS 20\/20 exact 10\/10/u);
    assert.match(output, /Package A R1 verifier: PASS 23\/23/u);
    r1DoctrineVerifierSummary = "PASS 19/19";
    packageBVerifierSummary = "PASS 20/20 exact 10/10";
    packageAR1VerifierSummary = "PASS 23/23";
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const checks = [];

async function check(name, assertion) {
  try {
    await assertion();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact acceptance parent branch and main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["merge-base", head, acceptanceParent]), acceptanceParent);
  const commitsAfterParent = Number(
    git(["rev-list", "--count", `${acceptanceParent}..${head}`]),
  );
  assert.ok(commitsAfterParent === 0 || commitsAfterParent === 1);
  if (commitsAfterParent === 1) {
    assert.equal(git(["rev-parse", `${head}^`]), acceptanceParent);
  }
  assert.equal(git(["rev-parse", correctionBranch]), acceptanceParent);
  assert.equal(git(["rev-parse", `origin/${correctionBranch}`]), acceptanceParent);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact acceptance scope 8 update plus 1 new", () => {
  const trackedEntries = git(["diff", "--name-status", acceptanceParent, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.split("\t"));
  const trackedPaths = new Set(
    trackedEntries.flatMap((entry) => entry.slice(1)).map((candidate) =>
      candidate.replaceAll("\\", "/"),
    ),
  );
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  const allChanged = sorted(new Set([...trackedPaths, ...untracked]));
  assert.equal(updatedPaths.length, 8);
  assert.equal(exactScope.length, 9);
  assert.deepEqual(allChanged, sorted(exactScope));
  assert.ok(
    trackedEntries.every(([status]) => status === "M" || status === "A"),
  );
  for (const candidate of updatedPaths) {
    assert.equal(gitObjectExists(`${acceptanceParent}:${candidate}`), true, candidate);
    assert.ok(trackedPaths.has(candidate), candidate);
  }
  assert.equal(gitObjectExists(`${acceptanceParent}:${verifierPath}`), false);
  assert.equal(trackedPaths.has(verifierPath) || untracked.includes(verifierPath), true);
});

await check("strict UTF-8 sensitive values and JSON validity", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  let sensitiveValues = 0;
  for (const candidate of exactScope) {
    const text = readText(candidate);
    assert.equal(text.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(text, /[\t ]+$/gmu, candidate);
    for (const pattern of secretPatterns) {
      sensitiveValues += [...text.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitiveValues, 0);
  [
    productDoctrinePath,
    implementationPackagesPath,
    capabilitiesPath,
  ].forEach(readJson);
});

await check("R1 doctrine verifier and Package B A accepted checks preserved", () => {
  runR1DoctrineVerifierAtAcceptedParent();
});

await check("R1 Correction doctrine hardening remains exact", () => {
  const doctrine = readJson(productDoctrinePath);
  const parent = readParentJson(productDoctrinePath);
  assert.equal(doctrine.task_id, taskId);
  assert.equal(doctrine.status, expectedStatus);
  assert.equal(doctrine.mode, "acceptance_authorization_sync_only");
  assert.equal(doctrine.branch, expectedBranch);
  assert.deepEqual(doctrine.acceptance, {
    parent: acceptanceParent,
    doctrineHumanChatGPTReview: "complete",
    doctrineHumanChatGPTReviewOutcome: "PASS",
    humanAcceptance: "complete",
    doctrineAcceptance: "complete",
    acceptanceDate: "2026-08-16",
  });
  for (const immutableKey of [
    "baseline",
    "correction",
    "source_branch",
    "expected_parent",
    "main_baseline",
    "non_negotiable_hard_gate",
    "primary_product_value",
    "desired_customer_state_after_reading",
    "product_priority_after_hard_gates",
    "fortune_telling_like_experience",
    "anti_goals",
    "diagnosis",
    "experience_outcome",
    "section_count_policy",
    "r2_c_required_review",
    "jpy980_state_separation",
  ]) {
    assert.deepEqual(doctrine[immutableKey], parent[immutableKey], immutableKey);
  }
  assert.equal(doctrine.section_count_policy.hard_minimum_enforced, false);
  assert.equal(doctrine.section_count_policy.hard_maximum_enforced, false);
  assert.equal(
    doctrine.section_count_policy.normal_visible_section_guidance.policy,
    "guidance_only",
  );
  assert.equal(
    doctrine.section_count_policy.simple_case_below_six_allowed_when_semantically_complete,
    true,
  );
  assert.equal(doctrine.section_count_policy.padding_for_section_count, "prohibited");
  assert.equal(
    doctrine.r2_c_required_review.human_visual_checks.includes("reduced_motion"),
    true,
  );
  assert.equal(
    doctrine.r2_c_required_review.completion_without_reduced_motion_allowed,
    false,
  );
  assert.equal(
    doctrine.jpy980_state_separation.r2_c_human_product_pass.states_are_equivalent,
    false,
  );
  for (const [key, value] of Object.entries(parent.authority_boundary)) {
    assert.deepEqual(doctrine.authority_boundary[key], value, key);
  }
});

await check("Product Doctrine Markdown retains binding R1 content", () => {
  const text = readText(productDoctrineMarkdownPath);
  const parent = git([
    "show",
    `${acceptanceParent}:${productDoctrineMarkdownPath}`,
  ]);
  assert.equal(
    markdownSection(
      text,
      "## Non-negotiable Hard Gate",
      "## Acceptance boundary",
    ),
    markdownSection(
      parent,
      "## Non-negotiable Hard Gate",
      "## Acceptance boundary",
    ),
  );
  for (const required of [
    expectedStatus,
    "PASS",
    "2026-08-16",
    "R2-A Experience Projection successor implementation is authorized only",
    "R2-B Reassuring Customer Note implementation is unauthorized",
    "R2-C Human Visual/Product Review is `not_ready`",
    "experienceProductJudgment` remains `not_established_pending_R2_C_human_product_review",
    "jpy980RuntimeReadiness` remains `not_established",
    "globalQ0Completion=false",
  ]) {
    assert.ok(text.includes(required), required);
  }
});

await check("R2-A only implementation authorization is exact", () => {
  const plan = readJson(implementationPackagesPath);
  const parent = readParentJson(implementationPackagesPath);
  assert.equal(
    plan.status,
    "r2_a_experience_projection_implementation_authorized_r2_b_r2_c_unauthorized",
  );
  assert.deepEqual(plan.package_order, parent.package_order);
  assert.deepEqual(plan.path_overlap_policy, parent.path_overlap_policy);
  assert.deepEqual(plan.r2_owned_scope, parent.r2_owned_scope);
  assert.deepEqual(plan.existing_package_c_boundary, parent.existing_package_c_boundary);
  assert.deepEqual(plan.global_q0_completion_boundary, parent.global_q0_completion_boundary);
  for (let index = 0; index < plan.packages.length; index += 1) {
    for (const immutableKey of [
      "package_id",
      "name",
      "purpose",
      "proposed_branch",
      "proposed_paths",
      "tests",
      "provider_calls_required",
      "human_visual_review_required",
    ]) {
      assert.deepEqual(
        plan.packages[index][immutableKey],
        parent.packages[index][immutableKey],
        `${plan.packages[index].package_id}.${immutableKey}`,
      );
    }
  }
  const r2A = plan.packages.find((item) => item.package_id === "R2-A");
  const r2B = plan.packages.find((item) => item.package_id === "R2-B");
  const r2C = plan.packages.find((item) => item.package_id === "R2-C");
  assert.ok(r2A && r2B && r2C);
  assert.equal(r2A.authorization_status, "implementation_authorized");
  assert.equal(r2A.implementation_authorized, true);
  assert.deepEqual(r2A.authorization_contract, {
    deterministic_CustomerAssessmentExperienceProjectionV2: true,
    full_structured_report_unchanged: true,
    CustomerAssessmentProjectionV1_unchanged: true,
    legacy_split_exact_source_mapping: true,
    fact_ids_internal_enums_removed_from_customer_projection: true,
    provider_calls: 0,
    paraphrase: 0,
    factual_rewrite: 0,
    generated_filler: 0,
    ui_design_changes: 0,
  });
  assert.deepEqual(r2A.unauthorized_scope, expectedR2AUnauthorizedScope);
  assert.equal(r2B.authorization_status, "implementation_unauthorized");
  assert.equal(r2B.implementation_authorized, false);
  assert.equal(r2C.readiness, "not_ready");
  assert.equal(r2C.execution_status, "unauthorized");
  assert.equal(r2C.review_status, "unauthorized");
  assert.equal(r2C.implementation_authorized, false);
  assert.deepEqual(r2C.required_review_checks, parent.packages[2].required_review_checks);
  assert.equal(r2C.completion_without_reduced_motion_allowed, false);
});

await check("acceptance capability and global boundaries are exact", () => {
  const capabilities = readJson(capabilitiesPath);
  const parent = readParentJson(capabilitiesPath);
  assert.equal(capabilities.status, expectedStatus);
  for (const [key, expected] of Object.entries({
    acceptance_branch: expectedBranch,
    acceptance_parent: acceptanceParent,
    doctrineHumanChatGPTReview: "complete",
    doctrineHumanChatGPTReviewOutcome: "PASS",
    humanAcceptance: "complete",
    doctrineAcceptance: "complete",
    acceptanceDate: "2026-08-16",
  })) {
    assert.equal(capabilities[key], expected, key);
  }
  assert.deepEqual(capabilities.r2Authorizations, {
    "R2-A": "implementation_authorized",
    "R2-B": "implementation_unauthorized",
    "R2-C": "not_ready_unauthorized",
  });
  assert.equal(
    capabilities.implementation_authorized_scope,
    "R2-A_Experience_Projection_successor_only",
  );
  assert.equal(capabilities.implementation_authorized, false);
  assert.equal(capabilities.r2_a_implementation_authorized, true);
  assert.equal(capabilities.r2_b_implementation_authorized, false);
  assert.equal(capabilities.r2_c_execution_authorized, false);
  assert.equal(capabilities.r2_c_review_authorized, false);
  assert.equal(
    capabilities.experienceProductJudgment,
    "not_established_pending_R2_C_human_product_review",
  );
  assert.equal(capabilities.jpy980RuntimeReadiness, "not_established");
  assert.equal(capabilities.globalQ0Completion, false);
  assert.equal(capabilities.providerQualityEstablished, false);
  assert.equal(capabilities.providerRerunAuthorized, false);
  assert.equal(capabilities.activeRuntimeActivationAuthorized, false);
  assert.equal(capabilities.productionRuntimeAuthorized, false);
  assert.equal(capabilities.paymentImplementationAuthorized, false);
  assert.equal(capabilities.productionPaymentAuthorized, false);
  assert.equal(capabilities.r4_authorized, false);
  assert.equal(capabilities.c2_authorized, false);
  assert.equal(capabilities.pullRequestAuthorized, false);
  assert.equal(capabilities.mainIntegrationAuthorized, false);
  assert.deepEqual(capabilities.operations, parent.operations);
  assert.equal(capabilities.operations.provider_calls, 0);
  assert.equal(capabilities.operations.db_operations, 0);
  assert.equal(capabilities.operations.supabase_operations, 0);
  assert.equal(capabilities.operations.projection_changes, false);
  assert.equal(capabilities.operations.runtime_changes, false);
  assert.equal(capabilities.operations.payment_implementation, false);
});

await check("review and rolling authorities contain no stale pending state", () => {
  const required = [
    expectedStatus,
    "doctrineHumanChatGPTReview",
    "doctrineHumanChatGPTReviewOutcome",
    "humanAcceptance",
    "doctrineAcceptance",
    "2026-08-16",
    "R2-A",
    "implementation_authorized",
    "R2-B",
    "implementation_unauthorized",
    "R2-C",
    "not_ready",
    "reduced-motion",
    "guidance_only",
    "not_established_pending_R2_C_human_product_review",
    "globalQ0Completion = false",
  ];
  const reviewText = readText(reviewDocumentPath);
  for (const value of required) assert.ok(reviewText.includes(value), value);
  const obsoleteStatus =
    "reassuring_assessment_experience_doctrine_r1_correction_ready_pending_human_chatgpt_review";
  assert.equal(reviewText.includes(obsoleteStatus), false);
  for (const candidate of rollingDocumentPaths) {
    const block = markedBlock(readText(candidate), taskId);
    assert.equal(block.includes(expectedStatus), true, candidate);
    assert.equal(block.includes(acceptanceParent), true, candidate);
    assert.equal(block.includes(obsoleteStatus), false, candidate);
    assert.equal(block.includes("Provider / DB / Supabase"), true, candidate);
    assert.equal(block.includes("main"), true, candidate);
  }
});

await check("protected Product Runtime Provider DB Payment surfaces unchanged", () => {
  const changed = new Set(
    git(["diff", "--name-only", acceptanceParent, "--"])
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((candidate) => candidate.replaceAll("\\", "/")),
  );
  for (const prefix of [
    "app/",
    "components/",
    "lib/",
    "ai/",
    "supabase/",
    "fixtures/",
  ]) {
    assert.equal(
      [...changed].some((candidate) => candidate.startsWith(prefix)),
      false,
      prefix,
    );
  }
  for (const candidate of [
    `${packageRoot}/experience-section-architecture-v1.json`,
    `${packageRoot}/experience-projection-gap-v1.json`,
    `${packageRoot}/human-visual-review-v1.json`,
    r1DoctrineVerifierPath,
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "package.json",
  ]) {
    assert.equal(
      git(["hash-object", candidate]),
      git(["rev-parse", `${acceptanceParent}:${candidate}`]),
      candidate,
    );
  }
});

await check("Provider rerun Runtime Payment PR main remain unauthorized", () => {
  const doctrine = readJson(productDoctrinePath);
  const plan = readJson(implementationPackagesPath);
  const boundary = doctrine.authority_boundary;
  assert.equal(boundary.provider_rerun_authorized, false);
  assert.equal(boundary.runtime_activation_authorized, false);
  assert.equal(boundary.production_runtime_authorized, false);
  assert.equal(boundary.payment_implementation_authorized, false);
  assert.equal(boundary.production_payment_authorized, false);
  assert.equal(boundary.main_integration_authorized, false);
  assert.equal(plan.global_acceptance_boundary.provider_rerun_authorized, false);
  assert.equal(
    plan.global_acceptance_boundary.active_runtime_activation_authorized,
    false,
  );
  assert.equal(plan.global_acceptance_boundary.production_runtime_authorized, false);
  assert.equal(plan.global_acceptance_boundary.payment_implementation_authorized, false);
  assert.equal(plan.global_acceptance_boundary.production_payment_authorized, false);
  assert.equal(plan.global_acceptance_boundary.r4_authorized, false);
  assert.equal(plan.global_acceptance_boundary.c2_authorized, false);
  assert.equal(plan.global_acceptance_boundary.main_integration_authorized, false);
});

await check("git diff --check PASS", () => {
  git(["diff", "--check", acceptanceParent, "--"]);
});

const failed = checks.filter((result) => !result.passed);
console.log(
  `Doctrine acceptance verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${
    checks.length - failed.length
  }/${checks.length}`,
);
console.log("Exact acceptance scope: 8 UPDATE + 1 NEW");
console.log(`R1 doctrine verifier: ${r1DoctrineVerifierSummary}`);
console.log(`Package B verifier: ${packageBVerifierSummary}`);
console.log(`Package A R1 verifier: ${packageAR1VerifierSummary}`);
console.log("Provider / DB / Supabase / Runtime / Payment changes: 0 / 0 / 0 / 0 / 0");
console.log("Sensitive values: 0");
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((item) => item.name).join("; ")}`);
  process.exitCode = 1;
}
