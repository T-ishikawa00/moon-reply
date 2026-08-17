import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  clarificationSourceIdentityV1,
  createOpaqueClarificationIdV1,
  validateClarificationAnswerV1,
} from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { FakeAiStageTransport } from "../lib/assessment/runtime/fakes.ts";
import {
  executeControlledProviderReview,
  loadControlledReviewInputAuthority,
  V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
  V1_D_CONTROLLED_REVIEW_CASE_IDS,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts";
import {
  ControlledReviewEvidenceJournal,
  buildControlledReviewHumanReviewSheet,
  deriveControlledReviewQualityEvidence,
  prepareControlledReviewOutputDirectory,
  sanitizeControlledReviewEvidence,
  validateControlledReviewOutputDirectory,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts";
import {
  BudgetedControlledReviewTransport,
  ControlledReviewInvocationBudget,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts";
import { runControlledProviderReviewCli } from "./run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs";

const root = process.cwd();
const baseline = "41d90b69c18aec86995d1930f28be05d6ccfca8f";
const step1 = "4c7577564421e2dbd264ffadb5ccab8d961c42eb";
const acceptedV1C = "a436210bb035746c129fe071e6225b3799b9e5d8";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-step2a-controlled-provider-executor";
const expectedSubject = "feat: add V1-D controlled provider executor";
const acceptedC1Branch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-c1-controlled-provider-packet";
const precommit = process.argv.includes("--precommit");
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const planningRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_OFFLINE_PRODUCT_REREVIEW.md",
  `${planningRoot}/capabilities-v1.json`,
  `${planningRoot}/implementation-work-packages-v1.json`,
  `${packageRoot}/controlled-provider-review-plan-v1.json`,
  `${packageRoot}/offline-product-review-contract-v1.json`,
  `${packageRoot}/offline-results-v1.json`,
];
const newPaths = [
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_STEP2A_CONTROLLED_PROVIDER_EXECUTOR.md",
  `${packageRoot}/controlled-provider-executor-contract-v1.json`,
  `${packageRoot}/controlled-provider-authorization-contract-v1.json`,
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts",
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts",
  "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-step2a-controlled-provider-executor.mjs",
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
  return git(["rev-parse", `${revision}:${relativePath}`]);
}

function worktreeBlob(relativePath) {
  return git(["hash-object", `--path=${relativePath}`, relativePath]);
}

function remoteHead(branch) {
  const output = git(["ls-remote", "--heads", "origin", `refs/heads/${branch}`]);
  const lines = output.split(/\r?\n/u).filter(Boolean);
  assert.ok(lines.length <= 1, branch);
  return lines.length === 0 ? null : lines[0].split(/\s+/u)[0];
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

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function runImmutableAcceptedC1Verifier() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "moon-reply-v1-d-step2a-predecessor-"),
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
    const safe = `safe.directory=${cloneRoot.replaceAll("\\", "/")}`;
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
      ["-c", safe, "checkout", "--quiet", "-B", acceptedC1Branch, baseline],
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
    const run = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-offline-product-rereview.mjs",
      ],
      {
        cwd: cloneRoot,
        encoding: "utf8",
        maxBuffer: 512 * 1024 * 1024,
        timeout: 30 * 60 * 1000,
        env: { ...process.env },
      },
    );
    if (run.status !== 0) {
      throw new Error(`${run.stdout}\n${run.stderr}`);
    }
    return run.stdout;
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const diagnostics = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-results-v1.json",
);

function diagnosticOutputs(caseId = "E-R3-02") {
  const selected = diagnostics.cases.find((entry) => entry.case_id === caseId);
  assert.ok(selected, caseId);
  const outputs = Object.fromEntries(
    selected.provider_calls.map((call) => [
      call.stage_id,
      structuredClone(call.raw_output),
    ]),
  );
  outputs["PB-06"] = { ...outputs["PB-06"], semantic_checks: [] };
  return outputs;
}

function semanticFinding() {
  return {
    finding_code: "REPETITION",
    severity: "major",
    json_path: "report_content.action_rationales[0]",
    evidence_refs: [],
    detail: "offline fake repairable finding",
  };
}

function stageRequest() {
  return {
    stageId: "PB-05",
    model: "gpt-5.6-luna",
    developerPrompt: "offline verifier",
    promptVersion: "v-test",
    promptHash: "a".repeat(64),
    schemaName: "offline_test",
    schemaVersion: "offline-test-v1",
    schemaHash: "b".repeat(64),
    outputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
      required: [],
    },
    input: { synthetic: true },
  };
}

