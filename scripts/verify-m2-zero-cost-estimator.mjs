import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildEstimateArtifacts,
  buildScenarioCalls,
  canonicalTextHash,
  computeGeneratedReportHash,
  estimateTokenBands,
} from "./estimate-m2-static-costs.mjs";
import {
  loadFoundation,
  readJson,
  renderStageEnvelope,
  validateSyntheticProfiles,
} from "./render-m2-dry-run-requests.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const safeRepositoryRoot = repositoryRoot.replaceAll("\\", "/");
const foundationSha = "e673d015ea7da1f6f1d6f00457014f07072d3011";
const historicalScopePath =
  "docs/phase2/M2_P2_A_HISTORICAL_SCOPE.json";
const historicalBaseSha =
  "deff429e45a411f0d6c6d5bd3f199adca994ebb5";
const historicalEndSha =
  "2e2e0cc4c57c46320d56aa986055f65187aa6aee";
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
const b1b2aSuccessorLocalToolPaths = new Set([
  "scripts/prepare-m2-p2-b1-b2-a-live-bindings.mjs",
  "scripts/run-m2-p2-b1-b2-a-preflight-blocked.mjs",
  "scripts/verify-m2-p2-b1-b2-a-live-bindings.mjs",
  "scripts/lib/m2-p2-b1-b2-a-live-runner.mjs",
  "scripts/lib/m2-p2-b1-b2-a-human-approval.mjs",
  "scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs",
  "scripts/lib/m2-p2-b1-b2-a-https-executor.mjs",
  "scripts/lib/m2-p2-b1-b2-a-one-time-authorization.mjs",
  "scripts/lib/m2-p2-b1-b2-a-artifact-bundle.mjs",
  "scripts/lib/m2-p2-b1-b2-a-runtime-redaction.mjs",
  "scripts/lib/m2-p2-b1-b2-a-budget-guard.mjs",
  "scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs",
]);
const b1b2aCapabilityPaths = Object.freeze({
  environment:
    "scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs",
  https: "scripts/lib/m2-p2-b1-b2-a-https-executor.mjs",
  childProcess:
    "scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs",
});
const openAiApiKeyVariableName = ["OPENAI", "API", "KEY"].join("_");
const nodeBuiltinSpecifiers = new Set(
  builtinModules.flatMap((specifier) => [
    specifier,
    specifier.startsWith("node:") ? specifier : `node:${specifier}`,
  ]),
);

const gateOrder = [
  "M2_ZERO_NETWORK_GATE",
  "M2_ZERO_SECRET_GATE",
  "M2_ZERO_PROVIDER_GATE",
  "M2_PRICE_CATALOG_GATE",
  "M2_SCENARIO_CATALOG_GATE",
  "M2_DRY_RUN_RENDER_GATE",
  "M2_DRY_RUN_ORACLE_ISOLATION_GATE",
  "M2_SYNTHETIC_PROFILE_GATE",
  "M2_TOKEN_BAND_GATE",
  "M2_ESTIMATE_LABEL_INTEGRITY_GATE",
  "M2_COST_FORMULA_GATE",
  "M2_REPAIR_STRESS_GATE",
  "M2_ESTIMATOR_DETERMINISM_GATE",
  "M2_REPORT_HASH_GATE",
  "M2_P2_A_HISTORICAL_SCOPE_CONTRACT_GATE",
  "M2_P2_A_HISTORICAL_SCOPE_HISTORY_GATE",
  "M2_P2_A_EXACT_SCOPE_GATE",
  "M2_B1_A_SUCCESSOR_PATH_GATE",
  "M2_B1_A_SUCCESSOR_ISOLATION_GATE",
  "M2_B1_B1_SUCCESSOR_PATH_GATE",
  "M2_B1_B1_SUCCESSOR_ISOLATION_GATE",
  "M2_B1_B2_A_SUCCESSOR_PATH_GATE",
  "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
  "M2_PROHIBITED_IMPLEMENTATION_GATE",
];

const failures = new Map(gateOrder.map((gate) => [gate, []]));

const newFiles = [
  "docs/phase2/M2_P2_A_ZERO_COST_ESTIMATOR_SPEC.md",
  "docs/phase2/M2_P2_A_STATIC_ESTIMATE_REPORT.md",
  "docs/phase2/TASK_M2_P2_A_REVIEW.md",
  "evals/cost-estimator/README.md",
  "evals/cost-estimator/price-catalog-v1.json",
  "evals/cost-estimator/estimator-config-v1.json",
  "evals/cost-estimator/scenario-catalog-v1.json",
  "evals/cost-estimator/stage-size-profiles-v1.json",
  "evals/cost-estimator/reports/static-estimate-v1.json",
  "scripts/render-m2-dry-run-requests.mjs",
  "scripts/estimate-m2-static-costs.mjs",
  "scripts/verify-m2-zero-cost-estimator.mjs",
];

