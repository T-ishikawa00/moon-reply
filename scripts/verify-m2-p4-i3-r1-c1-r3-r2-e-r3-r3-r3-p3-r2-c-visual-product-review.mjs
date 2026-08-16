import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-C";
const baseline = "fa956b9b1941c73f8e1767c64ab24f07fadd36c6";
const r2AAcceptance = "1229627588e3c6ccd41ea7ea32751b8b8ac79c6e";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r2-authorized-visual-product";
const r2BBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r2-authorized-reassuring-note";
const historicalBranch =
  "review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-visual-product";
const historicalCommit = "df3c707ec7f567120d28f0ce164ef42916e61c63";

const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c";
const reviewMatrixPath = packageRoot + "/review-matrix-v1.json";
const humanReviewPath = packageRoot + "/human-visual-review-v1.json";
const productOwnerReviewPath = packageRoot + "/product-owner-review-v1.json";
const capabilitiesPath = packageRoot + "/capabilities-v1.json";
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

const immutableSnapshot = {
  "components/runtime/CustomerAssessmentNote.tsx":
    "590ae209072f98eae32f1b705753944d941f0629",
  "components/runtime/CustomerAssessmentNote.module.css":
    "7b0d68bacbb9044ed7f1e3aa5adb520220b0f81c",
  "components/runtime/CustomerDraftCopyButton.tsx":
    "ca53d7b11fb3b1799003df735f1903572d196752",
  "app/review/runtime/v12/page.tsx":
    "698629e0e6543fcd6dc8aa6438de39108807a0d0",
  "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts":
    "7748de655a09b06e2fa70e3de0dc0c8a69b8bdc7",
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts":
    "584850c1df7c8b759693cc635045daaee2fd52af",
  "lib/assessment/runtime/customer-assessment-projection-v1.ts":
    "4ef5edde8a2e22c9cb28624ec733a9e6de6826d5",
  "lib/assessment/runtime/types.ts":
    "2b9fba25b7df8232b0aa85230ee4aa12634fda34",
};

const additionalProtectedPaths = [
  "next-env.d.ts",
  "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
  "lib/assessment/runtime/runtime-result-normalization-v1.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "components/runtime/RuntimeAssessmentNote.tsx",
  "app/api/internal/assessments/route.ts",
];

const expectedCases = [
  ["simple", "simple_business_reply_with_draft"],
  ["emotional", "ordinary_reply_waiting"],
  ["null_optional", "nullable_optional_sections"],
  ["polite_draft", "polite_thank_you_with_draft"],
  ["persona_preserved", "kansai_persona_draft"],
];

const expectedChecks = [
  ["desktop_1440", "PASS"],
  ["mobile_399", "PASS"],
  ["mobile_320", "PASS"],
  ["keyboard", "PARTIAL"],
  ["browser_zoom_200", "NOT_AUTOMATED"],
  ["copy_success", "PASS"],
  ["copy_failure", "STATIC_ONLY"],
  ["details_behavior", "PASS"],
  ["reduced_motion", "STATIC_ONLY"],
];

const productQuestions = [
  "personally_understood",
  "emotionally_reassuring_without_false_certainty",
  "amount_of_content_appropriate",
  "semantic_repetition_acceptable",
  "draft_useful_when_present",
  "action_clear",
  "feels_like_paid_assessment_not_ai_answer",
  "plausibly_worth_jpy980",
];

const closedAuthority = {
  jpy980RuntimeReadiness: "not_established",
  globalQ0Completion: false,
  providerQualityEstablished: false,
  activeRuntimeActivationAuthorized: false,
  productionRuntimeAuthorized: false,
  paymentImplementationAuthorized: false,
  productionPaymentAuthorized: false,
  mainIntegrationAuthorized: false,
};

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      ...options,
    },
  ).trim();
}

