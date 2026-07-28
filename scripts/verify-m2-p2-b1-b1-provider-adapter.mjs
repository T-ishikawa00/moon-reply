import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import {
  B1B1,
  absolute,
  buildAllStageRequests,
  canonicalText,
  compactHash,
  readJson,
  repositoryRoot,
  sha256,
  validateJsonSchema,
  validateStageRequest,
} from "./lib/m2-p2-b1-b1-request-builder.mjs";
import { assertBudgetBeforeStage, createUsageLedger } from "./lib/m2-p2-b1-b1-usage-ledger.mjs";
import { assertArtifactSafe } from "./lib/m2-p2-b1-b1-redaction.mjs";
import {
  buildProviderAdapterEvidence,
  implementationManifest,
  reportPaths,
} from "./prepare-m2-p2-b1-b1-provider-adapter.mjs";
import { parseNetworkBlockedArguments } from "./run-m2-p2-b1-b1-network-blocked.mjs";

const historicalScopePath =
  "docs/phase2/M2_P2_B1_B1_HISTORICAL_SCOPE.json";
const historicalBaseSha =
  "2f9fa4f2aa0616a03ec716bf0c09e1d0e0df038e";
const historicalEndSha =
  "efdf10067fb3c1b4072c891ab5f3f1d2c949de55";
