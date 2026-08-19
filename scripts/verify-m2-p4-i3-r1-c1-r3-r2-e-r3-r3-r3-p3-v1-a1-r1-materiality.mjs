import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  evaluateJpy980InputSufficiencyV1,
  JPY980_CLARIFICATION_CATALOG_V1,
  JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE,
  JPY980_INPUT_SUFFICIENCY_POLICY_V1_VERSION,
  JPY980_INPUT_SUFFICIENCY_RESULT_V1_SCHEMA_VERSION,
  JPY980_INPUT_SUFFICIENCY_STATES_V1,
} from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A1-R1";
const baseline = "65c245860813f6179689855b344dbf6fd425867a";
const baselineParent = "cfad0bd4ca3fd2304b00d072624e624f98c09b29";
const r2BProductSnapshot = "fa956b9b1941c73f8e1767c64ab24f07fadd36c6";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-r1-materiality";
const originalBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-input-sufficiency-policy";
const expectedCommitSubject = "fix: prevent emotion-only JPY980 materiality";

const previousPackageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1";
const policyPath =
  "lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts";
const routingFixturesPath = packageRoot + "/routing-fixtures-v1.json";
const offlineResultsPath = packageRoot + "/offline-results-v1.json";
const policyContractPath = packageRoot + "/policy-contract-v1.json";
const capabilitiesPath = packageRoot + "/capabilities-v1.json";
const workPackagesPath =
  previousPackageRoot + "/implementation-work-packages-v1.json";
const reviewDocumentPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A1_REVIEW.md";
const originalVerifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-input-sufficiency-policy.mjs";
const verifierPath =
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-r1-materiality.mjs";
const p1SourceContractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json";
const baseSchemaPath =
  "lib/assessment/runtime/contracts/base-structured-intake-v2.schema.json";

const updatedPaths = [
  policyPath,
  routingFixturesPath,
  offlineResultsPath,
  policyContractPath,
  capabilitiesPath,
  reviewDocumentPath,
  workPackagesPath,
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
];
const newPaths = [verifierPath];
const exactScope = [...updatedPaths, ...newPaths];

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