function remoteHead(branchName) {
  const output = git([
    "ls-remote",
    "--heads",
    "origin",
    "refs/heads/" + branchName,
  ]);
  const rows = output.split(/\r?\n/u).filter(Boolean);
  assert.equal(rows.length, 1, branchName);
  return rows[0].split(/\s+/u)[0];
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

function readText(relativePath) {
  const buffer = readFileSync(path.join(root, relativePath));
  return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function assertBaselineBlobUnchanged(relativePath) {
  assert.equal(
    git(["hash-object", "--path=" + relativePath, relativePath]),
    git(["rev-parse", baseline + ":" + relativePath]),
    relativePath,
  );
}

function assertAllPendingAndNull(record, ignoredKeys = []) {
  for (const [key, value] of Object.entries(record)) {
    if (ignoredKeys.includes(key)) continue;
    if (key === "status") assert.equal(value, "PENDING", key);
    else assert.equal(value, null, key);
  }
}

const checks = [];

async function check(name, assertion) {
  try {
    await assertion();
    checks.push({ name, passed: true });
    console.log("PASS " + name);
  } catch (error) {
    checks.push({ name, passed: false });
    console.error("FAIL " + name);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact branch parent R2-B authority main and stash", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), r2AAcceptance);
  assert.equal(git(["rev-parse", r2BBranch]), baseline);
  assert.equal(git(["rev-parse", "origin/" + r2BBranch]), baseline);
  assert.equal(remoteHead(r2BBranch), baseline);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const commitCount = Number(git(["rev-list", "--count", baseline + ".." + head]));
  assert.ok(commitCount === 0 || commitCount === 1);
  if (commitCount === 1) {
    assert.equal(git(["rev-parse", head + "^"]), baseline);
    assert.equal(
      git(["show", "-s", "--format=%s", head]),
      "docs: prepare authorized R2-C visual product review",
    );
  }
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact R2-C scope 6/6 all new", () => {
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
  assert.equal(actual.length, 6);
  assert.deepEqual(sorted(actual.map((item) => item.path)), sorted(exactScope));
  assert.equal(actual.every((item) => item.status === "A"), true);
  for (const candidate of exactScope) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), false, candidate);
  }
});

await check("strict UTF-8 JSON validity and sensitive scan", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:SUPABASE|OPENAI)_[A-Z_]*(?:KEY|SECRET)\s*[:=]\s*["'][^"']+["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  for (const candidate of exactScope) {
    const source = readText(candidate);
    assert.equal(source.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(source, /[\t ]+$/gmu, candidate);
    for (const pattern of secretPatterns) {
      assert.doesNotMatch(source, pattern, candidate);
    }
  }
  readJson(reviewMatrixPath);
  readJson(humanReviewPath);
  readJson(productOwnerReviewPath);
  readJson(capabilitiesPath);
});

await check("R2-B Product V2 V1 Full Report and runtime blobs unchanged", () => {
  for (const candidate of Object.keys(immutableSnapshot)) {
    assertBaselineBlobUnchanged(candidate);
  }
  for (const candidate of additionalProtectedPaths) {
    assertBaselineBlobUnchanged(candidate);
  }
});

await check("immutable snapshot manifest is exact", () => {
  const matrix = readJson(reviewMatrixPath);
  const recorded = Object.fromEntries(
    matrix.immutable_product_snapshot.map((item) => [item.path, item.git_blob]),
  );
  assert.deepEqual(recorded, immutableSnapshot);
  for (const [relativePath, blob] of Object.entries(immutableSnapshot)) {
    assert.equal(git(["rev-parse", baseline + ":" + relativePath]), blob);
  }
});

