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
import Ajv2020 from "ajv/dist/2020.js";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  evaluateJpy980InputSufficiencyV1,
  JPY980_CLARIFICATION_CATALOG_V1,
  JPY980_CLARIFICATION_TARGETS_V1,
  JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE,
  JPY980_INPUT_SUFFICIENCY_POLICY_V1_VERSION,
  JPY980_INPUT_SUFFICIENCY_RESULT_V1_SCHEMA_VERSION,
  JPY980_INPUT_SUFFICIENCY_STATES_V1,
} from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A1";
const baseline = "cfad0bd4ca3fd2304b00d072624e624f98c09b29";
const planningParent = "885d46db8bfbc2add4828b7205af9a9e3d6c009c";
const r2BProductSnapshot = "fa956b9b1941c73f8e1767c64ab24f07fadd36c6";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-input-sufficiency-policy";
const correctionBranch =
  "plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-depth-r1-correction";
const expectedCommitSubject =
  "feat: add deterministic JPY980 input sufficiency policy";

const previousPackageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1";
const policyPath =
  "lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts";
const policyContractPath = packageRoot + "/policy-contract-v1.json";
const routingFixturesPath = packageRoot + "/routing-fixtures-v1.json";
const offlineResultsPath = packageRoot + "/offline-results-v1.json";
const capabilitiesPath = packageRoot + "/capabilities-v1.json";
const previousWorkPackagesPath =
  previousPackageRoot + "/implementation-work-packages-v1.json";
const previousCapabilitiesPath = previousPackageRoot + "/capabilities-v1.json";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A1_REVIEW.md";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-input-sufficiency-policy.mjs";
const correctionVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-plan-r1-correction.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";
const baseStructuredIntakeSchemaPath =
  "lib/assessment/runtime/contracts/base-structured-intake-v2.schema.json";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  previousWorkPackagesPath,
  previousCapabilitiesPath,
];
const newPaths = [
  policyPath,
  policyContractPath,
  routingFixturesPath,
  offlineResultsPath,
  capabilitiesPath,
  verifierPath,
  reviewDocumentPath,
];
const exactScope = [...updatedPaths, ...newPaths];

const immutableCorrectionPaths = [
  previousPackageRoot + "/human-product-finding-v1.json",
  previousPackageRoot + "/jpy980-value-architecture-v1.json",
  previousPackageRoot + "/input-sufficiency-routing-v1.json",
  previousPackageRoot + "/semantic-depth-contract-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_C_R1_JPY980_VALUE_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1-jpy980-value-plan.mjs",
  correctionVerifierPath,
];

