import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
import {
  clarificationSourceIdentityV1,
  createOpaqueClarificationIdV1,
  validateClarificationAnswerV1,
} from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { calculateUsageDerivedCostUsd } from "../lib/assessment/runtime/cost.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import {
  QUALITY_REASSESSMENT_MAX_DEFECTS,
  buildLocalSemanticShapeReassessmentDirectiveV1,
  buildQualityReassessmentDirectiveV1,
} from "../lib/assessment/runtime/quality-reassessment-v1.ts";
import {
  loadM2P4QualityReassessmentRuntimeStageCatalog,
  loadM2P4SemanticQualityRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-C-R1-C1";
const baseline = "4a3d5b3f93d2b97ae8e97c0bac07b89576b48b40";
const v1CCore = "e7ae51aa96bbb3d1e791ac957e26bb8918d10547";
const v1B = "e21c9b571426160703b1112c9057cc26c7738a0a";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c-r1-c1-precise-repair-paths";
const r1Branch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c-r1-quality-reassessment";
const v1CBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c-semantic-quality";
const expectedSubject = "fix: validate quality repair paths precisely";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c";
const planningRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";

const updatedPaths = [
  "lib/assessment/runtime/quality-reassessment-v1.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c-r1-quality-reassessment.mjs",
  packageRoot + "/quality-reassessment-cases-v1.json",
  packageRoot + "/quality-reassessment-contract-v1.json",
  packageRoot + "/offline-results-v1.json",
  packageRoot + "/capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_C_R1_QUALITY_REASSESSMENT_REVIEW.md",
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  planningRoot + "/capabilities-v1.json",
  planningRoot + "/implementation-work-packages-v1.json",
];
const newPaths = [];
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

function canonical(value) {
  return value.replace(/\r\n/gu, "\n");
}

function hashText(value) {
  return createHash("sha256")
    .update(Buffer.from(canonical(value), "utf8"))
    .digest("hex");
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

function remoteHead(branch) {
  const output = git(["ls-remote", "--heads", "origin", "refs/heads/" + branch]);
  const rows = output.split(/\r?\n/u).filter(Boolean);
  assert.ok(rows.length <= 1, branch);
  return rows.length === 0 ? null : rows[0].split(/\s+/u)[0];
}

function blob(revision, relativePath) {
  return git(["rev-parse", revision + ":" + relativePath]);
}

function worktreeBlob(relativePath) {
  return git(["hash-object", "--path=" + relativePath, relativePath]);
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

function stripPromptIdentity(stage) {
  return Object.fromEntries(
    Object.entries(stage).filter(
      ([key]) =>
        !["source", "prompt_version", "prompt_path", "prompt_sha256"].includes(
          key,
        ),
    ),
  );
}

function runImmutableVerifier(revision, branch, verifier) {
  const temp = mkdtempSync(path.join(tmpdir(), "moon-reply-v1-c-r1-"));
  const clone = path.join(temp, "repo");
  try {
    execFileSync("git.exe", ["clone", "--quiet", "--no-checkout", root, clone], {
      cwd: root,
      stdio: "pipe",
    });
    symlinkSync(
      path.join(root, "node_modules"),
      path.join(clone, "node_modules"),
      "junction",
    );
    const safe = "safe.directory=" + clone.replaceAll("\\", "/");
    execFileSync("git.exe", ["-c", safe, "config", "core.autocrlf", "false"], {
      cwd: clone,
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
        cwd: clone,
        stdio: "pipe",
      });
    }
    execFileSync(
      "git.exe",
      ["-c", safe, "checkout", "--quiet", "-B", branch, revision],
      { cwd: clone, stdio: "pipe" },
    );
    const sourceContract = readJson(
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json",
    );
    const marker = sourceContract.frozen_state.marker_path;
    if (existsSync(path.join(root, marker))) {
      copyFileSync(
        path.join(root, marker),
        path.join(clone, ".git", path.basename(marker)),
      );
    }
    const immutableStatus = execFileSync(
      "git.exe",
      ["-c", safe, "status", "--porcelain=v1"],
      { cwd: clone, encoding: "utf8" },
    ).trim();
    if (immutableStatus !== "") {
      throw new Error("immutable verifier checkout is dirty\n" + immutableStatus);
    }
    const run = spawnSync(
      process.execPath,
      ["--experimental-strip-types", verifier],
      {
        cwd: clone,
        encoding: "utf8",
        maxBuffer: 512 * 1024 * 1024,
        timeout: 30 * 60 * 1000,
        env: { ...process.env },
      },
    );
    if (run.status !== 0) {
      throw new Error(
        "immutable verifier failed: " +
          run.status +
          "\n" +
          run.stdout +
          "\n" +
          run.stderr,
      );
    }
    return run.stdout;
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function ids() {
  let index = 0;
  return () =>
    "00000000-0000-4000-8000-" + String(++index).padStart(12, "0");
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

function currentProductAuthority(caseId = "E-R3-02") {
  const fixture = diagnosticCase(caseId);
  return {
    decisionPlan: structuredClone(fixture.outputs["PB-04"]),
    reportContent: structuredClone(fixture.outputs["PB-05"]),
  };
}

function buildDirective(blockingFindings, caseId = "E-R3-02") {
  return buildQualityReassessmentDirectiveV1({
    blockingFindings,
    ...currentProductAuthority(caseId),
  });
}

function createApplication(catalog, fixture, repository, transport, extra = {}) {
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
    ...extra,
  });
}

function semanticFinding(findingCode, severity, jsonPath, detail = "offline defect") {
  return {
    finding_code: findingCode,
    severity,
    json_path: jsonPath,
    evidence_refs: [],
    detail,
  };
}

function semanticOutput(base, findings) {
  return { ...structuredClone(base), semantic_checks: structuredClone(findings) };
}

function invalidShapeReport(report) {
  const invalid = structuredClone(report);
  invalid.closing_lines[0] = invalid.cover_line;
  return invalid;
}

async function runInitialScenario({
  catalog,
  caseId = "E-R3-02",
  firstFindings = [],
  secondFindings = [],
  pb05Sequence,
  failAtStage,
  schemaInvalid = false,
  requestedTopics,
  materialGoalValue,
}) {
  const fixture = diagnosticCase(caseId);
  if (requestedTopics) {
    fixture.input.requestedTopics = structuredClone(requestedTopics);
  }
  const outputs = structuredClone(fixture.outputs);
  if (materialGoalValue) {
    outputs["PB-01"].base_writing_signals.user_goal_detail = {
      value: materialGoalValue,
      basis: "current_situation_explicit",
    };
  }
  const pass = semanticOutput(outputs["PB-06"], []);
  const first = semanticOutput(outputs["PB-06"], firstFindings);
  const second = semanticOutput(outputs["PB-06"], secondFindings);
  outputs["PB-06"] = pass;
  if (schemaInvalid) {
    const invalid = structuredClone(outputs["PB-05"]);
    delete invalid.cover_line;
    outputs["PB-05"] = invalid;
  }
  const outputSequence = {};
  if (firstFindings.length > 0 || secondFindings.length > 0) {
    outputSequence["PB-06"] = [first, second];
  }
  if (pb05Sequence) outputSequence["PB-05"] = structuredClone(pb05Sequence);
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs,
    outputSequence,
    failAtStage,
  });
  const application = createApplication(catalog, fixture, repository, transport);
  let result = null;
  let error = null;
  try {
    result = await application.submit(
      fixture.input,
      "33333333-3333-4333-8333-333333333333",
    );
  } catch (caught) {
    error = caught;
  }
  return { fixture, outputs, repository, transport, result, error };
}

function safeCode(scenario) {
  return scenario.error instanceof M2RuntimeError
    ? scenario.error.safeCode
    : null;
}

function stagesFor(scenario, stageId) {
  return [...scenario.repository.stageRuns.values()]
    .filter((stage) => stage.stageId === stageId)
    .sort((left, right) => (left.attemptNumber ?? 1) - (right.attemptNumber ?? 1));
}

async function runClarificationRecovery(catalog) {
  const fixture = diagnosticCase("E-R3-05");
  const outputs = structuredClone(fixture.outputs);
  const passBase = diagnosticCase("E-R3-02").outputs["PB-06"];
  const finding = semanticFinding(
    "REPETITION",
    "major",
    "report_content.action_rationales[0]",
  );
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(9));
  const answer = { kind: "elapsed_bucket", value: "six_to_24_hours" };
  const validated = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: fixture.selected.fixed_clock,
  });
  const groundingOutput = {
    schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
    target: "latest_contact_timing",
    source_identity: clarificationSourceIdentityV1(clarificationId),
    answer_fingerprint: validated.answerFingerprint,
    materially_resolves_target: true,
    clarification_safety_result: {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    },
  };
  outputs["PB-06"] = semanticOutput(passBase, []);
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs,
    outputSequence: {
      "PB-01": [outputs["PB-01"], groundingOutput],
      "PB-06": [semanticOutput(passBase, [finding]), semanticOutput(passBase, [])],
    },
  });
  const application = createApplication(catalog, fixture, repository, transport, {
    clarificationId: () => clarificationId,
  });
  const first = await application.submit(
    fixture.input,
    "44444444-4444-4444-8444-444444444444",
  );
  const resumed = await application.answerClarification(clarificationId, answer);
  return { first, resumed, repository, transport, clarificationId };
}

