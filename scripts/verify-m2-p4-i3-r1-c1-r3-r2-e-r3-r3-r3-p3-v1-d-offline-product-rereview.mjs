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
import { AssessmentApplication } from "../lib/assessment/runtime/application.ts";
import { validateClarificationAnswerV1 } from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import { evaluateJpy980InputSufficiencyV2 } from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts";
import { validateJpy980ProductScopeV1 } from "../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts";
import { loadM2P4QualityReassessmentRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";
import {
  RELATIONSHIP_VALUES,
  REQUESTED_TOPIC_VALUES,
} from "../lib/assessment/runtime/types.ts";
import {
  V1_D_OFFLINE_EVIDENCE_LABEL,
  V1_D_OFFLINE_FIXTURE_PROVENANCE,
  v1DExcludedHistoricalPaidProductFixtures,
  v1DProductReviewFixtures,
} from "../lib/assessment/runtime/review/m2-p4-v15-product-rereview-fixtures.ts";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-D-C1";
const baseline = "4c7577564421e2dbd264ffadb5ccab8d961c42eb";
const acceptedV1C = "a436210bb035746c129fe071e6225b3799b9e5d8";
const r1 = "4a3d5b3f93d2b97ae8e97c0bac07b89576b48b40";
const v1CCore = "e7ae51aa96bbb3d1e791ac957e26bb8918d10547";
const v1B = "e21c9b571426160703b1112c9057cc26c7738a0a";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-c1-controlled-provider-packet";
const step1Branch =
  "review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-offline-product-rereview";
const expectedSubject = "fix: freeze V1-D controlled review inputs";
const precommit = process.argv.includes("--precommit");

const planningRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const v1CRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_OFFLINE_PRODUCT_REREVIEW.md",
  packageRoot + "/controlled-provider-review-plan-v1.json",
  packageRoot + "/offline-product-review-contract-v1.json",
  packageRoot + "/offline-results-v1.json",
  planningRoot + "/capabilities-v1.json",
  planningRoot + "/implementation-work-packages-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-offline-product-rereview.mjs",
];
const newPaths = [
  packageRoot + "/controlled-provider-inputs-v1.json",
];
const exactScope = [...updatedPaths, ...newPaths];

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      ...options,
    },
  ).trim();
}

function readText(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    readFileSync(path.join(root, relativePath)),
  );
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function blob(revision, relativePath) {
  return git(["rev-parse", revision + ":" + relativePath]);
}

function worktreeBlob(relativePath) {
  return git(["hash-object", "--path=" + relativePath, relativePath]);
}

function remoteHead(branch) {
  const output = git(["ls-remote", "--heads", "origin", "refs/heads/" + branch]);
  const rows = output.split(/\r?\n/u).filter(Boolean);
  assert.ok(rows.length <= 1, branch);
  return rows.length === 0 ? null : rows[0].split(/\s+/u)[0];
}

function collectScope() {
  const tracked = git(["diff", "--name-status", "--no-renames", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, relativePath] = line.split("\t");
      return { status, path: relativePath.replaceAll("\\", "/") };
    });
  const trackedNames = new Set(tracked.map((entry) => entry.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => !trackedNames.has(entry))
    .map((entry) => ({ status: "A", path: entry }));
  return [...tracked, ...untracked];
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

function runImmutableVerifier(revision, branch, verifier) {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-v1-d-predecessor-"),
  );
  const cloneRoot = path.join(temporaryRoot, "repo");
  try {
    execFileSync("git.exe", ["clone", "--quiet", "--no-checkout", root, cloneRoot], {
      cwd: root,
      stdio: "pipe",
    });
    symlinkSync(
      path.join(root, "node_modules"),
      path.join(cloneRoot, "node_modules"),
      "junction",
    );
    const safe = "safe.directory=" + cloneRoot.replaceAll("\\", "/");
    execFileSync("git.exe", ["-c", safe, "config", "core.autocrlf", "false"], {
      cwd: cloneRoot,
      stdio: "pipe",
    });
    const refs = git([
      "for-each-ref",
      "--format=%(refname)%09%(objectname)",
      "refs/heads",
      "refs/remotes/origin",
    ])
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => line.split("\t"));
    for (const [refName, objectName] of refs) {
      execFileSync("git.exe", ["-c", safe, "update-ref", refName, objectName], {
        cwd: cloneRoot,
        stdio: "pipe",
      });
    }
    execFileSync(
      "git.exe",
      ["-c", safe, "checkout", "--quiet", "-B", branch, revision],
      { cwd: cloneRoot, stdio: "pipe" },
    );
    const sourceContract = readJson(
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json",
    );
    const marker = sourceContract.frozen_state.marker_path;
    if (existsSync(path.join(root, marker))) {
      copyFileSync(
        path.join(root, marker),
        path.join(cloneRoot, ".git", path.basename(marker)),
      );
    }
    assert.equal(
      execFileSync("git.exe", ["-c", safe, "status", "--porcelain=v1"], {
        cwd: cloneRoot,
        encoding: "utf8",
      }).trim(),
      "",
    );
    const run = spawnSync(process.execPath, ["--experimental-strip-types", verifier], {
      cwd: cloneRoot,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      timeout: 30 * 60 * 1000,
      env: { ...process.env },
    });
    if (run.status !== 0) {
      throw new Error(
        "immutable predecessor verifier failed\n" +
          run.stdout +
          "\n" +
          run.stderr,
      );
    }
    return run.stdout;
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function ids() {
  let index = 0;
  return () =>
    "00000000-0000-4000-8000-" + String(++index).padStart(12, "0");
}

const routingAuthority = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
);
const routingById = new Map(
  routingAuthority.fixtures.map((fixture) => [fixture.fixture_id, fixture]),
);

function buildRoutingInput(fixtureId, additionalPatch = {}) {
  const fixture = routingById.get(fixtureId);
  assert.ok(fixture, fixtureId);
  const scenarioPatch = routingAuthority.scenario_patches[fixture.scenario];
  const scenario = overlay(routingAuthority.base_structured_intake_template, scenarioPatch);
  const baseStructuredIntake = overlay(
    overlay(scenario, fixture.input_patch),
    additionalPatch,
  );
  return {
    aggregateSafety: { classification: fixture.aggregate_safety_classification },
    baseStructuredIntake,
    decisionFacts: structuredClone(baseStructuredIntake.decision_facts),
    baseWritingSignals: structuredClone(baseStructuredIntake.base_writing_signals),
  };
}

function evaluateInitialRoute(fixtureId, additionalPatch = {}) {
  return evaluateJpy980InputSufficiencyV2({
    basePolicyInput: buildRoutingInput(fixtureId, additionalPatch),
    clarificationGrounding: null,
    effectiveAssessmentAuthority: { clarificationAuthorityRef: null },
  });
}