const productSnapshot = {
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

function optionalRemoteHead(branchName) {
  const output = git([
    "ls-remote",
    "--heads",
    "origin",
    "refs/heads/" + branchName,
  ]);
  const rows = output.split(/\r?\n/u).filter(Boolean);
  assert.ok(rows.length <= 1, branchName);
  return rows.length === 0 ? null : rows[0].split(/\s+/u)[0];
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

function unique(values) {
  return [...new Set(values)];
}

function worktreeBlob(relativePath) {
  return git(["hash-object", "--path=" + relativePath, relativePath]);
}

function assertBaselineBlobUnchanged(relativePath) {
  assert.equal(
    worktreeBlob(relativePath),
    git(["rev-parse", baseline + ":" + relativePath]),
    relativePath,
  );
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function overlay(base, patch) {
  if (!isObject(patch)) return structuredClone(patch);
  const result = isObject(base) ? structuredClone(base) : {};
  for (const [key, value] of Object.entries(patch)) {
    result[key] = isObject(value)
      ? overlay(result[key], value)
      : structuredClone(value);
  }
  return result;
}

function compactDiagnostic(value) {
  return String(value ?? "")
    .split(/\r?\n/u)
    .filter((line) => !line.includes("LF will be replaced by CRLF"))
    .join("\n");
}

function runCorrectionVerifierAtAuthority() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-v1-a1-correction-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
    );
    const safeDirectory = "safe.directory=" + cloneRoot.replaceAll("\\", "/");
    execFileSync(
      "git.exe",
      ["-c", safeDirectory, "config", "core.autocrlf", "true"],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const refs = git([
      "for-each-ref",
      "--format=%(refname)%09%(objectname)",
      "refs/heads",
      "refs/remotes/origin",
    ])
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => line.split("\t"));
    for (const [refName, revision] of refs) {
      execFileSync(
        "git.exe",
        ["-c", safeDirectory, "update-ref", refName, revision],
        { cwd: cloneRoot, stdio: "pipe" },
      );
    }

    execFileSync(
      "git.exe",
      [
        "-c",
        safeDirectory,
        "checkout",
        "--quiet",
        "-B",
        correctionBranch,
        baseline,
      ],
      { cwd: cloneRoot, stdio: "pipe" },
    );

    const trackedPaths = git(["ls-tree", "-r", "--name-only", baseline])
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const candidate of trackedPaths) {
      const sourcePath = path.join(root, candidate);
      if (!existsSync(sourcePath)) continue;
      if (
        worktreeBlob(candidate) !==
        git(["rev-parse", baseline + ":" + candidate])
      ) {
        continue;
      }
      copyFileSync(sourcePath, path.join(cloneRoot, candidate));
    }

    const sourceContract = readJson(p1SourceContractPath);
    const markerPath = sourceContract.frozen_state.marker_path;
    const markerSource = path.join(root, markerPath);
    const markerTarget = path.join(
      cloneRoot,
      ".git",
      path.basename(markerPath),
    );
    assert.equal(existsSync(markerSource), true, markerPath);
    copyFileSync(markerSource, markerTarget);

    const result = spawnSync(
      process.execPath,
      [path.join(cloneRoot, correctionVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Correction verifier failed at accepted authority.\nstdout:\n" +
          compactDiagnostic(result.stdout) +
          "\nstderr:\n" +
          compactDiagnostic(result.stderr),
      );
    }
    return result.stdout;
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const fixtures = readJson(routingFixturesPath);
const offlineResults = readJson(offlineResultsPath);
const baseSchema = readJson(baseStructuredIntakeSchemaPath);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateBaseStructuredIntake = ajv.compile(baseSchema);

function buildFixtureInput(fixture) {
  const scenarioPatch = fixtures.scenario_patches[fixture.scenario];
  assert.ok(isObject(scenarioPatch), fixture.scenario);
  const scenario = overlay(fixtures.base_structured_intake_template, scenarioPatch);
  const baseStructuredIntake = overlay(scenario, fixture.input_patch);
  return {
    aggregateSafety: {
      classification: fixture.aggregate_safety_classification,
    },
    baseStructuredIntake,
    decisionFacts: structuredClone(baseStructuredIntake.decision_facts),
    baseWritingSignals: structuredClone(
      baseStructuredIntake.base_writing_signals,
    ),
    clarificationAlreadyUsed: fixture.clarification_already_used,
  };
}

function evaluateFixture(fixture) {
  return evaluateJpy980InputSufficiencyV1(buildFixtureInput(fixture));
}

const fixtureById = new Map(
  fixtures.fixtures.map((fixture) => [fixture.fixture_id, fixture]),
);
const offlineById = new Map(
  offlineResults.results.map((entry) => [entry.fixture_id, entry]),
);
const actualById = new Map();

const allBaselinePaths = git(["ls-tree", "-r", "--name-only", baseline])
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((relativePath) => relativePath.replaceAll("\\", "/"));

const runtimeIntegrationProtected = unique([
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/types.ts",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/openai-schema.ts",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "lib/assessment/runtime/supabase-repository.ts",
  ...allBaselinePaths.filter(
    (relativePath) =>
      relativePath.startsWith("lib/assessment/runtime/contracts/") ||
      relativePath.startsWith("app/api/") ||
      relativePath.startsWith("supabase/migrations/"),
  ),
]);

const broaderProtected = unique([
  "components/runtime/CustomerAssessmentNote.tsx",
  "components/runtime/CustomerAssessmentNote.module.css",
  "components/runtime/CustomerDraftCopyButton.tsx",
  "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  ...allBaselinePaths.filter((relativePath) => {
    const lower = relativePath.toLowerCase();
    return (
      lower.startsWith("ai/") ||
      lower.includes("pb-05") ||
      lower.includes("semantic-disposition") ||
      lower.includes("payment") ||
      lower.includes("stripe") ||
      lower.includes("payjp")
    );
  }),
]);