await check("all five review categories and URLs are exact", () => {
  const matrix = readJson(reviewMatrixPath);
  const human = readJson(humanReviewPath);
  assert.deepEqual(
    matrix.cases.map((item) => [item.category, item.fixture_id]),
    expectedCases,
  );
  assert.deepEqual(
    human.case_reviews.map((item) => [item.category, item.fixture_id]),
    expectedCases,
  );
  for (const item of matrix.cases) {
    assert.equal(
      item.relative_url,
      "/review/runtime/v12?fixture=" + item.fixture_id,
    );
    const parsed = new URL(item.local_url);
    assert.equal(parsed.origin, "http://127.0.0.1:3102");
    assert.equal(parsed.pathname, "/review/runtime/v12");
    assert.equal(parsed.searchParams.get("fixture"), item.fixture_id);
    assert.ok(item.review_focus.length >= 2, item.category);
  }
});

await check("all nine review checks have bounded technical evidence", () => {
  const matrix = readJson(reviewMatrixPath);
  assert.deepEqual(
    matrix.review_checks.map((item) => [item.id, item.technical_status]),
    expectedChecks,
  );
  for (const item of matrix.review_checks) {
    assert.equal(item.human_status, "PENDING", item.id);
  }
  assert.equal(matrix.automated_measurement_summary.page_viewport_combinations, 15);
  assert.equal(
    matrix.automated_measurement_summary.all_five_fixture_urls_loaded,
    true,
  );
  assert.equal(
    matrix.automated_measurement_summary.human_visual_or_product_pass_inferred,
    false,
  );
  assert.deepEqual(matrix.automated_measurement_summary.primary_section_counts, {
    simple: 5,
    emotional: 4,
    null_optional: 4,
    polite_draft: 6,
    persona_preserved: 5,
  });
});

await check("responsive technical measurements do not claim Human quality", () => {
  const matrix = readJson(reviewMatrixPath);
  for (const id of ["desktop_1440", "mobile_399", "mobile_320"]) {
    const item = matrix.review_checks.find((candidate) => candidate.id === id);
    assert.equal(item.evidence.cases_measured, 5, id);
    assert.equal(item.evidence.document_horizontal_overflow, false, id);
    assert.equal(item.evidence.note_outside_viewport, false, id);
    assert.equal(item.evidence.adjacent_primary_content_overlap, false, id);
    assert.equal(item.evidence.human_visual_quality_judgment_recorded, false, id);
  }
});

await check("copy details focus reduced motion and route guards remain present", () => {
  const copySource = readText(
    "components/runtime/CustomerDraftCopyButton.tsx",
  );
  const noteSource = readText("components/runtime/CustomerAssessmentNote.tsx");
  const cssSource = readText(
    "components/runtime/CustomerAssessmentNote.module.css",
  );
  const routeSource = readText("app/review/runtime/v12/page.tsx");
  assert.match(copySource, /navigator\.clipboard\.writeText\(text\)/u);
  assert.match(
    copySource,
    /コピーできませんでした。文面を選択してコピーしてください。/u,
  );
  assert.match(copySource, /aria-live="polite"/u);
  assert.match(noteSource, /<details\s+className=/u);
  assert.doesNotMatch(noteSource, /<details[^>]*\sopen(?:=|\s|>)/u);
  assert.match(cssSource, /\.copyButton:focus-visible/u);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.match(cssSource, /transition:\s*none/u);
  assert.match(routeSource, /M2_INTERNAL_RUNTIME_ENABLED\s*!==\s*"true"/u);
  assert.match(routeSource, /notFound\(\)/u);
  assert.match(routeSource, /index:\s*false/u);
  assert.match(routeSource, /follow:\s*false/u);
});

await check("Human visual judgments remain pending and null", () => {
  const human = readJson(humanReviewPath);
  assert.equal(human.status, "PENDING");
  assert.equal(human.review_complete, false);
  assert.equal(human.reviewer, null);
  assert.equal(human.reviewed_at, null);
  for (const record of Object.values(human.viewport_reviews)) {
    assertAllPendingAndNull(record);
  }
  for (const record of human.case_reviews) {
    assert.equal(record.status, "PENDING", record.category);
    assertAllPendingAndNull(record, [
      "category",
      "fixture_id",
      "url",
      "status",
    ]);
  }
  for (const record of Object.values(human.interaction_reviews)) {
    assertAllPendingAndNull(record);
  }
  assert.equal(human.overall_visual_verdict, null);
  assert.equal(human.disposition, "PENDING");
  assert.equal(readText(humanReviewPath).includes('"PASS"'), false);
});

