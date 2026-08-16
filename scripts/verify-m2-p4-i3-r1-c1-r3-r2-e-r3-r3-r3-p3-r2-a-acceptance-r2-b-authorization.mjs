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
const acceptanceParent = "5070c02267f49e1e0095ce2e46fb106b886f7df5";
const q0AcceptanceCommit = "cf9a04773fca622c4813e1e6e73a7632b139aff6";
const q0CorrectionCommit = "6196ab58d8d93a650d050a0fa6e1e7d4c2b44bc2";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedStatus =
  "r2_a_human_chatgpt_accepted_complete_r2_b_implementation_authorized";
const expectedBranch =
  "chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-acceptance-r2-b-authorization";
const r2AImplementationBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-r1-authorized-experience-projection";
const r2BAuthorizedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r2-authorized-reassuring-note";
const q0AcceptanceBranch =
  "chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-doctrine-acceptance";
const q0CorrectionBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-reassurance-doctrine-correction";
const historicalR2ACandidateBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection";
const historicalR2ACandidate = "da325d9b4d8404879a08c1b50107e7f7df8787ec";
const historicalR2BBranches = [
  {
    branch:
      "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note",
    commit: "e509405935e82d7079023609b2d852d51f286f3e",
  },
  {
    branch:
      "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r1-mobile-copy",
    commit: "1e6e719a8bdd766617405ec40691ff498f1bbc2a",
  },
];

const p3Root =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1";
const r2ARoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a";
const implementationPackagesPath = `${p3Root}/implementation-packages-v1.json`;
const doctrineCapabilitiesPath = `${p3Root}/capabilities-v1.json`;
const doctrineReviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R1_REVIEW.md";
const r2ACapabilitiesPath = `${r2ARoot}/capabilities-v1.json`;
const r2AReviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_A_REVIEW.md";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-acceptance-r2-b-authorization.mjs";
const r2AVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection.mjs";
const decisionPolicyVerifierPath =
  "evals/quality/m2-p4-i1/verify-decision-policy.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";

const rollingDocumentPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
];
const updatedPaths = [
  ...rollingDocumentPaths,
  doctrineReviewPath,
  implementationPackagesPath,
  doctrineCapabilitiesPath,
  r2AReviewPath,
  r2ACapabilitiesPath,
];
const exactScope = [...updatedPaths, verifierPath];

const r2AImplementationScope = [
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  `${r2ARoot}/projection-contract-v1.json`,
  `${r2ARoot}/projection-fixtures-v1.json`,
  `${r2ARoot}/offline-results-v1.json`,
  r2ACapabilitiesPath,
  r2AVerifierPath,
  r2AReviewPath,
];
const r2ANonOverlayPaths = [
  r2AImplementationScope[0],
  r2AImplementationScope[1],
  r2AImplementationScope[2],
  r2AImplementationScope[3],
  r2AImplementationScope[5],
];
const r2BAuthorizedPaths = [
  "components/runtime/CustomerAssessmentNote.tsx",
  "components/runtime/CustomerAssessmentNote.module.css",
  "components/runtime/CustomerDraftCopyButton.tsx",
  "app/review/runtime/v12/page.tsx",
  "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/presentation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_B_REVIEW.md",
];
const expectedR2BUnauthorizedScope = [
  "CustomerAssessmentExperienceProjectionV2_changes",
  "CustomerAssessmentProjectionV1_changes",
  "full_report_changes",
  "provider_calls",
  "prompt_catalog_or_schema_changes",
  "pb_05_changes",
  "evaluator_or_semantic_disposition_changes",
  "safety_ux_changes",
  "payment_changes",
  "db_supabase_or_migration_changes",
  "runtime_activation",
  "production_runtime",
  "r2_c_execution",
  "main_changes",
];
const expectedR2BAuthorizationContract = {
  accepted_CustomerAssessmentExperienceProjectionV2_consumed: true,
  accepted_navy_paper_gold_visual_shell_preserved: true,
  hero_dominance_reduced: true,
  consultation_specific_opening_letter_situation_reading: true,
  facts_and_uncertainty_separated: true,
  draft_prominent_when_needed: true,
  exact_copy_interaction_preserved: true,
  immediate_action_clear: true,
  reassessment_condition_visible: true,
  consultation_specific_closing: true,
  sections_selected_by_semantic_necessity: true,
  simple_case_below_six_allowed_when_semantically_complete: true,
  section_count_padding: "prohibited",
  semantic_repetition_reduced: true,
};

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options },
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