const scenarioCache = new Map();
async function cached(key, builder) {
  if (!scenarioCache.has(key)) scenarioCache.set(key, await builder());
  return scenarioCache.get(key);
}

const contract = readJson(packageRoot + "/quality-reassessment-contract-v1.json");
const cases = readJson(packageRoot + "/quality-reassessment-cases-v1.json");
const capabilities = readJson(packageRoot + "/capabilities-v1.json");
const offline = readJson(packageRoot + "/offline-results-v1.json");
const planningCapabilities = readJson(planningRoot + "/capabilities-v1.json");
const workPackages = readJson(planningRoot + "/implementation-work-packages-v1.json");
const v14Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v14.json",
);
const v15Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json",
);
let v14Catalog;
let v15Catalog;
let immutableR1Output = "";
let immutableV1COutput = "";
let checks = 0;
const failures = [];

async function check(name, callback) {
  checks += 1;
  try {
    await callback();
    console.log("PASS " + name);
  } catch (error) {
    failures.push(name);
    console.error("FAIL " + name);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact correction branch parent R1 core refs main and empty stash", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), v1CCore);
  assert.equal(git(["show", "-s", "--format=%s", baseline]), "fix: add bounded quality reassessment recovery");
  assert.equal(git(["rev-parse", v1CCore + "^"]), v1B);
  assert.equal(git(["rev-parse", "refs/heads/" + r1Branch]), baseline);
  assert.equal(git(["rev-parse", "refs/remotes/origin/" + r1Branch]), baseline);
  assert.equal(remoteHead(r1Branch), baseline);
  assert.equal(git(["rev-parse", "refs/heads/" + v1CBranch]), v1CCore);
  assert.equal(git(["rev-parse", "refs/remotes/origin/" + v1CBranch]), v1CCore);
  assert.equal(remoteHead(v1CBranch), v1CCore);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("precommit state or exactly one direct correction commit", () => {
  const head = git(["rev-parse", "HEAD"]);
  const count = Number(git(["rev-list", "--count", baseline + ".." + head]));
  assert.equal(git(["merge-base", head, baseline]), baseline);
  assert.ok(count === 0 || count === 1);
  if (count === 0) {
    assert.equal(head, baseline);
    assert.notEqual(git(["status", "--porcelain=v1"]), "");
  } else {
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
    assert.equal(git(["status", "--porcelain=v1"]), "");
  }
  const remote = remoteHead(expectedBranch);
  assert.ok(remote === null || remote === head);
  if (remote !== null) assert.equal(count, 1);
});

await check("exact 13 UPDATE paths with no new delete or rename", () => {
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
  assert.equal(scope.some((entry) => /^(?:D|R|C)/u.test(entry.status)), false);
});

await check("V1-C R1 finding R1-C1 pending review Human HOLD and V1-D unauthorized are synchronized", () => {
  assert.equal(capabilities.authority.v1_c_core_snapshot, v1CCore);
  assert.equal(capabilities.authority.v1_c_core_chatgpt_technical_review, "PASS");
  assert.deepEqual(capabilities.authority.v1_c_core_findings, {
    blocker: 0,
    major: 0,
    minor: 0,
  });
  assert.equal(capabilities.authority.v1_c_r1_snapshot, baseline);
  assert.equal(capabilities.authority.v1_c_r1_initial_review, "NEEDS_CORRECTION");
  assert.deepEqual(capabilities.authority.v1_c_r1_initial_findings, {
    blocker: 0,
    major: 1,
    minor: 0,
  });
  assert.equal(
    capabilities.authority.v1_c_r1_c1,
    "precise_repair_path_corrected_pending_human_chatgpt_review",
  );
  assert.equal(capabilities.authority.v1_c_human_acceptance, "HOLD");
  assert.equal(capabilities.authority.v1_c_overall, "in_progress_recovery_correction");
  assert.equal(capabilities.authority.v1_d, "unauthorized");
  assert.equal(planningCapabilities.implementation_authority["V1-D"], "unauthorized");
  assert.match(readText("docs/CURRENT_FOCUS.md"), /repair_path_shape_does_not_prove_actual_product_path/u);
});

await check("V15 exact identity seven stages schema set and topology", () => {
  assert.equal(v15Manifest.catalog_version, "runtime-stage-catalog-v15.0.0");
  assert.equal(v15Manifest.prompt_bundle_version, "prompt-bundle-runtime-v15.0.0");
  assert.equal(v15Manifest.schema_set_version, "pipeline-schema-runtime-v6.0.0");
  assert.equal(v15Manifest.stage_topology_version, "split-base-candidate-v1");
  assert.equal(v15Manifest.baseline, v1CCore);
  assert.equal(v15Manifest.stages.length, 7);
  assert.deepEqual(v15Manifest.stages.map((stage) => stage.stage_id), [
    "PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06",
  ]);
});

await check("only PB-04 and PB-05 Prompt identities differ from V14", () => {
  for (let index = 0; index < 7; index += 1) {
    const current = v15Manifest.stages[index];
    const prior = v14Manifest.stages[index];
    if (current.stage_id === "PB-04" || current.stage_id === "PB-05") {
      assert.deepEqual(stripPromptIdentity(current), stripPromptIdentity(prior));
      assert.notEqual(current.prompt_sha256, prior.prompt_sha256);
    } else {
      assert.deepEqual(current, prior);
    }
  }
});

await check("V15 and V14 loaders verify hashes schemas and OpenAI compatibility", async () => {
  v14Catalog = await loadM2P4SemanticQualityRuntimeStageCatalog();
  v15Catalog = await loadM2P4QualityReassessmentRuntimeStageCatalog();
  assert.equal(v14Catalog.catalogVersion, "runtime-stage-catalog-v14.0.0");
  assert.equal(v15Catalog.catalogVersion, "runtime-stage-catalog-v15.0.0");
  assert.equal(v15Catalog.definitions.length, 7);
  assert.deepEqual(
    v15Catalog.definitions.map((definition) => definition.schemaHash),
    v14Catalog.definitions.map((definition) => definition.schemaHash),
  );
});

await check("new Prompt manifest hashes match self-contained files", () => {
  for (const stageId of ["PB-04", "PB-05"]) {
    const stage = v15Manifest.stages.find((entry) => entry.stage_id === stageId);
    assert.ok(stage);
    const prompt = readText(stage.prompt_path);
    assert.equal(hashText(prompt), stage.prompt_sha256);
    assert.doesNotMatch(prompt, /Apply the previous|Apply the predecessor/u);
    assert.match(prompt, /Authoritative inputs/u);
    assert.match(prompt, /Bounded quality reassessment mode/u);
  }
});

await check("PB-04 v5 retains full policy Safety Candidate draft contact and clarification authority", () => {
  const prompt = readText(
    "lib/assessment/runtime/contracts/pb-04-quality-reassessment-v1.developer.md",
  );
  for (const pattern of [
    /decision_policy_result/u,
    /effective_decision_policy_result/u,
    /contact_constraint_policy/u,
    /action_context/u,
    /recommended_message_draft\.text/u,
    /Candidate meaning/u,
    /Clarification successor authority/u,
    /previous PB-04 output is not supplied/u,
    /plan_and_report/u,
  ]) assert.match(prompt, pattern);
});

await check("PB-05 v6 retains V1-B semantic depth and from-scratch recovery boundaries", () => {
  const prompt = readText(
    "lib/assessment/runtime/contracts/pb-05-quality-reassessment-v1.developer.md",
  );
  for (const pattern of [
    /consultation_core/u,
    /evidence_and_significance/u,
    /baseline `emotional_containment`/u,
    /alternative_tradeoff/u,
    /There is no fixed word minimum/u,
    /previous Report is not supplied/u,
    /Regenerate the complete Report from scratch/u,
    /report_only/u,
    /PB-05 never owns final draft text/u,
    /再鑑定しました/u,
  ]) assert.match(prompt, pattern);
});

await check("existing Decision Report validation schemas and seven-stage topology are unchanged", () => {
  for (const relativePath of [
    "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
    "lib/assessment/runtime/contracts/report-content-v2.schema.json",
    "ai/schemas/validation-result.schema.json",
  ]) assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath));
  assert.equal(v15Manifest.schema_set_version, v14Manifest.schema_set_version);
  assert.equal(v15Manifest.stage_topology_version, v14Manifest.stage_topology_version);
});