function evaluateAfterTimingClarification(materiallyResolvesTarget) {
  const sourceIdentity = "clarification:offline-v1-d:answer:1";
  const clarificationGrounding = {
    target: "latest_contact_timing",
    sourceIdentity,
    materiallyResolvesTarget,
    normalizedValue: { elapsed_bucket: "six_to_24_hours" },
  };
  return evaluateJpy980InputSufficiencyV2({
    basePolicyInput: buildRoutingInput(
      "D_reply_waiting_missing_one_timing_dimension",
    ),
    clarificationGrounding,
    effectiveAssessmentAuthority: { clarificationAuthorityRef: sourceIdentity },
  });
}

const diagnostics = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-results-v1.json",
);

function diagnosticCase(caseId) {
  const selected = diagnostics.cases.find((entry) => entry.case_id === caseId);
  assert.ok(selected, caseId);
  const outputs = Object.fromEntries(
    selected.provider_calls.map((call) => [call.stage_id, call.raw_output]),
  );
  const pb01 = selected.provider_calls.find((call) => call.stage_id === "PB-01");
  const pb04 = selected.provider_calls.find((call) => call.stage_id === "PB-04");
  assert.ok(pb01);
  return {
    selected,
    outputs,
    input: {
      currentSituation: pb01.provider_request.input.current_situation,
      optionalMessage:
        pb04?.provider_request.input.user_supplied_optional_message ?? null,
      relationship: pb01.provider_request.input.relationship,
      requestedTopics: pb01.provider_request.input.requested_topics,
      privacyAcknowledged: true,
    },
  };
}

function semanticFinding(findingCode, severity, jsonPath) {
  return {
    finding_code: findingCode,
    severity,
    json_path: jsonPath,
    evidence_refs: [],
    detail: "offline fake V1-D defect",
  };
}

function semanticOutput(base, findings) {
  return { ...structuredClone(base), semantic_checks: structuredClone(findings) };
}

function createApplication(catalog, fixture, repository, transport) {
  return new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    timeZone: "Asia/Tokyo",
  });
}

async function runInitialScenario({
  catalog,
  caseId = "E-R3-02",
  firstFindings = [],
  secondFindings = [],
  requestedTopics,
  materialGoalValue,
}) {
  const fixture = diagnosticCase(caseId);
  if (requestedTopics !== undefined) {
    fixture.input.requestedTopics = structuredClone(requestedTopics);
  }
  const outputs = structuredClone(fixture.outputs);
  if (materialGoalValue !== undefined) {
    outputs["PB-01"].base_writing_signals.user_goal_detail = {
      value: materialGoalValue,
      basis: "current_situation_explicit",
    };
  }
  const pass = semanticOutput(outputs["PB-06"], []);
  outputs["PB-06"] = pass;
  const outputSequence = {};
  if (firstFindings.length > 0 || secondFindings.length > 0) {
    outputSequence["PB-06"] = [
      semanticOutput(fixture.outputs["PB-06"], firstFindings),
      semanticOutput(fixture.outputs["PB-06"], secondFindings),
    ];
  }
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs, outputSequence });
  const application = createApplication(catalog, fixture, repository, transport);
  let result = null;
  let error = null;
  try {
    result = await application.submit(
      fixture.input,
      "55555555-5555-4555-8555-555555555555",
    );
  } catch (caught) {
    error = caught;
  }
  return { fixture, outputs, repository, transport, result, error };
}

function stagesFor(scenario, stageId) {
  return [...scenario.repository.stageRuns.values()]
    .filter((stage) => stage.stageId === stageId)
    .sort((left, right) => (left.attemptNumber ?? 1) - (right.attemptNumber ?? 1));
}

function safeCode(scenario) {
  return scenario.error instanceof M2RuntimeError
    ? scenario.error.safeCode
    : null;
}

function assertReportOnlyRecovery(scenario) {
  assert.equal(scenario.error, null);
  assert.equal(scenario.result.eligibility, "ready");
  assert.equal(scenario.repository.reports.size, 1);
  assert.deepEqual(
    stagesFor(scenario, "PB-04").map((stage) => stage.attemptNumber),
    [1],
  );
  assert.deepEqual(
    stagesFor(scenario, "PB-05").map((stage) => stage.attemptNumber),
    [1, 2],
  );
  assert.deepEqual(
    stagesFor(scenario, "PB-06").map((stage) => stage.attemptNumber),
    [1, 2],
  );
  assert.equal(
    stagesFor(scenario, "PB-06")[0].failure.errorCode,
    "M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED",
  );
  assert.equal(
    [...scenario.repository.stageRuns.values()].some(
      (stage) => (stage.attemptNumber ?? 1) > 2,
    ),
    false,
  );
}

const contract = readJson(packageRoot + "/offline-product-review-contract-v1.json");
const matrix = readJson(packageRoot + "/fixture-matrix-v1.json");
const offlineResults = readJson(packageRoot + "/offline-results-v1.json");
const reviewSheet = readJson(packageRoot + "/human-product-review-sheet-v1.json");
const providerPlan = readJson(packageRoot + "/controlled-provider-review-plan-v1.json");
const controlledInputs = readJson(packageRoot + "/controlled-provider-inputs-v1.json");
const matrixById = new Map(
  matrix.fixtures.map((fixture) => [fixture.fixture_id, fixture]),
);
const v15Catalog = await loadM2P4QualityReassessmentRuntimeStageCatalog();
const scenarios = {};

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await check("exact Git authority, lineage, main and direct commit shape", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["show", "-s", "--format=%s", baseline]), "test: add V1-D offline product review harness");
  assert.equal(git(["show", "-s", "--format=%s", acceptedV1C]), "fix: validate quality repair paths precisely");
  assert.equal(git(["show", "-s", "--format=%s", r1]), "fix: add bounded quality reassessment recovery");
  assert.equal(git(["show", "-s", "--format=%s", v1CCore]), "feat: add JPY980 semantic quality evaluator");
  assert.equal(git(["show", "-s", "--format=%s", v1B]), "feat: add JPY980 semantic depth successor");
  for (const ancestor of [acceptedV1C, r1, v1CCore, v1B]) {
    assert.doesNotThrow(() => git(["merge-base", "--is-ancestor", ancestor, baseline]));
  }
  assert.equal(git(["rev-parse", "refs/heads/main"]), expectedMain);
  assert.equal(git(["rev-parse", "refs/remotes/origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  if (precommit) {
    assert.equal(git(["rev-parse", "HEAD"]), baseline);
    assert.equal(git(["rev-list", "--count", baseline + "..HEAD"]), "0");
  } else {
    assert.equal(git(["rev-list", "--count", baseline + "..HEAD"]), "1");
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
    assert.ok([null, git(["rev-parse", "HEAD"])].includes(remoteHead(expectedBranch)));
  }
});

