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
  assertOpenAIStructuredOutputSchema,
  toOpenAiStructuredOutputSchema,
} from "../lib/assessment/runtime/openai-schema.ts";
import {
  loadM2P4ClarificationIntegrationRuntimeStageCatalog,
  loadM2P4SemanticDepthRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-B";
const baseline = "d19d72e9a3f7e9fbbbd7fda9e11b131314030cea";
const r1Correction = "a5e0c6b9e0a6f51d5534cf5d8a7ea72f54ec2203";
const implementation = "3195c278d688bc866d2e0825df88cdf62b149547";
const acceptedV1A1 = "8db5c6386ed0b9b16f0d1586f47d384262cc502b";
const originalV1A1 = "65c245860813f6179689855b344dbf6fd425867a";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-b-semantic-depth";
const expectedSubject = "feat: add JPY980 semantic depth successor";
const acceptedV1A2Branch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-r2-consumption-truth";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-b";
const planningRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A2_REVIEW.md",
  planningRoot + "/implementation-work-packages-v1.json",
  planningRoot + "/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2/capabilities-v1.json",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
];
const newPaths = [
  "lib/assessment/runtime/contracts/pb-05-semantic-depth-v1.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v13.json",
  "supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
  packageRoot + "/semantic-depth-generation-contract-v1.json",
  packageRoot + "/capabilities-v1.json",
  packageRoot + "/offline-results-v1.json",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_B_REVIEW.md",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-b-semantic-depth.mjs",
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

function gitRaw(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      ...options,
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

function runImmutableVerifier(revision, branch, verifier, prefix) {
  const temp = mkdtempSync(path.join(tmpdir(), prefix));
  const clone = path.join(temp, "repo");
  try {
    execFileSync("git.exe", ["clone", "--quiet", "--no-checkout", root, clone], {
      cwd: root,
      stdio: "pipe",
    });
    symlinkSync(path.join(root, "node_modules"), path.join(clone, "node_modules"), "junction");
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
        `immutable verifier failed at ${revision}\n${run.stdout}\n${run.stderr}`,
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
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
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
      optionalMessage: pb04?.provider_request.input.user_supplied_optional_message ?? null,
      relationship: pb01.provider_request.input.relationship,
      requestedTopics: pb01.provider_request.input.requested_topics,
      privacyAcknowledged: true,
    },
  };
}

async function runInitialReady(catalog) {
  const fixture = diagnosticCase("E-R3-02");
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs: structuredClone(fixture.outputs),
  });
  const application = new AssessmentApplication({
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
  const result = await application.submit(
    fixture.input,
    "11111111-1111-4111-8111-111111111111",
  );
  return {
    eligibility: result.eligibility,
    calls: transport.calls,
    clarificationCount: repository.clarifications.size,
    actualProviderCalls: transport.actualProviderCalls,
  };
}

async function runClarificationLifecycle(catalog) {
  const fixture = diagnosticCase("E-R3-05");
  const pass = diagnosticCase("E-R3-02").outputs["PB-06"];
  const outputs = structuredClone(fixture.outputs);
  outputs["PB-06"] = structuredClone(pass);
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
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    clarificationId: () => clarificationId,
    timeZone: "Asia/Tokyo",
  });
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
    actualProviderCalls: transport.actualProviderCalls,
  };
}

const generationContract = readJson(
  packageRoot + "/semantic-depth-generation-contract-v1.json",
);
const capabilities = readJson(packageRoot + "/capabilities-v1.json");
const offlineResults = readJson(packageRoot + "/offline-results-v1.json");
const workPackages = readJson(planningRoot + "/implementation-work-packages-v1.json");
const planningCapabilities = readJson(planningRoot + "/capabilities-v1.json");
const v1A2Capabilities = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2/capabilities-v1.json",
);
const v12Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v12.json",
);
const v13Manifest = readJson(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v13.json",
);
const pb05Prompt = readText(
  "lib/assessment/runtime/contracts/pb-05-semantic-depth-v1.developer.md",
);
let v12Catalog;
let v13Catalog;
let immutableR2Output = "";
let immutableOriginalV1A1Source = "";
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

