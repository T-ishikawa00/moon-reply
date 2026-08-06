import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-A";
const baseline = "a5b2defa1bb765d46076a28ca9827d494fcbe433";
const expectedParent = "fdbdf808f135655084de32aec2e57473c1beaf31";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a";

const implementationPath =
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
const projectionContractPath = `${packageRoot}/projection-contract-v1.json`;
const fixturePath = `${packageRoot}/projection-fixtures-v1.json`;
const offlineResultPath = `${packageRoot}/offline-results-v1.json`;
const capabilitiesPath = `${packageRoot}/capabilities-v1.json`;
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection.mjs";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_A_REVIEW.md";
const exactScope = [
  implementationPath,
  projectionContractPath,
  fixturePath,
  offlineResultPath,
  capabilitiesPath,
  verifierPath,
  reviewDocumentPath,
];
const jsonPaths = [
  projectionContractPath,
  fixturePath,
  offlineResultPath,
  capabilitiesPath,
];

const v1ProjectionPath =
  "lib/assessment/runtime/customer-assessment-projection-v1.ts";
const v1ContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/projection-contract-v1.json";
const normalizationPath =
  "lib/assessment/runtime/runtime-result-normalization-v1.ts";
const deliveryPath = "lib/assessment/runtime/customer-assessment-delivery-v1.ts";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";
const p3Root =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1";
const productDoctrinePath = `${p3Root}/product-doctrine-v1.json`;
const implementationPackagesPath = `${p3Root}/implementation-packages-v1.json`;
const frozenDiagnosticPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-results-v1.json";

const productDoctrineScope = [
  `${p3Root}/product-doctrine-v1.json`,
  `${p3Root}/product-doctrine-v1.md`,
  `${p3Root}/experience-projection-gap-v1.json`,
  `${p3Root}/experience-section-architecture-v1.json`,
  `${p3Root}/human-visual-review-v1.json`,
  `${p3Root}/implementation-packages-v1.json`,
  `${p3Root}/capabilities-v1.json`,
];

const packageAScope = [
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "app/api/internal/assessments/route.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  normalizationPath,
  v1ProjectionPath,
  deliveryPath,
  "components/runtime/RuntimeAssessmentProjectionPreview.tsx",
  v1ContractPath,
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/projection-fixtures-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-runtime-projection.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P2_REVIEW.md",
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

const activeRuntimeProtectedPaths = [
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  v1ProjectionPath,
  deliveryPath,
  "components/runtime/RuntimeAssessmentNote.tsx",
];

const forbiddenProjectionKeys = new Set([
  "case_id",
  "caseId",
  "fixture_id",
  "fixtureId",
  "request_id",
  "requestId",
  "run_id",
  "runId",
  "provider_response_id",
  "providerResponseId",
  "response_id",
  "responseId",
  "usage",
  "diagnostic_verdict",
  "diagnosticVerdict",
  "machine_verdict",
  "machineVerdict",
  "stage",
  "stages",
  "stage_data",
  "stageData",
  "fact_id",
  "factId",
  "decision_reason_fact_ids",
  "supporting_fact_ids",
  "trigger_fact_ids",
  "unknown_code",
  "material_to",
  "report",
]);

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", ...options },
  ).trim();
}

function gitBuffer(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, maxBuffer: 32 * 1024 * 1024 },
  );
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

function clone(value) {
  return structuredClone(value);
}

function deepFreeze(value) {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function pointerSegments(pointer) {
  assert.match(pointer, /^\/(?:[^/]+(?:\/[^/]+)*)?$/u);
  return pointer
    .slice(1)
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/gu, "/").replace(/~0/gu, "~"));
}

function applyPatches(value, patches) {
  const target = clone(value);
  for (const patchRecord of patches) {
    const segments = pointerSegments(patchRecord.path);
    assert.ok(segments.length > 0);
    let parent = target;
    for (const segment of segments.slice(0, -1)) parent = parent[segment];
    const key = segments.at(-1);
    assert.equal(patchRecord.op, "replace");
    assert.ok(Object.prototype.hasOwnProperty.call(parent, key));
    parent[key] = clone(patchRecord.value);
  }
  return target;
}