let correctionVerifierSummary = "not_run";
let originalPlanningSummary = "not_run";
let r2CPreparationSummary = "not_run";
let r2BSummary = "not_run";
let upstreamSummary = "not_run";
let commitState = "not_checked";
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

await check("exact branch parent one-commit authority main remote and stash", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), planningParent);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const commitCount = Number(git(["rev-list", "--count", baseline + ".." + head]));
  assert.ok(commitCount === 0 || commitCount === 1, String(commitCount));
  if (commitCount === 1) {
    assert.equal(git(["rev-parse", head + "^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", head]), expectedCommitSubject);
    commitState = "one direct child";
  } else {
    commitState = "precommit candidate";
  }
  assert.equal(git(["rev-parse", correctionBranch]), baseline);
  assert.equal(git(["rev-parse", "origin/" + correctionBranch]), baseline);
  assert.equal(remoteHead(correctionBranch), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  const currentRemote = optionalRemoteHead(expectedBranch);
  if (currentRemote !== null) assert.equal(currentRemote, head);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact implementation scope 12/12 with 5 UPDATE and 7 NEW", () => {
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
  assert.equal(actual.length, 12);
  assert.deepEqual(sorted(actual.map((item) => item.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(actual.filter((item) => item.status === "M").map((item) => item.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(actual.filter((item) => item.status === "A").map((item) => item.path)),
    sorted(newPaths),
  );
  for (const candidate of updatedPaths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), true, candidate);
  }
  for (const candidate of newPaths) {
    assert.equal(gitObjectExists(baseline + ":" + candidate), false, candidate);
  }
});

await check("strict UTF-8 JSON diff hygiene and sensitive scan", () => {
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*[=:]\s*["'][^"']{8,}["']/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
  ];
  let sensitiveValues = 0;
  for (const candidate of exactScope) {
    const source = readText(candidate);
    assert.equal(source.includes("\uFFFD"), false, candidate);
    assert.doesNotMatch(source, /[\t ]+$/gmu, candidate);
    assert.equal(
      source.replaceAll("\r\n", "\n").endsWith("\n\n"),
      false,
      candidate + ": blank line at EOF",
    );
    for (const pattern of secretPatterns) {
      sensitiveValues += [...source.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitiveValues, 0);
  for (const candidate of [
    policyContractPath,
    routingFixturesPath,
    offlineResultsPath,
    capabilitiesPath,
    previousWorkPackagesPath,
    previousCapabilitiesPath,
  ]) {
    readJson(candidate);
  }
  git(["diff", "--check", baseline, "--"]);
});

await check("accepted correction and every upstream verifier remain PASS", () => {
  const output = runCorrectionVerifierAtAuthority();
  const expected = [
    /JPY980 value architecture R1 correction verifier: PASS 19\/19/u,
    /Original planning verifier at 885d46db: PASS 18\/18/u,
  ];
  for (const pattern of expected) assert.match(output, pattern);

  const correctionVerifierSource = readText(correctionVerifierPath);
  for (const upstreamEvidence of [
    "R2-C preparation verifier: PASS 17",
    "R2-B verifier: PASS 21",
    "R2-A acceptance verifier: PASS 14",
    "R2-A verifier: PASS 35",
    "Q0-A acceptance verifier: PASS 12",
    "R1 Doctrine verifier: PASS 19",
    "Historical Package B verifier: PASS 20",
    "Package A R1 verifier: PASS 23",
    "Decision Policy verifier: PASS 40",
  ]) {
    assert.ok(correctionVerifierSource.includes(upstreamEvidence));
  }
  correctionVerifierSummary = "PASS 19/19";
  originalPlanningSummary = "PASS 18/18";
  r2CPreparationSummary = "PASS 17/17";
  r2BSummary = "PASS 21/21";
  upstreamSummary = "PASS";
});

await check("accepted correction artifacts and acceptance authority are preserved", () => {
  for (const candidate of immutableCorrectionPaths) {
    assertBaselineBlobUnchanged(candidate);
  }
  const capabilities = readJson(previousCapabilitiesPath);
  assert.equal(
    capabilities.authority.accepted_jpy980_value_architecture_r1_correction,
    baseline,
  );
  assert.deepEqual(capabilities.correction_acceptance, {
    chatgpt_review: "PASS",
    chatgpt_review_complete: true,
    human_review: "PASS",
    human_review_complete: true,
    human_acceptance_complete: true,
    correction_acceptance_complete: true,
    acceptance_date: "2026-08-16",
  });
});

await check("V1-A split authorizes only V1-A1 and keeps V1-A incomplete", () => {
  const work = readJson(previousWorkPackagesPath);
  const packageA = work.packages.find((item) => item.id === "V1-A");
  const a1 = packageA.subpackages.find((item) => item.id === "V1-A1");
  const a2 = packageA.subpackages.find((item) => item.id === "V1-A2");
  assert.equal(packageA.complete, false);
  assert.equal(packageA.authorized, false);
  assert.equal(a1.name, "Deterministic Input Sufficiency Policy");
  assert.equal(a1.status, "implemented_pending_review");
  assert.equal(a1.implementation_authorized, true);
  assert.equal(a2.name, "Runtime/API/UI Clarification Integration");
  assert.equal(a2.status, "unauthorized");
  assert.equal(a2.implementation_authorized, false);
  for (const id of ["V1-B", "V1-C", "V1-D"]) {
    const futurePackage = work.packages.find((item) => item.id === id);
    assert.equal(futurePackage.status, "unauthorized");
    assert.equal(futurePackage.authorized, false);
  }
});

await check("public policy version state and result contract are exact", () => {
  assert.equal(
    JPY980_INPUT_SUFFICIENCY_POLICY_V1_VERSION,
    "m2-p4-jpy980-input-sufficiency-policy-v1",
  );
  assert.equal(
    JPY980_INPUT_SUFFICIENCY_RESULT_V1_SCHEMA_VERSION,
    "m2-p4-jpy980-input-sufficiency-result-v1",
  );
  assert.deepEqual(JPY980_INPUT_SUFFICIENCY_STATES_V1, [
    "full_paid_ready_candidate",
    "needs_one_clarifying_answer",
    "not_full_product_candidate",
    "safety_blocked",
  ]);
  const contract = readJson(policyContractPath);
  assert.deepEqual(contract.result_contract.required_fields, [
    "schemaVersion",
    "state",
    "reasonCodes",
    "missingMaterialDimensions",
    "clarificationBudget",
    "clarification",
  ]);
  assert.equal(contract.semantic_basis_assessed_but_not_generated.product_fields_generated_by_v1_a1, false);
});

await check("policy uses structured authority without ID raw-prose or Provider routing", () => {
  const source = readText(policyPath);
  for (const required of [
    "base-structured-intake-v2.schema.json",
    "m2-p4-base-decision-facts-v2",
    "m2-p4-base-writing-signals-v1",
    "baseStructuredIntake",
    "decisionFacts",
    "baseWritingSignals",
    "material_unknowns",
    "user_emotions",
  ]) {
    assert.ok(source.includes(required), required);
  }
  assert.equal(
    baseSchema.properties.schema_version.const,
    "pipeline-schema-base-v2.0.0",
  );
  assert.doesNotMatch(source, /caseId|fixtureId/u);
  assert.doesNotMatch(
    source,
    /(?:statement|description)\s*\.\s*(?:includes|match|search|startsWith|endsWith)/u,
  );
  assert.doesNotMatch(source, /new\s+RegExp/u);
  assert.doesNotMatch(
    source,
    /(?:openai|provider|fetch\s*\(|invokeStage|supabase|repository)/iu,
  );
  assert.equal(
    readText("lib/assessment/runtime/pipeline.ts").includes(
      "jpy980-input-sufficiency-policy-v1",
    ),
    false,
  );
});

await check("bounded clarification catalog is complete and customer-safe", () => {
  assert.deepEqual(JPY980_CLARIFICATION_TARGETS_V1, [
    "material_relationship_or_communication_concern",
    "latest_contact_timing",
    "usual_reply_cadence",
    "central_fear_or_decision_concern",
    "relationship_intent",
    "requested_message_tone",
  ]);
  const entries = Object.values(JPY980_CLARIFICATION_CATALOG_V1);
  assert.equal(entries.length, 6);
  for (const entry of entries) {
    assert.match(entry.question, /[\u3040-\u30ff\u3400-\u9fff]/u);
    assert.equal([...entry.question.matchAll(/？/gu)].length, 1, entry.target);
    assert.doesNotMatch(
      entry.question,
      /氏名|住所|電話番号|メールアドレス|勤務先名|学校名|アカウントID/u,
    );
  }
});

await check("Safety always wins before Product sufficiency", () => {
  const fixture = fixtureById.get("I_non_normal_safety_always_blocks");
  const normalInput = buildFixtureInput(fixture);
  const malformedButBlocked = {
    ...normalInput,
    baseStructuredIntake: { schema_version: "malformed" },
    decisionFacts: {},
    baseWritingSignals: {},
  };
  const result = evaluateJpy980InputSufficiencyV1(malformedButBlocked);
  assert.equal(result.state, "safety_blocked");
  assert.equal(result.clarification, null);
  assert.deepEqual(result.missingMaterialDimensions, []);
});

await check("one-total-question budget and clarification invariants hold", () => {
  for (const fixture of fixtures.fixtures.filter((item) => !item.expected_error_code)) {
    const evaluated = evaluateFixture(fixture);
    assert.equal(evaluated.clarificationBudget.maximumQuestionsTotal, 1);
    assert.equal(
      evaluated.clarificationBudget.questionsAlreadyUsed,
      fixture.clarification_already_used ? 1 : 0,
    );
    assert.equal(
      evaluated.clarificationBudget.questionsRemaining,
      fixture.clarification_already_used ? 0 : 1,
    );
    if (evaluated.state === "needs_one_clarifying_answer") {
      assert.notEqual(evaluated.clarification, null);
      assert.equal(fixture.clarification_already_used, false);
    } else {
      assert.equal(evaluated.clarification, null);
    }
    assert.equal(Array.isArray(evaluated.clarification), false);
  }
  const contract = readJson(policyContractPath);
  assert.equal(contract.result_contract.clarification_budget.automatic_second_question_allowed, false);
  assert.equal(contract.result_contract.clarification_budget.clarification_loop_allowed, false);
});

await check("multiple gaps and budget exhaustion route out", () => {
  const multiple = evaluateFixture(
    fixtureById.get("E_reply_waiting_multiple_independent_gaps_routes_out"),
  );
  assert.equal(multiple.state, "not_full_product_candidate");
  assert.deepEqual(multiple.missingMaterialDimensions, [
    "latest_contact_timing",
    "usual_reply_cadence",
  ]);
  assert.ok(
    multiple.reasonCodes.includes(
      "MULTIPLE_INDEPENDENT_MATERIAL_DIMENSIONS_MISSING",
    ),
  );
  for (const fixtureId of [
    "B_routine_administrative_reply_budget_exhausted_routes_out",
    "H_draft_missing_tone_after_budget_routes_out",
  ]) {
    const exhausted = evaluateFixture(fixtureById.get(fixtureId));
    assert.equal(exhausted.state, "not_full_product_candidate");
    assert.ok(exhausted.reasonCodes.includes("CLARIFICATION_BUDGET_EXHAUSTED"));
    assert.equal(exhausted.clarification, null);
  }
});

await check("all non-malformed fixtures satisfy the existing Base schema", () => {
  assert.equal(fixtures.fixtures.length, 12);
  assert.deepEqual(
    sorted(fixtures.fixtures.map((fixture) => fixture.requirement)),
    sorted(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]),
  );
  for (const fixture of fixtures.fixtures) {
    const input = buildFixtureInput(fixture);
    const valid = validateBaseStructuredIntake(input.baseStructuredIntake);
    if (fixture.requirement === "J") {
      assert.equal(valid, false);
    } else {
      assert.equal(
        valid,
        true,
        fixture.fixture_id + ": " + JSON.stringify(validateBaseStructuredIntake.errors),
      );
    }
  }
});

await check("required A through I routing outcomes pass", () => {
  for (const fixture of fixtures.fixtures.filter((item) => /^[A-I]$/u.test(item.requirement))) {
    const evaluated = evaluateFixture(fixture);
    actualById.set(fixture.fixture_id, evaluated);
    assert.equal(evaluated.state, fixture.expected_state, fixture.fixture_id);
    assert.equal(
      evaluated.clarification?.target ?? null,
      fixture.expected_target,
      fixture.fixture_id,
    );
  }
});

await check("malformed and unsupported policy input fails closed", () => {
  const fixture = fixtureById.get("J_unsupported_schema_fails_closed");
  assert.throws(
    () => evaluateFixture(fixture),
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE,
  );
  assert.equal(
    offlineById.get(fixture.fixture_id).error.safeCode,
    JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE,
  );

  const malformedNestedInput = structuredClone(
    buildFixtureInput(
      fixtureById.get("C_reply_waiting_sufficient_is_ready_candidate"),
    ),
  );
  delete malformedNestedInput.baseStructuredIntake.boundaries;
  assert.throws(
    () => evaluateJpy980InputSufficiencyV1(malformedNestedInput),
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE,
  );
});

await check("same exact input is deeply deterministic", () => {
  const fixture = fixtureById.get("K_repeated_exact_input_is_deep_equal");
  const input = buildFixtureInput(fixture);
  const first = evaluateJpy980InputSufficiencyV1(structuredClone(input));
  const second = evaluateJpy980InputSufficiencyV1(structuredClone(input));
  assert.deepEqual(first, second);
  const canonicalFixture = fixtureById.get(fixture.must_match_fixture);
  assert.deepEqual(input, buildFixtureInput(canonicalFixture));
  assert.deepEqual(first, evaluateFixture(canonicalFixture));
  actualById.set(fixture.fixture_id, first);
});

await check("case and fixture metadata cannot change the Product result", () => {
  const fixture = fixtureById.get(
    "L_case_and_fixture_metadata_do_not_change_result",
  );
  const input = buildFixtureInput(fixture);
  const baseResult = evaluateJpy980InputSufficiencyV1(input);
  const metadataResult = evaluateJpy980InputSufficiencyV1({
    ...input,
    ...fixture.metadata_mutation,
  });
  assert.deepEqual(metadataResult, baseResult);
  assert.deepEqual(baseResult, evaluateFixture(fixtureById.get(fixture.must_match_fixture)));
  actualById.set(fixture.fixture_id, baseResult);
});

await check("offline results are exact and all 12 fixtures PASS", () => {
  assert.equal(offlineResults.status, "PASS");
  assert.equal(offlineResults.fixture_count, 12);
  assert.equal(offlineResults.passed, 12);
  assert.equal(offlineResults.failed, 0);
  assert.equal(offlineResults.results.length, 12);
  for (const fixture of fixtures.fixtures) {
    const saved = offlineById.get(fixture.fixture_id);
    assert.equal(saved.requirement, fixture.requirement);
    if (fixture.expected_error_code) continue;
    const actual = actualById.get(fixture.fixture_id) ?? evaluateFixture(fixture);
    assert.deepEqual(actual, saved.result, fixture.fixture_id);
  }
});

await check("semantic basis is assessed without count padding or Product generation", () => {
  const contract = readJson(policyContractPath);
  assert.deepEqual(contract.semantic_basis_assessed_but_not_generated.mandatory, [
    "consultation_core",
    "evidence_and_significance",
    "decision_logic",
    "action_artifact",
    "emotional_containment",
  ]);
  assert.deepEqual(contract.semantic_basis_assessed_but_not_generated.at_least_one_boundary, [
    "uncertainty_boundary",
    "reassessment_trigger",
  ]);
  assert.equal(contract.routing_rules.word_count_used_as_sufficiency, false);
  assert.equal(contract.routing_rules.fact_count_alone_used_as_sufficiency, false);
  assert.equal(contract.routing_rules.section_count_used_as_sufficiency, false);
  assert.equal(contract.routing_rules.requested_topic_count_alone_used_as_sufficiency, false);
  assert.equal(
    evaluateFixture(
      fixtureById.get(
        "A_routine_administrative_reply_clarifies_material_concern",
      ),
    ).state,
    "needs_one_clarifying_answer",
  );
});

await check("active Runtime API schemas DB and migrations are unchanged", () => {
  assert.ok(runtimeIntegrationProtected.length > 20);
  assert.ok(runtimeIntegrationProtected.some((item) => item.startsWith("app/api/")));
  assert.ok(runtimeIntegrationProtected.some((item) => item.startsWith("supabase/migrations/")));
  for (const candidate of runtimeIntegrationProtected) {
    assertBaselineBlobUnchanged(candidate);
  }
  const contract = readJson(policyContractPath);
  assert.deepEqual(contract.runtime_boundary, {
    active_pipeline_connected: false,
    runtime_eligibility_v3_widened: false,
    api_response_changed: false,
    ui_clarification_flow_changed: false,
    db_eligibility_constraint_changed: false,
    not_full_product_candidate_representation_owner: "V1-A2",
    v1_a2_authorized: false,
  });
});

await check("Prompt Provider PB-05 semantic UI and Payment blobs are unchanged", () => {
  assert.ok(broaderProtected.length > 20);
  assert.ok(broaderProtected.some((item) => item.startsWith("ai/prompts/")));
  assert.ok(broaderProtected.some((item) => item.includes("pb-05")));
  assert.ok(broaderProtected.some((item) => item.includes("semantic-disposition")));
  assert.ok(broaderProtected.some((item) => item.toLowerCase().includes("payment")));
  for (const candidate of broaderProtected) {
    assertBaselineBlobUnchanged(candidate);
  }
});

await check("R2-B Product snapshot remains byte-for-byte unchanged", () => {
  for (const [relativePath, expectedBlob] of Object.entries(productSnapshot)) {
    assert.equal(worktreeBlob(relativePath), expectedBlob, relativePath);
    assert.equal(
      git(["rev-parse", r2BProductSnapshot + ":" + relativePath]),
      expectedBlob,
      relativePath + " at R2-B",
    );
  }
});

await check("authority status operations and rolling documents remain closed", () => {
  const capabilities = readJson(capabilitiesPath);
  const previousCapabilities = readJson(previousCapabilitiesPath);
  assert.equal(capabilities.task_id, taskId);
  assert.equal(capabilities.implementation["V1-A1"].status, "implemented_pending_review");
  assert.equal(capabilities.implementation["V1-A2"].authority, "unauthorized");
  assert.equal(capabilities.implementation["V1-B"], "unauthorized");
  assert.equal(capabilities.implementation["V1-C"], "unauthorized");
  assert.equal(capabilities.implementation["V1-D"], "unauthorized");
  assert.equal(capabilities.implementation.v1_a_overall_complete, false);
  assert.deepEqual(capabilities.operations, {
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    migrations: 0,
  });
  assert.deepEqual(capabilities.current_product_authority, {
    r2_c: "remediation_required",
    experienceProductJudgment: "pending_remediation",
    jpy980RuntimeReadiness: "not_established",
    globalQ0Completion: false,
    production_runtime_authorized: false,
    payment_authorized: false,
    provider_execution_authorized: false,
    main_integration_authorized: false,
  });
  assert.equal(previousCapabilities.current_finding.r2_c, "remediation_required");
  assert.equal(previousCapabilities.current_finding.experienceProductJudgment, "pending_remediation");
  assert.equal(previousCapabilities.current_finding.jpy980RuntimeReadiness, "not_established");
  assert.equal(previousCapabilities.current_finding.globalQ0Completion, false);
  const documents = [
    readText("docs/CODEX_HANDOFF.md"),
    readText("docs/CURRENT_FOCUS.md"),
    readText("docs/WBS.md"),
    readText(reviewDocumentPath),
  ].join("\n");
  for (const required of [
    expectedBranch,
    baseline,
    "implemented_pending_human_chatgpt_review",
    "V1-A2",
    "unauthorized",
    "remediation_required",
    "pending_remediation",
    "not_established",
    "0 / 0 / 0",
    "5 UPDATE + 7 NEW",
  ]) {
    assert.ok(documents.includes(required), required);
  }
});

await check("main next-env and final diff boundary remain unchanged", () => {
  const nextEnvPath = "next-env.d.ts";
  assert.equal(
    worktreeBlob(nextEnvPath),
    git(["rev-parse", baseline + ":" + nextEnvPath]),
    nextEnvPath,
  );
  assert.equal(git(["diff", "--numstat", baseline, "--", nextEnvPath]), "");
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  git(["diff", "--check", baseline, "--"]);
});

const failed = checks.filter((item) => !item.passed);
if (failed.length > 0) {
  console.error("\nV1-A1 deterministic input sufficiency policy verifier: FAIL");
  console.error(
    "Failed checks: " + failed.map((item) => item.name).join(", "),
  );
  process.exitCode = 1;
} else {
  console.log(
    "\nV1-A1 deterministic input sufficiency policy verifier: PASS " +
      checks.length +
      "/" +
      checks.length,
  );
  console.log("Exact implementation scope: 12/12; updated 5; new 7");
  console.log("Commit state: " + commitState);
  console.log("Routing fixtures: PASS 12/12");
  console.log("JPY980 R1 Correction verifier: " + correctionVerifierSummary);
  console.log("Original JPY980 planning verifier: " + originalPlanningSummary);
  console.log("R2-C preparation verifier: " + r2CPreparationSummary);
  console.log("R2-B verifier: " + r2BSummary);
  console.log("All upstream accepted verifiers: " + upstreamSummary);
  console.log("Clarification budget: 1 total; automatic second question: prohibited");
  console.log("Active Runtime / API / UI / DB integration changed: 0 / 0 / 0 / 0");
  console.log("Provider / DB / Supabase: 0 / 0 / 0");
  console.log("R2-C / experienceProductJudgment: remediation_required / pending_remediation");
  console.log("JPY980 Runtime readiness: not_established");
  console.log("Global Q0: false");
  console.log("Product snapshot changed: false");
  console.log("next-env.d.ts drift: 0");
}