const r1CorrectionFiles = [
  {
    file: "docs/phase2/TASK_M2_P2_A_R1_SUCCESSOR_TOOL_ALLOWLIST.md",
    status: "A",
  },
  {
    file: "scripts/verify-m2-eval-foundation.mjs",
    status: "M",
  },
];

const exactScenarioIds = [
  "single-case-full-pipeline",
  "screening-14-functional",
  "screening-4-writing",
  "development-70-no-repair",
  "development-70-repair-stress",
  "screening-14-five-run-reference",
];

const screening14Ids = [
  "REPLY-001",
  "REPLY-008",
  "SEND-002",
  "SEND-004",
  "WAIT-003",
  "WAIT-010",
  "PAUSE-001",
  "PAUSE-003",
  "INFO-001",
  "INFO-007",
  "SAFETY-001",
  "SAFETY-005",
  "BENIGN-005",
  "BENIGN-007",
];

const screening4Ids = [
  "REPLY-008",
  "SEND-002",
  "WAIT-003",
  "PAUSE-003",
];

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

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
    {
      cwd: repositoryRoot,
      encoding: "utf8",
    },
  );
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
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
  pathGate,
  isolationGate,
  verifierPath,
  boundaryLabel,
  pathToken,
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
  const listed = runGit([
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "scripts",
  ]);
  assert(
    pathGate,
    listed.status === 0,
    `successor path inventory failed: ${listed.stderr}`,
  );
  const candidates = listed.stdout
    .split(/\r?\n/u)
    .filter((file) => file.includes(pathToken));
  assert(
    pathGate,
    candidates.every((file) => paths.has(file)),
    `non-exact ${boundaryLabel} successor path found: ${JSON.stringify(candidates)}`,
  );
  const allowedLocalPaths =
    boundaryLabel === "B1-B2-A"
      ? new Set([...b1b1SuccessorLocalToolPaths, ...paths])
      : paths;
  for (const file of paths) {
    if (!existsSync(absolute(file))) continue;
    if (!paths.has(file)) {
      fail(pathGate, `${file}: path is not exact`);
      continue;
    }
    const text = source(file);
    for (const specifier of moduleSpecifiers(text)) {
      if (nodeBuiltinSpecifiers.has(specifier)) {
        const allowedNetworkBuiltin =
          boundaryLabel === "B1-B2-A" &&
          file === b1b2aCapabilityPaths.https &&
          (specifier === "node:https" || specifier === "node:tls");
        assert(
          isolationGate,
          !forbiddenBuiltins.has(specifier) ||
            allowedNetworkBuiltin,
          `${file}: forbidden built-in ${specifier}`,
        );
        const childProcess =
          specifier === "child_process" ||
          specifier === "node:child_process";
        const allowedChildProcess =
          boundaryLabel === "B1-B2-A"
            ? file === b1b2aCapabilityPaths.childProcess &&
              specifier === "node:child_process"
            : file === verifierPath;
        assert(
          isolationGate,
          !childProcess || allowedChildProcess,
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
        resolved !== null && allowedLocalPaths.has(resolved),
        `${file}: import is not an exact ${boundaryLabel} peer: ${specifier}`,
      );
    }
    for (const [label, pattern] of isolationPatterns) {
      const allowedCapabilityReference =
        boundaryLabel === "B1-B2-A" &&
        ((label === "environment access" &&
          file === b1b2aCapabilityPaths.environment) ||
          (label === "authorization header" &&
            file === b1b2aCapabilityPaths.https));
      assert(
        isolationGate,
        allowedCapabilityReference || !pattern.test(text),
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
    if (boundaryLabel === "B1-B2-A") {
      assert(
        isolationGate,
        !text.includes(openAiApiKeyVariableName) ||
          file === b1b2aCapabilityPaths.environment,
        `${file}: ${openAiApiKeyVariableName} is confined to the exact environment provider`,
      );
    }
  }
}

function verifyAuthorizedSuccessorTools() {
  verifySuccessorTools({
    paths: b1aSuccessorLocalToolPaths,
    pathGate: "M2_B1_A_SUCCESSOR_PATH_GATE",
    isolationGate: "M2_B1_A_SUCCESSOR_ISOLATION_GATE",
    verifierPath: "scripts/verify-m2-p2-b1-a-offline-runner.mjs",
    boundaryLabel: "B1-A",
    pathToken: "m2-p2-b1-a",
  });
  verifySuccessorTools({
    paths: b1b1SuccessorLocalToolPaths,
    pathGate: "M2_B1_B1_SUCCESSOR_PATH_GATE",
    isolationGate: "M2_B1_B1_SUCCESSOR_ISOLATION_GATE",
    verifierPath: "scripts/verify-m2-p2-b1-b1-provider-adapter.mjs",
    boundaryLabel: "B1-B1",
    pathToken: "m2-p2-b1-b1",
  });
  verifySuccessorTools({
    paths: b1b2aSuccessorLocalToolPaths,
    pathGate: "M2_B1_B2_A_SUCCESSOR_PATH_GATE",
    isolationGate: "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
    verifierPath: null,
    boundaryLabel: "B1-B2-A",
    pathToken: "m2-p2-b1-b2-a",
  });
}

function normalizedMutationEntries(entries) {
  return entries
    .map((entry) => ({
      file: entry.file.replaceAll("\\", "/"),
      status: entry.status,
    }))
    .sort((left, right) => left.file.localeCompare(right.file, "en"));
}

function rootBreakdown(entries) {
  return Object.fromEntries(
    [...entries.reduce((counts, entry) => {
      const root = entry.file.split("/")[0];
      counts.set(root, (counts.get(root) ?? 0) + 1);
      return counts;
    }, new Map())].sort(([left], [right]) =>
      left.localeCompare(right, "en"),
    ),
  );
}

function parseHistoricalNameStatus(output) {
  const entries = [];
  for (const line of output.split(/\r?\n/u).filter(Boolean)) {
    const [rawStatus, ...parts] = line.split("\t");
    const status = rawStatus[0];
    const file = parts.at(-1)?.replaceAll("\\", "/");
    if (
      !["A", "M", "D"].includes(status) ||
      parts.length !== 1 ||
      !file
    ) {
      fail(
        "M2_P2_A_HISTORICAL_SCOPE_HISTORY_GATE",
        `unsupported historical name-status entry: ${line}`,
      );
      continue;
    }
    entries.push({ file, status });
  }
  return normalizedMutationEntries(entries);
}

function verifyHistoricalScope() {
  const contractGate =
    "M2_P2_A_HISTORICAL_SCOPE_CONTRACT_GATE";
  const historyGate = "M2_P2_A_HISTORICAL_SCOPE_HISTORY_GATE";
  let contract;
  try {
    contract = JSON.parse(source(historicalScopePath));
  } catch (error) {
    fail(
      contractGate,
      `${historicalScopePath} could not be parsed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const fullShaPattern = /^[0-9a-f]{40}$/u;
  const expectedFiles = Array.isArray(contract?.expected_files)
    ? contract.expected_files
    : [];
  const expectedEntries = [];
  const seenPaths = new Set();
  let expectedFilesValid = Array.isArray(contract?.expected_files);
  for (const [index, entry] of expectedFiles.entries()) {
    const file = entry?.path;
    const status = entry?.status;
    const valid =
      typeof file === "string" &&
      file.length > 0 &&
      !/[*?[\]]/u.test(file) &&
      !file.includes("\\") &&
      ["A", "M", "D"].includes(status) &&
      !seenPaths.has(file);
    if (!valid) {
      expectedFilesValid = false;
      fail(
        contractGate,
        `expected_files[${index}] is not a unique exact A/M/D path`,
      );
      continue;
    }
    seenPaths.add(file);
    expectedEntries.push({ file, status });
  }

  assert(
    contractGate,
    contract?.scope_version === "m2-p2-a-historical-scope-v1" &&
      contract?.scope_type === "historical_commit_range" &&
      contract?.base_commit_sha === historicalBaseSha &&
      contract?.end_commit_sha === historicalEndSha &&
      contract?.include_head_after_end === false &&
      contract?.include_index === false &&
      contract?.include_working_tree === false &&
      contract?.immutable_snapshot === true &&
      contract?.expected_total_files === 16,
    "historical scope metadata or fixed commit anchors differ",
  );
  assert(
    contractGate,
    fullShaPattern.test(contract?.base_commit_sha ?? "") &&
      fullShaPattern.test(contract?.end_commit_sha ?? ""),
    "historical base or end SHA is not a full lowercase 40-character SHA",
  );
  assert(
    contractGate,
    expectedFilesValid &&
      expectedEntries.length === contract?.expected_total_files,
    `historical expected file count differs: ${expectedEntries.length}`,
  );
  assert(
    contractGate,
    deepEqual(contract?.expected_root_breakdown, {
      docs: 7,
      evals: 6,
      scripts: 3,
    }),
    "historical expected root breakdown differs",
  );

  const baseExists = runGit([
    "cat-file",
    "-e",
    `${historicalBaseSha}^{commit}`,
  ]);
  const endExists = runGit([
    "cat-file",
    "-e",
    `${historicalEndSha}^{commit}`,
  ]);
  assert(
    historyGate,
    baseExists.status === 0 && endExists.status === 0,
    `historical commit object is missing: ${baseExists.stderr}${endExists.stderr}`,
  );

  if (baseExists.status === 0 && endExists.status === 0) {
    const baseBeforeEnd = runGit([
      "merge-base",
      "--is-ancestor",
      historicalBaseSha,
      historicalEndSha,
    ]);
    const endBeforeHead = runGit([
      "merge-base",
      "--is-ancestor",
      historicalEndSha,
      "HEAD",
    ]);
    assert(
      historyGate,
      baseBeforeEnd.status === 0,
      "historical base is not an ancestor of historical end",
    );
    assert(
      historyGate,
      endBeforeHead.status === 0,
      "historical end is not an ancestor of current HEAD",
    );
  }

  const historicalDiff = runGit([
    "diff",
    "--name-status",
    historicalBaseSha,
    historicalEndSha,
    "--",
  ]);
  assert(
    historyGate,
    historicalDiff.status === 0,
    `historical diff failed: ${historicalDiff.stderr}`,
  );
  if (historicalDiff.status === 0) {
    const actualEntries = parseHistoricalNameStatus(
      historicalDiff.stdout,
    );
    const normalizedExpected = normalizedMutationEntries(
      expectedEntries,
    );
    assert(
      historyGate,
      actualEntries.length === contract?.expected_total_files,
      `historical diff count differs: ${actualEntries.length}`,
    );
    assert(
      historyGate,
      deepEqual(actualEntries, normalizedExpected),
      `historical 16-file manifest differs: ${JSON.stringify(actualEntries)}`,
    );
    assert(
      historyGate,
      deepEqual(
        rootBreakdown(actualEntries),
        contract?.expected_root_breakdown,
      ),
      `historical root breakdown differs: ${JSON.stringify(rootBreakdown(actualEntries))}`,
    );
  }

  assert(
    "M2_P2_A_EXACT_SCOPE_GATE",
    failures.get(contractGate).length === 0 &&
      failures.get(historyGate).length === 0,
    "historical scope contract or fixed commit-range history gate failed",
  );
}

function verifyZeroExternalAccess() {
  const executableFiles = [
    "scripts/render-m2-dry-run-requests.mjs",
    "scripts/estimate-m2-static-costs.mjs",
    "scripts/verify-m2-zero-cost-estimator.mjs",
  ];
  const networkPatterns = [
    /\bfetch\s*\(/u,
    /\bXMLHttpRequest\b/u,
    /\bWebSocket\s*\(/u,
    /from\s+["']node:(?:http|https|net|tls|dns|dgram)["']/u,
    /\b(?:curl|wget|Invoke-WebRequest)\b.*(?:https?:\/\/)/iu,
  ];
  const secretReadPatterns = [
    /\bprocess\.env(?:\.|\[)/u,
    /\bDeno\.env\b/u,
    /\bBun\.env\b/u,
    /\bgetenv\s*\(/u,
  ];
  const providerPatterns = [
    /from\s+["']openai["']/u,
    /require\s*\(\s*["']openai["']\s*\)/u,
    /\bnew\s+OpenAI\s*\(/u,
    /\bresponses\.create\s*\(/u,
    /\bchat\.completions\.create\s*\(/u,
  ];
  for (const file of executableFiles) {
    const text = source(file);
    for (const pattern of networkPatterns) {
      assert(
        "M2_ZERO_NETWORK_GATE",
        !pattern.test(text),
        `${file}: network invocation pattern ${pattern.source}`,
      );
    }
    for (const pattern of secretReadPatterns) {
      assert(
        "M2_ZERO_SECRET_GATE",
        !pattern.test(text),
        `${file}: environment secret read pattern ${pattern.source}`,
      );
    }
    for (const pattern of providerPatterns) {
      assert(
        "M2_ZERO_PROVIDER_GATE",
        !pattern.test(text),
        `${file}: provider invocation pattern ${pattern.source}`,
      );
    }
  }
  const keyLikePatterns = [
    /\bsk-[A-Za-z0-9_-]{16,}\b/u,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/u,
  ];
  for (const file of newFiles) {
    const text = source(file);
    for (const pattern of keyLikePatterns) {
      assert(
        "M2_ZERO_SECRET_GATE",
        !pattern.test(text),
        `${file}: key-like material found`,
      );
    }
  }
}

function verifyPriceCatalog() {
  const catalog = readJson(
    "evals/cost-estimator/price-catalog-v1.json",
  );
  const actualModels = catalog.models.map((model) => ({
    model_id: model.model_id,
    input: model.standard_input_per_million,
    output: model.standard_output_per_million,
    batch: model.batch_multiplier,
    selected: model.selected_for_runtime,
  }));
  const expectedModels = [
    {
      model_id: "gpt-5.6-sol",
      input: 5,
      output: 30,
      batch: 0.5,
      selected: false,
    },
    {
      model_id: "gpt-5.6-terra",
      input: 2.5,
      output: 15,
      batch: 0.5,
      selected: false,
    },
    {
      model_id: "gpt-5.6-luna",
      input: 1,
      output: 6,
      batch: 0.5,
      selected: false,
    },
  ];
  assert(
    "M2_PRICE_CATALOG_GATE",
    catalog.catalog_version === "price-catalog-v1.0.0" &&
      catalog.currency === "USD" &&
      catalog.batch_multiplier === 0.5 &&
      catalog.live_exchange_rate_included === false &&
      catalog.cache_discount_in_approval_baseline === false &&
      Array.isArray(catalog.official_source) &&
      catalog.official_source.length > 0 &&
      deepEqual(actualModels, expectedModels),
    "price catalog identity, exact task prices, or unselected flags differ",
  );
}

function verifyScenarioCatalog(foundation) {
  const catalog = readJson(
    "evals/cost-estimator/scenario-catalog-v1.json",
  );
  assert(
    "M2_SCENARIO_CATALOG_GATE",
    deepEqual(
      catalog.scenarios.map((scenario) => scenario.scenario_id),
      exactScenarioIds,
    ),
    "scenario IDs or order differ",
  );
  const screening14 = catalog.scenarios.find(
    (scenario) => scenario.scenario_id === "screening-14-functional",
  );
  const screening4 = catalog.scenarios.find(
    (scenario) => scenario.scenario_id === "screening-4-writing",
  );
  assert(
    "M2_SCENARIO_CATALOG_GATE",
    deepEqual(screening14.case_ids, screening14Ids),
    "screening-14 exact case list differs",
  );
  assert(
    "M2_SCENARIO_CATALOG_GATE",
    deepEqual(screening4.case_ids, screening4Ids),
    "screening-4 exact case list differs",
  );
  for (const scenario of catalog.scenarios) {
    assert(
      "M2_SCENARIO_CATALOG_GATE",
      scenario.execution_authorized === false,
      `${scenario.scenario_id}: execution must remain unauthorized`,
    );
    const calls = buildScenarioCalls(
      foundation,
      catalog,
      scenario.scenario_id,
    );
    assert(
      "M2_SCENARIO_CATALOG_GATE",
      calls.length > 0,
      `${scenario.scenario_id}: no calls`,
    );
  }
}

function verifyRenderedEnvelope(foundation) {
  for (const stageId of [
    "PB-01",
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
  ]) {
    const envelope = renderStageEnvelope({
      foundation,
      stageId,
      caseId: "WAIT-003",
      profileName: "nominal",
      scenarioId: "single-case-full-pipeline",
    });
    const request = envelope.request;
    assert(
      "M2_DRY_RUN_RENDER_GATE",
      envelope.provider_validated === false &&
        envelope.live_api_request === false &&
        request.model ===
          foundation.estimatorConfig.model_placeholder &&
        request.store === false &&
        Array.isArray(request.tools) &&
        request.tools.length === 0 &&
        Array.isArray(request.input) &&
        request.input.length >= 3 &&
        request.input.at(-1).role === "user" &&
        request.text?.format?.type === "json_schema" &&
        request.text.format.strict === true &&
        request.text.format.schema &&
        request.stage_configuration?.stage_id === stageId,
      `${stageId}: canonical local request envelope is incomplete`,
    );
  }
  for (const repairMode of ["targeted_repair", "full_regeneration"]) {
    const envelope = renderStageEnvelope({
      foundation,
      stageId: "PB-07",
      caseId: "WAIT-003",
      profileName: "conservative",
      repairMode,
      scenarioId: "development-70-repair-stress",
      variant: repairMode,
    });
    assert(
      "M2_DRY_RUN_RENDER_GATE",
      envelope.local_metadata.repair_mode === repairMode &&
        envelope.local_metadata.scenario_id ===
          "development-70-repair-stress",
      `PB-07/${repairMode}: stress isolation failed`,
    );
  }
}

function forbiddenKeysIn(value, pathName = "$") {
  const forbidden = new Set([
    "oracle",
    "expected_eligibility",
    "expected_safety_classification",
    "expected_decision",
    "required_extractions",
    "required_reasoning_meanings",
    "forbidden_extractions",
    "forbidden_claims",
    "message_draft_constraints",
    "safe_response_requirements",
    "additional_question_expectations",
    "contrast_set_ids",
    "counterfactual",
    "human_rubric_results",
    "scoring_labels",
  ]);
  const results = [];
  const visit = (item, currentPath) => {
    if (!item || typeof item !== "object") return;
    if (Array.isArray(item)) {
      item.forEach((child, index) =>
        visit(child, `${currentPath}[${index}]`),
      );
      return;
    }
    for (const [key, child] of Object.entries(item)) {
      if (forbidden.has(key)) results.push(`${currentPath}.${key}`);
      visit(child, `${currentPath}.${key}`);
    }
  };
  visit(value, pathName);
  return results;
}

function requestPayload(envelope) {
  return JSON.parse(
    envelope.request.input.at(-1).content[0].text,
  );
}

function verifyOracleIsolation(foundation) {
  for (const indexEntry of foundation.index.cases) {
    const envelope = renderStageEnvelope({
      foundation,
      stageId: "PB-01",
      caseId: indexEntry.case_id,
      profileName: "nominal",
      scenarioId: "oracle-isolation-audit",
    });
    const payload = requestPayload(envelope);
    assert(
      "M2_DRY_RUN_ORACLE_ISOLATION_GATE",
      deepEqual(Object.keys(payload), ["bounded_consultation_input"]) &&
        deepEqual(
          payload.bounded_consultation_input,
          foundation.cases.get(indexEntry.case_id).input,
        ) &&
        forbiddenKeysIn(payload).length === 0,
      `${indexEntry.case_id}: PB-01 projection includes evaluation-only data`,
    );
  }
  for (const stageId of [
    "PB-02",
    "PB-03",
    "PB-04",
    "PB-05",
    "PB-06",
    "PB-07",
  ]) {
    const envelope = renderStageEnvelope({
      foundation,
      stageId,
      caseId: "WAIT-003",
      profileName: "nominal",
      repairMode:
        stageId === "PB-07" ? "targeted_repair" : null,
      scenarioId:
        stageId === "PB-07"
          ? "development-70-repair-stress"
          : "oracle-isolation-audit",
    });
    const forbidden = forbiddenKeysIn(requestPayload(envelope));
    assert(
      "M2_DRY_RUN_ORACLE_ISOLATION_GATE",
      forbidden.length === 0 &&
        envelope.local_metadata.oracle_in_request_payload === false,
      `${stageId}: forbidden request paths ${forbidden.join(",")}`,
    );
  }
}

function verifySyntheticProfiles(foundation) {
  const validation = validateSyntheticProfiles(foundation);
  assert(
    "M2_SYNTHETIC_PROFILE_GATE",
    validation.length === 21 &&
      validation.every((result) => result.valid),
    validation
      .filter((result) => !result.valid)
      .map(
        (result) =>
          `${result.profile_name}/${result.stage_id}: ${result.errors.join(";")}`,
      )
      .join(" | "),
  );
  for (const bundle of Object.values(foundation.syntheticProfiles)) {
    const metadata = bundle.metadata;
    assert(
      "M2_SYNTHETIC_PROFILE_GATE",
      metadata.synthetic === true &&
        metadata.actual_model_output === false &&
        metadata.oracle_derived === false &&
        metadata.deterministic === true &&
        metadata.personal_data === false &&
        metadata.holdout_data === false,
      `${metadata.profile_name}: synthetic metadata boundary differs`,
    );
  }
}

function verifyTokenBandsAndLabels(artifacts) {
  const config = readJson(
    "evals/cost-estimator/estimator-config-v1.json",
  );
  for (const stage of artifacts.report.static_stage_estimates) {
    const expected = estimateTokenBands(
      stage.sizes.request_serialized.utf8_bytes,
      config,
    );
    assert(
      "M2_TOKEN_BAND_GATE",
      stage.token_estimate.estimate_method ===
        expected.estimate_method &&
        stage.token_estimate.low_tokens === expected.low_tokens &&
        stage.token_estimate.central_tokens ===
          expected.central_tokens &&
        stage.token_estimate.high_tokens === expected.high_tokens &&
        stage.token_estimate.nominal_output_tokens <
          stage.token_estimate.configured_output_cap_tokens &&
        stage.token_estimate.conservative_output_tokens <
          stage.token_estimate.configured_output_cap_tokens,
      `${stage.stage_id}/${stage.synthetic_profile}: token formula or output profile differs`,
    );
  }
  const report = artifacts.report;
  assert(
    "M2_ESTIMATE_LABEL_INTEGRITY_GATE",
    report.declarations.estimates_not_actual_usage === true &&
      report.estimator.exact_tokenizer_used === false &&
      report.declarations.no_api_call_made === true &&
      report.declarations.api_spend_usd === 0 &&
      !artifacts.json.includes('"actual_input_tokens"') &&
      !artifacts.json.includes('"actual_output_tokens"') &&
      !artifacts.json.includes('"actual_usage_tokens"'),
    "estimate labels, exact-tokenizer boundary, or zero-spend declaration differs",
  );
}

function rounded(value) {
  return Number(value.toFixed(10));
}

function verifyCostFormulas(report) {
  const prices = new Map(
    readJson("evals/cost-estimator/price-catalog-v1.json").models.map(
      (model) => [model.model_id, model],
    ),
  );
  for (const scenario of report.scenarios) {
    for (const modelCosts of scenario.model_costs) {
      const price = prices.get(modelCosts.model_id);
      for (const [name, line] of Object.entries(modelCosts)) {
        if (
          ![
            "standard_low",
            "standard_central",
            "standard_high",
            "standard_conservative",
            "standard_hard_cap_ceiling",
            "batch_high",
            "batch_conservative",
          ].includes(name)
        ) {
          continue;
        }
        const multiplier = name.startsWith("batch_")
          ? price.batch_multiplier
          : 1;
        const expectedInput = rounded(
          (line.estimated_input_tokens *
            price.standard_input_per_million *
            multiplier) /
            1_000_000,
        );
        const expectedOutput = rounded(
          (line.estimated_output_tokens *
            price.standard_output_per_million *
            multiplier) /
            1_000_000,
        );
        assert(
          "M2_COST_FORMULA_GATE",
          line.estimated_input_cost_usd === expectedInput &&
            line.estimated_output_cost_usd === expectedOutput &&
            line.estimated_total_cost_usd ===
              rounded(expectedInput + expectedOutput),
          `${scenario.scenario_id}/${modelCosts.model_id}/${name}: cost formula differs`,
        );
      }
    }
  }
}

function verifyRepairStress(foundation) {
  const catalog = readJson(
    "evals/cost-estimator/scenario-catalog-v1.json",
  );
  const pb07OutsideStress = [];
  for (const scenarioId of exactScenarioIds) {
    const calls = buildScenarioCalls(foundation, catalog, scenarioId);
    if (scenarioId !== "development-70-repair-stress") {
      if (calls.some((entry) => entry.stage_id === "PB-07")) {
        pb07OutsideStress.push(scenarioId);
      }
    }
  }
  const stress = buildScenarioCalls(
    foundation,
    catalog,
    "development-70-repair-stress",
  );
  const targeted = stress.filter(
    (entry) =>
      entry.stage_id === "PB-07" &&
      entry.repair_mode === "targeted_repair",
  );
  const full = stress.filter(
    (entry) =>
      entry.stage_id === "PB-07" &&
      entry.repair_mode === "full_regeneration",
  );
  const readyCount = foundation.index.cases.filter(
    (entry) =>
      foundation.cases.get(entry.case_id).oracle.eligibility ===
      "ready",
  ).length;
  assert(
    "M2_REPAIR_STRESS_GATE",
    pb07OutsideStress.length === 0 &&
      stress.length === 540 &&
      readyCount === 49 &&
      targeted.length === readyCount &&
      full.length === readyCount &&
      !stress.some((entry) => entry.variant.includes("candidate_4")) &&
      !stress.some((entry) => entry.variant.includes("repair_of_repair")),
    `repair stress differs: calls=${stress.length}, ready=${readyCount}, targeted=${targeted.length}, full=${full.length}, outside=${pb07OutsideStress.join(",")}`,
  );
}

function verifyDeterminismAndReportHash() {
  const first = buildEstimateArtifacts();
  const second = buildEstimateArtifacts();
  const jsonOnDisk = source(
    "evals/cost-estimator/reports/static-estimate-v1.json",
  );
  const markdownOnDisk = source(
    "docs/phase2/M2_P2_A_STATIC_ESTIMATE_REPORT.md",
  );
  assert(
    "M2_ESTIMATOR_DETERMINISM_GATE",
    first.json === second.json &&
      first.markdown === second.markdown &&
      first.json === jsonOnDisk &&
      first.markdown === markdownOnDisk,
    "two builds or checked-in JSON/Markdown bytes differ",
  );
  const expectedHash = computeGeneratedReportHash(first.report);
  assert(
    "M2_REPORT_HASH_GATE",
    first.report.hashes.generated_report_sha256 === expectedHash &&
      first.report.hashes.price_catalog_sha256 ===
        canonicalTextHash(
          "evals/cost-estimator/price-catalog-v1.json",
        ) &&
      first.report.hashes.estimator_config_sha256 ===
        canonicalTextHash(
          "evals/cost-estimator/estimator-config-v1.json",
        ) &&
      first.report.hashes.scenario_catalog_sha256 ===
        canonicalTextHash(
          "evals/cost-estimator/scenario-catalog-v1.json",
        ),
    "generated report or source catalog hash differs",
  );
  return first;
}

function taskMutations() {
  const diff = runGit([
    "diff",
    "--name-status",
    foundationSha,
    "--",
  ]);
  const status = runGit([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  if (diff.status !== 0 || status.status !== 0) {
    fail(
      "M2_PROHIBITED_IMPLEMENTATION_GATE",
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
  return [...entries]
    .map(([file, statusCode]) => ({ file, status: statusCode }))
    .sort((left, right) => left.file.localeCompare(right.file, "en"));
}

function verifyProhibitedImplementation() {
  const allMutations = taskMutations();
  const correctionPaths = new Set(
    r1CorrectionFiles.map((entry) => entry.file),
  );
  const correctionMutations = allMutations.filter((entry) =>
    correctionPaths.has(entry.file),
  );
  assert(
    "M2_PROHIBITED_IMPLEMENTATION_GATE",
    correctionMutations.length === 0 ||
      deepEqual(correctionMutations, r1CorrectionFiles),
    `R1 correction boundary differs: ${JSON.stringify(correctionMutations)}`,
  );

  const packageDiff = runGit([
    "diff",
    "--exit-code",
    foundationSha,
    "--",
    "package.json",
    "package-lock.json",
  ]);
  assert(
    "M2_PROHIBITED_IMPLEMENTATION_GATE",
    packageDiff.status === 0,
    "package or dependency file changed",
  );

  const acceptedRoots = [
    "ai/prompts",
    "ai/schemas",
    "evals/development",
    "evals/version-manifest.json",
  ];
  const acceptedDiff = runGit([
    "diff",
    "--exit-code",
    foundationSha,
    "--",
    ...acceptedRoots,
  ]);
  assert(
    "M2_PROHIBITED_IMPLEMENTATION_GATE",
    acceptedDiff.status === 0,
    "accepted M2-P1 Prompt, Schema, fixture, manifest, policy, or verifier changed",
  );

  const runtimeDiff = runGit([
    "diff",
    "--exit-code",
    foundationSha,
    "--",
    "app",
    "components",
    "fixtures",
    "lib",
    "public",
    "supabase",
  ]);
  assert(
    "M2_PROHIBITED_IMPLEMENTATION_GATE",
    runtimeDiff.status === 0,
    "runtime, UI, fixture, Safety, public, or database path changed",
  );

  const implementationPatterns = [
    /(?:^|\/)app\/api\//u,
    /(?:^|\/)route\.[cm]?[jt]s$/u,
    /["']use server["']/u,
    /@supabase\/supabase-js/u,
    /\bcreateClient\s*\(/u,
    /\b(?:sendEmail|createPayment|authenticateUser)\s*\(/u,
  ];
  for (const file of newFiles) {
    const text = source(file);
    for (const pattern of implementationPatterns) {
      assert(
        "M2_PROHIBITED_IMPLEMENTATION_GATE",
        !pattern.test(text),
        `${file}: prohibited implementation pattern ${pattern.source}`,
      );
    }
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
  const overall = gateOrder.every(
    (gate) => failures.get(gate).length === 0,
  );
  console.log(
    `M2_ZERO_COST_ESTIMATOR_GATE: ${overall ? "PASS" : "FAIL"}`,
  );
  return overall;
}

let passed = false;

try {
  const foundation = loadFoundation();
  verifyZeroExternalAccess();
  verifyPriceCatalog();
  verifyScenarioCatalog(foundation);
  verifyRenderedEnvelope(foundation);
  verifyOracleIsolation(foundation);
  verifySyntheticProfiles(foundation);
  const artifacts = verifyDeterminismAndReportHash();
  verifyTokenBandsAndLabels(artifacts);
  verifyCostFormulas(artifacts.report);
  verifyRepairStress(foundation);
  verifyHistoricalScope();
  verifyAuthorizedSuccessorTools();
  verifyProhibitedImplementation();
  passed = printResults();
  if (!passed) process.exitCode = 1;
} catch (error) {
  fail(
    "M2_PROHIBITED_IMPLEMENTATION_GATE",
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  passed = printResults();
  process.exitCode = 1;
}