await check("directive classifies report-only owned findings and strips raw detail", () => {
  const directive = buildDirective([
    semanticFinding("REPETITION", "major", "report_content.closing_lines[0]", "RAW_SECRET_DETAIL"),
  ]);
  assert.ok(directive);
  assert.equal(directive.scope, "report_only");
  assert.equal(directive.attemptNumber, 2);
  assert.deepEqual(Object.keys(directive.defects[0]).sort(), [
    "findingCode", "jsonPath", "normalizedRepairRequirementCode", "severity",
  ]);
  assert.doesNotMatch(JSON.stringify(directive), /RAW_SECRET_DETAIL|detail|reasoning/u);
});

await check("directive selects plan-and-report for Plan or mixed owned defects and sorts", () => {
  const directive = buildDirective([
    semanticFinding("REPETITION", "major", "report_content.closing_lines[0]"),
    semanticFinding("ACTION_CONSISTENCY", "major", "decision_plan.actions_to_take[0]"),
    semanticFinding("REPETITION", "major", "report_content.closing_lines[0]"),
  ]);
  assert.ok(directive);
  assert.equal(directive.scope, "plan_and_report");
  assert.equal(directive.defects.length, 2);
  assert.deepEqual(
    directive.defects.map((defect) => defect.jsonPath),
    ["decision_plan.actions_to_take[0]", "report_content.closing_lines[0]"],
  );
});

await check("Application-owned and unknown paths are nonrepairable", () => {
  for (const jsonPath of [
    "report_content.relationship_summary",
    "report_content.change_condition_commentary[0]",
    "base_structured_intake.observed_facts[0]",
    "candidate_envelope.analysis",
    "unknown.path",
  ]) {
    assert.equal(
      buildDirective([
        semanticFinding("FACT_FIDELITY", "major", jsonPath),
      ]),
      null,
    );
  }
});

