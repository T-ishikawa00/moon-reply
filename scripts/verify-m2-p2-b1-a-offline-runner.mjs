import { spawnSync } from "node:child_process";
import { builtinModules } from "node:module";
import path from "node:path";
import {
  B1A,
  B1A_ASSET_PATHS,
  absolute,
  canonicalText,
  canonicalTextHash,
  compactHash,
  loadB1aAssets,
  readJson,
  repositoryRoot,
  validateJsonSchema,
} from "./lib/m2-p2-b1-a-contract.mjs";
import { createOfflineReplayTransport } from "./lib/m2-p2-b1-a-offline-replay-transport.mjs";
import {
  createRunner,
  runFailureMatrix,
} from "./lib/m2-p2-b1-a-runner-core.mjs";
import { buildOfflineEvidence } from "./prepare-m2-p2-b1-a-offline-runner.mjs";
import { parseOfflineArguments } from "./run-m2-p2-b1-a-offline.mjs";

const correctionCommit = "22bbf6f69ad2e21d3d43808e3518970eb1dc48e7";
const safeRepositoryRoot = repositoryRoot.replaceAll("\\", "/");
const sixScriptPaths = [
  "scripts/prepare-m2-p2-b1-a-offline-runner.mjs",
  "scripts/run-m2-p2-b1-a-offline.mjs",
  "scripts/verify-m2-p2-b1-a-offline-runner.mjs",
  "scripts/lib/m2-p2-b1-a-contract.mjs",
  "scripts/lib/m2-p2-b1-a-runner-core.mjs",
  "scripts/lib/m2-p2-b1-a-offline-replay-transport.mjs",
];

const gateOrder = [
  "M2_B1_A_EXACT_SCOPE_GATE",
  "M2_B1_A_CONTRACT_LINK_GATE",
  "M2_B1_A_CONTRACT_HASH_GATE",
  "M2_B1_A_CASE_GATE",
  "M2_B1_A_MODEL_CANDIDATE_GATE",
  "M2_B1_A_MODEL_NON_SELECTION_GATE",
  "M2_B1_A_OFFLINE_MODE_GATE",
  "M2_B1_A_ZERO_NETWORK_GATE",
  "M2_B1_A_ZERO_PROVIDER_GATE",
  "M2_B1_A_ZERO_SECRET_READ_GATE",
  "M2_B1_A_ZERO_ACTUAL_CALL_GATE",
  "M2_B1_A_ZERO_SPEND_GATE",
  "M2_B1_A_STAGE_SEQUENCE_GATE",
  "M2_B1_A_STATE_MACHINE_GATE",
  "M2_B1_A_NO_RETRY_GATE",
  "M2_B1_A_NO_REPAIR_GATE",
  "M2_B1_A_NO_FALLBACK_GATE",
  "M2_B1_A_SCHEMA_VALIDATION_GATE",
  "M2_B1_A_ORACLE_ISOLATION_GATE",
  "M2_B1_A_HOLDOUT_ISOLATION_GATE",
  "M2_B1_A_REAL_USER_DATA_GATE",
  "M2_B1_A_SYNTHETIC_LABEL_GATE",
  "M2_B1_A_BUDGET_LEDGER_GATE",
  "M2_B1_A_ARTIFACT_POLICY_GATE",
  "M2_B1_A_APPROVAL_LOCK_GATE",
  "M2_B1_A_CLI_REJECTION_GATE",
  "M2_B1_A_FAILURE_MATRIX_GATE",
  "M2_B1_A_DETERMINISM_GATE",
  "M2_B1_A_REPORT_HASH_GATE",
];
const failures = new Map(gateOrder.map((gate) => [gate, []]));
const overallFailures = [];

function fail(gate, detail) {
  failures.get(gate).push(detail);
}

