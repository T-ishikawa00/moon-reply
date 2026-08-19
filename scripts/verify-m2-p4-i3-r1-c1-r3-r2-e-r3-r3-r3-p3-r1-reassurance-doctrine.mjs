import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R1";
const originalProductBaseline = "fdbdf808f135655084de32aec2e57473c1beaf31";
const correctionBaseline = "a5b2defa1bb765d46076a28ca9827d494fcbe433";
const expectedParent = "8700ded1454058f72d33f2eb4d1ae6a05b6e008c";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-reassurance-doctrine-correction";
const doctrineSourceBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-reassurance-experience";
const packageBBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-customer-note";
const packageAR1Branch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-r1-schema-parity";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1";

const productDoctrinePath = `${packageRoot}/product-doctrine-v1.json`;
const productDoctrineMarkdownPath = `${packageRoot}/product-doctrine-v1.md`;
const visualReviewPath = `${packageRoot}/human-visual-review-v1.json`;
const projectionGapPath = `${packageRoot}/experience-projection-gap-v1.json`;
const sectionArchitecturePath = `${packageRoot}/experience-section-architecture-v1.json`;
const implementationPackagesPath = `${packageRoot}/implementation-packages-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-reassurance-doctrine.mjs";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R1_REVIEW.md";
const rollingDocumentPaths = [
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const exactCorrectionScope = [
  reviewDocumentPath,
  productDoctrineMarkdownPath,
  productDoctrinePath,
  sectionArchitecturePath,
  implementationPackagesPath,
  capabilitiesPath,
  verifierPath,
  ...rollingDocumentPaths,
];
const packageBScope = [
  "app/review/runtime/v12/page.tsx",
  "components/runtime/CustomerAssessmentNote.module.css",
  "components/runtime/CustomerAssessmentNote.tsx",
  "components/runtime/CustomerDraftCopyButton.tsx",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3/presentation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3/visual-review-cases-v1.json",
  "lib/assessment/runtime/review/m2-p4-v12-customer-projection-fixtures.ts",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-customer-note.mjs",
];
const p1PackagesPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/implementation-work-packages-v1.json";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";
const packageAR1VerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-runtime-projection.mjs";
const packageBVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-customer-note.mjs";
const historicalMixedLfLineRanges = {
  "lib/assessment/runtime/types.ts": [
    [1, 4],
    [11, 32],
    [168, 168],
    [196, 229],
    [271, 271],
    [279, 284],
    [318, 318],
    [323, 326],
    [349, 349],
    [356, 369],
    [395, 395],
    [433, 433],
    [457, 555],
    [557, 557],
    [562, 569],
    [581, 581],
    [586, 597],
    [613, 616],
    [622, 624],
    [629, 630],
  ],
  "lib/assessment/runtime/pipeline.ts": [
    [2, 22],
    [36, 40],
    [42, 55],
    [67, 69],
    [74, 75],
    [80, 86],
    [89, 96],
    [107, 107],
    [112, 114],
    [117, 117],
    [120, 125],
    [127, 127],
    [131, 139],
    [190, 190],
    [202, 398],
    [400, 400],
    [403, 404],
    [407, 408],
    [412, 416],
    [423, 452],
    [466, 466],
    [483, 488],
    [550, 1049],
    [1052, 1056],
    [1060, 1083],
    [1097, 1132],
    [1236, 1247],
    [1264, 1273],
    [1297, 1306],
  ],
  "lib/assessment/runtime/schema-catalog.ts": [
    [1, 15],
    [29, 29],
    [33, 34],
    [53, 59],
    [61, 61],
    [158, 158],
    [268, 268],
    [366, 366],
    [425, 425],
    [516, 516],
    [583, 2077],
  ],
  "lib/assessment/runtime/service.ts": [
    [5, 5],
    [14, 15],
  ],
  "lib/assessment/runtime/supabase-repository.ts": [
    [19, 24],
    [48, 49],
    [67, 67],
    [230, 231],
    [290, 290],
    [306, 332],
    [446, 446],
  ],
};

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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function historicalAuthorityBytes(authority) {
  assert.equal(gitObjectExists(authority.git_blob_sha), true, authority.path);
  const canonicalBytes = execFileSync(
    "git.exe",
    [
      "-c",
      "safe.directory=C:/projects/moon-reply",
      "cat-file",
      "blob",
      authority.git_blob_sha,
    ],
    { cwd: root, maxBuffer: 16 * 1024 * 1024 },
  );
  const candidates = [
    canonicalBytes,
    Buffer.from(
      new TextDecoder("utf-8", { fatal: true })
        .decode(canonicalBytes)
        .replaceAll("\n", "\r\n"),
      "utf8",
    ),
  ];
  const directMatch = candidates.find(
    (candidate) =>
      candidate.length === authority.bytes &&
      sha256(candidate) === authority.raw_sha256,
  );
  if (directMatch) return directMatch;

  const ranges = historicalMixedLfLineRanges[authority.path];
  assert.ok(ranges, `missing historical line-ending authority: ${authority.path}`);
  const canonicalText = new TextDecoder("utf-8", { fatal: true }).decode(
    canonicalBytes,
  );
  assert.equal(canonicalText.includes("\r"), false, authority.path);
  let lineNumber = 0;
  const historicalText = canonicalText.replaceAll("\n", () => {
    lineNumber += 1;
    const usesLf = ranges.some(
      ([firstLine, lastLine]) =>
        lineNumber >= firstLine && lineNumber <= lastLine,
    );
    return usesLf ? "\n" : "\r\n";
  });
  const historicalBytes = Buffer.from(historicalText, "utf8");
  assert.equal(historicalBytes.length, authority.bytes, authority.path);
  assert.equal(sha256(historicalBytes), authority.raw_sha256, authority.path);
  return historicalBytes;
}

function writeHistoricalAuthorityIfUnchanged(authority, destinationRoot) {
  const safeDirectory = `safe.directory=${destinationRoot.replaceAll("\\", "/")}`;
  const acceptedBlobSha = execFileSync(
    "git.exe",
    [
      "-c",
      safeDirectory,
      "rev-parse",
      `HEAD:${authority.path}`,
    ],
    { cwd: destinationRoot, encoding: "utf8" },
  ).trim();
  if (acceptedBlobSha !== authority.git_blob_sha) return;
  writeFileSync(
    path.join(destinationRoot, authority.path),
    historicalAuthorityBytes(authority),
  );
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

let packageBVerifierSummary = "not_checked";
let packageAR1VerifierSummary = "not_run";

function runPackageBVerifierAtAcceptedBaseline() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-package-b-p3-"),
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
        packageBBranch,
        originalProductBaseline,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "branch", "-f", "main", expectedMain],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    execFileSync(
      "git.exe",
      [
        "-c",
        safeDirectory,
        "branch",
        "-f",
        packageAR1Branch,
        expectedParent,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const p1Contract = readJson(p1SourceContractPath);
    for (const authority of p1Contract.authority_manifest) {
      writeHistoricalAuthorityIfUnchanged(authority, cloneRoot);
    }
    const markerName = path.basename(p1Contract.frozen_state.marker_path);
    copyFileSync(
      path.join(root, ".git", markerName),
      path.join(cloneRoot, ".git", markerName),
    );

    const output = execFileSync(
      process.execPath,
      [path.join(cloneRoot, packageBVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.match(output, /Customer note verifier: PASS 20\/20/u);
    assert.match(output, /Exact scope: 10\/10/u);
    assert.match(output, /Package A R1 verifier: PASS 23\/23/u);
    packageBVerifierSummary = "PASS 20/20 exact 10/10";
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function runPackageAR1VerifierAtAcceptedBaseline() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-package-a-r1-"),
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
        packageAR1Branch,
        expectedParent,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "branch", "-f", "main", expectedMain],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    const p1Contract = readJson(p1SourceContractPath);
    for (const authority of p1Contract.authority_manifest) {
      writeHistoricalAuthorityIfUnchanged(authority, cloneRoot);
    }
    const markerName = path.basename(p1Contract.frozen_state.marker_path);
    copyFileSync(
      path.join(root, ".git", markerName),
      path.join(cloneRoot, ".git", markerName),
    );

    const output = execFileSync(
      process.execPath,
      [path.join(cloneRoot, packageAR1VerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.match(output, /Runtime projection verifier: PASS 23\/23/u);
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

await check("correction source baseline branch and main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", `${originalProductBaseline}^`]), expectedParent);
  assert.equal(git(["rev-parse", `${correctionBaseline}^`]), originalProductBaseline);
  assert.equal(git(["rev-parse", doctrineSourceBranch]), correctionBaseline);
  assert.equal(git(["rev-parse", `origin/${doctrineSourceBranch}`]), correctionBaseline);
  assert.equal(git(["merge-base", head, correctionBaseline]), correctionBaseline);
  const commitsAfterBaseline = Number(
    git(["rev-list", "--count", `${correctionBaseline}..${head}`]),
  );
  assert.ok(commitsAfterBaseline === 0 || commitsAfterBaseline === 1);
  if (commitsAfterBaseline === 1) {
    assert.equal(git(["rev-parse", `${head}^`]), correctionBaseline);
  }
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact correction scope 10/10 with new delete rename zero", () => {
  const changedEntries = git(["diff", "--name-status", correctionBaseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => line.split("\t"));
  const tracked = changedEntries.map(([, candidate]) =>
    candidate.replaceAll("\\", "/"),
  );
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  assert.equal(exactCorrectionScope.length, 10);
  assert.equal(rollingDocumentPaths.length, 3);
  assert.deepEqual(untracked, []);
  assert.ok(changedEntries.every(([status]) => status === "M"));
  assert.deepEqual(sorted(tracked), sorted(exactCorrectionScope));
  for (const candidate of exactCorrectionScope) {
    assert.equal(existsSync(path.join(root, candidate)), true, candidate);
    assert.equal(gitObjectExists(`${correctionBaseline}:${candidate}`), true, candidate);
  }
});

await check("strict UTF-8 JSON validity U+FFFD zero secret zero", () => {
  const jsonPaths = [
    productDoctrinePath,
    visualReviewPath,
    projectionGapPath,
    sectionArchitecturePath,
    implementationPackagesPath,
    capabilitiesPath,
  ];
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  for (const candidate of exactCorrectionScope) {
    const text = readText(candidate);
    assert.equal(text.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(text, /[\t ]+$/gmu, candidate);
    for (const pattern of secretPatterns) assert.doesNotMatch(text, pattern, candidate);
  }
  jsonPaths.forEach(readJson);
});

await check("Package B exact 10/10 unchanged", () => {
  assert.equal(packageBScope.length, 10);
  for (const candidate of packageBScope) {
    assert.equal(
      git(["hash-object", candidate]),
      git(["rev-parse", `${originalProductBaseline}:${candidate}`]),
      candidate,
    );
  }
  packageBVerifierSummary = "exact 10/10 unchanged";
});

await check("Package B accepted verifier remains PASS 20/20", () => {
  runPackageBVerifierAtAcceptedBaseline();
});

await check("Package A R1 accepted verifier remains PASS 23/23", () => {
  runPackageAR1VerifierAtAcceptedBaseline();
});

await check("provider marker authorization and rerun state unchanged", () => {
  const source = readJson(p1SourceContractPath);
  const markerPath = path.join(root, source.frozen_state.marker_path);
  const authorizationPath = source.frozen_state.authorization_path;
  const authorization = readJson(authorizationPath);
  assert.equal(existsSync(markerPath), true);
  assert.equal(sha256(readFileSync(markerPath)), source.frozen_state.marker_raw_sha256);
  assert.equal(sha256(read(authorizationPath)), source.frozen_state.authorization_raw_sha256);
  assert.equal(source.frozen_state.authorization_consumed, true);
  assert.equal(source.frozen_state.rerun_authorized, false);
  assert.equal(authorization.consumed, true);
  assert.equal(authorization.rerun_authorized, false);
});

await check("active Runtime v4 and protected implementation unchanged", () => {
  for (const candidate of [
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
    "components/runtime/RuntimeAssessmentNote.tsx",
  ]) {
    assert.equal(
      git(["hash-object", candidate]),
      git(["rev-parse", `${correctionBaseline}:${candidate}`]),
      candidate,
    );
  }
  assert.match(
    readText("lib/assessment/runtime/schema-catalog.ts"),
    /runtime-stage-catalog-v4\.0\.0/u,
  );
});

await check("Product Doctrine hard gates value hierarchy and anti-goals exact", () => {
  const doctrine = readJson(productDoctrinePath);
  assert.equal(doctrine.task_id, taskId);
  assert.equal(
    doctrine.status,
    "reassuring_assessment_experience_doctrine_r1_correction_ready_pending_human_chatgpt_review",
  );
  assert.equal(doctrine.baseline, originalProductBaseline);
  assert.equal(doctrine.branch, expectedBranch);
  assert.deepEqual(doctrine.correction, {
    id: "Q0-A",
    revision: "R1",
    source_branch: doctrineSourceBranch,
    baseline: correctionBaseline,
    scope: {
      update_paths: 10,
      new_paths: 0,
      deleted_paths: 0,
      renamed_paths: 0,
    },
  });
  assert.deepEqual(
    doctrine.non_negotiable_hard_gate.map((item) => item.principle),
    [
      "safety",
      "factual_integrity",
      "user_and_other_person_boundary_integrity",
      "no_unsupported_certainty",
      "no_fabricated_inner_state_causality_chronology_or_future_outcome",
    ],
  );
  assert.equal(
    doctrine.primary_product_value.not_primary_purchase,
    "The customer is not primarily buying the shortest correct answer.",
  );
  assert.deepEqual(doctrine.desired_customer_state_after_reading, [
    "なんか安心した。今日はこれでいい。",
    "今はこれをすればいい。",
  ]);
  assert.equal(doctrine.product_priority_after_hard_gates.length, 6);
  assert.equal(doctrine.anti_goals.length, 10);
  const baselineDoctrine = JSON.parse(
    git(["show", `${correctionBaseline}:${productDoctrinePath}`]),
  );
  for (const immutableKey of [
    "non_negotiable_hard_gate",
    "primary_product_value",
    "desired_customer_state_after_reading",
    "product_priority_after_hard_gates",
    "fortune_telling_like_experience",
    "anti_goals",
    "diagnosis",
    "experience_outcome",
  ]) {
    assert.deepEqual(doctrine[immutableKey], baselineDoctrine[immutableKey], immutableKey);
  }
  assert.deepEqual(doctrine.section_count_policy.normal_visible_section_guidance, {
    minimum: 6,
    maximum: 9,
    unit: "semantically_distinct_visible_sections",
    policy: "guidance_only",
  });
  assert.equal(doctrine.section_count_policy.density_control, "semantic_necessity");
  assert.equal(doctrine.section_count_policy.hard_minimum_enforced, false);
  assert.equal(doctrine.section_count_policy.hard_maximum_enforced, false);
  assert.equal(
    doctrine.section_count_policy.simple_case_below_six_allowed_when_semantically_complete,
    true,
  );
  assert.equal(
    doctrine.section_count_policy.section_created_only_to_satisfy_count_allowed,
    false,
  );
  assert.equal(doctrine.section_count_policy.padding_for_section_count, "prohibited");
  assert.equal(doctrine.section_count_policy.duplicated_primary_meaning_allowed, false);
  assert.equal(doctrine.section_count_policy.fixed_word_count, "prohibited");
  assert.equal(doctrine.section_count_policy.fixed_section_count, "prohibited");
  assert.deepEqual(doctrine.r2_c_required_review.human_visual_checks, [
    "desktop_1440",
    "mobile_399",
    "mobile_320",
    "keyboard",
    "browser_zoom_200_percent",
    "copy_success",
    "copy_failure",
    "details_behavior",
    "reduced_motion",
  ]);
  assert.deepEqual(doctrine.r2_c_required_review.product_owner_cases, [
    "simple",
    "emotional",
    "null_optional",
    "polite_draft",
    "persona_preserved",
  ]);
  assert.equal(doctrine.r2_c_required_review.all_checks_required_for_completion, true);
  assert.equal(
    doctrine.r2_c_required_review.completion_without_reduced_motion_allowed,
    false,
  );
  assert.deepEqual(doctrine.jpy980_state_separation.r2_c_human_product_pass, {
    experienceProductJudgment: "plausibly_worth_jpy980",
    jpy980RuntimeReadiness: "not_established",
    jpy980RuntimeReadinessGate: "not_ready_until_global_Q0_completion",
    states_are_equivalent: false,
  });
  assert.equal(
    doctrine.jpy980_state_separation.r2_owned_scope,
    "reassuring_assessment_experience_only",
  );
  assert.deepEqual(doctrine.jpy980_state_separation.does_not_establish, [
    "active_runtime_activation",
    "production_runtime",
    "provider_quality",
    "overall_jpy980_runtime_readiness",
  ]);
  assert.deepEqual(
    doctrine.jpy980_state_separation.global_q0_completion_requires_separate_acceptance_of_at_least,
    [
      "pb_05_factual_precision_and_anxiety_safe_writing",
      "evaluator_and_semantic_disposition",
      "pre_payment_safety_ux",
      "consolidated_regression_and_product_owner_review",
    ],
  );
  assert.equal(doctrine.authority_boundary.implementation_authorized, false);
  assert.equal(doctrine.authority_boundary.runtime_activation_authorized, false);
  assert.equal(doctrine.authority_boundary.provider_rerun_authorized, false);
  assert.equal(doctrine.authority_boundary.production_runtime_established, false);
  assert.equal(doctrine.authority_boundary.provider_quality_established, false);
  assert.equal(doctrine.authority_boundary.global_q0_completion_established, false);
  assert.equal(
    doctrine.authority_boundary.overall_jpy980_runtime_readiness_established,
    false,
  );
  assert.deepEqual(doctrine.experience_outcome.sequence, [
    "理解された感覚",
    "安心",
    "納得",
    "行動",
  ]);
});

await check("Product Doctrine Markdown records the binding experience", () => {
  const text = readText(productDoctrineMarkdownPath);
  for (const required of [
    "The customer is not primarily buying the shortest correct answer.",
    "なんか安心した。今日はこれでいい。",
    "今はこれをすればいい。",
    "理解された感覚 → 安心 → 納得 → 行動",
    "The problem with the previous long note was repetition, not length itself.",
    "The problem with the current Package B note is under-delivery, not visual direction.",
    "CustomerAssessmentProjectionV1",
    "guidance only",
    "neither a Hard Minimum nor a Hard Maximum",
    "fewer than six visible sections",
    "reduced-motion behavior",
    "R2-C must not be marked complete without observed reduced-motion behavior.",
    "experienceProductJudgment = plausibly_worth_jpy980",
    "jpy980RuntimeReadiness = not_established / not_ready_until_global_Q0_completion",
    "These states are not equivalent.",
    "Implementation, Provider rerun, Runtime activation, R4, C2, PR, and main integration remain unauthorized.",
  ]) {
    assert.ok(text.includes(required), required);
  }
});

await check("Human Visual Review exact disposition and incomplete checks", () => {
  const review = readJson(visualReviewPath);
  assert.deepEqual(review.judgment, {
    visual_direction: "accepted",
    brand_atmosphere: "accepted",
    draft_discoverability: "accepted",
    draft_copy_interaction:
      "accepted_pending_keyboard_and_failure_manual_test",
    typography_readability_at_observed_desktop_width: "accepted",
    customer_content_density: "failed_too_short",
    jpy980_readiness: "not_ready",
    package_b_implementation_disposition:
      "visual_shell_accepted_experience_content_revision_required",
  });
  assert.equal(review.specific_findings.length, 9);
  assert.deepEqual(
    review.explicitly_not_complete_without_separate_observation.map(
      (item) => item.check,
    ),
    [
      "mobile_399",
      "mobile_320",
      "keyboard",
      "browser_zoom_200_percent",
      "copy_failure",
      "reduced_motion",
    ],
  );
  assert.ok(
    review.explicitly_not_complete_without_separate_observation.every(
      (item) => item.complete === false,
    ),
  );
});

await check("required emotional journey and proportional section architecture", () => {
  const architecture = readJson(sectionArchitecturePath);
  assert.equal(architecture.required_emotional_journey.length, 9);
  assert.deepEqual(architecture.experience_sequence, [
    "理解された感覚",
    "安心",
    "納得",
    "行動",
  ]);
  assert.deepEqual(architecture.rejected_sequence, ["結論", "操作指示", "終了"]);
  assert.deepEqual(
    architecture.core_experience_candidates.map((section) => section.id),
    ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  );
  assert.deepEqual(
    architecture.composition_rules.normal_target_visible_sections,
    {
      minimum: 6,
      maximum: 9,
      unit: "semantically_distinct_sections",
      policy: "guidance_only",
      hard_minimum_enforced: false,
      hard_maximum_enforced: false,
    },
  );
  assert.equal(architecture.composition_rules.semantic_necessity_controls_density, true);
  assert.equal(architecture.composition_rules.fixed_word_count_ceiling, false);
  assert.equal(architecture.composition_rules.fixed_word_count, "prohibited");
  assert.equal(architecture.composition_rules.fixed_section_count, "prohibited");
  assert.equal(
    architecture.composition_rules.simple_consultation_below_six_allowed_when_semantically_complete,
    true,
  );
  assert.equal(
    architecture.composition_rules.section_created_only_to_satisfy_count_allowed,
    false,
  );
  assert.equal(
    architecture.composition_rules.padding_for_section_count,
    "prohibited",
  );
  assert.equal(architecture.composition_rules.duplicated_primary_meaning_allowed, false);
  assert.equal(
    architecture.density_rules.personalized_emotional_or_reflective_section_visible_in_every_ready_assessment,
    true,
  );
  assert.equal(architecture.density_rules.organize_emotions_is_only_reassurance_route, false);
  assert.equal(architecture.density_rules.text_transformation.paraphrase, false);
  assert.equal(Object.keys(architecture.acceptance_principles).length, 10);
  assert.ok(
    Object.values(architecture.acceptance_principles).every(
      (accepted) => accepted === true,
    ),
  );
  assert.deepEqual(architecture.jpy980_state_separation, {
    r2_owned_scope: "reassuring_assessment_experience_only",
    experienceProductJudgment_on_r2_c_human_product_pass:
      "plausibly_worth_jpy980",
    jpy980RuntimeReadiness_after_r2_c_human_product_pass: "not_established",
    jpy980RuntimeReadinessGate: "not_ready_until_global_Q0_completion",
    states_are_equivalent: false,
    r2_c_pass_establishes_active_runtime_activation: false,
    r2_c_pass_establishes_production_runtime: false,
    r2_c_pass_establishes_provider_quality: false,
    r2_c_pass_establishes_overall_jpy980_runtime_readiness: false,
  });
});

await check("current CustomerAssessmentProjectionV1 gap audit matches source", () => {
  const gap = readJson(projectionGapPath);
  const projectionSource = readText(
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
  );
  const typesSource = readText("lib/assessment/runtime/types.ts");
  assert.equal(gap.audit_target.type, "CustomerAssessmentProjectionV1");
  assert.equal(gap.audit_target.accepted_contract_mutation_allowed, false);
  assert.deepEqual(
    gap.gap_audit.map((item) => item.desired_field),
    [
      "openingLine",
      "openingLetter",
      "situationReading",
      "possibleInterpretations",
      "materialUnknowns",
      "draftContext",
      "actionRationales",
      "closingLines",
      "consultationLimitations",
    ],
  );
  assert.match(
    projectionSource,
    /requestedTopics\.includes\("organize_emotions"\)[\s\S]*content\.short_letter/u,
  );
  assert.match(
    projectionSource,
    /requestedTopics\.includes\("message_impact"\)[\s\S]*content\.possible_interpretations/u,
  );
  for (const sourceField of [
    "cover_line",
    "short_letter",
    "observed_fact_commentary",
    "possible_interpretations",
    "action_rationales",
    "message_draft_context",
    "closing_lines",
    "material_unknowns",
    "limitations",
    "model_generated_limitations",
  ]) {
    assert.ok(typesSource.includes(sourceField), sourceField);
  }
  assert.equal(gap.proposed_successor.type, "CustomerAssessmentExperienceProjectionV2");
  assert.equal(gap.proposed_successor.mutates_v1, false);
  assert.equal(gap.proposed_successor.preserves_full_report_unchanged, true);
  assert.equal(gap.proposed_successor.selection_rules.fact_ids_removed_from_customer_output, true);
  assert.deepEqual(gap.preferred_future_boundary, [
    "Full structured Report",
    "deterministic CustomerAssessmentExperienceProjection successor",
    "Customer UI",
  ]);
  assert.deepEqual(gap.prohibitions, {
    additional_provider_stage: false,
    paraphrase: false,
    factual_rewrite: false,
    generated_filler: false,
    provider_execution: false,
    runtime_activation: false,
  });
});

await check("R2-A through R2-C are non-overlapping and Package C remains separate", () => {
  const plan = readJson(implementationPackagesPath);
  const p1Plan = readJson(p1PackagesPath);
  const baselinePlan = JSON.parse(
    git(["show", `${correctionBaseline}:${implementationPackagesPath}`]),
  );
  assert.deepEqual(plan.package_order, ["R2-A", "R2-B", "R2-C"]);
  assert.deepEqual(
    plan.packages.map((item) => item.package_id),
    ["R2-A", "R2-B", "R2-C"],
  );
  const allPaths = plan.packages.flatMap((item) => item.proposed_paths);
  assert.equal(new Set(allPaths).size, allPaths.length);
  for (let index = 0; index < plan.packages.length; index += 1) {
    for (const immutableKey of [
      "package_id",
      "name",
      "proposed_branch",
      "proposed_paths",
      "provider_calls_required",
      "human_visual_review_required",
      "implementation_authorized",
    ]) {
      assert.deepEqual(
        plan.packages[index][immutableKey],
        baselinePlan.packages[index][immutableKey],
        `${plan.packages[index].package_id}.${immutableKey}`,
      );
    }
  }
  assert.ok(plan.packages.every((item) => item.provider_calls_required === false));
  assert.ok(plan.packages.every((item) => item.implementation_authorized === false));
  assert.equal(plan.r2_owned_scope, "reassuring_assessment_experience_only");
  const r2B = plan.packages.find((item) => item.package_id === "R2-B");
  const r2C = plan.packages.find((item) => item.package_id === "R2-C");
  assert.ok(r2B);
  assert.ok(r2C);
  assert.ok(
    r2B.tests.includes(
      "approximately six to nine distinct visible sections is guidance only and not a hard minimum or maximum",
    ),
  );
  assert.ok(
    r2B.tests.includes(
      "simple case may render fewer than six sections when semantically complete",
    ),
  );
  assert.ok(
    r2B.tests.includes(
      "no section is created only to satisfy section count and padding is prohibited",
    ),
  );
  assert.deepEqual(r2C.required_review_checks, [
    "desktop_1440",
    "mobile_399",
    "mobile_320",
    "keyboard",
    "browser_zoom_200_percent",
    "copy_success",
    "copy_failure",
    "details_behavior",
    "reduced_motion",
  ]);
  assert.deepEqual(r2C.required_product_cases, [
    "simple",
    "emotional",
    "null_optional",
    "polite_draft",
    "persona_preserved",
  ]);
  assert.equal(r2C.all_required_review_checks_must_pass_for_completion, true);
  assert.equal(r2C.completion_without_reduced_motion_allowed, false);
  const packageC = p1Plan.packages.find((item) => item.package_id === "C");
  assert.ok(packageC);
  assert.equal(
    packageC.name,
    "PB-05 factual precision and anxiety-safe writing successor",
  );
  const packageCOverlap = packageC.proposed_paths.filter((candidate) =>
    allPaths.includes(candidate),
  );
  assert.deepEqual(packageCOverlap, []);
  assert.deepEqual(
    plan.existing_package_c_boundary,
    baselinePlan.existing_package_c_boundary,
  );
  assert.equal(plan.existing_package_c_boundary.remains_separate, true);
  assert.equal(plan.existing_package_c_boundary.ownership_transferred_to_r2, false);
  assert.deepEqual(plan.global_q0_completion_boundary.r2_c_human_product_pass, {
    experienceProductJudgment: "plausibly_worth_jpy980",
    jpy980RuntimeReadiness: "not_established",
    jpy980RuntimeReadinessGate: "not_ready_until_global_Q0_completion",
    states_are_equivalent: false,
  });
  assert.deepEqual(
    plan.global_q0_completion_boundary.r2_c_human_product_pass_does_not_establish,
    [
      "active_runtime_activation",
      "production_runtime",
      "provider_quality",
      "overall_jpy980_runtime_readiness",
    ],
  );
  assert.deepEqual(
    plan.global_q0_completion_boundary
      .remaining_v12_product_safety_quality_work_requiring_separate_acceptance,
    [
      "pb_05_factual_precision_and_anxiety_safe_writing",
      "evaluator_and_semantic_disposition",
      "pre_payment_safety_ux",
      "consolidated_regression_and_product_owner_review",
    ],
  );
  assert.equal(plan.global_q0_completion_boundary.global_q0_completion_established, false);
  assert.equal(plan.global_acceptance_boundary.implementation_authorized, false);
  assert.equal(plan.global_acceptance_boundary.provider_rerun_authorized, false);
  assert.equal(plan.global_acceptance_boundary.active_runtime_activation_authorized, false);
  assert.equal(plan.global_acceptance_boundary.production_runtime_established, false);
  assert.equal(plan.global_acceptance_boundary.provider_quality_established, false);
  assert.equal(
    plan.global_acceptance_boundary.overall_jpy980_runtime_readiness_established,
    false,
  );
  assert.equal(
    git(["hash-object", p1PackagesPath]),
    git(["rev-parse", `${correctionBaseline}:${p1PackagesPath}`]),
  );
});

await check("capabilities and zero-operation boundary exact", () => {
  const capabilities = readJson(capabilitiesPath);
  const expected = {
    status:
      "reassuring_assessment_experience_doctrine_r1_correction_ready_pending_human_chatgpt_review",
    baseline: originalProductBaseline,
    correction_branch: expectedBranch,
    correction_baseline: correctionBaseline,
    package_b_visual_shell_accepted: true,
    package_b_content_density_accepted: false,
    product_doctrine_defined: true,
    emotional_journey_defined: true,
    experience_projection_gap_audited: true,
    experience_projection_successor_planned: true,
    implementation_packages_defined: true,
    r2_owned_scope: "reassuring_assessment_experience_only",
    section_count_guidance_only: true,
    section_count_hard_minimum_enforced: false,
    section_count_hard_maximum_enforced: false,
    simple_case_below_six_allowed_when_semantically_complete: true,
    padding_for_section_count: "prohibited",
    r2_c_reduced_motion_review_required: true,
    r2_c_completion_without_reduced_motion_allowed: false,
    experienceProductJudgment: "not_established_pending_R2_C_human_product_review",
    jpy980RuntimeReadiness: "not_established",
    jpy980RuntimeReadinessGate: "not_ready_until_global_Q0_completion",
    production_runtime_established: false,
    provider_quality_established: false,
    global_q0_completion_established: false,
    overall_jpy980_runtime_readiness_established: false,
    implementation_authorized: false,
    provider_rerun_ready: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    r4_authorized: false,
    c2_authorized: false,
    main_changed: false,
    next_action:
      "human_chatgpt_review_of_reassuring_assessment_experience_doctrine_r1_correction",
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(capabilities[key], value, key);
  }
  assert.deepEqual(capabilities.correction_scope, {
    updated_paths: 10,
    new_paths: 0,
    deleted_paths: 0,
    renamed_paths: 0,
  });
  assert.deepEqual(capabilities.r2_c_human_product_pass_semantics, {
    experienceProductJudgment: "plausibly_worth_jpy980",
    jpy980RuntimeReadiness: "not_established",
    states_are_equivalent: false,
  });
  assert.equal(capabilities.operations.provider_calls, 0);
  assert.equal(capabilities.operations.db_operations, 0);
  assert.equal(capabilities.operations.supabase_operations, 0);
  for (const [key, value] of Object.entries(capabilities.operations)) {
    if (key.endsWith("_calls") || key.endsWith("_operations")) continue;
    assert.equal(value, false, key);
  }
});

await check("review document records doctrine review gap packages and boundary", () => {
  const text = readText(reviewDocumentPath);
  for (const required of [
    "reassuring_assessment_experience_doctrine_r1_correction_ready_pending_human_chatgpt_review",
    "visual_shell_accepted_experience_content_revision_required",
    "理解された感覚 → 安心 → 納得 → 行動",
    "CustomerAssessmentProjectionV1",
    "CustomerAssessmentExperienceProjectionV2",
    "Package R2-A",
    "Package R2-B",
    "Package R2-C",
    "Correction scope: exact `10/10`; NEW / DELETE / RENAME = `0 / 0 / 0`",
    "guidance only, never as a Hard Minimum or Hard Maximum",
    "fewer than six visible sections",
    "no section may be created only to satisfy the count",
    "reduced-motion behavior",
    "R2-C must not be marked complete without observed reduced-motion behavior.",
    "experienceProductJudgment = plausibly_worth_jpy980",
    "jpy980RuntimeReadiness = not_established / not_ready_until_global_Q0_completion",
    "R2-C Human Product PASS does not establish Active Runtime activation, Production Runtime, Provider quality, or overall JPY980 Runtime readiness.",
    "PB-05 factual precision and anxiety-safe writing",
    "pre-payment Safety UX",
    "implementation_authorized=false",
    "Provider / DB / Supabase: `0 / 0 / 0`",
  ]) {
    assert.ok(text.includes(required), required);
  }
});

await check("rolling documents contain the exact new status block", () => {
  for (const candidate of rollingDocumentPaths) {
    const block = markedBlock(readText(candidate), taskId);
    assert.ok(
      block.includes(
        "reassuring_assessment_experience_doctrine_r1_correction_ready_pending_human_chatgpt_review",
      ),
      candidate,
    );
    assert.ok(block.includes(correctionBaseline), candidate);
    assert.ok(block.includes("10/10"), candidate);
    assert.ok(block.includes("reduced-motion"), candidate);
    assert.ok(block.includes("guidance"), candidate);
    assert.ok(block.includes("experienceProductJudgment"), candidate);
    assert.ok(block.includes("jpy980RuntimeReadiness"), candidate);
    assert.ok(block.includes("not_ready_until_global_Q0_completion"), candidate);
    assert.ok(block.includes("implementation_authorized=false"), candidate);
    assert.ok(block.includes("Provider / DB / Supabase"), candidate);
  }
});

await check("planning-only prohibited implementation paths remain untouched", () => {
  const changed = new Set(
    git(["diff", "--name-only", correctionBaseline, "--"])
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
  assert.equal(
    [...changed].some(
      (candidate) =>
        candidate.startsWith("scripts/") && candidate !== verifierPath,
    ),
    false,
  );
});

await check("git diff --check PASS", () => {
  git(["diff", "--check", correctionBaseline, "--"]);
});

const failed = checks.filter((result) => !result.passed);
console.log(
  `Reassurance doctrine verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${
    checks.length - failed.length
  }/${checks.length}`,
);
console.log(`Exact correction scope: ${exactCorrectionScope.length}/10`);
console.log("NEW / DELETE / RENAME: 0 / 0 / 0");
console.log(`Package B verifier: ${packageBVerifierSummary}`);
console.log(`Package A R1 verifier: ${packageAR1VerifierSummary}`);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((item) => item.name).join("; ")}`);
  process.exitCode = 1;
}
