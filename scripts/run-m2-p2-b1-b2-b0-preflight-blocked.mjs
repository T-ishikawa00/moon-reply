import {
  FIXED_PAID_TARGET,
} from "./lib/m2-p2-b1-b2-b0-approval-record.mjs";
import {
  isMainModule,
} from "./lib/m2-p2-b1-b2-b0-local-filesystem.mjs";

const expectedArguments = Object.freeze({
  mode: "paid-preflight-blocked",
  case: FIXED_PAID_TARGET.case_id,
  model: FIXED_PAID_TARGET.model,
  "contract-hash": FIXED_PAID_TARGET.contract_hash,
  confirm: "MOON_REPLY_B1_B2_B0_NO_PAID_EXECUTION",
});

function argumentError(message) {
  return Object.assign(new Error(message), {
    stopCode: "CLI_ARGUMENT_REJECTED",
  });
}

export function blockedPreflightArguments() {
  return Object.entries(expectedArguments).flatMap(([flag, value]) => [
    `--${flag}`,
    value,
  ]);
}

export function parseBlockedPreflightArguments(argv) {
  if (
    !Array.isArray(argv) ||
    argv.length !== Object.keys(expectedArguments).length * 2
  ) {
    throw argumentError(
      "The exact five blocked-preflight flags are required",
    );
  }
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const rawFlag = argv[index];
    const value = argv[index + 1];
    if (
      typeof rawFlag !== "string" ||
      !rawFlag.startsWith("--") ||
      typeof value !== "string"
    ) {
      throw argumentError("Every flag requires one explicit value");
    }
    const flag = rawFlag.slice(2);
    if (
      !Object.hasOwn(expectedArguments, flag) ||
      Object.hasOwn(parsed, flag)
    ) {
      throw argumentError(
        "Unknown, prohibited, or duplicate blocked-preflight flag",
      );
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

export function runBlockedPaidPreflight(argv) {
  parseBlockedPreflightArguments(argv);
  return {
    task_id: "M2-P2-B1-B2-B0",
    mode: "paid-preflight-blocked",
    status: "stopped",
    stop_code: "EXTERNAL_APPROVAL_NOT_PRESENT",
    expected_test_result: "PASS",
    actual_environment_reads: 0,
    actual_secret_resolutions: 0,
    actual_https_requests: 0,
    actual_provider_calls: 0,
    actual_child_process_calls: 0,
    api_spend_usd: 0,
    external_approval_directory_created: false,
    one_time_marker_created: false,
    run_artifact_directory_created: false,
    retry_attempted: false,
    repair_attempted: false,
    fallback_attempted: false,
  };
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    const result = runBlockedPaidPreflight(process.argv.slice(2));
    console.log(JSON.stringify(result, null, 2));
    const passed =
      result.status === "stopped" &&
      result.stop_code === "EXTERNAL_APPROVAL_NOT_PRESENT" &&
      result.actual_environment_reads === 0 &&
      result.actual_secret_resolutions === 0 &&
      result.actual_https_requests === 0 &&
      result.actual_provider_calls === 0 &&
      result.actual_child_process_calls === 0 &&
      result.api_spend_usd === 0 &&
      result.external_approval_directory_created === false &&
      result.one_time_marker_created === false &&
      result.run_artifact_directory_created === false;
    console.log(
      `M2_P2_B1_B2_B0_BLOCKED_PREFLIGHT_EXPECTATION: ${
        passed ? "PASS" : "FAIL"
      }`,
    );
    if (!passed) process.exitCode = 1;
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "rejected",
        stop_code: error?.stopCode ?? "CLI_ARGUMENT_REJECTED",
        message:
          error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  }
}
