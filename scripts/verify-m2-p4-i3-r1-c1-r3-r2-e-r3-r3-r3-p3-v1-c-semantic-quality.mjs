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
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import {
  normalizeProductSemanticShapeTextV1,
  validateProductSemanticShapeV1,
} from "../lib/assessment/runtime/product-semantic-shape-v1.ts";
import {
  loadM2P4SemanticDepthRuntimeStageCatalog,
  loadM2P4SemanticQualityRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";
import { evaluateSemanticFindingsV4 } from "../lib/assessment/runtime/semantic-disposition-v4.ts";
import {
  SEMANTIC_DISPOSITION_V5_PRODUCT_QUALITY_PATH_PATTERNS,
  evaluateSemanticFindingsV5,
} from "../lib/assessment/runtime/semantic-disposition-v5.ts";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-C";
const baseline = "e21c9b571426160703b1112c9057cc26c7738a0a";
const acceptedV1A = "d19d72e9a3f7e9fbbbd7fda9e11b131314030cea";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c-semantic-quality";
const acceptedV1BBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-b-semantic-depth";
const expectedSubject = "feat: add JPY980 semantic quality evaluator";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c";
const planningRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_B_REVIEW.md",
  planningRoot + "/implementation-work-packages-v1.json",
  planningRoot + "/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-b/capabilities-v1.json",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
];
const newPaths = [
  "lib/assessment/runtime/semantic-disposition-v5.ts",
  "lib/assessment/runtime/product-semantic-shape-v1.ts",
  "lib/assessment/runtime/contracts/pb-06-semantic-quality-v1.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v14.json",
  "supabase/migrations/0008_m2_p4_jpy980_semantic_quality_runtime_identity.sql",
  packageRoot + "/semantic-quality-contract-v1.json",
  packageRoot + "/semantic-disposition-cases-v1.json",
  packageRoot + "/capabilities-v1.json",
  packageRoot + "/offline-results-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_C_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-c-semantic-quality.mjs",
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

function gitRaw(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
    },
  );
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
  const temp = mkdtempSync(path.join(tmpdir(), "moon-reply-v1-c-"));
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
    execFileSync("git.exe", ["-c", safe, "config", "core.autocrlf", "true"], {
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
    const trackedPaths = git(["ls-tree", "-r", "--name-only", revision])
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const candidate of trackedPaths) {
      const sourcePath = path.join(root, candidate);
      if (!existsSync(sourcePath)) continue;
      if (worktreeBlob(candidate) !== blob(revision, candidate)) continue;
      copyFileSync(sourcePath, path.join(clone, candidate));
    }
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
    const run = spawnSync(process.execPath, [path.join(clone, verifier)], {
      cwd: clone,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
    });
    if (run.status !== 0) {
      throw new Error(
        "immutable verifier failed at " +
          revision +
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

function createApplication(catalog, fixture, outputs, repository, transport, extra = {}) {
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

async function runInitialReady(catalog) {
  const fixture = diagnosticCase("E-R3-02");
  const repository = new FakeAssessmentRepository();
  const outputs = structuredClone(fixture.outputs);
  const transport = new FakeAiStageTransport({ outputs });
  const application = createApplication(
    catalog,
    fixture,
    outputs,
    repository,
    transport,
  );
  const result = await application.submit(
    fixture.input,
    "11111111-1111-4111-8111-111111111111",
  );
  return {
    eligibility: result.eligibility,
    calls: transport.calls,
    clarificationCount: repository.clarifications.size,
    reportCount: repository.reports.size,
    actualProviderCalls: transport.actualProviderCalls,
  };
}

async function runClarificationLifecycle(catalog) {
  const fixture = diagnosticCase("E-R3-05");
  const outputs = structuredClone(fixture.outputs);
  outputs["PB-06"] = structuredClone(
    diagnosticCase("E-R3-02").outputs["PB-06"],
  );
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(7));
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
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs,
    outputSequence: { "PB-01": [outputs["PB-01"], groundingOutput] },
  });
  const application = createApplication(
    catalog,
    fixture,
    outputs,
    repository,
    transport,
    { clarificationId: () => clarificationId },
  );
  const first = await application.submit(
    fixture.input,
    "22222222-2222-4222-8222-222222222222",
  );
  const resumed = await application.answerClarification(clarificationId, answer);
  const callsBeforeDuplicate = transport.calls.length;
  const runsBeforeDuplicate = repository.runs.size;
  const duplicate = await application.answerClarification(clarificationId, answer);
  assert.equal(duplicate.duplicate, true);
  assert.equal(transport.calls.length, callsBeforeDuplicate);
  assert.equal(repository.runs.size, runsBeforeDuplicate);
  await assert.rejects(
    application.answerClarification(clarificationId, {
      kind: "elapsed_bucket",
      value: "one_to_three_days",
    }),
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === "M2_CLARIFICATION_ALREADY_ANSWERED" &&
      error.httpStatus === 409,
  );
  const resumeRun = [...repository.runs.values()].find(
    (run) => run.runKind === "clarification_resume",
  );
  assert.ok(resumeRun);
  const resumeStages = [...repository.stageRuns.values()]
    .filter((stage) => stage.runId === resumeRun.id)
    .sort((left, right) => left.sequenceNumber - right.sequenceNumber)
    .map((stage) => [stage.stageId, stage.status]);
  return {
    initialEligibility: first.eligibility,
    resumedEligibility: resumed.eligibility,
    calls: transport.calls,
    resumeStages,
    clarificationCount: repository.clarifications.size,
    runCount: repository.runs.size,
    reportCount: repository.reports.size,
    actualProviderCalls: transport.actualProviderCalls,
  };
}

function semanticFinding(findingCode, severity, jsonPath) {
  return {
    finding_code: findingCode,
    severity,
    json_path: jsonPath,
    evidence_refs: [],
    detail: "Synthetic evaluator-contract finding for offline disposition plumbing.",
  };
}

async function runWithFinding(catalog, finding) {
  const fixture = diagnosticCase("E-R3-02");
  const outputs = structuredClone(fixture.outputs);
  outputs["PB-06"] = {
    ...outputs["PB-06"],
    semantic_checks: finding === null ? [] : [finding],
  };
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs });
  const application = createApplication(
    catalog,
    fixture,
    outputs,
    repository,
    transport,
  );
  let result = null;
  let safeCode = null;
  try {
    result = await application.submit(
      fixture.input,
      "33333333-3333-4333-8333-333333333333",
    );
  } catch (error) {
    if (!(error instanceof M2RuntimeError)) throw error;
    safeCode = error.safeCode;
  }
  return {
    eligibility: result?.eligibility ?? null,
    safeCode,
    reportCount: repository.reports.size,
    actualProviderCalls: transport.actualProviderCalls,
  };
}