await check("exact 11-path scope is 10 UPDATE plus 1 NEW", () => {
  const scope = collectScope();
  assert.deepEqual(sorted(scope.map((entry) => entry.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(scope.filter((entry) => entry.status === "M").map((entry) => entry.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(scope.filter((entry) => entry.status === "A").map((entry) => entry.path)),
    sorted(newPaths),
  );
  assert.equal(scope.some((entry) => ["D", "R", "C"].includes(entry.status[0])), false);
});

await check("stash, diff-check and final worktree state are safe", () => {
  assert.equal(git(["stash", "list"]), "");
  assert.equal(git(["diff", "--check"]), "");
  if (!precommit) assert.equal(git(["status", "--porcelain=v1"]), "");
});

await check("all protected Runtime, Product, schema, migration and Payment blobs are unchanged", () => {
  const tracked = git(["ls-tree", "-r", "--name-only", baseline])
    .split(/\r?\n/u)
    .filter(Boolean);
  const catalogPath = "lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json";
  const baselineCatalog = JSON.parse(git(["show", baseline + ":" + catalogPath]));
  const protectedPaths = new Set([
    catalogPath,
    ...baselineCatalog.stages.map((stage) => stage.prompt_path),
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/openai-transport.ts",
    "lib/assessment/runtime/quality-reassessment-v1.ts",
    "lib/assessment/runtime/semantic-disposition-v5.ts",
    "lib/assessment/runtime/product-semantic-shape-v1.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts",
    "lib/assessment/runtime/jpy980-product-scope-validation-v1.ts",
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
    "lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/types.ts",
    "lib/assessment/runtime/fakes.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
    "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts",
    "lib/assessment/runtime/review/m2-p4-v15-product-rereview-fixtures.ts",
    "app/review/runtime/v15/page.tsx",
    "next-env.d.ts",
    ...tracked.filter((entry) => entry.endsWith(".schema.json")),
    ...tracked.filter((entry) => /^supabase\/migrations\/000[6-9]_.*\.sql$/u.test(entry)),
    ...tracked.filter((entry) => /(?:payment|stripe|purchase)/iu.test(entry)),
  ]);
  for (const relativePath of protectedPaths) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
});

await check("sensitive-value and zero-operation boundaries are explicit", () => {
  const changedText = exactScope.map((relativePath) => readText(relativePath)).join("\n");
  assert.doesNotMatch(changedText, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u);
  assert.doesNotMatch(changedText, /\bsk-[A-Za-z0-9_-]{20,}\b/u);
  for (const artifact of [contract, offlineResults, providerPlan]) {
    const operations = artifact.operations ?? artifact.scope;
    if (artifact.operations) {
      assert.deepEqual(Object.values(operations), [0, 0, 0, 0, 0, 0]);
    }
  }
  assert.equal(providerPlan.provider_execution_authorized, false);
  assert.equal(providerPlan.execution_count_in_this_task, 0);
});

await check("V1-C acceptance and correction history are exact", () => {
  assert.equal(contract.authority.v1_c, "accepted_complete");
  assert.equal(contract.authority.accepted_v1_c_snapshot, acceptedV1C);
  assert.equal(contract.authority.v1_c_chatgpt_review, "PASS_complete");
  assert.equal(contract.authority.v1_c_human_review, "PASS_complete");
  assert.equal(contract.authority.v1_c_human_acceptance, "complete");
  assert.equal(contract.authority.v1_c_acceptance_date, "2026-08-17");
  assert.equal(contract.authority.v1_c_core_review, "PASS 0/0/0");
  assert.equal(contract.authority.v1_c_r1_initial_review, "NEEDS_CORRECTION 0/1/0");
  assert.equal(contract.authority.v1_c_r1_c1_review, "PASS 0/0/0");
});

await check("updated V1-C and planning artifacts synchronize accepted authority", () => {
  const capabilities = readJson(v1CRoot + "/capabilities-v1.json");
  const results = readJson(v1CRoot + "/offline-results-v1.json");
  const planning = readJson(planningRoot + "/capabilities-v1.json");
  const packages = readJson(planningRoot + "/implementation-work-packages-v1.json");
  assert.equal(capabilities.status, "accepted_complete");
  assert.equal(capabilities.authority.v1_c_r1_c1_snapshot, acceptedV1C);
  assert.equal(capabilities.authority.v1_c_human_acceptance, "complete");
  assert.equal(results.current_product_authority.v1_c, "accepted_complete");
  assert.equal(planning.v1_c.status, "accepted_complete");
  assert.equal(planning.v1_c.r1_initial_review, "NEEDS_CORRECTION");
  const v1CPackage = packages.packages.find((entry) => entry.id === "V1-C");
  assert.equal(v1CPackage.status, "accepted_complete");
  assert.equal(v1CPackage.r1_initial_review, "NEEDS_CORRECTION");
});

await check("V1-D is authorized in progress while Provider remains unauthorized", () => {
  assert.equal(contract.authority.v1_d_authorized, true);
  assert.equal(contract.authority.v1_d_status, "in_progress_offline_review_harness");
  assert.equal(contract.authority.v1_d_step_1_snapshot, baseline);
  assert.equal(contract.authority.v1_d_step_1_chatgpt_review, "NEEDS_CORRECTION 0/2/0");
  assert.deepEqual(contract.authority.v1_d_step_1_findings, [
    "controlled_provider_execution_inputs_not_frozen",
    "provider_attempt_ceiling_does_not_account_for_sdk_retries",
  ]);
  assert.equal(
    contract.authority.v1_d_step_1_c1_status,
    "controlled_provider_execution_authority_corrected_pending_human_chatgpt_review",
  );
  assert.equal(contract.authority.provider_execution_authorized, false);
  const planning = readJson(planningRoot + "/capabilities-v1.json");
  const packages = readJson(
    planningRoot + "/implementation-work-packages-v1.json",
  );
  assert.equal(planning.implementation_authority["V1-D"], "in_progress_offline_review_harness");
  assert.equal(planning.v1_d.authorized, true);
  assert.equal(planning.v1_d.provider_execution_authorized, false);
  assert.equal(planning.v1_d.step_1_snapshot, baseline);
  assert.equal(planning.v1_d.step_1_chatgpt_review, "NEEDS_CORRECTION 0/2/0");
  assert.equal(planning.v1_d.controlled_provider_execution_harness, "not_implemented");
  assert.equal(
    packages.status,
    "v1_a_v1_b_v1_c_accepted_complete_v1_d_in_progress_offline_review_harness",
  );
  const v1DPackage = packages.packages.find((entry) => entry.id === "V1-D");
  assert.equal(v1DPackage.status, "in_progress_offline_review_harness");
  assert.equal(v1DPackage.provider_execution_authorized, false);
  assert.equal(v1DPackage.step_1_snapshot, baseline);
  assert.equal(v1DPackage.step_1_chatgpt_review, "NEEDS_CORRECTION 0/2/0");
});

const requiredFixtureIds = [
  "simple_business_reply_with_draft",
  "ordinary_reply_waiting",
  "nullable_optional_sections",
  "polite_thank_you_with_draft",
  "kansai_persona_draft",
  "sparse_administrative_reply_needs_more_information",
  "administrative_reply_with_tone_concern_ready_candidate",
  "reply_waiting_with_usual_cadence",
  "reply_waiting_without_timeline_needs_more_information",
  "draft_request_with_relationship_intent",
  "anxiety_heavy_sparse_facts",
  "alternative_tradeoff_applicable",
  "alternative_tradeoff_not_applicable",
  "unsupported_inner_state_mutant",
  "repeated_meaning_mutant",
  "one_clarification_answer_becomes_ready",
  "one_clarification_answer_still_insufficient_routes_out",
  "automatic_second_clarification_prohibited",
  "logically_complete_but_emotionally_cold_mutant",
  "consultation_specific_non_propositional_closing_positive",
  "generic_reassurance_closing_mutant",
  "repeated_decision_as_closing_mutant",
];

await check("fixture matrix contains exactly the 22 required unique intentions", () => {
  assert.equal(matrix.fixture_count, 22);
  assert.equal(matrix.fixtures.length, 22);
  assert.equal(new Set(matrix.fixtures.map((fixture) => fixture.fixture_id)).size, 22);
  assert.deepEqual(sorted(matrix.fixtures.map((fixture) => fixture.fixture_id)), sorted(requiredFixtureIds));
});

await check("every fixture carries all required fields and offline-only provenance", () => {
  for (const fixture of matrix.fixtures) {
    assert.deepEqual(
      contract.fixture_contract.required_fields.filter(
        (key) => !Object.prototype.hasOwnProperty.call(fixture, key),
      ),
      [],
      fixture.fixture_id,
    );
    assert.equal(fixture.provenance, V1_D_OFFLINE_FIXTURE_PROVENANCE);
    assert.notEqual(fixture.provenance, "actual_v15_successor_output");
  }
});

await check("every fixture has a material proof and non-proof boundary", () => {
  for (const fixture of matrix.fixtures) {
    assert.ok(fixture.proves.length > 0, fixture.fixture_id);
    assert.ok(fixture.does_not_prove.length > 0, fixture.fixture_id);
    assert.equal(fixture.clarification_expectation.maximum_questions_total, 1);
    assert.equal(fixture.clarification_expectation.second_question_allowed, false);
  }
});

await check("current authority overrides simple and nullable historical rendering", () => {
  const simple = matrixById.get("simple_business_reply_with_draft");
  const nullable = matrixById.get("nullable_optional_sections");
  assert.equal(simple.expected_v1_a_route, "needs_one_clarifying_answer");
  assert.equal(simple.expected_product_generated, false);
  assert.equal(nullable.expected_v1_a_route, "not_full_product_candidate");
  assert.equal(nullable.expected_product_generated, false);
  assert.deepEqual(
    v1DExcludedHistoricalPaidProductFixtures.map((fixture) => fixture.fixtureId),
    ["simple_business_reply_with_draft", "nullable_optional_sections"],
  );
  assert.ok(v1DExcludedHistoricalPaidProductFixtures.every((fixture) => !fixture.paidProductReviewEligible));
});

await check("sparse administrative routing asks one question and creates no Product", () => {
  const result = evaluateInitialRoute(
    "A_routine_administrative_reply_clarifies_material_concern",
  );
  assert.equal(result.state, "needs_one_clarifying_answer");
  assert.equal(result.clarification.target, "material_relationship_or_communication_concern");
  assert.deepEqual(result.clarificationBudget, {
    maximumQuestionsTotal: 1,
    questionsAlreadyUsed: 0,
    questionsRemaining: 1,
  });
  const fixture = matrixById.get("sparse_administrative_reply_needs_more_information");
  assert.equal(fixture.expected_product_generated, false);
  assert.equal(fixture.expected_draft_behavior.mode, "not_generated_before_eligibility");
  assert.ok(fixture.proves.includes("no_report_no_draft_no_charge_capable_state"));
});

await check("administrative tone-concern case is a full paid-ready candidate", () => {
  const result = evaluateInitialRoute(
    "R1_D_material_typed_goal_can_be_ready_candidate",
  );
  assert.equal(result.state, "full_paid_ready_candidate");
  assert.equal(result.clarification, null);
});

await check("reply waiting with usual cadence is a full paid-ready candidate", () => {
  const result = evaluateInitialRoute(
    "C_reply_waiting_sufficient_is_ready_candidate",
  );
  assert.equal(result.state, "full_paid_ready_candidate");
  assert.deepEqual(result.missingMaterialDimensions, []);
});

await check("reply waiting without timeline asks exactly the timing question", () => {
  const result = evaluateInitialRoute(
    "D_reply_waiting_missing_one_timing_dimension",
  );
  assert.equal(result.state, "needs_one_clarifying_answer");
  assert.equal(result.clarification.target, "latest_contact_timing");
  assert.deepEqual(result.missingMaterialDimensions, ["latest_contact_timing"]);
});

await check("draft request with grounded intent and tone is ready", () => {
  const result = evaluateInitialRoute(
    "F_draft_with_grounded_intent_and_tone_is_ready_candidate",
  );
  assert.equal(result.state, "full_paid_ready_candidate");
  assert.equal(result.clarification, null);
});

await check("one materially resolving clarification answer becomes ready", () => {
  const initial = evaluateInitialRoute(
    "D_reply_waiting_missing_one_timing_dimension",
  );
  const resumed = evaluateAfterTimingClarification(true);
  assert.equal(initial.state, "needs_one_clarifying_answer");
  assert.equal(resumed.state, "full_paid_ready_candidate");
  assert.equal(resumed.clarification, null);
  assert.deepEqual(resumed.clarificationBudget, {
    maximumQuestionsTotal: 1,
    questionsAlreadyUsed: 1,
    questionsRemaining: 0,
  });
});

await check("one non-resolving answer routes out without another question", () => {
  const resumed = evaluateAfterTimingClarification(false);
  assert.equal(resumed.state, "not_full_product_candidate");
  assert.ok(resumed.reasonCodes.includes("CLARIFICATION_BUDGET_EXHAUSTED"));
  assert.deepEqual(resumed.missingMaterialDimensions, ["latest_contact_timing"]);
  assert.equal(resumed.clarification, null);
});

await check("automatic second clarification remains prohibited", () => {
  const resumed = evaluateAfterTimingClarification(false);
  assert.equal(resumed.clarificationBudget.maximumQuestionsTotal, 1);
  assert.equal(resumed.clarificationBudget.questionsAlreadyUsed, 1);
  assert.equal(resumed.clarificationBudget.questionsRemaining, 0);
  assert.equal(resumed.clarification, null);
  assert.equal(contract.routing_contract.automatic_second_question_allowed, false);
});

await check("high anxiety with sparse facts cannot create paid materiality", () => {
  const result = evaluateInitialRoute(
    "E_reply_waiting_multiple_independent_gaps_routes_out",
    {
      user_emotions: [
        {
          item_id: "M001",
          statement: "返信がないことへの不安が非常に強い。",
          source_refs: ["input:current_situation"],
        },
      ],
    },
  );
  assert.equal(result.state, "not_full_product_candidate");
  assert.ok(result.missingMaterialDimensions.length > 1);
  assert.equal(matrixById.get("anxiety_heavy_sparse_facts").expected_product_generated, false);
});

await check("message-impact Candidate boundary is retained", () => {
  assert.throws(
    () =>
      validateJpy980ProductScopeV1({
        requestedTopics: ["decide_send_or_wait", "message_impact"],
        optionalMessage: null,
      }),
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === "M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED",
  );
});

await check("all five Product-quality mutants declare blocking bounded recovery", () => {
  const expected = new Map([
    ["unsupported_inner_state_mutant", "ASSUMPTION_AS_FACT"],
    ["repeated_meaning_mutant", "REPETITION"],
    ["logically_complete_but_emotionally_cold_mutant", "REQUIRED_SECTION_MEANING"],
    ["generic_reassurance_closing_mutant", "TEMPLATE_GENERICITY"],
    ["repeated_decision_as_closing_mutant", "REPETITION"],
  ]);
  for (const [fixtureId, findingCode] of expected) {
    const behavior = matrixById.get(fixtureId).expected_evaluator_recovery_behavior;
    assert.equal(behavior.blocking, true, fixtureId);
    assert.equal(behavior.finding_code, findingCode, fixtureId);
    assert.equal(behavior.automatic_reassessment, true, fixtureId);
    assert.equal(behavior.scope, "report_only", fixtureId);
    assert.equal(behavior.maximum_reassessments, 1, fixtureId);
    assert.equal(behavior.invalid_first_product_delivered, false, fixtureId);
  }
});

await check("tradeoff fixtures distinguish grounded comparison from deliberate omission", () => {
  const applicable = v1DProductReviewFixtures.find(
    (fixture) => fixture.id === "alternative_tradeoff_applicable",
  );
  const omitted = v1DProductReviewFixtures.find(
    (fixture) => fixture.id === "alternative_tradeoff_not_applicable",
  );
  assert.equal(applicable.tradeoffDisposition, "included_grounded");
  assert.match(applicable.projection.actionRationales.join(" "), /利益/u);
  assert.match(applicable.projection.actionRationales.join(" "), /コスト/u);
  assert.match(applicable.projection.actionRationales.join(" "), /リスク/u);
  assert.equal(omitted.tradeoffDisposition, "omitted_not_applicable");
  assert.doesNotMatch(omitted.projection.actionRationales.join(" "), /利益|コスト|リスク/u);
});

await check("consultation-specific non-propositional closing is a positive fixture", () => {
  const matrixFixture = matrixById.get(
    "consultation_specific_non_propositional_closing_positive",
  );
  const reviewFixture = v1DProductReviewFixtures.find(
    (fixture) => fixture.id === matrixFixture.fixture_id,
  );
  assert.equal(matrixFixture.expected_evaluator_recovery_behavior.blocking, false);
  assert.equal(matrixFixture.expected_evaluator_recovery_behavior.finding_code, null);
  assert.ok(
    matrixFixture.proves.includes(
      "emotional_ritual_copy_need_not_add_factual_proposition",
    ),
  );
  assert.equal(reviewFixture.projection.closingLines.length, 1);
  assert.notEqual(
    reviewFixture.projection.closingLines[0],
    reviewFixture.projection.baseProjection.immediateAction.action,
  );
});

await check("unsupported inner-state fake finding blocks and repairs once", async () => {
  scenarios.unsupported = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [
      semanticFinding(
        "ASSUMPTION_AS_FACT",
        "major",
        "report_content.decision_reason_summary",
      ),
    ],
  });
  assertReportOnlyRecovery(scenarios.unsupported);
});

await check("material repetition fake finding blocks and repairs once", async () => {
  scenarios.repetition = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [
      semanticFinding(
        "REPETITION",
        "major",
        "report_content.action_rationales[0]",
      ),
    ],
  });
  assertReportOnlyRecovery(scenarios.repetition);
});