function clarificationFakeOutputs() {
  const outputs = diagnosticOutputs();
  const first = structuredClone(outputs["PB-01"]);
  first.decision_facts.contact_state.elapsed_since_latest_user_message_minutes = null;
  const fixtureId = "one_clarification_answer_becomes_ready";
  const entropy = createHash("sha256")
    .update(
      `${fixtureId}:${V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256}:clarification:v1`,
      "utf8",
    )
    .digest();
  const clarificationId = createOpaqueClarificationIdV1(entropy);
  const answer = { kind: "elapsed_bucket", value: "six_to_24_hours" };
  const validated = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: "2026-08-17T12:40:00.000Z",
  });
  const grounding = {
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
  return { outputs, first, grounding };
}

const executorContract = readJson(
  `${packageRoot}/controlled-provider-executor-contract-v1.json`,
);
const authorizationContract = readJson(
  `${packageRoot}/controlled-provider-authorization-contract-v1.json`,
);
const plan = readJson(`${packageRoot}/controlled-provider-review-plan-v1.json`);
const offlineContract = readJson(
  `${packageRoot}/offline-product-review-contract-v1.json`,
);
const offlineResults = readJson(`${packageRoot}/offline-results-v1.json`);
const planningCapabilities = readJson(`${planningRoot}/capabilities-v1.json`);
const workPackages = readJson(
  `${planningRoot}/implementation-work-packages-v1.json`,
);
const transportSource = readText(
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts",
);
const evidenceSource = readText(
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
);
const executorSource = readText(
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts",
);
const runnerSource = readText(
  "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
);
const runnerTemp = mkdtempSync(path.join(tmpdir(), "moon-reply-v1-d-runner-"));
const actualHead = git(["rev-parse", "HEAD"]);

function runnerEnvironment(overrides = {}) {
  return {
    M2_V1D_PROVIDER_EXECUTION_AUTHORIZED:
      "I_HAVE_EXPLICIT_HUMAN_AUTHORIZATION",
    M2_V1D_AUTHORIZED_SNAPSHOT: actualHead,
    M2_V1D_AUTHORIZED_INPUT_SHA256:
      V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
    M2_V1D_HUMAN_AUTHORIZATION_REFERENCE: "human-review-reference-test",
    OPENAI_API_KEY: "offline-verifier-placeholder",
    M2_V1D_ALLOWED_LOCAL_REVIEW_ROOT: runnerTemp,
    ...overrides,
  };
}

async function runGated(options = {}) {
  const outputName = options.outputName ?? `case-${Math.random().toString(16).slice(2)}`;
  const result = await runControlledProviderReviewCli({
    repositoryRoot: root,
    argv:
      options.argv ??
      [
        "--execute-provider-review",
        "--case=ordinary_reply_waiting",
        `--output-dir=${path.join(runnerTemp, outputName)}`,
      ],
    env: options.env ?? runnerEnvironment(),
    now: () => "2026-08-18T00:00:00.000Z",
  });
  return { result, outputName };
}

