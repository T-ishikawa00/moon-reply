import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-C";
const baseline = "1e6e719a8bdd766617405ec40691ff498f1bbc2a";
const expectedParent = "e509405935e82d7079023609b2d852d51f286f3e";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-visual-product";
const sourceBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r1-mobile-copy";

const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c";
const reviewMatrixPath = `${packageRoot}/review-matrix-v1.json`;
const humanReviewPath = `${packageRoot}/human-visual-review-v1.json`;
const productOwnerReviewPath = `${packageRoot}/product-owner-review-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-visual-product-review.mjs";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_C_REVIEW.md";

const exactScope = [
  reviewMatrixPath,
  humanReviewPath,
  productOwnerReviewPath,
  capabilitiesPath,
  verifierPath,
  reviewDocumentPath,
];

const r2bR1Scope = [
  "components/runtime/CustomerAssessmentNote.tsx",
  "components/runtime/CustomerAssessmentNote.module.css",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/presentation-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_B_REVIEW.md",
];

const r2aR1Scope = [
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/projection-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/projection-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_A_REVIEW.md",
];

const doctrineRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1";
const doctrineScope = [
  `${doctrineRoot}/product-doctrine-v1.json`,
  `${doctrineRoot}/product-doctrine-v1.md`,
  `${doctrineRoot}/experience-projection-gap-v1.json`,
  `${doctrineRoot}/experience-section-architecture-v1.json`,
  `${doctrineRoot}/human-visual-review-v1.json`,
  `${doctrineRoot}/implementation-packages-v1.json`,
  `${doctrineRoot}/capabilities-v1.json`,
];

const notePath = "components/runtime/CustomerAssessmentNote.tsx";
const noteCssPath = "components/runtime/CustomerAssessmentNote.module.css";
const copyButtonPath = "components/runtime/CustomerDraftCopyButton.tsx";
const reviewRoutePath = "app/review/runtime/v12/page.tsx";
const fixtureSourcePath =
  "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts";
const visualReviewCasesPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3/visual-review-cases-v1.json";

const implementationProtectedPaths = [
  notePath,
  noteCssPath,
  copyButtonPath,
  reviewRoutePath,
  fixtureSourcePath,
  visualReviewCasesPath,
  "lib/assessment/runtime/customer-assessment-projection-v1.ts",
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  "app/api/internal/assessments/route.ts",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
];

const fixtureIds = [
  "simple_business_reply_with_draft",
  "ordinary_reply_waiting",
  "polite_thank_you_with_draft",
  "relationship_summary_requested",
  "expanded_plan_requested_legacy",
  "expanded_plan_requested_split",
  "nullable_optional_sections",
  "pause_additional_contact_no_draft",
  "kansai_persona_draft",
];

const interactionResults = {
  keyboard_only_navigation: "PASS",
  copy_success: "PASS",
  copy_failure: "PASS",
  copy_success_announcement: "PASS",
  copy_failure_announcement: "PASS",
  zoom_200_percent: "PASS",
  reduced_motion: "PASS",
};

const chatgptAcceptedFindings = [
  "Visual shell fits Moon Reply",
  "mobile reading experience is strong",
  "letter-first pacing supports reassurance",
  "information density is no longer too short",
  "primary sections have distinct Product functions",
  "final draft remains easy to find",
  "responsive typography remains readable",
  "320px does not materially degrade the experience",
  "current-answer mobile correction resolves the previous cramped layout",
  "no further major UI redesign is recommended",
];

const chatgptMinorObservations = [
  "source-generated content must not force unnecessary \u300c\u307e\u3060\u5206\u304b\u3089\u306a\u3044\u3053\u3068\u300d sections",
  "generic reassurance repetition remains a Provider/Prompt quality issue",
  "renderer-owned time-neutral action heading is now corrected",
];

const productOwnerAcceptedDimensions = [
  "visual atmosphere",
  "reassurance direction",
  "assessment fullness",
  "information density",
  "personalized reading feel",
  "draft utility",
  "mobile experience",
  "Product structure",
  "approximate visual plausibility for JPY980",
];

const finalReadinessOpenReasons = [
  "actual LUNA output successor quality not yet established",
  "known PB-05 factual/anxiety-safe writing defects remain",
  "evaluator successor remains unfinished",
  "pre-payment Safety UX unfinished",
  "payment unfinished",
  "Active Runtime still v4",
  "integrated live E2E unfinished",
];

const packageCGoals = [
  "prevent unsupported causal attribution",
  "prevent fabricated chronology",
  "preserve explicit facts without unnecessary hedging",
  "avoid needless negative-possibility enumeration",
  "reduce generic reassurance repetition",
  "keep consultation-specific reassurance",
  "preserve persona and meaning",
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

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function assertBaselineBlobUnchanged(relativePath) {
  assert.equal(
    git(["hash-object", relativePath]),
    git(["rev-parse", `${baseline}:${relativePath}`]),
    relativePath,
  );
}

function assertAllTrue(record) {
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, true, key);
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

await check("exact review branch baseline parent source and main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(git(["rev-parse", sourceBranch]), baseline);
  assert.equal(git(["rev-parse", `origin/${sourceBranch}`]), baseline);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  if (head !== baseline) assert.equal(git(["rev-parse", `${head}^`]), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
});

await check("exact scope 6/6 with all six paths new", () => {
  const tracked = git([
    "diff",
    "--name-status",
    "--no-renames",
    baseline,
    "--",
  ])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, relativePath] = line.split("\t");
      return { status, path: relativePath.replaceAll("\\", "/") };
    });
  const trackedPaths = new Set(tracked.map((item) => item.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((relativePath) => relativePath.replaceAll("\\", "/"))
    .filter((relativePath) => !trackedPaths.has(relativePath))
    .map((relativePath) => ({ status: "A", path: relativePath }));
  const actual = [...tracked, ...untracked];

  assert.equal(exactScope.length, 6);
  assert.deepEqual(sorted(actual.map((item) => item.path)), sorted(exactScope));
  assert.equal(actual.length, 6);
  assert.equal(actual.every((item) => item.status === "A"), true);
  for (const candidate of exactScope) {
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), false, candidate);
  }
});

await check("strict UTF-8 JSON validity U+FFFD zero secret zero", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:SUPABASE|OPENAI)_[A-Z_]*(?:KEY|SECRET)\s*[:=]\s*["'][^"']+["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  for (const candidate of exactScope) {
    const text = readText(candidate);
    assert.equal(text.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(text, /[\t ]+$/gmu, candidate);
    for (const pattern of secretPatterns) assert.doesNotMatch(text, pattern);
  }
  readJson(reviewMatrixPath);
  readJson(humanReviewPath);
  readJson(productOwnerReviewPath);
  readJson(capabilitiesPath);
});

await check("all implementation and protected surface blobs unchanged", () => {
  for (const candidate of implementationProtectedPaths) {
    assertBaselineBlobUnchanged(candidate);
  }
});

await check("R2-B R1 exact correction remains unchanged", () => {
  assert.equal(r2bR1Scope.length, 6);
  r2bR1Scope.forEach(assertBaselineBlobUnchanged);
});

await check("R2-A R1 accepted implementation remains unchanged", () => {
  assert.equal(r2aR1Scope.length, 7);
  r2aR1Scope.forEach(assertBaselineBlobUnchanged);
});

await check("Product Doctrine remains unchanged", () => {
  assert.equal(doctrineScope.length, 7);
  doctrineScope.forEach(assertBaselineBlobUnchanged);
});

await check("nine V2 fixtures remain unchanged and complete", () => {
  assertBaselineBlobUnchanged(fixtureSourcePath);
  assertBaselineBlobUnchanged(visualReviewCasesPath);
  const fixtureSource = readText(fixtureSourcePath);
  for (const fixtureId of fixtureIds) assert.ok(fixtureSource.includes(fixtureId));
  const cases = readJson(visualReviewCasesPath);
  assert.deepEqual(
    cases.fixtures.map((fixture) => fixture.fixture_id),
    fixtureIds,
  );
});

await check("review route copy button details and focus behavior unchanged", () => {
  const routeSource = readText(reviewRoutePath);
  const copySource = readText(copyButtonPath);
  const noteSource = readText(notePath);
  const cssSource = readText(noteCssPath);
  assert.match(routeSource, /M2_INTERNAL_RUNTIME_ENABLED\s*!==\s*"true"/u);
  assert.match(routeSource, /notFound\(\)/u);
  assert.match(routeSource, /index:\s*false/u);
  assert.match(routeSource, /follow:\s*false/u);
  assert.match(copySource, /<button[^>]*type="button"/u);
  assert.match(copySource, /navigator\.clipboard\.writeText\(text\)/u);
  assert.match(copySource, /aria-live="polite"/u);
  assert.match(noteSource, /<details\s+className=/u);
  assert.doesNotMatch(noteSource, /<details[^>]*\sopen(?:=|\s|>)/u);
  assert.match(cssSource, /\.copyButton:focus-visible/u);
  assert.match(cssSource, /\.secondaryDetails summary:focus-visible/u);
});

await check("Active Runtime remains v4 and inactive", () => {
  const catalog = readJson(
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v4.json",
  );
  const catalogSource = readText("lib/assessment/runtime/schema-catalog.ts");
  const serviceSource = readText("lib/assessment/runtime/service.ts");
  assert.equal(catalog.catalog_version, "runtime-stage-catalog-v4.0.0");
  assert.match(catalogSource, /runtime-stage-catalog-v4\.json/u);
  assert.match(
    catalogSource,
    /runtimeManifest\.catalog_version\s*!==\s*"runtime-stage-catalog-v4\.0\.0"/u,
  );
  assert.match(serviceSource, /loadM2P4ProductQualityRuntimeStageCatalog/u);
  assert.equal(readJson(capabilitiesPath).active_runtime, "v4");
  assert.equal(readJson(capabilitiesPath).active_runtime_activated, false);
});

await check("recorded Human matrix is complete at desktop 399 and 320", () => {
  const matrix = readJson(reviewMatrixPath);
  assert.equal(matrix.schema_version, `${taskId.toLowerCase()}-review-matrix-v1`);
  assert.equal(matrix.task_id, taskId);
  assert.equal(matrix.status, "accepted_complete");
  assert.equal(matrix.baseline, baseline);
  assert.deepEqual(matrix.viewports, [
    { id: "desktop", width_px: null, status: "PASS" },
    { id: "mobile_399", width_px: 399, status: "PASS" },
    { id: "mobile_320", width_px: 320, status: "PASS" },
  ]);
  assertAllTrue(matrix.observed_width_findings);
  assert.equal(matrix.human_visual_review.status, "PASS");
  assert.equal(matrix.human_visual_review.disposition, "accepted_complete");
});

await check("320px ordinary and Kansai cases plus expanded plan PASS", () => {
  const matrix = readJson(reviewMatrixPath);
  assert.deepEqual(matrix.mobile_320_cases, [
    {
      fixture_id: "ordinary_reply_waiting",
      status: "PASS",
      findings: [
        "cover_readable",
        "answer_stacked",
        "opening_letter_readable",
        "situation_reading_readable",
        "unknowns_readable",
        "action_and_reassessment_readable",
      ],
    },
    {
      fixture_id: "kansai_persona_draft",
      status: "PASS",
      findings: [
        "dialect_preserved",
        "line_break_preserved",
        "emoji_preserved",
        "draft_readable",
        "copy_button_usable",
      ],
    },
  ]);
  assert.deepEqual(matrix.expanded_plan_narrow_behavior, {
    status: "PASS",
    finding:
      "No horizontal-overflow or structural blocker observed in responsive review evidence.",
  });

  const human = readJson(humanReviewPath);
  assert.equal(human.status, "PASS");
  assert.equal(human.review_complete, true);
  assert.deepEqual(human.reviewed_widths, {
    desktop: "PASS",
    mobile_399: "PASS",
    mobile_320: "PASS",
  });
  assertAllTrue(human.at_observed_widths);
  assert.equal(human.mobile_320_observations.ordinary_reply_waiting.status, "PASS");
  assert.equal(human.mobile_320_observations.kansai_persona_draft.status, "PASS");
  assert.equal(
    human.expanded_plan_narrow_behavior.horizontal_overflow_blocker_observed,
    false,
  );
  assert.equal(
    human.expanded_plan_narrow_behavior.structural_blocker_observed,
    false,
  );
});

await check("keyboard copy announcements zoom and reduced motion PASS", () => {
  const matrix = readJson(reviewMatrixPath);
  const human = readJson(humanReviewPath);
  assert.deepEqual(matrix.interaction_accessibility, interactionResults);
  assert.deepEqual(human.interaction_accessibility_results, interactionResults);
  assertAllTrue(matrix.automated_evidence_retained);
  assertAllTrue(human.automated_evidence_retained);
  assert.equal(matrix.formal_wcag_certification_claimed, false);
  assert.equal(human.formal_wcag_certification_claimed, false);
});

await check("ChatGPT Visual Review PASS with non-blocking observations", () => {
  const review = readJson(reviewMatrixPath).chatgpt_visual_review;
  assert.equal(review.status, "PASS");
  assert.deepEqual(review.accepted_findings, chatgptAcceptedFindings);
  assert.deepEqual(
    review.minor_non_blocking_product_observations,
    chatgptMinorObservations,
  );
  assert.equal(review.ui_blockers, false);
});

await check("Product Owner experience accepted for UI and synthetic experience", () => {
  const matrix = readJson(reviewMatrixPath);
  const review = readJson(productOwnerReviewPath);
  assert.equal(review.status, "accepted");
  assert.equal(review.product_owner_experience_review_complete, true);
  assert.equal(
    review.disposition,
    "accepted_for_customer_note_ui_and_synthetic_experience",
  );
  assert.deepEqual(review.accepted_dimensions, productOwnerAcceptedDimensions);
  assert.deepEqual(review.considered_result, ["\u7d50\u69cb\u6e80\u8db3", "\u7d50\u69cb\u3044\u3044\u611f\u3058"]);
  assert.equal(review.direction_decision, "continue_with_this_direction");
  assert.deepEqual(matrix.product_owner_experience_review, {
    complete: true,
    disposition: "accepted_for_customer_note_ui_and_synthetic_experience",
  });
});

await check("visual JPY980 plausibility true and final readiness false", () => {
  const review = readJson(productOwnerReviewPath);
  const readiness = review.readiness_distinction;
  assert.equal(readiness.visual_jpy980_plausibility_established, true);
  assert.equal(
    readiness.synthetic_customer_note_product_experience_accepted,
    true,
  );
  assert.equal(readiness.final_jpy980_readiness_established, false);
  assert.deepEqual(readiness.final_readiness_open_reasons, finalReadinessOpenReasons);
});

await check("Existing Package C is next and remains unauthorized", () => {
  const review = readJson(productOwnerReviewPath);
  assert.equal(review.next_product_work.package, "Existing Package C");
  assert.equal(
    review.next_product_work.successor,
    "PB-05 factual precision and anxiety-safe writing successor",
  );
  assert.deepEqual(review.next_product_work.goals, packageCGoals);
  assert.equal(review.next_product_work.implementation_authorized, false);
});

await check("R2 acceptance and capabilities are exact", () => {
  const matrix = readJson(reviewMatrixPath);
  assert.deepEqual(matrix.acceptance, {
    r2_a: "ACCEPTED COMPLETE",
    r2_a_r1: "ACCEPTED COMPLETE",
    r2_b: "ACCEPTED COMPLETE",
    r2_b_r1: "ACCEPTED COMPLETE",
    r2_c: "HUMAN / CHATGPT / PRODUCT OWNER ACCEPTED COMPLETE",
    customer_assessment_note_ui: "ACCEPTED COMPLETE",
  });

  const capabilities = readJson(capabilitiesPath);
  const expectedCapabilities = {
    status: "r2_customer_note_ui_accepted_next_package_c_pending_authorization",
    baseline,
    r2_a_accepted: true,
    r2_a_r1_accepted: true,
    r2_b_accepted: true,
    r2_b_r1_accepted: true,
    r2_c_review_complete: true,
    human_visual_review_complete: true,
    chatgpt_visual_review_complete: true,
    product_owner_experience_review_complete: true,
    desktop_pass: true,
    mobile_399_pass: true,
    mobile_320_pass: true,
    keyboard_pass: true,
    copy_success_pass: true,
    copy_failure_pass: true,
    copy_success_announcement_pass: true,
    copy_failure_announcement_pass: true,
    zoom_200_pass: true,
    reduced_motion_pass: true,
    customer_note_ui_accepted: true,
    synthetic_product_experience_accepted: true,
    visual_jpy980_plausibility_established: true,
    final_jpy980_readiness_established: false,
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    existing_package_c_authorized: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    r4_authorized: false,
    c2_authorized: false,
    next_action: "human_chatgpt_acceptance_of_r2_c_then_package_c_authorization",
  };
  for (const [key, value] of Object.entries(expectedCapabilities)) {
    assert.deepEqual(capabilities[key], value, key);
  }
});

await check("review document records exact dispositions and boundaries", () => {
  const document = readText(reviewDocumentPath);
  const requiredPhrases = [
    "HUMAN VISUAL ACCEPTED COMPLETE",
    "ChatGPT Visual Review",
    "accepted_for_customer_note_ui_and_synthetic_experience",
    "\u7d50\u69cb\u6e80\u8db3",
    "\u7d50\u69cb\u3044\u3044\u611f\u3058",
    "visual_jpy980_plausibility_established: true",
    "synthetic_customer_note_product_experience_accepted: true",
    "final_jpy980_readiness_established: false",
    "HUMAN / CHATGPT / PRODUCT OWNER ACCEPTED COMPLETE",
    "PB-05 factual precision and anxiety-safe writing successor",
    "Provider / DB / Supabase operations are `0 / 0 / 0`",
    "Active Runtime remains v4",
    "No PR, main merge, migration, amend, or force push",
  ];
  for (const phrase of requiredPhrases) assert.ok(document.includes(phrase), phrase);
  assert.doesNotMatch(
    document,
    /final_jpy980_readiness_established:\s*true/u,
  );
});

await check("Provider DB Supabase and successor authorities remain zero false", () => {
  const capabilities = readJson(capabilitiesPath);
  const productOwner = readJson(productOwnerReviewPath);
  assert.equal(capabilities.provider_calls, 0);
  assert.equal(capabilities.db_operations, 0);
  assert.equal(capabilities.supabase_operations, 0);
  assert.equal(capabilities.existing_package_c_authorized, false);
  assert.equal(capabilities.provider_rerun_authorized, false);
  assert.equal(capabilities.active_runtime_activated, false);
  assert.equal(capabilities.r4_authorized, false);
  assert.equal(capabilities.c2_authorized, false);
  assert.equal(capabilities.pull_request_created, false);
  assert.equal(capabilities.main_merged, false);
  assert.equal(capabilities.force_push_used, false);
  assert.equal(productOwner.authority_boundary.provider_rerun_authorized, false);
  assert.equal(productOwner.authority_boundary.active_runtime_activated, false);
  assert.equal(productOwner.authority_boundary.r4_authorized, false);
  assert.equal(productOwner.authority_boundary.c2_authorized, false);
  assert.equal(productOwner.authority_boundary.final_jpy980_readiness_claimed, false);
});

await check("git diff --check PASS", () => {
  git(["diff", "--check", baseline, "--"]);
  for (const candidate of exactScope) {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  }
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  `Human visual and product experience review verifier: ${
    failed.length === 0 ? "PASS" : "FAIL"
  } ${checks.length - failed.length}/${checks.length}`,
);
console.log(`Exact review scope: ${exactScope.length}/6; new 6; updated 0`);
console.log("Human viewports: desktop PASS / 399 PASS / 320 PASS");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("Final JPY980 readiness established: false");
if (failed.length > 0) process.exitCode = 1;