await check("emotionally cold fake Product blocks and repairs once", async () => {
  scenarios.cold = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [
      semanticFinding(
        "REQUIRED_SECTION_MEANING",
        "major",
        "report_content.short_letter",
      ),
    ],
  });
  assertReportOnlyRecovery(scenarios.cold);
});

await check("generic reassurance closing blocks and repairs once", async () => {
  scenarios.generic = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [
      semanticFinding(
        "TEMPLATE_GENERICITY",
        "major",
        "report_content.closing_lines[0]",
      ),
    ],
  });
  assertReportOnlyRecovery(scenarios.generic);
});

await check("repeated Decision as closing blocks and repairs once", async () => {
  scenarios.repeatedClosing = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [
      semanticFinding(
        "REPETITION",
        "major",
        "report_content.closing_lines[0]",
      ),
    ],
  });
  assertReportOnlyRecovery(scenarios.repeatedClosing);
});

await check("positive fake Product passes with attempt 1 only", async () => {
  scenarios.positive = await runInitialScenario({ catalog: v15Catalog });
  assert.equal(scenarios.positive.error, null);
  assert.equal(scenarios.positive.result.eligibility, "ready");
  assert.equal(scenarios.positive.repository.reports.size, 1);
  assert.equal(
    [...scenarios.positive.repository.stageRuns.values()].every(
      (stage) => (stage.attemptNumber ?? 1) === 1,
    ),
    true,
  );
});