const safeRepositoryRoot = repositoryRoot.replaceAll("\\", "/");
const tenImplementationScriptPaths = [
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
];
const authorizedSuccessorScriptPaths = new Set([
  ...tenImplementationScriptPaths,
  "scripts/lib/m2-p2-b1-b1-artifact-sanitizer.mjs",
]);
const b1b2aSuccessorScriptPaths = new Set([
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
const b1b2b0SuccessorScriptPaths = new Set([
  "scripts/prepare-m2-p2-b1-b2-b0-execution-package.mjs",
  "scripts/run-m2-p2-b1-b2-b0-preflight-blocked.mjs",
  "scripts/verify-m2-p2-b1-b2-b0-execution-package.mjs",
  "scripts/run-m2-p2-b1-b2-b-paid-once.mjs",
  "scripts/lib/m2-p2-b1-b2-b0-approval-record.mjs",
  "scripts/lib/m2-p2-b1-b2-b0-paid-cli.mjs",
  "scripts/lib/m2-p2-b1-b2-b0-local-filesystem.mjs",
  "scripts/lib/m2-p2-b1-b2-b0-price-snapshot.mjs",
  "scripts/lib/m2-p2-b1-b2-b0-external-paths.mjs",
]);
const b1b2aCapabilityPaths = Object.freeze({
  environment:
    "scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs",
  https: "scripts/lib/m2-p2-b1-b2-a-https-executor.mjs",
  childProcess:
    "scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs",
});
const b1b2b0CapabilityPaths = Object.freeze({
  localFileSystem:
    "scripts/lib/m2-p2-b1-b2-b0-local-filesystem.mjs",
});
const openAiApiKeyVariableName = ["OPENAI", "API", "KEY"].join("_");

const gateOrder = [
  "M2_B1_B1_HISTORICAL_SCOPE_CONTRACT_GATE",
  "M2_B1_B1_HISTORICAL_SCOPE_HISTORY_GATE",
  "M2_B1_B1_EXACT_SCOPE_GATE",
  "M2_B1_B2_A_SUCCESSOR_PATH_GATE",
  "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
  "M2_B1_B2_B0_SUCCESSOR_PATH_GATE",
  "M2_B1_B2_B0_SUCCESSOR_ISOLATION_GATE",
  "M2_B1_B1_CONTRACT_LINK_GATE",
  "M2_B1_B1_CASE_GATE",
  "M2_B1_B1_MODEL_CANDIDATE_GATE",
  "M2_B1_B1_MODEL_NON_SELECTION_GATE",
  "M2_B1_B1_STAGE_GATE",
  "M2_B1_B1_REQUEST_PROFILE_GATE",
  "M2_B1_B1_REQUEST_HASH_GATE",
  "M2_B1_B1_JSON_SCHEMA_MODE_GATE",
  "M2_B1_B1_OUTPUT_CAP_GATE",
  "M2_B1_B1_RESPONSE_PARSER_GATE",
  "M2_B1_B1_REFUSAL_GATE",
  "M2_B1_B1_INCOMPLETE_GATE",
  "M2_B1_B1_USAGE_GATE",
  "M2_B1_B1_USAGE_COST_GATE",
  "M2_B1_B1_BUDGET_GUARD_GATE",
  "M2_B1_B1_RETURNED_MODEL_GATE",
  "M2_B1_B1_NETWORK_INTERLOCK_GATE",
  "M2_B1_B1_ZERO_SECRET_RESOLUTION_GATE",
  "M2_B1_B1_ZERO_EXECUTOR_CALL_GATE",
  "M2_B1_B1_ZERO_PROVIDER_CALL_GATE",
  "M2_B1_B1_ZERO_SPEND_GATE",
  "M2_B1_B1_NO_RETRY_GATE",
  "M2_B1_B1_NO_REPAIR_GATE",
  "M2_B1_B1_NO_FALLBACK_GATE",
  "M2_B1_B1_ORACLE_ISOLATION_GATE",
  "M2_B1_B1_HOLDOUT_ISOLATION_GATE",
  "M2_B1_B1_REAL_USER_DATA_GATE",
  "M2_B1_B1_REDACTION_GATE",
  "M2_B1_B1_ARTIFACT_SANITIZER_GATE",
  "M2_B1_B1_FAILURE_MATRIX_GATE",
  "M2_B1_B1_DETERMINISM_GATE",
  "M2_B1_B1_REPORT_HASH_GATE",
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

function statusBreakdown(entries) {
  return Object.fromEntries(
    ["A", "M", "D"].map((status) => [
      status,
      entries.filter((entry) => entry.status === status).length,
    ]),
  );
}

function parseHistoricalNameStatus(output, historyGate) {
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
      fail(historyGate, `unsupported historical name-status entry: ${line}`);
      continue;
    }
    entries.push({ file, status });
  }
  return normalized(entries);
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

function verifyExactScope(manifest) {
  const contractGate = "M2_B1_B1_HISTORICAL_SCOPE_CONTRACT_GATE";
  const historyGate = "M2_B1_B1_HISTORICAL_SCOPE_HISTORY_GATE";
  let contract;
  try {
    contract = readJson(historicalScopePath);
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
  const expected = normalized(expectedEntries);
  const implementationExpected = normalized(
    implementationManifest.map((entry) => ({
      file: entry.path,
      status: entry.status,
    })),
  );
  const manifestExpected = normalized(
    manifest.implementation_manifest.map((entry) => ({
      file: entry.path,
      status: entry.status,
    })),
  );

  assert(
    contractGate,
    contract?.scope_version === "m2-p2-b1-b1-historical-scope-v1" &&
      contract?.scope_type === "historical_commit_range" &&
      contract?.base_commit_sha === historicalBaseSha &&
      contract?.end_commit_sha === historicalEndSha &&
      contract?.include_head_after_end === false &&
      contract?.include_index === false &&
      contract?.include_working_tree === false &&
      contract?.immutable_snapshot === true &&
      contract?.expected_total_files === 39,
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
      expected.length === 39 &&
      deepEqual(contract?.expected_status_breakdown, {
        A: 35,
        M: 4,
        D: 0,
      }) &&
      deepEqual(contract?.expected_root_breakdown, {
        docs: 8,
        evals: 21,
        scripts: 10,
      }) &&
      deepEqual(expected, implementationExpected) &&
      deepEqual(expected, manifestExpected),
    "historical expected files, counts, roots, or accepted manifests differ",
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
    assert(
      historyGate,
      runGit([
        "merge-base",
        "--is-ancestor",
        historicalBaseSha,
        historicalEndSha,
      ]).status === 0,
      "historical base is not an ancestor of historical end",
    );
    assert(
      historyGate,
      runGit([
        "merge-base",
        "--is-ancestor",
        historicalEndSha,
        "HEAD",
      ]).status === 0,
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
  const actual =
    historicalDiff.status === 0
      ? parseHistoricalNameStatus(historicalDiff.stdout, historyGate)
      : [];
  assert(
    historyGate,
    deepEqual(actual, expected),
    `historical 39-file manifest differs: ${JSON.stringify(actual)}`,
  );
  assert(
    historyGate,
    actual.length === 39 &&
      deepEqual(statusBreakdown(actual), { A: 35, M: 4, D: 0 }) &&
      deepEqual(rootBreakdown(actual), {
        docs: 8,
        evals: 21,
        scripts: 10,
      }),
    "historical A/M/D counts or root breakdown differ",
  );
  assert(
    "M2_B1_B1_EXACT_SCOPE_GATE",
    failures.get(contractGate).length === 0 &&
      failures.get(historyGate).length === 0,
    "historical scope contract or fixed commit-range history gate failed",
  );
  assert(
    "M2_B1_B1_EXACT_SCOPE_GATE",
    !existsSync(
      absolute("scripts/lib/m2-p2-b1-b1-artifact-sanitizer.mjs"),
    ),
    "artifact sanitizer must remain inside redaction.mjs",
  );
}

function verifyB1b2aSuccessorTools() {
  const listed = runGit([
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "scripts",
  ]);
  assert(
    "M2_B1_B2_A_SUCCESSOR_PATH_GATE",
    listed.status === 0,
    `successor path inventory failed: ${listed.stderr}`,
  );
  const candidates = listed.stdout
    .split(/\r?\n/u)
    .filter((file) => file.includes("m2-p2-b1-b2-a"));
  assert(
    "M2_B1_B2_A_SUCCESSOR_PATH_GATE",
    candidates.every((file) => b1b2aSuccessorScriptPaths.has(file)),
    `non-exact B1-B2-A successor path found: ${JSON.stringify(candidates)}`,
  );

  const builtins = new Set(
    builtinModules.flatMap((name) => [
      name,
      name.startsWith("node:") ? name : `node:${name}`,
    ]),
  );
  const forbiddenNetworkBuiltins = new Set(
    ["http", "http2", "https", "net", "tls", "dns", "dgram"].flatMap(
      (name) => [name, `node:${name}`],
    ),
  );
  const allowedLocalPaths = new Set([
    ...authorizedSuccessorScriptPaths,
    ...b1b2aSuccessorScriptPaths,
  ]);
  for (const file of b1b2aSuccessorScriptPaths) {
    if (!existsSync(absolute(file))) continue;
    const text = canonicalText(file);
    for (const specifier of moduleSpecifiers(text)) {
      if (builtins.has(specifier)) {
        const allowedNetworkBuiltin =
          file === b1b2aCapabilityPaths.https &&
          (specifier === "node:https" || specifier === "node:tls");
        assert(
          "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
          !forbiddenNetworkBuiltins.has(specifier) ||
            allowedNetworkBuiltin,
          `${file}: forbidden network built-in ${specifier}`,
        );
        const childProcess =
          specifier === "child_process" ||
          specifier === "node:child_process";
        assert(
          "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
          !childProcess ||
            ((file === b1b2aCapabilityPaths.childProcess ||
              file ===
                "scripts/verify-m2-p2-b1-b2-a-live-bindings.mjs") &&
              specifier === "node:child_process"),
          `${file}: child_process is confined to the exact execution guard or historical verifier`,
        );
        continue;
      }
      const resolved = specifier.startsWith(".")
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(file), specifier),
          )
        : null;
      assert(
        "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
        resolved !== null && allowedLocalPaths.has(resolved),
        `${file}: import is not an exact B1-B2-A or B1-B1 peer: ${specifier}`,
      );
    }
    assert(
      "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
      !/\bprocess\.env(?:\.|\[)/u.test(text) ||
        file === b1b2aCapabilityPaths.environment,
      `${file}: environment access is confined to the exact environment provider`,
    );
    assert(
      "M2_B1_B2_A_SUCCESSOR_ISOLATION_GATE",
      !text.includes(openAiApiKeyVariableName) ||
        file === b1b2aCapabilityPaths.environment,
      `${file}: ${openAiApiKeyVariableName} is confined to the exact environment provider`,
    );
  }
}

function verifyB1b2b0SuccessorTools() {
  const pathGate = "M2_B1_B2_B0_SUCCESSOR_PATH_GATE";
  const isolationGate = "M2_B1_B2_B0_SUCCESSOR_ISOLATION_GATE";
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
    .filter(
      (file) =>
        file.includes("m2-p2-b1-b2-b0") ||
        file.includes("m2-p2-b1-b2-b-paid"),
    );
  assert(
    pathGate,
    candidates.every((file) => b1b2b0SuccessorScriptPaths.has(file)),
    `non-exact B1-B2-B0 successor path found: ${JSON.stringify(candidates)}`,
  );

  const builtins = new Set(
    builtinModules.flatMap((name) => [
      name,
      name.startsWith("node:") ? name : `node:${name}`,
    ]),
  );
  const forbiddenNetworkBuiltins = new Set([
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
  const localFileSystemBuiltins = new Set([
    "fs",
    "fs/promises",
    "path",
    "os",
    "node:fs",
    "node:fs/promises",
    "node:path",
    "node:os",
  ]);
  const isolationPatterns = [
    ["network invocation", /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(/u],
    [
      "environment access",
      /\bprocess\.env(?:\.|\[)|\bDeno\.env\b|\bBun\.env\b|\bgetenv\s*\(/u,
    ],
    [
      "environment enumeration",
      /\bObject\.(?:keys|values|entries)\s*\(\s*process\b/u,
    ],
    [
      "provider SDK",
      /\bnew\s+(?:OpenAI|Anthropic|GoogleGenerativeAI|CohereClient|MistralClient)\s*\(/u,
    ],
    [
      "database SDK",
      /@supabase\/supabase-js|from\s+["'](?:pg|mysql2|sqlite3)["']/u,
    ],
    [
      "auth, payment, or email SDK",
      /from\s+["'](?:next-auth|stripe|nodemailer|@sendgrid\/mail)["']/u,
    ],
    [
      "application import",
      /from\s+["'](?:@\/|\.\.?\/)+(?:app|components|lib\/(?:safety|legal|supabase))\//u,
    ],
  ];
  const secretPatterns = [
    /\bsk-[A-Za-z0-9_-]{16,}\b/u,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/u,
  ];
  const allowedLocalPaths = new Set([
    ...authorizedSuccessorScriptPaths,
    ...b1b2aSuccessorScriptPaths,
    ...b1b2b0SuccessorScriptPaths,
  ]);
  for (const file of b1b2b0SuccessorScriptPaths) {
    if (!existsSync(absolute(file))) continue;
    const text = canonicalText(file);
    for (const specifier of moduleSpecifiers(text)) {
      if (builtins.has(specifier)) {
        assert(
          isolationGate,
          !forbiddenNetworkBuiltins.has(specifier),
          `${file}: forbidden network built-in ${specifier}`,
        );
        assert(
          isolationGate,
          !localFileSystemBuiltins.has(specifier) ||
            file === b1b2b0CapabilityPaths.localFileSystem,
          `${file}: ${specifier} is confined to the exact local-filesystem owner`,
        );
        assert(
          isolationGate,
          specifier !== "child_process" &&
            specifier !== "node:child_process",
          `${file}: B1-B2-B0 has no direct child-process capability`,
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
        `${file}: import is not an exact B1-B2-B0, B1-B2-A, or B1-B1 peer: ${specifier}`,
      );
    }
    for (const [label, pattern] of isolationPatterns) {
      assert(isolationGate, !pattern.test(text), `${file}: ${label}`);
    }
    for (const pattern of secretPatterns) {
      assert(
        isolationGate,
        !pattern.test(text),
        `${file}: key-like literal`,
      );
    }
    assert(
      isolationGate,
      !text.includes(openAiApiKeyVariableName),
      `${file}: B1-B2-B0 may not directly name or read the environment secret`,
    );
  }
}

function verifyContracts(evidence) {
  const provider = readJson(
    "evals/calibration/b1b1/provider-adapter-contract-v1.json",
  );
  const requestProfile = readJson(
    "evals/calibration/b1b1/request-profile-v1.json",
  );
  const responseProfile = readJson(
    "evals/calibration/b1b1/response-profile-v1.json",
  );
  const usagePolicy = readJson(
    "evals/calibration/b1b1/usage-policy-v1.json",
  );
  const interlock = readJson(
    "evals/calibration/b1b1/network-interlock-v1.json",
  );
  const approval = readJson(
    "evals/calibration/b1b1/approval-lock-v1.json",
  );
  const secret = readJson(
    "evals/calibration/b1b1/secret-boundary-v1.json",
  );
  for (const [data, schemaPath] of [
    [
      provider,
      "evals/calibration/b1b1/schemas/provider-adapter-contract.schema.json",
    ],
    [
      requestProfile,
      "evals/calibration/b1b1/schemas/request-profile.schema.json",
    ],
    [
      responseProfile,
      "evals/calibration/b1b1/schemas/response-profile.schema.json",
    ],
    [usagePolicy, "evals/calibration/b1b1/schemas/usage-policy.schema.json"],
    [
      interlock,
      "evals/calibration/b1b1/schemas/network-interlock.schema.json",
    ],
    [
      evidence.manifest,
      "evals/calibration/b1b1/schemas/report-manifest.schema.json",
    ],
  ]) {
    const schema = readJson(schemaPath);
    const errors = validateJsonSchema(data, schema);
    assert(
      "M2_B1_B1_CONTRACT_LINK_GATE",
      errors.length === 0,
      `${schemaPath}: ${errors.join("; ")}`,
    );
  }
  assert(
    "M2_B1_B1_CONTRACT_LINK_GATE",
    [
      provider.source_b0_contract_hash,
      approval.source_b0_contract_hash,
      evidence.request.source_b0_contract_hash,
    ].every((value) => value === B1B1.b0ContractHash),
    "B0 contract linkage differs",
  );
  assert(
    "M2_B1_B1_CASE_GATE",
    provider.case_id === B1B1.caseId &&
      approval.authorized_case === B1B1.caseId &&
      evidence.request.case_id === B1B1.caseId,
    "WAIT-003 identity differs",
  );
  assert(
    "M2_B1_B1_MODEL_CANDIDATE_GATE",
    provider.requested_model === B1B1.model &&
      approval.authorized_model_candidate === B1B1.model &&
      evidence.request.requested_model === B1B1.model,
    "Luna candidate identity differs",
  );
  assert(
    "M2_B1_B1_MODEL_NON_SELECTION_GATE",
    provider.selected_for_product === false &&
      provider.selected_for_baseline === false,
    "candidate was selected as product or baseline",
  );
  assert(
    "M2_B1_B1_STAGE_GATE",
    deepEqual(provider.stage_ids, B1B1.stageIds) &&
      deepEqual(approval.authorized_stage_ids, B1B1.stageIds) &&
      evidence.request.stage_count === 6,
    "PB-01 through PB-06 Stage boundary differs",
  );
  assert(
    "M2_B1_B1_OUTPUT_CAP_GATE",
    deepEqual(requestProfile.stage_output_caps, B1B1.stageCaps) &&
      Object.values(B1B1.stageCaps).reduce((sum, value) => sum + value, 0) ===
        20500,
    "Stage caps differ",
  );
  assert(
    "M2_B1_B1_BUDGET_GUARD_GATE",
    usagePolicy.static_hard_cap_usd === B1B1.staticHardCapUsd &&
      usagePolicy.static_hard_cap_usd <= usagePolicy.preflight_ceiling_usd &&
      Object.values(usagePolicy.stage_hard_caps_usd).reduce(
        (sum, value) => Number((sum + value).toFixed(6)),
        0,
      ) === B1B1.staticHardCapUsd &&
      assertBudgetBeforeStage({
        ledger: createUsageLedger(),
        nextStageId: "PB-01",
        usagePolicy,
      }).passed === true,
    "static or sequential budget guard differs",
  );
  assert(
    "M2_B1_B1_NETWORK_INTERLOCK_GATE",
    interlock.live_execution_authorized === false &&
      interlock.paid_run_authorized === false &&
      interlock.network_executor_bound === false &&
      interlock.secret_provider_bound === false &&
      interlock.required_stop_code === "LIVE_EXECUTION_NOT_AUTHORIZED" &&
      interlock.cli_override_allowed === false &&
      interlock.config_override_allowed === false,
    "network interlock differs",
  );
  assert(
    "M2_B1_B1_ZERO_SECRET_RESOLUTION_GATE",
    secret.interface_only === true &&
      secret.live_implementation_present === false &&
      secret.environment_read_allowed === false &&
      secret.environment_enumeration_allowed === false &&
      secret.network_blocked_resolution_count === 0,
    "secret-provider contract differs",
  );
  return { provider, requestProfile, responseProfile, usagePolicy };
}

function verifyRequests(evidence, requestProfile) {
  const requests = buildAllStageRequests();
  assert(
    "M2_B1_B1_REQUEST_PROFILE_GATE",
    requests.every(
      (request) =>
        request.method === "POST" &&
        request.endpoint_path === B1B1.endpointPath &&
        request.body.model === B1B1.model &&
        request.body.store === false &&
        request.body.tools.length === 0 &&
        request.body.stream === false &&
        request.body.background === false &&
        request.body.service_tier === "default" &&
        request.body.truncation === "disabled" &&
        request.body.reasoning.effort === "low",
    ),
    "fixed request profile differs",
  );
  assert(
    "M2_B1_B1_JSON_SCHEMA_MODE_GATE",
    requests.every(
      (request) =>
        request.body.text.format.type === "json_schema" &&
        request.body.text.format.strict === true &&
        request.body.text.format.schema &&
        typeof request.body.text.format.name === "string",
    ),
    "strict JSON Schema output mode differs",
  );
  const registeredPass = requests.every((request) => {
    const registered =
      requestProfile.registered_request_hashes[request.stage_id];
    try {
      validateStageRequest(request);
      return (
        request.request_body_sha256 === registered.request_body_sha256 &&
        request.request_contract_sha256 ===
          registered.request_contract_sha256
      );
    } catch {
      return false;
    }
  });
  const base = requests[0];
  const mutationActions = [
    (item) => { item.case_id = "WAIT-004"; },
    (item) => { item.requested_model = "other"; },
    (item) => { item.stage_id = "PB-07"; },
    (item) => { item.source_b0_contract_hash = "0".repeat(64); },
    (item) => { item.body.max_output_tokens += 1; },
    (item) => { item.body.text.format.schema = { type: "null" }; },
    (item) => { item.body.input[0].content[0].text += "mutation"; },
    (item) => { item.body.store = true; },
    (item) => { item.body.tools = [{}]; },
    (item) => { item.body.stream = true; },
    (item) => { item.body.background = true; },
    (item) => { item.body.service_tier = "priority"; },
    (item) => { item.body.truncation = "auto"; },
    (item) => { item.body.reasoning.effort = "medium"; },
  ];
  const mutationsFail = mutationActions.every((mutate) => {
    const item = structuredClone(base);
    const before = compactHash(item);
    mutate(item);
    const changed = compactHash(item) !== before;
    let rejected = false;
    try {
      validateStageRequest(item);
    } catch {
      rejected = true;
    }
    return changed && rejected;
  });
  assert(
    "M2_B1_B1_REQUEST_HASH_GATE",
    registeredPass &&
      mutationsFail &&
      deepEqual(evidence.request.requests, requests),
    "registered request hashes or mutation rejection differs",
  );
}

function verifyResponses(evidence) {
  const matrix = evidence.response;
  const malformed = new Map(
    matrix.malformed.map((entry) => [entry.scenario_id, entry]),
  );
  assert(
    "M2_B1_B1_RESPONSE_PARSER_GATE",
    matrix.happy_path_count === 6 &&
      matrix.happy_paths.every(
        (entry) =>
          entry.response_status === "completed" &&
          entry.schema_valid === true,
      ),
    "synthetic happy-path parser result differs",
  );
  assert(
    "M2_B1_B1_REFUSAL_GATE",
    malformed.get("refusal")?.stop_code === "RESPONSE_REFUSAL",
    "refusal did not stop",
  );
  assert(
    "M2_B1_B1_INCOMPLETE_GATE",
    ["incomplete", "queued", "in_progress", "cancelled"].every(
      (id) => malformed.get(id)?.stopped === true,
    ),
    "non-completed status did not stop",
  );
  assert(
    "M2_B1_B1_USAGE_GATE",
    matrix.happy_paths.every(
      (entry) =>
        Number.isInteger(entry.usage.input_tokens) &&
        Number.isInteger(entry.usage.cached_tokens) &&
        Number.isInteger(entry.usage.uncached_input_tokens) &&
        Number.isInteger(entry.usage.output_tokens) &&
        Number.isInteger(entry.usage.reasoning_tokens) &&
        entry.usage.total_tokens ===
          entry.usage.input_tokens + entry.usage.output_tokens,
    ),
    "usage fields or arithmetic differ",
  );
  assert(
    "M2_B1_B1_USAGE_COST_GATE",
    matrix.usage_ledger.cost_term ===
      "usage-derived conservative cost estimate" &&
      matrix.usage_ledger.entries.length === 6 &&
      matrix.usage_ledger.cumulative_usage_derived_cost_usd > 0,
    "usage-derived conservative cost ledger differs",
  );
  assert(
    "M2_B1_B1_RETURNED_MODEL_GATE",
    matrix.happy_paths.every(
      (entry) =>
        entry.requested_model === B1B1.model &&
        entry.returned_model === B1B1.model,
    ) &&
      evidence.failure.scenarios.find(
        (entry) => entry.scenario_id === "returned_model_mismatch",
      )?.actual_stop_code === "RETURNED_MODEL_MISMATCH",
    "returned-model policy differs",
  );
}

function verifyIsolationAndSafety(evidence, contracts) {
  const builtins = new Set(
    builtinModules.flatMap((name) => [
      name,
      name.startsWith("node:") ? name : `node:${name}`,
    ]),
  );
  const forbiddenBuiltins = new Set(
    ["http", "http2", "https", "net", "tls", "dns", "dgram"].flatMap(
      (name) => [name, `node:${name}`],
    ),
  );
  const networkWordPattern = new RegExp(
    `\\b(?:${[
      ["cu", "rl"].join(""),
      ["wg", "et"].join(""),
      ["Invoke", "WebRequest"].join("-"),
      ["Invoke", "RestMethod"].join("-"),
    ].join("|")})\\b`,
    "iu",
  );
  const invocationPatterns = [
    new RegExp(`\\b${["fe", "tch"].join("")}\\s*\\(`, "u"),
    new RegExp(`\\b${["Web", "Socket"].join("")}\\s*\\(`, "u"),
    new RegExp(`\\b${["XML", "Http", "Request"].join("")}\\b`, "u"),
    networkWordPattern,
    new RegExp(`\\b${["process", "env"].join("\\.")}(?:\\.|\\[)`, "u"),
  ];
  for (const file of tenImplementationScriptPaths) {
    const text = canonicalText(file);
    for (const specifier of moduleSpecifiers(text)) {
      if (builtins.has(specifier)) {
        assert(
          "M2_B1_B1_NETWORK_INTERLOCK_GATE",
          !forbiddenBuiltins.has(specifier),
          `${file}: forbidden network built-in ${specifier}`,
        );
        assert(
          "M2_B1_B1_NETWORK_INTERLOCK_GATE",
          file === "scripts/verify-m2-p2-b1-b1-provider-adapter.mjs" ||
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
        "M2_B1_B1_NETWORK_INTERLOCK_GATE",
        resolved !== null && authorizedSuccessorScriptPaths.has(resolved),
        `${file}: non-peer dependency ${specifier}`,
      );
    }
    assert(
      "M2_B1_B1_NETWORK_INTERLOCK_GATE",
      invocationPatterns.every((pattern) => !pattern.test(text)),
      `${file}: network or environment invocation syntax found`,
    );
  }
  const requestText = JSON.stringify(evidence.request);
  assert(
    "M2_B1_B1_ORACLE_ISOLATION_GATE",
    evidence.request.oracle_included === false &&
      !requestText.includes('"oracle"'),
    "oracle entered a request preview",
  );
  assert(
    "M2_B1_B1_HOLDOUT_ISOLATION_GATE",
    evidence.request.holdout_data_used === false &&
      contracts.provider.holdout_execution_allowed === false,
    "holdout isolation differs",
  );
  assert(
    "M2_B1_B1_REAL_USER_DATA_GATE",
    evidence.request.real_user_data_used === false &&
      contracts.provider.real_user_execution_allowed === false,
    "real-user isolation differs",
  );
  const headerName = ["Author", "ization"].join("");
  assert(
    "M2_B1_B1_REDACTION_GATE",
    evidence.request.requests.every(
      (request) =>
        request.headers_preview[headerName] === "[REDACTED_NOT_BOUND]",
    ),
    "header preview is not redacted and unbound",
  );
  let sanitizerRejected = false;
  try {
    assertArtifactSafe({
      [headerName]: `${["Be", "arer"].join("")} synthetic-prohibited-value`,
    });
  } catch (error) {
    sanitizerRejected = error?.stopCode === "ARTIFACT_SANITIZER_REJECTED";
  }
  let secretShapeRejected = false;
  try {
    assertArtifactSafe({
      value: `${["s", "k", "-"].join("")}${"x".repeat(20)}`,
    });
  } catch (error) {
    secretShapeRejected = error?.stopCode === "ARTIFACT_SANITIZER_REJECTED";
  }
  assert(
    "M2_B1_B1_ARTIFACT_SANITIZER_GATE",
    sanitizerRejected && secretShapeRejected,
    "artifact sanitizer did not reject prohibited values",
  );
}

function verifyStops(evidence, provider) {
  const network = evidence.network.scenarios[0];
  assert(
    "M2_B1_B1_NETWORK_INTERLOCK_GATE",
    network.stopped === true &&
      network.stop_code === "LIVE_EXECUTION_NOT_AUTHORIZED",
    "network-blocked scenario did not stop with the fixed code",
  );
  assert(
    "M2_B1_B1_ZERO_SECRET_RESOLUTION_GATE",
    network.secret_provider_invocations === 0 &&
      evidence.failure.scenarios.every(
        (entry) => entry.secret_provider_invocations === 0,
      ),
    "secret provider was reached",
  );
  assert(
    "M2_B1_B1_ZERO_EXECUTOR_CALL_GATE",
    network.request_executor_invocations === 0 &&
      evidence.failure.scenarios.every(
        (entry) => entry.request_executor_invocations === 0,
      ),
    "request executor was reached",
  );
  assert(
    "M2_B1_B1_ZERO_PROVIDER_CALL_GATE",
    network.actual_provider_calls === 0 &&
      evidence.failure.actual_provider_calls === 0 &&
      provider.actual_provider_calls === 0,
    "actual provider calls are nonzero",
  );
  assert(
    "M2_B1_B1_ZERO_SPEND_GATE",
    network.api_spend_usd === 0 &&
      evidence.failure.api_spend_usd === 0 &&
      provider.api_spend_usd === 0,
    "API spend is nonzero",
  );
  assert(
    "M2_B1_B1_NO_RETRY_GATE",
    provider.retry_allowed === false &&
      evidence.failure.scenarios.every(
        (entry) => entry.retry_attempted === false,
      ),
    "retry is present",
  );
  assert(
    "M2_B1_B1_NO_REPAIR_GATE",
    provider.repair_allowed === false &&
      provider.pb_07_included === false &&
      evidence.failure.scenarios.every(
        (entry) => entry.repair_attempted === false,
      ),
    "Repair or PB-07 is present",
  );
  assert(
    "M2_B1_B1_NO_FALLBACK_GATE",
    provider.fallback_allowed === false &&
      evidence.failure.scenarios.every(
        (entry) => entry.fallback_attempted === false,
      ),
    "fallback is present",
  );
  assert(
    "M2_B1_B1_FAILURE_MATRIX_GATE",
    evidence.failure.scenario_count === 28 &&
      evidence.failure.passed_count === 28 &&
      evidence.failure.all_stopped === true &&
      evidence.failure.scenarios.every((entry) => entry.passed),
    "28-case failure matrix differs",
  );
}

async function verifyDeterminismAndReports(evidence) {
  const second = await buildProviderAdapterEvidence();
  assert(
    "M2_B1_B1_DETERMINISM_GATE",
    evidence.deterministic_payload_sha256 ===
      second.deterministic_payload_sha256 &&
      canonicalText(reportPaths.request) === evidence.rendered.request &&
      canonicalText(reportPaths.response) === evidence.rendered.response &&
      canonicalText(reportPaths.network) === evidence.rendered.network &&
      canonicalText(reportPaths.failure) === evidence.rendered.failure &&
      canonicalText(reportPaths.summary) === evidence.rendered.summary,
    "repeated builds or checked-in evidence bytes differ",
  );
  assert(
    "M2_B1_B1_REPORT_HASH_GATE",
    evidence.manifest.report_paths.every(
      (reportPath) =>
        evidence.manifest.report_hashes[reportPath] ===
        sha256(Buffer.from(canonicalText(reportPath), "utf8")),
    ),
    "registered report hash differs",
  );

  const accepted = [
    "--mode",
    B1B1.cliMode,
    "--case",
    B1B1.caseId,
    "--model",
    B1B1.model,
    "--contract-hash",
    B1B1.b0ContractHash,
    "--confirm",
    B1B1.confirmation,
  ];
  let acceptedPass = true;
  try {
    parseNetworkBlockedArguments(accepted);
  } catch {
    acceptedPass = false;
  }
  const rejected = [
    accepted.slice(0, -2),
    [...accepted, "--case", B1B1.caseId],
    ["--live", "true", ...accepted],
    ["--network", "true", ...accepted],
    [...accepted, "--stage", "PB-07"],
    [...accepted, "--output-cap", "1"],
    [...accepted, "--budget", "1"],
    [...accepted, "--retry", "1"],
    [...accepted, "--repair", "1"],
    [...accepted, "--fallback", "other"],
  ].every((args) => {
    try {
      parseNetworkBlockedArguments(args);
      return false;
    } catch {
      return true;
    }
  });
  const command = spawnSync(
    process.execPath,
    [absolute("scripts/run-m2-p2-b1-b1-network-blocked.mjs"), ...accepted],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  assert(
    "M2_B1_B1_DETERMINISM_GATE",
    acceptedPass &&
      rejected &&
      command.status === 0 &&
      command.stdout.includes(
        "M2_P2_B1_B1_NETWORK_BLOCKED_RUN: stopped",
      ),
    `CLI acceptance/rejection or exact command failed: ${command.stderr}`,
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
      `FAIL_DETAIL | gate=M2_P2_B1_B1_PROVIDER_ADAPTER_GATE | ${detail}`,
    );
  }
  const passed =
    gateOrder.every((gate) => failures.get(gate).length === 0) &&
    overallFailures.length === 0;
  console.log(
    `M2_P2_B1_B1_PROVIDER_ADAPTER_GATE: ${passed ? "PASS" : "FAIL"}`,
  );
  return passed;
}

try {
  const evidence = await buildProviderAdapterEvidence();
  const manifest = readJson("evals/calibration/b1b1/report-manifest-v1.json");
  verifyExactScope(manifest);
  verifyB1b2aSuccessorTools();
  verifyB1b2b0SuccessorTools();
  const contracts = verifyContracts(evidence);
  verifyRequests(evidence, contracts.requestProfile);
  verifyResponses(evidence);
  verifyIsolationAndSafety(evidence, contracts);
  verifyStops(evidence, contracts.provider);
  await verifyDeterminismAndReports(evidence);
  if (!printResults()) process.exitCode = 1;
} catch (error) {
  overallFailures.push(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  printResults();
  process.exitCode = 1;
}
