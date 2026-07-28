import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import {
  readJson,
  validateJsonSchema,
} from "./render-m2-dry-run-requests.mjs";
import {
  buildCalibrationPreview,
  canonicalTextHash,
  contractBundleHash,
  renderCalibrationPreview,
  repositoryRoot,
} from "./prepare-m2-p2-b0-calibration-contract.mjs";

const safeRepositoryRoot = repositoryRoot.replaceAll("\\", "/");
const correctionCommit =
  "a757e7f28affe29a423ff817872a1a7f650a7fd2";
const acceptedB0ImplementationCommit =
  "cf75679f2d116132f7519256cd762ba1a51a0af9";
const b1aSuccessorLocalToolPaths = new Set([
  "scripts/prepare-m2-p2-b1-a-offline-runner.mjs",
  "scripts/run-m2-p2-b1-a-offline.mjs",
  "scripts/verify-m2-p2-b1-a-offline-runner.mjs",
  "scripts/lib/m2-p2-b1-a-contract.mjs",
  "scripts/lib/m2-p2-b1-a-runner-core.mjs",
  "scripts/lib/m2-p2-b1-a-offline-replay-transport.mjs",
]);
const b1b1SuccessorLocalToolPaths = new Set([
  "scripts/prepare-m2-p2-b1-b1-provider-adapter.mjs",
  "scripts/run-m2-p2-b1-b1-network-blocked.mjs",
  "scripts/verify-m2-p2-b1-b1-provider-adapter.mjs",
  "scripts/lib/m2-p2-b1-b1-request-builder.mjs",
  "scripts/lib/m2-p2-b1-b1-response-parser.mjs",
  "scripts/lib/m2-p2-b1-b1-usage-ledger.mjs",
  "scripts/lib/m2-p2-b1-b1-provider-adapter.mjs",
  "scripts/lib/m2-p2-b1-b1-network-interlock.mjs",
  "scripts/lib/m2-p2-b1-b1-secret-provider-contract.mjs",
  "scripts/lib/m2-p2-b1-b1-redaction.mjs",
  "scripts/lib/m2-p2-b1-b1-artifact-sanitizer.mjs",
]);
const nodeBuiltinSpecifiers = new Set(
  builtinModules.flatMap((specifier) => [
    specifier,
    specifier.startsWith("node:") ? specifier : `node:${specifier}`,
  ]),
);

const contractPath =
  "evals/calibration/one-case-contract-v1.json";
const stagePlanPath = "evals/calibration/stage-plan-v1.json";
const artifactContractPath =
  "evals/calibration/artifact-contract-v1.json";
const securityPolicyPath =
  "evals/calibration/security-policy-v1.json";
const previewPath =
  "evals/calibration/reports/contract-preview-v1.json";

const gateOrder = [
  "M2_B0_CASE_GATE",
  "M2_B0_MODEL_CANDIDATE_GATE",
  "M2_B0_MODEL_NON_SELECTION_GATE",
  "M2_B0_STAGE_SEQUENCE_GATE",
  "M2_B0_CALL_COUNT_GATE",
  "M2_B0_OUTPUT_CAP_GATE",
  "M2_B0_STATIC_COST_LINK_GATE",
  "M2_B0_BUDGET_CEILING_GATE",
  "M2_B0_NO_RETRY_GATE",
  "M2_B0_NO_REPAIR_GATE",
  "M2_B0_NO_FALLBACK_GATE",
  "M2_B0_ORACLE_ISOLATION_GATE",
  "M2_B0_HOLDOUT_ISOLATION_GATE",
  "M2_B0_SECRET_POLICY_GATE",
  "M2_B0_ARTIFACT_CONTRACT_GATE",
  "M2_B0_LIVE_AUTHORIZATION_FALSE_GATE",
  "M2_B0_ZERO_NETWORK_GATE",
  "M2_B0_ZERO_PROVIDER_GATE",
  "M2_B0_DETERMINISM_GATE",
  "M2_B0_CONTRACT_HASH_GATE",
  "M2_B0_EXACT_SCOPE_GATE",
  "M2_B1_A_SUCCESSOR_PATH_GATE",
  "M2_B1_A_SUCCESSOR_ISOLATION_GATE",
  "M2_B1_B1_SUCCESSOR_PATH_GATE",
  "M2_B1_B1_SUCCESSOR_ISOLATION_GATE",
];