function remoteHead(branchName) {
  const value = optionalRemoteHead(branchName);
  assert.notEqual(value, null, branchName);
  return value;
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

function compactDiagnostic(value) {
  return String(value ?? "")
    .split(/\r?\n/u)
    .filter((line) => !line.includes("LF will be replaced by CRLF"))
    .join("\n");
}

function runOriginalVerifierAtImmutableCommit() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-v1-a1-r1-original-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync(
      "git.exe",
      ["clone", "--quiet", "--no-checkout", root, cloneRoot],
      { cwd: root, stdio: "pipe" },
    );
    const sourceNodeModules = path.join(root, "node_modules");
    assert.equal(existsSync(sourceNodeModules), true, sourceNodeModules);
    symlinkSync(
      sourceNodeModules,
      path.join(cloneRoot, "node_modules"),
      "junction",
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
        originalBranch,
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
      if (worktreeBlob(candidate) !== git(["rev-parse", baseline + ":" + candidate])) {
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
      [path.join(cloneRoot, originalVerifierPath)],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    if (result.status !== 0) {
      throw new Error(
        "Original V1-A1 verifier failed at immutable commit.\nstdout:\n" +
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
const baseSchema = readJson(baseSchemaPath);
const validateBaseStructuredIntake = new Ajv2020({
  allErrors: true,
  strict: false,
}).compile(baseSchema);

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
  originalVerifierPath,
  "components/runtime/CustomerAssessmentNote.tsx",
  "components/runtime/CustomerAssessmentNote.module.css",
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

let commitState = "unverified";
let originalVerifierSummary = "not run";
let upstreamSummary = "not run";
const failures = [];
let checkCount = 0;

async function check(name, callback) {
  checkCount += 1;
  try {
    await callback();
    console.log("PASS " + name);
  } catch (error) {
    failures.push(name);
    console.error("FAIL " + name);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact branch parent direct-child authority main remote and stash", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), baselineParent);
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
  assert.equal(git(["rev-parse", originalBranch]), baseline);
  assert.equal(git(["rev-parse", "origin/" + originalBranch]), baseline);
  assert.equal(remoteHead(originalBranch), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  const currentRemote = optionalRemoteHead(expectedBranch);
  if (currentRemote !== null) assert.equal(currentRemote, head);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact correction scope 11/11 with 10 UPDATE and 1 NEW", () => {
  const tracked = git(["diff", "--name-status", "--no-renames", baseline, "--"])
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
  assert.equal(actual.length, 11);
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
  assert.equal(gitObjectExists(baseline + ":" + verifierPath), false);
});

await check("strict UTF-8 JSON hygiene sensitive scan and diff check", () => {
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
    assert.equal(source.replaceAll("\r\n", "\n").endsWith("\n\n"), false);
    for (const pattern of secretPatterns) {
      sensitiveValues += [...source.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitiveValues, 0);
  for (const candidate of [
    routingFixturesPath,
    offlineResultsPath,
    policyContractPath,
    capabilitiesPath,
    workPackagesPath,
  ]) {
    readJson(candidate);
  }
  git(["diff", "--check", baseline, "--"]);
});

await check("original V1-A1 verifier remains immutable PASS 24/24", () => {
  assertBaselineBlobUnchanged(originalVerifierPath);
  const output = runOriginalVerifierAtImmutableCommit();
  for (const pattern of [
    /V1-A1 deterministic input sufficiency policy verifier: PASS 24\/24/u,
    /JPY980 R1 Correction verifier: PASS 19\/19/u,
    /Original JPY980 planning verifier: PASS 18\/18/u,
    /R2-C preparation verifier: PASS 17\/17/u,
    /R2-B verifier: PASS 21\/21/u,
    /All upstream accepted verifiers: PASS/u,
  ]) {
    assert.match(output, pattern);
  }
  originalVerifierSummary = "PASS 24/24";
  upstreamSummary = "PASS";
});

await check("review finding and correction authority are recorded exactly", () => {
  const contract = readJson(policyContractPath);
  const capabilities = readJson(capabilitiesPath);
  assert.equal(contract.authority.v1_a1_implementation_commit, baseline);
  assert.equal(contract.authority.v1_a1_chatgpt_review, "NEEDS_CORRECTION");
  assert.deepEqual(contract.authority.review_findings, {
    blocker: 0,
    major: 1,
    minor: 0,
    major_code: "emotion_presence_alone_may_establish_material_concern",
  });
  assert.equal(capabilities.authority.exact_parent, baseline);
  assert.deepEqual(capabilities.authority.review_findings, contract.authority.review_findings);
});

await check("public policy version state and result contract remain unchanged", () => {
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
});

await check("emotion presence is excluded from material-concern implementation", () => {
  const source = readText(policyPath);
  const materialityFunction = source.match(
    /function hasMaterialConcern\([\s\S]*?\n\}\n/u,
  )?.[0];
  assert.ok(materialityFunction);
  assert.doesNotMatch(materialityFunction, /user_emotions|emotions|statement|description/u);
  assert.match(materialityFunction, /hasMaterialIntent/u);
  assert.match(materialityFunction, /boundary\.status === "explicit"/u);
  assert.match(materialityFunction, /boundary\.repeated_unanswered_contact === true/u);
});

await check("machine-readable materiality contract is exact", () => {
  const contract = readJson(policyContractPath);
  assert.equal(contract.materiality_contract.emotion_presence_alone_is_sufficient, false);
  assert.deepEqual(contract.materiality_contract.accepted_existing_typed_signals, [
    "material_user_goal_detail",
    "explicit_boundary_state",
    "repeated_unanswered_contact",
  ]);
  assert.deepEqual(contract.materiality_contract.material_user_goal_detail_values, [
    "move_closer",
    "maintain_distance",
    "apologize",
    "repair_conflict",
    "decline_without_false_hope",
    "end_contact",
    "express_affection",
    "clarify_relationship",
  ]);
  assert.equal(contract.input_authority.user_emotions_establishes_materiality, false);
});

await check("material-concern clarification wording is neutral and bounded", () => {
  const expectedQuestion =
    "今回のやり取りで、いちばん気になっているのは、距離感・好意の伝わり方・返信への圧のどれに近いですか？特に気になる点がなければ「特になし」で大丈夫です。";
  const entry =
    JPY980_CLARIFICATION_CATALOG_V1.material_relationship_or_communication_concern;
  assert.equal(entry.question, expectedQuestion);
  assert.equal([...entry.question.matchAll(/？/gu)].length, 1);
  assert.equal(entry.question.startsWith("今回のやり取りで"), true);
  assert.equal(entry.question.includes("この返信で"), false);
});

await check("R1-A no-emotion administration clarifies material concern", () => {
  const fixture = fixtureById.get(
    "R1_A_routine_administrative_no_emotion_clarifies",
  );
  const input = buildFixtureInput(fixture);
  assert.deepEqual(input.baseStructuredIntake.user_emotions, []);
  const result = evaluateFixture(fixture);
  assert.equal(result.state, "needs_one_clarifying_answer");
  assert.equal(
    result.clarification?.target,
    "material_relationship_or_communication_concern",
  );
});

await check("R1-B incidental emotion still clarifies material concern", () => {
  const fixture = fixtureById.get(
    "R1_B_incidental_emotion_still_clarifies_material_concern",
  );
  const input = buildFixtureInput(fixture);
  assert.equal(input.baseStructuredIntake.user_emotions.length, 1);
  assert.equal(
    input.baseStructuredIntake.user_emotions[0].statement,
    "返信が来て少し安心している。",
  );
  const result = evaluateFixture(fixture);
  assert.equal(result.state, "needs_one_clarifying_answer");
  assert.equal(
    result.clarification?.target,
    "material_relationship_or_communication_concern",
  );
});

await check("R1-C incidental emotion after budget routes out", () => {
  const result = evaluateFixture(
    fixtureById.get("R1_C_incidental_emotion_after_budget_routes_out"),
  );
  assert.equal(result.state, "not_full_product_candidate");
  assert.equal(result.clarification, null);
  assert.equal(result.clarificationBudget.questionsAlreadyUsed, 1);
  assert.equal(result.clarificationBudget.questionsRemaining, 0);
  assert.ok(result.reasonCodes.includes("CLARIFICATION_BUDGET_EXHAUSTED"));
});

await check("R1-D material typed goal can establish concern independent of metadata", () => {
  const fixture = fixtureById.get(
    "R1_D_material_typed_goal_can_be_ready_candidate",
  );
  const input = buildFixtureInput(fixture);
  assert.equal(input.baseWritingSignals.user_goal_detail.value, "move_closer");
  assert.deepEqual(input.baseStructuredIntake.user_emotions, []);
  const original = evaluateJpy980InputSufficiencyV1(input);
  const metadataChanged = evaluateJpy980InputSufficiencyV1({
    ...structuredClone(input),
    caseId: "changed-case-id",
    fixtureId: "changed-fixture-id",
  });
  assert.equal(original.state, "full_paid_ready_candidate");
  assert.deepEqual(metadataChanged, original);
});

await check("all sixteen fixtures preserve existing Base schema validity", () => {
  assert.equal(fixtures.fixtures.length, 16);
  assert.deepEqual(
    sorted(fixtures.fixtures.map((fixture) => fixture.requirement)),
    sorted([
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
      "R1-A", "R1-B", "R1-C", "R1-D",
    ]),
  );
  for (const fixture of fixtures.fixtures) {
    const valid = validateBaseStructuredIntake(
      buildFixtureInput(fixture).baseStructuredIntake,
    );
    assert.equal(valid, fixture.requirement !== "J", fixture.fixture_id);
  }
});

await check("offline results are exact and all sixteen fixtures PASS", () => {
  assert.equal(offlineResults.status, "PASS");
  assert.equal(offlineResults.fixture_count, 16);
  assert.equal(offlineResults.passed, 16);
  assert.equal(offlineResults.failed, 0);
  assert.equal(offlineResults.results.length, 16);
  for (const fixture of fixtures.fixtures) {
    const saved = offlineById.get(fixture.fixture_id);
    assert.ok(saved, fixture.fixture_id);
    if (fixture.expected_error_code) {
      assert.throws(
        () => evaluateFixture(fixture),
        (error) =>
          error instanceof M2RuntimeError &&
          error.safeCode === fixture.expected_error_code,
      );
      assert.equal(saved.error.safeCode, fixture.expected_error_code);
    } else {
      const actual = evaluateFixture(fixture);
      assert.equal(actual.state, fixture.expected_state, fixture.fixture_id);
      assert.equal(
        actual.clarification?.target ?? null,
        fixture.expected_target,
        fixture.fixture_id,
      );
      assert.deepEqual(actual, saved.result, fixture.fixture_id);
    }
  }
});

await check("policy has no raw-prose ID or Provider routing", () => {
  const source = readText(policyPath);
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

await check("central-fear behavior is bounded emotional context not prose inference", () => {
  const source = readText(policyPath);
  const helper = source.match(
    /function hasBoundedEmotionalContext\([\s\S]*?\n\}\n/u,
  )?.[0];
  assert.ok(helper);
  assert.match(helper, /user_emotions/u);
  assert.match(helper, /\.length > 0/u);
  assert.doesNotMatch(helper, /\.statement|\.description|includes|match|search/u);
  const contract = readJson(policyContractPath);
  assert.deepEqual(contract.central_fear_boundary, {
    user_emotions_semantics: "bounded_emotional_context_presence_signal",
    specific_fear_proposition_established: false,
    emotion_prose_interpreted_by_v1_a1: false,
    future_specific_fear_grounding_remains_unresolved: true,
  });
});

await check("Safety priority remains unchanged", () => {
  const fixture = fixtureById.get(
    "R1_D_material_typed_goal_can_be_ready_candidate",
  );
  const sufficient = buildFixtureInput(fixture);
  const blocked = evaluateJpy980InputSufficiencyV1({
    ...sufficient,
    aggregateSafety: { classification: "needs_review" },
  });
  assert.equal(blocked.state, "safety_blocked");
  assert.equal(blocked.clarification, null);

  const malformedButBlocked = {
    ...sufficient,
    aggregateSafety: { classification: "rejected" },
    baseStructuredIntake: { schema_version: "malformed" },
    decisionFacts: {},
    baseWritingSignals: {},
  };
  assert.equal(
    evaluateJpy980InputSufficiencyV1(malformedButBlocked).state,
    "safety_blocked",
  );
});

await check("one-total-question budget and second-question prohibition remain exact", () => {
  for (const fixture of fixtures.fixtures.filter((item) => !item.expected_error_code)) {
    const result = evaluateFixture(fixture);
    assert.equal(result.clarificationBudget.maximumQuestionsTotal, 1);
    assert.ok(result.clarificationBudget.questionsAlreadyUsed === 0 || result.clarificationBudget.questionsAlreadyUsed === 1);
    assert.ok(result.clarificationBudget.questionsRemaining === 0 || result.clarificationBudget.questionsRemaining === 1);
    assert.equal(
      result.clarificationBudget.questionsAlreadyUsed +
        result.clarificationBudget.questionsRemaining,
      1,
    );
    if (fixture.clarification_already_used) {
      assert.notEqual(result.state, "needs_one_clarifying_answer");
      assert.equal(result.clarification, null);
    }
    if (result.state !== "needs_one_clarifying_answer") {
      assert.equal(result.clarification, null);
    }
  }
  const contract = readJson(policyContractPath);
  assert.equal(
    contract.result_contract.clarification_budget.automatic_second_question_allowed,
    false,
  );
  assert.equal(contract.result_contract.clarification_budget.clarification_loop_allowed, false);
});

await check("deterministic equality and malformed fail-closed behavior remain exact", () => {
  for (const fixtureId of [
    "K_repeated_exact_input_is_deep_equal",
    "R1_B_incidental_emotion_still_clarifies_material_concern",
  ]) {
    const input = buildFixtureInput(fixtureById.get(fixtureId));
    assert.deepEqual(
      evaluateJpy980InputSufficiencyV1(structuredClone(input)),
      evaluateJpy980InputSufficiencyV1(structuredClone(input)),
    );
  }
  assert.throws(
    () => evaluateFixture(fixtureById.get("J_unsupported_schema_fails_closed")),
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE,
  );
  const malformedNested = buildFixtureInput(
    fixtureById.get("R1_D_material_typed_goal_can_be_ready_candidate"),
  );
  delete malformedNested.baseStructuredIntake.boundaries;
  assert.throws(
    () => evaluateJpy980InputSufficiencyV1(malformedNested),
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE,
  );
});

await check("V1-A2 clarification provenance remains unresolved and unauthorized", () => {
  const contract = readJson(policyContractPath);
  const capabilities = readJson(capabilitiesPath);
  const workPackages = readJson(workPackagesPath);
  const v1A = workPackages.packages.find((entry) => entry.id === "V1-A");
  const v1A2 = v1A.subpackages.find((entry) => entry.id === "V1-A2");
  assert.equal(v1A2.status, "unauthorized");
  assert.equal(v1A2.implementation_authorized, false);
  assert.equal(v1A2.current_pb_01_accepts_clarification_answer_as_base_fact, false);
  assert.equal(v1A2.clarification_answer_grounding_provenance_contract_required, true);
  assert.equal(
    v1A2.clarification_answer_grounding_provenance_contract_status,
    "unresolved_not_designed_not_implemented",
  );
  assert.equal(v1A2.append_answer_to_current_situation_allowed, false);
  assert.equal(v1A2.pretend_followup_source_is_input_current_situation_allowed, false);
  assert.equal(v1A2.implicit_schema_widening_allowed, false);
  assert.equal(contract.runtime_boundary.v1_a2_authorized, false);
  assert.equal(capabilities.implementation["V1-A2"].authority, "unauthorized");
  for (const document of [
    readText(reviewDocumentPath),
    readText("docs/CODEX_HANDOFF.md"),
    readText("docs/CURRENT_FOCUS.md"),
    readText("docs/WBS.md"),
  ]) {
    assert.match(document, /provenance/i);
    assert.match(document, /V1-A2/u);
  }
});

await check("Active Runtime API UI DB schemas Prompt Provider and Payment are unchanged", () => {
  assert.ok(runtimeIntegrationProtected.length > 20);
  assert.ok(broaderProtected.length > 20);
  for (const candidate of [...runtimeIntegrationProtected, ...broaderProtected]) {
    assertBaselineBlobUnchanged(candidate);
  }
  const capabilities = readJson(capabilitiesPath);
  assert.deepEqual(capabilities.operations, {
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    migrations: 0,
  });
});

await check("R2-B Product snapshot remains byte-for-byte unchanged", () => {
  assert.equal(git(["merge-base", baseline, r2BProductSnapshot]), r2BProductSnapshot);
  for (const [candidate, expectedBlob] of Object.entries(productSnapshot)) {
    assert.equal(git(["rev-parse", r2BProductSnapshot + ":" + candidate]), expectedBlob);
    assert.equal(git(["rev-parse", baseline + ":" + candidate]), expectedBlob);
    assert.equal(worktreeBlob(candidate), expectedBlob);
  }
});

await check("authority statuses operations and rolling documents remain closed", () => {
  const capabilities = readJson(capabilitiesPath);
  assert.equal(capabilities.implementation["V1-A2"].status, "unauthorized");
  assert.equal(capabilities.implementation["V1-B"], "unauthorized");
  assert.equal(capabilities.implementation["V1-C"], "unauthorized");
  assert.equal(capabilities.implementation["V1-D"], "unauthorized");
  assert.equal(capabilities.implementation.v1_a_overall_complete, false);
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
  assert.deepEqual(capabilities.exact_scope, {
    total: "11/11",
    updated: 10,
    new: 1,
    deleted: 0,
    renamed: 0,
    original_v1_a1_snapshot: {
      total: "12/12",
      updated: 5,
      new: 7,
    },
  });
  for (const document of [
    readText(reviewDocumentPath),
    readText("docs/CODEX_HANDOFF.md"),
    readText("docs/CURRENT_FOCUS.md"),
    readText("docs/WBS.md"),
  ]) {
    assert.match(document, /remediation_required/u);
    assert.match(document, /not_established/u);
    assert.match(document, /globalQ0Completion(?:=|:)\s*false/u);
    assert.match(document, /11\/11/u);
    assert.match(document, /10 UPDATE \+ 1 NEW/u);
  }
});

await check("main next-env and final diff boundary remain unchanged", () => {
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assertBaselineBlobUnchanged("next-env.d.ts");
  assert.equal(
    git(["diff", "--name-only", baseline, "--", "next-env.d.ts"]),
    "",
  );
  git(["diff", "--check", baseline, "--"]);
});

assert.equal(checkCount, 25);

if (failures.length > 0) {
  console.error("\n" + taskId + " materiality correction verifier: FAIL");
  console.error("Failed checks: " + failures.join("; "));
  process.exit(1);
}

console.log("\n" + taskId + " materiality correction verifier: PASS 25/25");
console.log("Exact correction scope: 11/11; updated 10; new 1");
console.log("Commit state: " + commitState);
console.log("Routing fixtures: PASS 16/16");
console.log("Original V1-A1 verifier at 65c24586: " + originalVerifierSummary);
console.log("All upstream accepted verifiers: " + upstreamSummary);
console.log("Emotion-only materiality: prohibited");
console.log("Clarification budget: 1 total; automatic second question: prohibited");
console.log("V1-A2 clarification-answer provenance: unresolved / not implemented / unauthorized");
console.log("Active Runtime / API / UI / DB integration changed: 0 / 0 / 0 / 0");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("R2-C / experienceProductJudgment: remediation_required / pending_remediation");
console.log("JPY980 Runtime readiness: not_established");
console.log("Global Q0: false");
console.log("Product snapshot changed: false");
console.log("next-env.d.ts drift: 0");