await check("static ownership and actual current Product path resolution are both required", () => {
  for (const [caseId, jsonPath, expectedScope] of [
    ["E-R3-02", "decision_plan.actions_to_take[0]", "plan_and_report"],
    ["E-R3-01", "decision_plan.recommended_message_draft.text", "plan_and_report"],
    ["E-R3-02", "report_content.short_letter[0]", "report_only"],
    ["E-R3-02", "report_content.observed_fact_commentary[0].commentary", "report_only"],
  ]) {
    const directive = buildDirective(
      [semanticFinding("FACT_FIDELITY", "major", jsonPath)],
      caseId,
    );
    assert.ok(directive, jsonPath);
    assert.equal(directive.scope, expectedScope, jsonPath);
  }

  for (const [caseId, jsonPath] of [
    ["E-R3-02", "decision_plan.selected_decision.nonexistent"],
    ["E-R3-02", "decision_plan.actions_to_take[999]"],
    ["E-R3-01", "decision_plan.recommended_message_draft.fake_field"],
    ["E-R3-02", "decision_plan.recommended_message_draft.text"],
    ["E-R3-02", "decision_plan.aftercare_plan[999].action"],
    ["E-R3-02", "report_content.short_letter[999]"],
    ["E-R3-01", "report_content.message_temperature.fake_field"],
    ["E-R3-02", "report_content.message_temperature.softness"],
    ["E-R3-02", "report_content.relationship_summary"],
    ["E-R3-02", "report_content.change_condition_commentary[0]"],
    ["E-R3-02", "report_content.constructor"],
    ["E-R3-02", "unknown.path"],
  ]) {
    assert.equal(
      buildDirective(
        [semanticFinding("FACT_FIDELITY", "major", jsonPath)],
        caseId,
      ),
      null,
      jsonPath,
    );
  }

  assert.equal(
    buildDirective([
      semanticFinding(
        "FACT_FIDELITY",
        "major",
        "decision_plan.recommended_message_draft",
      ),
    ]).scope,
    "plan_and_report",
  );
  assert.equal(
    buildDirective([
      semanticFinding(
        "FACT_FIDELITY",
        "major",
        "report_content.message_temperature",
      ),
    ]).scope,
    "report_only",
  );
});

await check("any invalid finding rejects the full directive and resolved values never flow", () => {
  const authority = currentProductAuthority("E-R3-01");
  authority.decisionPlan.actions_to_take[0] =
    "RESOLVED_PLAN_VALUE_MUST_NOT_FLOW";
  authority.reportContent.short_letter[0] =
    "RESOLVED_REPORT_VALUE_MUST_NOT_FLOW";
  const findings = [
    semanticFinding(
      "ACTION_CONSISTENCY",
      "major",
      "decision_plan.actions_to_take[0]",
      "RAW_EVALUATOR_DETAIL_MUST_NOT_FLOW",
    ),
    semanticFinding(
      "REPETITION",
      "major",
      "report_content.short_letter[0]",
      "SECOND_RAW_DETAIL_MUST_NOT_FLOW",
    ),
  ];
  const directive = buildQualityReassessmentDirectiveV1({
    blockingFindings: findings,
    ...authority,
  });
  assert.ok(directive);
  assert.deepEqual(Object.keys(directive).sort(), [
    "attemptNumber",
    "defects",
    "schemaVersion",
    "scope",
    "source",
  ]);
  assert.doesNotMatch(
    JSON.stringify(directive),
    /RESOLVED_PLAN_VALUE|RESOLVED_REPORT_VALUE|RAW_EVALUATOR_DETAIL|SECOND_RAW_DETAIL/u,
  );
  assert.equal(
    buildQualityReassessmentDirectiveV1({
      blockingFindings: [
        ...findings,
        semanticFinding(
          "FACT_FIDELITY",
          "major",
          "decision_plan.actions_to_take[999]",
        ),
      ],
      ...authority,
    }),
    null,
  );
});

await check("malformed excessive and local-shape directive behavior is bounded", () => {
  assert.equal(QUALITY_REASSESSMENT_MAX_DEFECTS, 12);
  assert.equal(
    buildDirective(
      Array.from({ length: 13 }, () =>
        semanticFinding("FACT_FIDELITY", "major", "report_content.cover_line"),
      ),
    ),
    null,
  );
  assert.equal(
    buildDirective([
      { finding_code: "UNKNOWN", severity: "major", json_path: "report_content.cover_line" },
    ]),
    null,
  );
  const local = buildLocalSemanticShapeReassessmentDirectiveV1();
  assert.equal(local.source, "local_semantic_shape");
  assert.equal(local.scope, "report_only");
  assert.equal(local.defects.length, 1);
});