const failures = new Map(gateOrder.map((gate) => [gate, []]));
const overallFailures = [];

const b0Manifest = [
  ["A", "docs/phase2/M2_P2_B0_ONE_CASE_CALIBRATION_CONTRACT.md"],
  ["A", "docs/phase2/M2_P2_B0_SECURITY_AND_BUDGET_POLICY.md"],
  ["A", "docs/phase2/TASK_M2_P2_B0_REVIEW.md"],
  ["M", "docs/ROADMAP.md"],
  ["M", "docs/CURRENT_FOCUS.md"],
  ["M", "docs/CODEX_HANDOFF.md"],
  ["M", "docs/WBS.md"],
  ["A", "evals/calibration/README.md"],
  ["A", "evals/calibration/one-case-contract-v1.json"],
  ["A", "evals/calibration/stage-plan-v1.json"],
  ["A", "evals/calibration/artifact-contract-v1.json"],
  ["A", "evals/calibration/security-policy-v1.json"],
  ["A", "evals/calibration/reports/contract-preview-v1.json"],
  [
    "A",
    "evals/calibration/schemas/one-case-contract.schema.json",
  ],
  ["A", "evals/calibration/schemas/stage-plan.schema.json"],
  [
    "A",
    "evals/calibration/schemas/artifact-contract.schema.json",
  ],
  [
    "A",
    "scripts/prepare-m2-p2-b0-calibration-contract.mjs",
  ],
  [
    "A",
    "scripts/verify-m2-p2-b0-calibration-contract.mjs",
  ],
]
  .map(([status, file]) => ({ file, status }))
  .sort((left, right) => left.file.localeCompare(right.file, "en"));

const r2CorrectionManifest = [
  {
    file: "docs/phase2/M2_P2_A_HISTORICAL_SCOPE.json",
    status: "A",
  },
  {
    file:
      "docs/phase2/TASK_M2_P2_B0_R2_HISTORICAL_SCOPE_BOUNDARY.md",
    status: "A",
  },
  {
    file: "scripts/verify-m2-zero-cost-estimator.mjs",
    status: "M",
  },
].sort((left, right) => left.file.localeCompare(right.file, "en"));

const expectedStages = [
  [1, "PB-01", "Structure", "provider", true],
  [2, "PB-02", "Safety Semantic", "provider", true],
  [3, "PB-03", "Eligibility", "provider", true],
  [
    4,
    "LOCAL-SAFETY-AGGREGATION",
    "local deterministic Safety aggregation",
    "local_deterministic",
    false,
  ],
  [
    5,
    "LOCAL-DECISION-POLICY",
    "local deterministic Decision Policy",
    "local_deterministic",
    false,
  ],
  [6, "PB-04", "Decision Planning", "provider", true],
  [
    7,
    "LOCAL-PLAN-VALIDATION",
    "deterministic plan validation",
    "local_deterministic",
    false,
  ],
  [8, "PB-05", "Report Writing", "provider", true],
  [
    9,
    "LOCAL-REPORT-VALIDATION",
    "deterministic report validation",
    "local_deterministic",
    false,
  ],
  [10, "PB-06", "Semantic Validation", "provider", true],
];

const expectedCaps = {
  "PB-01": 4000,
  "PB-02": 800,
  "PB-03": 700,
  "PB-04": 4500,
  "PB-05": 8000,
  "PB-06": 2500,
};

const expectedRequestDefaults = {
  endpoint: "/v1/responses",
  store: false,
  tools: [],
  stream: false,
  background: false,
  service_tier: "default",
  truncation: "disabled",
  reasoning: {
    effort: "low",
    summary_requested: false,
  },
  text_format_type: "json_schema",
  strict_schema_adherence: true,
  forbidden_request_fields: [
    "previous_response_id",
    "conversation",
    "web_search",
    "file_search",
    "code_interpreter",
    "prompt_cache_key",
    "prompt_cache_retention",
    "user",
    "safety_identifier",
  ],
};

const expectedStopConditions = [
  "api_or_transport_failure",
  "timeout",
  "incomplete_response",
  "refusal",
  "missing_usage",
  "invalid_json",
  "schema_failure",
  "safety_failure",
  "oracle_leakage",
  "unallowed_decision",
  "hallucinated_fact",
  "stage_gate_failure",
  "budget_guard_failure",
];

