import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  executeControlledProviderReviewV16 as executeControlledProviderReview,
  loadControlledReviewInputAuthority,
  V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
  V1_D_CONTROLLED_REVIEW_CASE_IDS,
  V1_D_CONTROLLED_REVIEW_MODEL,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-executor.ts";
import {
  ControlledReviewEvidenceJournal,
  prepareControlledReviewOutputDirectory,
  validateControlledReviewOutputDirectory,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-evidence.ts";
import {
  ReviewOnlyOpenAiResponsesTransport,
  V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_PER_CASE,
  V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_TOTAL,
} from "../lib/assessment/runtime/review/m2-p4-v15-controlled-review-transport.ts";
import { loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";

export const V1_D_PROVIDER_EXECUTION_AUTHORIZATION_VALUE =
  "I_HAVE_EXPLICIT_HUMAN_AUTHORIZATION";

function fail(safeCode) {
  throw new M2RuntimeError(safeCode);
}

function parseArguments(argv) {
  const parsed = {
    execute: false,
    validateOnly: false,
    allNine: false,
    caseId: null,
    outputDirectory: null,
  };
  for (const argument of argv) {
    if (argument === "--execute-provider-review") {
      if (parsed.execute) fail("M2_V1D_REVIEW_ARGUMENT_INVALID");
      parsed.execute = true;
    } else if (argument === "--validate-only") {
      if (parsed.validateOnly) fail("M2_V1D_REVIEW_ARGUMENT_INVALID");
      parsed.validateOnly = true;
    } else if (argument === "--all-nine-cases") {
      if (parsed.allNine) fail("M2_V1D_REVIEW_ARGUMENT_INVALID");
      parsed.allNine = true;
    } else if (argument.startsWith("--case=")) {
      if (parsed.caseId !== null) fail("M2_V1D_REVIEW_ARGUMENT_INVALID");
      parsed.caseId = argument.slice("--case=".length);
    } else if (argument.startsWith("--output-dir=")) {
      if (parsed.outputDirectory !== null) {
        fail("M2_V1D_REVIEW_ARGUMENT_INVALID");
      }
      parsed.outputDirectory = argument.slice("--output-dir=".length);
    } else {
      fail("M2_V1D_REVIEW_ARGUMENT_INVALID");
    }
  }
  if (parsed.execute === parsed.validateOnly) {
    fail("M2_V1D_REVIEW_EXECUTION_MODE_REQUIRED");
  }
  if (parsed.allNine === (parsed.caseId !== null)) {
    fail("M2_V1D_REVIEW_CASE_SELECTION_INVALID");
  }
  if (!parsed.outputDirectory) fail("M2_V1D_REVIEW_OUTPUT_PATH_REQUIRED");
  const selectedCaseIds = parsed.allNine
    ? [...V1_D_CONTROLLED_REVIEW_CASE_IDS]
    : [parsed.caseId];
  if (
    selectedCaseIds.some(
      (caseId) =>
        typeof caseId !== "string" ||
        !V1_D_CONTROLLED_REVIEW_CASE_IDS.includes(caseId),
    )
  ) {
    fail("M2_V1D_REVIEW_CASE_SELECTION_INVALID");
  }
  return {
    ...parsed,
    selectedCaseIds,
  };
}

function git(repositoryRoot, args) {
  return execFileSync(
    "git.exe",
    ["-c", `safe.directory=${repositoryRoot.replaceAll("\\", "/")}`, ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  ).trim();
}

function safeExecutionId(outputDirectory) {
  const executionId = path.basename(path.resolve(outputDirectory));
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u.test(executionId)) {
    fail("M2_V1D_REVIEW_EXECUTION_ID_INVALID");
  }
  return executionId;
}

function requireExecutionAuthorization(input) {
  if (
    input.env.M2_V1D_PROVIDER_EXECUTION_AUTHORIZED !==
    V1_D_PROVIDER_EXECUTION_AUTHORIZATION_VALUE
  ) {
    fail("M2_V1D_REVIEW_AUTHORIZATION_MISSING");
  }
  if (
    input.env.M2_V1D_AUTHORIZED_SNAPSHOT !== input.actualHead ||
    input.env.M2_V1D_AUTHORIZED_SNAPSHOT?.length !== 40
  ) {
    fail("M2_V1D_REVIEW_SNAPSHOT_AUTHORITY_INVALID");
  }
  if (
    input.env.M2_V1D_AUTHORIZED_INPUT_SHA256 !== input.actualInputSha256 ||
    input.env.M2_V1D_AUTHORIZED_INPUT_SHA256 !==
      V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256
  ) {
    fail("M2_V1D_REVIEW_INPUT_AUTHORITY_INVALID");
  }
  const humanAuthorizationReference =
    input.env.M2_V1D_HUMAN_AUTHORIZATION_REFERENCE?.trim() ?? "";
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/u.test(
      humanAuthorizationReference,
    )
  ) {
    fail("M2_V1D_REVIEW_HUMAN_AUTHORIZATION_REFERENCE_MISSING");
  }
  if (!input.env.OPENAI_API_KEY?.trim()) {
    fail("M2_V1D_REVIEW_OPENAI_API_KEY_MISSING");
  }
}

function authorizationRecord(input) {
  const humanAuthorizationReferenceHash = createHash("sha256")
    .update(
      input.env.M2_V1D_HUMAN_AUTHORIZATION_REFERENCE.trim(),
      "utf8",
    )
    .digest("hex");
  return {
    schema_version: "m2-p4-v1-d-controlled-provider-authorization-record-v1",
    execution_id: input.executionId,
    human_authorization_reference: `sha256:${humanAuthorizationReferenceHash}`,
    authorized_snapshot: input.actualHead,
    authorized_input_sha256: input.actualInputSha256,
    model: V1_D_CONTROLLED_REVIEW_MODEL,
    authorized_case_ids: [...input.selectedCaseIds],
    authorization_timestamp: input.timestamp,
    maximum_application_stage_invocations_per_case:
      V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_PER_CASE,
    maximum_application_stage_invocations_total:
      V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_TOTAL,
    review_transport_max_retries: 0,
    synthetic_only: true,
    no_supabase: true,
    no_payment: true,
    no_production: true,
  };
}

export async function runControlledProviderReviewCli(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const env = options.env ?? process.env;
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd());
  const now = options.now ?? (() => new Date().toISOString());
  let journal = null;
  let providerClientConstructed = false;
  let observedProviderHttpAttempts = 0;
  try {
    const parsed = parseArguments(argv);
    const actualHead = git(repositoryRoot, ["rev-parse", "HEAD"]);
    const worktreeStatus = git(repositoryRoot, [
      "status",
      "--porcelain=v1",
    ]);
    const authority = await loadControlledReviewInputAuthority({
      repositoryRoot,
      expectedSha256: V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256,
    });
    const outputPathAuthority = {
      repositoryRoot,
      outputDirectory: parsed.outputDirectory,
      explicitlyAllowedReviewRoot:
        env.M2_V1D_ALLOWED_LOCAL_REVIEW_ROOT?.trim() || null,
    };
    await validateControlledReviewOutputDirectory(outputPathAuthority);
    const executionId = safeExecutionId(parsed.outputDirectory);

    if (parsed.validateOnly) {
      const catalog =
        await loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog();
      if (
        catalog.catalogVersion !== "runtime-stage-catalog-v16.0.0" ||
        catalog.promptBundleVersion !== "prompt-bundle-runtime-v16.0.0" ||
        catalog.schemaSetVersion !== "pipeline-schema-runtime-v6.0.0" ||
        catalog.stageTopologyVersion !== "split-base-candidate-v1"
      ) {
        fail("M2_V1D_REVIEW_RUNTIME_IDENTITY_INVALID");
      }
      return {
        exitCode: 0,
        mode: "validate-only",
        providerClientConstructed: false,
        providerExecutionCount: 0,
        selectedCaseIds: parsed.selectedCaseIds,
        actualHead,
        worktreeClean: worktreeStatus === "",
        controlledInputSha256: authority.sha256,
        executionId,
      };
    }

    requireExecutionAuthorization({
      env,
      actualHead,
      actualInputSha256: authority.sha256,
    });
    if (worktreeStatus !== "") {
      fail("M2_V1D_REVIEW_WORKTREE_NOT_CLEAN");
    }
    const outputDirectory = await prepareControlledReviewOutputDirectory(
      outputPathAuthority,
    );
    journal = new ControlledReviewEvidenceJournal(outputDirectory, executionId);
    const record = authorizationRecord({
      executionId,
      env,
      actualHead,
      actualInputSha256: authority.sha256,
      selectedCaseIds: parsed.selectedCaseIds,
      timestamp: now(),
    });
    await journal.recordAuthorization(record);
    const result = await executeControlledProviderReview({
      repositoryRoot,
      selectedCaseIds: parsed.selectedCaseIds,
      expectedInputSha256: authority.sha256,
      transportFactory: (context) =>
        (() => {
          providerClientConstructed = true;
          return new ReviewOnlyOpenAiResponsesTransport({
            apiKey: env.OPENAI_API_KEY,
            fixtureId: context.fixtureId,
            nextGlobalHttpAttemptOrdinal:
              context.nextGlobalHttpAttemptOrdinal,
            onHttpAttempt: context.onHttpAttempt,
          });
        })(),
      onHttpAttempt: (attempt) => {
        observedProviderHttpAttempts += 1;
        return journal.recordProviderHttpAttempt(attempt);
      },
      onCaseEvidence: (caseEvidence) => journal.recordCase(caseEvidence),
    });
    await journal.finalize({
      executionId,
      complete: result.complete,
      authorizationRecord: record,
      applicationStageInvocations: result.applicationStageInvocations,
      providerHttpAttempts: result.providerHttpAttempts,
      cases: result.cases,
      safeErrorCode: result.safeErrorCode,
    });
    return {
      exitCode: result.complete ? 0 : 1,
      mode: "execute-provider-review",
      providerClientConstructed,
      providerExecutionCount: result.providerHttpAttemptCount,
      selectedCaseIds: parsed.selectedCaseIds,
      actualHead,
      controlledInputSha256: authority.sha256,
      executionId,
      safeErrorCode: result.safeErrorCode,
    };
  } catch (error) {
    const safeCode =
      error instanceof M2RuntimeError
        ? error.safeCode
        : "M2_V1D_REVIEW_RUNNER_FAILED";
    if (journal !== null) {
      try {
        await journal.markIncomplete(safeCode);
      } catch {
        return {
          exitCode: 1,
          mode: "failed",
          providerClientConstructed,
          providerExecutionCount: observedProviderHttpAttempts,
          safeErrorCode: "M2_V1D_REVIEW_EVIDENCE_WRITE_FAILED",
        };
      }
    }
    return {
      exitCode: 1,
      mode: "failed",
      providerClientConstructed,
      providerExecutionCount: observedProviderHttpAttempts,
      safeErrorCode: safeCode,
    };
  }
}

async function main() {
  const result = await runControlledProviderReviewCli();
  const printable = {
    mode: result.mode,
    selectedCaseIds: result.selectedCaseIds ?? [],
    controlledInputSha256: result.controlledInputSha256 ?? null,
    executionId: result.executionId ?? null,
    safeErrorCode: result.safeErrorCode ?? null,
    providerExecutionCount: result.providerExecutionCount,
  };
  const stream = result.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${JSON.stringify(printable)}\n`);
  process.exitCode = result.exitCode;
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
