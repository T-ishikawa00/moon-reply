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
import { pathToFileURL } from "node:url";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-A";
const baseline = "cf9a04773fca622c4813e1e6e73a7632b139aff6";
const expectedParent = "6196ab58d8d93a650d050a0fa6e1e7d4c2b44bc2";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-r1-authorized-experience-projection";
const acceptedAuthorityBranch =
  "chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-doctrine-acceptance";
const correctionBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-reassurance-doctrine-correction";
const historicalCandidateBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection";
const historicalCandidate = "da325d9b4d8404879a08c1b50107e7f7df8787ec";
const historicalCandidateParent = "a5b2defa1bb765d46076a28ca9827d494fcbe433";
const historicalIdentifierHardening =
  "89a6d55fdf3845451e80f1ee21dc648b224bcc9d";
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
const q0AcceptanceVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-doctrine-acceptance.mjs";
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

const factIdPattern = /F[0-9]{3}/u;
const decisionCodePattern =
  /(?:reply_now|send_now|wait_and_reassess|pause_additional_contact)/u;

function indexedTextEntries(prefix, values) {
  return values.map((text, index) => ({ path: `${prefix}[${index}]`, text }));
}

function experienceTextEntries(value) {
  return [
    { path: "openingLine", text: value.openingLine },
    ...indexedTextEntries("openingLetter", value.openingLetter),
    ...indexedTextEntries("situationReading", value.situationReading),
    ...indexedTextEntries("possibleInterpretations", value.possibleInterpretations),
    ...indexedTextEntries("materialUnknowns", value.materialUnknowns),
    ...(value.draftContext === null
      ? []
      : [{ path: "draftContext", text: value.draftContext }]),
    ...indexedTextEntries("actionRationales", value.actionRationales),
    ...indexedTextEntries("closingLines", value.closingLines),
    ...indexedTextEntries("consultationLimitations", value.consultationLimitations),
  ];
}

function baseProjectionCustomerTextEntries(value) {
  const entries = [
    { path: "baseProjection.primaryReason", text: value.primaryReason },
    ...(value.finalDraft === null
      ? []
      : [{ path: "baseProjection.finalDraft.text", text: value.finalDraft.text }]),
    { path: "baseProjection.immediateAction.action", text: value.immediateAction.action },
    ...indexedTextEntries(
      "baseProjection.immediateAction.avoid",
      value.immediateAction.avoid,
    ),
    ...indexedTextEntries(
      "baseProjection.immediateAction.secondaryActions",
      value.immediateAction.secondaryActions,
    ),
    { path: "baseProjection.reassessment.when", text: value.reassessment.when },
    ...value.reassessment.conditions.map((item, index) => ({
      path: `baseProjection.reassessment.conditions[${index}].condition`,
      text: item.condition,
    })),
    ...(value.relationshipSummary === null
      ? []
      : [
          {
            path: "baseProjection.relationshipSummary",
            text: value.relationshipSummary,
          },
        ]),
  ];
  if (value.messageTemperature !== null) {
    entries.push(
      {
        path: "baseProjection.messageTemperature.softness",
        text: value.messageTemperature.softness,
      },
      {
        path: "baseProjection.messageTemperature.affection",
        text: value.messageTemperature.affection,
      },
      {
        path: "baseProjection.messageTemperature.pressure",
        text: value.messageTemperature.pressure,
      },
      {
        path: "baseProjection.messageTemperature.adjustment",
        text: value.messageTemperature.adjustment,
      },
    );
  }
  entries.push(
    ...indexedTextEntries(
      "baseProjection.optionalDetails.interpretations",
      value.optionalDetails.interpretations ?? [],
    ),
    ...indexedTextEntries(
      "baseProjection.optionalDetails.shortLetter",
      value.optionalDetails.shortLetter ?? [],
    ),
    ...indexedTextEntries(
      "baseProjection.optionalDetails.anxietyReframe",
      value.optionalDetails.anxietyReframe ?? [],
    ),
    ...(value.optionalDetails.expandedPlan ?? []).flatMap((item, index) => [
      {
        path: `baseProjection.optionalDetails.expandedPlan[${index}].action`,
        text: item.action,
      },
      ...(item.avoid === null
        ? []
        : [
            {
              path: `baseProjection.optionalDetails.expandedPlan[${index}].avoid`,
              text: item.avoid,
            },
          ]),
    ]),
    ...indexedTextEntries(
      "baseProjection.optionalDetails.planCommentary",
      value.optionalDetails.planCommentary ?? [],
    ),
    { path: "baseProjection.fixedLimitation", text: value.fixedLimitation },
  );
  return entries;
}