await check("exact branch accepted lineage main and empty stash", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), r1Correction);
  assert.equal(git(["rev-parse", r1Correction + "^"]), implementation);
  git(["merge-base", "--is-ancestor", acceptedV1A1, baseline]);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("precommit state or exactly one direct implementation commit", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const count = Number(git(["rev-list", "--count", baseline + ".." + head]));
  assert.ok(count === 0 || count === 1);
  if (count === 0) {
    assert.equal(head, baseline);
  } else {
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
  }
  const remote = remoteHead(expectedBranch);
  assert.ok(remote === null || remote === head);
  if (remote !== null) assert.equal(count, 1);
});

await check("exact 18 paths with 10 UPDATE and 8 NEW", () => {
  const actual = collectScope();
  assert.equal(actual.length, 18);
  assert.deepEqual(sorted(actual.map((entry) => entry.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(actual.filter((entry) => entry.status === "M").map((entry) => entry.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(actual.filter((entry) => entry.status === "A").map((entry) => entry.path)),
    sorted(newPaths),
  );
  assert.equal(actual.some((entry) => ["D", "R", "C"].includes(entry.status)), false);
});

await check("V1-A acceptance authority is synchronized", () => {
  const v1A = workPackages.packages.find((entry) => entry.id === "V1-A");
  const v1A1 = v1A.subpackages.find((entry) => entry.id === "V1-A1");
  const v1A2 = v1A.subpackages.find((entry) => entry.id === "V1-A2");
  assert.equal(v1A.status, "accepted_complete");
  assert.equal(v1A.complete, true);
  assert.equal(v1A1.status, "accepted_complete");
  assert.equal(v1A1.accepted_snapshot, acceptedV1A1);
  assert.equal(v1A2.status, "accepted_complete");
  assert.equal(v1A2.accepted_snapshot, baseline);
  assert.equal(v1A2.chatgpt_review, "PASS_complete");
  assert.equal(v1A2.human_review, "PASS_complete");
  assert.equal(v1A2.human_acceptance, "complete");
  assert.equal(v1A2.acceptance_date, "2026-08-17");
  assert.equal(v1A2Capabilities.authority.v1_a_overall, "accepted_complete");
});

await check("V1-B only is implemented and V1-C D remain unauthorized", () => {
  const v1B = workPackages.packages.find((entry) => entry.id === "V1-B");
  const v1C = workPackages.packages.find((entry) => entry.id === "V1-C");
  const v1D = workPackages.packages.find((entry) => entry.id === "V1-D");
  assert.equal(v1B.status, "implemented_pending_human_chatgpt_review");
  assert.equal(v1B.authorized, true);
  assert.equal(v1B.human_review, "PENDING");
  assert.equal(v1B.chatgpt_review, "PENDING");
  assert.equal(v1C.status, "unauthorized");
  assert.equal(v1C.authorized, false);
  assert.equal(v1D.status, "unauthorized");
  assert.equal(v1D.authorized, false);
  assert.equal(
    planningCapabilities.implementation_authority["V1-B"],
    "implemented_pending_human_chatgpt_review",
  );
  assert.equal(planningCapabilities.implementation_authority["V1-C"], "unauthorized");
  assert.equal(planningCapabilities.implementation_authority["V1-D"], "unauthorized");
  assert.equal(capabilities.authority.v1_c, "unauthorized");
  assert.equal(capabilities.authority.v1_d, "unauthorized");
});

await check("current docs record acceptance review request and authority ceiling", () => {
  for (const candidate of [
    "docs/CODEX_HANDOFF.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A2_REVIEW.md",
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_B_REVIEW.md",
  ]) {
    const text = readText(candidate);
    assert.match(text, /d19d72e9a3f7e9fbbbd7fda9e11b131314030cea/u, candidate);
    assert.match(text, /accepted_complete/u, candidate);
    assert.match(text, /remediation_required/u, candidate);
    assert.match(text, /not_established/u, candidate);
    assert.match(text, /globalQ0Completion(?:=|`)false|globalQ0Completion`?=false|globalQ0Completion=false/u, candidate);
  }
  const review = readText(
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_B_REVIEW.md",
  );
  assert.match(review, /implemented_pending_human_chatgpt_review/u);
  assert.match(review, /PENDING/u);
  assert.match(review, /Provider semantic fidelity/u);
});

await check("V13 manifest identity is exact", () => {
  assert.equal(v13Manifest.schema_version, "m2-p4-runtime-stage-catalog-v2");
  assert.equal(v13Manifest.catalog_version, "runtime-stage-catalog-v13.0.0");
  assert.equal(v13Manifest.prompt_bundle_version, "prompt-bundle-runtime-v13.0.0");
  assert.equal(v13Manifest.schema_set_version, "pipeline-schema-runtime-v6.0.0");
  assert.equal(v13Manifest.stage_topology_version, "split-base-candidate-v1");
  assert.equal(v13Manifest.baseline, baseline);
  assert.equal(v13Manifest.hash_algorithm, "sha256-utf8-lf");
});

await check("common Prompt and seven-stage topology equal V12", () => {
  assert.deepEqual(v13Manifest.common_prompt, v12Manifest.common_prompt);
  assert.equal(v13Manifest.stages.length, 7);
  assert.deepEqual(
    v13Manifest.stages.map((entry) => [entry.stage_id, entry.sequence_number]),
    [
      ["PB-01", 1],
      ["PB-01C", 2],
      ["PB-02", 3],
      ["PB-03", 4],
      ["PB-04", 5],
      ["PB-05", 6],
      ["PB-06", 7],
    ],
  );
  const commonText = readText(v13Manifest.common_prompt.prompt_path);
  assert.equal(hashText(commonText), v13Manifest.common_prompt.prompt_sha256);
});

await check("only PB-05 manifest identity differs from V12", () => {
  for (let index = 0; index < v13Manifest.stages.length; index += 1) {
    const stage = v13Manifest.stages[index];
    const oldStage = v12Manifest.stages[index];
    if (stage.stage_id === "PB-05") {
      assert.equal(stage.source, "m2-p4-v1-b-semantic-depth-successor");
      assert.equal(stage.prompt_version, "v5.0.0");
      assert.equal(
        stage.prompt_path,
        "lib/assessment/runtime/contracts/pb-05-semantic-depth-v1.developer.md",
      );
      assert.notEqual(stage.prompt_sha256, oldStage.prompt_sha256);
      assert.deepEqual(stripPromptIdentity(stage), stripPromptIdentity(oldStage));
    } else {
      assert.deepEqual(stage, oldStage, stage.stage_id);
    }
  }
});

await check("PB-05 schema identity and existing Report schema bytes are unchanged", () => {
  const current = v13Manifest.stages.find((entry) => entry.stage_id === "PB-05");
  const previous = v12Manifest.stages.find((entry) => entry.stage_id === "PB-05");
  for (const key of [
    "schema_version",
    "schema_name",
    "schema_path",
    "schema_pointer",
    "schema_sha256",
  ]) {
    assert.deepEqual(current[key], previous[key], key);
  }
  assert.equal(current.schema_path, "lib/assessment/runtime/contracts/report-content-v2.schema.json");
  assert.equal(hashText(readText(current.schema_path)), current.schema_sha256);
  assert.equal(worktreeBlob(current.schema_path), blob(baseline, current.schema_path));
});

await check("V13 loader verifies schemas and returns exact definitions", async () => {
  v12Catalog = await loadM2P4ClarificationIntegrationRuntimeStageCatalog();
  v13Catalog = await loadM2P4SemanticDepthRuntimeStageCatalog();
  assert.equal(v13Catalog.catalogVersion, "runtime-stage-catalog-v13.0.0");
  assert.equal(v13Catalog.promptBundleVersion, "prompt-bundle-runtime-v13.0.0");
  assert.equal(v13Catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  assert.equal(v13Catalog.stageTopologyVersion, "split-base-candidate-v1");
  assert.deepEqual(
    v13Catalog.definitions.map((entry) => entry.stageId),
    ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
  );
  assert.ok(v13Catalog.definitions[0].clarificationOutputSchema);
  for (const definition of v13Catalog.definitions) {
    assertOpenAIStructuredOutputSchema(
      toOpenAiStructuredOutputSchema(definition.outputSchema),
    );
  }
});

await check("PB-05 Prompt and assembled developer Prompt hashes are exact", () => {
  const manifestStage = v13Manifest.stages.find((entry) => entry.stage_id === "PB-05");
  const definition = v13Catalog.definitions.find((entry) => entry.stageId === "PB-05");
  assert.equal(hashText(pb05Prompt), manifestStage.prompt_sha256);
  assert.equal(definition.promptVersion, "v5.0.0");
  assert.match(definition.developerPrompt, /# PB-05 Semantic Depth Report/u);
  assert.match(definition.developerPrompt, /# Common Stage Contract v1\.0\.0/u);
  assert.equal(hashText(definition.developerPrompt), definition.promptHash);
});

await check("PB-05 Prompt self-contains accepted source responsibilities", () => {
  for (const required of [
    "base_structured_intake",
    "candidate_envelope",
    "decision_plan",
    "effective_assessment_authority",
    "clarification_consumption_contract",
    "contact_constraint_policy",
    "action_context",
    "Do not consume or reconstruct raw Candidate text",
    "Base owns factual situation content",
    "Decision Plan owns the selected action",
    "Clarification provenance separate",
    "consumed_effective_paths",
    "PB-06 retains the accepted validation responsibility",
  ]) {
    assert.ok(pb05Prompt.includes(required), required);
  }
  assert.doesNotMatch(pb05Prompt, /Apply the previous PB-05 contract|see the V12 PB-05|inherit PB-05 symbolically/iu);
});

await check("temporal and contact constraints remain self-contained", () => {
  for (const required of [
    "action_context.action_horizon.user_facing_label_ja",
    "not a historical fact",
    "not a deadline imposed on the other person",
    "no_followup_message",
    "business_only",
    "current direction, current action, and observable reassessment condition",
  ]) {
    assert.ok(pb05Prompt.includes(required), required);
  }
  assert.match(pb05Prompt, /Do not predict a reply or any future event/u);
});

await check("Product doctrine value chain and hidden reasoning boundary are complete", () => {
  for (const required of [
    "what this user is deciding, fearing, or finding difficult",
    "material observed evidence",
    "why that evidence matters",
    "bounded interpretation",
    "selected current direction and why it fits",
    "usable action or permitted draft explanation",
    "honest unknown or observable reassessment condition",
    "consultation-specific emotional stopping point",
    "not reasoning to reveal",
    "Do not emit this sequence, reasoning traces, or proposition IDs",
  ]) {
    assert.ok(pb05Prompt.includes(required), required);
  }
});

await check("eight value functions and Full Product threshold are exact", () => {
  assert.equal(generationContract.value_functions.length, 8);
  assert.deepEqual(
    generationContract.value_functions.map((entry) => [entry.id, entry.name]),
    [
      ["A", "consultation_core"],
      ["B", "evidence_and_significance"],
      ["C", "decision_logic"],
      ["D", "alternative_tradeoff"],
      ["E", "action_artifact"],
      ["F", "uncertainty_boundary"],
      ["G", "reassessment_trigger"],
      ["H", "emotional_containment"],
    ],
  );
  assert.deepEqual(generationContract.full_product_threshold.mandatory, [
    "consultation_core",
    "evidence_and_significance",
    "decision_logic",
    "action_artifact",
    "emotional_containment",
  ]);
  assert.deepEqual(generationContract.full_product_threshold.at_least_one, [
    "uncertainty_boundary",
    "reassessment_trigger",
  ]);
});

await check("existing field ownership map is exact", () => {
  const mapping = generationContract.field_function_mapping;
  assert.equal(mapping.length, 13);
  assert.deepEqual(sorted(mapping.map((entry) => entry.field)), sorted([
    "cover_line",
    "decision_reason_summary",
    "observed_fact_commentary",
    "possible_interpretations",
    "short_letter",
    "anxiety_reframe",
    "action_rationales",
    "message_draft_context",
    "message_temperature",
    "aftercare_commentary",
    "relationship_summary",
    "change_condition_commentary",
    "closing_lines",
  ]));
  assert.equal(new Set(mapping.map((entry) => entry.field)).size, 13);
});

await check("consultation evidence and decision fields have distinct responsibilities", () => {
  for (const field of [
    "cover_line",
    "decision_reason_summary",
    "observed_fact_commentary",
    "possible_interpretations",
  ]) {
    assert.match(pb05Prompt, new RegExp("### `" + field + "`", "u"));
  }
  assert.match(pb05Prompt, /grounded material fact to why it matters/u);
  assert.match(pb05Prompt, /normally using `decision_plan\.decision_reason_fact_ids`/u);
  assert.match(pb05Prompt, /Zero items are allowed/u);
  assert.match(pb05Prompt, /Do not add filler alternatives/u);
});

await check("baseline emotional opening and closing are mandatory and non-repeating", () => {
  assert.match(pb05Prompt, /`short_letter` — mandatory baseline/u);
  assert.match(pb05Prompt, /one or two useful paragraphs/u);
  assert.match(pb05Prompt, /Do not invent a fear, restate the selected Decision, repeat an action instruction/u);
  assert.match(pb05Prompt, /`closing_lines` — mandatory emotional closing/u);
  assert.match(pb05Prompt, /what they no longer need to solve tonight/u);
  assert.match(pb05Prompt, /Do not repeat the selected Decision or action instruction/u);
});

await check("topic-conditional fields use exact null and empty boundaries", () => {
  const byField = Object.fromEntries(
    generationContract.field_function_mapping.map((entry) => [entry.field, entry]),
  );
  assert.equal(
    byField.anxiety_reframe.use_when,
    "organize_emotions_selected_and_grounded_concern_is_useful",
  );
  assert.deepEqual(byField.anxiety_reframe.otherwise, []);
  assert.equal(byField.message_temperature.use_when, "message_impact_selected");
  assert.equal(byField.message_temperature.otherwise, null);
  assert.equal(byField.aftercare_commentary.use_when, "next_three_days_selected");
  assert.deepEqual(byField.aftercare_commentary.otherwise, []);
  assert.equal(byField.message_draft_context.otherwise, null);
});

await check("alternative tradeoff remains genuinely conditional", () => {
  assert.match(pb05Prompt, /alternative tradeoff only when another current action is genuinely material/u);
  assert.match(pb05Prompt, /concrete benefit and concrete cost or risk/u);
  assert.match(pb05Prompt, /Do not invent the other person's reaction/u);
  assert.match(pb05Prompt, /never manufacture a tradeoff/u);
  const tradeoff = generationContract.value_functions.find((entry) => entry.id === "D");
  assert.equal(tradeoff.requirement, "conditional");
});

await check("evidence and interpretation boundary is explicit", () => {
  const boundary = generationContract.evidence_interpretation_boundary;
  assert.equal(boundary.absence_of_negative_evidence_becomes_positive_hidden_state_certainty, false);
  assert.equal(boundary.prohibited_without_direct_support.length, 6);
  assert.ok(boundary.prohibited_without_direct_support.includes("相手は忙しいから返信していない"));
  assert.ok(boundary.prohibited_without_direct_support.includes("この関係は大丈夫"));
  assert.deepEqual(boundary.fabrication_prohibited, [
    "causality",
    "chronology",
    "inner_state",
    "future_reply",
    "relationship_outcome",
  ]);
  for (const statement of boundary.prohibited_without_direct_support) {
    assert.ok(pb05Prompt.includes(statement), statement);
  }
});

await check("non-repetition shape and V1-C separation do not overclaim", () => {
  assert.equal(generationContract.shape_boundary.fixed_word_minimum, null);
  assert.equal(generationContract.shape_boundary.fixed_section_minimum, null);
  assert.equal(generationContract.shape_boundary.section_count_padding_prohibited, true);
  assert.equal(
    generationContract.non_repetition_generation_rule.deterministic_semantic_repetition_enforcement_established,
    false,
  );
  assert.equal(generationContract.non_repetition_generation_rule.enforcement_owner, "V1-C");
  assert.match(pb05Prompt, /There is no fixed word minimum, sentence minimum, or section minimum/u);
  assert.match(pb05Prompt, /does not claim deterministic semantic-repetition enforcement/u);
});

await check("exact PB-04 final draft authority is preserved", () => {
  const authority = generationContract.exact_draft_authority;
  assert.equal(authority.owner, "PB-04_decision_plan.recommended_message_draft.text");
  assert.equal(authority.pb_05_may_rewrite, false);
  assert.equal(authority.pb_05_may_reconstruct_candidate, false);
  assert.equal(authority.pb_05_may_emit_alternate_draft, false);
  assert.equal(authority.pb_05_may_normalize_emoji_or_line_breaks, false);
  assert.match(pb05Prompt, /PB-05 never owns final draft text/u);
  assert.match(pb05Prompt, /improve Kansai or persona language/u);
});

await check("Application-owned relationship and change-condition fields spend no depth", () => {
  const byField = Object.fromEntries(
    generationContract.field_function_mapping.map((entry) => [entry.field, entry]),
  );
  assert.equal(byField.relationship_summary.owner, "application_groundReportContentV3");
  assert.equal(byField.relationship_summary.provider_preferred_output, null);
  assert.equal(
    byField.change_condition_commentary.owner,
    "application_groundChangeConditionCommentaryV3",
  );
  assert.deepEqual(byField.change_condition_commentary.provider_preferred_output, []);
  assert.equal(
    worktreeBlob("lib/assessment/runtime/report-grounding-v3.ts"),
    blob(baseline, "lib/assessment/runtime/report-grounding-v3.ts"),
  );
  assert.equal(
    worktreeBlob("lib/assessment/runtime/change-condition-grounding-v3.ts"),
    blob(baseline, "lib/assessment/runtime/change-condition-grounding-v3.ts"),
  );
});

await check("Service selects only the V13 semantic-depth loader", () => {
  const service = readText("lib/assessment/runtime/service.ts");
  assert.equal(
    [...service.matchAll(/loadM2P4SemanticDepthRuntimeStageCatalog/gu)].length,
    2,
  );
  assert.doesNotMatch(service, /loadM2P4ClarificationIntegrationRuntimeStageCatalog/u);
  const diff = git(["diff", "--unified=0", baseline, "--", "lib/assessment/runtime/service.ts"]);
  const changed = diff
    .split(/\r?\n/u)
    .filter((line) => /^[+-](?![+-]{2})/u.test(line));
  assert.deepEqual(changed, [
    '-import { loadM2P4ClarificationIntegrationRuntimeStageCatalog } from "./schema-catalog.ts";',
    '+import { loadM2P4SemanticDepthRuntimeStageCatalog } from "./schema-catalog.ts";',
    "-  const catalog = await loadM2P4ClarificationIntegrationRuntimeStageCatalog();",
    "+  const catalog = await loadM2P4SemanticDepthRuntimeStageCatalog();",
  ]);
});

await check("all five V12 Pipeline identity comparisons classify V13", () => {
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.equal(
    [...pipeline.matchAll(/prompt-bundle-runtime-v12\.0\.0/gu)].length,
    5,
  );
  assert.equal(
    [...pipeline.matchAll(/prompt-bundle-runtime-v13\.0\.0/gu)].length,
    5,
  );
  assert.match(pipeline, /const v1A2CapablePair/u);
  assert.match(pipeline, /authorityIntegrityPair \|\| v1A2CapablePair/u);
  assert.match(pipeline, /groundCandidateAnalysisV2\(response\.output\)/u);
  assert.match(pipeline, /M2_SECOND_CLARIFICATION_PROHIBITED/u);
  assert.match(pipeline, /return this\.executeV1A2Initial\(request, runContext\)/u);
  const diff = git(["diff", "--unified=0", baseline, "--", "lib/assessment/runtime/pipeline.ts"]);
  assert.equal([...diff.matchAll(/^@@/gmu)].length, 7);
  assert.doesNotMatch(diff, /PB-04|PB-05|PB-06|actions_to_take|recommended_message_draft/u);
});

await check("V13 retains the timezone authority requirement", async () => {
  const fixture = diagnosticCase("E-R3-02");
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs: structuredClone(fixture.outputs) });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: v13Catalog.promptBundleVersion,
    schemaSetVersion: v13Catalog.schemaSetVersion,
    definitions: v13Catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
  });
  await assert.rejects(
    application.submit(fixture.input, "31313131-3131-4131-8131-313131313131"),
    (error) =>
      error instanceof M2RuntimeError &&
      error.safeCode === "M2_RUNTIME_AUTHORITY_INVALID",
  );
  assert.equal(transport.calls.length, 0);
  assert.equal(transport.actualProviderCalls, 0);
});

await check("V13 initial no-clarification routing equals V12", async () => {
  const previous = await runInitialReady(v12Catalog);
  const current = await runInitialReady(v13Catalog);
  assert.deepEqual(current, previous);
  assert.equal(current.eligibility, "ready");
  assert.deepEqual(current.calls, ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]);
  assert.equal(current.clarificationCount, 0);
  assert.equal(current.actualProviderCalls, 0);
});

await check("V13 one-answer clarification lifecycle equals V12", async () => {
  const previous = await runClarificationLifecycle(v12Catalog);
  const current = await runClarificationLifecycle(v13Catalog);
  assert.deepEqual(current, previous);
  assert.equal(current.initialEligibility, "needs_more_information");
  assert.equal(current.resumedEligibility, "ready");
  assert.deepEqual(current.calls, [
    "PB-01", "PB-01C", "PB-02", "PB-03", "PB-01", "PB-04", "PB-05", "PB-06",
  ]);
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
  assert.equal(current.actualProviderCalls, 0);
});

await check("Candidate Grounding V2 and Effective Authority remain unchanged", () => {
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  assert.match(
    pipeline,
    /prompt-bundle-runtime-v13\.0\.0";\s+const grounded = authorityIntegrityRuntime\s+\? groundCandidateAnalysisV2/su,
  );
  for (const candidate of [
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
    "lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
  ]) {
    assert.equal(worktreeBlob(candidate), blob(baseline, candidate), candidate);
  }
});

await check("migration 0007 only widens Runtime identity to V13 v6", () => {
  const migration = readText(
    "supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
  );
  assert.equal([...migration.matchAll(/begin;/gu)].length, 1);
  assert.equal([...migration.matchAll(/commit;/gu)].length, 1);
  assert.equal(
    [...migration.matchAll(/drop constraint assessment_runs_topology_runtime_identity/gu)].length,
    1,
  );
  assert.equal(
    [...migration.matchAll(/add constraint assessment_runs_topology_runtime_identity/gu)].length,
    1,
  );
  for (const pair of [
    "prompt-bundle-runtime-v9.0.0",
    "prompt-bundle-runtime-v10.0.0",
    "prompt-bundle-runtime-v11.0.0",
    "prompt-bundle-runtime-v12.0.0",
    "prompt-bundle-runtime-v13.0.0",
    "pipeline-schema-runtime-v4.0.0",
    "pipeline-schema-runtime-v5.0.0",
    "pipeline-schema-runtime-v6.0.0",
    "split-base-candidate-v1",
    "legacy-six-v1",
  ]) {
    assert.ok(migration.includes(pair), pair);
  }
  assert.match(
    migration,
    /prompt_bundle_version in \(\s*'prompt-bundle-runtime-v12\.0\.0',\s*'prompt-bundle-runtime-v13\.0\.0'\s*\) and schema_set_version = 'pipeline-schema-runtime-v6\.0\.0'/su,
  );
  assert.doesNotMatch(
    migration,
    /create table|create function|create trigger|insert into|update public|delete from|rpc|payment|stripe|payjp/iu,
  );
});

await check("migration 0006 is immutable and no migration is applied", () => {
  const migration = "supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql";
  assert.equal(worktreeBlob(migration), blob(baseline, migration));
  assert.equal(capabilities.operations.migration_applies, 0);
  assert.equal(capabilities.operations.db_operations, 0);
  assert.equal(capabilities.operations.supabase_operations, 0);
  assert.equal(capabilities.implemented.migration_applied, false);
  assert.equal(offlineResults.established.migration_0007_applied, false);
});

await check("protected Product UI schemas Prompts and evaluator blobs are unchanged", () => {
  const protectedPaths = [
    "lib/assessment/runtime/contracts/report-content-v2.schema.json",
    "lib/assessment/runtime/contracts/decision-plan-v2.schema.json",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v12.json",
    "lib/assessment/runtime/contracts/pb-01-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-04-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-05-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-06-clarification-aware-v1.developer.md",
    "lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "components/runtime/CustomerDraftCopyButton.tsx",
    "components/runtime/RuntimeAssessmentForm.tsx",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/semantic-disposition-v4.ts",
    "supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql",
  ];
  for (const candidate of protectedPaths) {
    assert.equal(worktreeBlob(candidate), blob(baseline, candidate), candidate);
  }
  const schemaCatalogBaseline = canonical(
    gitRaw(["show", baseline + ":lib/assessment/runtime/schema-catalog.ts"]),
  ).trimEnd();
  assert.ok(canonical(readText("lib/assessment/runtime/schema-catalog.ts")).startsWith(schemaCatalogBaseline));
});

await check("Payment main and next-env remain unchanged", () => {
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
});

await check("offline claims operations sensitive scan and diff check are bounded", () => {
  assert.deepEqual(Object.keys(offlineResults.established).sort(), [
    "application_owned_grounding_preservation",
    "candidate_grounding_v2_authority_integrity_path",
    "exact_draft_ownership_preservation",
    "field_ownership",
    "migration_0007_applied",
    "migration_0007_static_identity_widening_only",
    "pb_04_and_pb_06_unchanged",
    "prompt_contract_completeness",
    "protected_product_ui_blobs_unchanged",
    "report_schema_blob_unchanged",
    "schema_compatibility",
    "v12_catalog_and_prompts_unchanged",
    "v13_catalog_integrity",
    "v1_a_clarification_lifecycle_parity",
    "v1_a_routing_parity",
  ].sort());
  for (const key of [
    "actual_provider_prose_quality",
    "actual_semantic_non_repetition",
    "human_feeling_of_being_understood",
    "plausibly_worth_jpy980",
    "provider_semantic_fidelity",
  ]) {
    assert.equal(offlineResults.unestablished[key], true, key);
  }
  assert.equal(offlineResults.current_product_authority.r2_c, "remediation_required");
  assert.equal(offlineResults.current_product_authority.jpy980RuntimeReadiness, "not_established");
  assert.equal(offlineResults.current_product_authority.globalQ0Completion, false);
  for (const value of Object.values(capabilities.operations)) assert.equal(value, 0);
  const patterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
  ];
  let sensitive = 0;
  for (const candidate of exactScope) {
    const text = readText(candidate);
    assert.equal(text.includes("\uFFFD"), false, candidate);
    for (const pattern of patterns) sensitive += [...text.matchAll(pattern)].length;
  }
  assert.equal(sensitive, 0);
  git(["diff", "--check", baseline, "--"]);
});

await check("immutable accepted V1-A2 R2 chain remains PASS", () => {
  immutableR2Output = runImmutableVerifier(
    baseline,
    acceptedV1A2Branch,
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-clarification-integration.mjs",
    "moon-reply-v1-b-v1-a2-r2-",
  );
  for (const pattern of [
    /downstream consumption truth correction verifier: PASS 29\/29/u,
    /Immutable R1 Runtime Integrity verifier: PASS 29\/29/u,
    /Immutable original V1-A2 implementation \/ accepted R1 planning: PASS 22\/22, 27\/27/u,
    /Original A2 plan \/ V1-A1 R1 \/ original V1-A1: PASS 26\/26, 25\/25, 24\/24/u,
    /Decision Policy verifier: PASS 40\/40; all upstream accepted verifiers: PASS/u,
    /Offline fixtures: PASS 43\/43; live Provider calls: 0/u,
  ]) {
    assert.match(immutableR2Output, pattern);
  }
});

await check("executed immutable upstream chain retains exact accepted counts", () => {
  assert.match(
    immutableR2Output,
    /Original A2 plan \/ V1-A1 R1 \/ original V1-A1: PASS 26\/26, 25\/25, 24\/24/u,
  );
  assert.match(
    immutableR2Output,
    /Decision Policy verifier: PASS 40\/40; all upstream accepted verifiers: PASS/u,
  );
  immutableOriginalV1A1Source = canonical(
    gitRaw([
      "show",
      originalV1A1 +
        ":scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-input-sufficiency-policy.mjs",
    ]),
  );
  for (const pattern of [
    /correctionVerifierSummary = "PASS 19\/19"/u,
    /originalPlanningSummary = "PASS 18\/18"/u,
    /r2CPreparationSummary = "PASS 17\/17"/u,
    /r2BSummary = "PASS 21\/21"/u,
    /upstreamSummary = "PASS"/u,
    /JPY980 value architecture R1 correction verifier: PASS 19\\\/19/u,
    /R2-C preparation verifier: PASS 17/u,
    /R2-B verifier: PASS 21/u,
  ]) {
    assert.match(immutableOriginalV1A1Source, pattern);
  }
});

assert.equal(checks, 38);
if (failures.length > 0) {
  console.error(`\n${taskId} verifier: FAIL`);
  console.error("Failed checks: " + failures.join("; "));
  process.exit(1);
}

const head = git(["rev-parse", "HEAD"]);
const commitMode = head === baseline ? "precommit" : "one_direct_commit";
console.log(`\n${taskId} semantic depth successor verifier: PASS 38/38`);
console.log("Exact scope: 18/18; UPDATE 10; NEW 8; DELETE 0; RENAME 0");
console.log("Git mode: " + commitMode + "; exact parent: " + baseline);
console.log("V13: PB-05 only; existing Report schema; seven stages; split topology");
console.log("Immutable V1-A2 R2/R1/original/planning/V1-A1: PASS 29/29, 29/29, 22/22, 27/27, 26/26, 25/25, 24/24");
console.log("JPY980 R1/original, R2-C, R2-B: PASS 19/19, 18/18, 17/17, 21/21");
console.log("Decision Policy: PASS 40/40; all upstream accepted verifiers: PASS");
console.log("Live Provider calls: 0; DB/Supabase/migration apply/Payment/deploy: 0/0/0/0/0");
console.log("Provider semantic fidelity: unestablished; R2-C: remediation_required");
