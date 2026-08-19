import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  ControlledReviewEvidenceJournal,
  prepareControlledReviewOutputDirectory,
  V1_D_V16_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts";
import {
  V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
  V1_D_CONTROLLED_REVIEW_CASE_IDS,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts";
import {
  buildControlledReviewAuthorizationRecord,
  runControlledProviderReviewCli,
  validateControlledReviewRuntimeCatalogIdentity,
} from "./run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs";

const root = process.cwd();
const baseline = "8a4f30a49dd03cbd8c429fb9eaeb2387fa03c184";
const historicalExecution = "ecef2470e34d1a9fe82c0fc5683735d6aa5394f0";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-step2b-c2-v16-evidence-provenance";
const expectedSubject = "fix: label V1-D V16 evidence correctly";
const precommit = process.argv.includes("--precommit");
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const planningRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1";
const executionRoot =
  `${packageRoot}/controlled-provider-executions/` +
  "2026-08-18-case1-ordinary-reply-waiting-2a458ec1";

const updatedPaths = [
  "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts",
  "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
  `${packageRoot}/controlled-provider-authorization-contract-v1.json`,
  `${packageRoot}/controlled-provider-executor-contract-v1.json`,
  `${packageRoot}/controlled-provider-review-plan-v1.json`,
  `${packageRoot}/offline-results-v1.json`,
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_STEP2B_C1_SENT_DRAFT_BOUNDARY.md",
  `${planningRoot}/capabilities-v1.json`,
  `${planningRoot}/implementation-work-packages-v1.json`,
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_OFFLINE_PRODUCT_REREVIEW.md",
];
const newPaths = [
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_D_STEP2B_C2_V16_EVIDENCE_PROVENANCE.md",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-step2b-c2-v16-evidence-provenance.mjs",
];
const exactScope = [...updatedPaths, ...newPaths];

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
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

function readOutputJson(outputDirectory, fileName) {
  return JSON.parse(readFileSync(path.join(outputDirectory, fileName), "utf8"));
}

function baselineText(relativePath) {
  return git(["show", `${baseline}:${relativePath}`]);
}

function blob(revision, relativePath) {
  return git(["rev-parse", `${revision}:${relativePath}`]);
}

function worktreeBlob(relativePath) {
  return git(["hash-object", `--path=${relativePath}`, relativePath]);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
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

function sourceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  assert.ok(startIndex >= 0, start);
  assert.ok(endIndex > startIndex, end);
  return source.slice(startIndex, endIndex).trim();
}

function fakeReadyCase() {
  return {
    fixtureId: "ordinary_reply_waiting",
    syntheticOnly: true,
    humanPii: false,
    fixedClock: "2026-08-17T12:00:00.000Z",
    timezone: "Asia/Tokyo",
    assessmentInput: {
      currentSituation: "synthetic offline evidence fixture",
      optionalMessage: null,
      relationship: "friend",
      requestedTopics: ["organize_emotions"],
      privacyAcknowledged: true,
    },
    route: {
      fixtureId: "ordinary_reply_waiting",
      expectedInitialRoute: "full_paid_ready_candidate",
      initialEligibility: "ready",
      initialRouteMatched: true,
      expectedClarificationTarget: null,
      actualClarificationTarget: null,
      clarificationAnswerCount: 0,
      resumedEligibility: null,
      finalDisposition: "ready",
      safeErrorCode: null,
    },
    stageAttempts: [],
    qualityReassessment: {
      fixtureId: "ordinary_reply_waiting",
      quality_reassessment_used: false,
      scope: "none",
      attempt_2_stages: [],
      attempt_3_present: false,
      final_disposition: "ready",
    },
    finalRuntimeReport: { schema_version: "offline-v16-ready-fixture" },
    customerProjection: {
      projectionSchemaVersion: "customer-assessment-experience-projection-v2",
      baseProjection: { finalDraft: "synthetic future V16 evidence" },
    },
  };
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

const runtimeIdentity = {
  ...V1_D_V16_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY,
};
const fakeCase = fakeReadyCase();
const authorizationRecord = buildControlledReviewAuthorizationRecord({
  executionId: "offline-v16-evidence-provenance",
  env: { M2_V1D_HUMAN_AUTHORIZATION_REFERENCE: "offline-human-reference" },
  actualHead: baseline,
  actualInputSha256: V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
  selectedCaseIds: [fakeCase.fixtureId],
  timestamp: "2026-08-18T00:00:00.000Z",
  runtimeIdentity,
});

await check("exact Git authority branch lineage and main are fixed", () => {
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(
    git(["show", "-s", "--format=%s", baseline]),
    "fix: preserve V1-D required-now draft authority",
  );
  assert.equal(git(["rev-parse", "refs/heads/main"]), expectedMain);
  assert.equal(git(["rev-parse", "refs/remotes/origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  if (precommit) {
    assert.equal(git(["rev-parse", "HEAD"]), baseline);
    assert.equal(remoteHead(expectedBranch), null);
  } else {
    assert.equal(git(["rev-list", "--count", `${baseline}..HEAD`]), "1");
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
    assert.ok([null, git(["rev-parse", "HEAD"])].includes(remoteHead(expectedBranch)));
  }
});

await check("exact scope is 13 UPDATE plus 2 NEW with no delete or rename", () => {
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
  assert.equal(
    scope.some((entry) => ["D", "R", "C"].includes(entry.status[0])),
    false,
  );
});

await check("stash and diff checks are safe", () => {
  assert.equal(git(["stash", "list"]), "");
  assert.equal(git(["diff", "--check"]), "");
  if (!precommit) assert.equal(git(["status", "--porcelain=v1"]), "");
});

await check("all 18 historical V15 Case 1 evidence files are byte-identical", () => {
  const files = git(["ls-tree", "-r", "--name-only", baseline, executionRoot])
    .split(/\r?\n/u)
    .filter(Boolean);
  assert.equal(files.length, 18);
  for (const relativePath of files) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
  assert.equal(git(["rev-parse", historicalExecution]), historicalExecution);
});

await check("protected Product Runtime Prompt catalog schema and input blobs are unchanged", () => {
  const v15Manifest = JSON.parse(
    baselineText("lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json"),
  );
  const v16Manifest = JSON.parse(
    baselineText("lib/assessment/runtime/contracts/runtime-stage-catalog-v16.json"),
  );
  const tracked = git(["ls-tree", "-r", "--name-only", baseline])
    .split(/\r?\n/u)
    .filter(Boolean);
  const protectedPaths = new Set([
    "lib/assessment/runtime/generated-draft-authority-v1.ts",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/application.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/fakes.ts",
    "lib/assessment/runtime/types.ts",
    "lib/assessment/runtime/openai-transport.ts",
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts",
    "lib/assessment/runtime/effective-decision-policy-v1.ts",
    "lib/assessment/runtime/policy-v2.ts",
    "lib/assessment/runtime/policy-v3.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    `${packageRoot}/controlled-provider-inputs-v1.json`,
    `${packageRoot}/case1-actual-product-review-v1.json`,
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v15.json",
    "lib/assessment/runtime/contracts/runtime-stage-catalog-v16.json",
    ...v15Manifest.stages.map((stage) => stage.prompt_path),
    ...v16Manifest.stages.map((stage) => stage.prompt_path),
    "next-env.d.ts",
    ...tracked.filter((entry) => entry.endsWith(".schema.json")),
    ...tracked.filter((entry) => /^supabase\/migrations\//u.test(entry)),
    ...tracked.filter((entry) => /(?:payment|stripe|purchase)/iu.test(entry)),
  ]);
  for (const relativePath of protectedPaths) {
    assert.equal(worktreeBlob(relativePath), blob(baseline, relativePath), relativePath);
  }
});

await check("sanitizer and authorization gate semantics are unchanged", () => {
  const evidencePath =
    "lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts";
  assert.equal(
    sourceBetween(readText(evidencePath), "const prohibitedKeys", "function stageUsage"),
    sourceBetween(baselineText(evidencePath), "const prohibitedKeys", "function stageUsage"),
  );
  const runnerPath =
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs";
  assert.equal(
    sourceBetween(
      readText(runnerPath),
      "function requireExecutionAuthorization",
      "export function validateControlledReviewRuntimeCatalogIdentity",
    ),
    sourceBetween(
      baselineText(runnerPath),
      "function requireExecutionAuthorization",
      "function authorizationRecord",
    ),
  );
});

await check("frozen controlled input bytes and SHA remain exact", () => {
  const inputPath = `${packageRoot}/controlled-provider-inputs-v1.json`;
  const sha256 = createHash("sha256")
    .update(readFileSync(path.join(root, inputPath)))
    .digest("hex");
  assert.equal(sha256, V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256);
  assert.equal(
    sha256,
    "ab1d7b896086da002015a0a6d5cf1c1fb6eac3ffdc48e8410b44a892c1f9a20d",
  );
  assert.equal(worktreeBlob(inputPath), blob(baseline, inputPath));
  assert.equal(V1_D_CONTROLLED_REVIEW_CASE_IDS.length, 9);
});

await check("future authorization record contains the exact V16 Runtime identity", () => {
  assert.equal(
    authorizationRecord.runtime_catalog_version,
    "runtime-stage-catalog-v16.0.0",
  );
  assert.equal(
    authorizationRecord.prompt_bundle_version,
    "prompt-bundle-runtime-v16.0.0",
  );
  assert.equal(
    authorizationRecord.schema_set_version,
    "pipeline-schema-runtime-v6.0.0",
  );
  assert.equal(
    authorizationRecord.stage_topology_version,
    "split-base-candidate-v1",
  );
  assert.equal(authorizationRecord.model, "gpt-5.6-luna");
  assert.equal(authorizationRecord.review_transport_max_retries, 0);
  assert.equal(authorizationRecord.synthetic_only, true);
  assert.equal(authorizationRecord.no_supabase, true);
  assert.equal(authorizationRecord.no_payment, true);
  assert.equal(authorizationRecord.no_production, true);
});

let fakeOutputDirectory;
const fakeRoot = mkdtempSync(path.join(tmpdir(), "moon-reply-v1-d-c2-"));
try {
  await check("offline V16 evidence bundle writes only the V16 result family", async () => {
    fakeOutputDirectory = path.join(fakeRoot, "offline-v16-evidence-provenance");
    await prepareControlledReviewOutputDirectory({
      repositoryRoot: root,
      outputDirectory: fakeOutputDirectory,
      explicitlyAllowedReviewRoot: fakeRoot,
    });
    const journal = new ControlledReviewEvidenceJournal(
      fakeOutputDirectory,
      "offline-v16-evidence-provenance",
      runtimeIdentity,
    );
    await journal.recordAuthorization(authorizationRecord);
    await journal.finalize({
      executionId: "offline-v16-evidence-provenance",
      complete: true,
      authorizationRecord,
      applicationStageInvocations: [],
      providerHttpAttempts: [],
      cases: [fakeCase],
      safeErrorCode: null,
    });
    const files = readdirSync(fakeOutputDirectory);
    for (const fileName of [
      "v16-route-results-v1.json",
      "v16-stage-attempt-results-v1.json",
      "v16-customer-projections-v1.json",
      "v16-quality-reassessment-results-v1.json",
      "authorization-record-v1.json",
      "provider-call-ledger-v1.json",
      "provider-http-attempt-ledger-v1.json",
      "human-product-review-sheet-v1.json",
      "provider-execution-summary-v1.md",
    ]) {
      assert.ok(files.includes(fileName), fileName);
    }
    assert.equal(files.some((fileName) => /^v15-/u.test(fileName)), false);
  });

  await check("V16 result files use the corresponding V16 schema versions", () => {
    assert.equal(
      readOutputJson(fakeOutputDirectory, "v16-route-results-v1.json")
        .schema_version,
      "m2-p4-v1-d-v16-route-results-v1",
    );
    assert.equal(
      readOutputJson(fakeOutputDirectory, "v16-stage-attempt-results-v1.json")
        .schema_version,
      "m2-p4-v1-d-v16-stage-attempt-results-v1",
    );
    assert.equal(
      readOutputJson(fakeOutputDirectory, "v16-customer-projections-v1.json")
        .schema_version,
      "m2-p4-v1-d-v16-customer-projections-v1",
    );
    assert.equal(
      readOutputJson(
        fakeOutputDirectory,
        "v16-quality-reassessment-results-v1.json",
      ).schema_version,
      "m2-p4-v1-d-v16-quality-reassessment-results-v1",
    );
  });

  await check("Ready projection and Human review provenance are exact V16", () => {
    const projections = readOutputJson(
      fakeOutputDirectory,
      "v16-customer-projections-v1.json",
    );
    assert.equal(projections.projections.length, 1);
    assert.equal(
      projections.projections[0].output_provenance,
      "actual_v16_successor_output",
    );
    const sheet = readOutputJson(
      fakeOutputDirectory,
      "human-product-review-sheet-v1.json",
    );
    assert.equal(sheet.review_records.length, 1);
    assert.equal(sheet.review_records[0].fixture_id, fakeCase.fixtureId);
    assert.equal(
      sheet.review_records[0].output_provenance,
      "actual_v16_successor_output",
    );
  });

  await check("all Human Product judgments remain pending", () => {
    const sheet = readOutputJson(
      fakeOutputDirectory,
      "human-product-review-sheet-v1.json",
    );
    const record = sheet.review_records[0];
    const judgments = Object.entries(record).filter(
      ([key]) => !["fixture_id", "output_provenance", "reviewer_notes"].includes(key),
    );
    assert.ok(judgments.length > 0);
    assert.ok(judgments.every(([, value]) => value === "pending_human_review"));
    assert.equal(record.reviewer_notes, null);
    assert.equal(sheet.automatic_product_judgments, 0);
  });

  await check("new V16 output contains no V15 provenance or V15 result filename", () => {
    const resultFamily = [
      "v15-route-results-v1.json",
      "v15-stage-attempt-results-v1.json",
      "v15-customer-projections-v1.json",
      "v15-quality-reassessment-results-v1.json",
    ];
    const files = readdirSync(fakeOutputDirectory);
    assert.ok(resultFamily.every((fileName) => !files.includes(fileName)));
    const text = files
      .map((fileName) => readFileSync(path.join(fakeOutputDirectory, fileName), "utf8"))
      .join("\n");
    assert.doesNotMatch(text, /actual_v15_successor_output/u);
  });

  await check("summary and journals expose the exact V16 Runtime identity", () => {
    const summary = readFileSync(
      path.join(fakeOutputDirectory, "provider-execution-summary-v1.md"),
      "utf8",
    );
    assert.match(summary, /runtime_catalog_version: runtime-stage-catalog-v16\.0\.0/u);
    assert.match(summary, /prompt_bundle_version: prompt-bundle-runtime-v16\.0\.0/u);
    assert.match(summary, /schema_set_version: pipeline-schema-runtime-v6\.0\.0/u);
    assert.match(summary, /stage_topology_version: split-base-candidate-v1/u);
    assert.match(summary, /model: gpt-5\.6-luna/u);
    const journal = readOutputJson(
      fakeOutputDirectory,
      "execution-journal-v1-0001.json",
    );
    assert.equal(journal.runtime_catalog_version, "runtime-stage-catalog-v16.0.0");
    assert.equal(journal.prompt_bundle_version, "prompt-bundle-runtime-v16.0.0");
  });

  await check("unsupported evidence Runtime identity fails before claims are written", async () => {
    const unsupportedOutput = path.join(fakeRoot, "unsupported-v17-evidence");
    await prepareControlledReviewOutputDirectory({
      repositoryRoot: root,
      outputDirectory: unsupportedOutput,
      explicitlyAllowedReviewRoot: fakeRoot,
    });
    const unsupportedIdentity = {
      ...runtimeIdentity,
      catalogVersion: "runtime-stage-catalog-v17.0.0",
      promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
    };
    assert.throws(
      () =>
        new ControlledReviewEvidenceJournal(
          unsupportedOutput,
          "unsupported-v17-evidence",
          unsupportedIdentity,
        ),
      (error) =>
        safeCode(error) ===
        "M2_V1D_REVIEW_EVIDENCE_RUNTIME_IDENTITY_UNSUPPORTED",
    );
    assert.equal(readdirSync(unsupportedOutput).length, 0);
  });

  await check("validate-only validates V16 and constructs no Provider client", async () => {
    const result = await runControlledProviderReviewCli({
      argv: [
        "--validate-only",
        "--case=ordinary_reply_waiting",
        `--output-dir=${path.join(fakeRoot, "validate-only")}`,
      ],
      env: { M2_V1D_ALLOWED_LOCAL_REVIEW_ROOT: fakeRoot },
      repositoryRoot: root,
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.providerClientConstructed, false);
    assert.equal(result.providerExecutionCount, 0);
    assert.deepEqual(result.runtimeIdentity, runtimeIdentity);
  });

  await check("missing and wrong authorization gates construct no Provider client", async () => {
    const missing = await runControlledProviderReviewCli({
      argv: [
        "--execute-provider-review",
        "--case=ordinary_reply_waiting",
        `--output-dir=${path.join(fakeRoot, "missing-authorization")}`,
      ],
      env: { M2_V1D_ALLOWED_LOCAL_REVIEW_ROOT: fakeRoot },
      repositoryRoot: root,
    });
    assert.equal(missing.safeErrorCode, "M2_V1D_REVIEW_AUTHORIZATION_MISSING");
    assert.equal(missing.providerClientConstructed, false);
    assert.equal(missing.providerExecutionCount, 0);

    const wrong = await runControlledProviderReviewCli({
      argv: [
        "--execute-provider-review",
        "--case=ordinary_reply_waiting",
        `--output-dir=${path.join(fakeRoot, "wrong-authorization")}`,
      ],
      env: {
        M2_V1D_ALLOWED_LOCAL_REVIEW_ROOT: fakeRoot,
        M2_V1D_PROVIDER_EXECUTION_AUTHORIZED:
          "I_HAVE_EXPLICIT_HUMAN_AUTHORIZATION",
        M2_V1D_AUTHORIZED_SNAPSHOT: "0".repeat(40),
      },
      repositoryRoot: root,
    });
    assert.equal(wrong.safeErrorCode, "M2_V1D_REVIEW_SNAPSHOT_AUTHORITY_INVALID");
    assert.equal(wrong.providerClientConstructed, false);
    assert.equal(wrong.providerExecutionCount, 0);
  });

  await check("runner catalog authority rejects an unsupported Runtime identity", () => {
    const unsupportedRuntimeCatalog = {
      catalogVersion: "runtime-stage-catalog-v17.0.0",
      promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
      schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
      stageTopologyVersion: "split-base-candidate-v1",
      definitions: [],
    };
    assert.throws(
      () =>
        validateControlledReviewRuntimeCatalogIdentity(
          unsupportedRuntimeCatalog,
        ),
      (error) => safeCode(error) === "M2_V1D_REVIEW_RUNTIME_IDENTITY_INVALID",
    );
  });
} finally {
  rmSync(fakeRoot, { recursive: true, force: true });
}

await check("runner validates Runtime identity before authorization and execution", () => {
  const runner = readText(
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d-controlled-provider-review.mjs",
  );
  const catalogLoad = runner.indexOf(
    "await loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog()",
  );
  const identityValidation = runner.indexOf(
    "validateControlledReviewRuntimeCatalogIdentity(catalog)",
    catalogLoad,
  );
  const authorization = runner.indexOf("requireExecutionAuthorization({");
  const record = runner.indexOf("buildControlledReviewAuthorizationRecord({");
  const execution = runner.indexOf("executeControlledProviderReview({");
  assert.ok(catalogLoad >= 0);
  assert.ok(identityValidation > catalogLoad);
  assert.ok(authorization > identityValidation);
  assert.ok(record > authorization);
  assert.ok(execution > record);
});

await check("machine-readable status preserves history and records C2 truth", () => {
  const authorizationContract = readJson(
    `${packageRoot}/controlled-provider-authorization-contract-v1.json`,
  );
  const executorContract = readJson(
    `${packageRoot}/controlled-provider-executor-contract-v1.json`,
  );
  const reviewPlan = readJson(`${packageRoot}/controlled-provider-review-plan-v1.json`);
  const offlineResults = readJson(`${packageRoot}/offline-results-v1.json`);
  const capabilities = readJson(`${planningRoot}/capabilities-v1.json`);
  const workPackages = readJson(`${planningRoot}/implementation-work-packages-v1.json`);
  assert.equal(
    authorizationContract.future_authorization_record.fixed_values
      .runtime_catalog_version,
    "runtime-stage-catalog-v16.0.0",
  );
  assert.equal(executorContract.step_2b_c2.status, "implemented_pending_human_chatgpt_review");
  assert.equal(
    executorContract.step_2b_c2.finding,
    "v16_execution_would_be_persisted_as_v15_evidence",
  );
  assert.equal(reviewPlan.step_2b_c1_r1_acceptance.status, "accepted_complete");
  assert.equal(offlineResults.controlled_provider_execution.step_2b_c2_status, "implemented_pending_human_chatgpt_review");
  assert.equal(capabilities.v1_d.step_2b_c1_r1_status, "accepted_complete");
  assert.equal(
    workPackages.packages.find((entry) => entry.id === "V1-D").step_2b_c2_status,
    "implemented_pending_human_chatgpt_review",
  );
  assert.equal(executorContract.operations.provider_calls, 0);
  assert.equal(offlineResults.operations.provider_calls, 0);
});

await check("changed files contain no sensitive values and every JSON parses", () => {
  const changedText = exactScope.map(readText).join("\n");
  assert.doesNotMatch(
    changedText,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  );
  assert.doesNotMatch(changedText, /\bsk-[A-Za-z0-9_-]{12,}\b/u);
  assert.doesNotMatch(changedText, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*\S+/u);
  for (const relativePath of exactScope.filter((entry) => entry.endsWith(".json"))) {
    assert.doesNotThrow(() => readJson(relativePath), relativePath);
  }
});

console.log(
  `\nM2-P4 V1-D Step 2B C2 V16 evidence provenance verifier: PASS ${String(passed)}/${String(passed)}`,
);
console.log(
  "Provider/DB/Supabase/migration apply/Payment/deploy: 0/0/0/0/0/0",
);
console.log(
  "Actual V16 Provider quality: unestablished; Case 1 rerun: unauthorized; remaining cases: HOLD",
);