await check("Human Product questions remain pending and null", () => {
  const review = readJson(productOwnerReviewPath);
  assert.equal(review.status, "PENDING");
  assert.equal(review.review_complete, false);
  assert.equal(review.reviewer, null);
  assert.equal(review.reviewed_at, null);
  assert.deepEqual(
    review.case_reviews.map((item) => [item.category, item.fixture_id]),
    expectedCases,
  );
  for (const item of review.case_reviews) {
    assert.equal(item.status, "PENDING", item.category);
    for (const question of productQuestions) {
      assert.equal(item[question], null, item.category + "." + question);
    }
    assert.equal(item.notes, null, item.category + ".notes");
  }
  assert.deepEqual(review.overall, {
    experienceProductJudgment: "pending",
    verdict: null,
    notes: null,
  });
  assert.equal(readText(productOwnerReviewPath).includes('"PASS"'), false);
});

await check("R2-B acceptance and R2-C preparation authority are exact", () => {
  const matrix = readJson(reviewMatrixPath);
  const capabilities = readJson(capabilitiesPath);
  assert.equal(matrix.task_id, taskId);
  assert.equal(matrix.review_target_commit, baseline);
  assert.deepEqual(matrix.authority, {
    r2_a_acceptance_r2_b_authorization: r2AAcceptance,
    r2_b_chatgpt_technical_review: "PASS_COMPLETE",
    r2_b_human_acceptance: "complete",
    r2_b_acceptance: "complete",
    r2_b_acceptance_date: "2026-08-16",
    decision_source: "current_human_decision",
    r2_c_execution_review_preparation_authorized: true,
    r2_c_human_product_verdict: "pending",
  });
  assert.equal(capabilities.review_target_commit, baseline);
  assert.equal(
    capabilities.r2_a_acceptance_r2_b_authorization,
    r2AAcceptance,
  );
  assert.equal(capabilities.r2_b_chatgpt_technical_review_complete, true);
  assert.equal(capabilities.r2_b_human_acceptance_complete, true);
  assert.equal(capabilities.r2_b_acceptance_complete, true);
  assert.equal(capabilities.r2_b_acceptance_date, "2026-08-16");
  assert.equal(capabilities.r2_c_execution_review_preparation_authorized, true);
  assert.equal(capabilities.r2_c_review_package_prepared, true);
  assert.equal(capabilities.r2_c_human_visual_review_complete, false);
  assert.equal(capabilities.r2_c_human_product_review_complete, false);
  assert.equal(capabilities.experienceProductJudgment, "pending");
});

await check("JPY980 Global Q0 Provider Runtime Payment and main remain closed", () => {
  const matrixBoundary = readJson(reviewMatrixPath).review_boundary;
  const productBoundary = readJson(productOwnerReviewPath).authority_boundary;
  const capabilities = readJson(capabilitiesPath);
  for (const [key, value] of Object.entries(closedAuthority)) {
    assert.deepEqual(matrixBoundary[key], value, "matrix." + key);
    assert.deepEqual(productBoundary[key], value, "product." + key);
    assert.deepEqual(capabilities[key], value, "capabilities." + key);
  }
  assert.equal(matrixBoundary.r2_c_human_visual_review_complete, false);
  assert.equal(matrixBoundary.r2_c_human_product_review_complete, false);
  assert.equal(matrixBoundary.experienceProductJudgment, "pending");
  assert.equal(
    readJson(productOwnerReviewPath).maximum_positive_meaning
      .experienceProductJudgment,
    "plausibly_worth_jpy980",
  );
});