await check("attempt-2 failure saves no Report and creates no attempt 3", async () => {
  const finding = semanticFinding(
    "REPETITION",
    "major",
    "report_content.closing_lines[0]",
  );
  scenarios.exhausted = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [finding],
    secondFindings: [finding],
  });
  assert.equal(
    safeCode(scenarios.exhausted),
    "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
  );
  assert.equal(scenarios.exhausted.repository.reports.size, 0);
  assert.deepEqual(
    stagesFor(scenarios.exhausted, "PB-06").map((stage) => stage.attemptNumber),
    [1, 2],
  );
  assert.equal(
    [...scenarios.exhausted.repository.stageRuns.values()].some(
      (stage) => (stage.attemptNumber ?? 1) > 2,
    ),
    false,
  );
});

await check("recovery stays in one request and one current run", () => {
  assert.equal(scenarios.repetition.repository.requests.size, 1);
  assert.equal(scenarios.repetition.repository.runs.size, 1);
  assert.equal(scenarios.repetition.repository.clarifications.size, 0);
  assert.equal(
    scenarios.repetition.repository.events.filter(
      (event) => event === "finalizeCompletedAssessment",
    ).length,
    1,
  );
});

await check("report-only recovery preserves exact final draft authority", async () => {
  scenarios.draft = await runInitialScenario({
    catalog: v15Catalog,
    caseId: "E-R3-04",
    requestedTopics: ["draft_message"],
    materialGoalValue: "maintain_distance",
    firstFindings: [
      semanticFinding(
        "REPETITION",
        "major",
        "report_content.closing_lines[0]",
      ),
    ],
  });
  assertReportOnlyRecovery(scenarios.draft);
  const originalDraft = scenarios.draft.fixture.outputs["PB-04"].recommended_message_draft.text;
  const finalDraft = scenarios.draft.result.report.decisionPlan.recommended_message_draft.text;
  const pb05Attempt2 = scenarios.draft.transport.requests.filter(
    (request) => request.stageId === "PB-05",
  )[1];
  assert.equal(finalDraft, originalDraft);
  assert.equal(
    pb05Attempt2.input.decision_plan.recommended_message_draft.text,
    originalDraft,
  );
});

