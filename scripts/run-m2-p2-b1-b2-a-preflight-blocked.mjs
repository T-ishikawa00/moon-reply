import { createFixtureGitExecutionGuard } from "./lib/m2-p2-b1-b2-a-execution-guard.mjs";
import { runDormantLiveBinding } from "./lib/m2-p2-b1-b2-a-live-runner.mjs";

const expectedArguments = Object.freeze({
  mode: "dormant-live-preflight",
  case: "WAIT-003",
  model: "gpt-5.6-luna",
  "contract-hash":
    "c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2",
  confirm: "MOON_REPLY_B1_B2_A_NO_LIVE_EXECUTION",
});

function argumentError(message) {
  return Object.assign(new Error(message), {
    stopCode: "CLI_ARGUMENT_REJECTED",
  });
}

export function parseDormantPreflightArguments(argv) {
  if (argv.length !== Object.keys(expectedArguments).length * 2) {
    throw argumentError("The exact five dormant preflight flags are required");
  }
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const rawFlag = argv[index];
    const value = argv[index + 1];
    if (
      typeof rawFlag !== "string" ||
      !rawFlag.startsWith("--") ||
      value === undefined
    ) {
      throw argumentError("Flags require one explicit value");
    }
    const flag = rawFlag.slice(2);
    if (
      !Object.hasOwn(expectedArguments, flag) ||
      Object.hasOwn(parsed, flag)
    ) {
      throw argumentError("Unknown, prohibited, or duplicate flag");
    }
    parsed[flag] = value;
  }
  for (const [flag, expected] of Object.entries(expectedArguments)) {
    if (parsed[flag] !== expected) {
      throw argumentError(`The fixed --${flag} value differs`);
    }
  }
  return parsed;
}

export async function runBlockedDormantPreflight(argv) {
  parseDormantPreflightArguments(argv);
  const gitExecutionGuard = createFixtureGitExecutionGuard({
    branch: "main",
    head: "future-approved-runner-sha",
    origin_main: "future-approved-runner-sha",
    porcelain_status: "",
  });
  return runDormantLiveBinding({
    approvalRecord: null,
    expectedRunnerCommitSha: null,
    gitExecutionGuard,
  });
}

const isCli =
  process.argv[1] &&
  new URL(import.meta.url).pathname
    .replace(/^\/([A-Za-z]:)/u, "$1")
    .replaceAll("/", "\\")
    .toLowerCase() === process.argv[1].toLowerCase();

if (isCli) {
  try {
    const result = await runBlockedDormantPreflight(
      process.argv.slice(2),
    );
    console.log(JSON.stringify(result, null, 2));
    const passed =
      result.status === "stopped" &&
      result.stop_code === "HUMAN_APPROVAL_MISSING" &&
      result.actual_environment_reads === 0 &&
      result.actual_secret_resolutions === 0 &&
      result.actual_https_requests === 0 &&
      result.actual_provider_calls === 0 &&
      result.actual_child_process_calls === 0 &&
      result.api_spend_usd === 0;
    console.log(
      `M2_P2_B1_B2_A_BLOCKED_PREFLIGHT_EXPECTATION: ${
        passed ? "PASS" : "FAIL"
      }`,
    );
    if (!passed) process.exitCode = 1;
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "rejected",
        stop_code: error?.stopCode ?? "CLI_ARGUMENT_REJECTED",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  }
}