await check("Stage records and all Stage request hashes carry attempt number", () => {
  const types = readText("lib/assessment/runtime/types.ts");
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.match(types, /type StageAttemptNumber = 1 \| 2/u);
  assert.match(types, /StartStageRecord[\s\S]+attemptNumber: StageAttemptNumber/u);
  assert.match(types, /SkipStageRecord[\s\S]+attemptNumber: 1/u);
  assert.match(pipeline, /const requestHash = hashJson\(\{[\s\S]+attemptNumber/u);
  assert.match(pipeline, /stageId: "PB-01C",\s+attemptNumber: 1/u);
  assert.match(pipeline, /reusedFrom: "initial_run_immutable_authority"/u);
});

await check("Fake repository allows V15 downstream attempt 2 and rejects upstream V14 and attempt 3", async () => {
  const repository = new FakeAssessmentRepository();
  await repository.createRequest({
    id: "r", idempotencyKey: "k", source: "internal_review_runtime",
    currentSituation: "x", optionalMessage: null, relationship: "other",
    requestedTopics: ["relationship"], privacyAcknowledged: true,
    now: "2026-08-17T00:00:00.000Z",
  });
  await repository.createRun({
    id: "run", requestId: "r", requestedModel: "gpt-5.6-luna",
    promptBundleVersion: "prompt-bundle-runtime-v15.0.0",
    schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
    stageTopologyVersion: "split-base-candidate-v1", runKind: "initial",
    startedAt: "2026-08-17T00:00:00.000Z",
  });
  const record = {
    runId: "run", stageId: "PB-04", sequenceNumber: 5,
    requestHash: "0".repeat(64), promptHash: "1".repeat(64),
    schemaHash: "2".repeat(64), requestedModel: "gpt-5.6-luna",
    createdAt: "2026-08-17T00:00:00.000Z",
  };
  await repository.startStage({ ...record, id: "s1", attemptNumber: 1 });
  await repository.startStage({ ...record, id: "s2", attemptNumber: 2 });
  await assert.rejects(
    repository.startStage({ ...record, id: "s3", attemptNumber: 3 }),
    (error) => error instanceof M2RuntimeError && error.safeCode === "M2_STAGE_TOPOLOGY_INVALID",
  );
  await assert.rejects(
    repository.startStage({ ...record, id: "s4", stageId: "PB-01", sequenceNumber: 1, attemptNumber: 2 }),
    (error) => error instanceof M2RuntimeError && error.safeCode === "M2_STAGE_TOPOLOGY_INVALID",
  );
});

await check("Supabase repository persists attempt number for start and skip rows", () => {
  const source = readText("lib/assessment/runtime/supabase-repository.ts");
  assert.match(source, /type StageRunRow[\s\S]+attempt_number: 1 \| 2/u);
  assert.equal((source.match(/attempt_number: record\.attemptNumber/gu) ?? []).length, 2);
});

await check("migration 0009 only adds backfills and constrains attempt-aware persistence", () => {
  const migration = readText("supabase/migrations/0009_m2_p4_jpy980_quality_reassessment.sql");
  assert.match(migration, /add column attempt_number integer/u);
  assert.match(migration, /set attempt_number = 1/u);
  assert.match(migration, /alter column attempt_number set not null/u);
  assert.match(migration, /unique \(run_id, stage_id, attempt_number\)/u);
  assert.match(migration, /unique \(run_id, sequence_number, attempt_number\)/u);
  assert.doesNotMatch(migration, /create table|delete from|drop table|truncate|payment|customer/u);
});

await check("migration 0009 enforces V15 downstream-only attempt 2 and preserves runtime pairs", () => {
  const migration = readText("supabase/migrations/0009_m2_p4_jpy980_quality_reassessment.sql");
  assert.match(migration, /prompt-bundle-runtime-v15\.0\.0/u);
  assert.match(migration, /new\.stage_id in \('PB-04', 'PB-05', 'PB-06'\)/u);
  assert.match(migration, /new\.status <> 'skipped'/u);
  assert.match(migration, /enforce_assessment_stage_topology_v4/u);
  for (let version = 9; version <= 15; version += 1) {
    assert.match(migration, new RegExp("prompt-bundle-runtime-v" + version + "\\.0\\.0", "u"));
  }
});

await check("Service selects V15 and Pipeline activates recovery only for V15", () => {
  const service = readText("lib/assessment/runtime/service.ts");
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.match(service, /loadM2P4QualityReassessmentRuntimeStageCatalog/u);
  assert.doesNotMatch(service, /loadM2P4SemanticQualityRuntimeStageCatalog/u);
  assert.match(pipeline, /prompt-bundle-runtime-v15\.0\.0[\s\S]+completeV15Ready/u);
  const v15Body = pipeline.slice(
    pipeline.indexOf("private async completeV15Ready"),
    pipeline.indexOf("private async completeV1A2Ready"),
  );
  assert.doesNotMatch(v15Body, /createRun|idempotency|createRequest|createClarification/u);
});

await check("V15 participates in V1-A identity timezone resume Candidate V2 and initial routing", () => {
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.match(pipeline, /v1A2CapablePair[\s\S]+prompt-bundle-runtime-v15\.0\.0/u);
  assert.match(pipeline, /authorityIntegrityRuntime[\s\S]+prompt-bundle-runtime-v15\.0\.0[\s\S]+groundCandidateAnalysisV2/u);
  assert.match(pipeline, /resumeWithAccumulatedUsage[\s\S]+prompt-bundle-runtime-v15\.0\.0/u);
  assert.match(pipeline, /executeSplit[\s\S]+prompt-bundle-runtime-v15\.0\.0[\s\S]+executeV1A2Initial/u);
  assert.match(pipeline, /M2_SECOND_CLARIFICATION_PROHIBITED/u);
});

await check("first-pass PASS delivers with attempt 1 only", async () => {
  const scenario = await cached("first-pass", () => runInitialScenario({ catalog: v15Catalog }));
  assert.equal(scenario.error, null);
  assert.equal(scenario.result.eligibility, "ready");
  assert.equal(scenario.repository.requests.size, 1);
  assert.equal(scenario.repository.runs.size, 1);
  assert.equal(scenario.repository.reports.size, 1);
  assert.equal([...scenario.repository.stageRuns.values()].every((stage) => stage.attemptNumber === 1), true);
  assert.equal(scenario.transport.requests.find((request) => request.stageId === "PB-04").input.quality_reassessment_directive, null);
});

await check("major report repetition performs report-only PB-05 PB-06 attempt 2", async () => {
  const scenario = await cached("repetition", () =>
    runInitialScenario({
      catalog: v15Catalog,
      firstFindings: [semanticFinding("REPETITION", "major", "report_content.action_rationales[0]")],
    }),
  );
  assert.equal(scenario.error, null);
  assert.equal(scenario.result.eligibility, "ready");
  assert.deepEqual(stagesFor(scenario, "PB-04").map((stage) => stage.attemptNumber), [1]);
  assert.deepEqual(stagesFor(scenario, "PB-05").map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(stagesFor(scenario, "PB-06").map((stage) => stage.attemptNumber), [1, 2]);
});

await check("major template genericity repairs through one report-only cycle", async () => {
  const scenario = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [semanticFinding("TEMPLATE_GENERICITY", "major", "report_content.short_letter[0]")],
  });
  assert.equal(scenario.error, null);
  assert.equal(scenario.repository.reports.size, 1);
  assert.deepEqual(stagesFor(scenario, "PB-05").map((stage) => stage.attemptNumber), [1, 2]);
});

await check("cold REQUIRED_SECTION_MEANING repairs through report-only cycle", async () => {
  const scenario = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [semanticFinding("REQUIRED_SECTION_MEANING", "major", "report_content.short_letter")],
  });
  assert.equal(scenario.error, null);
  assert.equal(scenario.result.eligibility, "ready");
  assert.equal(stagesFor(scenario, "PB-04").length, 1);
});

