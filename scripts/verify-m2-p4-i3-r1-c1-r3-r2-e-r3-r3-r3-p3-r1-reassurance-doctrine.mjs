import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
const baseline = "fdbdf808f135655084de32aec2e57473c1beaf31";
const expectedParent = "8700ded1454058f72d33f2eb4d1ae6a05b6e008c";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
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
const exactScope = [
  productDoctrinePath,
  productDoctrineMarkdownPath,
  visualReviewPath,
  projectionGapPath,
  sectionArchitecturePath,
  implementationPackagesPath,
  capabilitiesPath,
  verifierPath,
  reviewDocumentPath,
  ...rollingDocumentPaths,
];
const newPaths = exactScope.slice(0, 9);
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
        baseline,
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
      copyFileSync(
        path.join(root, authority.path),
        path.join(cloneRoot, authority.path),
      );
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
      copyFileSync(
        path.join(root, authority.path),
        path.join(cloneRoot, authority.path),
      );
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

await check("baseline branch parent and main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const commitsAfterBaseline = Number(git(["rev-list", "--count", `${baseline}..${head}`]));
  assert.ok(commitsAfterBaseline === 0 || commitsAfterBaseline === 1);
  if (commitsAfterBaseline === 1) assert.equal(git(["rev-parse", `${head}^`]), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact planning scope 12/12 with new paths 9 and updates 3", () => {
  const tracked = git(["diff", "--name-only", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((candidate) => candidate.replaceAll("\\", "/"));
  assert.equal(exactScope.length, 12);
  assert.equal(newPaths.length, 9);
  assert.equal(rollingDocumentPaths.length, 3);
  assert.deepEqual(sorted(new Set([...tracked, ...untracked])), sorted(exactScope));
  for (const candidate of exactScope) {
    assert.equal(existsSync(path.join(root, candidate)), true, candidate);
  }
  for (const candidate of newPaths) {
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), false, candidate);
  }
  for (const candidate of rollingDocumentPaths) {
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), true, candidate);
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
  for (const candidate of exactScope) {
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
      git(["rev-parse", `${baseline}:${candidate}`]),
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
      git(["rev-parse", `${baseline}:${candidate}`]),
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
    "reassuring_assessment_experience_doctrine_ready_pending_human_chatgpt_review",
  );
  assert.equal(doctrine.baseline, baseline);
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
  assert.equal(doctrine.authority_boundary.implementation_authorized, false);
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
    { minimum: 6, maximum: 9, unit: "semantically_distinct_sections" },
  );
  assert.equal(architecture.composition_rules.fixed_word_count_ceiling, false);
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
  assert.deepEqual(plan.package_order, ["R2-A", "R2-B", "R2-C"]);
  assert.deepEqual(
    plan.packages.map((item) => item.package_id),
    ["R2-A", "R2-B", "R2-C"],
  );
  const allPaths = plan.packages.flatMap((item) => item.proposed_paths);
  assert.equal(new Set(allPaths).size, allPaths.length);
  assert.ok(plan.packages.every((item) => item.provider_calls_required === false));
  assert.ok(plan.packages.every((item) => item.implementation_authorized === false));
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
  assert.equal(plan.existing_package_c_boundary.remains_separate, true);
  assert.equal(plan.existing_package_c_boundary.ownership_transferred_to_r2, false);
  assert.equal(plan.global_acceptance_boundary.implementation_authorized, false);
  assert.equal(
    git(["hash-object", p1PackagesPath]),
    git(["rev-parse", `${baseline}:${p1PackagesPath}`]),
  );
});

await check("capabilities and zero-operation boundary exact", () => {
  const capabilities = readJson(capabilitiesPath);
  const expected = {
    status:
      "reassuring_assessment_experience_doctrine_ready_pending_human_chatgpt_review",
    baseline,
    package_b_visual_shell_accepted: true,
    package_b_content_density_accepted: false,
    product_doctrine_defined: true,
    emotional_journey_defined: true,
    experience_projection_gap_audited: true,
    experience_projection_successor_planned: true,
    implementation_packages_defined: true,
    implementation_authorized: false,
    provider_rerun_ready: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    r4_authorized: false,
    c2_authorized: false,
    next_action:
      "human_chatgpt_review_of_reassuring_assessment_experience_doctrine",
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(capabilities[key], value, key);
  }
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
    "reassuring_assessment_experience_doctrine_ready_pending_human_chatgpt_review",
    "visual_shell_accepted_experience_content_revision_required",
    "理解された感覚 → 安心 → 納得 → 行動",
    "CustomerAssessmentProjectionV1",
    "CustomerAssessmentExperienceProjectionV2",
    "Package R2-A",
    "Package R2-B",
    "Package R2-C",
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
        "reassuring_assessment_experience_doctrine_ready_pending_human_chatgpt_review",
      ),
      candidate,
    );
    assert.ok(block.includes(baseline), candidate);
    assert.ok(block.includes("implementation_authorized=false"), candidate);
    assert.ok(block.includes("Provider / DB / Supabase"), candidate);
  }
});

await check("planning-only prohibited implementation paths remain untouched", () => {
  const changed = new Set(
    git(["diff", "--name-only", baseline, "--"])
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
  git(["diff", "--check"]);
});

const failed = checks.filter((result) => !result.passed);
console.log(
  `Reassurance doctrine verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${
    checks.length - failed.length
  }/${checks.length}`,
);
console.log(`Exact scope: ${exactScope.length}/12`);
console.log(`Package B verifier: ${packageBVerifierSummary}`);
console.log(`Package A R1 verifier: ${packageAR1VerifierSummary}`);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
if (failed.length > 0) {
  console.error(`Failed checks: ${failed.map((item) => item.name).join("; ")}`);
  process.exitCode = 1;
}