const expectedArtifactFiles = [
  "run-manifest.json",
  "stage-records.json",
  "gate-results.json",
  "cost-summary.json",
  "calibration-summary.md",
  "outputs/PB-01.json",
  "outputs/PB-02.json",
  "outputs/PB-03.json",
  "outputs/PB-04.json",
  "outputs/PB-05.json",
  "outputs/PB-06.json",
];

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function fail(gate, detail) {
  failures.get(gate).push(detail);
}

function assert(gate, condition, detail) {
  if (!condition) fail(gate, detail);
}

function sha256CompactJson(value) {
  return createHash("sha256")
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex");
}

function runGit(args) {
  return spawnSync(
    "git",
    ["-c", `safe.directory=${safeRepositoryRoot}`, ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
    },
  );
}

function taskMutations() {
  const diff = runGit([
    "diff",
    "--name-status",
    correctionCommit,
    acceptedB0ImplementationCommit,
    "--",
  ]);
  if (diff.status !== 0) {
    fail(
      "M2_B0_EXACT_SCOPE_GATE",
      `Git historical scope audit failed: ${diff.stderr}`,
    );
    return [];
  }
  const entries = new Map();
  for (const line of diff.stdout.split(/\r?\n/u).filter(Boolean)) {
    const [statusCode, ...parts] = line.split("\t");
    entries.set(parts.at(-1).replaceAll("\\", "/"), statusCode[0]);
  }
  return [...entries]
    .map(([file, statusCode]) => ({ file, status: statusCode }))
    .sort((left, right) => left.file.localeCompare(right.file, "en"));
}

function moduleSpecifiers(text) {
  const specifiers = [];
  const patterns = [
    /(?:^|\n)\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"'\r\n]+)["']/gu,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) specifiers.push(match[1]);
  }
  return [...new Set(specifiers)];
}