await check("unsupported certainty on report repairs through report-only cycle", async () => {
  const scenario = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [semanticFinding("UNSUPPORTED_CERTAINTY", "major", "report_content.decision_reason_summary")],
  });
  assert.equal(scenario.error, null);
  assert.equal(scenario.result.eligibility, "ready");
  assert.equal(stagesFor(scenario, "PB-06")[0].failure.errorCode, "M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED");
});

await check("material Decision Plan defect reruns PB-04 PB-05 PB-06", async () => {
  const scenario = await cached("plan", () =>
    runInitialScenario({
      catalog: v15Catalog,
      caseId: "E-R3-04",
      requestedTopics: ["draft_message"],
      materialGoalValue: "maintain_distance",
      firstFindings: [semanticFinding("MESSAGE_POLICY_CONSISTENCY", "major", "decision_plan.recommended_message_draft.text")],
    }),
  );
  assert.equal(scenario.error, null);
  assert.deepEqual(stagesFor(scenario, "PB-04").map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(stagesFor(scenario, "PB-05").map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(stagesFor(scenario, "PB-06").map((stage) => stage.attemptNumber), [1, 2]);
});

await check("mixed Plan and Report defects select plan-and-report at runtime", async () => {
  const scenario = await cached("mixed", () =>
    runInitialScenario({
      catalog: v15Catalog,
      firstFindings: [
        semanticFinding("ACTION_CONSISTENCY", "major", "decision_plan.actions_to_take[0]"),
        semanticFinding("REPETITION", "major", "report_content.closing_lines[0]"),
      ],
    }),
  );
  assert.equal(scenario.error, null);
  const request = scenario.transport.requests.filter((entry) => entry.stageId === "PB-04")[1];
  assert.equal(request.input.quality_reassessment_directive.scope, "plan_and_report");
  assert.equal(request.input.quality_reassessment_directive.defects.length, 2);
});

await check("local shape failure performs PB-05 PB-06 attempt 2 only", async () => {
  const fixture = diagnosticCase("E-R3-02");
  const valid = structuredClone(fixture.outputs["PB-05"]);
  const invalid = invalidShapeReport(valid);
  const scenario = await cached("local-shape", () =>
    runInitialScenario({ catalog: v15Catalog, pb05Sequence: [invalid, valid] }),
  );
  assert.equal(scenario.error, null);
  assert.deepEqual(stagesFor(scenario, "PB-04").map((stage) => stage.attemptNumber), [1]);
  assert.deepEqual(stagesFor(scenario, "PB-05").map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(stagesFor(scenario, "PB-06").map((stage) => stage.attemptNumber), [2]);
});

await check("attempt-2 semantic failure exhausts with zero Report and no attempt 3", async () => {
  const finding = semanticFinding("REPETITION", "major", "report_content.closing_lines[0]");
  const scenario = await cached("semantic-exhaust", () =>
    runInitialScenario({ catalog: v15Catalog, firstFindings: [finding], secondFindings: [finding] }),
  );
  assert.equal(safeCode(scenario), "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
  assert.equal(scenario.repository.reports.size, 0);
  assert.deepEqual(stagesFor(scenario, "PB-06").map((stage) => stage.attemptNumber), [1, 2]);
  assert.equal([...scenario.repository.stageRuns.values()].some((stage) => stage.attemptNumber > 2), false);
});

await check("attempt-2 shape failure exhausts with zero Report", async () => {
  const fixture = diagnosticCase("E-R3-02");
  const invalid = invalidShapeReport(fixture.outputs["PB-05"]);
  const scenario = await cached("shape-exhaust", () =>
    runInitialScenario({ catalog: v15Catalog, pb05Sequence: [invalid, invalid] }),
  );
  assert.equal(safeCode(scenario), "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
  assert.equal(scenario.repository.reports.size, 0);
  assert.equal(stagesFor(scenario, "PB-06").length, 0);
});

await check("Provider transport failure does not enter Product-quality reassessment", async () => {
  const scenario = await runInitialScenario({ catalog: v15Catalog, failAtStage: "PB-05" });
  assert.equal(safeCode(scenario), "M2_FAKE_STAGE_FAILURE");
  assert.equal(stagesFor(scenario, "PB-05").length, 1);
  assert.equal(scenario.repository.reports.size, 0);
});

await check("Provider schema failure does not enter Product-quality reassessment", async () => {
  const scenario = await runInitialScenario({ catalog: v15Catalog, schemaInvalid: true });
  assert.equal(safeCode(scenario), "M2_STAGE_SCHEMA_INVALID");
  assert.equal(stagesFor(scenario, "PB-05").length, 1);
  assert.equal(scenario.repository.reports.size, 0);
});

await check("recognized-root nonexistent path fails closed with no attempt 2", async () => {
  const scenario = await runInitialScenario({
    catalog: v15Catalog,
    firstFindings: [
      semanticFinding(
        "ACTION_CONSISTENCY",
        "major",
        "decision_plan.actions_to_take[999]",
      ),
    ],
  });
  assert.equal(safeCode(scenario), "M2_SEMANTIC_VALIDATION_FAILED");
  for (const stageId of ["PB-04", "PB-05", "PB-06"]) {
    assert.equal(
      stagesFor(scenario, stageId).filter((stage) => stage.attemptNumber === 2)
        .length,
      0,
      stageId,
    );
  }
  assert.equal(scenario.repository.reports.size, 0);
});

await check("V14 equivalent finding retains historical terminal semantic failure", async () => {
  const scenario = await runInitialScenario({
    catalog: v14Catalog,
    firstFindings: [semanticFinding("REPETITION", "major", "report_content.closing_lines[0]")],
  });
  assert.equal(safeCode(scenario), "M2_SEMANTIC_VALIDATION_FAILED");
  assert.equal(stagesFor(scenario, "PB-05").length, 1);
  assert.equal(stagesFor(scenario, "PB-06").length, 1);
});

await check("clarification recovery stays in same request and existing resume run", async () => {
  const scenario = await cached("clarification", () => runClarificationRecovery(v15Catalog));
  assert.equal(scenario.first.eligibility, "needs_more_information");
  assert.equal(scenario.resumed.eligibility, "ready");
  assert.equal(scenario.repository.requests.size, 1);
  assert.equal(scenario.repository.runs.size, 2);
  assert.equal(scenario.repository.clarifications.size, 1);
  const resume = [...scenario.repository.runs.values()].find((run) => run.runKind === "clarification_resume");
  assert.ok(resume);
  const attempt2 = [...scenario.repository.stageRuns.values()].filter(
    (stage) => stage.runId === resume.id && stage.attemptNumber === 2,
  );
  assert.deepEqual(attempt2.map((stage) => stage.stageId), ["PB-05", "PB-06"]);
});

await check("attempt-1 and attempt-2 usage accumulates in one successful run", async () => {
  const scenario = await cached("repetition", () => assert.fail("cache missing"));
  const count = scenario.transport.calls.length;
  const expected = {
    totalInputTokens: Array.from({ length: count }, (_, index) => 101 + index).reduce((a, b) => a + b, 0),
    totalCachedTokens: 0,
    totalOutputTokens: Array.from({ length: count }, (_, index) => 21 + index).reduce((a, b) => a + b, 0),
    totalReasoningTokens: count * 5,
    usageDerivedCostUsd: Number(
      Array.from({ length: count }, (_, index) =>
        calculateUsageDerivedCostUsd({
          inputTokens: 101 + index,
          cachedTokens: 0,
          outputTokens: 21 + index,
          reasoningTokens: 5,
        }),
      )
        .reduce((total, cost) => total + cost, 0)
        .toFixed(9),
    ),
  };
  assert.deepEqual(scenario.result.usage, expected);
  assert.deepEqual(scenario.repository.runs.values().next().value.totalInputTokens, expected.totalInputTokens);
});

await check("report-only exact draft is preserved and raw evaluator detail never enters attempt 2", async () => {
  const rawDetail = "RAW_EVALUATOR_PROSE_MUST_NOT_FLOW";
  const scenario = await cached("draft-report-only", () =>
    runInitialScenario({
      catalog: v15Catalog,
      caseId: "E-R3-04",
      requestedTopics: ["draft_message"],
      materialGoalValue: "maintain_distance",
      firstFindings: [semanticFinding("REPETITION", "major", "report_content.closing_lines[0]", rawDetail)],
    }),
  );
  assert.equal(scenario.error, null);
  const plan1 = scenario.transport.requests.find((request) => request.stageId === "PB-04").input;
  const pb05Requests = scenario.transport.requests.filter((request) => request.stageId === "PB-05");
  assert.equal(pb05Requests.length, 2);
  assert.equal(
    pb05Requests[1].input.decision_plan.recommended_message_draft.text,
    scenario.result.report.decisionPlan.recommended_message_draft.text,
  );
  assert.equal(
    pb05Requests[1].input.decision_plan.recommended_message_draft.text,
    scenario.fixture.outputs["PB-04"].recommended_message_draft.text,
  );
  assert.equal("report_content" in pb05Requests[1].input, false);
  assert.doesNotMatch(JSON.stringify(pb05Requests[1].input), new RegExp(rawDetail, "u"));
  assert.equal(plan1.quality_reassessment_directive, null);
});

await check("attempt rows persist required and exhausted safe codes with one run finalization", async () => {
  const repaired = await cached("repetition", () => assert.fail("cache missing"));
  const exhausted = await cached("semantic-exhaust", () => assert.fail("cache missing"));
  assert.equal(stagesFor(repaired, "PB-06")[0].failure.errorCode, "M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED");
  assert.equal(stagesFor(exhausted, "PB-06")[1].failure.errorCode, "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
  assert.equal(exhausted.repository.events.filter((event) => event === "failRun").length, 1);
  assert.equal(repaired.repository.events.filter((event) => event === "finalizeCompletedAssessment").length, 1);
});

await check("machine-readable recovery matrix contains all thirty bounded and precise-path cases", () => {
  assert.equal(cases.cases.length, 30);
  assert.equal(new Set(cases.cases.map((entry) => entry.case_id)).size, 30);
  for (const required of [
    "major_report_repetition", "major_template_genericity",
    "cold_required_section_meaning", "unsupported_report_certainty",
    "material_decision_plan_defect", "mixed_plan_and_report_defects",
    "application_owned_relationship_summary", "unknown_path",
    "local_shape_attempt_1", "attempt_2_semantic_failure",
    "attempt_2_shape_failure", "provider_transport_failure",
    "provider_schema_failure", "first_pass_success",
    "v14_historical_semantic_failure", "clarification_resume_report_repair",
    "usage_accumulates", "report_only_exact_draft",
    "sanitized_directive_only", "malformed_or_too_many_defects",
    "precise_observed_commentary_path", "invalid_selected_decision_child",
    "invalid_actions_to_take_index", "invalid_draft_child",
    "invalid_null_draft_text", "invalid_aftercare_index_child",
    "invalid_short_letter_index", "invalid_message_temperature_child",
    "invalid_null_message_temperature_child",
    "application_owned_change_condition_commentary",
  ]) assert.ok(cases.cases.some((entry) => entry.case_id === required), required);
  for (const caseId of [
    "invalid_selected_decision_child", "invalid_actions_to_take_index",
    "invalid_draft_child", "invalid_null_draft_text",
    "invalid_aftercare_index_child", "invalid_short_letter_index",
    "invalid_message_temperature_child",
    "invalid_null_message_temperature_child",
    "application_owned_relationship_summary",
    "application_owned_change_condition_commentary", "unknown_path",
  ]) {
    const expected = cases.cases.find((entry) => entry.case_id === caseId).expected;
    assert.equal(expected.automatic_reassessment, false, caseId);
    assert.equal(expected.safe_code, "M2_SEMANTIC_VALIDATION_FAILED", caseId);
    assert.equal(expected.pb_04_attempt_2_count, 0, caseId);
    assert.equal(expected.pb_05_attempt_2_count, 0, caseId);
    assert.equal(expected.pb_06_attempt_2_count, 0, caseId);
    assert.equal(expected.report_count, 0, caseId);
  }
  assert.equal(cases.provider_calls, 0);
});

await check("V1-C core evaluator shape PB-06 and V14 remain byte-identical", () => {
  for (const relativePath of [
    "lib/assessment/runtime/semantic-disposition-v4.ts",
    "lib/assessment/runtime/semantic-disposition-v5.ts",
    "lib/assessment/runtime/product-semantic-shape-v1.ts",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v14.json",
    "lib/assessment/runtime/contracts/pb-06-semantic-quality-v1.developer.md",
  ]) assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
});

await check("protected authority UI projection Payment and historical migrations remain unchanged", () => {
  for (const relativePath of [
    "lib/assessment/runtime/types.ts",
    "lib/assessment/runtime/fakes.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/policy.ts",
    "lib/assessment/runtime/policy-v2.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/contracts/pb-05-semantic-depth-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-04-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-04-quality-reassessment-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-05-quality-reassessment-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-06-semantic-quality-v1.developer.md",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json",
    "supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql",
    "supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
    "supabase/migrations/0008_m2_p4_jpy980_semantic_quality_runtime_identity.sql",
    "supabase/migrations/0009_m2_p4_jpy980_quality_reassessment.sql",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
  ]) assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  const baselinePaths = git(["ls-tree", "-r", "--name-only", baseline])
    .split(/\r?\n/u)
    .filter(Boolean);
  for (const relativePath of baselinePaths.filter((value) => /(?:^|\/)(?:contracts\/.*\.schema\.json|schemas\/.*\.schema\.json)$/u.test(value))) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
  for (const relativePath of baselinePaths.filter((value) => /(?:payment|stripe|payjp)/iu.test(value))) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
});

await check("offline artifacts preserve evidence ceilings and operations zero", () => {
  assert.equal(contract.operations.provider_calls, 0);
  assert.equal(contract.operations.db_operations, 0);
  assert.equal(contract.operations.supabase_operations, 0);
  assert.equal(contract.operations.migration_applies, 0);
  assert.ok(contract.unestablished.includes("real_provider_repair_success_rate"));
  assert.ok(contract.unestablished.includes("actual_product_quality"));
  assert.equal(contract.authority.v1_c_r1_initial_review, "NEEDS_CORRECTION");
  assert.equal(
    contract.authority.v1_c_r1_c1,
    "precise_repair_path_corrected_pending_human_chatgpt_review",
  );
  assert.equal(contract.directive.path_authority.static_product_owned_allowlist, true);
  assert.equal(contract.directive.path_authority.actual_current_product_resolution, true);
  assert.equal(contract.directive.path_authority.resolved_value_copied_to_directive, false);
  assert.equal(offline.unestablished.provider_semantic_fidelity, true);
  assert.equal(offline.current_product_authority.v1_c_human_acceptance, "HOLD");
  assert.equal(
    offline.current_product_authority.v1_c_r1_c1,
    "precise_repair_path_corrected_pending_human_chatgpt_review",
  );
  assert.equal(workPackages.packages.find((entry) => entry.id === "V1-D").authorized, false);
});

await check("sensitive diff scan main next-env diff-check and stash remain clean", () => {
  const sensitivePatterns = [
    new RegExp("s" + "k-[A-Za-z0-9_-]{20,}", "gu"),
    new RegExp("service_" + "role[^\\n]{0,40}[=:][^\\n]{8,}", "giu"),
    new RegExp("-----" + "BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", "gu"),
    new RegExp(
      "ey" +
        "J[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}",
      "gu",
    ),
  ];
  let sensitive = 0;
  for (const relativePath of exactScope) {
    const source = readText(relativePath);
    for (const pattern of sensitivePatterns) {
      sensitive += [...source.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitive, 0);
  git(["diff", "--check", baseline, "--"]);
  assert.equal(worktreeBlob("next-env.d.ts"), blob(baseline, "next-env.d.ts"));
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("immutable V1-C R1 verifier remains PASS 46/46 at correction parent", () => {
  immutableR1Output = runImmutableVerifier(
    baseline,
    r1Branch,
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c-r1-quality-reassessment.mjs",
  );
  assert.match(immutableR1Output, /quality reassessment verifier: PASS 46\/46/u);
  assert.match(immutableR1Output, /Exact scope: 23\/23; UPDATE 14; NEW 9/u);
});

await check("immutable V1-C core verifier remains PASS 49/49", () => {
  immutableV1COutput = immutableR1Output;
  assert.match(
    immutableV1COutput,
    /PASS immutable V1-C core verifier remains PASS 49\/49/u,
  );
  assert.match(
    immutableV1COutput,
    /Immutable V1-C core verifier: PASS 49\/49/u,
  );
});

await check("immutable V1-C output retains V1-B and complete accepted upstream chain", () => {
  for (const pattern of [
    /Immutable V1-B semantic depth verifier: PASS 38\/38/u,
    /Immutable V1-A2 R2\/R1\/original\/planning\/V1-A1: PASS 29\/29, 29\/29, 22\/22, 27\/27, 26\/26, 25\/25, 24\/24/u,
    /JPY980 R1\/original, R2-C, R2-B: PASS 19\/19, 18\/18, 17\/17, 21\/21/u,
    /Decision Policy: PASS 40\/40; all upstream accepted verifiers: PASS/u,
    /PASS immutable V1-C output retains V1-B and complete accepted upstream chain/u,
    /V1-C Human acceptance: HOLD; Provider repair success\/Product quality\/JPY980 readiness: unestablished/u,
  ]) assert.match(immutableV1COutput, pattern);
});

assert.equal(checks, 50);
if (failures.length > 0) {
  console.error("\n" + taskId + " verifier: FAIL");
  console.error("Failed checks: " + failures.join("; "));
  process.exit(1);
}

const head = git(["rev-parse", "HEAD"]);
const commitMode = head === baseline ? "precommit" : "one_direct_commit";
console.log("\n" + taskId + " precise repair path verifier: PASS 50/50");
console.log("Exact scope: 13/13; UPDATE 13; NEW 0; DELETE 0; RENAME 0");
console.log("Git mode: " + commitMode + "; exact parent: " + baseline);
console.log("V15: PB-04/PB-05 Prompt successors only; existing schemas; seven stages");
console.log("Same request/current run; one automatic reassessment; no attempt 3: PASS");
console.log("Static ownership plus actual Product path resolution; fail-closed invalid path: PASS");
console.log("Sanitized directive, attempt persistence, usage, exact draft: PASS");
console.log("Immutable V1-C R1 quality reassessment verifier: PASS 46/46");
console.log("Immutable V1-C core verifier: PASS 49/49");
console.log("Immutable V1-B semantic depth verifier: PASS 38/38");
console.log(
  "Immutable V1-A2 R2/R1/original/planning/V1-A1: PASS 29/29, 29/29, 22/22, 27/27, 26/26, 25/25, 24/24",
);
console.log(
  "JPY980 R1/original, R2-C, R2-B: PASS 19/19, 18/18, 17/17, 21/21",
);
console.log("Decision Policy: PASS 40/40; all upstream accepted verifiers: PASS");
console.log(
  "Live Provider calls: 0; DB/Supabase/migration apply/Payment/deploy: 0/0/0/0/0",
);
console.log(
  "V1-C Human acceptance: HOLD; Provider repair success/Product quality/JPY980 readiness: unestablished",
);