await check("V1-D review fixtures decode, preserve drafts and exclude invalid historical paid proofs", () => {
  assert.equal(v1DProductReviewFixtures.length, 10);
  assert.ok(
    v1DProductReviewFixtures.every(
      (fixture) =>
        fixture.provenance === V1_D_OFFLINE_FIXTURE_PROVENANCE &&
        fixture.evidenceStatus === "offline_reference_not_actual_v15_successor_output",
    ),
  );
  assert.equal(
    v1DProductReviewFixtures.find(
      (fixture) => fixture.id === "polite_thank_you_with_draft",
    ).projection.baseProjection.finalDraft.text,
    "今日はありがとうございました。お話しできてうれしかったです。",
  );
  assert.equal(
    v1DProductReviewFixtures.find(
      (fixture) => fixture.id === "kansai_persona_draft",
    ).projection.baseProjection.finalDraft.text,
    "おっけー、土曜ならいけるで！\nまた時間おしえて〜😊",
  );
  assert.equal(
    v1DProductReviewFixtures.some(
      (fixture) => fixture.id === "simple_business_reply_with_draft",
    ),
    false,
  );
  assert.equal(
    v1DProductReviewFixtures.some(
      (fixture) => fixture.id === "nullable_optional_sections",
    ),
    false,
  );
});

await check("review page is production/internal gated and noindex/nofollow", () => {
  const page = readText("app/review/runtime/v15/page.tsx");
  assert.match(page, /process\.env\.NODE_ENV === "production"/u);
  assert.match(page, /process\.env\.M2_INTERNAL_RUNTIME_ENABLED !== "true"/u);
  assert.match(page, /notFound\(\)/u);
  assert.match(page, /index: false/u);
  assert.match(page, /follow: false/u);
});