function verifySuccessorTools({
  paths,
  isolationGate,
  verifierPath,
  boundaryLabel,
}) {
  const forbiddenBuiltins = new Set([
    "http",
    "http2",
    "https",
    "net",
    "tls",
    "dns",
    "dgram",
    "node:http",
    "node:http2",
    "node:https",
    "node:net",
    "node:tls",
    "node:dns",
    "node:dgram",
  ]);
  const isolationPatterns = [
    ["network invocation", /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/u],
    ["environment access", /\bprocess\.env(?:\.|\[)|\bDeno\.env\b|\bBun\.env\b|\bgetenv\s*\(/u],
    ["environment enumeration", /\bObject\.(?:keys|values|entries)\s*\(\s*process\b/u],
    ["authorization header", /\bAuthorization\s*:/iu],
    ["provider SDK", /\bnew\s+(?:OpenAI|Anthropic|GoogleGenerativeAI|CohereClient|MistralClient)\s*\(/u],
    ["database SDK", /@supabase\/supabase-js|from\s+["'](?:pg|mysql2|sqlite3)["']/u],
    ["auth, payment, or email SDK", /from\s+["'](?:next-auth|stripe|nodemailer|@sendgrid\/mail)["']/u],
    ["application import", /from\s+["'](?:@\/|\.\.?\/)+(?:app|components|lib\/(?:safety|legal|supabase))\//u],
    ["server action", /^\s*["']use server["'];?\s*$/mu],
    ["API route", /["'`](?:\.?\.?\/)*app\/api\//u],
    ["network shell client", /\b(?:curl|wget|Invoke-WebRequest|Invoke-RestMethod)\b/iu],
  ];
  const secretPatterns = [
    /\bsk-[A-Za-z0-9_-]{16,}\b/u,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/u,
  ];
  for (const file of paths) {
    if (!existsSync(absolute(file))) continue;
    const text = source(file);
    for (const specifier of moduleSpecifiers(text)) {
      if (nodeBuiltinSpecifiers.has(specifier)) {
        assert(
          isolationGate,
          !forbiddenBuiltins.has(specifier),
          `${file}: forbidden built-in ${specifier}`,
        );
        assert(
          isolationGate,
          file === verifierPath ||
            (specifier !== "child_process" &&
              specifier !== "node:child_process"),
          `${file}: child_process is verifier-only`,
        );
        continue;
      }
      const resolved = specifier.startsWith(".")
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(file), specifier),
          )
        : null;
      assert(
        isolationGate,
        resolved !== null && paths.has(resolved),
        `${file}: import is not an exact ${boundaryLabel} peer: ${specifier}`,
      );
    }
    for (const [label, pattern] of isolationPatterns) {
      assert(
        isolationGate,
        !pattern.test(text),
        `${file}: ${label}`,
      );
    }
    for (const pattern of secretPatterns) {
      assert(
        isolationGate,
        !pattern.test(text),
        `${file}: key-like literal`,
      );
    }
  }
}

function verifyAuthorizedSuccessorTools() {
  verifySuccessorTools({
    paths: b1aSuccessorLocalToolPaths,
    isolationGate: "M2_B1_A_SUCCESSOR_ISOLATION_GATE",
    verifierPath: "scripts/verify-m2-p2-b1-a-offline-runner.mjs",
    boundaryLabel: "B1-A",
  });
  verifySuccessorTools({
    paths: b1b1SuccessorLocalToolPaths,
    isolationGate: "M2_B1_B1_SUCCESSOR_ISOLATION_GATE",
    verifierPath: "scripts/verify-m2-p2-b1-b1-provider-adapter.mjs",
    boundaryLabel: "B1-B1",
  });
}

function verifySchemas() {
  for (const [dataPath, schemaPath] of [
    [
      contractPath,
      "evals/calibration/schemas/one-case-contract.schema.json",
    ],
    [
      stagePlanPath,
      "evals/calibration/schemas/stage-plan.schema.json",
    ],
    [
      artifactContractPath,
      "evals/calibration/schemas/artifact-contract.schema.json",
    ],
  ]) {
    const data = readJson(dataPath);
    const schema = readJson(schemaPath);
    const errors = validateJsonSchema(data, schema);
    assert(
      "M2_B0_CONTRACT_HASH_GATE",
      errors.length === 0,
      `${dataPath}: Schema errors ${errors.join("; ")}`,
    );
  }
}

function verifyCase(contract) {
  const cases = readJson("evals/development/wait-and-reassess.json");
  const index = readJson("evals/development/index.json");
  const matchingCases = cases.filter(
    (item) => item.case_id === "WAIT-003",
  );
  const matchingIndex = index.cases.filter(
    (item) => item.case_id === "WAIT-003",
  );
  const item = matchingCases[0];
  assert(
    "M2_B0_CASE_GATE",
    matchingCases.length === 1 &&
      matchingIndex.length === 1 &&
      item.dataset_split === "development" &&
      matchingIndex[0].source_file === "wait-and-reassess.json" &&
      contract.case.case_id === "WAIT-003" &&
      contract.case.dataset_split === "development" &&
      contract.case.case_sha256 === sha256CompactJson(item) &&
      contract.case.oracle_local_only === true &&
      contract.case.holdout_data_used === false &&
      contract.case.real_user_data_used === false,
    "WAIT-003 identity, development split, hash, or isolation differs",
  );
}

function verifyCandidate(contract) {
  const candidate = contract.candidate;
  assert(
    "M2_B0_MODEL_CANDIDATE_GATE",
    candidate.provider === "openai" &&
      candidate.endpoint === "responses" &&
      candidate.requested_model === "gpt-5.6-luna" &&
      candidate.model_role ===
        "cost_and_plumbing_calibration_candidate" &&
      candidate.local_project_availability_verified === false &&
      candidate.stop_if_unavailable_or_unauthorized === true &&
      candidate.returned_model_id_recording_required === true &&
      candidate.alias_or_snapshot_behavior_assumed === false,
    "candidate identity or availability/returned-model contract differs",
  );
  assert(
    "M2_B0_MODEL_NON_SELECTION_GATE",
    contract.purpose.model_quality_benchmark === false &&
      candidate.selected_for_product === false &&
      candidate.selected_for_baseline === false,
    "candidate was incorrectly presented as a quality benchmark or selection",
  );
}

function verifyStages(stagePlan) {
  const actualStages = stagePlan.stage_sequence.map((step) => [
    step.order,
    step.step_id,
    step.name,
    step.kind,
    step.provider_call,
  ]);
  const providerSteps = stagePlan.stage_sequence.filter(
    (step) => step.provider_call,
  );
  const localSteps = stagePlan.stage_sequence.filter(
    (step) => !step.provider_call,
  );
  assert(
    "M2_B0_STAGE_SEQUENCE_GATE",
    deepEqual(actualStages, expectedStages) &&
      stagePlan.stage_sequence.every(
        (step) => step.maximum_executions === 1,
      ) &&
      stagePlan.pb_07_included === false &&
      !stagePlan.stage_sequence.some(
        (step) => step.step_id === "PB-07",
      ) &&
      deepEqual(
        stagePlan.provider_request_defaults,
        expectedRequestDefaults,
      ) &&
      providerSteps.every(
        (step) =>
          step.request_contract_ref ===
          "#/provider_request_defaults",
      ) &&
      localSteps.every(
        (step) => step.request_contract_ref === null,
      ) &&
      stagePlan.preflight_requirements.length === 11 &&
      stagePlan.post_stage_requirements.length === 10 &&
      deepEqual(stagePlan.stop_conditions, expectedStopConditions),
    "exact stage order, request contract, pre/post gates, or stop policy differs",
  );
  assert(
    "M2_B0_CALL_COUNT_GATE",
    providerSteps.length === 6 &&
      localSteps.length === 4 &&
      stagePlan.maximum_provider_calls === 6 &&
      stagePlan.local_deterministic_step_count === 4,
    `provider/local count differs: ${providerSteps.length}/${localSteps.length}`,
  );
  const actualCaps = Object.fromEntries(
    providerSteps.map((step) => [
      step.step_id,
      step.max_output_tokens,
    ]),
  );
  assert(
    "M2_B0_OUTPUT_CAP_GATE",
    deepEqual(actualCaps, expectedCaps) &&
      Object.values(actualCaps).reduce(
        (sum, value) => sum + value,
        0,
      ) === 20500 &&
      stagePlan.total_provider_output_cap_tokens === 20500 &&
      stagePlan.stage_cap_borrowing_allowed === false &&
      stagePlan.max_output_tokens_includes_reasoning_usage === true,
    "stage caps, total cap, borrowing, or reasoning-budget statement differs",
  );
}

function verifyStaticCost(contract, preview) {
  assert(
    "M2_B0_STATIC_COST_LINK_GATE",
    canonicalTextHash(
      contract.references.accepted_static_estimator_report_path,
    ) ===
      contract.references.accepted_static_estimator_report_file_sha256 &&
      preview.estimator_report.generated_projection_sha256 ===
        contract.references
          .accepted_static_estimator_projection_sha256 &&
      preview.prompt_bundle.manifest_sha256 ===
        contract.references.prompt_bundle_manifest_sha256 &&
      preview.schema_set.sha256 ===
        contract.references.schema_set_sha256 &&
      preview.price_snapshot.sha256 ===
        contract.references.price_snapshot_sha256 &&
      preview.static_estimate.nominal_request_bytes === 160368 &&
      preview.static_estimate.nominal_full_envelope_bytes === 163177 &&
      preview.static_estimate.conservative_request_bytes === 180444 &&
      preview.static_estimate
        .conservative_full_envelope_bytes === 183283 &&
      preview.static_estimate.low_input_tokens === 40094 &&
      preview.static_estimate.central_input_tokens === 53458 &&
      preview.static_estimate.high_input_tokens === 80185 &&
      preview.static_estimate.conservative_high_input_tokens ===
        90223 &&
      preview.static_estimate.expected_static_conservative_usd ===
        0.163123,
    "accepted estimator hashes, exact bytes, token bands, or conservative cost differ",
  );
  assert(
    "M2_B0_BUDGET_CEILING_GATE",
    contract.budget.currency === "USD" &&
      contract.budget.standard_input_per_million === 1 &&
      contract.budget.standard_output_per_million === 6 &&
      contract.budget.current_task_spend_authorized_usd === 0 &&
      contract.budget.future_human_approval_ceiling_usd === 1 &&
      contract.budget.preflight_contract_ceiling_usd === 0.3 &&
      preview.static_estimate.recomputed_hard_cap_standard_usd ===
        0.213223 &&
      preview.static_estimate.recomputed_hard_cap_standard_usd <=
        contract.budget.preflight_contract_ceiling_usd &&
      preview.budget.preflight_budget_eligible === true &&
      preview.budget.live_execution_eligible === false &&
      contract.budget.batch_allowed === false &&
      contract.budget.priority_allowed === false &&
      contract.budget.cache_discount_in_approval_baseline === false &&
      contract.budget.cached_input_costed_as_uncached === true &&
      preview.budget.batch_reliance === false &&
      preview.budget.cache_savings_reliance === false,
    "standard hard-cap ceiling or zero/current/future budget contract differs",
  );
}

function verifyAttemptPolicy(contract, stagePlan) {
  const retry = stagePlan.retry_policy;
  assert(
    "M2_B0_NO_RETRY_GATE",
    retry.transport_retry_allowed === false &&
      retry.schema_retry_allowed === false &&
      retry.automatic_continuation_after_failed_stage === false,
    "transport/schema retry or automatic continuation is enabled",
  );
  assert(
    "M2_B0_NO_REPAIR_GATE",
    retry.repair_allowed === false &&
      contract.execution_prohibitions.repair === false &&
      stagePlan.pb_07_included === false,
    "Repair or PB-07 is enabled",
  );
  assert(
    "M2_B0_NO_FALLBACK_GATE",
    retry.fallback_allowed === false &&
      contract.execution_prohibitions.fallback === false &&
      contract.candidate.fallback_model === null &&
      contract.candidate.automatic_switch_to_terra_or_sol === false,
    "fallback or automatic model switching is enabled",
  );
}

function verifyIsolation(contract, securityPolicy, preview) {
  assert(
    "M2_B0_ORACLE_ISOLATION_GATE",
    contract.case.oracle_local_only === true &&
      securityPolicy.data_policy.oracle_provider_access_allowed ===
        false &&
      !JSON.stringify(preview).includes('"oracle"'),
    "oracle is not strictly local-only",
  );
  assert(
    "M2_B0_HOLDOUT_ISOLATION_GATE",
    contract.case.holdout_data_used === false &&
      contract.execution_prohibitions.holdout_execution === false &&
      securityPolicy.data_policy.holdout_data_allowed === false &&
      preview.security_requirements.holdout_data_allowed === false,
    "holdout isolation differs",
  );
}

function verifySecretPolicy(securityPolicy) {
  const scriptPaths = [
    "scripts/prepare-m2-p2-b0-calibration-contract.mjs",
    "scripts/verify-m2-p2-b0-calibration-contract.mjs",
  ];
  const artifactPaths = [
    contractPath,
    stagePlanPath,
    artifactContractPath,
    securityPolicyPath,
    previewPath,
  ];
  const apiKeyVariableName = ["OPENAI", "API", "KEY"].join("_");
  const secretPatterns = [
    /\bsk-[A-Za-z0-9_-]{16,}\b/u,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/u,
  ];
  const scriptsSafe = scriptPaths.every((file) => {
    const text = source(file);
    return (
      !/\bprocess\.env(?:\.|\[)/u.test(text) &&
      !/\bDeno\.env\b/u.test(text) &&
      !/\bBun\.env\b/u.test(text) &&
      !/\bgetenv\s*\(/u.test(text) &&
      !text.includes(apiKeyVariableName) &&
      secretPatterns.every((pattern) => !pattern.test(text))
    );
  });
  const artifactsSafe = artifactPaths.every((file) => {
    const text = source(file);
    return (
      !text.includes(apiKeyVariableName) &&
      !/\bAuthorization\s*:/iu.test(text) &&
      secretPatterns.every((pattern) => !pattern.test(text))
    );
  });
  const unsafeUnignore = source(".gitignore")
    .split(/\r?\n/u)
    .some(
      (line) =>
        line.trimStart().startsWith("!") && /\.env(?:\.|$)/u.test(line),
    );
  assert(
    "M2_B0_SECRET_POLICY_GATE",
    scriptsSafe &&
      artifactsSafe &&
      unsafeUnignore === false &&
      securityPolicy.b0.api_key_read_allowed === false &&
      securityPolicy.b0.secret_value_display_allowed === false &&
      securityPolicy.future_b1_key_policy.process_environment_only ===
        true &&
      securityPolicy.future_b1_key_policy
        .command_line_argument_allowed === false &&
      securityPolicy.future_b1_key_policy.json_config_allowed ===
        false &&
      securityPolicy.future_b1_key_policy.run_artifact_allowed ===
        false &&
      securityPolicy.future_b1_key_policy
        .authorization_header_logging_allowed === false &&
      securityPolicy.future_b1_key_policy.environment_dump_allowed ===
        false &&
      securityPolicy.gitignore_policy.unsafe_rule_found === false &&
      securityPolicy.gitignore_policy.modified_in_b0 === false,
    "B0 secret scan, future key policy, or .gitignore boundary failed",
  );
}

function verifyArtifactContract(artifactContract) {
  const allowed = new Set(artifactContract.allowed_evidence_fields);
  const prohibited = new Set(artifactContract.prohibited_evidence);
  assert(
    "M2_B0_ARTIFACT_CONTRACT_GATE",
    artifactContract.repository_storage_default === false &&
      artifactContract.b0_creates_paid_run_directory === false &&
      artifactContract.default_conceptual_location ===
        "%LOCALAPPDATA%\\moon-reply\\calibration-runs\\<run_id>\\" &&
      deepEqual(artifactContract.required_files, expectedArtifactFiles) &&
      [
        "run_id",
        "fixture_case_id",
        "prompt_hashes",
        "schema_hashes",
        "contract_hash",
        "requested_model_id",
        "returned_model_id",
        "response_ids",
        "response_status",
        "usage.input_tokens",
        "usage.input_tokens_details.cached_tokens",
        "usage.output_tokens",
        "usage.output_tokens_details.reasoning_tokens",
        "usage.total_tokens",
        "latency_milliseconds",
        "schema_results",
        "gate_results",
        "usage-derived cost estimate",
        "static-versus-usage comparison",
      ].every((item) => allowed.has(item)) &&
      [
        "api_key",
        "authorization_header",
        "environment_values",
        "real_user_data",
        "holdout_data",
        "internal_chain_of_thought",
        "reasoning_text",
        "unrelated_machine_information",
      ].every((item) => prohibited.has(item)) &&
      artifactContract.cost_term ===
        "usage-derived cost estimate" &&
      artifactContract.final_billed_cost_claim_allowed === false &&
      artifactContract.reasoning_usage_numbers_allowed === true &&
      artifactContract.reasoning_text_allowed === false,
    "repository-external artifact files, evidence fields, or cost terminology differ",
  );
}

function verifyAuthorization(contract) {
  const lock = contract.authorization_lock;
  assert(
    "M2_B0_LIVE_AUTHORIZATION_FALSE_GATE",
    contract.candidate.live_execution_authorized === false &&
      lock.live_execution_authorized === false &&
      lock.paid_run_completed === false &&
      lock.api_spend_usd === 0 &&
      lock.b1_status === "unauthorized_not_started" &&
      lock.separately_committed_human_approval_record_required ===
        true &&
      lock.exact_approved_contract_hash_required === true &&
      lock.exact_approved_case_required === true &&
      lock.exact_approved_model_required === true &&
      lock.exact_approved_stage_list_required === true &&
      lock.exact_approved_usd_1_ceiling_required === true &&
      lock.explicit_live_cli_flag_required === true &&
      lock.exact_one_time_local_confirmation_required === true &&
      lock.live_cli_implemented_in_b0 === false &&
      lock.missing_condition_action ===
        "stop_before_network_access",
    "live authorization or Human approval lock differs",
  );
}

function verifyZeroExternalExecution(contract) {
  const scriptPaths = [
    "scripts/prepare-m2-p2-b0-calibration-contract.mjs",
    "scripts/verify-m2-p2-b0-calibration-contract.mjs",
  ];
  const networkPatterns = [
    /\bfetch\s*\(/u,
    /\bXMLHttpRequest\b/u,
    /\bWebSocket\s*\(/u,
    /from\s+["']node:(?:http|http2|https|net|tls|dns|dgram)["']/u,
    /\b(?:curl|wget|Invoke-WebRequest)\b.*https?:\/\//iu,
  ];
  const providerPatterns = [
    /from\s+["']openai["']/u,
    /require\s*\(\s*["']openai["']\s*\)/u,
    /\bnew\s+OpenAI\s*\(/u,
    /\bresponses\.create\s*\(/u,
    /\bchat\.completions\.create\s*\(/u,
  ];
  assert(
    "M2_B0_ZERO_NETWORK_GATE",
    scriptPaths.every((file) =>
      networkPatterns.every((pattern) => !pattern.test(source(file))),
    ) &&
      contract.execution_prohibitions.network_execution_in_b0 ===
        false,
    "network capability or execution was found in B0 scripts",
  );
  assert(
    "M2_B0_ZERO_PROVIDER_GATE",
    scriptPaths.every((file) =>
      providerPatterns.every((pattern) => !pattern.test(source(file))),
    ) &&
      contract.execution_prohibitions.provider_execution_in_b0 ===
        false,
    "provider SDK, executor, or invocation was found in B0 scripts",
  );
}

function verifyDeterminismAndHash(contract, preview) {
  const first = renderCalibrationPreview();
  const second = renderCalibrationPreview();
  assert(
    "M2_B0_DETERMINISM_GATE",
    first === second && first === source(previewPath),
    "repeated preview builds or checked-in preview bytes differ",
  );
  assert(
    "M2_B0_CONTRACT_HASH_GATE",
    preview.contract_hash.sha256 === contractBundleHash(contract) &&
      preview.case.case_sha256 === contract.case.case_sha256 &&
      preview.price_snapshot.sha256 ===
        contract.references.price_snapshot_sha256,
    "contract, case, or price snapshot hash differs",
  );
}

function verifyExactScope() {
  const allMutations = taskMutations();
  const correctionPaths = new Set(
    r2CorrectionManifest.map((entry) => entry.file),
  );
  const correctionMutations = allMutations.filter((entry) =>
    correctionPaths.has(entry.file),
  );
  const b0Mutations = allMutations.filter(
    (entry) => !correctionPaths.has(entry.file),
  );
  assert(
    "M2_B0_EXACT_SCOPE_GATE",
    deepEqual(correctionMutations, r2CorrectionManifest),
    `exact R2 correction boundary differs: ${JSON.stringify(correctionMutations)}`,
  );
  assert(
    "M2_B0_EXACT_SCOPE_GATE",
    deepEqual(b0Mutations, b0Manifest),
    `exact B0 manifest differs: ${JSON.stringify(b0Mutations)}`,
  );
  for (const paths of [
    [
      "ai/prompts",
      "ai/schemas",
      "evals/development",
      "evals/version-manifest.json",
      "evals/cost-estimator",
    ],
    [
      "app",
      "components",
      "fixtures",
      "lib",
      "public",
      "supabase",
      "package.json",
      "package-lock.json",
      ".gitignore",
    ],
  ]) {
    const result = runGit([
      "diff",
      "--exit-code",
      correctionCommit,
      "--",
      ...paths,
    ]);
    assert(
      "M2_B0_EXACT_SCOPE_GATE",
      result.status === 0,
      `protected diff is not zero for ${paths.join(", ")}`,
    );
  }
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
      `FAIL_DETAIL | gate=M2_P2_B0_CALIBRATION_CONTRACT_GATE | ${detail}`,
    );
  }
  const passed =
    gateOrder.every((gate) => failures.get(gate).length === 0) &&
    overallFailures.length === 0;
  console.log(
    `M2_P2_B0_CALIBRATION_CONTRACT_GATE: ${passed ? "PASS" : "FAIL"}`,
  );
  return passed;
}

try {
  const contract = readJson(contractPath);
  const stagePlan = readJson(stagePlanPath);
  const artifactContract = readJson(artifactContractPath);
  const securityPolicy = readJson(securityPolicyPath);
  const preview = buildCalibrationPreview();
  verifySchemas();
  verifyCase(contract);
  verifyCandidate(contract);
  verifyStages(stagePlan);
  verifyStaticCost(contract, preview);
  verifyAttemptPolicy(contract, stagePlan);
  verifyIsolation(contract, securityPolicy, preview);
  verifySecretPolicy(securityPolicy);
  verifyArtifactContract(artifactContract);
  verifyAuthorization(contract);
  verifyZeroExternalExecution(contract);
  verifyDeterminismAndHash(contract, preview);
  verifyExactScope();
  verifyAuthorizedSuccessorTools();
  if (!printResults()) process.exitCode = 1;
} catch (error) {
  overallFailures.push(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  printResults();
  process.exitCode = 1;
}