function customerTextEntries(value) {
  return [
    ...experienceTextEntries(value),
    ...baseProjectionCustomerTextEntries(value.baseProjection),
  ];
}

function experienceStrings(value) {
  return experienceTextEntries(value).map((entry) => entry.text);
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

let q0AcceptanceVerifierSummary = "not_run";
let r1DoctrineVerifierSummary = "not_run";
let packageBVerifierSummary = "not_run";
let packageAR1VerifierSummary = "not_run";

function runQ0AcceptanceVerifierAtAcceptedAuthority() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-r2-a-authorized-q0-"),
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
        acceptedAuthorityBranch,
        baseline,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    for (const [refName, revision] of [
      [`refs/heads/${correctionBranch}`, expectedParent],
      [`refs/remotes/origin/${correctionBranch}`, expectedParent],
      ["refs/heads/main", expectedMain],
      ["refs/remotes/origin/main", expectedMain],
    ]) {
      execFileSync(
        "git.exe",
        ["-c", safeDirectory, "update-ref", refName, revision],
        { cwd: cloneRoot, stdio: "pipe" },
      );
    }

    const sourceContract = readJson(p1SourceContractPath);
    for (const authority of sourceContract.authority_manifest) {
      copyFileSync(
        path.join(root, authority.path),
        path.join(cloneRoot, authority.path),
      );
    }
    copyFileSync(
      path.join(root, sourceContract.frozen_state.authorization_path),
      path.join(cloneRoot, sourceContract.frozen_state.authorization_path),
    );
    const markerName = path.basename(sourceContract.frozen_state.marker_path);
    copyFileSync(
      path.join(root, ".git", markerName),
      path.join(cloneRoot, ".git", markerName),
    );
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "true"],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const output = execFileSync(
      process.execPath,
      [path.join(cloneRoot, q0AcceptanceVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.match(output, /Doctrine acceptance verifier: PASS 12\/12/u);
    assert.match(output, /R1 doctrine verifier: PASS 19\/19/u);
    assert.match(output, /Package B verifier: PASS 20\/20 exact 10\/10/u);
    assert.match(output, /Package A R1 verifier: PASS 23\/23/u);
    q0AcceptanceVerifierSummary = "PASS 12/12";
    r1DoctrineVerifierSummary = "PASS 19/19";
    packageBVerifierSummary = "PASS 20/20 exact 10/10";
    packageAR1VerifierSummary = "PASS 23/23";
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const fixtures = readJson(fixturePath);
const historicalCandidateFixtures = JSON.parse(
  git(["show", `${historicalCandidate}:${fixturePath}`]),
);
const historicalHardenedFixtures = JSON.parse(
  git(["show", `${historicalIdentifierHardening}:${fixturePath}`]),
);
const historicalHardenedContract = JSON.parse(
  git(["show", `${historicalIdentifierHardening}:${projectionContractPath}`]),
);
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

function projectionForFixture(fixtureId) {
  const fixture = fixtures.positive_fixtures.find(
    (candidate) => candidate.fixture_id === fixtureId,
  );
  assert.ok(fixture, fixtureId);
  const readyResult = instantiate(fixture);
  return experienceProjection.projectCustomerAssessmentExperienceV2(
    readyResult,
    fixture.requested_topics,
  );
}

function projectionForNegativeFixture(fixture) {
  const fixtureId =
    fixture.base_fixture ??
    (fixture.source_family === "legacy"
      ? "legacy_full_experience"
      : "split_full_experience");
  return projectionForFixture(fixtureId);
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
    case "japanese_adjacent_fact_ids_in_openingLine":
      target.openingLine = "F101とF102を確認しました";
      break;
    case "japanese_copula_fact_id_in_closingLines":
      target.closingLines[0] = "説明はF101です";
      break;
    case "japanese_particle_fact_id_in_situationReading":
      target.situationReading[0] = "F001を根拠にしています";
      break;
    case "japanese_particle_reply_now_in_openingLetter":
      target.openingLetter[0] = "reply_nowを選びます";
      break;
    case "japanese_copula_wait_in_actionRationales":
      target.actionRationales[0] = "wait_and_reassessの場合です";
      break;
    case "fact_id_in_base_primaryReason":
      target.baseProjection.primaryReason = "説明はF101です";
      break;
    case "fact_id_in_base_finalDraft_text":
      target.baseProjection.finalDraft.text = "F101を含む下書きです";
      break;
    case "fact_id_in_base_immediateAction_action":
      target.baseProjection.immediateAction.action = "F101を参照します";
      break;
    case "decision_enum_in_base_reassessment_when":
      target.baseProjection.reassessment.when = "reply_nowの場合です";
      break;
    case "decision_enum_in_base_reassessment_condition":
      target.baseProjection.reassessment.conditions[0].condition =
        "wait_and_reassessへ変更します";
      break;
    case "fact_id_in_base_relationshipSummary":
      target.baseProjection.relationshipSummary = "説明はF101です";
      break;
    case "fact_id_in_base_messageTemperature_softness":
      target.baseProjection.messageTemperature.softness = "F101を参照します";
      break;
    case "fact_id_in_base_optionalDetails_shortLetter":
      target.baseProjection.optionalDetails.shortLetter[0] = "F101を確認しました";
      break;
    case "decision_enum_in_base_optionalDetails_expandedPlan_action":
      target.baseProjection.optionalDetails.expandedPlan[0].action =
        "reply_nowを選びます";
      break;
    case "fact_id_in_base_fixedLimitation":
      target.baseProjection.fixedLimitation = "説明はF101です";
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

check("historical candidate remains read-only and exact 7/7", () => {
  assert.equal(git(["rev-parse", historicalCandidateBranch]), historicalCandidate);
  assert.equal(
    git(["rev-parse", `origin/${historicalCandidateBranch}`]),
    historicalCandidate,
  );
  assert.equal(
    git(["rev-parse", `${historicalCandidate}^`]),
    historicalCandidateParent,
  );
  assert.equal(
    git(["rev-parse", `${historicalIdentifierHardening}^`]),
    historicalCandidate,
  );
  const historicalPaths = git([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    historicalCandidate,
  ])
    .split(/\r?\n/u)
    .filter(Boolean);
  assert.deepEqual(sorted(historicalPaths), sorted(exactScope));
});

check("exact authorized implementation scope is 7/7 NEW only", () => {
  assert.equal(exactScope.length, 7);
  exactScope.forEach((candidate) => {
    assert.equal(existsSync(path.join(root, candidate)), true, candidate);
    assert.equal(gitObjectExists(`${baseline}:${candidate}`), false, candidate);
    assert.notEqual(
      git(["hash-object", candidate]),
      git(["rev-parse", `${historicalCandidate}:${candidate}`]),
      candidate,
    );
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
    assert.equal(git(["rev-parse", `${head}^`]), baseline);
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

check("Q0-A acceptance R1 Doctrine Package B and Package A verifiers preserved", () => {
  runQ0AcceptanceVerifierAtAcceptedAuthority();
});

check("Product Doctrine and projection authority sources unchanged", () => {
  assert.equal(productDoctrineScope.length, 7);
  productDoctrineScope.forEach(assertBaselineBlobUnchanged);
  assert.equal(
    productDoctrine.status,
    "reassuring_assessment_experience_doctrine_human_chatgpt_accepted_complete_r2_a_authorized",
  );
  assert.equal(productDoctrine.acceptance.doctrineHumanChatGPTReview, "complete");
  assert.equal(productDoctrine.acceptance.doctrineHumanChatGPTReviewOutcome, "PASS");
  assert.equal(productDoctrine.acceptance.acceptanceDate, "2026-08-16");
  assert.equal(
    productDoctrine.r2_authorization["R2-A"].implementation,
    "implementation_authorized",
  );
  assert.equal(
    productDoctrine.r2_authorization["R2-B"].implementation,
    "implementation_unauthorized",
  );
  assert.equal(productDoctrine.r2_authorization["R2-C"].execution, "unauthorized");
  assert.equal(productDoctrine.authority_boundary.r2_a_implementation_authorized, true);
  assert.equal(productDoctrine.authority_boundary.r2_b_implementation_authorized, false);
  assert.equal(productDoctrine.authority_boundary.r2_c_execution_authorized, false);
  assert.equal(productDoctrine.authority_boundary.r2_c_review_authorized, false);
  assert.equal(productDoctrine.authority_boundary.provider_calls, 0);
  assert.equal(productDoctrine.authority_boundary.runtime_activation_authorized, false);
  const r2aPackage = implementationPackages.packages.find(
    (item) => item.package_id === "R2-A",
  );
  assert.equal(r2aPackage.authorization_status, "implementation_authorized");
  assert.equal(r2aPackage.implementation_authorized, true);
  assert.deepEqual(r2aPackage.proposed_paths, exactScope);
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
  assert.match(
    projectFunctionSource,
    /return decodeCustomerAssessmentExperienceProjectionV2\(projection\)/u,
  );
  assert.notEqual(
    git(["hash-object", implementationPath]),
    git(["rev-parse", `${historicalIdentifierHardening}:${implementationPath}`]),
  );
});

check("identifier exclusion uses no Unicode-letter boundary and enumerates customer text", () => {
  const source = readText(implementationPath);
  assert.match(source, /const factIdPattern = \/F\[0-9\]\{3\}\/u;/u);
  assert.match(
    source,
    /reply_now\|send_now\|wait_and_reassess\|pause_additional_contact/u,
  );
  assert.doesNotMatch(source, /\\p\{L\}|\\p\{N\}/u);
  assert.match(source, /function assertBaseProjectionCustomerTexts\(/u);
  for (const pattern of [
    /value\.primaryReason/u,
    /value\.finalDraft\.text/u,
    /value\.immediateAction\.action/u,
    /value\.immediateAction\.avoid/u,
    /value\.immediateAction\.secondaryActions/u,
    /value\.reassessment\.when/u,
    /value\.reassessment\.conditions/u,
    /value\.relationshipSummary/u,
    /value\.messageTemperature\.softness/u,
    /value\.messageTemperature\.affection/u,
    /value\.messageTemperature\.pressure/u,
    /value\.messageTemperature\.adjustment/u,
    /value\.optionalDetails\.interpretations/u,
    /value\.optionalDetails\.shortLetter/u,
    /value\.optionalDetails\.anxietyReframe/u,
    /value\.optionalDetails\.expandedPlan/u,
    /value\.optionalDetails\.planCommentary/u,
    /value\.fixedLimitation/u,
  ]) {
    assert.match(source, pattern);
  }
});

check("recursive forbidden-key rejection remains a separate gate", () => {
  const source = readText(implementationPath);
  for (const key of [
    "fact_id",
    "decision_reason_fact_ids",
    "supporting_fact_ids",
    "trigger_fact_ids",
    "unknown_code",
    "material_to",
    "report",
    "requestId",
    "runId",
    "usage",
    "diagnostic_verdict",
    "machine_verdict",
    "stage_data",
  ]) {
    assert.equal(source.includes(`"${key}"`), true, key);
  }
  assert.match(source, /function assertNoForbiddenKeys\(value: unknown\)/u);
  assert.match(source, /assertNoForbiddenKeys\(child\)/u);
  assert.match(source, /assertNoForbiddenKeys\(value\);/u);
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
  assert.equal(projectionContract.branch, expectedBranch);
  assert.equal(
    projectionContract.status,
    "authorized_experience_projection_v2_implemented_pending_human_chatgpt_review",
  );
  assert.deepEqual(projectionContract.accepted_authority, {
    doctrine_status:
      "reassuring_assessment_experience_doctrine_human_chatgpt_accepted_complete_r2_a_authorized",
    doctrineHumanChatGPTReview: "complete",
    doctrineHumanChatGPTReviewOutcome: "PASS",
    acceptanceDate: "2026-08-16",
    r2_a_implementation: "implementation_authorized",
  });
  assert.deepEqual(projectionContract.historical_reference, {
    candidate_branch: historicalCandidateBranch,
    candidate_commit: historicalCandidate,
    candidate_parent: historicalCandidateParent,
    identifier_hardening_commit: historicalIdentifierHardening,
    read_only: true,
    cherry_pick_used: false,
    rebase_used: false,
    branch_overwritten: false,
  });
  assert.deepEqual(projectionContract.functional_reuse, {
    historical_candidate_foundation_reused: true,
    identifier_exclusion_hardening_reused: true,
    projection_return_fail_closed_added: true,
    stale_lineage_or_authorization_metadata_reused: false,
  });
  for (const key of [
    "source_mapping",
    "recursive_exclusions",
    "allowed_structural_exception",
    "immutability",
    "product_doctrine_support",
    "frozen_e_r3_compatibility",
  ]) {
    assert.deepEqual(projectionContract[key], historicalHardenedContract[key], key);
  }
  assert.equal(projectionContract.projection.validated_before_return, true);
  assert.deepEqual(projectionContract.accepted_flow, [
    "requireReadyAssessmentResult",
    "projectCustomerAssessmentV1",
    "validated_full_report_exact_extraction",
    "decodeCustomerAssessmentExperienceProjectionV2",
    "fresh_projection_return",
  ]);
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
  assert.deepEqual(
    projectionContract.decoder_contract.identifier_exclusion.experience_customer_text_paths,
    [
      "openingLine",
      "openingLetter[*]",
      "situationReading[*]",
      "possibleInterpretations[*]",
      "materialUnknowns[*]",
      "draftContext",
      "actionRationales[*]",
      "closingLines[*]",
      "consultationLimitations[*]",
    ],
  );
  assert.equal(
    projectionContract.decoder_contract.identifier_exclusion.base_projection_customer_text_paths.length,
    19,
  );
  assert.equal(
    projectionContract.decoder_contract.identifier_exclusion.unicode_letter_boundaries_used,
    false,
  );
  assert.equal(
    projectionContract.decoder_contract.identifier_exclusion.recursive_forbidden_key_rejection_preserved,
    true,
  );
  assert.equal(
    projectionContract.decoder_contract.identifier_exclusion.key_and_text_value_exclusion_are_separate,
    true,
  );
  assert.equal(
    projectionContract.decoder_contract.identifier_exclusion
      .project_function_validates_before_return,
    true,
  );
  assert.equal(projectionContract.product_doctrine_support.rendering_owned_by_r2_b, true);
  assert.equal(projectionContract.product_doctrine_support.customer_reassurance_established, false);
  assert.equal(projectionContract.product_doctrine_support.jpy980_readiness_established, false);
  assert.equal(projectionContract.authorization.r2_a_implementation_authorized, true);
  for (const [key, value] of Object.entries(projectionContract.authorization)) {
    if (key !== "r2_a_implementation_authorized") assert.equal(value, false, key);
  }
});

check("capabilities exact success and zero-operation boundary", () => {
  assert.equal(capabilities.task_id, taskId);
  assert.equal(capabilities.baseline, baseline);
  assert.equal(capabilities.branch, expectedBranch);
  assert.equal(
    capabilities.status,
    "authorized_experience_projection_v2_implemented_pending_human_chatgpt_review",
  );
  assert.deepEqual(capabilities.accepted_authority, {
    doctrine_status:
      "reassuring_assessment_experience_doctrine_human_chatgpt_accepted_complete_r2_a_authorized",
    r2_a_implementation: "implementation_authorized",
    acceptance_date: "2026-08-16",
  });
  assert.deepEqual(capabilities.historical_reference, {
    candidate_commit: historicalCandidate,
    identifier_hardening_commit: historicalIdentifierHardening,
    read_only: true,
  });
  for (const key of [
    "product_doctrine_accepted",
    "package_a_accepted",
    "package_b_visual_shell_accepted",
    "r2_a_architecture_accepted",
    "r2_a_implementation_authorized",
    "r2_a_implementation_complete",
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
    "production_runtime_authorized",
    "payment_implementation_authorized",
    "production_payment_authorized",
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
    "human_chatgpt_review_of_authorized_experience_projection_v2",
  );
});

check("fixture catalog preserves 8 positive and previous 20 plus 15 R1 negative", () => {
  assert.equal(fixtures.task_id, taskId);
  assert.deepEqual(fixtures.lineage, {
    accepted_authority_parent: baseline,
    historical_candidate: historicalCandidate,
    identifier_hardening_reference: historicalIdentifierHardening,
    historical_references_read_only: true,
  });
  assert.equal(fixtures.data_policy, "offline_synthetic_only");
  assert.equal(fixtures.template_source_policy, "accepted_package_a_synthetic_templates_read_only");
  assert.equal(fixtures.positive_fixtures.length, 8);
  assert.equal(fixtures.negative_fixtures.length, 35);
  assert.equal(new Set(fixtures.positive_fixtures.map((item) => item.fixture_id)).size, 8);
  assert.equal(new Set(fixtures.negative_fixtures.map((item) => item.fixture_id)).size, 35);
  assert.equal(historicalCandidateFixtures.negative_fixtures.length, 20);
  assert.deepEqual(
    fixtures.positive_fixtures,
    historicalCandidateFixtures.positive_fixtures,
  );
  assert.deepEqual(
    fixtures.negative_fixtures.slice(0, 20),
    historicalCandidateFixtures.negative_fixtures,
  );
  assert.deepEqual(
    fixtures.positive_fixtures,
    historicalHardenedFixtures.positive_fixtures,
  );
  assert.deepEqual(
    fixtures.negative_fixtures,
    historicalHardenedFixtures.negative_fixtures,
  );
  const correctionFixtureIds = fixtures.negative_fixtures
    .slice(20)
    .map((item) => item.fixture_id);
  assert.deepEqual(correctionFixtureIds, [
    "japanese_adjacent_fact_ids_in_opening_line",
    "japanese_copula_fact_id_in_closing_line",
    "japanese_particle_fact_id_in_situation_reading",
    "japanese_particle_reply_now_in_opening_letter",
    "japanese_copula_wait_in_action_rationale",
    "fact_id_in_base_primary_reason",
    "fact_id_in_base_final_draft_text",
    "fact_id_in_base_immediate_action",
    "decision_enum_in_base_reassessment_when",
    "decision_enum_in_base_reassessment_condition",
    "fact_id_in_base_relationship_summary",
    "fact_id_in_base_message_softness",
    "fact_id_in_base_short_letter",
    "decision_enum_in_base_expanded_plan_action",
    "fact_id_in_base_fixed_limitation",
  ]);
  assert.deepEqual(
    fixtures.source_projection_rejection_fixtures.map((item) => item.fixture_id),
    [
      "source_fact_id_in_opening_line",
      "source_decision_literal_in_closing_lines",
      "source_fact_id_in_base_primary_reason",
      "source_decision_literal_in_base_short_letter",
    ],
  );
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
    for (const entry of customerTextEntries(first)) {
      assert.doesNotMatch(entry.text, factIdPattern, entry.path);
      assert.doesNotMatch(entry.text, decisionCodePattern, entry.path);
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

check("all V2 experience customer-readable paths enforce identifier exclusion", () => {
  const cases = [
    ["openingLine", (value) => { value.openingLine = "F101を確認します"; }],
    ["openingLetter[*]", (value) => { value.openingLetter[0] = "F101を確認します"; }],
    ["situationReading[*]", (value) => { value.situationReading[0] = "F101を確認します"; }],
    ["possibleInterpretations[*]", (value) => { value.possibleInterpretations[0] = "F101を確認します"; }],
    ["materialUnknowns[*]", (value) => { value.materialUnknowns[0] = "F101を確認します"; }],
    ["draftContext", (value) => { value.draftContext = "F101を確認します"; }],
    ["actionRationales[*]", (value) => { value.actionRationales[0] = "F101を確認します"; }],
    ["closingLines[*]", (value) => { value.closingLines[0] = "F101を確認します"; }],
    ["consultationLimitations[*]", (value) => { value.consultationLimitations[0] = "F101を確認します"; }],
  ];
  assert.deepEqual(cases.map(([pathName]) => pathName), [
    "openingLine",
    "openingLetter[*]",
    "situationReading[*]",
    "possibleInterpretations[*]",
    "materialUnknowns[*]",
    "draftContext",
    "actionRationales[*]",
    "closingLines[*]",
    "consultationLimitations[*]",
  ]);
  for (const [pathName, mutate] of cases) {
    const candidate = clone(positiveProjections.get("split_full_experience"));
    experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(candidate);
    mutate(candidate);
    assert.throws(
      () => experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(candidate),
      undefined,
      pathName,
    );
  }
});

check("Japanese-adjacent Fact IDs and Decision literals reject without boundaries", () => {
  const factExamples = [
    "F101とF102",
    "説明はF101です",
    "F001を参照",
    "（F002）",
    "F003。",
    "F004",
  ];
  const decisionExamples = [
    "reply_nowを選ぶ",
    "send_nowの場合",
    "wait_and_reassessへ変更",
    "pause_additional_contactです",
  ];
  for (const text of [...factExamples, ...decisionExamples]) {
    const candidate = clone(positiveProjections.get("split_full_experience"));
    candidate.openingLine = text;
    assert.throws(
      () => experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(candidate),
      undefined,
      text,
    );
  }
});

check("all 19 baseProjection customer-readable paths enforce text exclusion", () => {
  const cases = [
    ["baseProjection.primaryReason", "split_full_experience", (value) => { value.baseProjection.primaryReason = "F101を確認します"; }],
    ["baseProjection.finalDraft.text", "split_full_experience", (value) => { value.baseProjection.finalDraft.text = "F101を確認します"; }],
    ["baseProjection.immediateAction.action", "split_full_experience", (value) => { value.baseProjection.immediateAction.action = "F101を確認します"; }],
    ["baseProjection.immediateAction.avoid[*]", "split_full_experience", (value) => { value.baseProjection.immediateAction.avoid[0] = "F101を確認します"; }],
    ["baseProjection.immediateAction.secondaryActions[*]", "split_full_experience", (value) => { value.baseProjection.immediateAction.secondaryActions[0] = "F101を確認します"; }],
    ["baseProjection.reassessment.when", "split_full_experience", (value) => { value.baseProjection.reassessment.when = "F101を確認します"; }],
    ["baseProjection.reassessment.conditions[*].condition", "split_full_experience", (value) => { value.baseProjection.reassessment.conditions[0].condition = "F101を確認します"; }],
    ["baseProjection.relationshipSummary", "v1_parity_legacy", (value) => { value.baseProjection.relationshipSummary = "F101を確認します"; }],
    ["baseProjection.messageTemperature.softness", "v1_parity_split", (value) => { value.baseProjection.messageTemperature.softness = "F101を確認します"; }],
    ["baseProjection.messageTemperature.affection", "v1_parity_split", (value) => { value.baseProjection.messageTemperature.affection = "F101を確認します"; }],
    ["baseProjection.messageTemperature.pressure", "v1_parity_split", (value) => { value.baseProjection.messageTemperature.pressure = "F101を確認します"; }],
    ["baseProjection.messageTemperature.adjustment", "v1_parity_split", (value) => { value.baseProjection.messageTemperature.adjustment = "F101を確認します"; }],
    ["baseProjection.optionalDetails.interpretations[*]", "v1_parity_split", (value) => { value.baseProjection.optionalDetails.interpretations[0] = "F101を確認します"; }],
    ["baseProjection.optionalDetails.shortLetter[*]", "v1_parity_legacy", (value) => { value.baseProjection.optionalDetails.shortLetter[0] = "F101を確認します"; }],
    ["baseProjection.optionalDetails.anxietyReframe[*]", "v1_parity_legacy", (value) => { value.baseProjection.optionalDetails.anxietyReframe[0] = "F101を確認します"; }],
    ["baseProjection.optionalDetails.expandedPlan[*].action", "v1_parity_split", (value) => { value.baseProjection.optionalDetails.expandedPlan[0].action = "F101を確認します"; }],
    ["baseProjection.optionalDetails.expandedPlan[*].avoid", "v1_parity_split", (value) => { value.baseProjection.optionalDetails.expandedPlan[0].avoid = "F101を確認します"; }],
    ["baseProjection.optionalDetails.planCommentary[*]", "v1_parity_split", (value) => { value.baseProjection.optionalDetails.planCommentary[0] = "F101を確認します"; }],
    ["baseProjection.fixedLimitation", "split_full_experience", (value) => { value.baseProjection.fixedLimitation = "F101を確認します"; }],
  ];
  assert.equal(cases.length, 19);
  for (const [pathName, fixtureId, mutate] of cases) {
    const candidate = clone(positiveProjections.get(fixtureId));
    experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(candidate);
    mutate(candidate);
    assert.throws(
      () => experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(candidate),
      undefined,
      pathName,
    );
  }
});

check("structural Decision schema topic policy timing and phase values remain accepted", () => {
  const candidate = clone(positiveProjections.get("v1_parity_split"));
  candidate.baseProjection.decisionCode = "reply_now";
  candidate.baseProjection.reassessment.conditions[0].resultingDirection =
    "wait_and_reassess";
  candidate.baseProjection.finalDraft.policy = "required_now";
  candidate.baseProjection.finalDraft.useTiming = "now";
  candidate.baseProjection.optionalDetails.expandedPlan[0].phase =
    "reassessment_condition";

  const decoded =
    experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(candidate);
  assert.equal(decoded.projectionSchemaVersion, "customer-assessment-experience-projection-v2");
  assert.equal(decoded.baseProjection.projectionSchemaVersion, "customer-assessment-projection-v1");
  assert.equal(decoded.baseProjection.sourceReportSchemaVersion, "m2-p4-split-runtime-report-v1");
  assert.equal(decoded.baseProjection.decisionCode, "reply_now");
  assert.equal(
    decoded.baseProjection.reassessment.conditions[0].resultingDirection,
    "wait_and_reassess",
  );
  assert.equal(decoded.baseProjection.finalDraft.policy, "required_now");
  assert.equal(decoded.baseProjection.finalDraft.useTiming, "now");
  assert.equal(
    decoded.baseProjection.optionalDetails.expandedPlan[0].phase,
    "reassessment_condition",
  );
  assert.deepEqual(decoded.baseProjection.requestedTopics, candidate.baseProjection.requestedTopics);
  const acceptedRequestedTopics = new Set(
    [...positiveProjections.values()].flatMap(
      (projection) => projection.baseProjection.requestedTopics,
    ),
  );
  assert.deepEqual(sorted(acceptedRequestedTopics), [
    "decide_send_or_wait",
    "draft_message",
    "message_impact",
    "next_three_days",
    "organize_emotions",
    "relationship",
  ]);
});

check("all previous 20 negative fixtures still reject fail-closed", () => {
  let rejected = 0;
  for (const fixture of fixtures.negative_fixtures.slice(0, 20)) {
    const base = projectionForNegativeFixture(fixture);
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

check("all 15 R1 correction negative fixtures reject fail-closed", () => {
  let rejected = 0;
  for (const fixture of fixtures.negative_fixtures.slice(20)) {
    const base = projectionForNegativeFixture(fixture);
    const invalid = mutateNegative(base, fixture.mutation);
    assert.throws(
      () => experienceProjection.decodeCustomerAssessmentExperienceProjectionV2(invalid),
      undefined,
      fixture.fixture_id,
    );
    rejected += 1;
  }
  assert.equal(rejected, 15);
});

check("project function rejects source identifiers before returning 4/4", () => {
  let rejected = 0;
  for (const fixture of fixtures.source_projection_rejection_fixtures) {
    const baseFixture = fixtures.positive_fixtures.find(
      (candidate) => candidate.fixture_id === fixture.base_fixture,
    );
    assert.ok(baseFixture, fixture.fixture_id);
    const readyResult = applyPatches(
      instantiate(baseFixture),
      fixture.result_patches,
    );
    assert.throws(
      () =>
        experienceProjection.projectCustomerAssessmentExperienceV2(
          readyResult,
          baseFixture.requested_topics,
        ),
      undefined,
      fixture.fixture_id,
    );
    rejected += 1;
  }
  assert.equal(rejected, 4);
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
    for (const entry of customerTextEntries(projected)) {
      assert.equal(
        factIdPattern.test(entry.text) || decisionCodePattern.test(entry.text),
        false,
        `${caseId}:${entry.path}:${JSON.stringify(entry.text)}`,
      );
    }
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
  assert.equal(
    implementationPackages.packages.find((item) => item.package_id === "R2-A")
      .implementation_authorized,
    true,
  );
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
  assert.equal(offlineResults.branch, expectedBranch);
  assert.deepEqual(offlineResults.accepted_authority, {
    doctrine_status:
      "reassuring_assessment_experience_doctrine_human_chatgpt_accepted_complete_r2_a_authorized",
    r2_a_implementation_authorized: true,
    acceptance_date: "2026-08-16",
  });
  assert.deepEqual(offlineResults.historical_reuse, {
    candidate_commit: historicalCandidate,
    identifier_hardening_commit: historicalIdentifierHardening,
    historical_references_read_only: true,
    r2_a_architecture_accepted: true,
    historical_candidate_identifier_exclusion_gap_found: true,
    current_identifier_exclusion_hardened: true,
    provider_quality_established: false,
    provider_rerun_authorized: false,
  });
  assert.deepEqual(offlineResults.fixture_counts, {
    positive: 8,
    negative: 35,
    previous_negative: 20,
    r1_negative: 15,
    source_projection_rejection: 4,
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
  assert.equal(offlineResults.acceptance_boundary.r2_a_implementation_authorized, true);
  assert.equal(offlineResults.acceptance_boundary.r2_a_implementation_complete, true);
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
  const head = git(["rev-parse", "HEAD"]);
  const diffCheckArgs =
    head === baseline ? ["diff", "--check"] : ["diff", "--check", baseline, head];
  assert.equal(git(diffCheckArgs), "");
  exactScope.forEach((candidate) => {
    assert.doesNotMatch(readText(candidate), /[\t ]+$/gmu, candidate);
  });
});

const failed = checks.filter((result) => !result.passed);
console.log("");
console.log(
  `Experience projection verifier: ${failed.length === 0 ? "PASS" : "FAIL"} ${checks.length - failed.length}/${checks.length}`,
);
console.log("Exact authorized scope: 7/7 NEW paths");
console.log(`Q0-A acceptance verifier: ${q0AcceptanceVerifierSummary}`);
console.log(`R1 Doctrine verifier: ${r1DoctrineVerifierSummary}`);
console.log(`Package B accepted verifier: ${packageBVerifierSummary}`);
console.log(`Package A R1 accepted verifier: ${packageAR1VerifierSummary}`);
console.log(
  "Historical candidate: da325d9 read-only; identifier hardening: 89a6d55 reused",
);
console.log("Positive fixtures: 8/8");
console.log("Previous negative fixtures: 20/20; R1 negative fixtures: 15/15");
console.log("Source projection rejection fixtures: 4/4");
console.log("Frozen E-R3: ready 3/3; safety/rejected 3/3 not accepted ready Product");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
if (failed.length > 0) process.exitCode = 1;