function parseStatusPaths() {
  const records = gitBuffer([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ])
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  return records.map((record) => ({ status: record.slice(0, 2), path: record.slice(3) }));
}

function assertBaselineBlobUnchanged(relativePath) {
  assert.equal(
    git(["hash-object", relativePath]),
    git(["rev-parse", `${baseline}:${relativePath}`]),
    relativePath,
  );
}

function containsForbiddenKey(value) {
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value).some(
    ([key, child]) => forbiddenProjectionKeys.has(key) || containsForbiddenKey(child),
  );
}

function experienceStrings(value) {
  return [
    value.openingLine,
    ...value.openingLetter,
    ...value.situationReading,
    ...value.possibleInterpretations,
    ...value.materialUnknowns,
    ...(value.draftContext === null ? [] : [value.draftContext]),
    ...value.actionRationales,
    ...value.closingLines,
    ...value.consultationLimitations,
  ];
}

const checks = [];
function check(name, action) {
  try {
    action();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, error });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  }
}

const fixtures = readJson(fixturePath);
const sourceFixtures = readJson(fixtures.template_source);
const projectionContract = readJson(projectionContractPath);
const offlineResults = readJson(offlineResultPath);
const capabilities = readJson(capabilitiesPath);
const p1SourceContract = readJson(p1SourceContractPath);
const frozenDiagnostic = readJson(frozenDiagnosticPath);
const productDoctrine = readJson(productDoctrinePath);
const implementationPackages = readJson(implementationPackagesPath);

const v1Projection = await import(
  pathToFileURL(path.join(root, v1ProjectionPath)).href
);
const experienceProjection = await import(
  pathToFileURL(path.join(root, implementationPath)).href
);

function instantiate(fixture) {
  const template = sourceFixtures.result_templates[fixture.base_result];
  assert.ok(template, fixture.base_result);
  return applyPatches(template, fixture.result_patches ?? []);
}

function expectedExperienceMapping(report) {
  const selected = new Set(report.decisionPlan.decision_reason_fact_ids);
  return {
    openingLine: report.content.cover_line,
    openingLetter: [...report.content.short_letter],
    situationReading: report.content.observed_fact_commentary
      .filter((item) => selected.has(item.fact_id))
      .map((item) => item.commentary),
    possibleInterpretations: [...report.content.possible_interpretations],
    materialUnknowns:
      report.schemaVersion === "m2-p3-runtime-report-v1"
        ? [...report.decisionPlan.material_unknowns]
        : report.decisionPlan.material_unknowns.map((item) => item.summary),
    draftContext: report.content.message_draft_context,
    actionRationales: [...report.content.action_rationales],
    closingLines: [...report.content.closing_lines],
    consultationLimitations:
      report.schemaVersion === "m2-p3-runtime-report-v1"
        ? [...report.decisionPlan.limitations]
        : [...report.decisionPlan.model_generated_limitations],
  };
}

function projectionForFamily(family) {
  const fixture = fixtures.positive_fixtures.find((candidate) =>
    family === "legacy"
      ? candidate.fixture_id === "legacy_full_experience"
      : candidate.fixture_id === "split_full_experience",
  );
  const readyResult = instantiate(fixture);
  return experienceProjection.projectCustomerAssessmentExperienceV2(
    readyResult,
    fixture.requested_topics,
  );
}