function assertParentBlobUnchanged(relativePath) {
  assert.equal(
    git(["hash-object", relativePath]),
    git(["rev-parse", `${acceptanceParent}:${relativePath}`]),
    relativePath,
  );
}

let r2AVerifierSummary = "not_run";
let q0AcceptanceVerifierSummary = "not_run";
let r1DoctrineVerifierSummary = "not_run";
let packageBVerifierSummary = "not_run";
let packageAR1VerifierSummary = "not_run";
let decisionPolicyVerifierSummary = "not_run";

function runR2AVerifierAtAcceptedImplementation() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-r2-a-accepted-"),
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
      ["-c", safeDirectory, "config", "core.autocrlf", "false"],
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
        r2AImplementationBranch,
        acceptanceParent,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const refs = [
      [`refs/remotes/origin/${r2AImplementationBranch}`, acceptanceParent],
      [`refs/heads/${q0AcceptanceBranch}`, q0AcceptanceCommit],
      [`refs/remotes/origin/${q0AcceptanceBranch}`, q0AcceptanceCommit],
      [`refs/heads/${q0CorrectionBranch}`, q0CorrectionCommit],
      [`refs/remotes/origin/${q0CorrectionBranch}`, q0CorrectionCommit],
      [`refs/heads/${historicalR2ACandidateBranch}`, historicalR2ACandidate],
      [
        `refs/remotes/origin/${historicalR2ACandidateBranch}`,
        historicalR2ACandidate,
      ],
      ["refs/heads/main", expectedMain],
      ["refs/remotes/origin/main", expectedMain],
    ];
    for (const [refName, revision] of refs) {
      execFileSync(
        "git.exe",
        ["-c", safeDirectory, "update-ref", refName, revision],
        { cwd: cloneRoot, stdio: "pipe" },
      );
    }

    const sourceContract = readJson(p1SourceContractPath);
    const markerName = path.basename(sourceContract.frozen_state.marker_path);
    const markerSource = path.join(root, ".git", markerName);
    assert.equal(existsSync(markerSource), true, markerName);
    copyFileSync(markerSource, path.join(cloneRoot, ".git", markerName));
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "true"],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const output = execFileSync(
      process.execPath,
      [path.join(cloneRoot, r2AVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 128 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.match(output, /Experience projection verifier: PASS 35\/35/u);
    assert.match(output, /Q0-A acceptance verifier: PASS 12\/12/u);
    assert.match(output, /R1 Doctrine verifier: PASS 19\/19/u);
    assert.match(output, /Package B accepted verifier: PASS 20\/20 exact 10\/10/u);
    assert.match(output, /Package A R1 accepted verifier: PASS 23\/23/u);
    r2AVerifierSummary = "PASS 35/35";
    q0AcceptanceVerifierSummary = "PASS 12/12";
    r1DoctrineVerifierSummary = "PASS 19/19";
    packageBVerifierSummary = "PASS 20/20 exact 10/10";
    packageAR1VerifierSummary = "PASS 23/23";
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function runDecisionPolicyVerifier() {
  const output = execFileSync(
    process.execPath,
    [path.join(root, decisionPolicyVerifierPath)],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  assert.match(output, /M2_P4_I1_TYPED_POLICY: PASS/u);
  assert.match(output, /total: 40\/40/u);
  assert.match(output, /openai_calls: 0/u);
  assert.match(output, /db_operations: 0/u);
  decisionPolicyVerifierSummary = "PASS 40/40";
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

await check("exact parent branch and main authority", () => {
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
  assert.equal(git(["rev-parse", r2AImplementationBranch]), acceptanceParent);
  assert.equal(
    git(["rev-parse", `origin/${r2AImplementationBranch}`]),
    acceptanceParent,
  );
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact sync scope is 8 UPDATE plus 1 NEW", () => {
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
    assert.equal(trackedPaths.has(candidate), true, candidate);
  }
  assert.equal(gitObjectExists(`${acceptanceParent}:${verifierPath}`), false);
  assert.equal(trackedPaths.has(verifierPath) || untracked.includes(verifierPath), true);
});

await check("strict UTF-8 JSON and sensitive-value boundary", () => {
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
    implementationPackagesPath,
    doctrineCapabilitiesPath,
    r2ACapabilitiesPath,
  ].forEach(readJson);
});

await check("R2-A Q0-A R1 Doctrine Package B and Package A verifiers pass", () => {
  runR2AVerifierAtAcceptedImplementation();
});

await check("Decision Policy verifier remains PASS 40/40", () => {
  runDecisionPolicyVerifier();
});

await check("R2-A seven-file implementation snapshot is preserved", () => {
  const implementationCommitEntries = git([
    "diff-tree",
    "--no-commit-id",
    "--name-status",
    "-r",
    acceptanceParent,
  ])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.split("\t"));
  assert.equal(r2AImplementationScope.length, 7);
  assert.deepEqual(
    sorted(implementationCommitEntries.flatMap((entry) => entry.slice(1))),
    sorted(r2AImplementationScope),
  );
  assert.ok(implementationCommitEntries.every(([status]) => status === "A"));
  assert.equal(r2ANonOverlayPaths.length, 5);
  r2ANonOverlayPaths.forEach(assertParentBlobUnchanged);

  const review = readText(r2AReviewPath);
  const parentReview = git(["show", `${acceptanceParent}:${r2AReviewPath}`]);
  assert.equal(
    markdownSection(
      review,
      "## Historical candidate reuse",
      "## Authorization boundary",
    ),
    markdownSection(
      parentReview,
      "## Historical candidate reuse",
      "## Authorization boundary",
    ),
  );

  const capabilities = readJson(r2ACapabilitiesPath);
  const parentCapabilities = readParentJson(r2ACapabilitiesPath);
  for (const immutableKey of [
    "schema_version",
    "task_id",
    "branch",
    "baseline",
    "accepted_authority",
    "historical_reference",
    "product_doctrine_accepted",
    "package_a_accepted",
    "package_b_visual_shell_accepted",
    "r2_a_architecture_accepted",
    "historical_candidate_identifier_exclusion_gap_found",
    "current_identifier_exclusion_hardened",
    "customer_assessment_projection_v1_unchanged",
    "experience_projection_v2_complete",
    "experience_fields_exact_source_only",
    "japanese_adjacent_fact_ids_rejected",
    "japanese_adjacent_decision_enums_rejected",
    "base_projection_customer_text_covered",
    "structural_enum_values_remain_allowed",
    "projection_validated_before_return",
    "full_report_unchanged",
    "v1_parity_preserved",
    "provider_calls",
    "db_operations",
    "supabase_operations",
  ]) {
    assert.deepEqual(capabilities[immutableKey], parentCapabilities[immutableKey], immutableKey);
  }
});

await check("R2-A acceptance decision and R2-B authorization are exact", () => {
  const capabilities = readJson(r2ACapabilitiesPath);
  assert.equal(capabilities.status, expectedStatus);
  assert.equal(capabilities.accepted_implementation_commit, acceptanceParent);
  assert.deepEqual(capabilities.implementation_snapshot, {
    type: "historical_commit_range",
    base_commit_sha: q0AcceptanceCommit,
    end_commit_sha: acceptanceParent,
    exact_paths: 7,
    immutable_snapshot: true,
    include_working_tree: false,
  });
  assert.deepEqual(capabilities.acceptance_sync, {
    branch: expectedBranch,
    parent: acceptanceParent,
    updated_paths: 8,
    new_paths: 1,
    deleted_paths: 0,
    renamed_paths: 0,
  });
  assert.deepEqual(capabilities.acceptance, {
    r2_a_chatgpt_review: "complete",
    r2_a_chatgpt_review_outcome: "PASS",
    r2_a_human_review: "complete",
    r2_a_human_review_outcome: "PASS",
    r2_a_human_acceptance: "complete",
    r2_a_acceptance: "complete",
    acceptance_date: "2026-08-16",
  });
  assert.equal(capabilities.r2_a_implementation_complete, true);
  assert.equal(capabilities.r2_a_implementation_accepted, true);
  assert.equal(capabilities.r2_a_original_implementation_authority_exercised, true);
  assert.equal(capabilities.r2_a_new_implementation_authorized, false);
  assert.equal(capabilities.r2_a_seven_file_implementation_preserved, true);
  assert.equal(capabilities.r2_a_non_overlay_blobs_unchanged, "5/5");
  assert.equal(capabilities.r2_a_acceptance_overlay_paths, "2/2");
  assert.equal(capabilities.r2_b_implementation_authorized, true);
  assert.equal(capabilities.r2_b_authorized_branch, r2BAuthorizedBranch);
  assert.equal(capabilities.r2_b_authorized_path_count, 9);
  assert.equal(capabilities.r2_c_execution_authorized, false);
  assert.equal(capabilities.r2_c_review_authorized, false);
  assert.equal(capabilities.r2_c_readiness, "not_ready_until_R2_B_acceptance");
  assert.equal(
    capabilities.experienceProductJudgment,
    "not_established_pending_R2_C_human_product_review",
  );
  assert.equal(capabilities.jpy980RuntimeReadiness, "not_established");
  assert.equal(capabilities.globalQ0Completion, false);
  assert.equal(capabilities.providerQualityEstablished, false);

  const review = readText(r2AReviewPath);
  for (const required of [
    acceptanceParent,
    expectedBranch,
    "r2AChatGPTReview = complete",
    "r2AChatGPTReviewOutcome = PASS",
    "r2AHumanReview = complete",
    "r2AHumanReviewOutcome = PASS",
    "r2AHumanAcceptance = complete",
    "r2AAcceptance = complete",
    "2026-08-16",
    r2BAuthorizedBranch,
    "not_ready_until_R2_B_acceptance",
  ]) {
    assert.ok(review.includes(required), required);
  }
});

await check("doctrine capability overlay records only R2-B authority", () => {
  const capabilities = readJson(doctrineCapabilitiesPath);
  const parent = readParentJson(doctrineCapabilitiesPath);
  assert.equal(capabilities.status, expectedStatus);
  assert.deepEqual(capabilities.r2AAcceptanceSync, {
    branch: expectedBranch,
    parent: acceptanceParent,
    acceptedImplementationCommit: acceptanceParent,
    updatedPaths: 8,
    newPaths: 1,
    deletedPaths: 0,
    renamedPaths: 0,
    r2AChatGPTReview: "complete",
    r2AChatGPTReviewOutcome: "PASS",
    r2AHumanReview: "complete",
    r2AHumanReviewOutcome: "PASS",
    r2AHumanAcceptance: "complete",
    r2AAcceptance: "complete",
    acceptanceDate: "2026-08-16",
  });
  assert.deepEqual(capabilities.r2Authorizations, {
    "R2-A": "implementation_complete_accepted",
    "R2-B": "implementation_authorized",
    "R2-C": "not_ready_until_R2_B_acceptance_unauthorized",
  });
  assert.equal(
    capabilities.implementation_authorized_scope,
    "R2-B_Reassuring_Customer_Note_only",
  );
  assert.equal(capabilities.unscoped_implementation_authorized, false);
  assert.equal(capabilities.r2_a_original_implementation_authority_exercised, true);
  assert.equal(capabilities.r2_a_new_implementation_authorized, false);
  assert.equal(capabilities.r2_a_implementation_complete, true);
  assert.equal(capabilities.r2_a_chatgpt_review_complete_pass, true);
  assert.equal(capabilities.r2_a_human_review_complete_pass, true);
  assert.equal(capabilities.r2_a_human_acceptance_complete, true);
  assert.equal(capabilities.r2_a_acceptance_complete, true);
  assert.equal(capabilities.r2_b_implementation_authorized, true);
  assert.equal(capabilities.r2_c_execution_authorized, false);
  assert.equal(capabilities.r2_c_review_authorized, false);
  assert.equal(capabilities.r2_c_readiness, "not_ready_until_R2_B_acceptance");
  assert.equal(capabilities.globalQ0Completion, false);
  assert.equal(capabilities.providerQualityEstablished, false);
  assert.equal(capabilities.providerRerunAuthorized, false);
  assert.equal(capabilities.activeRuntimeActivationAuthorized, false);
  assert.equal(capabilities.productionRuntimeAuthorized, false);
  assert.equal(capabilities.paymentImplementationAuthorized, false);
  assert.equal(capabilities.productionPaymentAuthorized, false);
  assert.equal(capabilities.mainIntegrationAuthorized, false);
  assert.deepEqual(capabilities.operations, parent.operations);
  for (const immutableKey of [
    "baseline",
    "correction_branch",
    "correction_baseline",
    "correction_scope",
    "acceptance_branch",
    "acceptance_parent",
    "doctrineHumanChatGPTReview",
    "doctrineHumanChatGPTReviewOutcome",
    "humanAcceptance",
    "doctrineAcceptance",
    "acceptanceDate",
    "section_count_guidance_only",
    "simple_case_below_six_allowed_when_semantically_complete",
    "padding_for_section_count",
  ]) {
    assert.deepEqual(capabilities[immutableKey], parent[immutableKey], immutableKey);
  }
});

await check("implementation packages preserve R2-A and authorize exact R2-B", () => {
  const plan = readJson(implementationPackagesPath);
  const parent = readParentJson(implementationPackagesPath);
  assert.equal(
    plan.status,
    "r2_a_human_chatgpt_accepted_complete_r2_b_implementation_authorized_r2_c_unauthorized",
  );
  assert.deepEqual(plan.package_order, parent.package_order);
  assert.deepEqual(plan.path_overlap_policy, parent.path_overlap_policy);
  assert.equal(plan.r2_owned_scope, parent.r2_owned_scope);
  assert.deepEqual(plan.existing_package_c_boundary, parent.existing_package_c_boundary);
  assert.deepEqual(plan.global_q0_completion_boundary, parent.global_q0_completion_boundary);

  const r2A = plan.packages.find((item) => item.package_id === "R2-A");
  const parentR2A = parent.packages.find((item) => item.package_id === "R2-A");
  const r2B = plan.packages.find((item) => item.package_id === "R2-B");
  const parentR2B = parent.packages.find((item) => item.package_id === "R2-B");
  const r2C = plan.packages.find((item) => item.package_id === "R2-C");
  assert.ok(r2A && parentR2A && r2B && parentR2B && r2C);
  for (const immutableKey of [
    "package_id",
    "name",
    "purpose",
    "proposed_paths",
    "tests",
    "authorization_contract",
    "unauthorized_scope",
    "provider_calls_required",
    "human_visual_review_required",
  ]) {
    assert.deepEqual(r2A[immutableKey], parentR2A[immutableKey], `R2-A.${immutableKey}`);
  }
  assert.equal(r2A.proposed_branch, r2AImplementationBranch);
  assert.deepEqual(r2A.implementation_snapshot, {
    type: "historical_commit_range",
    base_commit_sha: q0AcceptanceCommit,
    end_commit_sha: acceptanceParent,
    exact_paths: 7,
    immutable_snapshot: true,
    include_working_tree: false,
  });
  assert.equal(r2A.implementation_status, "complete");
  assert.deepEqual(r2A.chatgpt_review, { status: "complete", outcome: "PASS" });
  assert.deepEqual(r2A.human_review, { status: "complete", outcome: "PASS" });
  assert.equal(r2A.human_acceptance, "complete");
  assert.equal(r2A.acceptance, "complete");
  assert.equal(r2A.acceptance_date, "2026-08-16");
  assert.equal(r2A.authorization_status, "implementation_complete_accepted");
  assert.equal(r2A.original_implementation_authority_exercised, true);
  assert.equal(r2A.new_implementation_authorized, false);

  for (const immutableKey of [
    "package_id",
    "name",
    "purpose",
    "proposed_paths",
    "tests",
    "provider_calls_required",
    "human_visual_review_required",
  ]) {
    assert.deepEqual(r2B[immutableKey], parentR2B[immutableKey], `R2-B.${immutableKey}`);
  }
  assert.equal(r2B.proposed_branch, r2BAuthorizedBranch);
  assert.deepEqual(r2B.proposed_paths, r2BAuthorizedPaths);
  assert.deepEqual(
    r2B.historical_read_only_references,
    historicalR2BBranches.map((item) => ({ ...item, read_only: true })),
  );
  assert.deepEqual(r2B.authorization_contract, expectedR2BAuthorizationContract);
  assert.deepEqual(r2B.unauthorized_scope, expectedR2BUnauthorizedScope);
  assert.equal(r2B.authorization_status, "implementation_authorized");
  assert.equal(r2B.implementation_authorized, true);

  assert.equal(r2C.readiness, "not_ready_until_R2_B_acceptance");
  assert.equal(r2C.execution_status, "unauthorized");
  assert.equal(r2C.review_status, "unauthorized");
  assert.equal(r2C.implementation_authorized, false);
  assert.equal(
    plan.global_acceptance_boundary.unscoped_implementation_authorized,
    false,
  );
  assert.equal(
    plan.global_acceptance_boundary.implementation_authorized_scope,
    "R2-B_Reassuring_Customer_Note_only",
  );
  assert.equal(plan.global_acceptance_boundary.r2_a_implementation_complete, true);
  assert.equal(plan.global_acceptance_boundary.r2_a_acceptance_complete, true);
  assert.equal(
    plan.global_acceptance_boundary.r2_a_original_implementation_authority_exercised,
    true,
  );
  assert.equal(
    plan.global_acceptance_boundary.r2_a_new_implementation_authorized,
    false,
  );
  assert.equal(plan.global_acceptance_boundary.r2_b_implementation_authorized, true);
  assert.equal(plan.global_acceptance_boundary.r2_c_execution_authorized, false);
  assert.equal(plan.global_acceptance_boundary.r2_c_review_authorized, false);
  assert.equal(
    plan.global_acceptance_boundary.r2_c_readiness,
    "not_ready_until_R2_B_acceptance",
  );
  assert.equal(plan.global_acceptance_boundary.globalQ0Completion, false);
  assert.equal(plan.global_acceptance_boundary.providerQualityEstablished, false);
});

await check("R2-B implementation and all protected surfaces remain unchanged", () => {
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
  for (const candidate of r2BAuthorizedPaths) {
    assert.equal(changed.has(candidate), false, candidate);
    if (gitObjectExists(`${acceptanceParent}:${candidate}`)) {
      assertParentBlobUnchanged(candidate);
    } else {
      assert.equal(existsSync(path.join(root, candidate)), false, candidate);
    }
  }
  for (const candidate of [
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/types.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "app/api/internal/assessments/route.ts",
    "components/runtime/RuntimeAssessmentForm.tsx",
    decisionPolicyVerifierPath,
  ]) {
    assertParentBlobUnchanged(candidate);
  }
});

await check("historical R2-B branches remain exact read-only references", () => {
  for (const { branch, commit } of historicalR2BBranches) {
    assert.equal(git(["rev-parse", branch]), commit, branch);
    assert.equal(git(["rev-parse", `origin/${branch}`]), commit, `origin/${branch}`);
  }
});

await check("rolling documents and review authority contain no stale state", () => {
  const review = readText(doctrineReviewPath);
  for (const required of [
    expectedStatus,
    acceptanceParent,
    expectedBranch,
    "r2AChatGPTReview = complete",
    "r2AHumanReview = complete",
    "R2-B implementation_authorized=true",
    r2BAuthorizedBranch,
    "not_ready_until_R2_B_acceptance",
    "globalQ0Completion = false",
  ]) {
    assert.ok(review.includes(required), required);
  }
  for (const candidate of rollingDocumentPaths) {
    const block = markedBlock(readText(candidate), "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R1");
    assert.ok(block.includes(expectedStatus), candidate);
    assert.ok(block.includes(acceptanceParent), candidate);
    assert.ok(block.includes(expectedBranch), candidate);
    assert.ok(block.includes(r2BAuthorizedBranch), candidate);
    assert.ok(block.includes("not_ready_until_R2_B_acceptance"), candidate);
    assert.ok(block.includes("globalQ0Completion=false"), candidate);
    assert.equal(
      block.includes("human_chatgpt_review_of_doctrine_acceptance_and_r2_a_authorization_sync"),
      false,
      candidate,
    );
  }
});

await check("Provider DB Supabase Runtime Payment and global boundaries stay closed", () => {
  const doctrineCapabilities = readJson(doctrineCapabilitiesPath);
  const r2ACapabilities = readJson(r2ACapabilitiesPath);
  const plan = readJson(implementationPackagesPath);
  const boundary = plan.global_acceptance_boundary;
  assert.equal(doctrineCapabilities.operations.provider_calls, 0);
  assert.equal(doctrineCapabilities.operations.db_operations, 0);
  assert.equal(doctrineCapabilities.operations.supabase_operations, 0);
  assert.equal(doctrineCapabilities.operations.runtime_changes, false);
  assert.equal(doctrineCapabilities.operations.payment_implementation, false);
  assert.equal(r2ACapabilities.provider_calls, 0);
  assert.equal(r2ACapabilities.db_operations, 0);
  assert.equal(r2ACapabilities.supabase_operations, 0);
  assert.equal(boundary.provider_rerun_authorized, false);
  assert.equal(boundary.active_runtime_activation_authorized, false);
  assert.equal(boundary.production_runtime_established, false);
  assert.equal(boundary.production_runtime_authorized, false);
  assert.equal(boundary.payment_implementation_authorized, false);
  assert.equal(boundary.production_payment_authorized, false);
  assert.equal(boundary.provider_quality_established, false);
  assert.equal(boundary.globalQ0Completion, false);
  assert.equal(boundary.r4_authorized, false);
  assert.equal(boundary.c2_authorized, false);
  assert.equal(boundary.main_integration_authorized, false);
});

await check("git diff --check PASS", () => {
  git(["diff", "--check", acceptanceParent, "--"]);
  exactScope.forEach((candidate) => {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  });
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  `R2-A acceptance / R2-B authorization verifier: ${
    failed.length === 0 ? "PASS" : "FAIL"
  } ${checks.length - failed.length}/${checks.length}`,
);
console.log("Exact acceptance scope: 8 UPDATE + 1 NEW");
console.log("R2-A implementation snapshot: 5/5 blobs unchanged + 2/2 metadata overlays exact");
console.log(`R2-A dedicated verifier: ${r2AVerifierSummary}`);
console.log(`Q0-A acceptance verifier: ${q0AcceptanceVerifierSummary}`);
console.log(`R1 Doctrine verifier: ${r1DoctrineVerifierSummary}`);
console.log(`Package B historical accepted verifier: ${packageBVerifierSummary}`);
console.log(`Package A R1 accepted verifier: ${packageAR1VerifierSummary}`);
console.log(`Decision Policy verifier: ${decisionPolicyVerifierSummary}`);
console.log("R2-B implementation changes: 0");
console.log("Provider / DB / Supabase / Runtime / Payment changes: 0 / 0 / 0 / 0 / 0");
console.log("Sensitive values: 0");
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((item) => item.name).join("; ")}`);
  process.exitCode = 1;
}