function assert(gate, condition, detail) {
  if (!condition) fail(gate, detail);
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function runGit(args) {
  return spawnSync(
    "git",
    ["-c", `safe.directory=${safeRepositoryRoot}`, ...args],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
}

function normalized(entries) {
  return entries
    .map((entry) => ({ file: entry.file.replaceAll("\\", "/"), status: entry.status }))
    .sort((left, right) => left.file.localeCompare(right.file, "en"));
}

function taskMutations() {
  const diff = runGit(["diff", "--name-status", correctionCommit, "--"]);
  const status = runGit([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  if (diff.status !== 0 || status.status !== 0) {
    fail(
      "M2_B1_A_EXACT_SCOPE_GATE",
      `Git audit failed: ${diff.stderr}${status.stderr}`,
    );
    return [];
  }
  const entries = new Map();
  for (const line of diff.stdout.split(/\r?\n/u).filter(Boolean)) {
    const [rawStatus, ...parts] = line.split("\t");
    entries.set(parts.at(-1).replaceAll("\\", "/"), rawStatus[0]);
  }
  for (const line of status.stdout.split(/\r?\n/u).filter(Boolean)) {
    if (!line.startsWith("?? ")) continue;
    entries.set(line.slice(3).trim().replaceAll("\\", "/"), "A");
  }
  return normalized(
    [...entries].map(([file, statusCode]) => ({ file, status: statusCode })),
  );
}

function moduleSpecifiers(text) {
  const result = [];
  const patterns = [
    /(?:^|\n)\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"'\r\n]+)["']/gu,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) result.push(match[1]);
  }
  return [...new Set(result)];
}

function verifyExactScope(assets) {
  const expected = normalized(
    assets.reportManifest.implementation_manifest.map((entry) => ({
      file: entry.path,
      status: entry.status,
    })),
  );
  const actual = taskMutations();
  assert(
    "M2_B1_A_EXACT_SCOPE_GATE",
    deepEqual(actual, expected),
    `exact 30-file manifest differs: ${JSON.stringify(actual)}`,
  );
  assert(
    "M2_B1_A_EXACT_SCOPE_GATE",
    actual.length === 30 &&
      actual.filter((entry) => entry.status === "A").length === 26 &&
      actual.filter((entry) => entry.status === "M").length === 4 &&
      actual.filter((entry) => entry.status === "D").length === 0,
    "A/M/D counts differ from 26/4/0",
  );
  const protectedPaths = [
    "app",
    "components",
    "fixtures",
    "lib",
    "public",
    "supabase",
    "package.json",
    "package-lock.json",
    "ai/prompts",
    "ai/schemas",
    "evals/development",
    "evals/version-manifest.json",
    "evals/cost-estimator",
    "evals/calibration/one-case-contract-v1.json",
    "evals/calibration/stage-plan-v1.json",
    "evals/calibration/artifact-contract-v1.json",
    "evals/calibration/security-policy-v1.json",
    "evals/calibration/reports/contract-preview-v1.json",
    "evals/calibration/schemas",
  ];
  const protectedDiff = runGit([
    "diff",
    "--exit-code",
    correctionCommit,
    "--",
    ...protectedPaths,
  ]);
  assert(
    "M2_B1_A_EXACT_SCOPE_GATE",
    protectedDiff.status === 0,
    "accepted machine assets, application, package, or runtime paths changed",
  );
}

function verifyContracts(assets) {
  const contract = assets.runnerContract;
  const preview = readJson("evals/calibration/reports/contract-preview-v1.json");
  assert(
    "M2_B1_A_CONTRACT_LINK_GATE",
    contract.source_b0_contract_hash === B1A.b0ContractHash &&
      assets.replayCatalog.source_contract_hash === B1A.b0ContractHash &&
      assets.reportManifest.source_b0_contract_hash === B1A.b0ContractHash,
    "B0 links differ",
  );
  assert(
    "M2_B1_A_CONTRACT_HASH_GATE",
    preview.contract_hash.sha256 === B1A.b0ContractHash,
    "accepted B0 preview hash differs",
  );
  assert(
    "M2_B1_A_CASE_GATE",
    contract.case_id === B1A.caseId &&
      assets.replayCatalog.case_id === B1A.caseId,
    "case identity differs",
  );
  assert(
    "M2_B1_A_MODEL_CANDIDATE_GATE",
    contract.requested_model === B1A.model &&
      assets.replayCatalog.requested_model === B1A.model,
    "candidate identity differs",
  );
  assert(
    "M2_B1_A_MODEL_NON_SELECTION_GATE",
    contract.product_model_selected === false &&
      contract.baseline_model_selected === false,
    "candidate was selected",
  );
  assert(
    "M2_B1_A_OFFLINE_MODE_GATE",
    contract.execution_mode === B1A.mode &&
      deepEqual(contract.accepted_transport_kinds, ["offline_replay"]) &&
      contract.live_execution_authorized === false &&
      contract.automatic_transition_to_b1_b === false,
    "offline-only mode differs",
  );
}

function verifyIsolation() {
  const builtins = new Set(
    builtinModules.flatMap((name) => [
      name,
      name.startsWith("node:") ? name : `node:${name}`,
    ]),
  );
  const forbiddenBuiltins = new Set(
    ["ht", "ht2", "hs", "ne", "tl", "dn", "dg"].flatMap((part) => {
      const words = {
        ht: "http",
        ht2: "http2",
        hs: "https",
        ne: "net",
        tl: "tls",
        dn: "dns",
        dg: "dgram",
      };
      return [words[part], `node:${words[part]}`];
    }),
  );
  const word = (...parts) => parts.join("");
  const invocationPatterns = [
    new RegExp(`\\b${word("fe", "tch")}\\s*\\(`, "u"),
    new RegExp(`\\b${word("XML", "Http", "Request")}\\b`, "u"),
    new RegExp(`\\b${word("Web", "Socket")}\\s*\\(`, "u"),
  ];
  const secretReadPatterns = [
    new RegExp(`\\b${word("process", ".", "env")}(?:\\.|\\[)`, "u"),
    new RegExp(`\\b${word("Deno", ".", "env")}\\b`, "u"),
    new RegExp(`\\b${word("Bun", ".", "env")}\\b`, "u"),
    new RegExp(`\\b${word("get", "env")}\\s*\\(`, "u"),
  ];
  const providerPatterns = [
    new RegExp(`\\bnew\\s+${word("Open", "AI")}\\s*\\(`, "u"),
    new RegExp(`\\b${word("responses", ".", "create")}\\s*\\(`, "u"),
  ];
  const secretLiterals = [
    /\bsk-[A-Za-z0-9_-]{16,}\b/u,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    new RegExp(`\\b${word("Bearer")}\\s+[A-Za-z0-9._-]{20,}\\b`, "u"),
  ];
  for (const file of sixScriptPaths) {
    const text = canonicalText(file);
    for (const specifier of moduleSpecifiers(text)) {
      if (builtins.has(specifier)) {
        assert(
          "M2_B1_A_ZERO_NETWORK_GATE",
          !forbiddenBuiltins.has(specifier),
          `${file}: forbidden built-in ${specifier}`,
        );
        assert(
          "M2_B1_A_ZERO_PROVIDER_GATE",
          true,
          `${file}: built-in import`,
        );
        assert(
          "M2_B1_A_ZERO_SECRET_READ_GATE",
          file === "scripts/verify-m2-p2-b1-a-offline-runner.mjs" ||
            (specifier !== "child_process" &&
              specifier !== "node:child_process"),
          `${file}: child-process import is verifier-only`,
        );
        continue;
      }
      const resolved = specifier.startsWith(".")
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(file), specifier),
          )
        : null;
      assert(
        "M2_B1_A_ZERO_PROVIDER_GATE",
        resolved !== null && sixScriptPaths.includes(resolved),
        `${file}: non-local dependency ${specifier}`,
      );
    }
    assert(
      "M2_B1_A_ZERO_NETWORK_GATE",
      invocationPatterns.every((pattern) => !pattern.test(text)),
      `${file}: external invocation syntax found`,
    );
    assert(
      "M2_B1_A_ZERO_SECRET_READ_GATE",
      secretReadPatterns.every((pattern) => !pattern.test(text)) &&
        secretLiterals.every((pattern) => !pattern.test(text)),
      `${file}: secret read or key-like literal found`,
    );
    assert(
      "M2_B1_A_ZERO_PROVIDER_GATE",
      providerPatterns.every((pattern) => !pattern.test(text)),
      `${file}: provider invocation syntax found`,
    );
  }
}

function verifySchemaContracts(assets) {
  for (const [dataKey, schemaPath] of [
    ["runnerContract", "evals/calibration/b1a/schemas/runner-contract.schema.json"],
    ["stateMachine", "evals/calibration/b1a/schemas/state-machine.schema.json"],
    [
      "failureCatalog",
      "evals/calibration/b1a/schemas/failure-injection-catalog.schema.json",
    ],
    ["artifactPolicy", "evals/calibration/b1a/schemas/artifact-policy.schema.json"],
    ["reportManifest", "evals/calibration/b1a/schemas/report-manifest.schema.json"],
  ]) {
    const schema = readJson(schemaPath);
    const errors = validateJsonSchema(assets[dataKey], schema);
    assert(
      "M2_B1_A_SCHEMA_VALIDATION_GATE",
      errors.length === 0,
      `${dataKey}: ${errors.join("; ")}`,
    );
  }
  for (const stage of assets.replayCatalog.stages) {
    const schema = assets.stageSchemas[stage.stage_id];
    const errors = validateJsonSchema(
      stage.synthetic_output,
      schema.resolved,
      schema.root,
    );
    assert(
      "M2_B1_A_SCHEMA_VALIDATION_GATE",
      errors.length === 0,
      `${stage.stage_id}: ${errors.join("; ")}`,
    );
  }
}

function verifySequenceAndState(assets, happy) {
  const expectedStages = ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"];
  const expectedWorkflow = [
    "PB-01 replay",
    "PB-01 Schema validation",
    "PB-02 replay",
    "PB-02 Schema validation",
    "PB-03 replay",
    "PB-03 Schema validation",
    "local Safety aggregation",
    "local eligibility assertion",
    "local Decision Policy",
    "PB-04 replay",
    "PB-04 Schema and plan validation",
    "PB-05 replay",
    "PB-05 Schema and report validation",
    "PB-06 replay",
    "PB-06 Schema and semantic-validation checks",
    "final contract/budget/artifact checks",
    "completed_offline",
  ];
  assert(
    "M2_B1_A_STAGE_SEQUENCE_GATE",
    deepEqual(assets.runnerContract.stage_ids, expectedStages) &&
      deepEqual(
        assets.replayCatalog.stages.map((entry) => entry.stage_id),
        expectedStages,
      ) &&
      deepEqual(happy.completed_stages, expectedStages) &&
      deepEqual(assets.stateMachine.workflow, expectedWorkflow) &&
      !JSON.stringify(assets.stateMachine.workflow).includes("PB-07"),
    "Stage sequence differs",
  );
  const outgoingTerminal = assets.stateMachine.allowed_transitions.filter(
    (entry) =>
      entry.from === "stopped" || entry.from === "completed_offline",
  );
  assert(
    "M2_B1_A_STATE_MACHINE_GATE",
    assets.stateMachine.initial_state === "created" &&
      deepEqual(assets.stateMachine.terminal_success_states, [
        "completed_offline",
      ]) &&
      deepEqual(assets.stateMachine.terminal_failure_states, ["stopped"]) &&
      outgoingTerminal.length === 0 &&
      happy.final_state === "completed_offline" &&
      happy.stop_count === 0,
    "terminal or transition policy differs",
  );
  assert(
    "M2_B1_A_NO_RETRY_GATE",
    assets.runnerContract.retry_allowed === false &&
      assets.stateMachine.retry_transition_exists === false,
    "retry exists",
  );
  assert(
    "M2_B1_A_NO_REPAIR_GATE",
    assets.runnerContract.repair_allowed === false &&
      assets.stateMachine.repair_transition_exists === false &&
      assets.runnerContract.pb_07_included === false,
    "Repair exists",
  );
  assert(
    "M2_B1_A_NO_FALLBACK_GATE",
    assets.runnerContract.fallback_allowed === false &&
      assets.stateMachine.fallback_transition_exists === false,
    "fallback exists",
  );
}

function verifyDataAndLabels(assets) {
  const catalogText = JSON.stringify(assets.replayCatalog);
  assert(
    "M2_B1_A_ORACLE_ISOLATION_GATE",
    !catalogText.includes('"oracle"'),
    "evaluation oracle field is present",
  );
  assert(
    "M2_B1_A_HOLDOUT_ISOLATION_GATE",
    assets.runnerContract.case_id === "WAIT-003" &&
      assets.artifactPolicy.prohibited_content.includes("holdout_data"),
    "holdout boundary differs",
  );
  assert(
    "M2_B1_A_REAL_USER_DATA_GATE",
    assets.replayCatalog.case_id === "WAIT-003" &&
      assets.artifactPolicy.prohibited_content.includes("real_user_data"),
    "real-user boundary differs",
  );
  assert(
    "M2_B1_A_SYNTHETIC_LABEL_GATE",
    assets.replayCatalog.synthetic === true &&
      assets.replayCatalog.actual_provider_output === false &&
      assets.replayCatalog.model_quality_evidence === false &&
      assets.replayCatalog.stages.every(
        (entry) =>
          entry.synthetic_response_status === "completed" &&
          entry.source_estimator_hash ===
            assets.replayCatalog.source_estimator_hash &&
          entry.source_contract_hash === B1A.b0ContractHash,
      ),
    "synthetic labels or source links differ",
  );
}

function verifyBudget(assets, happy) {
  const estimator = readJson(
    "evals/cost-estimator/reports/static-estimate-v1.json",
  );
  let expectedTotal = 0;
  for (const stage of assets.replayCatalog.stages) {
    const source = estimator.static_stage_estimates.find(
      (entry) =>
        entry.stage_id === stage.stage_id &&
        entry.synthetic_profile === "nominal" &&
        entry.reference_case_id === "WAIT-003",
    );
    const usage = stage.synthetic_usage_reference;
    const expectedCost = Number(
      (
        source.token_estimate.high_tokens / 1_000_000 +
        (source.token_estimate.nominal_output_tokens * 6) / 1_000_000
      ).toFixed(10),
    );
    expectedTotal += expectedCost;
    assert(
      "M2_B1_A_BUDGET_LEDGER_GATE",
      usage.synthetic_input_tokens === source.token_estimate.high_tokens &&
        usage.synthetic_output_tokens ===
          source.token_estimate.nominal_output_tokens &&
        usage.synthetic_reasoning_tokens === "unknown" &&
        usage.synthetic_usage_cost_reference_usd === expectedCost,
      `${stage.stage_id}: usage reference was not derived from accepted estimator`,
    );
  }
  expectedTotal = Number(expectedTotal.toFixed(10));
  assert(
    "M2_B1_A_BUDGET_LEDGER_GATE",
    happy.budget_ledger.actual.actual_provider_calls === 0 &&
      happy.budget_ledger.actual.actual_api_spend_usd === 0 &&
      happy.budget_ledger.actual.actual_usage === "unavailable" &&
      happy.budget_ledger.synthetic_reference
        .synthetic_usage_cost_reference_usd === expectedTotal &&
      expectedTotal <= B1A.staticHardCapUsd &&
      B1A.staticHardCapUsd <= B1A.preflightCeilingUsd,
    "actual/synthetic separation or ceiling differs",
  );
  assert(
    "M2_B1_A_ZERO_ACTUAL_CALL_GATE",
    happy.actual_provider_calls === 0 &&
      assets.runnerContract.actual_provider_calls === 0,
    "actual provider calls are nonzero",
  );
  assert(
    "M2_B1_A_ZERO_SPEND_GATE",
    happy.api_spend_usd === 0 && assets.runnerContract.api_spend_usd === 0,
    "actual spend is nonzero",
  );
}

function verifyArtifactsAndLock(assets, evidence) {
  assert(
    "M2_B1_A_ARTIFACT_POLICY_GATE",
    deepEqual(
      assets.artifactPolicy.repository_reports,
      assets.reportManifest.report_paths,
    ) &&
      assets.artifactPolicy.repository_report_count === 3 &&
      assets.artifactPolicy.future_paid_run_location_created === false &&
      assets.artifactPolicy.byte_identical_repeated_runs_required === true,
    "artifact path or future paid-run boundary differs",
  );
  const prohibitedReportPatterns = [
    /[A-Z]:\\/u,
    /"timestamp"/iu,
    /"hostname"/iu,
    /"process_id"/iu,
    /"username"/iu,
  ];
  for (const report of assets.reportManifest.report_paths) {
    const text = canonicalText(report);
    assert(
      "M2_B1_A_ARTIFACT_POLICY_GATE",
      prohibitedReportPatterns.every((pattern) => !pattern.test(text)),
      `${report}: prohibited volatile or machine field`,
    );
  }
  assert(
    "M2_B1_A_APPROVAL_LOCK_GATE",
    assets.approvalLock.live_execution_authorized === false &&
      assets.approvalLock.paid_run_authorized === false &&
      assets.approvalLock.paid_run_completed === false &&
      assets.approvalLock.api_spend_usd === 0 &&
      assets.approvalLock.b1_b_authorized === false &&
      canonicalTextHash(B1A_ASSET_PATHS.approvalLock) ===
        assets.reportManifest.approval_lock_sha256,
    "approval lock or registered hash differs",
  );
  const happyOnDisk = canonicalText(
    "evals/calibration/b1a/reports/offline-happy-path-v1.json",
  );
  const failureOnDisk = canonicalText(
    "evals/calibration/b1a/reports/offline-failure-matrix-v1.json",
  );
  const summaryOnDisk = canonicalText(
    "evals/calibration/b1a/reports/offline-runner-summary-v1.md",
  );
  assert(
    "M2_B1_A_DETERMINISM_GATE",
    happyOnDisk === evidence.rendered.happy &&
      failureOnDisk === evidence.rendered.failure &&
      summaryOnDisk === evidence.rendered.summary,
    "checked-in report bytes differ from deterministic build",
  );
  const happyCopy = structuredClone(evidence.happy);
  const happyHash = happyCopy.deterministic_payload_sha256;
  delete happyCopy.deterministic_payload_sha256;
  const failureCopy = structuredClone(evidence.failure);
  const failureHash = failureCopy.deterministic_payload_sha256;
  delete failureCopy.deterministic_payload_sha256;
  assert(
    "M2_B1_A_REPORT_HASH_GATE",
    compactHash(happyCopy) === happyHash &&
      compactHash(failureCopy) === failureHash,
    "report payload hash differs",
  );
}

function verifyCliAndExactScripts() {
  const accepted = [
    "--mode",
    "offline-replay",
    "--case",
    "WAIT-003",
    "--model",
    "gpt-5.6-luna",
    "--contract-hash",
    B1A.b0ContractHash,
    "--confirm",
    B1A.confirmation,
  ];
  let acceptedPass = true;
  try {
    parseOfflineArguments(accepted);
  } catch {
    acceptedPass = false;
  }
  const rejected = [
    accepted.slice(0, -2),
    [...accepted, "--case", "WAIT-003"],
    [...accepted.slice(0, 2), "--unknown", "x", ...accepted.slice(2)],
    ["--live", "true", ...accepted],
    ["--network", "true", ...accepted],
    accepted.map((value) => (value === "WAIT-003" ? "WAIT-004" : value)),
    accepted.map((value) => (value === "gpt-5.6-luna" ? "other" : value)),
    accepted.map((value) => (value === B1A.b0ContractHash ? "0".repeat(64) : value)),
    [...accepted, "--stage", "PB-07"],
    [...accepted, "--output-cap", "1"],
    [...accepted, "--budget", "1"],
    [...accepted, "--retry", "1"],
    [...accepted, "--repair", "1"],
    [...accepted, "--fallback", "other"],
    [...accepted, "--case", "WAIT-004"],
  ];
  const rejectionPass = rejected.every((args) => {
    try {
      parseOfflineArguments(args);
      return false;
    } catch {
      return true;
    }
  });
  assert(
    "M2_B1_A_CLI_REJECTION_GATE",
    acceptedPass && rejectionPass,
    "accepted CLI failed or prohibited CLI passed",
  );

  const exactScripts = new Set([
    "scripts/prepare-m2-p2-b1-a-offline-runner.mjs",
    "scripts/run-m2-p2-b1-a-offline.mjs",
  ]);
  const execute = (relativePath, args = []) => {
    if (!exactScripts.has(relativePath)) {
      throw new Error(`Execution path not allowed: ${relativePath}`);
    }
    return spawnSync(process.execPath, [absolute(relativePath), ...args], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
  };
  const prepare = execute("scripts/prepare-m2-p2-b1-a-offline-runner.mjs");
  const run = execute("scripts/run-m2-p2-b1-a-offline.mjs", accepted);
  assert(
    "M2_B1_A_DETERMINISM_GATE",
    prepare.status === 0 &&
      prepare.stdout.includes("M2_B1_A_DETERMINISM_GATE: PASS") &&
      run.status === 0 &&
      run.stdout.includes("M2_P2_B1_A_OFFLINE_RUN: completed_offline"),
    `exact local scripts failed: ${prepare.stderr}${run.stderr}`,
  );
}

function verifyFailureMatrix(assets, transport, evidence) {
  const first = runFailureMatrix({ assets, transport });
  const second = runFailureMatrix({ assets, transport });
  assert(
    "M2_B1_A_FAILURE_MATRIX_GATE",
    first.length === 20 &&
      first.every((entry) => entry.passed) &&
      deepEqual(first, second) &&
      evidence.failure.scenario_count === 20 &&
      evidence.failure.completed_offline_count === 0 &&
      evidence.failure.all_stopped_once === true,
    "20-case failure matrix differs or a scenario completed",
  );
}

function printResults() {
  for (const gate of gateOrder) {
    for (const detail of failures.get(gate)) {
      console.error(`FAIL_DETAIL | gate=${gate} | ${detail}`);
    }
    console.log(
      `${gate}: ${failures.get(gate).length === 0 ? "PASS" : "FAIL"}`,
    );
  }
  for (const detail of overallFailures) {
    console.error(
      `FAIL_DETAIL | gate=M2_P2_B1_A_OFFLINE_RUNNER_GATE | ${detail}`,
    );
  }
  const passed =
    gateOrder.every((gate) => failures.get(gate).length === 0) &&
    overallFailures.length === 0;
  console.log(
    `M2_P2_B1_A_OFFLINE_RUNNER_GATE: ${passed ? "PASS" : "FAIL"}`,
  );
  return passed;
}

try {
  const assets = loadB1aAssets();
  const transport = createOfflineReplayTransport(assets.replayCatalog);
  const evidence = buildOfflineEvidence();
  const happy = createRunner({ assets, transport }).run();
  verifyExactScope(assets);
  verifyContracts(assets);
  verifyIsolation();
  verifySchemaContracts(assets);
  verifySequenceAndState(assets, happy);
  verifyDataAndLabels(assets);
  verifyBudget(assets, happy);
  verifyArtifactsAndLock(assets, evidence);
  verifyCliAndExactScripts();
  verifyFailureMatrix(assets, transport, evidence);
  if (!printResults()) process.exitCode = 1;
} catch (error) {
  overallFailures.push(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  printResults();
  process.exitCode = 1;
}