function mutateNegative(base, mutation) {
  const target = clone(base);
  switch (mutation) {
    case "missing_openingLine":
      delete target.openingLine;
      break;
    case "empty_openingLine":
      target.openingLine = "";
      break;
    case "missing_openingLetter":
      delete target.openingLetter;
      break;
    case "empty_openingLetter":
      target.openingLetter = [];
      break;
    case "extra_top_level_key":
      target.unexpected = true;
      break;
    case "embedded_report":
      target.report = {};
      break;
    case "fact_id_key":
      target.fact_id = "internal";
      break;
    case "decision_reason_fact_ids_key":
      target.decision_reason_fact_ids = [];
      break;
    case "unknown_code_key":
      target.unknown_code = "internal";
      break;
    case "invalid_base_projection":
      target.baseProjection.projectionSchemaVersion = "invalid-v1";
      break;
    case "legacy_materialUnknowns_13":
      target.materialUnknowns = Array.from({ length: 13 }, (_, index) => `不明${index}`);
      break;
    case "legacy_consultationLimitations_0":
      target.consultationLimitations = [];
      break;
    case "legacy_consultationLimitations_9":
      target.consultationLimitations = Array.from(
        { length: 9 },
        (_, index) => `制約${index}`,
      );
      break;
    case "split_materialUnknowns_5":
      target.materialUnknowns = Array.from({ length: 5 }, (_, index) => `不明${index}`);
      break;
    case "split_consultationLimitations_3":
      target.consultationLimitations = ["制約一", "制約二", "制約三"];
      break;
    case "malformed_draftContext":
      target.draftContext = 42;
      break;
    case "malformed_closingLines":
      target.closingLines = [""];
      break;
    case "unknown_sourceReportSchemaVersion":
      target.baseProjection.sourceReportSchemaVersion = "unknown-report-version";
      break;
    case "fact_id_in_openingLine":
      target.openingLine = "内部参照 F001 を表示する";
      break;
    case "decision_enum_in_closingLines":
      target.closingLines = ["内部値 reply_now を表示する"];
      break;
    default:
      assert.fail(`Unknown negative mutation: ${mutation}`);
  }
  return target;
}

check("exact branch baseline parent main and origin-main authority", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", `${baseline}^`]), expectedParent);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.ok(head === baseline || git(["rev-parse", `${head}^`]) === baseline);
});

check("exact implementation scope 7/7 and every path is new", () => {
  assert.equal(exactScope.length, 7);
  exactScope.forEach((candidate) => {
    assert.equal(existsSync(path.join(root, candidate)), true, candidate);
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), false, candidate);
  });
  const head = git(["rev-parse", "HEAD"]);
  const actualPaths =
    head === baseline
      ? parseStatusPaths().map((record) => record.path)
      : git(["diff", "--name-only", baseline, head]).split(/\r?\n/u).filter(Boolean);
  assert.deepEqual(sorted(actualPaths), sorted(exactScope));
  if (head === baseline) {
    parseStatusPaths().forEach((record) => assert.equal(record.status, "??"));
  } else {
    assert.equal(parseStatusPaths().length, 0);
  }
});

check("strict UTF-8 JSON validity U+FFFD zero secret zero", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:SUPABASE|OPENAI)_[A-Z_]*(?:KEY|SECRET)\s*[:=]\s*["'][^"']+["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
  ];
  for (const candidate of exactScope) {
    const text = readText(candidate);
    assert.equal(text.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(text, /[\t ]+$/gmu, candidate);
    secretPatterns.forEach((pattern) => assert.doesNotMatch(text, pattern, candidate));
  }
  jsonPaths.forEach(readJson);
});

check("Product Doctrine and projection authority sources unchanged", () => {
  assert.equal(productDoctrineScope.length, 7);
  productDoctrineScope.forEach(assertBaselineBlobUnchanged);
  assert.equal(productDoctrine.authority_boundary.provider_calls, 0);
  assert.equal(productDoctrine.authority_boundary.runtime_activation_authorized, false);
});

check("Package A R1 accepted authority 14/14 unchanged", () => {
  assert.equal(packageAScope.length, 14);
  packageAScope.forEach(assertBaselineBlobUnchanged);
  assertBaselineBlobUnchanged(v1ProjectionPath);
  assertBaselineBlobUnchanged(v1ContractPath);
});

check("Package B exact 10/10 unchanged", () => {
  assert.equal(packageBScope.length, 10);
  packageBScope.forEach(assertBaselineBlobUnchanged);
});

check("CustomerAssessmentDeliveryV1 and active Runtime v4 remain unchanged", () => {
  activeRuntimeProtectedPaths.forEach(assertBaselineBlobUnchanged);
  assert.match(
    readText("lib/assessment/runtime/schema-catalog.ts"),
    /runtime-stage-catalog-v4\.0\.0/u,
  );
  assert.match(
    readText("lib/assessment/runtime/service.ts"),
    /loadM2P4ProductQualityRuntimeStageCatalog/u,
  );
});