function baseShapeValues() {
  const fixture = diagnosticCase("E-R3-02");
  return {
    decisionPlan: structuredClone(fixture.outputs["PB-04"]),
    reportContent: structuredClone(fixture.outputs["PB-05"]),
  };
}

function assertShapeFailure(callback) {
  assert.throws(
    callback,
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === "M2_PRODUCT_SEMANTIC_SHAPE_INVALID",
  );
}

const semanticContract = readJson(packageRoot + "/semantic-quality-contract-v1.json");
const dispositionCases = readJson(
  packageRoot + "/semantic-disposition-cases-v1.json",
);
const capabilities = readJson(packageRoot + "/capabilities-v1.json");
const offlineResults = readJson(packageRoot + "/offline-results-v1.json");
const workPackages = readJson(planningRoot + "/implementation-work-packages-v1.json");
const planningCapabilities = readJson(planningRoot + "/capabilities-v1.json");
const v1BCapabilities = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-b/capabilities-v1.json",
);
const v13Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v13.json",
);
const v14Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v14.json",
);
const pb06Prompt = readText(
  "lib/assessment/runtime/contracts/pb-06-semantic-quality-v1.developer.md",
);
const validationSchema = readJson("ai/schemas/validation-result.schema.json");
let v13Catalog;
let v14Catalog;
let immutableV1BOutput = "";
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