await check("historical R2-C and main refs remain unchanged", () => {
  assert.equal(git(["rev-parse", historicalBranch]), historicalCommit);
  assert.equal(
    git(["rev-parse", "origin/" + historicalBranch]),
    historicalCommit,
  );
  assert.equal(remoteHead(historicalBranch), historicalCommit);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.deepEqual(readJson(reviewMatrixPath).historical_reference, {
    branch: historicalBranch,
    commit: historicalCommit,
    mode: "read_only",
    human_pass_values_reused: false,
    mutated: false,
  });
  assert.equal(readJson(capabilitiesPath).historical_r2_c_changed, false);
});

await check("no Provider DB Supabase Product Runtime or Payment mutation", () => {
  const capabilities = readJson(capabilitiesPath);
  assert.equal(capabilities.product_implementation_changed, false);
  assert.equal(capabilities.experience_projection_v2_changed, false);
  assert.equal(capabilities.customer_assessment_projection_v1_changed, false);
  assert.equal(capabilities.full_report_changed, false);
  assert.equal(capabilities.provider_calls, 0);
  assert.equal(capabilities.db_operations, 0);
  assert.equal(capabilities.supabase_operations, 0);
  assert.equal(capabilities.runtime_changes, false);
  assert.equal(capabilities.payment_changes, false);
  assert.equal(capabilities.pull_request_created, false);
  assert.equal(capabilities.main_merged, false);
  assert.equal(capabilities.force_push_used, false);
  assert.equal(capabilities.exact_scope, "6/6 NEW only");
  for (const candidate of exactScope) {
    const source = readText(candidate);
    assert.doesNotMatch(source, /from\s+["'](?:openai|@supabase\/)/u);
    assert.doesNotMatch(source, /\bcreateClient\s*\(/u);
  }
});

await check("review document provides URLs methods and pending boundary", () => {
  const source = readText(reviewDocumentPath);
  const requiredPhrases = [
    baseline,
    r2AAcceptance,
    expectedBranch,
    expectedMain,
    historicalCommit,
    "R2-C Human Visual verdict: PENDING",
    "R2-C Human Product verdict: PENDING",
    "experienceProductJudgment",
    "http://127.0.0.1:3102/review/runtime/v12",
    "desktop at 1440 CSS pixels wide",
    "399 x 900",
    "320 x 900",
    "browser zoom to 200%",
    "Copy success and failure",
    "Details behavior",
    "Reduced motion",
    "Provider / DB / Supabase:",
    "0 / 0 / 0",
    "jpy980RuntimeReadiness = not_established",
    "globalQ0Completion = false",
    "6/6 NEW only",
  ];
  for (const phrase of requiredPhrases) {
    assert.ok(source.includes(phrase), phrase);
  }
  for (const [, fixtureId] of expectedCases) {
    assert.ok(source.includes("?fixture=" + fixtureId), fixtureId);
  }
  assert.ok(source.includes("Human fields remain null or PENDING"));
  assert.ok(source.includes("PASS values were not reused"));
  assert.ok(source.includes("Automated PASS does not populate or imply a Human verdict"));
});

await check("git diff check and next-env drift remain zero", () => {
  git(["diff", "--check", baseline, "--"]);
  assertBaselineBlobUnchanged("next-env.d.ts");
  assert.equal(git(["diff", "--name-only", "--", "next-env.d.ts"]), "");
  for (const candidate of exactScope) {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  }
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  "Authorized R2-C visual product review preparation verifier: " +
    (failed.length === 0 ? "PASS" : "FAIL") +
    " " +
    (checks.length - failed.length) +
    "/" +
    checks.length,
);
console.log("Exact R2-C scope: 6/6; new 6; updated 0");
console.log("Review categories / checks: 5/5 / 9/9");
console.log("Human Visual / Product verdict: PENDING / PENDING");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("JPY980 Runtime readiness: not_established");
console.log("Global Q0: false");
console.log("next-env.d.ts drift: 0");
if (failed.length > 0) {
  console.error(
    "Failed checks: " + failed.map((item) => item.name).join("; "),
  );
  process.exitCode = 1;
}