await check("review page is fixed-fixture only, labeled, and renders the real Product component", () => {
  const page = readText("app/review/runtime/v15/page.tsx");
  const fixtureModuleSource = readText(
    "lib/assessment/runtime/review/m2-p4-v15-product-rereview-fixtures.ts",
  );
  assert.equal(V1_D_OFFLINE_EVIDENCE_LABEL, "V1-D オフライン確認 / 実Provider出力ではありません");
  assert.match(page, /<CustomerAssessmentNote projection=\{selectedFixture\.projection\} \/>/u);
  assert.match(page, /m2-p4-v15-product-rereview-fixtures/u);
  assert.match(fixtureModuleSource, /decodeCustomerAssessmentExperienceProjectionV2/u);
  assert.doesNotMatch(page + fixtureModuleSource, /fetch\s*\(/u);
  assert.doesNotMatch(
    page + fixtureModuleSource,
    /AssessmentApplication|createClient|new OpenAI/u,
  );
  assert.match(readText("app/review/runtime/page.tsx"), /\/review\/runtime\/v15/u);
});

await check("R2-B Product component, CSS and projections remain byte-identical", () => {
  for (const relativePath of [
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  ]) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
  assert.equal(offlineResults.established.r2_b_shell_structural_regression, "PASS");
  assert.equal(offlineResults.unestablished.formal_r2_c_visual_pass, true);
});

const controlledCaseIds = [
  "ordinary_reply_waiting",
  "administrative_reply_with_tone_concern_ready_candidate",
  "reply_waiting_with_usual_cadence",
  "draft_request_with_relationship_intent",
  "polite_thank_you_with_draft",
  "kansai_persona_draft",
  "alternative_tradeoff_applicable",
  "alternative_tradeoff_not_applicable",
  "one_clarification_answer_becomes_ready",
];

await check("controlled Provider packet is bounded, synthetic and unexecuted", () => {
  assert.equal(providerPlan.provider_execution_authorized, false);
  assert.equal(providerPlan.execution_count_in_this_task, 0);
  assert.equal(
    providerPlan.controlled_provider_review_packet,
    "exact_inputs_and_execution_constraints_prepared",
  );
  assert.equal(providerPlan.controlled_provider_execution_harness, "not_implemented");
  assert.equal(providerPlan.frozen_input_packet, "controlled-provider-inputs-v1.json");
  assert.equal(providerPlan.scope.synthetic_cases_only, true);
  assert.equal(providerPlan.scope.real_person_data, false);
  assert.equal(providerPlan.scope.human_pii, false);
  assert.deepEqual(
    sorted(providerPlan.cases.map((entry) => entry.fixture_id)),
    sorted(controlledCaseIds),
  );
  assert.equal(providerPlan.runtime_identity.catalog_version, "runtime-stage-catalog-v15.0.0");
  assert.deepEqual(Object.values(providerPlan.operations), [0, 0, 0, 0, 0, 0]);
});

await check("exact nine frozen inputs match plan IDs, model, clocks and timezones", () => {
  assert.equal(controlledInputs.case_count, 9);
  assert.equal(controlledInputs.cases.length, 9);
  assert.equal(new Set(controlledInputs.cases.map((entry) => entry.fixture_id)).size, 9);
  assert.deepEqual(
    sorted(controlledInputs.cases.map((entry) => entry.fixture_id)),
    sorted(controlledCaseIds),
  );
  assert.equal(controlledInputs.model, "gpt-5.6-luna");
  assert.equal(providerPlan.runtime_identity.model, "gpt-5.6-luna");
  const planById = new Map(providerPlan.cases.map((entry) => [entry.fixture_id, entry]));
  for (const frozen of controlledInputs.cases) {
    const planned = planById.get(frozen.fixture_id);
    assert.ok(planned, frozen.fixture_id);
    assert.equal(frozen.fixed_clock, planned.fixed_clock, frozen.fixture_id);
    assert.equal(frozen.timezone, planned.timezone, frozen.fixture_id);
    assert.equal(frozen.expected_initial_route, planned.expected_initial_route, frozen.fixture_id);
    assert.equal(frozen.timezone, "Asia/Tokyo", frozen.fixture_id);
    assert.ok(Number.isFinite(Date.parse(frozen.fixed_clock)), frozen.fixture_id);
  }
});

await check("every frozen AssessmentInput is complete, valid, specific and PII-free", () => {
  const inputKeys = [
    "currentSituation",
    "optionalMessage",
    "privacyAcknowledged",
    "relationship",
    "requestedTopics",
  ];
  const identifierPattern =
    /(?:株式会社|有限会社|大学|高校|中学校|小学校|〒|\d+丁目|\d+番地|電話番号|メールアドレス|LINE\s*ID|https?:\/\/|www\.|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/iu;
  for (const frozen of controlledInputs.cases) {
    assert.equal(frozen.synthetic_only, true, frozen.fixture_id);
    assert.equal(frozen.human_pii, false, frozen.fixture_id);
    const input = frozen.assessment_input;
    assert.deepEqual(sorted(Object.keys(input)), sorted(inputKeys), frozen.fixture_id);
    assert.equal(typeof input.currentSituation, "string", frozen.fixture_id);
    assert.ok(input.currentSituation.length >= 70, frozen.fixture_id);
    assert.ok(input.currentSituation.length <= 5_000, frozen.fixture_id);
    assert.ok(
      input.optionalMessage === null ||
        (typeof input.optionalMessage === "string" && input.optionalMessage.length <= 2_000),
      frozen.fixture_id,
    );
    assert.ok(RELATIONSHIP_VALUES.includes(input.relationship), frozen.fixture_id);
    assert.ok(input.requestedTopics.length >= 1 && input.requestedTopics.length <= 3, frozen.fixture_id);
    assert.equal(new Set(input.requestedTopics).size, input.requestedTopics.length, frozen.fixture_id);
    assert.ok(
      input.requestedTopics.every((topic) => REQUESTED_TOPIC_VALUES.includes(topic)),
      frozen.fixture_id,
    );
    assert.equal(input.privacyAcknowledged, true, frozen.fixture_id);
    if (input.requestedTopics.includes("message_impact")) {
      assert.equal(typeof input.optionalMessage, "string", frozen.fixture_id);
      assert.ok(input.optionalMessage.length > 0, frozen.fixture_id);
    }
    assert.doesNotMatch(
      input.currentSituation + "\n" + (input.optionalMessage ?? ""),
      identifierPattern,
      frozen.fixture_id,
    );
  }
  assert.equal(controlledInputs.provenance, "synthetic_controlled_review_input");
  assert.equal(controlledInputs.evidence_boundary.actual_v15_successor_output_exists, false);
  assert.equal(
    controlledInputs.evidence_boundary.raw_text_to_pb_01_extraction_correctness,
    "unestablished",
  );
});

await check("clarification case freezes exactly one resolving answer and no second answer", () => {
  const clarificationCases = controlledInputs.cases.filter(
    (entry) => entry.clarification !== null,
  );
  assert.equal(clarificationCases.length, 1);
  const selected = clarificationCases[0];
  assert.equal(selected.fixture_id, "one_clarification_answer_becomes_ready");
  assert.deepEqual(sorted(Object.keys(selected.clarification)), sorted([
    "expected_target",
    "answer_payload",
    "expected_route_after_answer",
    "maximum_answers_total",
    "second_answer_allowed",
  ]));
  assert.equal(selected.clarification.expected_target, "latest_contact_timing");
  assert.deepEqual(selected.clarification.answer_payload, {
    kind: "elapsed_bucket",
    value: "six_to_24_hours",
  });
  assert.equal(selected.clarification.expected_route_after_answer, "full_paid_ready_candidate");
  assert.equal(selected.clarification.maximum_answers_total, 1);
  assert.equal(selected.clarification.second_answer_allowed, false);
  const validated = validateClarificationAnswerV1({
    target: selected.clarification.expected_target,
    answer: selected.clarification.answer_payload,
    resumeStartedAt: selected.fixed_clock,
  });
  assert.equal(validated.resolvesTarget, true);
  assert.deepEqual(
    controlledInputs.cases
      .filter((entry) => entry.fixture_id !== selected.fixture_id)
      .map((entry) => entry.clarification),
    Array(8).fill(null),
  );
  assert.equal(Object.hasOwn(selected.clarification, "second_answer_payload"), false);
});

await check("future controlled execution bypasses service and Supabase with a local repository", () => {
  const architecture = providerPlan.future_execution_architecture;
  assert.equal(architecture.input_source, "exact_frozen_synthetic_inputs");
  assert.equal(architecture.application, "V15 AssessmentApplication");
  assert.equal(
    architecture.repository_requirement,
    "FakeAssessmentRepository_or_local_in_memory_repository",
  );
  assert.equal(architecture.production_service_entrypoint_used, false);
  assert.equal(architecture.supabase_repository_used, false);
  assert.equal(architecture.payment_used, false);
  assert.equal(architecture.production_used, false);
  assert.equal(architecture.executor_implementation_status, "not_implemented");
  assert.equal(contract.controlled_provider_review_authority.production_service_entrypoint_used, false);
  assert.equal(contract.controlled_provider_review_authority.supabase_repository_used, false);
  assert.equal(offlineResults.controlled_provider_execution.production_service_entrypoint_used, false);
  assert.equal(offlineResults.controlled_provider_execution.supabase_repository_used, false);
  assert.match(readText("lib/assessment/runtime/service.ts"), /SupabaseAssessmentRepository/u);
  assert.equal(providerPlan.scope.db_operations, false);
  assert.equal(providerPlan.scope.supabase_operations, false);
  assert.equal(providerPlan.operations.db_operations, 0);
  assert.equal(providerPlan.operations.supabase_operations, 0);
});

await check("Application invocation and Provider HTTP ceilings are separated fail-closed", () => {
  const limits = providerPlan.transport_and_invocation_limits;
  assert.equal(limits.maximum_quality_reassessments_per_case, 1);
  assert.equal(limits.maximum_product_generation_cycles_per_case, 2);
  assert.equal(limits.maximum_application_stage_invocations_per_case, 12);
  assert.equal(limits.maximum_application_stage_invocations_total, 108);
  assert.ok(providerPlan.cases.every((entry) => entry.maximum_application_stage_invocations === 12));
  assert.equal(
    providerPlan.cases.reduce(
      (total, entry) => total + entry.maximum_application_stage_invocations,
      0,
    ),
    108,
  );
  assert.equal(limits.application_quality_reassessment_is_sdk_retry, false);
  assert.equal(limits.current_openai_transport_explicit_max_retries, false);
  assert.equal(limits.review_transport_max_retries, 0);
  assert.equal(limits.review_transport_no_retry_configuration_required_before_execution, true);
  assert.equal(limits.hard_provider_http_attempt_ceiling_established, false);
  assert.equal(limits.intended_provider_http_attempt_ceiling_after_verified_no_retry_executor, 108);
  assert.equal(Object.hasOwn(limits, "estimated_provider_attempt_ceiling"), false);
  assert.equal(Object.hasOwn(limits, "retries_outside_v15_quality_reassessment"), false);
  const productionTransport = readText("lib/assessment/runtime/openai-transport.ts");
  assert.match(productionTransport, /new OpenAI\(\{ apiKey \}\)/u);
  assert.doesNotMatch(productionTransport, /maxRetries/u);
  assert.equal(controlledInputs.provider_execution_authorized, false);
  assert.equal(controlledInputs.provider_execution_count, 0);
});

await check("Human Product review sheet has every field and no prefilled PASS", () => {
  assert.deepEqual(
    sorted(Object.keys(reviewSheet.review_record_template)),
    sorted(contract.future_human_product_review_fields),
  );
  const providerDependent = contract.future_human_product_review_fields.filter(
    (key) =>
      !["fixture_id", "output_provenance", "reviewer_notes"].includes(key),
  );
  for (const key of providerDependent) {
    assert.equal(
      reviewSheet.review_record_template[key],
      "pending_actual_v15_provider_output",
      key,
    );
  }
  assert.deepEqual(reviewSheet.review_records, []);
  assert.equal(reviewSheet.prefilled_pass_count, 0);
  assert.doesNotMatch(JSON.stringify(reviewSheet.review_record_template), /"PASS"/u);
});

await check("evidence ceiling preserves every unestablished Product outcome", () => {
  const requiredUnestablished = [
    "actual_v15_provider_prose_quality",
    "actual_v15_provider_semantic_fidelity",
    "actual_pb_06_provider_recall",
    "actual_pb_06_provider_precision",
    "real_quality_reassessment_success_rate",
    "human_emotional_understanding_from_real_v15_output",
    "plausibly_worth_jpy980",
    "r2_c_pass",
    "jpy980_runtime_readiness",
    "global_q0_completion",
    "hard_provider_http_attempt_ceiling",
  ];
  assert.ok(requiredUnestablished.every((key) => contract.step_1_evidence_boundary.must_not_claim.includes(key)));
  assert.ok(requiredUnestablished.every((key) => offlineResults.unestablished[key] === true));
  assert.equal(contract.current_status_ceiling.r2_c, "remediation_required");
  assert.equal(contract.current_status_ceiling.experienceProductJudgment, "pending_remediation");
  assert.equal(contract.current_status_ceiling.jpy980RuntimeReadiness, "not_established");
  assert.equal(contract.current_status_ceiling.globalQ0Completion, false);
});

await check("offline results distinguish established regression from actual Provider quality", () => {
  assert.equal(offlineResults.established.fixture_matrix_complete_22_of_22, true);
  assert.equal(offlineResults.established.deterministic_v1_a_routing_regression, true);
  assert.equal(offlineResults.established.deterministic_semantic_disposition_regression, true);
  assert.equal(offlineResults.established.maximum_one_quality_reassessment, true);
  assert.equal(offlineResults.established.report_only_exact_draft_preserved, true);
  assert.equal(
    offlineResults.established.controlled_provider_review_packet,
    "exact_inputs_and_execution_constraints_prepared",
  );
  assert.equal(offlineResults.established.controlled_provider_execution_harness, "not_implemented");
  assert.equal(offlineResults.fixture_results.actual_v15_successor_outputs, 0);
  assert.equal(offlineResults.validation.v1_d_c1_dedicated_verifier, "PASS 50/50");
  assert.equal(offlineResults.validation.immutable_v1_d_step_1_verifier, "PASS 45/45");
  assert.equal(
    offlineResults.validation.immutable_v1_c_r1_c1_predecessor_via_step_1,
    "PASS 50/50",
  );
  assert.equal(offlineResults.validation.predecessor_upstream_chain_reexecuted_separately, false);
});

await check("current docs and review packet state V1-D authority without overclaim", () => {
  const docs = [
    readText("docs/CODEX_HANDOFF.md"),
    readText("docs/CURRENT_FOCUS.md"),
    readText("docs/WBS.md"),
    readText(
      "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_OFFLINE_PRODUCT_REREVIEW.md",
    ),
  ].join("\n");
  assert.match(docs, new RegExp(baseline, "u"));
  assert.match(docs, new RegExp(acceptedV1C, "u"));
  assert.match(docs, /V1-C[^\n]{0,200}accepted_complete/u);
  assert.match(docs, /NEEDS_CORRECTION 0\/1\/0/u);
  assert.match(docs, /R1-C1[^\n]{0,100}PASS 0\/0\/0/u);
  assert.match(docs, /NEEDS_CORRECTION 0\/2\/0/u);
  assert.match(docs, /controlled_provider_execution_inputs_not_frozen/u);
  assert.match(docs, /provider_attempt_ceiling_does_not_account_for_sdk_retries/u);
  assert.match(docs, /exact_inputs_and_execution_constraints_prepared/u);
  assert.match(docs, /controlled_provider_execution_harness[=`]not_implemented/u);
  assert.match(docs, /maxRetries=0/u);
  assert.match(docs, /hard_provider_http_attempt_ceiling_established[=`]false/u);
  assert.match(docs, /in_progress_offline_review_harness/u);
  assert.match(docs, /Provider execution[^\n]{0,80}unauthorized/u);
  assert.match(docs, /R2-C[^\n]{0,80}remediation_required/u);
  assert.match(docs, /jpy980RuntimeReadiness[^\n]{0,40}not_established/u);
  assert.match(docs, /globalQ0Completion[^\n]{0,20}false/u);
});

await check("review evidence adds no semantic classifier, embedding, or case-ID Runtime branch", () => {
  assert.equal(contract.fixture_contract.semantic_keyword_classifier, false);
  assert.equal(contract.fixture_contract.embeddings, false);
  assert.equal(contract.fixture_contract.case_id_runtime_branching, false);
  const reviewModule = readText(
    "lib/assessment/runtime/review/m2-p4-v15-product-rereview-fixtures.ts",
  );
  assert.doesNotMatch(reviewModule, /caseId|case_id/u);
  assert.equal(worktreeBlob("lib/assessment/runtime/pipeline.ts"), blob(baseline, "lib/assessment/runtime/pipeline.ts"));
  assert.equal(worktreeBlob("lib/assessment/runtime/semantic-disposition-v5.ts"), blob(baseline, "lib/assessment/runtime/semantic-disposition-v5.ts"));
});

if (!precommit) {
  await check("immutable V1-D Step 1 verifier passes once with its recursive chain", () => {
    const output = runImmutableVerifier(
      baseline,
      step1Branch,
      "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-offline-product-rereview.mjs",
    );
    assert.match(output, /offline Product re-review verifier: PASS 45\/45/u);
    assert.match(output, /Immutable V1-C R1-C1 predecessor verifier: PASS 50\/50/u);
  });
}

const expectedChecks = precommit ? 49 : 50;
assert.equal(passed, expectedChecks);

if (precommit) {
  console.log(`\n${taskId} precommit verifier: PASS 49/49`);
  console.log("Immutable V1-D Step 1 45/45 intentionally deferred to the single formal post-commit run.");
} else {
  console.log(`\n${taskId} controlled Provider packet verifier: PASS 50/50`);
  console.log("Frozen controlled inputs: PASS 9/9; exact model/clock/timezone/clarification: PASS");
  console.log("Service/Supabase exclusion and Fake/local repository requirement: PASS");
  console.log("Application-stage ceiling vs Provider HTTP-attempt ceiling: correctly separated");
  console.log("Immutable V1-D Step 1 verifier: PASS 45/45 (executed once with recursive chain)");
  console.log("Provider execution: 0; DB/Supabase/migration apply/Payment/deploy: 0/0/0/0/0");
  console.log("Executor, hard HTTP-attempt ceiling, actual V15 quality/fidelity, JPY980 value/readiness, Global Q0: unestablished");
}