await check("exact branch lineage accepted refs main remote and empty stash", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), acceptedV1A);
  git(["merge-base", "--is-ancestor", acceptedV1A, baseline]);
  assert.equal(git(["rev-parse", "refs/heads/" + acceptedV1BBranch]), baseline);
  assert.equal(
    git(["rev-parse", "refs/remotes/origin/" + acceptedV1BBranch]),
    baseline,
  );
  assert.equal(remoteHead(acceptedV1BBranch), baseline);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("precommit state or exactly one direct implementation commit", () => {
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

await check("exact 21 paths with 10 UPDATE and 11 NEW", () => {
  const actual = collectScope();
  assert.equal(actual.length, 21);
  assert.deepEqual(sorted(actual.map((entry) => entry.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(
      actual.filter((entry) => entry.status === "M").map((entry) => entry.path),
    ),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(
      actual.filter((entry) => entry.status === "A").map((entry) => entry.path),
    ),
    sorted(newPaths),
  );
  assert.equal(
    actual.some((entry) => ["D", "R", "C"].includes(entry.status)),
    false,
  );
});

await check("V1-B acceptance and V1-C-only implementation authority are synchronized", () => {
  const v1A = workPackages.packages.find((entry) => entry.id === "V1-A");
  const v1B = workPackages.packages.find((entry) => entry.id === "V1-B");
  const v1C = workPackages.packages.find((entry) => entry.id === "V1-C");
  const v1D = workPackages.packages.find((entry) => entry.id === "V1-D");
  assert.equal(v1A.status, "accepted_complete");
  assert.equal(v1B.status, "accepted_complete");
  assert.equal(v1B.accepted_snapshot, baseline);
  assert.equal(v1B.chatgpt_review, "PASS_complete");
  assert.equal(v1B.human_review, "PASS_complete");
  assert.equal(v1B.human_acceptance, "complete");
  assert.equal(v1B.acceptance_date, "2026-08-17");
  assert.equal(v1C.status, "implemented_pending_human_chatgpt_review");
  assert.equal(v1C.authorized, true);
  assert.equal(v1C.human_review, "PENDING");
  assert.equal(v1D.status, "unauthorized");
  assert.equal(v1D.authorized, false);
  assert.equal(
    planningCapabilities.implementation_authority["V1-B"],
    "accepted_complete",
  );
  assert.equal(
    planningCapabilities.implementation_authority["V1-C"],
    "implemented_pending_human_chatgpt_review",
  );
  assert.equal(v1BCapabilities.authority.v1_b_accepted_snapshot, baseline);
  assert.equal(v1BCapabilities.authority.v1_c, "implementation_authorized");
  assert.equal(capabilities.authority.v1_d, "unauthorized");
});

await check("current docs record V1-C review state and authority ceiling", () => {
  for (const candidate of [
    "docs/CODEX_HANDOFF.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_C_REVIEW.md",
  ]) {
    const value = readText(candidate);
    assert.match(value, /e21c9b571426160703b1112c9057cc26c7738a0a/u);
    assert.match(value, /implemented_pending_human_chatgpt_review/u);
    assert.match(value, /remediation_required/u);
    assert.match(value, /not_established/u);
    assert.match(value, /globalQ0Completion(?:=|.)false/u);
  }
  const v1BReview = readText(updatedPaths[3]);
  assert.match(v1BReview, /accepted_complete/u);
  assert.match(v1BReview, /PASS \/ complete/u);
});

await check("V14 manifest identity is exact", () => {
  assert.equal(v14Manifest.schema_version, "m2-p4-runtime-stage-catalog-v2");
  assert.equal(v14Manifest.catalog_version, "runtime-stage-catalog-v14.0.0");
  assert.equal(
    v14Manifest.prompt_bundle_version,
    "prompt-bundle-runtime-v14.0.0",
  );
  assert.equal(
    v14Manifest.schema_set_version,
    "pipeline-schema-runtime-v6.0.0",
  );
  assert.equal(v14Manifest.stage_topology_version, "split-base-candidate-v1");
  assert.equal(v14Manifest.baseline, baseline);
  assert.equal(v14Manifest.hash_algorithm, "sha256-utf8-lf");
});

await check("common Prompt and seven-stage topology equal V13", () => {
  assert.deepEqual(v14Manifest.common_prompt, v13Manifest.common_prompt);
  assert.equal(v14Manifest.stages.length, 7);
  assert.deepEqual(
    v14Manifest.stages.map((stage) => stage.stage_id),
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  );
  assert.deepEqual(
    v14Manifest.stages.map((stage) => stage.sequence_number),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(
    hashText(readText(v14Manifest.common_prompt.prompt_path)),
    v14Manifest.common_prompt.prompt_sha256,
  );
});

await check("only PB-06 manifest Prompt identity differs from V13", () => {
  for (const [index, stage] of v14Manifest.stages.entries()) {
    const previous = v13Manifest.stages[index];
    if (stage.stage_id === "PB-06") {
      assert.equal(stage.source, "m2-p4-v1-c-semantic-quality-successor");
      assert.equal(stage.prompt_version, "v5.0.0");
      assert.equal(
        stage.prompt_path,
        "lib/assessment/runtime/contracts/pb-06-semantic-quality-v1.developer.md",
      );
      assert.notEqual(stage.prompt_sha256, previous.prompt_sha256);
      assert.deepEqual(stripPromptIdentity(stage), stripPromptIdentity(previous));
    } else {
      assert.deepEqual(stage, previous, stage.stage_id);
    }
  }
});

await check("PB-06 validation schema identity and bytes are unchanged", () => {
  const current = v14Manifest.stages.find((stage) => stage.stage_id === "PB-06");
  const previous = v13Manifest.stages.find((stage) => stage.stage_id === "PB-06");
  for (const key of [
    "schema_version",
    "schema_name",
    "schema_path",
    "schema_pointer",
    "schema_sha256",
  ]) {
    assert.deepEqual(current[key], previous[key], key);
  }
  assert.equal(current.schema_path, "ai/schemas/validation-result.schema.json");
  assert.equal(hashText(readText(current.schema_path)), current.schema_sha256);
  assert.equal(
    worktreeBlob(current.schema_path),
    blob(baseline, current.schema_path),
  );
});

await check("V14 loader verifies predecessor schemas and exact definitions", async () => {
  [v13Catalog, v14Catalog] = await Promise.all([
    loadM2P4SemanticDepthRuntimeStageCatalog(),
    loadM2P4SemanticQualityRuntimeStageCatalog(),
  ]);
  assert.equal(v13Catalog.catalogVersion, "runtime-stage-catalog-v13.0.0");
  assert.equal(v14Catalog.catalogVersion, "runtime-stage-catalog-v14.0.0");
  assert.equal(
    v14Catalog.promptBundleVersion,
    "prompt-bundle-runtime-v14.0.0",
  );
  assert.equal(v14Catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  assert.equal(v14Catalog.stageTopologyVersion, "split-base-candidate-v1");
  assert.deepEqual(
    v14Catalog.definitions.map((definition) => definition.stageId),
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  );
  assert.ok(v14Catalog.definitions[0].clarificationOutputSchema);
});

await check("PB-06 Prompt and assembled developer Prompt hashes are exact", () => {
  const stage = v14Manifest.stages.find((entry) => entry.stage_id === "PB-06");
  const definition = v14Catalog.definitions.find(
    (entry) => entry.stageId === "PB-06",
  );
  assert.equal(hashText(pb06Prompt), stage.prompt_sha256);
  assert.equal(definition.promptVersion, "v5.0.0");
  assert.match(definition.developerPrompt, /# PB-06 Semantic Quality Validator/u);
  assert.match(definition.developerPrompt, /# Common Stage Contract v1\.0\.0/u);
  assert.equal(hashText(definition.developerPrompt), definition.promptHash);
});

await check("PB-06 Prompt self-contains accepted authority responsibilities", () => {
  for (const required of [
    "base_structured_intake",
    "candidate_envelope",
    "user_supplied_optional_message",
    "aggregate_safety_result",
    "decision_policy_result",
    "effective_decision_policy_result",
    "effective_assessment_authority",
    "clarification_consumption_contract",
    "decision_plan",
    "report_content",
    "contact_constraint_policy",
    "action_context",
    "Original Candidate authority",
    "Final draft authority",
    "no_followup_message",
    "business_only",
    "temporal future condition",
  ]) {
    assert.ok(pb06Prompt.includes(required), required);
  }
  assert.doesNotMatch(
    pb06Prompt,
    /apply the previous PB-06|see the V13 PB-06|inherit PB-06 symbolically/iu,
  );
});

await check("exact fourteen-code vocabulary and findings-only output are retained", () => {
  const schemaCodes =
    validationSchema["$defs"].semantic_finding.properties.finding_code.enum;
  assert.equal(schemaCodes.length, 14);
  assert.deepEqual(semanticContract.finding_vocabulary.codes, schemaCodes);
  assert.equal(semanticContract.finding_vocabulary.new_codes_added, false);
  assert.match(pb06Prompt, /deterministic_checks=\[\]/u);
  assert.match(pb06Prompt, /final_disposition=null/u);
  assert.match(pb06Prompt, /repair_strategy=null/u);
  assert.match(pb06Prompt, /failed_codes=\[\]/u);
});

await check("evidence significance and recommendation support are mandatory", () => {
  const evidence = semanticContract.evidence_significance;
  assert.equal(evidence.mandatory, true);
  assert.equal(
    evidence.observed_fact_commentary_must_explain_why_material_fact_matters,
    true,
  );
  assert.equal(evidence.every_observed_fact_required, false);
  assert.deepEqual(evidence.missing_significance_finding, {
    finding_code: "REQUIRED_SECTION_MEANING",
    severity: "major",
  });
  assert.match(pb06Prompt, /why each selected fact matters/u);
  assert.match(pb06Prompt, /DECISION_REASON_SUPPORT.*major/u);
});

await check("grounded Application Decision explanation is explicitly allowed", () => {
  const boundary = semanticContract.decision_explanation_boundary;
  assert.equal(boundary.supported_application_decision_explanation_allowed, true);
  assert.deepEqual(boundary.allowed_chain, [
    "grounded_observed_fact",
    "why_it_matters",
    "why_current_application_decision_is_appropriate",
  ]);
  assert.match(
    pb06Prompt,
    /Explanation of the Application-owned Decision is allowed/u,
  );
  assert.match(
    pb06Prompt,
    /observed fact → significance → why the current Application Decision/u,
  );
});

await check("unsupported cause chronology inner state and future certainty remain blocking", () => {
  const boundary = semanticContract.decision_explanation_boundary;
  assert.equal(boundary.unsupported_causality_blocking, true);
  assert.equal(boundary.unsupported_chronology_blocking, true);
  assert.equal(boundary.unsupported_inner_state_blocking, true);
  assert.equal(boundary.unsupported_future_reply_blocking, true);
  assert.equal(boundary.unsupported_relationship_outcome_blocking, true);
  assert.equal(
    boundary.absence_of_negative_evidence_becomes_positive_certainty,
    false,
  );
  assert.match(
    pb06Prompt,
    /unsupported cause, chronology, inner state, future reply/u,
  );
  assert.match(pb06Prompt, /silence means the other person is busy/u);
});

await check("mandatory emotional containment makes cold Product major and blocking", () => {
  const emotional = semanticContract.emotional_containment;
  assert.equal(emotional.mandatory, true);
  assert.equal(emotional.requires_consultation_specific_acknowledgment, true);
  assert.equal(emotional.requires_calm_present_stopping_point, true);
  assert.equal(emotional.decision_or_action_repeated_as_comfort_allowed, false);
  assert.deepEqual(emotional.logically_complete_but_emotionally_cold, {
    finding_code: "REQUIRED_SECTION_MEANING",
    severity: "major",
    blocking_under_v5: true,
  });
  assert.match(pb06Prompt, /logically correct but emotionally empty/u);
});

await check("generic reassurance has material major and harmless minor boundaries", () => {
  const rule = semanticContract.genericity_materiality;
  assert.equal(rule.finding_code, "TEMPLATE_GENERICITY");
  assert.equal(rule.major_or_critical_requires_all.length, 3);
  assert.equal(rule.major_or_critical_on_provider_product_path_blocks, true);
  assert.equal(rule.minor_nonblocking, true);
  assert.equal(rule.application_word_list_classifier, false);
  assert.match(pb06Prompt, /Use .*TEMPLATE_GENERICITY.* carefully/u);
  assert.match(pb06Prompt, /TEMPLATE_GENERICITY.*minor/u);
});

await check("semantic repetition has material major and incidental minor boundaries", () => {
  const rule = semanticContract.repetition_materiality;
  assert.equal(rule.finding_code, "REPETITION");
  assert.equal(rule.major_or_critical_requires_all.length, 2);
  assert.equal(rule.major_or_critical_on_provider_product_path_blocks, true);
  assert.equal(rule.minor_incidental_overlap_nonblocking, true);
  assert.equal(rule.all_repetition_blocking, false);
  assert.match(pb06Prompt, /Use .*REPETITION.* with materiality/u);
  assert.match(pb06Prompt, /harmless incidental overlap/u);
});

await check("analytical and emotional blocks require different kinds of distinction", () => {
  const functions = semanticContract.distinct_product_functions;
  assert.deepEqual(Object.keys(functions.analytical_or_instructional).sort(), [
    "report_content.action_rationales[*]",
    "report_content.aftercare_commentary[*]",
    "report_content.decision_reason_summary",
    "report_content.observed_fact_commentary[*].commentary",
    "report_content.possible_interpretations[*]",
  ]);
  assert.equal(
    functions.emotional_or_ritual.new_factual_proposition_required,
    false,
  );
  assert.equal(
    functions.emotional_or_ritual
      .distinct_consultation_specific_emotional_function_required,
    true,
  );
  assert.match(
    pb06Prompt,
    /Emotional or ritual blocks do not need a new factual proposition/u,
  );
});

await check("alternative tradeoff is conditional and grounded", () => {
  const tradeoff = semanticContract.alternative_tradeoff;
  assert.equal(tradeoff.requirement, "conditional");
  assert.equal(tradeoff.absence_when_not_applicable_causes_finding, false);
  assert.equal(
    tradeoff.included_tradeoff_requires_plan_plausible_alternative,
    true,
  );
  assert.equal(tradeoff.invented_other_person_reaction_allowed, false);
  assert.match(pb06Prompt, /Alternative tradeoff is conditional/u);
});

await check("exact draft authority and no rewrite repair retry are fixed", () => {
  const authority = semanticContract.exact_draft_boundary;
  assert.equal(
    authority.original_candidate_authority,
    "user_supplied_optional_message",
  );
  assert.equal(
    authority.final_draft_authority,
    "decision_plan.recommended_message_draft.text",
  );
  assert.equal(authority.pb_06_may_rewrite, false);
  assert.equal(authority.report_may_repeat_final_draft, false);
  assert.equal(semanticContract.ownership.repair_or_regeneration_retry, false);
  assert.match(pb06Prompt, /Do not edit, rewrite, repair, regenerate, retry/u);
});

await check("machine contract fixes V5 paths shape limits schemas and V1-D separation", () => {
  assert.equal(semanticContract.v1_c_product_quality_paths.length, 11);
  assert.deepEqual(semanticContract.application_owned_exclusions, [
    "report_content.relationship_summary",
    "report_content.change_condition_commentary",
  ]);
  assert.equal(semanticContract.semantic_disposition_v5.wraps_v4, true);
  assert.equal(semanticContract.deterministic_semantic_shape.checks.length, 4);
  assert.equal(semanticContract.shape_and_length.fixed_word_minimum, null);
  assert.equal(semanticContract.shape_and_length.fixed_section_minimum, null);
  assert.equal(
    semanticContract.invariants.pb_05_changed_from_accepted_v13,
    false,
  );
  assert.equal(
    semanticContract.invariants.v1_d_product_review_fixtures_implemented,
    false,
  );
});

await check("sixteen evaluator-contract cases are exact and not V1-D fixtures", () => {
  const expected = [
    "unsupported_inner_state_major",
    "unsupported_chronology_major",
    "supported_application_decision_explanation",
    "logically_complete_but_emotionally_cold",
    "generic_reassurance_major",
    "generic_phrase_minor_in_specific_report",
    "repeated_meaning_major",
    "repeated_decision_as_closing_major",
    "incidental_repetition_minor",
    "consultation_specific_non_propositional_closing",
    "alternative_tradeoff_not_applicable",
    "manufactured_tradeoff_hidden_state",
    "exact_normalized_duplicate",
    "emotional_block_exact_action_copy",
    "final_draft_exactly_repeated_in_report",
    "distinct_valid_primary_functions",
  ];
  assert.equal(
    dispositionCases.case_kind,
    "evaluator_contract_not_v1_d_product_review",
  );
  assert.equal(dispositionCases.provider_execution, 0);
  assert.deepEqual(
    dispositionCases.cases.map((entry) => entry.case_id),
    expected,
  );
  assert.equal(new Set(expected).size, 16);
});

await check("SemanticDispositionV5 wraps V4 and preserves non-style behavior", () => {
  assert.equal(
    worktreeBlob("lib/assessment/runtime/semantic-disposition-v4.ts"),
    blob(baseline, "lib/assessment/runtime/semantic-disposition-v4.ts"),
  );
  const { decisionPlan, reportContent } = baseShapeValues();
  const validationOutput = {
    semantic_checks: [
      semanticFinding(
        "ASSUMPTION_AS_FACT",
        "major",
        "report_content.cover_line",
      ),
      semanticFinding("FACT_FIDELITY", "minor", "report_content.cover_line"),
      semanticFinding(
        "BRAND_TONE",
        "major",
        "decision_plan.recommended_message_draft.text",
      ),
    ],
  };
  const previous = evaluateSemanticFindingsV4({
    validationOutput,
    decisionPlan,
    groundedReportContent: reportContent,
  });
  const current = evaluateSemanticFindingsV5({
    validationOutput,
    decisionPlan,
    groundedReportContent: reportContent,
  });
  assert.deepEqual(current, previous);
});

await check("V5 blocks major genericity on Product paths but not minor", () => {
  const { decisionPlan, reportContent } = baseShapeValues();
  const major = evaluateSemanticFindingsV5({
    validationOutput: {
      semantic_checks: [
        semanticFinding(
          "TEMPLATE_GENERICITY",
          "major",
          "report_content.short_letter[0]",
        ),
      ],
    },
    decisionPlan,
    groundedReportContent: reportContent,
  });
  const minor = evaluateSemanticFindingsV5({
    validationOutput: {
      semantic_checks: [
        semanticFinding(
          "TEMPLATE_GENERICITY",
          "minor",
          "report_content.short_letter[0]",
        ),
      ],
    },
    decisionPlan,
    groundedReportContent: reportContent,
  });
  assert.equal(major.blockingFindings.length, 1);
  assert.equal(minor.blockingFindings.length, 0);
  assert.equal(minor.nonblockingFindings.length, 1);
});

await check("V5 blocks major repetition on Product paths but not minor", () => {
  const { decisionPlan, reportContent } = baseShapeValues();
  for (const [severity, blocking] of [
    ["major", 1],
    ["critical", 1],
    ["minor", 0],
  ]) {
    const result = evaluateSemanticFindingsV5({
      validationOutput: {
        semantic_checks: [
          semanticFinding(
            "REPETITION",
            severity,
            "report_content.closing_lines[0]",
          ),
        ],
      },
      decisionPlan,
      groundedReportContent: reportContent,
    });
    assert.equal(result.blockingFindings.length, blocking, severity);
  }
});

await check("Application-owned and outside paths keep conservative V4 style behavior", () => {
  const { decisionPlan, reportContent } = baseShapeValues();
  for (const jsonPath of [
    "report_content.relationship_summary",
    "report_content.change_condition_commentary[0]",
    "decision_plan.review_timing.when",
  ]) {
    const result = evaluateSemanticFindingsV5({
      validationOutput: {
        semantic_checks: [
          semanticFinding("TEMPLATE_GENERICITY", "major", jsonPath),
          semanticFinding("REPETITION", "critical", jsonPath),
        ],
      },
      decisionPlan,
      groundedReportContent: reportContent,
    });
    assert.equal(result.blockingFindings.length, 0, jsonPath);
    assert.equal(result.nonblockingFindings.length, 2, jsonPath);
  }
  assert.equal(
    SEMANTIC_DISPOSITION_V5_PRODUCT_QUALITY_PATH_PATTERNS.some((pattern) =>
      /relationship_summary|change_condition_commentary/u.test(pattern),
    ),
    false,
  );
});

await check("V5 preserves accepted temporal false-positive behavior", () => {
  const { decisionPlan, reportContent } = baseShapeValues();
  assert.ok(decisionPlan.change_conditions.length > 0);
  const validationOutput = {
    semantic_checks: [
      semanticFinding(
        "DECISION_ALLOWED",
        "major",
        "decision_plan.change_conditions[0].resulting_direction",
      ),
    ],
  };
  const previous = evaluateSemanticFindingsV4({
    validationOutput,
    decisionPlan,
    groundedReportContent: reportContent,
  });
  const current = evaluateSemanticFindingsV5({
    validationOutput,
    decisionPlan,
    groundedReportContent: reportContent,
  });
  assert.equal(previous.ignoredTemporalFalsePositives.length, 1);
  assert.deepEqual(current, previous);
});

await check("deterministic shape rejects missing Decision-reason Fact anchor", () => {
  const values = baseShapeValues();
  values.reportContent.observed_fact_commentary =
    values.reportContent.observed_fact_commentary.map((entry, index) => ({
      ...entry,
      fact_id: "F9" + String(index).padStart(2, "0"),
    }));
  assertShapeFailure(() => validateProductSemanticShapeV1(values));
});

await check("deterministic shape rejects exact whitespace-normalized duplicate", () => {
  const values = baseShapeValues();
  values.reportContent.cover_line = "同じ Product 意味";
  values.reportContent.decision_reason_summary = "  同じ   Product\n意味  ";
  assert.equal(
    normalizeProductSemanticShapeTextV1(values.reportContent.cover_line),
    normalizeProductSemanticShapeTextV1(
      values.reportContent.decision_reason_summary,
    ),
  );
  assertShapeFailure(() => validateProductSemanticShapeV1(values));
});

await check("deterministic shape does not claim semantic paraphrase detection", () => {
  const values = baseShapeValues();
  values.reportContent.cover_line = "今は待つ方向を置きます。";
  values.reportContent.decision_reason_summary =
    "現時点では急いで動かず、状況を見直せる余地を残します。";
  assert.notEqual(
    normalizeProductSemanticShapeTextV1(values.reportContent.cover_line),
    normalizeProductSemanticShapeTextV1(
      values.reportContent.decision_reason_summary,
    ),
  );
  assert.doesNotThrow(() => validateProductSemanticShapeV1(values));
  assert.equal(
    semanticContract.deterministic_semantic_shape
      .semantic_paraphrase_repetition_proven,
    false,
  );
});

await check("deterministic shape rejects emotional exact action copy", () => {
  const values = baseShapeValues();
  values.reportContent.closing_lines[0] = values.decisionPlan.actions_to_take[0];
  assertShapeFailure(() => validateProductSemanticShapeV1(values));
});

await check("deterministic shape rejects final draft exact report duplication", () => {
  const values = baseShapeValues();
  values.decisionPlan.recommended_message_draft = {
    text: "この文面をそのまま送ります。",
    policy: "later_only",
    use_timing: "later",
  };
  values.reportContent.message_draft_context = "この文面をそのまま送ります。";
  assertShapeFailure(() => validateProductSemanticShapeV1(values));
});

await check("valid distinct Product shape passes without prohibited classifiers", () => {
  const values = baseShapeValues();
  assert.doesNotThrow(() => validateProductSemanticShapeV1(values));
  const source = readText("lib/assessment/runtime/product-semantic-shape-v1.ts");
  assert.match(source, /replace\(\/\\s\+\/gu, " "\)\.trim\(\)/u);
  assert.doesNotMatch(
    source,
    /embedding|semantic similarity|edit distance|sentiment|case_id|fixture_id|Japanese keyword/iu,
  );
});

await check("Service selects only the V14 semantic-quality loader", () => {
  const service = canonical(readText("lib/assessment/runtime/service.ts"));
  assert.equal(
    [...service.matchAll(/loadM2P4SemanticQualityRuntimeStageCatalog/gmu)].length,
    2,
  );
  assert.doesNotMatch(
    service,
    /loadM2P4SemanticDepthRuntimeStageCatalog/u,
  );
  const baselineService = canonical(
    gitRaw(["show", baseline + ":lib/assessment/runtime/service.ts"]),
  );
  assert.equal(
    service.replaceAll("SemanticQuality", "SemanticDepth"),
    baselineService,
  );
});

await check("all V13 V1-A-capable Pipeline classifications include V14", () => {
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.equal(
    [...pipeline.matchAll(/prompt-bundle-runtime-v14\.0\.0/gmu)].length,
    6,
  );
  for (const anchor of [
    "const v1A2CapablePair",
    "authorityIntegrityRuntime",
    "groundCandidateAnalysisV2(response.output)",
    "M2_SECOND_CLARIFICATION_PROHIBITED",
    "return this.executeV1A2Initial(request, runContext)",
    "pipeline-schema-runtime-v6.0.0",
  ]) {
    assert.ok(pipeline.includes(anchor), anchor);
  }
});

await check("V14 shape runs after grounding and schema before PB-06 with V5 only", () => {
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  const shape = pipeline.indexOf("validateProductSemanticShapeV1({");
  const reportValidation = pipeline.lastIndexOf("validateStageOutput(", shape);
  const grounding = pipeline.lastIndexOf(
    "groundChangeConditionCommentaryV3(",
    shape,
  );
  const pb06 = pipeline.indexOf(
    'definition: this.definition("PB-06")',
    shape,
  );
  const v5 = pipeline.indexOf("evaluateSemanticFindingsV5({", pb06);
  const v4 = pipeline.indexOf("evaluateSemanticFindingsV4({", pb06);
  assert.ok(
    grounding < reportValidation &&
      reportValidation < shape &&
      shape < pb06 &&
      pb06 < v5 &&
      v5 < v4,
  );
  assert.match(
    pipeline.slice(pb06, v4 + 200),
    /semanticQualityRuntime[\s\S]+evaluateSemanticFindingsV5[\s\S]+evaluateSemanticFindingsV4/u,
  );
});

await check("fake cold generic repetition major findings prevent V14 delivery", async () => {
  for (const finding of [
    semanticFinding(
      "REQUIRED_SECTION_MEANING",
      "major",
      "report_content.short_letter",
    ),
    semanticFinding(
      "TEMPLATE_GENERICITY",
      "major",
      "report_content.short_letter[0]",
    ),
    semanticFinding(
      "REPETITION",
      "major",
      "report_content.closing_lines[0]",
    ),
  ]) {
    const result = await runWithFinding(v14Catalog, finding);
    assert.equal(result.safeCode, "M2_SEMANTIC_VALIDATION_FAILED");
    assert.equal(result.reportCount, 0);
    assert.equal(result.actualProviderCalls, 0);
  }
  const historical = await runWithFinding(
    v13Catalog,
    semanticFinding(
      "TEMPLATE_GENERICITY",
      "major",
      "report_content.short_letter[0]",
    ),
  );
  assert.equal(historical.eligibility, "ready");
  assert.equal(historical.reportCount, 1);
});

await check("fake minor generic and repetition findings remain deliverable in V14", async () => {
  for (const finding of [
    semanticFinding(
      "TEMPLATE_GENERICITY",
      "minor",
      "report_content.short_letter[0]",
    ),
    semanticFinding(
      "REPETITION",
      "minor",
      "report_content.closing_lines[0]",
    ),
  ]) {
    const result = await runWithFinding(v14Catalog, finding);
    assert.equal(result.eligibility, "ready");
    assert.equal(result.safeCode, null);
    assert.equal(result.reportCount, 1);
    assert.equal(result.actualProviderCalls, 0);
  }
});

await check("V14 initial no-clarification routing equals V13", async () => {
  const previous = await runInitialReady(v13Catalog);
  const current = await runInitialReady(v14Catalog);
  assert.deepEqual(current, previous);
  assert.equal(current.eligibility, "ready");
  assert.deepEqual(current.calls, [
    "PB-01",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ]);
  assert.equal(current.clarificationCount, 0);
  assert.equal(current.reportCount, 1);
  assert.equal(current.actualProviderCalls, 0);
});

await check("V14 one-answer clarification lifecycle equals V13", async () => {
  const previous = await runClarificationLifecycle(v13Catalog);
  const current = await runClarificationLifecycle(v14Catalog);
  assert.deepEqual(current, previous);
  assert.equal(current.initialEligibility, "needs_more_information");
  assert.equal(current.resumedEligibility, "ready");
  assert.deepEqual(current.resumeStages, [
    ["PB-01", "completed"],
    ["PB-01C", "skipped"],
    ["PB-02", "skipped"],
    ["PB-03", "skipped"],
    ["PB-04", "completed"],
    ["PB-05", "completed"],
    ["PB-06", "completed"],
  ]);
  assert.equal(current.clarificationCount, 1);
  assert.equal(current.runCount, 2);
  assert.equal(current.reportCount, 1);
  assert.equal(current.actualProviderCalls, 0);
});

await check("Candidate Grounding V2 Effective Authority PB-04 and PB-05 are preserved", () => {
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.match(pipeline, /groundCandidateAnalysisV2\(response\.output\)/u);
  assert.match(pipeline, /buildEffectiveAssessmentAuthorityV1/u);
  assert.match(pipeline, /validateEffectiveAssessmentAuthorityIntegrityV1/u);
  for (const candidate of [
    "lib/assessment/runtime/contracts/pb-04-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-05-semantic-depth-v1.developer.md",
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
  ]) {
    assert.equal(worktreeBlob(candidate), blob(baseline, candidate), candidate);
  }
  assert.deepEqual(
    v14Manifest.stages.find((stage) => stage.stage_id === "PB-04"),
    v13Manifest.stages.find((stage) => stage.stage_id === "PB-04"),
  );
  assert.deepEqual(
    v14Manifest.stages.find((stage) => stage.stage_id === "PB-05"),
    v13Manifest.stages.find((stage) => stage.stage_id === "PB-05"),
  );
});

await check("migration 0008 only widens Runtime identity to V14 v6", () => {
  const previous = canonical(
    readText(
      "supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
    ),
  );
  let additions = 0;
  const expected = previous.replace(
    /^(\s*)'prompt-bundle-runtime-v13\.0\.0'$/gmu,
    (_match, indent) => {
      additions += 1;
      return (
        indent +
        "'prompt-bundle-runtime-v13.0.0',\n" +
        indent +
        "'prompt-bundle-runtime-v14.0.0'"
      );
    },
  );
  const current = canonical(
    readText(
      "supabase/migrations/0008_m2_p4_jpy980_semantic_quality_runtime_identity.sql",
    ),
  );
  assert.equal(additions, 2);
  assert.equal(current, expected);
  assert.match(current, /split-base-candidate-v1/u);
  assert.match(current, /prompt-bundle-runtime-v14\.0\.0/u);
  assert.match(current, /pipeline-schema-runtime-v6\.0\.0/u);
  assert.equal(
    (current.match(/alter table public\.assessment_runs/gu) ?? []).length,
    2,
  );
  assert.doesNotMatch(
    current,
    /create table|insert into|update public|delete from|create function|create or replace function/iu,
  );
  assert.equal(capabilities.implemented.migration_applied, false);
  assert.equal(offlineResults.established.migration_0008_applied, false);
});

await check("protected schemas Product UI V13 Prompt V4 and migrations are unchanged", () => {
  const protectedPaths = [
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v13.json",
    "lib/assessment/runtime/contracts/pb-05-semantic-depth-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-06-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/report-content-v2.schema.json",
    "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
    "ai/schemas/validation-result.schema.json",
    "lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/semantic-disposition-v4.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql",
    "supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "components/runtime/CustomerDraftCopyButton.tsx",
    "components/runtime/RuntimeAssessmentForm.tsx",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
  ];
  for (const candidate of protectedPaths) {
    assert.equal(worktreeBlob(candidate), blob(baseline, candidate), candidate);
  }
});

await check("offline claims operations sensitive scan and diff check are bounded", () => {
  for (const key of [
    "actual_pb_06_provider_detection_recall",
    "actual_pb_06_provider_detection_precision",
    "actual_pb_05_provider_prose_quality",
    "semantic_paraphrase_repetition_detection_proven",
    "human_emotional_understanding",
    "plausibly_worth_jpy980",
    "provider_semantic_fidelity",
  ]) {
    assert.equal(offlineResults.unestablished[key], true, key);
  }
  assert.equal(
    offlineResults.current_product_authority.r2_c,
    "remediation_required",
  );
  assert.equal(
    offlineResults.current_product_authority.jpy980RuntimeReadiness,
    "not_established",
  );
  assert.equal(
    offlineResults.current_product_authority.globalQ0Completion,
    false,
  );
  for (const value of Object.values(capabilities.operations)) {
    assert.equal(value, 0);
  }
  const patterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
  ];
  let sensitive = 0;
  for (const candidate of exactScope) {
    const value = readText(candidate);
    assert.equal(value.includes("\uFFFD"), false, candidate);
    for (const pattern of patterns) {
      sensitive += [...value.matchAll(pattern)].length;
    }
  }
  assert.equal(sensitive, 0);
  git(["diff", "--check", baseline, "--"]);
});

await check("main next-env Payment and final Git state remain protected", () => {
  const baselinePaths = git(["ls-tree", "-r", "--name-only", baseline])
    .split(/\r?\n/u)
    .filter(Boolean);
  for (const candidate of baselinePaths.filter((value) =>
    /(?:payment|stripe|payjp)/iu.test(value),
  )) {
    assert.equal(worktreeBlob(candidate), blob(baseline, candidate), candidate);
  }
  assert.equal(worktreeBlob("next-env.d.ts"), blob(baseline, "next-env.d.ts"));
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("immutable accepted V1-B verifier remains PASS 38/38", () => {
  immutableV1BOutput = runImmutableVerifier(
    baseline,
    acceptedV1BBranch,
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-b-semantic-depth.mjs",
  );
  assert.match(
    immutableV1BOutput,
    /semantic depth successor verifier: PASS 38\/38/u,
  );
  assert.match(
    immutableV1BOutput,
    /Exact scope: 18\/18; UPDATE 10; NEW 8/u,
  );
  assert.match(immutableV1BOutput, /Live Provider calls: 0/u);
});

await check("immutable V1-B output retains the complete accepted upstream chain", () => {
  for (const pattern of [
    /Immutable V1-A2 R2\/R1\/original\/planning\/V1-A1: PASS 29\/29, 29\/29, 22\/22, 27\/27, 26\/26, 25\/25, 24\/24/u,
    /JPY980 R1\/original, R2-C, R2-B: PASS 19\/19, 18\/18, 17\/17, 21\/21/u,
    /Decision Policy: PASS 40\/40; all upstream accepted verifiers: PASS/u,
    /Provider semantic fidelity: unestablished; R2-C: remediation_required/u,
  ]) {
    assert.match(immutableV1BOutput, pattern);
  }
});

assert.equal(checks, 49);
if (failures.length > 0) {
  console.error("\n" + taskId + " verifier: FAIL");
  console.error("Failed checks: " + failures.join("; "));
  process.exit(1);
}

const head = git(["rev-parse", "HEAD"]);
const commitMode = head === baseline ? "precommit" : "one_direct_commit";
console.log(
  "\n" + taskId + " semantic quality successor verifier: PASS 49/49",
);
console.log("Exact scope: 21/21; UPDATE 10; NEW 11; DELETE 0; RENAME 0");
console.log("Git mode: " + commitMode + "; exact parent: " + baseline);
console.log("V14: PB-06 only; existing schemas; seven stages; split topology");
console.log("SemanticDispositionV5 and exact ProductSemanticShapeV1: PASS");
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
  "Provider detection fidelity: unestablished; R2-C: remediation_required",
);
