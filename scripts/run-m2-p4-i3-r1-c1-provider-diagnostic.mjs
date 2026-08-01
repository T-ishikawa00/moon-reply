import { execFileSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateDiagnostic,
  renderDiagnosticSummary,
} from "./lib/m2-p4-i3-r1-c1-evaluator.mjs";
import { runBoundedPb01ProviderDiagnostic } from "./lib/m2-p4-i3-r1-c1-provider-runner.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const artifactRoot = path.join(
  repositoryRoot,
  "evals",
  "runtime",
  "m2-p4-i3-r1-c1",
);
const contractPath = path.join(artifactRoot, "diagnostic-contract-v1.json");
const casesPath = path.join(artifactRoot, "diagnostic-cases-v1.json");
const resultsPath = path.join(artifactRoot, "diagnostic-results-v1.json");
const summaryPath = path.join(artifactRoot, "diagnostic-summary-v1.md");
const capabilitiesPath = path.join(artifactRoot, "capabilities-v1.json");

function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

async function json(relativePath) {
  return JSON.parse(await readFile(relativePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArguments(argv) {
  const result = { confirm: null, expectedHead: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--confirm") {
      result.confirm = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === "--expected-head") {
      result.expectedHead = argv[index + 1] ?? null;
      index += 1;
    } else {
      throw new Error("M2_R1_C1_ARGUMENT_INVALID");
    }
  }
  return result;
}

function safeStopCode(error) {
  if (typeof error?.safeCode === "string") return error.safeCode;
  if (typeof error?.message === "string" && /^M2_[A-Z0-9_]+$/u.test(error.message)) {
    return error.message;
  }
  return "M2_R1_C1_EXECUTION_STOPPED";
}

function aggregateUsage(calls) {
  return calls.reduce(
    (total, call) => ({
      input_tokens: total.input_tokens + (call.usage?.input_tokens ?? 0),
      cached_tokens: total.cached_tokens + (call.usage?.cached_tokens ?? 0),
      output_tokens: total.output_tokens + (call.usage?.output_tokens ?? 0),
      reasoning_tokens:
        total.reasoning_tokens + (call.usage?.reasoning_tokens ?? 0),
    }),
    { input_tokens: 0, cached_tokens: 0, output_tokens: 0, reasoning_tokens: 0 },
  );
}

async function markerExists(markerPath) {
  try {
    await access(markerPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function assertExecutionPreflight({ contract, initialResults, args, markerPath }) {
  if (args.confirm !== contract.confirmation_phrase) {
    throw new Error("M2_R1_C1_CONFIRMATION_MISMATCH");
  }
  if (!/^[0-9a-f]{40}$/u.test(args.expectedHead ?? "")) {
    throw new Error("M2_R1_C1_EXPECTED_HEAD_INVALID");
  }
  const branch = git(["branch", "--show-current"]).trim();
  const head = git(["rev-parse", "HEAD"]).trim();
  const upstream = git(["rev-parse", "@{u}"]).trim();
  const main = git(["rev-parse", "main"]).trim();
  const originMain = git(["rev-parse", "origin/main"]).trim();
  const status = git([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  const stash = git(["stash", "list"]);
  const gitDirectory = path.resolve(repositoryRoot, git(["rev-parse", "--git-dir"]).trim());
  if (branch !== contract.branch) throw new Error("M2_R1_C1_BRANCH_MISMATCH");
  if (head !== args.expectedHead || upstream !== head) {
    throw new Error("M2_R1_C1_PACKAGE_COMMIT_MISMATCH");
  }
  if (
    main !== contract.main_baseline ||
    originMain !== contract.main_baseline ||
    main !== originMain
  ) {
    throw new Error("M2_R1_C1_MAIN_CHANGED");
  }
  if (status !== "") throw new Error("M2_R1_C1_WORKTREE_NOT_CLEAN");
  if (stash !== "") throw new Error("M2_R1_C1_STASH_NOT_EMPTY");
  if (gitDirectory !== path.join(repositoryRoot, ".git")) {
    throw new Error("M2_R1_C1_GIT_DIRECTORY_UNEXPECTED");
  }
  if (markerPath !== path.join(gitDirectory, path.basename(contract.one_time_marker))) {
    throw new Error("M2_R1_C1_MARKER_PATH_INVALID");
  }
  if (
    initialResults.status !== "not_executed" ||
    initialResults.cases.length !== 0 ||
    initialResults.c2_authorized !== false
  ) {
    throw new Error("M2_R1_C1_RESULT_ALREADY_EXECUTED");
  }
  return { branch, head, upstream, main, originMain };
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const [contract, caseBundle, initialResults, initialCapabilities] =
    await Promise.all([
      json(contractPath),
      json(casesPath),
      json(resultsPath),
      json(capabilitiesPath),
    ]);

  const openAiApiKey = process.env.OPENAI_API_KEY;
  const openAiModel = process.env.OPENAI_MODEL;
  if (!openAiApiKey) throw new Error("M2_R1_C1_OPENAI_API_KEY_MISSING");
  if (openAiModel !== contract.model) {
    throw new Error("M2_R1_C1_MODEL_NOT_AUTHORIZED");
  }

  const markerPath = path.join(
    repositoryRoot,
    ".git",
    path.basename(contract.one_time_marker),
  );
  if (await markerExists(markerPath)) {
    throw new Error("M2_R1_C1_ONE_TIME_MARKER_CONSUMED");
  }
  const preflight = assertExecutionPreflight({
    contract,
    initialResults,
    args,
    markerPath,
  });

  const startedAt = new Date().toISOString();
  const result = {
    ...initialResults,
    status: "running",
    started_at: startedAt,
    completed_at: null,
    package_commit: preflight.head,
    branch: preflight.branch,
    model_requested: openAiModel,
    calls_attempted: 0,
    calls_completed: 0,
    cases: [],
    aggregate_usage: aggregateUsage([]),
    evaluation: {
      evaluator_version: "m2-p4-i3-r1-c1-evaluator-v1",
      verdict: "NOT_COMPLETE",
    },
    c2_eligible_for_review: false,
    c2_authorized: false,
  };

  let markerConsumed = false;
  const beforeFirstProviderCall = async () => {
    await writeFile(
      markerPath,
      `${JSON.stringify(
        {
          schema_version: "m2-p4-i3-r1-c1-consumed-v1",
          task_id: contract.task_id,
          authorization_id: contract.authorization_id,
          package_commit: preflight.head,
          branch: preflight.branch,
          consumed_at: new Date().toISOString(),
          secrets_saved: false,
        },
        null,
        2,
      )}\n`,
      { encoding: "utf8", flag: "wx" },
    );
    markerConsumed = true;
  };
  const onProgress = async (calls) => {
    result.cases = calls;
    result.calls_attempted = calls.length;
    result.calls_completed = calls.filter(
      (call) => call.provider_completed === true,
    ).length;
    result.aggregate_usage = aggregateUsage(calls);
    result.evaluation = evaluateDiagnostic(contract, caseBundle, result);
    result.c2_eligible_for_review = false;
    await writeJson(resultsPath, result);
  };

  try {
    result.cases = await runBoundedPb01ProviderDiagnostic({
      apiKey: openAiApiKey,
      model: openAiModel,
      contract,
      caseBundle,
      beforeFirstProviderCall,
      onProgress,
    });
    result.calls_attempted = result.cases.length;
    result.calls_completed = result.cases.filter(
      (call) => call.provider_completed === true,
    ).length;
    result.aggregate_usage = aggregateUsage(result.cases);
    result.completed_at = new Date().toISOString();
    result.evaluation = evaluateDiagnostic(contract, caseBundle, result);
    result.status =
      result.evaluation.verdict === "PASS" ? "completed_pass" : "completed_fail";
    result.c2_eligible_for_review = result.evaluation.c2_eligible_for_review;
    result.c2_authorized = false;
    await writeJson(resultsPath, result);
    await writeFile(summaryPath, renderDiagnosticSummary(result), "utf8");

    const capabilities = {
      ...initialCapabilities,
      status:
        result.evaluation.verdict === "PASS"
          ? "provider_diagnostic_completed_pending_human_chatgpt_review"
          : "provider_diagnostic_failed_pending_human_chatgpt_review",
      package_commit: result.package_commit,
      actual_provider_calls: result.calls_attempted,
      completed_provider_calls: result.calls_completed,
      provider_diagnostic_verdict: result.evaluation.verdict,
      c2_eligible_for_review: result.evaluation.c2_eligible_for_review,
      c2_authorized: false,
      active_runtime_changed: false,
    };
    await writeJson(capabilitiesPath, capabilities);
    console.log(`M2_P4_I3_R1_C1_PROVIDER_DIAGNOSTIC: ${result.evaluation.verdict}`);
    console.log(`provider_calls: ${result.calls_attempted}/${contract.authorized_calls.total}`);
    console.log(`c2_authorized: ${result.c2_authorized}`);
  } catch (error) {
    const stopCode = safeStopCode(error);
    result.status = markerConsumed ? "stopped_after_consumption" : "stopped_before_call";
    result.safe_stop_code = stopCode;
    result.completed_at = new Date().toISOString();
    result.aggregate_usage = aggregateUsage(result.cases);
    result.evaluation = evaluateDiagnostic(contract, caseBundle, result);
    result.c2_eligible_for_review = false;
    result.c2_authorized = false;
    await writeJson(resultsPath, result);
    await writeFile(summaryPath, renderDiagnosticSummary(result), "utf8");
    await writeJson(capabilitiesPath, {
      ...initialCapabilities,
      status: "provider_diagnostic_failed_pending_human_chatgpt_review",
      package_commit: result.package_commit,
      actual_provider_calls: result.calls_attempted,
      completed_provider_calls: result.calls_completed,
      provider_diagnostic_verdict: "FAIL",
      c2_eligible_for_review: false,
      c2_authorized: false,
      active_runtime_changed: false,
    });
    console.error(`M2_P4_I3_R1_C1_PROVIDER_DIAGNOSTIC_STOPPED: ${stopCode}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`M2_P4_I3_R1_C1_PREFLIGHT_STOPPED: ${safeStopCode(error)}`);
  process.exitCode = 1;
});