let passed = 0;
async function check(name, callback) {
  try {
    await callback();
    passed += 1;
    console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await check("exact Git authority, lineage, branch, parent and main", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["show", "-s", "--format=%s", baseline]), "fix: freeze V1-D controlled review inputs");
  assert.equal(git(["show", "-s", "--format=%s", step1]), "test: add V1-D offline product review harness");
  assert.equal(git(["show", "-s", "--format=%s", acceptedV1C]), "fix: validate quality repair paths precisely");
  assert.equal(git(["rev-parse", "refs/heads/main"]), expectedMain);
  assert.equal(git(["rev-parse", "refs/remotes/origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  if (precommit) {
    assert.equal(git(["rev-parse", "HEAD"]), baseline);
    assert.equal(git(["rev-list", "--count", `${baseline}..HEAD`]), "0");
  } else {
    assert.equal(git(["rev-list", "--count", `${baseline}..HEAD`]), "1");
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
    assert.ok([null, git(["rev-parse", "HEAD"])].includes(remoteHead(expectedBranch)));
  }
});

await check("exact scope is 17 paths with 9 UPDATE and 8 NEW", () => {
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

await check("all protected Product Runtime schema migration and review blobs are unchanged", () => {
  const tracked = git(["ls-tree", "-r", "--name-only", baseline])
    .split(/\r?\n/u)
    .filter(Boolean);
  const catalogPath = "lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json";
  const manifest = JSON.parse(git(["show", `${baseline}:${catalogPath}`]));
  const protectedPaths = new Set([
    `${packageRoot}/controlled-provider-inputs-v1.json`,
    `${packageRoot}/human-product-review-sheet-v1.json`,
    `${packageRoot}/fixture-matrix-v1.json`,
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-offline-product-rereview.mjs",
    catalogPath,
    ...manifest.stages.map((stage) => stage.prompt_path),
    "lib/assessment/runtime/openai-transport.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/fakes.ts",
    "lib/assessment/runtime/types.ts",
    "lib/assessment/runtime/quality-reassessment-v1.ts",
    "lib/assessment/runtime/semantic-disposition-v5.ts",
    "lib/assessment/runtime/product-semantic-shape-v1.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts",
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
    "lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts",
    "lib/assessment/runtime/review/m2-p4-v15-product-rereview-fixtures.ts",
    "app/review/runtime/v15/page.tsx",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
    "next-env.d.ts",
    ...tracked.filter((entry) => entry.endsWith(".schema.json")),
    ...tracked.filter((entry) => /^supabase\/migrations\//u.test(entry)),
    ...tracked.filter((entry) => /(?:payment|stripe|purchase)/iu.test(entry)),
  ]);
  for (const relativePath of protectedPaths) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
});

await check("main and next-env remain exact", () => {
  assert.equal(git(["rev-parse", "refs/heads/main"]), expectedMain);
  assert.equal(worktreeBlob("next-env.d.ts"), blob(baseline, "next-env.d.ts"));
});

await check("Step 1 acceptance is synchronized without erasing review history", () => {
  const docs = [
    "docs/CODEX_HANDOFF.md",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_OFFLINE_PRODUCT_REREVIEW.md",
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_STEP2A_CONTROLLED_PROVIDER_EXECUTOR.md",
  ].map(readText).join("\n");
  assert.match(docs, new RegExp(baseline, "u"));
  assert.match(docs, /accepted_complete/u);
  assert.match(docs, /2026-08-18/u);
  assert.match(docs, /NEEDS_CORRECTION 0\/2\/0/u);
  assert.match(docs, /PASS 0\/0\/0/u);
});

await check("Step 2A authority and status ceilings are truthful", () => {
  assert.equal(offlineContract.status, "in_progress_controlled_provider_executor");
  assert.equal(offlineContract.authority.v1_d_step_1_overall, "accepted_complete");
  assert.equal(offlineContract.authority.v1_d_step_2a, "authorized");
  assert.equal(offlineContract.authority.provider_execution_authorized, false);
  assert.equal(offlineResults.operations.provider_calls, 0);
  assert.equal(offlineResults.current_product_authority.r2_c, "remediation_required");
  assert.equal(offlineResults.current_product_authority.jpy980RuntimeReadiness, "not_established");
  assert.equal(offlineResults.current_product_authority.globalQ0Completion, false);
});

await check("historical two findings remain explicit", () => {
  assert.deepEqual(offlineContract.authority.v1_d_step_1_findings, [
    "controlled_provider_execution_inputs_not_frozen",
    "provider_attempt_ceiling_does_not_account_for_sdk_retries",
  ]);
  assert.equal(plan.step_1_acceptance.initial_review_history, "NEEDS_CORRECTION 0/2/0");
});

await check("controlled input authority is exact nine-case immutable bytes", async () => {
  const authority = await loadControlledReviewInputAuthority({ repositoryRoot: root });
  assert.equal(authority.sha256, V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256);
  assert.equal(authority.model, "gpt-5.6-luna");
  assert.deepEqual(authority.cases.map((entry) => entry.fixture_id), V1_D_CONTROLLED_REVIEW_CASE_IDS);
  assert.ok(authority.cases.every((entry) => entry.synthetic_only && !entry.human_pii));
  assert.equal(authority.cases.filter((entry) => entry.clarification !== null).length, 1);
});

await check("executor machine contract records implemented zero-execution boundaries", () => {
  assert.equal(executorContract.executor_status, "implemented_pending_human_chatgpt_review");
  assert.equal(executorContract.provider_execution_authorized, false);
  assert.equal(executorContract.provider_execution_count, 0);
  assert.equal(executorContract.architecture.uses_v15_assessment_application, true);
  assert.equal(executorContract.architecture.uses_production_service, false);
  assert.equal(executorContract.architecture.uses_supabase, false);
});

await check("authorization contract cannot itself authorize execution", () => {
  assert.equal(authorizationContract.committed_artifact_authorizes_execution, false);
  assert.equal(authorizationContract.provider_execution_authorized, false);
  assert.deepEqual(authorizationContract.current_authority.authorized_case_ids, []);
  assert.equal(authorizationContract.current_authority.authorization_timestamp, null);
  assert.equal(authorizationContract.runtime_gate.any_missing_gate_behavior, "nonzero_exit_before_provider_client_construction");
});

await check("controlled plan binds hash model architecture and no operations", () => {
  assert.equal(plan.frozen_input_sha256, V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256);
  assert.equal(plan.runtime_identity.model, "gpt-5.6-luna");
  assert.equal(plan.future_execution_architecture.application, "V15 AssessmentApplication");
  assert.equal(plan.future_execution_architecture.supabase_repository_used, false);
  assert.equal(plan.provider_execution_authorized, false);
  assert.deepEqual(Object.values(plan.operations), [0, 0, 0, 0, 0, 0]);
});

await check("review transport implements AiStageTransport with exact maxRetries zero", () => {
  assert.match(transportSource, /class ReviewOnlyOpenAiResponsesTransport implements AiStageTransport/u);
  assert.match(transportSource, /new OpenAI\(\{\s*apiKey: options\.apiKey,\s*maxRetries: 0,/u);
  assert.equal(executorContract.review_transport.explicit_max_retries, 0);
});

await check("review transport mirrors accepted Responses API request semantics", () => {
  for (const pattern of [
    /client\.responses\.create/u,
    /model: stageRequest\.model/u,
    /store: false/u,
    /tools: \[\]/u,
    /stream: false/u,
    /background: false/u,
    /service_tier: "default"/u,
    /truncation: "disabled"/u,
    /effort: "low"/u,
    /text: stageRequest\.developerPrompt/u,
    /text: JSON\.stringify\(stageRequest\.input\)/u,
    /type: "json_schema"/u,
    /strict: true/u,
  ]) assert.match(transportSource, pattern);
  assert.doesNotMatch(transportSource, /temperature|web_search|computer_use/u);
});

await check("production transport is unchanged and review difference is isolated", () => {
  const production = readText("lib/assessment/runtime/openai-transport.ts");
  assert.match(production, /new OpenAI\(\{ apiKey \}\)/u);
  assert.doesNotMatch(production, /maxRetries/u);
  assert.equal(worktreeBlob("lib/assessment/runtime/openai-transport.ts"), blob(baseline, "lib/assessment/runtime/openai-transport.ts"));
});

await check("HTTP observer exports bounded safe metadata only", () => {
  assert.match(transportSource, /globalHttpAttemptOrdinal/u);
  assert.match(transportSource, /caseHttpAttemptOrdinal/u);
  assert.match(transportSource, /safeErrorCode/u);
  assert.match(transportSource, /M2_STAGE_PROVIDER_FAILED/u);
  assert.doesNotMatch(evidenceSource, /providerResponseIdHash/u);
});

await check("per-case stage budget allows 12 and rejects 13 before invoke", async () => {
  const budget = new ControlledReviewInvocationBudget();
  let invoked = 0;
  const underlying = { async invoke() { invoked += 1; return { responseId: "fake", returnedModel: "gpt-5.6-luna", output: {}, usage: { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: 0 }; } };
  const wrapped = new BudgetedControlledReviewTransport("fixture-a", budget, underlying);
  for (let index = 0; index < 12; index += 1) await wrapped.invoke(stageRequest());
  assert.equal(invoked, 12);
  assert.throws(() => wrapped.invoke(stageRequest()), (error) => safeCode(error) === "M2_V1D_REVIEW_STAGE_BUDGET_EXCEEDED");
  assert.equal(invoked, 12);
});

await check("global stage budget allows 108 and rejects 109 before invoke", async () => {
  const budget = new ControlledReviewInvocationBudget();
  let invoked = 0;
  const underlying = { async invoke() { invoked += 1; return { responseId: "fake", returnedModel: "gpt-5.6-luna", output: {}, usage: { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: 0 }; } };
  for (let fixture = 0; fixture < 9; fixture += 1) {
    const wrapped = new BudgetedControlledReviewTransport(`fixture-${fixture}`, budget, underlying);
    for (let index = 0; index < 12; index += 1) await wrapped.invoke(stageRequest());
  }
  assert.equal(invoked, 108);
  const overflow = new BudgetedControlledReviewTransport("fixture-overflow", budget, underlying);
  assert.throws(() => overflow.invoke(stageRequest()), (error) => safeCode(error) === "M2_V1D_REVIEW_STAGE_BUDGET_EXCEEDED");
  assert.equal(invoked, 108);
});

await check("Application and Provider HTTP counters remain structurally separate", () => {
  assert.match(transportSource, /globalApplicationStageInvocationOrdinal/u);
  assert.match(transportSource, /globalHttpAttemptOrdinal/u);
  assert.doesNotMatch(transportSource, /applicationStageInvocationCount\s*=\s*providerHttp/u);
  assert.equal(executorContract.budgets.application_invocations_and_provider_http_attempts_separate, true);
});

await check("executor loads exact V15 catalog and constructs AssessmentApplication", () => {
  assert.match(executorSource, /loadM2P4QualityReassessmentRuntimeStageCatalog/u);
  assert.match(executorSource, /runtime-stage-catalog-v15\.0\.0/u);
  assert.match(executorSource, /new AssessmentApplication/u);
  assert.match(executorSource, /prompt-bundle-runtime-v15\.0\.0/u);
});

await check("executor uses case-local Fake repository and excludes service Supabase", () => {
  assert.match(executorSource, /new FakeAssessmentRepository\(\)/u);
  assert.doesNotMatch(executorSource, /service\.ts|SupabaseAssessmentRepository|createClient/u);
  assert.doesNotMatch(runnerSource, /service\.ts|SupabaseAssessmentRepository|createClient/u);
});

await check("executor binds frozen input clock timezone model and deterministic clarification", () => {
  assert.match(executorSource, /structuredClone\(fixture\.assessment_input\)/u);
  assert.match(executorSource, /now: \(\) => fixture\.fixed_clock/u);
  assert.match(executorSource, /timeZone: fixture\.timezone/u);
  assert.match(executorSource, /model: V1_D_CONTROLLED_REVIEW_MODEL/u);
  assert.match(executorSource, /deterministicClarificationId/u);
});

let directScenario;
await check("fake-only executor runs real V15 direct Ready path and projection", async () => {
  const outputs = diagnosticOutputs();
  let fakeTransport;
  directScenario = await executeControlledProviderReview({
    repositoryRoot: root,
    selectedCaseIds: ["ordinary_reply_waiting"],
    transportFactory: () => {
      fakeTransport = new FakeAiStageTransport({ outputs });
      return fakeTransport;
    },
  });
  assert.equal(directScenario.complete, true);
  assert.equal(directScenario.applicationStageInvocationCount, 6);
  assert.equal(directScenario.providerHttpAttemptCount, 0);
  assert.equal(directScenario.cases[0].route.finalDisposition, "ready");
  assert.ok(directScenario.cases[0].customerProjection);
  assert.equal(fakeTransport.actualProviderCalls, 0);
});

let clarificationScenario;
await check("fake-only executor validates target and submits exactly one frozen answer", async () => {
  const { outputs, first, grounding } = clarificationFakeOutputs();
  clarificationScenario = await executeControlledProviderReview({
    repositoryRoot: root,
    selectedCaseIds: ["one_clarification_answer_becomes_ready"],
    transportFactory: () => new FakeAiStageTransport({ outputs, outputSequence: { "PB-01": [first, grounding] } }),
  });
  const route = clarificationScenario.cases[0].route;
  assert.equal(route.initialEligibility, "needs_more_information");
  assert.equal(route.actualClarificationTarget, "latest_contact_timing");
  assert.equal(route.clarificationAnswerCount, 1);
  assert.equal(route.resumedEligibility, "ready");
  assert.equal(clarificationScenario.complete, true);
  assert.ok(clarificationScenario.cases[0].customerProjection);
  const stageEvidence = JSON.stringify(clarificationScenario.cases[0].stageAttempts);
  assert.match(stageEvidence, /clarification_source_sha256:[a-f0-9]{64}/u);
  assert.doesNotMatch(stageEvidence, /clarification:[A-Za-z0-9_-]+:answer:1/u);
});

await check("route mismatch stops case without projection or invented clarification", async () => {
  const { outputs, first } = clarificationFakeOutputs();
  const scenario = await executeControlledProviderReview({
    repositoryRoot: root,
    selectedCaseIds: ["ordinary_reply_waiting"],
    transportFactory: () => new FakeAiStageTransport({ outputs, outputSequence: { "PB-01": [first] } }),
  });
  assert.equal(scenario.complete, false);
  assert.equal(scenario.cases[0].route.finalDisposition, "route_mismatch");
  assert.equal(scenario.cases[0].route.clarificationAnswerCount, 0);
  assert.equal(scenario.cases[0].customerProjection, null);
});

let recoveryScenario;
await check("fake-only V1-C recovery exports distinct attempt 1 and 2 with no attempt 3", async () => {
  const outputs = diagnosticOutputs();
  const pass = structuredClone(outputs["PB-06"]);
  const first = { ...structuredClone(pass), semantic_checks: [semanticFinding()] };
  recoveryScenario = await executeControlledProviderReview({
    repositoryRoot: root,
    selectedCaseIds: ["ordinary_reply_waiting"],
    transportFactory: () => new FakeAiStageTransport({ outputs, outputSequence: { "PB-06": [first, pass] } }),
  });
  const pb05 = recoveryScenario.cases[0].stageAttempts.filter((stage) => stage.stageId === "PB-05");
  const pb06 = recoveryScenario.cases[0].stageAttempts.filter((stage) => stage.stageId === "PB-06");
  assert.deepEqual(pb05.map((stage) => stage.attemptNumber), [1, 2]);
  assert.deepEqual(pb06.map((stage) => stage.attemptNumber), [1, 2]);
  assert.equal(recoveryScenario.cases[0].qualityReassessment.scope, "report_only");
  assert.equal(recoveryScenario.cases[0].qualityReassessment.attempt_3_present, false);
  assert.ok(recoveryScenario.cases[0].customerProjection);
});

await check("unknown transport errors become safe code with no raw error prose", async () => {
  const scenario = await executeControlledProviderReview({
    repositoryRoot: root,
    selectedCaseIds: ["ordinary_reply_waiting"],
    transportFactory: () => ({ invoke() { throw new Error("RAW SDK BODY SECRET"); } }),
  });
  assert.equal(scenario.complete, false);
  assert.equal(scenario.cases[0].route.safeErrorCode, "M2_STAGE_PROVIDER_FAILED");
  assert.doesNotMatch(JSON.stringify(scenario), /RAW SDK BODY SECRET/u);
});

await check("stage evidence omits every raw Provider response ID", () => {
  const serialized = JSON.stringify(recoveryScenario.cases[0].stageAttempts);
  assert.doesNotMatch(serialized, /responseId|response_id|fake-response|resp_/u);
  assert.match(serialized, /outputJson/u);
});

await check("sanitizer rejects raw Provider response and request identifiers", () => {
  assert.throws(() => sanitizeControlledReviewEvidence({ value: "resp_abc123" }), (error) => safeCode(error) === "M2_V1D_REVIEW_EVIDENCE_PROHIBITED");
  assert.throws(() => sanitizeControlledReviewEvidence({ providerRequestId: "opaque" }), (error) => safeCode(error) === "M2_V1D_REVIEW_EVIDENCE_PROHIBITED");
  assert.throws(() => sanitizeControlledReviewEvidence({ response_id: "opaque" }), (error) => safeCode(error) === "M2_V1D_REVIEW_EVIDENCE_PROHIBITED");
});

await check("sanitizer rejects SDK errors secrets URLs and chain of thought", () => {
  for (const value of [
    { rawSdkErrorMessage: "socket body" },
    { value: "OPENAI_API_KEY=do-not-write" },
    { value: "https://api.openai.com/v1/responses" },
    { value: "chain-of-thought" },
  ]) assert.throws(() => sanitizeControlledReviewEvidence(value), (error) => safeCode(error) === "M2_V1D_REVIEW_EVIDENCE_PROHIBITED");
});

await check("sanitizer retains safe synthetic Stage JSON", () => {
  const safe = { fixtureId: "synthetic", outputJson: { cover_line: "今夜の整理" }, safeErrorCode: null };
  assert.deepEqual(sanitizeControlledReviewEvidence(safe), safe);
});

await check("quality evidence derives bounded scope and rejects attempt 3", () => {
  const result = deriveControlledReviewQualityEvidence(
    "fixture",
    [
      { stageId: "PB-05", attemptNumber: 2 },
      { stageId: "PB-06", attemptNumber: 2 },
    ],
    "ready",
  );
  assert.equal(result.scope, "report_only");
  assert.equal(result.quality_reassessment_used, true);
  assert.throws(
    () => deriveControlledReviewQualityEvidence("fixture", [{ stageId: "PB-06", attemptNumber: 3 }], "technical_failure"),
    (error) => safeCode(error) === "M2_V1D_REVIEW_ATTEMPT_3_PROHIBITED",
  );
});

await check("customer projection exists only for Ready evidence", () => {
  assert.ok(directScenario.cases[0].customerProjection);
  assert.equal(directScenario.cases[0].route.finalDisposition, "ready");
  assert.doesNotMatch(JSON.stringify(directScenario.cases[0].customerProjection), /ordinary_reply_waiting/u);
});

await check("future Human sheet keeps every Product judgment pending", () => {
  const sheet = buildControlledReviewHumanReviewSheet(directScenario.cases);
  assert.equal(sheet.review_records.length, 1);
  const record = sheet.review_records[0];
  assert.equal(record.fixture_id, "ordinary_reply_waiting");
  assert.equal(record.output_provenance, "actual_v15_successor_output");
  assert.ok(Object.entries(record).filter(([key]) => !["fixture_id", "output_provenance", "reviewer_notes"].includes(key)).every(([, value]) => value === "pending_human_review"));
});

await check("output safety rejects repository root", async () => {
  await assert.rejects(
    validateControlledReviewOutputDirectory({ repositoryRoot: root, outputDirectory: root }),
    (error) => safeCode(error) === "M2_V1D_REVIEW_OUTPUT_PATH_INVALID",
  );
});

await check("output safety rejects arbitrary outside path", async () => {
  const outside = path.join(tmpdir(), "moon-reply-v1-d-unapproved", "case");
  await assert.rejects(
    validateControlledReviewOutputDirectory({ repositoryRoot: root, outputDirectory: outside }),
    (error) => safeCode(error) === "M2_V1D_REVIEW_OUTPUT_PATH_INVALID",
  );
});

await check("output safety rejects symlink traversal", async () => {
  const temp = mkdtempSync(path.join(tmpdir(), "moon-reply-v1-d-symlink-"));
  try {
    const target = path.join(temp, "real");
    const link = path.join(temp, "linked");
    writeFileSync(path.join(temp, "marker"), "safe");
    mkdirSync(target);
    symlinkSync(target, link, "junction");
    await assert.rejects(
      validateControlledReviewOutputDirectory({ repositoryRoot: root, outputDirectory: path.join(link, "case"), explicitlyAllowedReviewRoot: temp }),
      (error) => safeCode(error) === "M2_V1D_REVIEW_OUTPUT_PATH_INVALID",
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

await check("output safety rejects nonempty execution directory overwrite", async () => {
  const temp = mkdtempSync(path.join(tmpdir(), "moon-reply-v1-d-existing-"));
  try {
    const output = path.join(temp, "existing");
    mkdirSync(output);
    writeFileSync(path.join(output, "evidence.json"), "{}\n");
    await assert.rejects(
      validateControlledReviewOutputDirectory({ repositoryRoot: root, outputDirectory: output, explicitlyAllowedReviewRoot: temp }),
      (error) => safeCode(error) === "M2_V1D_REVIEW_OUTPUT_EXISTS",
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

await check("partial journal uses atomic append-only snapshots", async () => {
  const temp = mkdtempSync(path.join(tmpdir(), "moon-reply-v1-d-journal-"));
  try {
    const output = path.join(temp, "execution-journal");
    await prepareControlledReviewOutputDirectory({ repositoryRoot: root, outputDirectory: output, explicitlyAllowedReviewRoot: temp });
    const journal = new ControlledReviewEvidenceJournal(output, "execution-journal");
    await journal.recordProviderHttpAttempt({
      fixtureId: "ordinary_reply_waiting",
      globalHttpAttemptOrdinal: 1,
      caseHttpAttemptOrdinal: 1,
      stageId: "PB-01",
      requestedModel: "gpt-5.6-luna",
      startedAt: "2026-08-18T00:00:00.000Z",
      completedAt: "2026-08-18T00:00:01.000Z",
      latencyMs: 1000,
      disposition: "failed",
      returnedModel: null,
      usage: { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 },
      safeErrorCode: "M2_STAGE_PROVIDER_FAILED",
    });
    await journal.markIncomplete("M2_STAGE_PROVIDER_FAILED");
    const files = readdirSync(output);
    assert.deepEqual(files, ["execution-journal-v1-0001.json", "execution-journal-v1-0002.json"]);
    assert.equal(files.some((file) => file.endsWith(".tmp")), false);
    assert.ok(
      runnerSource.indexOf("journal.recordAuthorization(record)") <
        runnerSource.indexOf("executeControlledProviderReview({"),
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

await check("runner refuses default mode before client construction", async () => {
  const gate = await runGated({ argv: [] });
  assert.equal(gate.result.exitCode, 1);
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("runner rejects missing authorization env before client construction", async () => {
  const env = runnerEnvironment();
  delete env.M2_V1D_PROVIDER_EXECUTION_AUTHORIZED;
  const gate = await runGated({ env });
  assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_AUTHORIZATION_MISSING");
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("runner rejects wrong snapshot before client construction", async () => {
  const gate = await runGated({ env: runnerEnvironment({ M2_V1D_AUTHORIZED_SNAPSHOT: "0".repeat(40) }) });
  assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_SNAPSHOT_AUTHORITY_INVALID");
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("runner rejects wrong input hash before client construction", async () => {
  const gate = await runGated({ env: runnerEnvironment({ M2_V1D_AUTHORIZED_INPUT_SHA256: "0".repeat(64) }) });
  assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_INPUT_AUTHORITY_INVALID");
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("runner rejects missing Human authorization reference before client", async () => {
  const env = runnerEnvironment();
  delete env.M2_V1D_HUMAN_AUTHORIZATION_REFERENCE;
  const gate = await runGated({ env });
  assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_HUMAN_AUTHORIZATION_REFERENCE_MISSING");
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("runner rejects missing API key before client construction", async () => {
  const env = runnerEnvironment();
  delete env.OPENAI_API_KEY;
  const gate = await runGated({ env });
  assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_OPENAI_API_KEY_MISSING");
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("runner rejects absent case selection before client construction", async () => {
  const gate = await runGated({ argv: ["--execute-provider-review", `--output-dir=${path.join(runnerTemp, "no-case")}`] });
  assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_CASE_SELECTION_INVALID");
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("runner rejects dirty worktree before client construction", async () => {
  if (precommit) {
    const gate = await runGated();
    assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_WORKTREE_NOT_CLEAN");
    assert.equal(gate.result.providerClientConstructed, false);
  } else {
    assert.match(runnerSource, /if \(worktreeStatus !== ""\) \{\s*fail\("M2_V1D_REVIEW_WORKTREE_NOT_CLEAN"\)/u);
    assert.ok(
      runnerSource.indexOf('fail("M2_V1D_REVIEW_WORKTREE_NOT_CLEAN")') <
        runnerSource.lastIndexOf("prepareControlledReviewOutputDirectory"),
    );
  }
});

await check("runner rejects output path violation before client construction", async () => {
  const gate = await runGated({ argv: ["--execute-provider-review", "--case=ordinary_reply_waiting", `--output-dir=${root}`] });
  assert.equal(gate.result.safeErrorCode, "M2_V1D_REVIEW_OUTPUT_PATH_INVALID");
  assert.equal(gate.result.providerClientConstructed, false);
});

await check("validate-only performs no client network or evidence creation", async () => {
  const output = path.join(runnerTemp, "validate-only");
  const gate = await runGated({
    argv: ["--validate-only", "--case=ordinary_reply_waiting", `--output-dir=${output}`],
    env: { M2_V1D_ALLOWED_LOCAL_REVIEW_ROOT: runnerTemp },
  });
  assert.equal(gate.result.exitCode, 0);
  assert.equal(gate.result.providerClientConstructed, false);
  assert.equal(gate.result.providerExecutionCount, 0);
  assert.equal(existsSync(output), false);
});

await check("runner has one real Provider path and tests use fake executor transport", () => {
  assert.match(runnerSource, /new ReviewOnlyOpenAiResponsesTransport/u);
  assert.doesNotMatch(runnerSource, /options\.createReviewTransport|options\.executeReview/u);
  assert.equal(directScenario.providerHttpAttemptCount, 0);
  assert.equal(clarificationScenario.providerHttpAttemptCount, 0);
  assert.equal(recoveryScenario.providerHttpAttemptCount, 0);
});

await check("no actual execution evidence or operation claim exists in repository", () => {
  assert.equal(existsSync(path.join(root, packageRoot, "controlled-provider-executions")), false);
  assert.equal(executorContract.operations.provider_calls, 0);
  assert.equal(executorContract.operations.db_operations, 0);
  assert.equal(executorContract.operations.supabase_operations, 0);
  assert.equal(executorContract.operations.payment_operations, 0);
  assert.equal(executorContract.operations.deploy_operations, 0);
  assert.equal(JSON.stringify(offlineResults).includes('"actual_v15_successor_outputs":0'), true);
});

await check("changed files contain no sensitive values and all JSON parses", () => {
  const changedText = exactScope.map(readText).join("\n");
  assert.doesNotMatch(changedText, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u);
  assert.doesNotMatch(changedText, /\bsk-[A-Za-z0-9_-]{20,}\b/u);
  for (const relativePath of exactScope.filter((entry) => entry.endsWith(".json"))) {
    assert.doesNotThrow(() => readJson(relativePath), relativePath);
  }
  assert.equal(planningCapabilities.provider_execution_authorized, false);
  assert.equal(workPackages.provider_execution_authorized, false);
});

if (!precommit) {
  await check("immutable accepted V1-D C1 verifier passes once with recursive chain", () => {
    const output = runImmutableAcceptedC1Verifier();
    assert.match(output, /controlled Provider packet verifier: PASS 50\/50/u);
    assert.match(output, /Immutable V1-D Step 1 verifier: PASS 45\/45/u);
  });
}

rmSync(runnerTemp, { recursive: true, force: true });

const expectedChecks = precommit ? 52 : 53;
assert.equal(passed, expectedChecks);

if (precommit) {
  console.log("\nM2-P4 V1-D Step 2A precommit verifier: PASS 52/52");
  console.log("Immutable accepted V1-D C1 50/50 is intentionally deferred to one formal post-commit run.");
} else {
  console.log("\nM2-P4 V1-D Step 2A controlled Provider executor verifier: PASS 53/53");
  console.log("Immutable accepted V1-D C1 verifier: PASS 50/50 (executed once with recursive chain)");
  console.log("Provider/DB/Supabase/migration apply/Payment/deploy: 0/0/0/0/0/0");
}