check("provider marker unchanged authorization consumed and rerun false", () => {
  const frozenState = p1SourceContract.frozen_state;
  const markerPath = path.join(root, frozenState.marker_path);
  const authorization = readJson(frozenState.authorization_path);
  assert.equal(existsSync(markerPath), true);
  assert.equal(sha256(readFileSync(markerPath)), frozenState.marker_raw_sha256);
  assert.equal(sha256(read(frozenState.authorization_path)), frozenState.authorization_raw_sha256);
  assert.equal(frozenState.authorization_consumed, true);
  assert.equal(frozenState.rerun_authorized, false);
  assert.equal(authorization.consumed, true);
  assert.equal(authorization.rerun_authorized, false);
});

check("V2 composes accepted V1 and contains no prohibited integration", () => {
  const source = readText(implementationPath);
  const projectFunctionSource = source.slice(
    source.indexOf("export function projectCustomerAssessmentExperienceV2"),
    source.indexOf("function assertCustomerAssessmentExperienceProjectionV2"),
  );
  assert.match(source, /requireReadyAssessmentResult\(readyResult\)/u);
  assert.match(source, /projectCustomerAssessmentV1\(/u);
  assert.match(source, /decodeCustomerAssessmentProjectionV1\(/u);
  assert.doesNotMatch(
    source,
    /(?:openai|supabase|schema-catalog|pipeline|transport|repository|fetch\s*\(|XMLHttpRequest|WebSocket)/iu,
  );
  assert.doesNotMatch(projectFunctionSource, /(?:case|fixture)[_-]?id/iu);
  assert.doesNotMatch(source, /CustomerAssessmentProjectionV1\s*=\s*\{/u);
});

check("exact legacy split mapping and source-order implementation", () => {
  const source = readText(implementationPath);
  for (const pattern of [
    /report\.content\.cover_line/u,
    /report\.content\.short_letter/u,
    /new Set\(report\.decisionPlan\.decision_reason_fact_ids\)/u,
    /report\.content\.observed_fact_commentary/u,
    /reasonFactIds\.has\(item\.fact_id\)/u,
    /\.map\(\(item\) => item\.commentary\)/u,
    /report\.content\.possible_interpretations/u,
    /report\.decisionPlan\.material_unknowns/u,
    /\.map\(\(item\) => item\.summary\)/u,
    /report\.content\.message_draft_context/u,
    /report\.content\.action_rationales/u,
    /report\.content\.closing_lines/u,
    /report\.decisionPlan\.limitations/u,
    /report\.decisionPlan\.model_generated_limitations/u,
  ]) {
    assert.match(source, pattern);
  }
});

check("projection contract exact shape limits doctrine and authorization boundary", () => {
  assert.equal(projectionContract.task_id, taskId);
  assert.equal(projectionContract.baseline, baseline);
  assert.equal(
    projectionContract.status,
    "experience_projection_v2_implemented_pending_human_chatgpt_review",
  );
  assert.deepEqual(projectionContract.projection.top_level_keys, [
    "projectionSchemaVersion",
    "baseProjection",
    "openingLine",
    "openingLetter",
    "situationReading",
    "possibleInterpretations",
    "materialUnknowns",
    "draftContext",
    "actionRationales",
    "closingLines",
    "consultationLimitations",
  ]);
  assert.equal(projectionContract.decoder_contract.legacy_limits.materialUnknowns.maximum, 12);
  assert.equal(
    projectionContract.decoder_contract.legacy_limits.consultationLimitations.minimum,
    1,
  );
  assert.equal(projectionContract.decoder_contract.split_limits.materialUnknowns.maximum, 4);
  assert.equal(
    projectionContract.decoder_contract.split_limits.consultationLimitations.maximum,
    2,
  );
  assert.equal(projectionContract.product_doctrine_support.rendering_owned_by_r2_b, true);
  assert.equal(projectionContract.product_doctrine_support.customer_reassurance_established, false);
  assert.equal(projectionContract.product_doctrine_support.jpy980_readiness_established, false);
  Object.values(projectionContract.authorization).forEach((value) => assert.equal(value, false));
});

check("capabilities exact success and zero-operation boundary", () => {
  assert.equal(capabilities.task_id, taskId);
  assert.equal(capabilities.baseline, baseline);
  assert.equal(
    capabilities.status,
    "experience_projection_v2_implemented_pending_human_chatgpt_review",
  );
  for (const key of [
    "product_doctrine_accepted",
    "package_a_accepted",
    "package_b_visual_shell_accepted",
    "customer_assessment_projection_v1_unchanged",
    "experience_projection_v2_complete",
    "experience_fields_exact_source_only",
    "full_report_unchanged",
    "v1_parity_preserved",
  ]) {
    assert.equal(capabilities[key], true, key);
  }
  for (const key of ["provider_calls", "db_operations", "supabase_operations"]) {
    assert.equal(capabilities[key], 0, key);
  }
  for (const key of [
    "r2_b_authorized",
    "r2_c_authorized",
    "existing_package_c_authorized",
    "provider_rerun_authorized",
    "active_runtime_activated",
    "r4_authorized",
    "c2_authorized",
    "jpy980_readiness_established",
    "main_changed",
    "pull_request_created",
    "main_merged",
    "force_push_used",
  ]) {
    assert.equal(capabilities[key], false, key);
  }
  assert.equal(
    capabilities.next_action,
    "human_chatgpt_review_of_experience_projection_v2",
  );
});

check("fixture catalog exact 8 positive and 20 negative synthetic only", () => {
  assert.equal(fixtures.task_id, taskId);
  assert.equal(fixtures.data_policy, "offline_synthetic_only");
  assert.equal(fixtures.template_source_policy, "accepted_package_a_synthetic_templates_read_only");
  assert.equal(fixtures.positive_fixtures.length, 8);
  assert.equal(fixtures.negative_fixtures.length, 20);
  assert.equal(new Set(fixtures.positive_fixtures.map((item) => item.fixture_id)).size, 8);
  assert.equal(new Set(fixtures.negative_fixtures.map((item) => item.fixture_id)).size, 20);
});

const positiveStats = { legacy: 0, split: 0 };
const positiveProjections = new Map();
check("positive fixtures exact mapping immutability determinism and V1 parity", () => {
  for (const fixture of fixtures.positive_fixtures) {
    const readyResult = instantiate(fixture);
    const reportBeforeSerialized = JSON.stringify(readyResult.report);
    const reportBeforeDeep = clone(readyResult.report);
    deepFreeze(readyResult);
    assert.equal(Object.isFrozen(readyResult), true, fixture.fixture_id);
    assert.equal(Object.isFrozen(readyResult.report), true, fixture.fixture_id);

    const first = experienceProjection.projectCustomerAssessmentExperienceV2(
      readyResult,
      fixture.requested_topics,
    );
    const second = experienceProjection.projectCustomerAssessmentExperienceV2(
      readyResult,
      fixture.requested_topics,
    );
    experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(first);
    const directV1 = v1Projection.projectCustomerAssessmentV1(
      readyResult,
      fixture.requested_topics,
    );
    v1Projection.decodeCustomerAssessmentProjectionV1(first.baseProjection);

    assert.deepEqual(first, second, fixture.fixture_id);
    assert.deepEqual(first.baseProjection, directV1, fixture.fixture_id);
    assert.equal(JSON.stringify(readyResult.report), reportBeforeSerialized, fixture.fixture_id);
    assert.deepEqual(readyResult.report, reportBeforeDeep, fixture.fixture_id);

    const expected = expectedExperienceMapping(readyResult.report);
    for (const [key, expectedValue] of Object.entries(expected)) {
      assert.deepEqual(first[key], expectedValue, `${fixture.fixture_id}:${key}`);
    }
    assert.notStrictEqual(first.openingLetter, readyResult.report.content.short_letter);
    assert.notStrictEqual(
      first.possibleInterpretations,
      readyResult.report.content.possible_interpretations,
    );
    assert.notStrictEqual(first.actionRationales, readyResult.report.content.action_rationales);
    assert.notStrictEqual(first.closingLines, readyResult.report.content.closing_lines);
    assert.equal(containsForbiddenKey(first), false, fixture.fixture_id);
    for (const text of experienceStrings(first)) {
      assert.doesNotMatch(text, /(?:^|[^\p{L}\p{N}_])F[0-9]{3}(?:$|[^\p{L}\p{N}_])/u);
      assert.doesNotMatch(
        text,
        /(?:^|[^\p{L}\p{N}_])(?:reply_now|send_now|wait_and_reassess|pause_additional_contact)(?:$|[^\p{L}\p{N}_])/u,
      );
    }

    if (fixture.expected_situation_reading) {
      assert.deepEqual(first.situationReading, fixture.expected_situation_reading);
    }
    positiveProjections.set(fixture.fixture_id, first);
    if (first.baseProjection.sourceReportSchemaVersion === "m2-p3-runtime-report-v1") {
      positiveStats.legacy += 1;
    } else {
      positiveStats.split += 1;
    }
  }
  assert.deepEqual(positiveStats, { legacy: 2, split: 6 });
});

check("situation reading follows content order and omits unmatched facts", () => {
  assert.deepEqual(
    positiveProjections.get("situation_reading_content_order").situationReading,
    ["先にある観察コメントです。", "後にある観察コメントです。"],
  );
  assert.deepEqual(
    positiveProjections.get("situation_reading_unmatched_fact").situationReading,
    ["送信した時刻情報に誤りがあります。"],
  );
});

check("split sparse arrays and nullable draft context remain exact", () => {
  const fixture = fixtures.positive_fixtures.find(
    (candidate) => candidate.fixture_id === "split_sparse_experience",
  );
  const projection = positiveProjections.get(fixture.fixture_id);
  assert.deepEqual(
    {
      materialUnknowns: projection.materialUnknowns,
      draftContext: projection.draftContext,
      actionRationales: projection.actionRationales,
      consultationLimitations: projection.consultationLimitations,
    },
    fixture.expected_sparse,
  );
  assert.ok(projection.openingLine.length > 0);
  assert.ok(projection.openingLetter.length > 0);
  assert.ok(projection.closingLines.length > 0);
});

check("Unicode emoji dialect punctuation and line breaks preserve exactly", () => {
  const fixture = fixtures.positive_fixtures.find(
    (candidate) => candidate.fixture_id === "exact_unicode_preservation",
  );
  const projection = positiveProjections.get(fixture.fixture_id);
  const projectedStrings = experienceStrings(projection);
  fixture.expected_unicode_values.forEach((value) => {
    assert.equal(projectedStrings.includes(value), true, value);
  });
});

check("repeated accepted source strings remain decoder-valid", () => {
  const repeated = clone(positiveProjections.get("split_full_experience"));
  repeated.possibleInterpretations = ["同じ可能性です。", "同じ可能性です。"];
  repeated.actionRationales = ["同じ理由です。", "同じ理由です。"];
  experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(repeated);
});

check("all 20 negative fixtures reject fail-closed", () => {
  let rejected = 0;
  for (const fixture of fixtures.negative_fixtures) {
    const base = projectionForFamily(fixture.source_family);
    const invalid = mutateNegative(base, fixture.mutation);
    assert.throws(
      () => experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(invalid),
      undefined,
      fixture.fixture_id,
    );
    rejected += 1;
  }
  assert.equal(rejected, 20);
});

check("frozen E-R3 accepted-ready cases project successfully 3/3", () => {
  const acceptedIds = ["E-R3-01", "E-R3-02", "E-R3-04"];
  for (const caseId of acceptedIds) {
    const record = frozenDiagnostic.cases.find((candidate) => candidate.case_id === caseId);
    assert.equal(record.final_result.eligibility, "ready", caseId);
    const readyResult = clone(record.final_result);
    const reportBefore = JSON.stringify(readyResult.report);
    deepFreeze(readyResult);
    const projected = experienceProjection.projectCustomerAssessmentExperienceV2(
      readyResult,
      record.evidence.synthetic_input.requested_topics,
    );
    experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(projected);
    assert.equal(JSON.stringify(readyResult.report), reportBefore, caseId);
    assert.equal(containsForbiddenKey(projected), false, caseId);
  }
});

check("frozen E-R3 safety and rejected intermediates are not accepted ready Product", () => {
  const safety = frozenDiagnostic.cases.find((candidate) => candidate.case_id === "E-R3-03");
  assert.equal(safety.final_result.eligibility, "safety_blocked");
  assert.throws(() =>
    experienceProjection.projectCustomerAssessmentExperienceV2(
      safety.final_result,
      safety.evidence.synthetic_input.requested_topics,
    ),
  );
  for (const caseId of ["E-R3-05", "E-R3-06"]) {
    const record = frozenDiagnostic.cases.find((candidate) => candidate.case_id === caseId);
    assert.equal(record.final_result, null, caseId);
    assert.equal(record.product_rejection.final_result_is_derived_null, true, caseId);
    assert.throws(() =>
      experienceProjection.projectCustomerAssessmentExperienceV2(
        record.final_result,
        record.evidence.synthetic_input.requested_topics,
      ),
    );
  }
});

check("Product Doctrine functions supported without rendering or outcome claims", () => {
  assert.deepEqual(Object.keys(projectionContract.product_doctrine_support), [
    "opening_ritual",
    "personalized_letter",
    "grounded_situation_reading",
    "fact_uncertainty_separation",
    "draft_context",
    "action_rationale",
    "emotional_closing",
    "rendering_owned_by_r2_b",
    "customer_reassurance_established",
    "jpy980_readiness_established",
  ]);
  assert.equal(implementationPackages.packages.find((item) => item.package_id === "R2-B").provider_calls_required, false);
  assert.equal(implementationPackages.existing_package_c_boundary.remains_separate, true);
  assert.equal(capabilities.r2_b_authorized, false);
  assert.equal(capabilities.r2_c_authorized, false);
  assert.equal(capabilities.existing_package_c_authorized, false);
  assert.equal(capabilities.r4_authorized, false);
  assert.equal(capabilities.c2_authorized, false);
});

check("offline result manifest matches independently executed evidence", () => {
  assert.equal(offlineResults.task_id, taskId);
  assert.equal(offlineResults.status, "PASS");
  assert.equal(offlineResults.baseline, baseline);
  assert.deepEqual(offlineResults.fixture_counts, {
    positive: 8,
    negative: 20,
    legacy_positive: 2,
    split_positive: 6,
    frozen_e_r3_accepted_ready: 3,
    frozen_e_r3_safety_blocked: 1,
    frozen_e_r3_rejected_intermediate: 2,
  });
  Object.values(offlineResults.results).forEach((value) => assert.equal(value, "PASS"));
  assert.deepEqual(offlineResults.operations, {
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    runner_rerun: false,
    package_check: false,
    retry: false,
    repair: false,
    fallback: false,
    runtime_activation: false,
    ui_changes: false,
  });
  assert.equal(offlineResults.acceptance_boundary.human_chatgpt_review, "PENDING");
  assert.equal(offlineResults.acceptance_boundary.customer_reassurance_established, false);
  assert.equal(offlineResults.acceptance_boundary.jpy980_readiness_established, false);
});

check("no UI Provider network DB Supabase Runtime Prompt Catalog Schema Pipeline changes", () => {
  const changed = new Set(exactScope);
  for (const candidate of changed) {
    assert.doesNotMatch(candidate, /^(?:app|components)\//u);
    assert.doesNotMatch(candidate, /(?:prompt|catalog|schema|pipeline|migration)/iu);
  }
  for (const protectedPath of [
    "app/api/internal/assessments/route.ts",
    "components/runtime/RuntimeAssessmentForm.tsx",
    "lib/assessment/runtime/supabase-repository.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/schema-catalog.ts",
  ]) {
    assertBaselineBlobUnchanged(protectedPath);
  }
});

check("git diff --check PASS", () => {
  assert.equal(git(["diff", "--check"]), "");
  exactScope.forEach((candidate) => {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  });
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  `Experience projection verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${checks.length - failed.length}/${checks.length}`,
);
console.log("Exact scope: 7/7 new paths");
console.log("Positive fixtures: 8/8");
console.log("Negative fixtures: 20/20");
console.log("Frozen E-R3: ready 3/3; safety/rejected 3/3 not accepted ready Product");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
if (failed.length > 0) process.exitCode = 1;
